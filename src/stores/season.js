import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  SEASONS,
  PASS_TIERS,
  NPC_RANKING_DATA,
  SEASON_POINT_SOURCES,
  SEASON_STATUS,
  PASS_TYPE,
  getActiveSeason,
  getUpcomingSeason,
  getSeasonStatus
} from '@/data/season'
import { RARITY } from '@/data/rarity'
import { useGameStore } from './game'

const STORAGE_KEY = 'mineral_season_data'

export const useSeasonStore = defineStore('season', () => {
  const currentSeasonId = ref('')
  const seasonPoints = ref(0)
  const seasonExp = ref(0)
  const passLevel = ref(0)
  const isPremiumPass = ref(false)
  const freeClaimedTiers = ref([])
  const premiumClaimedTiers = ref([])
  const collectedSpecimens = ref([])
  const rankingList = ref([])
  const playerRank = ref(0)
  const seasonTitles = ref([])
  const lastSettlementSeason = ref('')
  const showSettlementModal = ref(false)
  const settlementResult = ref(null)
  const showSeasonStartModal = ref(false)
  const lastSeenSeasonStart = ref('')

  const activeSeason = computed(() => getActiveSeason())
  const upcomingSeason = computed(() => getUpcomingSeason())
  const currentSeason = computed(() => {
    if (currentSeasonId.value) {
      return SEASONS.find(s => s.id === currentSeasonId.value)
    }
    return activeSeason.value
  })
  const seasonStatus = computed(() => getSeasonStatus(currentSeason.value))

  const passTiers = computed(() => PASS_TIERS)

  const currentPassLevel = computed(() => passLevel.value)

  const nextTierExp = computed(() => {
    if (passLevel.value >= PASS_TIERS.length) return 0
    return PASS_TIERS[passLevel.value]?.expRequired || 0
  })

  const passProgress = computed(() => {
    const total = PASS_TIERS.length
    return {
      level: passLevel.value,
      total,
      percentage: Math.round((passLevel.value / total) * 100)
    }
  })

  const freeClaimableCount = computed(() => {
    let count = 0
    for (let i = 0; i < passLevel.value; i++) {
      if (!freeClaimedTiers.value.includes(i)) count++
    }
    return count
  })

  const premiumClaimableCount = computed(() => {
    if (!isPremiumPass.value) return 0
    let count = 0
    for (let i = 0; i < passLevel.value; i++) {
      if (!premiumClaimedTiers.value.includes(i)) count++
    }
    return count
  })

  const totalClaimableCount = computed(() => {
    return freeClaimableCount.value + premiumClaimableCount.value
  })

  const fullRanking = computed(() => {
    const npcList = NPC_RANKING_DATA.map(npc => {
      const score = Math.max(0, npc.baseScore + (Math.random() - 0.5) * npc.variance * 2)
      return {
        name: npc.name,
        avatar: npc.avatar,
        score: Math.round(score),
        isPlayer: false
      }
    })

    const playerEntry = {
      name: '你',
      avatar: '🧑‍🔬',
      score: seasonPoints.value,
      isPlayer: true
    }

    const combined = [...npcList, playerEntry]
    combined.sort((a, b) => b.score - a.score)

    const ranked = combined.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

    const pRank = ranked.find(e => e.isPlayer)?.rank || combined.length
    playerRank.value = pRank

    return ranked
  })

  const limitedSpecimens = computed(() => {
    if (!currentSeason.value) return []
    return currentSeason.value.limitedSpecimens || []
  })

  const collectedLimitedSpecimens = computed(() => {
    return limitedSpecimens.value.filter(s => collectedSpecimens.value.includes(s.id))
  })

  const seasonTimeRemaining = computed(() => {
    if (!currentSeason.value || seasonStatus.value !== SEASON_STATUS.ACTIVE) return null
    const end = new Date(currentSeason.value.endDate)
    const now = new Date()
    const diff = end - now
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { days, hours, minutes }
  })

  const addSeasonPoints = (source, count = 1) => {
    if (seasonStatus.value !== SEASON_STATUS.ACTIVE) return
    const config = SEASON_POINT_SOURCES[source]
    if (!config) return

    const points = config.points * count
    seasonPoints.value += points
    seasonExp.value += points

    while (passLevel.value < PASS_TIERS.length && seasonExp.value >= PASS_TIERS[passLevel.value].expRequired) {
      seasonExp.value -= PASS_TIERS[passLevel.value].expRequired
      passLevel.value++
    }

    saveSeasonData()
  }

  const claimFreeReward = (tierIndex) => {
    if (tierIndex >= passLevel.value) return false
    if (freeClaimedTiers.value.includes(tierIndex)) return false

    const tier = PASS_TIERS[tierIndex]
    if (!tier || !tier.freeReward) return false

    freeClaimedTiers.value.push(tierIndex)
    saveSeasonData()
    return tier.freeReward
  }

  const claimPremiumReward = (tierIndex) => {
    if (!isPremiumPass.value) return false
    if (tierIndex >= passLevel.value) return false
    if (premiumClaimedTiers.value.includes(tierIndex)) return false

    const tier = PASS_TIERS[tierIndex]
    if (!tier || !tier.premiumReward) return false

    premiumClaimedTiers.value.push(tierIndex)

    const specimenItem = tier.premiumReward.items.find(item => item.type === 'season_specimen')
    if (specimenItem && currentSeason.value) {
      const specimen = currentSeason.value.limitedSpecimens[specimenItem.value]
      if (specimen && !collectedSpecimens.value.includes(specimen.id)) {
        collectedSpecimens.value.push(specimen.id)
      }
    }

    saveSeasonData()
    return tier.premiumReward
  }

  const claimAllFree = () => {
    const rewards = []
    for (let i = 0; i < passLevel.value; i++) {
      if (!freeClaimedTiers.value.includes(i)) {
        const reward = claimFreeReward(i)
        if (reward) rewards.push({ tier: i, ...reward })
      }
    }
    return rewards
  }

  const claimAllPremium = () => {
    if (!isPremiumPass.value) return []
    const rewards = []
    for (let i = 0; i < passLevel.value; i++) {
      if (!premiumClaimedTiers.value.includes(i)) {
        const reward = claimPremiumReward(i)
        if (reward) rewards.push({ tier: i, ...reward })
      }
    }
    return rewards
  }

  const activatePremiumPass = () => {
    isPremiumPass.value = true
    saveSeasonData()
  }

  const calculateSettlementRewards = () => {
    if (!currentSeason.value) return null

    const rank = playerRank.value
    const rewards = currentSeason.value.rankingRewards.find(
      r => rank >= r.rankMin && rank <= r.rankMax
    )

    return {
      seasonName: currentSeason.value.name,
      seasonEmoji: currentSeason.value.emoji,
      rank,
      totalPoints: seasonPoints.value,
      passLevel: passLevel.value,
      rewards: rewards?.rewards || { coins: 0 },
      titles: rewards?.rewards?.title ? [rewards.rewards.title] : [],
      specimenIds: rewards?.rewards?.specimens || []
    }
  }

  const executeSettlement = () => {
    const result = calculateSettlementRewards()
    if (!result) return

    if (result.rewards.coins > 0) {
      const gameStore = useGameStore()
      gameStore.coins += result.rewards.coins
      gameStore.saveProgress()
    }

    if (result.titles.length > 0) {
      result.titles.forEach(t => {
        if (!seasonTitles.value.includes(t)) {
          seasonTitles.value.push(t)
        }
      })
    }

    if (result.specimenIds.length > 0 && currentSeason.value) {
      result.specimenIds.forEach(id => {
        const specimen = currentSeason.value.limitedSpecimens.find(s => s.id === id)
        if (specimen && !collectedSpecimens.value.includes(specimen.id)) {
          collectedSpecimens.value.push(specimen.id)
        }
      })
    }

    settlementResult.value = result
    showSettlementModal.value = true
    lastSettlementSeason.value = currentSeason.value.id

    resetSeasonProgress()
    saveSeasonData()
  }

  const closeSettlementModal = () => {
    showSettlementModal.value = false
    settlementResult.value = null
  }

  const checkSeasonTransition = () => {
    const active = getActiveSeason()
    if (active && active.id !== currentSeasonId.value) {
      if (currentSeasonId.value && seasonStatus.value === SEASON_STATUS.SETTLING) {
        executeSettlement()
      }

      currentSeasonId.value = active.id
      if (lastSeenSeasonStart.value !== active.id) {
        showSeasonStartModal.value = true
        lastSeenSeasonStart.value = active.id
      }

      resetSeasonProgress()
      saveSeasonData()
      return true
    }
    return false
  }

  const closeSeasonStartModal = () => {
    showSeasonStartModal.value = false
  }

  const resetSeasonProgress = () => {
    seasonPoints.value = 0
    seasonExp.value = 0
    passLevel.value = 0
    freeClaimedTiers.value = []
    premiumClaimedTiers.value = []
  }

  const onExpeditionComplete = () => addSeasonPoints('expedition_complete')
  const onMineralCollected = (mineral) => {
    addSeasonPoints('mineral_collect')
    if (mineral) {
      if (mineral.rarity === RARITY.RARE) addSeasonPoints('rare_mineral')
      else if (mineral.rarity === RARITY.EPIC) addSeasonPoints('epic_mineral')
      else if (mineral.rarity === RARITY.LEGENDARY) addSeasonPoints('legendary_mineral')
    }
  }
  const onCollageComplete = () => addSeasonPoints('collage_complete')
  const onDailyTaskComplete = () => addSeasonPoints('daily_task_complete')
  const onWeeklyGoalComplete = () => addSeasonPoints('weekly_goal_complete')
  const onMarketTransaction = () => addSeasonPoints('market_transaction')

  const saveSeasonData = () => {
    const data = {
      currentSeasonId: currentSeasonId.value,
      seasonPoints: seasonPoints.value,
      seasonExp: seasonExp.value,
      passLevel: passLevel.value,
      isPremiumPass: isPremiumPass.value,
      freeClaimedTiers: freeClaimedTiers.value,
      premiumClaimedTiers: premiumClaimedTiers.value,
      collectedSpecimens: collectedSpecimens.value,
      seasonTitles: seasonTitles.value,
      lastSettlementSeason: lastSettlementSeason.value,
      lastSeenSeasonStart: lastSeenSeasonStart.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadSeasonData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        currentSeasonId.value = data.currentSeasonId || ''
        seasonPoints.value = data.seasonPoints || 0
        seasonExp.value = data.seasonExp || 0
        passLevel.value = data.passLevel || 0
        isPremiumPass.value = data.isPremiumPass || false
        freeClaimedTiers.value = data.freeClaimedTiers || []
        premiumClaimedTiers.value = data.premiumClaimedTiers || []
        collectedSpecimens.value = data.collectedSpecimens || []
        seasonTitles.value = data.seasonTitles || []
        lastSettlementSeason.value = data.lastSettlementSeason || ''
        lastSeenSeasonStart.value = data.lastSeenSeasonStart || ''
      }

      if (!currentSeasonId.value && activeSeason.value) {
        currentSeasonId.value = activeSeason.value.id
      }

      checkSeasonTransition()
    } catch (e) {
      console.error('Failed to load season data:', e)
    }
  }

  const resetSeasonData = () => {
    currentSeasonId.value = ''
    seasonPoints.value = 0
    seasonExp.value = 0
    passLevel.value = 0
    isPremiumPass.value = false
    freeClaimedTiers.value = []
    premiumClaimedTiers.value = []
    collectedSpecimens.value = []
    seasonTitles.value = []
    lastSettlementSeason.value = ''
    showSettlementModal.value = false
    settlementResult.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    currentSeasonId,
    seasonPoints,
    seasonExp,
    passLevel,
    isPremiumPass,
    freeClaimedTiers,
    premiumClaimedTiers,
    collectedSpecimens,
    rankingList,
    playerRank,
    seasonTitles,
    showSettlementModal,
    settlementResult,
    showSeasonStartModal,
    activeSeason,
    upcomingSeason,
    currentSeason,
    seasonStatus,
    passTiers,
    currentPassLevel,
    nextTierExp,
    passProgress,
    freeClaimableCount,
    premiumClaimableCount,
    totalClaimableCount,
    fullRanking,
    limitedSpecimens,
    collectedLimitedSpecimens,
    seasonTimeRemaining,
    addSeasonPoints,
    claimFreeReward,
    claimPremiumReward,
    claimAllFree,
    claimAllPremium,
    activatePremiumPass,
    calculateSettlementRewards,
    executeSettlement,
    closeSettlementModal,
    checkSeasonTransition,
    closeSeasonStartModal,
    onExpeditionComplete,
    onMineralCollected,
    onCollageComplete,
    onDailyTaskComplete,
    onWeeklyGoalComplete,
    onMarketTransaction,
    saveSeasonData,
    loadSeasonData,
    resetSeasonData
  }
})
