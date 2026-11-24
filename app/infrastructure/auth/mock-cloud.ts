import type { EntityMeta, HasMeta } from "../../domain/shared/meta";
import type {
  PullChangeItem,
  PullResponse,
  PushItemResult,
  SyncTransport,
} from "../sync/transport";
import type { OutboxRecord, SyncEntityType } from "../sync/types";
import type {
  AuthService,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "./types";

interface MockCloudUserRecord extends AuthUser {
  passwordHash: string;
}

interface MockCloudEntityRecord {
  userId: string;
  entityType: SyncEntityType;
  entityId: string;
  revision: number;
  serverSeq: number;
  payload: HasMeta<EntityMeta>;
}

interface MockCloudStorage {
  users: MockCloudUserRecord[];
  entities: MockCloudEntityRecord[];
  lastSeq: number;
}

const CLOUD_STORAGE_KEY = "tea_tasting_mock_cloud_v1";
const CURRENT_CLOUD_USER_KEY = "tea_tasting_mock_cloud_session_v1";

function readCloudStorage(): MockCloudStorage {
  if (typeof localStorage === "undefined") {
    return { users: [], entities: [], lastSeq: 0 };
  }
  try {
    const raw = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (!raw) {
      return { users: [], entities: [], lastSeq: 0 };
    }
    return JSON.parse(raw) as MockCloudStorage;
  } catch {
    return { users: [], entities: [], lastSeq: 0 };
  }
}

function writeCloudStorage(data: MockCloudStorage): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(data));
}

function simulateNetworkLatency(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSessionForUser(user: AuthUser): AuthSession {
  const session: AuthSession = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken: `mock_token_${user.id}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CURRENT_CLOUD_USER_KEY, JSON.stringify(session));
  }
  return session;
}

export function getActiveMockCloudUser(): AuthUser | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(CURRENT_CLOUD_USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed.user;
  } catch {
    return null;
  }
}

export const mockAuthService: AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    await simulateNetworkLatency();
    const db = readCloudStorage();
    const emailNormalized = credentials.email.trim().toLowerCase();
    const found = db.users.find(
      (u) => u.email.toLowerCase() === emailNormalized,
    );

    if (!found || found.passwordHash !== credentials.password) {
      throw new Error("Неверный email или пароль");
    }

    return createSessionForUser(found);
  },

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    await simulateNetworkLatency();
    const db = readCloudStorage();
    const emailNormalized = credentials.email.trim().toLowerCase();

    if (!emailNormalized || !credentials.password || !credentials.name.trim()) {
      throw new Error("Заполните все обязательные поля");
    }

    if (db.users.some((u) => u.email.toLowerCase() === emailNormalized)) {
      throw new Error("Пользователь с таким email уже зарегистрирован");
    }

    const newUser: MockCloudUserRecord = {
      id: crypto.randomUUID(),
      email: emailNormalized,
      name: credentials.name.trim(),
      passwordHash: credentials.password,
    };

    db.users.push(newUser);
    writeCloudStorage(db);

    return createSessionForUser(newUser);
  },

  async logout(): Promise<void> {
    await simulateNetworkLatency(150);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(CURRENT_CLOUD_USER_KEY);
    }
  },

  async refresh(): Promise<AuthSession | null> {
    const user = getActiveMockCloudUser();
    if (!user) {
      return null;
    }
    return createSessionForUser(user);
  },
};

export const mockCloudSyncTransport: SyncTransport = {
  get isRemoteEnabled(): boolean {
    return getActiveMockCloudUser() !== null;
  },

  async push(records: OutboxRecord[]): Promise<PushItemResult[]> {
    await simulateNetworkLatency(400);
    const user = getActiveMockCloudUser();
    if (!user) {
      throw new Error("Требуется авторизация для синхронизации");
    }

    const db = readCloudStorage();
    const results: PushItemResult[] = [];

    for (const record of records) {
      const incomingEntity = record.payload as HasMeta<EntityMeta>;
      const existingIndex = db.entities.findIndex(
        (e) =>
          e.userId === user.id &&
          e.entityType === record.entityType &&
          e.entityId === record.entityId,
      );

      const existing =
        existingIndex >= 0 ? db.entities[existingIndex] : undefined;

      if (existing && existing.revision !== record.baseRevision) {
        results.push({
          outboxId: record.id,
          status: "conflict",
          serverRevision: existing.revision,
          serverEntity: existing.payload,
          errorMessage: "Конфликт версий на сервере",
        });
        continue;
      }

      db.lastSeq += 1;
      const nextRevision = (existing?.revision ?? 0) + 1;
      const storedEntity: HasMeta<EntityMeta> = {
        ...incomingEntity,
        meta: {
          ...incomingEntity.meta,
          authorId: user.id,
          revision: nextRevision,
          syncStatus: "synced",
        },
      };

      const cloudRecord: MockCloudEntityRecord = {
        userId: user.id,
        entityType: record.entityType,
        entityId: record.entityId,
        revision: nextRevision,
        serverSeq: db.lastSeq,
        payload: storedEntity,
      };

      if (existingIndex >= 0) {
        db.entities[existingIndex] = cloudRecord;
      } else {
        db.entities.push(cloudRecord);
      }

      results.push({
        outboxId: record.id,
        status: "applied",
        serverRevision: nextRevision,
      });
    }

    writeCloudStorage(db);
    return results;
  },

  async pull(cursor: string | undefined): Promise<PullResponse> {
    await simulateNetworkLatency(300);
    const user = getActiveMockCloudUser();
    if (!user) {
      throw new Error("Требуется авторизация для синхронизации");
    }

    const db = readCloudStorage();
    const sinceSeq = cursor ? Number.parseInt(cursor, 10) || 0 : 0;

    const changes: PullChangeItem[] = db.entities
      .filter((e) => e.userId === user.id && e.serverSeq > sinceSeq)
      .sort((a, b) => a.serverSeq - b.serverSeq)
      .map((e) => ({
        entityType: e.entityType,
        entity: e.payload,
      }));

    return {
      changes,
      nextCursor: String(db.lastSeq),
    };
  },
};
