import type {
  HarvestSeason,
  RoastLevel,
  StorageType,
  TeaCategory,
  TeaForm,
  TreeAgeType,
} from "../shared/enums";
import type { EntityMeta } from "../shared/meta";

export interface Tea {
  meta: EntityMeta;
  identity: TeaIdentity;
  origin: TeaOrigin;
  craft: TeaCraft;
  production: TeaProduction;
  inventory: TeaInventory;
  summary: TeaSummary;
}

export interface TeaIdentity {
  name: string;
  originalName: string | undefined;
  category: TeaCategory;
  subCategory: string | undefined;
  form: TeaForm | undefined;
}

export interface TeaOrigin {
  country: string | undefined;
  province: string | undefined;
  regionOrMountain: string | undefined;
  altitudeInMeters: number | undefined;
}

export interface TeaCraft {
  harvestYear: number | undefined;
  pressingYear: number | undefined;
  harvestSeason: HarvestSeason | undefined;
  cultivar: string | undefined;
  treeAge: TreeAgeType | undefined;
  roastLevel: RoastLevel | undefined;
}

export interface TeaProduction {
  brandOrFactory: string | undefined;
  batchNumber: string | undefined;
  storageType: StorageType | undefined;
}

export interface TeaInventory {
  initialWeightInGrams: number | undefined;
  remainingWeightInGrams: number | undefined;
  price: number | undefined;
  currency: string | undefined;
  vendor: string | undefined;
}

export interface TeaSummary {
  tags: string[];
  note: string | undefined;
}
