import { defineStore } from "pinia";
import { ref } from "vue";
import { useLiveQuery } from "../composables/use-live-query";
import {
  syncEngine,
  type SyncEngineState,
} from "../infrastructure/sync/engine";

export const useSyncStore = defineStore("sync", () => {
  const isOnline = ref<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const engineState = ref<SyncEngineState>({
    isSyncing: false,
    lastSyncedAt: undefined,
    lastError: undefined,
  });

  const { data: pendingCount } = useLiveQuery<number>(
    async (db) => await db.outbox.count(),
    0,
  );

  let isBound = false;

  function initialize(): void {
    if (isBound) {
      return;
    }
    isBound = true;

    syncEngine.subscribe((next) => {
      engineState.value = next;
    });

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        isOnline.value = true;
        void syncEngine.syncNow();
      });
      window.addEventListener("offline", () => {
        isOnline.value = false;
      });
    }
  }

  async function triggerSync(): Promise<void> {
    await syncEngine.syncNow();
  }

  return {
    isOnline,
    engineState,
    pendingCount,
    initialize,
    triggerSync,
  };
});
