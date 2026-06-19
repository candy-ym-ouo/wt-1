<template>
  <div class="museum-view">
    <div class="museum-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="header-icon">🏛️</div>
        <h1 class="page-title">矿物博物馆</h1>
        <p class="page-subtitle">探索地球亿万年的宝藏，感受矿物的永恒魅力</p>
        <div class="header-stats">
          <div class="header-stat">
            <span class="h-stat-icon">👥</span>
            <span class="h-stat-value">{{ formatNumber(museumStats.totalVisitors) }}</span>
            <span class="h-stat-label">访客</span>
          </div>
          <div class="header-stat">
            <span class="h-stat-icon">💎</span>
            <span class="h-stat-value">{{ museumStats.totalMinerals }}</span>
            <span class="h-stat-label">藏品</span>
          </div>
          <div class="header-stat">
            <span class="h-stat-icon">⭐</span>
            <span class="h-stat-value">{{ museumStats.avgRating }}</span>
            <span class="h-stat-label">评分</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeSeason" class="season-banner" @click="goToSeason" :style="{ background: activeSeason.themeGradient }">
      <div class="banner-shapes">
        <span v-for="i in 4" :key="i" class="banner-shape" :style="getBannerShapeStyle(i)"></span>
      </div>
      <div class="banner-content">
        <div class="banner-left">
          <span class="banner-emoji">{{ activeSeason.emoji }}</span>
          <div class="banner-info">
            <span class="banner-name">{{ activeSeason.name }}</span>
            <span class="banner-subtitle">{{ activeSeason.subtitle }}</span>
          </div>
        </div>
        <div class="banner-right">
          <span class="banner-points" v-if="seasonStore.seasonPoints > 0">⭐ {{ seasonStore.seasonPoints }}</span>
          <span class="banner-cta">进入赛季 →</span>
        </div>
      </div>
    </div>

    <div class="tabs-section">
      <div class="tabs-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'halls'" class="halls-section">
        <div class="section-header">
          <h2 class="section-title">🏛️ 展厅分类</h2>
          <span class="section-count">共 {{ allHalls.length }} 个展厅</span>
        </div>
        <div class="halls-grid">
          <HallCard 
            v-for="hall in allHalls" 
            :key="hall.id"
            :hall="hall"
            @click="openHall"
          />
        </div>
      </div>

      <div v-if="activeTab === 'exhibitions'" class="exhibitions-section">
        <div class="section-header">
          <h2 class="section-title">🎨 主题布展</h2>
          <span class="section-count">{{ activeExhibitions.length }} 场进行中</span>
        </div>
        <div class="exhibitions-grid">
          <ExhibitionCard 
            v-for="exhibition in allExhibitions" 
            :key="exhibition.id"
            :exhibition="exhibition"
            @click="openExhibition"
          />
        </div>
      </div>

      <div v-if="activeTab === 'stats'" class="stats-section">
        <MuseumStats @view-mineral="viewMineral" />
      </div>
    </div>

    <div v-if="selectedHall" class="detail-modal" @click.self="selectedHall = null">
      <div class="modal-content hall-modal">
        <div class="modal-header" :style="{ background: selectedHall.bgGradient }">
          <div class="modal-header-content">
            <span class="modal-icon">{{ selectedHall.icon }}</span>
            <div>
              <h2 class="modal-title">{{ selectedHall.name }}</h2>
              <p class="modal-subtitle">{{ selectedHall.description }}</p>
            </div>
          </div>
          <button class="close-btn" @click="selectedHall = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="hall-info-row">
            <div class="info-item">
              <span class="info-label">开放年份</span>
              <span class="info-value">{{ selectedHall.openingYear }}年</span>
            </div>
            <div class="info-item">
              <span class="info-label">承载量</span>
              <span class="info-value">{{ getHallVisits(selectedHall.id).current }}/{{ selectedHall.visitorCapacity }}人</span>
            </div>
            <div class="info-item">
              <span class="info-label">累计访客</span>
              <span class="info-value">{{ formatNumber(getHallVisits(selectedHall.id).total) }}</span>
            </div>
          </div>
          <h3 class="subsection-title">展厅藏品 ({{ selectedHall.mineralIds.length }}件)</h3>
          <div class="minerals-grid">
            <MineralCard
              v-for="mineral in hallMinerals"
              :key="mineral.id"
              :mineral="mineral"
              :is-collected="isMineralCollected(mineral.id)"
              :show-stats="true"
              @click="viewMineral"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedExhibition" class="detail-modal" @click.self="selectedExhibition = null">
      <div class="modal-content exhibition-modal">
        <div class="modal-header" :style="{ background: selectedExhibition.bgGradient }">
          <div class="modal-header-content">
            <span class="modal-icon">{{ selectedExhibition.icon }}</span>
            <div>
              <div class="exhibition-tags" v-if="selectedExhibition.featured">
                <span class="tag tag-featured">⭐ 精选特展</span>
              </div>
              <h2 class="modal-title">{{ selectedExhibition.name }}</h2>
              <p class="modal-subtitle">"{{ selectedExhibition.tagline }}"</p>
            </div>
          </div>
          <button class="close-btn" @click="selectedExhibition = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="exhibition-desc">
            {{ selectedExhibition.description }}
          </div>
          <div class="exhibition-info-row">
            <div class="info-item">
              <span class="info-label">展期</span>
              <span class="info-value">{{ formatDate(selectedExhibition.startDate) }} - {{ formatDate(selectedExhibition.endDate) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">累计访客</span>
              <span class="info-value">{{ formatNumber(getExhibitionVisits(selectedExhibition.id).total) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">平均评分</span>
              <span class="info-value">⭐ {{ getExhibitionVisits(selectedExhibition.id).avgRating }}</span>
            </div>
          </div>
          <h3 class="subsection-title">展览藏品 ({{ selectedExhibition.mineralIds.length }}件)</h3>
          <div class="minerals-grid">
            <MineralCard
              v-for="mineral in exhibitionMinerals"
              :key="mineral.id"
              :mineral="mineral"
              :is-collected="isMineralCollected(mineral.id)"
              :show-stats="true"
              @click="viewMineral"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMuseumStore } from '@/stores/museum'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useSeasonStore } from '@/stores/season'
import HallCard from '@/components/HallCard.vue'
import ExhibitionCard from '@/components/ExhibitionCard.vue'
import MuseumStats from '@/components/MuseumStats.vue'
import MineralCard from '@/components/MineralCard.vue'

const router = useRouter()
const museumStore = useMuseumStore()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const seasonStore = useSeasonStore()

const tabs = [
  { id: 'halls', icon: '🏛️', label: '展厅' },
  { id: 'exhibitions', icon: '🎨', label: '展览' },
  { id: 'stats', icon: '📊', label: '数据' }
]

const activeTab = ref('halls')
const selectedHall = ref(null)
const selectedExhibition = ref(null)

const allHalls = computed(() => museumStore.allHalls)
const allExhibitions = computed(() => museumStore.allExhibitions)
const activeExhibitions = computed(() => museumStore.activeExhibitions)
const museumStats = computed(() => museumStore.museumStats)

const hallMinerals = computed(() => {
  if (!selectedHall.value) return []
  return museumStore.getHallMinerals(selectedHall.value.id)
})

const exhibitionMinerals = computed(() => {
  if (!selectedExhibition.value) return []
  return museumStore.getExhibitionMinerals(selectedExhibition.value.id)
})

const getHallVisits = (id) => museumStore.getHallVisits(id)
const getExhibitionVisits = (id) => museumStore.getExhibitionVisits(id)
const isMineralCollected = (id) => gameStore.isMineralCollected(id)

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

const openHall = (hall) => {
  audioStore.playClick()
  selectedHall.value = hall
}

const openExhibition = (exhibition) => {
  audioStore.playClick()
  selectedExhibition.value = exhibition
}

const activeSeason = computed(() => seasonStore.activeSeason)

const goToSeason = () => {
  audioStore.playClick()
  router.push('/season')
}

const getBannerShapeStyle = (index) => {
  const angle = (index / 4) * 360
  const delay = index * 0.4
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const viewMineral = (mineral) => {
  audioStore.playClick()
  selectedHall.value = null
  selectedExhibition.value = null
  museumStore.recordMineralView(mineral.id)
  router.push(`/mineral/${mineral.id}`)
}
</script>

<style scoped>
.museum-view {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 90px;
}

.museum-header {
  position: relative;
  padding: 32px 20px 28px;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #581c87 100%);
  z-index: 0;
}

.header-bg::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px 0;
  background: linear-gradient(135deg, #fff, #c4b5fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 20px 0;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.header-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 14px;
}

.h-stat-icon {
  font-size: 16px;
}

.h-stat-value {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
}

.h-stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}

.tabs-section {
  padding: 0 16px;
  margin-top: -16px;
  position: relative;
  z-index: 2;
}

.tabs-nav {
  display: flex;
  gap: 8px;
  background: var(--bg-card);
  padding: 6px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.tab-content {
  padding: 20px 16px;
}

.season-banner {
  position: relative;
  margin: 0 16px;
  margin-top: -12px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
}

.season-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.banner-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.banner-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: bannerFloat 8s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes bannerFloat {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg) translateX(80px); }
  50% { transform: translate(-50%, -50%) rotate(180deg) translateX(100px); }
}

.banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-emoji {
  font-size: 32px;
}

.banner-name {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
}

.banner-subtitle {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-points {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 10px;
  border-radius: 8px;
}

.banner-cta {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.halls-grid,
.exhibitions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .halls-grid,
  .exhibitions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .halls-grid,
  .exhibitions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 24px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 24px;
  position: relative;
}

.modal-header-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.modal-icon {
  font-size: 56px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.5;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.5);
  transform: scale(1.1);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.hall-info-row,
.exhibition-info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.info-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.exhibition-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  border-left: 3px solid #8b5cf6;
}

.exhibition-tags {
  margin-bottom: 8px;
}

.tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

.tag-featured {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1f2937;
}

.subsection-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.minerals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 500px) {
  .minerals-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 700px) {
  .minerals-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
