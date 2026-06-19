<template>
  <div class="quiz-view">
    <div class="quiz-header">
      <div class="header-content">
        <h1 class="page-title">矿物知识问答</h1>
        <p class="page-subtitle">挑战你的矿物知识，赢取丰厚奖励</p>
      </div>
      <div class="header-actions">
        <div class="points-display">
          <span class="points-icon">⭐</span>
          <span class="points-value">{{ quizStore.quizPoints }}</span>
        </div>
        <button class="shop-btn" @click="openShop">
          <span class="shop-icon">🛒</span>
          <span class="shop-label">兑换</span>
        </button>
      </div>
    </div>

    <div v-if="quizStore.phase === 'menu'" class="menu-section">
      <div class="stats-cards">
        <div class="stat-card card">
          <span class="stat-emoji">🎯</span>
          <div class="stat-info">
            <span class="stat-label">正确率</span>
            <span class="stat-value">{{ quizStore.overallAccuracy }}%</span>
          </div>
        </div>
        <div class="stat-card card">
          <span class="stat-emoji">🔥</span>
          <div class="stat-info">
            <span class="stat-label">最高连胜</span>
            <span class="stat-value">{{ quizStore.bestStreak }}</span>
          </div>
        </div>
        <div class="stat-card card">
          <span class="stat-emoji">📊</span>
          <div class="stat-info">
            <span class="stat-label">总答题数</span>
            <span class="stat-value">{{ quizStore.totalAnswered }}</span>
          </div>
        </div>
      </div>

      <h2 class="section-title">选择难度</h2>
      <div class="difficulty-grid">
        <div
          v-for="(config, key) in difficultyList"
          :key="key"
          class="difficulty-card card"
          :style="{ '--diff-color': config.color, '--diff-gradient': config.gradient }"
          :class="{ disabled: !quizStore.canStartQuiz(key) }"
          @click="selectDifficulty(key)"
        >
          <div class="difficulty-icon">{{ config.icon }}</div>
          <h3 class="difficulty-name">{{ config.name }}</h3>
          <p class="difficulty-desc">{{ config.description }}</p>
          <div class="difficulty-info">
            <div class="info-item">
              <span class="info-icon">⚡</span>
              <span class="info-text">消耗 {{ config.staminaCost }} 体力</span>
            </div>
            <div class="info-item">
              <span class="info-icon">⭐</span>
              <span class="info-text">基础 {{ config.basePoints }} 积分</span>
            </div>
            <div class="info-item">
              <span class="info-icon">⏱️</span>
              <span class="info-text">{{ config.timeLimit }} 秒/题</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🎯</span>
              <span class="info-text">{{ config.optionCount }} 个选项</span>
            </div>
          </div>
          <button
            class="btn start-btn"
            :disabled="!quizStore.canStartQuiz(key)"
            @click.stop="handleStartQuiz(key)"
          >
            {{ quizStore.canStartQuiz(key) ? '开始答题' : '体力不足' }}
          </button>
        </div>
      </div>

      <h2 class="section-title">答题记录</h2>
      <div v-if="quizStore.quizHistory.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">暂无答题记录，快去挑战吧！</p>
      </div>
      <div v-else class="history-list">
        <div
          v-for="record in quizStore.quizHistory.slice(0, 20)"
          :key="record.id"
          class="history-item card"
        >
          <div class="history-difficulty" :style="{ background: getDifficultyConfig(record.difficulty)?.gradient }">
            {{ getDifficultyConfig(record.difficulty)?.icon }}
          </div>
          <div class="history-info">
            <div class="history-title">
              <span class="history-name">{{ record.difficultyName }}</span>
              <span class="history-time">{{ formatTime(record.completedAt) }}</span>
            </div>
            <div class="history-stats">
              <span class="history-stat">✓ {{ record.correctCount }}/{{ record.totalCount }}</span>
              <span class="history-stat">🎯 {{ record.accuracy }}%</span>
              <span class="history-stat">🔥 {{ record.maxStreak }}</span>
              <span class="history-stat points">+{{ record.pointsEarned }} 积分</span>
              <span v-if="record.bonusCoins > 0" class="history-stat coins">+{{ record.bonusCoins }} 💰</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="quizStore.phase === 'playing' || quizStore.phase === 'answered'" class="quiz-section">
      <div class="quiz-progress-bar">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${quizStore.progress}%` }"></div>
        </div>
        <span class="progress-text">{{ quizStore.currentQuestionIndex + 1 }} / {{ quizStore.currentQuestions.length }}</span>
      </div>

      <div class="quiz-stats">
        <div class="quiz-stat">
          <span class="stat-label">⏱️</span>
          <span class="stat-value time" :class="{ urgent: quizStore.timeRemaining <= 5 }">
            {{ quizStore.timeRemaining }}s
          </span>
        </div>
        <div class="quiz-stat">
          <span class="stat-label">🔥</span>
          <span class="stat-value streak">{{ quizStore.streak }}</span>
        </div>
        <div class="quiz-stat">
          <span class="stat-label">⭐</span>
          <span class="stat-value">{{ quizStore.quizPoints }}</span>
        </div>
        <button class="exit-btn" @click="handleExit">
          退出
        </button>
      </div>

      <div v-if="quizStore.currentQuestion" class="question-card card">
        <div class="question-header">
          <span
            class="question-difficulty"
            :style="{ background: getDifficultyConfig(quizStore.currentDifficulty)?.gradient }"
          >
            {{ getDifficultyConfig(quizStore.currentDifficulty)?.icon }} {{ getDifficultyConfig(quizStore.currentDifficulty)?.name }}
          </span>
          <span v-if="quizStore.currentQuestion.mineral" class="question-mineral">
            {{ quizStore.currentQuestion.mineral.emoji }}
          </span>
        </div>

        <h2 class="question-text">{{ quizStore.currentQuestion.question }}</h2>

        <div class="options-list">
          <button
            v-for="option in quizStore.currentQuestion.options"
            :key="option.id"
            class="option-btn"
            :class="getOptionClass(option.id)"
            :disabled="quizStore.phase === 'answered'"
            @click="handleSelectAnswer(option.id)"
          >
            <span class="option-letter">{{ getOptionLetter(quizStore.currentQuestion.options.indexOf(option)) }}</span>
            <span class="option-text">{{ option.text }}</span>
            <span v-if="quizStore.phase === 'answered' && option.id === quizStore.currentQuestion.correctOptionId" class="option-icon correct-icon">✓</span>
            <span v-if="quizStore.phase === 'answered' && option.id === quizStore.selectedAnswer && option.id !== quizStore.currentQuestion.correctOptionId" class="option-icon wrong-icon">✗</span>
          </button>
        </div>

        <div v-if="quizStore.phase === 'answered'" class="answer-feedback">
          <div class="feedback-header">
            <span v-if="quizStore.answerResult" class="feedback-icon correct">✓</span>
            <span v-else class="feedback-icon wrong">✗</span>
            <span v-if="quizStore.answerResult" class="feedback-text correct">回答正确！</span>
            <span v-else class="feedback-text wrong">回答错误</span>
          </div>

          <div v-if="quizStore.answerResult && quizStore.currentQuestion.pointsEarned > 0" class="points-earned">
            <span class="points-label">获得积分</span>
            <span class="points-amount">+{{ quizStore.currentQuestion.pointsEarned }}</span>
            <span v-if="quizStore.streak >= 3" class="streak-bonus">🔥 {{ quizStore.streak }} 连胜奖励！</span>
          </div>

          <div class="explanation-box">
            <h4 class="explanation-title">💡 知识解析</h4>
            <p class="explanation-text">{{ quizStore.currentQuestion.explanation }}</p>
          </div>

          <button class="btn next-btn" @click="handleNextQuestion">
            {{ quizStore.currentQuestionIndex < quizStore.currentQuestions.length - 1 ? '下一题' : '查看结果' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="quizStore.showResultModal" class="modal-overlay">
      <div class="modal-content result-modal card">
        <div class="result-header">
          <div class="result-emoji">{{ getResultEmoji() }}</div>
          <h2 class="result-title">{{ getResultTitle() }}</h2>
          <p class="result-subtitle">{{ quizStore.sessionResult?.difficultyName }} 难度</p>
        </div>

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-icon">✓</span>
            <span class="result-stat-value">{{ quizStore.sessionResult?.correctCount }}/{{ quizStore.sessionResult?.totalCount }}</span>
            <span class="result-stat-label">正确数</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-icon">🎯</span>
            <span class="result-stat-value">{{ quizStore.sessionResult?.accuracy }}%</span>
            <span class="result-stat-label">正确率</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-icon">🔥</span>
            <span class="result-stat-value">{{ quizStore.sessionResult?.maxStreak }}</span>
            <span class="result-stat-label">最大连胜</span>
          </div>
        </div>

        <div class="result-rewards">
          <h3 class="rewards-title">🎁 获得奖励</h3>
          <div class="rewards-list">
            <div class="reward-item">
              <span class="reward-icon">⭐</span>
              <span class="reward-text">积分</span>
              <span class="reward-value">+{{ quizStore.sessionResult?.pointsEarned }}</span>
            </div>
            <div v-if="quizStore.sessionResult?.bonusCoins > 0" class="reward-item">
              <span class="reward-icon">💰</span>
              <span class="reward-text">金币奖励</span>
              <span class="reward-value">+{{ quizStore.sessionResult?.bonusCoins }}</span>
            </div>
          </div>
        </div>

        <button class="btn continue-btn" @click="handleCloseResult">
          继续
        </button>
      </div>
    </div>

    <div v-if="quizStore.showShopModal" class="modal-overlay" @click.self="handleCloseShop">
      <div class="modal-content shop-modal card">
        <div class="modal-header">
          <h2 class="modal-title">积分兑换商店</h2>
          <div class="modal-header-right">
            <div class="points-display-small">
              <span class="points-icon">⭐</span>
              <span class="points-value">{{ quizStore.quizPoints }}</span>
            </div>
            <button class="close-btn" @click="handleCloseShop">✕</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="shop-items-grid">
            <div
              v-for="item in shopItems"
              :key="item.id"
              class="shop-item-card"
              :class="{ disabled: quizStore.quizPoints < item.cost }"
            >
              <div class="shop-item-icon">{{ item.icon }}</div>
              <div class="shop-item-info">
                <h3 class="shop-item-name">{{ item.name }}</h3>
                <p class="shop-item-desc">{{ item.description }}</p>
              </div>
              <div class="shop-item-cost">
                <span class="cost-icon">⭐</span>
                <span class="cost-value">{{ item.cost }}</span>
              </div>
              <button
                class="btn btn-small buy-btn"
                :disabled="quizStore.quizPoints < item.cost"
                @click="handleBuyItem(item.id)"
              >
                {{ quizStore.quizPoints >= item.cost ? '兑换' : '积分不足' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useQuizStore } from '@/stores/quiz'
import { useAudioStore } from '@/stores/audio'
import {
  QUIZ_DIFFICULTY,
  DIFFICULTY_CONFIG,
  REWARD_SHOP_ITEMS
} from '@/data/quiz'

const gameStore = useGameStore()
const quizStore = useQuizStore()
const audioStore = useAudioStore()

const difficultyList = computed(() => DIFFICULTY_CONFIG)
const shopItems = computed(() => REWARD_SHOP_ITEMS)
let tickInterval = null

onMounted(() => {
  quizStore.loadProgress()
})

onUnmounted(() => {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
})

watch(() => quizStore.timeRemaining, (newVal, oldVal) => {
  if (quizStore.phase === 'playing' && newVal <= 5 && newVal > 0 && newVal !== oldVal) {
    audioStore.playQuizTick()
  }
})

const getDifficultyConfig = (difficulty) => {
  return DIFFICULTY_CONFIG[difficulty]
}

const selectDifficulty = (key) => {
  audioStore.playClick()
}

const handleStartQuiz = (difficulty) => {
  audioStore.playQuizStart()
  const result = quizStore.startQuiz(difficulty)
  if (!result.success) {
    audioStore.playError()
  }
}

const handleSelectAnswer = (optionId) => {
  audioStore.playClick()
  const result = quizStore.submitAnswer(optionId)
  if (result) {
    if (result.isCorrect) {
      audioStore.playQuizCorrect()
      if (result.streak >= 3) {
        setTimeout(() => {
          audioStore.playQuizStreak(Math.min(result.streak - 2, 5))
        }, 300)
      }
    } else {
      audioStore.playQuizWrong()
    }
  }
}

const handleNextQuestion = () => {
  audioStore.playClick()
  quizStore.nextQuestion()
}

const handleExit = () => {
  audioStore.playClick()
  if (confirm('确定要退出答题吗？当前进度将丢失。')) {
    quizStore.exitQuiz()
  }
}

const handleCloseResult = () => {
  audioStore.playReward()
  quizStore.closeResultModal()
}

const openShop = () => {
  audioStore.playClick()
  quizStore.openShop()
}

const handleCloseShop = () => {
  audioStore.playClick()
  quizStore.closeShop()
}

const handleBuyItem = (itemId) => {
  const result = quizStore.purchaseReward(itemId)
  if (result.success) {
    audioStore.playQuizShopBuy()
    if (result.unlockedMineral) {
      if (result.isNewMineral) {
        audioStore.playRareFound()
        setTimeout(() => {
          gameStore.newMineral = result.unlockedMineral
          gameStore.isNewMineral = true
          gameStore.showNewMineralModal = true
        }, 500)
      } else {
        audioStore.playSuccess()
      }
    } else {
      audioStore.playSuccess()
    }
  } else {
    audioStore.playError()
  }
}

const getOptionClass = (optionId) => {
  if (quizStore.phase !== 'answered') {
    return ''
  }
  const question = quizStore.currentQuestion
  if (optionId === question.correctOptionId) {
    return 'correct'
  }
  if (optionId === quizStore.selectedAnswer && optionId !== question.correctOptionId) {
    return 'wrong'
  }
  return 'disabled'
}

const getOptionLetter = (index) => {
  return String.fromCharCode(65 + index)
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getResultEmoji = () => {
  const accuracy = quizStore.sessionResult?.accuracy || 0
  if (accuracy >= 90) return '🏆'
  if (accuracy >= 70) return '🎉'
  if (accuracy >= 50) return '👍'
  return '💪'
}

const getResultTitle = () => {
  const accuracy = quizStore.sessionResult?.accuracy || 0
  if (accuracy >= 90) return '太厉害了！'
  if (accuracy >= 70) return '表现不错！'
  if (accuracy >= 50) return '继续加油！'
  return '再接再厉！'
}
</script>

<style scoped>
.quiz-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  color: white;
}

.points-icon {
  font-size: 16px;
}

.points-value {
  font-size: 16px;
}

.shop-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  border: none;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.shop-icon {
  font-size: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.stat-emoji {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-info .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.difficulty-card {
  position: relative;
  padding: 20px;
  border-left: 4px solid var(--diff-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.difficulty-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.difficulty-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.difficulty-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.difficulty-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.difficulty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.difficulty-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.info-icon {
  font-size: 14px;
}

.start-btn {
  width: 100%;
  background: var(--diff-gradient);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled) {
  transform: scale(1.02);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
}

.history-difficulty {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
}

.history-stat {
  color: var(--text-secondary);
}

.history-stat.points {
  color: #a855f7;
  font-weight: 600;
}

.history-stat.coins {
  color: #f59e0b;
  font-weight: 600;
}

.quiz-progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #a855f7);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.quiz-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.quiz-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card);
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quiz-stat .stat-label {
  font-size: 16px;
}

.quiz-stat .stat-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.quiz-stat .stat-value.time {
  min-width: 36px;
}

.quiz-stat .stat-value.time.urgent {
  color: #ef4444;
  animation: urgentPulse 0.5s ease-in-out infinite;
}

@keyframes urgentPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.quiz-stat .stat-value.streak {
  color: #f59e0b;
}

.exit-btn {
  margin-left: auto;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-secondary);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.question-card {
  padding: 24px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-difficulty {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.question-mineral {
  font-size: 36px;
}

.question-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.option-btn:disabled {
  cursor: default;
}

.option-btn.correct {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.5);
  animation: correctPulse 0.5s ease;
}

@keyframes correctPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.option-btn.wrong {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  animation: wrongShake 0.4s ease;
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

.option-btn.disabled {
  opacity: 0.5;
}

.option-letter {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.option-btn.correct .option-letter {
  background: rgba(34, 197, 94, 0.3);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.5);
}

.option-btn.wrong .option-letter {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.5);
}

.option-text {
  flex: 1;
  line-height: 1.4;
}

.option-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.option-icon.correct-icon {
  background: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.option-icon.wrong-icon {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.answer-feedback {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.feedback-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.feedback-icon.correct {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.feedback-icon.wrong {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.feedback-text {
  font-size: 18px;
  font-weight: 700;
}

.feedback-text.correct {
  color: #22c55e;
}

.feedback-text.wrong {
  color: #ef4444;
}

.points-earned {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.points-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.points-amount {
  font-size: 20px;
  font-weight: 700;
  color: #a855f7;
}

.streak-bonus {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 4px 10px;
  border-radius: 10px;
}

.explanation-box {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.explanation-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.explanation-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.next-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  background: linear-gradient(135deg, var(--primary), #a855f7);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  padding: 0;
  overflow: hidden;
}

.result-modal {
  text-align: center;
  padding: 32px 24px;
}

.result-header {
  margin-bottom: 28px;
}

.result-emoji {
  font-size: 72px;
  margin-bottom: 12px;
  display: block;
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.result-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  padding: 16px 12px;
  border-radius: 14px;
}

.result-stat-icon {
  font-size: 20px;
  color: var(--text-secondary);
}

.result-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.result-stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.result-rewards {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.rewards-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reward-icon {
  font-size: 18px;
}

.reward-text {
  font-size: 14px;
  color: var(--text-secondary);
  flex: 1;
  text-align: left;
}

.reward-value {
  font-size: 16px;
  font-weight: 700;
  color: #a855f7;
}

.continue-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  background: linear-gradient(135deg, var(--primary), #a855f7);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.points-display-small {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 600;
  color: white;
  font-size: 13px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.shop-items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shop-item-card {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.shop-item-card:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.06);
}

.shop-item-card.disabled {
  opacity: 0.5;
}

.shop-item-icon {
  font-size: 36px;
}

.shop-item-info {
  min-width: 0;
}

.shop-item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.shop-item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.shop-item-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: #a855f7;
}

.cost-icon {
  font-size: 14px;
}

.cost-value {
  font-size: 16px;
}

.buy-btn {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  color: white;
  padding: 8px 16px;
  font-size: 13px;
}

.buy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-small {
  padding: 10px 16px;
  font-size: 14px;
}

.btn {
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@media (min-width: 600px) {
  .difficulty-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .difficulty-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .quiz-header {
    flex-direction: column;
    gap: 12px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .shop-item-card {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
  }

  .shop-item-cost {
    grid-column: 2;
    grid-row: 2;
    justify-self: start;
  }

  .buy-btn {
    grid-column: 1 / -1;
    grid-row: 3;
    width: 100%;
  }
}
</style>
