import type {
  Astringency,
  BrewingMethod,
  Brightness,
  Clarity,
  Density,
  HarvestSeason,
  HuiGan,
  LeafElasticity,
  LeafIntegrity,
  LeafUniformity,
  MentalEffect,
  PourSpeed,
  RoastLevel,
  ShengJinZone,
  SomaticEffect,
  StorageType,
  TeaCategory,
  TeaForm,
  TeawareFilterType,
  TeawareMaterial,
  TeawarePorosity,
  TeawareType,
  Texture,
  TreeAgeType,
  WallThickness,
  WaterSourceType,
} from "./enums";

export const TEA_CATEGORY_LABELS: Record<TeaCategory, string> = {
  green: "Зеленый",
  white: "Белый",
  yellow: "Желтый",
  oolong: "Улун",
  red: "Красный",
  rawPuerh: "Шэн Пуэр",
  ripePuerh: "Шу Пуэр",
  heiCha: "Хэй Ча",
  scented: "Ароматизированный",
};

export const TEA_FORM_LABELS: Record<TeaForm, string> = {
  loose: "Рассыпной",
  cake: "Блин (Бинча)",
  brick: "Кирпич (Чжуаньча)",
  tuo: "Точа",
  mushroom: "Гриб (Цзиньча)",
  melon: "Тыква (Цзиньгуа)",
  dragonBall: "Жемчужина (Лунчжу)",
  portion: "Порционный / Плитка",
};

export const HARVEST_SEASON_LABELS: Record<HarvestSeason, string> = {
  preQingMing: "Преддождевой (Минцянь)",
  spring: "Весна",
  summer: "Лето",
  autumn: "Осень",
  winter: "Зима",
};

export const TREE_AGE_LABELS: Record<TreeAgeType, string> = {
  plantation: "Плантационный (Тайдича)",
  smallTree: "Молодые деревья (Сяо Шу)",
  oldTree: "Старые деревья (Гу Шу)",
  ancientTree: "Древние деревья",
  wild: "Дикорастущий (Е Шэн)",
};

export const ROAST_LEVEL_LABELS: Record<RoastLevel, string> = {
  none: "Без прогрева",
  light: "Легкий огонь (Цин Хо)",
  medium: "Средний огонь (Чжун Хо)",
  heavy: "Сильный огонь (Цзу Хо)",
  charcoal: "Угольный прогрев (Тань Бэй)",
};

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  dryKunming: "Сухое (Куньмин)",
  natural: "Естественное",
  wetGuangdong: "Влажное (Гуандун)",
  hongKong: "Традиционное (Гонконг)",
  home: "Домашнее",
};

export const BREWING_METHOD_LABELS: Record<BrewingMethod, string> = {
  gongfu: "Гунфу Ча (проливы)",
  grandpa: "По-простому (в чашке/колбе)",
  western: "Европейский (настаивание)",
  boiling: "Варка на огне",
  coldBrew: "Холодное заваривание",
};

export const CLARITY_LABELS: Record<Clarity, string> = {
  crystal: "Кристальная",
  clear: "Прозрачная",
  slightlyHazy: "Легкая дымка",
  cloudy: "Мутноватая",
  opaque: "Непрозрачная",
};

export const BRIGHTNESS_LABELS: Record<Brightness, string> = {
  dull: "Тусклая",
  moderate: "Умеренная",
  bright: "Яркая",
  luminous: "Сияющая",
};

export const DENSITY_LABELS: Record<Density, string> = {
  watery: "Водянистая",
  light: "Легкая",
  medium: "Средняя",
  thick: "Плотная",
  syrupy: "Сиропистая / Маслянистая",
};

export const TEXTURE_LABELS: Record<Texture, string> = {
  thin: "Тонкая",
  smooth: "Гладкая",
  silky: "Шелковистая",
  velvety: "Бархатистая",
  creamy: "Сливочная",
  oily: "Маслянистая",
  rough: "Шершавая",
};

export const ASTRINGENCY_LABELS: Record<Astringency, string> = {
  none: "Отсутствует",
  faint: "Едва уловимая",
  pleasant: "Приятная структурная",
  grippy: "Ощутимая",
  drying: "Подсушивающая",
  harsh: "Резкая / Вяжущая",
};

