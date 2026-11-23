import { createEntityMeta } from "../shared/factory";
import type { Water } from "./types";

export function createEmptyWater(authorId?: string): Water {
  return {
    meta: createEntityMeta(authorId),
    identity: {
      name: "",
      brand: undefined,
      sourceType: undefined,
    },
    metrics: {
      tdsInPpm: undefined,
      ph: undefined,
      generalHardness: undefined,
      carbonateHardness: undefined,
    },
    summary: {
      tags: [],
      note: undefined,
    },
  };
}
