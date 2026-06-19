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
import { useGachaStore } from './gacha'
import { TICKET_TYPES } from '@/data/gacha'

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
  const rewardNotifications = ref([])

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

  const pushRewardNotification = (type, label, value, emoji = '🎁') => {
    const id = Date.now() + Math.random()
    rewardNotifications.value.push({ id, type, label, value, emoji })
    setTimeout(() => {
      rewardNotifications.value = rewardNotifications.value.filter(n => n.id !== id)
    }, 2500)
  }

  const distributeReward = (reward) => {
    if (!reward) return []
    const gameStore = useGameStore()
    const gachaStore = useGachaStore()
    const distributed = []

    if (reward.coins && reward.coins > 0) {
      gameStore.coins += reward.coins
      distributed.push({ type: 'coins', label: '金币', value: reward.coins, emoji: '💰' })
      pushRewardNotification('coins', '金币', reward.coins, '💰')
    }

    if (reward.items && reward.items.length > 0) {
      for (const item of reward.items) {
        if (item.type === 'stamina' && item.value > 0) {
          gameStore.addStamina(item.value)
          distributed.push({ type: 'stamina', label: '体力', value: item.value, emoji: '⚡' })
          pushRewardNotification('stamina', '体力', item.value, '⚡')
        }
        if (item.type === 'gacha_ticket' && item.value > 0) {
          gachaStore.addTicket(TICKET_TYPES.ADVANCED, item.value)
          distributed.push({ type: 'gacha_ticket', label: '高级盲盒券', value: item.value, emoji: '🎫' })
          pushRewardNotification('gacha_ticket', '高级盲盒券', item.value, '🎫')
        }
        if (item.type === 'season_specimen' && currentSeason.value) {
          const specimen = currentSeason.value.limitedSpecimens[item.value]
          if (specimen) {
            const alreadyCollected = collectedSpecimens.value.includes(specimen.id)
            if (!alreadyCollected) {
              collectedSpecimens.value.push(specimen.id)
              if (!gameStore.isMineralCollected(specimen.id)) {
                gameStore.collectMineral(specimen, 'season', {
                  type: 'pass_reward',
                  seasonId: currentSeason.value.id,
                  seasonName: currentSeason.value.name,
                  tier: reward.tier
                })
              }
              distributed.push({ type: 'season_specimen', label: '限定标本', value: specimen.name, emoji: specimen.emoji })
              pushRewardNotification('season_specimen', '限定标本', specimen.name, specimen.emoji)
            } else {
              distributed.push({ type: 'season_specimen_duplicate', label: `${specimen.name}(重复)`, value: '已收集', emoji: specimen.emoji })
            }
          }
        }
      }
    }

    gameStore.saveProgress()
    gachaStore.saveProgress()
    saveSeasonData()
    return distributed
  }

  const claimFreeReward = (tierIndex) => {
    if (tierIndex >= passLevel.value) return false
    if (freeClaimedTiers.value.includes(tierIndex)) return false

    const tier = PASS_TIERS[tierIndex]
    if (!tier || !tier.freeReward) return false

    freeClaimedTiers.value.push(tierIndex)
    const distributed = distributeReward(tier.freeReward)
    saveSeasonData()
    return { reward: tier.freeReward, distributed }
  }

  const claimPremiumReward = (tierIndex) => {
    if (!isPremiumPass.value) return false
    if (tierIndex >= passLevel.value) return false
    if (premiumClaimedTiers.value.includes(tierIndex)) return false

    const tier = PASS_TIERS[tierIndex]
    if (!tier || !tier.premiumReward) return false

    premiumClaimedTiers.value.push(tierIndex)
    const distributed = distributeReward(tier.premiumReward)
    saveSeasonData()
    return { reward: tier.premiumReward, distributed }
  }

  const claimAllFree = () => {
    const rewards = []
    for (let i = 0; i < passLevel.value; i++) {
      if (!freeClaimedTiers.value.includes(i)) {
        const result = claimFreeReward(i)
        if (result) rewards.push({ tier: i, ...result })
      }
    }
    return rewards
  }

  const claimAllPremium = () => {
    if (!isPremiumPass.value) return []
    const rewards = []
    for (let i = 0; i < passLevel.value; i++) {
      if (!premiumClaimedTiers.value.includes(i)) {
        const result = claimPremiumReward(i)
        if (result) rewards.push({ tier: i, ...result })
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
      pushRewardNotification('coins', '赛季结算金币', result.rewards.coins, '💰')
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
      const gameStore = useGameStore()
      result.specimenIds.forEach(id => {
        const specimen = currentSeason.value.limitedSpecimens.find(s => s.id === id)
        if (specimen) {
          if (!collectedSpecimens.value.includes(specimen.id)) {
            collectedSpecimens.value.push(specimen.id)
          }
          if (!gameStore.isMineralCollected(specimen.id)) {
            gameStore.collectMineral(specimen, 'season', {
              type: 'ranking_reward',
              seasonId: currentSeason.value.id,
              seasonName: currentSeason.value.name,
              rank: result.finalRank,
              rankRange: result.rankRange
            })
          }
          pushRewardNotification('season_specimen', '赛季限定标本', specimen.name, specimen.emoji)
        }
      })
      gameStore.saveProgress()
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

      if (collectedSpecimens.value.length > 0) {
        const gameStore = useGameStore()
        collectedSpecimens.value.forEach(specimenId => {
          let specimen = null
          let seasonInfo = null
          for (const season of SEASONS) {
            const found = season.limitedSpecimens?.find(s => s.id === specimenId)
            if (found) {
              specimen = found
              seasonInfo = { id: season.id, name: season.name }
              break
            }
          }
          if (specimen && !gameStore.isMineralCollected(specimen.id)) {
            gameStore.collectMineral(specimen, 'season', {
              type: 'data_migration',
              seasonId: seasonInfo?.id,
              seasonName: seasonInfo?.name
            })
          }
        })
        gameStore.saveProgress()
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
    rewardNotifications,
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
    pushRewardNotification,
    distributeReward,
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
