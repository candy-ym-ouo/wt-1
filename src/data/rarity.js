export const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
}

export const RARITY_CONFIG = {
  [RARITY.COMMON]: {
    name: '普通',
    color: '#9ca3af',
    bgGradient: 'linear-gradient(135deg, #374151, #6b7280)',
    borderColor: 'rgba(156, 163, 175, 0.5)',
    probability: 0.45,
    glowIntensity: 0,
    starCount: 1,
    pieceCount: 4
  },
  [RARITY.UNCOMMON]: {
    name: '稀有',
    color: '#22c55e',
    bgGradient: 'linear-gradient(135deg, #166534, #22c55e)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    probability: 0.30,
    glowIntensity: 1,
    starCount: 2,
    pieceCount: 6
  },
  [RARITY.RARE]: {
    name: '珍稀',
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    probability: 0.15,
    glowIntensity: 2,
    starCount: 3,
    pieceCount: 8
  },
  [RARITY.EPIC]: {
    name: '史诗',
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, #7e22ce, #a855f7)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
    probability: 0.07,
    glowIntensity: 3,
    starCount: 4,
    pieceCount: 10
  },
  [RARITY.LEGENDARY]: {
    name: '传说',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
    borderColor: 'rgba(245, 158, 11, 0.7)',
    probability: 0.03,
    glowIntensity: 4,
    starCount: 5,
    pieceCount: 12
  }
}

export const getRarityByProbability = () => {
  const rand = Math.random()
  let cumulative = 0
  
  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    cumulative += config.probability
    if (rand <= cumulative) {
      return rarity
    }
  }
  
  return RARITY.COMMON
}

export const getRarityStars = (rarity) => {
  return '★'.repeat(RARITY_CONFIG[rarity].starCount)
}
