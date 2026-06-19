import { RARITY } from './rarity'

export const EXPEDITION_LOCATIONS = [
  {
    id: 1,
    name: '水晶洞穴',
    nameEn: 'Crystal Cave',
    emoji: '🕳️',
    description: '幽深的洞穴中闪烁着水晶的光芒，常见矿物的聚集地。',
    staminaCost: 10,
    difficulty: 1,
    unlocked: true,
    minRarity: RARITY.COMMON,
    maxRarity: RARITY.UNCOMMON,
    backgroundGradient: 'linear-gradient(135deg, #1e3a5f, #0c1929)',
    rewards: {
      coins: [10, 30],
      mineralChance: 0.7
    },
    recommendedLevel: 1
  },
  {
    id: 2,
    name: '火山岩脉',
    nameEn: 'Volcanic Vein',
    emoji: '🌋',
    description: '炽热的火山区域，地下矿脉丰富，可能发现稀有矿物。',
    staminaCost: 20,
    difficulty: 2,
    unlocked: true,
    minRarity: RARITY.COMMON,
    maxRarity: RARITY.RARE,
    backgroundGradient: 'linear-gradient(135deg, #5c1a1a, #2d0a0a)',
    rewards: {
      coins: [25, 60],
      mineralChance: 0.6
    },
    recommendedLevel: 3
  },
  {
    id: 3,
    name: '沙漠戈壁',
    nameEn: 'Desert Gobi',
    emoji: '🏜️',
    description: '广袤的沙漠中隐藏着远古的矿物结晶，风沙中闪烁着宝石的光芒。',
    staminaCost: 30,
    difficulty: 3,
    unlocked: true,
    minRarity: RARITY.UNCOMMON,
    maxRarity: RARITY.EPIC,
    backgroundGradient: 'linear-gradient(135deg, #8b6914, #4a3608)',
    rewards: {
      coins: [50, 120],
      mineralChance: 0.5
    },
    recommendedLevel: 5
  },
  {
    id: 4,
    name: '冰川裂谷',
    nameEn: 'Glacier Rift',
    emoji: '🧊',
    description: '千年冰川下隐藏着神秘的矿物，只有勇敢的探险家才能到达。',
    staminaCost: 45,
    difficulty: 4,
    unlocked: true,
    minRarity: RARITY.RARE,
    maxRarity: RARITY.EPIC,
    backgroundGradient: 'linear-gradient(135deg, #1a4a5c, #0a1a2d)',
    rewards: {
      coins: [80, 200],
      mineralChance: 0.45
    },
    recommendedLevel: 8
  },
  {
    id: 5,
    name: '深渊秘境',
    nameEn: 'Abyss Realm',
    emoji: '🌌',
    description: '传说中的神秘之地，蕴藏着世界上最珍贵的宝石，危险与机遇并存。',
    staminaCost: 60,
    difficulty: 5,
    unlocked: true,
    minRarity: RARITY.EPIC,
    maxRarity: RARITY.LEGENDARY,
    backgroundGradient: 'linear-gradient(135deg, #2d1a5c, #0a0a2d)',
    rewards: {
      coins: [150, 400],
      mineralChance: 0.4
    },
    recommendedLevel: 10
  }
]

