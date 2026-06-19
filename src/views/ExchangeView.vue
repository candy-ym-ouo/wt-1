<template>
  <div class="exchange-view">
    <div class="exchange-header">
      <div class="header-content">
        <h1 class="page-title">矿物交换站</h1>
        <p class="page-subtitle">置换重复藏品，兑换稀有矿物</p>
      </div>
      <div class="header-actions">
        <div class="points-display">
          <span class="points-icon">🔄</span>
          <span class="points-value">{{ exchangeStore.exchangePoints }}</span>
        </div>
        <div class="coins-display">
          <span class="coins-icon">💰</span>
          <span class="coins-value">{{ gameStore.coins }}</span>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { active: exchangeStore.activeTab === tab.value }]"
        @click="handleTabChange(tab.value)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div v-if="exchangeStore.activeTab === 'duplicate'" class="tab-content">
      <div class="section-intro">
        <div class="intro-icon">🔄</div>
        <div class="intro-text">
          <h3>重复藏品置换</h3>
          <p>将重复的矿物藏品兑换为交换积分和金币，兑换时将收取 {{ taxPercent }}% 手续费</p>
        </div>
      </div>

      <div v-if="exchangeStore.duplicateMinerals.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p class="empty-text">暂无重复藏品可置换</p>
        <p class="empty-hint">继续拼装或远征获取更多矿物吧</p>
      </div>

      <div v-else class="duplicate-list">
        <div class="duplicate-summary card">
          <div class="summary-item">
            <span class="summary-label">可置换矿物</span>
            <span class="summary-value">{{ exchangeStore.duplicateMinerals.length }} 种</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">预估总价值</span>
            <span class="summary-value highlight">{{ exchangeStore.totalDuplicateValue }} 积分</span>
          </div>
        </div>

        <div
          v-for="mineral in exchangeStore.duplicateMinerals"
          :key="mineral.id"
          class="duplicate-card card"
          :style="{ '--rarity-color': RARITY_CONFIG[mineral.rarity].color }"
        >
          <div class="duplicate-left">
            <span class="mineral-emoji">{{ mineral.emoji }}</span>
            <div class="mineral-info">
              <h3 class="mineral-name">{{ mineral.name }}</h3>
              <span :class="['rarity-tag', `rarity-${mineral.rarity}`]">
                {{ RARITY_CONFIG[mineral.rarity].name }}
              </span>
              <div class="mineral-meta">
                <span>持有: {{ mineral.count }}</span>
                <span>可置换: {{ mineral.duplicateCount }}</span>
              </div>
            </div>
          </div>
          <div class="duplicate-right">
            <div class="exchange-value">
              <span class="value-points">+{{ mineral.exchangeValue }}</span>
              <span class="value-label">积分</span>
            </div>
            <div class="exchange-count">
              <button
                class="count-btn minus"
                :disabled="!getExchangeCount(mineral.id) || getExchangeCount(mineral.id) <= 0"
                @click="adjustCount(mineral.id, -1)"
              >−</button>
              <span class="count-display">{{ getExchangeCount(mineral.id) }}</span>
              <button
                class="count-btn plus"
                :disabled="getExchangeCount(mineral.id) >= mineral.duplicateCount"
                @click="adjustCount(mineral.id, 1)"
              >+</button>
            </div>
            <button
              class="btn exchange-btn"
              :disabled="getExchangeCount(mineral.id) <= 0"
              @click="handleDuplicateExchange(mineral)"
            >
              置换
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="exchangeStore.activeTab === 'conversion'" class="tab-content">
      <div class="section-intro">
        <div class="intro-icon">⬆️</div>
        <div class="intro-text">
          <h3>稀有度升级</h3>
          <p>消耗多余的低稀有度矿物和金币，兑换更高稀有度的矿物</p>
        </div>
      </div>

      <div class="conversion-rules card">
        <h4 class="rules-title">💡 升级规则</h4>
        <div class="rules-list">
          <div
            v-for="(config, rarity) in RARITY_CONVERSION"
            :key="rarity"
            class="rule-item"
          >
            <span :class="['rule-rarity', `rarity-${rarity}`]">{{ RARITY_CONFIG[rarity].name }}</span>
            <span class="rule-arrow">→</span>
            <span :class="['rule-rarity', `rarity-${config.targetRarity}`]">{{ RARITY_CONFIG[config.targetRarity].name }}</span>
            <span class="rule-cost">{{ config.requiredCount }}个 + {{ config.coinCost }}💰</span>
          </div>
        </div>
      </div>

      <div v-if="exchangeStore.conversionOptions.length === 0" class="empty-state">
        <div class="empty-icon">⬆️</div>
        <p class="empty-text">暂无满足条件的升级选项</p>
        <p class="empty-hint">收集更多同稀有度矿物即可解锁升级</p>
      </div>

      <div v-else class="conversion-list">
        <div
          v-for="option in exchangeStore.conversionOptions"
          :key="option.fromRarity"
          class="conversion-card card"
          :style="{
            '--from-color': option.fromRarityConfig.color,
            '--to-color': option.toRarityConfig.color
          }"
        >
          <div class="conversion-header">
            <div class="conversion-from">
              <span class="conversion-emoji">{{ { common: '⬜', uncommon: '🟢', rare: '🔵', epic: '🟣' }[option.fromRarity] }}</span>
              <span :class="['conversion-rarity-label', `rarity-${option.fromRarity}`]">
                {{ option.fromRarityConfig.name }}
              </span>
            </div>
            <div class="conversion-arrow">
              <span class="arrow-icon">⬆️</span>
              <span class="arrow-text">升级</span>
            </div>
            <div class="conversion-to">
              <span class="conversion-emoji">{{ { uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' }[option.toRarity] }}</span>
              <span :class="['conversion-rarity-label', `rarity-${option.toRarity}`]">
                {{ option.toRarityConfig.name }}
              </span>
            </div>
          </div>

          <div class="conversion-details">
            <div class="detail-item">
              <span class="detail-label">需要数量</span>
              <span class="detail-value">{{ option.requiredCount }} 个</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">可用数量</span>
              <span class="detail-value highlight">{{ option.availableCount }} 个</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">可兑换次数</span>
              <span class="detail-value">{{ option.possibleBatches }} 次</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">金币消耗</span>
              <span class="detail-value coin-cost">{{ option.coinCost }} 💰 /次</span>
            </div>
          </div>

          <div v-if="gameStore.coins < option.coinCost" class="insufficient-warning">
            ⚠️ 金币不足，需要 {{ option.coinCost }} 金币
          </div>

          <button
            class="btn conversion-btn"
            :disabled="gameStore.coins < option.coinCost"
            @click="handleRarityConversion(option.fromRarity)"
          >
            {{ option.requiredCount }}个{{ option.fromRarityConfig.name }} → 1个{{ option.toRarityConfig.name }}
            <span class="btn-cost">（{{ option.coinCost }} 💰）</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="exchangeStore.activeTab === 'history'" class="tab-content">
      <div class="section-intro">
        <div class="intro-icon">📋</div>
        <div class="intro-text">
          <h3>兑换记录</h3>
          <p>查看所有置换与升级的详细记录</p>
        </div>
      </div>

      <div v-if="exchangeStore.exchangeHistory.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">暂无兑换记录</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="record in exchangeStore.exchangeHistory"
          :key="record.id"
          class="history-card card"
        >
          <div class="history-header">
            <span :class="['history-type-badge', record.type]">
              {{ record.type === 'duplicate' ? '🔄 置换' : '⬆️ 升级' }}
            </span>
            <span class="history-time">{{ formatTime(record.timestamp) }}</span>
          </div>

          <div v-if="record.type === 'duplicate'" class="history-body">
            <div class="history-mineral">
              <span class="history-emoji">{{ record.mineralEmoji }}</span>
              <div>
                <span class="history-name">{{ record.mineralName }}</span>
                <span :class="['history-rarity', `rarity-${record.rarity}`]">
                  {{ RARITY_CONFIG[record.rarity]?.name }}
                </span>
              </div>
              <span class="history-count">×{{ record.count }}</span>
            </div>
            <div class="history-result">
              <span class="result-item points">+{{ record.pointsGained }} 积分</span>
              <span class="result-item coins">+{{ record.coinsGained }} 💰</span>
              <span class="result-item tax">手续费: {{ record.taxPaid }}</span>
            </div>
          </div>

          <div v-else class="history-body">
            <div class="history-conversion">
              <span :class="['conv-rarity', `rarity-${record.fromRarity}`]">
                {{ record.fromRarityName }}
              </span>
              <span class="conv-arrow">→</span>
              <span :class="['conv-rarity', `rarity-${record.toRarity}`]">
                {{ record.toRarityName }}
              </span>
            </div>
            <div class="history-exchanged">
              <span>消耗:</span>
              <span
                v-for="m in record.exchangedMinerals"
                :key="m.id"
                class="exchanged-item"
              >
                {{ m.emoji }}{{ m.name }}×{{ m.count }}
              </span>
            </div>
            <div class="history-result">
              <span class="result-item coins">-{{ record.coinCost }} 💰</span>
              <span class="result-item received">
                获得: {{ record.receivedMineral.emoji }} {{ record.receivedMineral.name }}
                <span v-if="record.receivedMineral.isNew" class="new-tag">新!</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRiskModal" class="modal-overlay" @click.self="closeRiskModal">
      <div class="modal-content risk-modal card">
        <div class="modal-header">
          <h2 class="modal-title">⚠️ 风险提示</h2>
          <button class="close-btn" @click="closeRiskModal">✕</button>
        </div>
        <div class="modal-body">
          <div
            v-for="(warning, index) in currentWarnings"
            :key="index"
            :class="['warning-item', warning.severity]"
          >
            <span class="warning-icon">{{ warning.icon }}</span>
            <div class="warning-content">
              <h4 class="warning-title">{{ warning.title }}</h4>
              <p class="warning-message">{{ warning.message }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn" @click="closeRiskModal">取消</button>
          <button class="btn confirm-btn" :class="{ danger: hasCriticalWarning }" @click="confirmExchange">
            {{ hasCriticalWarning ? '我已了解风险，继续' : '确认兑换' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResultModal" class="modal-overlay" @click.self="closeResultModal">
      <div class="modal-content result-modal card">
        <div class="result-header">
          <div class="result-emoji">🎉</div>
          <h2 class="result-title">{{ exchangeResult.title }}</h2>
        </div>
        <div class="result-body">
          <div v-if="exchangeResult.type === 'duplicate'" class="result-details">
            <div class="result-item">
              <span class="result-label">获得积分</span>
              <span class="result-value points">+{{ exchangeResult.pointsGained }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">获得金币</span>
              <span class="result-value coins">+{{ exchangeResult.coinsGained }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">手续费</span>
              <span class="result-value tax">-{{ exchangeResult.taxPaid }}</span>
            </div>
          </div>
          <div v-else class="result-details">
            <div class="received-mineral">
              <span class="received-emoji">{{ exchangeResult.mineralEmoji }}</span>
              <div>
                <span class="received-name">{{ exchangeResult.mineralName }}</span>
                <span :class="['received-rarity', `rarity-${exchangeResult.mineralRarity}`]">
                  {{ exchangeResult.mineralRarityName }}
                </span>
              </div>
              <span v-if="exchangeResult.isNew" class="new-badge">新收藏!</span>
            </div>
            <div class="result-item">
              <span class="result-label">金币消耗</span>
              <span class="result-value tax">-{{ exchangeResult.coinCost }}</span>
            </div>
          </div>
        </div>
        <button class="btn continue-btn" @click="closeResultModal">继续</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useGameStore } from '@/stores/game'
import { useExchangeStore } from '@/stores/exchange'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import { RARITY_CONVERSION, EXCHANGE_TAX_RATE } from '@/data/exchange'

const gameStore = useGameStore()
const exchangeStore = useExchangeStore()
const audioStore = useAudioStore()

const taxPercent = Math.round(EXCHANGE_TAX_RATE * 100)

const tabs = [
  { value: 'duplicate', icon: '🔄', label: '重复置换' },
  { value: 'conversion', icon: '⬆️', label: '稀有度升级' },
  { value: 'history', icon: '📋', label: '兑换记录' }
]

const exchangeCounts = reactive({})
const showRiskModal = ref(false)
const currentWarnings = ref([])
const pendingAction = ref(null)
const showResultModal = ref(false)
const exchangeResult = ref({})

const hasCriticalWarning = ref(false)

const handleTabChange = (tab) => {
  audioStore.playClick()
  exchangeStore.setActiveTab(tab)
}

const getExchangeCount = (mineralId) => {
  return exchangeCounts[mineralId] || 0
}

const adjustCount = (mineralId, delta) => {
  audioStore.playClick()
  const current = exchangeCounts[mineralId] || 0
  const next = Math.max(0, current + delta)
  exchangeCounts[mineralId] = next
}

const handleDuplicateExchange = (mineral) => {
  const count = getExchangeCount(mineral.id)
  if (count <= 0) return

  const warnings = exchangeStore.getRiskWarnings('duplicate', {
    mineral,
    count
  })

  if (warnings.length > 0) {
    currentWarnings.value = warnings
    hasCriticalWarning.value = warnings.some(w => w.severity === 'critical')
    pendingAction.value = { type: 'duplicate', mineralId: mineral.id, count }
    showRiskModal.value = true
    return
  }

  executeDuplicateExchange(mineral.id, count)
}

const handleRarityConversion = (fromRarity) => {
  const config = RARITY_CONVERSION[fromRarity]
  if (!config) return

  const warnings = exchangeStore.getRiskWarnings('rarity_conversion', {
    fromRarity,
    toRarity: config.targetRarity,
    coinCost: config.coinCost
  })

  if (warnings.some(w => w.severity === 'critical')) {
    audioStore.playError()
    return
  }

  if (warnings.length > 0) {
    currentWarnings.value = warnings
    hasCriticalWarning.value = warnings.some(w => w.severity === 'critical')
    pendingAction.value = { type: 'conversion', fromRarity }
    showRiskModal.value = true
    return
  }

  executeRarityConversion(fromRarity)
}

const confirmExchange = () => {
  audioStore.playClick()
  if (!pendingAction.value) return

  if (pendingAction.value.type === 'duplicate') {
    executeDuplicateExchange(pendingAction.value.mineralId, pendingAction.value.count)
  } else if (pendingAction.value.type === 'conversion') {
    executeRarityConversion(pendingAction.value.fromRarity)
  }

  closeRiskModal()
}

const executeDuplicateExchange = (mineralId, count) => {
  const result = exchangeStore.exchangeDuplicate(mineralId, count)
  if (result.success) {
    audioStore.playSuccess()
    exchangeCounts[mineralId] = 0
    exchangeResult.value = {
      type: 'duplicate',
      title: '置换成功',
      pointsGained: result.pointsGained,
      coinsGained: result.coinsGained,
      taxPaid: result.taxPaid
    }
    showResultModal.value = true
  } else {
    audioStore.playError()
  }
}

const executeRarityConversion = (fromRarity) => {
  const result = exchangeStore.exchangeRarityConversion(fromRarity)
  if (result.success) {
    audioStore.playRareFound()
    const mineral = result.receivedMineral
    const rarityConfig = RARITY_CONFIG[mineral.rarity]
    exchangeResult.value = {
      type: 'conversion',
      title: result.isNew ? '获得新矿物!' : '升级成功',
      mineralEmoji: mineral.emoji,
      mineralName: mineral.name,
      mineralRarity: mineral.rarity,
      mineralRarityName: rarityConfig.name,
      isNew: result.isNew,
      coinCost: result.coinCost
    }
    showResultModal.value = true
  } else {
    audioStore.playError()
  }
}

const closeRiskModal = () => {
  showRiskModal.value = false
  currentWarnings.value = []
  pendingAction.value = null
}

const closeResultModal = () => {
  showResultModal.value = false
  exchangeResult.value = {}
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
</script>

<style scoped>
.exchange-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.exchange-header {
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
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
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

.coins-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  color: white;
}

.coins-icon {
  font-size: 16px;
}

.coins-value {
  font-size: 16px;
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: white;
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  white-space: nowrap;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.intro-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.intro-text h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.intro-text p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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

.duplicate-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-value.highlight {
  color: #0ea5e9;
}

.duplicate-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.duplicate-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-left: 3px solid var(--rarity-color);
}

.duplicate-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.mineral-emoji {
  font-size: 40px;
  flex-shrink: 0;
}

.mineral-info {
  min-width: 0;
}

.mineral-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.rarity-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  display: inline-block;
  margin-bottom: 6px;
}

.mineral-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.duplicate-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.exchange-value {
  text-align: center;
}

.value-points {
  font-size: 18px;
  font-weight: 700;
  color: #0ea5e9;
  display: block;
}

.value-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.exchange-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.count-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.count-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.count-display {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 24px;
  text-align: center;
}

.exchange-btn {
  padding: 8px 20px;
  font-size: 13px;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.exchange-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.conversion-rules {
  padding: 16px 20px;
  margin-bottom: 16px;
}

.rules-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.rule-rarity {
  font-weight: 600;
}

.rule-arrow {
  color: var(--text-secondary);
}

.rule-cost {
  color: var(--text-secondary);
  margin-left: auto;
  font-size: 12px;
}

.conversion-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.conversion-card {
  padding: 20px;
  border-left: 3px solid var(--from-color);
  border-right: 3px solid var(--to-color);
}

.conversion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.conversion-from,
.conversion-to {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.conversion-emoji {
  font-size: 32px;
}

.conversion-rarity-label {
  font-size: 14px;
  font-weight: 700;
}

.conversion-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.arrow-icon {
  font-size: 24px;
}

.arrow-text {
  font-size: 11px;
  color: var(--text-secondary);
}

.conversion-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.detail-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 10px 12px;
  text-align: center;
}

.detail-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.detail-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-value.highlight {
  color: #22c55e;
}

.detail-value.coin-cost {
  color: #f59e0b;
}

.insufficient-warning {
  text-align: center;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  font-size: 13px;
  color: #ef4444;
  margin-bottom: 12px;
}

.conversion-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  background: linear-gradient(135deg, var(--from-color), var(--to-color));
}

.conversion-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-cost {
  font-size: 12px;
  opacity: 0.8;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  padding: 14px 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-type-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
}

.history-type-badge.duplicate {
  background: rgba(14, 165, 233, 0.15);
  color: #0ea5e9;
}

.history-type-badge.rarity_conversion {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.history-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-mineral {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-emoji {
  font-size: 28px;
}

.history-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.history-rarity {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
}

.history-count {
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.history-result {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
}

.result-item.points {
  color: #0ea5e9;
  font-weight: 600;
}

.result-item.coins {
  color: #f59e0b;
  font-weight: 600;
}

.result-item.tax {
  color: #ef4444;
}

.result-item.received {
  color: #22c55e;
  font-weight: 600;
}

.history-conversion {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.conv-rarity {
  font-size: 14px;
  font-weight: 700;
}

.conv-arrow {
  font-size: 16px;
  color: var(--text-secondary);
}

.history-exchanged {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.exchanged-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
}

.new-tag {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
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
  max-width: 420px;
  padding: 0;
  overflow: hidden;
}

.risk-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  align-items: flex-start;
}

.warning-item.warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.warning-item.critical {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-content {
  min-width: 0;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.warning-message {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  flex: 1;
}

.confirm-btn {
  flex: 1;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
}

.confirm-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.result-modal {
  padding: 32px 24px;
  text-align: center;
}

.result-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 12px;
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
  margin: 0 0 20px 0;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.result-details .result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.result-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.result-value {
  font-size: 16px;
  font-weight: 700;
}

.result-value.points {
  color: #0ea5e9;
}

.result-value.coins {
  color: #f59e0b;
}

.result-value.tax {
  color: #ef4444;
}

.received-mineral {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(14, 165, 233, 0.1));
  border-radius: 14px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  margin-bottom: 12px;
}

.received-emoji {
  font-size: 48px;
}

.received-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.received-rarity {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  display: inline-block;
}

.new-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #000;
  font-size: 12px;
  font-weight: 700;
}

.continue-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  background: linear-gradient(135deg, var(--primary), #a855f7);
}

@media (max-width: 480px) {
  .exchange-header {
    flex-direction: column;
    gap: 12px;
  }

  .duplicate-card {
    flex-direction: column;
    align-items: stretch;
  }

  .duplicate-left {
    margin-bottom: 12px;
  }

  .duplicate-right {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .tab-btn {
    padding: 8px 6px;
    font-size: 12px;
  }

  .conversion-details {
    grid-template-columns: 1fr;
  }
}
</style>
