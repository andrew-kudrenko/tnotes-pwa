import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import {
  createEmptyTastingSession,
  createNextSteepGroup,
} from "../../domain/session/factory";
import {
  calculateGramsPer100Ml,
  hasOverlappingSteepGroups,
  isTastingSessionEmpty,
} from "../../domain/session/helpers";
import type { TastingSession } from "../../domain/session/types";
import type { TasteScore } from "../../domain/shared/enums";
import { normalizeOptionalString } from "../../domain/shared/sanitize";
import { sessionRepository } from "../../infrastructure/repositories/session.repository";
import { useProfileStore } from "../../stores/profile.store";
import { useTeawaresQuery } from "../queries/use-teawares-query";

function normalizeNullsToUndefined<T>(value: T): T {
  if (value === null) {
    return undefined as T;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeNullsToUndefined) as T;
  }
  if (typeof value === "object" && value !== undefined) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = normalizeNullsToUndefined(v);
    }
    return result as T;
  }
  return value;
}

function extractContentSnapshot(session: TastingSession): string {
  const normalized = normalizeNullsToUndefined(
    JSON.parse(JSON.stringify(session)) as TastingSession,
  );
  normalized.recipe.note = normalizeOptionalString(normalized.recipe.note);
  normalized.dryLeaf.note = normalizeOptionalString(normalized.dryLeaf.note);
  normalized.spentLeaf.note = normalizeOptionalString(
    normalized.spentLeaf.note,
  );
  normalized.effects.note = normalizeOptionalString(normalized.effects.note);
  normalized.summary.note = normalizeOptionalString(normalized.summary.note);
  for (const group of normalized.steepGroups) {
    group.summary.note = normalizeOptionalString(group.summary.note);
    group.sensorics.visual.colorInCIELab = normalizeOptionalString(
      group.sensorics.visual.colorInCIELab,
    );
  }
  return JSON.stringify({
    setup: normalized.setup,
    recipe: normalized.recipe,
    dryLeaf: normalized.dryLeaf,
    steepGroups: normalized.steepGroups,
    spentLeaf: normalized.spentLeaf,
    effects: normalized.effects,
    summary: normalized.summary,
  });
}

function buildSanitizedSession(session: TastingSession): TastingSession {
  const clean = normalizeNullsToUndefined(
    JSON.parse(JSON.stringify(session)) as TastingSession,
  );
  clean.recipe.note = normalizeOptionalString(clean.recipe.note);
  clean.dryLeaf.note = normalizeOptionalString(clean.dryLeaf.note);
  clean.spentLeaf.note = normalizeOptionalString(clean.spentLeaf.note);
  clean.effects.note = normalizeOptionalString(clean.effects.note);
  clean.summary.note = normalizeOptionalString(clean.summary.note);
  for (const group of clean.steepGroups) {
    group.summary.note = normalizeOptionalString(group.summary.note);
    group.sensorics.visual.colorInCIELab = normalizeOptionalString(
      group.sensorics.visual.colorInCIELab,
    );
  }
  return clean;
}

