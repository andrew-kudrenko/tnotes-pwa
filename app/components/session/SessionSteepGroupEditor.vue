<script setup lang="ts">
import type { SteepGroup } from "../../domain/session/types";
import type { TasteScore } from "../../domain/shared/enums";
import {
  ASTRINGENCY_LABELS,
  BRIGHTNESS_LABELS,
  CLARITY_LABELS,
  DENSITY_LABELS,
  enumToOptions,
  HUI_GAN_LABELS,
  SHENG_JIN_ZONE_LABELS,
  TEXTURE_LABELS,
} from "../../domain/shared/labels";
import DescriptorPicker from "../lexicon/DescriptorPicker.vue";

const group = defineModel<SteepGroup>({ required: true });

defineProps<{
  groupIndex: number;
  canDelete: boolean;
  timerSeconds: number;
}>();

const emit = defineEmits<{
  delete: [];
  applyTimer: [];
}>();

const clarityOptions = enumToOptions(CLARITY_LABELS);
const brightnessOptions = enumToOptions(BRIGHTNESS_LABELS);
const densityOptions = enumToOptions(DENSITY_LABELS);
const textureOptions = enumToOptions(TEXTURE_LABELS);
const astringencyOptions = enumToOptions(ASTRINGENCY_LABELS);
const shengJinOptions = enumToOptions(SHENG_JIN_ZONE_LABELS);
const huiGanOptions = enumToOptions(HUI_GAN_LABELS);

const tasteFields: Array<{
  key: "sweetness" | "acidity" | "bitterness" | "umami" | "salty";
  label: string;
}> = [
  { key: "sweetness", label: "Сладость" },
  { key: "acidity", label: "Кислотность" },
  { key: "bitterness", label: "Горечь" },
  { key: "umami", label: "Умами" },
  { key: "salty", label: "Соленость" },
];

function setTasteScore(
  key: "sweetness" | "acidity" | "bitterness" | "umami" | "salty",
  raw: number | undefined,
): void {
  if (raw === undefined || raw === null || Number.isNaN(raw)) {
    group.value.sensorics.tastes[key] = undefined;
    return;
  }
  group.value.sensorics.tastes[key] = Math.max(
    0,
    Math.min(10, Math.round(raw)),
  ) as TasteScore;
}
</script>

