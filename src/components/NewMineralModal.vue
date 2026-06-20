<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content" :class="`rarity-${mineral?.rarity}`">
          <div class="sparkles" v-if="isRare">
            <span v-for="i in 12" :key="i" class="sparkle" :style="getSparkleStyle(i)">✨</span>
          </div>
          
          <div class="modal-header">
            <h2 class="modal-title">
              {{ isNew ? '🎉 新矿物获得！' : '✨ 已收集矿物' }}
            </h2>
          </div>

          <div class="mineral-display">
            <div class="mineral-glow"></div>
            <span class="mineral-emoji">{{ mineral?.emoji }}</span>
          </div>

          <div class="mineral-info">
            <h3 class="mineral-name">{{ mineral?.name }}</h3>
            <span class="mineral-en">{{ mineral?.nameEn }}</span>
            <div class="rarity-badge">
              <span class="stars">{{ stars }}</span>
              <span class="rarity-name">{{ rarityName }}</span>
            </div>
          </div>

          <div class="rewards" v-if="!isNew && exchangeReward">
            <div class="reward-grid">
              <div class="reward-item">
                <span class="reward-icon">🪙</span>
                <span class="reward-text">收集奖励 +10</span>
              </div>
              <div class="reward-item exchange-item">
                <span class="reward-icon">{{ TOKEN_EMOJI }}</span>
                <span class="reward-text">可换 {{ TOKEN_NAME }} +{{ exchangeReward.tokens }}</span>
              </div>
              <div class="reward-item exchange-item">
                <span class="reward-icon">🪙</span>
                <span class="reward-text">可换金币 +{{ exchangeReward.coins }}</span>
              </div>
              <div v-if="exchangeReward.expectedItems > 0" class="reward-item exchange-item gift-item">
                <span class="reward-icon">🎁</span>
                <span class="reward-text">
                  道具约 {{ exchangeReward.expectedItems }}个
                  <span v-if="exchangeReward.itemExample">(如{{ exchangeReward.itemExample.emoji }})</span>
                </span>
              </div>
            </div>
          </div>

          <div class="duplicate-hint" v-if="!isNew && duplicateCount > 0">
            <span class="hint-icon">♻️</span>
            <span class="hint-text">
              已有多余 <strong>{{ duplicateCount }}</strong> 份 · 
              批量兑换可额外获得代币+金币+随机道具
            </span>
          </div>

          <div class="mineral-formula">
            <span class="formula-label">化学式</span>
            <span class="formula-value">{{ mineral?.formula }}</span>
          </div>

          <div class="reward-detail-section" v-if="showRewardDetail && rewardDetail">
            <div class="reward-detail-header">
              <span class="detail-title-icon">📋</span>
              <span class="detail-title">奖励明细</span>
            </div>
            <div class="reward-detail-content">
              <div class="detail-row">
                <span class="detail-label">⏱️ 拼装用时</span>
                <span class="detail-value">{{ formatTime(rewardDetail.timeTaken) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🧩 碎片数量</span>
                <span class="detail-value">{{ rewardDetail.pieceCount }} 块</span>
              </div>
              <div class="detail-divider"></div>
              <div class="detail-row coin-row">
                <span class="detail-label">🪙 基础奖励</span>
                <span class="detail-value">+{{ rewardDetail.baseCoins }}</span>
              </div>
              <div class="detail-row coin-row" v-if="rewardDetail.detectorBonus > 0">
                <span class="detail-label">🔬 探测器加成 (+{{ rewardDetail.detectorBonus }}%)</span>
                <span class="detail-value highlight">+{{ rewardDetail.bonusCoins }}</span>
              </div>
              <div class="detail-row coin-row total-row">
                <span class="detail-label">💰 金币总计</span>
                <span class="detail-value total">+{{ rewardDetail.coins }}</span>
              </div>
              <div class="detail-divider"></div>
              <div class="detail-row exp-row">
                <span class="detail-label">⭐ 经验值</span>
                <span class="detail-value">+{{ rewardDetail.exp }} EXP</span>
              </div>
              <div class="detail-row" v-if="rewardDetail.isNew">
                <span class="detail-label">🎉 首次发现</span>
                <span class="detail-value badge-new">新藏品！</span>
              </div>
              <div class="events-tags" v-if="rewardDetail.events.length > 0">
                <span v-for="(event, idx) in rewardDetail.events" :key="idx" class="event-tag">
                  {{ event }}
                </span>
              </div>
            </div>
          </div>

          <button 
            class="btn-toggle-detail" 
            @click="toggleRewardDetail"
            v-if="rewardDetail"
          >
            <span class="toggle-icon">{{ showRewardDetail ? '▲' : '▼' }}</span>
            <span>{{ showRewardDetail ? '收起奖励明细' : '查看奖励明细' }}</span>
          </button>

          <div class="quick-actions">
            <button class="quick-action-btn continue-btn" @click="handleContinueChallenge">
              <span class="qa-icon">🎨</span>
              <span class="qa-label">继续挑战</span>
            </button>
            <button class="quick-action-btn atlas-btn" @click="handleGoToCollection">
              <span class="qa-icon">📖</span>
              <span class="qa-label">前往图鉴</span>
            </button>
            <button class="quick-action-btn detail-btn" @click="handleViewDetail">
              <span class="qa-icon">🔍</span>
              <span class="qa-label">查看详情</span>
            </button>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="handleClose">
              关闭
            </button>
          </div>
          <button
            v-if="duplicateCount > 0"
            class="btn btn-batch-exchange-hint"
            @click="handleBatchExchange"
          >
            <span class="btn-icon">♻️</span>
            批量兑换多余藏品 ({{ duplicateCount }}份)
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RARITY_CONFIG, getRarityStars, RARITY } from '@/data/rarity'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import {
  TOKEN_NAME,
  TOKEN_EMOJI,
  COIN_CONVERSION_RATE,
  EXCHANGE_TAX_RATE,
  getExchangePointValue,
  estimateItemRewards
} from '@/data/exchange'

const props = defineProps({
  show: Boolean,
  mineral: Object,
  isNew: Boolean
})

const emit = defineEmits(['close', 'batchExchange'])

const router = useRouter()
const audioStore = useAudioStore()
const gameStore = useGameStore()

const showRewardDetail = ref(false)

watch(() => props.show, (val) => {
  if (val) {
    showRewardDetail.value = false
  }
})

const rarityConfig = computed(() => {
  return props.mineral ? RARITY_CONFIG[props.mineral.rarity] : null
})

const rarityName = computed(() => rarityConfig.value?.name || '')
const stars = computed(() => props.mineral ? getRarityStars(props.mineral.rarity) : '')

const isRare = computed(() => {
  return props.mineral && 
    [RARITY.EPIC, RARITY.LEGENDARY].includes(props.mineral.rarity)
})

const duplicateCount = computed(() => {
  if (!props.mineral || props.isNew) return 0
  const collected = gameStore.collectedMinerals.find(m => m.id === props.mineral.id)
  return collected ? collected.count - 1 : 0
})

const exchangeReward = computed(() => {
  if (!props.mineral || duplicateCount.value <= 0) return null
  const count = duplicateCount.value
  const pointValue = getExchangePointValue(props.mineral.rarity)
  const totalBase = pointValue * count
  const tokens = Math.round(totalBase * (1 - EXCHANGE_TAX_RATE))
  const coins = Math.round(tokens * COIN_CONVERSION_RATE)
  const est = estimateItemRewards(props.mineral, count)
  return {
    count,
    tokens,
    coins,
    expectedItems: est?.expectedCount || 0,
    itemExample: est?.example || null
  }
})

const rewardDetail = computed(() => {
  const last = gameStore.lastCollageReward
  if (!last || !props.mineral) return null
  if (last.mineral?.id !== props.mineral.id) return null
  return last
})

const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}秒`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

const getSparkleStyle = (index) => {
  const angle = (index / 12) * 360
  const delay = index * 0.1
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const toggleRewardDetail = () => {
  audioStore.playClick()
  showRewardDetail.value = !showRewardDetail.value
}

const handleClose = () => {
  audioStore.playClick()
  emit('close')
}

const handleViewDetail = () => {
  audioStore.playClick()
  emit('close')
  router.push(`/mineral/${props.mineral.id}`)
}

const handleContinueChallenge = () => {
  audioStore.playClick()
  emit('close')
  setTimeout(() => {
    const result = gameStore.startNewCollage()
    if (result) {
      router.push('/collage')
    }
  }, 50)
}

const handleGoToCollection = () => {
  audioStore.playClick()
  emit('close')
  router.push('/collection')
}

const handleBatchExchange = () => {
  audioStore.playClick()
  emit('batchExchange')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  background: var(--bg-card);
  border-radius: 24px;
  padding: 32px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  border: 2px solid;
  animation: modalEnter 0.5s ease;
}

.modal-content.rarity-common { border-color: var(--common); }
.modal-content.rarity-uncommon { border-color: var(--uncommon); }
.modal-content.rarity-rare { border-color: var(--rare); }
.modal-content.rarity-epic { 
  border-color: var(--epic);
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.3);
}
.modal-content.rarity-legendary { 
  border-color: var(--legendary);
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.4);
  animation: modalEnter 0.5s ease, legendaryGlow 2s ease-in-out infinite;
}

.sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.sparkle {
  position: absolute;
  font-size: 20px;
  top: 50%;
  left: 50%;
  animation: sparkle 1.5s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes sparkle {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 150px),
      calc(-50% + sin(var(--angle)) * 150px)
    ) rotate(180deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 200px),
      calc(-50% + sin(var(--angle)) * 200px)
    ) rotate(360deg) scale(0);
    opacity: 0;
  }
}

.modal-header {
  margin-bottom: 24px;
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.mineral-display {
  position: relative;
  margin-bottom: 24px;
}

.mineral-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: inherit;
  filter: blur(30px);
  opacity: 0.5;
  animation: pulse 2s ease-in-out infinite;
}

.mineral-emoji {
  position: relative;
  font-size: 100px;
  display: block;
  animation: bounce 1s ease infinite;
}

.mineral-info {
  margin-bottom: 20px;
}

.mineral-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.rarity-legendary .mineral-name {
  background: linear-gradient(135deg, #ffd700, #ffec8b, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 2s linear infinite;
  background-size: 200% auto;
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.mineral-en {
  font-size: 14px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 12px;
}

.rarity-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
}

.stars {
  font-size: 16px;
  letter-spacing: 2px;
}

.rarity-name {
  font-size: 14px;
  font-weight: 600;
}

.rarity-common .rarity-name, .rarity-common .stars { color: var(--common); }
.rarity-uncommon .rarity-name, .rarity-uncommon .stars { color: var(--uncommon); }
.rarity-rare .rarity-name, .rarity-rare .stars { color: var(--rare); }
.rarity-epic .rarity-name, .rarity-epic .stars { color: var(--epic); }
.rarity-legendary .rarity-name, .rarity-legendary .stars { color: var(--legendary); }

.rewards {
  margin-bottom: 20px;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.reward-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.reward-item.exchange-item {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.22);
}

.reward-item.gift-item {
  grid-column: span 2;
  background: rgba(167, 139, 250, 0.12);
  border-color: rgba(167, 139, 250, 0.25);
  justify-content: center;
}

.reward-icon {
  font-size: 16px;
}

.reward-text {
  font-size: 12px;
  font-weight: 600;
  color: #fbbf24;
  line-height: 1.3;
}

.reward-item.exchange-item .reward-text {
  color: #93c5fd;
}

.reward-item.gift-item .reward-text {
  color: #c4b5fd;
}

.duplicate-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.duplicate-hint .hint-icon {
  font-size: 18px;
}

.duplicate-hint .hint-text {
  font-size: 12px;
  color: #fbbf24;
  font-weight: 500;
  line-height: 1.4;
}

.duplicate-hint .hint-text strong {
  color: #f59e0b;
  font-size: 13px;
}

.mineral-formula {
  margin-bottom: 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.formula-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.formula-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-actions .btn {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
}

.duplicate-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.duplicate-hint .hint-icon {
  font-size: 18px;
}

.duplicate-hint .hint-text {
  font-size: 13px;
  color: #fbbf24;
  font-weight: 500;
}

.btn-batch-exchange-hint {
  margin-top: 12px;
  width: 100%;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #000;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-batch-exchange-hint:hover {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes legendaryGlow {
  0%, 100% { box-shadow: 0 0 60px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 80px rgba(245, 158, 11, 0.6), 0 0 120px rgba(245, 158, 11, 0.3); }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  opacity: 0;
  transform: scale(0.8);
}

.reward-detail-section {
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 197, 253, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 14px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reward-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.15);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.detail-title-icon {
  font-size: 16px;
}

.detail-title {
  font-size: 14px;
  font-weight: 700;
  color: #93c5fd;
}

.reward-detail-content {
  padding: 12px 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.detail-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 8px 0;
}

.detail-row.coin-row .detail-value {
  color: #fbbf24;
}

.detail-row.coin-row .detail-value.highlight {
  color: #22c55e;
}

.detail-row.coin-row.total-row {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px dashed rgba(251, 191, 36, 0.3);
}

.detail-row.coin-row.total-row .detail-label {
  color: var(--text-primary);
  font-weight: 600;
}

.detail-row.coin-row.total-row .detail-value.total {
  color: #f59e0b;
  font-size: 16px;
  font-weight: 800;
}

.detail-row.exp-row .detail-value {
  color: #a78bfa;
}

.detail-value.badge-new {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
}

.events-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

.event-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #fbbf24;
}

.btn-toggle-detail {
  width: 100%;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-toggle-detail:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.toggle-icon {
  font-size: 10px;
  transition: transform 0.2s ease;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 12px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.03);
}

.quick-action-btn:hover {
  transform: translateY(-2px);
}

.qa-icon {
  font-size: 22px;
  line-height: 1;
}

.qa-label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.quick-action-btn.continue-btn {
  border-color: rgba(236, 72, 153, 0.3);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(244, 114, 182, 0.06));
}

.quick-action-btn.continue-btn:hover {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 114, 182, 0.1));
  border-color: rgba(236, 72, 153, 0.5);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.25);
}

.quick-action-btn.continue-btn .qa-label {
  color: #f472b6;
}

.quick-action-btn.atlas-btn {
  border-color: rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(96, 165, 250, 0.06));
}

.quick-action-btn.atlas-btn:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1));
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
}

.quick-action-btn.atlas-btn .qa-label {
  color: #60a5fa;
}

.quick-action-btn.detail-btn {
  border-color: rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(74, 222, 128, 0.06));
}

.quick-action-btn.detail-btn:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.1));
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.25);
}

.quick-action-btn.detail-btn .qa-label {
  color: #4ade80;
}
</style>
