import { createEntityMeta } from "../shared/factory";
import type { CustomDescriptor, Descriptor } from "./types";

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s-]/gi, " ")
    .trim();
}

export function buildSearchTokens(
  label: string,
  aliases: string[] = [],
): string[] {
  const sources = [label, ...aliases];
  const tokens = new Set<string>();

  for (const source of sources) {
    const normalized = normalizeSearchText(source);
    if (!normalized) {
      continue;
    }
    tokens.add(normalized);
    for (const part of normalized.split(/\s+/)) {
      if (part.length >= 2) {
        tokens.add(part);
      }
    }
  }

  return Array.from(tokens);
}

export function createCustomDescriptor(params: {
  label: string;
  parent?: Descriptor;
  aliases?: string[];
  color?: string;
  authorId?: string;
}): CustomDescriptor {
  const meta = createEntityMeta(params.authorId);
  const slug = `custom_${meta.id.slice(0, 8)}`;
  const code = params.parent ? `${params.parent.code}.${slug}` : slug;
  const depth = params.parent ? params.parent.depth + 1 : 1;
  const aliases = params.aliases ?? [];

  return {
    code,
    parentCode: params.parent?.code,
    depth,
    isCustom: true,
    label: params.label.trim(),
    aliases,
    searchTokens: buildSearchTokens(params.label, aliases),
    color: params.color ?? params.parent?.color,
    relatedCodes: [],
    meta,
  };
}
