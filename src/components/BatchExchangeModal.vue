<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="batch-overlay" @click.self="handleClose">
        <div class="batch-modal">
          <div class="batch-header">
            <h2 class="batch-title">
              <span class="title-icon">♻️</span>
              批量兑换重复矿物
            </h2>
            <button class="close-btn" @click="handleClose">✕</button>
          </div>

          <div v-if="!showResult" class="batch-body">
            <div class="batch-intro">
              <p>选择要兑换的重复矿物，多余次数将折算为积分与金币</p>
            </div>

            <div class="batch-summary-bar">
              <div class="summary-item">
                <span class="summary-label">可选矿物</span>
                <span class="summary-value">{{ duplicateMinerals.length }} 种</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">已选</span>
                <span class="summary-value selected">{{ selectedIds.length }} 种</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">预估收益</span>
                <span class="summary-value coins">{{ totalEstimatedCoins }} 🪙</span>
              </div>
            </div>

            <div class="batch-actions-top">
              <button class="btn btn-small btn-secondary" @click="selectAll">
                全选
              </button>
              <button class="btn btn-small btn-secondary" @click="clearSelection">
                清空
              </button>
            </div>

            <div v-if="duplicateMinerals.length === 0" class="empty-state">
              <div class="empty-icon">📦</div>
              <p class="empty-text">暂无重复矿物可兑换</p>
              <p class="empty-hint">继续拼装或探险获取更多矿物吧</p>
            </div>

            <div v-else class="mineral-list">
              <div
                v-for="mineral in duplicateMinerals"
                :key="mineral.id"
                :class="['mineral-row', { selected: isSelected(mineral.id) }]"
                @click="toggleSelect(mineral.id)"
              >
                <div class="row-check">
                  <div :class="['checkbox', { checked: isSelected(mineral.id) }]">
                    <span v-if="isSelected(mineral.id)">✓</span>
                  </div>
                </div>
                <span class="row-emoji">{{ mineral.emoji }}</span>
                <div class="row-info">
                  <span class="row-name">{{ mineral.name }}</span>
                  <span :class="['row-rarity', `rarity-${mineral.rarity}`]">
                    {{ RARITY_CONFIG[mineral.rarity].name }}
                  </span>
                </div>
                <div class="row-count">
                  <span class="count-label">多余</span>
                  <span class="count-value">×{{ mineral.duplicateCount }}</span>
                </div>
                <div class="row-value">
                  <span class="value-coins">+{{ mineral.coinValue }} 🪙</span>
                  <span class="value-points">+{{ mineral.exchangeValue }} 积分</span>
                </div>
              </div>
            </div>

            <div class="batch-footer">
              <div class="tax-notice">
                ⚠️ 兑换将收取 {{ taxPercent }}% 手续费，每种矿物保留 1 份
              </div>
              <button
                class="btn btn-large batch-exchange-btn"
                :disabled="selectedIds.length === 0"
                @click="executeBatchExchange"
              >
                <span class="btn-icon">♻️</span>
                一键兑换 {{ selectedIds.length }} 种矿物
              </button>
            </div>
          </div>

          <div v-else class="result-body">
            <div class="result-celebration">
              <div class="result-emoji">🎉</div>
              <h2 class="result-title">兑换成功！</h2>
            </div>

            <div class="result-stats">
              <div class="result-stat-item points-stat">
                <span class="stat-icon">🔄</span>
                <div class="stat-content">
                  <span class="stat-value">+{{ batchResult.totalPointsGained }}</span>
                  <span class="stat-label">积分</span>
                </div>
              </div>
              <div class="result-stat-item coins-stat">
                <span class="stat-icon">🪙</span>
                <div class="stat-content">
                  <span class="stat-value">+{{ batchResult.totalCoinsGained }}</span>
                  <span class="stat-label">金币</span>
                </div>
              </div>
              <div class="result-stat-item count-stat">
                <span class="stat-icon">📦</span>
                <div class="stat-content">
                  <span class="stat-value">{{ batchResult.exchangedMineralCount }} 种</span>
                  <span class="stat-label">已兑换矿物</span>
                </div>
              </div>
              <div class="result-stat-item tax-stat">
                <span class="stat-icon">💸</span>
                <div class="stat-content">
                  <span class="stat-value">-{{ batchResult.totalTaxPaid }}</span>
                  <span class="stat-label">手续费</span>
                </div>
              </div>
            </div>

            <div class="result-details">
              <h3 class="details-title">兑换明细</h3>
              <div class="details-list">
                <div
                  v-for="item in batchResult.exchangedDetails"
                  :key="item.id"
                  class="detail-row"
                >
                  <span class="detail-emoji">{{ item.emoji }}</span>
                  <span class="detail-name">{{ item.name }}</span>
                  <span class="detail-count">×{{ item.count }}</span>
                  <span class="detail-coins">+{{ item.coinsGained }} 🪙</span>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn btn-large" @click="handleClose">
                完成
              </button>
              <button class="btn btn-large btn-secondary" @click="viewCollection">
                📖 查看图鉴
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useExchangeStore } from '@/stores/exchange'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG } from '@/data/rarity'
import { EXCHANGE_TAX_RATE, getExchangePointValue } from '@/data/exchange'

