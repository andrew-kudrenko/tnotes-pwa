<script setup lang="ts">
import { ref } from "vue";
import { useLiveQuery } from "../../composables/use-live-query";
import {
  listActiveConflicts,
  resolveConflict,
  type SyncConflictItem,
} from "../../infrastructure/sync/conflict-resolver";
import type { SyncEntityType } from "../../infrastructure/sync/types";

const toast = useToast();
const resolvingId = ref<string | undefined>(undefined);

const { data: conflicts } = useLiveQuery<SyncConflictItem[]>(
  async () => await listActiveConflicts(),
  [],
);

const ENTITY_LABELS: Record<SyncEntityType, string> = {
  session: "Сессия дегустации",
  tea: "Чай",
  water: "Вода",
  teaware: "Посуда",
  customDescriptor: "Дескриптор",
};

function extractTitle(entity: unknown): string {
  if (!entity || typeof entity !== "object") {
    return "Запись";
  }
  const obj = entity as Record<string, unknown>;
  if (obj.identity && typeof obj.identity === "object") {
    const name = (obj.identity as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) {
      return name;
    }
  }
  if (typeof obj.label === "string" && obj.label.trim()) {
    return obj.label;
  }
  return "Сессия дегустации";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

async function handleResolve(
  conflict: SyncConflictItem,
  choice: "keepLocal" | "acceptServer",
): Promise<void> {
  resolvingId.value = conflict.entityId;
  try {
    await resolveConflict(conflict, choice);
    toast.add({
      title: "Конфликт разрешен",
      color: "success",
    });
  } finally {
    resolvingId.value = undefined;
  }
}
</script>

<template>
  <UCard v-if="conflicts.length > 0" class="border-warning">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-alert-triangle" class="size-5 text-warning" />
          <h2 class="font-semibold text-highlighted">
            Конфликты синхронизации
          </h2>
        </div>
        <UBadge color="warning" variant="subtle" size="xs">
          {{ conflicts.length }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted">
        Эти записи были изменены одновременно на нескольких устройствах.
        Выберите, какую версию сохранить.
      </p>
      <div
        v-for="conflict in conflicts"
        :key="`${conflict.entityType}-${conflict.entityId}`"
        class="space-y-3 rounded-lg border border-default p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <span class="text-xs font-medium text-warning">
              {{ ENTITY_LABELS[conflict.entityType] }}
            </span>
            <h3 class="font-medium text-highlighted">
              {{ extractTitle(conflict.localEntity) }}
            </h3>
          </div>
          <span class="font-mono text-xs text-muted">
            {{ conflict.entityId.slice(0, 8) }}
          </span>
        </div>

        <div class="grid gap-3 text-xs sm:grid-cols-2">
          <div class="rounded border border-default p-2.5">
            <p class="font-semibold text-highlighted">Локальная версия</p>
            <p class="mt-0.5 text-muted">
              Изменено: {{ formatDate(conflict.localEntity.meta.updatedAt) }}
            </p>
            <p class="text-muted">
              Ревизия: {{ conflict.localEntity.meta.revision }}
            </p>
          </div>

          <div class="rounded border border-default p-2.5">
            <p class="font-semibold text-highlighted">Версия с сервера</p>
            <template v-if="conflict.serverEntity">
              <p class="mt-0.5 text-muted">
                Изменено: {{ formatDate(conflict.serverEntity.meta.updatedAt) }}
              </p>
              <p class="text-muted">
                Ревизия: {{ conflict.serverEntity.meta.revision }}
              </p>
            </template>
            <p v-else class="mt-0.5 text-muted">Данные сервера доступны</p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
