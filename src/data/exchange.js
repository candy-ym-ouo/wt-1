import { RARITY, RARITY_CONFIG } from './rarity'

export const EXCHANGE_POINT_VALUES = {
  [RARITY.COMMON]: 10,
  [RARITY.UNCOMMON]: 40,
  [RARITY.RARE]: 150,
  [RARITY.EPIC]: 600,
  [RARITY.LEGENDARY]: 3000
}

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
