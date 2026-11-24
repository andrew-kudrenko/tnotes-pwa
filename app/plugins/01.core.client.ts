import { useAuthStore } from "../stores/auth.store";
import { useProfileStore } from "../stores/profile.store";
import { useSyncStore } from "../stores/sync.store";

export default defineNuxtPlugin(() => {
  const profileStore = useProfileStore();
  const authStore = useAuthStore();
  const syncStore = useSyncStore();

  profileStore.initialize();
  authStore.initialize();
  syncStore.initialize();
});
