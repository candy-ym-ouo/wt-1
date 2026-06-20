<template>
  <div class="collage-view">
    <div v-if="!currentMineral" class="collage-start">
      <div class="start-content">
        <div class="start-icon">🎨</div>
        <h1 class="start-title">矿物拼装</h1>
        <p class="start-desc">
          根据稀有度概率随机获得矿物碎片，<br>
          将碎片拖放到正确位置，拼出完整的矿物标本！
        </p>

        <div v-if="gameStore.hasActiveCollage" class="resume-banner" @click="resumeCollage">
          <span class="resume-icon">🔄</span>
          <div class="resume-info">
            <span class="resume-title">继续拼装</span>
            <span class="resume-detail">{{ gameStore.currentCollage?.emoji }} {{ gameStore.currentCollage?.name }} · 进度 {{ gameStore.collageProgress }}%</span>
          </div>
          <span class="resume-arrow">→</span>
        </div>

        <div v-if="gameStore.hasCollageSnapshot" class="snapshot-banner" @click="restoreSnapshot">
          <span class="snapshot-icon">↩️</span>
          <div class="snapshot-info">
            <span class="snapshot-title">恢复误删拼装</span>
            <span class="snapshot-detail">{{ gameStore.collageSnapshot?.mineral?.emoji }} {{ gameStore.collageSnapshot?.mineral?.name }}</span>
          </div>
          <button class="snapshot-dismiss" @click.stop="dismissSnapshot">✕</button>
        </div>
        
        <div class="rarity-info">
          <h3 class="info-title">稀有度概率</h3>
          <div class="rarity-list">
            <div 
              v-for="(config, rarity) in RARITY_CONFIG" 
              :key="rarity"
              class="rarity-item"
            >
              <span class="rarity-dot" :style="{ background: config.color }"></span>
              <span :class="['rarity-name', `rarity-${rarity}`]">{{ config.name }}</span>
              <span class="rarity-prob">{{ (config.probability * 100).toFixed(0) }}%</span>
              <span class="rarity-pieces">{{ config.pieceCount }}块碎片</span>
            </div>
          </div>
        </div>

        <button class="btn btn-large start-btn" @click="startCollage">
          <span class="btn-icon">✨</span>
          开始拼装
        </button>

        <button 
          v-if="uncollectedMinerals.length > 0" 
          class="btn btn-secondary"
          @click="showMineralSelect = true"
        >
          选择指定矿物
        </button>
      </div>
    </div>

    <div v-else class="collage-game">
      <div class="game-header">
        <div class="mineral-info-bar">
          <span class="mineral-emoji">{{ currentMineral.emoji }}</span>
          <div class="mineral-details">
            <span class="mineral-name">{{ currentMineral.name }}</span>
            <span :class="['mineral-rarity', `rarity-${currentMineral.rarity}`]">
              {{ rarityConfig.name }} {{ getRarityStars(currentMineral.rarity) }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <span class="auto-save-hint" v-if="lastSaveTime">已保存 {{ formatSaveTime(lastSaveTime) }}</span>
          <button class="btn btn-secondary btn-small" @click="requestResetCollage">
            重新开始
          </button>
        </div>
      </div>

      <div class="game-area">
        <PixiCollage
          v-if="currentMineral && pieces.length > 0"
          :mineral="currentMineral"
          :pieces="pieces"
          :auto-start="isResuming"
          @complete="onCollageComplete"
          @piece-update="onPieceUpdate"
        />
      </div>
    </div>

    <NewMineralModal
      :show="showModal"
      :mineral="newMineral"
      :is-new="isNewMineral"
      @close="closeModal"
    />

    <div v-if="showMineralSelect" class="mineral-select-overlay" @click.self="closeMineralSelect">
      <div class="mineral-select-content">
        <div class="select-header">
          <h3>选择矿物</h3>
          <button class="close-btn" @click="closeMineralSelect">✕</button>
        </div>
        
        <div class="select-toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="search-input" 
              placeholder="搜索矿物名称..."
              @input="onSearchInput"
            />
            <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
          </div>
          
          <div class="sort-controls">
            <button 
              :class="['sort-btn', { active: sortBy === 'rarity_desc' }]"
              @click="setSortBy('rarity_desc')"
              title="稀有度从高到低"
            >
              稀有度 ↓
            </button>
            <button 
              :class="['sort-btn', { active: sortBy === 'rarity_asc' }]"
              @click="setSortBy('rarity_asc')"
              title="稀有度从低到高"
            >
              稀有度 ↑
            </button>
            <button 
              :class="['sort-btn', { active: sortBy === 'name' }]"
              @click="setSortBy('name')"
              title="按名称排序"
            >
              名称
            </button>
          </div>
        </div>
        
        <div class="coin-summary">
          <span class="coin-label">当前金币</span>
          <span class="coin-amount">{{ gameStore.coins }} 🪙</span>
          <span class="coin-divider">|</span>
          <span class="coin-affordable">可购买 {{ affordableCount }} 种</span>
        </div>
        
        <div class="select-list">
          <div 
            v-for="mineral in filteredMinerals" 
            :key="mineral.id"
            :class="['select-item', { 'affordable': canAfford(mineral), 'unaffordable': !canAfford(mineral) }]"
            @click="selectMineral(mineral)"
          >
            <span class="item-emoji">{{ mineral.emoji }}</span>
            <div class="item-info">
              <span class="item-name">{{ mineral.name }}</span>
              <span :class="['item-rarity', `rarity-${mineral.rarity}`]">
                {{ RARITY_CONFIG[mineral.rarity].name }} {{ getRarityStars(mineral.rarity) }}
              </span>
            </div>
            <div class="item-cost-section">
              <span class="item-cost">{{ getMineralCost(mineral) }} 🪙</span>
              <span v-if="!canAfford(mineral)" class="cost-shortage">
                还差 {{ getShortage(mineral) }} 🪙
              </span>
            </div>
          </div>
          
          <div v-if="filteredMinerals.length === 0" class="empty-state">
            <span class="empty-icon">🔍</span>
            <span class="empty-text">没有找到匹配的矿物</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showCoinShortage" class="confirm-overlay" @click.self="showCoinShortage = false">
      <div class="confirm-content shortage-content">
        <div class="confirm-icon">💰</div>
        <h3>金币不足</h3>
        <p class="shortage-desc">
          还差 <span class="shortage-amount">{{ shortageAmount }} 🪙</span> 才能选择 
          <span class="shortage-mineral">{{ shortageMineral?.emoji }} {{ shortageMineral?.name }}</span>
        </p>
        <div class="shortage-tips">
          <p class="tips-title">💡 获取金币的方法：</p>
          <ul class="tips-list">
            <li>🎨 完成矿物拼装获得奖励</li>
            <li>🗺️ 探险发现矿物赚取金币</li>
            <li>📋 完成每日任务领取奖励</li>
            <li>💹 在市场出售重复矿物</li>
          </ul>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showCoinShortage = false">知道了</button>
          <button class="btn" @click="goEarnCoins">去赚金币</button>
        </div>
      </div>
    </div>

    <div v-if="showExitConfirm" class="confirm-overlay">
      <div class="confirm-content">
        <div class="confirm-icon">⚠️</div>
        <h3>确认离开？</h3>
        <p>当前拼装进度将自动保存，下次回来可以继续。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="cancelExit">继续拼装</button>
          <button class="btn" @click="confirmExit">保存并离开</button>
        </div>
      </div>
    </div>

    <div v-if="showResetConfirm" class="confirm-overlay">
      <div class="confirm-content">
        <div class="confirm-icon">🔄</div>
        <h3>确认重新开始？</h3>
        <p>当前拼装进度会被暂存，你可以随时恢复。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showResetConfirm = false">取消</button>
          <button class="btn btn-danger" @click="confirmResetCollage">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import PixiCollage from '@/components/PixiCollage.vue'
import NewMineralModal from '@/components/NewMineralModal.vue'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()

const currentMineral = ref(null)
const pieces = ref([])
const showMineralSelect = ref(false)
const showExitConfirm = ref(false)
const showResetConfirm = ref(false)
const showCoinShortage = ref(false)
const lastSaveTime = ref(null)
const isResuming = ref(false)
const searchQuery = ref('')
const sortBy = ref('rarity_desc')
const shortageMineral = ref(null)
const shortageAmount = ref(0)

let pendingLeaveRoute = null
let autoSaveTimer = null

const RARITY_LEVEL = {
  legendary: 4,
  epic: 3,
  rare: 2,
  uncommon: 1,
  common: 0
}

const showModal = computed(() => gameStore.showNewMineralModal)
const newMineral = computed(() => gameStore.newMineral)
const isNewMineral = computed(() => gameStore.isNewMineral)

const rarityConfig = computed(() => {
  return currentMineral.value ? RARITY_CONFIG[currentMineral.value.rarity] : RARITY_CONFIG.common
})

const uncollectedMinerals = computed(() => {
  return gameStore.allMinerals.filter(m => !gameStore.isMineralCollected(m.id))
})

const getMineralCost = (mineral) => {
  return RARITY_CONFIG[mineral.rarity].starCount * 50
}

const canAfford = (mineral) => {
  return gameStore.coins >= getMineralCost(mineral)
}

const getShortage = (mineral) => {
  const cost = getMineralCost(mineral)
  return Math.max(0, cost - gameStore.coins)
}

const affordableCount = computed(() => {
  return uncollectedMinerals.value.filter(m => canAfford(m)).length
})

const filteredMinerals = computed(() => {
  let result = [...uncollectedMinerals.value]
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.nameEn.toLowerCase().includes(query)
    )
  }
  
  if (sortBy.value === 'rarity_desc') {
    result.sort((a, b) => RARITY_LEVEL[b.rarity] - RARITY_LEVEL[a.rarity])
  } else if (sortBy.value === 'rarity_asc') {
    result.sort((a, b) => RARITY_LEVEL[a.rarity] - RARITY_LEVEL[b.rarity])
  } else if (sortBy.value === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }
  
  return result
})

