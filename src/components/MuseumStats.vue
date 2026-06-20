<template>
  <div class="museum-stats">
    <div class="stats-header">
      <h2 class="stats-title">📊 博物馆数据</h2>
    </div>

    <div class="collection-stage-section">
      <div class="stage-card">
        <div class="stage-left">
          <span class="stage-icon">{{ collectionStageGoals.current?.icon || '🚀' }}</span>
          <div class="stage-info">
            <div class="stage-label">当前阶段</div>
            <div class="stage-name">{{ collectionStageGoals.current?.label || '待启程' }}</div>
            <div class="stage-desc">{{ collectionStageGoals.current?.description || '开始你的矿物收集之旅' }}</div>
          </div>
        </div>
        <div class="stage-right" v-if="collectionStageGoals.next">
          <div class="next-goal-info">
            <span class="next-goal-label">下一目标</span>
            <span class="next-goal-name">{{ collectionStageGoals.next.label }}</span>
            <span class="next-goal-progress">还差 {{ collectionStageGoals.nextGoalNeeded }} 种</span>
          </div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" :style="{ width: collectionStageGoals.nextGoalPercentage + '%' }"></div>
          </div>
        </div>
        <div class="stage-right" v-else>
          <div class="completion-badge">
            <span class="completion-icon">🏆</span>
            <span class="completion-text">已完成全部收集！</span>
          </div>
        </div>
      </div>
    </div>

    <div class="milestones-section">
      <h3 class="section-subtitle">🎯 收集里程碑</h3>
      <div class="milestones-track">
        <div 
          v-for="(milestone, index) in collectionMilestones" 
          :key="milestone.threshold"
          :class="['milestone-node', { completed: gameStore.collectedMinerals.length >= milestone.threshold, active: isActiveMilestone(milestone, index) }]"
        >
          <div class="milestone-dot">
            <span class="milestone-icon">{{ milestone.icon }}</span>
          </div>
          <div class="milestone-line" v-if="index < collectionMilestones.length - 1"></div>
          <div class="milestone-tooltip">
            <div class="tooltip-label">{{ milestone.label }}</div>
            <div class="tooltip-desc">{{ milestone.description }}</div>
            <div class="tooltip-progress">{{ gameStore.collectedMinerals.length }}/{{ milestone.threshold }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="rarity-progress-section">
      <h3 class="section-subtitle">💎 分稀有度完成率</h3>
      <div class="rarity-progress-grid">
        <div 
          v-for="(progress, rarity) in rarityProgress" 
          :key="rarity"
          class="rarity-progress-card"
          :style="{ '--rarity-color': progress.color }"
        >
          <div class="rp-header">
            <span class="rp-dot" :style="{ background: progress.color }"></span>
            <span class="rp-name">{{ progress.name }}</span>
            <span class="rp-count">{{ progress.collected }}/{{ progress.total }}</span>
          </div>
          <div class="rp-bar">
            <div class="rp-fill" :style="{ width: progress.percentage + '%', background: progress.bgGradient }"></div>
          </div>
          <div class="rp-footer">
            <span class="rp-percentage">{{ progress.percentage }}%</span>
            <span class="rp-next" v-if="currentRarityMilestones[rarity]?.next">
              还差 {{ currentRarityMilestones[rarity].progressToNext.needed }} 种达成「{{ currentRarityMilestones[rarity].next.label }}」
            </span>
            <span class="rp-complete" v-else-if="progress.collected === progress.total && progress.total > 0">
              ✓ 已集齐！
            </span>
          </div>
        </div>
      </div>
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

    <div v-if="auctionStats.totalAuctions > 0" class="auction-stats-section">
      <h3 class="ranking-title">🎪 拍卖会战绩</h3>
      <div class="auction-stats-grid">
        <div class="auction-stat-item">
          <span class="auction-stat-icon">🎪</span>
          <div class="auction-stat-content">
            <span class="auction-stat-value">{{ auctionStats.totalAuctions }}</span>
            <span class="auction-stat-label">参与场次</span>
          </div>
        </div>
        <div class="auction-stat-item">
          <span class="auction-stat-icon">🏆</span>
          <div class="auction-stat-content">
            <span class="auction-stat-value">{{ auctionStats.totalWins }}</span>
            <span class="auction-stat-label">成功竞得</span>
          </div>
        </div>
        <div class="auction-stat-item">
          <span class="auction-stat-icon">🔥</span>
          <div class="auction-stat-content">
            <span class="auction-stat-value">{{ auctionStats.totalCombos }}</span>
            <span class="auction-stat-label">累计连击</span>
          </div>
        </div>
        <div v-if="auctionStats.bestRating !== 'D'" class="auction-stat-item rating-item" :style="{ borderLeftColor: auctionStats.bestRatingConfig.color }">
          <span class="auction-stat-icon">{{ auctionStats.bestRatingConfig.icon }}</span>
          <div class="auction-stat-content">
            <span class="auction-stat-value" :style="{ color: auctionStats.bestRatingConfig.color }">{{ auctionStats.bestRating }}</span>
            <span class="auction-stat-label">最佳评级</span>
          </div>
        </div>
        <div class="auction-stat-item">
          <span class="auction-stat-icon">🎯</span>
          <div class="auction-stat-content">
            <span class="auction-stat-value">{{ auctionStats.totalTimeBonuses }}</span>
            <span class="auction-stat-label">限时加成</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMuseumStore } from '@/stores/museum'
