<template>
  <div class="detail-view" :class="`rarity-${mineral?.rarity}`">
    <div class="detail-header">
      <button class="back-btn" @click="goBack">
        ← 返回
      </button>
      <div class="header-actions">
        <button 
          class="fav-btn" 
          :class="{ active: isFav }"
          @click="toggleFav"
          v-if="mineral"
        >
          {{ isFav ? '❤️' : '🤍' }}
        </button>
        <span class="collected-badge" v-if="isCollected">
          ✓ 已收集
        </span>
      </div>
    </div>

    <div v-if="mineral && isCollected" class="detail-content">
      <div class="mineral-hero">
        <div class="hero-glow"></div>
        <div class="hero-background">
          <div 
            v-for="i in 6" 
            :key="i" 
            class="floating-shape"
            :style="getShapeStyle(i)"
          ></div>
        </div>
        <span class="mineral-emoji">{{ mineral.emoji }}</span>
        <div class="mineral-titles">
          <h1 class="mineral-name">{{ mineral.name }}</h1>
          <span class="mineral-en">{{ mineral.nameEn }}</span>
        </div>
        <div class="hero-badges">
          <div class="rarity-badge-large">
            <span class="stars">{{ getRarityStars(mineral.rarity) }}</span>
            <span class="rarity-name">{{ rarityConfig.name }}</span>
          </div>
          <PopularityBadge v-if="mineral" :mineral-id="mineral.id" />
        </div>
        <div class="hero-meta-row">
          <div class="meta-item">
            <span class="meta-icon">👁️</span>
            <span class="meta-value">{{ formatNumber(mineralViews) }}</span>
            <span class="meta-label">浏览</span>
          </div>
          <div class="meta-item">
            <RatingStars 
              :model-value="mineralRating.average" 
              :show-value="true"
              :show-count="true"
              :total-count="mineralRating.count"
            />
          </div>
        </div>
      </div>

      <div class="quick-stats">
        <div class="stat-item">
          <span class="stat-icon">⚗️</span>
          <span class="stat-label">化学式</span>
          <span class="stat-value">{{ mineral.formula }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">💎</span>
          <span class="stat-label">硬度</span>
          <span class="stat-value">{{ mineral.hardness }}</span>
        </div>
        <div class="stat-item" v-if="collectedData">
          <span class="stat-icon">📅</span>
          <span class="stat-label">收集时间</span>
          <span class="stat-value">{{ formatDate(collectedData.collectedAt) }}</span>
        </div>
        <div class="stat-item" v-if="collectedData">
          <span class="stat-icon">🔄</span>
          <span class="stat-label">收集次数</span>
          <span class="stat-value">{{ collectedData.count }}次</span>
        </div>
      </div>

      <div class="rating-section card">
        <h2 class="section-title">
          <span class="title-icon">⭐</span>
          藏品评分
        </h2>
        <div class="rating-content">
          <div class="rating-summary">
            <div class="rating-average">
              <span class="average-num">{{ mineralRating.average.toFixed(1) }}</span>
              <RatingStars :model-value="mineralRating.average" :show-value="false" />
            </div>
            <div class="rating-distribution">
              <div v-for="star in 5" :key="star" class="dist-row">
                <span class="dist-label">{{ 6 - star }}星</span>
                <div class="dist-bar">
                  <div 
                    class="dist-fill" 
                    :style="{ width: getDistPercent(6 - star) + '%' }"
                  ></div>
                </div>
                <span class="dist-count">{{ getDistCount(6 - star) }}</span>
              </div>
            </div>
          </div>
          <div class="user-rating">
            <div class="user-rating-label">
              你的评分：
              <span v-if="userRating > 0" class="rated-text">已评 {{ userRating }} 星</span>
              <span v-else class="rate-hint">点击星星为它打分</span>
            </div>
            <RatingStars 
              :model-value="userRating" 
              :interactive="true"
              :show-value="false"
              :show-count="false"
              size="large"
              @change="handleRate"
            />
          </div>
        </div>
      </div>

      <div class="halls-section card" v-if="relatedHalls.length > 0">
        <h2 class="section-title">
          <span class="title-icon">🏛️</span>
          所在展厅
        </h2>
        <div class="halls-tags">
          <div 
            v-for="hall in relatedHalls" 
            :key="hall.id"
            class="hall-tag"
            :style="{ background: hall.bgGradient, borderColor: hall.color }"
          >
            <span class="hall-tag-icon">{{ hall.icon }}</span>
            <span class="hall-tag-name">{{ hall.name }}</span>
          </div>
        </div>
      </div>

      <div class="info-sections">
        <div class="info-section">
          <h2 class="section-title">
            <span class="title-icon">📖</span>
            矿物简介
          </h2>
          <div class="section-content">
            <p class="description">{{ mineral.description }}</p>
          </div>
        </div>

        <div class="info-section">
          <h2 class="section-title">
            <span class="title-icon">🌍</span>
            产地分布
          </h2>
          <div class="section-content">
            <p class="content-text">{{ mineral.origin }}</p>
          </div>
        </div>

        <div class="info-section">
          <h2 class="section-title">
            <span class="title-icon">⚙️</span>
            主要用途
          </h2>
          <div class="section-content">
            <p class="content-text">{{ mineral.uses }}</p>
          </div>
        </div>

        <div class="info-section fun-fact">
          <h2 class="section-title">
            <span class="title-icon">💡</span>
            趣味知识
          </h2>
          <div class="section-content">
            <p class="content-text">{{ mineral.funFact }}</p>
          </div>
        </div>
      </div>

      <div class="market-info card">
        <h2 class="section-title">
          <span class="title-icon">📊</span>
          市场行情
        </h2>
        <div class="market-stats">
          <div class="market-stat">
            <span class="stat-label">基准价格</span>
            <span class="stat-value">{{ basePrice }}</span>
          </div>
          <div class="market-stat">
            <span class="stat-label">当前市价</span>
            <span class="stat-value price">{{ marketPrice }}</span>
          </div>
          <div class="market-stat">
            <span class="stat-label">价格趋势</span>
            <span class="stat-value" :class="priceTrend.trend">
              <span v-if="priceTrend.trend === 'up'">📈</span>
              <span v-else-if="priceTrend.trend === 'down'">📉</span>
              <span v-else>➡️</span>
              {{ priceTrend.change }}%
            </span>
          </div>
          <div class="market-stat">
            <span class="stat-label">持有数量</span>
            <span class="stat-value">{{ mineralCount }}</span>
          </div>
        </div>
      </div>

      <div class="action-section">
        <button class="btn btn-large" @click="collectAgain">
          <span class="btn-icon">🎨</span>
          再次拼装获得金币
        </button>
        <div class="action-row">
          <button 
            class="btn btn-large btn-secondary" 
            @click="goToMarket"
          >
            <span class="btn-icon">🏪</span>
            查看市场
          </button>
          <button 
            class="btn btn-large" 
            @click="listMineral"
            :disabled="mineralCount < 1"
          >
            <span class="btn-icon">📤</span>
            上架拍卖
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="mineral && !isCollected" class="locked-content">
      <div class="locked-icon">🔒</div>
      <h2 class="locked-title">未解锁</h2>
      <p class="locked-desc">完成该矿物的拼装即可解锁详细信息</p>
      <button class="btn btn-large" @click="goToCollage">
        前往拼装
      </button>
    </div>

    <div v-else class="loading-content">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useMarketStore } from '@/stores/market'
