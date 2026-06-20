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

    <div v-if="showMineralSelect" class="mineral-select-overlay" @click.self="showMineralSelect = false">
      <div class="mineral-select-content">
        <div class="select-header">
          <h3>选择矿物</h3>
          <button class="close-btn" @click="showMineralSelect = false">✕</button>
        </div>
        <div class="select-list">
          <div 
            v-for="mineral in uncollectedMinerals" 
            :key="mineral.id"
            class="select-item"
            @click="selectMineral(mineral)"
          >
            <span class="item-emoji">{{ mineral.emoji }}</span>
            <div class="item-info">
              <span class="item-name">{{ mineral.name }}</span>
              <span :class="['item-rarity', `rarity-${mineral.rarity}`]">
                {{ RARITY_CONFIG[mineral.rarity].name }}
              </span>
            </div>
            <span class="item-cost">{{ RARITY_CONFIG[mineral.rarity].starCount * 50 }} 🪙</span>
          </div>
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
const lastSaveTime = ref(null)
const isResuming = ref(false)

let pendingLeaveRoute = null
let autoSaveTimer = null

const showModal = computed(() => gameStore.showNewMineralModal)
const newMineral = computed(() => gameStore.newMineral)
const isNewMineral = computed(() => gameStore.isNewMineral)

const rarityConfig = computed(() => {
  return currentMineral.value ? RARITY_CONFIG[currentMineral.value.rarity] : RARITY_CONFIG.common
})

const uncollectedMinerals = computed(() => {
  return gameStore.allMinerals.filter(m => !gameStore.isMineralCollected(m.id))
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
  const cost = RARITY_CONFIG[mineral.rarity].starCount * 50
  
  if (gameStore.coins < cost) {
    audioStore.playError()
    alert('金币不足！')
    return
  }

  audioStore.playClick()
  gameStore.coins -= cost
  gameStore.saveProgress()
  
  const result = gameStore.startNewCollage(mineral)
  currentMineral.value = result.mineral
  pieces.value = [...result.pieces]
  showMineralSelect.value = false
  lastSaveTime.value = Date.now()
  startAutoSave()
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

.item-emoji {
  font-size: 36px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
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

.item-cost {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
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
