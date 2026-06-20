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
          <div class="stat-item" @click="goToTasks">
            <span class="stat-icon">📦</span>
            <span class="stat-value">{{ collectedCount }}/{{ totalCount }}</span>
          </div>
          <div class="stat-item coin-stat" @click="openCoinFlow">
            <span class="stat-icon">🪙</span>
            <span class="stat-value">{{ formatNumber(gameStore.coins) }}</span>
          </div>
          <div v-if="taskClaimableCount > 0" class="stat-item task-claimable" @click="goToTasks">
            <span class="stat-icon">🎁</span>
            <span class="stat-value">{{ taskClaimableCount }}</span>
          </div>
          <button 
            class="sound-btn" 
            @click="openSaveSlotManager"
            title="存档管理"
          >
            💾
          </button>
          <button 
            class="sound-btn" 
            @click="openAudioSettings"
            :class="{ active: soundEnabled }"
            :title="soundEnabled ? '音效设置' : '音效已关闭'"
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

    <FirstDiscoveryCelebration
      :visible="gameStore.showFirstDiscoveryCelebration"
      :mineral="gameStore.firstDiscoveryMineral"
      :coin-reward="gameStore.firstDiscoveryRewards?.coins || 0"
      :exp-reward="gameStore.firstDiscoveryRewards?.exp || 0"
      achievement-text="矿物收藏家"
      @close="gameStore.closeFirstDiscoveryCelebration"
    />
    
    <CoinFlowModal 
      :visible="showCoinFlow" 
      @close="closeCoinFlow" 
    />

    <SaveSlotManager
      :visible="showSaveSlotManager"
      @close="closeSaveSlotManager"
      @slot-changed="handleSlotChanged"
      @binding-changed="handleBindingChanged"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAudioSettings" class="audio-settings-overlay" @click.self="closeAudioSettings">
          <div class="audio-settings-modal">
            <div class="as-header">
              <div class="as-title-row">
                <span class="as-title-icon">🎵</span>
                <div class="as-title-info">
                  <h2 class="as-title">音效设置</h2>
                  <p class="as-subtitle">自定义你的听觉体验</p>
                </div>
              </div>
              <button class="as-close-btn" @click="closeAudioSettings">✕</button>
            </div>

            <div class="as-content">
              <div class="as-section master-section">
                <h3 class="as-section-title">🎛️ 总控开关</h3>
                <div class="as-master-toggles">
                  <div class="as-toggle-card" :class="{ active: audioStore.soundEnabled }">
                    <div class="as-toggle-info">
                      <span class="as-toggle-icon">{{ audioStore.soundEnabled ? '🔊' : '🔇' }}</span>
                      <div class="as-toggle-text">
                        <span class="as-toggle-name">音效总开关</span>
                        <span class="as-toggle-desc">{{ audioStore.soundEnabled ? '所有音效已开启' : '所有音效已关闭' }}</span>
                      </div>
                    </div>
                    <div class="as-switch" :class="{ on: audioStore.soundEnabled }" @click="audioStore.toggleSound()">
                      <div class="as-switch-thumb"></div>
                    </div>
                  </div>

                  <div class="as-toggle-card" :class="{ active: audioStore.musicEnabled }">
                    <div class="as-toggle-info">
                      <span class="as-toggle-icon">{{ audioStore.musicEnabled ? '🎵' : '🚫' }}</span>
                      <div class="as-toggle-text">
                        <span class="as-toggle-name">背景音乐</span>
                        <span class="as-toggle-desc">{{ audioStore.musicEnabled ? '轻柔的背景旋律' : '安静模式' }}</span>
                      </div>
                    </div>
                    <div class="as-switch" :class="{ on: audioStore.musicEnabled }" @click="handleToggleMusic">
                      <div class="as-switch-thumb"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="as-section volume-section">
                <h3 class="as-section-title">🔊 音量调节</h3>
                <div class="as-volume-cards">
                  <div class="as-volume-card">
                    <div class="as-volume-header">
                      <span class="as-volume-icon">🎼</span>
                      <span class="as-volume-name">背景音乐</span>
                      <span class="as-volume-value">{{ Math.round(audioStore.musicVolume * 100) }}%</span>
                    </div>
                    <input
                      type="range"
                      class="as-range"
                      min="0"
                      max="100"
                      :value="Math.round(audioStore.musicVolume * 100)"
                      @input="audioStore.setMusicVolume($event.target.value / 100)"
                    />
                    <div class="as-range-labels">
                      <span>静音</span>
                      <span>最大</span>
                    </div>
                  </div>

                  <div class="as-volume-card">
                    <div class="as-volume-header">
                      <span class="as-volume-icon">🔔</span>
                      <span class="as-volume-name">总音效</span>
                      <span class="as-volume-value">{{ Math.round(audioStore.sfxVolume * 100) }}%</span>
                    </div>
                    <input
                      type="range"
                      class="as-range"
                      min="0"
                      max="100"
                      :value="Math.round(audioStore.sfxVolume * 100)"
                      @input="audioStore.setSfxVolume($event.target.value / 100)"
                    />
                    <div class="as-range-labels">
                      <span>静音</span>
                      <span>最大</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="as-section discovery-section">
                <h3 class="as-section-title">✨ 特殊音效</h3>
                <div class="as-discovery-card" :class="{ active: audioStore.rareDiscoveryEnabled }">
                  <div class="as-discovery-info">
                    <div class="as-discovery-icon-wrap">
                      <span class="as-discovery-icon">💎</span>
                      <span class="as-discovery-sparkle" v-if="audioStore.rareDiscoveryEnabled">✨</span>
                    </div>
                    <div class="as-discovery-text">
                      <span class="as-discovery-name">稀有发现音效</span>
                      <span class="as-discovery-desc">
                        {{ audioStore.rareDiscoveryEnabled 
                          ? '发现稀有矿物时播放庆祝音效与特效音' 
                          : '关闭后稀有发现将静默' 
                        }}
                      </span>
                    </div>
                  </div>
                  <div class="as-switch" :class="{ on: audioStore.rareDiscoveryEnabled }" @click="audioStore.toggleRareDiscovery()">
                    <div class="as-switch-thumb"></div>
                  </div>
                </div>
                <button 
                  :class="['as-preview-btn', previewDiscoveryClass]"
                  @click="playRarePreview"
                  :disabled="!audioStore.rareDiscoveryEnabled"
                >
                  <span class="as-preview-icon">▶</span>
                  <span>试听稀有音效</span>
                </button>
              </div>

              <div class="as-section scenes-section">
                <div class="as-section-header">
                  <h3 class="as-section-title">🎯 场景分类音量</h3>
                  <button class="as-reset-btn" @click="audioStore.resetSceneVolumes">
                    ↺ 全部重置
                  </button>
                </div>

                <div class="as-scenes-grid">
                  <div 
                    v-for="scene in sceneCategoryList" 
                    :key="scene.id"
                    :class="getSceneCardClass(scene)"
                  >
                    <div class="as-scene-header">
                      <span class="as-scene-icon">{{ scene.icon }}</span>
                      <div class="as-scene-info">
                        <span class="as-scene-name">{{ scene.name }}</span>
                        <span class="as-scene-desc">{{ scene.description }}</span>
                      </div>
                      <span class="as-scene-volume">
                        {{ Math.round(audioStore.sceneVolumes[scene.id] * 100) }}%
                      </span>
                    </div>
                    <input
                      type="range"
                      class="as-range as-scene-range"
                      min="0"
                      max="100"
                      :value="Math.round(audioStore.sceneVolumes[scene.id] * 100)"
                      @input="audioStore.setSceneVolume(scene.id, $event.target.value / 100)"
                    />
                    <div class="as-scene-samples" v-if="audioStore.getSamplesByCategory(scene.id).length > 0">
                      <button
                        v-for="sample in audioStore.getSamplesByCategory(scene.id)"
                        :key="sample.key"
                        :class="getSampleBtnClass(scene.id)"
                        @click="playSample(sample.key)"
                      >
                        <span class="as-sample-name">{{ sample.name }}</span>
                        <span class="as-sample-play">▶</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="as-footer">
              <button class="as-footer-hint">
                💡 提示：所有设置自动保存到本地
              </button>
              <button class="btn as-close-action" @click="closeAudioSettings">
                完成设置
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import CoinFlowModal from './components/CoinFlowModal.vue'
import FirstDiscoveryCelebration from './components/FirstDiscoveryCelebration.vue'
import SaveSlotManager from './components/SaveSlotManager.vue'
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

