<script setup lang="ts">
import { computed, ref } from "vue";
import { useLexicon } from "../../composables/lexicon/use-lexicon";
import { useSessionsQuery } from "../../composables/queries/use-sessions-query";
import { useTeasQuery } from "../../composables/queries/use-teas-query";
import type { TeaCategory } from "../../domain/shared/enums";
import {
  enumToOptions,
  MENTAL_EFFECT_LABELS,
  SOMATIC_EFFECT_LABELS,
  TEA_CATEGORY_LABELS,
} from "../../domain/shared/labels";
import type { Tea } from "~/domain/tea/types";

useHead({ title: "Аналитика и статистика" });

const { data: sessions, isLoading } = useSessionsQuery();
const { data: teas } = useTeasQuery();
const { getByCode } = useLexicon();

const selectedCategory = ref<TeaCategory | "all">("all");
const categoryOptions = enumToOptions(TEA_CATEGORY_LABELS);

const teaMap = computed(() => {
  const map = new Map<string, Tea>();
  for (const tea of teas.value) {
    map.set(tea.meta.id, tea);
  }
  return map;
});

const filteredSessions = computed(() => {
  if (selectedCategory.value === "all") {
    return sessions.value;
  }
  return sessions.value.filter((s) => {
    const tea = s.setup.teaId ? teaMap.value.get(s.setup.teaId) : undefined;
    return tea?.identity.category === selectedCategory.value;
  });
});

const overviewStats = computed(() => {
  const list = filteredSessions.value;
  const rated = list
    .map((s) => s.summary.ratingTotal)
    .filter((r): r is number => r !== undefined);

  const avgRating =
    rated.length > 0
      ? Number((rated.reduce((acc, v) => acc + v, 0) / rated.length).toFixed(1))
      : undefined;

  let totalSteeps = 0;
  for (const session of list) {
    for (const grp of session.steepGroups) {
      const end = grp.setup.groupEndIndex ?? grp.setup.groupStartIndex;
      totalSteeps += Math.max(1, end - grp.setup.groupStartIndex + 1);
    }
  }

  const avgSteeps =
    list.length > 0
      ? Number((totalSteeps / list.length).toFixed(1))
      : undefined;

  return {
    sessionsCount: list.length,
    teasCount: teas.value.length,
    avgRating,
    avgSteeps,
  };
});

