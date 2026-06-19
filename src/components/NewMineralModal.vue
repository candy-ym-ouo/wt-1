<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content" :class="`rarity-${mineral?.rarity}`">
          <div class="sparkles" v-if="isRare">
            <span v-for="i in 12" :key="i" class="sparkle" :style="getSparkleStyle(i)">✨</span>
          </div>
          
          <div class="modal-header">
            <h2 class="modal-title">
              {{ isNew ? '🎉 新矿物获得！' : '✨ 已收集矿物' }}
            </h2>
          </div>

          <div class="mineral-display">
            <div class="mineral-glow"></div>
            <span class="mineral-emoji">{{ mineral?.emoji }}</span>
          </div>

          <div class="mineral-info">
            <h3 class="mineral-name">{{ mineral?.name }}</h3>
            <span class="mineral-en">{{ mineral?.nameEn }}</span>
            <div class="rarity-badge">
              <span class="stars">{{ stars }}</span>
              <span class="rarity-name">{{ rarityName }}</span>
            </div>
          </div>

          <div class="rewards" v-if="!isNew">
            <div class="reward-item">
              <span class="reward-icon">🪙</span>
              <span class="reward-text">+10 金币</span>
            </div>
          </div>

          <div class="mineral-formula">
            <span class="formula-label">化学式</span>
            <span class="formula-value">{{ mineral?.formula }}</span>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="handleClose">
              继续收集
            </button>
            <button class="btn" @click="handleViewDetail">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RARITY_CONFIG, getRarityStars, RARITY } from '@/data/rarity'
import { useAudioStore } from '@/stores/audio'

const props = defineProps({
  show: Boolean,
  mineral: Object,
  isNew: Boolean
})

const emit = defineEmits(['close'])

const router = useRouter()
const audioStore = useAudioStore()

const rarityConfig = computed(() => {
  return props.mineral ? RARITY_CONFIG[props.mineral.rarity] : null
})

const rarityName = computed(() => rarityConfig.value?.name || '')
const stars = computed(() => props.mineral ? getRarityStars(props.mineral.rarity) : '')

const isRare = computed(() => {
  return props.mineral && 
    [RARITY.EPIC, RARITY.LEGENDARY].includes(props.mineral.rarity)
})

const getSparkleStyle = (index) => {
  const angle = (index / 12) * 360
  const delay = index * 0.1
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const handleClose = () => {
  audioStore.playClick()
  emit('close')
}

const handleViewDetail = () => {
  audioStore.playClick()
  emit('close')
  router.push(`/mineral/${props.mineral.id}`)
}
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  position: relative;
  background: var(--bg-card);
  border-radius: 24px;
  padding: 32px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  border: 2px solid;
  animation: modalEnter 0.5s ease;
}

.modal-content.rarity-common { border-color: var(--common); }
.modal-content.rarity-uncommon { border-color: var(--uncommon); }
.modal-content.rarity-rare { border-color: var(--rare); }
.modal-content.rarity-epic { 
  border-color: var(--epic);
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.3);
}
.modal-content.rarity-legendary { 
  border-color: var(--legendary);
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.4);
  animation: modalEnter 0.5s ease, legendaryGlow 2s ease-in-out infinite;
}

.sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.sparkle {
  position: absolute;
  font-size: 20px;
  top: 50%;
  left: 50%;
  animation: sparkle 1.5s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes sparkle {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 150px),
      calc(-50% + sin(var(--angle)) * 150px)
    ) rotate(180deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 200px),
      calc(-50% + sin(var(--angle)) * 200px)
    ) rotate(360deg) scale(0);
    opacity: 0;
  }
}

.modal-header {
  margin-bottom: 24px;
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.mineral-display {
  position: relative;
  margin-bottom: 24px;
}

.mineral-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: inherit;
  filter: blur(30px);
  opacity: 0.5;
  animation: pulse 2s ease-in-out infinite;
}

.mineral-emoji {
  position: relative;
  font-size: 100px;
  display: block;
  animation: bounce 1s ease infinite;
}

.mineral-info {
  margin-bottom: 20px;
}

.mineral-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
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
  font-size: 14px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 12px;
}

.rarity-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
}

.stars {
  font-size: 16px;
  letter-spacing: 2px;
}

.rarity-name {
  font-size: 14px;
  font-weight: 600;
}

.rarity-common .rarity-name, .rarity-common .stars { color: var(--common); }
.rarity-uncommon .rarity-name, .rarity-uncommon .stars { color: var(--uncommon); }
.rarity-rare .rarity-name, .rarity-rare .stars { color: var(--rare); }
.rarity-epic .rarity-name, .rarity-epic .stars { color: var(--epic); }
.rarity-legendary .rarity-name, .rarity-legendary .stars { color: var(--legendary); }

.rewards {
  margin-bottom: 20px;
}

.reward-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.reward-icon {
  font-size: 20px;
}

.reward-text {
  font-size: 16px;
  font-weight: 600;
  color: #fbbf24;
}

.mineral-formula {
  margin-bottom: 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.formula-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.formula-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-actions .btn {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes legendaryGlow {
  0%, 100% { box-shadow: 0 0 60px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 80px rgba(245, 158, 11, 0.6), 0 0 120px rgba(245, 158, 11, 0.3); }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  opacity: 0;
  transform: scale(0.8);
}
</style>
