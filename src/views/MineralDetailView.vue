<template>
  <div class="detail-view" :class="`rarity-${mineral?.rarity}`">
    <div class="detail-header">
      <button class="back-btn" @click="goBack">
        ← 返回
      </button>
      <div class="header-actions">
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
        <div class="rarity-badge-large">
          <span class="stars">{{ getRarityStars(mineral.rarity) }}</span>
          <span class="rarity-name">{{ rarityConfig.name }}</span>
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

      <div class="action-section">
        <button class="btn btn-large" @click="collectAgain">
          <span class="btn-icon">🎨</span>
          再次拼装获得金币
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
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'
import { getMineralById } from '@/data/minerals'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()

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

onMounted(() => {
  if (!mineral.value) {
    router.replace('/collection')
  }
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
</style>
