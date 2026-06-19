import { RARITY, RARITY_CONFIG } from './rarity'

export const TICKET_TYPES = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  LEGENDARY: 'legendary'
}

export const TICKET_CONFIG = {
  [TICKET_TYPES.BASIC]: {
    id: TICKET_TYPES.BASIC,
    name: '普通盲盒券',
    emoji: '🎫',
    description: '可以开启一个基础矿物盲盒',
    color: '#9ca3af',
    gradient: 'linear-gradient(135deg, #374151, #6b7280)',
    coinPrice: 100,
    rarityWeights: {
      [RARITY.COMMON]: 60,
      [RARITY.UNCOMMON]: 30,
      [RARITY.RARE]: 8,
      [RARITY.EPIC]: 2,
      [RARITY.LEGENDARY]: 0
    }
  },
  [TICKET_TYPES.ADVANCED]: {
    id: TICKET_TYPES.ADVANCED,
    name: '高级盲盒券',
    emoji: '🎟️',
    description: '可以开启一个高级矿物盲盒，稀有矿物概率更高',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce, #a855f7)',
    coinPrice: 500,
    rarityWeights: {
      [RARITY.COMMON]: 30,
      [RARITY.UNCOMMON]: 40,
      [RARITY.RARE]: 20,
      [RARITY.EPIC]: 8,
      [RARITY.LEGENDARY]: 2
    }
  },
  [TICKET_TYPES.LEGENDARY]: {
    id: TICKET_TYPES.LEGENDARY,
    name: '传说盲盒券',
    emoji: '✨',
    description: '可以开启一个传说矿物盲盒，必出珍稀以上品质',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
    coinPrice: 2000,
    rarityWeights: {
      [RARITY.COMMON]: 0,
      [RARITY.UNCOMMON]: 0,
      [RARITY.RARE]: 50,
      [RARITY.EPIC]: 35,
      [RARITY.LEGENDARY]: 15
    }
  }
}

export const BOX_TYPES = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  LEGENDARY: 'legendary'
}

export const BOX_CONFIG = {
  [BOX_TYPES.BASIC]: {
    id: BOX_TYPES.BASIC,
    name: '普通盲盒',
    emoji: '📦',
    description: '包含各种常见矿物',
    ticketType: TICKET_TYPES.BASIC,
    color: '#9ca3af',
    gradient: 'linear-gradient(135deg, #374151, #6b7280)',
    glowColor: 'rgba(156, 163, 175, 0.4)'
  },
  [BOX_TYPES.ADVANCED]: {
    id: BOX_TYPES.ADVANCED,
    name: '高级盲盒',
    emoji: '🎁',
    description: '有更高概率获得稀有矿物',
    ticketType: TICKET_TYPES.ADVANCED,
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce, #a855f7)',
    glowColor: 'rgba(168, 85, 247, 0.4)'
  },
  [BOX_TYPES.LEGENDARY]: {
    id: BOX_TYPES.LEGENDARY,
    name: '传说盲盒',
    emoji: '🏆',
    description: '必出珍稀以上品质矿物',
    ticketType: TICKET_TYPES.LEGENDARY,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
    glowColor: 'rgba(245, 158, 11, 0.5)'
  }
}

export const PITY_CONFIG = {
  [BOX_TYPES.BASIC]: {
    enabled: true,
    pityCount: 10,
    guaranteedRarity: RARITY.RARE,
    softPityStart: 7,
    softPityMultiplier: 2
  },
  [BOX_TYPES.ADVANCED]: {
    enabled: true,
    pityCount: 10,
    guaranteedRarity: RARITY.EPIC,
    softPityStart: 7,
    softPityMultiplier: 2
  },
  [BOX_TYPES.LEGENDARY]: {
    enabled: true,
    pityCount: 10,
    guaranteedRarity: RARITY.LEGENDARY,
    softPityStart: 7,
    softPityMultiplier: 3
  }
}

export const getTicketById = (id) => TICKET_CONFIG[id]
export const getBoxById = (id) => BOX_CONFIG[id]
export const getPityConfig = (boxType) => PITY_CONFIG[boxType]

export const rollRarityByWeights = (weights) => {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (totalWeight === 0) return RARITY.COMMON

  const random = Math.random() * totalWeight
  let cumulative = 0

  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight
    if (random <= cumulative) {
      return rarity
    }
  }

  return RARITY.COMMON
}
