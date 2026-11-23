import { useProfileStore } from "../stores/profile.store";
import { useSyncStore } from "../stores/sync.store";

export default defineNuxtPlugin(() => {
  const profileStore = useProfileStore();
  const syncStore = useSyncStore();

  profileStore.initialize();
  syncStore.initialize();
});
