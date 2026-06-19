<template>
  <div 
    class="mineral-card"
    :class="[
      `rarity-${mineral.rarity}`,
      { collected: isCollected, locked: !isCollected && !showLocked }
    ]"
    :style="cardStyle"
    @click="handleClick"
  >
    <div class="card-glow" v-if="isCollected && glow"></div>
    <div class="card-inner">
      <div class="card-header">
        <span class="mineral-emoji" :class="{ 'animate-float': isCollected }">
          {{ displayEmoji }}
        </span>
        <span class="rarity-stars">{{ stars }}</span>
      </div>
      <div class="card-body">
        <h3 class="mineral-name">{{ displayName }}</h3>
        <span class="mineral-en">{{ displayNameEn }}</span>
        <div class="mineral-rarity">{{ rarityName }}</div>
      </div>
      <div class="card-footer" v-if="showStats && isCollected">
        <span class="formula">{{ mineral.formula }}</span>
        <span class="hardness">硬度 {{ mineral.hardness }}</span>
      </div>
      <div class="locked-overlay" v-if="!isCollected">
        <span class="lock-icon">🔒</span>
        <span class="lock-text">未收集</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'

const props = defineProps({
  mineral: {
    type: Object,
    required: true
  },
  isCollected: {
    type: Boolean,
    default: false
  },
  showLocked: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: false
  },
  glow: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['click'])

const rarityConfig = computed(() => RARITY_CONFIG[props.mineral.rarity])
const rarityName = computed(() => rarityConfig.value.name)
const stars = computed(() => getRarityStars(props.mineral.rarity))

const displayName = computed(() => {
  return props.isCollected || props.showLocked ? props.mineral.name : '???'
})

const displayNameEn = computed(() => {
  return props.isCollected || props.showLocked ? props.mineral.nameEn : '???'
})

const displayEmoji = computed(() => {
  return props.isCollected || props.showLocked ? props.mineral.emoji : '❓'
})

const cardStyle = computed(() => {
  if (props.isCollected) {
    return {
      background: rarityConfig.value.bgGradient,
      borderColor: rarityConfig.value.borderColor
    }
  }
  return {}
})

const handleClick = () => {
  emit('click', props.mineral)
}
</script>

<style scoped>
.mineral-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: var(--bg-card);
}

.mineral-card:hover {
  transform: translateY(-4px);
}

.mineral-card.collected {
  border: 2px solid;
}

.mineral-card.locked {
  filter: grayscale(1) brightness(0.5);
  cursor: not-allowed;
}

.mineral-card.locked:hover {
  transform: none;
}

.card-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: inherit;
  filter: blur(15px);
  opacity: 0.5;
  z-index: -1;
  animation: pulse 2s ease-in-out infinite;
}

.card-inner {
  position: relative;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mineral-emoji {
  font-size: 48px;
  display: block;
}

.rarity-stars {
  font-size: 12px;
  letter-spacing: 1px;
}

.card-body {
  flex: 1;
}

.mineral-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.mineral-en {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 8px;
}

.mineral-rarity {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  display: inline-block;
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(4px);
}

.lock-icon {
  font-size: 32px;
}

.lock-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.mineral-card.rarity-legendary .mineral-name {
  background: linear-gradient(135deg, #ffd700, #ffec8b, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
</style>
