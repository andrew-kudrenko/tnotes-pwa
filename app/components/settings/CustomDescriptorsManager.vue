<script setup lang="ts">
import { computed, ref } from "vue";
import { useLexicon } from "../../composables/lexicon/use-lexicon";
import { useCustomDescriptorsQuery } from "../../composables/queries/use-custom-descriptors-query";
import type { CustomDescriptor } from "../../domain/lexicon/types";

const toast = useToast();
const { data: customDescriptors, isLoading } = useCustomDescriptorsQuery();
const {
  allDescriptors,
  getAncestors,
  addCustomDescriptor,
  updateCustomDescriptor,
  removeCustomDescriptor,
} = useLexicon();

const filterQuery = ref("");
const isModalOpen = ref(false);
const editingTarget = ref<CustomDescriptor | undefined>(undefined);

const formLabel = ref("");
const formParentCode = ref<string | undefined>(undefined);
const formAliases = ref<string[]>([]);
const formColor = ref("#16a34a");

const parentSelectItems = computed(() =>
  allDescriptors.value
    .filter((d) => !d.isCustom)
    .map((d) => ({
      label: `${"— ".repeat(Math.max(0, d.depth - 1))}${d.label}`,
      value: d.code,
    })),
);

const filteredList = computed(() => {
  const q = filterQuery.value.trim().toLowerCase();
  if (!q) {
    return customDescriptors.value;
  }
  return customDescriptors.value.filter(
    (d) =>
      d.label.toLowerCase().includes(q) ||
      d.aliases.some((a) => a.toLowerCase().includes(q)),
  );
});

function formatPath(descriptor: CustomDescriptor): string {
  const ancestors = getAncestors(descriptor.code);
  if (ancestors.length === 0) {
    return "Корневой уровень";
  }
  return ancestors.map((a) => a.label).join(" / ");
}

function openCreate(): void {
  editingTarget.value = undefined;
  formLabel.value = "";
  formParentCode.value = undefined;
  formAliases.value = [];
  formColor.value = "#16a34a";
  isModalOpen.value = true;
}

function openEdit(item: CustomDescriptor): void {
  editingTarget.value = item;
  formLabel.value = item.label;
  formParentCode.value = item.parentCode;
  formAliases.value = [...item.aliases];
  formColor.value = item.color ?? "#16a34a";
  isModalOpen.value = true;
}

async function handleSave(): Promise<void> {
  if (!formLabel.value.trim()) {
    return;
  }
  if (editingTarget.value) {
    await updateCustomDescriptor(editingTarget.value, {
      label: formLabel.value,
      aliases: formAliases.value,
      color: formColor.value,
    });
    toast.add({ title: "Дескриптор обновлен", color: "success" });
  } else {
    await addCustomDescriptor({
      label: formLabel.value,
      parentCode: formParentCode.value,
      aliases: formAliases.value,
      color: formColor.value,
    });
    toast.add({ title: "Дескриптор создан", color: "success" });
  }
  isModalOpen.value = false;
}

async function handleDelete(item: CustomDescriptor): Promise<void> {
  await removeCustomDescriptor(item.meta.id);
  toast.add({ title: "Дескриптор удален", color: "neutral" });
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="font-semibold text-highlighted">
            Пользовательские дескрипторы
          </h2>
          <p class="text-xs text-muted">
            Ваши личные ассоциации, встроенные в дерево ароматов и вкусов
          </p>
        </div>
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-lucide-plus"
          label="Создать дескриптор"
          @click="openCreate"
        />
      </div>
    </template>

    <div class="space-y-4">
      <UInput
        v-if="customDescriptors.length > 0"
        v-model="filterQuery"
        icon="i-lucide-search"
        placeholder="Фильтр по названию или синониму..."
        class="w-full"
      />

      <div v-if="isLoading" class="space-y-2">
        <USkeleton class="h-12 rounded-lg" />
        <USkeleton class="h-12 rounded-lg" />
      </div>

      <p v-else-if="customDescriptors.length === 0" class="text-sm text-muted">
        У вас пока нет собственных дескрипторов. Вы можете создать их здесь или
        прямо во время дегустации через поиск.
      </p>

      <div
        v-else
        class="divide-y divide-default rounded-lg border border-default"
      >
        <div
          v-for="item in filteredList"
          :key="item.meta.id"
          class="flex items-center justify-between gap-3 p-3"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: item.color ?? '#16a34a' }"
              />
              <span class="truncate font-medium text-highlighted">{{
                item.label
              }}</span>
            </div>
            <p class="mt-0.5 truncate text-xs text-muted">
              {{ formatPath(item) }}
              <span v-if="item.aliases.length > 0">
                · Синонимы: {{ item.aliases.join(", ") }}
              </span>
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="openEdit(item)"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="handleDelete(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isModalOpen"
      :title="editingTarget ? 'Редактировать дескриптор' : 'Новый дескриптор'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Название" required>
            <UInput
              v-model="formLabel"
              placeholder="Например: Березовый сок"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="!editingTarget"
            label="Родительская категория (опционально)"
          >
            <USelectMenu
              v-model="formParentCode"
              :items="parentSelectItems"
              value-key="value"
              placeholder="Корневой уровень"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Синонимы для быстрого поиска">
            <UInputTags
              v-model="formAliases"
              placeholder="Введите синоним и нажмите Enter..."
              class="w-full"
            />
          </UFormField>

          <UFormField label="Цвет метки">
            <div class="flex items-center gap-3">
              <input
                v-model="formColor"
                type="color"
                class="h-9 w-14 cursor-pointer rounded border border-default bg-transparent"
              />
              <span class="font-mono text-xs text-muted">{{ formColor }}</span>
            </div>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            label="Отмена"
            @click="isModalOpen = false"
          />
          <UButton
            color="primary"
            label="Сохранить"
            :disabled="!formLabel.trim()"
            @click="handleSave"
          />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
