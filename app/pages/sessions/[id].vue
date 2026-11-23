<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import { useTeasQuery } from "../../composables/queries/use-teas-query";
import { useTeawaresQuery } from "../../composables/queries/use-teawares-query";
import { useWatersQuery } from "../../composables/queries/use-waters-query";
import {
  createEmptyTastingSession,
  createNextSteepGroup,
} from "../../domain/session/factory";
import {
  calculateGramsPer100Ml,
  hasOverlappingSteepGroups,
  isTastingSessionEmpty,
} from "../../domain/session/helpers";
import type { TasteScore } from "../../domain/shared/enums";
import type { TastingSession } from "../../domain/session/types";
import {
  ASTRINGENCY_LABELS,
  BREWING_METHOD_LABELS,
  BRIGHTNESS_LABELS,
  CLARITY_LABELS,
  DENSITY_LABELS,
  enumToOptions,
  HUI_GAN_LABELS,
  LEAF_ELASTICITY_LABELS,
  LEAF_INTEGRITY_LABELS,
  LEAF_UNIFORMITY_LABELS,
  MENTAL_EFFECT_LABELS,
  SHENG_JIN_ZONE_LABELS,
  SOMATIC_EFFECT_LABELS,
  TEXTURE_LABELS,
} from "../../domain/shared/labels";
import { normalizeOptionalString } from "../../domain/shared/sanitize";
import { sessionRepository } from "../../infrastructure/repositories/session.repository";
import { useProfileStore } from "../../stores/profile.store";
import DescriptorPicker from "~/components/lexicon/DescriptorPicker.vue";

useHead({ title: "Журнал дегустаций" });

const route = useRoute();
const toast = useToast();
const profileStore = useProfileStore();

const { data: teas } = useTeasQuery();
const { data: waters } = useWatersQuery();
const { data: teawares } = useTeawaresQuery();

const isNewMode = computed(() => (route.params as any).id === "new");
const isPersisted = ref(false);
const isLoading = ref(true);
const saveStatus = ref<"idle" | "saving" | "saved">("idle");

const draft = ref<TastingSession>(
  createEmptyTastingSession(profileStore.activeProfileId),
);

const newRinseSeconds = ref<number | undefined>(5);
const activeSteepGroupIndex = ref(0);

const timerSeconds = ref(0);
const isTimerRunning = ref(false);
let timerInterval: ReturnType<typeof setInterval> | undefined;
let saveTimeout: ReturnType<typeof setTimeout> | undefined;
let isHydrating = true;

const brewingMethodOptions = enumToOptions(BREWING_METHOD_LABELS);
const clarityOptions = enumToOptions(CLARITY_LABELS);
const brightnessOptions = enumToOptions(BRIGHTNESS_LABELS);
const densityOptions = enumToOptions(DENSITY_LABELS);
const textureOptions = enumToOptions(TEXTURE_LABELS);
const astringencyOptions = enumToOptions(ASTRINGENCY_LABELS);
const shengJinOptions = enumToOptions(SHENG_JIN_ZONE_LABELS);
const huiGanOptions = enumToOptions(HUI_GAN_LABELS);
const leafIntegrityOptions = enumToOptions(LEAF_INTEGRITY_LABELS);
const leafElasticityOptions = enumToOptions(LEAF_ELASTICITY_LABELS);
const leafUniformityOptions = enumToOptions(LEAF_UNIFORMITY_LABELS);
const somaticEffectOptions = enumToOptions(SOMATIC_EFFECT_LABELS);
const mentalEffectOptions = enumToOptions(MENTAL_EFFECT_LABELS);

const tasteFields: Array<{
  key: "sweetness" | "acidity" | "bitterness" | "umami" | "salty";
  label: string;
}> = [
  { key: "sweetness", label: "Сладость" },
  { key: "acidity", label: "Кислотность" },
  { key: "bitterness", label: "Горечь" },
  { key: "umami", label: "Умами" },
  { key: "salty", label: "Соленость" },
];

const teaSelectItems = computed(() =>
  teas.value.map((t) => ({
    label: t.identity.name,
    value: t.meta.id,
  })),
);

const waterSelectItems = computed(() =>
  waters.value.map((w) => ({
    label: w.metrics.tdsInPpm
      ? `${w.identity.name} (${w.metrics.tdsInPpm} ppm)`
      : w.identity.name,
    value: w.meta.id,
  })),
);

const teawareSelectItems = computed(() =>
  teawares.value.map((tw) => ({
    label: tw.specs.volumeInMilliliters
      ? `${tw.identity.name} (${tw.specs.volumeInMilliliters} мл)`
      : tw.identity.name,
    value: tw.meta.id,
  })),
);

