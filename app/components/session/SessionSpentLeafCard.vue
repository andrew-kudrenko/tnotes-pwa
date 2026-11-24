<script setup lang="ts">
import type { TastingSessionSpentLeaf } from "../../domain/session/types";
import {
  enumToOptions,
  LEAF_ELASTICITY_LABELS,
  LEAF_INTEGRITY_LABELS,
  LEAF_UNIFORMITY_LABELS,
} from "../../domain/shared/labels";
import DescriptorPicker from "../lexicon/DescriptorPicker.vue";

const spentLeaf = defineModel<TastingSessionSpentLeaf>({ required: true });

const leafIntegrityOptions = enumToOptions(LEAF_INTEGRITY_LABELS);
const leafElasticityOptions = enumToOptions(LEAF_ELASTICITY_LABELS);
const leafUniformityOptions = enumToOptions(LEAF_UNIFORMITY_LABELS);
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">4. Спитой лист (Развар)</h2>
    </template>

    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <UFormField label="Целостность">
          <USelect
            v-model="spentLeaf.integrity"
            :items="leafIntegrityOptions"
            placeholder="Не указана"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Эластичность">
          <USelect
            v-model="spentLeaf.elasticity"
            :items="leafElasticityOptions"
            placeholder="Не указана"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Однородность">
          <USelect
            v-model="spentLeaf.uniformity"
            :items="leafUniformityOptions"
            placeholder="Не указана"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Аромат остывшего листа">
        <DescriptorPicker
          v-model="spentLeaf.descriptorCodes"
          label="Аромат развара"
          placeholder="Выбрать ноты развара"
        />
      </UFormField>

      <UFormField label="Заметка о разваре">
        <UTextarea v-model="spentLeaf.note" :rows="2" class="w-full" />
      </UFormField>
    </div>
  </UCard>
</template>
