import type { EntityMeta } from "../shared/meta";

export interface Descriptor {
  code: string;
  parentCode: string | undefined;
  depth: number;
  isCustom: boolean;

  label: string;
  aliases: string[];
  searchTokens: string[];

  color: string | undefined;
  relatedCodes: string[];
}

export interface CustomDescriptor extends Descriptor {
  isCustom: true;
  meta: EntityMeta;
}
