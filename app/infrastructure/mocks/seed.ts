import { createCustomDescriptor } from "../../domain/lexicon/factory";
import {
  createEmptyTastingSession,
  createSteepGroup,
} from "../../domain/session/factory";
import { createEmptyTea } from "../../domain/tea/factory";
import { createEmptyTeaware } from "../../domain/teaware/factory";
import { createEmptyWater } from "../../domain/water/factory";
import { descriptorRepository } from "../repositories/descriptor.repository";
import { sessionRepository } from "../repositories/session.repository";
import { teaRepository } from "../repositories/tea.repository";
import { teawareRepository } from "../repositories/teaware.repository";
import { waterRepository } from "../repositories/water.repository";

export async function seedMockData(authorId?: string): Promise<void> {
  const existingTeas = await teaRepository.listAllIncludingRemoved();
  if (existingTeas.length > 0) {
    return;
  }

  const waterPiligrim = createEmptyWater(authorId);
  waterPiligrim.identity.name = "Пилигрим";
  waterPiligrim.identity.brand = "Меркурий";
  waterPiligrim.identity.sourceType = "bottled";
  waterPiligrim.metrics.tdsInPpm = 65;
  waterPiligrim.metrics.ph = 7.2;
  waterPiligrim.summary.tags = ["универсальная", "мягкая"];
  waterPiligrim.summary.note = "Хорошо раскрывает шэн пуэры и белые чаи";

  const waterOsmosis = createEmptyWater(authorId);
  waterOsmosis.identity.name = "Осмос + минерализатор";
  waterOsmosis.identity.sourceType = "remineralized";
  waterOsmosis.metrics.tdsInPpm = 45;
  waterOsmosis.metrics.ph = 6.8;
  waterOsmosis.summary.tags = ["улуны", "зеленый"];

  await Promise.all([
    waterRepository.upsert(waterPiligrim),
    waterRepository.upsert(waterOsmosis),
  ]);

  const gaiwanPorcelain = createEmptyTeaware("gaiwan", "porcelain", authorId);
  gaiwanPorcelain.identity.name = "Дэхуа тонкостенная гайвань";
  gaiwanPorcelain.material.subType = "Белый фарфор";
  gaiwanPorcelain.material.porosity = "nonPorous";
  gaiwanPorcelain.material.wallThickness = "thin";
  gaiwanPorcelain.specs.volumeInMilliliters = 110;
  gaiwanPorcelain.specs.pourSpeed = "fast";
  gaiwanPorcelain.summary.tags = ["дегустационная", "улуны", "шэн"];

  const teapotZini = createEmptyTeaware("teapot", "yixingClay", authorId);
  teapotZini.identity.name = "Исинский Си Ши Цзы Ни";
  teapotZini.identity.shape = "Си Ши";
  teapotZini.material.subType = "Цзы Ни";
  teapotZini.material.porosity = "lowPorosity";
  teapotZini.material.wallThickness = "medium";
  teapotZini.specs.volumeInMilliliters = 140;
  teapotZini.specs.pourSpeed = "medium";
  teapotZini.specs.filterType = "multiHole";
  teapotZini.summary.dedicatedTeaCategories = ["ripePuerh", "oolong"];
  teapotZini.summary.note = "Хорошо сглаживает углы у плотных шу и уишаньцев";

  await Promise.all([
    teawareRepository.upsert(gaiwanPorcelain),
    teawareRepository.upsert(teapotZini),
  ]);

  const teaSheng = createEmptyTea("rawPuerh", authorId);
  teaSheng.identity.name = "Иу Чжэншань Гу Шу";
  teaSheng.identity.originalName = "易武正山古树";
  teaSheng.identity.form = "cake";
  teaSheng.origin.province = "Юньнань";
  teaSheng.origin.regionOrMountain = "Иу";
  teaSheng.origin.altitudeInMeters = 1450;
  teaSheng.craft.harvestYear = 2021;
  teaSheng.craft.pressingYear = 2021;
  teaSheng.craft.harvestSeason = "spring";
  teaSheng.craft.treeAge = "oldTree";
  teaSheng.production.storageType = "dryKunming";
  teaSheng.summary.tags = ["медовый", "мягкий", "весна"];

  const teaOolong = createEmptyTea("oolong", authorId);
  teaOolong.identity.name = "Хуэй Юань Кэн Жоу Гуй";
  teaOolong.identity.originalName = "慧苑坑肉桂";
  teaOolong.identity.subCategory = "Уишаньский";
  teaOolong.identity.form = "loose";
  teaOolong.origin.province = "Фуцзянь";
  teaOolong.origin.regionOrMountain = "Уишань, Хуэй Юань Кэн";
  teaOolong.craft.harvestYear = 2024;
  teaOolong.craft.harvestSeason = "spring";
  teaOolong.craft.cultivar = "Жоу Гуй";
  teaOolong.craft.roastLevel = "medium";
  teaOolong.summary.tags = ["корица", "утесный", "средний огонь"];

  const teaShu = createEmptyTea("ripePuerh", authorId);
  teaShu.identity.name = "Мэнхай Лао Ча Тоу";
  teaShu.identity.originalName = "勐海老茶头";
  teaShu.identity.form = "loose";
  teaShu.origin.province = "Юньнань";
  teaShu.origin.regionOrMountain = "Мэнхай";
  teaShu.craft.harvestYear = 2018;
  teaShu.production.brandOrFactory = "Мэнхайская чайная фабрика";
  teaShu.production.storageType = "natural";
  teaShu.summary.tags = ["комки", "нефть", "ореховый"];

  await Promise.all([
    teaRepository.upsert(teaSheng),
    teaRepository.upsert(teaOolong),
    teaRepository.upsert(teaShu),
  ]);

  const customDescriptor = createCustomDescriptor({
    label: "Березовый сок",
    aliases: ["весенний сок", "береза"],
    color: "#84cc16",
    authorId,
  });
  await descriptorRepository.upsert(customDescriptor);

  const sessionSheng = createEmptyTastingSession(authorId, {
    teaId: teaSheng.meta.id,
    waterId: waterPiligrim.meta.id,
    teawareId: gaiwanPorcelain.meta.id,
  });
  sessionSheng.recipe.brewingMethod = "gongfu";
  sessionSheng.recipe.leafWeightInGrams = 6.5;
  sessionSheng.recipe.waterVolumeInMilliliters = 110;
  sessionSheng.recipe.rinseDurationsInSeconds = [5];
  sessionSheng.dryLeaf.plainLeafDescriptorCodes = [
    "woody.autumnLeaves",
    "fruity.stoneFruit.driedApricot",
  ];
  sessionSheng.dryLeaf.warmedLeafDescriptorCodes = [
    "creamy.honey",
    "floral.orchid",
  ];

  const group1 = createSteepGroup(1, 92);
  group1.setup.groupEndIndex = 3;
  group1.setup.durationInSeconds = 10;
  group1.sensorics.visual.clarity = "crystal";
  group1.sensorics.visual.brightness = "bright";
  group1.sensorics.aromas.steamDescriptorCodes = [
    "floral.orchid",
    "creamy.honey",
  ];
  group1.sensorics.aromas.cupBottomDescriptorCodes = [
    "creamy.honey",
    "fruity.stoneFruit.peach",
  ];
  group1.sensorics.mouthfeel.density = "medium";
  group1.sensorics.mouthfeel.texture = "silky";
  group1.sensorics.mouthfeel.astringency = "faint";
  group1.sensorics.mouthfeel.shengJinZones = ["sidesOfTongue", "underTongue"];
  group1.sensorics.mouthfeel.huiGan = "deep";
  group1.sensorics.tastes.sweetness = 8;
  group1.sensorics.tastes.bitterness = 2;
  group1.sensorics.tastes.acidity = 1;
  group1.summary.rating = 9;
  group1.summary.note = "Очень объемный, медово-цветочный старт без горечи";

  const group2 = createSteepGroup(4, 96);
  group2.setup.groupEndIndex = 7;
  group2.setup.durationInSeconds = 15;
  group2.sensorics.visual.clarity = "clear";
  group2.sensorics.aromas.retronasalDescriptorCodes = [
    "woody.oldWood",
    customDescriptor.code,
  ];
  group2.sensorics.mouthfeel.density = "thick";
  group2.sensorics.mouthfeel.texture = "velvety";
  group2.sensorics.mouthfeel.huiGan = "lingering";
  group2.sensorics.tastes.sweetness = 7;
  group2.sensorics.tastes.bitterness = 3;
  group2.summary.rating = 8.5;

  sessionSheng.steepGroups = [group1, group2];
  sessionSheng.spentLeaf.integrity = "whole";
  sessionSheng.spentLeaf.elasticity = "elastic";
  sessionSheng.spentLeaf.uniformity = "uniform";
  sessionSheng.spentLeaf.descriptorCodes = [
    "vegetal.freshGrass",
    "creamy.honey",
  ];
  sessionSheng.effects.somatic = ["warming", "muscleRelaxation"];
  sessionSheng.effects.mental = ["calm", "clarity"];
  sessionSheng.effects.note =
    "Мягкое, глубокое расслабление в плечах и ясная голова";
  sessionSheng.summary.ratingTotal = 9;
  sessionSheng.summary.tags = ["эталонный Иу", "на вечер"];
  sessionSheng.summary.note =
    "Отлично держит 8 проливов, сладкое долгое хуэй гань";

  await sessionRepository.upsert(sessionSheng);
}
