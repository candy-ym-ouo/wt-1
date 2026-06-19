<template>
  <div class="warehouse-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">🏭 矿物仓储</h1>
        <p class="page-subtitle">管理您的矿物藏品，追踪来源，智能分类</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-small" @click="goToCollection">
          <span class="btn-icon">📖</span>
          图鉴
        </button>
        <button 
          :class="['btn btn-small', { 'btn-primary': !warehouseStore.batchMode, 'btn-warning': warehouseStore.batchMode }]"
          @click="toggleBatchMode"
        >
          <span class="btn-icon">{{ warehouseStore.batchMode ? '✓' : '☑️' }}</span>
          {{ warehouseStore.batchMode ? '退出批量' : '批量操作' }}
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <span class="stat-value">{{ warehouseStore.stats.totalTypes }}</span>
          <span class="stat-label">矿物种类</span>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">💎</div>
        <div class="stat-content">
          <span class="stat-value">{{ warehouseStore.stats.totalSpecimens }}</span>
          <span class="stat-label">标本总数</span>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <span class="stat-value">{{ warehouseStore.stats.duplicateCount }}</span>
          <span class="stat-label">重复标本</span>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <span class="stat-value">{{ formatNumber(warehouseStore.stats.totalValue) }}</span>
          <span class="stat-label">估值</span>
        </div>
      </div>
    </div>

    <div class="source-stats-section card" v-if="warehouseStore.stats.totalSpecimens > 0">
      <h3 class="section-title">
        <span class="title-icon">📊</span>
        来源分布
      </h3>
      <div class="source-bars">
        <div 
          v-for="(count, source) in warehouseStore.stats.sourceStats" 
          :key="source"
          class="source-bar-row"
          @click="toggleSourceFilter(source)"
        >
          <div class="source-info">
            <span class="source-emoji">{{ SOURCE_CONFIG[source]?.emoji }}</span>
            <span class="source-name">{{ SOURCE_CONFIG[source]?.name }}</span>
          </div>
          <div class="bar-container">
            <div 
              class="bar-fill" 
              :style="{ 
                width: getSourcePercent(count) + '%',
                background: SOURCE_CONFIG[source]?.color 
              }"
            ></div>
          </div>
          <span class="source-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <div class="filter-section card">
      <div class="filter-header">
        <h3 class="section-title">
          <span class="title-icon">🔍</span>
          筛选与排序
        </h3>
        <button class="clear-btn" @click="clearAllFilters" v-if="hasActiveFilters">
          清除筛选
        </button>
      </div>

      <div class="search-row">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="search-input"
            placeholder="搜索矿物名称、化学式..."
            :value="warehouseStore.activeFilters.searchText"
            @input="handleSearch"
          />
        </div>
      </div>

      <div class="filter-groups">
        <div class="filter-group">
          <span class="group-label">稀有度</span>
          <div class="filter-chips">
            <button 
              v-for="(config, rarity) in RARITY_CONFIG" 
              :key="rarity"
              :class="[
                'filter-chip', 
                `rarity-${rarity}`,
                { active: warehouseStore.activeFilters.rarity.includes(rarity) }
              ]"
              @click="toggleRarityFilter(rarity)"
            >
              {{ config.name }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <span class="group-label">来源</span>
          <div class="filter-chips">
            <button 
              v-for="(config, source) in SOURCE_CONFIG" 
              :key="source"
              :class="[
                'filter-chip', 
                { active: warehouseStore.activeFilters.source.includes(source) }
              ]"
              :style="warehouseStore.activeFilters.source.includes(source) ? { background: config.color, borderColor: config.color } : {}"
              @click="toggleSourceFilter(source)"
            >
              <span class="chip-emoji">{{ config.emoji }}</span>
              {{ config.name }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <span class="group-label">数量</span>
          <div class="filter-chips">
            <button 
              v-for="opt in countFilterOptions" 
              :key="opt.value"
              :class="[
                'filter-chip', 
                { active: warehouseStore.activeFilters.minCount === opt.value }
              ]"
              @click="setMinCount(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <span class="group-label">排序</span>
          <select 
            class="sort-select"
            :value="warehouseStore.sortBy"
            @change="handleSortChange"
          >
            <option 
              v-for="opt in SORT_OPTIONS" 
              :key="opt.value" 
              :value="opt.value"
            >
              {{ opt.icon }} {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="quick-filters">
        <button 
          :class="['quick-filter-btn', { active: warehouseStore.activeFilters.hasDuplicates }]"
          @click="toggleDuplicateFilter"
        >
          <span>🎯</span> 仅显示重复
        </button>
        <button 
          :class="['quick-filter-btn', { active: warehouseStore.sortBy === 'favorite' }]"
          @click="setSortByFavorite"
        >
          <span>❤️</span> 收藏优先
        </button>
      </div>
    </div>

    <div class="batch-actions-bar" v-if="warehouseStore.batchMode">
      <div class="batch-info">
        <span class="batch-count">已选 {{ warehouseStore.selectedMineralIds.length }} 项</span>
        <button class="text-btn" @click="selectAll">全选</button>
        <button class="text-btn" @click="clearSelection">清空</button>
      </div>
      <div class="batch-buttons">
        <button class="btn btn-small btn-secondary" @click="batchListToMarket">
          <span class="btn-icon">📤</span> 批量上架
        </button>
        <button class="btn btn-small" @click="batchGoToExchange">
          <span class="btn-icon">🔄</span> 批量交换
        </button>
      </div>
    </div>

    <div class="duplicates-section" v-if="warehouseStore.duplicateGroups.length > 0 && warehouseStore.groupByDuplicates">
      <div class="section-header-row">
        <h3 class="section-title">
          <span class="title-icon">📚</span>
          重复标本分组
        </h3>
        <button 
          class="toggle-group-btn"
          @click="warehouseStore.toggleGroupByDuplicates()"
        >
          {{ warehouseStore.groupByDuplicates ? '收起' : '展开' }}
        </button>
      </div>
      <div class="duplicates-grid">
        <div 
          v-for="mineral in warehouseStore.duplicateGroups.slice(0, 6)" 
          :key="mineral.id"
          class="duplicate-group-card"
          :class="`rarity-${mineral.rarity}`"
          @click="viewDetail(mineral)"
        >
          <div class="duplicate-main">
            <span class="duplicate-emoji">{{ mineral.emoji }}</span>
            <div class="duplicate-info">
              <span class="duplicate-name">{{ mineral.name }}</span>
              <span class="duplicate-count">×{{ mineral.count }} 个</span>
            </div>
          </div>
          <div class="duplicate-source-tags">
            <span 
              v-for="(count, source) in mineral.sourceBreakdown" 
              :key="source"
              class="source-tag"
              :style="{ background: SOURCE_CONFIG[source]?.color + '33', color: SOURCE_CONFIG[source]?.color }"
            >
              {{ SOURCE_CONFIG[source]?.emoji }} {{ count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="list-section">
      <div class="section-header-row">
        <h3 class="section-title">
          <span class="title-icon">📋</span>
          矿物列表
          <span class="list-count">({{ warehouseStore.filteredMinerals.length }})</span>
        </h3>
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

      <div v-if="warehouseStore.filteredMinerals.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">没有找到符合条件的矿物</p>
        <button class="btn btn-small" @click="clearAllFilters">清除筛选</button>
      </div>

      <div v-else-if="viewMode === 'grid'" class="minerals-grid">
        <div 
          v-for="mineral in warehouseStore.filteredMinerals" 
          :key="mineral.id"
          :class="[
            'warehouse-card',
            `rarity-${mineral.rarity}`,
            { 
              selected: warehouseStore.selectedMineralIds.includes(mineral.id),
              favorite: mineral.isFavorite
            }
          ]"
          @click="handleCardClick(mineral)"
        >
          <div v-if="warehouseStore.batchMode" class="checkbox-overlay" @click.stop>
            <div :class="['custom-checkbox', { checked: warehouseStore.selectedMineralIds.includes(mineral.id) }]">
              <span v-if="warehouseStore.selectedMineralIds.includes(mineral.id)">✓</span>
            </div>
          </div>
          
          <div v-if="mineral.isFavorite" class="fav-badge">❤️</div>
          
          <div class="card-emoji">{{ mineral.emoji }}</div>
          <div class="card-content">
            <h4 class="card-name">{{ mineral.name }}</h4>
            <div class="card-meta">
              <span class="rarity-tag" :style="{ color: RARITY_CONFIG[mineral.rarity].color }">
                {{ RARITY_CONFIG[mineral.rarity].name }}
              </span>
              <span class="count-badge">×{{ mineral.count }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="source-mini-tags">
              <span 
                v-for="(count, source) in mineral.sourceBreakdown" 
                :key="source"
                class="source-mini-tag"
                :title="SOURCE_CONFIG[source]?.name"
              >
                {{ SOURCE_CONFIG[source]?.emoji }}{{ count }}
              </span>
            </div>
            <div class="card-value" :title="`估值 ${mineral.estimatedValue} 金币`">
              💰 {{ formatNumber(mineral.estimatedValue) }}
            </div>
          </div>

          <div class="card-glow" :style="{ background: RARITY_CONFIG[mineral.rarity].color + '40' }"></div>
        </div>
      </div>

      <div v-else class="minerals-list">
        <div 
          v-for="mineral in warehouseStore.filteredMinerals" 
          :key="mineral.id"
          :class="[
            'list-item',
            `rarity-${mineral.rarity}`,
            { 
              selected: warehouseStore.selectedMineralIds.includes(mineral.id),
              favorite: mineral.isFavorite
            }
          ]"
          @click="handleCardClick(mineral)"
        >
          <div v-if="warehouseStore.batchMode" class="list-checkbox" @click.stop>
            <div :class="['custom-checkbox', { checked: warehouseStore.selectedMineralIds.includes(mineral.id) }]">
              <span v-if="warehouseStore.selectedMineralIds.includes(mineral.id)">✓</span>
            </div>
          </div>

          <span class="item-emoji">{{ mineral.emoji }}</span>
          
          <div class="item-content">
            <div class="item-header">
              <h3 class="item-name">
                {{ mineral.name }}
                <span v-if="mineral.isFavorite" class="fav-icon">❤️</span>
              </h3>
              <span :class="['item-rarity', `rarity-${mineral.rarity}`]">
                {{ RARITY_CONFIG[mineral.rarity].name }}
              </span>
            </div>
            <div class="item-meta-row">
              <span class="meta-item">
                <span class="meta-icon">⚗️</span> {{ mineral.formula }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">💎</span> 硬度 {{ mineral.hardness }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">📦</span> ×{{ mineral.count }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">💰</span> {{ formatNumber(mineral.estimatedValue) }}
              </span>
            </div>
            <div class="item-sources">
              <span class="sources-label">来源:</span>
              <span 
                v-for="(count, source) in mineral.sourceBreakdown" 
                :key="source"
                class="source-tag"
                :style="{ background: SOURCE_CONFIG[source]?.color + '33', color: SOURCE_CONFIG[source]?.color }"
              >
                {{ SOURCE_CONFIG[source]?.emoji }} {{ SOURCE_CONFIG[source]?.name }} ×{{ count }}
              </span>
            </div>
            <div class="item-locations" v-if="Object.keys(mineral.locationBreakdown).length > 0">
              <span class="sources-label">产地:</span>
              <span 
                v-for="(count, location) in mineral.locationBreakdown" 
                :key="location"
                class="location-tag"
              >
                📍 {{ location }} ×{{ count }}
              </span>
            </div>
            <div class="item-dates">
              <span class="date-item">
                <span class="meta-icon">📅</span> 
                首次: {{ formatDate(mineral.firstObtainedAt) }}
              </span>
              <span class="date-item">
                <span class="meta-icon">🕐</span> 
                最近: {{ formatDate(mineral.lastObtainedAt) }}
              </span>
            </div>
          </div>

          <div class="item-actions" @click.stop>
            <button class="btn btn-small btn-secondary" @click="goToCollection(mineral)">
              📖 图鉴
            </button>
            <button class="btn btn-small" @click="viewDetail(mineral)">
              详情 →
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSourceModal" class="modal-overlay" @click.self="showSourceModal = false">
          <div class="modal-content source-modal">
            <div class="modal-header">
              <h3 class="modal-title">
                <span class="modal-emoji">{{ selectedMineral?.emoji }}</span>
                {{ selectedMineral?.name }} - 来源追踪
              </h3>
              <button class="close-btn" @click="showSourceModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="source-summary">
                <div class="summary-item">
                  <span class="summary-label">总数</span>
                  <span class="summary-value">{{ selectedMineral?.count }} 个</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">首次获取</span>
                  <span class="summary-value">{{ formatDate(selectedMineral?.firstObtainedAt) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">最近获取</span>
                  <span class="summary-value">{{ formatDate(selectedMineral?.lastObtainedAt) }}</span>
                </div>
              </div>
              
              <div class="source-breakdown-chart">
                <div 
                  v-for="(count, source) in selectedMineral?.sourceBreakdown" 
                  :key="source"
                  class="breakdown-bar"
                >
                  <div class="breakdown-info">
                    <span class="breakdown-emoji">{{ SOURCE_CONFIG[source]?.emoji }}</span>
                    <span class="breakdown-name">{{ SOURCE_CONFIG[source]?.name }}</span>
                  </div>
                  <div class="breakdown-bar-container">
                    <div 
                      class="breakdown-bar-fill"
                      :style="{ 
                        width: (count / (selectedMineral?.count || 1) * 100) + '%',
                        background: SOURCE_CONFIG[source]?.color 
                      }"
                    ></div>
                  </div>
                  <span class="breakdown-count">{{ count }}</span>
                </div>
              </div>

              <div class="source-timeline">
                <h4 class="timeline-title">📜 获取记录</h4>
                <div class="timeline-list">
                  <div 
                    v-for="(source, index) in sortedSources" 
                    :key="index"
                    class="timeline-item"
                  >
                    <div class="timeline-dot" :style="{ background: SOURCE_CONFIG[source.source]?.color }"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-source">
                          {{ SOURCE_CONFIG[source.source]?.emoji }} {{ SOURCE_CONFIG[source.source]?.name }}
                        </span>
                        <span class="timeline-date">{{ formatDateTime(source.obtainedAt) }}</span>
                      </div>
                      <div class="timeline-detail" v-if="source.sourceData?.locationName">
                        📍 {{ source.sourceData.locationName }}
                      </div>
                      <div class="timeline-detail" v-if="source.sourceData?.timeTaken">
                        ⏱️ 用时 {{ source.sourceData.timeTaken }} 秒
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showSourceModal = false">关闭</button>
              <button class="btn" @click="viewDetail(selectedMineral)">查看详情</button>
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
import { useWarehouseStore, SOURCE_CONFIG, SORT_OPTIONS } from '@/stores/warehouse'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useMarketStore } from '@/stores/market'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'

const router = useRouter()
const warehouseStore = useWarehouseStore()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()

const viewMode = ref('grid')
const showSourceModal = ref(false)
const selectedMineral = ref(null)

const countFilterOptions = [
  { label: '全部', value: 1 },
  { label: '≥2', value: 2 },
  { label: '≥5', value: 5 },
  { label: '≥10', value: 10 }
]

const hasActiveFilters = computed(() => {
  return warehouseStore.activeFilters.rarity.length > 0 ||
    warehouseStore.activeFilters.source.length > 0 ||
    warehouseStore.activeFilters.hasDuplicates ||
    warehouseStore.activeFilters.searchText ||
    warehouseStore.activeFilters.minCount > 1 ||
    warehouseStore.sortBy !== 'rarity_desc'
})

const sortedSources = computed(() => {
  if (!selectedMineral.value?.sources) return []
  return [...selectedMineral.value.sources].sort((a, b) => b.obtainedAt - a.obtainedAt)
})

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSourcePercent = (count) => {
  const total = warehouseStore.stats.totalSpecimens || 1
  return Math.round((count / total) * 100)
}

const handleSearch = (e) => {
  audioStore.playClick?.()
  warehouseStore.setFilter('searchText', e.target.value)
}

const toggleRarityFilter = (rarity) => {
  audioStore.playClick?.()
  warehouseStore.toggleFilter('rarity', rarity)
}

const toggleSourceFilter = (source) => {
  audioStore.playClick?.()
  warehouseStore.toggleFilter('source', source)
}

const toggleDuplicateFilter = () => {
  audioStore.playClick?.()
  warehouseStore.toggleFilter('hasDuplicates')
}

const setMinCount = (value) => {
  audioStore.playClick?.()
  warehouseStore.setFilter('minCount', value)
}

const handleSortChange = (e) => {
  audioStore.playClick?.()
  warehouseStore.setSortBy(e.target.value)
}

const setSortByFavorite = () => {
  audioStore.playClick?.()
  warehouseStore.setSortBy('favorite')
}

const clearAllFilters = () => {
  audioStore.playClick?.()
  warehouseStore.clearFilters()
}

const toggleBatchMode = () => {
  audioStore.playClick?.()
  warehouseStore.toggleBatchMode()
}

const selectAll = () => {
  audioStore.playClick?.()
  warehouseStore.selectAll()
}

const clearSelection = () => {
  audioStore.playClick?.()
  warehouseStore.clearSelection()
}

const handleCardClick = (mineral) => {
  audioStore.playClick?.()
  if (warehouseStore.batchMode) {
    warehouseStore.toggleSelectMineral(mineral.id)
  } else {
    openSourceModal(mineral)
  }
}

const openSourceModal = (mineral) => {
  selectedMineral.value = mineral
  showSourceModal.value = true
}

const viewDetail = (mineral) => {
  audioStore.playClick?.()
  showSourceModal.value = false
  router.push(`/mineral/${mineral.id}`)
}

const goToCollection = (mineral = null) => {
  audioStore.playClick?.()
  if (mineral) {
    router.push({ path: '/collection', query: { highlight: mineral.id } })
  } else {
    router.push('/collection')
  }
}

const batchListToMarket = () => {
  if (warehouseStore.selectedMineralIds.length === 0) return
  audioStore.playClick?.()
  router.push('/market')
  setTimeout(() => {
    const firstMineral = warehouseStore.getCollectedMineralById(warehouseStore.selectedMineralIds[0])
    if (firstMineral) {
      marketStore.openListModal(firstMineral)
    }
  }, 100)
}

const batchGoToExchange = () => {
  audioStore.playClick?.()
  router.push('/exchange')
}
</script>

<style scoped>
.warehouse-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-card.primary { border-left: 4px solid var(--primary); }
.stat-card.success { border-left: 4px solid #22c55e; }
.stat-card.warning { border-left: 4px solid #f59e0b; }
.stat-card.info { border-left: 4px solid #3b82f6; }

.stat-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.source-stats-section {
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.source-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.source-bar-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.source-info {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 80px;
  flex-shrink: 0;
}

.source-emoji {
  font-size: 18px;
}

.source-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.bar-container {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.source-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.filter-section {
  padding: 20px;
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(233, 69, 96, 0.1);
}

.search-row {
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 42px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.08);
}

.filter-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.group-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  width: 50px;
  flex-shrink: 0;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.filter-chip.active {
  color: white;
  border-color: transparent;
}

.filter-chip.rarity-common.active { background: var(--common); }
.filter-chip.rarity-uncommon.active { background: var(--uncommon); }
.filter-chip.rarity-rare.active { background: var(--rare); }
.filter-chip.rarity-epic.active { background: var(--epic); }
.filter-chip.rarity-legendary.active { background: var(--legendary); }

.chip-emoji {
  font-size: 12px;
}

.sort-select {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  min-width: 150px;
}

.quick-filters {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.quick-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.quick-filter-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.batch-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 14px;
  margin-bottom: 20px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-count {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.text-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.text-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toggle-group-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.toggle-group-btn:hover {
  background: rgba(233, 69, 96, 0.1);
}

.duplicates-section {
  margin-bottom: 24px;
}

.duplicates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.duplicate-group-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.duplicate-group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.duplicate-group-card.rarity-legendary {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(30, 41, 59, 0.8));
}

.duplicate-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duplicate-emoji {
  font-size: 40px;
  flex-shrink: 0;
}

.duplicate-info {
  display: flex;
  flex-direction: column;
}

.duplicate-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.duplicate-count {
  font-size: 14px;
  color: var(--primary);
  font-weight: 700;
}

.duplicate-source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.source-tag {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.list-section {
  margin-bottom: 20px;
}

.list-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.view-toggle {
  display: flex;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-btn {
  padding: 6px 14px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.minerals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.warehouse-card {
  position: relative;
  padding: 16px 12px 12px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.warehouse-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.warehouse-card.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.3);
}

.warehouse-card.favorite {
  border-color: rgba(239, 68, 68, 0.3);
}

.checkbox-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.custom-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.custom-checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.fav-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 14px;
  z-index: 5;
}

.card-emoji {
  font-size: 48px;
  text-align: center;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.card-content {
  text-align: center;
  position: relative;
  z-index: 2;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.rarity-tag {
  font-size: 11px;
  font-weight: 600;
}

.count-badge {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 2;
}

.source-mini-tags {
  display: flex;
  gap: 4px;
}

.source-mini-tag {
  font-size: 11px;
  opacity: 0.8;
}

.card-value {
  font-size: 11px;
  color: #fbbf24;
  font-weight: 600;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(30px);
}

.warehouse-card:hover .card-glow {
  opacity: 0.5;
}

.minerals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.list-item:hover {
  transform: translateX(4px);
  border-color: rgba(233, 69, 96, 0.3);
}

.list-item.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.2);
}

.list-checkbox {
  flex-shrink: 0;
}

.item-emoji {
  font-size: 48px;
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
  margin-bottom: 8px;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fav-icon {
  font-size: 14px;
}

.item-rarity {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.item-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 12px;
}

.item-sources,
.item-locations,
.item-dates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.sources-label {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.location-tag {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.date-item {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-dark);
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-emoji {
  font-size: 24px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(85vh - 140px);
}

.source-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.source-breakdown-chart {
  margin-bottom: 24px;
}

.breakdown-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.breakdown-info {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 70px;
  flex-shrink: 0;
}

.breakdown-emoji {
  font-size: 16px;
}

.breakdown-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.breakdown-bar-container {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
}

.breakdown-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}

.source-timeline {
  margin-bottom: 16px;
}

.timeline-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
  padding-left: 4px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.3);
}

.timeline-content {
  flex: 1;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-source {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-date {
  font-size: 11px;
  color: var(--text-secondary);
}

.timeline-detail {
  font-size: 12px;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .minerals-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .group-label {
    width: auto;
  }

  .batch-actions-bar {
    flex-direction: column;
    gap: 12px;
  }

  .batch-info {
    width: 100%;
    justify-content: space-between;
  }

  .batch-buttons {
    width: 100%;
  }

  .batch-buttons .btn {
    flex: 1;
  }

  .list-item {
    flex-wrap: wrap;
  }

  .item-actions {
    width: 100%;
    flex-direction: row;
    justify-content: flex-end;
  }

  .source-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 12px;
    gap: 8px;
  }

  .stat-icon {
    font-size: 24px;
  }

  .stat-value {
    font-size: 20px;
  }

  .duplicates-grid {
    grid-template-columns: 1fr;
  }

  .item-meta-row {
    gap: 10px;
  }

  .meta-item {
    font-size: 11px;
  }
}
</style>