export const EXPEDITION_EVENTS = [
  {
    id: 'discovery',
    name: '矿脉发现',
    emoji: '⛏️',
    description: '你发现了一处隐藏的矿脉！',
    type: 'positive',
    effects: {
      mineralChance: 0.3,
      bonusRarity: 1
    },
    choices: [
      {
        id: 'mine_carefully',
        text: '小心开采',
        description: '稳妥地开采矿物',
        result: {
          success: {
            message: '你小心翼翼地开采，成功获得了矿物！',
            coinBonus: 1.2,
            rarityBonus: 0
          },
          failure: {
            message: '矿物有些松动，你只获得了部分。',
            coinBonus: 0.8,
            rarityBonus: 0
          }
        },
        successRate: 0.9
      },
      {
        id: 'mine_aggressive',
        text: '全力开采',
        description: '冒险尝试获取更珍贵的矿物',
        result: {
          success: {
            message: '太棒了！你发现了更稀有的矿物！',
            coinBonus: 1.5,
            rarityBonus: 1
          },
          failure: {
            message: '矿脉坍塌了！你差点受伤，什么也没找到。',
            coinBonus: 0,
            rarityBonus: 0,
            noMineral: true
          }
        },
        successRate: 0.5
      }
    ]
  },
  {
    id: 'weather_change',
    name: '天气变化',
    emoji: '⛈️',
    description: '天气突然发生了变化...',
    type: 'neutral',
    effects: {},
    choices: [
      {
        id: 'wait',
        text: '等待天气好转',
        description: '找个安全的地方躲避',
        result: {
          success: {
            message: '天气好转了，你继续考察。',
            coinBonus: 1.0,
            staminaBonus: -5
          },
          failure: {
            message: '等了很久天气也没好，你只好继续前进。',
            coinBonus: 0.9,
            staminaBonus: -10
          }
        },
        successRate: 0.7
      },
      {
        id: 'continue',
        text: '冒雨前进',
        description: '不畏艰险继续考察',
        result: {
          success: {
            message: '你在恶劣的天气中发现了别人错过的矿物！',
            coinBonus: 1.3,
            rarityBonus: 1
          },
          failure: {
            message: '你在泥泞中滑倒，丢失了一些物资。',
            coinBonus: 0.7,
            staminaBonus: -15
          }
        },
        successRate: 0.4
      }
    ]
  },
  {
    id: 'wild_animal',
    name: '野生动物',
    emoji: '🐺',
    description: '你遇到了一头野生动物！',
    type: 'negative',
    effects: {},
    choices: [
      {
        id: 'avoid',
        text: '悄悄避开',
        description: '绕道而行避免冲突',
        result: {
          success: {
            message: '你成功避开了野生动物。',
            coinBonus: 1.0,
            staminaBonus: -5
          },
          failure: {
            message: '你被发现了！慌乱中丢失了一些物品。',
            coinBonus: 0.6,
            staminaBonus: -10
          }
        },
        successRate: 0.8
      },
      {
        id: 'scare',
        text: '吓退它',
        description: '制造噪音吓退动物',
        result: {
          success: {
            message: '你成功吓退了动物！在它的巢穴附近你发现了一些矿物。',
            coinBonus: 1.4,
            rarityBonus: 1
          },
          failure: {
            message: '动物被激怒了！你仓皇逃跑。',
            coinBonus: 0.5,
            staminaBonus: -20
          }
        },
        successRate: 0.45
      }
    ]
  },
  {
    id: 'treasure_map',
    name: '藏宝图碎片',
    emoji: '🗺️',
    description: '你发现了一张古老的藏宝图碎片！',
    type: 'positive',
    effects: {},
    choices: [
      {
        id: 'study',
        text: '仔细研究',
        description: '花时间研究地图',
        result: {
          success: {
            message: '你破译了地图的秘密，找到了一个宝藏！',
            coinBonus: 2.0,
            rarityBonus: 2
          },
          failure: {
            message: '地图太古老了，你无法解读。',
            coinBonus: 1.0,
            staminaBonus: -10
          }
        },
        successRate: 0.6
      },
      {
        id: 'follow_hunch',
        text: '凭感觉寻找',
        description: '按照直觉去寻找',
        result: {
          success: {
            message: '你的直觉很准！你找到了一个小宝藏！',
            coinBonus: 1.5,
            rarityBonus: 1
          },
          failure: {
            message: '你迷路了，浪费了很多时间。',
            coinBonus: 0.8,
            staminaBonus: -15
          }
        },
        successRate: 0.35
      }
    ]
  },
  {
    id: 'equipment_failure',
    name: '装备故障',
    emoji: '🔧',
    description: '你的考察装备出现了故障...',
    type: 'negative',
    effects: {},
    choices: [
      {
        id: 'repair',
        text: '修理装备',
        description: '花费时间修理装备',
        result: {
          success: {
            message: '你修好了装备，继续考察。',
            coinBonus: 1.0,
            staminaBonus: -5
          },
          failure: {
            message: '修理失败，你只能用损坏的装备继续。',
            coinBonus: 0.7,
            rarityBonus: -1
          }
        },
        successRate: 0.7
      },
      {
        id: 'continue_broken',
        text: '继续使用',
        description: '带着损坏的装备继续',
        result: {
          success: {
            message: '虽然装备不好用，但你还是有收获！',
            coinBonus: 0.85,
            staminaBonus: -10
          },
          failure: {
            message: '装备彻底坏了，你无法继续考察。',
            coinBonus: 0.4,
            noMineral: true,
            staminaBonus: -10
          }
        },
        successRate: 0.5
      }
    ]
  },
  {
    id: 'fellow_explorer',
    name: '探险同伴',
    emoji: '🧑‍🤝‍🧑',
    description: '你遇到了另一位探险家！',
    type: 'neutral',
    effects: {},
    choices: [
      {
        id: 'team_up',
        text: '组队探索',
        description: '和其他探险家组队',
        result: {
          success: {
            message: '你们合作无间，发现了更多矿物！',
            coinBonus: 1.6,
            rarityBonus: 1,
            staminaBonus: 5
          },
          failure: {
            message: '你们的想法不太合拍，效率降低了。',
            coinBonus: 0.9,
            staminaBonus: -5
          }
        },
        successRate: 0.65
      },
      {
        id: 'trade',
        text: '交换情报',
        description: '交换探险情报',
        result: {
          success: {
            message: '你获得了有用的情报，找到了一处好矿点！',
            coinBonus: 1.3,
            rarityBonus: 1
          },
          failure: {
            message: '情报没什么用，浪费了一些时间。',
            coinBonus: 1.0,
            staminaBonus: -5
          }
        },
        successRate: 0.55
      }
    ]
  },
  {
    id: 'rare_formation',
    name: '奇特地貌',
    emoji: '🏔️',
    description: '你发现了一处奇特的地质构造！',
    type: 'positive',
    effects: {
      mineralChance: 0.4,
      bonusRarity: 1
    },
    choices: [
      {
        id: 'explore_carefully',
        text: '仔细探索',
        description: '谨慎地探索这个区域',
        result: {
          success: {
            message: '你的耐心得到了回报，发现了珍贵的矿物！',
            coinBonus: 1.5,
            rarityBonus: 2
          },
          failure: {
            message: '虽然很小心，但你还是惊动了一些碎石，收获一般。',
            coinBonus: 1.1,
            rarityBonus: 0
          }
        },
        successRate: 0.85
      },
      {
        id: 'deep_dive',
        text: '深入探索',
        description: '冒险深入危险区域',
        result: {
          success: {
            message: '难以置信！你发现了传说中的宝藏！',
            coinBonus: 2.5,
            rarityBonus: 3
          },
          failure: {
            message: '发生了小型塌方，你紧急撤退，收获甚微。',
            coinBonus: 0.5,
            noMineral: true,
            staminaBonus: -20
          }
        },
        successRate: 0.25
      }
    ]
  },
  {
    id: 'rest_spot',
    name: '休息点',
    emoji: '⛺',
    description: '你发现了一个安全的休息点。',
    type: 'positive',
    effects: {},
    choices: [
      {
        id: 'rest_short',
        text: '短暂休息',
        description: '稍微休息一下',
        result: {
          success: {
            message: '你恢复了一些体力。',
            coinBonus: 1.0,
            staminaBonus: 15
          },
          failure: {
            message: '休息了一会儿，感觉好多了。',
            coinBonus: 1.0,
            staminaBonus: 10
          }
        },
        successRate: 1.0
      },
      {
        id: 'explore_around',
        text: '探索周围',
        description: '利用休息时间探索周围',
        result: {
          success: {
            message: '你在休息点附近发现了一些矿物！',
            coinBonus: 1.3,
            rarityBonus: 0,
            staminaBonus: 5
          },
          failure: {
            message: '周围没什么特别的，你简单休息了一下。',
            coinBonus: 1.0,
            staminaBonus: 5
          }
        },
        successRate: 0.6
      }
    ]
  }
]

export const getLocationById = (id) => {
  return EXPEDITION_LOCATIONS.find(loc => loc.id === id)
}

export const getRandomEvent = () => {
  return EXPEDITION_EVENTS[Math.floor(Math.random() * EXPEDITION_EVENTS.length)]
}

export const getEventById = (id) => {
  return EXPEDITION_EVENTS.find(ev => ev.id === id)
}

export const RARITY_LEVELS = [
  { value: 0, rarity: RARITY.COMMON },
  { value: 1, rarity: RARITY.UNCOMMON },
  { value: 2, rarity: RARITY.RARE },
  { value: 3, rarity: RARITY.EPIC },
  { value: 4, rarity: RARITY.LEGENDARY }
]

export const getRarityByLevel = (level) => {
  const clampedLevel = Math.max(0, Math.min(4, level))
  return RARITY_LEVELS[clampedLevel].rarity
}

export const getRarityLevel = (rarity) => {
  const found = RARITY_LEVELS.find(r => r.rarity === rarity)
  return found ? found.value : 0
}
