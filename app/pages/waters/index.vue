<script setup lang="ts">
import { useWatersQuery } from "../../composables/queries/use-waters-query";
import { enumToOptions, WATER_SOURCE_LABELS } from "../../domain/shared/labels";
import { createEmptyWater } from "../../domain/water/factory";
import type { Water } from "../../domain/water/types";
import { waterRepository } from "../../infrastructure/repositories/water.repository";
import { useProfileStore } from "../../stores/profile.store";

useHead({ title: "Вода" });

const profileStore = useProfileStore();
const { data: waters, isLoading } = useWatersQuery();

const isEditorOpen = ref(false);
const editingWater = ref<Water>(createEmptyWater(profileStore.activeProfileId));
const sourceOptions = enumToOptions(WATER_SOURCE_LABELS);

function openCreateModal(): void {
  editingWater.value = createEmptyWater(profileStore.activeProfileId);
  isEditorOpen.value = true;
}

function openEditModal(water: Water): void {
  editingWater.value = structuredClone(water);
  isEditorOpen.value = true;
}

async function handleSave(): Promise<void> {
  if (!editingWater.value.identity.name.trim()) {
    return;
  }
  await waterRepository.upsert(editingWater.value);
  isEditorOpen.value = false;
}

async function handleDelete(id: string): Promise<void> {
  await waterRepository.softDelete(id);
  isEditorOpen.value = false;
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Вода">
        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Добавить воду"
            @click="openCreateModal"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="i in 4" :key="i" class="h-36 rounded-lg" />
      </div>

      <UEmpty
        v-else-if="waters.length === 0"
        icon="i-lucide-droplets"
        title="Список воды пуст"
        description="Добавьте воду, на которой завариваете чай, чтобы отслеживать TDS и влияние на настой."
      >
        <template #actions>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Добавить воду"
            @click="openCreateModal"
          />
        </template>
      </UEmpty>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="water in waters"
          :key="water.meta.id"
          class="cursor-pointer transition hover:ring-2 hover:ring-primary/50"
          @click="openEditModal(water)"
        >
          <template #header>
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-semibold text-highlighted">
                  {{ water.identity.name }}
                </h3>
                <p v-if="water.identity.brand" class="text-xs text-muted">
                  {{ water.identity.brand }}
                </p>
              </div>
              <UBadge
                v-if="water.metrics.tdsInPpm !== undefined"
                size="xs"
                color="info"
                variant="subtle"
              >
                {{ water.metrics.tdsInPpm }} ppm
              </UBadge>
            </div>
          </template>

          <div class="space-y-2 text-sm">
            <div class="flex flex-wrap gap-2 text-xs text-muted">
              <span v-if="water.identity.sourceType">
                {{ WATER_SOURCE_LABELS[water.identity.sourceType] }}
              </span>
              <span v-if="water.metrics.ph !== undefined">
                · pH {{ water.metrics.ph }}
              </span>
              <span v-if="water.metrics.generalHardness !== undefined">
                · GH {{ water.metrics.generalHardness }}
              </span>
            </div>

            <p v-if="water.summary.note" class="line-clamp-2 text-muted">
              {{ water.summary.note }}
            </p>
          </div>
        </UCard>
      </div>

      <USlideover v-model:open="isEditorOpen" title="Параметры воды">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput
                v-model="editingWater.identity.name"
                placeholder="Пилигрим, Родник..."
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Бренд">
                <UInput v-model="editingWater.identity.brand" class="w-full" />
              </UFormField>
              <UFormField label="Источник">
                <USelect
                  v-model="editingWater.identity.sourceType"
                  :items="sourceOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Минерализация (TDS, ppm)">
                <UInputNumber
                  v-model="editingWater.metrics.tdsInPpm"
                  :min="0"
                  :max="2000"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Кислотность (pH)">
                <UInputNumber
                  v-model="editingWater.metrics.ph"
                  :min="0"
                  :max="14"
                  :step="0.1"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Общая жесткость (GH)">
                <UInputNumber
                  v-model="editingWater.metrics.generalHardness"
                  :min="0"
                  :step="0.1"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Карбонатная жесткость (KH)">
                <UInputNumber
                  v-model="editingWater.metrics.carbonateHardness"
                  :min="0"
                  :step="0.1"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Теги">
              <UInputTags
                v-model="editingWater.summary.tags"
                placeholder="Добавить тег..."
                class="w-full"
              />
            </UFormField>

            <UFormField label="Заметка">
              <UTextarea
                v-model="editingWater.summary.note"
                :rows="3"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex w-full items-center justify-between gap-2">
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              label="Удалить"
              @click="handleDelete(editingWater.meta.id)"
            />
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                label="Отмена"
                @click="isEditorOpen = false"
              />
              <UButton
                color="primary"
                label="Сохранить"
                :disabled="!editingWater.identity.name.trim()"
                @click="handleSave"
              />
            </div>
          </div>
        </template>
      </USlideover>
    </template>
  </UDashboardPanel>
</template>
