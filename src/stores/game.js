import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MINERALS, getMineralById, getRandomMineralByRarity } from '@/data/minerals'
import { getRarityByProbability, RARITY_CONFIG, RARITY } from '@/data/rarity'
import { 
  EXPEDITION_LOCATIONS, 
  getLocationById, 
  getRandomEvent, 
  getRarityByLevel, 
  getRarityLevel 
} from '@/data/expeditions'
import { useDetectorStore } from './detector'

const STORAGE_KEY = 'mineral_collage_progress'

export const useGameStore = defineStore('game', () => {
  const collectedMinerals = ref([])
  const currentCollage = ref(null)
  const collagePieces = ref([])
  const completedCollages = ref([])
  const coins = ref(100)
  const totalCollages = ref(0)
  const showNewMineralModal = ref(false)
  const newMineral = ref(null)
  const isNewMineral = ref(false)
  
  const stamina = ref(100)
  const maxStamina = ref(100)
  const staminaRegenRate = ref(1)
  const lastStaminaRegen = ref(Date.now())
  const expeditionLevel = ref(1)
  const expeditionExp = ref(0)
  const expToNextLevel = ref(100)
  const currentExpedition = ref(null)
  const expeditionPhase = ref('map')
  const currentEvent = ref(null)
  const eventResult = ref(null)
  const expeditionRewards = ref(null)
  const showRewardModal = ref(false)
  const expeditionHistory = ref([])
  const staminaRecoveryTimer = ref(null)

  const onTaskEvent = ref(null)

  const emitTaskEvent = (eventName, payload) => {
    if (onTaskEvent.value) {
      onTaskEvent.value(eventName, payload)
    }
  }

  const allMinerals = computed(() => MINERALS)

  const collectionProgress = computed(() => {
    return {
      collected: collectedMinerals.value.length,
      total: MINERALS.length,
      percentage: Math.round((collectedMinerals.value.length / MINERALS.length) * 100)
    }
  })

  const staminaPercentage = computed(() => {
    return Math.round((stamina.value / maxStamina.value) * 100)
  })

  const expeditionProgress = computed(() => {
    return {
      level: expeditionLevel.value,
      exp: expeditionExp.value,
      expToNextLevel: expToNextLevel.value,
      percentage: Math.round((expeditionExp.value / expToNextLevel.value) * 100)
    }
  })

  const allLocations = computed(() => EXPEDITION_LOCATIONS)

  const canStartExpedition = computed(() => {
    return expeditionPhase.value === 'map' && stamina.value > 0
  })

  const isMineralCollected = (mineralId) => {
    return collectedMinerals.value.some(m => m.id === mineralId)
  }

  const collectMineral = (mineral, source = 'collage', sourceData = {}) => {
    const detectorStore = useDetectorStore()
    
    const sourceRecord = {
      source,
      sourceData,
      obtainedAt: Date.now()
    }
    
    if (!isMineralCollected(mineral.id)) {
      collectedMinerals.value.push({
        ...mineral,
        collectedAt: Date.now(),
        count: 1,
        sources: [sourceRecord]
      })
      emitTaskEvent('mineralCollected', mineral)
      
      const bonusCoins = detectorStore.applyCoinBonus(RARITY_CONFIG[mineral.rarity].starCount * 10)
      coins.value += bonusCoins
      emitTaskEvent('coinsEarned', bonusCoins)
      
      saveProgress()
      return true
    } else {
      const existing = collectedMinerals.value.find(m => m.id === mineral.id)
      
      const dropCount = detectorStore.rollMultiDropCount()
      existing.count += dropCount
      
      if (!existing.sources) {
        existing.sources = []
      }
      for (let i = 0; i < dropCount; i++) {
        existing.sources.push({
          ...sourceRecord,
          obtainedAt: Date.now() + i
        })
      }
      
      const baseCoins = 10 * dropCount
      const bonusCoins = detectorStore.applyCoinBonus(baseCoins)
      coins.value += bonusCoins
      
      emitTaskEvent('mineralCollected', mineral)
      emitTaskEvent('coinsEarned', bonusCoins)
      saveProgress()
      return false
    }
  }

  const startNewCollage = (mineral = null) => {
    const detectorStore = useDetectorStore()
    let targetMineral = mineral
    if (!targetMineral) {
      let rarity = getRarityByProbability()
      rarity = detectorStore.applyRarityBoost(rarity)
      targetMineral = getRandomMineralByRarity(rarity)
    }

    const pieceCount = RARITY_CONFIG[targetMineral.rarity].pieceCount
    const pieces = generateCollagePieces(targetMineral, pieceCount)

    currentCollage.value = targetMineral
    collagePieces.value = pieces
    totalCollages.value++

    saveProgress()
    return { mineral: targetMineral, pieces }
  }

  const generateCollagePieces = (mineral, count) => {
    const pieces = []
    const centerX = 200
    const centerY = 200
    const radius = 120

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const targetX = centerX + Math.cos(angle) * radius
      const targetY = centerY + Math.sin(angle) * radius

      pieces.push({
        id: i,
        mineralId: mineral.id,
        index: i,
        total: count,
        targetX,
        targetY,
        startX: Math.random() * 300 + 50,
        startY: Math.random() * 300 + 50,
        currentX: 0,
        currentY: 0,
        isPlaced: false,
        isDragging: false,
        rotation: Math.random() * 360 - 180,
        size: 40 + Math.random() * 20,
        color: mineral.colors[i % mineral.colors.length],
        shape: ['hexagon', 'diamond', 'triangle', 'pentagon'][i % 4]
      })
    }

    return shuffleArray([...pieces])
  }

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const placePiece = (pieceId) => {
    const piece = collagePieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.isPlaced = true
      piece.currentX = piece.targetX
      piece.currentY = piece.targetY
      saveProgress()
      return checkCollageComplete()
    }
    return false
  }

  const updatePiecePosition = (pieceId, x, y) => {
    const piece = collagePieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.currentX = x
      piece.currentY = y
    }
  }

  const checkCollageComplete = () => {
    const detectorStore = useDetectorStore()
    const allPlaced = collagePieces.value.every(p => p.isPlaced)
    if (allPlaced && currentCollage.value) {
      const isNew = collectMineral(currentCollage.value, 'collage', {
        timeTaken: Math.floor(Math.random() * 60) + 30
      })
      const baseCoins = RARITY_CONFIG[currentCollage.value.rarity].starCount * 20
      const bonusCoins = detectorStore.applyCoinBonus(baseCoins)
      coins.value += bonusCoins
      emitTaskEvent('coinsEarned', bonusCoins)

      completedCollages.value.push({
        mineral: currentCollage.value,
        completedAt: Date.now(),
        timeTaken: Math.floor(Math.random() * 60) + 30
      })

      newMineral.value = currentCollage.value
      isNewMineral.value = isNew
      showNewMineralModal.value = true

      emitTaskEvent('collageComplete')

      saveProgress()
      return true
    }
    return false
  }

  const closeNewMineralModal = () => {
    showNewMineralModal.value = false
    newMineral.value = null
    currentCollage.value = null
    collagePieces.value = []
  }

  const resetCurrentCollage = () => {
    currentCollage.value = null
    collagePieces.value = []
  }

  const saveProgress = () => {
    const progress = {
      collectedMinerals: collectedMinerals.value,
      completedCollages: completedCollages.value,
      coins: coins.value,
      totalCollages: totalCollages.value,
      stamina: stamina.value,
      maxStamina: maxStamina.value,
      expeditionLevel: expeditionLevel.value,
      expeditionExp: expeditionExp.value,
      expToNextLevel: expToNextLevel.value,
      lastStaminaRegen: lastStaminaRegen.value,
      expeditionHistory: expeditionHistory.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }

  const generateMockCollectedMinerals = () => {
    const mockData = []
    const sourceTypes = ['collage', 'expedition', 'market']
    const locations = EXPEDITION_LOCATIONS.map(l => ({ id: l.id, name: l.name }))
    
    const mineralsToAdd = [
      { id: 1, count: 5, rarity: 'common' },
      { id: 2, count: 3, rarity: 'common' },
      { id: 3, count: 2, rarity: 'common' },
      { id: 4, count: 4, rarity: 'common' },
      { id: 5, count: 3, rarity: 'uncommon' },
      { id: 6, count: 5, rarity: 'uncommon' },
      { id: 7, count: 2, rarity: 'uncommon' },
      { id: 8, count: 1, rarity: 'uncommon' },
      { id: 9, count: 3, rarity: 'rare' },
      { id: 10, count: 1, rarity: 'rare' },
      { id: 11, count: 2, rarity: 'rare' },
      { id: 12, count: 1, rarity: 'epic' },
      { id: 13, count: 1, rarity: 'epic' },
      { id: 15, count: 1, rarity: 'legendary' }
    ]

    for (const item of mineralsToAdd) {
      const mineralData = getMineralById(item.id)
      if (!mineralData) continue

      const sources = []
      for (let i = 0; i < item.count; i++) {
        const source = sourceTypes[Math.floor(Math.random() * sourceTypes.length)]
        const sourceData = source === 'expedition' 
          ? { ...locations[Math.floor(Math.random() * locations.length)] }
          : source === 'collage'
          ? { timeTaken: Math.floor(Math.random() * 60) + 20 }
          : {}
        
        sources.push({
          source,
          sourceData,
          obtainedAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
        })
      }

      mockData.push({
        ...mineralData,
        collectedAt: Math.min(...sources.map(s => s.obtainedAt)),
        count: item.count,
        sources
      })
    }

    return mockData
  }

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        collectedMinerals.value = progress.collectedMinerals || []
        completedCollages.value = progress.completedCollages || []
        coins.value = progress.coins ?? 100
        totalCollages.value = progress.totalCollages || 0
        stamina.value = progress.stamina ?? 100
        maxStamina.value = progress.maxStamina ?? 100
        expeditionLevel.value = progress.expeditionLevel ?? 1
        expeditionExp.value = progress.expeditionExp ?? 0
        expToNextLevel.value = progress.expToNextLevel ?? 100
        lastStaminaRegen.value = progress.lastStaminaRegen || Date.now()
        expeditionHistory.value = progress.expeditionHistory || []
        
        regenStamina()
      } else {
        collectedMinerals.value = generateMockCollectedMinerals()
        coins.value = 5000
        totalCollages.value = 20
        saveProgress()
      }
    } catch (e) {
      console.error('Failed to load progress:', e)
      collectedMinerals.value = generateMockCollectedMinerals()
      coins.value = 5000
    }
  }

  const resetProgress = () => {
    collectedMinerals.value = []
    completedCollages.value = []
    coins.value = 100
    totalCollages.value = 0
    currentCollage.value = null
    collagePieces.value = []
    stamina.value = 100
    maxStamina.value = 100
    expeditionLevel.value = 1
    expeditionExp.value = 0
    expToNextLevel.value = 100
    currentExpedition.value = null
    expeditionPhase.value = 'map'
    currentEvent.value = null
    eventResult.value = null
    expeditionRewards.value = null
    showRewardModal.value = false
    expeditionHistory.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  const getMineral = (id) => getMineralById(id)

  const regenStamina = () => {
    const now = Date.now()
    const timePassed = now - lastStaminaRegen.value
    const regenAmount = Math.floor(timePassed / 60000) * staminaRegenRate.value
    
    if (regenAmount > 0 && stamina.value < maxStamina.value) {
      stamina.value = Math.min(maxStamina.value, stamina.value + regenAmount)
      lastStaminaRegen.value = now - (timePassed % 60000)
      saveProgress()
    } else if (stamina.value >= maxStamina.value) {
      lastStaminaRegen.value = now
    }
  }

  const startStaminaRecovery = () => {
    if (staminaRecoveryTimer.value) {
      clearInterval(staminaRecoveryTimer.value)
    }
    staminaRecoveryTimer.value = setInterval(() => {
      regenStamina()
    }, 10000)
  }

  const stopStaminaRecovery = () => {
    if (staminaRecoveryTimer.value) {
      clearInterval(staminaRecoveryTimer.value)
      staminaRecoveryTimer.value = null
    }
  }

  const addStamina = (amount) => {
    stamina.value = Math.min(maxStamina.value, Math.max(0, stamina.value + amount))
    saveProgress()
  }

  const spendStamina = (amount) => {
    if (stamina.value >= amount) {
      stamina.value -= amount
      emitTaskEvent('staminaSpent', amount)
      saveProgress()
      return true
    }
    return false
  }

  const addExp = (amount) => {
    expeditionExp.value += amount
    while (expeditionExp.value >= expToNextLevel.value) {
      expeditionExp.value -= expToNextLevel.value
      expeditionLevel.value++
      expToNextLevel.value = Math.floor(expToNextLevel.value * 1.5)
      maxStamina.value += 10
      stamina.value = maxStamina.value
    }
    saveProgress()
  }

  const startExpedition = (locationId) => {
    const location = getLocationById(locationId)
    if (!location) return false
    if (!spendStamina(location.staminaCost)) return false

    currentExpedition.value = {
      ...location,
      startTime: Date.now(),
      currentStep: 0,
      totalSteps: 3,
      coinMultiplier: 1,
      rarityBonus: 0,
      staminaBonus: 0,
      mineralChance: location.rewards.mineralChance,
      baseCoins: Math.floor(Math.random() * (location.rewards.coins[1] - location.rewards.coins[0] + 1)) + location.rewards.coins[0]
    }

    expeditionPhase.value = 'exploring'
    triggerNextEvent()
    return true
  }

  const triggerNextEvent = () => {
    if (!currentExpedition.value) return
    
    if (currentExpedition.value.currentStep >= currentExpedition.value.totalSteps) {
      completeExpedition()
      return
    }

    currentExpedition.value.currentStep++
    currentEvent.value = getRandomEvent()
    eventResult.value = null
    expeditionPhase.value = 'event'
  }

  const makeChoice = (choiceId) => {
    if (!currentEvent.value) return null

    const choice = currentEvent.value.choices.find(c => c.id === choiceId)
    if (!choice) return null

    const isSuccess = Math.random() < choice.successRate
    const result = isSuccess ? choice.result.success : choice.result.failure

    if (currentEvent.value.effects) {
      if (currentEvent.value.effects.mineralChance) {
        currentExpedition.value.mineralChance += currentEvent.value.effects.mineralChance
      }
      if (currentEvent.value.effects.bonusRarity) {
        currentExpedition.value.rarityBonus += currentEvent.value.effects.bonusRarity
      }
    }

    if (result.coinBonus !== undefined) {
      currentExpedition.value.coinMultiplier *= result.coinBonus
    }
    if (result.rarityBonus) {
      currentExpedition.value.rarityBonus += result.rarityBonus
    }
    if (result.staminaBonus) {
      currentExpedition.value.staminaBonus += result.staminaBonus
    }
    if (result.noMineral) {
      currentExpedition.value.mineralChance = 0
    }

    eventResult.value = {
      ...result,
      isSuccess,
      choice: choice.text
    }

    return eventResult.value
  }

  const continueExpedition = () => {
    if (currentExpedition.value && currentExpedition.value.staminaBonus) {
      addStamina(currentExpedition.value.staminaBonus)
      currentExpedition.value.staminaBonus = 0
    }
    
    eventResult.value = null
    currentEvent.value = null
    expeditionPhase.value = 'exploring'
    
    setTimeout(() => {
      triggerNextEvent()
    }, 500)
  }

  const completeExpedition = () => {
    if (!currentExpedition.value) return

    const detectorStore = useDetectorStore()
    const expedition = currentExpedition.value
    let finalCoins = Math.floor(expedition.baseCoins * expedition.coinMultiplier)
    let mineral = null
    let isNew = false
    let mineralCount = 1

    if (expedition.mineralChance > 0) {
      const adjustedChance = detectorStore.applyDropRateBoost(expedition.mineralChance)
      if (Math.random() < adjustedChance) {
        const minLevel = getRarityLevel(expedition.minRarity)
        const maxLevel = getRarityLevel(expedition.maxRarity)
        let targetLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel
        targetLevel = Math.min(4, Math.max(0, targetLevel + (expedition.rarityBonus || 0)))
        
        let targetRarity = getRarityByLevel(targetLevel)
        targetRarity = detectorStore.applyRarityBoost(targetRarity)
        mineral = getRandomMineralByRarity(targetRarity)
        
        if (mineral) {
          mineralCount = detectorStore.rollMultiDropCount()
          for (let i = 0; i < mineralCount; i++) {
            isNew = collectMineral(mineral, 'expedition', {
              locationId: expedition.id,
              locationName: expedition.name,
              difficulty: expedition.difficulty,
              eventResult: eventResult.value?.choice || 'standard'
            }) || isNew
          }
        }
      }
    }

    const { exp: adjustedExp, coins: adjustedCoins } = detectorStore.applyExpeditionBonus(
      expedition.difficulty * 20 + Math.floor(finalCoins / 10),
      finalCoins
    )
    finalCoins = adjustedCoins
    const expGain = adjustedExp

    coins.value += finalCoins
    addExp(expGain)

    emitTaskEvent('expeditionComplete', finalCoins)

    const historyRecord = {
      id: Date.now(),
      location: expedition.name,
      locationId: expedition.id,
      coins: finalCoins,
      mineral: mineral,
      isNewMineral: isNew,
      completedAt: Date.now(),
      exp: expGain
    }
    expeditionHistory.value.unshift(historyRecord)
    if (expeditionHistory.value.length > 50) {
      expeditionHistory.value = expeditionHistory.value.slice(0, 50)
    }

    expeditionRewards.value = {
      coins: finalCoins,
      mineral: mineral,
      isNewMineral: isNew,
      exp: expGain,
      location: expedition.name
    }

    showRewardModal.value = true
    expeditionPhase.value = 'reward'
    saveProgress()
  }

  const closeRewardModal = () => {
    showRewardModal.value = false
    expeditionRewards.value = null
    currentExpedition.value = null
    currentEvent.value = null
    eventResult.value = null
    expeditionPhase.value = 'map'
  }

  const cancelExpedition = () => {
    currentExpedition.value = null
    currentEvent.value = null
    eventResult.value = null
    expeditionPhase.value = 'map'
  }

  const getLocation = (id) => getLocationById(id)

  return {
    collectedMinerals,
    currentCollage,
    collagePieces,
    completedCollages,
    coins,
    totalCollages,
    showNewMineralModal,
    newMineral,
    isNewMineral,
    stamina,
    maxStamina,
    staminaRegenRate,
    expeditionLevel,
    expeditionExp,
    expToNextLevel,
    currentExpedition,
    expeditionPhase,
    currentEvent,
    eventResult,
    expeditionRewards,
    showRewardModal,
    expeditionHistory,
    allMinerals,
    allLocations,
    collectionProgress,
    staminaPercentage,
    expeditionProgress,
    canStartExpedition,
    isMineralCollected,
    collectMineral,
    startNewCollage,
    placePiece,
    updatePiecePosition,
    checkCollageComplete,
    closeNewMineralModal,
    resetCurrentCollage,
    saveProgress,
    loadProgress,
    resetProgress,
    getMineral,
    regenStamina,
    startStaminaRecovery,
    stopStaminaRecovery,
    addStamina,
    spendStamina,
    addExp,
    startExpedition,
    makeChoice,
    continueExpedition,
    closeRewardModal,
    cancelExpedition,
    getLocation,
    onTaskEvent,
    emitTaskEvent
  }
})
