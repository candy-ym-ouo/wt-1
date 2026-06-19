<template>
  <div class="app-container">
    <div class="reward-toasts">
      <TransitionGroup name="toast">
        <div
          v-for="notification in seasonStore.rewardNotifications"
          :key="notification.id"
          class="reward-toast"
          :class="`type-${notification.type}`"
        >
          <span class="toast-emoji">{{ notification.emoji }}</span>
          <span class="toast-label">{{ notification.label }}</span>
          <span class="toast-value">+{{ notification.value }}</span>
        </div>
      </TransitionGroup>
    </div>

    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🏛️</span>
          <span class="logo-text">矿物博物馆</span>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-icon">📦</span>
            <span class="stat-value">{{ collectedCount }}/{{ totalCount }}</span>
          </div>
          <div v-if="taskClaimableCount > 0" class="stat-item task-claimable" @click="goToTasks">
            <span class="stat-icon">🎁</span>
            <span class="stat-value">{{ taskClaimableCount }}</span>
          </div>
          <button 
            class="sound-btn" 
            @click="toggleSound"
            :class="{ active: soundEnabled }"
          >
            {{ soundEnabled ? '🔊' : '🔇' }}
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <nav class="app-nav">
      <RouterLink 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.path === '/task' && taskClaimableCount > 0" class="nav-badge">{{ taskClaimableCount }}</span>
        <span v-if="item.path === '/season' && seasonClaimableCount > 0" class="nav-badge season-badge">{{ seasonClaimableCount }}</span>
      </RouterLink>
    </nav>

    <SeasonSettlementModal
      :show="seasonStore.showSettlementModal"
      :result="seasonStore.settlementResult"
      @close="seasonStore.closeSettlementModal"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="seasonStore.showSeasonStartModal && seasonStore.currentSeason" class="season-start-overlay" @click.self="seasonStore.closeSeasonStartModal()">
          <div class="season-start-popup" :style="{ background: seasonStore.currentSeason.themeGradient }">
            <div class="start-sparkles">
              <span v-for="i in 10" :key="i" class="start-sparkle" :style="getStartSparkleStyle(i)">✨</span>
            </div>
            <span class="start-emoji">{{ seasonStore.currentSeason.emoji }}</span>
            <h2 class="start-title">{{ seasonStore.currentSeason.name }}</h2>
            <p class="start-subtitle">{{ seasonStore.currentSeason.subtitle }}</p>
            <p class="start-hint">全新赛季已开启！完成通行证任务，赢取限定标本</p>
            <div class="start-actions">
              <button class="start-btn secondary" @click="seasonStore.closeSeasonStartModal()">稍后再看</button>
              <button class="start-btn primary" @click="goToSeason">进入赛季</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="marketStore.showListModal || marketStore.showBidModal">
      <RouterView name="marketModals" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game'
import { useAudioStore } from './stores/audio'
import { useMarketStore } from './stores/market'
import { useTaskStore } from './stores/task'
import { useGachaStore } from './stores/gacha'
import { useMuseumStore } from './stores/museum'
import { useQuizStore } from './stores/quiz'
import { useExchangeStore } from './stores/exchange'
import { useSeasonStore } from './stores/season'
import { useDetectorStore } from './stores/detector'
import { useResearchStore } from './stores/research'
import { useAuctionStore } from './stores/auction'
import SeasonSettlementModal from './components/SeasonSettlementModal.vue'
import { useRouter } from 'vue-router'
import { MINERALS } from './data/minerals'
import { SEASONS } from './data/season'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()
const taskStore = useTaskStore()
const gachaStore = useGachaStore()
const museumStore = useMuseumStore()
const quizStore = useQuizStore()
const exchangeStore = useExchangeStore()
const seasonStore = useSeasonStore()
const detectorStore = useDetectorStore()
const researchStore = useResearchStore()
const auctionStore = useAuctionStore()

const navItems = [
  { path: '/', icon: '🏛️', label: '博物馆' },
  { path: '/season', icon: '🏆', label: '赛季' },
  { path: '/showcase', icon: '📦', label: '展柜' },
  { path: '/expedition', icon: '🗺️', label: '远征' },
  { path: '/collage', icon: '🎨', label: '拼装' },
  { path: '/quiz', icon: '❓', label: '问答' },
  { path: '/collection', icon: '📖', label: '图鉴' },
  { path: '/gacha', icon: '🎁', label: '盲盒' },
  { path: '/auction', icon: '🎪', label: '拍卖会' },
  { path: '/market', icon: '🏪', label: '市场' },
  { path: '/exchange', icon: '🔄', label: '交换' },
  { path: '/research', icon: '🔬', label: '研究院' },
  { path: '/task', icon: '⛏️', label: '任务' }
]

const collectedCount = computed(() => gameStore.collectedMinerals.length)

const totalMineralsCount = computed(() => {
  let count = MINERALS.length
  for (const season of SEASONS) {
    if (season.limitedSpecimens) {
      count += season.limitedSpecimens.length
    }
  }
  return count
})

const totalCount = computed(() => totalMineralsCount.value)
const soundEnabled = computed(() => audioStore.soundEnabled)
const taskClaimableCount = computed(() => taskStore.claimableCount)
const seasonClaimableCount = computed(() => seasonStore.totalClaimableCount)

