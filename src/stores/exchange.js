import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './game'
import { MINERALS, getMineralById, getRandomMineralByRarity, getMineralsByRarity } from '@/data/minerals'
import { RARITY, RARITY_CONFIG } from '@/data/rarity'
import {
  EXCHANGE_POINT_VALUES,
  RARITY_CONVERSION,
  EXCHANGE_TAX_RATE,
  COIN_CONVERSION_RATE,
  MAX_EXCHANGE_HISTORY,
  RISK_WARNINGS,
  TOKEN_NAME,
  TOKEN_EMOJI,
  getExchangePointValue,
  getConversionConfig,
  calculateExchangeValue,
  calculateRarityUpgradeCost,
  calculateBatchItems
} from '@/data/exchange'

const STORAGE_KEY = 'mineral_exchange_data'

export const useExchangeStore = defineStore('exchange', () => {
  const gameStore = useGameStore()

  const exchangeHistory = ref([])
  const exchangePoints = ref(0)
  const activeTab = ref('duplicate')
  const inventory = ref([])

  const tokenInfo = computed(() => ({
    name: TOKEN_NAME,
    emoji: TOKEN_EMOJI,
    balance: exchangePoints.value
  }))

  const inventoryItems = computed(() => {
    const merged = {}
    for (const item of inventory.value) {
      if (!merged[item.id]) {
        merged[item.id] = { ...item, count: 1 }
      } else {
        merged[item.id].count += 1
      }
    }
    return Object.values(merged).sort((a, b) => {
      const o = ['legendary', 'epic', 'rare', 'uncommon', 'common']
      return o.indexOf(a.rarity) - o.indexOf(b.rarity)
    })
  })

  const addItemToInventory = (item) => {
    inventory.value.push({ ...item, obtainedAt: Date.now() })
  }

  const addItemsToInventory = (items) => {
    for (const item of items) {
      for (let i = 0; i < (item.count || 1); i++) {
        addItemToInventory(item)
      }
    }
  }

  const getItemCount = (itemId) => {
    return inventory.value.filter(i => i.id === itemId).length
  }

  const consumeItem = (itemId, count = 1) => {
    let remaining = count
    inventory.value = inventory.value.filter(item => {
      if (item.id === itemId && remaining > 0) {
        remaining -= 1
        return false
      }
      return true
    })
    return remaining === 0
  }

  const duplicateMinerals = computed(() => {
    return gameStore.collectedMinerals
      .filter(m => m.count > 1)
      .map(m => ({
        ...m,
        duplicateCount: m.count - 1,
        exchangeValue: calculateExchangeValue(m, m.count - 1)
      }))
      .sort((a, b) => {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
        return rarityOrder[a.rarity] - rarityOrder[b.rarity]
      })
  })

  const totalDuplicateValue = computed(() => {
    return duplicateMinerals.value.reduce((sum, m) => sum + m.exchangeValue, 0)
  })

  const conversionOptions = computed(() => {
    const options = []
    const rarityLevels = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC]

    for (const rarity of rarityLevels) {
      const config = getConversionConfig(rarity)
      if (!config) continue

      const mineralsOfRarity = gameStore.collectedMinerals.filter(m => m.rarity === rarity)
      const totalAvailable = mineralsOfRarity.reduce((sum, m) => sum + m.count, 0)
      const availableForConversion = Math.max(0, totalAvailable - mineralsOfRarity.length)

      if (availableForConversion >= config.requiredCount) {
        const costInfo = calculateRarityUpgradeCost(rarity, availableForConversion)
        options.push({
          fromRarity: rarity,
          fromRarityConfig: RARITY_CONFIG[rarity],
          toRarity: config.targetRarity,
          toRarityConfig: RARITY_CONFIG[config.targetRarity],
          requiredCount: config.requiredCount,
          coinCost: config.coinCost,
          availableCount: availableForConversion,
          possibleBatches: costInfo.batches,
          totalCoinCost: costInfo.totalCoinCost
        })
      }
    }

    return options
  })

  const getRiskWarnings = (exchangeType, params) => {
    const warnings = []

    if (exchangeType === 'duplicate') {
      const { mineral, count } = params
      if (!mineral) return warnings

      const kept = mineral.count - count
      if (kept <= 0) {
        warnings.push({
          ...RISK_WARNINGS.lastCopy,
          message: RISK_WARNINGS.lastCopy.getMessage(mineral.name),
          severity: 'critical'
        })
      }

      const baseValue = getExchangePointValue(mineral.rarity) * count
      const afterTax = baseValue * (1 - EXCHANGE_TAX_RATE)
      const lossPercent = Math.round(EXCHANGE_TAX_RATE * 100)
      if (lossPercent >= RISK_WARNINGS.highValueLoss.threshold * 100) {
        warnings.push({
          ...RISK_WARNINGS.highValueLoss,
          message: RISK_WARNINGS.highValueLoss.getMessage(lossPercent),
          severity: 'warning'
        })
      }
    }

    if (exchangeType === 'rarity_conversion') {
      const { fromRarity, toRarity, coinCost } = params

      if (coinCost >= RISK_WARNINGS.highCoinCost.threshold) {
        warnings.push({
          ...RISK_WARNINGS.highCoinCost,
          message: RISK_WARNINGS.highCoinCost.getMessage(coinCost),
          severity: 'warning'
        })
      }

      if (gameStore.coins < coinCost) {
        warnings.push({
          icon: '❌',
          title: '金币不足',
          message: `需要 ${coinCost} 金币，当前仅有 ${gameStore.coins} 金币`,
          severity: 'critical'
        })
      }
    }

    return warnings
  }

  const exchangeDuplicate = (mineralId, count) => {
    const mineral = gameStore.collectedMinerals.find(m => m.id === mineralId)
    if (!mineral || mineral.count <= 1) {
      return { success: false, message: '无可置换的重复藏品' }
    }

    const exchangeCount = Math.min(count, mineral.count - 1)
    if (exchangeCount <= 0) {
      return { success: false, message: '置换数量无效' }
    }

    const pointValue = getExchangePointValue(mineral.rarity)
    const totalBase = pointValue * exchangeCount
    const afterTax = Math.round(totalBase * (1 - EXCHANGE_TAX_RATE))
    const taxAmount = totalBase - afterTax

    mineral.count -= exchangeCount
    if (mineral.count <= 0) {
      const idx = gameStore.collectedMinerals.findIndex(m => m.id === mineralId)
      if (idx > -1) gameStore.collectedMinerals.splice(idx, 1)
    }

    exchangePoints.value += afterTax
    const coinBonus = Math.round(afterTax * COIN_CONVERSION_RATE)
    gameStore.coins += coinBonus

    const items = calculateBatchItems(mineral, exchangeCount)
    let extraCoinsFromItems = 0
    if (items.length > 0) {
      for (const it of items) {
        if (it.bonusCoins) {
          extraCoinsFromItems += it.bonusCoins * (it.count || 1)
        }
      }
      gameStore.coins += extraCoinsFromItems
      addItemsToInventory(items)
    }

    const totalCoins = coinBonus + extraCoinsFromItems

    gameStore.addCoinTransaction('exchange_bonus', totalCoins, `置换 ${mineral.name} x${exchangeCount} 奖励`, {
      mineralId,
      mineralName: mineral.name,
      mineralEmoji: mineral.emoji,
      rarity: mineral.rarity,
      exchangeType: 'duplicate',
      count: exchangeCount,
      tokensGained: afterTax,
      taxPaid: taxAmount,
      coinBonus,
      extraCoinsFromItems,
      items: items.map(i => ({ id: i.id, name: i.name, count: i.count || 1 }))
    })

    const record = {
      id: Date.now(),
      type: 'duplicate',
      mineralId,
      mineralName: mineral.name,
      mineralEmoji: mineral.emoji,
      rarity: mineral.rarity,
      count: exchangeCount,
      tokensGained: afterTax,
      pointsGained: afterTax,
      coinsGained: coinBonus,
      extraCoinsFromItems,
      totalCoins,
      items,
      taxPaid: taxAmount,
      timestamp: Date.now()
    }
    exchangeHistory.value.unshift(record)
    if (exchangeHistory.value.length > MAX_EXCHANGE_HISTORY) {
      exchangeHistory.value = exchangeHistory.value.slice(0, MAX_EXCHANGE_HISTORY)
    }

    gameStore.emitTaskEvent('coinsEarned', totalCoins)
    gameStore.saveProgress()
    saveExchangeData()

    return {
      success: true,
      tokensGained: afterTax,
      pointsGained: afterTax,
      coinsGained: coinBonus,
      extraCoinsFromItems,
      totalCoins,
      items,
      taxPaid: taxAmount,
      exchangeCount
    }
  }

  const exchangeRarityConversion = (fromRarity) => {
    const config = getConversionConfig(fromRarity)
    if (!config) {
      return { success: false, message: '该稀有度无法进行升级' }
    }

    const mineralsOfRarity = gameStore.collectedMinerals.filter(m => m.rarity === fromRarity)
    const totalAvailable = mineralsOfRarity.reduce((sum, m) => sum + m.count, 0)
    const availableForConversion = Math.max(0, totalAvailable - mineralsOfRarity.length)

    if (availableForConversion < config.requiredCount) {
      return { success: false, message: `需要至少 ${config.requiredCount} 个多余的${RARITY_CONFIG[fromRarity].name}矿物` }
    }

    if (gameStore.coins < config.coinCost) {
      return { success: false, message: `金币不足，需要 ${config.coinCost} 金币` }
    }

    let remaining = config.requiredCount
    const exchangedMinerals = []

    for (const mineral of mineralsOfRarity) {
      if (remaining <= 0) break
      const canTake = Math.min(remaining, Math.max(0, mineral.count - 1))
      if (canTake > 0) {
        mineral.count -= canTake
        remaining -= canTake
        exchangedMinerals.push({
          id: mineral.id,
          name: mineral.name,
          emoji: mineral.emoji,
          count: canTake
        })
      }
    }

    if (remaining > 0) {
      for (const mineral of mineralsOfRarity) {
        if (remaining <= 0) break
        const canTake = Math.min(remaining, mineral.count)
        if (canTake > 0) {
          mineral.count -= canTake
          remaining -= canTake
          exchangedMinerals.push({
            id: mineral.id,
            name: mineral.name,
            emoji: mineral.emoji,
            count: canTake
          })
        }
      }
    }

    gameStore.collectedMinerals = gameStore.collectedMinerals.filter(m => m.count > 0)

    const targetMineral = getRandomMineralByRarity(config.targetRarity)
    if (!targetMineral) {
      return { success: false, message: '没有可兑换的目标矿物' }
    }

    gameStore.coins -= config.coinCost
    
    gameStore.addCoinTransaction('exchange_cost', config.coinCost, `${RARITY_CONFIG[fromRarity].name}升级消耗`, {
      fromRarity,
      fromRarityName: RARITY_CONFIG[fromRarity].name,
      toRarity: config.targetRarity,
      toRarityName: RARITY_CONFIG[config.targetRarity].name,
      exchangeType: 'rarity_conversion'
    })

    const isNew = gameStore.collectMineral(targetMineral, 'exchange', {
      type: 'rarity_conversion',
      fromRarity,
      fromRarityName: RARITY_CONFIG[fromRarity].name,
      toRarity: config.targetRarity,
      toRarityName: RARITY_CONFIG[config.targetRarity].name,
      coinCost: config.coinCost
    })

    const record = {
      id: Date.now(),
      type: 'rarity_conversion',
      fromRarity,
      fromRarityName: RARITY_CONFIG[fromRarity].name,
      toRarity: config.targetRarity,
      toRarityName: RARITY_CONFIG[config.targetRarity].name,
      exchangedMinerals,
      coinCost: config.coinCost,
      receivedMineral: {
        id: targetMineral.id,
        name: targetMineral.name,
        emoji: targetMineral.emoji,
        isNew
      },
      timestamp: Date.now()
    }
    exchangeHistory.value.unshift(record)
    if (exchangeHistory.value.length > MAX_EXCHANGE_HISTORY) {
      exchangeHistory.value = exchangeHistory.value.slice(0, MAX_EXCHANGE_HISTORY)
    }

    gameStore.saveProgress()
    saveExchangeData()

    return {
      success: true,
      receivedMineral: targetMineral,
      isNew,
      coinCost: config.coinCost
    }
  }

  const batchExchangeAll = (selectedMineralIds = null) => {
    const duplicates = gameStore.collectedMinerals.filter(m => m.count > 1)
    const toExchange = selectedMineralIds
      ? duplicates.filter(m => selectedMineralIds.includes(m.id))
      : duplicates

    if (toExchange.length === 0) {
      return { success: false, message: '无可置换的重复藏品' }
    }

    let totalPointsGained = 0
    let totalCoinsGained = 0
    let totalExtraCoins = 0
    let totalTaxPaid = 0
    let totalExchangeCount = 0
    const exchangedDetails = []
    const allItems = []
    const itemsMap = {}

    for (const mineral of toExchange) {
      const exchangeCount = mineral.count - 1
      if (exchangeCount <= 0) continue

      const pointValue = getExchangePointValue(mineral.rarity)
      const totalBase = pointValue * exchangeCount
      const afterTax = Math.round(totalBase * (1 - EXCHANGE_TAX_RATE))
      const taxAmount = totalBase - afterTax

      mineral.count = 1

      exchangePoints.value += afterTax
      const coinBonus = Math.round(afterTax * COIN_CONVERSION_RATE)
      gameStore.coins += coinBonus

      const items = calculateBatchItems(mineral, exchangeCount)
      let extraCoins = 0
      if (items.length > 0) {
        for (const it of items) {
          if (it.bonusCoins) extraCoins += it.bonusCoins * (it.count || 1)
          if (!itemsMap[it.id]) {
            itemsMap[it.id] = { ...it, count: it.count || 1 }
          } else {
            itemsMap[it.id].count += it.count || 1
          }
        }
        gameStore.coins += extraCoins
        addItemsToInventory(items)
      }

      gameStore.addCoinTransaction('exchange_bonus', coinBonus + extraCoins, `批量置换 ${mineral.name} x${exchangeCount}`, {
        mineralId: mineral.id,
        mineralName: mineral.name,
        mineralEmoji: mineral.emoji,
        rarity: mineral.rarity,
        exchangeType: 'batch_duplicate',
        count: exchangeCount,
        tokensGained: afterTax,
        taxPaid: taxAmount,
        coinBonus,
        extraCoins,
        items: items.map(i => ({ id: i.id, name: i.name, count: i.count || 1 }))
      })

      totalPointsGained += afterTax
      totalCoinsGained += coinBonus
      totalExtraCoins += extraCoins
      totalTaxPaid += taxAmount
      totalExchangeCount += exchangeCount

      exchangedDetails.push({
        id: mineral.id,
        name: mineral.name,
        emoji: mineral.emoji,
        rarity: mineral.rarity,
        count: exchangeCount,
        tokensGained: afterTax,
        pointsGained: afterTax,
        coinsGained: coinBonus,
        extraCoins,
        items
      })
    }

    const mergedItems = Object.values(itemsMap)

    const record = {
      id: Date.now(),
      type: 'batch_duplicate',
      count: totalExchangeCount,
      mineralCount: exchangedDetails.length,
      tokensGained: totalPointsGained,
      pointsGained: totalPointsGained,
      coinsGained: totalCoinsGained,
      extraCoinsFromItems: totalExtraCoins,
      totalCoins: totalCoinsGained + totalExtraCoins,
      items: mergedItems,
      taxPaid: totalTaxPaid,
      details: exchangedDetails,
      timestamp: Date.now()
    }
    exchangeHistory.value.unshift(record)
    if (exchangeHistory.value.length > MAX_EXCHANGE_HISTORY) {
      exchangeHistory.value = exchangeHistory.value.slice(0, MAX_EXCHANGE_HISTORY)
    }

    gameStore.emitTaskEvent('coinsEarned', totalCoinsGained + totalExtraCoins)
    gameStore.saveProgress()
    saveExchangeData()

    return {
      success: true,
      tokensGained: totalPointsGained,
      totalPointsGained,
      totalCoinsGained: totalCoinsGained + totalExtraCoins,
      coinBase: totalCoinsGained,
      coinFromItems: totalExtraCoins,
      totalTaxPaid,
      totalExchangeCount,
      exchangedDetails,
      exchangedMineralCount: exchangedDetails.length,
      items: mergedItems
    }
  }

  const setActiveTab = (tab) => {
    activeTab.value = tab
  }

  const saveExchangeData = () => {
    const data = {
      exchangeHistory: exchangeHistory.value,
      exchangePoints: exchangePoints.value,
      inventory: inventory.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadExchangeData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        exchangeHistory.value = data.exchangeHistory || []
        exchangePoints.value = data.exchangePoints || 0
        inventory.value = data.inventory || []
      }
    } catch (e) {
      console.error('Failed to load exchange data:', e)
    }
  }

  const resetExchangeData = () => {
    exchangeHistory.value = []
    exchangePoints.value = 0
    inventory.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    exchangeHistory,
    exchangePoints,
    activeTab,
    inventory,
    inventoryItems,
    tokenInfo,
    duplicateMinerals,
    totalDuplicateValue,
    conversionOptions,
    getRiskWarnings,
    exchangeDuplicate,
    exchangeRarityConversion,
    batchExchangeAll,
    addItemToInventory,
    addItemsToInventory,
    getItemCount,
    consumeItem,
    setActiveTab,
    saveExchangeData,
    loadExchangeData,
    resetExchangeData
  }
})
