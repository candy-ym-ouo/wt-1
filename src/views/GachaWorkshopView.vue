<template>
  <div class="gacha-view">
    <div class="gacha-header">
      <div class="header-content">
        <h1 class="page-title">矿物盲盒工坊</h1>
        <p class="page-subtitle">开启神秘盲盒，收集珍稀矿物</p>
      </div>
      <div class="header-actions">
        <div class="coins-display">
          <span class="coins-icon">💰</span>
          <span class="coins-value">{{ gameStore.coins }}</span>
        </div>
        <button class="shop-btn" @click="openShop">
          <span class="shop-icon">🛒</span>
          <span class="shop-label">商店</span>
        </button>
      </div>
    </div>

    <div class="tickets-bar">
      <div 
        v-for="ticket in ticketList" 
        :key="ticket.id"
        class="ticket-chip"
        :style="{ background: ticket.gradient }"
      >
        <span class="ticket-emoji">{{ ticket.emoji }}</span>
        <span class="ticket-count">x{{ gachaStore.getTicketCount(ticket.id) }}</span>
      </div>
    </div>

    <div class="gacha-tabs">
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
      <div v-if="activeTab === 'boxes'" class="boxes-section">
        <div class="boxes-grid">
          <div 
            v-for="box in boxList" 
            :key="box.id"
            class="box-card card"
            :class="[`box-${box.id}`, { selected: selectedBox?.id === box.id }]"
            @click="selectBox(box)"
          >
            <div class="box-glow" :style="{ background: box.glowColor }"></div>
            <div class="box-visual" :style="{ background: box.gradient }">
              <span class="box-emoji">{{ box.emoji }}</span>
            </div>
            <div class="box-info">
              <h3 class="box-name">{{ box.name }}</h3>
              <p class="box-desc">{{ box.description }}</p>
            </div>
            
            <div class="pity-info">
              <div class="pity-progress">
                <div class="pity-bar">
                  <div 
                    class="pity-fill" :style="getPityStyle(box.id)"></div>
                </div>
                <span class="pity-text">
                  保底进度: {{ gachaStore.pityCounters[box.id] }}/{{ getPityMax(box.id) }}
                </span>
              </div>
              <span class="guaranteed">保底: {{ getGuaranteedRarityName(box.id) }}</span>
            </div>

            <div class="ticket-info">
              <span class="ticket-icon">{{ getTicketForBox(box.id)?.emoji }}</span>
              <span class="ticket-name">{{ getTicketForBox(box.id)?.name }}</span>
              <span class="ticket-owned">
                持有: {{ gachaStore.getTicketCount(getTicketForBox(box.id)?.id) }}</span>
            </div>

            <div class="box-actions">
              <button 
                class="btn btn-small" @click.stop="openBox(box.id, 1)"
                :disabled="!canOpenBox(box.id, 1)"
              >
                单抽
              </button>
              <button 
                class="btn btn-small btn-secondary" @click.stop="openBox(box.id, 10)"
                :disabled="!canOpenBox(box.id, 10)"
              >
                十连抽
              </button>
            </div>
          </div>
        </div>

        <div class="rarity-overview">
          <h3 class="section-title">稀有度概率</h3>
          <div class="rarity-list">
            <div 
              v-for="(config, rarity) in rarityDisplayList" 
              :key="rarity"
              class="rarity-item"
            >
              <span class="rarity-dot" :class="`rarity-${rarity}`"></span>
              <span class="rarity-name rarity-${rarity}">{{ RARITY_CONFIG[rarity].name }}</span>
              <span class="rarity-prob">{{ getRarityProb(rarity) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'history'" class="history-section">
        <div v-if="gachaStore.gachaHistory.length === 0" class="empty-state">
          <div class="empty-icon">📜</div>
          <p class="empty-text">暂无开盒记录</p>
        </div>
        <div v-else class="history-list">
          <div 
            v-for="record in gachaStore.gachaHistory.slice(0, 50)" 
            :key="record.id"
            class="history-item card"
            :class="`rarity-${record.rarity}`"
          >
            <span class="history-emoji">{{ record.mineral?.emoji }}</span>
            <div class="history-info">
              <span class="history-name">{{ record.mineral?.name }}</span>
              <span class="history-meta">
                {{ getBoxById(record.boxType)?.name }} · {{ formatTime(record.timestamp) }}
              </span>
            </div>
            <div class="history-badges">
              <span v-if="record.isNew" class="badge badge-new">NEW</span>
              <span v-if="record.isPity" class="badge badge-pity">保底</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <GachaAnimation 
      :show="showAnimation"
      :box-type="animationBoxType"
      :results="animationResults"
      @close="handleAnimationClose"
    />

    <div v-if="gachaStore.showShopModal" class="modal-overlay" @click.self="closeShop">
      <div class="modal-content card">
        <div class="modal-header">
          <h2 class="modal-title">盲盒券商店</h2>
          <button class="close-btn" @click="closeShop">✕</button>
        </div>
        <div class="modal-body">
          <div 
            v-for="ticket in ticketList" 
            :key="ticket.id"
            class="shop-item"
          >
            <div class="shop-item-header">
              <div class="shop-item-icon" :style="{ background: ticket.gradient }">
                <span class="shop-item-emoji">{{ ticket.emoji }}</span>
              </div>
              <div class="shop-item-info">
                <h3 class="shop-item-name">{{ ticket.name }}</h3>
                <p class="shop-item-desc">{{ ticket.description }}</p>
                <p class="shop-item-owned">当前持有: {{ gachaStore.getTicketCount(ticket.id) }}</p>
              </div>
            </div>
            <div class="shop-item-actions">
              <button 
                class="btn btn-small" @click="handleBuy(ticket.id, 1)">
                💰 {{ ticket.coinPrice }} 购买</button>
              <button 
                class="btn btn-small btn-secondary" @click="handleBuy(ticket.id, 10)">
                💰 {{ ticket.coinPrice * 10 }} 十连</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { useGachaStore } from '@/stores/gacha'
import { useAudioStore } from '@/stores/audio'
import { 
  BOX_CONFIG, 
  TICKET_CONFIG, 
  TICKET_TYPES,
  BOX_TYPES,
  PITY_CONFIG,
  getBoxById 
} from '@/data/gacha'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import GachaAnimation from '@/components/GachaAnimation.vue'

const gameStore = useGameStore()
const gachaStore = useGachaStore()
const audioStore = useAudioStore()

const activeTab = ref('boxes')
const selectedBox = ref(null)
const showAnimation = ref(false)
const animationBoxType = ref(null)
const animationResults = ref([])

const tabs = [
  { value: 'boxes', label: '盲盒', icon: '🎁' },
  { value: 'history', label: '记录', icon: '📜' }
]

const ticketList = computed(() => Object.values(TICKET_CONFIG))
const boxList = computed(() => Object.values(BOX_CONFIG))

const rarityDisplayList = computed(() => {
  if (!selectedBox.value) return RARITY_CONFIG
  const ticket = getTicketForBox(selectedBox.value.id)
  if (!ticket) return RARITY_CONFIG
  return RARITY_CONFIG
})

onMounted(() => {
  if (!selectedBox.value) {
    selectedBox.value = boxList.value[0]
  }
  gachaStore.loadProgress()
})

const selectBox = (box) => {
  audioStore.playClick()
  selectedBox.value = box
}

const getTicketForBox = (boxId) => {
  const box = getBoxById(boxId)
  return box ? TICKET_CONFIG[box.ticketType] : null
}

const getPityMax = (boxId) => {
  return PITY_CONFIG[boxId]?.pityCount || 10
}

const getGuaranteedRarityName = (boxId) => {
  const config = PITY_CONFIG[boxId]
  if (!config) return ''
  return RARITY_CONFIG[config.guaranteedRarity]?.name || ''
}

const getPityStyle = (boxId) => {
  const current = gachaStore.pityCounters[boxId] || 0
  const max = getPityMax(boxId)
  const percentage = Math.min(100, (current / max) * 100)
  return { width: `${percentage}%` }
}

const getRarityProb = (rarity) => {
  if (!selectedBox.value) return 0
  const ticket = getTicketForBox(selectedBox.value.id)
  if (!ticket) return 0
  const weights = ticket.rarityWeights
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (total === 0) return 0
  return Math.round((weights[rarity] / total) * 100)
}

const canOpenBox = (boxId, count) => {
  const ticket = getTicketForBox(boxId)
  if (!ticket) return false
  return gachaStore.getTicketCount(ticket.id) >= count
}

const openBox = async (boxId, count) => {
  if (!canOpenBox(boxId, count)) return
  if (showAnimation.value) return

  audioStore.playClick()
  animationBoxType.value = boxId

  const result = await gachaStore.performGacha(boxId, count)
  
  if (result.success) {
    animationResults.value = result.results
    showAnimation.value = true
  }
}

const handleAnimationClose = () => {
  showAnimation.value = false
  animationResults.value = []
  animationBoxType.value = null
}

const openShop = () => {
  audioStore.playClick()
  gachaStore.openShopModal()
}

const closeShop = () => {
  audioStore.playClick()
  gachaStore.closeShopModal()
}

const handleBuy = async (ticketType, count) => {
  audioStore.playClick()
  let result
  if (count === 1) {
    result = await gachaStore.buyTicket(ticketType)
  } else {
    result = await gachaStore.buyTickets(ticketType, count)
  }
  
  if (result.success) {
    audioStore.playSuccess()
  } else {
    audioStore.playError()
  }
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
.gacha-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.gacha-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
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

.shop-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  border: none;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.shop-icon {
  font-size: 18px;
}

.tickets-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ticket-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ticket-emoji {
  font-size: 18px;
}

.gacha-tabs {
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

.boxes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.box-card {
  position: relative;
  padding: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.box-card:hover {
  transform: translateY(-4px);
}

.box-card.selected {
  border-color: var(--primary);
  box-shadow: 0 0 30px rgba(233, 69, 96, 0.2);
}

.box-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
  pointer-events: none;
}

.box-visual {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.box-emoji {
  font-size: 60px;
  display: block;
  animation: float 3s ease-in-out infinite;
}

.box-info {
  text-align: center;
  margin-bottom: 16px;
}

.box-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.box-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.pity-info {
  margin-bottom: 16px;
}

.pity-progress {
  margin-bottom: 8px;
}

.pity-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.pity-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.pity-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.guaranteed {
  font-size: 12px;
  color: #fbbf24;
  font-weight: 600;
}

.ticket-info {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 16px;
}

.ticket-icon {
  font-size: 18px;
}

.ticket-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.ticket-owned {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
}

.box-actions {
  display: flex;
  gap: 10px;
}

.box-actions .btn {
  flex: 1;
}

.btn-small {
  padding: 10px 16px;
  font-size: 14px;
}

.rarity-overview {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.rarity-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.rarity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.rarity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.rarity-dot.rarity-common { background: var(--common); }
.rarity-dot.rarity-uncommon { background: var(--uncommon); }
.rarity-dot.rarity-rare { background: var(--rare); }
.rarity-dot.rarity-epic { background: var(--epic); }
.rarity-dot.rarity-legendary { background: var(--legendary); }

.rarity-name {
  font-size: 13px;
  font-weight: 500;
}

.rarity-prob {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.history-emoji {
  font-size: 36px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.history-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.badge-new {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.badge-pity {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
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
  max-width: 480px;
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

.shop-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.shop-item-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.shop-item-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shop-item-emoji {
  font-size: 28px;
}

.shop-item-info {
  flex: 1;
  min-width: 0;
}

.shop-item-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.shop-item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.shop-item-owned {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.shop-item-actions {
  display: flex;
  gap: 8px;
}

.shop-item-actions .btn {
  flex: 1;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 600px) {
  .boxes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .boxes-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .rarity-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .gacha-header {
    flex-direction: column;
    gap: 12px;
  }

  .shop-item-actions {
    flex-direction: column;
  }
}
</style>
