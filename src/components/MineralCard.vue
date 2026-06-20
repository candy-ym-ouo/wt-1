<template>
  <div 
    class="mineral-card"
    :class="[
      `rarity-${mineral.rarity}`,
      { 
        collected: isCollected, 
        locked: !isCollected && !showLocked, 
        'is-favorite': isFavorite,
        'new-discovery': isNew,
        'showing-clues': showingClues
      }
    ]"
    :style="cardStyle"
    @click="handleClick"
  >
    <div class="card-glow" v-if="isCollected && glow"></div>
    <div class="new-discovery-glow" v-if="isNew"></div>
    <div class="new-discovery-badge" v-if="isNew">
      <span class="nd-text">NEW!</span>
    </div>
    <div class="card-inner">
      <div class="card-header">
        <span class="mineral-emoji" :class="{ 'animate-float': isCollected, 'new-shine': isNew }">
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
        <button 
          class="clue-toggle-btn" 
          @click.stop="toggleClues"
          v-if="showClueButton"
        >
          <span class="clue-icon">💡</span>
          <span class="clue-btn-text">{{ showingClues ? '收起线索' : '查看线索' }}</span>
        </button>
      </div>
      <div class="clues-panel" v-if="!isCollected && showingClues && mineral.clues">
        <div class="clue-section">
          <div class="clue-section-title">
            <span class="clue-section-icon">⛏️</span>
            <span>可能产出</span>
          </div>
          <ul class="clue-list">
            <li v-for="(item, idx) in mineral.clues.production" :key="idx">{{ item }}</li>
          </ul>
        </div>
        <div class="clue-section">
          <div class="clue-section-title">
            <span class="clue-section-icon">🎮</span>
            <span>推荐玩法</span>
          </div>
          <ul class="clue-list">
            <li v-for="(item, idx) in mineral.clues.gameplay" :key="idx">{{ item }}</li>
          </ul>
        </div>
        <div class="clue-section reward-section">
          <div class="clue-section-title">
            <span class="clue-section-icon">🎁</span>
            <span>目标奖励</span>
          </div>
          <p class="clue-reward-text">{{ mineral.clues.reward }}</p>
        </div>
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
import { ref, computed } from 'vue'
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
  },
  isNew: {
    type: Boolean,
    default: false
  },
  showClueButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])

const showingClues = ref(false)

const toggleClues = () => {
  showingClues.value = !showingClues.value
}

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

.new-discovery-glow {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(135deg, #22c55e, #10b981, #14b8a6);
  border-radius: 18px;
  z-index: -1;
  filter: blur(8px);
  opacity: 0.6;
  animation: newDiscoveryPulse 2s ease-in-out infinite;
}

@keyframes newDiscoveryPulse {
  0%, 100% { 
    opacity: 0.4; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.02);
  }
}

.new-discovery-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 3;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.5);
  animation: newBadgeBounce 1.5s ease-in-out infinite;
}

@keyframes newBadgeBounce {
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.1) rotate(3deg); }
}

.mineral-card.new-discovery {
  animation: newCardPulse 3s ease-in-out infinite;
}

@keyframes newCardPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 8px 30px rgba(34, 197, 94, 0.4); }
}

.mineral-emoji.new-shine {
  animation: newShine 2s ease-in-out infinite;
}

@keyframes newShine {
  0%, 100% { 
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
  }
  50% { 
    filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 30px rgba(34, 197, 94, 0.4));
  }
}

.mineral-card.showing-clues {
  border-color: rgba(251, 191, 36, 0.5) !important;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
}

.locked-overlay {
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.clue-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(251, 191, 36, 0.4);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1));
  color: #fbbf24;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.clue-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2));
  border-color: rgba(251, 191, 36, 0.6);
  transform: scale(1.05);
}

.clue-icon {
  font-size: 14px;
}

.clues-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  z-index: 10;
  animation: cluesSlideIn 0.3s ease;
}

@keyframes cluesSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.clue-section {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.clue-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 8px;
}

.clue-section-icon {
  font-size: 14px;
}

.clue-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.clue-list li {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: 4px;
  border-left: 2px solid rgba(251, 191, 36, 0.3);
  padding-left: 8px;
}

.reward-section {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
  border-color: rgba(251, 191, 36, 0.2);
}

.clue-reward-text {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}
</style>
