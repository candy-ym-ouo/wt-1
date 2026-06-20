import { RARITY, RARITY_CONFIG } from './rarity'

export const EXCHANGE_POINT_VALUES = {
  [RARITY.COMMON]: 10,
  [RARITY.UNCOMMON]: 40,
  [RARITY.RARE]: 150,
  [RARITY.EPIC]: 600,
  [RARITY.LEGENDARY]: 3000
}

export const COIN_CONVERSION_RATE = 0.5

export const ITEM_REWARDS = [
  {
    id: 'scrap_pack_small',
    name: '小型碎片包',
    emoji: '📦',
    description: '内含稀有矿物碎片',
    rarity: 'common',
    minRarityToDrop: RARITY.COMMON
  },
  {
    id: 'coin_bag_small',
    name: '小号金币袋',
    emoji: '💰',
    description: '额外奖励 50 金币',
    bonusCoins: 50,
    rarity: 'common',
    minRarityToDrop: RARITY.COMMON
  },
  {
    id: 'scrap_pack_medium',
    name: '中型碎片包',
    emoji: '🎁',
    description: '内含史诗矿物碎片',
    rarity: 'uncommon',
    minRarityToDrop: RARITY.UNCOMMON
  },
  {
    id: 'coin_bag_medium',
    name: '中号金币袋',
    emoji: '🪙',
    description: '额外奖励 200 金币',
    bonusCoins: 200,
    rarity: 'uncommon',
    minRarityToDrop: RARITY.UNCOMMON
  },
  {
    id: 'rare_voucher',
    name: '稀有兑换券',
    emoji: '🎫',
    description: '可在兑换站换取稀有矿物',
    rarity: 'rare',
    minRarityToDrop: RARITY.RARE
  },
  {
    id: 'scrap_pack_large',
    name: '大型碎片包',
    emoji: '🏆',
    description: '内含传说矿物碎片',
    rarity: 'rare',
    minRarityToDrop: RARITY.RARE
  },
  {
    id: 'epic_voucher',
    name: '史诗兑换券',
    emoji: '💎',
    description: '可在兑换站换取史诗矿物',
    rarity: 'epic',
    minRarityToDrop: RARITY.EPIC
  },
  {
    id: 'coin_bag_large',
    name: '大号金币袋',
    emoji: '👑',
    description: '额外奖励 1500 金币',
    bonusCoins: 1500,
    rarity: 'epic',
    minRarityToDrop: RARITY.EPIC
  },
  {
    id: 'legendary_voucher',
    name: '传说兑换券',
    emoji: '🌟',
    description: '可在兑换站换取传说矿物',
    rarity: 'legendary',
    minRarityToDrop: RARITY.LEGENDARY
  }
]

export const ITEM_DROP_RATES = {
  common: 0.25,
  uncommon: 0.15,
  rare: 0.10,
  epic: 0.05,
  legendary: 0.02
}

export const TOKEN_NAME = '兑换代币'
export const TOKEN_EMOJI = '🔵'


export const RARITY_CONVERSION = {
  [RARITY.COMMON]: {
    targetRarity: RARITY.UNCOMMON,
    requiredCount: 5,
    coinCost: 50
  },
  [RARITY.UNCOMMON]: {
    targetRarity: RARITY.RARE,
    requiredCount: 4,
    coinCost: 200
  },
  [RARITY.RARE]: {
    targetRarity: RARITY.EPIC,
    requiredCount: 3,
    coinCost: 800
  },
  [RARITY.EPIC]: {
    targetRarity: RARITY.LEGENDARY,
    requiredCount: 3,
    coinCost: 3000
  }
}

export const DUPLICATE_EXCHANGE_BONUS = {
  sameRarity: 1.0,
  crossRarityPenalty: 0.5
}

