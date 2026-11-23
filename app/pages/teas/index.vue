<script setup lang="ts">
import { useTeasQuery } from "../../composables/queries/use-teas-query";
import { createEmptyTastingSession } from "../../domain/session/factory";
import type { TeaCategory } from "../../domain/shared/enums";
import {
  enumToOptions,
  HARVEST_SEASON_LABELS,
  ROAST_LEVEL_LABELS,
  STORAGE_TYPE_LABELS,
  TEA_CATEGORY_LABELS,
  TEA_FORM_LABELS,
  TREE_AGE_LABELS,
} from "../../domain/shared/labels";
import { createEmptyTea } from "../../domain/tea/factory";
import type { Tea } from "../../domain/tea/types";
import { sessionRepository } from "../../infrastructure/repositories/session.repository";
import { teaRepository } from "../../infrastructure/repositories/tea.repository";
import { useProfileStore } from "../../stores/profile.store";

useHead({ title: "Чайная полка" });

const router = useRouter();
const profileStore = useProfileStore();
const { data: teas, isLoading } = useTeasQuery();

const searchQuery = ref("");
const selectedCategory = ref<TeaCategory | "all">("all");
const isEditorOpen = ref(false);
const editingTea = ref<Tea>(
  createEmptyTea("rawPuerh", profileStore.activeProfileId),
);

const categoryOptions = enumToOptions(TEA_CATEGORY_LABELS);
const formOptions = enumToOptions(TEA_FORM_LABELS);
const seasonOptions = enumToOptions(HARVEST_SEASON_LABELS);
const treeAgeOptions = enumToOptions(TREE_AGE_LABELS);
const roastOptions = enumToOptions(ROAST_LEVEL_LABELS);
const storageOptions = enumToOptions(STORAGE_TYPE_LABELS);

const filteredTeas = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return teas.value.filter((tea) => {
    if (
      selectedCategory.value !== "all" &&
      tea.identity.category !== selectedCategory.value
    ) {
      return false;
    }
    if (!q) {
      return true;
    }
    const haystack = [
      tea.identity.name,
      tea.identity.originalName,
      tea.origin.regionOrMountain,
      tea.origin.province,
      tea.craft.cultivar,
      tea.production.brandOrFactory,
      ...tea.summary.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
});

function openCreateModal(): void {
  editingTea.value = createEmptyTea("rawPuerh", profileStore.activeProfileId);
  isEditorOpen.value = true;
}

function openEditModal(tea: Tea): void {
  editingTea.value = structuredClone(tea);
  isEditorOpen.value = true;
}

async function handleSaveTea(): Promise<void> {
  if (!editingTea.value.identity.name.trim()) {
    return;
  }
  await teaRepository.upsert(editingTea.value);
  isEditorOpen.value = false;
}

async function handleDeleteTea(id: string): Promise<void> {
  await teaRepository.softDelete(id);
  isEditorOpen.value = false;
}

async function handleBrewTea(teaId: string): Promise<void> {
  await navigateTo({ path: "/sessions/new", query: { teaId } });
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Чайная полка">
        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Добавить чай"
            @click="openCreateModal"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Название, гора, культивар..."
              class="w-64"
            />
            <USelect
              v-model="selectedCategory"
              :items="[
                { label: 'Все категории', value: 'all' },
                ...categoryOptions,
              ]"
              class="w-48"
            />
          </div>
        </template>
        <template #right>
          <span class="text-sm text-muted">
            Позиций: {{ filteredTeas.length }}
          </span>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="i in 6" :key="i" class="h-44 rounded-lg" />
      </div>

      <UEmpty
        v-else-if="filteredTeas.length === 0"
        icon="i-lucide-leaf"
        title="Чай не найден"
        description="Добавьте первый чай в свою коллекцию или измените параметры фильтра."
      >
        <template #actions>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Добавить чай"
            @click="openCreateModal"
          />
        </template>
      </UEmpty>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="tea in filteredTeas"
          :key="tea.meta.id"
          class="flex flex-col justify-between"
        >
          <template #header>
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate font-semibold text-highlighted">
                  {{ tea.identity.name }}
                </h3>
                <p>
                  {{ tea.identity.originalName }}
                </p>
              </div>
              <UBadge size="xs" color="primary" variant="subtle">
                {{ TEA_CATEGORY_LABELS[tea.identity.category] }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-2 text-sm">
            <div class="flex flex-wrap gap-1.5 text-xs text-muted">
              <span v-if="tea.craft.harvestYear"
                >{{ tea.craft.harvestYear }} г.</span
              >
              <span v-if="tea.origin.regionOrMountain"
                >· {{ tea.origin.regionOrMountain }}</span
              >
              <span v-if="tea.craft.cultivar">· {{ tea.craft.cultivar }}</span>
              <span v-if="tea.identity.form"
                >· {{ TEA_FORM_LABELS[tea.identity.form] }}</span
              >
            </div>

            <div
              v-if="tea.summary.tags.length > 0"
              class="flex flex-wrap gap-1 pt-1"
            >
              <UBadge
                v-for="tag in tea.summary.tags"
                :key="tag"
                size="xs"
                color="neutral"
                variant="outline"
              >
                #{{ tag }}
              </UBadge>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between gap-2">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                label="Паспорт"
                @click="openEditModal(tea)"
              />
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-play"
                label="Заварить"
                @click="handleBrewTea(tea.meta.id)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <USlideover v-model:open="isEditorOpen" title="Паспорт чая">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required> </UFormField>

            <UFormField label="Оригинальное название (кит. / пиньинь)">
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Категория"> </UFormField>
              <UFormField label="Форма"> </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Провинция">
                <UInput
                  v-model="editingTea.origin.province"
                  placeholder="Юньнань / Фуцзянь"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Гора / Регион">
                <UInput
                  v-model="editingTea.origin.regionOrMountain"
                  placeholder="Иу, Уишань..."
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Год сбора">
                <UInputNumber
                  v-model="editingTea.craft.harvestYear"
                  :min="1950"
                  :max="2100"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Год прессовки">
                <UInputNumber
                  v-model="editingTea.craft.pressingYear"
                  :min="1950"
                  :max="2100"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Сезон">
                <USelect
                  v-model="editingTea.craft.harvestSeason"
                  :items="seasonOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Возраст деревьев">
                <USelect
                  v-model="editingTea.craft.treeAge"
                  :items="treeAgeOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Культивар">
                <UInput
                  v-model="editingTea.craft.cultivar"
                  placeholder="Жоу Гуй, Да Бай Хао..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Прогрев">
                <USelect
                  v-model="editingTea.craft.roastLevel"
                  :items="roastOptions"
                  placeholder="Не указан"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Фабрика / Мастер">
                <UInput
                  v-model="editingTea.production.brandOrFactory"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Хранение">
                <USelect
                  v-model="editingTea.production.storageType"
                  :items="storageOptions"
                  placeholder="Не указано"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Теги">
              <UInputTags
                v-model="editingTea.summary.tags"
                placeholder="Добавить тег..."
                class="w-full"
              />
            </UFormField>

            <UFormField label="Заметка">
              <UTextarea
                v-model="editingTea.summary.note"
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
              @click="handleDeleteTea(editingTea.meta.id)"
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
