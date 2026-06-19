<template>
  <div class="app-container">
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
      </RouterLink>
    </nav>

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
import { useRouter } from 'vue-router'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()
const taskStore = useTaskStore()
const gachaStore = useGachaStore()
const museumStore = useMuseumStore()
const quizStore = useQuizStore()

const navItems = [
  { path: '/', icon: '🏛️', label: '博物馆' },
  { path: '/showcase', icon: '📦', label: '展柜' },
  { path: '/expedition', icon: '🗺️', label: '远征' },
  { path: '/collage', icon: '🎨', label: '拼装' },
  { path: '/quiz', icon: '❓', label: '问答' },
  { path: '/collection', icon: '📖', label: '图鉴' },
  { path: '/gacha', icon: '🎁', label: '盲盒' },
  { path: '/market', icon: '🏪', label: '市场' },
  { path: '/task', icon: '⛏️', label: '任务' }
]

const collectedCount = computed(() => gameStore.collectedMinerals.length)
const totalCount = computed(() => gameStore.allMinerals.length)
const soundEnabled = computed(() => audioStore.soundEnabled)
const taskClaimableCount = computed(() => taskStore.claimableCount)

const toggleSound = () => {
  audioStore.toggleSound()
}

const goToTasks = () => {
  router.push('/task')
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

  gameStore.onTaskEvent = (eventName, payload) => {
    switch (eventName) {
      case 'expeditionComplete':
        taskStore.onExpeditionComplete(payload)
        break
      case 'staminaSpent':
        taskStore.onStaminaSpent(payload)
        break
      case 'mineralCollected':
        taskStore.onMineralCollected(payload)
        break
      case 'collageComplete':
        taskStore.onCollageComplete()
        break
      case 'coinsEarned':
        taskStore.onCoinsEarned(payload)
        break
      case 'marketTransaction':
        taskStore.onMarketTransaction(payload)
        break
      case 'marketBid':
        taskStore.onMarketBid()
        break
    }
  }
  
  marketUpdateTimer.value = setInterval(() => {
    marketStore.checkAllAuctions()
    marketStore.simulateNPCBids()
    taskStore.checkResets()
  }, 5000)
})

onUnmounted(() => {
  if (marketUpdateTimer.value) {
    clearInterval(marketUpdateTimer.value)
  }
})
</script>

<style scoped>
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
