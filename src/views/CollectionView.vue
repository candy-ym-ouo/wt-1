<template>
  <div class="collection-view">
    <div class="collection-header">
      <div class="header-content">
        <h1 class="page-title">矿物图鉴</h1>
        <p class="page-subtitle">探索矿物的奥秘，了解它们的特性与传说</p>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-card">
        <div class="progress-info">
          <span class="progress-label">收集进度</span>
          <span class="progress-value">{{ progress.collected }}/{{ progress.total }}</span>
        </div>
        <div class="progress-bar-large">
          <div class="progress-fill" :style="{ width: `${progress.percentage}%` }"></div>
        </div>
        <div class="progress-text">{{ progress.percentage }}% 完成</div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-tabs">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          :class="['filter-btn', { active: activeFilter === filter.value }]"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
      <div class="view-toggle">
        <button 
          :class="['toggle-btn', { active: viewMode === 'grid' }]"
          @click="viewMode = 'grid'"
        >
          网格
        </button>
        <button 
          :class="['toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
        >
          列表
        </button>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn btn-small" @click="goToMarket">
        <span class="btn-icon">🏪</span>
        前往市场
      </button>
      <button
        class="btn btn-secondary btn-small"
        @click="openListModal"
        :disabled="gameStore.collectedMinerals.length === 0"
      >
        <span class="btn-icon">📤</span>
        上架矿物
      </button>
      <button
        class="btn btn-small exchange-entry-btn"
        @click="goToExchange"
      >
        <span class="btn-icon">🔄</span>
        交换站
      </button>
    </div>

    <div class="rarity-legend">
      <div 
        v-for="(config, rarity) in RARITY_CONFIG" 
        :key="rarity"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ background: config.color }"></span>
        <span :class="`rarity-${rarity}`">{{ config.name }}</span>
        <span class="legend-count">{{ getRarityCount(rarity) }}</span>
      </div>
    </div>

    <div class="minerals-container">
      <div v-if="filteredMinerals.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p class="empty-text">没有找到符合条件的矿物</p>
      </div>

      <div v-else-if="viewMode === 'grid'" class="minerals-grid">
        <MineralCard
          v-for="mineral in filteredMinerals"
          :key="mineral.id"
          :mineral="mineral"
          :is-collected="isMineralCollected(mineral.id)"
          :show-locked="true"
          :glow="isMineralCollected(mineral.id) && mineral.rarity === 'legendary'"
          @click="viewMineralDetail"
        />
      </div>

      <div v-else class="minerals-list">
        <div 
          v-for="mineral in filteredMinerals"
          :key="mineral.id"
          :class="['list-item', { collected: isMineralCollected(mineral.id) }]"
          @click="viewMineralDetail(mineral)"
        >
          <span class="item-emoji">{{ isMineralCollected(mineral.id) ? mineral.emoji : '❓' }}</span>
          <div class="item-content">
            <div class="item-header">
              <h3 class="item-name">{{ isMineralCollected(mineral.id) ? mineral.name : '???' }}</h3>
              <span :class="['item-rarity', `rarity-${mineral.rarity}`]">
                {{ RARITY_CONFIG[mineral.rarity].name }}
              </span>
            </div>
            <p class="item-desc">
              {{ isMineralCollected(mineral.id) ? mineral.description.slice(0, 50) + '...' : '完成拼装解锁详情' }}
            </p>
            <div class="item-meta" v-if="isMineralCollected(mineral.id)">
              <span class="meta-item">化学式: {{ mineral.formula }}</span>
              <span class="meta-item">硬度: {{ mineral.hardness }}</span>
              <span class="meta-item">数量: {{ getMineralCount(mineral.id) }}</span>
            </div>
          </div>
          <div class="item-actions" v-if="isMineralCollected(mineral.id)" @click.stop>
            <button 
              class="btn btn-small list-btn" 
              @click="listMineral(mineral)"
              :disabled="getMineralCount(mineral.id) < 1"
            >
              📤 上架
            </button>
          </div>
          <span class="item-arrow" v-else>›</span>
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
import { useMarketStore } from '@/stores/market'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import { MINERALS } from '@/data/minerals'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()