export const SHENG_JIN_ZONE_LABELS: Record<ShengJinZone, string> = {
  tipOfTongue: "Кончик языка",
  sidesOfTongue: "Бока языка",
  underTongue: "Под языком",
  cheeks: "Щеки",
  throat: "Горло",
};

export const HUI_GAN_LABELS: Record<HuiGan, string> = {
  none: "Нет",
  subtle: "Слабое",
  clear: "Отчетливое",
  deep: "Глубокое",
  lingering: "Долгое",
};

export const LEAF_INTEGRITY_LABELS: Record<LeafIntegrity, string> = {
  whole: "Цельный лист / Флеши",
  mostlyWhole: "Преимущественно целый",
  broken: "Ломаный",
  fannings: "Крошка / Высевка",
};

export const LEAF_ELASTICITY_LABELS: Record<LeafElasticity, string> = {
  elastic: "Упругий / Кожистый",
  soft: "Мягкий / Нежный",
  stiff: "Жесткий / Грубый",
  mushy: "Разваренный",
};

export const LEAF_UNIFORMITY_LABELS: Record<LeafUniformity, string> = {
  uniform: "Однородный",
  variegated: "Пестрый / С каймой",
  scorched: "С подпалинами",
};

export const SOMATIC_EFFECT_LABELS: Record<SomaticEffect, string> = {
  warming: "Внутренний жар / Тепло",
  cooling: "Телесная прохлада",
  tingling: "Мурашки / Покалывание",
  muscleRelaxation: "Расслабление мышц",
  grounding: "Заземление / Тяжесть",
  energizing: "Физический тонус",
  stomachComfort: "Комфорт в желудке",
};

export const MENTAL_EFFECT_LABELS: Record<MentalEffect, string> = {
  clarity: "Ясность ума",
  focus: "Концентрация",
  calm: "Умиротворение",
  uplifting: "Приподнятое настроение",
  meditative: "Созерцательность",
  alertness: "Бодрость",
};

export const WATER_SOURCE_LABELS: Record<WaterSourceType, string> = {
  bottled: "Бутилированная",
  spring: "Родниковая",
  tapFiltered: "Фильтрованная",
  reverseOsmosis: "Обратный осмос",
  remineralized: "Реминерализованная",
};

export const TEAWARE_TYPE_LABELS: Record<TeawareType, string> = {
  gaiwan: "Гайвань",
  teapot: "Чайник",
  shiboridashi: "Шиборидаси",
  kyusu: "Кюсу",
  flask: "Колба / Типот",
  bowl: "Пиала / Чавань",
};

export const TEAWARE_MATERIAL_LABELS: Record<TeawareMaterial, string> = {
  porcelain: "Фарфор",
  yixingClay: "Исинская глина",
  jianshuiClay: "Цзяньшуйская керамика",
  nixingClay: "Нисинская керамика",
  chaozhouClay: "Чаочжоуская глина",
  glazedCeramic: "Глазурованная керамика",
  glass: "Стекло",
  silver: "Серебро",
  castIron: "Чугун",
};

export const TEAWARE_POROSITY_LABELS: Record<TeawarePorosity, string> = {
  nonPorous: "Непористая",
  lowPorosity: "Слабопористая",
  highPorosity: "Высокопористая",
};

export const WALL_THICKNESS_LABELS: Record<WallThickness, string> = {
  thin: "Тонкие стенки",
  medium: "Средние стенки",
  thick: "Толстые стенки",
};

export const POUR_SPEED_LABELS: Record<PourSpeed, string> = {
  fast: "Быстрый слив",
  medium: "Средний слив",
  slow: "Медленный слив",
};

export const TEAWARE_FILTER_LABELS: Record<TeawareFilterType, string> = {
  singleHole: "Одно отверстие",
  multiHole: "Птичья клетка / Сфера",
  ballFilter: "Шарообразное сито",
  flatMesh: "Плоское сито",
};

export function enumToOptions<T extends string>(
  labels: Record<T, string>,
): Array<{ label: string; value: T }> {
  return (Object.entries(labels) as Array<[T, string]>).map(
    ([value, label]) => ({
      label,
      value,
    }),
  );
}
