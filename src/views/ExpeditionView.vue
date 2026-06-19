<template>
  <div class="expedition-view">
    <div class="status-bar">
      <div class="status-item stamina">
        <span class="status-icon">⚡</span>
        <div class="status-info">
          <span class="status-label">体力</span>
          <div class="status-bar-wrapper">
            <div class="status-bar-fill" :style="{ width: staminaPercentage + '%' }"></div>
          </div>
          <span class="status-value">{{ stamina }}/{{ maxStamina }}</span>
        </div>
      </div>
      <div class="status-item level">
        <span class="status-icon">⭐</span>
        <div class="status-info">
          <span class="status-label">等级 Lv.{{ expeditionLevel }}</span>
          <div class="status-bar-wrapper exp-bar">
            <div class="status-bar-fill" :style="{ width: expeditionProgress.percentage + '%' }"></div>
          </div>
          <span class="status-value">{{ expeditionExp }}/{{ expToNextLevel }}</span>
        </div>
      </div>
      <div class="status-item coins">
        <span class="status-icon">💰</span>
        <span class="status-value">{{ coins }}</span>
      </div>
    </div>

    <div v-if="expeditionPhase === 'map'" class="map-phase">
      <h2 class="phase-title">🗺️ 选择考察地点</h2>
      <p class="phase-desc">选择一个地点开始你的矿物考察远征！</p>
      
      <div class="locations-grid">
        <div 
          v-for="location in allLocations" 
          :key="location.id"
          class="location-card"
          :style="{ background: location.backgroundGradient }"
          :class="{ disabled: stamina < location.staminaCost }"
          @click="selectLocation(location)"
        >
          <div class="location-emoji">{{ location.emoji }}</div>
          <div class="location-info">
            <h3 class="location-name">{{ location.name }}</h3>
            <p class="location-desc">{{ location.description }}</p>
            <div class="location-stats">
              <div class="stat">
                <span class="stat-label">难度</span>
                <span class="stat-value">
                  <span v-for="i in location.difficulty" :key="i" class="star">★</span>
                </span>
              </div>
              <div class="stat">
                <span class="stat-label">体力</span>
                <span class="stat-value stamina-cost">{{ location.staminaCost }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">推荐</span>
                <span class="stat-value">Lv.{{ location.recommendedLevel }}</span>
              </div>
            </div>
            <div class="location-rewards">
              <span class="reward-tag">💰 {{ location.rewards.coins[0] }}-{{ location.rewards.coins[1] }}</span>
              <span class="reward-tag">💎 {{ Math.round(location.rewards.mineralChance * 100) }}%</span>
            </div>
          </div>
          <div v-if="stamina < location.staminaCost" class="locked-overlay">
            <span>体力不足</span>
          </div>
        </div>
      </div>

      <div v-if="expeditionHistory.length > 0" class="history-section">
        <h3 class="history-title">📜 最近考察记录</h3>
        <div class="history-list">
          <div 
            v-for="record in expeditionHistory.slice(0, 5)" 
            :key="record.id"
            class="history-item"
          >
            <span class="history-location">{{ record.location }}</span>
            <span class="history-coins">+{{ record.coins }} 💰</span>
            <span v-if="record.mineral" class="history-mineral">
              {{ record.mineral.emoji }} {{ record.mineral.name }}
              <span v-if="record.isNewMineral" class="new-badge">NEW!</span>
            </span>
            <span class="history-exp">+{{ record.exp }} EXP</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="expeditionPhase === 'exploring'" class="exploring-phase">
      <div class="exploring-header">
        <h2 class="phase-title">{{ currentExpedition.emoji }} {{ currentExpedition.name }}</h2>
        <div class="progress-indicator">
          <div 
            v-for="i in currentExpedition.totalSteps" 
            :key="i"
            class="progress-dot"
            :class="{ active: i <= currentExpedition.currentStep, completed: i < currentExpedition.currentStep }"
          ></div>
        </div>
      </div>
      
      <div class="exploring-animation">
        <div class="explorer">🧑‍🔬</div>
        <div class="exploring-text">正在探索中...</div>
      </div>
    </div>

    <div v-if="expeditionPhase === 'event' && currentEvent" class="event-phase">
      <div class="event-card" :class="currentEvent.type">
        <div class="event-header">
          <span class="event-emoji">{{ currentEvent.emoji }}</span>
          <h3 class="event-name">{{ currentEvent.name }}</h3>
          <span class="event-type-badge" :class="currentEvent.type">
            {{ getEventTypeLabel(currentEvent.type) }}
          </span>
        </div>
        
        <p class="event-description">{{ currentEvent.description }}</p>

        <div v-if="!eventResult" class="event-choices">
          <button 
            v-for="choice in currentEvent.choices" 
            :key="choice.id"
            class="choice-btn"
            @click="handleChoice(choice.id)"
          >
            <span class="choice-text">{{ choice.text }}</span>
            <span class="choice-desc">{{ choice.description }}</span>
            <span class="choice-rate">成功率: {{ Math.round(choice.successRate * 100) }}%</span>
          </button>
        </div>

        <div v-if="eventResult" class="event-result" :class="{ success: eventResult.isSuccess, failure: !eventResult.isSuccess }">
          <div class="result-icon">{{ eventResult.isSuccess ? '✅' : '❌' }}</div>
          <p class="result-message">{{ eventResult.message }}</p>
          <div class="result-effects">
            <span v-if="eventResult.coinBonus && eventResult.coinBonus !== 1" class="effect-tag">
              💰 {{ eventResult.coinBonus > 1 ? '+' : '' }}{{ Math.round((eventResult.coinBonus - 1) * 100) }}% 金币
            </span>
            <span v-if="eventResult.rarityBonus" class="effect-tag">
              💎 +{{ eventResult.rarityBonus }} 稀有度
            </span>
            <span v-if="eventResult.staminaBonus" class="effect-tag">
              ⚡ {{ eventResult.staminaBonus > 0 ? '+' : '' }}{{ eventResult.staminaBonus }} 体力
            </span>
            <span v-if="eventResult.noMineral" class="effect-tag negative">
              💔 无矿物收获
            </span>
          </div>
          <button class="continue-btn" @click="handleContinue">继续探索</button>
        </div>
      </div>

      <div class="expedition-stats">
        <div class="stat-row">
          <span class="stat-label">当前金币倍率</span>
          <span class="stat-value">x{{ currentExpedition.coinMultiplier.toFixed(1) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">稀有度加成</span>
          <span class="stat-value">+{{ currentExpedition.rarityBonus }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">矿物获得率</span>
          <span class="stat-value">{{ Math.round(currentExpedition.mineralChance * 100) }}%</span>
        </div>
      </div>
    </div>

    <div v-if="showRewardModal && expeditionRewards" class="reward-modal-overlay">
      <div class="reward-modal">
        <div class="reward-header">
          <h2 class="reward-title">🎉 考察完成！</h2>
          <p class="reward-location">{{ expeditionRewards.location }}</p>
        </div>
        
        <div class="reward-content">
          <div class="reward-item coins-reward">
            <span class="reward-icon">💰</span>
            <span class="reward-label">获得金币</span>
            <span class="reward-value">+{{ expeditionRewards.coins }}</span>
          </div>
          
          <div class="reward-item exp-reward">
            <span class="reward-icon">⭐</span>
            <span class="reward-label">获得经验</span>
            <span class="reward-value">+{{ expeditionRewards.exp }} EXP</span>
          </div>

          <div v-if="expeditionRewards.mineral" class="reward-item mineral-reward">
            <span class="reward-icon mineral-icon">{{ expeditionRewards.mineral.emoji }}</span>
            <span class="reward-label">
              {{ expeditionRewards.isNewMineral ? '发现新矿物！' : '获得矿物' }}
            </span>
            <span class="reward-value mineral-name" :style="{ color: getRarityColor(expeditionRewards.mineral.rarity) }">
              {{ expeditionRewards.mineral.name }}
              <span class="rarity-stars">{{ getRarityStars(expeditionRewards.mineral.rarity) }}</span>
            </span>
            <router-link 
              v-if="expeditionRewards.isNewMineral" 
              :to="`/mineral/${expeditionRewards.mineral.id}`"
              class="view-detail-link"
              @click="handleViewDetail"
            >
              查看详情 →
            </router-link>
          </div>
        </div>

        <button class="claim-reward-btn" @click="handleClaimReward">
          领取奖励
        </button>
      </div>
    </div>

    <div v-if="selectedLocation && showConfirmModal" class="confirm-modal-overlay">
      <div class="confirm-modal">
        <div class="confirm-header" :style="{ background: selectedLocation.backgroundGradient }">
          <span class="confirm-emoji">{{ selectedLocation.emoji }}</span>
          <h3 class="confirm-name">{{ selectedLocation.name }}</h3>
        </div>
        <div class="confirm-body">
          <p class="confirm-desc">{{ selectedLocation.description }}</p>
          <div class="confirm-cost">
            <span class="cost-label">消耗体力:</span>
            <span class="cost-value">{{ selectedLocation.staminaCost }} ⚡</span>
          </div>
          <div class="confirm-actions">
            <button class="cancel-btn" @click="cancelSelection">取消</button>
            <button class="confirm-btn" @click="confirmExpedition">开始考察</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useRouter } from 'vue-router'
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'

const gameStore = useGameStore()
const audioStore = useAudioStore()
const router = useRouter()

const selectedLocation = ref(null)
const showConfirmModal = ref(false)

const stamina = computed(() => gameStore.stamina)
const maxStamina = computed(() => gameStore.maxStamina)
const staminaPercentage = computed(() => gameStore.staminaPercentage)
const expeditionLevel = computed(() => gameStore.expeditionLevel)
const expeditionExp = computed(() => gameStore.expeditionExp)
const expToNextLevel = computed(() => gameStore.expToNextLevel)
const expeditionProgress = computed(() => gameStore.expeditionProgress)
const coins = computed(() => gameStore.coins)
const allLocations = computed(() => gameStore.allLocations)
const expeditionPhase = computed(() => gameStore.expeditionPhase)
const currentExpedition = computed(() => gameStore.currentExpedition)
const currentEvent = computed(() => gameStore.currentEvent)
const eventResult = computed(() => gameStore.eventResult)
const expeditionRewards = computed(() => gameStore.expeditionRewards)
const showRewardModal = computed(() => gameStore.showRewardModal)
const expeditionHistory = computed(() => gameStore.expeditionHistory)

const getEventTypeLabel = (type) => {
  const labels = {
    positive: '好运',
    neutral: '事件',
    negative: '危机'
  }
  return labels[type] || '事件'
}

const getRarityColor = (rarity) => {
  return RARITY_CONFIG[rarity]?.color || '#fff'
}

const selectLocation = (location) => {
  if (gameStore.stamina < location.staminaCost) {
    audioStore.playStaminaLow()
    return
  }
  audioStore.playClick()
  selectedLocation.value = location
  showConfirmModal.value = true
}

const cancelSelection = () => {
  audioStore.playClick()
  selectedLocation.value = null
  showConfirmModal.value = false
}

const confirmExpedition = () => {
  audioStore.playExpeditionStart()
  const success = gameStore.startExpedition(selectedLocation.value.id)
  if (success) {
    selectedLocation.value = null
    showConfirmModal.value = false
  }
}

const handleChoice = (choiceId) => {
  audioStore.playClick()
  const result = gameStore.makeChoice(choiceId)
  if (result) {
    if (result.isSuccess) {
      audioStore.playChoiceSuccess()
    } else {
      audioStore.playChoiceFailure()
    }
  }
}

const handleContinue = () => {
  audioStore.playClick()
  gameStore.continueExpedition()
}

const handleClaimReward = () => {
  audioStore.playReward()
  if (expeditionRewards.value.mineral) {
    if (expeditionRewards.value.isNewMineral) {
      audioStore.playRareFound()
    } else {
      audioStore.playPickup()
    }
  }
  gameStore.closeRewardModal()
}

const handleViewDetail = () => {
  audioStore.playClick()
  gameStore.closeRewardModal()
}

watch(() => gameStore.expeditionPhase, (newPhase) => {
  if (newPhase === 'event') {
    audioStore.playEventFound()
  } else if (newPhase === 'exploring') {
    audioStore.playExploreStep()
  }
})

watch(() => gameStore.expeditionLevel, (newLevel, oldLevel) => {
  if (newLevel > oldLevel) {
    audioStore.playLevelUp()
  }
})

onMounted(() => {
  gameStore.startStaminaRecovery()
  gameStore.regenStamina()
})

onUnmounted(() => {
  gameStore.stopStaminaRecovery()
})
</script>

<style scoped>
.expedition-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.status-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex: 1;
  min-width: 120px;
}

.status-icon {
  font-size: 24px;
}

.status-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.status-bar-wrapper {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.status-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.exp-bar .status-bar-fill {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.status-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.stamina .status-bar-fill {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.coins {
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #facc15;
}

.phase-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  text-align: center;
}

.phase-desc {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.locations-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-card {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.location-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.location-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.location-emoji {
  font-size: 48px;
  flex-shrink: 0;
}

.location-info {
  flex: 1;
  min-width: 0;
}

.location-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.location-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  line-height: 1.4;
}

.location-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.location-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.star {
  color: #facc15;
}

.stamina-cost {
  color: #facc15;
}

.location-rewards {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reward-tag {
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.locked-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #ef4444;
}

.history-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  flex-wrap: wrap;
}

.history-location {
  font-weight: 600;
  color: var(--text-primary);
}

.history-coins {
  color: #facc15;
}

.history-mineral {
  color: var(--text-primary);
}

.new-badge {
  background: #ef4444;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
}

.history-exp {
  color: #22c55e;
  margin-left: auto;
}

.exploring-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.exploring-header {
  text-align: center;
  margin-bottom: 40px;
}

.progress-indicator {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: var(--primary);
  box-shadow: 0 0 12px var(--primary);
}

.progress-dot.completed {
  background: #22c55e;
}

.exploring-animation {
  text-align: center;
}

.explorer {
  font-size: 64px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.exploring-text {
  margin-top: 20px;
  font-size: 18px;
  color: var(--text-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.event-phase {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.event-card.positive {
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
}

.event-card.negative {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
}

.event-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.event-emoji {
  font-size: 40px;
}

.event-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.event-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.event-type-badge.positive {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.event-type-badge.neutral {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.event-type-badge.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.event-description {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.event-choices {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.choice-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
  transform: translateX(4px);
}

.choice-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.choice-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.choice-rate {
  font-size: 12px;
  color: #facc15;
  margin-left: auto;
}

.event-result {
  text-align: center;
  padding: 20px 0;
}

.event-result.success {
  color: #22c55e;
}

.event-result.failure {
  color: #ef4444;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.result-message {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.result-effects {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.effect-tag {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.effect-tag.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.continue-btn {
  padding: 12px 32px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-btn:hover {
  background: #d9465a;
  transform: scale(1.05);
}

.expedition-stats {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row .stat-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.stat-row .stat-value {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.reward-modal-overlay,
.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.reward-modal,
.confirm-modal {
  background: var(--bg-card);
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.reward-header,
.confirm-header {
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
}

.reward-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.reward-location {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.reward-content {
  padding: 24px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 12px;
}

.reward-item:last-child {
  margin-bottom: 0;
}

.reward-icon {
  font-size: 32px;
}

.mineral-icon {
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
  50% { filter: drop-shadow(0 0 20px currentColor); }
}

.reward-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-secondary);
}

.reward-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.coins-reward .reward-value {
  color: #facc15;
}

.exp-reward .reward-value {
  color: #22c55e;
}

.mineral-name {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.rarity-stars {
  font-size: 12px;
}

.mineral-reward {
  flex-wrap: wrap;
}

.view-detail-link {
  width: 100%;
  text-align: right;
  color: var(--primary);
  font-size: 13px;
  text-decoration: none;
  margin-top: 8px;
}

.view-detail-link:hover {
  text-decoration: underline;
}

.claim-reward-btn {
  width: calc(100% - 48px);
  margin: 0 24px 24px;
  padding: 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.claim-reward-btn:hover {
  background: #d9465a;
  transform: scale(1.02);
}

.confirm-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.confirm-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.confirm-body {
  padding: 24px;
}

.confirm-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.confirm-cost {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 20px;
}

.cost-label {
  color: var(--text-secondary);
}

.cost-value {
  font-size: 18px;
  font-weight: 700;
  color: #facc15;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.confirm-btn {
  background: var(--primary);
  color: #fff;
}

.confirm-btn:hover {
  background: #d9465a;
}

@media (max-width: 480px) {
  .status-bar {
    flex-direction: column;
  }
  
  .location-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .location-stats {
    justify-content: center;
  }
  
  .location-rewards {
    justify-content: center;
  }
  
  .phase-title {
    font-size: 20px;
  }
}
</style>
