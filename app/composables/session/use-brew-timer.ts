import { onScopeDispose, ref } from "vue";

export function useBrewTimer() {
  const elapsedSeconds = ref(0);
  const isRunning = ref(false);

  let startedAtMs: number | undefined;
  let accumulatedMs = 0;
  let intervalId: ReturnType<typeof setInterval> | undefined;

  function syncElapsed(): void {
    const runningMs = startedAtMs !== undefined ? Date.now() - startedAtMs : 0;
    elapsedSeconds.value = Math.floor((accumulatedMs + runningMs) / 1000);
  }

  function clearTimerInterval(): void {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  }

  function start(): void {
    if (isRunning.value) {
      return;
    }
    isRunning.value = true;
    startedAtMs = Date.now();
    intervalId = setInterval(syncElapsed, 250);
  }

  function pause(): void {
    if (!isRunning.value) {
      return;
    }
    syncElapsed();
    if (startedAtMs !== undefined) {
      accumulatedMs += Date.now() - startedAtMs;
      startedAtMs = undefined;
    }
    isRunning.value = false;
    clearTimerInterval();
  }

  function toggle(): void {
    if (isRunning.value) {
      pause();
    } else {
      start();
    }
  }

  function reset(): void {
    isRunning.value = false;
    startedAtMs = undefined;
    accumulatedMs = 0;
    elapsedSeconds.value = 0;
    clearTimerInterval();
  }

  onScopeDispose(clearTimerInterval);

  return {
    elapsedSeconds,
    isRunning,
    start,
    pause,
    toggle,
    reset,
  };
}
