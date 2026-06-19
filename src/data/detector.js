import { RARITY } from './rarity'

export const DETECTOR_TIERS = {
  TIER_1: 'tier1',
  TIER_2: 'tier2',
  TIER_3: 'tier3',
  TIER_4: 'tier4',
  TIER_5: 'tier5'
}

export const DETECTOR_TIER_CONFIG = {
  [DETECTOR_TIERS.TIER_1]: {
    id: DETECTOR_TIERS.TIER_1,
    name: '初级探测器',
    emoji: '📡',
    description: '基础矿物探测设备，适合新手使用',
    color: '#9ca3af',
    gradient: 'linear-gradient(135deg, #374151, #6b7280)',
    maxLevel: 10,
    baseRarityBonus: 0,
    baseDropRateBonus: 0,
    baseCoinBonus: 0,
    unlockCost: 0
  },
  [DETECTOR_TIERS.TIER_2]: {
    id: DETECTOR_TIERS.TIER_2,
    name: '中级探测器',
    emoji: '🔭',
    description: '改进型探测器，提高稀有矿物发现概率',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #166534, #22c55e)',
    maxLevel: 20,
    baseRarityBonus: 1,
    baseDropRateBonus: 5,
    baseCoinBonus: 10,
    unlockCost: 5000
  },
  [DETECTOR_TIERS.TIER_3]: {
    id: DETECTOR_TIERS.TIER_3,
    name: '高级探测器',
    emoji: '🛰️',
    description: '专业级探测器，显著提升珍稀矿物获取率',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    maxLevel: 30,
    baseRarityBonus: 2,
    baseDropRateBonus: 10,
    baseCoinBonus: 25,
    unlockCost: 20000
  },
  [DETECTOR_TIERS.TIER_4]: {
    id: DETECTOR_TIERS.TIER_4,
    name: '专家探测器',
    emoji: '⚡',
    description: '专家级设备，大幅提升史诗矿物发现概率',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce, #a855f7)',
    maxLevel: 40,
    baseRarityBonus: 3,
    baseDropRateBonus: 15,
    baseCoinBonus: 50,
    unlockCost: 80000
  },
  [DETECTOR_TIERS.TIER_5]: {
    id: DETECTOR_TIERS.TIER_5,
    name: '传说探测器',
    emoji: '🌟',
    description: '传说级设备，大幅提升所有品质矿物概率，传闻可发现传说矿物',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
    maxLevel: 50,
    baseRarityBonus: 4,
    baseDropRateBonus: 25,
    baseCoinBonus: 100,
    unlockCost: 300000
  }
}

export const AFFIX_TYPES = {
  RARITY_BOOST: 'rarityBoost',
  DROP_RATE: 'dropRate',
  COIN_BONUS: 'coinBonus',
  SPECIFIC_RARITY: 'specificRarity',
  MULTI_DROP: 'multiDrop',
  EXPEDITION_BONUS: 'expeditionBonus'
}

export const AFFIX_QUALITY = {
  NORMAL: 'normal',
  GOOD: 'good',
  EXCELLENT: 'excellent',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
}

export const AFFIX_QUALITY_CONFIG = {
  [AFFIX_QUALITY.NORMAL]: {
    name: '普通',
    color: '#9ca3af',
    multiplier: 1,
    weight: 50
  },
  [AFFIX_QUALITY.GOOD]: {
    name: '良好',
    color: '#22c55e',
    multiplier: 1.5,
    weight: 30
  },
  [AFFIX_QUALITY.EXCELLENT]: {
    name: '优秀',
    color: '#3b82f6',
    multiplier: 2,
    weight: 13
  },
  [AFFIX_QUALITY.EPIC]: {
    name: '史诗',
    color: '#a855f7',
    multiplier: 3,
    weight: 5
  },
  [AFFIX_QUALITY.LEGENDARY]: {
    name: '传说',
    color: '#f59e0b',
    multiplier: 5,
    weight: 2
  }
}

export const AFFIX_CONFIG = {
  [AFFIX_TYPES.RARITY_BOOST]: {
    id: AFFIX_TYPES.RARITY_BOOST,
    name: '稀有度提升',
    description: '提升发现更高稀有度矿物的概率',
    baseValue: 1,
    maxAffixCount: 3,
    valuePerLevel: 0.1,
    icon: '💎'
  },
  [AFFIX_TYPES.DROP_RATE]: {
    id: AFFIX_TYPES.DROP_RATE,
    name: '掉落率提升',
    description: '提升矿物掉落的基础概率',
    baseValue: 2,
    maxAffixCount: 3,
    valuePerLevel: 0.5,
    icon: '🎯'
  },
  [AFFIX_TYPES.COIN_BONUS]: {
    id: AFFIX_TYPES.COIN_BONUS,
    name: '金币加成',
    description: '获得矿物时额外获得金币',
    baseValue: 5,
    maxAffixCount: 2,
    valuePerLevel: 1,
    icon: '💰'
  },
  [AFFIX_TYPES.SPECIFIC_RARITY]: {
    id: AFFIX_TYPES.SPECIFIC_RARITY,
    name: '特定稀有度加成',
    description: '对特定稀有度矿物概率大幅提升',
    baseValue: 3,
    maxAffixCount: 2,
    valuePerLevel: 0.5,
    icon: '✨',
    rarityOptions: [RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY]
  },
  [AFFIX_TYPES.MULTI_DROP]: {
    id: AFFIX_TYPES.MULTI_DROP,
    name: '多重掉落',
    description: '有概率一次获得多个矿物',
    baseValue: 2,
    maxAffixCount: 1,
    valuePerLevel: 0.3,
    icon: '🎊'
  },
  [AFFIX_TYPES.EXPEDITION_BONUS]: {
    id: AFFIX_TYPES.EXPEDITION_BONUS,
    name: '探险加成',
    description: '探险时额外获得探险经验和金币',
    baseValue: 5,
    maxAffixCount: 2,
    valuePerLevel: 1,
    icon: '🗺️'
  }
}