const toggleSound = () => {
  audioStore.toggleSound()
}

const goToTasks = () => {
  router.push('/task')
}

const goToSeason = () => {
  seasonStore.closeSeasonStartModal()
  router.push('/season')
}

const getStartSparkleStyle = (index) => {
  const angle = (index / 10) * 360
  const delay = index * 0.12
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const marketUpdateTimer = ref(null)

onMounted(() => {
  audioStore.loadAudioSettings()
  gameStore.loadProgress()
  marketStore.loadMarketData()
  taskStore.loadTaskData()
  gachaStore.loadProgress()
  museumStore.loadData()
  quizStore.loadProgress()
  exchangeStore.loadExchangeData()
  seasonStore.loadSeasonData()
  detectorStore.loadProgress()
  researchStore.loadProgress()
  auctionStore.loadAuctionData()

  gameStore.onTaskEvent = (eventName, payload) => {
    switch (eventName) {
      case 'expeditionComplete':
        taskStore.onExpeditionComplete(payload)
        seasonStore.onExpeditionComplete()
        break
      case 'staminaSpent':
        taskStore.onStaminaSpent(payload)
        break
      case 'mineralCollected':
        taskStore.onMineralCollected(payload)
        seasonStore.onMineralCollected(payload)
        break
      case 'collageComplete':
        taskStore.onCollageComplete()
        seasonStore.onCollageComplete()
        break
      case 'coinsEarned':
        taskStore.onCoinsEarned(payload)
        break
      case 'marketTransaction':
        taskStore.onMarketTransaction(payload)
        seasonStore.onMarketTransaction()
        break
      case 'marketBid':
        taskStore.onMarketBid()
        break
      case 'researchComplete':
        taskStore.onCoinsEarned(payload?.coins || 0)
        break
    }
  }
  
  marketUpdateTimer.value = setInterval(() => {
    marketStore.checkAllAuctions()
    marketStore.simulateNPCBids()
    taskStore.checkResets()
    seasonStore.checkSeasonTransition()
  }, 5000)
})

onUnmounted(() => {
  if (marketUpdateTimer.value) {
    clearInterval(marketUpdateTimer.value)
  }
})
</script>

<style scoped>
.reward-toasts {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.reward-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-emoji {
  font-size: 20px;
}

.toast-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.toast-value {
  font-size: 15px;
  font-weight: 800;
  color: #fbbf24;
}

.reward-toast.type-season_specimen {
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2));
}

.reward-toast.type-season_specimen .toast-value {
  color: #c084fc;
}

.reward-toast.type-gacha_ticket {
  border-color: rgba(239, 68, 68, 0.3);
}

.reward-toast.type-gacha_ticket .toast-value {
  color: #f87171;
}

.reward-toast.type-stamina {
  border-color: rgba(251, 146, 60, 0.3);
}

.reward-toast.type-stamina .toast-value {
  color: #fb923c;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-header {
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  height: 60px;
  display: flex;
  align-items: center;
  z-index: 100;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary), #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.sound-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--bg-card);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sound-btn:hover {
  transform: scale(1.1);
}

.sound-btn.active {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
}

.task-claimable {
  cursor: pointer;
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.3), rgba(255, 107, 107, 0.3));
  border-color: rgba(233, 69, 96, 0.5);
  animation: claimablePulse 2s ease-in-out infinite;
}

@keyframes claimablePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0); }
  50% { box-shadow: 0 0 12px 2px rgba(233, 69, 96, 0.3); }
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.app-nav {
  flex-shrink: 0;
  height: 70px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 12px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  position: relative;
  flex: 1;
  min-width: 0;
}

.nav-item.active {
  color: var(--primary);
  background: rgba(233, 69, 96, 0.1);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.nav-badge {
  position: absolute;
  top: 4px;
  right: 8px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  padding: 0 4px;
  line-height: 1;
}

.nav-badge.season-badge {
  background: #a855f7;
}

.season-start-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.season-start-popup {
  position: relative;
  border-radius: 24px;
  padding: 40px 32px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  overflow: hidden;
  animation: startPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.5);
}

@keyframes startPopIn {
  from { opacity: 0; transform: scale(0.5) translateY(40px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.start-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.start-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 18px;
  animation: startSparkle 2s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes startSparkle {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 120px),
      calc(-50% + sin(var(--angle)) * 120px)
    ) rotate(180deg) scale(1);
    opacity: 1;
  }
}

.start-emoji {
  position: relative;
  font-size: 72px;
  display: block;
  margin-bottom: 16px;
  animation: float 2s ease-in-out infinite;
}

.start-title {
  position: relative;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px 0;
}

.start-subtitle {
  position: relative;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 16px 0;
}

.start-hint {
  position: relative;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.start-actions {
  position: relative;
  display: flex;
  gap: 12px;
}

.start-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn.secondary {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

.start-btn.primary {
  background: rgba(255, 255, 255, 0.95);
  color: #1e1b4b;
}

.start-btn:hover {
  transform: translateY(-2px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@media (max-width: 480px) {
  .logo-text {
    font-size: 16px;
  }
  
  .stat-value {
    font-size: 12px;
  }
  
  .nav-icon {
    font-size: 18px;
  }

  .nav-label {
    font-size: 9px;
  }
}
</style>
