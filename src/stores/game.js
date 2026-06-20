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
const SLOTS_KEY = 'mineral_collage_slots'
const ACTIVE_SLOT_KEY = 'mineral_collage_active_slot'

const DATA_CATEGORY = {
  HOME: 'home',
  COLLAGE: 'collage',
  COLLECTION: 'collection'
}

const DATA_CATEGORY_CONFIG = {
  [DATA_CATEGORY.HOME]: {
    name: '首页数据',
    icon: '🏛️',
    description: '金币、体力、探险等级、交易记录等'
  },
  [DATA_CATEGORY.COLLAGE]: {
    name: '拼装数据',
    icon: '🎨',
    description: '当前拼装、拼装碎片、拼装历史等'
  },
  [DATA_CATEGORY.COLLECTION]: {
    name: '图鉴数据',
    icon: '📖',
    description: '已收集矿物、发现日志等'
  }
}

const getCategoryFields = (category) => {
  const fields = {
    [DATA_CATEGORY.HOME]: [
      'coins',
      'stamina',
      'maxStamina',
      'staminaRegenRate',
      'lastStaminaRegen',
      'expeditionLevel',
      'expeditionExp',
      'expToNextLevel',
      'expeditionHistory',
      'coinTransactions',
      'newlyDiscoveredMinerals'
    ],
    [DATA_CATEGORY.COLLAGE]: [
      'currentCollage',
      'collagePieces',
      'collageStartTime',
      'collageSnapshot',
      'completedCollages',
      'totalCollages'
    ],
    [DATA_CATEGORY.COLLECTION]: [
      'collectedMinerals',
      'discoveryLogs'
    ]
  }
  return fields[category] || []
}

