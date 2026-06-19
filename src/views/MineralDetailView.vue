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
          <span class="stat-label">首次收集</span>
          <span class="stat-value">{{ formatDate(collectedData.collectedAt) }}</span>
        </div>
        <div class="stat-item" v-if="collectedData">
          <span class="stat-icon">🔄</span>
          <span class="stat-label">收集次数</span>
          <span class="stat-value">{{ collectedData.count }}次</span>
        </div>
        <div class="stat-item" v-if="lastCollageTime">
          <span class="stat-icon">🎨</span>
          <span class="stat-label">最近拼装</span>
          <span class="stat-value">{{ formatRelativeTime(lastCollageTime) }}</span>
        </div>
        <div class="stat-item" v-if="isFav">
          <span class="stat-icon">❤️</span>
          <span class="stat-label">已收藏</span>
          <span class="stat-value favorite">收藏中</span>
        </div>
      </div>

      <div class="source-section card" v-if="sourceStats.length > 0">
        <h2 class="section-title">
          <span class="title-icon">📦</span>
          来源记录
        </h2>
        <div class="source-stats">
          <div 
            v-for="stat in sourceStats" 
            :key="stat.source"
            class="source-stat-item"
          >
            <div class="source-stat-header">
              <span class="source-stat-icon">{{ stat.icon }}</span>
              <div class="source-stat-info">
                <span class="source-stat-name">{{ stat.name }}</span>
                <span class="source-stat-count">{{ stat.count }}次</span>
              </div>
            </div>
            <div class="source-stat-bar">
              <div 
                class="source-stat-fill" 
                :style="{ width: stat.percentage + '%', background: stat.color }"
              ></div>
            </div>
          </div>
        </div>
        <div class="source-list" v-if="sources.length > 0">
          <div class="source-list-header">
            <span>获取明细（最近{{ Math.min(8, sources.length) }}条）</span>
          </div>
          <div class="source-timeline">
            <div 
              v-for="(src, idx) in sources.slice(0, 8)"
              :key="idx"
              class="source-timeline-item"
            >
              <div class="source-dot" :style="{ background: src.color }">
                <span class="source-dot-icon">{{ src.icon }}</span>
              </div>
              <div class="source-content">
                <div class="source-top">
                  <span class="source-name" :style="{ color: src.color }">
                    {{ src.name }}
                  </span>
                  <span class="source-time">{{ formatRelativeTime(src.obtainedAt) }}</span>
                </div>
                <div class="source-detail" v-if="src.detail">
                  {{ src.detail }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="repeated-info card">
        <div class="repeated-header">
          <h2 class="section-title">
            <span class="title-icon">💰</span>
            重复收集收益
          </h2>
          <span class="repeated-tag">已重复收集 {{ Math.max(0, collectedData?.count - 1 || 0) }}次</span>
        </div>
        <div class="repeated-content">
          <div class="repeated-desc">
            <p>每次再次拼装或获取已收集矿物，可获得以下奖励：</p>
          </div>
          <div class="rewards-grid">
            <div class="reward-item coin-reward">
              <span class="reward-icon">🪙</span>
              <div class="reward-info">
                <span class="reward-label">基础金币</span>
                <span class="reward-value">{{ repeatRewardInfo.baseCoins }} 金币/次</span>
              </div>
            </div>
            <div class="reward-item bonus-reward" v-if="repeatRewardInfo.detectorBonus > 0">
              <span class="reward-icon">🔧</span>
              <div class="reward-info">
                <span class="reward-label">探测器加成</span>
                <span class="reward-value">+{{ repeatRewardInfo.detectorBonus.toFixed(0) }}%</span>
              </div>
            </div>
            <div class="reward-item total-reward">
              <span class="reward-icon">✨</span>
              <div class="reward-info">
                <span class="reward-label">预计总收益</span>
                <span class="reward-value highlight">{{ repeatRewardInfo.totalPerRun }} 金币/次</span>
              </div>
            </div>
            <div class="reward-item history-reward">
              <span class="reward-icon">📊</span>
              <div class="reward-info">
                <span class="reward-label">累计已获得</span>
                <span class="reward-value">{{ repeatRewardInfo.totalEarned }} 金币</span>
              </div>
            </div>
          </div>
          <div class="repeated-tip">
            <span class="tip-icon">💡</span>
            <span class="tip-text">提示：稀有度越高的矿物，重复收集获得的基础奖励越丰厚。升级探测器可获得更多金币加成！</span>
          </div>
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

        <div
          class="info-section knowledge-section"
          :style="{ '--card-color': relatedCards.length > 0 ? getCategoryColor(relatedCards[0]?.category) : '#6b7280' }"
        >
          <div class="knowledge-header">
            <h2 class="section-title">
              <span class="title-icon">📇</span>
              研究知识
            </h2>
            <button
              v-if="relatedCards.length === 0"
              class="btn btn-small research-entry-btn"
              @click="goToResearch"
            >
              🔬 前往研究院解锁
            </button>
          </div>
          <div v-if="relatedCards.length === 0" class="knowledge-empty">
            <div class="knowledge-empty-icon">🔬</div>
            <p class="knowledge-empty-text">完成相关研究课题可解锁该矿物的深度知识</p>
          </div>
          <div v-else class="knowledge-cards">
            <div
              v-for="card in relatedCards"
              :key="card.id"
              class="knowledge-mini-card"
              :style="{ borderLeftColor: getCategoryColor(card.category) }"
              @click="goToResearchCard(card.id)"
            >
              <div class="kmc-top">
                <span class="kmc-icon">{{ card.icon }}</span>
                <span class="kmc-category" :style="{ color: getCategoryColor(card.category) }">
                  {{ getCategoryName(card.category) }}
                </span>
              </div>
              <h4 class="kmc-title">{{ card.title }}</h4>
              <p class="kmc-content">{{ card.content }}</p>
              <div class="kmc-source">
                来自: {{ card.topicName }} · {{ card.stageName }}
              </div>
            </div>
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

      <div class="discovery-history card" v-if="mineralDiscoveryLogs.length > 0">
        <div class="history-header">
          <h2 class="section-title">
            <span class="title-icon">📜</span>
            发现历史
          </h2>
          <span class="history-count">{{ mineralDiscoveryLogs.length }} 次记录</span>
        </div>
        <div class="history-timeline">
          <div 
            v-for="log in mineralDiscoveryLogs.slice(0, 5)" 
            :key="log.id"
            class="history-item"
          >
            <div class="history-dot" :style="{ background: log.sourceColor }">
              <span class="dot-icon">{{ log.sourceIcon }}</span>
            </div>
            <div class="history-content">
              <div class="history-top">
                <span class="history-source" :style="{ color: log.sourceColor }">
                  {{ log.sourceName }}
                </span>
                <span class="history-time">{{ formatHistoryTime(log.timestamp) }}</span>
              </div>
              <div class="history-events" v-if="log.keyEvents && log.keyEvents.length > 0">
                <span v-for="(event, idx) in log.keyEvents" :key="idx" class="history-event">
                  {{ event }}
                </span>
              </div>
              <div class="history-rewards">
                <span v-if="log.rewards.coins > 0" class="history-reward">
                  💰 +{{ log.rewards.coins }}
                </span>
                <span v-if="log.rewards.exp > 0" class="history-reward">
                  ⭐ +{{ log.rewards.exp }} EXP
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="mineralDiscoveryLogs.length > 5" class="history-more">
          <span>还有 {{ mineralDiscoveryLogs.length - 5 }} 条记录...</span>
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
        <button
          v-if="mineralCount > 1"
          class="btn btn-large exchange-entry-btn"
          @click="goToExchange"
        >
          <span class="btn-icon">🔄</span>
          前往交换站置换
        </button>
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
import { useResearchStore } from '@/stores/research'
import { useDetectorStore } from '@/stores/detector'
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'
import { getMineralById } from '@/data/minerals'
import { SEASONS } from '@/data/season'
import { getHallsByMineralId } from '@/data/halls'
import { CATEGORY_CONFIG } from '@/data/research'
import RatingStars from '@/components/RatingStars.vue'
import PopularityBadge from '@/components/PopularityBadge.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()
const museumStore = useMuseumStore()
const researchStore = useResearchStore()
const detectorStore = useDetectorStore()

const getAnyMineralById = (id) => {
  const numericId = Number(id)
  if (!Number.isNaN(numericId)) {
    const m = getMineralById(numericId)
    if (m) return m
  }
  for (const season of SEASONS) {
    if (season.limitedSpecimens) {
      const specimen = season.limitedSpecimens.find(s => s.id === id)
      if (specimen) return specimen
    }
  }
  return null
}

const mineral = computed(() => {
  return getAnyMineralById(route.params.id)
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

const relatedCards = computed(() => {
  if (!mineral.value) return []
  return researchStore.getCardsForMineral(mineral.value.id)
})

const getCategoryColor = (category) => CATEGORY_CONFIG[category]?.color || '#6b7280'
const getCategoryName = (category) => CATEGORY_CONFIG[category]?.name || '未知'
const getCategoryGradient = (category) => CATEGORY_CONFIG[category]?.gradient || 'linear-gradient(135deg, #6b7280, #9ca3af)'

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

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '暂无'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatSourceDetail = (source, sourceData) => {
  if (!sourceData) return ''
  switch (source) {
    case 'collage':
      return sourceData.timeTaken ? `用时 ${sourceData.timeTaken}秒` : ''
    case 'expedition':
      return sourceData.locationName ? `${sourceData.locationName} · 难度${sourceData.difficulty || 1}` : ''
    case 'gacha':
      return sourceData.boxName ? `${sourceData.boxName}${sourceData.isPity ? ' · 保底' : ''}` : ''
    case 'exchange':
      return sourceData.coinCost ? `消耗 ${sourceData.coinCost} 金币` : ''
    case 'season':
      return sourceData.seasonName ? `${sourceData.seasonName} · 第${sourceData.tier || 1}级` : ''
    case 'quiz':
      return sourceData.cost ? `消耗 ${sourceData.cost} 知识点` : ''
    case 'market':
      return sourceData.price ? `花费 ${sourceData.price} 金币` : ''
    case 'auction':
      return sourceData.finalPrice ? `成交价 ${sourceData.finalPrice} 金币` : ''
    case 'research':
      return sourceData.stageName || ''
    default:
      return ''
  }
}

const sources = computed(() => {
  if (!collectedData.value?.sources) return []
  return [...collectedData.value.sources]
    .sort((a, b) => b.obtainedAt - a.obtainedAt)
    .map(src => {
      const config = gameStore.getSourceConfig(src.source)
      return {
        ...src,
        name: config.name,
        icon: config.icon,
        color: config.color,
        detail: formatSourceDetail(src.source, src.sourceData)
      }
    })
})

const sourceStats = computed(() => {
  if (!collectedData.value?.sources || collectedData.value.sources.length === 0) return []
  
  const statMap = {}
  for (const src of collectedData.value.sources) {
    if (!statMap[src.source]) {
      const config = gameStore.getSourceConfig(src.source)
      statMap[src.source] = {
        source: src.source,
        name: config.name,
        icon: config.icon,
        color: config.color,
        count: 0
      }
    }
    statMap[src.source].count++
  }
  
  const total = collectedData.value.sources.length
  return Object.values(statMap)
    .sort((a, b) => b.count - a.count)
    .map(s => ({
      ...s,
      percentage: Math.round((s.count / total) * 100)
    }))
})

const lastCollageTime = computed(() => {
  if (!collectedData.value?.sources) return null
  const collageSources = collectedData.value.sources.filter(s => s.source === 'collage')
  if (collageSources.length === 0) return null
  return Math.max(...collageSources.map(s => s.obtainedAt))
})

const repeatRewardInfo = computed(() => {
  if (!mineral.value) return {
    baseCoins: 0,
    detectorBonus: 0,
    totalPerRun: 0,
    totalEarned: 0
  }
  
  const starCount = RARITY_CONFIG[mineral.value.rarity]?.starCount || 1
  const baseCoins = 10
  const detectorBonus = (detectorStore.totalStats?.coinBonus) || 0
  const bonusMultiplier = 1 + detectorBonus / 100
  const totalPerRun = Math.floor(baseCoins * bonusMultiplier)
  
  const repeatCount = Math.max(0, (collectedData.value?.count || 1) - 1)
  const totalEarned = repeatCount * totalPerRun
  
  return {
    baseCoins,
    detectorBonus,
    totalPerRun,
    totalEarned
  }
})

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

const mineralDiscoveryLogs = computed(() => {
  if (!mineral.value) return []
  return gameStore.getDiscoveryLogs({ mineralId: mineral.value.id })
})

const formatHistoryTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const goToMarket = () => {
  audioStore.playClick()
  router.push('/market')
}

const goToExchange = () => {
  audioStore.playClick()
  router.push('/exchange')
}

const listMineral = () => {
  if (!mineral.value || mineralCount.value < 1) return
  audioStore.playClick()
  router.push('/market')
  setTimeout(() => {
    marketStore.openListModal(mineral.value)
  }, 100)
}

const goToResearch = () => {
  audioStore.playClick()
  router.push('/research')
}

const goToResearchCard = (cardId) => {
  audioStore.playClick()
  router.push('/research')
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('open-research-card', { detail: { cardId } }))
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

.exchange-entry-btn {
  margin-top: 12px;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
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

.discovery-history {
  margin: 0 16px 16px 16px;
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-count {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.history-timeline {
  position: relative;
  padding-left: 20px;
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 5px;
  bottom: 5px;
  width: 2px;
  background: linear-gradient(180deg, var(--primary), transparent);
}

.history-item {
  position: relative;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.history-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.history-dot {
  position: absolute;
  left: -20px;
  top: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.history-dot .dot-icon {
  font-size: 9px;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-source {
  font-size: 13px;
  font-weight: 600;
}

.history-time {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.history-events {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.history-event {
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.history-rewards {
  display: flex;
  gap: 12px;
}

.history-reward {
  font-size: 12px;
  font-weight: 600;
  color: #fbbf24;
}

.history-more {
  text-align: center;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: var(--text-secondary);
}

.knowledge-section {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(59, 130, 246, 0.06)) !important;
  border-color: color-mix(in srgb, var(--card-color) 25%, transparent) !important;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.research-entry-btn {
  background: linear-gradient(135deg, #a855f7, #6366f1) !important;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3) !important;
}

.knowledge-empty {
  text-align: center;
  padding: 28px 20px;
  border: 1px dashed rgba(168, 85, 247, 0.25);
  border-radius: 12px;
  background: rgba(168, 85, 247, 0.03);
}

.knowledge-empty-icon {
  font-size: 40px;
  opacity: 0.5;
  margin-bottom: 10px;
}

.knowledge-empty-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.knowledge-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.knowledge-mini-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.knowledge-mini-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(3px);
}

.kmc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kmc-icon {
  font-size: 22px;
}

.kmc-category {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.kmc-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.kmc-content {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.75;
  margin: 0 0 10px 0;
}

.kmc-source {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.65;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-value.favorite {
  color: #ef4444;
}

.source-section {
  margin: 0 16px 16px 16px;
  padding: 20px;
}

.source-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.source-stat-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.source-stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.source-stat-icon {
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  flex-shrink: 0;
}

.source-stat-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.source-stat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.source-stat-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
}

.source-stat-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.source-stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  position: relative;
}

.source-stat-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: sourceShimmer 2s infinite;
}

@keyframes sourceShimmer {
  0% { background-position: -20px 0; }
  100% { background-position: calc(100% + 20px) 0; }
}

.source-list-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.source-timeline {
  position: relative;
  padding-left: 22px;
}

.source-timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: linear-gradient(180deg, rgba(233, 69, 96, 0.5), rgba(168, 85, 247, 0.3), transparent);
}

.source-timeline-item {
  position: relative;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.source-timeline-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.source-dot {
  position: absolute;
  left: -22px;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.source-dot-icon {
  font-size: 8px;
}

.source-content {
  min-width: 0;
}

.source-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}

.source-name {
  font-size: 13px;
  font-weight: 600;
}

.source-time {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.source-detail {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.8;
  line-height: 1.5;
}

.repeated-info {
  margin: 0 16px 16px 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.04));
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.repeated-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.repeated-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.repeated-desc {
  margin-bottom: 14px;
}

.repeated-desc p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.reward-item {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.coin-reward {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05));
  border-color: rgba(245, 158, 11, 0.2);
}

.bonus-reward {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.05));
  border-color: rgba(59, 130, 246, 0.2);
}

.total-reward {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.12), rgba(168, 85, 247, 0.08));
  border-color: rgba(233, 69, 96, 0.25);
}

.history-reward {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05));
  border-color: rgba(34, 197, 94, 0.2);
}

.reward-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.reward-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.reward-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.reward-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.reward-value.highlight {
  color: #fbbf24;
  font-size: 14px;
}

.repeated-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border-left: 3px solid #f59e0b;
}

.tip-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 480px) {
  .rewards-grid {
    grid-template-columns: 1fr;
  }
  
  .source-stat-header {
    gap: 8px;
  }
  
  .source-stat-icon {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }
}
</style>
