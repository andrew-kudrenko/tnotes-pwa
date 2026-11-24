<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { useSyncStore } from "../../stores/sync.store";

const toast = useToast();
const authStore = useAuthStore();
const syncStore = useSyncStore();

const mode = ref<"login" | "register">("login");
const name = ref("");
const email = ref("");
const password = ref("");
const isMigrating = ref(false);

async function handleSubmit(): Promise<void> {
  try {
    if (mode.value === "login") {
      await authStore.login({ email: email.value, password: password.value });
      toast.add({ title: "Вход выполнен", color: "success" });
    } else {
      await authStore.register({
        name: name.value,
        email: email.value,
        password: password.value,
      });
      toast.add({ title: "Аккаунт зарегистрирован", color: "success" });
    }
    password.value = "";
  } catch (err: unknown) {
    toast.add({
      title: "Ошибка авторизации",
      description: err instanceof Error ? err.message : "Проверьте данные",
      color: "error",
    });
  }
}

async function handleMigrateGuestData(): Promise<void> {
  isMigrating.value = true;
  try {
    const stats = await authStore.migrateLocalGuestDataToAccount();
    toast.add({
      title: "Локальные данные перенесены",
      description: `Добавлено: ${stats.inserted}, обновлено: ${stats.updated}`,
      color: "success",
    });
  } finally {
    isMigrating.value = false;
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  toast.add({ title: "Вы вышли из облачного аккаунта", color: "neutral" });
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-semibold text-highlighted">
            Облачный аккаунт и синхронизация
          </h2>
          <p class="text-xs text-muted">
            Эмулятор облачного бэкенда для проверки авторизации и sync-очереди
          </p>
        </div>
        <UBadge
          :color="authStore.isAuthenticated ? 'success' : 'neutral'"
          variant="subtle"
          size="xs"
        >
          {{ authStore.isAuthenticated ? "Подключено" : "Автономный режим" }}
        </UBadge>
      </div>
    </template>

    <div v-if="authStore.isAuthenticated && authStore.user" class="space-y-4">
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default p-3"
      >
        <div>
          <p class="font-medium text-highlighted">{{ authStore.user.name }}</p>
          <p class="text-xs text-muted">{{ authStore.user.email }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            icon="i-lucide-refresh-cw"
            label="Синхронизировать"
            :loading="syncStore.engineState.isSyncing"
            @click="syncStore.triggerSync()"
          />
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            label="Выйти"
            :loading="authStore.isLoading"
            @click="handleLogout"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div class="text-xs text-muted">
          <p v-if="syncStore.engineState.lastSyncedAt">
            Последняя синхронизация:
            {{
              new Date(syncStore.engineState.lastSyncedAt).toLocaleTimeString(
                "ru-RU",
              )
            }}
          </p>
          <p v-if="syncStore.engineState.lastError" class="text-error">
            {{ syncStore.engineState.lastError }}
          </p>
        </div>

        <UButton
          size="xs"
          color="neutral"
          variant="subtle"
          icon="i-lucide-folder-input"
          label="Перенести данные из гостевого профиля"
          :loading="isMigrating"
          @click="handleMigrateGuestData"
        />
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="flex gap-2">
        <UButton
          size="xs"
          :color="mode === 'login' ? 'primary' : 'neutral'"
          :variant="mode === 'login' ? 'solid' : 'outline'"
          label="Вход"
          @click="mode = 'login'"
        />
        <UButton
          size="xs"
          :color="mode === 'register' ? 'primary' : 'neutral'"
          :variant="mode === 'register' ? 'solid' : 'outline'"
          label="Регистрация"
          @click="mode = 'register'"
        />
      </div>

      <form class="space-y-3" @submit.prevent="handleSubmit">
        <UFormField v-if="mode === 'register'" label="Имя" required>
          <UInput
            v-model="name"
            placeholder="Как к вам обращаться"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Email" required>
            <UInput
              v-model="email"
              type="email"
              placeholder="tea@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Пароль" required>
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full"
            />
          </UFormField>
        </div>

        <UButton
          type="submit"
          color="primary"
          :label="mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'"
          :loading="authStore.isLoading"
        />
      </form>
    </div>
  </UCard>
</template>