export const useGameStore = defineStore('game', () => {
  const saveSlots = ref([])
  const activeSlotId = ref('default')
  const slotCategoryBindings = ref({
    [DATA_CATEGORY.HOME]: 'default',
    [DATA_CATEGORY.COLLAGE]: 'default',
    [DATA_CATEGORY.COLLECTION]: 'default'
  })
  const collectedMinerals = ref([])
  const currentCollage = ref(null)
  const collagePieces = ref([])
  const completedCollages = ref([])
  const coins = ref(100)
  const totalCollages = ref(0)
  const showNewMineralModal = ref(false)
  const newMineral = ref(null)
  const isNewMineral = ref(false)
  const showFirstDiscoveryCelebration = ref(false)
  const firstDiscoveryMineral = ref(null)
  const firstDiscoveryRewards = ref(null)
  const newlyDiscoveredMinerals = ref([])
  
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
  const collageSnapshot = ref(null)

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

  const rarityProgress = computed(() => {
    const allMinerals = MINERALS
    const collectedIds = new Set(collectedMinerals.value.map(m => m.id))
    const result = {}

    for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
      const total = allMinerals.filter(m => m.rarity === rarity).length
      const collected = allMinerals.filter(m => m.rarity === rarity && collectedIds.has(m.id)).length
      result[rarity] = {
        name: config.name,
        color: config.color,
        bgGradient: config.bgGradient,
        collected,
        total,
        percentage: total > 0 ? Math.round((collected / total) * 100) : 0
      }
    }
    return result
  })

  const collectionMilestones = computed(() => {
    const total = MINERALS.length
    const collected = collectedMinerals.value.length
    return [
      { threshold: 1, label: '初入矿物世界', icon: '🌱', description: '收集第1种矿物' },
      { threshold: 3, label: '新手收藏家', icon: '📦', description: '收集3种矿物' },
      { threshold: Math.ceil(total * 0.25), label: '矿物爱好者', icon: '💎', description: `收集${Math.ceil(total * 0.25)}种矿物（25%）` },
      { threshold: Math.ceil(total * 0.5), label: '资深收藏家', icon: '🏆', description: `收集${Math.ceil(total * 0.5)}种矿物（50%）` },
      { threshold: Math.ceil(total * 0.75), label: '矿物学专家', icon: '🎓', description: `收集${Math.ceil(total * 0.75)}种矿物（75%）` },
      { threshold: Math.ceil(total * 0.9), label: '传奇收藏家', icon: '👑', description: `收集${Math.ceil(total * 0.9)}种矿物（90%）` },
      { threshold: total, label: '矿物博物馆馆长', icon: '🏛️', description: `收集全部${total}种矿物` }
    ]
  })

  const rarityMilestones = computed(() => {
    const milestones = {}
    for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
      const total = MINERALS.filter(m => m.rarity === rarity).length
      if (total === 0) continue

      const rarityMiles = []
      for (let i = 1; i <= total; i++) {
        let label = ''
        let icon = '✨'
        if (i === 1) {
          label = `首个${config.name}`
          icon = '🌟'
        } else if (i === total) {
          label = `集齐${config.name}`
          icon = '🏆'
        } else {
          label = `${config.name}×${i}`
          icon = '💎'
        }
        rarityMiles.push({
          threshold: i,
          label,
          icon,
          description: `收集${i}种${config.name}矿物`,
          rarity,
          config
        })
      }
      milestones[rarity] = rarityMiles
    }
    return milestones
  })

  const currentMilestone = computed(() => {
    const collected = collectedMinerals.value.length
    const milestones = collectionMilestones.value
    const completed = milestones.filter(m => collected >= m.threshold)
    const next = milestones.find(m => collected < m.threshold)
    
    return {
      completedCount: completed.length,
      totalCount: milestones.length,
      current: completed.length > 0 ? completed[completed.length - 1] : null,
      next: next || null,
      progressToNext: next ? {
        needed: next.threshold - collected,
        percentage: Math.min(100, Math.round((collected / next.threshold) * 100))
      } : null
    }
  })

  const currentRarityMilestones = computed(() => {
    const collectedIds = new Set(collectedMinerals.value.map(m => m.id))
    const result = {}
    
    for (const [rarity, milestones] of Object.entries(rarityMilestones.value)) {
      const total = MINERALS.filter(m => m.rarity === rarity).length
      const collected = MINERALS.filter(m => m.rarity === rarity && collectedIds.has(m.id)).length
      const completed = milestones.filter(m => collected >= m.threshold)
      const next = milestones.find(m => collected < m.threshold)
      
      result[rarity] = {
        collected,
        total,
        completedCount: completed.length,
        totalCount: milestones.length,
        current: completed.length > 0 ? completed[completed.length - 1] : null,
        next: next || null,
        progressToNext: next ? {
          needed: next.threshold - collected,
          percentage: Math.min(100, Math.round((collected / next.threshold) * 100))
        } : null
      }
    }
    return result
  })

  const collectionStageGoals = computed(() => {
    const collected = collectedMinerals.value.length
    const total = MINERALS.length
    const percentage = total > 0 ? (collected / total) * 100 : 0

    let currentStage = null
    let nextStage = null

    if (percentage === 0) {
      currentStage = { stage: 0, label: '待启程', description: '开始你的矿物收集之旅吧！', icon: '🚀' }
      nextStage = { stage: 1, label: '初入矿物世界', goal: 1, description: '收集第1种矿物' }
    } else if (percentage < 25) {
      currentStage = { stage: 1, label: '探索者', description: '正在熟悉矿物世界', icon: '🔍' }
      nextStage = { stage: 2, label: '矿物爱好者', goal: Math.ceil(total * 0.25), description: '达成25%收集进度' }
    } else if (percentage < 50) {
      currentStage = { stage: 2, label: '爱好者', description: '对矿物有了初步了解', icon: '💎' }
      nextStage = { stage: 3, label: '资深收藏家', goal: Math.ceil(total * 0.5), description: '达成50%收集进度' }
    } else if (percentage < 75) {
      currentStage = { stage: 3, label: '收藏家', description: '已经是资深玩家了', icon: '🏆' }
      nextStage = { stage: 4, label: '矿物学专家', goal: Math.ceil(total * 0.75), description: '达成75%收集进度' }
    } else if (percentage < 100) {
      currentStage = { stage: 4, label: '专家', description: '接近完成全收集', icon: '🎓' }
      nextStage = { stage: 5, label: '博物馆馆长', goal: total, description: '完成全部收集' }
    } else {
      currentStage = { stage: 5, label: '馆长', description: '已完成全部矿物收集！', icon: '👑' }
      nextStage = null
    }

    const nextGoalNeeded = nextStage ? nextStage.goal - collected : 0

    return {
      current: currentStage,
      next: nextStage,
      nextGoalNeeded,
      currentPercentage: percentage,
      nextGoalPercentage: nextStage ? Math.min(100, Math.round((collected / nextStage.goal) * 100)) : 100
    }
  })

  const nextUncollectedByRarity = computed(() => {
    const collectedIds = new Set(collectedMinerals.value.map(m => m.id))
    const result = {}
    
    for (const rarity of Object.keys(RARITY_CONFIG)) {
      const uncollected = MINERALS.filter(m => m.rarity === rarity && !collectedIds.has(m.id))
      result[rarity] = uncollected.length > 0 ? uncollected[0] : null
    }
    
    return result
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

  const recentUnlock = computed(() => {
    if (discoveryLogs.value.length === 0) return null
    const recentLog = discoveryLogs.value.find(log => log.rewards.isNew)
    if (!recentLog) return null
    const mineral = getMineralById(recentLog.mineralId)
    if (!mineral) return null
    return {
      mineral,
      source: recentLog.source,
      sourceName: recentLog.sourceName,
      sourceIcon: recentLog.sourceIcon,
      sourceColor: recentLog.sourceColor,
      timestamp: recentLog.timestamp
    }
  })

  const highestRarityMineral = computed(() => {
    if (collectedMinerals.value.length === 0) return null
    const rarityLevel = (rarity) => {
      const levels = { legendary: 4, epic: 3, rare: 2, uncommon: 1, common: 0 }
      return levels[rarity] ?? -1
    }
    const sorted = [...collectedMinerals.value].sort((a, b) => {
      const levelDiff = rarityLevel(b.rarity) - rarityLevel(a.rarity)
      if (levelDiff !== 0) return levelDiff
      return (b.collectedAt || 0) - (a.collectedAt || 0)
    })
    return sorted[0]
  })

  const consecutiveCollageDays = computed(() => {
    if (completedCollages.value.length === 0) return 0
    const collageDays = new Set()
    completedCollages.value.forEach(collage => {
      const date = new Date(collage.completedAt)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      collageDays.add(dateKey)
    })
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      if (collageDays.has(dateKey)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  })

  const allLocations = computed(() => EXPEDITION_LOCATIONS)

  const canStartExpedition = computed(() => {
    return expeditionPhase.value === 'map' && stamina.value > 0
  })

  const hasCollageSnapshot = computed(() => collageSnapshot.value !== null)

  const hasActiveCollage = computed(() => currentCollage.value !== null && collagePieces.value.length > 0)

  const collageProgress = computed(() => {
    if (!collagePieces.value.length) return 0
    const placed = collagePieces.value.filter(p => p.isPlaced).length
    return Math.round((placed / collagePieces.value.length) * 100)
  })

  const lastCollageReward = computed(() => {
    if (completedCollages.value.length === 0) return null
    const last = completedCollages.value[completedCollages.value.length - 1]
    const rarityConfig = last.mineral ? RARITY_CONFIG[last.mineral.rarity] : null
    const detectorStore = useDetectorStore()
    const baseCoins = rarityConfig ? rarityConfig.starCount * 20 : 0
    const detectorBonus = detectorStore.totalStats?.coinBonus || 0
    const bonusCoins = last.coins - baseCoins

    return {
      mineral: last.mineral,
      completedAt: last.completedAt,
      timeTaken: last.timeTaken,
      coins: last.coins,
      baseCoins,
      detectorBonus,
      bonusCoins,
      exp: last.exp,
      isNew: last.isNew,
      events: last.events || [],
      pieceCount: last.mineral ? rarityConfig?.pieceCount || 0 : 0
    }
  })

  const SOURCE_TYPE = {
    RANDOM_DROP: 'random_drop',
    DIRECT_PURCHASE: 'direct_purchase',
    EVENT_REWARD: 'event_reward'
  }

  const SOURCE_TYPE_CONFIG = {
    [SOURCE_TYPE.RANDOM_DROP]: { name: '随机掉落', icon: '🎲', color: '#8b5cf6' },
    [SOURCE_TYPE.DIRECT_PURCHASE]: { name: '指定购买', icon: '🛒', color: '#f59e0b' },
    [SOURCE_TYPE.EVENT_REWARD]: { name: '活动获得', icon: '🎊', color: '#22c55e' }
  }

  const SOURCE_CONFIG = {
    collage: { name: '拼装工坊', icon: '🎨', color: '#ec4899', type: SOURCE_TYPE.RANDOM_DROP },
    expedition: { name: '探险发现', icon: '🗺️', color: '#3b82f6', type: SOURCE_TYPE.RANDOM_DROP },
    market: { name: '市场购买', icon: '🏪', color: '#f59e0b', type: SOURCE_TYPE.DIRECT_PURCHASE },
    exchange: { name: '交换站', icon: '🔄', color: '#06b6d4', type: SOURCE_TYPE.RANDOM_DROP },
    gacha: { name: '盲盒抽取', icon: '🎁', color: '#a855f7', type: SOURCE_TYPE.RANDOM_DROP },
    season: { name: '赛季奖励', icon: '🏆', color: '#ef4444', type: SOURCE_TYPE.EVENT_REWARD },
    quiz: { name: '问答解锁', icon: '❓', color: '#22c55e', type: SOURCE_TYPE.EVENT_REWARD },
    research: { name: '研究院', icon: '🔬', color: '#6366f1', type: SOURCE_TYPE.EVENT_REWARD },
    auction: { name: '拍卖竞得', icon: '🎪', color: '#ef4444', type: SOURCE_TYPE.DIRECT_PURCHASE }
  }

  const getSourceConfig = (source) => {
    return SOURCE_CONFIG[source] || { name: source, icon: '📦', color: '#6b7280', type: SOURCE_TYPE.RANDOM_DROP }
  }

  const getSourceTypeConfig = (type) => {
    return SOURCE_TYPE_CONFIG[type] || { name: '未知来源', icon: '📦', color: '#6b7280' }
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
    
    const sourceConfig = getSourceConfig(source)
    const sourceRecord = {
      source,
      sourceType: sourceConfig.type,
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
      
      newlyDiscoveredMinerals.value.push({
        mineralId: mineral.id,
        discoveredAt: Date.now()
      })
      
      const rarityLevel = getRarityLevel(mineral.rarity)
      if (rarityLevel >= 2) {
        firstDiscoveryMineral.value = mineral
        firstDiscoveryRewards.value = {
          coins: earnedCoins,
          exp: extraExp
        }
        showFirstDiscoveryCelebration.value = true
      }
      
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
      
      const rarityLevel = getRarityLevel(mineral.rarity)
      const isRareFirstDiscovery = wasNew && rarityLevel >= 2
      
      if (!isRareFirstDiscovery) {
        showNewMineralModal.value = true
      }

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
    if (currentCollage.value && collagePieces.value.length > 0) {
      collageSnapshot.value = {
        mineral: { ...currentCollage.value },
        pieces: collagePieces.value.map(p => ({ ...p })),
        startTime: collageStartTime.value
      }
    }
    currentCollage.value = null
    collagePieces.value = []
    collageStartTime.value = null
  }

  const restoreCollageSnapshot = () => {
    if (!collageSnapshot.value) return null
    const snapshot = collageSnapshot.value
    currentCollage.value = snapshot.mineral
    collagePieces.value = snapshot.pieces.map(p => ({ ...p }))
    collageStartTime.value = snapshot.startTime
    collageSnapshot.value = null
    saveProgress()
    return { mineral: currentCollage.value, pieces: [...collagePieces.value] }
  }

  const clearCollageSnapshot = () => {
    collageSnapshot.value = null
  }

  const saveCollageDraft = () => {
    if (currentCollage.value && collagePieces.value.length > 0) {
      saveProgress()
    }
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
      currentCollage: currentCollage.value,
      collagePieces: collagePieces.value,
      collageStartTime: collageStartTime.value,
      collageSnapshot: collageSnapshot.value,
      newlyDiscoveredMinerals: newlyDiscoveredMinerals.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

    for (const category of Object.values(DATA_CATEGORY)) {
      const slotId = slotCategoryBindings.value[category]
      if (slotId) {
        const categoryData = collectCategoryData(category)
        const slotKey = getSlotStorageKey(slotId)
        try {
          const existingData = JSON.parse(localStorage.getItem(slotKey) || '{}')
          const mergedData = { ...existingData, ...categoryData }
          localStorage.setItem(slotKey, JSON.stringify(mergedData))
          
          const slot = saveSlots.value.find(s => s.id === slotId)
          if (slot) {
            slot.updatedAt = Date.now()
          }
        } catch (e) {
          console.error(`Failed to save category ${category} to slot ${slotId}:`, e)
        }
      }
    }
    persistSlots()
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
          sourceType: SOURCE_CONFIG[source]?.type || SOURCE_TYPE.RANDOM_DROP,
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
      initializeSlots()
      
      const hasLegacySave = localStorage.getItem(STORAGE_KEY) !== null
      const hasSlotSave = localStorage.getItem(getSlotStorageKey('default')) !== null
      
      if (hasLegacySave && !hasSlotSave) {
        migrateLegacySave()
      }
      
      let loadedFromSlots = false
      for (const category of Object.values(DATA_CATEGORY)) {
        const slotId = slotCategoryBindings.value[category]
        if (slotId) {
          const success = loadFromSlot(slotId, [category])
          if (success) loadedFromSlots = true
        }
      }
      
      if (!loadedFromSlots) {
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
          newlyDiscoveredMinerals.value = progress.newlyDiscoveredMinerals || []
          
          if (progress.currentCollage && progress.collagePieces && progress.collagePieces.length > 0) {
            currentCollage.value = progress.currentCollage
            collagePieces.value = progress.collagePieces
            collageStartTime.value = progress.collageStartTime || null
          }
          if (progress.collageSnapshot) {
            collageSnapshot.value = progress.collageSnapshot
          }
          
          saveProgress()
        } else {
          collectedMinerals.value = generateMockCollectedMinerals()
          discoveryLogs.value = generateMockDiscoveryLogs()
          coinTransactions.value = generateMockCoinTransactions()
          newlyDiscoveredMinerals.value = []
          coins.value = 5000
          totalCollages.value = 20
          saveProgress()
        }
      }
      
      regenStamina()
    } catch (e) {
      console.error('Failed to load progress:', e)
      collectedMinerals.value = generateMockCollectedMinerals()
      discoveryLogs.value = generateMockDiscoveryLogs()
      coinTransactions.value = generateMockCoinTransactions()
      newlyDiscoveredMinerals.value = []
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

  const closeFirstDiscoveryCelebration = () => {
    showFirstDiscoveryCelebration.value = false
    firstDiscoveryMineral.value = null
    firstDiscoveryRewards.value = null
    if (currentCollage.value) {
      currentCollage.value = null
      collagePieces.value = []
      collageStartTime.value = null
    }
  }

  const isNewlyDiscovered = (mineralId) => {
    const entry = newlyDiscoveredMinerals.value.find(n => n.mineralId === mineralId)
    if (!entry) return false
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    return entry.discoveredAt > oneHourAgo
  }

  const markAsViewed = (mineralId) => {
    const index = newlyDiscoveredMinerals.value.findIndex(n => n.mineralId === mineralId)
    if (index > -1) {
      newlyDiscoveredMinerals.value.splice(index, 1)
      saveProgress()
    }
  }

  const getSlotStorageKey = (slotId) => `${STORAGE_KEY}_${slotId}`

  const getAllFields = () => [
    ...getCategoryFields(DATA_CATEGORY.HOME),
    ...getCategoryFields(DATA_CATEGORY.COLLAGE),
    ...getCategoryFields(DATA_CATEGORY.COLLECTION),
    'showNewMineralModal',
    'newMineral',
    'isNewMineral',
    'showFirstDiscoveryCelebration',
    'firstDiscoveryMineral',
    'firstDiscoveryRewards',
    'currentExpedition',
    'expeditionPhase',
    'currentEvent',
    'eventResult',
    'expeditionRewards',
    'showRewardModal',
    'savedAt'
  ]

  const collectDataByFields = (fields) => {
    const data = {}
    const allRefs = {
      collectedMinerals,
      currentCollage,
      collagePieces,
      completedCollages,
      coins,
      totalCollages,
      showNewMineralModal,
      newMineral,
      isNewMineral,
      showFirstDiscoveryCelebration,
      firstDiscoveryMineral,
      firstDiscoveryRewards,
      newlyDiscoveredMinerals,
      stamina,
      maxStamina,
      staminaRegenRate,
      lastStaminaRegen,
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
      collageStartTime,
      collageSnapshot
    }
    
    for (const field of fields) {
      if (allRefs[field]) {
        data[field] = allRefs[field].value
      }
    }
    data.savedAt = Date.now()
    return data
  }

  const collectAllData = () => {
    return collectDataByFields(getAllFields())
  }

  const collectCategoryData = (category) => {
    const fields = getCategoryFields(category)
    return collectDataByFields(fields)
  }

  const applyDataToState = (data) => {
    const fieldToRef = {
      collectedMinerals,
      currentCollage,
      collagePieces,
      completedCollages,
      coins,
      totalCollages,
      showNewMineralModal,
      newMineral,
      isNewMineral,
      showFirstDiscoveryCelebration,
      firstDiscoveryMineral,
      firstDiscoveryRewards,
      newlyDiscoveredMinerals,
      stamina,
      maxStamina,
      staminaRegenRate,
      lastStaminaRegen,
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
      collageStartTime,
      collageSnapshot
    }

    for (const [key, value] of Object.entries(data)) {
      if (fieldToRef[key] && fieldToRef[key].value !== undefined) {
        fieldToRef[key].value = value
      }
    }
  }

  const initializeSlots = () => {
    try {
      const savedSlots = localStorage.getItem(SLOTS_KEY)
      if (savedSlots) {
        saveSlots.value = JSON.parse(savedSlots)
      } else {
        saveSlots.value = [{
          id: 'default',
          name: '默认存档',
          icon: '💾',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          description: '初始默认存档位'
        }]
        persistSlots()
      }

      const activeSlot = localStorage.getItem(ACTIVE_SLOT_KEY)
      if (activeSlot) {
        activeSlotId.value = activeSlot
      }

      const savedBindings = localStorage.getItem(`${STORAGE_KEY}_bindings`)
      if (savedBindings) {
        slotCategoryBindings.value = JSON.parse(savedBindings)
      }
    } catch (e) {
      console.error('Failed to initialize slots:', e)
    }
  }

  const persistSlots = () => {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(saveSlots.value))
  }

  const persistBindings = () => {
    localStorage.setItem(`${STORAGE_KEY}_bindings`, JSON.stringify(slotCategoryBindings.value))
  }

  const createSlot = (name, icon = '💾', description = '') => {
    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newSlot = {
      id: slotId,
      name,
      icon,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description
    }
    saveSlots.value.push(newSlot)
    persistSlots()
    return newSlot
  }

  const updateSlot = (slotId, updates) => {
    const slot = saveSlots.value.find(s => s.id === slotId)
    if (slot) {
      Object.assign(slot, updates, { updatedAt: Date.now() })
      persistSlots()
      return true
    }
    return false
  }

  const deleteSlot = (slotId) => {
    if (slotId === 'default') return false
    const index = saveSlots.value.findIndex(s => s.id === slotId)
    if (index > -1) {
      saveSlots.value.splice(index, 1)
      localStorage.removeItem(getSlotStorageKey(slotId))
      
      for (const category of Object.keys(slotCategoryBindings.value)) {
        if (slotCategoryBindings.value[category] === slotId) {
          slotCategoryBindings.value[category] = 'default'
        }
      }
      if (activeSlotId.value === slotId) {
        activeSlotId.value = 'default'
      }
      
      persistSlots()
      persistBindings()
      localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId.value)
      return true
    }
    return false
  }

  const saveToSlot = (slotId, categories = null) => {
    const slot = saveSlots.value.find(s => s.id === slotId)
    if (!slot) return false

    let dataToSave = {}
    if (categories && categories.length > 0) {
      for (const category of categories) {
        dataToSave = { ...dataToSave, ...collectCategoryData(category) }
      }
    } else {
      dataToSave = collectAllData()
    }

    try {
      const existingData = JSON.parse(localStorage.getItem(getSlotStorageKey(slotId)) || '{}')
      const mergedData = { ...existingData, ...dataToSave }
      localStorage.setItem(getSlotStorageKey(slotId), JSON.stringify(mergedData))
      
      slot.updatedAt = Date.now()
      if (!categories || categories.length === Object.keys(DATA_CATEGORY).length) {
        slot.snapshot = getSlotSnapshot(mergedData)
      }
      persistSlots()
      return true
    } catch (e) {
      console.error('Failed to save to slot:', e)
      return false
    }
  }

  const getSlotSnapshot = (data) => {
    return {
      collectedCount: data.collectedMinerals?.length || 0,
      coins: data.coins || 0,
      completedCollages: data.completedCollages?.length || 0,
      expeditionLevel: data.expeditionLevel || 1
    }
  }

  const loadFromSlot = (slotId, categories = null) => {
    try {
      const saved = localStorage.getItem(getSlotStorageKey(slotId))
      if (!saved) return false

      const data = JSON.parse(saved)
      
      if (categories && categories.length > 0) {
        const filteredData = {}
        for (const category of categories) {
          const fields = getCategoryFields(category)
          for (const field of fields) {
            if (data[field] !== undefined) {
              filteredData[field] = data[field]
            }
          }
        }
        applyDataToState(filteredData)
      } else {
        applyDataToState(data)
      }
      
      return true
    } catch (e) {
      console.error('Failed to load from slot:', e)
      return false
    }
  }

  const switchActiveSlot = (slotId) => {
    const slot = saveSlots.value.find(s => s.id === slotId)
    if (!slot) return false
    
    saveToSlot(activeSlotId.value)
    
    activeSlotId.value = slotId
    localStorage.setItem(ACTIVE_SLOT_KEY, slotId)
    
    for (const category of Object.keys(DATA_CATEGORY)) {
      slotCategoryBindings.value[category] = slotId
    }
    persistBindings()
    
    return loadFromSlot(slotId)
  }

  const bindCategoryToSlot = (category, slotId) => {
    if (!DATA_CATEGORY[category.toUpperCase()]) return false
    const slot = saveSlots.value.find(s => s.id === slotId)
    if (!slot) return false

    const currentData = collectCategoryData(category)
    const currentSlotKey = getSlotStorageKey(slotCategoryBindings.value[category])
    const currentSlotData = JSON.parse(localStorage.getItem(currentSlotKey) || '{}')
    for (const [key, value] of Object.entries(currentData)) {
      currentSlotData[key] = value
    }
    localStorage.setItem(currentSlotKey, JSON.stringify(currentSlotData))

    slotCategoryBindings.value[category] = slotId
    persistBindings()

    return loadFromSlot(slotId, [category])
  }

  const duplicateSlot = (slotId, newName, newIcon = '💾') => {
    const sourceSlot = saveSlots.value.find(s => s.id === slotId)
    if (!sourceSlot) return null

    const sourceData = localStorage.getItem(getSlotStorageKey(slotId))
    if (!sourceData) return null

    const newSlot = createSlot(newName, newIcon, `${sourceSlot.name} 的副本`)
    localStorage.setItem(getSlotStorageKey(newSlot.id), sourceData)
    
    if (sourceSlot.snapshot) {
      newSlot.snapshot = { ...sourceSlot.snapshot }
      persistSlots()
    }
    
    return newSlot
  }

  const exportSlotData = (slotId, categories = null) => {
    try {
      const saved = localStorage.getItem(getSlotStorageKey(slotId))
      if (!saved) return null

      let data = JSON.parse(saved)
      if (categories && categories.length > 0) {
        const filteredData = {}
        for (const category of categories) {
          const fields = getCategoryFields(category)
          for (const field of fields) {
            if (data[field] !== undefined) {
              filteredData[field] = data[field]
            }
          }
        }
        data = filteredData
      }

      const slot = saveSlots.value.find(s => s.id === slotId)
      const exportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        slotName: slot?.name || 'Unknown',
        categories: categories || Object.values(DATA_CATEGORY),
        data
      }

      return JSON.stringify(exportData, null, 2)
    } catch (e) {
      console.error('Failed to export slot data:', e)
      return null
    }
  }

  const importSlotData = (jsonString, targetSlotId = null, merge = false) => {
    try {
      const importData = JSON.parse(jsonString)
      
      if (!importData.data || !importData.version) {
        return { success: false, message: '无效的存档文件格式' }
      }

      let slotId = targetSlotId
      if (!slotId) {
        const newSlot = createSlot(
          importData.slotName || `导入的存档 ${new Date().toLocaleString()}`,
          '📥',
          `导入于 ${new Date().toLocaleString()}`
        )
        slotId = newSlot.id
      }

      const targetSlot = saveSlots.value.find(s => s.id === slotId)
      if (!targetSlot) {
        return { success: false, message: '目标存档不存在' }
      }

      if (merge) {
        const existingData = JSON.parse(localStorage.getItem(getSlotStorageKey(slotId)) || '{}')
        const mergedData = { ...existingData, ...importData.data }
        localStorage.setItem(getSlotStorageKey(slotId), JSON.stringify(mergedData))
      } else {
        localStorage.setItem(getSlotStorageKey(slotId), JSON.stringify(importData.data))
      }

      targetSlot.updatedAt = Date.now()
      targetSlot.snapshot = getSlotSnapshot(importData.data)
      persistSlots()

      return { 
        success: true, 
        message: '导入成功', 
        slotId,
        categories: importData.categories 
      }
    } catch (e) {
      console.error('Failed to import slot data:', e)
      return { success: false, message: '导入失败：' + e.message }
    }
  }

  const downloadExport = (slotId, categories = null) => {
    const jsonData = exportSlotData(slotId, categories)
    if (!jsonData) return false

    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slot = saveSlots.value.find(s => s.id === slotId)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.href = url
    a.download = `mineral_save_${slot?.name || slotId}_${timestamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  }

  const triggerFileImport = (targetSlotId = null, merge = false) => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) {
          resolve({ success: false, message: '未选择文件' })
          return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = importSlotData(event.target.result, targetSlotId, merge)
          resolve(result)
        }
        reader.onerror = () => {
          resolve({ success: false, message: '文件读取失败' })
        }
        reader.readAsText(file)
      }
      input.click()
    })
  }

  const getSlotInfo = (slotId) => {
    const slot = saveSlots.value.find(s => s.id === slotId)
    if (!slot) return null

    try {
      const saved = localStorage.getItem(getSlotStorageKey(slotId))
      const data = saved ? JSON.parse(saved) : {}
      return {
        ...slot,
        snapshot: slot.snapshot || getSlotSnapshot(data),
        dataSize: saved ? new Blob([saved]).size : 0,
        categories: detectCategoriesInData(data)
      }
    } catch {
      return { ...slot, snapshot: null, dataSize: 0, categories: [] }
    }
  }

  const detectCategoriesInData = (data) => {
    const categories = []
    for (const category of Object.values(DATA_CATEGORY)) {
      const fields = getCategoryFields(category)
      const hasData = fields.some(field => data[field] !== undefined)
      if (hasData) categories.push(category)
    }
    return categories
  }

  const loadAllSlotInfos = () => {
    return saveSlots.value.map(slot => getSlotInfo(slot.id))
  }

  const migrateLegacySave = () => {
    const legacySaved = localStorage.getItem(STORAGE_KEY)
    if (!legacySaved) return false

    try {
      const legacyData = JSON.parse(legacySaved)
      localStorage.setItem(getSlotStorageKey('default'), JSON.stringify(legacyData))
      
      const defaultSlot = saveSlots.value.find(s => s.id === 'default')
      if (defaultSlot) {
        defaultSlot.snapshot = getSlotSnapshot(legacyData)
        defaultSlot.updatedAt = legacyData.savedAt || Date.now()
        persistSlots()
      }
      
      return true
    } catch (e) {
      console.error('Failed to migrate legacy save:', e)
      return false
    }
  }

  return {
    saveSlots,
    activeSlotId,
    slotCategoryBindings,
    DATA_CATEGORY,
    DATA_CATEGORY_CONFIG,
    collectedMinerals,
    currentCollage,
    collagePieces,
    collageStartTime,
    collageSnapshot,
    completedCollages,
    coins,
    totalCollages,
    showNewMineralModal,
    newMineral,
    isNewMineral,
    showFirstDiscoveryCelebration,
    firstDiscoveryMineral,
    firstDiscoveryRewards,
    newlyDiscoveredMinerals,
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
    rarityProgress,
    collectionMilestones,
    rarityMilestones,
    currentMilestone,
    currentRarityMilestones,
    collectionStageGoals,
    nextUncollectedByRarity,
    staminaPercentage,
    expeditionProgress,
    recentUnlock,
    highestRarityMineral,
    consecutiveCollageDays,
    canStartExpedition,
    hasCollageSnapshot,
    hasActiveCollage,
    collageProgress,
    lastCollageReward,
    isMineralCollected,
    collectMineral,
    startNewCollage,
    placePiece,
    updatePiecePosition,
    checkCollageComplete,
    closeNewMineralModal,
    closeFirstDiscoveryCelebration,
    isNewlyDiscovered,
    markAsViewed,
    resetCurrentCollage,
    restoreCollageSnapshot,
    clearCollageSnapshot,
    saveCollageDraft,
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
    SOURCE_TYPE,
    SOURCE_TYPE_CONFIG,
    getSourceConfig,
    getSourceTypeConfig,
    getCoinCategoryConfig,
    addCoinTransaction,
    getCoinTransactions,
    getCoinStats,
    getMineralCoinStats,
    closeRewardModal,
    cancelExpedition,
    getLocation,
    onTaskEvent,
    emitTaskEvent,
    createSlot,
    updateSlot,
    deleteSlot,
    saveToSlot,
    loadFromSlot,
    switchActiveSlot,
    bindCategoryToSlot,
    duplicateSlot,
    exportSlotData,
    importSlotData,
    downloadExport,
    triggerFileImport,
    getSlotInfo,
    loadAllSlotInfos,
    migrateLegacySave,
    initializeSlots
  }
})
