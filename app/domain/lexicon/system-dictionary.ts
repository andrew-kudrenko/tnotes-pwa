import { buildSearchTokens } from "./factory";
import type { Descriptor } from "./types";

interface RawDescriptorNode {
  code: string;
  label: string;
  aliases?: string[];
  color?: string;
  relatedCodes?: string[];
  children?: RawDescriptorNode[];
}

const RAW_TEA_LEXICON: RawDescriptorNode[] = [
  {
    code: "floral",
    label: "Цветочные",
    aliases: ["цветы", "цветочный"],
    color: "#ec4899",
    children: [
      {
        code: "floral.orchid",
        label: "Орхидея",
        aliases: ["лан хуа", "цветы орхидеи"],
        relatedCodes: ["creamy.honey"],
      },
      {
        code: "floral.osmanthus",
        label: "Османтус",
        aliases: ["гуй хуа"],
        relatedCodes: ["fruity.stoneFruit.apricot"],
      },
      {
        code: "floral.jasmine",
        label: "Жасмин",
        aliases: ["моли хуа", "белые цветы"],
      },
      {
        code: "floral.linden",
        label: "Липовый цвет",
        aliases: ["липа", "цветущая липа"],
        relatedCodes: ["creamy.honey"],
      },
      {
        code: "floral.magnolia",
        label: "Магнолия",
        aliases: ["юй лань"],
      },
      {
        code: "floral.rose",
        label: "Роза",
        aliases: ["шиповник", "лепестки розы"],
      },
      {
        code: "floral.chrysanthemum",
        label: "Хризантема",
        aliases: ["цзюй хуа", "луговые цветы"],
      },
    ],
  },
  {
    code: "fruity",
    label: "Фруктовые и ягодные",
    aliases: ["фрукты", "ягоды"],
    color: "#f97316",
    children: [
      {
        code: "fruity.stoneFruit",
        label: "Косточковые",
        aliases: ["косточковые фрукты"],
        children: [
          {
            code: "fruity.stoneFruit.peach",
            label: "Персик",
            aliases: ["белый персик", "нектарин"],
          },
          {
            code: "fruity.stoneFruit.apricot",
            label: "Абрикос",
            aliases: ["спелый абрикос"],
          },
          {
            code: "fruity.stoneFruit.driedApricot",
            label: "Курага",
            aliases: ["урюк", "сушеный абрикос"],
          },
          {
            code: "fruity.stoneFruit.plum",
            label: "Слива",
            aliases: ["чернослив", "вяленая слива"],
          },
        ],
      },
      {
        code: "fruity.tropical",
        label: "Тропические фрукты",
        aliases: ["экзотические фрукты", "тропики"],
        children: [
          {
            code: "fruity.tropical.lychee",
            label: "Личи",
            aliases: ["китайская слива"],
          },
          {
            code: "fruity.tropical.mango",
            label: "Манго",
            aliases: ["спелое манго"],
          },
          {
            code: "fruity.tropical.pineapple",
            label: "Ананас",
          },
        ],
      },
      {
        code: "fruity.citrus",
        label: "Цитрусовые",
        aliases: ["цитрус", "цедра"],
        children: [
          {
            code: "fruity.citrus.mandarin",
            label: "Мандарин",
            aliases: ["сушеная мандариновая корка", "чэнь пи"],
          },
          {
            code: "fruity.citrus.bergamot",
            label: "Бергамот",
            aliases: ["лайм", "лимон"],
          },
          {
            code: "fruity.citrus.pomelo",
            label: "Помело",
            aliases: ["грейпфрут"],
          },
        ],
      },
      {
        code: "fruity.pome",
        label: "Семечковые",
        children: [
          {
            code: "fruity.pome.bakedApple",
            label: "Печеное яблоко",
            aliases: ["яблочное повидло", "сушеные яблоки"],
          },
          {
            code: "fruity.pome.pear",
            label: "Груша",
            aliases: ["дюшес", "китайская груша"],
          },
        ],
      },
      {
        code: "fruity.berry",
        label: "Ягоды",
        children: [
          {
            code: "fruity.berry.redBerries",
            label: "Красные ягоды",
            aliases: ["малина", "клубника", "земляника", "клюква"],
          },
          {
            code: "fruity.berry.darkBerries",
            label: "Темные ягоды",
            aliases: ["ежевика", "черная смородина", "черника"],
          },
          {
            code: "fruity.berry.raisin",
            label: "Изюм",
            aliases: ["сушеный виноград", "виноград"],
          },
        ],
      },
    ],
  },
  {
    code: "vegetal",
    label: "Травянистые и овощные",
    aliases: ["трава", "зелень", "овощи"],
    color: "#22c55e",
    children: [
      {
        code: "vegetal.freshGrass",
        label: "Свежая трава",
        aliases: ["скошенная трава", "весенняя зелень"],
      },
      {
        code: "vegetal.hay",
        label: "Сено",
        aliases: ["сухая трава", "солома"],
      },
      {
        code: "vegetal.bamboo",
        label: "Бамбук",
        aliases: ["листья бамбука", "молодой бамбук"],
      },
      {
        code: "vegetal.mint",
        label: "Мята",
        aliases: ["ментол", "холодок", "эвкалипт"],
      },
      {
        code: "vegetal.seaweed",
        label: "Морские водоросли",
        aliases: ["нори", "йод", "морской бриз"],
      },
      {
        code: "vegetal.pumpkinSeed",
        label: "Тыквенные семечки",
        aliases: ["семечки", "кабачок", "молодой горошек"],
      },
    ],
  },
  {
    code: "woody",
    label: "Древесные и лесные",
    aliases: ["дерево", "лес", "древесина"],
    color: "#92400e",
    children: [
      {
        code: "woody.oldWood",
        label: "Старое дерево",
        aliases: ["старая мебель", "сундук", "древесина"],
      },
      {
        code: "woody.camphor",
        label: "Камфора",
        aliases: ["камфорное дерево", "чжан сян"],
        relatedCodes: ["vegetal.mint"],
      },
      {
        code: "woody.coniferous",
        label: "Хвойные",
        aliases: ["хвоя", "сосна", "кедр"],
        children: [
          {
            code: "woody.coniferous.pineResin",
            label: "Сосновая смола",
            aliases: ["живица", "смола"],
          },
          {
            code: "woody.coniferous.cedar",
            label: "Кедр",
            aliases: ["можжевельник"],
          },
        ],
      },
      {
        code: "woody.sandalwood",
        label: "Сандал",
        aliases: ["благовония", "агар", "уд"],
      },
      {
        code: "woody.autumnLeaves",
        label: "Прелая листва",
        aliases: ["опавшие листья", "осенний лес"],
      },
      {
        code: "woody.moss",
        label: "Мох",
        aliases: ["лесной мох", "кора дерева"],
      },
    ],
  },
  {
    code: "earthy",
    label: "Землистые и погребные",
    aliases: ["земля", "погреб", "шу"],
    color: "#78350f",
    children: [
      {
        code: "earthy.wetSoil",
        label: "Влажная земля",
        aliases: ["земля после дождя", "чернозем"],
      },
      {
        code: "earthy.cellar",
        label: "Погреб",
        aliases: ["подвал", "сырой подвал", "хранилище"],
      },
      {
        code: "earthy.mushrooms",
        label: "Грибы",
        aliases: ["сушеные грибы", "лесные грибы"],
      },
      {
        code: "earthy.peat",
        label: "Торф",
        aliases: ["перегной"],
      },
    ],
  },
  {
    code: "roasted",
    label: "Печеные и ореховые",
    aliases: ["прогрев", "огонь", "жареный", "орехи"],
    color: "#d97706",
    children: [
      {
        code: "roasted.nuts",
        label: "Орехи",
        children: [
          {
            code: "roasted.nuts.chestnut",
            label: "Жареный каштан",
            aliases: ["каштан"],
          },
          {
            code: "roasted.nuts.hazelnut",
            label: "Фундук",
            aliases: ["лесной орех", "грецкий орех"],
          },
          {
            code: "roasted.nuts.almond",
            label: "Миндаль",
            aliases: ["абрикосовая косточка", "марципан"],
          },
        ],
      },
      {
        code: "roasted.breadCrust",
        label: "Хлебная корка",
        aliases: ["выпечка", "тосты", "печенье", "сухари"],
      },
      {
        code: "roasted.caramel",
        label: "Карамель",
        aliases: ["жженый сахар", "ириска", "тростниковый сахар"],
      },
      {
        code: "roasted.cocoa",
        label: "Какао и шоколад",
        aliases: ["темный шоколад", "какао бобы"],
      },
      {
        code: "roasted.smoke",
        label: "Дым",
        aliases: ["костер", "дымок", "сосновый дым", "уголь"],
      },
    ],
  },
  {
    code: "creamy",
    label: "Сливочные и медовые",
    aliases: ["сливки", "сладкий", "молочный"],
    color: "#eab308",
    children: [
      {
        code: "creamy.honey",
        label: "Мед",
        aliases: ["цветочный мед", "гречишный мед", "нектар"],
      },
      {
        code: "creamy.cream",
        label: "Сливки",
        aliases: ["молоко", "сгущенное молоко", "сливочное масло"],
      },
      {
        code: "creamy.vanilla",
        label: "Ваниль",
        aliases: ["пломбир", "крем-брюле"],
      },
    ],
  },
  {
    code: "spicy",
    label: "Пряные",
    aliases: ["специи", "пряности"],
    color: "#ef4444",
    children: [
      {
        code: "spicy.cinnamon",
        label: "Корица",
        aliases: ["кассия", "жоу гуй"],
      },
      {
        code: "spicy.clove",
        label: "Гвоздика",
        aliases: ["бадьян", "анис"],
      },
      {
        code: "spicy.pepper",
        label: "Перец",
        aliases: ["черный перец", "белый перец", "остринка"],
      },
      {
        code: "spicy.ginger",
        label: "Имбирь",
        aliases: ["сушеный имбирь", "кардамон"],
      },
    ],
  },
  {
    code: "mineral",
    label: "Минеральные",
    aliases: ["минералы", "камень", "утесная мелодия", "янь юнь"],
    color: "#64748b",
    children: [
      {
        code: "mineral.wetStone",
        label: "Мокрый камень",
        aliases: ["галька", "скала", "кремень"],
      },
      {
        code: "mineral.chalk",
        label: "Мел",
        aliases: ["известняк", "глина"],
      },
      {
        code: "mineral.springWater",
        label: "Родниковая свежесть",
        aliases: ["чистая вода", "соленость"],
      },
    ],
  },
];
function flattenNodes(
  nodes: RawDescriptorNode[],
  parentCode?: string,
  inheritedColor?: string,
  depth = 1,
): Descriptor[] {
  const result: Descriptor[] = [];
  for (const node of nodes) {
    const color = node.color ?? inheritedColor;
    const aliases = node.aliases ?? [];
    result.push({
      code: node.code,
      parentCode,
      depth,
      isCustom: false,
      label: node.label,
      aliases,
      searchTokens: buildSearchTokens(node.label, aliases),
      color,
      relatedCodes: node.relatedCodes ?? [],
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenNodes(node.children, node.code, color, depth + 1));
    }
  }
  return result;
}

export const SYSTEM_DESCRIPTORS: readonly Descriptor[] = Object.freeze(
  flattenNodes(RAW_TEA_LEXICON),
);
