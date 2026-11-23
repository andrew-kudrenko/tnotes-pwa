<script setup lang="ts">
import { useSessionsQuery } from "../composables/queries/use-sessions-query";
import { useTeasQuery } from "../composables/queries/use-teas-query";
import { createEmptyTastingSession } from "../domain/session/factory";
import {
  BREWING_METHOD_LABELS,
  TEA_CATEGORY_LABELS,
} from "../domain/shared/labels";
import { seedMockData } from "../infrastructure/mocks/seed";
import { sessionRepository } from "../infrastructure/repositories/session.repository";
import { useProfileStore } from "../stores/profile.store";

useHead({ title: "Журнал дегустаций" });

const router = useRouter();
const profileStore = useProfileStore();
const { data: sessions, isLoading } = useSessionsQuery();
const { data: teas } = useTeasQuery();

const searchQuery = ref("");
const isSeeding = ref(false);

const teaMap = computed(() => {
  const map = new Map<string, typeof teas.value>();
  for (const tea of teas.value) {
    map.set(tea.meta.id, tea);
  }
  return map;
});

const filteredSessions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    return sessions.value;
  }
  return sessions.value.filter((session) => {
    const tea = session.setup.teaId
      ? teaMap.value.get(session.setup.teaId)
      : undefined;

    const teaName = tea?.identity.name.toLowerCase() ?? "";
    const note = session.summary.note?.toLowerCase() ?? "";
    const tags = session.summary.tags.join(" ").toLowerCase();
    return teaName.includes(q) || note.includes(q) || tags.includes(q);
  });
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function handleCreateSession(): Promise<void> {
  await navigateTo("/sessions/new");
}

async function handleSeedMocks(): Promise<void> {
  isSeeding.value = true;
  try {
    await seedMockData(profileStore.activeProfileId);
  } finally {
    isSeeding.value = false;
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Журнал дегустаций">
        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Новая сессия"
            @click="handleCreateSession"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Поиск по чаю, тегам или заметке..."
            class="w-full sm:w-80"
          />
        </template>
        <template #right>
          <span class="text-sm text-muted">
            Всего: {{ filteredSessions.length }}
          </span>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="i in 6" :key="i" class="h-44 rounded-lg" />
      </div>

      <UEmpty
        v-else-if="sessions.length === 0"
        icon="i-lucide-cup-soda"
        title="Пока нет ни одной дегустации"
        description="Начните первую чайную сессию или загрузите демонстрационный набор чаев и записей."
      >
        <template #actions>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Начать дегустацию"
            @click="handleCreateSession"
          />
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-sparkles"
            label="Загрузить демо-данные"
            :loading="isSeeding"
            @click="handleSeedMocks"
          />
        </template>
      </UEmpty>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="session in filteredSessions"
          :key="session.meta.id"
          class="cursor-pointer transition hover:ring-2 hover:ring-primary/50"
          @click="router.push(`/sessions/${session.meta.id}`)"
        >
          <template #header>
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate font-semibold text-highlighted">
                  {{
                    (session.setup.teaId &&
                      teaMap.get(session.setup.teaId)?.identity.name) ||
                    "Чай не указан"
                  }}
                </h3>
                <p class="mt-0.5 text-xs text-muted">
                  {{ formatDate(session.meta.startedAt) }}
                </p>
              </div>
              <UBadge
                v-if="session.summary.ratingTotal !== undefined"
                color="primary"
                variant="soft"
              >
                {{ session.summary.ratingTotal }} / 10
              </UBadge>
            </div>
          </template>

          <div class="space-y-3 text-sm">
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-if="session.setup.teaId && teaMap.get(session.setup.teaId)"
                size="xs"
                color="neutral"
                variant="subtle"
              >
                {{
                  TEA_CATEGORY_LABELS[
                    teaMap.get(session.setup.teaId)!.identity.category
                  ]
                }}
              </UBadge>
              <UBadge
                v-if="session.recipe.brewingMethod"
                size="xs"
                color="neutral"
                variant="outline"
              >
                {{ BREWING_METHOD_LABELS[session.recipe.brewingMethod] }}
              </UBadge>
              <UBadge
                v-if="
                  session.recipe.leafWeightInGrams &&
                  session.recipe.waterVolumeInMilliliters
                "
                size="xs"
                color="neutral"
                variant="outline"
              >
                {{ session.recipe.leafWeightInGrams }}г /
                {{ session.recipe.waterVolumeInMilliliters }}мл
              </UBadge>
            </div>

            <p v-if="session.summary.note" class="line-clamp-2 text-muted">
              {{ session.summary.note }}
            </p>

            <div
              v-if="session.summary.tags.length > 0"
              class="flex flex-wrap gap-1"
            >
              <UBadge
                v-for="tag in session.summary.tags"
                :key="tag"
                size="xs"
                color="primary"
                variant="subtle"
              >
                #{{ tag }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
