import { RARITY } from './rarity'

export const MINERALS = [
  {
    id: 1,
    name: '石英',
    nameEn: 'Quartz',
    emoji: '💎',
    rarity: RARITY.COMMON,
    colors: ['#f0f9ff', '#e0f2fe', '#bae6fd'],
    crystalColor: 0xf0f9ff,
    formula: 'SiO₂',
    hardness: '7',
    description: '石英是最常见的矿物之一，由二氧化硅组成。它通常形成六方柱状晶体，有时带有尖端。纯净的石英是透明的，但含有杂质时会呈现各种颜色。',
    origin: '世界各地均有产出，主要产地包括巴西、马达加斯加和中国。',
    uses: '广泛用于珠宝、光学仪器和电子工业。',
    funFact: '石英晶体具有压电效应，被用于制造钟表和电子设备。',
    clues: {
      production: ['🕳️ 水晶洞穴中大量蕴藏', '🌋 火山岩脉中常有产出'],
      gameplay: ['🎨 矿物拼装：低稀有度矿物最容易获得', '🗺️ 远征：水晶洞穴是最佳选择'],
      reward: '💰 完成收集可获得基础金币奖励，解锁初始知识卡片'
    }
  },
  {
    id: 2,
    name: '长石',
    nameEn: 'Feldspar',
    emoji: '🪨',
    rarity: RARITY.COMMON,
    colors: ['#fef3c7', '#fde68a', '#fcd34d'],
    crystalColor: 0xfef3c7,
    formula: 'KAlSi₃O₈',
    hardness: '6-6.5',
    description: '长石是地壳中含量最丰富的矿物，约占地壳总质量的60%。它有多种变种，颜色从白色、粉色到灰色不等。',
    origin: '主要产于火成岩和变质岩中，世界各地均有分布。',
    uses: '主要用于陶瓷和玻璃工业，也可作为宝石。',
    funFact: '长石的名字来源于德语"Feldspath"，意为"田野中的石头"。',
    clues: {
      production: ['🕳️ 常见于各种洞穴岩壁', '🌋 火山岩脉的主要成分'],
      gameplay: ['🎨 矿物拼装：基础掉落概率最高', '🗺️ 远征：任意地点都可能发现'],
      reward: '💰 收集奖励较低，但数量众多，适合新手积累'
    }
  },
  {
    id: 3,
    name: '方解石',
    nameEn: 'Calcite',
    emoji: '🔶',
    rarity: RARITY.COMMON,
    colors: ['#fffbeb', '#fef3c7', '#fde68a'],
    crystalColor: 0xfffbeb,
    formula: 'CaCO₃',
    hardness: '3',
    description: '方解石是碳酸钙的稳定形态，常见于沉积岩中。它具有完美的菱面体解理，晶体形态多样。',
    origin: '主要分布在墨西哥、美国和冰岛。',
    uses: '用于建筑材料、水泥生产和光学仪器。',
    funFact: '方解石具有双折射特性，透过它看物体会出现双重影像。',
    clues: {
      production: ['🧊 冰川裂谷的沉积岩层', '🕳️ 洞穴钟乳石的主要成分'],
      gameplay: ['🎨 矿物拼装：普通品质容易获得', '🗺️ 远征：水晶洞穴与冰川区域'],
      reward: '💰 基础收集奖励，适合新手熟悉玩法'
    }
  },
  {
    id: 4,
    name: '萤石',
    nameEn: 'Fluorite',
    emoji: '💚',
    rarity: RARITY.COMMON,
    colors: ['#dcfce7', '#bbf7d0', '#86efac'],
    crystalColor: 0xdcfce7,
    formula: 'CaF₂',
    hardness: '4',
    description: '萤石又称氟石，以其丰富多彩的颜色和荧光特性著称。常见颜色包括紫色、绿色、蓝色和黄色。',
    origin: '主要产于中国、墨西哥和南非。',
    uses: '用于冶金工业、光学镜头制造和装饰品。',
    funFact: '萤石在紫外线照射下会发出荧光，这也是其名称的由来。',
    clues: {
      production: ['🏜️ 沙漠戈壁深处的矿脉', '🌋 火山活动区域的伴生矿'],
      gameplay: ['🎨 矿物拼装：普通品质常见', '🗺️ 远征：沙漠与火山地带'],
      reward: '💰 收集可用于兑换其他矿物的基础材料'
    }
  },
  {
    id: 5,
    name: '黄铁矿',
    nameEn: 'Pyrite',
    emoji: '✨',
    rarity: RARITY.UNCOMMON,
    colors: ['#fef08a', '#facc15', '#ca8a04'],
    crystalColor: 0xfef08a,
    formula: 'FeS₂',
    hardness: '6-6.5',
    description: '黄铁矿俗称"愚人金"，因其浅黄铜色和金属光泽常被误认为黄金。它常形成完美的立方体晶体。',
    origin: '主要分布在西班牙、秘鲁和美国。',
    uses: '用于提取硫磺和硫酸，也可作为收藏宝石。',
    funFact: '黄铁矿晶体有时会在岩层中形成完美的五角十二面体。',
    clues: {
      production: ['🌋 火山岩脉中的金属矿脉', '🏜️ 沙漠深处的古老矿层'],
      gameplay: ['🎨 矿物拼装：有一定概率掉落', '🗺️ 远征：推荐火山岩脉（难度2）'],
      reward: '💎 不错的金币奖励，可作为中等价值的交易品'
    }
  },
  {
    id: 6,
    name: '紫水晶',
    nameEn: 'Amethyst',
    emoji: '💜',
    rarity: RARITY.UNCOMMON,
    colors: ['#f3e8ff', '#e9d5ff', '#d8b4fe'],
    crystalColor: 0xf3e8ff,
    formula: 'SiO₂',
    hardness: '7',
    description: '紫水晶是石英的紫色变种，因含有铁和铝的微量元素而呈现紫色。是最受欢迎的宝石之一。',
    origin: '主要产于巴西、乌拉圭和赞比亚。',
    uses: '广泛用于珠宝首饰，被视为二月的生辰石。',
    funFact: '紫水晶在古希腊被认为可以防止醉酒，其名字来自希腊语"不醉酒"。',
    clues: {
      production: ['🕳️ 水晶洞穴深处的紫色晶簇', '🏜️ 沙漠地区的石英矿脉'],
      gameplay: ['🎨 矿物拼装：稀有品质，需要耐心', '🗺️ 远征：水晶洞穴高难度探索'],
      reward: '💜 中等价值宝石，收藏爱好者的入门首选'
    }
  },
  {
    id: 7,
    name: '玛瑙',
    nameEn: 'Agate',
    emoji: '🟤',
    rarity: RARITY.UNCOMMON,
    colors: ['#fed7aa', '#fdba74', '#fb923c'],
    crystalColor: 0xfed7aa,
    formula: 'SiO₂',
    hardness: '6.5-7',
    description: '玛瑙是玉髓的一种，以其独特的条带状结构和丰富的颜色著称。每个玛瑙标本的花纹都是独一无二的。',
    origin: '主要产于巴西、印度和乌拉圭。',
    uses: '用于珠宝、工艺品和装饰材料。',
    funFact: '玛瑙的名字来源于意大利西西里岛的阿基特河，那里最早发现了这种宝石。',
    clues: {
      production: ['🏜️ 沙漠地区的古老岩层', '🌋 火山喷发后的充填矿脉'],
      gameplay: ['🎨 矿物拼装：稀有品质掉落', '🗺️ 远征：沙漠戈壁是主要产地'],
      reward: '🎨 独特纹理标本，具有一定收藏价值'
    }
  },
  {
    id: 8,
    name: '石榴石',
    nameEn: 'Garnet',
    emoji: '❤️',
    rarity: RARITY.UNCOMMON,
    colors: ['#fee2e2', '#fecaca', '#fca5a5'],
    crystalColor: 0xfee2e2,
    formula: 'X₃Y₂(SiO₄)₃',
    hardness: '6.5-7.5',
    description: '石榴石是一组硅酸盐矿物的总称，最常见的是红色的铁铝榴石。晶体通常呈菱形十二面体。',
    origin: '主要分布在斯里兰卡、印度和美国。',
    uses: '作为宝石和工业磨料。',
    funFact: '石榴石因其形状和颜色类似石榴籽而得名，是一月的生辰石。',
    clues: {
      production: ['🏜️ 沙漠戈壁的变质岩层', '🧊 冰川裂谷的古老基岩'],
      gameplay: ['🎨 矿物拼装：稀有品质概率获得', '🗺️ 远征：沙漠或冰川区域探索'],
      reward: '❤️ 一月生辰石，适合作为礼物收藏'
    }
  },
  {
    id: 9,
    name: '海蓝宝',
    nameEn: 'Aquamarine',
    emoji: '💙',
    rarity: RARITY.RARE,
    colors: ['#e0f2fe', '#bae6fd', '#7dd3fc'],
    crystalColor: 0xe0f2fe,
    formula: 'Be₃Al₂Si₆O₁₈',
    hardness: '7.5-8',
    description: '海蓝宝是绿柱石的浅蓝色变种，其名称来自拉丁语"海水"。颜色从淡蓝到深蓝绿不等。',
    origin: '主要产于巴西、马达加斯加和巴基斯坦。',
    uses: '是珍贵的宝石，被视为三月的生辰石。',
    funFact: '古代水手相信海蓝宝可以平息海浪，保佑航行平安。',
    clues: {
      production: ['🧊 冰川裂谷深处的伟晶岩', '🏜️ 沙漠戈壁的稀有矿脉'],
      gameplay: ['🎨 矿物拼装：珍稀品质，需要更多碎片', '🗺️ 远征：推荐冰川裂谷（难度4）'],
      reward: '💙 三月生辰石，水手的守护石，价值不菲'
    }
  },
  {
    id: 10,
    name: '橄榄石',
    nameEn: 'Peridot',
    emoji: '🟢',
    rarity: RARITY.RARE,
    colors: ['#d9f99d', '#bef264', '#84cc16'],
    crystalColor: 0xd9f99d,
    formula: '(Mg,Fe)₂SiO₄',
    hardness: '6.5-7',
    description: '橄榄石是一种含镁和铁的硅酸盐矿物，以其独特的橄榄绿色著称。它是地球上最古老的矿物之一。',
    origin: '主要产于美国、中国和缅甸。',
    uses: '作为宝石，是八月的生辰石。',
    funFact: '橄榄石有时会在陨石中被发现，被称为"天外来石"。',
    clues: {
      production: ['🌋 火山岩脉的超基性岩石', '🏜️ 沙漠地区的古老熔岩'],
      gameplay: ['🎨 矿物拼装：珍稀品质，考验运气', '🗺️ 远征：火山岩脉深度探索'],
      reward: '🟢 八月生辰石，传说来自天外的神秘宝石'
    }
  },
  {
    id: 11,
    name: '托帕石',
    nameEn: 'Topaz',
    emoji: '💛',
    rarity: RARITY.RARE,
    colors: ['#fef9c3', '#fef08a', '#facc15'],
    crystalColor: 0xfef9c3,
    formula: 'Al₂SiO₄(F,OH)₂',
    hardness: '8',
    description: '托帕石是一种含氟铝硅酸盐矿物，天然托帕石通常无色或浅黄色，经辐照处理可呈现蓝色。',
    origin: '主要产于巴西、斯里兰卡和俄罗斯。',
    uses: '作为贵重宝石，是十一月的生辰石。',
    funFact: '托帕石的名字来自红海的托帕兹岛，传说中那里是最早发现这种宝石的地方。',
    clues: {
      production: ['🧊 冰川裂谷的伟晶岩脉', '🕳️ 水晶洞穴最深处的晶洞'],
      gameplay: ['🎨 矿物拼装：珍稀品质，8块碎片挑战', '🗺️ 远征：冰川裂谷或高难度洞穴'],
      reward: '💛 十一月生辰石，硬度极高的珍贵宝石'
    }
  },
  {
    id: 12,
    name: '碧玺',
    nameEn: 'Tourmaline',
    emoji: '💗',
    rarity: RARITY.EPIC,
    colors: ['#fce7f3', '#f9a8d4', '#ec4899'],
    crystalColor: 0xfce7f3,
    formula: 'Na(Mg,Fe,Mn,Li,Al)₃Al₆(BO₃)₃Si₆O₁₈(OH)₄',
    hardness: '7-7.5',
    description: '碧玺又称电气石，是化学成分最复杂的矿物之一。它以其丰富的色彩著称，同一块晶体上可能出现多种颜色。',
    origin: '主要产于巴西、阿富汗和美国。',
    uses: '是珍贵的宝石品种，也用于电子工业。',
    funFact: '碧玺具有压电性和热电性，加热时两端会产生电荷。',
    clues: {
      production: ['🏜️ 沙漠戈壁的稀有伟晶岩', '🌌 深渊秘境的多彩矿脉'],
      gameplay: ['🎨 矿物拼装：史诗品质，10块碎片大挑战', '🗺️ 远征：推荐深渊秘境（难度5）'],
      reward: '💗 彩虹宝石，色彩最丰富的矿物，收藏价值极高'
    }
  },
  {
    id: 13,
    name: '坦桑石',
    nameEn: 'Tanzanite',
    emoji: '💠',
    rarity: RARITY.EPIC,
    colors: ['#ede9fe', '#ddd6fe', '#a78bfa'],
    crystalColor: 0xede9fe,
    formula: 'Ca₂Al₃Si₃O₁₂(OH)',
    hardness: '6-6.5',
    description: '坦桑石是黝帘石的蓝色变种，仅在坦桑尼亚发现。它具有强烈的多色性，从不同角度看呈现不同颜色。',
    origin: '唯一产地是坦桑尼亚的阿鲁沙地区。',
    uses: '是非常珍贵的宝石，被称为"20世纪的宝石"。',
    funFact: '坦桑石是在1967年才被发现的，产量极其稀少。',
    clues: {
      production: ['🌌 深渊秘境的独家产地', '🧊 冰川裂谷极深处的变质岩'],
      gameplay: ['🎨 矿物拼装：史诗品质，需要耐心与技巧', '🗺️ 远征：深渊秘境是唯一希望'],
      reward: '💠 20世纪新发现宝石，产量极其稀少，极具投资价值'
    }
  },
  {
    id: 14,
    name: '红纹石',
    nameEn: 'Rhodochrosite',
    emoji: '💮',
    rarity: RARITY.EPIC,
    colors: ['#ffe4e6', '#fecdd3', '#fda4af'],
    crystalColor: 0xffe4e6,
    formula: 'MnCO₃',
    hardness: '3.5-4',
    description: '红纹石又称菱锰矿，以其独特的粉红色和带状纹理著称。高品质的红纹石具有美丽的花纹，被称为"印加玫瑰"。',
    origin: '主要产于阿根廷、美国和中国。',
    uses: '作为收藏宝石和装饰材料。',
    funFact: '红纹石是阿根廷的国石，传说中它可以带来爱情和友谊。',
    clues: {
      production: ['🏜️ 沙漠深处的沉积锰矿', '🌋 火山岩脉中的热液矿脉'],
      gameplay: ['🎨 矿物拼装：史诗品质，印加玫瑰传说', '🗺️ 远征：高难度沙漠或火山探索'],
      reward: '💮 阿根廷国石，印加玫瑰，象征爱情与友谊'
    }
  },
  {
    id: 15,
    name: '红宝石',
    nameEn: 'Ruby',
    emoji: '❤️‍🔥',
    rarity: RARITY.LEGENDARY,
    colors: ['#fee2e2', '#fca5a5', '#dc2626'],
    crystalColor: 0xfee2e2,
    formula: 'Al₂O₃',
    hardness: '9',
    description: '红宝石是刚玉的红色变种，因含有铬元素而呈现鲜艳的红色。它是世界上最珍贵的宝石之一，硬度仅次于钻石。',
    origin: '主要产于缅甸、斯里兰卡和泰国。',
    uses: '是最贵重的宝石之一，被视为七月的生辰石。',
    funFact: '世界上最大的红宝石重约400克拉，被称为"红宝石之王"。',
    clues: {
      production: ['🌌 深渊秘境最深处的刚玉矿脉', '🏜️ 沙漠戈壁的远古变质岩核心'],
      gameplay: ['🎨 矿物拼装：传说品质，12块碎片终极挑战', '🗺️ 远征：深渊秘境（难度5）是唯一途径'],
      reward: '❤️‍🔥 七月生辰石，五大宝石之一，王者级收藏价值'
    }
  },
  {
    id: 16,
    name: '蓝宝石',
    nameEn: 'Sapphire',
    emoji: '💙‍',
    rarity: RARITY.LEGENDARY,
    colors: ['#dbeafe', '#93c5fd', '#2563eb'],
    crystalColor: 0xdbeafe,
    formula: 'Al₂O₃',
    hardness: '9',
    description: '蓝宝石是刚玉的蓝色变种（除红色外的刚玉都称为蓝宝石）。它象征着忠诚、智慧和高贵。',
    origin: '主要产于斯里兰卡、缅甸和澳大利亚。',
    uses: '是最贵重的宝石之一，被视为九月的生辰石。',
    funFact: '英国王室的加冕戒指上镶嵌的就是一颗重达104克拉的蓝宝石。',
    clues: {
      production: ['🌌 深渊秘境的刚玉原生矿床', '🧊 冰川裂谷最深处的变质岩'],
      gameplay: ['🎨 矿物拼装：传说品质，智慧与忠诚的象征', '🗺️ 远征：深渊秘境极限挑战'],
      reward: '💙 九月生辰石，王室钟爱的宝石，忠诚与智慧的象征'
    }
  },
  {
    id: 17,
    name: '祖母绿',
    nameEn: 'Emerald',
    emoji: '💚‍',
    rarity: RARITY.LEGENDARY,
    colors: ['#d1fae5', '#6ee7b7', '#10b981'],
    crystalColor: 0xd1fae5,
    formula: 'Be₃Al₂Si₆O₁₈',
    hardness: '7.5-8',
    description: '祖母绿是绿柱石的翠绿色变种，因含有铬和钒元素而呈现鲜艳的绿色。它是绿宝石之王。',
    origin: '主要产于哥伦比亚、赞比亚和巴西。',
    uses: '是世界五大宝石之一，被视为五月的生辰石。',
    funFact: '几乎所有天然祖母绿都含有内含物，这些"花园"被视为其天然身份的证明。',
    clues: {
      production: ['🌌 深渊秘境的绿柱石伟晶岩', '🏜️ 沙漠戈壁最深的云母片岩'],
      gameplay: ['🎨 矿物拼装：传说品质，绿宝石之王', '🗺️ 远征：深渊秘境终极探索'],
      reward: '💚 五月生辰石，五大宝石之一，绿宝石之王'
    }
  },
  {
    id: 18,
    name: '变石',
    nameEn: 'Alexandrite',
    emoji: '✨‍',
    rarity: RARITY.LEGENDARY,
    colors: ['#dcfce7', '#e9d5ff', '#a855f7'],
    crystalColor: 0xdcfce7,
    formula: 'BeAl₂O₄',
    hardness: '8.5',
    description: '变石又称亚历山大石，是金绿宝石的变种。它最神奇的特性是变色效应：在日光下呈绿色，在灯光下呈红色。',
    origin: '主要产于俄罗斯、斯里兰卡和巴西。',
    uses: '是最稀有的宝石之一，被誉为"白昼里的祖母绿，黑夜里的红宝石"。',
    funFact: '变石于1830年在俄罗斯乌拉尔山脉发现，恰逢俄国沙皇亚历山大二世的生日，因此得名。',
    clues: {
      production: ['🌌 深渊秘境最神秘的变色矿脉', '🧊 冰川裂谷的金绿宝石矿床'],
      gameplay: ['🎨 矿物拼装：传说品质，白昼祖母绿黑夜红宝石', '🗺️ 远征：深渊秘境传奇难度'],
      reward: '✨ 最稀有宝石之一，沙皇命名，白昼祖母绿黑夜红宝石'
    }
  }
]

