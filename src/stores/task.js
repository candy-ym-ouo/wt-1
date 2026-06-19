import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DAILY_TASKS, WEEKLY_GOALS, ACHIEVEMENTS, ACHIEVEMENT_TIERS } from '@/data/tasks'
import { RARITY } from '@/data/rarity'
import { useGameStore } from './game'

const STORAGE_KEY = 'mineral_task_center_data'

const DEFAULT_DAILY_STATS = {
  expeditionsToday: 0,
  mineralsCollectedToday: 0,
  collagesToday: 0,
  bidsToday: 0,
  staminaSpentToday: 0
}

const DEFAULT_WEEKLY_STATS = {
  expeditionsThisWeek: 0,
  mineralsCollectedThisWeek: 0,
  collagesThisWeek: 0,
  coinsEarnedThisWeek: 0,
  rareMineralsThisWeek: 0,
  marketTransactionsThisWeek: 0
}

const getDayKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getWeekKey = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  return getDayKey(monday)
}

export const useTaskStore = defineStore('task', () => {
  const gameStore = useGameStore()

  const dailyProgress = ref({})
  const weeklyProgress = ref({})
  const dailyClaimed = ref({})
  const weeklyClaimed = ref({})
  const achievementClaimed = ref({})
  const lastDailyReset = ref('')
  const lastWeeklyReset = ref('')
  const dailyStats = ref({})
  const weeklyStats = ref({})
  const totalCoinsEarned = ref(0)
  const totalExpeditions = ref(0)
  const totalMarketTransactions = ref(0)
  const claimAnimation = ref(null)

  const todayKey = computed(() => getDayKey())
  const currentWeekKey = computed(() => getWeekKey())

  const dailyTasks = computed(() => {
    return DAILY_TASKS.map(task => {
      const progress = dailyProgress.value[task.id] || 0
      const isComplete = progress >= task.target
      const isClaimed = dailyClaimed.value[task.id] || false
      return {
        ...task,
        progress,
        isComplete,
        isClaimed,
        canClaim: isComplete && !isClaimed
      }
    })
  })

  const weeklyGoals = computed(() => {
    return WEEKLY_GOALS.map(task => {
      const progress = weeklyProgress.value[task.id] || 0
      const isComplete = progress >= task.target
      const isClaimed = weeklyClaimed.value[task.id] || false
      return {
        ...task,
        progress,
        isComplete,
        isClaimed,
        canClaim: isComplete && !isClaimed
      }
    })
  })

  const achievements = computed(() => {
    const stats = getAchievementStats()
    return ACHIEVEMENTS.map(ach => {
      const currentValue = ach.getValue(stats)
      let currentTierIndex = -1
      for (let i = ach.tiers.length - 1; i >= 0; i--) {
        if (currentValue >= ach.tiers[i].target) {
          currentTierIndex = i
          break
        }
      }

      const nextTierIndex = currentTierIndex + 1
      const nextTier = nextTierIndex < ach.tiers.length ? ach.tiers[nextTierIndex] : null
      const currentTier = currentTierIndex >= 0 ? ach.tiers[currentTierIndex] : null
      const claimedTiers = achievementClaimed.value[ach.id] || []

      return {
        ...ach,
        currentValue,
        currentTier,
        currentTierIndex,
        nextTier,
        nextTierIndex,
        isMaxed: currentTierIndex >= ach.tiers.length - 1,
        canClaim: currentTierIndex >= 0 && !claimedTiers.includes(currentTierIndex),
        claimedTiers,
        progressPercent: nextTier
          ? Math.min(100, Math.round((currentValue / nextTier.target) * 100))
          : 100
      }
    })
  })

  const dailyCompletionRate = computed(() => {
    const total = dailyTasks.value.length
    const completed = dailyTasks.value.filter(t => t.isClaimed).length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  })

  const weeklyCompletionRate = computed(() => {
    const total = weeklyGoals.value.length
    const completed = weeklyGoals.value.filter(t => t.isClaimed).length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  })

  const totalAchievementCount = computed(() => {
    let total = 0
    let claimed = 0
    achievements.value.forEach(ach => {
      total += ach.tiers.length
      claimed += ach.claimedTiers.length
    })
    return { total, claimed }
  })

  const claimableCount = computed(() => {
    let count = 0
    dailyTasks.value.forEach(t => { if (t.canClaim) count++ })
    weeklyGoals.value.forEach(t => { if (t.canClaim) count++ })
    achievements.value.forEach(a => { if (a.canClaim) count++ })
    return count
  })

  const getAchievementStats = () => {
    const collected = gameStore.collectedMinerals
    const rareOrBetter = collected.filter(m =>
      m.rarity === RARITY.RARE || m.rarity === RARITY.EPIC || m.rarity === RARITY.LEGENDARY
    )
    const legendary = collected.filter(m => m.rarity === RARITY.LEGENDARY)

    return {
      uniqueMinerals: collected.length,
      totalExpeditions: totalExpeditions.value,
      totalCollages: gameStore.totalCollages,
      totalCoinsEarned: totalCoinsEarned.value,
      rareOrBetterMinerals: rareOrBetter.length,
      legendaryMinerals: legendary.length,
      totalMarketTransactions: totalMarketTransactions.value,
      expeditionLevel: gameStore.expeditionLevel
    }
  }

  const checkDailyReset = () => {
    const today = todayKey.value
    if (lastDailyReset.value !== today) {
      dailyProgress.value = {}
      dailyClaimed.value = {}
      dailyStats.value = { ...DEFAULT_DAILY_STATS }
      lastDailyReset.value = today
      saveTaskData()
      return true
    }
    return false
  }

  const checkWeeklyReset = () => {
    const week = currentWeekKey.value
    if (lastWeeklyReset.value !== week) {
      weeklyProgress.value = {}
      weeklyClaimed.value = {}
      weeklyStats.value = { ...DEFAULT_WEEKLY_STATS }
      lastWeeklyReset.value = week
      saveTaskData()
      return true
    }
    return false
  }

  const updateDailyProgress = (taskId, value) => {
    checkDailyReset()
    dailyProgress.value[taskId] = value
    saveTaskData()
  }

  const updateWeeklyProgress = (taskId, value) => {
    checkWeeklyReset()
    weeklyProgress.value[taskId] = value
    saveTaskData()
  }

  const incrementDailyStat = (stat, amount = 1) => {
    checkDailyReset()
    if (!dailyStats.value[stat]) dailyStats.value[stat] = 0
    dailyStats.value[stat] += amount
    recalculateDailyProgress()
    saveTaskData()
  }

  const incrementWeeklyStat = (stat, amount = 1) => {
    checkWeeklyReset()
    if (!weeklyStats.value[stat]) weeklyStats.value[stat] = 0
    weeklyStats.value[stat] += amount
    recalculateWeeklyProgress()
    saveTaskData()
  }

  const recalculateDailyProgress = () => {
    const stats = dailyStats.value
    DAILY_TASKS.forEach(task => {
      let value = 0
      if (task.id === 'daily_expedition_1' || task.id === 'daily_expedition_3') {
        value = stats.expeditionsToday || 0
      } else if (task.id === 'daily_collect_mineral') {
        value = stats.mineralsCollectedToday || 0
      } else if (task.id === 'daily_collage') {
        value = stats.collagesToday || 0
      } else if (task.id === 'daily_market_bid') {
        value = stats.bidsToday || 0
      } else if (task.id === 'daily_spend_stamina') {
        value = stats.staminaSpentToday || 0
      }
      dailyProgress.value[task.id] = Math.min(value, task.target)
    })
  }

  const recalculateWeeklyProgress = () => {
    const stats = weeklyStats.value
    WEEKLY_GOALS.forEach(task => {
      let value = 0
      if (task.id === 'weekly_expedition_10') {
        value = stats.expeditionsThisWeek || 0
      } else if (task.id === 'weekly_collect_5') {
        value = stats.mineralsCollectedThisWeek || 0
      } else if (task.id === 'weekly_collage_5') {
        value = stats.collagesThisWeek || 0
      } else if (task.id === 'weekly_earn_coins') {
        value = stats.coinsEarnedThisWeek || 0
      } else if (task.id === 'weekly_rare_mineral') {
        value = stats.rareMineralsThisWeek || 0
      } else if (task.id === 'weekly_market_3') {
        value = stats.marketTransactionsThisWeek || 0
      }
      weeklyProgress.value[task.id] = Math.min(value, task.target)
    })
  }

  const claimDailyReward = (taskId) => {
    const task = dailyTasks.value.find(t => t.id === taskId)
    if (!task || !task.canClaim) return false

    gameStore.coins += task.rewards.coins
    gameStore.addExp(task.rewards.exp)
    totalCoinsEarned.value += task.rewards.coins
    dailyClaimed.value[taskId] = true
    claimAnimation.value = { type: 'daily', id: taskId, rewards: task.rewards }
    
    gameStore.addCoinTransaction('task_reward', task.rewards.coins, `每日任务: ${task.title}`, {
      taskId,
      taskTitle: task.title,
      taskType: 'daily',
      rewards: task.rewards
    })

    setTimeout(() => { claimAnimation.value = null }, 2000)
    saveTaskData()
    gameStore.saveProgress()
    return true
  }

  const claimWeeklyReward = (taskId) => {
    const task = weeklyGoals.value.find(t => t.id === taskId)
    if (!task || !task.canClaim) return false

    gameStore.coins += task.rewards.coins
    gameStore.addExp(task.rewards.exp)
    totalCoinsEarned.value += task.rewards.coins
    weeklyClaimed.value[taskId] = true
    claimAnimation.value = { type: 'weekly', id: taskId, rewards: task.rewards }
    
    gameStore.addCoinTransaction('task_reward', task.rewards.coins, `每周目标: ${task.title}`, {
      taskId,
      taskTitle: task.title,
      taskType: 'weekly',
      rewards: task.rewards
    })

    setTimeout(() => { claimAnimation.value = null }, 2000)
    saveTaskData()
    gameStore.saveProgress()
    return true
  }

  const claimAchievementReward = (achievementId, tierIndex) => {
    const ach = achievements.value.find(a => a.id === achievementId)
    if (!ach) return false

    const tier = ach.tiers[tierIndex]
    if (!tier) return false

    if (!achievementClaimed.value[achievementId]) {
      achievementClaimed.value[achievementId] = []
    }
    if (achievementClaimed.value[achievementId].includes(tierIndex)) return false
    if (ach.currentValue < tier.target) return false

    gameStore.coins += tier.rewards.coins
    totalCoinsEarned.value += tier.rewards.coins
    achievementClaimed.value[achievementId].push(tierIndex)
    claimAnimation.value = { type: 'achievement', id: achievementId, tierIndex, rewards: tier.rewards }
    
    gameStore.addCoinTransaction('achievement_reward', tier.rewards.coins, `成就达成: ${ach.title} ${tier.tier.name}`, {
      achievementId,
      achievementTitle: ach.title,
      tierIndex,
      tierName: tier.tier.name,
      rewards: tier.rewards
    })

    setTimeout(() => { claimAnimation.value = null }, 2000)
    saveTaskData()
    gameStore.saveProgress()
    return true
  }

  const claimAllDaily = () => {
    let claimed = 0
    dailyTasks.value.forEach(task => {
      if (task.canClaim && claimDailyReward(task.id)) claimed++
    })
    return claimed
  }

  const claimAllWeekly = () => {
    let claimed = 0
    weeklyGoals.value.forEach(task => {
      if (task.canClaim && claimWeeklyReward(task.id)) claimed++
    })
    return claimed
  }

  const onExpeditionComplete = (coinsEarned) => {
    incrementDailyStat('expeditionsToday')
    incrementWeeklyStat('expeditionsThisWeek')
    incrementWeeklyStat('coinsEarnedThisWeek', coinsEarned)
    totalExpeditions.value++
    totalCoinsEarned.value += coinsEarned
    saveTaskData()
  }

  const onStaminaSpent = (amount) => {
    incrementDailyStat('staminaSpentToday', amount)
  }

  const onMineralCollected = (mineral) => {
    incrementDailyStat('mineralsCollectedToday')
    incrementWeeklyStat('mineralsCollectedThisWeek')
    if (mineral && (mineral.rarity === RARITY.RARE || mineral.rarity === RARITY.EPIC || mineral.rarity === RARITY.LEGENDARY)) {
      incrementWeeklyStat('rareMineralsThisWeek')
    }
    saveTaskData()
  }

  const onCollageComplete = () => {
    incrementDailyStat('collagesToday')
    incrementWeeklyStat('collagesThisWeek')
    saveTaskData()
  }

  const onMarketBid = () => {
    incrementDailyStat('bidsToday')
    saveTaskData()
  }

  const onMarketTransaction = (coinsEarned) => {
    incrementWeeklyStat('marketTransactionsThisWeek')
    incrementWeeklyStat('coinsEarnedThisWeek', coinsEarned)
    totalMarketTransactions.value++
    totalCoinsEarned.value += coinsEarned
    saveTaskData()
  }

  const onCoinsEarned = (amount) => {
    incrementWeeklyStat('coinsEarnedThisWeek', amount)
    totalCoinsEarned.value += amount
    saveTaskData()
  }

  const saveTaskData = () => {
    const data = {
      dailyProgress: dailyProgress.value,
      weeklyProgress: weeklyProgress.value,
      dailyClaimed: dailyClaimed.value,
      weeklyClaimed: weeklyClaimed.value,
      achievementClaimed: achievementClaimed.value,
      lastDailyReset: lastDailyReset.value,
      lastWeeklyReset: lastWeeklyReset.value,
      dailyStats: dailyStats.value,
      weeklyStats: weeklyStats.value,
      totalCoinsEarned: totalCoinsEarned.value,
      totalExpeditions: totalExpeditions.value,
      totalMarketTransactions: totalMarketTransactions.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadTaskData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        dailyProgress.value = data.dailyProgress || {}
        weeklyProgress.value = data.weeklyProgress || {}
        dailyClaimed.value = data.dailyClaimed || {}
        weeklyClaimed.value = data.weeklyClaimed || {}
        achievementClaimed.value = data.achievementClaimed || {}
        lastDailyReset.value = data.lastDailyReset || ''
        lastWeeklyReset.value = data.lastWeeklyReset || ''
        dailyStats.value = { ...DEFAULT_DAILY_STATS, ...(data.dailyStats || {}) }
        weeklyStats.value = { ...DEFAULT_WEEKLY_STATS, ...(data.weeklyStats || {}) }
        totalCoinsEarned.value = data.totalCoinsEarned || 0
        totalExpeditions.value = data.totalExpeditions || 0
        totalMarketTransactions.value = data.totalMarketTransactions || 0
      }
      const dailyReset = checkDailyReset()
      const weeklyReset = checkWeeklyReset()
      if (!dailyReset) recalculateDailyProgress()
      if (!weeklyReset) recalculateWeeklyProgress()
    } catch (e) {
      console.error('Failed to load task data:', e)
    }
  }

  const resetTaskData = () => {
    dailyProgress.value = {}
    weeklyProgress.value = {}
    dailyClaimed.value = {}
    weeklyClaimed.value = {}
    achievementClaimed.value = {}
    dailyStats.value = { ...DEFAULT_DAILY_STATS }
    weeklyStats.value = { ...DEFAULT_WEEKLY_STATS }
    totalCoinsEarned.value = 0
    totalExpeditions.value = 0
    totalMarketTransactions.value = 0
    lastDailyReset.value = ''
    lastWeeklyReset.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  const checkResets = () => {
    const dailyReset = checkDailyReset()
    const weeklyReset = checkWeeklyReset()
    if (dailyReset) recalculateDailyProgress()
    if (weeklyReset) recalculateWeeklyProgress()
    return dailyReset || weeklyReset
  }

  return {
    dailyProgress,
    weeklyProgress,
    dailyClaimed,
    weeklyClaimed,
    achievementClaimed,
    lastDailyReset,
    lastWeeklyReset,
    dailyStats,
    weeklyStats,
    totalCoinsEarned,
    totalExpeditions,
    totalMarketTransactions,
    claimAnimation,
    todayKey,
    currentWeekKey,
    dailyTasks,
    weeklyGoals,
    achievements,
    dailyCompletionRate,
    weeklyCompletionRate,
    totalAchievementCount,
    claimableCount,
    updateDailyProgress,
    updateWeeklyProgress,
    incrementDailyStat,
    incrementWeeklyStat,
    claimDailyReward,
    claimWeeklyReward,
    claimAchievementReward,
    claimAllDaily,
    claimAllWeekly,
    onExpeditionComplete,
    onStaminaSpent,
    onMineralCollected,
    onCollageComplete,
    onMarketBid,
    onMarketTransaction,
    onCoinsEarned,
    saveTaskData,
    loadTaskData,
    resetTaskData,
    checkResets,
    getAchievementStats
  }
})
