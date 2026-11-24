<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui";
import { computed, ref } from "vue";
import { useLexicon } from "../../composables/lexicon/use-lexicon";
import { useSessionsQuery } from "../../composables/queries/use-sessions-query";
import { useTeasQuery } from "../../composables/queries/use-teas-query";
import { useTeawaresQuery } from "../../composables/queries/use-teawares-query";
import { useWatersQuery } from "../../composables/queries/use-waters-query";
import {
  TEA_CATEGORY_LABELS,
  TEAWARE_TYPE_LABELS,
} from "../../domain/shared/labels";

const searchTerm = ref("");

const { data: teas } = useTeasQuery();
const { data: sessions } = useSessionsQuery();
const { data: waters } = useWatersQuery();
const { data: teawares } = useTeawaresQuery();
const { allDescriptors } = useLexicon();

const teaNameMap = computed(() => {
  const map = new Map<string, string>();
  for (const tea of teas.value) {
    map.set(tea.meta.id, tea.identity.name);
  }
  return map;
});

const groups = computed<CommandPaletteGroup[]>(() => [
  {
    id: "actions",
    label: "Быстрые действия",
    items: [
      {
        label: "Новая дегустация",
        icon: "i-lucide-plus",
        onSelect: () => {
          void navigateTo("/sessions/new");
        },
      },
      {
        label: "Журнал сессий",
        icon: "i-lucide-book-open",
        to: "/",
      },
      {
        label: "Чайная полка",
        icon: "i-lucide-leaf",
        to: "/teas",
      },
      {
        label: "Вода",
        icon: "i-lucide-droplets",
        to: "/waters",
      },
      {
        label: "Посуда",
        icon: "i-lucide-cup-soda",
        to: "/teawares",
      },
      {
        label: "Настройки и бэкап",
        icon: "i-lucide-settings",
        to: "/settings",
      },
    ],
  },
  {
    id: "teas",
    label: "Чайная полка",
    items: teas.value.map((tea) => ({
      label: tea.identity.name,
      suffix: [
        TEA_CATEGORY_LABELS[tea.identity.category],
        tea.craft.harvestYear ? `${tea.craft.harvestYear} г.` : undefined,
        tea.origin.regionOrMountain,
      ]
        .filter(Boolean)
        .join(" · "),
      icon: "i-lucide-leaf",
      onSelect: () => {
        void navigateTo({
          path: "/sessions/new",
          query: { teaId: tea.meta.id },
        });
      },
    })),
  },
  {
    id: "sessions",
    label: "Сессии дегустаций",
    items: sessions.value.map((session) => {
      const teaName =
        (session.setup.teaId && teaNameMap.value.get(session.setup.teaId)) ||
        "Чай не указан";
      const dateLabel = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
      }).format(new Date(session.meta.startedAt));

      return {
        label: `${teaName} (${dateLabel})`,
        suffix: session.summary.note,
        icon: "i-lucide-book-open",
        to: `/sessions/${session.meta.id}`,
      };
    }),
  },
  {
    id: "inventory",
    label: "Вода и посуда",
    items: [
      ...waters.value.map((water) => ({
        label: water.identity.name,
        suffix: water.metrics.tdsInPpm
          ? `${water.metrics.tdsInPpm} ppm`
          : "Вода",
        icon: "i-lucide-droplets",
        to: "/waters",
      })),
      ...teawares.value.map((tw) => ({
        label: tw.identity.name,
        suffix: [
          TEAWARE_TYPE_LABELS[tw.identity.type],
          tw.specs.volumeInMilliliters
            ? `${tw.specs.volumeInMilliliters} мл`
            : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
        icon: "i-lucide-cup-soda",
        to: "/teawares",
      })),
    ],
  },
  {
    id: "descriptors",
    label: "Дескрипторы лексикона",
    items: allDescriptors.value.map((desc) => ({
      label: desc.label,
      suffix: desc.aliases.join(", "),
      icon: "i-lucide-tag",
      to: "/settings",
    })),
  },
]);
</script>

<template>
  <UDashboardSearch
    v-model:search-term="searchTerm"
    :groups="groups"
    placeholder="Поиск по чаям, сессиям, посуде и дескрипторам..."
  />
</template>