import { useAuctionStore } from '@/stores/auction'
import { useGameStore } from '@/stores/game'
import { SESSION_RATING_CONFIG } from '@/data/auction'
import RatingStars from './RatingStars.vue'
import PopularityBadge from './PopularityBadge.vue'

defineEmits(['viewMineral'])

const museumStore = useMuseumStore()
const auctionStore = useAuctionStore()
const gameStore = useGameStore()

const stats = computed(() => museumStore.museumStats)
const topViewed = computed(() => museumStore.getTopViewedMinerals(5))
const topRated = computed(() => museumStore.getTopRatedMinerals(5))

const rarityProgress = computed(() => gameStore.rarityProgress)
const collectionMilestones = computed(() => gameStore.collectionMilestones)
const currentRarityMilestones = computed(() => gameStore.currentRarityMilestones)
const collectionStageGoals = computed(() => gameStore.collectionStageGoals)

const isActiveMilestone = (milestone, index) => {
  const collected = gameStore.collectedMinerals.length
  const prevMilestone = index > 0 ? collectionMilestones.value[index - 1] : null
  return collected < milestone.threshold && (!prevMilestone || collected >= prevMilestone.threshold)
}

const auctionStats = computed(() => ({
  totalAuctions: auctionStore.totalAuctions,
  totalWins: auctionStore.totalWins,
  totalSpent: auctionStore.totalSpent,
  bestRating: auctionStore.bestRating,
  bestRatingConfig: SESSION_RATING_CONFIG[auctionStore.bestRating],
  totalCombos: auctionStore.totalCombos,
  totalTimeBonuses: auctionStore.totalTimeBonuses
}))

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
.auction-stats-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.auction-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}
.auction-stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  border-left: 3px solid rgba(255,255,255,0.1);
}
.auction-stat-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.auction-stat-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.auction-stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}
.auction-stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.collection-stage-section {
  margin-bottom: 24px;
}

.stage-card {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.1), rgba(168, 85, 247, 0.08));
  border: 1px solid rgba(233, 69, 96, 0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.stage-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.stage-icon {
  font-size: 48px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.stage-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stage-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  background: linear-gradient(135deg, #e94560, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stage-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.stage-right {
  flex: 1;
  min-width: 0;
}

.next-goal-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.next-goal-label {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

.next-goal-name {
  font-size: 15px;
  font-weight: 700;
  color: #fbbf24;
}

.next-goal-progress {
  font-size: 13px;
  color: var(--text-secondary);
}

.goal-progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.goal-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #e94560);
  border-radius: 5px;
  transition: width 0.5s ease;
  position: relative;
}

.goal-progress-fill::after {
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

.completion-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1));
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.completion-icon {
  font-size: 28px;
}

.completion-text {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.milestones-section {
  margin-bottom: 24px;
}

.milestones-track {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding: 8px 4px 20px;
  gap: 0;
}

.milestone-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex-shrink: 0;
  min-width: 80px;
}

.milestone-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 2;
}

.milestone-icon {
  font-size: 20px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.milestone-node.completed .milestone-dot {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-color: #22c55e;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
}

.milestone-node.completed .milestone-icon {
  opacity: 1;
}

.milestone-node.active .milestone-dot {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.milestone-node.active .milestone-icon {
  opacity: 1;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.milestone-line {
  position: absolute;
  top: 24px;
  left: 64px;
  width: calc(100% + 16px);
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.milestone-node.completed .milestone-line {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.milestone-tooltip {
  position: absolute;
  top: 60px;
  width: 120px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 10px;
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 10;
}

.milestone-node:hover .milestone-tooltip {
  opacity: 1;
  visibility: visible;
  top: 64px;
}

.tooltip-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 2px;
}

.tooltip-desc {
  font-size: 10px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
  line-height: 1.3;
}

.tooltip-progress {
  font-size: 11px;
  font-weight: 600;
  color: #fbbf24;
  font-family: 'Courier New', monospace;
}

.rarity-progress-section {
  margin-bottom: 24px;
}

.rarity-progress-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 600px) {
  .rarity-progress-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.rarity-progress-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid var(--rarity-color, #6b7280);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s ease;
}

.rarity-progress-card:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateX(2px);
}

.rp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.rp-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rp-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.rp-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--rarity-color, var(--text-secondary));
  font-family: 'Courier New', monospace;
}

.rp-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rp-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.rp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rp-percentage {
  font-size: 12px;
  font-weight: 700;
  color: var(--rarity-color, var(--text-secondary));
  font-family: 'Courier New', monospace;
}

.rp-next {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: right;
  flex: 1;
}

.rp-complete {
  font-size: 11px;
  font-weight: 600;
  color: #22c55e;
}

@media (max-width: 600px) {
  .stage-card {
    flex-direction: column;
    gap: 14px;
  }
  
  .stage-left {
    width: 100%;
  }
  
  .stage-right {
    width: 100%;
  }
  
  .milestone-line {
    width: calc(100% - 32px);
    left: 56px;
  }
}
</style>
