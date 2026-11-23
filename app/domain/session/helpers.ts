import type { SteepGroup, TastingSession } from "./types";

export function calculateGramsPer100Ml(
  leafWeightInGrams: number | undefined,
  waterVolumeInMilliliters: number | undefined,
): number | undefined {
  if (
    leafWeightInGrams === undefined ||
    waterVolumeInMilliliters === undefined ||
    leafWeightInGrams <= 0 ||
    waterVolumeInMilliliters <= 0
  ) {
    return undefined;
  }
  return Number(
    ((leafWeightInGrams / waterVolumeInMilliliters) * 100).toFixed(2),
  );
}

export function getSteepGroupRange(group: SteepGroup): [number, number] {
  const start = group.setup.groupStartIndex;
  const end = group.setup.groupEndIndex ?? start;
  return start <= end ? [start, end] : [end, start];
}

export function hasOverlappingSteepGroups(groups: SteepGroup[]): boolean {
  const ranges = groups.map(getSteepGroupRange).sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1];
    const current = ranges[i];
    if (prev && current && current <= prev) {
      return true;
    }
  }
  return false;
}

export function isSteepGroupEmpty(group: SteepGroup): boolean {
  const { setup, sensorics, summary } = group;
  const hasSetup =
    setup.temperatureInCelsius !== undefined ||
    setup.durationInSeconds !== undefined;

  const hasVisual =
    sensorics.visual.clarity !== undefined ||
    sensorics.visual.brightness !== undefined ||
    Boolean(sensorics.visual.colorInCIELab?.trim());

  const hasAromas =
    sensorics.aromas.steamDescriptorCodes.length > 0 ||
    sensorics.aromas.retronasalDescriptorCodes.length > 0 ||
    sensorics.aromas.cupBottomDescriptorCodes.length > 0;

  const hasMouthfeel =
    sensorics.mouthfeel.density !== undefined ||
    sensorics.mouthfeel.texture !== undefined ||
    sensorics.mouthfeel.astringency !== undefined ||
    sensorics.mouthfeel.shengJinZones.length > 0 ||
    sensorics.mouthfeel.huiGan !== undefined ||
    sensorics.mouthfeel.isCooling !== undefined;

  const hasTastes =
    sensorics.tastes.sweetness !== undefined ||
    sensorics.tastes.acidity !== undefined ||
    sensorics.tastes.bitterness !== undefined ||
    sensorics.tastes.umami !== undefined ||
    sensorics.tastes.salty !== undefined;

  const hasSummary =
    summary.rating !== undefined || Boolean(summary.note?.trim());

  return (
    !hasSetup &&
    !hasVisual &&
    !hasAromas &&
    !hasMouthfeel &&
    !hasTastes &&
    !hasSummary
  );
}

export function isTastingSessionEmpty(session: TastingSession): boolean {
  const hasSetup =
    session.setup.teaId !== undefined ||
    session.setup.waterId !== undefined ||
    session.setup.teawareId !== undefined;

  const hasRecipe =
    session.recipe.brewingMethod !== undefined ||
    session.recipe.waterVolumeInMilliliters !== undefined ||
    session.recipe.leafWeightInGrams !== undefined ||
    session.recipe.rinseDurationsInSeconds.length > 0 ||
    Boolean(session.recipe.note?.trim());

  const hasDryLeaf =
    session.dryLeaf.plainLeafDescriptorCodes.length > 0 ||
    session.dryLeaf.warmedLeafDescriptorCodes.length > 0 ||
    Boolean(session.dryLeaf.note?.trim());

  const hasSteepGroups = session.steepGroups.some((g) => !isSteepGroupEmpty(g));

  const hasSpentLeaf =
    session.spentLeaf.integrity !== undefined ||
    session.spentLeaf.elasticity !== undefined ||
    session.spentLeaf.uniformity !== undefined ||
    session.spentLeaf.descriptorCodes.length > 0 ||
    Boolean(session.spentLeaf.note?.trim());

  const hasEffects =
    session.effects.somatic.length > 0 ||
    session.effects.mental.length > 0 ||
    Boolean(session.effects.note?.trim());

  const hasSummary =
    session.summary.ratingTotal !== undefined ||
    session.summary.tags.length > 0 ||
    Boolean(session.summary.note?.trim());

  return (
    !hasSetup &&
    !hasRecipe &&
    !hasDryLeaf &&
    !hasSteepGroups &&
    !hasSpentLeaf &&
    !hasEffects &&
    !hasSummary
  );
}
