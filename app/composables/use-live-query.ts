import { liveQuery } from "dexie";
import { onScopeDispose, shallowRef, watch, type ShallowRef } from "vue";
import { useActiveDatabase } from "../infrastructure/db/connection";
import type { TeaTastingDatabase } from "../infrastructure/db/schema";

export function useLiveQuery<T>(
  querier: (db: TeaTastingDatabase) => Promise<T> | T,
  initialValue: T,
): {
  data: ShallowRef<T>;
  isLoading: ShallowRef<boolean>;
  error: ShallowRef<unknown>;
} {
  const data = shallowRef<T>(initialValue);
  const isLoading = shallowRef<boolean>(true);
  const error = shallowRef<unknown>(undefined);
  const activeDb = useActiveDatabase();

  let unsubscribe: (() => void) | undefined;

  function cleanup(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  }

  watch(
    activeDb,
    (db) => {
      cleanup();
      if (!db) {
        data.value = initialValue;
        isLoading.value = false;
        return;
      }

      isLoading.value = true;
      error.value = undefined;

      const observable = liveQuery(() => querier(db));
      const subscription = observable.subscribe({
        next(result) {
          data.value = result;
          isLoading.value = false;
        },
        error(err) {
          error.value = err;
          isLoading.value = false;
        },
      });

      unsubscribe = () => subscription.unsubscribe();
    },
    { immediate: true },
  );

  onScopeDispose(cleanup);

  return {
    data,
    isLoading,
    error,
  };
}
