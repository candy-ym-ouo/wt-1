<template>
  <div 
    class="exhibition-card"
    :class="{ featured: exhibition.featured }"
    :style="cardStyle"
    @click="handleClick"
  >
    <div class="card-glow" v-if="exhibition.featured"></div>
    <div class="featured-badge" v-if="exhibition.featured">
      ⭐ 精选特展
    </div>
    <div class="card-header">
      <span class="exhibition-icon">{{ exhibition.icon }}</span>
    </div>
    <div class="card-body">
      <h3 class="exhibition-name">{{ exhibition.name }}</h3>
      <p class="exhibition-tagline">"{{ exhibition.tagline }}"</p>
      <p class="exhibition-desc">{{ exhibition.description }}</p>
    </div>
    <div class="card-meta">
      <div class="date-range">
        <span class="date-icon">📅</span>
        <span class="date-text">{{ formatDate(exhibition.startDate) }} - {{ formatDate(exhibition.endDate) }}</span>
      </div>
    </div>
    <div class="card-footer">
      <div class="footer-stats">
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <span class="stat-value">{{ formatNumber(visits.total) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⭐</span>
          <span class="stat-value">{{ visits.avgRating }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">💎</span>
          <span class="stat-value">{{ exhibition.mineralIds.length }}</span>
        </div>
      </div>
      <div class="enter-btn">
        进入 →
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMuseumStore } from '@/stores/museum'

const props = defineProps({
  exhibition: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const museumStore = useMuseumStore()

const visits = computed(() => museumStore.getExhibitionVisits(props.exhibition.id))

const cardStyle = computed(() => ({
  background: props.exhibition.bgGradient,
  borderColor: props.exhibition.color
}))

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const handleClick = () => {
  emit('click', props.exhibition)
}
</script>

<style scoped>
.exhibition-card {
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  position: relative;
  overflow: hidden;
}

.exhibition-card.featured {
  transform: scale(1.02);
}

.exhibition-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 0;
}

.exhibition-card > * {
  position: relative;
  z-index: 1;
}

.exhibition-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.exhibition-card.featured:hover {
  transform: scale(1.02) translateY(-4px);
}

.card-glow {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: inherit;
  filter: blur(20px);
  opacity: 0.4;
  z-index: -1;
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.featured-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1f2937;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
  z-index: 2;
}

.card-header {
  margin-bottom: 16px;
}

.exhibition-icon {
  font-size: 56px;
}

.card-body {
  margin-bottom: 16px;
}

.exhibition-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.exhibition-tagline {
  font-size: 13px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 10px 0;
}

.exhibition-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
  margin: 0;
}

.card-meta {
  margin-bottom: 16px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px 12px;
  border-radius: 10px;
  width: fit-content;
}

.date-icon {
  font-size: 14px;
}

.date-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.enter-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.exhibition-card:hover .enter-btn {
  background: rgba(255, 255, 255, 0.35);
}
</style>