const isActiveCollage = computed(() => {
  return currentMineral.value !== null && pieces.value.length > 0
})

const formatSaveTime = (time) => {
  const diff = Date.now() - time
  if (diff < 5000) return '刚刚'
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
  return `${Math.floor(diff / 60000)}分钟前`
}

const startCollage = () => {
  audioStore.playClick()
  audioStore.initAudioContext()
  isResuming.value = false
  
  const result = gameStore.startNewCollage()
  currentMineral.value = result.mineral
  pieces.value = [...result.pieces]
  lastSaveTime.value = Date.now()
  startAutoSave()
}

const resumeCollage = () => {
  audioStore.playClick()
  if (gameStore.currentCollage && gameStore.collagePieces.length > 0) {
    currentMineral.value = gameStore.currentCollage
    pieces.value = [...gameStore.collagePieces]
    isResuming.value = true
    lastSaveTime.value = Date.now()
    startAutoSave()
  }
}

const restoreSnapshot = () => {
  audioStore.playClick()
  const result = gameStore.restoreCollageSnapshot()
  if (result) {
    currentMineral.value = result.mineral
    pieces.value = [...result.pieces]
    isResuming.value = true
    lastSaveTime.value = Date.now()
    startAutoSave()
  }
}

const dismissSnapshot = () => {
  gameStore.clearCollageSnapshot()
  gameStore.saveProgress()
}

