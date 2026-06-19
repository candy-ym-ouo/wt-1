import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './game'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import { getMineralById } from '@/data/minerals'
import {
  AUCTION_PHASE,
  BID_INCREMENT_PERCENTAGE,
  PREVIEW_DURATION,
  RESULT_DURATION,
  CLOSING_WARNING_DURATION,
  NPC_BIDDERS,
  generateAuctionRounds,
  pickRandomMessage,
  formatMessage,
  getNPCMaxBidRatio,
  COMBO_CONFIG,
  TIME_BONUS_CONFIG,
  SESSION_RATING_CONFIG,
  SESSION_SCORE_WEIGHTS
} from '@/data/auction'

const STORAGE_KEY = 'mineral_auction_data'

export const useAuctionStore = defineStore('auction', () => {
  const gameStore = useGameStore()

  const phase = ref(AUCTION_PHASE.IDLE)
  const currentRoundIndex = ref(-1)
  const rounds = ref([])
  const bids = ref([])
  const currentBid = ref(0)
  const currentBidder = ref(null)
  const roundEndTime = ref(0)
  const timeRemaining = ref(0)
  const auctioneerMessage = ref('')
  const isClosingWarning = ref(false)
  const competitionTips = ref([])
  const auctionHistory = ref([])
  const activeNPCs = ref([])
  const totalAuctions = ref(0)
  const totalWins = ref(0)
  const totalSpent = ref(0)
  const showResultModal = ref(false)
  const lastResult = ref(null)
  const countdownTimer = ref(null)
  const npcBidTimer = ref(null)

  const comboCount = ref(0)
  const maxCombo = ref(0)
  const lastPlayerBidPhase = ref(null)
  const sessionTimeBonuses = ref(0)
  const sessionScore = ref(0)
  const sessionRating = ref(null)
  const sessionRatingRevealed = ref(false)
  const sessionWinsInSession = ref(0)
  const sessionTotalRounds = ref(0)
  const sessionWonRarities = ref([])
  const bestRating = ref('D')
  const totalCombos = ref(0)
  const totalTimeBonuses = ref(0)

  const currentRound = computed(() => {
    if (currentRoundIndex.value < 0 || currentRoundIndex.value >= rounds.value.length) {
      return null
    }
    return rounds.value[currentRoundIndex.value]
  })

  const currentMineral = computed(() => {
    return currentRound.value?.mineral || null
  })

  const progress = computed(() => {
    if (rounds.value.length === 0) return { current: 0, total: 0, percentage: 0 }
    return {
      current: currentRoundIndex.value + 1,
      total: rounds.value.length,
      percentage: Math.round(((currentRoundIndex.value + 1) / rounds.value.length) * 100)
    }
  })

  const playerLeading = computed(() => {
    return currentBidder.value?.id === 'player'
  })

  const minBidIncrement = computed(() => {
    return Math.max(10, Math.round(currentBid.value * BID_INCREMENT_PERCENTAGE / 100))
  })

  const nextMinBid = computed(() => {
    return currentBid.value + minBidIncrement.value
  })

  const sortedBids = computed(() => {
    return [...bids.value].sort((a, b) => b.amount - a.amount)
  })

  const canPlayerBid = computed(() => {
    if (phase.value !== AUCTION_PHASE.BIDDING && phase.value !== AUCTION_PHASE.CLOSING) return false
    if (!currentRound.value) return false
    if (currentBidder.value?.id === 'player') return false
    return gameStore.coins >= nextMinBid.value
  })

  const playerBidHistory = computed(() => {
    return auctionHistory.value.filter(h => h.winnerId === 'player')
  })

  const comboMultiplier = computed(() => {
    if (comboCount.value <= 1) return COMBO_CONFIG.BASE_MULTIPLIER
    const mult = COMBO_CONFIG.BASE_MULTIPLIER + (comboCount.value - 1) * COMBO_CONFIG.PER_COMBO
    return Math.min(mult, COMBO_CONFIG.MAX_MULTIPLIER)
  })

  const comboLabel = computed(() => {
    const key = Math.min(comboCount.value, 6)
    return COMBO_CONFIG.LABELS[key] || (comboCount.value >= 6 ? `超神连击 x${comboCount.value}！！！` : '')
  })

  const lastBidTimeBonus = computed(() => {
    if (!lastPlayerBidPhase.value) return null
    return lastPlayerBidPhase.value
  })

  const sessionRatingConfig = computed(() => {
    if (!sessionRating.value) return SESSION_RATING_CONFIG.D
    return SESSION_RATING_CONFIG[sessionRating.value] || SESSION_RATING_CONFIG.D
  })

  const calculateSessionScore = () => {
    const total = sessionTotalRounds.value || 1
    const wins = sessionWinsInSession.value

    const winRate = wins / total
    const winRateScore = Math.min(1, winRate) * SESSION_SCORE_WEIGHTS.WIN_RATE

    const comboScore = Math.min(1, maxCombo.value / 5) * SESSION_SCORE_WEIGHTS.COMBO_MAX

    const avgSpentPerWin = wins > 0 ? (totalSpent.value - (sessionScore.value > 0 ? 0 : 0)) / wins : 0
    const avgBasePrice = sessionWonRarities.value.length > 0
      ? sessionWonRarities.value.reduce((sum, r) => sum + RARITY_CONFIG[r].basePrice, 0) / sessionWonRarities.value.length
      : 0
    const efficiency = avgBasePrice > 0 ? Math.max(0, 1 - (avgSpentPerWin / (avgBasePrice * 3) - 0.3)) : 0
    const efficiencyScore = Math.min(1, Math.max(0, efficiency)) * SESSION_SCORE_WEIGHTS.SPENDING_EFFICIENCY

    const timeBonusScore = Math.min(1, sessionTimeBonuses.value / 3) * SESSION_SCORE_WEIGHTS.TIME_BONUS_COUNT

    const uniqueRarities = new Set(sessionWonRarities.value).size
    const diversityScore = Math.min(1, uniqueRarities / 4) * SESSION_SCORE_WEIGHTS.RARITY_DIVERSITY

    const raw = winRateScore + comboScore + efficiencyScore + timeBonusScore + diversityScore
    return Math.round(raw)
  }

  const computeSessionRating = (score) => {
    if (score >= SESSION_RATING_CONFIG.S.minScore) return 'S'
    if (score >= SESSION_RATING_CONFIG.A.minScore) return 'A'
    if (score >= SESSION_RATING_CONFIG.B.minScore) return 'B'
    if (score >= SESSION_RATING_CONFIG.C.minScore) return 'C'
    return 'D'
  }

  const selectActiveNPCs = () => {
    const shuffled = [...NPC_BIDDERS].sort(() => Math.random() - 0.5)
    const count = 3 + Math.floor(Math.random() * 3)
    return shuffled.slice(0, count)
  }

  const addCompetitionTip = (tip, type = 'info') => {
    const tipEntry = {
      id: Date.now() + Math.random(),
      text: tip,
      type,
      timestamp: Date.now()
    }
    competitionTips.value.unshift(tipEntry)
    if (competitionTips.value.length > 8) {
      competitionTips.value = competitionTips.value.slice(0, 8)
    }
  }

  const setAuctioneerMessage = (category, vars = {}) => {
    const template = pickRandomMessage(category)
    auctioneerMessage.value = formatMessage(template, vars)
  }

  const startNewAuctionSession = (roundCount = 6) => {
    stopTimers()

    rounds.value = generateAuctionRounds(roundCount)
    currentRoundIndex.value = -1
    bids.value = []
    currentBid.value = 0
    currentBidder.value = null
    competitionTips.value = []
    activeNPCs.value = selectActiveNPCs()
    phase.value = AUCTION_PHASE.IDLE
    totalAuctions.value++

    comboCount.value = 0
    maxCombo.value = 0
    lastPlayerBidPhase.value = null
    sessionTimeBonuses.value = 0
    sessionScore.value = 0
    sessionRating.value = null
    sessionRatingRevealed.value = false
    sessionWinsInSession.value = 0
    sessionTotalRounds.value = roundCount
    sessionWonRarities.value = []

    setAuctioneerMessage('welcome')
    addCompetitionTip('🎪 拍卖会即将开始，请做好准备！', 'success')

    saveAuctionData()
    return true
  }

  const startNextRound = () => {
    if (currentRoundIndex.value + 1 >= rounds.value.length) {
      finishAuctionSession()
      return false
    }

    currentRoundIndex.value++
    const round = rounds.value[currentRoundIndex.value]

    bids.value = []
    currentBid.value = round.startPrice
    currentBidder.value = null
    isClosingWarning.value = false
    lastPlayerBidPhase.value = null
    phase.value = AUCTION_PHASE.PREVIEW

    setAuctioneerMessage('introduce', {
      name: round.mineral.name,
      rarity: RARITY_CONFIG[round.mineral.rarity].name
    })
    addCompetitionTip(
      `📦 第 ${round.roundNumber} 轮：${round.mineral.emoji} ${round.mineral.name} (${RARITY_CONFIG[round.mineral.rarity].name})`,
      round.mineral.rarity === RARITY.LEGENDARY ? 'legendary' : round.mineral.rarity
    )

    setTimeout(() => {
      if (phase.value === AUCTION_PHASE.PREVIEW) {
        startBiddingPhase()
      }
    }, PREVIEW_DURATION)

    saveAuctionData()
    return true
  }

  const startBiddingPhase = () => {
    const round = currentRound.value
    if (!round) return

    phase.value = AUCTION_PHASE.BIDDING
    roundEndTime.value = Date.now() + round.duration
    timeRemaining.value = round.duration

    setAuctioneerMessage('startBid', { price: currentBid.value.toLocaleString() })
    addCompetitionTip(`💰 起拍价 ${currentBid.value.toLocaleString()} 金币，竞价开始！`, 'info')

    startCountdown()
    startNPCBidding()
  }

  const startCountdown = () => {
    stopCountdown()
    countdownTimer.value = setInterval(() => {
      const remaining = Math.max(0, roundEndTime.value - Date.now())
      timeRemaining.value = remaining

      if (remaining <= CLOSING_WARNING_DURATION && !isClosingWarning.value && phase.value === AUCTION_PHASE.BIDDING) {
        isClosingWarning.value = true
        phase.value = AUCTION_PHASE.CLOSING
        setAuctioneerMessage('warning')
        addCompetitionTip('⚠️ 最后5秒！即将落槌！', 'warning')
      }

      if (remaining <= 0) {
        stopCountdown()
        finalizeRound()
      }
    }, 100)
  }

  const stopCountdown = () => {
    if (countdownTimer.value) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
  }

  const startNPCBidding = () => {
    stopNPCBidding()
    npcBidTimer.value = setInterval(() => {
      tryNPCBid()
    }, 800 + Math.random() * 500)
  }

  const stopNPCBidding = () => {
    if (npcBidTimer.value) {
      clearInterval(npcBidTimer.value)
      npcBidTimer.value = null
    }
  }

  const tryNPCBid = () => {
    if (phase.value !== AUCTION_PHASE.BIDDING && phase.value !== AUCTION_PHASE.CLOSING) return
    if (!currentRound.value) return

    const availableNPCs = activeNPCs.value.filter(npc => {
      if (currentBidder.value?.id === npc.id) return false
      const maxBid = getMaxBidForNPC(npc)
      return maxBid > currentBid.value
    })

    if (availableNPCs.length === 0) return

    const timeFactor = timeRemaining.value / currentRound.value.duration
    const urgencyBoost = timeFactor < 0.3 ? 1.5 : timeFactor < 0.6 ? 1.2 : 1

    for (const npc of availableNPCs) {
      const baseChance = npc.aggressiveness * 0.25 * urgencyBoost
      if (Math.random() < baseChance) {
        placeNPCBid(npc)
        return
      }
    }

    if (phase.value === AUCTION_PHASE.CLOSING && Math.random() < 0.3) {
      const eagerNPC = availableNPCs[Math.floor(Math.random() * availableNPCs.length)]
      if (eagerNPC) placeNPCBid(eagerNPC)
    }
  }

  const getMaxBidForNPC = (npc) => {
    const round = currentRound.value
    if (!round) return 0
    const maxRatio = getNPCMaxBidRatio(npc, round.mineral.rarity)
    return Math.round(round.startPrice * maxRatio)
  }

  const placeNPCBid = (npc) => {
    const maxBid = getMaxBidForNPC(npc)
    if (maxBid <= currentBid.value) return

    const minIncrement = Math.max(10, Math.round(currentBid.value * 0.05))
    const availableRange = maxBid - currentBid.value - minIncrement

    if (availableRange <= 0) return

    const aggressive = npc.aggressiveness > 0.6 && phase.value === AUCTION_PHASE.CLOSING
    const extraBoost = aggressive ? Math.min(availableRange * 0.3, 200) : 0
    const increment = minIncrement + Math.round(Math.random() * Math.min(availableRange * 0.4, 300)) + extraBoost
    const bidAmount = Math.min(maxBid, currentBid.value + increment)

    registerBid({
      id: npc.id,
      name: npc.name,
      avatar: npc.avatar,
      isPlayer: false
    }, bidAmount)
  }

  const placePlayerBid = (amount) => {
    if (!canPlayerBid.value) {
      return { success: false, message: '无法出价' }
    }

    if (currentBidder.value?.id === 'player') {
      return { success: false, message: '你已经是最高出价者' }
    }

    if (amount < nextMinBid.value) {
      return { success: false, message: `出价至少需要 ${nextMinBid.value.toLocaleString()} 金币` }
    }

    if (gameStore.coins < amount) {
      return { success: false, message: '金币不足' }
    }

    registerBid({
      id: 'player',
      name: '我',
      avatar: '👤',
      isPlayer: true
    }, amount)

    return { success: true, message: '出价成功！' }
  }

  const placeQuickPlayerBid = (percentage) => {
    const quickAmount = Math.round(currentBid.value * (1 + percentage))
    const finalAmount = Math.max(quickAmount, nextMinBid.value)
    return placePlayerBid(finalAmount)
  }

  const registerBid = (bidder, amount) => {
    const bidEntry = {
      bidderId: bidder.id,
      bidderName: bidder.name,
      bidderAvatar: bidder.avatar,
      isPlayer: bidder.isPlayer,
      amount,
      timestamp: Date.now()
    }

    bids.value.push(bidEntry)
    currentBid.value = amount
    currentBidder.value = bidder

    if (bidder.isPlayer) {
      const remaining = timeRemaining.value
      if (phase.value === AUCTION_PHASE.CLOSING) {
        if (remaining <= TIME_BONUS_CONFIG.LAST_SECOND_WINDOW_MS) {
          lastPlayerBidPhase.value = 'lastSecond'
          sessionTimeBonuses.value++
          addCompetitionTip(`⚡ 绝杀出价！限时加成触发！`, 'legendary')
        } else {
          lastPlayerBidPhase.value = 'sniper'
          sessionTimeBonuses.value++
          addCompetitionTip(`🎯 限时狙击！最后时刻出价！`, 'epic')
        }
      } else {
        lastPlayerBidPhase.value = null
      }
    }

    if (!bidder.isPlayer && bids.value.length > 2 && Math.random() < 0.25) {
      setTimeout(() => {
        if (phase.value === AUCTION_PHASE.BIDDING || phase.value === AUCTION_PHASE.CLOSING) {
          setAuctioneerMessage('competition')
        }
      }, 300)
    }

    if (bidder.isPlayer) {
      let tipText = `✅ 你出价 ${amount.toLocaleString()} 金币！`
      if (lastPlayerBidPhase.value === 'lastSecond') {
        tipText = `⚡ 你绝杀出价 ${amount.toLocaleString()} 金币！`
      } else if (lastPlayerBidPhase.value === 'sniper') {
        tipText = `🎯 你限时出价 ${amount.toLocaleString()} 金币！`
      }
      addCompetitionTip(tipText, 'success')
    } else {
      addCompetitionTip(
        `${bidder.avatar} ${bidder.name} 出价 ${amount.toLocaleString()} 金币`,
        phase.value === AUCTION_PHASE.CLOSING ? 'warning' : 'info'
      )
    }

    setAuctioneerMessage('bidReceived', {
      bidder: bidder.name,
      price: amount.toLocaleString()
    })

    saveAuctionData()
  }

  const finalizeRound = () => {
    stopTimers()
    phase.value = AUCTION_PHASE.RESULT

    const round = currentRound.value
    if (!round) return

    round.status = 'completed'

    if (bids.value.length > 0 && currentBidder.value) {
      const isPlayerWin = currentBidder.value.id === 'player'

      if (isPlayerWin) {
        comboCount.value++
        if (comboCount.value > maxCombo.value) {
          maxCombo.value = comboCount.value
        }
        if (comboCount.value > 1) {
          totalCombos.value++
        }
        sessionWinsInSession.value++
        sessionWonRarities.value.push(round.mineral.rarity)
        handlePlayerWin()
      } else {
        comboCount.value = 0
      }

      const historyEntry = {
        id: `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roundNumber: round.roundNumber,
        mineralId: round.mineralId,
        mineral: round.mineral,
        finalPrice: currentBid.value,
        winnerId: currentBidder.value.id,
        winnerName: currentBidder.value.name,
        winnerAvatar: currentBidder.value.avatar,
        isPlayerWin,
        totalBids: bids.value.length,
        bidHistory: [...bids.value],
        comboCount: isPlayerWin ? comboCount.value : 0,
        timeBonus: lastPlayerBidPhase.value,
        timestamp: Date.now()
      }
      auctionHistory.value.unshift(historyEntry)

      lastResult.value = historyEntry
      showResultModal.value = true

      setAuctioneerMessage('sold', {
        bidder: currentBidder.value.name,
        price: currentBid.value.toLocaleString(),
        name: round.mineral.name
      })
      addCompetitionTip(
        `🎉 ${isPlayerWin ? '恭喜你' : currentBidder.value.name} 拍得 ${round.mineral.emoji} ${round.mineral.name}！`,
        isPlayerWin ? 'legendary' : 'success'
      )
      if (isPlayerWin && comboCount.value > 1) {
        addCompetitionTip(`🔥 ${comboLabel.value} 加成 x${comboMultiplier.value.toFixed(2)}`, 'legendary')
      }
    } else {
      comboCount.value = 0
      round.status = 'passed'

      const historyEntry = {
        id: `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roundNumber: round.roundNumber,
        mineralId: round.mineralId,
        mineral: round.mineral,
        finalPrice: 0,
        winnerId: null,
        winnerName: null,
        isPlayerWin: false,
        passed: true,
        totalBids: 0,
        comboCount: 0,
        timeBonus: null,
        timestamp: Date.now()
      }
      auctionHistory.value.unshift(historyEntry)

      lastResult.value = historyEntry
      showResultModal.value = true

      setAuctioneerMessage('passed')
      addCompetitionTip(`😢 ${round.mineral.emoji} ${round.mineral.name} 无人出价，遗憾流拍`, 'warning')
    }

    saveAuctionData()

    setTimeout(() => {
      showResultModal.value = false
      lastResult.value = null

      if (currentRoundIndex.value + 1 >= rounds.value.length) {
        finishAuctionSession()
      }
    }, RESULT_DURATION)
  }

  const handlePlayerWin = () => {
    const round = currentRound.value
    if (!round) return
    if (currentBidder.value?.id !== 'player') return

    const finalPrice = currentBid.value
    if (finalPrice <= 0) return
    if (gameStore.coins < finalPrice) return

    gameStore.coins -= finalPrice
    totalWins.value++
    totalSpent.value += finalPrice

    const comboCoinBonus = comboCount.value > 1
      ? Math.round(finalPrice * (comboCount.value - 1) * COMBO_CONFIG.COIN_BONUS_PER_COMBO)
      : 0
    const comboExpBonus = comboCount.value > 1
      ? (comboCount.value - 1) * Math.round(COMBO_CONFIG.EXP_BONUS_PER_COMBO * RARITY_CONFIG[round.mineral.rarity].starCount * 10)
      : 0

    let timeCoinBonus = 0
    let timeExpBonus = 0
    if (lastPlayerBidPhase.value === 'lastSecond') {
      timeCoinBonus = Math.round(finalPrice * TIME_BONUS_CONFIG.LAST_SECOND_COIN_BONUS)
      timeExpBonus = TIME_BONUS_CONFIG.LAST_SECOND_EXP_BONUS
      totalTimeBonuses.value++
    } else if (lastPlayerBidPhase.value === 'sniper') {
      timeCoinBonus = Math.round(finalPrice * TIME_BONUS_CONFIG.SNIPER_COIN_BONUS)
      timeExpBonus = TIME_BONUS_CONFIG.SNIPER_EXP_BONUS
      totalTimeBonuses.value++
    }

    const totalCoinBonus = comboCoinBonus + timeCoinBonus
    const totalExpBonus = comboExpBonus + timeExpBonus

    if (totalCoinBonus > 0) {
      gameStore.coins += totalCoinBonus
    }
    if (totalExpBonus > 0) {
      gameStore.addExp(totalExpBonus)
    }

    const bonusEvents = []
    if (comboCount.value > 1) bonusEvents.push(`连击 x${comboCount.value}！额外 ${comboCoinBonus.toLocaleString()} 金币`)
    if (lastPlayerBidPhase.value === 'lastSecond') bonusEvents.push('⚡ 绝杀出价！限时加成！')
    else if (lastPlayerBidPhase.value === 'sniper') bonusEvents.push('🎯 限时狙击加成！')

    gameStore.collectMineral(round.mineral, 'auction', {
      roundNumber: round.roundNumber,
      finalPrice,
      bidCount: bids.value.length,
      comboCount: comboCount.value,
      timeBonus: lastPlayerBidPhase.value
    }, {
      coins: totalCoinBonus,
      exp: RARITY_CONFIG[round.mineral.rarity].starCount * 10 + totalExpBonus
    }, ['拍卖竞得！', ...bonusEvents], {
      skipCoinReward: true,
      fixedCount: 1
    })

    gameStore.emitTaskEvent('marketTransaction', {
      type: 'auction_buy',
      mineralId: round.mineralId,
      price: finalPrice
    })

    gameStore.saveProgress()
  }

  const continueAfterResult = () => {
    showResultModal.value = false
    lastResult.value = null

    if (currentRoundIndex.value + 1 >= rounds.value.length) {
      finishAuctionSession()
    } else {
      startNextRound()
    }
  }

  const finishAuctionSession = () => {
    stopTimers()
    phase.value = AUCTION_PHASE.FINISHED

    sessionScore.value = calculateSessionScore()
    sessionRating.value = computeSessionRating(sessionScore.value)
    sessionRatingRevealed.value = false

    const ratingCfg = SESSION_RATING_CONFIG[sessionRating.value]
    if (ratingCfg) {
      gameStore.coins += ratingCfg.coinBonus
      gameStore.addExp(ratingCfg.expBonus)
      if (sessionRating.value < bestRating.value || bestRating.value === 'D') {
        const ratingOrder = ['S', 'A', 'B', 'C', 'D']
        if (ratingOrder.indexOf(sessionRating.value) < ratingOrder.indexOf(bestRating.value)) {
          bestRating.value = sessionRating.value
        }
      }
    }

    setAuctioneerMessage('finish')
    addCompetitionTip('🏁 本轮拍卖会结束', 'success')
    if (sessionRating.value) {
      addCompetitionTip(`${ratingCfg.icon} 评级 ${sessionRating.value} - ${ratingCfg.title}！奖励 ${ratingCfg.coinBonus} 金币`, 'legendary')
    }
    saveAuctionData()
  }

  const revealSessionRating = () => {
    sessionRatingRevealed.value = true
  }

  const stopTimers = () => {
    stopCountdown()
    stopNPCBidding()
  }

  const closeResultModal = () => {
    showResultModal.value = false
  }

  const skipToNextRound = () => {
    if (phase.value === AUCTION_PHASE.RESULT) {
      continueAfterResult()
    }
  }

  const saveAuctionData = () => {
    const data = {
      totalAuctions: totalAuctions.value,
      totalWins: totalWins.value,
      totalSpent: totalSpent.value,
      auctionHistory: auctionHistory.value.slice(0, 50),
      bestRating: bestRating.value,
      totalCombos: totalCombos.value,
      totalTimeBonuses: totalTimeBonuses.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadAuctionData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        totalAuctions.value = data.totalAuctions || 0
        totalWins.value = data.totalWins || 0
        totalSpent.value = data.totalSpent || 0
        auctionHistory.value = data.auctionHistory || []
        bestRating.value = data.bestRating || 'D'
        totalCombos.value = data.totalCombos || 0
        totalTimeBonuses.value = data.totalTimeBonuses || 0
      }
    } catch (e) {
      console.error('Failed to load auction data:', e)
    }
  }

  const resetAuctionData = () => {
    stopTimers()
    phase.value = AUCTION_PHASE.IDLE
    currentRoundIndex.value = -1
    rounds.value = []
    bids.value = []
    currentBid.value = 0
    currentBidder.value = null
    competitionTips.value = []
    totalAuctions.value = 0
    totalWins.value = 0
    totalSpent.value = 0
    auctionHistory.value = []
    lastResult.value = null
    showResultModal.value = false
    comboCount.value = 0
    maxCombo.value = 0
    lastPlayerBidPhase.value = null
    sessionTimeBonuses.value = 0
    sessionScore.value = 0
    sessionRating.value = null
    sessionRatingRevealed.value = false
    sessionWinsInSession.value = 0
    sessionTotalRounds.value = 0
    sessionWonRarities.value = []
    bestRating.value = 'D'
    totalCombos.value = 0
    totalTimeBonuses.value = 0
    localStorage.removeItem(STORAGE_KEY)
  }

  const formatTimeRemaining = (ms) => {
    const seconds = Math.ceil(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  const getMineral = (id) => getMineralById(id)

  return {
    phase,
    currentRoundIndex,
    rounds,
    bids,
    currentBid,
    currentBidder,
    roundEndTime,
    timeRemaining,
    auctioneerMessage,
    isClosingWarning,
    competitionTips,
    auctionHistory,
    activeNPCs,
    totalAuctions,
    totalWins,
    totalSpent,
    showResultModal,
    lastResult,
    currentRound,
    currentMineral,
    progress,
    playerLeading,
    minBidIncrement,
    nextMinBid,
    sortedBids,
    canPlayerBid,
    playerBidHistory,
    comboCount,
    maxCombo,
    comboMultiplier,
    comboLabel,
    lastBidTimeBonus,
    sessionTimeBonuses,
    sessionScore,
    sessionRating,
    sessionRatingRevealed,
    sessionRatingConfig,
    sessionWinsInSession,
    sessionTotalRounds,
    bestRating,
    totalCombos,
    totalTimeBonuses,
    startNewAuctionSession,
    startNextRound,
    placePlayerBid,
    placeQuickPlayerBid,
    continueAfterResult,
    closeResultModal,
    skipToNextRound,
    revealSessionRating,
    resetAuctionData,
    loadAuctionData,
    formatTimeRemaining,
    getMineral
  }
})
