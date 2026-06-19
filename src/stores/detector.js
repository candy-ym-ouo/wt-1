import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './game'
import {
  DETECTOR_TIERS,
  DETECTOR_TIER_CONFIG,
  AFFIX_TYPES,
  AFFIX_QUALITY,
  AFFIX_CONFIG,
  AFFIX_QUALITY_CONFIG,
  getUpgradeCost,
  getLevelExpRequired,
  generateAffix,
  getAffixDescription,
  getMaxAffixSlots,
  rerollCost
} from '@/data/detector'
import { RARITY } from '@/data/rarity'

const STORAGE_KEY = 'mineral_detector_progress'

export const useDetectorStore = defineStore('detector', () => {
  const gameStore = useGameStore()

  const currentTier = ref(DETECTOR_TIERS.TIER_1)
  const currentLevel = ref(1)
  const currentExp = ref(0)
  const unlockedTiers = ref([DETECTOR_TIERS.TIER_1])
  const affixes = ref([])
  const totalUpgrades = ref(0)
  const totalRerolls = ref(0)

  const currentTierConfig = computed(() => DETECTOR_TIER_CONFIG[currentTier.value])

  const expToNextLevel = computed(() => {
    return getLevelExpRequired(currentTier.value, currentLevel.value)
  })

  const expPercentage = computed(() => {
    return Math.min(100, Math.round((currentExp.value / expToNextLevel.value) * 100))
  })

  const maxLevelReached = computed(() => {
    return currentLevel.value >= currentTierConfig.value.maxLevel
  })

  const upgradeCostAmount = computed(() => {
    return getUpgradeCost(currentTier.value, currentLevel.value)
  })

  const rerollCostAmount = computed(() => {
    return rerollCost(currentTier.value)
  })

  const maxAffixSlotsCount = computed(() => {
    return getMaxAffixSlots(currentTier.value)
  })

  const availableAffixSlots = computed(() => {
    return maxAffixSlotsCount.value - affixes.value.length
  })

  const baseStats = computed(() => {
    const tierConfig = currentTierConfig.value
    const levelProgress = (currentLevel.value - 1) / (tierConfig.maxLevel - 1 || 1)

    return {
      rarityBonus: tierConfig.baseRarityBonus + Math.floor(levelProgress * 2),
      dropRateBonus: tierConfig.baseDropRateBonus + levelProgress * 10,
      coinBonus: tierConfig.baseCoinBonus + levelProgress * 20
    }
  })

  const totalStats = computed(() => {
    const stats = {
      rarityBonus: baseStats.value.rarityBonus,
      dropRateBonus: baseStats.value.dropRateBonus,
      coinBonus: baseStats.value.coinBonus,
      specificRarityBonus: {},
      multiDropChance: 0,
      expeditionBonus: 0
    }

    affixes.value.forEach(affix => {
      switch (affix.type) {
        case AFFIX_TYPES.RARITY_BOOST:
          stats.rarityBonus += Math.floor(affix.value)
          break
        case AFFIX_TYPES.DROP_RATE:
          stats.dropRateBonus += affix.value
          break
        case AFFIX_TYPES.COIN_BONUS:
          stats.coinBonus += affix.value
          break
        case AFFIX_TYPES.SPECIFIC_RARITY:
          if (affix.specificRarity) {
            stats.specificRarityBonus[affix.specificRarity] = 
              (stats.specificRarityBonus[affix.specificRarity] || 0) + affix.value
          }
          break
        case AFFIX_TYPES.MULTI_DROP:
          stats.multiDropChance += affix.value
          break
        case AFFIX_TYPES.EXPEDITION_BONUS:
          stats.expeditionBonus += affix.value
          break
      }
    })

    return stats
  })

  const getRarityLevel = (rarity) => {
    const levels = {
      [RARITY.COMMON]: 0,
      [RARITY.UNCOMMON]: 1,
      [RARITY.RARE]: 2,
      [RARITY.EPIC]: 3,
      [RARITY.LEGENDARY]: 4
    }
    return levels[rarity] || 0
  }

  const getRarityByLevel = (level) => {
    const rarities = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY]
    return rarities[Math.min(4, Math.max(0, level))]
  }

  const applyRarityBoost = (rarity) => {
    let rarityLevel = getRarityLevel(rarity)
    rarityLevel += totalStats.value.rarityBonus
    return getRarityByLevel(rarityLevel)
  }

  const applySpecificRarityBoost = (rarity, weights = null) => {
    if (weights) {
      const boostedWeights = { ...weights }
      Object.entries(totalStats.value.specificRarityBonus).forEach(([r, bonus]) => {
        if (boostedWeights[r] !== undefined) {
          boostedWeights[r] *= (1 + bonus / 100)
        }
      })
      return boostedWeights
    }
    return weights
  }

  const applyDropRateBoost = (baseChance) => {
    return Math.min(0.95, baseChance * (1 + totalStats.value.dropRateBonus / 100))
  }

  const applyCoinBonus = (baseCoins) => {
    return Math.floor(baseCoins * (1 + totalStats.value.coinBonus / 100))
  }

  const applyExpeditionBonus = (exp, coins) => {
    const bonus = totalStats.value.expeditionBonus / 100
    return {
      exp: Math.floor(exp * (1 + bonus)),
      coins: Math.floor(coins * (1 + bonus))
    }
  }

  const rollMultiDropCount = () => {
    const chance = totalStats.value.multiDropChance / 100
    if (Math.random() < chance) {
      if (Math.random() < 0.3) return 3
      return 2
    }
    return 1
  }

  const canUpgrade = () => {
    if (maxLevelReached.value) return false
    return gameStore.coins >= upgradeCostAmount.value
  }

  const upgradeLevel = () => {
    if (!canUpgrade()) return { success: false, message: maxLevelReached.value ? '已达最高等级' : '金币不足' }

    gameStore.coins -= upgradeCostAmount.value
    gameStore.emitTaskEvent?.('coinsEarned', -upgradeCostAmount.value)
    
    currentExp.value += upgradeCostAmount.value / 2
    totalUpgrades.value++

    while (currentExp.value >= expToNextLevel.value && !maxLevelReached.value) {
      currentExp.value -= expToNextLevel.value
      currentLevel.value++
      checkUnlockAffixSlot()
    }

    saveProgress()
    gameStore.saveProgress()
    return { success: true, message: `升级成功！当前等级 ${currentLevel.value}` }
  }

  const checkUnlockAffixSlot = () => {
    const tierProgress = currentLevel.value / currentTierConfig.value.maxLevel
    const slotsByProgress = Math.floor(tierProgress * maxAffixSlotsCount.value)
    
    if (slotsByProgress > affixes.value.length && availableAffixSlots.value > 0) {
      const newAffix = generateAffix(currentTier.value, currentLevel.value, affixes.value)
      if (newAffix) {
        affixes.value.push(newAffix)
      }
    }
  }

  const canUnlockTier = (tier) => {
    if (unlockedTiers.value.includes(tier)) return false
    const tierConfig = DETECTOR_TIER_CONFIG[tier]
    return gameStore.coins >= tierConfig.unlockCost
  }

  const unlockTier = (tier) => {
    if (unlockedTiers.value.includes(tier)) {
      return { success: false, message: '该档位已解锁' }
    }

    const tierConfig = DETECTOR_TIER_CONFIG[tier]
    if (gameStore.coins < tierConfig.unlockCost) {
      return { success: false, message: '金币不足' }
    }

    gameStore.coins -= tierConfig.unlockCost
    gameStore.emitTaskEvent?.('coinsEarned', -tierConfig.unlockCost)
    unlockedTiers.value.push(tier)

    saveProgress()
    gameStore.saveProgress()
    return { success: true, message: `成功解锁 ${tierConfig.name}！` }
  }

  const switchTier = (tier) => {
    if (!unlockedTiers.value.includes(tier)) {
      return { success: false, message: '该档位尚未解锁' }
    }

    currentTier.value = tier
    currentLevel.value = 1
    currentExp.value = 0
    affixes.value = []
    initializeAffixes()

    saveProgress()
    return { success: true }
  }

  const initializeAffixes = () => {
    const slotsCount = maxAffixSlotsCount.value
    const initialCount = Math.min(2, slotsCount)
    
    for (let i = 0; i < initialCount; i++) {
      const newAffix = generateAffix(currentTier.value, currentLevel.value, affixes.value)
      if (newAffix) {
        affixes.value.push(newAffix)
      }
    }
  }

  const canRerollAffix = () => {
    return gameStore.coins >= rerollCostAmount.value && affixes.value.length > 0
  }

  const rerollAffix = (affixId = null) => {
    if (!canRerollAffix()) {
      return { success: false, message: affixes.value.length === 0 ? '没有可重铸的词条' : '金币不足' }
    }

    gameStore.coins -= rerollCostAmount.value
    gameStore.emitTaskEvent?.('coinsEarned', -rerollCostAmount.value)
    totalRerolls.value++

    if (affixId) {
      const index = affixes.value.findIndex(a => a.id === affixId)
      if (index > -1) {
        const existingWithoutTarget = affixes.value.filter(a => a.id !== affixId)
        const newAffix = generateAffix(currentTier.value, currentLevel.value, existingWithoutTarget)
        if (newAffix) {
          affixes.value[index] = newAffix
        }
      }
    } else {
      const lastIndex = affixes.value.length - 1
      const existingWithoutLast = affixes.value.slice(0, -1)
      const newAffix = generateAffix(currentTier.value, currentLevel.value, existingWithoutLast)
      if (newAffix) {
        affixes.value[lastIndex] = newAffix
      }
    }

    saveProgress()
    gameStore.saveProgress()
    return { success: true, message: '重铸成功！' }
  }

  const addNewAffixSlot = () => {
    if (availableAffixSlots.value <= 0) {
      return { success: false, message: '没有更多词条槽位' }
    }

    const newAffix = generateAffix(currentTier.value, currentLevel.value, affixes.value)
    if (newAffix) {
      affixes.value.push(newAffix)
      saveProgress()
      return { success: true, message: '获得新词条！' }
    }
    return { success: false, message: '无法生成新词条' }
  }

  const getAffixDisplay = (affix) => getAffixDescription(affix)

  const saveProgress = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentTier: currentTier.value,
        currentLevel: currentLevel.value,
        currentExp: currentExp.value,
        unlockedTiers: unlockedTiers.value,
        affixes: affixes.value,
        totalUpgrades: totalUpgrades.value,
        totalRerolls: totalRerolls.value,
        savedAt: Date.now()
      }))
    } catch (e) {
      console.error('Failed to save detector progress:', e)
    }
  }

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        currentTier.value = progress.currentTier || DETECTOR_TIERS.TIER_1
        currentLevel.value = progress.currentLevel || 1
        currentExp.value = progress.currentExp || 0
        unlockedTiers.value = progress.unlockedTiers || [DETECTOR_TIERS.TIER_1]
        affixes.value = progress.affixes || []
        totalUpgrades.value = progress.totalUpgrades || 0
        totalRerolls.value = progress.totalRerolls || 0
      }
    } catch (e) {
      console.error('Failed to load detector progress:', e)
    }

    if (affixes.value.length === 0) {
      initializeAffixes()
    }
  }

  const resetProgress = () => {
    currentTier.value = DETECTOR_TIERS.TIER_1
    currentLevel.value = 1
    currentExp.value = 0
    unlockedTiers.value = [DETECTOR_TIERS.TIER_1]
    affixes.value = []
    totalUpgrades.value = 0
    totalRerolls.value = 0
    initializeAffixes()
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    currentTier,
    currentLevel,
    currentExp,
    unlockedTiers,
    affixes,
    totalUpgrades,
    totalRerolls,
    currentTierConfig,
    expToNextLevel,
    expPercentage,
    maxLevelReached,
    upgradeCostAmount,
    rerollCostAmount,
    maxAffixSlotsCount,
    availableAffixSlots,
    baseStats,
    totalStats,
    canUpgrade,
    upgradeLevel,
    canUnlockTier,
    unlockTier,
    switchTier,
    canRerollAffix,
    rerollAffix,
    addNewAffixSlot,
    getAffixDisplay,
    applyRarityBoost,
    applySpecificRarityBoost,
    applyDropRateBoost,
    applyCoinBonus,
    applyExpeditionBonus,
    rollMultiDropCount,
    saveProgress,
    loadProgress,
    resetProgress
  }
})
