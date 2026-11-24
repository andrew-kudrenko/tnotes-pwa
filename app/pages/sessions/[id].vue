<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DescriptorPicker from "../../components/lexicon/DescriptorPicker.vue";
import SessionEffectsAndSummaryCard from "../../components/session/SessionEffectsAndSummaryCard.vue";
import SessionSpentLeafCard from "../../components/session/SessionSpentLeafCard.vue";
import SessionSteepGroupEditor from "../../components/session/SessionSteepGroupEditor.vue";
import { useTeasQuery } from "../../composables/queries/use-teas-query";
import { useTeawaresQuery } from "../../composables/queries/use-teawares-query";
import { useWatersQuery } from "../../composables/queries/use-waters-query";
import { useBrewTimer } from "../../composables/session/use-brew-timer";
import { useSessionEditor } from "../../composables/session/use-session-editor";
import {
  BREWING_METHOD_LABELS,
  enumToOptions,
} from "../../domain/shared/labels";

const route = useRoute();
const toast = useToast();

const { data: teas } = useTeasQuery();
const { data: waters } = useWatersQuery();
const { data: teawares } = useTeawaresQuery();

const timer = useBrewTimer();
const {
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
  addSteepGroup,
  removeSteepGroup,
  deleteSession,
} = useSessionEditor(
  () => String((route.params as any).id ?? ""),
  () => (typeof route.query.teaId === "string" ? route.query.teaId : undefined),
);

const newRinseSeconds = ref<number | undefined>(5);
const brewingMethodOptions = enumToOptions(BREWING_METHOD_LABELS);

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

const selectedTeaName = computed(() => {
  const teaId = draft.value.setup.teaId;
  if (!teaId) {
    return undefined;
  }
  return teas.value.find((t) => t.meta.id === teaId)?.identity.name;
});

const startedAtLocal = computed({
  get(): string {
    const date = new Date(draft.value.meta.startedAt);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  },
  set(val: string): void {
    if (!val) {
      return;
    }
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) {
      draft.value.meta.startedAt = parsed.toISOString();
    }
  },
});

useHead({
  title: computed(() =>
    selectedTeaName.value
      ? `Дегустация: ${selectedTeaName.value}`
      : "Новая дегустация",
  ),
});

watch(isNotFound, (notFound) => {
  if (notFound) {
    toast.add({
      title: "Сессия не найдена",
      color: "error",
    });
    void navigateTo("/");
  }
});

async function handleDeleteSession(): Promise<void> {
  await deleteSession();
  toast.add({
    title: "Сессия удалена",
    color: "neutral",
  });
}
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
              v-if="saveStatus === 'dirty'"
              size="xs"
              color="neutral"
              variant="outline"
            >
              Изменено
            </UBadge>
            <UBadge
              v-else-if="saveStatus === 'saving'"
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
                {{ timer.elapsedSeconds.value }}с
              </span>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="
                  timer.isRunning.value ? 'i-lucide-pause' : 'i-lucide-play'
                "
                @click="timer.toggle"
              />
              <UButton
                v-if="timer.elapsedSeconds.value > 0"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-rotate-ccw"
                @click="timer.reset"
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

              <UFormField label="Дата и время дегустации">
                <UInput
                  v-model="startedAtLocal"
                  type="datetime-local"
                  class="w-full sm:w-64"
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
                    v-if="timer.elapsedSeconds.value > 0"
                    size="xs"
                    color="primary"
                    variant="soft"
                    :label="`С таймера (${timer.elapsedSeconds.value}с)`"
                    @click="addRinseDuration(timer.elapsedSeconds.value)"
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
                @click="addSteepGroup"
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

            <SessionSteepGroupEditor
              v-if="draft.steepGroups[activeSteepGroupIndex]"
              v-model="draft.steepGroups[activeSteepGroupIndex]!"
              :group-index="activeSteepGroupIndex"
              :can-delete="draft.steepGroups.length > 1"
              :timer-seconds="timer.elapsedSeconds.value"
              @delete="removeSteepGroup(activeSteepGroupIndex)"
              @apply-timer="
                setSteepDuration(
                  activeSteepGroupIndex,
                  timer.elapsedSeconds.value,
                )
              "
            />
          </div>
        </UCard>

        <SessionSpentLeafCard v-model="draft.spentLeaf" />

        <SessionEffectsAndSummaryCard
          v-model:effects="draft.effects"
          v-model:summary="draft.summary"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
