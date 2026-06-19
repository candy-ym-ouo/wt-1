<template>
  <div class="museum-stats">
    <div class="stats-header">
      <h2 class="stats-title">📊 博物馆数据</h2>
    </div>
    <div class="stats-grid">
      <div class="stat-card stat-visitors">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.totalVisitors) }}</div>
          <div class="stat-label">累计访客</div>
          <div class="stat-sub">今日 +{{ stats.todayVisitors }}</div>
        </div>
      </div>
      <div class="stat-card stat-minerals">
        <div class="stat-icon">💎</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalMinerals }}</div>
          <div class="stat-label">馆藏矿物</div>
          <div class="stat-sub">{{ stats.totalMineralViews }} 次浏览</div>
        </div>
      </div>
      <div class="stat-card stat-halls">
        <div class="stat-icon">🏛️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalHalls }}</div>
          <div class="stat-label">展厅数量</div>
          <div class="stat-sub">{{ stats.totalExhibitions }} 场展览</div>
        </div>
      </div>
      <div class="stat-card stat-rating">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.avgRating }}</div>
          <div class="stat-label">平均评分</div>
          <div class="stat-sub">{{ stats.totalRatings }} 条评价</div>
        </div>
      </div>
    </div>

    <div class="ranking-section">
      <div class="ranking-column">
        <h3 class="ranking-title">🔥 热度排行</h3>
        <div class="ranking-list">
          <div 
            v-for="(item, index) in topViewed" 
            :key="item.mineral.id"
            class="ranking-item"
            @click="$emit('viewMineral', item.mineral)"
          >
            <span class="rank-num" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
            <span class="rank-emoji">{{ item.mineral.emoji }}</span>
            <div class="rank-info">
              <span class="rank-name">{{ item.mineral.name }}</span>
              <span class="rank-views">{{ formatNumber(item.views) }} 浏览</span>
            </div>
            <PopularityBadge :mineral-id="item.mineral.id" />
          </div>
        </div>
      </div>

      <div class="ranking-column">
        <h3 class="ranking-title">⭐ 评分排行</h3>
        <div class="ranking-list">
          <div 
            v-for="(item, index) in topRated" 
            :key="item.mineral.id"
            class="ranking-item"
            @click="$emit('viewMineral', item.mineral)"
          >
            <span class="rank-num" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
            <span class="rank-emoji">{{ item.mineral.emoji }}</span>
            <div class="rank-info">
              <span class="rank-name">{{ item.mineral.name }}</span>
              <RatingStars 
                :model-value="item.rating.average" 
                :show-value="true"
                :show-count="false"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMuseumStore } from '@/stores/museum'
import RatingStars from './RatingStars.vue'
import PopularityBadge from './PopularityBadge.vue'

defineEmits(['viewMineral'])

const museumStore = useMuseumStore()

const stats = computed(() => museumStore.museumStats)
const topViewed = computed(() => museumStore.getTopViewedMinerals(5))
const topRated = computed(() => museumStore.getTopRatedMinerals(5))

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
</script>

<style scoped>
.museum-stats {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-header {
  margin-bottom: 20px;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.stat-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-sub {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-top: 2px;
}

.stat-visitors {
  border-left: 3px solid #3b82f6;
}

.stat-minerals {
  border-left: 3px solid #8b5cf6;
}

.stat-halls {
  border-left: 3px solid #10b981;
}

.stat-rating {
  border-left: 3px solid #f59e0b;
}

.ranking-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 600px) {
  .ranking-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

.ranking-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  background: rgba(0, 0, 0, 0.35);
  transform: translateX(2px);
}

.rank-num {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1f2937;
}

.rank-2 {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  color: #1f2937;
}

.rank-3 {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
}

.rank-emoji {
  font-size: 28px;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-views {
  font-size: 11px;
  color: var(--text-secondary);
}
</style>
