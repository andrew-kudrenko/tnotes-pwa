<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { createEmptyTastingSession } from "../domain/session/factory";
import { sessionRepository } from "../infrastructure/repositories/session.repository";
import { useProfileStore } from "../stores/profile.store";
import { useSyncStore } from "../stores/sync.store";

const router = useRouter();
const profileStore = useProfileStore();
const syncStore = useSyncStore();

const primaryNavigation = computed<NavigationMenuItem[]>(() => [
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
]);

const secondaryNavigation = computed<NavigationMenuItem[]>(() => [
  {
    label: "Настройки и бэкап",
    icon: "i-lucide-settings",
    to: "/settings",
  },
]);

async function handleStartNewSession(): Promise<void> {
  await navigateTo("/sessions/new");
}
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      collapsible
      resizable
      :min-size="14"
      :default-size="16"
      :max-size="20"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2.5 px-2 py-1">
          <UIcon name="i-lucide-sprout" class="size-6 shrink-0 text-primary" />

          <span
            v-if="!collapsed"
            class="truncate font-semibold tracking-tight text-highlighted"
          >
            Ча Хэ · Дневник
          </span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="px-2 pb-2">
          <UButton
            block
            color="primary"
            icon="i-lucide-plus"
            :label="collapsed ? undefined : 'Новая дегустация'"
            @click="handleStartNewSession"
          />
        </div>

        <UNavigationMenu
          :collapsed="collapsed"
          :items="primaryNavigation"
          orientation="vertical"
        />

        <div class="mt-auto">
          <UNavigationMenu
            :collapsed="collapsed"
            :items="secondaryNavigation"
            orientation="vertical"
          />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div
          class="flex w-full items-center justify-between gap-2 border-t border-default px-2 pt-2 text-xs text-muted"
        >
          <div class="flex items-center gap-2 truncate">
            <span
              class="size-2 shrink-0 rounded-full"
              :class="syncStore.isOnline ? 'bg-success' : 'bg-warning'"
            />
            <span v-if="!collapsed" class="truncate">
              {{ profileStore.activeProfile?.name ?? "Локальный профиль" }}
            </span>
          </div>
          <UBadge
            v-if="!collapsed && syncStore.pendingCount > 0"
            size="xs"
            color="neutral"
            variant="subtle"
          >
            {{ syncStore.pendingCount }}
          </UBadge>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
