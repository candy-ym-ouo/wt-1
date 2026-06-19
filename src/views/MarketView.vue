<template>
  <div class="market-view">
    <div class="market-header">
      <div class="header-content">
        <h1 class="page-title">矿物交易市场</h1>
        <p class="page-subtitle">买卖珍稀矿物，把握市场行情</p>
      </div>
      <div class="header-actions">
        <div class="coins-display">
          <span class="coins-icon">💰</span>
          <span class="coins-value">{{ gameStore.coins }}</span>
        </div>
      </div>
    </div>

    <div class="market-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="['tab-btn', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'market'" class="market-listings">
        <div class="listings-toolbar">
          <div class="filter-group">
            <button 
              v-for="filter in rarityFilters" 
              :key="filter.value"
              :class="['filter-chip', { active: rarityFilter === filter.value }]"
              @click="rarityFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
          <button class="btn btn-secondary btn-small" @click="refreshListings">
            🔄 刷新
          </button>
        </div>

        <div v-if="filteredListings.length === 0" class="empty-state">
          <div class="empty-icon">🏪</div>
          <p class="empty-text">暂无在售矿物</p>
          <button class="btn" @click="marketStore.generateMockListings">
            生成测试数据
          </button>
        </div>

        <div v-else class="listings-grid">
          <div 
            v-for="listing in filteredListings" 
            :key="listing.id"
            class="listing-card card"
            :class="`rarity-${getMineral(listing.mineralId)?.rarity}`"
          >
            <div class="listing-header">
              <span class="mineral-emoji">{{ getMineral(listing.mineralId)?.emoji }}</span>
              <div class="mineral-info">
                <h3 class="mineral-name">{{ getMineral(listing.mineralId)?.name }}</h3>
                <span class="mineral-rarity">
                  {{ getRarityStars(getMineral(listing.mineralId)?.rarity) }}
                  {{ RARITY_CONFIG[getMineral(listing.mineralId)?.rarity]?.name }}
                </span>
              </div>
              <div class="price-trend" :class="getPriceTrend(listing.mineralId).trend">
                <span v-if="getPriceTrend(listing.mineralId).trend === 'up'">📈</span>
                <span v-else-if="getPriceTrend(listing.mineralId).trend === 'down'">📉</span>
                <span v-else>➡️</span>
                <span class="trend-value">{{ getPriceTrend(listing.mineralId).change }}%</span>
              </div>
            </div>

            <div class="listing-body">
              <div class="price-info">
                <div class="current-price">
                  <span class="price-label">当前价</span>
                  <span class="price-value">{{ listing.currentPrice }}</span>
                </div>
                <div class="start-price">
                  <span class="price-label">起拍价</span>
                  <span class="price-value">{{ listing.startPrice }}</span>
                </div>
              </div>

              <div class="listing-meta">
                <div class="meta-item">
                  <span class="meta-icon">👤</span>
                  <span class="meta-text">{{ listing.sellerName }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">🔨</span>
                  <span class="meta-text">{{ listing.bids?.length || 0 }} 次出价</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">⏰</span>
                  <span class="meta-text">{{ formatTimeLeft(listing.endTime) }}</span>
                </div>
              </div>

              <div class="market-price">
                <span class="market-label">市场价参考</span>
                <span class="market-value">{{ marketStore.getMarketPrice(listing.mineralId) }}</span>
              </div>
            </div>

            <div class="listing-footer">
              <button 
                class="btn btn-small" 
                @click="viewMineralDetail(listing.mineralId)"
              >
                查看详情
              </button>
              <button 
                class="btn btn-small" 
                @click="openBidModal(listing)"
                :disabled="listing.sellerId === 'player'"
              >
                💰 出价
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'my'" class="my-section">
        <div class="subsection">
          <h2 class="subsection-title">📤 我的上架</h2>
          <div v-if="marketStore.myListings.length === 0" class="empty-state small">
            <p class="empty-text">暂无上架商品</p>
          </div>
          <div v-else class="my-listings">
            <div 
              v-for="listing in marketStore.myListings" 
              :key="listing.id"
              class="my-listing-item card"
            >
              <div class="my-listing-header">
                <span class="mineral-emoji">{{ getMineral(listing.mineralId)?.emoji }}</span>
                <div class="my-listing-info">
                  <h3 class="mineral-name">{{ getMineral(listing.mineralId)?.name }}</h3>
                  <div class="my-listing-stats">
                    <span class="current-price">💰 {{ listing.currentPrice }}</span>
                    <span class="bid-count">🔨 {{ listing.bids?.length || 0 }} 次出价</span>
                    <span :class="['status-badge', listing.status]">{{ getStatusText(listing.status) }}</span>
                  </div>
                </div>
                <div class="my-listing-actions">
                  <button 
                    v-if="listing.status === 'active' && (!listing.bids || listing.bids.length === 0)"
                    class="btn btn-secondary btn-small"
                    @click="cancelListing(listing.id)"
                  >
                    取消
                  </button>
                </div>
              </div>
              <div v-if="listing.status === 'ended' && listing.winner" class="my-listing-result">
                <span class="result-text">
                  ✅ 已成交！买家: {{ listing.winner.bidderName }}，成交价: {{ listing.winner.amount }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="subsection">
          <h2 class="subsection-title">📥 我的出价</h2>
          <div v-if="marketStore.myBids.length === 0" class="empty-state small">
            <p class="empty-text">暂无出价记录</p>
          </div>
          <div v-else class="my-bids">
            <div 
              v-for="listing in marketStore.myBids" 
              :key="listing.id"
              class="my-bid-item card"
            >
              <div class="my-bid-header">
                <span class="mineral-emoji">{{ getMineral(listing.mineralId)?.emoji }}</span>
                <div class="my-bid-info">
                  <h3 class="mineral-name">{{ getMineral(listing.mineralId)?.name }}</h3>
                  <div class="my-bid-stats">
                    <span class="my-bid-price">我的出价: {{ getMyBidAmount(listing) }}</span>
                    <span class="current-price">当前价: {{ listing.currentPrice }}</span>
                    <span :class="['status-badge', listing.status]">{{ getStatusText(listing.status) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="listing.status === 'ended' && listing.winner" class="my-bid-result">
                <span v-if="listing.winner.bidderId === 'player'" class="result-text win">
                  🎉 你赢了！花费 {{ listing.winner.amount }} 金币获得
                </span>
                <span v-else class="result-text lose">
                  ❌ 你未能赢得拍卖，最高价: {{ listing.winner.amount }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <button class="btn btn-large" @click="openListModal()">
            <span class="btn-icon">📤</span>
            上架我的矿物
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'history'" class="history-section">
        <div class="price-overview">
          <h2 class="subsection-title">📊 市场行情</h2>
          <div class="price-cards">
            <div 
              v-for="mineral in priceOverviewMinerals" 
              :key="mineral.id"
              class="price-card card"
              :class="`rarity-${mineral.rarity}`"
              @click="viewMineralDetail(mineral.id)"
            >
              <span class="mineral-emoji">{{ mineral.emoji }}</span>
              <span class="mineral-name">{{ mineral.name }}</span>
              <span class="mineral-price">{{ marketStore.getMarketPrice(mineral.id) }}</span>
              <div class="price-trend" :class="marketStore.getPriceTrend(mineral.id).trend">
                <span v-if="marketStore.getPriceTrend(mineral.id).trend === 'up'">📈</span>
                <span v-else-if="marketStore.getPriceTrend(mineral.id).trend === 'down'">📉</span>
                <span v-else>➡️</span>
                {{ marketStore.getPriceTrend(mineral.id).change }}%
              </div>
            </div>
          </div>
        </div>

        <div class="transactions">
          <h2 class="subsection-title">📜 成交记录</h2>
          <div v-if="marketStore.transactionHistory.length === 0" class="empty-state small">
            <p class="empty-text">暂无成交记录</p>
          </div>
          <div v-else class="transaction-list">
            <div 
              v-for="tx in marketStore.transactionHistory.slice(0, 20)" 
              :key="tx.id"
              class="transaction-item card"
              :class="`rarity-${tx.rarity}`"
            >
              <span class="mineral-emoji">{{ tx.mineralEmoji }}</span>
              <div class="tx-info">
                <span class="mineral-name">{{ tx.mineralName }}</span>
                <span class="tx-detail">{{ tx.sellerName }} → {{ tx.buyerName }}</span>
              </div>
              <div class="tx-price">
                <span class="price-value">{{ tx.price }}</span>
                <span class="tx-time">{{ formatTime(tx.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="marketStore.showListModal" class="modal-overlay" @click.self="closeListModal">
      <div class="modal-content card">
        <div class="modal-header">
          <h2 class="modal-title">上架矿物</h2>
          <button class="close-btn" @click="closeListModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="select-mineral-section">
            <h3 class="section-label">选择要上架的矿物</h3>
            <div class="selectable-minerals">
              <div 
                v-for="mineral in listableMinerals" 
                :key="mineral.id"
                :class="['selectable-mineral', { selected: selectedMineral?.id === mineral.id }]"
                @click="selectedMineral = mineral"
              >
                <span class="mineral-emoji">{{ mineral.emoji }}</span>
                <div class="mineral-details">
                  <span class="mineral-name">{{ mineral.name }}</span>
                  <span class="mineral-count">数量: {{ getMineralCount(mineral.id) }}</span>
                </div>
                <span class="mineral-base-price">底价: {{ marketStore.getBasePrice(mineral) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedMineral" class="list-form">
            <div class="form-group">
              <label class="form-label">起拍价格</label>
              <div class="price-input-wrapper">
                <input 
                  type="number" 
                  v-model.number="listPrice" 
                  class="form-input"
                  :min="minListPrice"
                  :max="maxListPrice"
                />
                <span class="currency">💰</span>
              </div>
              <div class="price-suggestions">
                <button 
                  v-for="suggestion in priceSuggestions" 
                  :key="suggestion.value"
                  class="suggestion-btn"
                  @click="listPrice = suggestion.value"
                >
                  {{ suggestion.label }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">拍卖时长</label>
              <div class="duration-options">
                <button 
                  v-for="duration in durationOptions" 
                  :key="duration.value"
                  :class="['duration-btn', { active: listDuration === duration.value }]"
                  @click="listDuration = duration.value"
                >
                  {{ duration.label }}
                </button>
              </div>
            </div>

            <div class="fee-info">
              <span class="fee-label">交易手续费: 5%</span>
              <span class="fee-calc">预计收入: {{ Math.round(listPrice * 0.95) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeListModal">取消</button>
          <button 
            class="btn" 
            @click="confirmList"
            :disabled="!selectedMineral || !listPrice || listPrice < minListPrice"
          >
            确认上架
          </button>
        </div>
      </div>
    </div>

    <div v-if="marketStore.showBidModal && marketStore.selectedListing" class="modal-overlay" @click.self="closeBidModal">
      <div class="modal-content card">
        <div class="modal-header">
          <h2 class="modal-title">出价竞拍</h2>
          <button class="close-btn" @click="closeBidModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="bid-mineral-info">
            <span class="mineral-emoji">{{ getMineral(marketStore.selectedListing.mineralId)?.emoji }}</span>
            <div class="mineral-details">
              <span class="mineral-name">{{ getMineral(marketStore.selectedListing.mineralId)?.name }}</span>
              <span class="mineral-rarity">
                {{ getRarityStars(getMineral(marketStore.selectedListing.mineralId)?.rarity) }}
                {{ RARITY_CONFIG[getMineral(marketStore.selectedListing.mineralId)?.rarity]?.name }}
              </span>
            </div>
          </div>

          <div class="bid-price-info">
            <div class="price-row">
              <span class="price-label">当前价</span>
              <span class="price-value highlight">{{ marketStore.selectedListing.currentPrice }}</span>
            </div>
            <div class="price-row">
              <span class="price-label">起拍价</span>
              <span class="price-value">{{ marketStore.selectedListing.startPrice }}</span>
            </div>
            <div class="price-row">
              <span class="price-label">市场价</span>
              <span class="price-value">{{ marketStore.getMarketPrice(marketStore.selectedListing.mineralId) }}</span>
            </div>
            <div class="price-row">
              <span class="price-label">剩余时间</span>
              <span class="price-value">{{ formatTimeLeft(marketStore.selectedListing.endTime) }}</span>
            </div>
          </div>

          <div class="bid-history" v-if="marketStore.selectedListing.bids && marketStore.selectedListing.bids.length > 0">
            <h3 class="section-label">出价历史</h3>
            <div class="bid-list">
              <div 
                v-for="(bid, index) in [...marketStore.selectedListing.bids].reverse().slice(0, 5)" 
                :key="index"
                class="bid-item"
              >
                <span class="bidder">{{ bid.bidderName }}</span>
                <span class="bid-amount">{{ bid.amount }}</span>
              </div>
            </div>
          </div>

          <div class="bid-form">
            <div class="form-group">
              <label class="form-label">你的出价</label>
              <div class="price-input-wrapper">
                <input 
                  type="number" 
                  v-model.number="bidAmount" 
                  class="form-input"
                  :min="minBidAmount"
                />
                <span class="currency">💰</span>
              </div>
              <p class="bid-hint">最低加价: {{ minBidAmount - marketStore.selectedListing.currentPrice }} 金币</p>
            </div>

            <div class="quick-bids">
              <button 
                v-for="quick in quickBids" 
                :key="quick.value"
                class="quick-bid-btn"
                @click="bidAmount = quick.value"
              >
                {{ quick.label }}
              </button>
            </div>

            <p v-if="bidError" class="bid-error">{{ bidError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeBidModal">取消</button>
          <button 
            class="btn" 
            @click="confirmBid"
            :disabled="!bidAmount || bidAmount < minBidAmount || gameStore.coins < bidAmount"
          >
            确认出价
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useMarketStore } from '@/stores/market'
import { useAudioStore } from '@/stores/audio'
import { useTaskStore } from '@/stores/task'
import { RARITY_CONFIG, getRarityStars, RARITY } from '@/data/rarity'
import { MINERALS, getMineralById } from '@/data/minerals'

const router = useRouter()
const gameStore = useGameStore()
const marketStore = useMarketStore()
const audioStore = useAudioStore()
const taskStore = useTaskStore()

const activeTab = ref('market')
const rarityFilter = ref('all')
const selectedMineral = ref(null)
const listPrice = ref(0)
const listDuration = ref(300000)
const bidAmount = ref(0)
const bidError = ref('')
const priceRefreshTimer = ref(null)
const npcBidTimer = ref(null)

const tabs = [
  { value: 'market', label: '市场', icon: '🏪' },
  { value: 'my', label: '我的', icon: '👤' },
  { value: 'history', label: '行情', icon: '📊' }
]

const rarityFilters = [
  { value: 'all', label: '全部' },
  { value: RARITY.LEGENDARY, label: '传说' },
  { value: RARITY.EPIC, label: '史诗' },
  { value: RARITY.RARE, label: '珍稀' },
  { value: RARITY.UNCOMMON, label: '稀有' },
  { value: RARITY.COMMON, label: '普通' }
]

const durationOptions = [
  { value: 300000, label: '5分钟' },
  { value: 600000, label: '10分钟' },
  { value: 1800000, label: '30分钟' },
  { value: 3600000, label: '1小时' }
]

const filteredListings = computed(() => {
  let listings = [...marketStore.activeListings]
  
  if (rarityFilter.value !== 'all') {
    listings = listings.filter(l => {
      const mineral = getMineralById(l.mineralId)
      return mineral && mineral.rarity === rarityFilter.value
    })
  }
  
  return listings
})

const listableMinerals = computed(() => {
  return gameStore.collectedMinerals.filter(m => m.count > 0)
})

const priceOverviewMinerals = computed(() => {
  return MINERALS.filter(m => gameStore.isMineralCollected(m.id) || marketStore.priceHistory[m.id])
})

const minListPrice = computed(() => {
  if (!selectedMineral.value) return 0
  return Math.round(marketStore.getBasePrice(selectedMineral.value) * 0.5)
})

const maxListPrice = computed(() => {
  if (!selectedMineral.value) return 0
  return Math.round(marketStore.getBasePrice(selectedMineral.value) * 3)
})

const priceSuggestions = computed(() => {
  if (!selectedMineral.value) return []
  const base = marketStore.getBasePrice(selectedMineral.value)
  return [
    { value: Math.round(base * 0.8), label: '低价 80%' },
    { value: base, label: '基准 100%' },
    { value: Math.round(base * 1.2), label: '溢价 120%' }
  ]
})

const minBidAmount = computed(() => {
  if (!marketStore.selectedListing) return 0
  const minIncrement = Math.max(10, Math.round(marketStore.selectedListing.currentPrice * 0.05))
  return marketStore.selectedListing.currentPrice + minIncrement
})

const quickBids = computed(() => {
  if (!marketStore.selectedListing) return []
  const current = marketStore.selectedListing.currentPrice
  return [
    { value: current + Math.max(10, Math.round(current * 0.05)), label: '+5%' },
    { value: current + Math.max(10, Math.round(current * 0.1)), label: '+10%' },
    { value: current + Math.max(10, Math.round(current * 0.2)), label: '+20%' }
  ]
})

const getMineral = (id) => getMineralById(id)

const getMineralCount = (id) => {
  const m = gameStore.collectedMinerals.find(m => m.id === id)
  return m?.count || 0
}

const getPriceTrend = (mineralId) => {
  return marketStore.getPriceTrend(mineralId)
}

const getStatusText = (status) => {
  const statusMap = {
    active: '进行中',
    ended: '已结束',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const getMyBidAmount = (listing) => {
  const bid = listing.bids?.find(b => b.bidderId === 'player')
  return bid?.amount || 0
}

const formatTimeLeft = (endTime) => {
  const now = Date.now()
  const diff = endTime - now
  
  if (diff <= 0) return '已结束'
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}小时${mins}分`
  }
  return `${minutes}分${seconds}秒`
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const viewMineralDetail = (mineralId) => {
  audioStore.playClick()
  router.push(`/mineral/${mineralId}`)
}

const openListModal = (mineral = null) => {
  audioStore.playClick()
  selectedMineral.value = mineral || marketStore.selectedMineralForList || listableMinerals.value[0] || null
  if (selectedMineral.value) {
    listPrice.value = marketStore.getBasePrice(selectedMineral.value)
  }
  marketStore.openListModal(mineral)
}

const closeListModal = () => {
  audioStore.playClick()
  marketStore.closeListModal()
  selectedMineral.value = null
  listPrice.value = 0
}

const openBidModal = (listing) => {
  if (listing.sellerId === 'player') return
  audioStore.playClick()
  bidAmount.value = minBidAmount.value
  bidError.value = ''
  marketStore.openBidModal(listing)
}

const closeBidModal = () => {
  audioStore.playClick()
  marketStore.closeBidModal()
  bidAmount.value = 0
  bidError.value = ''
}

const confirmList = () => {
  if (!selectedMineral.value) return
  
  audioStore.playSuccess()
  const result = marketStore.createListing(selectedMineral.value.id, listPrice.value, listDuration.value)
  
  if (result) {
    closeListModal()
  }
}

const confirmBid = () => {
  if (!marketStore.selectedListing) return
  
  const result = marketStore.placeBid(marketStore.selectedListing.id, bidAmount.value)
  
  if (result.success) {
    audioStore.playSuccess()
    taskStore.onMarketBid()
    closeBidModal()
  } else {
    audioStore.playError()
    bidError.value = result.message
  }
}

const cancelListing = (listingId) => {
  audioStore.playClick()
  const result = marketStore.cancelListing(listingId)
  if (result) {
    audioStore.playSuccess()
  }
}

const refreshListings = () => {
  audioStore.playClick()
  marketStore.generateMockListings()
}

const refreshPrices = () => {
  marketStore.checkAllAuctions()
}

onMounted(() => {
  if (marketStore.selectedMineralForList) {
    selectedMineral.value = marketStore.selectedMineralForList
    listPrice.value = marketStore.getBasePrice(selectedMineral.value)
  }
  
  priceRefreshTimer.value = setInterval(refreshPrices, 1000)
  npcBidTimer.value = setInterval(() => {
    marketStore.simulateNPCBids()
  }, 5000)
})

onUnmounted(() => {
  if (priceRefreshTimer.value) {
    clearInterval(priceRefreshTimer.value)
  }
  if (npcBidTimer.value) {
    clearInterval(npcBidTimer.value)
  }
})
</script>

<style scoped>
.market-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.market-header {
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

.coins-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  color: #1f2937;
}

.coins-icon {
  font-size: 18px;
}

.coins-value {
  font-size: 16px;
}

.market-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: var(--bg-card);
  padding: 4px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
}

.listings-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-state.small {
  padding: 30px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.listings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.listing-card {
  padding: 16px;
  transition: all 0.3s ease;
}

.listing-card:hover {
  transform: translateY(-2px);
  border-color: rgba(233, 69, 96, 0.3);
}

.listing-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.listing-header .mineral-emoji {
  font-size: 48px;
  flex-shrink: 0;
}

.mineral-info {
  flex: 1;
}

.mineral-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.mineral-rarity {
  font-size: 12px;
  color: inherit;
}

.price-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.price-trend.up {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.price-trend.down {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.price-trend.stable {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.listing-body {
  margin-bottom: 16px;
}

.price-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.current-price .price-label,
.start-price .price-label {
  font-size: 11px;
  color: var(--text-secondary);
  display: block;
}

.current-price .price-value {
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
}

.start-price .price-value {
  font-size: 16px;
  color: var(--text-secondary);
}

.listing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.market-price {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  font-size: 12px;
}

.market-label {
  color: var(--text-secondary);
}

.market-value {
  color: #fbbf24;
  font-weight: 600;
}

.listing-footer {
  display: flex;
  gap: 8px;
}

.listing-footer .btn {
  flex: 1;
}

.subsection {
  margin-bottom: 24px;
}

.subsection-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.my-listings,
.my-bids {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-listing-item,
.my-bid-item {
  padding: 16px;
}

.my-listing-header,
.my-bid-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.my-listing-header .mineral-emoji,
.my-bid-header .mineral-emoji {
  font-size: 40px;
}

.my-listing-info,
.my-bid-info {
  flex: 1;
}

.my-listing-stats,
.my-bid-stats {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 4px;
}

.current-price {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.bid-count,
.my-bid-price {
  font-size: 13px;
  color: var(--text-secondary);
}

.status-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.ended {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.status-badge.cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.my-listing-result,
.my-bid-result {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.result-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.result-text.win {
  color: #22c55e;
  font-weight: 600;
}

.result-text.lose {
  color: #ef4444;
}

.quick-actions {
  margin-top: 20px;
}

.quick-actions .btn-large {
  width: 100%;
  padding: 18px;
  font-size: 18px;
}

.price-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.price-card {
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.price-card:hover {
  transform: translateY(-2px);
}

.price-card .mineral-emoji {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.price-card .mineral-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.price-card .mineral-price {
  font-size: 20px;
  font-weight: 700;
  color: #fbbf24;
  display: block;
  margin-bottom: 4px;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.transaction-item .mineral-emoji {
  font-size: 32px;
}

.tx-info {
  flex: 1;
}

.tx-info .mineral-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.tx-detail {
  font-size: 11px;
  color: var(--text-secondary);
}

.tx-price {
  text-align: right;
}

.tx-price .price-value {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  display: block;
}

.tx-time {
  font-size: 10px;
  color: var(--text-secondary);
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
  padding: 16px;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
}

.modal-header {
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
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.selectable-minerals {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.selectable-mineral {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.selectable-mineral:hover {
  background: rgba(255, 255, 255, 0.1);
}

.selectable-mineral.selected {
  border-color: var(--primary);
  background: rgba(233, 69, 96, 0.1);
}

.selectable-mineral .mineral-emoji {
  font-size: 36px;
}

.mineral-details {
  flex: 1;
}

.mineral-details .mineral-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.mineral-count {
  font-size: 11px;
  color: var(--text-secondary);
}

.mineral-base-price {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.list-form,
.bid-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
  display: block;
}

.price-input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: var(--primary);
  background: rgba(233, 69, 96, 0.05);
}

.currency {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
}

.price-suggestions,
.quick-bids {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.suggestion-btn,
.quick-bid-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-btn:hover,
.quick-bid-btn:hover {
  background: rgba(233, 69, 96, 0.1);
  border-color: var(--primary);
  color: var(--primary);
}

.duration-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.duration-btn {
  flex: 1;
  min-width: 80px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.duration-btn:hover {
  border-color: rgba(233, 69, 96, 0.3);
}

.duration-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.fee-info {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 10px;
  font-size: 13px;
}

.fee-label {
  color: var(--text-secondary);
}

.fee-calc {
  color: #fbbf24;
  font-weight: 600;
}

.bid-mineral-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.bid-mineral-info .mineral-emoji {
  font-size: 56px;
}

.bid-price-info {
  margin-bottom: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.price-row .price-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.price-row .price-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.price-row .price-value.highlight {
  font-size: 22px;
  color: #fbbf24;
}

.bid-history {
  margin-bottom: 20px;
}

.bid-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.bid-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 13px;
}

.bid-item .bidder {
  color: var(--text-secondary);
}

.bid-item .bid-amount {
  color: #fbbf24;
  font-weight: 600;
}

.bid-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.bid-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-footer .btn {
  flex: 1;
}

@media (min-width: 600px) {
  .listings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .price-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .listings-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .price-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .market-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .listings-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    justify-content: center;
  }
}
</style>
