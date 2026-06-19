import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  QUIZ_DIFFICULTY,
  DIFFICULTY_CONFIG,
  generateQuestionSet,
  REWARD_SHOP_ITEMS,
  getRewardItemById
} from '@/data/quiz'
import { getRandomMineralByRarity, getRandomUncollectedMineralByRarity, getMineralsByRarity } from '@/data/minerals'
import { RARITY_CONFIG } from '@/data/rarity'
import { useGameStore } from './game'

const STORAGE_KEY = 'mineral_quiz_progress'

export const useQuizStore = defineStore('quiz', () => {
  const gameStore = useGameStore()

  const quizPoints = ref(0)
  const currentDifficulty = ref(null)
  const currentQuestions = ref([])
  const currentQuestionIndex = ref(0)
  const quizPhase = ref('menu')
  const streak = ref(0)
  const bestStreak = ref(0)
  const currentStreakReward = ref(0)
  const selectedAnswer = ref(null)
  const answerResult = ref(null)
  const timeRemaining = ref(0)
  const timerInterval = ref(null)
  const showExplanation = ref(false)
  const totalAnswered = ref(0)
  const totalCorrect = ref(0)
  const quizHistory = ref([])
  const showResultModal = ref(false)
  const sessionResult = ref(null)
  const unlockedByQuiz = ref([])
  const showShopModal = ref(false)

  const phase = computed(() => quizPhase.value)

  const currentQuestion = computed(() => {
    if (currentQuestions.value.length === 0) return null
    return currentQuestions.value[currentQuestionIndex.value]
  })

  const progress = computed(() => {
    if (currentQuestions.value.length === 0) return 0
    return Math.round(((currentQuestionIndex.value + 1) / currentQuestions.value.length) * 100)
  })

  const sessionCorrectCount = computed(() => {
    return currentQuestions.value.filter(q => q.isCorrect === true).length
  })

  const sessionAccuracy = computed(() => {
    if (currentQuestions.value.length === 0) return 0
    return Math.round((sessionCorrectCount.value / currentQuestions.value.length) * 100)
  })

  const overallAccuracy = computed(() => {
    if (totalAnswered.value === 0) return 0
    return Math.round((totalCorrect.value / totalAnswered.value) * 100)
  })

  const canStartQuiz = (difficulty) => {
    const config = DIFFICULTY_CONFIG[difficulty]
    return gameStore.stamina >= config.staminaCost
  }

  const startQuiz = (difficulty) => {
    const config = DIFFICULTY_CONFIG[difficulty]
    if (!gameStore.spendStamina(config.staminaCost)) {
      return { success: false, message: '体力不足' }
    }

    currentDifficulty.value = difficulty
    currentQuestions.value = generateQuestionSet(difficulty, 10)
    currentQuestionIndex.value = 0
    streak.value = 0
    currentStreakReward.value = 0
    selectedAnswer.value = null
    answerResult.value = null
    showExplanation.value = false
    timeRemaining.value = config.timeLimit
    quizPhase.value = 'playing'
    sessionResult.value = null

    startTimer()

    return { success: true }
  }

  const startTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    timerInterval.value = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        handleTimeout()
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  const handleTimeout = () => {
    if (quizPhase.value !== 'playing' || selectedAnswer.value !== null) return
    submitAnswer(null)
  }

  const submitAnswer = (optionId) => {
    if (quizPhase.value !== 'playing' || selectedAnswer.value !== null) return
    if (!currentQuestion.value) return

    stopTimer()

    selectedAnswer.value = optionId
    const isCorrect = optionId === currentQuestion.value.correctOptionId
    answerResult.value = isCorrect
    totalAnswered.value++

    currentQuestion.value.userAnswer = optionId
    currentQuestion.value.isCorrect = isCorrect
    currentQuestion.value.timeUsed = DIFFICULTY_CONFIG[currentDifficulty.value].timeLimit - timeRemaining.value

    let pointsEarned = 0

    if (isCorrect) {
      totalCorrect.value++
      streak.value++
      if (streak.value > bestStreak.value) {
        bestStreak.value = streak.value
      }

      const config = DIFFICULTY_CONFIG[currentDifficulty.value]
      pointsEarned = config.basePoints

      if (streak.value >= 3) {
        const streakMultiplier = Math.min(streak.value - 2, 5)
        const streakBonus = config.streakBonus * streakMultiplier
        pointsEarned += streakBonus
        currentStreakReward.value = streakBonus
      }

      if (timeRemaining.value > config.timeLimit * 0.5) {
        pointsEarned = Math.floor(pointsEarned * 1.5)
      }

      quizPoints.value += pointsEarned
    } else {
      streak.value = 0
      currentStreakReward.value = 0
    }

    currentQuestion.value.pointsEarned = pointsEarned
    showExplanation.value = true
    quizPhase.value = 'answered'

    saveProgress()

    return { isCorrect, pointsEarned, streak: streak.value }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex.value < currentQuestions.value.length - 1) {
      currentQuestionIndex.value++
      selectedAnswer.value = null
      answerResult.value = null
      showExplanation.value = false
      timeRemaining.value = DIFFICULTY_CONFIG[currentDifficulty.value].timeLimit
      quizPhase.value = 'playing'
      startTimer()
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = () => {
    stopTimer()

    const config = DIFFICULTY_CONFIG[currentDifficulty.value]
    const correctCount = sessionCorrectCount.value
    const totalPoints = currentQuestions.value.reduce((sum, q) => sum + (q.pointsEarned || 0), 0)
    const bonusCoins = correctCount >= 8 ? 100 : correctCount >= 6 ? 50 : correctCount >= 4 ? 20 : 0

    if (bonusCoins > 0) {
      gameStore.coins += bonusCoins
      gameStore.emitTaskEvent('coinsEarned', bonusCoins)
    }

    const result = {
      id: Date.now(),
      difficulty: currentDifficulty.value,
      difficultyName: config.name,
      correctCount,
      totalCount: currentQuestions.value.length,
      accuracy: sessionAccuracy.value,
      pointsEarned: totalPoints,
      bonusCoins,
      maxStreak: streak.value,
      completedAt: Date.now()
    }

    sessionResult.value = result
    quizHistory.value.unshift(result)
    if (quizHistory.value.length > 50) {
      quizHistory.value = quizHistory.value.slice(0, 50)
    }

    gameStore.emitTaskEvent('quizComplete', result)

    quizPhase.value = 'result'
    showResultModal.value = true
    saveProgress()
  }

  const closeResultModal = () => {
    showResultModal.value = false
    quizPhase.value = 'menu'
    currentDifficulty.value = null
    currentQuestions.value = []
    currentQuestionIndex.value = 0
    sessionResult.value = null
  }

  const exitQuiz = () => {
    stopTimer()
    quizPhase.value = 'menu'
    currentDifficulty.value = null
    currentQuestions.value = []
    currentQuestionIndex.value = 0
    selectedAnswer.value = null
    answerResult.value = null
    showExplanation.value = false
    streak.value = 0
  }

  const purchaseReward = (itemId) => {
    const item = getRewardItemById(itemId)
    if (!item) return { success: false, message: '商品不存在' }
    if (quizPoints.value < item.cost) return { success: false, message: '积分不足' }

    quizPoints.value -= item.cost

    let result = { success: true, item, unlockedMineral: null, bonusCoins: 0 }

    switch (item.type) {
      case 'stamina':
        gameStore.addStamina(item.value)
        break
      case 'coins':
        gameStore.coins += item.value
        gameStore.emitTaskEvent('coinsEarned', item.value)
        break
      case 'unlock_mineral':
        const collectedIds = new Set(gameStore.collectedMinerals.map(m => m.id))
        let mineral = getRandomUncollectedMineralByRarity(item.rarity, collectedIds)
        
        if (mineral) {
          const isNew = gameStore.collectMineral(mineral, 'quiz', {
            type: 'reward_unlock',
            rarity: item.rarity,
            rarityName: RARITY_CONFIG[item.rarity]?.name,
            cost: item.cost
          })
          result.unlockedMineral = mineral
          result.isNewMineral = isNew
          if (isNew) {
            unlockedByQuiz.value.push({
              mineralId: mineral.id,
              unlockedAt: Date.now()
            })
            gameStore.newMineral = mineral
            gameStore.isNewMineral = true
            gameStore.showNewMineralModal = true
          }
        } else {
          const allMineralsOfRarity = getRandomMineralByRarity(item.rarity)
          const basePrice = allMineralsOfRarity ? Math.floor(item.cost * 0.8) : Math.floor(item.cost * 0.5)
          gameStore.coins += basePrice
          gameStore.emitTaskEvent('coinsEarned', basePrice)
          result.bonusCoins = basePrice
          result.allCollected = true
          result.unlockedMineral = allMineralsOfRarity
          result.isNewMineral = false
        }
        break
    }

    saveProgress()
    return result
  }

  const openShop = () => {
    showShopModal.value = true
  }

  const closeShop = () => {
    showShopModal.value = false
  }

  const hasUncollectedMineralsOfRarity = (rarity) => {
    const collectedIds = new Set(gameStore.collectedMinerals.map(m => m.id))
    const allMineralsOfRarity = getMineralsByRarity(rarity)
    return allMineralsOfRarity.some(m => !collectedIds.has(m.id))
  }

  const getUncollectedCountOfRarity = (rarity) => {
    const collectedIds = new Set(gameStore.collectedMinerals.map(m => m.id))
    const allMineralsOfRarity = getMineralsByRarity(rarity)
    return allMineralsOfRarity.filter(m => !collectedIds.has(m.id)).length
  }

  const saveProgress = () => {
    const progress = {
      quizPoints: quizPoints.value,
      bestStreak: bestStreak.value,
      totalAnswered: totalAnswered.value,
      totalCorrect: totalCorrect.value,
      quizHistory: quizHistory.value,
      unlockedByQuiz: unlockedByQuiz.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        quizPoints.value = progress.quizPoints ?? 0
        bestStreak.value = progress.bestStreak ?? 0
        totalAnswered.value = progress.totalAnswered ?? 0
        totalCorrect.value = progress.totalCorrect ?? 0
        quizHistory.value = progress.quizHistory ?? []
        unlockedByQuiz.value = progress.unlockedByQuiz ?? []
      }
    } catch (e) {
      console.error('Failed to load quiz progress:', e)
    }
  }

  const resetProgress = () => {
    quizPoints.value = 0
    bestStreak.value = 0
    totalAnswered.value = 0
    totalCorrect.value = 0
    quizHistory.value = []
    unlockedByQuiz.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    quizPoints,
    currentDifficulty,
    currentQuestions,
    currentQuestionIndex,
    quizPhase,
    streak,
    bestStreak,
    currentStreakReward,
    selectedAnswer,
    answerResult,
    timeRemaining,
    showExplanation,
    totalAnswered,
    totalCorrect,
    quizHistory,
    showResultModal,
    sessionResult,
    unlockedByQuiz,
    showShopModal,
    phase,
    currentQuestion,
    progress,
    sessionCorrectCount,
    sessionAccuracy,
    overallAccuracy,
    canStartQuiz,
    startQuiz,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    closeResultModal,
    exitQuiz,
    purchaseReward,
    openShop,
    closeShop,
    hasUncollectedMineralsOfRarity,
    getUncollectedCountOfRarity,
    saveProgress,
    loadProgress,
    resetProgress
  }
})