const showCoinFlow = ref(false)
const showAudioSettings = ref(false)
const showSaveSlotManager = ref(false)

const openCoinFlow = () => {
  audioStore.playClick()
  showCoinFlow.value = true
}

const closeCoinFlow = () => {
  showCoinFlow.value = false
}

const openAudioSettings = () => {
  audioStore.playClick()
  showAudioSettings.value = true
}

const closeAudioSettings = () => {
  audioStore.playClick()
  showAudioSettings.value = false
}

const openSaveSlotManager = () => {
  audioStore.playClick()
  showSaveSlotManager.value = true
}

const closeSaveSlotManager = () => {
  showSaveSlotManager.value = false
}

const handleToggleMusic = () => {
  audioStore.toggleMusic()
}

const handleSlotChanged = (slotId) => {
  console.log('Slot changed to:', slotId)
}

const handleBindingChanged = (binding) => {
  console.log('Binding changed:', binding)
}

const sceneCategoryList = computed(() => {
  return Object.values(audioStore.SCENE_CATEGORIES)
})

const previewDiscoveryClass = computed(() => {
  return audioStore.currentPreviewScene === 'discovery' ? 'playing' : ''
})

const playRarePreview = () => {
  audioStore.playPreview('rareFound')
}

const isPreviewingScene = (sceneId) => {
  return audioStore.currentPreviewScene === sceneId
}

