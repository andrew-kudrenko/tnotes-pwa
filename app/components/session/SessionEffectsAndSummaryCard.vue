<script setup lang="ts">
import type {
  TastingSessionEffects,
  TastingSessionSummary,
} from "../../domain/session/types";
import {
  enumToOptions,
  MENTAL_EFFECT_LABELS,
  SOMATIC_EFFECT_LABELS,
} from "../../domain/shared/labels";

const effects = defineModel<TastingSessionEffects>("effects", {
  required: true,
});
const summary = defineModel<TastingSessionSummary>("summary", {
  required: true,
});

const somaticEffectOptions = enumToOptions(SOMATIC_EFFECT_LABELS);
const mentalEffectOptions = enumToOptions(MENTAL_EFFECT_LABELS);
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">5. Состояние и Ча Ци</h2>
      </template>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Соматическое воздействие (тело)">
            <USelectMenu
              v-model="effects.somatic"
              :items="somaticEffectOptions"
              value-key="value"
              multiple
              placeholder="Выбрать ощущения"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Ментальное воздействие">
            <USelectMenu
              v-model="effects.mental"
              :items="mentalEffectOptions"
              value-key="value"
              multiple
              placeholder="Выбрать состояния"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Заметка о воздействии">
          <UTextarea v-model="effects.note" :rows="2" class="w-full" />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">6. Итоги сессии</h2>
      </template>

      <div class="space-y-4">
        <UFormField
          :label="`Общая оценка: ${summary.ratingTotal !== undefined ? `${summary.ratingTotal} / 10` : 'не указана'}`"
        >
          <div class="flex flex-wrap items-center gap-3">
            <UInputRating
              v-model="summary.ratingTotal"
              clearable
              :length="10"
              size="lg"
            />
            <UButton
              v-if="summary.ratingTotal !== undefined"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              label="Сбросить"
              @click="summary.ratingTotal = undefined"
            />
          </div>
        </UFormField>

        <UFormField label="Теги сессии">
          <UInputTags
            v-model="summary.tags"
            placeholder="Добавить тег..."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Финальный вывод">
          <UTextarea
            v-model="summary.note"
            :rows="3"
            placeholder="Общее впечатление, рекомендации по следующему завариванию..."
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
