import type { TeawareMaterial, TeawareType } from "../shared/enums";
import { createEntityMeta } from "../shared/factory";
import type { Teaware } from "./types";

export function createEmptyTeaware(
  type: TeawareType = "gaiwan",
  material: TeawareMaterial = "porcelain",
  authorId?: string,
): Teaware {
  return {
    meta: createEntityMeta(authorId),
    identity: {
      name: "",
      type,
      shape: undefined,
    },
    material: {
      material,
      subType: undefined,
      porosity: undefined,
      wallThickness: undefined,
    },
    specs: {
      volumeInMilliliters: undefined,
      pourSpeed: undefined,
      filterType: undefined,
    },
    summary: {
      dedicatedTeaCategories: [],
      tags: [],
      note: undefined,
    },
  };
}
