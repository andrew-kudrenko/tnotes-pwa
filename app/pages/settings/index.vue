<script setup lang="ts">
import { ref } from "vue";
import {
  exportDatabaseToJsonString,
  importFromJsonString,
} from "../../infrastructure/backup/service";
import type { ImportStrategy } from "../../infrastructure/backup/types";
import { seedMockData } from "../../infrastructure/mocks/seed";
import { useProfileStore } from "../../stores/profile.store";
import { useSyncStore } from "../../stores/sync.store";
import CustomDescriptorsManager from "~/components/settings/CustomDescriptorsManager.vue";
import CloudAccountCard from "~/components/settings/CloudAccountCard.vue";
import SyncConflictsCard from "~/components/settings/SyncConflictsCard.vue";

useHead({ title: "Настройки" });

const toast = useToast();
const profileStore = useProfileStore();
const syncStore = useSyncStore();

const newProfileName = ref("");
const importStrategy = ref<ImportStrategy>("merge");
const isBusy = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const strategyOptions: Array<{ label: string; value: ImportStrategy }> = [
  { label: "Умное слияние (по дате изменения)", value: "merge" },
  {
    label: "Только новые записи (пропустить существующие)",
    value: "skipExisting",
  },
  { label: "Полная замена текущей базы", value: "replace" },
];

function handleCreateProfile(): void {
  const name = newProfileName.value.trim();
  if (!name) {
    return;
  }
  profileStore.createProfile(name);
  newProfileName.value = "";
  toast.add({
    title: "Профиль создан",
    description: `Активный профиль: ${name}`,
    color: "success",
  });
}