const ratioPer100Ml = computed(() =>
  calculateGramsPer100Ml(
    draft.value.recipe.leafWeightInGrams,
    draft.value.recipe.waterVolumeInMilliliters,
  ),
);

const hasGroupOverlap = computed(() =>
  hasOverlappingSteepGroups(draft.value.steepGroups),
);

function toggleTimer(): void {
  if (isTimerRunning.value) {
    isTimerRunning.value = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
  } else {
    isTimerRunning.value = true;
    timerInterval = setInterval(() => {
      timerSeconds.value += 1;
    }, 1000);
  }
}

function resetTimer(): void {
  isTimerRunning.value = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = undefined;
  }
  timerSeconds.value = 0;
}

function addRinseDuration(seconds: number | undefined): void {
  if (seconds === undefined || seconds <= 0) {
    return;
  }
  draft.value.recipe.rinseDurationsInSeconds.push(Math.round(seconds));
}

function removeRinseDuration(index: number): void {
  draft.value.recipe.rinseDurationsInSeconds.splice(index, 1);
}

function applyTimerToSteepGroup(groupIndex: number): void {
  const group = draft.value.steepGroups[groupIndex];
  if (!group || timerSeconds.value <= 0) {
    return;
  }
  group.setup.durationInSeconds = timerSeconds.value;
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
  if (raw === undefined || Number.isNaN(raw)) {
    group.sensorics.tastes[key] = undefined;
    return;
  }
  const clamped = Math.max(0, Math.min(10, Math.round(raw))) as TasteScore;
  group.sensorics.tastes[key] = clamped;
}

function handleAddSteepGroup(): void {
  const next = createNextSteepGroup(draft.value.steepGroups);
  draft.value.steepGroups.push(next);
  activeSteepGroupIndex.value = draft.value.steepGroups.length - 1;
}

function handleRemoveSteepGroup(index: number): void {
  if (draft.value.steepGroups.length <= 1) {
    return;
  }
  draft.value.steepGroups.splice(index, 1);
  if (activeSteepGroupIndex.value >= draft.value.steepGroups.length) {
    activeSteepGroupIndex.value = draft.value.steepGroups.length - 1;
  }
}

function sanitizeDraft(session: TastingSession): TastingSession {
  const cloned = structuredClone(toRaw(session));
  cloned.recipe.note = normalizeOptionalString(cloned.recipe.note);
  cloned.dryLeaf.note = normalizeOptionalString(cloned.dryLeaf.note);
  cloned.spentLeaf.note = normalizeOptionalString(cloned.spentLeaf.note);
  cloned.effects.note = normalizeOptionalString(cloned.effects.note);
  cloned.summary.note = normalizeOptionalString(cloned.summary.note);
  for (const group of cloned.steepGroups) {
    group.summary.note = normalizeOptionalString(group.summary.note);
    group.sensorics.visual.colorInCIELab = normalizeOptionalString(
      group.sensorics.visual.colorInCIELab,
    );
  }
  return cloned;
}

async function persistDraft(): Promise<void> {
  if (isTastingSessionEmpty(draft.value)) {
    return;
  }

  saveStatus.value = "saving";
  const cleanSession = sanitizeDraft(draft.value);
  const saved = await sessionRepository.upsert(cleanSession);
  draft.value.meta = saved.meta;
  saveStatus.value = "saved";

  if (!isPersisted.value) {
    isPersisted.value = true;
    if (isNewMode.value) {
      await navigateTo(`/sessions/${saved.meta.id}`, { replace: true });
    }
  }
}

watch(
  draft,
  () => {
    if (isHydrating) {
      return;
    }
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      void persistDraft();
    }, 500);
  },
  { deep: true },
);

watch(
  () => draft.value.setup.teawareId,
  (teawareId) => {
    if (isHydrating || !teawareId) {
      return;
    }
    if (draft.value.recipe.waterVolumeInMilliliters === undefined) {
      const found = teawares.value.find((tw) => tw.meta.id === teawareId);
      if (found?.specs.volumeInMilliliters) {
        draft.value.recipe.waterVolumeInMilliliters =
          found.specs.volumeInMilliliters;
      }
    }
  },
);

async function handleDeleteSession(): Promise<void> {
  if (isPersisted.value) {
    await sessionRepository.softDelete(draft.value.meta.id);
    toast.add({
      title: "Сессия удалена",
      color: "neutral",
    });
  }
  await navigateTo("/");
}

