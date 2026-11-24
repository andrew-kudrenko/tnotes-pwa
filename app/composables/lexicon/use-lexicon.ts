import { computed } from "vue";
import {
  createCustomDescriptor,
  normalizeSearchText,
  buildSearchTokens,
} from "../../domain/lexicon/factory";
import { SYSTEM_DESCRIPTORS } from "../../domain/lexicon/system-dictionary";
import type { CustomDescriptor, Descriptor } from "../../domain/lexicon/types";
import { useProfileStore } from "../../stores/profile.store";
import { useCustomDescriptorsQuery } from "../queries/use-custom-descriptors-query";
import { descriptorRepository } from "~/infrastructure/repositories/descriptor.repository";

export interface DescriptorTreeNode {
  descriptor: Descriptor;
  children: DescriptorTreeNode[];
}

export function useLexicon() {
  const { data: customDescriptors } = useCustomDescriptorsQuery();
  const profileStore = useProfileStore();

  const allDescriptors = computed<Descriptor[]>(() => [
    ...SYSTEM_DESCRIPTORS,
    ...customDescriptors.value,
  ]);

  const descriptorMap = computed<Map<string, Descriptor>>(() => {
    const map = new Map<string, Descriptor>();
    for (const item of allDescriptors.value) {
      map.set(item.code, item);
    }
    return map;
  });

  const rootDescriptors = computed<Descriptor[]>(() =>
    allDescriptors.value.filter((item) => item.depth === 1),
  );

  const tree = computed<DescriptorTreeNode[]>(() => {
    const childrenByParent = new Map<string | undefined, Descriptor[]>();

    for (const item of allDescriptors.value) {
      const list = childrenByParent.get(item.parentCode) ?? [];
      list.push(item);
      childrenByParent.set(item.parentCode, list);
    }

    function buildBranch(parentCode: string | undefined): DescriptorTreeNode[] {
      const items = childrenByParent.get(parentCode) ?? [];
      return items.map((descriptor) => ({
        descriptor,
        children: buildBranch(descriptor.code),
      }));
    }

    return buildBranch(undefined);
  });

  function getByCode(code: string): Descriptor | undefined {
    return descriptorMap.value.get(code);
  }

  function resolveMany(codes: string[]): Descriptor[] {
    const result: Descriptor[] = [];
    for (const code of codes) {
      const found = descriptorMap.value.get(code);
      if (found) {
        result.push(found);
      }
    }
    return result;
  }

  function getAncestors(code: string): Descriptor[] {
    const chain: Descriptor[] = [];
    let current = descriptorMap.value.get(code);

    while (current && current.parentCode) {
      const parent = descriptorMap.value.get(current.parentCode);
      if (!parent) {
        break;
      }
      chain.unshift(parent);
      current = parent;
    }

    return chain;
  }

  function search(query: string, limit = 30): Descriptor[] {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return [];
    }

    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
    const exactMatches: Descriptor[] = [];
    const prefixMatches: Descriptor[] = [];
    const substringMatches: Descriptor[] = [];

    for (const descriptor of allDescriptors.value) {
      const labelNormalized = normalizeSearchText(descriptor.label);
      if (labelNormalized === normalizedQuery) {
        exactMatches.push(descriptor);
        continue;
      }

      const matchesAllTerms = queryTerms.every((term) =>
        descriptor.searchTokens.some((token) => token.includes(term)),
      );

      if (!matchesAllTerms) {
        continue;
      }

      const isPrefix = queryTerms.every((term) =>
        descriptor.searchTokens.some((token) => token.startsWith(term)),
      );

      if (isPrefix) {
        prefixMatches.push(descriptor);
      } else {
        substringMatches.push(descriptor);
      }
    }

    return [...exactMatches, ...prefixMatches, ...substringMatches].slice(
      0,
      limit,
    );
  }

  async function addCustomDescriptor(params: {
    label: string;
    parentCode?: string;
    aliases?: string[];
    color?: string;
  }): Promise<CustomDescriptor> {
    const parent = params.parentCode ? getByCode(params.parentCode) : undefined;
    const entity = createCustomDescriptor({
      label: params.label,
      parent,
      aliases: params.aliases,
      color: params.color,
      authorId: profileStore.activeProfileId,
    });
    await descriptorRepository.upsert(entity);
    return entity;
  }

  async function updateCustomDescriptor(
    descriptor: CustomDescriptor,
    updates: {
      label: string;
      aliases?: string[];
      color?: string;
    },
  ): Promise<void> {
    const trimmedLabel = updates.label.trim();
    if (!trimmedLabel) {
      return;
    }
    const aliases = updates.aliases ?? descriptor.aliases;
    const updated: CustomDescriptor = {
      ...descriptor,
      label: trimmedLabel,
      aliases,
      searchTokens: buildSearchTokens(trimmedLabel, aliases),
      color: updates.color ?? descriptor.color,
    };
    await descriptorRepository.upsert(updated);
  }

  async function removeCustomDescriptor(id: string): Promise<void> {
    await descriptorRepository.softDelete(id);
  }

  return {
    allDescriptors,
    rootDescriptors,
    tree,
    getByCode,
    resolveMany,
    getAncestors,
    search,
    addCustomDescriptor,
    updateCustomDescriptor,
    removeCustomDescriptor,
  };
}