export function useSessionEditor(
  sessionIdParam: MaybeRefOrGetter<string>,
  presetTeaIdParam?: MaybeRefOrGetter<string | undefined>,
) {
  const profileStore = useProfileStore();
  const { data: teawares } = useTeawaresQuery();

  const isPersisted = ref(false);
  const isLoading = ref(true);
  const isNotFound = ref(false);
  const saveStatus = ref<"idle" | "dirty" | "saving" | "saved">("idle");
  const activeSteepGroupIndex = ref(0);

  const draft = ref<TastingSession>(
    createEmptyTastingSession(profileStore.activeProfileId),
  );

  let saveTimeout: ReturnType<typeof setTimeout> | undefined;
  let isHydrating = true;
  let isSaving = false;
  let lastSavedContentJson = "";

  const ratioPer100Ml = computed(() =>
    calculateGramsPer100Ml(
      draft.value.recipe.leafWeightInGrams,
      draft.value.recipe.waterVolumeInMilliliters,
    ),
  );

  const hasGroupOverlap = computed(() =>
    hasOverlappingSteepGroups(draft.value.steepGroups),
  );

  let savedResetTimeout: ReturnType<typeof setTimeout> | undefined;

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function persistNow(): Promise<void> {
    if (isSaving || isHydrating) {
      return;
    }

    const cleanSession = buildSanitizedSession(draft.value);

    if (isTastingSessionEmpty(cleanSession)) {
      if (isPersisted.value) {
        await sessionRepository.softDelete(cleanSession.meta.id);
        draft.value.meta.removedAt = undefined;
        isPersisted.value = false;
        lastSavedContentJson = "";
        saveStatus.value = "idle";
      }
      return;
    }

    const currentContentJson = extractContentSnapshot(cleanSession);
    if (currentContentJson === lastSavedContentJson) {
      saveStatus.value = "idle";
      return;
    }

    isSaving = true;
    saveStatus.value = "saving";

    try {
      const [saved] = await Promise.all([
        sessionRepository.upsert(cleanSession),
        delay(400),
      ]);
      lastSavedContentJson = currentContentJson;
      draft.value.meta = saved.meta;
      saveStatus.value = "saved";

      if (savedResetTimeout !== undefined) {
        clearTimeout(savedResetTimeout);
      }
      savedResetTimeout = setTimeout(() => {
        if (saveStatus.value === "saved") {
          saveStatus.value = "idle";
        }
      }, 2500);

      if (!isPersisted.value) {
        isPersisted.value = true;
        if (toValue(sessionIdParam) === "new") {
          await navigateTo(`/sessions/${saved.meta.id}`, { replace: true });
        }
      }
    } finally {
      isSaving = false;
    }
  }

  function scheduleSave(): void {
    if (isHydrating) {
      return;
    }
    if (saveStatus.value !== "saving") {
      saveStatus.value = "dirty";
    }
    if (saveTimeout !== undefined) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveTimeout = undefined;
      void persistNow();
    }, 600);
  }

  function flushSave(): void {
    if (saveTimeout !== undefined) {
      clearTimeout(saveTimeout);
      saveTimeout = undefined;
    }
    void persistNow();
  }

  watch(
    () => [
      draft.value.setup,
      draft.value.recipe,
      draft.value.dryLeaf,
      draft.value.steepGroups,
      draft.value.spentLeaf,
      draft.value.effects,
      draft.value.summary,
    ],
    scheduleSave,
    { deep: true },
  );

  watch(
    () => draft.value.setup.teawareId,
    (teawareId) => {
      if (isHydrating || !teawareId) {
        return;
      }
      if (
        draft.value.recipe.waterVolumeInMilliliters === undefined ||
        draft.value.recipe.waterVolumeInMilliliters === null
      ) {
        const found = teawares.value.find((tw) => tw.meta.id === teawareId);
        if (found?.specs.volumeInMilliliters) {
          draft.value.recipe.waterVolumeInMilliliters =
            found.specs.volumeInMilliliters;
        }
      }
    },
  );

  function addRinseDuration(seconds: number | undefined): void {
    if (seconds === undefined || seconds === null || seconds <= 0) {
      return;
    }
    draft.value.recipe.rinseDurationsInSeconds.push(Math.round(seconds));
  }

  function removeRinseDuration(index: number): void {
    draft.value.recipe.rinseDurationsInSeconds.splice(index, 1);
  }

  function setSteepDuration(
    groupIndex: number,
    seconds: number | undefined,
  ): void {
    const group = draft.value.steepGroups[groupIndex];
    if (!group || seconds === undefined || seconds <= 0) {
      return;
    }
    group.setup.durationInSeconds = Math.round(seconds);
  }

  function setTasteScore(
    groupIndex: number,
    key: "sweetness" | "acidity" | "bitterness" | "umami" | "salty",
    raw: number | undefined,
  ): void {
    const group = draft.value.steepGroups[groupIndex];
    if (!group) {
      return;
    }
    if (raw === undefined || raw === null || Number.isNaN(raw)) {
      group.sensorics.tastes[key] = undefined;
      return;
    }
    group.sensorics.tastes[key] = Math.max(
      0,
      Math.min(10, Math.round(raw)),
    ) as TasteScore;
  }

  function addSteepGroup(): void {
    const next = createNextSteepGroup(draft.value.steepGroups);
    draft.value.steepGroups.push(next);
    activeSteepGroupIndex.value = draft.value.steepGroups.length - 1;
  }

  function removeSteepGroup(index: number): void {
    if (draft.value.steepGroups.length <= 1) {
      return;
    }
    draft.value.steepGroups.splice(index, 1);
    if (activeSteepGroupIndex.value >= draft.value.steepGroups.length) {
      activeSteepGroupIndex.value = draft.value.steepGroups.length - 1;
    }
  }

  async function deleteSession(): Promise<void> {
    if (saveTimeout !== undefined) {
      clearTimeout(saveTimeout);
      saveTimeout = undefined;
    }
    if (isPersisted.value) {
      await sessionRepository.softDelete(draft.value.meta.id);
      isPersisted.value = false;
    }
    await navigateTo("/");
  }

  onMounted(async () => {
    const paramId = toValue(sessionIdParam);

    if (paramId === "new") {
      const presetTeaId = presetTeaIdParam
        ? toValue(presetTeaIdParam)
        : undefined;
      draft.value = createEmptyTastingSession(profileStore.activeProfileId, {
        teaId: presetTeaId,
      });
      isPersisted.value = false;
      isLoading.value = false;
      isHydrating = false;
      if (presetTeaId) {
        void persistNow();
      }
      return;
    }

    const existing = await sessionRepository.getById(paramId);
    if (!existing || existing.meta.removedAt !== undefined) {
      isNotFound.value = true;
      isLoading.value = false;
      return;
    }

    draft.value = existing;
    lastSavedContentJson = extractContentSnapshot(existing);
    isPersisted.value = true;
    isLoading.value = false;
    isHydrating = false;

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", flushSave);
    }
  });

  onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", flushSave);
    }
    flushSave();
  });

  return {
    draft,
    isLoading,
    isNotFound,
    saveStatus,
    activeSteepGroupIndex,
    ratioPer100Ml,
    hasGroupOverlap,
    addRinseDuration,
    removeRinseDuration,
    setSteepDuration,
    setTasteScore,
    addSteepGroup,
    removeSteepGroup,
    deleteSession,
  };
}