const selectMineral = (mineral) => {
  const cost = getMineralCost(mineral)
  
  if (!canAfford(mineral)) {
    audioStore.playError()
    shortageMineral.value = mineral
    shortageAmount.value = getShortage(mineral)
    showCoinShortage.value = true
    return
  }

  audioStore.playClick()
  gameStore.coins -= cost
  gameStore.addCoinTransaction('market_buy', cost, `指定选择 ${mineral.name}`, {
    mineralId: mineral.id,
    mineralName: mineral.name,
    mineralEmoji: mineral.emoji,
    rarity: mineral.rarity
  })
  gameStore.saveProgress()
  
  const result = gameStore.startNewCollage(mineral)
  currentMineral.value = result.mineral
  pieces.value = [...result.pieces]
  showMineralSelect.value = false
  lastSaveTime.value = Date.now()
  startAutoSave()
}

const closeMineralSelect = () => {
  showMineralSelect.value = false
  searchQuery.value = ''
}

const onSearchInput = () => {
}

const clearSearch = () => {
  searchQuery.value = ''
}

const setSortBy = (sort) => {
  sortBy.value = sort
}

const goEarnCoins = () => {
  showCoinShortage.value = false
  showMineralSelect.value = false
  router.push('/expedition')
}

const onCollageComplete = () => {
  stopAutoSave()
  currentMineral.value = null
  pieces.value = []
  lastSaveTime.value = null
  isResuming.value = false
}

const onPieceUpdate = ({ pieceId, currentX, currentY }) => {
  gameStore.updatePiecePosition(pieceId, currentX, currentY)
}

const closeModal = () => {
  gameStore.closeNewMineralModal()
}

const requestResetCollage = () => {
  audioStore.playClick()
  showResetConfirm.value = true
}

const confirmResetCollage = () => {
  audioStore.playClick()
  gameStore.resetCurrentCollage()
  currentMineral.value = null
  pieces.value = []
  showResetConfirm.value = false
  stopAutoSave()
  lastSaveTime.value = null
  isResuming.value = false
}

const cancelExit = () => {
  showExitConfirm.value = false
  pendingLeaveRoute = null
}

const confirmExit = () => {
  gameStore.saveCollageDraft()
  showExitConfirm.value = false
  if (pendingLeaveRoute) {
    pendingLeaveRoute()
  } else {
    router.back()
  }
}