export const getMineralById = (id) => {
  return MINERALS.find(m => m.id === id)
}

export const getMineralsByRarity = (rarity) => {
  return MINERALS.filter(m => m.rarity === rarity)
}

export const getRandomMineralByRarity = (rarity) => {
  const minerals = getMineralsByRarity(rarity)
  return minerals[Math.floor(Math.random() * minerals.length)]
}

export const getUncollectedMineralsByRarity = (rarity, collectedIds) => {
  const minerals = getMineralsByRarity(rarity)
  return minerals.filter(m => !collectedIds.has(m.id))
}

export const getRandomUncollectedMineralByRarity = (rarity, collectedIds) => {
  const uncollected = getUncollectedMineralsByRarity(rarity, collectedIds)
  if (uncollected.length === 0) return null
  return uncollected[Math.floor(Math.random() * uncollected.length)]
}

export const ORIGIN_FILTERS = [
  { label: '全部产地', value: 'all' },
  { label: '🇧🇷 巴西', value: '巴西' },
  { label: '🇨🇳 中国', value: '中国' },
  { label: '🇲🇬 马达加斯加', value: '马达加斯加' },
  { label: '🇱🇰 斯里兰卡', value: '斯里兰卡' },
  { label: '🇮🇳 印度', value: '印度' },
  { label: '🇺🇸 美国', value: '美国' },
  { label: '🇷🇺 俄罗斯', value: '俄罗斯' },
  { label: '🇿🇲 赞比亚', value: '赞比亚' },
  { label: '🇹🇿 坦桑尼亚', value: '坦桑尼亚' },
  { label: '🇲🇽 墨西哥', value: '墨西哥' },
  { label: '🇦🇷 阿根廷', value: '阿根廷' },
  { label: '🇦🇫 阿富汗', value: '阿富汗' },
  { label: '🇹🇭 泰国', value: '泰国' },
  { label: '🇵🇰 巴基斯坦', value: '巴基斯坦' },
  { label: '🇵🇪 秘鲁', value: '秘鲁' },
  { label: '🇪🇸 西班牙', value: '西班牙' },
  { label: '🇦🇺 澳大利亚', value: '澳大利亚' },
  { label: '🇮🇸 冰岛', value: '冰岛' },
  { label: '🇺🇾 乌拉圭', value: '乌拉圭' },
  { label: '🌍 其他地区', value: 'other' }
]

