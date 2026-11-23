import type {
  Astringency,
  BrewingMethod,
  Brightness,
  Clarity,
  Density,
  HuiGan,
  LeafElasticity,
  LeafIntegrity,
  LeafUniformity,
  MentalEffect,
  ShengJinZone,
  SomaticEffect,
  TasteScore,
  Texture,
} from "../shared/enums";
import type { SessionMeta } from "../shared/meta";

export interface TastingSession {
  meta: SessionMeta;
  setup: TastingSessionSetup;
  recipe: TastingSessionRecipe;
  dryLeaf: TastingSessionDryLeaf;
  steepGroups: SteepGroup[];
  spentLeaf: TastingSessionSpentLeaf;
  effects: TastingSessionEffects;
  summary: TastingSessionSummary;
}

export interface TastingSessionSetup {
  teaId: string | undefined;
  waterId: string | undefined;
  teawareId: string | undefined;
}

export interface TastingSessionRecipe {
  brewingMethod: BrewingMethod | undefined;
  waterVolumeInMilliliters: number | undefined;
  leafWeightInGrams: number | undefined;
  rinseDurationsInSeconds: number[];
  note: string | undefined;
}

export interface TastingSessionDryLeaf {
  plainLeafDescriptorCodes: string[];
  warmedLeafDescriptorCodes: string[];
  note: string | undefined;
}

export interface SteepGroup {
  setup: SteepGroupSetup;
  sensorics: SteepGroupSensorics;
  summary: SteepGroupSummary;
}

export interface SteepGroupSetup {
  groupStartIndex: number;
  groupEndIndex: number | undefined;
  temperatureInCelsius: number | undefined;
  durationInSeconds: number | undefined;
}

export interface SteepGroupSensorics {
  visual: SteepGroupSensoricsVisual;
  aromas: SteepGroupSensoricsAromas;
  mouthfeel: SteepGroupSensoricsMouthfeel;
  tastes: SteepGroupSensoricsTastes;
}

export interface SteepGroupSensoricsVisual {
  clarity: Clarity | undefined;
  brightness: Brightness | undefined;
  colorInCIELab: string | undefined;
}

export interface SteepGroupSensoricsMouthfeel {
  density: Density | undefined;
  texture: Texture | undefined;
  astringency: Astringency | undefined;
  shengJinZones: ShengJinZone[];
  huiGan: HuiGan | undefined;
  isCooling: boolean | undefined;
}

export interface SteepGroupSensoricsTastes {
  sweetness: TasteScore | undefined;
  acidity: TasteScore | undefined;
  bitterness: TasteScore | undefined;
  umami: TasteScore | undefined;
  salty: TasteScore | undefined;
}

export interface SteepGroupSensoricsAromas {
  steamDescriptorCodes: string[];
  retronasalDescriptorCodes: string[];
  cupBottomDescriptorCodes: string[];
}

export interface SteepGroupSummary {
  note: string | undefined;
  rating: number | undefined;
}

export interface TastingSessionSpentLeaf {
  integrity: LeafIntegrity | undefined;
  elasticity: LeafElasticity | undefined;
  uniformity: LeafUniformity | undefined;
  descriptorCodes: string[];
  note: string | undefined;
}

export interface TastingSessionEffects {
  somatic: SomaticEffect[];
  mental: MentalEffect[];
  note: string | undefined;
}

export interface TastingSessionSummary {
  ratingTotal: number | undefined;
  tags: string[];
  note: string | undefined;
}
