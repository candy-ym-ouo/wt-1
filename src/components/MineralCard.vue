<template>
  <div 
    class="mineral-card"
    :class="[
      `rarity-${mineral.rarity}`,
      { collected: isCollected, locked: !isCollected && !showLocked, 'is-favorite': isFavorite }
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
        <div class="header-right">
          <span class="rarity-stars">{{ stars }}</span>
        </div>
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
    <div
      v-if="isCollected && knowledgeCardCount > 0"
      class="knowledge-badge"
      :class="{ 'has-total': totalKnowledgeCards > 0 }"
      :title="`已解锁 ${knowledgeCardCount}/${totalKnowledgeCards || knowledgeCardCount} 张知识卡片`"
    >
      <span class="kb-icon">📇</span>
      <span class="kb-count">{{ knowledgeCardCount }}</span>
    </div>
    <div
      v-if="showFavoriteBadge && isFavorite"
      class="favorite-badge"
      title="我的收藏"
    >
      <span class="fav-icon">❤️</span>
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
  },
  knowledgeCardCount: {
    type: Number,
    default: 0
  },
  totalKnowledgeCards: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  showFavoriteBadge: {
    type: Boolean,
    default: true
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
      borderColor: props.isFavorite 
        ? 'rgba(239, 68, 68, 0.6)' 
        : rarityConfig.value.borderColor
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

.knowledge-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(99, 102, 241, 0.95));
  border: 1px solid rgba(192, 132, 252, 0.5);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.5);
  z-index: 2;
  backdrop-filter: blur(4px);
}

.kb-icon {
  font-size: 10px;
}

.kb-count {
  font-family: 'Courier New', monospace;
}

.knowledge-badge.has-total {
  animation: kbShine 3s ease-in-out infinite;
}

@keyframes kbShine {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.favorite-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(244, 63, 94, 0.95));
  border: 1px solid rgba(252, 165, 165, 0.5);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
  z-index: 2;
  backdrop-filter: blur(4px);
  animation: favPulse 2s ease-in-out infinite;
}

.fav-icon {
  font-size: 12px;
}

@keyframes favPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.mineral-card.is-favorite {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3), 0 8px 24px rgba(239, 68, 68, 0.15);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
