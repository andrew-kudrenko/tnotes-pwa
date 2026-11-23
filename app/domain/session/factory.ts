import { createSessionMeta } from "../shared/factory";
import type { SteepGroup, SteepGroupSensorics, TastingSession } from "./types";

export function createEmptySensorics(): SteepGroupSensorics {
  return {
    visual: {
      clarity: undefined,
      brightness: undefined,
      colorInCIELab: undefined,
    },
    aromas: {
      steamDescriptorCodes: [],
      retronasalDescriptorCodes: [],
      cupBottomDescriptorCodes: [],
    },
    mouthfeel: {
      density: undefined,
      texture: undefined,
      astringency: undefined,
      shengJinZones: [],
      huiGan: undefined,
      isCooling: undefined,
    },
    tastes: {
      sweetness: undefined,
      acidity: undefined,
      bitterness: undefined,
      umami: undefined,
      salty: undefined,
    },
  };
}

export function createSteepGroup(
  startIndex = 1,
  temperatureInCelsius?: number,
): SteepGroup {
  return {
    setup: {
      groupStartIndex: startIndex,
      groupEndIndex: undefined,
      temperatureInCelsius,
      durationInSeconds: undefined,
    },
    sensorics: createEmptySensorics(),
    summary: {
      note: undefined,
      rating: undefined,
    },
  };
}

export function createNextSteepGroup(existingGroups: SteepGroup[]): SteepGroup {
  const lastGroup = existingGroups.at(-1);
  if (!lastGroup) {
    return createSteepGroup(1);
  }
  const lastIndex =
    lastGroup.setup.groupEndIndex ?? lastGroup.setup.groupStartIndex;
  return createSteepGroup(lastIndex + 1, lastGroup.setup.temperatureInCelsius);
}

export function createEmptyTastingSession(
  authorId?: string,
  presetSetup?: Partial<TastingSession["setup"]>,
): TastingSession {
  return {
    meta: createSessionMeta(authorId),
    setup: {
      teaId: presetSetup?.teaId,
      waterId: presetSetup?.waterId,
      teawareId: presetSetup?.teawareId,
    },
    recipe: {
      brewingMethod: undefined,
      waterVolumeInMilliliters: undefined,
      leafWeightInGrams: undefined,
      rinseDurationsInSeconds: [],
      note: undefined,
    },
    dryLeaf: {
      plainLeafDescriptorCodes: [],
      warmedLeafDescriptorCodes: [],
      note: undefined,
    },
    steepGroups: [createSteepGroup(1)],
    spentLeaf: {
      integrity: undefined,
      elasticity: undefined,
      uniformity: undefined,
      descriptorCodes: [],
      note: undefined,
    },
    effects: {
      somatic: [],
      mental: [],
      note: undefined,
    },
    summary: {
      ratingTotal: undefined,
      tags: [],
      note: undefined,
    },
  };
}