async function handleExport(): Promise<void> {
  isBusy.value = true;
  try {
    const json = await exportDatabaseToJsonString(true, true);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `tea-tasting-backup-${dateStamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: "Экспорт завершен",
      description: "Резервная копия сохранена в JSON-файл",
      color: "success",
    });
  } catch (error: unknown) {
    toast.add({
      title: "Ошибка экспорта",
      description:
        error instanceof Error ? error.message : "Неизвестная ошибка",
      color: "error",
    });
  } finally {
    isBusy.value = false;
  }
}

function triggerFileSelect(): void {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  isBusy.value = true;
  try {
    const text = await file.text();
    const stats = await importFromJsonString(text, importStrategy.value);

    toast.add({
      title: "Импорт выполнен",
      description: `Добавлено: ${stats.inserted}, обновлено: ${stats.updated}, пропущено: ${stats.skipped}`,
      color: "success",
    });
  } catch (error: unknown) {
    toast.add({
      title: "Ошибка импорта",
      description: error instanceof Error ? error.message : "Некорректный файл",
      color: "error",
    });
  } finally {
    input.value = "";
    isBusy.value = false;
  }
}

async function handleSeedMocks(): Promise<void> {
  isBusy.value = true;
  try {
    await seedMockData(profileStore.activeProfileId);
    toast.add({
      title: "Демо-данные загружены",
      color: "success",
    });
  } finally {
    isBusy.value = false;
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Настройки и резервное копирование">
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto max-w-3xl space-y-6">
        <CloudAccountCard />

        <SyncConflictsCard />

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Локальные профили (Мультиаккаунт)
            </h2>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-muted">
              Каждый профиль использует изолированную локальную базу данных в
              браузере.
            </p>

            <div class="space-y-2">
              <div
                class="flex items-center justify-between rounded-lg border border-default p-3"
                :class="
                  profileStore.activeProfileId === undefined
                    ? 'border-primary bg-primary/5'
                    : ''
                "
              >
                <div>
                  <p class="font-medium text-highlighted">
                    Локальный профиль (по умолчанию)
                  </p>
                  <p class="text-xs text-muted">
                    Базовая локальная база устройства
                  </p>
                </div>
                <UButton
                  size="xs"
                  :color="
                    profileStore.activeProfileId === undefined
                      ? 'primary'
                      : 'neutral'
                  "
                  :variant="
                    profileStore.activeProfileId === undefined
                      ? 'solid'
                      : 'outline'
                  "
                  :label="
                    profileStore.activeProfileId === undefined
                      ? 'Активен'
                      : 'Выбрать'
                  "
                  @click="profileStore.switchProfile(undefined)"
                />
              </div>

              <div
                v-for="profile in profileStore.profiles"
                :key="profile.id"
                class="flex items-center justify-between rounded-lg border border-default p-3"
                :class="
                  profileStore.activeProfileId === profile.id
                    ? 'border-primary bg-primary/5'
                    : ''
                "
              >
                <div>
                  <p class="font-medium text-highlighted">{{ profile.name }}</p>
                  <p class="text-xs text-muted">
                    ID: {{ profile.id.slice(0, 8) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    size="xs"
                    :color="
                      profileStore.activeProfileId === profile.id
                        ? 'primary'
                        : 'neutral'
                    "
                    :variant="
                      profileStore.activeProfileId === profile.id
                        ? 'solid'
                        : 'outline'
                    "
                    :label="
                      profileStore.activeProfileId === profile.id
                        ? 'Активен'
                        : 'Выбрать'
                    "
                    @click="profileStore.switchProfile(profile.id)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="profileStore.removeProfile(profile.id)"
                  />
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <UInput
                v-model="newProfileName"
                placeholder="Имя нового профиля..."
                class="flex-1"
                @keyup.enter="handleCreateProfile"
              />
              <UButton
                color="primary"
                icon="i-lucide-user-plus"
                label="Создать"
                :disabled="!newProfileName.trim()"
                @click="handleCreateProfile"
              />
            </div>
          </div>
        </UCard>

        <CustomDescriptorsManager />

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Экспорт и импорт данных (JSON)
            </h2>
          </template>

          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-medium text-highlighted">
                  Выгрузить резервную копию
                </p>
                <p class="text-xs text-muted">
                  Сохраняет все сессии, чаи, воду, посуду и пользовательские
                  дескрипторы активного профиля.
                </p>
              </div>
              <UButton
                color="primary"
                variant="soft"
                icon="i-lucide-download"
                label="Экспорт в JSON"
                :loading="isBusy"
                @click="handleExport"
              />
            </div>

            <USeparator />

            <div class="space-y-3">
              <div>
                <p class="font-medium text-highlighted">Загрузить из файла</p>
                <p class="text-xs text-muted">
                  Выберите режим обработки совпадающих записей перед импортом.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <USelect
                  v-model="importStrategy"
                  :items="strategyOptions"
                  class="w-full sm:w-80"
                />
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="application/json,.json"
                  class="hidden"
                  @change="handleFileChange"
                />
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-upload"
                  label="Выбрать JSON-файл"
                  :loading="isBusy"
                  @click="triggerFileSelect"
                />
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Приложение, PWA и диагностика
            </h2>
          </template>

          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="text-sm">
                <p class="text-highlighted">
                  Режим приложения:
                  <span class="font-medium">
                    {{ $pwa?.isPWAInstalled ? "Установлено (PWA)" : "Браузер" }}
                  </span>
                </p>
                <p class="text-xs text-muted">
                  Оффлайн-кэш:
                  {{
                    $pwa?.offlineReady ? "готов к работе без сети" : "активен"
                  }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  v-if="$pwa?.needRefresh"
                  size="xs"
                  color="warning"
                  variant="soft"
                  icon="i-lucide-refresh-cw"
                  label="Обновить версию"
                  @click="$pwa?.updateServiceWorker()"
                />
                <UButton
                  v-if="$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled"
                  size="xs"
                  color="primary"
                  icon="i-lucide-download"
                  label="Установить на устройство"
                  @click="$pwa?.install()"
                />
              </div>
            </div>

            <USeparator />

            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="text-sm">
                <p class="text-highlighted">
                  Статус сети:
                  <span class="font-medium">{{
                    syncStore.isOnline ? "Онлайн" : "Оффлайн"
                  }}</span>
                </p>
                <p class="text-xs text-muted">
                  В очереди на отправку (Outbox): {{ syncStore.pendingCount }}
                </p>
              </div>

              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-sparkles"
                label="Заполнить демо-данными"
                :loading="isBusy"
                @click="handleSeedMocks"
              />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