import { useMuseumStore } from '@/stores/museum'
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'
import { getMineralById } from '@/data/minerals'
import { getHallsByMineralId } from '@/data/halls'
import RatingStars from '@/components/RatingStars.vue'
import PopularityBadge from '@/components/PopularityBadge.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()
const museumStore = useMuseumStore()

const mineral = computed(() => {
  const id = parseInt(route.params.id)
  return getMineralById(id)
})

const isCollected = computed(() => {
  return mineral.value ? gameStore.isMineralCollected(mineral.value.id) : false
})

const collectedData = computed(() => {
  if (!mineral.value) return null
  return gameStore.collectedMinerals.find(m => m.id === mineral.value.id)
})

const rarityConfig = computed(() => {
  return mineral.value ? RARITY_CONFIG[mineral.value.rarity] : null
})

const mineralRating = computed(() => {
  if (!mineral.value) return { average: 0, count: 0, distribution: {} }
  return museumStore.getMineralRating(mineral.value.id)
})

const mineralViews = computed(() => {
  if (!mineral.value) return 0
  return museumStore.getMineralViews(mineral.value.id)
})

const userRating = computed(() => {
  if (!mineral.value) return 0
  return museumStore.getUserRating(mineral.value.id)
})

const isFav = computed(() => {
  if (!mineral.value) return false
  return museumStore.isFavorite(mineral.value.id)
})

const relatedHalls = computed(() => {
  if (!mineral.value) return []
  return getHallsByMineralId(mineral.value.id)
})

const getDistCount = (star) => {
  return mineralRating.value.distribution?.[star] || 0
}

const getDistPercent = (star) => {
  const count = getDistCount(star)
  const total = mineralRating.value.count || 1
  return Math.round((count / total) * 100)
}

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const handleRate = (rating) => {
  if (!mineral.value) return
  audioStore.playClick()
  museumStore.rateMineral(mineral.value.id, rating)
}

const toggleFav = () => {
  if (!mineral.value) return
  audioStore.playClick()
  museumStore.toggleFavorite(mineral.value.id)
}