export const USE_FILTERS = [
  { label: '全部用途', value: 'all' },
  { label: '💍 珠宝首饰', value: '珠宝' },
  { label: '⚙️ 工业应用', value: '工业' },
  { label: '🔬 光学仪器', value: '光学' },
  { label: '🏗️ 建筑材料', value: '建筑' },
  { label: '🎨 装饰工艺', value: '装饰' },
  { label: '📱 电子工业', value: '电子' },
  { label: '🧪 冶金化工', value: '冶金' },
  { label: '🏺 陶瓷玻璃', value: '陶瓷' },
  { label: '💎 收藏宝石', value: '收藏' }
]

export const HARDNESS_FILTERS = [
  { label: '全部硬度', value: 'all', min: 0, max: 10 },
  { label: '软 (1-3)', value: 'soft', min: 1, max: 3 },
  { label: '中 (4-6)', value: 'medium', min: 4, max: 6 },
  { label: '硬 (7-8)', value: 'hard', min: 7, max: 8 },
  { label: '极硬 (9-10)', value: 'very_hard', min: 9, max: 10 }
]

export const COLLECTION_COUNT_FILTERS = [
  { label: '全部', value: 'all' },
  { label: '未收集 (0)', value: '0' },
  { label: '少量 (1-2)', value: '1-2' },
  { label: '中等 (3-5)', value: '3-5' },
  { label: '丰富 (6+)', value: '6+' }
]

export const parseHardness = (hardnessStr) => {
  if (!hardnessStr) return 0
  const match = hardnessStr.match(/([\d.]+)(?:\s*-\s*([\d.]+))?/)
  if (!match) return 0
  if (match[2]) return (parseFloat(match[1]) + parseFloat(match[2])) / 2
  return parseFloat(match[1])
}