const getSceneCardClass = (scene) => {
  const classes = ['as-scene-card']
  if (audioStore.sceneVolumes[scene.id] === 0) classes.push('muted')
  if (audioStore.currentPreviewScene === scene.id) classes.push('previewing')
  return classes
}

const getSampleBtnClass = (sceneId) => {
  return audioStore.currentPreviewScene === sceneId ? ['as-sample-btn', 'playing'] : ['as-sample-btn']
}

const playSample = (sfxKey) => {
  audioStore.playPreview(sfxKey)
}

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

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

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
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}

.coin-stat {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
  border-color: rgba(245, 158, 11, 0.3);
  font-weight: 700;
}

.coin-stat:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2));
}

.coin-stat .stat-value {
  color: #fbbf24;
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

.audio-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.audio-settings-modal {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  max-width: 520px;
  width: 100%;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
  animation: asSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes asSlideIn {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.as-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.1), rgba(168, 85, 247, 0.05));
}

.as-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.as-title-icon {
  font-size: 40px;
  animation: asTitleFloat 3s ease-in-out infinite;
}

@keyframes asTitleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.as-title-info .as-title {
  margin: 0 0 2px 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  background: linear-gradient(135deg, #e94560, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.as-title-info .as-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.as-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.as-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.as-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.as-content::-webkit-scrollbar {
  width: 6px;
}

.as-content::-webkit-scrollbar-track {
  background: transparent;
}

.as-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.as-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.as-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.as-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.as-master-toggles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.as-toggle-card {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.25s;
}

.as-toggle-card.active {
  border-color: rgba(233, 69, 96, 0.3);
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.08), rgba(255, 255, 255, 0.02));
}