const getShapeStyle = (index) => {
  const angle = (index / 6) * 360
  const delay = index * 0.2
  const colors = mineral.value?.colors || ['#fff']
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`,
    '--color': colors[index % colors.length]
  }
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => {
  audioStore.playClick()
  router.back()
}

const goToCollage = () => {
  audioStore.playClick()
  router.push('/collage')
}

const collectAgain = () => {
  if (mineral.value) {
    audioStore.playClick()
    const result = gameStore.startNewCollage(mineral.value)
    if (result) {
      router.push('/collage')
    }
  }
}

const basePrice = computed(() => {
  if (!mineral.value) return 0
  return marketStore.getBasePrice(mineral.value)
})

const marketPrice = computed(() => {
  if (!mineral.value) return 0
  return marketStore.getMarketPrice(mineral.value.id)
})

const priceTrend = computed(() => {
  if (!mineral.value) return { trend: 'stable', change: 0 }
  return marketStore.getPriceTrend(mineral.value.id)
})

const mineralCount = computed(() => {
  if (!mineral.value) return 0
  const m = gameStore.collectedMinerals.find(m => m.id === mineral.value.id)
  return m?.count || 0
})

const goToMarket = () => {
  audioStore.playClick()
  router.push('/market')
}

const listMineral = () => {
  if (!mineral.value || mineralCount.value < 1) return
  audioStore.playClick()
  router.push('/market')
  setTimeout(() => {
    marketStore.openListModal(mineral.value)
  }, 100)
}

onMounted(() => {
  if (!mineral.value) {
    router.replace('/collection')
    return
  }
  museumStore.recordMineralView(mineral.value.id)
})
</script>

<style scoped>
.detail-view {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.collected-badge {
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.detail-content {
  padding-bottom: 40px;
}

.mineral-hero {
  position: relative;
  padding: 40px 20px;
  text-align: center;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: inherit;
  filter: blur(60px);
  opacity: 0.3;
  z-index: 0;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.floating-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: var(--color);
  opacity: 0.2;
  border-radius: 50%;
  animation: floatAround 8s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes floatAround {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg) translateX(100px);
  }
  50% {
    transform: translate(-50%, -50%) rotate(180deg) translateX(120px);
  }
}

.mineral-emoji {
  position: relative;
  font-size: 120px;
  display: block;
  margin-bottom: 20px;
  z-index: 1;
  animation: bounce 3s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.mineral-titles {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.mineral-name {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
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
  font-size: 16px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 3px;
}

.rarity-badge-large {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}

.stars {
  font-size: 20px;
  letter-spacing: 3px;
}

.rarity-name {
  font-size: 16px;
  font-weight: 600;
}

.rarity-common .rarity-name, .rarity-common .stars { color: var(--common); }
.rarity-uncommon .rarity-name, .rarity-uncommon .stars { color: var(--uncommon); }
.rarity-rare .rarity-name, .rarity-rare .stars { color: var(--rare); }
.rarity-epic .rarity-name, .rarity-epic .stars { color: var(--epic); }
.rarity-legendary .rarity-name, .rarity-legendary .stars { color: var(--legendary); }

.quick-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.info-sections {
  padding: 0 16px;
}

.info-section {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-section.fun-fact {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1));
  border-color: rgba(245, 158, 11, 0.2);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 20px;
}

.section-content {
  color: var(--text-secondary);
  line-height: 1.7;
}

.description {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}

.content-text {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}

.action-section {
  padding: 24px 16px;
}

.btn-large {
  width: 100%;
  padding: 18px;
  font-size: 18px;
}

.btn-icon {
  margin-right: 8px;
}

.market-info {
  margin: 0 16px 16px 16px;
  padding: 20px;
}

.market-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.market-stat {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.market-stat .stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

.market-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.market-stat .stat-value.price {
  color: #fbbf24;
}

.market-stat .stat-value.up {
  color: #22c55e;
}

.market-stat .stat-value.down {
  color: #ef4444;
}

.action-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.action-row .btn {
  flex: 1;
}

.locked-content,
.loading-content {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.locked-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.locked-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.locked-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 32px;
  max-width: 300px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-content p {
  color: var(--text-secondary);
  font-size: 16px;
}

@media (max-width: 480px) {
  .mineral-emoji {
    font-size: 90px;
  }
  
  .mineral-name {
    font-size: 28px;
  }
  
  .mineral-en {
    font-size: 14px;
  }
  
  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 14px;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--bg-card);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fav-btn:hover {
  transform: scale(1.1);
}

.fav-btn.active {
  background: rgba(239, 68, 68, 0.2);
  animation: heartBeat 0.5s ease;
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.hero-badges {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.hero-meta-row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 14px;
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.meta-icon {
  font-size: 16px;
}

.meta-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.meta-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.rating-section,
.halls-section {
  margin: 0 16px 16px 16px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.rating-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rating-summary {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 20px;
  align-items: center;
}

.rating-average {
  text-align: center;
}

.average-num {
  display: block;
  font-size: 36px;
  font-weight: 800;
  color: #fbbf24;
  line-height: 1;
  margin-bottom: 6px;
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist-label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 32px;
  flex-shrink: 0;
}

.dist-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.dist-count {
  font-size: 12px;
  color: var(--text-secondary);
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}

.user-rating {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.user-rating-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: block;
}

.rated-text {
  color: #22c55e;
  font-weight: 600;
}

.rate-hint {
  color: var(--text-secondary);
  opacity: 0.7;
}

.halls-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hall-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hall-tag:hover {
  transform: translateY(-2px);
}

.hall-tag-icon {
  font-size: 18px;
}

.hall-tag-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

@media (max-width: 480px) {
  .rating-summary {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-meta-row {
    gap: 12px;
    flex-wrap: wrap;
  }

  .meta-item {
    padding: 6px 10px;
  }
}
</style>
