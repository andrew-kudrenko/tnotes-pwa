import {
  connectDatabase,
  dropProfileDatabase,
} from "../infrastructure/db/connection";

export interface LocalProfile {
  id: string;
  name: string;
  createdAt: string;
}

const PROFILES_STORAGE_KEY = "tea_tasting_profiles_v1";
const ACTIVE_PROFILE_STORAGE_KEY = "tea_tasting_active_profile_v1";

export const useProfileStore = defineStore("profile", () => {
  const profiles = ref<LocalProfile[]>([]);
  const activeProfileId = ref<string | undefined>(undefined);
  const isInitialized = ref(false);

  const activeProfile = computed<LocalProfile | undefined>(() =>
    profiles.value.find((p) => p.id === activeProfileId.value),
  );

  function persistState(): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles.value));
    if (activeProfileId.value) {
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfileId.value);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    }
  }

  function initialize(): void {
    if (isInitialized.value) {
      return;
    }
    if (typeof localStorage !== "undefined") {
      try {
        const rawProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
        if (rawProfiles) {
          profiles.value = JSON.parse(rawProfiles) as LocalProfile[];
        }
        const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
        if (
          savedActiveId &&
          profiles.value.some((p) => p.id === savedActiveId)
        ) {
          activeProfileId.value = savedActiveId;
        }
      } catch {
        profiles.value = [];
        activeProfileId.value = undefined;
      }
    }
    connectDatabase(activeProfileId.value);
    isInitialized.value = true;
  }

  function createProfile(name: string, customId?: string): LocalProfile {
    const profile: LocalProfile = {
      id: customId ?? crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    profiles.value = [...profiles.value, profile];
    switchProfile(profile.id);
    return profile;
  }

  function switchProfile(profileId: string | undefined): void {
    activeProfileId.value = profileId;
    connectDatabase(profileId);
    persistState();
  }

  async function removeProfile(profileId: string): Promise<void> {
    profiles.value = profiles.value.filter((p) => p.id !== profileId);
    if (activeProfileId.value === profileId) {
      activeProfileId.value = undefined;
      connectDatabase(undefined);
    }
    persistState();
    await dropProfileDatabase(profileId);
  }

  return {
    profiles,
    activeProfileId,
    activeProfile,
    isInitialized,
    initialize,
    createProfile,
    switchProfile,
    removeProfile,
  };
});
