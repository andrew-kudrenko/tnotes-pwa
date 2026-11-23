export type SyncStatus = "synced" | "pending" | "conflict";

export type BrewingMethod =
  | "gongfu"
  | "grandpa"
  | "western"
  | "boiling"
  | "coldBrew";

export type Clarity =
  | "crystal"
  | "clear"
  | "slightlyHazy"
  | "cloudy"
  | "opaque";

export type Brightness = "dull" | "moderate" | "bright" | "luminous";

export type Density = "watery" | "light" | "medium" | "thick" | "syrupy";

export type Texture =
  | "thin"
  | "smooth"
  | "silky"
  | "velvety"
  | "creamy"
  | "oily"
  | "rough";

export type Astringency =
  | "none"
  | "faint"
  | "pleasant"
  | "grippy"
  | "drying"
  | "harsh";

export type ShengJinZone =
  | "tipOfTongue"
  | "sidesOfTongue"
  | "underTongue"
  | "cheeks"
  | "throat";

export type HuiGan = "none" | "subtle" | "clear" | "deep" | "lingering";

export type TasteScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type LeafIntegrity = "whole" | "mostlyWhole" | "broken" | "fannings";

export type LeafElasticity = "elastic" | "soft" | "stiff" | "mushy";

export type LeafUniformity = "uniform" | "variegated" | "scorched";

export type SomaticEffect =
  | "warming"
  | "cooling"
  | "tingling"
  | "muscleRelaxation"
  | "grounding"
  | "energizing"
  | "stomachComfort";

export type MentalEffect =
  | "clarity"
  | "focus"
  | "calm"
  | "uplifting"
  | "meditative"
  | "alertness";

export type TeaCategory =
  | "green"
  | "white"
  | "yellow"
  | "oolong"
  | "red"
  | "rawPuerh"
  | "ripePuerh"
  | "heiCha"
  | "scented";

export type TeaForm =
  | "loose"
  | "cake"
  | "brick"
  | "tuo"
  | "mushroom"
  | "melon"
  | "dragonBall"
  | "portion";

export type HarvestSeason =
  | "preQingMing"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export type TreeAgeType =
  | "plantation"
  | "smallTree"
  | "oldTree"
  | "ancientTree"
  | "wild";

export type RoastLevel = "none" | "light" | "medium" | "heavy" | "charcoal";

export type StorageType =
  | "dryKunming"
  | "natural"
  | "wetGuangdong"
  | "hongKong"
  | "home";

export type WaterSourceType =
  | "bottled"
  | "spring"
  | "tapFiltered"
  | "reverseOsmosis"
  | "remineralized";

export type TeawareType =
  | "gaiwan"
  | "teapot"
  | "shiboridashi"
  | "kyusu"
  | "flask"
  | "bowl";

export type TeawareMaterial =
  | "porcelain"
  | "yixingClay"
  | "jianshuiClay"
  | "nixingClay"
  | "chaozhouClay"
  | "glazedCeramic"
  | "glass"
  | "silver"
  | "castIron";

export type TeawarePorosity = "nonPorous" | "lowPorosity" | "highPorosity";

export type WallThickness = "thin" | "medium" | "thick";

export type PourSpeed = "fast" | "medium" | "slow";

export type TeawareFilterType =
  | "singleHole"
  | "multiHole"
  | "ballFilter"
  | "flatMesh";
