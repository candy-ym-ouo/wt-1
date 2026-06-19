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
import { SEASONS } from '@/data/season'
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
  const discoveryLogs = ref([])
  const MAX_LOGS = 200
  const collageStartTime = ref(null)

  const coinTransactions = ref([])
  const MAX_COIN_TRANSACTIONS = 200

  const COIN_TRANSACTION_TYPE = {
    INCOME: 'income',
    EXPENSE: 'expense'
  }

  const COIN_CATEGORY_CONFIG = {
    first_discovery: {
      name: '首次发现',
      icon: '✨',
      type: 'income',
      color: '#22c55e'
    },
    repeat_reward: {
      name: '重复奖励',
      icon: '🔄',
      type: 'income',
      color: '#06b6d4'
    },
    collage_bonus: {
      name: '拼装奖励',
      icon: '🎨',
      type: 'income',
      color: '#ec4899'
    },
    expedition_reward: {
      name: '探险奖励',
      icon: '🗺️',
      type: 'income',
      color: '#3b82f6'
    },
    task_reward: {
      name: '任务奖励',
      icon: '📋',
      type: 'income',
      color: '#f59e0b'
    },
    achievement_reward: {
      name: '成就奖励',
      icon: '🏆',
      type: 'income',
      color: '#ef4444'
    },
    season_reward: {
      name: '赛季奖励',
      icon: '🎖️',
      type: 'income',
      color: '#8b5cf6'
    },
    market_sell: {
      name: '市场出售',
      icon: '💹',
      type: 'income',
      color: '#10b981'
    },
    exchange_bonus: {
      name: '置换奖励',
      icon: '🔁',
      type: 'income',
      color: '#14b8a6'
    },
    research_reward: {
      name: '研究奖励',
      icon: '🔬',
      type: 'income',
      color: '#6366f1'
    },
    market_buy: {
      name: '市场购买',
      icon: '🛒',
      type: 'expense',
      color: '#ef4444'
    },
    exchange_cost: {
      name: '置换消耗',
      icon: '💸',
      type: 'expense',
      color: '#f97316'
    },
    gacha_buy: {
      name: '盲盒购买',
      icon: '🎁',
      type: 'expense',
      color: '#a855f7'
    },
    research_cost: {
      name: '研究消耗',
      icon: '🔬',
      type: 'expense',
      color: '#64748b'
    }
  }

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

  const SOURCE_CONFIG = {
    collage: { name: '拼装工坊', icon: '🎨', color: '#ec4899' },
    expedition: { name: '探险发现', icon: '🗺️', color: '#3b82f6' },
    market: { name: '市场购买', icon: '🏪', color: '#f59e0b' },
    exchange: { name: '交换站', icon: '🔄', color: '#06b6d4' },
    gacha: { name: '盲盒抽取', icon: '🎁', color: '#a855f7' },
    season: { name: '赛季奖励', icon: '🏆', color: '#ef4444' },
    quiz: { name: '问答解锁', icon: '❓', color: '#22c55e' },
    research: { name: '研究院', icon: '🔬', color: '#6366f1' },
    auction: { name: '拍卖竞得', icon: '🎪', color: '#ef4444' }
  }

  const getSourceConfig = (source) => {
    return SOURCE_CONFIG[source] || { name: source, icon: '📦', color: '#6b7280' }
  }

  const getCoinCategoryConfig = (category) => {
    return COIN_CATEGORY_CONFIG[category] || { 
      name: category, 
      icon: '💰', 
      type: 'income',
      color: '#6b7280' 
    }
  }

  const addCoinTransaction = (category, amount, description = '', extraData = {}) => {
    const config = getCoinCategoryConfig(category)
    const transaction = {
      id: `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      categoryName: config.name,
      categoryIcon: config.icon,
      categoryColor: config.color,
      type: config.type,
      amount: Math.abs(amount),
      description,
      extraData,
      balanceAfter: coins.value,
      timestamp: Date.now()
    }

    coinTransactions.value.unshift(transaction)
    
    if (coinTransactions.value.length > MAX_COIN_TRANSACTIONS) {
      coinTransactions.value = coinTransactions.value.slice(0, MAX_COIN_TRANSACTIONS)
    }

    saveProgress()
    return transaction
  }

  const getCoinTransactions = ({ 
    type = null, 
    category = null, 
    categories = null,
    mineralId = null,
    limit = null,
    startDate = null,
    endDate = null
  } = {}) => {
    let transactions = [...coinTransactions.value]
    
    if (type) {
      transactions = transactions.filter(t => t.type === type)
    }
    if (category) {
      transactions = transactions.filter(t => t.category === category)
    }
    if (categories && categories.length > 0) {
      transactions = transactions.filter(t => categories.includes(t.category))
    }
    if (mineralId) {
      transactions = transactions.filter(t => t.extraData?.mineralId === mineralId)
    }
    if (startDate) {
      transactions = transactions.filter(t => t.timestamp >= startDate)
    }
    if (endDate) {
      transactions = transactions.filter(t => t.timestamp <= endDate)
    }
    if (limit) {
      transactions = transactions.slice(0, limit)
    }
    
    return transactions
  }

  const getCoinStats = ({ startDate = null, endDate = null, categories = null } = {}) => {
    const transactions = getCoinTransactions({ startDate, endDate, categories })
    
    let totalIncome = 0
    let totalExpense = 0
    const categoryStats = {}

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount
      } else {
        totalExpense += t.amount
      }
      
      if (!categoryStats[t.category]) {
        const config = getCoinCategoryConfig(t.category)
        categoryStats[t.category] = {
          category: t.category,
          name: config.name,
          icon: config.icon,
          color: config.color,
          type: config.type,
          amount: 0,
          count: 0
        }
      }
      categoryStats[t.category].amount += t.amount
      categoryStats[t.category].count++
    }

    return {
      totalIncome,
      totalExpense,
      netChange: totalIncome - totalExpense,
      categoryStats: Object.values(categoryStats).sort((a, b) => b.amount - a.amount),
      transactionCount: transactions.length
    }
  }

  const getMineralCoinStats = (mineralId) => {
    const transactions = getCoinTransactions({ mineralId })
    
    let totalIncome = 0
    let totalExpense = 0
    let repeatRewardCount = 0
    let buyCount = 0

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount
        if (t.category === 'repeat_reward') {
          repeatRewardCount++
        }
      } else {
        totalExpense += t.amount
        if (t.category === 'market_buy') {
          buyCount++
        }
      }
    }

    return {
      totalIncome,
      totalExpense,
      netChange: totalIncome - totalExpense,
      repeatRewardCount,
      buyCount,
      transactions
    }
  }

  const addDiscoveryLog = (mineral, source, sourceData, rewards, keyEvents = []) => {
    const sourceConfig = getSourceConfig(source)
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mineralId: mineral.id,
      mineralName: mineral.name,
      mineralEmoji: mineral.emoji,
      rarity: mineral.rarity,
      source,
      sourceName: sourceConfig.name,
      sourceIcon: sourceConfig.icon,
      sourceColor: sourceConfig.color,
      sourceData,
      rewards: {
        coins: rewards.coins || 0,
        exp: rewards.exp || 0,
        isNew: rewards.isNew || false
      },
      keyEvents,
      timestamp: Date.now()
    }

    discoveryLogs.value.unshift(logEntry)
    
    if (discoveryLogs.value.length > MAX_LOGS) {
      discoveryLogs.value = discoveryLogs.value.slice(0, MAX_LOGS)
    }

    saveProgress()
    return logEntry
  }

  const getDiscoveryLogs = ({ source = null, rarity = null, mineralId = null, limit = null } = {}) => {
    let logs = [...discoveryLogs.value]
    
    if (source) {
      logs = logs.filter(l => l.source === source)
    }
    if (rarity) {
      logs = logs.filter(l => l.rarity === rarity)
    }
    if (mineralId) {
      logs = logs.filter(l => l.mineralId === mineralId)
    }
    if (limit) {
      logs = logs.slice(0, limit)
    }
    
    return logs
  }

  const getDiscoveryLogsByDate = () => {
    const groups = {}
    for (const log of discoveryLogs.value) {
      const date = new Date(log.timestamp)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(log)
    }
    return groups
  }

  const isMineralCollected = (mineralId) => {
    return collectedMinerals.value.some(m => m.id === mineralId)
  }

  const collectMineral = (mineral, source = 'collage', sourceData = {}, rewards = {}, keyEvents = [], options = {}) => {
    const detectorStore = useDetectorStore()
    
    const sourceRecord = {
      source,
      sourceData,
      obtainedAt: Date.now()
    }
    
    let isNew = false
    let earnedCoins = 0
    let extraCoins = rewards.coins || 0
    let extraExp = rewards.exp || 0
    let dropCount = 1
    const skipCoinReward = options.skipCoinReward || false
    const fixedCount = options.fixedCount || null
    
    if (!isMineralCollected(mineral.id)) {
      collectedMinerals.value.push({
        ...mineral,
        collectedAt: Date.now(),
        count: 1,
        sources: [sourceRecord]
      })
      emitTaskEvent('mineralCollected', mineral)
      
      if (!skipCoinReward) {
        const baseCoins = RARITY_CONFIG[mineral.rarity].starCount * 10
        const bonusCoins = detectorStore.applyCoinBonus(baseCoins)
        coins.value += bonusCoins
        earnedCoins = bonusCoins + extraCoins
        emitTaskEvent('coinsEarned', bonusCoins)
        
        addCoinTransaction('first_discovery', bonusCoins, `首次发现 ${mineral.name}`, {
          mineralId: mineral.id,
          mineralName: mineral.name,
          mineralEmoji: mineral.emoji,
          rarity: mineral.rarity,
          source,
          baseCoins,
          bonusCoins
        })
      } else {
        earnedCoins = extraCoins
        if (extraCoins > 0) {
          coins.value += extraCoins
          emitTaskEvent('coinsEarned', extraCoins)
        }
      }
      
      if (extraCoins > 0) {
        const extraCategory = source === 'collage' ? 'collage_bonus' : 
                            source === 'expedition' ? 'expedition_reward' : 'first_discovery'
        addCoinTransaction(extraCategory, extraCoins, `${mineral.name} ${source === 'collage' ? '拼装' : '获取'}奖励`, {
          mineralId: mineral.id,
          mineralName: mineral.name,
          mineralEmoji: mineral.emoji,
          rarity: mineral.rarity,
          source
        })
      }
      
      isNew = true
      const events = ['首次发现！', ...keyEvents]
      addDiscoveryLog(mineral, source, sourceData, {
        coins: earnedCoins,
        exp: extraExp,
        isNew: true
      }, events)
      
      saveProgress()
      return true
    } else {
      const existing = collectedMinerals.value.find(m => m.id === mineral.id)
      
      if (fixedCount !== null) {
        dropCount = fixedCount
      } else {
        dropCount = detectorStore.rollMultiDropCount()
      }
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
      
      if (!skipCoinReward) {
        const baseCoins = 10 * dropCount
        const bonusCoins = detectorStore.applyCoinBonus(baseCoins)
        coins.value += bonusCoins
        earnedCoins = bonusCoins + extraCoins
        emitTaskEvent('coinsEarned', bonusCoins)
        
        addCoinTransaction('repeat_reward', bonusCoins, `重复收集 ${mineral.name} x${dropCount}`, {
          mineralId: mineral.id,
          mineralName: mineral.name,
          mineralEmoji: mineral.emoji,
          rarity: mineral.rarity,
          source,
          dropCount,
          baseCoins,
          bonusCoins
        })
      } else {
        earnedCoins = extraCoins
        if (extraCoins > 0) {
          coins.value += extraCoins
          emitTaskEvent('coinsEarned', extraCoins)
        }
      }
      
      if (extraCoins > 0) {
        const extraCategory = source === 'collage' ? 'collage_bonus' : 
                            source === 'expedition' ? 'expedition_reward' : 'repeat_reward'
        addCoinTransaction(extraCategory, extraCoins, `${mineral.name} ${source === 'collage' ? '拼装' : '获取'}奖励`, {
          mineralId: mineral.id,
          mineralName: mineral.name,
          mineralEmoji: mineral.emoji,
          rarity: mineral.rarity,
          source
        })
      }
      
      emitTaskEvent('mineralCollected', mineral)
      
      const events = dropCount > 1 ? [`多重掉落 x${dropCount}！`, ...keyEvents] : keyEvents
      addDiscoveryLog(mineral, source, sourceData, {
        coins: earnedCoins,
        exp: extraExp,
        isNew: false
      }, events)
      
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
    collageStartTime.value = Date.now()

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
      const mineral = currentCollage.value
      const now = Date.now()
      const timeTaken = collageStartTime.value 
        ? Math.max(1, Math.floor((now - collageStartTime.value) / 1000))
        : Math.floor(Math.random() * 60) + 30
      
      const rarityConfig = RARITY_CONFIG[mineral.rarity]
      const baseCollageCoins = rarityConfig.starCount * 20
      const collageBonusCoins = detectorStore.applyCoinBonus(baseCollageCoins)
      
      const keyEvents = []
      
      if (timeTaken < 15) {
        keyEvents.push('闪电速度！')
      } else if (timeTaken < 30) {
        keyEvents.push('快速拼装！')
      }
      
      if (mineral.rarity === RARITY.LEGENDARY) {
        keyEvents.push('传说矿物！')
      } else if (mineral.rarity === RARITY.EPIC) {
        keyEvents.push('史诗矿物！')
      }
      
      const totalPieces = collagePieces.value.length
      const baseExp = totalPieces * 5 + rarityConfig.starCount * 2
      
      const wasNew = collectMineral(mineral, 'collage', {
        timeTaken
      }, {
        coins: collageBonusCoins,
        exp: baseExp
      }, keyEvents)
      
      coins.value += collageBonusCoins
      emitTaskEvent('coinsEarned', collageBonusCoins)
      
      addExp(baseExp)

      completedCollages.value.push({
        mineral,
        completedAt: now,
        timeTaken,
        coins: collageBonusCoins,
        exp: baseExp,
        isNew: wasNew,
        events: keyEvents
      })

      newMineral.value = mineral
      isNewMineral.value = wasNew
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
    collageStartTime.value = null
  }

  const resetCurrentCollage = () => {
    currentCollage.value = null
    collagePieces.value = []
    collageStartTime.value = null
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
      discoveryLogs: discoveryLogs.value,
      coinTransactions: coinTransactions.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }

  const generateMockCollectedMinerals = () => {
    const mockData = []
    const sourceTypes = ['collage', 'expedition', 'market', 'exchange', 'gacha', 'season', 'quiz']
    const locations = EXPEDITION_LOCATIONS.map(l => ({ id: l.id, name: l.name }))
    const boxTypes = ['basic', 'advanced', 'legendary']
    const boxNames = ['普通盲盒', '高级盲盒', '传说盲盒']
    
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
        let sourceData = {}
        
        switch (source) {
          case 'expedition':
            sourceData = { ...locations[Math.floor(Math.random() * locations.length)] }
            break
          case 'gacha':
            const boxIndex = Math.floor(Math.random() * boxTypes.length)
            sourceData = {
              boxType: boxTypes[boxIndex],
              boxName: boxNames[boxIndex],
              isPity: Math.random() < 0.1
            }
            break
          case 'collage':
            sourceData = { timeTaken: Math.floor(Math.random() * 60) + 20 }
            break
          case 'exchange':
            sourceData = {
              type: 'rarity_conversion',
              fromRarity: item.rarity,
              coinCost: Math.floor(Math.random() * 500) + 100
            }
            break
          case 'season':
            const season = SEASONS[Math.floor(Math.random() * SEASONS.length)]
            sourceData = {
              type: 'pass_reward',
              seasonId: season?.id,
              seasonName: season?.name,
              tier: Math.floor(Math.random() * 50) + 1
            }
            break
          case 'quiz':
            sourceData = {
              type: 'reward_unlock',
              rarity: item.rarity,
              cost: Math.floor(Math.random() * 100) + 20
            }
            break
          case 'market':
            sourceData = {
              price: Math.floor(Math.random() * 1000) + 100
            }
            break
        }
        
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

  const generateMockDiscoveryLogs = () => {
    const mockLogs = []
    const sourceTypes = ['collage', 'expedition', 'market', 'exchange', 'gacha', 'season', 'quiz']
    const locations = EXPEDITION_LOCATIONS.map(l => ({ id: l.id, name: l.name }))
    const boxTypes = ['basic', 'advanced', 'legendary']
    const boxNames = ['普通盲盒', '高级盲盒', '传说盲盒']
    const eventTemplates = [
      '探测器升级生效！',
      '幸运加成触发！',
      '稀有度提升！',
      '完美拼装！',
      '意外发现！',
      '专家级鉴定！'
    ]
    
    const mineralsForLogs = [
      { id: 15, rarity: 'legendary', count: 1 },
      { id: 12, rarity: 'epic', count: 1 },
      { id: 13, rarity: 'epic', count: 1 },
      { id: 9, rarity: 'rare', count: 2 },
      { id: 10, rarity: 'rare', count: 1 },
      { id: 11, rarity: 'rare', count: 1 },
      { id: 5, rarity: 'uncommon', count: 3 },
      { id: 6, rarity: 'uncommon', count: 2 },
      { id: 7, rarity: 'uncommon', count: 1 },
      { id: 1, rarity: 'common', count: 5 },
      { id: 2, rarity: 'common', count: 3 },
      { id: 3, rarity: 'common', count: 2 },
      { id: 4, rarity: 'common', count: 2 }
    ]

    let logTime = Date.now() - 7 * 24 * 60 * 60 * 1000

    for (const item of mineralsForLogs) {
      const mineralData = getMineralById(item.id)
      if (!mineralData) continue

      for (let i = 0; i < item.count; i++) {
        const source = sourceTypes[Math.floor(Math.random() * sourceTypes.length)]
        const sourceConfig = SOURCE_CONFIG[source]
        let sourceData = {}
        let keyEvents = []
        
        switch (source) {
          case 'expedition':
            const loc = locations[Math.floor(Math.random() * locations.length)]
            sourceData = { ...loc, difficulty: Math.floor(Math.random() * 3) + 1 }
            if (Math.random() < 0.3) keyEvents.push(eventTemplates[Math.floor(Math.random() * eventTemplates.length)])
            break
          case 'gacha':
            const boxIndex = Math.floor(Math.random() * boxTypes.length)
            const isPity = Math.random() < 0.1
            sourceData = {
              boxType: boxTypes[boxIndex],
              boxName: boxNames[boxIndex],
              isPity
            }
            if (isPity) keyEvents.push('保底触发！')
            if (item.rarity === 'legendary') keyEvents.push('欧皇附体！')
            break
          case 'collage':
            sourceData = { timeTaken: Math.floor(Math.random() * 60) + 20 }
            if (Math.random() < 0.2) keyEvents.push(eventTemplates[3])
            break
          case 'exchange':
            sourceData = {
              type: 'rarity_conversion',
              fromRarity: item.rarity,
              coinCost: Math.floor(Math.random() * 500) + 100
            }
            break
          case 'season':
            const season = SEASONS[Math.floor(Math.random() * SEASONS.length)]
            sourceData = {
              type: 'pass_reward',
              seasonId: season?.id,
              seasonName: season?.name,
              tier: Math.floor(Math.random() * 50) + 1
            }
            break
          case 'quiz':
            sourceData = {
              type: 'reward_unlock',
              rarity: item.rarity,
              cost: Math.floor(Math.random() * 100) + 20
            }
            if (Math.random() < 0.3) keyEvents.push('全部答对！')
            break
          case 'market':
            sourceData = {
              price: Math.floor(Math.random() * 1000) + 100
            }
            break
        }

        const isFirst = i === 0
        if (isFirst) keyEvents.unshift('首次发现！')

        const hasMultiDrop = !isFirst && Math.random() < 0.2
        if (hasMultiDrop) keyEvents.unshift('多重掉落 x2！')

        mockLogs.push({
          id: `log_mock_${mockLogs.length}`,
          mineralId: mineralData.id,
          mineralName: mineralData.name,
          mineralEmoji: mineralData.emoji,
          rarity: mineralData.rarity,
          source,
          sourceName: sourceConfig.name,
          sourceIcon: sourceConfig.icon,
          sourceColor: sourceConfig.color,
          sourceData,
          rewards: {
            coins: Math.floor(Math.random() * 200) + 50,
            exp: Math.floor(Math.random() * 50) + 10,
            isNew: isFirst
          },
          keyEvents,
          timestamp: logTime
        })

        logTime += Math.floor(Math.random() * 4 * 60 * 60 * 1000) + 30 * 60 * 1000
      }
    }

    return mockLogs.sort((a, b) => b.timestamp - a.timestamp)
  }

  const generateMockCoinTransactions = () => {
    const mockTransactions = []
    const incomeCategories = [
      { category: 'first_discovery', weight: 15 },
      { category: 'repeat_reward', weight: 30 },
      { category: 'collage_bonus', weight: 15 },
      { category: 'expedition_reward', weight: 20 },
      { category: 'task_reward', weight: 10 },
      { category: 'market_sell', weight: 10 }
    ]
    const expenseCategories = [
      { category: 'market_buy', weight: 40 },
      { category: 'exchange_cost', weight: 20 },
      { category: 'gacha_buy', weight: 25 },
      { category: 'research_cost', weight: 15 }
    ]
    
    const totalWeight = (arr) => arr.reduce((sum, item) => sum + item.weight, 0)
    const pickCategory = (arr) => {
      const rand = Math.random() * totalWeight(arr)
      let cumulative = 0
      for (const item of arr) {
        cumulative += item.weight
        if (rand <= cumulative) return item.category
      }
      return arr[0].category
    }

    let mockCoins = 100
    
    for (let i = 0; i < 50; i++) {
      const isIncome = Math.random() < 0.6
      const category = isIncome ? pickCategory(incomeCategories) : pickCategory(expenseCategories)
      const config = COIN_CATEGORY_CONFIG[category]
      
      let amount = 0
      let description = ''
      const extraData = {}
      
      if (isIncome) {
        switch (category) {
          case 'first_discovery':
            amount = Math.floor(Math.random() * 80) + 20
            description = `首次发现矿物`
            break
          case 'repeat_reward':
            amount = Math.floor(Math.random() * 30) + 10
            description = `重复收集奖励`
            break
          case 'collage_bonus':
            amount = Math.floor(Math.random() * 50) + 20
            description = `拼装完成奖励`
            break
          case 'expedition_reward':
            amount = Math.floor(Math.random() * 100) + 30
            description = `探险完成奖励`
            break
          case 'task_reward':
            amount = Math.floor(Math.random() * 60) + 20
            description = `任务完成奖励`
            break
          case 'market_sell':
            amount = Math.floor(Math.random() * 200) + 50
            description = `市场出售矿物`
            break
          default:
            amount = 10
        }
        mockCoins += amount
      } else {
        switch (category) {
          case 'market_buy':
            amount = Math.floor(Math.random() * 300) + 50
            description = `市场购买矿物`
            break
          case 'exchange_cost':
            amount = Math.floor(Math.random() * 150) + 50
            description = `稀有度升级消耗`
            break
          case 'gacha_buy':
            amount = Math.floor(Math.random() * 100) + 30
            description = `购买盲盒券`
            break
          case 'research_cost':
            amount = Math.floor(Math.random() * 80) + 20
            description = `研究消耗`
            break
          default:
            amount = 10
        }
        mockCoins -= amount
      }
      
      const timestamp = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      
      mockTransactions.push({
        id: `coin_mock_${i}`,
        category,
        categoryName: config.name,
        categoryIcon: config.icon,
        categoryColor: config.color,
        type: config.type,
        amount: Math.abs(amount),
        description,
        extraData,
        balanceAfter: Math.max(0, mockCoins),
        timestamp
      })
    }
    
    return mockTransactions.sort((a, b) => b.timestamp - a.timestamp)
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
        discoveryLogs.value = progress.discoveryLogs || []
        coinTransactions.value = progress.coinTransactions || []
        
        regenStamina()
      } else {
        collectedMinerals.value = generateMockCollectedMinerals()
        discoveryLogs.value = generateMockDiscoveryLogs()
        coinTransactions.value = generateMockCoinTransactions()
        coins.value = 5000
        totalCollages.value = 20
        saveProgress()
      }
    } catch (e) {
      console.error('Failed to load progress:', e)
      collectedMinerals.value = generateMockCollectedMinerals()
      discoveryLogs.value = generateMockDiscoveryLogs()
      coinTransactions.value = generateMockCoinTransactions()
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
    collageStartTime.value = null
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
    discoveryLogs.value = []
    coinTransactions.value = []
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
    collageStartTime,
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
    discoveryLogs,
    coinTransactions,
    COIN_TRANSACTION_TYPE,
    COIN_CATEGORY_CONFIG,
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
    addDiscoveryLog,
    getDiscoveryLogs,
    getDiscoveryLogsByDate,
    getSourceConfig,
    getCoinCategoryConfig,
    addCoinTransaction,
    getCoinTransactions,
    getCoinStats,
    getMineralCoinStats,
    closeRewardModal,
    cancelExpedition,
    getLocation,
    onTaskEvent,
    emitTaskEvent
  }
})