const startAutoSave = () => {
  stopAutoSave()
  autoSaveTimer = setInterval(() => {
    if (isActiveCollage.value) {
      gameStore.saveCollageDraft()
      lastSaveTime.value = Date.now()
    }
  }, 30000)
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

const handleBeforeUnload = (e) => {
  if (isActiveCollage.value) {
    gameStore.saveCollageDraft()
    e.preventDefault()
    e.returnValue = ''
  }
}

onBeforeRouteLeave((to, from, next) => {
  if (isActiveCollage.value && !showExitConfirm.value) {
    showExitConfirm.value = true
    pendingLeaveRoute = next
    return
  }
  if (isActiveCollage.value) {
    gameStore.saveCollageDraft()
  }
  stopAutoSave()
  next()
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  if (isActiveCollage.value) {
    gameStore.saveCollageDraft()
  }
  stopAutoSave()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.collage-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.collage-start {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-content {
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.start-icon {
  font-size: 80px;
  margin-bottom: 16px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.start-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--primary), #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.start-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 32px;
}

.resume-banner {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.resume-banner:hover {
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
}

.resume-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.resume-info {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resume-title {
  font-size: 16px;
  font-weight: 700;
  color: #60a5fa;
}

.resume-detail {
  font-size: 13px;
  color: var(--text-secondary);
}

.resume-arrow {
  font-size: 20px;
  color: #60a5fa;
  flex-shrink: 0;
}

.snapshot-banner {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.snapshot-banner:hover {
  border-color: rgba(245, 158, 11, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.2);
}

.snapshot-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.snapshot-info {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.snapshot-title {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
}

.snapshot-detail {
  font-size: 13px;
  color: var(--text-secondary);
}

.snapshot-dismiss {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.snapshot-dismiss:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.rarity-info {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  text-align: left;
}

.rarity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rarity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.rarity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rarity-name {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.rarity-prob {
  color: var(--text-secondary);
  width: 50px;
  text-align: right;
}

.rarity-pieces {
  color: var(--text-secondary);
  font-size: 12px;
  width: 70px;
  text-align: right;
}

.start-btn {
  width: 100%;
  margin-bottom: 12px;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
}

.btn-icon {
  margin-right: 8px;
}

.collage-game {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.game-header {
  flex-shrink: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mineral-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mineral-emoji {
  font-size: 36px;
}

.mineral-details {
  display: flex;
  flex-direction: column;
}

.mineral-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.mineral-rarity {
  font-size: 12px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auto-save-hint {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
  white-space: nowrap;
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.game-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.confirm-content {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 28px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.confirm-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-actions .btn {
  flex: 1;
}

.mineral-select-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.mineral-select-content {
  background: var(--bg-card);
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.select-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.select-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.select-toolbar {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 12px;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
}

.search-icon {
  font-size: 14px;
  opacity: 0.6;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  padding: 10px 0;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.clear-search {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.sort-controls {
  display: flex;
  gap: 8px;
}

.sort-btn {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-btn:hover {
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--text-primary);
}

.sort-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #60a5fa;
}

.coin-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
}

.coin-label {
  color: var(--text-secondary);
}

.coin-amount {
  color: #fbbf24;
  font-weight: 600;
}

.coin-divider {
  color: rgba(255, 255, 255, 0.2);
}

.coin-affordable {
  color: #22c55e;
  font-weight: 500;
}

.select-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.select-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.select-item.affordable:hover {
  background: rgba(34, 197, 94, 0.1);
  transform: translateX(2px);
}

.select-item.unaffordable {
  opacity: 0.5;
}

.select-item.unaffordable:hover {
  opacity: 0.7;
  background: rgba(239, 68, 68, 0.05);
}

.item-emoji {
  font-size: 36px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-rarity {
  font-size: 12px;
  font-weight: 500;
}

.item-cost-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.item-cost {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.cost-shortage {
  font-size: 11px;
  color: #f87171;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.shortage-content {
  background: linear-gradient(180deg, var(--bg-card), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.shortage-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.shortage-amount {
  color: #f87171;
  font-weight: 600;
  font-size: 18px;
}

.shortage-mineral {
  color: var(--text-primary);
  font-weight: 600;
}

.shortage-tips {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
}

.tips-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-list li {
  font-size: 13px;
  color: var(--text-secondary);
  padding-left: 4px;
}

@media (max-width: 480px) {
  .start-title {
    font-size: 28px;
  }
  
  .start-desc {
    font-size: 14px;
  }
  
  .game-header {
    padding: 12px;
  }
  
  .mineral-name {
    font-size: 16px;
  }

  .header-actions {
    gap: 6px;
  }

  .auto-save-hint {
    display: none;
  }
}
</style>
