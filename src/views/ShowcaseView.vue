<template>
  <div class="showcase-view">
    <div class="showcase-header">
      <div class="header-content">
        <h1 class="page-title">矿物展柜</h1>
        <p class="page-subtitle">收集精美的矿物标本，探索地球的宝藏</p>
      </div>
    </div>

    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ progress.collected }}/{{ progress.total }}</div>
          <div class="stat-label">收集进度</div>
        </div>
        <div class="stat-bar">
          <div class="stat-fill" :style="{ width: `${progress.percentage}%` }"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🪙</div>
        <div class="stat-info">
          <div class="stat-value">{{ gameStore.coins }}</div>
          <div class="stat-label">金币</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎨</div>
        <div class="stat-info">
          <div class="stat-value">{{ gameStore.totalCollages }}</div>
          <div class="stat-label">拼装次数</div>
        </div>
      </div>
    </div>

    <div class="task-overview" @click="goToTasks">
      <div class="task-overview-header">
        <h3 class="overview-title">⛏️ 任务中心</h3>
        <span v-if="taskClaimableCount > 0" class="overview-badge">{{ taskClaimableCount }} 个奖励可领</span>
        <span v-else class="overview-arrow">→</span>
      </div>
      <div class="task-overview-body">
        <div class="overview-item">
          <span class="overview-item-label">📋 每日</span>
          <div class="overview-progress-bar">
            <div class="overview-progress-fill daily" :style="{ width: dailyCompletionRate + '%' }"></div>
          </div>
          <span class="overview-percent">{{ dailyCompletionRate }}%</span>
        </div>
        <div class="overview-item">
          <span class="overview-item-label">🎯 周目标</span>
          <div class="overview-progress-bar">
            <div class="overview-progress-fill weekly" :style="{ width: weeklyCompletionRate + '%' }"></div>
          </div>
          <span class="overview-percent">{{ weeklyCompletionRate }}%</span>
        </div>
        <div class="overview-item">
          <span class="overview-item-label">🏅 徽章</span>
          <span class="overview-badge-count">{{ achievementStats.claimed }}/{{ achievementStats.total }}</span>
        </div>
      </div>
    </div>

    <div class="action-section">
      <button class="btn btn-large" @click="startNewCollage">
        <span class="btn-icon">✨</span>
        开始拼装新矿物
      </button>
    </div>

    <div class="collected-section">
      <div class="section-header">
        <h2 class="section-title">已收集标本</h2>
        <span class="section-count">({{ collectedMinerals.length }})</span>
      </div>
      
      <div v-if="collectedMinerals.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p class="empty-text">还没有收集到任何矿物</p>
        <p class="empty-hint">点击上方按钮开始你的收集之旅吧！</p>
      </div>

      <div v-else class="minerals-grid">
        <MineralCard
          v-for="mineral in collectedMinerals"
          :key="mineral.id"
          :mineral="mineral"
          :is-collected="true"
          :glow="mineral.rarity === 'legendary'"
          :show-stats="true"
          :is-favorite="museumStore.isFavorite(mineral.id)"
          @click="viewMineralDetail"
        />
      </div>
    </div>

    <div class="recent-section" v-if="recentCollages.length > 0">
      <div class="section-header">
        <h2 class="section-title">最近完成</h2>
      </div>
      <div class="recent-list">
        <div 
          v-for="(collage, index) in recentCollages" 
          :key="index"
          class="recent-item"
        >
          <span class="recent-emoji">{{ collage.mineral.emoji }}</span>
          <div class="recent-info">
            <span class="recent-name">{{ collage.mineral.name }}</span>
            <span class="recent-time">{{ formatTime(collage.completedAt) }}</span>
          </div>
          <span :class="['recent-rarity', `rarity-${collage.mineral.rarity}`]">
            {{ getRarityName(collage.mineral.rarity) }}
          </span>
        </div>
      </div>
    </div>

    <div class="reset-section">
      <button class="btn btn-secondary btn-small" @click="showResetConfirm = true">
        重置进度
      </button>
    </div>

    <div v-if="showResetConfirm" class="confirm-dialog">
      <div class="confirm-content">
        <h3>确认重置？</h3>
        <p>这将清除所有收集进度和数据，此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showResetConfirm = false">取消</button>
          <button class="btn" @click="confirmReset">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MineralCard from '@/components/MineralCard.vue'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useTaskStore } from '@/stores/task'
import { useMuseumStore } from '@/stores/museum'
import { RARITY_CONFIG } from '@/data/rarity'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const taskStore = useTaskStore()
const museumStore = useMuseumStore()

const showResetConfirm = ref(false)

const progress = computed(() => gameStore.collectionProgress)
const taskClaimableCount = computed(() => taskStore.claimableCount)
const dailyCompletionRate = computed(() => taskStore.dailyCompletionRate)
const weeklyCompletionRate = computed(() => taskStore.weeklyCompletionRate)
const achievementStats = computed(() => taskStore.totalAchievementCount)

const collectedMinerals = computed(() => {
  return [...gameStore.collectedMinerals].sort((a, b) => {
    const rarityOrder = { legenday: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
    return (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5)
  })
})

const recentCollages = computed(() => {
  return [...gameStore.completedCollages].reverse().slice(0, 5)
})

const getRarityName = (rarity) => RARITY_CONFIG[rarity]?.name || ''

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

const startNewCollage = () => {
  audioStore.playClick()
  audioStore.initAudioContext()
  router.push('/collage')
}

const goToTasks = () => {
  audioStore.playClick()
  router.push('/task')
}

const viewMineralDetail = (mineral) => {
  audioStore.playClick()
  router.push(`/mineral/${mineral.id}`)
}

const confirmReset = () => {
  audioStore.playClick()
  gameStore.resetProgress()
  showResetConfirm.value = false
}
</script>

<style scoped>
.showcase-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.showcase-header {
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

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.action-section {
  margin-bottom: 24px;
}

.task-overview {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-overview:hover {
  border-color: rgba(233, 69, 96, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.task-overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.overview-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.overview-badge {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  padding: 4px 12px;
  border-radius: 10px;
  animation: claimPulse 2s ease-in-out infinite;
}

@keyframes claimPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0); }
  50% { box-shadow: 0 0 10px 2px rgba(233, 69, 96, 0.3); }
}

.overview-arrow {
  font-size: 18px;
  color: var(--text-secondary);
}

.task-overview-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.overview-item-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 56px;
}

.overview-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.overview-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.overview-progress-fill.daily {
  background: linear-gradient(90deg, var(--primary), #ff6b6b);
}

.overview-progress-fill.weekly {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.overview-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 32px;
  text-align: right;
}

.overview-badge-count {
  font-size: 13px;
  font-weight: 700;
  color: #f59e0b;
}

.btn-large {
  width: 100%;
  padding: 18px;
  font-size: 18px;
  gap: 10px;
}

.btn-icon {
  font-size: 22px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.collected-section {
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.minerals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.recent-section {
  margin-bottom: 24px;
}

.recent-list {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-emoji {
  font-size: 28px;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recent-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.recent-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.recent-rarity {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
}

.reset-section {
  text-align: center;
  margin-top: 24px;
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.confirm-content {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-content h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.confirm-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-actions .btn {
  flex: 1;
}

@media (min-width: 600px) {
  .minerals-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .minerals-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .stats-section {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