export const getUpgradeCost = (tier, currentLevel) => {
  const tierConfig = DETECTOR_TIER_CONFIG[tier]
  const baseMultiplier = {
    [DETECTOR_TIERS.TIER_1]: 50,
    [DETECTOR_TIERS.TIER_2]: 100,
    [DETECTOR_TIERS.TIER_3]: 200,
    [DETECTOR_TIERS.TIER_4]: 500,
    [DETECTOR_TIERS.TIER_5]: 1000
  }[tier] || 50

  return Math.floor(baseMultiplier * Math.pow(1.15, currentLevel))
}

export const getLevelExpRequired = (tier, level) => {
  const tierConfig = DETECTOR_TIER_CONFIG[tier]
  const baseExp = {
    [DETECTOR_TIERS.TIER_1]: 100,
    [DETECTOR_TIERS.TIER_2]: 200,
    [DETECTOR_TIERS.TIER_3]: 400,
    [DETECTOR_TIERS.TIER_4]: 800,
    [DETECTOR_TIERS.TIER_5]: 1600
  }[tier] || 100

  return Math.floor(baseExp * Math.pow(1.2, level - 1))
}

export const rollAffixQuality = () => {
  const totalWeight = Object.values(AFFIX_QUALITY_CONFIG).reduce((sum, q) => sum + q.weight, 0)
  let random = Math.random() * totalWeight

  for (const [quality, config] of Object.entries(AFFIX_QUALITY_CONFIG)) {
    random -= config.weight
    if (random <= 0) {
      return quality
    }
  }
  return AFFIX_QUALITY.NORMAL
}

export const rollAffixType = (existingTypes = []) => {
  const availableTypes = Object.values(AFFIX_TYPES).filter(type => {
    const count = existingTypes.filter(t => t === type).length
    const maxCount = AFFIX_CONFIG[type].maxAffixCount
    return count < maxCount
  })

  if (availableTypes.length === 0) return null

  return availableTypes[Math.floor(Math.random() * availableTypes.length)]
}

export const generateAffix = (tier, level, existingAffixes = []) => {
  const quality = rollAffixQuality()
  const existingTypes = existingAffixes.map(a => a.type)
  const type = rollAffixType(existingTypes)

  if (!type) return null

  const config = AFFIX_CONFIG[type]
  const qualityConfig = AFFIX_QUALITY_CONFIG[quality]
  const levelMultiplier = 1 + (level - 1) * config.valuePerLevel
  const value = Math.round(config.baseValue * qualityConfig.multiplier * levelMultiplier * 10) / 10

  let specificRarity = null
  if (type === AFFIX_TYPES.SPECIFIC_RARITY) {
    specificRarity = config.rarityOptions[Math.floor(Math.random() * config.rarityOptions.length)]
  }

  return {
    id: Date.now() + Math.random(),
    type,
    quality,
    value,
    specificRarity
  }
}

export const getAffixDescription = (affix) => {
  const config = AFFIX_CONFIG[affix.type]
  const qualityConfig = AFFIX_QUALITY_CONFIG[affix.quality]

  if (affix.type === AFFIX_TYPES.SPECIFIC_RARITY) {
    const rarityName = {
      [RARITY.RARE]: '珍稀',
      [RARITY.EPIC]: '史诗',
      [RARITY.LEGENDARY]: '传说'
    }[affix.specificRarity] || ''
    return `${config.icon} ${config.name}(${rarityName}) +${affix.value}%`
  }

  if (affix.type === AFFIX_TYPES.RARITY_BOOST) {
    return `${config.icon} ${config.name} +${affix.value}级`
  }

  if (affix.type === AFFIX_TYPES.MULTI_DROP) {
    return `${config.icon} ${config.name} ${affix.value}%概率`
  }

  return `${config.icon} ${config.name} +${affix.value}%`
}

export const getMaxAffixSlots = (tier) => {
  return {
    [DETECTOR_TIERS.TIER_1]: 2,
    [DETECTOR_TIERS.TIER_2]: 3,
    [DETECTOR_TIERS.TIER_3]: 4,
    [DETECTOR_TIERS.TIER_4]: 5,
    [DETECTOR_TIERS.TIER_5]: 6
  }[tier] || 2
}

export const rerollCost = (tier) => {
  return {
    [DETECTOR_TIERS.TIER_1]: 200,
    [DETECTOR_TIERS.TIER_2]: 500,
    [DETECTOR_TIERS.TIER_3]: 1000,
    [DETECTOR_TIERS.TIER_4]: 2500,
    [DETECTOR_TIERS.TIER_5]: 5000
  }[tier] || 200
}