.as-toggle-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.as-toggle-icon {
  font-size: 26px;
  flex-shrink: 0;
}

.as-toggle-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.as-toggle-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.as-toggle-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.as-switch {
  width: 44px;
  height: 26px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.15);
  position: relative;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
}

.as-switch.on {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  box-shadow: 0 0 12px rgba(233, 69, 96, 0.4);
}

.as-switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.as-switch.on .as-switch-thumb {
  left: 21px;
}

.as-volume-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.as-volume-card {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.as-volume-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.as-volume-icon {
  font-size: 20px;
}

.as-volume-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.as-volume-value {
  font-size: 14px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #e94560;
  min-width: 45px;
  text-align: right;
}

.as-range {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
}

.as-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(233, 69, 96, 0.5);
  border: 2px solid white;
  transition: transform 0.15s;
}

.as-range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.as-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(233, 69, 96, 0.5);
  border: 2px solid white;
}

.as-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.as-discovery-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(251, 191, 36, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.25s;
}

.as-discovery-card.active {
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
}

.as-discovery-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.as-discovery-icon-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.as-discovery-icon {
  font-size: 24px;
}

.as-discovery-sparkle {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 14px;
  animation: sparkleSpin 2s linear infinite;
}

@keyframes sparkleSpin {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
}

.as-discovery-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.as-discovery-name {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.as-discovery-desc {
  font-size: 12px;
  color: rgba(251, 191, 36, 0.7);
  margin-top: 2px;
  line-height: 1.4;
}

.as-preview-btn {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px dashed rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.08);
  color: #fbbf24;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.as-preview-btn:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.5);
}

.as-preview-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.as-preview-btn.playing {
  background: rgba(245, 158, 11, 0.25);
  animation: asPulse 1s ease-in-out infinite;
}

@keyframes asPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.2); }
}

.as-preview-icon {
  font-size: 14px;
}

.as-reset-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.as-reset-btn:hover {
  background: rgba(233, 69, 96, 0.15);
  border-color: rgba(233, 69, 96, 0.3);
  color: #e94560;
}

.as-scenes-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.as-scene-card {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.25s;
}

.as-scene-card.muted {
  opacity: 0.55;
  border-color: rgba(239, 68, 68, 0.2);
}

.as-scene-card.previewing {
  border-color: rgba(233, 69, 96, 0.5);
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.1), var(--bg-card));
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.15);
}

.as-scene-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.as-scene-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.as-scene-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.as-scene-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.as-scene-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.as-scene-volume {
  font-size: 13px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #e94560;
  min-width: 45px;
  text-align: right;
}

.as-scene-range {
  height: 5px;
}

.as-scene-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
}

.as-scene-samples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
  margin-top: 2px;
}

.as-sample-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.as-sample-btn:hover {
  background: rgba(233, 69, 96, 0.12);
  border-color: rgba(233, 69, 96, 0.3);
  color: #e94560;
}

.as-sample-btn.playing {
  background: rgba(233, 69, 96, 0.2);
  border-color: rgba(233, 69, 96, 0.5);
  color: #e94560;
}

.as-sample-name {
  white-space: nowrap;
}

.as-sample-play {
  font-size: 10px;
  opacity: 0.8;
}

.as-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.as-footer-hint {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: left;
  padding: 0;
  cursor: default;
}

.as-close-action {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.4);
  transition: all 0.2s;
  flex-shrink: 0;
}

.as-close-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.5);
}

@media (max-width: 560px) {
  .audio-settings-modal {
    max-height: 92vh;
    border-radius: 20px;
  }

  .as-header,
  .as-content,
  .as-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .as-master-toggles {
    grid-template-columns: 1fr;
  }

  .as-title {
    font-size: 19px;
  }

  .as-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .as-footer-hint {
    text-align: center;
  }
}
</style>
