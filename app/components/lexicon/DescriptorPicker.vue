<script setup lang="ts">
import { useLexicon } from "../../composables/lexicon/use-lexicon";
import type { Descriptor } from "../../domain/lexicon/types";

const props = defineProps<{
  modelValue: string[];
  label?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [codes: string[]];
}>();

const {
  allDescriptors,
  rootDescriptors,
  getByCode,
  resolveMany,
  getAncestors,
  search,
  addCustomDescriptor,
} = useLexicon();

const isOpen = ref(false);
const searchQuery = ref("");
const activeParentCode = ref<string | undefined>(undefined);
const isCreatingCustom = ref(false);

const selectedDescriptors = computed(() => resolveMany(props.modelValue));

const breadcrumbs = computed<Descriptor[]>(() => {
  if (!activeParentCode.value) {
    return [];
  }
  const current = getByCode(activeParentCode.value);
  if (!current) {
    return [];
  }
  return [...getAncestors(current.code), current];
});

const visibleDescriptors = computed<Descriptor[]>(() => {
  const q = searchQuery.value.trim();
  if (q.length > 0) {
    return search(q, 40);
  }
  if (!activeParentCode.value) {
    return rootDescriptors.value;
  }
  return allDescriptors.value.filter(
    (d) => d.parentCode === activeParentCode.value,
  );
});

function hasChildren(code: string): boolean {
  return allDescriptors.value.some((d) => d.parentCode === code);
}

function isSelected(code: string): boolean {
  return props.modelValue.includes(code);
}

function toggleCode(code: string): void {
  if (isSelected(code)) {
    emit(
      "update:modelValue",
      props.modelValue.filter((c) => c !== code),
    );
  } else {
    emit("update:modelValue", [...props.modelValue, code]);
  }
}

function removeCode(code: string): void {
  emit(
    "update:modelValue",
    props.modelValue.filter((c) => c !== code),
  );
}

async function handleCreateCustom(): Promise<void> {
  const name = searchQuery.value.trim();
  if (!name || isCreatingCustom.value) {
    return;
  }
  isCreatingCustom.value = true;
  try {
    const created = await addCustomDescriptor({
      label: name,
      parentCode: activeParentCode.value,
    });
    if (!isSelected(created.code)) {
      emit("update:modelValue", [...props.modelValue, created.code]);
    }
    searchQuery.value = "";
  } finally {
    isCreatingCustom.value = false;
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-1.5">
      <UBadge
        v-for="item in selectedDescriptors"
        :key="item.code"
        size="md"
        color="neutral"
        variant="subtle"
        class="gap-1.5 pr-1"
      >
        <span
          v-if="item.color"
          class="size-2 rounded-full"
          :style="{ backgroundColor: item.color }"
        />
        <span>{{ item.label }}</span>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          @click="removeCode(item.code)"
        />
      </UBadge>

      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-plus"
        :label="placeholder ?? 'Добавить дескриптор'"
        @click="isOpen = true"
      />
    </div>

    <UDrawer v-model:open="isOpen" :title="label ?? 'Выбор дескрипторов'">
      <template #body>
        <div class="mx-auto max-w-2xl space-y-4 pb-6">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Поиск по названию или синониму (урюк, камфора, мед)..."
            autofocus
            class="w-full"
          >
            <template v-if="searchQuery" #trailing>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="searchQuery = ''"
              />
            </template>
          </UInput>

          <div
            v-if="!searchQuery.trim() && breadcrumbs.length > 0"
            class="flex flex-wrap items-center gap-1 text-xs"
          >
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="Все категории"
              @click="activeParentCode = undefined"
            />
            <template v-for="crumb in breadcrumbs" :key="crumb.code">
              <span class="text-muted">/</span>
              <UButton
                size="xs"
                :color="crumb.code === activeParentCode ? 'primary' : 'neutral'"
                variant="ghost"
                :label="crumb.label"
                @click="activeParentCode = crumb.code"
              />
            </template>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="item in visibleDescriptors"
              :key="item.code"
              class="flex items-center justify-between rounded-lg border p-2.5 transition"
              :class="
                isSelected(item.code)
                  ? 'border-primary bg-primary/10'
                  : 'border-default hover:bg-elevated'
              "
            >
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left"
                @click="toggleCode(item.code)"
              >
                <span
                  v-if="item.color"
                  class="size-2.5 shrink-0 rounded-full"
                  :style="{ backgroundColor: item.color }"
                />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-highlighted">
                    {{ item.label }}
                  </p>
                  <p
                    v-if="searchQuery.trim() && item.parentCode"
                    class="truncate text-xs text-muted"
                  >
                    {{ getByCode(item.parentCode)?.label }}
                  </p>
                </div>
              </button>

              <div class="flex items-center gap-1">
                <UIcon
                  v-if="isSelected(item.code)"
                  name="i-lucide-check"
                  class="size-4 text-primary"
                />
                <UButton
                  v-if="!searchQuery.trim() && hasChildren(item.code)"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-right"
                  @click.stop="activeParentCode = item.code"
                />
              </div>
            </div>
          </div>

          <div
            v-if="searchQuery.trim().length > 0"
            class="flex items-center justify-between rounded-lg border border-dashed border-default p-3"
          >
            <div class="text-sm">
              <p class="font-medium text-highlighted">
                Не нашли нужный оттенок?
              </p>
              <p class="text-xs text-muted">
                Создать свой дескриптор «{{ searchQuery.trim() }}»
              </p>
            </div>
            <UButton
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              label="Создать"
              :loading="isCreatingCustom"
              @click="handleCreateCustom"
            />
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
