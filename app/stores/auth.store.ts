import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  getActiveMockCloudUser,
  mockAuthService,
  mockCloudSyncTransport,
} from "../infrastructure/auth/mock-cloud";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "../infrastructure/auth/types";
import {
  exportDatabaseToEnvelope,
  importPayloadToDatabase,
} from "../infrastructure/backup/service";
import { getActiveDatabase } from "../infrastructure/db/connection";
import { syncEngine } from "../infrastructure/sync/engine";
import { localOnlySyncTransport } from "../infrastructure/sync/transport";
import { useProfileStore } from "./profile.store";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | undefined>(undefined);

  const isAuthenticated = computed(() => user.value !== null);

  function bindAuthenticatedUser(authUser: AuthUser): void {
    const profileStore = useProfileStore();
    user.value = authUser;

    const existingProfile = profileStore.profiles.find(
      (p) => p.id === authUser.id,
    );
    if (existingProfile) {
      profileStore.switchProfile(authUser.id);
    } else {
      profileStore.createProfile(authUser.name, authUser.id);
    }

    syncEngine.setTransport(mockCloudSyncTransport);
    void syncEngine.syncNow();
  }

  function initialize(): void {
    const savedUser = getActiveMockCloudUser();
    if (savedUser) {
      bindAuthenticatedUser(savedUser);
    } else {
      syncEngine.setTransport(localOnlySyncTransport);
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true;
    error.value = undefined;
    try {
      const session = await mockAuthService.login(credentials);
      bindAuthenticatedUser(session.user);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Ошибка входа";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(credentials: RegisterCredentials): Promise<void> {
    isLoading.value = true;
    error.value = undefined;
    try {
      const session = await mockAuthService.register(credentials);
      bindAuthenticatedUser(session.user);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Ошибка регистрации";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function migrateLocalGuestDataToAccount(): Promise<{
    inserted: number;
    updated: number;
  }> {
    if (!user.value) {
      return { inserted: 0, updated: 0 };
    }
    const profileStore = useProfileStore();
    const targetUserId = user.value.id;

    profileStore.switchProfile(undefined);
    const guestEnvelope = await exportDatabaseToEnvelope(false);

    profileStore.switchProfile(targetUserId);
    const userDb = getActiveDatabase();
    const stats = await importPayloadToDatabase(
      userDb,
      guestEnvelope.payload,
      "merge",
    );

    await syncEngine.syncNow();
    return { inserted: stats.inserted, updated: stats.updated };
  }

  async function logout(): Promise<void> {
    isLoading.value = true;
    try {
      await mockAuthService.logout();
      user.value = null;
      syncEngine.setTransport(localOnlySyncTransport);
      const profileStore = useProfileStore();
      profileStore.switchProfile(undefined);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    initialize,
    login,
    register,
    migrateLocalGuestDataToAccount,
    logout,
  };
});