const props = defineProps({
  visible: Boolean,
  focusMineralId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close', 'exchanged'])

const router = useRouter()
const exchangeStore = useExchangeStore()
const gameStore = useGameStore()
const audioStore = useAudioStore()

const taxPercent = Math.round(EXCHANGE_TAX_RATE * 100)
const selectedIds = ref([])
const showResult = ref(false)
const batchResult = ref({})

const duplicateMinerals = computed(() => {
  return gameStore.collectedMinerals
    .filter(m => m.count > 1)
    .map(m => {
      const duplicateCount = m.count - 1
      const pointValue = getExchangePointValue(m.rarity)
      const totalBase = pointValue * duplicateCount
      const afterTax = Math.round(totalBase * (1 - EXCHANGE_TAX_RATE))
      const coinValue = Math.round(afterTax * 0.5)
      return {
        ...m,
        duplicateCount,
        exchangeValue: afterTax,
        coinValue
      }
    })
    .sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
      return rarityOrder[a.rarity] - rarityOrder[b.rarity]
    })
})

const totalEstimatedCoins = computed(() => {
  return duplicateMinerals.value
    .filter(m => selectedIds.value.includes(m.id))
    .reduce((sum, m) => sum + m.coinValue, 0)
})

const isSelected = (id) => selectedIds.value.includes(id)

const toggleSelect = (id) => {
  audioStore.playClick()
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const selectAll = () => {
  audioStore.playClick()
  selectedIds.value = duplicateMinerals.value.map(m => m.id)
}

const clearSelection = () => {
  audioStore.playClick()
  selectedIds.value = []
}

const executeBatchExchange = () => {
  if (selectedIds.value.length === 0) return
  audioStore.playClick()
  const result = exchangeStore.batchExchangeAll(selectedIds.value)
  if (result.success) {
    audioStore.playSuccess?.()
    batchResult.value = result
    showResult.value = true
    emit('exchanged', result)
  } else {
    audioStore.playError()
  }
}

const handleClose = () => {
  if (showResult.value) {
    showResult.value = false
    batchResult.value = {}
  }
  selectedIds.value = []
  emit('close')
}

const viewCollection = () => {
  handleClose()
  router.push('/collection')
}

watch(() => props.visible, (val) => {
  if (val) {
    showResult.value = false
    batchResult.value = {}
    if (props.focusMineralId) {
      const mineral = duplicateMinerals.value.find(m => m.id === props.focusMineralId)
      if (mineral) {
        selectedIds.value = [mineral.id]
      } else {
        selectedIds.value = []
      }
    } else {
      selectedIds.value = duplicateMinerals.value.map(m => m.id)
    }
  }
})
</script>

<style scoped>
.batch-overlay {
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
  padding: 16px;
}

.batch-modal {
  background: var(--bg-card);
  border-radius: 20px;
  max-width: 440px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.batch-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.batch-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.batch-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.batch-intro {
  padding: 16px 20px;
}

.batch-intro p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.batch-summary-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-value.selected {
  color: #3b82f6;
}

.summary-value.coins {
  color: #fbbf24;
}

.batch-actions-top {
  display: flex;
  gap: 8px;
  padding: 10px 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-secondary);
  opacity: 0.6;
}

.mineral-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.mineral-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.mineral-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.mineral-row.selected {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
}

.row-check {
  flex-shrink: 0;
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border-color: #f59e0b;
}

.row-emoji {
  font-size: 32px;
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-rarity {
  font-size: 11px;
  font-weight: 600;
}

.row-count {
  flex-shrink: 0;
  text-align: center;
}

.count-label {
  display: block;
  font-size: 10px;
  color: var(--text-secondary);
}

.count-value {
  font-size: 14px;
  font-weight: 700;
  color: #f59e0b;
}

.row-value {
  flex-shrink: 0;
  text-align: right;
}

.value-coins {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
}

.value-points {
  font-size: 10px;
  color: var(--text-secondary);
}

.batch-footer {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tax-notice {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  text-align: center;
  opacity: 0.7;
}

.batch-exchange-btn {
  width: 100%;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #000;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.batch-exchange-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.result-body {
  padding: 24px 20px;
  text-align: center;
}

.result-celebration {
  margin-bottom: 20px;
}

.result-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 8px;
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.result-stat-item {
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-stat-item .stat-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.result-stat-item .stat-content {
  text-align: left;
}

.result-stat-item .stat-value {
  display: block;
  font-size: 18px;
  font-weight: 800;
  font-family: 'Courier New', monospace;
}

.result-stat-item .stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
}

.points-stat {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(6, 182, 212, 0.06));
  border: 1px solid rgba(14, 165, 233, 0.25);
}

.points-stat .stat-value {
  color: #0ea5e9;
}

.coins-stat {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(251, 191, 36, 0.06));
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.coins-stat .stat-value {
  color: #fbbf24;
}

.count-stat {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.06));
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.count-stat .stat-value {
  color: #22c55e;
}

.tax-stat {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.tax-stat .stat-value {
  color: #ef4444;
}

.result-details {
  margin-bottom: 20px;
  text-align: left;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px 0;
}

.details-list {
  max-height: 140px;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.03);
}

.detail-emoji {
  font-size: 20px;
  flex-shrink: 0;
}

.detail-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-coins {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
  flex-shrink: 0;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-actions .btn {
  flex: 1;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .batch-modal,
.modal-leave-active .batch-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .batch-modal,
.modal-leave-to .batch-modal {
  transform: scale(0.9) translateY(20px);
}

@media (max-width: 480px) {
  .batch-modal {
    max-height: 90vh;
    border-radius: 16px;
  }

  .mineral-row {
    padding: 10px 8px;
    gap: 8px;
  }

  .row-emoji {
    font-size: 26px;
  }

  .result-stats {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
</style>
