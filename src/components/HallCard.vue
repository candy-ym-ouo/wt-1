<template>
  <div 
    class="hall-card"
    :style="cardStyle"
    @click="handleClick"
  >
    <div class="card-header">
      <span class="hall-icon">{{ hall.icon }}</span>
      <div class="visitor-badge">
        <span class="visitor-icon">👥</span>
        <span class="visitor-count">{{ visits.current }}/{{ hall.visitorCapacity }}</span>
      </div>
    </div>
    <div class="card-body">
      <h3 class="hall-name">{{ hall.name }}</h3>
      <p class="hall-desc">{{ hall.description }}</p>
    </div>
    <div class="card-footer">
      <div class="footer-stats">
        <div class="stat-item">
          <span class="stat-label">藏品</span>
          <span class="stat-value">{{ hall.mineralIds.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">累计访客</span>
          <span class="stat-value">{{ formatNumber(visits.total) }}</span>
        </div>
      </div>
      <div class="trend-indicator" :class="trendClass">
        {{ trendIcon }} {{ trendText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMuseumStore } from '@/stores/museum'

const props = defineProps({
  hall: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const museumStore = useMuseumStore()

const visits = computed(() => museumStore.getHallVisits(props.hall.id))

const cardStyle = computed(() => ({
  background: props.hall.bgGradient,
  borderColor: props.hall.color
}))

const trendClass = computed(() => {
  const ratio = visits.value.today / (props.hall.visitorCapacity * 0.5)
  if (ratio > 0.8) return 'trend-hot'
  if (ratio > 0.4) return 'trend-warm'
  return 'trend-normal'
})

const trendIcon = computed(() => {
  const ratio = visits.value.today / (props.hall.visitorCapacity * 0.5)
  if (ratio > 0.8) return '🔥'
  if (ratio > 0.4) return '📈'
  return '✨'
})

const trendText = computed(() => {
  const ratio = visits.value.today / (props.hall.visitorCapacity * 0.5)
  if (ratio > 0.8) return '火爆'
  if (ratio > 0.4) return '较热'
  return '正常'
})

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const handleClick = () => {
  emit('click', props.hall)
}
</script>

<style scoped>
.hall-card {
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  position: relative;
  overflow: hidden;
}

.hall-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 0;
}

.hall-card > * {
  position: relative;
  z-index: 1;
}

.hall-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.hall-icon {
  font-size: 48px;
}

.visitor-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.visitor-icon {
  font-size: 14px;
}

.visitor-count {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.card-body {
  margin-bottom: 16px;
}

.hall-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.hall-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin: 0;
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
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.trend-indicator {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
}

.trend-hot {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.trend-warm {
  background: rgba(249, 115, 22, 0.3);
  color: #fdba74;
}

.trend-normal {
  background: rgba(107, 114, 128, 0.3);
  color: #d1d5db;
}
</style>