onMounted(async () => {
  const paramId = String((route.params as any).id ?? "");

  if (paramId === "new") {
    const presetTeaId =
      typeof route.query.teaId === "string" ? route.query.teaId : undefined;
    draft.value = createEmptyTastingSession(profileStore.activeProfileId, {
      teaId: presetTeaId,
    });
    isPersisted.value = false;
    isLoading.value = false;
    isHydrating = false;
    if (presetTeaId) {
      void persistDraft();
    }
    return;
  }

  const existing = await sessionRepository.getById(paramId);
  if (!existing || existing.meta.removedAt !== undefined) {
    toast.add({
      title: "Сессия не найдена",
      color: "error",
    });
    await navigateTo("/");
    return;
  }

  draft.value = existing;
  isPersisted.value = true;
  isLoading.value = false;
  isHydrating = false;
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    void persistDraft();
  }
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Сессия дегустации">
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            to="/"
          />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UBadge
              v-if="saveStatus === 'saving'"
              size="xs"
              color="neutral"
              variant="subtle"
            >
              Сохранение...
            </UBadge>
            <UBadge
              v-else-if="saveStatus === 'saved'"
              size="xs"
              color="success"
              variant="subtle"
            >
              Сохранено
            </UBadge>

            <div
              class="flex items-center gap-1 rounded-md border border-default px-2 py-1"
            >
              <UIcon name="i-lucide-timer" class="size-4 text-primary" />
              <span class="min-w-10 text-center font-mono text-sm font-medium">
                {{ timerSeconds }}с
              </span>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="isTimerRunning ? 'i-lucide-pause' : 'i-lucide-play'"
                @click="toggleTimer"
              />
              <UButton
                v-if="timerSeconds > 0"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-rotate-ccw"
                @click="resetTimer"
              />
            </div>

            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="handleDeleteSession"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="mx-auto max-w-4xl space-y-4">
        <USkeleton class="h-40 rounded-lg" />
        <USkeleton class="h-64 rounded-lg" />
      </div>

      <div v-else class="mx-auto max-w-4xl space-y-6 pb-16">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">
                1. Установка и рецепт
              </h2>
              <UBadge
                v-if="ratioPer100Ml"
                size="xs"
                color="primary"
                variant="subtle"
              >
                {{ ratioPer100Ml }} г / 100 мл
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Чай">
                <USelectMenu
                  v-model="draft.setup.teaId"
                  :items="teaSelectItems"
                  value-key="value"
                  placeholder="Выберите чай"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Вода">
                <USelectMenu
                  v-model="draft.setup.waterId"
                  :items="waterSelectItems"
                  value-key="value"
                  placeholder="Выберите воду"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Посуда">
                <USelectMenu
                  v-model="draft.setup.teawareId"
                  :items="teawareSelectItems"
                  value-key="value"
                  placeholder="Выберите посуду"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Метод заваривания">
                <USelect
                  v-model="draft.recipe.brewingMethod"
                  :items="brewingMethodOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Вес листа (г)">
                <UInputNumber
                  v-model="draft.recipe.leafWeightInGrams"
                  :min="0.5"
                  :max="100"
                  :step="0.5"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Объем воды (мл)">
                <UInputNumber
                  v-model="draft.recipe.waterVolumeInMilliliters"
                  :min="10"
                  :max="2000"
                  :step="10"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Промывки (сек)">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  v-for="(sec, idx) in draft.recipe.rinseDurationsInSeconds"
                  :key="idx"
                  size="md"
                  color="neutral"
                  variant="subtle"
                  class="gap-1 pr-1"
                >
                  <span>#{{ idx + 1 }}: {{ sec }}с</span>
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-x"
                    @click="removeRinseDuration(idx)"
                  />
                </UBadge>

                <div class="flex items-center gap-1">
                  <UInputNumber
                    v-model="newRinseSeconds"
                    :min="1"
                    :max="300"
                    class="w-24"
                  />
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-plus"
                    label="Добавить"
                    @click="addRinseDuration(newRinseSeconds)"
                  />
                  <UButton
                    v-if="timerSeconds > 0"
                    size="xs"
                    color="primary"
                    variant="soft"
                    :label="`С таймера (${timerSeconds}с)`"
                    @click="addRinseDuration(timerSeconds)"
                  />
                </div>
              </div>
            </UFormField>

            <UFormField label="Заметка к рецепту">
              <UTextarea v-model="draft.recipe.note" :rows="2" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              2. Сухой и прогретый лист
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Аромат сухого листа">
              <DescriptorPicker
                v-model="draft.dryLeaf.plainLeafDescriptorCodes"
                label="Аромат сухого листа"
                placeholder="Выбрать ноты сухого листа"
              />
            </UFormField>

            <UFormField label="Аромат прогретого листа">
              <DescriptorPicker
                v-model="draft.dryLeaf.warmedLeafDescriptorCodes"
                label="Аромат прогретого листа"
                placeholder="Выбрать ноты прогретого листа"
              />
            </UFormField>

            <UFormField label="Заметка о листе">
              <UTextarea
                v-model="draft.dryLeaf.note"
                :rows="2"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <h2 class="font-semibold text-highlighted">
                  3. Проливы и сенсорика
                </h2>
                <UBadge
                  v-if="hasGroupOverlap"
                  size="xs"
                  color="warning"
                  variant="subtle"
                >
                  Номера проливов пересекаются
                </UBadge>
              </div>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                label="Добавить группу проливов"
                @click="handleAddSteepGroup"
              />
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-1.5">
              <UButton
                v-for="(grp, idx) in draft.steepGroups"
                :key="idx"
                size="xs"
                :color="activeSteepGroupIndex === idx ? 'primary' : 'neutral'"
                :variant="activeSteepGroupIndex === idx ? 'solid' : 'outline'"
                @click="activeSteepGroupIndex = idx"
              >
                Пролив {{ grp.setup.groupStartIndex }}
                <span
                  v-if="
                    grp.setup.groupEndIndex &&
                    grp.setup.groupEndIndex !== grp.setup.groupStartIndex
                  "
                >
                  –{{ grp.setup.groupEndIndex }}
                </span>
              </UButton>
            </div>

            <template v-for="(group, gIdx) in draft.steepGroups" :key="gIdx">
              <div v-if="activeSteepGroupIndex === gIdx" class="space-y-5 pt-2">
                <div class="flex items-center justify-between">
                  <span
                    class="text-xs font-medium uppercase tracking-wider text-muted"
                  >
                    Параметры группы #{{ gIdx + 1 }}
                  </span>
                  <UButton
                    v-if="draft.steepGroups.length > 1"
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    label="Удалить группу"
                    @click="handleRemoveSteepGroup(gIdx)"
                  />
                </div>

                <div class="grid gap-3 sm:grid-cols-4">
                  <UFormField label="С пролива">
                    <UInputNumber
                      v-model="group.setup.groupStartIndex"
                      :min="1"
                      :max="100"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="По пролив (опц.)">
                    <UInputNumber
                      v-model="group.setup.groupEndIndex"
                      :min="group.setup.groupStartIndex"
                      :max="100"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Температура (°C)">
                    <UInputNumber
                      v-model="group.setup.temperatureInCelsius"
                      :min="0"
                      :max="100"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Экспозиция (сек)">
                    <div class="flex items-center gap-1">
                      <UInputNumber
                        v-model="group.setup.durationInSeconds"
                        :min="1"
                        :max="3600"
                        class="w-full"
                      />
                      <UButton
                        v-if="timerSeconds > 0"
                        size="xs"
                        color="primary"
                        variant="soft"
                        icon="i-lucide-timer"
                        @click="applyTimerToSteepGroup(gIdx)"
                      />
                    </div>
                  </UFormField>
                </div>

                <USeparator label="Аромат" />

                <div class="grid gap-4 sm:grid-cols-3">
                  <UFormField label="С пара / из гайвани">
                    <DescriptorPicker
                      v-model="group.sensorics.aromas.steamDescriptorCodes"
                      label="Аромат с пара"
                      placeholder="Добавить"
                    />
                  </UFormField>

                  <UFormField label="Ретроназальный">
                    <DescriptorPicker
                      v-model="group.sensorics.aromas.retronasalDescriptorCodes"
                      label="Ретроназальный аромат"
                      placeholder="Добавить"
                    />
                  </UFormField>

                  <UFormField label="Со дна пиалы">
                    <DescriptorPicker
                      v-model="group.sensorics.aromas.cupBottomDescriptorCodes"
                      label="Аромат со дна пиалы"
                      placeholder="Добавить"
                    />
                  </UFormField>
                </div>

                <USeparator label="Базовые вкусы (0–10)" />

                <div class="grid gap-4 sm:grid-cols-5">
                  <UFormField
                    v-for="taste in tasteFields"
                    :key="taste.key"
                    :label="`${taste.label}: ${group.sensorics.tastes[taste.key] ?? '—'}`"
                  >
                    <USlider
                      :model-value="group.sensorics.tastes[taste.key] ?? 0"
                      :min="0"
                      :max="10"
                      :step="1"
                      @update:model-value="
                        (val) => setTasteScore(gIdx, taste.key, val)
                      "
                    />
                  </UFormField>
                </div>

                <USeparator label="Тактильность и послевкусие" />

                <div class="grid gap-3 sm:grid-cols-3">
                  <UFormField label="Плотность / Тело">
                    <USelect
                      v-model="group.sensorics.mouthfeel.density"
                      :items="densityOptions"
                      placeholder="Не указана"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Текстура">
                    <USelect
                      v-model="group.sensorics.mouthfeel.texture"
                      :items="textureOptions"
                      placeholder="Не указана"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Терпкость">
                    <USelect
                      v-model="group.sensorics.mouthfeel.astringency"
                      :items="astringencyOptions"
                      placeholder="Не указана"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <div class="grid gap-3 sm:grid-cols-3">
                  <UFormField label="Хуэй Гань">
                    <USelect
                      v-model="group.sensorics.mouthfeel.huiGan"
                      :items="huiGanOptions"
                      placeholder="Не указано"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Зоны Шэн Цзинь">
                    <USelectMenu
                      v-model="group.sensorics.mouthfeel.shengJinZones"
                      :items="shengJinOptions"
                      value-key="value"
                      multiple
                      placeholder="Выбрать зоны"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Холодок">
                    <USwitch
                      v-model="group.sensorics.mouthfeel.isCooling"
                      label="Ощущается холодок"
                      class="pt-1.5"
                    />
                  </UFormField>
                </div>

                <USeparator label="Визуал настоя" />

                <div class="grid gap-3 sm:grid-cols-2">
                  <UFormField label="Прозрачность">
                    <USelect
                      v-model="group.sensorics.visual.clarity"
                      :items="clarityOptions"
                      placeholder="Не указана"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Яркость">
                    <USelect
                      v-model="group.sensorics.visual.brightness"
                      :items="brightnessOptions"
                      placeholder="Не указана"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <div class="grid gap-3 sm:grid-cols-4">
                  <UFormField label="Оценка этапа (0–10)">
                    <UInputNumber
                      v-model="group.summary.rating"
                      :min="0"
                      :max="10"
                      :step="0.5"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Заметка по группе" class="sm:col-span-3">
                    <UInput
                      v-model="group.summary.note"
                      placeholder="Динамика вкуса, изменения на этих проливах..."
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>
            </template>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              4. Спитой лист (Развар)
            </h2>
          </template>

          <div class="space-y-4">
            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Целостность">
                <USelect
                  v-model="draft.spentLeaf.integrity"
                  :items="leafIntegrityOptions"
                  placeholder="Не указана"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Эластичность">
                <USelect
                  v-model="draft.spentLeaf.elasticity"
                  :items="leafElasticityOptions"
                  placeholder="Не указана"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Однородность">
                <USelect
                  v-model="draft.spentLeaf.uniformity"
                  :items="leafUniformityOptions"
                  placeholder="Не указана"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Аромат остывшего листа">
              <DescriptorPicker
                v-model="draft.spentLeaf.descriptorCodes"
                label="Аромат развара"
                placeholder="Выбрать ноты развара"
              />
            </UFormField>

            <UFormField label="Заметка о разваре">
              <UTextarea
                v-model="draft.spentLeaf.note"
                :rows="2"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">5. Состояние и Ча Ци</h2>
          </template>

          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Соматическое воздействие (тело)">
                <USelectMenu
                  v-model="draft.effects.somatic"
                  :items="somaticEffectOptions"
                  value-key="value"
                  multiple
                  placeholder="Выбрать ощущения"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Ментальное воздействие">
                <USelectMenu
                  v-model="draft.effects.mental"
                  :items="mentalEffectOptions"
                  value-key="value"
                  multiple
                  placeholder="Выбрать состояния"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Заметка о воздействии">
              <UTextarea
                v-model="draft.effects.note"
                :rows="2"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">6. Итоги сессии</h2>
          </template>

          <div class="space-y-4">
            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Общая оценка (0–10)">
                <UInputNumber
                  v-model="draft.summary.ratingTotal"
                  :min="0"
                  :max="10"
                  :step="0.5"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Теги сессии" class="sm:col-span-2">
                <UInputTags
                  v-model="draft.summary.tags"
                  placeholder="Добавить тег..."
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Финальный вывод">
              <UTextarea
                v-model="draft.summary.note"
                :rows="3"
                placeholder="Общее впечатление, рекомендации по следующему завариванию..."
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