export const RISK_WARNINGS = {
  highValueLoss: {
    threshold: 0.7,
    icon: '⚠️',
    title: '价值损失警告',
    getMessage: (lossPercent) => `本次置换预计损失约 ${lossPercent}% 的价值，请谨慎操作`
  },
  rarityDowngrade: {
    icon: '📉',
    title: '稀有度降级',
    getMessage: (fromRarity, toRarity) =>
      `你正在将 ${RARITY_CONFIG[fromRarity].name} 矿物置换为 ${RARITY_CONFIG[toRarity].name} 矿物，稀有度将降低`
  },
  lastCopy: {
    icon: '🔴',
    title: '最后一份',
    getMessage: (mineralName) => `这是你最后一份 ${mineralName}，置换后将不再拥有该矿物`
  },
  highCoinCost: {
    threshold: 500,
    icon: '💰',
    title: '高额金币消耗',
    getMessage: (cost) => `本次兑换需要消耗 ${cost} 金币，请确认余额充足`
  }
}

export const EXCHANGE_TAX_RATE = 0.1

export const MAX_EXCHANGE_HISTORY = 50

export const getExchangePointValue = (rarity) => {
  return EXCHANGE_POINT_VALUES[rarity] || 0
}

export const getConversionConfig = (fromRarity) => {
  return RARITY_CONVERSION[fromRarity] || null
}

export const calculateExchangeValue = (mineral, count = 1) => {
  const pointValue = getExchangePointValue(mineral.rarity)
  return Math.round(pointValue * count * (1 - EXCHANGE_TAX_RATE))
}

export const calculateRarityUpgradeCost = (fromRarity, count) => {
  const config = getConversionConfig(fromRarity)
  if (!config) return null
  const batches = Math.floor(count / config.requiredCount)
  return {
    batches,
    totalCoinCost: batches * config.coinCost,
    targetRarity: config.targetRarity,
    requiredPerBatch: config.requiredCount,
    remainingCount: count % config.requiredCount
  }
}

const RARITY_DROP_WEIGHTS = {
  common: { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 },
  uncommon: { common: 30, uncommon: 50, rare: 18, epic: 2, legendary: 0 },
  rare: { common: 10, uncommon: 30, rare: 45, epic: 13, legendary: 2 },
  epic: { common: 5, uncommon: 15, rare: 35, epic: 38, legendary: 7 },
  legendary: { common: 0, uncommon: 5, rare: 20, epic: 45, legendary: 30 }
}

const rollRarity = (mineralRarity) => {
  const weights = RARITY_DROP_WEIGHTS[mineralRarity] || RARITY_DROP_WEIGHTS.common
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return 'common'
}

export const rollItemReward = (mineralRarity) => {
  const dropChance = ITEM_DROP_RATES[mineralRarity] ?? ITEM_DROP_RATES.common
  if (Math.random() > dropChance) return null

  const targetRarity = rollRarity(mineralRarity)
  const candidates = ITEM_REWARDS.filter(i => i.rarity === targetRarity)
  if (candidates.length === 0) {
    const fallback = ITEM_REWARDS.filter(i => i.minRarityToDrop === mineralRarity)
    if (fallback.length === 0) return null
    return { ...fallback[Math.floor(Math.random() * fallback.length)] }
  }
  return { ...candidates[Math.floor(Math.random() * candidates.length)] }
}

export const calculateBatchItems = (mineral, exchangeCount) => {
  const items = []
  for (let i = 0; i < exchangeCount; i++) {
    const item = rollItemReward(mineral.rarity)
    if (item) items.push(item)
  }
  const merged = {}
  for (const item of items) {
    if (!merged[item.id]) {
      merged[item.id] = { ...item, count: 1 }
    } else {
      merged[item.id].count += 1
    }
  }
  return Object.values(merged)
}

export const estimateItemRewards = (mineral, exchangeCount) => {
  const dropChance = ITEM_DROP_RATES[mineral.rarity] ?? ITEM_DROP_RATES.common
  const expectedCount = Math.floor(exchangeCount * dropChance * 10) / 10
  if (expectedCount <= 0) return null
  const likelyItems = ITEM_REWARDS.filter(i => {
    const mRarityIdx = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(mineral.rarity)
    const iRarityIdx = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(i.rarity)
    return iRarityIdx <= mRarityIdx + 1
  })
  if (likelyItems.length === 0) return null
  return {
    expectedCount,
    example: likelyItems[Math.floor(Math.random() * likelyItems.length)]
  }
}