const activeFilter = ref('all')
const viewMode = ref('grid')

const filters = [
  { label: '全部', value: 'all' },
  { label: '已收集', value: 'collected' },
  { label: '未收集', value: 'uncollected' },
  { label: '传说', value: RARITY.LEGENDARY },
  { label: '史诗', value: RARITY.EPIC },
  { label: '珍稀', value: RARITY.RARE }
]

const progress = computed(() => gameStore.collectionProgress)

const filteredMinerals = computed(() => {
  let minerals = [...MINERALS].sort((a, b) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })

  if (activeFilter.value === 'collected') {
    minerals = minerals.filter(m => gameStore.isMineralCollected(m.id))
  } else if (activeFilter.value === 'uncollected') {
    minerals = minerals.filter(m => !gameStore.isMineralCollected(m.id))
  } else if (activeFilter.value !== 'all') {
    minerals = minerals.filter(m => m.rarity === activeFilter.value)
  }

  return minerals
})

const isMineralCollected = (id) => gameStore.isMineralCollected(id)

const getRarityCount = (rarity) => {
  const total = MINERALS.filter(m => m.rarity === rarity).length
  const collected = MINERALS.filter(m => m.rarity === rarity && gameStore.isMineralCollected(m.id)).length
  return `${collected}/${total}`
}

const viewMineralDetail = (mineral) => {
  if (!isMineralCollected(mineral.id)) {
    audioStore.playError()
    return
  }
  audioStore.playClick()
  router.push(`/mineral/${mineral.id}`)
}

const getMineralCount = (id) => {
  const m = gameStore.collectedMinerals.find(m => m.id === id)
  return m?.count || 0
}

const goToMarket = () => {
  audioStore.playClick()
  router.push('/market')
}

const goToExchange = () => {
  audioStore.playClick()
  router.push('/exchange')
}

const openListModal = () => {
  audioStore.playClick()
  router.push('/market')
  setTimeout(() => {
    marketStore.openListModal()
  }, 100)
}

const listMineral = (mineral) => {
  audioStore.playClick()
  router.push('/market')
  setTimeout(() => {
    marketStore.openListModal(mineral)
  }, 100)
}
</script>

<style scoped>
.collection-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.collection-header {
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

.progress-section {
  margin-bottom: 20px;
}

.progress-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-bar-large {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b, #ffd700);
  border-radius: 6px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  background-size: 50px 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -50px 0; }
  100% { background-position: calc(100% + 50px) 0; }
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 4px;
}

.filter-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
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

.view-toggle {
  display: flex;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: var(--primary);
  color: white;
}

.rarity-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-count {
  color: var(--text-secondary);
  font-size: 11px;
}

.minerals-container {
  min-height: 200px;
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
}

.minerals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.minerals-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.list-item:hover {
  transform: translateX(4px);
  border-color: rgba(233, 69, 96, 0.3);
}

.list-item.collected {
  cursor: pointer;
}

.list-item:not(.collected) {
  opacity: 0.6;
  cursor: not-allowed;
}

.list-item:not(.collected):hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.1);
}

.item-emoji {
  font-size: 40px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.item-rarity {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.item-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.item-arrow {
  font-size: 24px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.list-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-bar .btn {
  flex: 1;
}

.exchange-entry-btn {
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
}

.exchange-entry-btn:hover {
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.6);
}

.btn-icon {
  margin-right: 6px;
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
}

@media (max-width: 480px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-tabs {
    justify-content: flex-start;
  }
  
  .view-toggle {
    justify-content: center;
  }
  
  .rarity-legend {
    gap: 8px;
  }
}
</style>
