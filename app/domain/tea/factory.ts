import type { TeaCategory } from "../shared/enums";
import { createEntityMeta } from "../shared/factory";
import type { Tea } from "./types";

export function createEmptyTea(
  category: TeaCategory = "rawPuerh",
  authorId?: string,
): Tea {
  return {
    meta: createEntityMeta(authorId),
    identity: {
      name: "",
      originalName: undefined,
      category,
      subCategory: undefined,
      form: undefined,
    },
    origin: {
      country: "China",
      province: undefined,
      regionOrMountain: undefined,
      altitudeInMeters: undefined,
    },
    craft: {
      harvestYear: undefined,
      pressingYear: undefined,
      harvestSeason: undefined,
      cultivar: undefined,
      treeAge: undefined,
      roastLevel: undefined,
    },
    production: {
      brandOrFactory: undefined,
      batchNumber: undefined,
      storageType: undefined,
    },
    inventory: {
      initialWeightInGrams: undefined,
      remainingWeightInGrams: undefined,
      price: undefined,
      currency: undefined,
      vendor: undefined,
    },
    summary: {
      tags: [],
      note: undefined,
    },
  };
}
