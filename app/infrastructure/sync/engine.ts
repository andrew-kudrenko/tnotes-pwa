import type { Table } from "dexie";
import type { EntityMeta, HasMeta } from "../../domain/shared/meta";
import { getActiveDatabase } from "../db/connection";
import type { TeaTastingDatabase } from "../db/schema";
import { localOnlySyncTransport, type SyncTransport } from "./transport";
import type { SyncEntityType } from "./types";

const CURSOR_STATE_KEY = "last_pull_cursor";
const PUSH_BATCH_SIZE = 50;

export interface SyncEngineState {
  isSyncing: boolean;
  lastSyncedAt: string | undefined;
  lastError: string | undefined;
}

export type SyncStateListener = (state: SyncEngineState) => void;

function resolveEntityTable(
  db: TeaTastingDatabase,
  entityType: SyncEntityType,
): Table<HasMeta<EntityMeta>, string> {
  switch (entityType) {
    case "session":
      return db.sessions as unknown as Table<HasMeta<EntityMeta>, string>;
    case "tea":
      return db.teas as unknown as Table<HasMeta<EntityMeta>, string>;
    case "water":
      return db.waters as unknown as Table<HasMeta<EntityMeta>, string>;
    case "teaware":
      return db.teawares as unknown as Table<HasMeta<EntityMeta>, string>;
    case "customDescriptor":
      return db.customDescriptors as unknown as Table<
        HasMeta<EntityMeta>,
        string
      >;
  }
}

export function createSyncEngine(
  initialTransport: SyncTransport = localOnlySyncTransport,
) {
  let transport: SyncTransport = initialTransport;
  let state: SyncEngineState = {
    isSyncing: false,
    lastSyncedAt: undefined,
    lastError: undefined,
  };
  const listeners = new Set<SyncStateListener>();

  function emit(): void {
    for (const listener of listeners) {
      listener({ ...state });
    }
  }

  function subscribe(listener: SyncStateListener): () => void {
    listeners.add(listener);
    listener({ ...state });
    return () => {
      listeners.delete(listener);
    };
  }

  function setTransport(nextTransport: SyncTransport): void {
    transport = nextTransport;
  }

  async function pushPending(): Promise<void> {
    const db = getActiveDatabase();
    const batch = await db.outbox
      .orderBy("createdAt")
      .limit(PUSH_BATCH_SIZE)
      .toArray();

    if (batch.length === 0) {
      return;
    }

    const results = await transport.push(batch);
    const resultMap = new Map(results.map((r) => [r.outboxId, r]));

    for (const record of batch) {
      const outcome = resultMap.get(record.id);
      if (!outcome) {
        continue;
      }

      const table = resolveEntityTable(db, record.entityType);

      if (outcome.status === "applied") {
        await db.transaction("rw", [table, db.outbox], async () => {
          const current = await table.get(record.entityId);
          if (current) {
            await table.put({
              ...current,
              meta: {
                ...current.meta,
                revision: outcome.serverRevision ?? current.meta.revision,
                syncStatus: "synced",
              },
            });
          }
          await db.outbox.delete(record.id);
        });
      } else if (outcome.status === "conflict") {
        await db.transaction(
          "rw",
          [table, db.outbox, db.syncState],
          async () => {
            const current = await table.get(record.entityId);
            if (current) {
              await table.put({
                ...current,
                meta: {
                  ...current.meta,
                  syncStatus: "conflict",
                },
              });
            }
            if (outcome.serverEntity !== undefined) {
              await db.syncState.put({
                key: `conflict:${record.entityType}:${record.entityId}`,
                value: JSON.stringify(outcome.serverEntity),
              });
            }
            await db.outbox.delete(record.id);
          },
        );
      } else {
        await db.outbox.update(record.id, {
          retryCount: record.retryCount + 1,
          lastError: outcome.errorMessage ?? "Sync push failed",
        });
      }
    }
  }

  async function pullRemote(): Promise<void> {
    const db = getActiveDatabase();
    const cursorRecord = await db.syncState.get(CURSOR_STATE_KEY);
    const response = await transport.pull(cursorRecord?.value);

    if (
      response.changes.length === 0 &&
      response.nextCursor === cursorRecord?.value
    ) {
      return;
    }

    await db.transaction(
      "rw",
      [
        db.sessions,
        db.teas,
        db.waters,
        db.teawares,
        db.customDescriptors,
        db.outbox,
        db.syncState,
      ],
      async () => {
        for (const change of response.changes) {
          const entity = change.entity as HasMeta<EntityMeta>;
          const pendingLocal = await db.outbox
            .where("[entityType+entityId]")
            .equals([change.entityType, entity.meta.id])
            .first();

          if (pendingLocal) {
            continue;
          }

          const table = resolveEntityTable(db, change.entityType);
          await table.put({
            ...entity,
            meta: {
              ...entity.meta,
              syncStatus: "synced",
            },
          });
        }

        await db.syncState.put({
          key: CURSOR_STATE_KEY,
          value: response.nextCursor,
        });
      },
    );
  }

  async function syncNow(): Promise<void> {
    if (!transport.isRemoteEnabled || state.isSyncing) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    state = {
      ...state,
      isSyncing: true,
      lastError: undefined,
    };
    emit();

    try {
      await pushPending();
      await pullRemote();
      state = {
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        lastError: undefined,
      };
    } catch (error: unknown) {
      state = {
        ...state,
        isSyncing: false,
        lastError:
          error instanceof Error ? error.message : "Unknown sync error",
      };
    } finally {
      emit();
    }
  }

  return {
    subscribe,
    setTransport,
    syncNow,
  };
}

export const syncEngine = createSyncEngine();
