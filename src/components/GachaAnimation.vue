<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="gacha-animation-overlay" @click.self="handleSkip">
        <div class="gacha-animation-container">
          <div 
            v-if="phase === 'shake'" 
            class="box-stage"
          >
            <div 
              class="gacha-box"
              :class="['shake', `box-${boxType}`]"
              :style="boxStyle"
            >
              <span class="box-emoji">{{ boxEmoji }}</span>
            </div>
            <div class="box-shadows">
              <div class="box-shadow" :style="boxShadowStyle"></div>
            </div>
          </div>

          <div 
            v-else-if="phase === 'burst'" 
            class="burst-stage"
          >
            <div class="burst-center" :style="boxGradientStyle">
              <span class="burst-emoji">{{ boxEmoji }}</span>
            </div>
            <div class="burst-rings">
              <div v-for="i in 3" :key="i" class="burst-ring" :style="getRingStyle(i)"></div>
            </div>
            <div class="burst-particles">
              <span 
                v-for="i in 20" 
                :key="i" 
                class="particle"
                :style="getParticleStyle(i)"
              >✨</span>
            </div>
          </div>

          <div 
            v-else-if="phase === 'reveal'" 
            class="reveal-stage"
          >
            <div 
              v-for="(result, index) in animatedResults" 
              :key="index"
              class="reveal-card-wrapper"
              :style="getRevealCardStyle(index)"
            >
              <div 
                class="reveal-card"
                :class="[`rarity-${result.rarity}`, { 'is-new': result.isNew, 'is-pity': result.isPity }]"
              >
                <div class="card-glow"></div>
                <div class="card-sparkles" v-if="isRareOrAbove(result.rarity)">
                  <span v-for="i in 8" :key="i" class="card-sparkle" :style="getCardSparkleStyle(i)">✨</span>
                </div>
                
                <div class="mineral-display-area">
                  <span class="mineral-emoji">{{ result.mineral?.emoji }}</span>
                </div>

                <div class="mineral-info-area">
                  <div class="rarity-stars">
                    {{ getStars(result.rarity) }}
                  </div>
                  <h3 class="mineral-name">{{ result.mineral?.name }}</h3>
                  <span class="mineral-en">{{ result.mineral?.nameEn }}</span>
                </div>

                <div class="badges">
                  <span v-if="result.isNew" class="badge new-badge">NEW</span>
                  <span v-if="result.isPity" class="badge pity-badge">保底</span>
                </div>

                <div v-if="!result.isNew" class="coin-reward">
                  <span class="coin-icon">🪙</span>
                  <span class="coin-value">+10</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            v-if="show" 
            class="skip-btn"
            @click="handleSkip"
          >
            {{ phase === 'reveal' ? '完成' : '跳过动画' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { RARITY_CONFIG, getRarityStars, RARITY } from '@/data/rarity'
import { getBoxById } from '@/data/gacha'
import { useAudioStore } from '@/stores/audio'

const props = defineProps({
  show: Boolean,
  boxType: String,
  results: Array
})

const emit = defineEmits(['close'])

const audioStore = useAudioStore()

const phase = ref('idle')
const animatedResults = ref([])
const revealStartTime = ref(0)
const timers = ref([])

const boxConfig = computed(() => getBoxById(props.boxType))
const boxEmoji = computed(() => boxConfig.value?.emoji || '📦')

const boxStyle = computed(() => ({
  background: boxConfig.value?.gradient || 'linear-gradient(135deg, #374151, #6b7280)'
}))

const boxGradientStyle = computed(() => ({
  background: boxConfig.value?.gradient || 'linear-gradient(135deg, #374151, #6b7280)'
}))

const boxShadowStyle = computed(() => ({
  background: boxConfig.value?.glowColor || 'rgba(156, 163, 175, 0.4)'
}))

const canSkipReveal = computed(() => {
  if (phase.value !== 'reveal') return false
  return Date.now() - revealStartTime.value > 500
})

const getStars = (rarity) => getRarityStars(rarity)

const isRareOrAbove = (rarity) => {
  return [RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY].includes(rarity)
}

const getRingStyle = (index) => {
  const delay = index * 0.15
  const size = 100 + index * 80
  const color = boxConfig.value?.color || '#9ca3af'
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderColor: color,
    animationDelay: `${delay}s`
  }
}

const getParticleStyle = (index) => {
  const angle = (index / 20) * 360
  const distance = 100 + Math.random() * 150
  const delay = Math.random() * 0.3
  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--delay': `${delay}s`
  }
}

const getRevealCardStyle = (index) => {
  const delay = index * 0.15
  return {
    animationDelay: `${delay}s`
  }
}

const getCardSparkleStyle = (index) => {
  const angle = (index / 8) * 360
  return {
    '--angle': `${angle}deg`
  }
}

const clearTimers = () => {
  timers.value.forEach(t => clearTimeout(t))
  timers.value = []
}

const addTimer = (callback, delay) => {
  const t = setTimeout(callback, delay)
  timers.value.push(t)
  return t
}

const startAnimation = () => {
  clearTimers()
  animatedResults.value = []
  phase.value = 'shake'

  audioStore.playPickup()

  addTimer(() => {
    audioStore.playClick()
  }, 300)

  addTimer(() => {
    audioStore.playClick()
  }, 600)

  addTimer(() => {
    phase.value = 'burst'
    audioStore.playRareFound()
  }, 900)

  addTimer(() => {
    phase.value = 'reveal'
    animatedResults.value = props.results || []
    revealStartTime.value = Date.now()

    if (animatedResults.value.some(r => [RARITY.EPIC, RARITY.LEGENDARY].includes(r.rarity))) {
      audioStore.playReward()
    } else {
      audioStore.playSuccess()
    }
  }, 1700)
}

