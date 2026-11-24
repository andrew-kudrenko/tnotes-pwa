<script setup lang="ts">
import { useTeawaresQuery } from "../../composables/queries/use-teawares-query";
import {
  enumToOptions,
  POUR_SPEED_LABELS,
  TEA_CATEGORY_LABELS,
  TEAWARE_FILTER_LABELS,
  TEAWARE_MATERIAL_LABELS,
  TEAWARE_POROSITY_LABELS,
  TEAWARE_TYPE_LABELS,
  WALL_THICKNESS_LABELS,
} from "../../domain/shared/labels";
import { createEmptyTeaware } from "../../domain/teaware/factory";
import type { Teaware } from "../../domain/teaware/types";
import { teawareRepository } from "../../infrastructure/repositories/teaware.repository";
import { useProfileStore } from "../../stores/profile.store";

useHead({ title: "Посуда" });

const profileStore = useProfileStore();
const { data: teawares, isLoading } = useTeawaresQuery();

const isEditorOpen = ref(false);
const editingTeaware = ref<Teaware>(
  createEmptyTeaware("gaiwan", "porcelain", profileStore.activeProfileId),
);

const typeOptions = enumToOptions(TEAWARE_TYPE_LABELS);
const materialOptions = enumToOptions(TEAWARE_MATERIAL_LABELS);
const porosityOptions = enumToOptions(TEAWARE_POROSITY_LABELS);
const thicknessOptions = enumToOptions(WALL_THICKNESS_LABELS);
const pourSpeedOptions = enumToOptions(POUR_SPEED_LABELS);
const filterOptions = enumToOptions(TEAWARE_FILTER_LABELS);
const categoryOptions = enumToOptions(TEA_CATEGORY_LABELS);

function openCreateModal(): void {
  editingTeaware.value = createEmptyTeaware(
    "gaiwan",
    "porcelain",
    profileStore.activeProfileId,
  );
  isEditorOpen.value = true;
}

function openEditModal(item: Teaware): void {
  editingTeaware.value = structuredClone(item);
  isEditorOpen.value = true;
}

async function handleSave(): Promise<void> {
  if (!editingTeaware.value.identity.name.trim()) {
    return;
  }
  await teawareRepository.upsert(editingTeaware.value);
  isEditorOpen.value = false;
}

async function handleDelete(id: string): Promise<void> {
  await teawareRepository.softDelete(id);
  isEditorOpen.value = false;
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Посуда">
        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Добавить посуду"
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
        v-else-if="teawares.length === 0"
        icon="i-lucide-cup-soda"
        title="Посуда не добавлена"
        description="Добавьте ваши гайвани, чайники и колбы с указанием объема и материала."
      >
        <template #actions>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Добавить посуду"
            @click="openCreateModal"
          />
        </template>
      </UEmpty>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="item in teawares"
          :key="item.meta.id"
          class="cursor-pointer transition hover:ring-2 hover:ring-primary/50"
          @click="openEditModal(item)"
        >
          <template #header>
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-semibold text-highlighted">
                  {{ item.identity.name }}
                </h3>
                <p class="text-xs text-muted">
                  {{ TEAWARE_TYPE_LABELS[item.identity.type] }}
                  <span>· {{ item.identity.shape }}</span>
                </p>
              </div>
              <UBadge
                v-if="item.specs.volumeInMilliliters !== undefined"
                size="xs"
                color="primary"
                variant="subtle"
              >
                {{ item.specs.volumeInMilliliters }} мл
              </UBadge>
            </div>
          </template>

          <div class="space-y-2 text-sm">
            <div class="flex flex-wrap gap-1.5 text-xs text-muted">
              <span>{{ TEAWARE_MATERIAL_LABELS[item.material.material] }}</span>
              <span v-if="item.material.subType"
                >({{ item.material.subType }})</span
              >
              <span v-if="item.specs.pourSpeed"
                >· {{ POUR_SPEED_LABELS[item.specs.pourSpeed] }}</span
              >
            </div>

            <div
              v-if="item.summary.dedicatedTeaCategories.length > 0"
              class="flex flex-wrap gap-1 pt-1"
            >
              <UBadge
                v-for="cat in item.summary.dedicatedTeaCategories"
                :key="cat"
                size="xs"
                color="neutral"
                variant="outline"
              >
                {{ TEA_CATEGORY_LABELS[cat] }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>

      <USlideover v-model:open="isEditorOpen" title="Карточка посуды">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required> </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Тип посуды"> </UFormField>
              <UFormField label="Форма"> </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Материал">
                <USelect
                  v-model="editingTeaware.material.material"
                  :items="materialOptions"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Подтип глины / глазури">
                <UInput
                  v-model="editingTeaware.material.subType"
                  placeholder="Цзы Ни, Жу Яо..."
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Пористость">
                <USelect
                  v-model="editingTeaware.material.porosity"
                  :items="porosityOptions"
                  placeholder="Не указана"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Толщина стенок">
                <USelect
                  v-model="editingTeaware.material.wallThickness"
                  :items="thicknessOptions"
                  placeholder="Не указана"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Рабочий объем (мл)">
                <UInputNumber
                  v-model="editingTeaware.specs.volumeInMilliliters"
                  :min="10"
                  :max="2000"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Скорость слива">
                <USelect
                  v-model="editingTeaware.specs.pourSpeed"
                  :items="pourSpeedOptions"
                  placeholder="Не указана"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Тип сита">
              <USelect
                v-model="editingTeaware.specs.filterType"
                :items="filterOptions"
                placeholder="Не указан"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Специализация по чаям">
              <USelectMenu
                v-model="editingTeaware.summary.dedicatedTeaCategories"
                :items="categoryOptions"
                value-key="value"
                multiple
                placeholder="Универсальная"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Теги">
              <UInputTags
                v-model="editingTeaware.summary.tags"
                placeholder="Добавить тег..."
                class="w-full"
              />
            </UFormField>

            <UFormField label="Заметка">
              <UTextarea
                v-model="editingTeaware.summary.note"
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
              @click="handleDelete(editingTeaware.meta.id)"
            />
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                label="Отмена"
                @click="isEditorOpen = false"
              />
            </div>
          </div>
        </template>
      </USlideover>
    </template>
  </UDashboardPanel>
</template>
