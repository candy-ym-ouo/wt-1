<template>
  <div class="discovery-log">
    <div class="log-header">
      <div class="log-stats">
        <div class="stat-card">
          <span class="stat-icon">📜</span>
          <span class="stat-value">{{ gameStore.discoveryLogs.length }}</span>
          <span class="stat-label">总记录</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✨</span>
          <span class="stat-value">{{ newDiscoveryCount }}</span>
          <span class="stat-label">首次发现</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💰</span>
          <span class="stat-value">{{ totalCoinsEarned }}</span>
          <span class="stat-label">累计金币</span>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-tabs">
        <button 
          v-for="filter in sourceFilters" 
          :key="filter.value"
          :class="['filter-btn', { active: activeSource === filter.value }]"
          @click="activeSource = filter.value"
        >
          <span v-if="filter.icon">{{ filter.icon }}</span>
          {{ filter.label }}
        </button>
      </div>
      <div class="filter-tabs rarity-filters">
        <button 
          v-for="filter in rarityFilters" 
          :key="filter.value"
          :class="['filter-btn rarity-btn', { active: activeRarity === filter.value }]"
          :style="activeRarity === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="activeRarity = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div class="timeline-container" v-if="groupedLogs.length > 0">
      <div v-for="(group, dateKey) in groupedLogs" :key="dateKey" class="date-group">
        <div class="date-header">
          <div class="date-dot"></div>
          <span class="date-text">{{ formatDateHeader(dateKey) }}</span>
          <span class="date-count">{{ group.length }} 条记录</span>
        </div>
        
        <div class="timeline-items">
          <div 
            v-for="log in group" 
            :key="log.id"
            class="timeline-item"
            :class="`rarity-${log.rarity}`"
            @click="handleLogClick(log)"
          >
            <div class="timeline-line"></div>
            <div class="timeline-dot" :style="{ background: log.sourceColor }">
              <span class="dot-icon">{{ log.sourceIcon }}</span>
            </div>
            
            <div class="log-card">
              <div class="log-header-row">
                <div class="log-mineral">
                  <span class="mineral-emoji">{{ log.mineralEmoji }}</span>
                  <div class="mineral-info">
                    <span class="mineral-name">{{ log.mineralName }}</span>
                    <span class="mineral-rarity">{{ getRarityName(log.rarity) }}</span>
                  </div>
                </div>
                <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              </div>

              <div class="log-source">
                <span class="source-badge" :style="{ background: log.sourceColor + '22', color: log.sourceColor }">
                  {{ log.sourceIcon }} {{ log.sourceName }}
                </span>
                <span class="new-badge" v-if="log.rewards.isNew">🎉 首次发现</span>
              </div>

              <div class="log-events" v-if="log.keyEvents && log.keyEvents.length > 0">
                <span 
                  v-for="(event, idx) in log.keyEvents" 
                  :key="idx"
                  class="event-tag"
                >
                  {{ event }}
                </span>
              </div>

              <div class="log-source-data" v-if="hasSourceData(log)">
                <div class="source-data-item" v-if="log.sourceData.locationName">
                  <span class="data-icon">📍</span>
                  <span>{{ log.sourceData.locationName }}</span>
                </div>
                <div class="source-data-item" v-if="log.sourceData.boxName">
                  <span class="data-icon">🎁</span>
                  <span>{{ log.sourceData.boxName }}</span>
                  <span v-if="log.sourceData.isPity" class="pity-tag">保底</span>
                </div>
                <div class="source-data-item" v-if="log.sourceData.timeTaken">
                  <span class="data-icon">⏱️</span>
                  <span>用时 {{ log.sourceData.timeTaken }}s</span>
                </div>
                <div class="source-data-item" v-if="log.sourceData.seasonName">
                  <span class="data-icon">🏆</span>
                  <span>{{ log.sourceData.seasonName }} · Tier {{ log.sourceData.tier }}</span>
                </div>
                <div class="source-data-item" v-if="log.sourceData.price">
                  <span class="data-icon">💰</span>
                  <span>购买价 {{ log.sourceData.price }}</span>
                </div>
              </div>

              <div class="log-rewards">
                <div class="reward-item" v-if="log.rewards.coins > 0">
                  <span class="reward-icon">💰</span>
                  <span class="reward-value">+{{ log.rewards.coins }}</span>
                </div>
                <div class="reward-item" v-if="log.rewards.exp > 0">
                  <span class="reward-icon">⭐</span>
                  <span class="reward-value">+{{ log.rewards.exp }} EXP</span>
                </div>
              </div>

              <div class="log-action">
                <span class="action-text">查看详情 →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <p class="empty-title">暂无发现记录</p>
      <p class="empty-desc">开始拼装或探险来记录你的矿物发现历程</p>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedLog" class="log-modal-overlay" @click.self="closeModal">
          <div class="log-modal">
            <div class="modal-header" :class="`rarity-${selectedLog.rarity}`">
              <button class="close-btn" @click="closeModal">×</button>
              <div class="modal-mineral-info">
                <span class="modal-emoji">{{ selectedLog.mineralEmoji }}</span>
                <div>
                  <h2 class="modal-title">{{ selectedLog.mineralName }}</h2>
                  <p class="modal-subtitle">{{ getRarityName(selectedLog.rarity) }} · {{ selectedLog.sourceName }}</p>
                </div>
              </div>
            </div>
            
            <div class="modal-body">
              <div class="detail-section">
                <h3 class="detail-title">📋 发现详情</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">发现时间</span>
                    <span class="detail-value">{{ formatFullTime(selectedLog.timestamp) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">来源途径</span>
                    <span class="detail-value" :style="{ color: selectedLog.sourceColor }">
                      {{ selectedLog.sourceIcon }} {{ selectedLog.sourceName }}
                    </span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.rewards.isNew">
                    <span class="detail-label">发现类型</span>
                    <span class="detail-value new">🎉 首次发现</span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.sourceData.locationName">
                    <span class="detail-label">探险地点</span>
                    <span class="detail-value">{{ selectedLog.sourceData.locationName }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.sourceData.boxName">
                    <span class="detail-label">盲盒类型</span>
                    <span class="detail-value">{{ selectedLog.sourceData.boxName }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedLog.sourceData.timeTaken">
                    <span class="detail-label">拼装用时</span>
                    <span class="detail-value">{{ selectedLog.sourceData.timeTaken }} 秒</span>
                  </div>
                </div>
              </div>

              <div class="detail-section" v-if="selectedLog.keyEvents && selectedLog.keyEvents.length > 0">
                <h3 class="detail-title">✨ 关键事件</h3>
                <div class="events-list">
                  <div v-for="(event, idx) in selectedLog.keyEvents" :key="idx" class="event-item">
                    <span class="event-dot"></span>
                    <span class="event-text">{{ event }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3 class="detail-title">🎁 获得奖励</h3>
                <div class="rewards-summary">
                  <div class="reward-summary-item" v-if="selectedLog.rewards.coins > 0">
                    <span class="reward-icon-large">💰</span>
                    <div>
                      <span class="reward-value-large">+{{ selectedLog.rewards.coins }}</span>
                      <span class="reward-label">金币</span>
                    </div>
                  </div>
                  <div class="reward-summary-item" v-if="selectedLog.rewards.exp > 0">
                    <span class="reward-icon-large">⭐</span>
                    <div>
                      <span class="reward-value-large">+{{ selectedLog.rewards.exp }}</span>
                      <span class="reward-label">经验值</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeModal">关闭</button>
              <button class="btn" @click="goToMineralDetail">
                <span class="btn-icon">🔍</span>
                查看矿物详情
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()

const activeSource = ref('all')
const activeRarity = ref('all')
const selectedLog = ref(null)

const sourceFilters = [
  { label: '全部', value: 'all', icon: '📋' },
  { label: '拼装', value: 'collage', icon: '🎨' },
  { label: '探险', value: 'expedition', icon: '🗺️' },
  { label: '盲盒', value: 'gacha', icon: '🎁' },
  { label: '市场', value: 'market', icon: '🏪' },
  { label: '交换', value: 'exchange', icon: '🔄' },
  { label: '赛季', value: 'season', icon: '🏆' },
  { label: '问答', value: 'quiz', icon: '❓' }
]

const rarityFilters = [
  { label: '全部', value: 'all', color: '#6b7280' },
  { label: '传说', value: RARITY.LEGENDARY, color: '#f59e0b' },
  { label: '史诗', value: RARITY.EPIC, color: '#a855f7' },
  { label: '珍稀', value: RARITY.RARE, color: '#3b82f6' },
  { label: '稀有', value: RARITY.UNCOMMON, color: '#22c55e' },
  { label: '普通', value: RARITY.COMMON, color: '#9ca3af' }
]

const filteredLogs = computed(() => {
  return gameStore.getDiscoveryLogs({
    source: activeSource.value === 'all' ? null : activeSource.value,
    rarity: activeRarity.value === 'all' ? null : activeRarity.value
  })
})

const groupedLogs = computed(() => {
  const groups = {}
  for (const log of filteredLogs.value) {
    const date = new Date(log.timestamp)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(log)
  }
  return groups
})

const newDiscoveryCount = computed(() => {
  return gameStore.discoveryLogs.filter(l => l.rewards.isNew).length
})

const totalCoinsEarned = computed(() => {
  return gameStore.discoveryLogs.reduce((sum, log) => sum + (log.rewards.coins || 0), 0)
})

const getRarityName = (rarity) => {
  return RARITY_CONFIG[rarity]?.name || rarity
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatFullTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDateHeader = (dateKey) => {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  
  if (dateKey === todayKey) return '今天'
  if (dateKey === yesterdayKey) return '昨天'
  
  const date = new Date(dateKey)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
}

const hasSourceData = (log) => {
  return log.sourceData && Object.keys(log.sourceData).some(k => 
    ['locationName', 'boxName', 'timeTaken', 'seasonName', 'price'].includes(k)
  )
}

const handleLogClick = (log) => {
  audioStore.playClick()
  selectedLog.value = log
}

const closeModal = () => {
  audioStore.playClick()
  selectedLog.value = null
}

const goToMineralDetail = () => {
  if (selectedLog.value) {
    audioStore.playClick()
    router.push(`/mineral/${selectedLog.value.mineralId}`)
    closeModal()
  }
}
</script>

<style scoped>
.discovery-log {
  padding: 16px 0;
}

.log-header {
  margin-bottom: 20px;
}

.log-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  display: block;
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.filter-section {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 12px;
}

.filter-tabs.rarity-filters {
  margin-bottom: 0;
}

.filter-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.filter-btn.rarity-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.timeline-container {
  position: relative;
}

.date-group {
  margin-bottom: 24px;
}

.date-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  position: sticky;
  top: 60px;
  z-index: 10;
  padding: 8px 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
}

.date-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary);
}

.date-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.date-count {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.timeline-items {
  position: relative;
  padding-left: 28px;
}

.timeline-items::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--primary), transparent);
}

.timeline-item {
  position: relative;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timeline-item:hover {
  transform: translateX(4px);
}

.timeline-line {
  position: absolute;
  left: -22px;
  top: 20px;
  width: 16px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.timeline-dot {
  position: absolute;
  left: -34px;
  top: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dot-icon {
  font-size: 12px;
}

.log-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.timeline-item:hover .log-card {
  border-color: rgba(233, 69, 96, 0.3);
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.1);
}

.timeline-item.rarity-legendary .log-card {
  border-color: rgba(245, 158, 11, 0.3);
}

.timeline-item.rarity-epic .log-card {
  border-color: rgba(168, 85, 247, 0.2);
}

.log-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.log-mineral {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mineral-emoji {
  font-size: 36px;
}

.mineral-info {
  display: flex;
  flex-direction: column;
}

.mineral-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.mineral-rarity {
  font-size: 11px;
  color: var(--text-secondary);
}

.log-time {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.log-source {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.source-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.new-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.log-events {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.event-tag {
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.log-source-data {
  margin-bottom: 10px;
}

.source-data-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.data-icon {
  font-size: 12px;
}

.pity-tag {
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 10px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  margin-left: 4px;
}

.log-rewards {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reward-icon {
  font-size: 14px;
}

.reward-value {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.log-action {
  text-align: right;
}

.action-text {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.log-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.log-modal {
  background: var(--bg-card);
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  padding: 20px;
  position: relative;
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(139, 92, 246, 0.2));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header.rarity-legendary {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2));
}

.modal-header.rarity-epic {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2));
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.5);
  transform: rotate(90deg);
}

.modal-mineral-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-emoji {
  font-size: 56px;
}

.modal-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.modal-body {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 10px;
}

.detail-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.detail-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-value.new {
  color: #22c55e;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  border-left: 3px solid #fbbf24;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  flex-shrink: 0;
}

.event-text {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.rewards-summary {
  display: flex;
  gap: 16px;
}

.reward-summary-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.reward-icon-large {
  font-size: 32px;
}

.reward-value-large {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #fbbf24;
  line-height: 1;
}

.reward-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-footer .btn {
  flex: 1;
}

.btn-icon {
  margin-right: 6px;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .log-modal,
.modal-leave-to .log-modal {
  transform: scale(0.9) translateY(20px);
}

@media (max-width: 480px) {
  .log-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .stat-card {
    padding: 12px 8px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .rewards-summary {
    flex-direction: column;
  }
}
</style>
