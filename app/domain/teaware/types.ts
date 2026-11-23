import type {
  PourSpeed,
  TeaCategory,
  TeawareFilterType,
  TeawareMaterial,
  TeawarePorosity,
  TeawareType,
  WallThickness,
} from "../shared/enums";
import type { EntityMeta } from "../shared/meta";

export interface Teaware {
  meta: EntityMeta;
  identity: TeawareIdentity;
  material: TeawareMaterialSpec;
  specs: TeawareSpecs;
  summary: TeawareSummary;
}

export interface TeawareIdentity {
  name: string;
  type: TeawareType;
  shape: string | undefined;
}

export interface TeawareMaterialSpec {
  material: TeawareMaterial;
  subType: string | undefined;
  porosity: TeawarePorosity | undefined;
  wallThickness: WallThickness | undefined;
}

export interface TeawareSpecs {
  volumeInMilliliters: number | undefined;
  pourSpeed: PourSpeed | undefined;
  filterType: TeawareFilterType | undefined;
}

export interface TeawareSummary {
  dedicatedTeaCategories: TeaCategory[];
  tags: string[];
  note: string | undefined;
}