const handleSkip = () => {
  if (phase.value === 'shake') {
    clearTimers()
    phase.value = 'burst'
    audioStore.playRareFound()

    addTimer(() => {
      phase.value = 'reveal'
      animatedResults.value = props.results || []
      revealStartTime.value = Date.now()
      audioStore.playSuccess()
    }, 400)
  } else if (phase.value === 'burst') {
    clearTimers()
    phase.value = 'reveal'
    animatedResults.value = props.results || []
    revealStartTime.value = Date.now()
    audioStore.playSuccess()
  } else if (phase.value === 'reveal') {
    clearTimers()
    emit('close')
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    startAnimation()
  } else {
    clearTimers()
    phase.value = 'idle'
    animatedResults.value = []
  }
})

onUnmounted(() => {
  clearTimers()
})
</script>

<style scoped>
.gacha-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.gacha-animation-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.box-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gacha-box {
  width: 180px;
  height: 180px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 2;
}

.gacha-box.shake {
  animation: boxShake 0.3s ease-in-out 3;
}

.box-emoji {
  font-size: 90px;
  display: block;
}

.box-shadows {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.box-shadow {
  width: 160px;
  height: 30px;
  border-radius: 50%;
  filter: blur(10px);
  opacity: 0.6;
  animation: shadowPulse 0.9s ease-in-out 3;
}

.burst-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.burst-center {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: burstScale 0.8s ease-out forwards;
  z-index: 2;
}

.burst-emoji {
  font-size: 70px;
  animation: burstSpin 0.8s ease-out;
}

.burst-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.burst-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid;
  border-radius: 50%;
  opacity: 0;
  animation: ringExpand 0.8s ease-out forwards;
}

.burst-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 18px;
  opacity: 0;
  animation: particleFly 1s ease-out forwards;
  animation-delay: var(--delay);
}

.reveal-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 20px;
}

.reveal-card-wrapper {
  opacity: 0;
  animation: cardReveal 0.5s ease-out forwards;
}

.reveal-card {
  width: 140px;
  padding: 16px 12px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 2px solid;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.reveal-card.rarity-common { border-color: var(--common); }
.reveal-card.rarity-uncommon { border-color: var(--uncommon); }
.reveal-card.rarity-rare { 
  border-color: var(--rare); 
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
}
.reveal-card.rarity-epic { 
  border-color: var(--epic); 
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.4);
}
.reveal-card.rarity-legendary { 
  border-color: var(--legendary); 
  box-shadow: 0 0 50px rgba(245, 158, 11, 0.5);
  animation: legendaryCardPulse 2s ease-in-out infinite;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  opacity: 0;
  animation: cardGlow 2s ease-in-out infinite;
  animation-delay: 0.5s;
}

.card-sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.card-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 14px;
  opacity: 0;
  animation: sparkleOrbit 3s ease-in-out infinite;
}

.mineral-display-area {
  margin-bottom: 12px;
}

.mineral-display-area .mineral-emoji {
  font-size: 50px;
  display: block;
  animation: emojiFloat 2s ease-in-out infinite;
}

.rarity-stars {
  font-size: 14px;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.rarity-common .rarity-stars { color: var(--common); }
.rarity-uncommon .rarity-stars { color: var(--uncommon); }
.rarity-rare .rarity-stars { color: var(--rare); }
.rarity-epic .rarity-stars { color: var(--epic); }
.rarity-legendary .rarity-stars { color: var(--legendary); }

.mineral-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.rarity-legendary .mineral-name {
  background: linear-gradient(135deg, #ffd700, #ffec8b, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 2s linear infinite;
  background-size: 200% auto;
}

.mineral-en {
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 8px;
}

.badges {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}

.badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.new-badge {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.pity-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.coin-reward {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 8px;
}

.coin-icon {
  font-size: 14px;
}

.coin-value {
  font-size: 13px;
  font-weight: 600;
  color: #fbbf24;
}

.skip-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-secondary);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skip-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

@keyframes boxShake {
  0%, 100% { transform: translateX(0) rotate(0); }
  20% { transform: translateX(-10px) rotate(-5deg); }
  40% { transform: translateX(10px) rotate(5deg); }
  60% { transform: translateX(-8px) rotate(-3deg); }
  80% { transform: translateX(8px) rotate(3deg); }
}

@keyframes shadowPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

@keyframes burstScale {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes burstSpin {
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(720deg) scale(0); }
}

@keyframes ringExpand {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

@keyframes particleFly {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate(
      calc(-50% + cos(var(--angle)) * 40px),
      calc(-50% + sin(var(--angle)) * 40px)
    ) rotate(180deg) scale(1);
  }
  100% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * var(--distance)),
      calc(-50% + sin(var(--angle)) * var(--distance))
    ) rotate(720deg) scale(0);
    opacity: 0;
  }
}

@keyframes cardReveal {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes legendaryCardPulse {
  0%, 100% { box-shadow: 0 0 50px rgba(245, 158, 11, 0.5); }
  50% { box-shadow: 0 0 70px rgba(245, 158, 11, 0.7), 0 0 100px rgba(245, 158, 11, 0.4); }
}

@keyframes cardGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes sparkleOrbit {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg) translateX(60px) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) rotate(180deg) translateX(60px) scale(1);
    opacity: 1;
  }
}

@keyframes emojiFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .reveal-card {
    width: 120px;
    padding: 12px 8px;
  }

  .mineral-display-area .mineral-emoji {
    font-size: 40px;
  }

  .mineral-name {
    font-size: 14px;
  }
}
</style>