const tasteAverages = computed(() => {
  const keys = [
    "sweetness",
    "acidity",
    "bitterness",
    "umami",
    "salty",
  ] as const;
  const labels: Record<(typeof keys)[number], string> = {
    sweetness: "Сладость",
    acidity: "Кислотность",
    bitterness: "Горечь",
    umami: "Умами",
    salty: "Соленость",
  };

  return keys.map((key) => {
    const values: number[] = [];
    for (const session of filteredSessions.value) {
      for (const grp of session.steepGroups) {
        const val = grp.sensorics.tastes[key];
        if (val !== undefined) {
          values.push(val);
        }
      }
    }
    const avg =
      values.length > 0
        ? Number(
            (values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(1),
          )
        : 0;
    return {
      key,
      label: labels[key],
      average: avg,
      samplesCount: values.length,
    };
  });
});

const topDescriptors = computed(() => {
  const counts = new Map<string, number>();

  for (const session of filteredSessions.value) {
    const sessionCodes = new Set<string>([
      ...session.dryLeaf.plainLeafDescriptorCodes,
      ...session.dryLeaf.warmedLeafDescriptorCodes,
      ...session.spentLeaf.descriptorCodes,
    ]);
    for (const grp of session.steepGroups) {
      for (const code of grp.sensorics.aromas.steamDescriptorCodes) {
        sessionCodes.add(code);
      }
      for (const code of grp.sensorics.aromas.retronasalDescriptorCodes) {
        sessionCodes.add(code);
      }
      for (const code of grp.sensorics.aromas.cupBottomDescriptorCodes) {
        sessionCodes.add(code);
      }
    }

    for (const code of sessionCodes) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([code, count]) => {
      const desc = getByCode(code);
      return {
        code,
        label: desc?.label ?? code,
        color: desc?.color,
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
});

const categoryBreakdown = computed(() => {
  const counts = new Map<TeaCategory, number>();
  for (const session of sessions.value) {
    const tea = session.setup.teaId
      ? teaMap.value.get(session.setup.teaId)
      : undefined;

    if (tea) {
      counts.set(
        tea.identity.category,
        (counts.get(tea.identity.category) ?? 0) + 1,
      );
    }
  }
  const total = sessions.value.length || 1;
  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      label: TEA_CATEGORY_LABELS[category],
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
});

const topEffects = computed(() => {
  const counts = new Map<string, number>();
  for (const session of filteredSessions.value) {
    for (const s of session.effects.somatic) {
      const label = SOMATIC_EFFECT_LABELS[s];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    for (const m of session.effects.mental) {
      const label = MENTAL_EFFECT_LABELS[m];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Аналитика и статистика">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <USelect
            v-model="selectedCategory"
            :items="[
              { label: 'Все категории чая', value: 'all' },
              ...categoryOptions,
            ]"
            class="w-60"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="mx-auto max-w-5xl space-y-4">
        <USkeleton class="h-28 rounded-lg" />
        <USkeleton class="h-64 rounded-lg" />
      </div>

      <UEmpty
        v-else-if="sessions.length === 0"
        icon="i-lucide-bar-chart-3"
        title="Недостаточно данных для аналитики"
        description="Проведите несколько дегустаций, чтобы увидеть вкусовые профили и популярные ноты."
      />

      <div v-else class="mx-auto max-w-5xl space-y-6 pb-12">
        <div class="grid gap-4 sm:grid-cols-4">
          <UCard>
            <p class="text-xs text-muted">Дегустаций</p>
            <p class="mt-1 text-2xl font-bold text-highlighted">
              {{ overviewStats.sessionsCount }}
            </p>
          </UCard>

          <UCard>
            <p class="text-xs text-muted">Чаев на полке</p>
            <p class="mt-1 text-2xl font-bold text-highlighted">
              {{ overviewStats.teasCount }}
            </p>
          </UCard>

          <UCard>
            <p class="text-xs text-muted">Средняя оценка</p>
            <p class="mt-1 text-2xl font-bold text-primary">
              {{
                overviewStats.avgRating !== undefined
                  ? `${overviewStats.avgRating} / 10`
                  : "—"
              }}
            </p>
          </UCard>

          <UCard>
            <p class="text-xs text-muted">Среднее число проливов</p>
            <p class="mt-1 text-2xl font-bold text-highlighted">
              {{ overviewStats.avgSteeps ?? "—" }}
            </p>
          </UCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <UCard>
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Средний профиль вкуса (0–10)
              </h2>
            </template>

            <div class="space-y-4">
              <div
                v-for="taste in tasteAverages"
                :key="taste.key"
                class="space-y-1.5"
              >
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-highlighted">{{
                    taste.label
                  }}</span>
                  <span class="text-muted">
                    {{
                      taste.samplesCount > 0
                        ? `${taste.average} / 10`
                        : "нет данных"
                    }}
                  </span>
                </div>
                <UProgress :model-value="taste.average * 10" :max="100" />
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Категории в дегустациях
              </h2>
            </template>

            <div
              v-if="categoryBreakdown.length === 0"
              class="text-sm text-muted"
            >
              Укажите чай в сессиях, чтобы увидеть статистику по категориям.
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="cat in categoryBreakdown"
                :key="cat.category"
                class="space-y-1.5"
              >
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-highlighted">{{
                    cat.label
                  }}</span>
                  <span class="text-muted"
                    >{{ cat.count }} ({{ cat.percent }}%)</span
                  >
                </div>
                <UProgress
                  :model-value="cat.percent"
                  :max="100"
                  color="primary"
                />
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <UCard>
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Топ дескрипторов аромата
              </h2>
            </template>

            <div v-if="topDescriptors.length === 0" class="text-sm text-muted">
              Дескрипторы еще не отмечались.
            </div>

            <div v-else class="flex flex-wrap gap-2">
              <UBadge
                v-for="desc in topDescriptors"
                :key="desc.code"
                size="md"
                color="neutral"
                variant="subtle"
                class="gap-1.5"
              >
                <span
                  v-if="desc.color"
                  class="size-2 rounded-full"
                  :style="{ backgroundColor: desc.color }"
                />
                <span>{{ desc.label }}</span>
                <span class="font-mono text-xs text-muted"
                  >({{ desc.count }})</span
                >
              </UBadge>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Частые состояния и Ча Ци
              </h2>
            </template>

            <div v-if="topEffects.length === 0" class="text-sm text-muted">
              Эффекты еще не отмечались.
            </div>

            <div v-else class="flex flex-wrap gap-2">
              <UBadge
                v-for="eff in topEffects"
                :key="eff.label"
                size="md"
                color="primary"
                variant="soft"
                class="gap-1.5"
              >
                <span>{{ eff.label }}</span>
                <span class="font-mono text-xs">({{ eff.count }})</span>
              </UBadge>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
