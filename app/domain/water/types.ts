import type { WaterSourceType } from "../shared/enums";
import type { EntityMeta } from "../shared/meta";

export interface Water {
  meta: EntityMeta;
  identity: WaterIdentity;
  metrics: WaterMetrics;
  summary: WaterSummary;
}

export interface WaterIdentity {
  name: string;
  brand: string | undefined;
  sourceType: WaterSourceType | undefined;
}

export interface WaterMetrics {
  tdsInPpm: number | undefined;
  ph: number | undefined;
  generalHardness: number | undefined;
  carbonateHardness: number | undefined;
}

export interface WaterSummary {
  tags: string[];
  note: string | undefined;
}