<template>
  <div class="space-y-5 pt-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium uppercase tracking-wider text-muted">
        Параметры группы #{{ groupIndex + 1 }}
      </span>
      <UButton
        v-if="canDelete"
        size="xs"
        color="error"
        variant="ghost"
        icon="i-lucide-trash-2"
        label="Удалить группу"
        @click="emit('delete')"
      />
    </div>

    <div class="grid gap-3 sm:grid-cols-4">
      <UFormField label="С пролива">
        <UInputNumber
          v-model="group.setup.groupStartIndex"
          :min="1"
          :max="100"
          class="w-full"
        />
      </UFormField>

      <UFormField label="По пролив (опц.)">
        <UInputNumber
          v-model="group.setup.groupEndIndex"
          :min="group.setup.groupStartIndex"
          :max="100"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Температура (°C)">
        <UInputNumber
          v-model="group.setup.temperatureInCelsius"
          :min="0"
          :max="100"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Экспозиция (сек)">
        <div class="flex items-center gap-1">
          <UInputNumber
            v-model="group.setup.durationInSeconds"
            :min="1"
            :max="3600"
            class="w-full"
          />
          <UButton
            v-if="timerSeconds > 0"
            size="xs"
            color="primary"
            variant="soft"
            icon="i-lucide-timer"
            @click="emit('applyTimer')"
          />
        </div>
      </UFormField>
    </div>

    <USeparator label="Аромат" />

    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField label="С пара / из гайвани">
        <DescriptorPicker
          v-model="group.sensorics.aromas.steamDescriptorCodes"
          label="Аромат с пара"
          placeholder="Добавить"
        />
      </UFormField>

      <UFormField label="Ретроназальный">
        <DescriptorPicker
          v-model="group.sensorics.aromas.retronasalDescriptorCodes"
          label="Ретроназальный аромат"
          placeholder="Добавить"
        />
      </UFormField>

      <UFormField label="Со дна пиалы">
        <DescriptorPicker
          v-model="group.sensorics.aromas.cupBottomDescriptorCodes"
          label="Аромат со дна пиалы"
          placeholder="Добавить"
        />
      </UFormField>
    </div>

    <USeparator label="Базовые вкусы (0–10)" />

    <div class="grid gap-4 sm:grid-cols-5">
      <UFormField
        v-for="taste in tasteFields"
        :key="taste.key"
        :label="`${taste.label}: ${group.sensorics.tastes[taste.key] ?? '—'}`"
      >
        <USlider
          :model-value="group.sensorics.tastes[taste.key] ?? 0"
          :min="0"
          :max="10"
          :step="1"
          @update:model-value="(val) => setTasteScore(taste.key, val)"
        />
      </UFormField>
    </div>

    <USeparator label="Тактильность и послевкусие" />

    <div class="grid gap-3 sm:grid-cols-3">
      <UFormField label="Плотность / Тело">
        <USelect
          v-model="group.sensorics.mouthfeel.density"
          :items="densityOptions"
          placeholder="Не указана"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Текстура">
        <USelect
          v-model="group.sensorics.mouthfeel.texture"
          :items="textureOptions"
          placeholder="Не указана"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Терпкость">
        <USelect
          v-model="group.sensorics.mouthfeel.astringency"
          :items="astringencyOptions"
          placeholder="Не указана"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <UFormField label="Хуэй Гань">
        <USelect
          v-model="group.sensorics.mouthfeel.huiGan"
          :items="huiGanOptions"
          placeholder="Не указано"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Зоны Шэн Цзинь">
        <USelectMenu
          v-model="group.sensorics.mouthfeel.shengJinZones"
          :items="shengJinOptions"
          value-key="value"
          multiple
          placeholder="Выбрать зоны"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Холодок">
        <USwitch
          v-model="group.sensorics.mouthfeel.isCooling"
          label="Ощущается холодок"
          class="pt-1.5"
        />
      </UFormField>
    </div>

    <USeparator label="Визуал настоя" />

    <div class="grid gap-3 sm:grid-cols-3">
      <UFormField label="Прозрачность">
        <USelect
          v-model="group.sensorics.visual.clarity"
          :items="clarityOptions"
          placeholder="Не указана"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Яркость">
        <USelect
          v-model="group.sensorics.visual.brightness"
          :items="brightnessOptions"
          placeholder="Не указана"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Цвет настоя">
        <div class="flex items-center gap-2">
          <input
            :value="group.sensorics.visual.colorInCIELab ?? '#eab308'"
            type="color"
            class="h-9 w-12 cursor-pointer rounded border border-default bg-transparent"
            @input="
              (e) =>
                (group.sensorics.visual.colorInCIELab = (
                  e.target as HTMLInputElement
                ).value)
            "
          />
          <span class="font-mono text-xs text-muted">
            {{ group.sensorics.visual.colorInCIELab ?? "не задан" }}
          </span>
          <UButton
            v-if="group.sensorics.visual.colorInCIELab"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="group.sensorics.visual.colorInCIELab = undefined"
          />
        </div>
      </UFormField>
    </div>

    <div class="space-y-3">
      <UFormField
        :label="`Оценка этапа: ${group.summary.rating !== undefined ? `${group.summary.rating} / 10` : 'не указана'}`"
      >
        <div class="flex flex-wrap items-center gap-3">
          <UInputRating v-model="group.summary.rating" clearable :length="10" />

          <UButton
            v-if="group.summary.rating !== undefined"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            label="Сбросить"
            @click="group.summary.rating = undefined"
          />
        </div>
      </UFormField>

      <UFormField label="Заметка по группе">
        <UInput
          v-model="group.summary.note"
          placeholder="Динамика вкуса, изменения на этих проливах..."
          class="w-full"
        />
      </UFormField>
    </div>
  </div>
</template>
