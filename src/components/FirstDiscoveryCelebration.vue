<template>
  <Teleport to="body">
    <Transition name="celebration-fade">
      <div v-if="visible" class="celebration-overlay" @click.self="handleSkip">
        <div class="fireworks-container">
          <div
            v-for="i in 12"
            :key="'fw-' + i"
            class="firework"
            :style="getFireworkStyle(i)"
          ></div>
        </div>

        <div class="particles-container">
          <div
            v-for="i in 30"
            :key="'p-' + i"
            class="particle"
            :style="getParticleStyle(i)"
          >
            {{ getParticleEmoji(i) }}
          </div>
        </div>

        <div class="spotlight" :style="{ '--rarity-color': rarityColor }"></div>

        <div class="celebration-content">
          <div class="discovery-banner" :class="`rarity-${mineral?.rarity}`">
            <span class="banner-icon">🎉</span>
            <span class="banner-text">首次发现</span>
            <span class="banner-icon">🎉</span>
          </div>

          <div class="mineral-showcase" :class="`rarity-${mineral?.rarity}`">
            <div class="showcase-ring ring-1"></div>
            <div class="showcase-ring ring-2"></div>
            <div class="showcase-ring ring-3"></div>
            
            <div class="mineral-glow"></div>
            <div class="mineral-orb">
              <span class="mineral-emoji">{{ mineral?.emoji }}</span>
            </div>
            
            <div class="sparkle-container">
              <span
                v-for="i in 8"
                :key="'s-' + i"
                class="showcase-sparkle"
                :style="getSparkleStyle(i)"
              >
                ✦
              </span>
            </div>
          </div>

          <div class="mineral-info">
            <h2 class="mineral-name" :class="`rarity-${mineral?.rarity}`">
              {{ mineral?.name }}
            </h2>
            <p class="mineral-en">{{ mineral?.nameEn }}</p>
            <div class="rarity-display" :style="{ borderColor: rarityColor }">
              <span class="rarity-stars">{{ stars }}</span>
              <span class="rarity-label" :style="{ color: rarityColor }">
                {{ rarityName }}
              </span>
            </div>
          </div>

          <Transition name="slide-up" mode="out-in">
            <div v-if="phase === 'achievement'" key="achievement" class="achievement-reveal">
              <div class="achievement-badge">
                <div class="badge-glow"></div>
                <span class="badge-icon">🏅</span>
              </div>
              <div class="achievement-text">
                <p class="achievement-title">成就解锁！</p>
                <p class="achievement-desc">{{ achievementText }}</p>
              </div>
            </div>
          </Transition>

          <Transition name="slide-up" mode="out-in">
            <div v-if="phase === 'showcase'" key="showcase" class="showcase-highlight">
              <div class="showcase-icon">🪟</div>
              <div class="showcase-text">
                <p class="showcase-title">已加入展柜</p>
                <p class="showcase-desc">在矿物展柜中查看你的新收藏</p>
              </div>
            </div>
          </Transition>

          <div class="rewards-section">
            <div class="reward-item coins">
              <span class="reward-icon">🪙</span>
              <span class="reward-value">+{{ coinReward }}</span>
              <span class="reward-label">金币</span>
            </div>
            <div v-if="expReward > 0" class="reward-item exp">
              <span class="reward-icon">⭐</span>
              <span class="reward-value">+{{ expReward }}</span>
              <span class="reward-label">经验</span>
            </div>
          </div>

          <div class="progress-dots">
            <span :class="{ active: phaseIndex >= 0 }" class="dot"></span>
            <span :class="{ active: phaseIndex >= 1 }" class="dot"></span>
            <span :class="{ active: phaseIndex >= 2 }" class="dot"></span>
          </div>

          <button v-if="phase === 'done'" class="continue-btn" @click="handleClose">
            <span class="btn-text">太棒了！</span>
            <span class="btn-icon">→</span>
          </button>
          <p v-else class="skip-hint">点击任意位置跳过</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RARITY_CONFIG, getRarityStars } from '@/data/rarity'
import { useAudioStore } from '@/stores/audio'

const props = defineProps({
  visible: Boolean,
  mineral: Object,
  coinReward: {
    type: Number,
    default: 0
  },
  expReward: {
    type: Number,
    default: 0
  },
  achievementText: {
    type: String,
    default: '矿物收藏家'
  }
})

const emit = defineEmits(['close'])

const audioStore = useAudioStore()
const phase = ref('intro')
const phaseIndex = ref(0)
const timers = ref([])

const rarityConfig = computed(() => {
  return props.mineral ? RARITY_CONFIG[props.mineral.rarity] : null
})

const rarityColor = computed(() => rarityConfig.value?.color || '#9ca3af')
const rarityName = computed(() => rarityConfig.value?.name || '')
const stars = computed(() => props.mineral ? getRarityStars(props.mineral.rarity) : '')

const addTimer = (callback, delay) => {
  const timer = setTimeout(callback, delay)
  timers.value.push(timer)
  return timer
}

const clearAllTimers = () => {
  timers.value.forEach(t => clearTimeout(t))
  timers.value = []
}

const startCelebration = () => {
  clearAllTimers()
  phase.value = 'intro'
  phaseIndex.value = 0
  
  audioStore.playFirstDiscovery(props.mineral?.rarity || 'rare')
  
  addTimer(() => {
    phase.value = 'achievement'
    phaseIndex.value = 1
    audioStore.playAchievementUnlock()
  }, 1200)
  
  addTimer(() => {
    phase.value = 'showcase'
    phaseIndex.value = 2
    audioStore.playSparkle()
  }, 2400)
  
  addTimer(() => {
    phase.value = 'done'
    phaseIndex.value = 3
  }, 3600)
}

const handleSkip = () => {
  if (phase.value === 'done') return
  clearAllTimers()
  phase.value = 'done'
  phaseIndex.value = 3
}

const handleClose = () => {
  clearAllTimers()
  emit('close')
}

const getFireworkStyle = (index) => {
  const angle = (index / 12) * 360
  const delay = index * 0.15
  const size = 30 + Math.random() * 40
  const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']
  const color = colors[index % colors.length]
  
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`,
    '--size': `${size}px`,
    '--color': color
  }
}

const getParticleStyle = (index) => {
  const delay = Math.random() * 2
  const duration = 3 + Math.random() * 2
  const left = Math.random() * 100
  const size = 16 + Math.random() * 20
  
  return {
    '--delay': `${delay}s`,
    '--duration': `${duration}s`,
    '--left': `${left}%`,
    '--size': `${size}px`
  }
}

const getParticleEmoji = (index) => {
  const emojis = ['✨', '⭐', '💫', '🌟', '✨', '⭐']
  return emojis[index % emojis.length]
}

const getSparkleStyle = (index) => {
  const angle = (index / 8) * 360
  const delay = index * 0.15
  
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

watch(() => props.visible, (val) => {
  if (val && props.mineral) {
    startCelebration()
  } else {
    clearAllTimers()
  }
})

onMounted(() => {
  if (props.visible && props.mineral) {
    startCelebration()
  }
})

onUnmounted(() => {
  clearAllTimers()
})
</script>

<style scoped>
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.9), rgba(0, 0, 0, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: hidden;
  cursor: pointer;
}

.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.firework {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: var(--color);
  transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-200px) scale(0);
  opacity: 0;
  animation: fireworkExplode 2s ease-out infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 20px var(--color), 0 0 40px var(--color);
}

@keyframes fireworkExplode {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-180px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-250px) scale(0.3);
  }
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  bottom: -50px;
  left: var(--left);
  font-size: var(--size);
  animation: particleFloat var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) scale(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateY(-50px) scale(1) rotate(36deg);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-600px) scale(0.5) rotate(360deg);
    opacity: 0;
  }
}

.spotlight {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(var(--rarity-color-rgb, 245, 158, 11), 0.15), transparent 70%);
  animation: spotlightPulse 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes spotlightPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
}

.celebration-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 400px;
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.discovery-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 30px;
  border: 2px solid;
  animation: bannerBounce 1s ease-out;
  backdrop-filter: blur(10px);
}

.discovery-banner.rarity-common { border-color: #9ca3af; }
.discovery-banner.rarity-uncommon { border-color: #22c55e; }
.discovery-banner.rarity-rare { border-color: #3b82f6; }
.discovery-banner.rarity-epic { border-color: #a855f7; }
.discovery-banner.rarity-legendary { 
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
}

.banner-icon {
  font-size: 24px;
  animation: iconSpin 2s linear infinite;
}

@keyframes iconSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.banner-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

@keyframes bannerBounce {
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.mineral-showcase {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.showcase-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0;
}

.showcase-ring.ring-1 {
  width: 100%;
  height: 100%;
  animation: ringExpand 2s ease-out infinite;
}

.showcase-ring.ring-2 {
  width: 80%;
  height: 80%;
  animation: ringExpand 2s ease-out infinite 0.3s;
}

.showcase-ring.ring-3 {
  width: 60%;
  height: 60%;
  animation: ringExpand 2s ease-out infinite 0.6s;
}

.mineral-showcase.rarity-common .showcase-ring { border-color: #9ca3af; }
.mineral-showcase.rarity-uncommon .showcase-ring { border-color: #22c55e; }
.mineral-showcase.rarity-rare .showcase-ring { border-color: #3b82f6; }
.mineral-showcase.rarity-epic .showcase-ring { border-color: #a855f7; }
.mineral-showcase.rarity-legendary .showcase-ring { border-color: #f59e0b; }

@keyframes ringExpand {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.mineral-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.6;
  animation: glowPulse 2s ease-in-out infinite;
}

.mineral-showcase.rarity-common .mineral-glow { background: #9ca3af; }
.mineral-showcase.rarity-uncommon .mineral-glow { background: #22c55e; }
.mineral-showcase.rarity-rare .mineral-glow { background: #3b82f6; }
.mineral-showcase.rarity-epic .mineral-glow { background: #a855f7; }
.mineral-showcase.rarity-legendary .mineral-glow { background: #f59e0b; }

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.mineral-orb {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%);
  animation: orbFloat 3s ease-in-out infinite;
}

@keyframes orbFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

.mineral-emoji {
  font-size: 80px;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
  animation: emojiPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes emojiPop {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.sparkle-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.showcase-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 20px;
  color: #fff;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateX(100px);
  animation: sparkleOrbit 2s ease-in-out infinite;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes sparkleOrbit {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(80px) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(110px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(130px) scale(0);
    opacity: 0;
  }
}

.mineral-info {
  animation: infoSlideUp 0.8s ease-out 0.3s both;
}

@keyframes infoSlideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.mineral-name {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
}

.mineral-name.rarity-legendary {
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
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 12px 0;
}

.rarity-display {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 20px;
  border-radius: 20px;
  border: 2px solid;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
}

.rarity-stars {
  font-size: 16px;
  letter-spacing: 2px;
  color: #fbbf24;
}

.rarity-label {
  font-size: 14px;
  font-weight: 600;
}

.achievement-reveal,
.showcase-highlight {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.achievement-badge {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #f59e0b;
  filter: blur(15px);
  opacity: 0.5;
  animation: badgeGlow 1.5s ease-in-out infinite;
}

@keyframes badgeGlow {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.6; }
}

.badge-icon {
  position: relative;
  font-size: 36px;
  animation: badgeBounce 1s ease-in-out infinite;
}

@keyframes badgeBounce {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(-5deg); }
}

.achievement-text,
.showcase-text {
  text-align: left;
  flex: 1;
}

.achievement-title,
.showcase-title {
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
  margin: 0 0 4px 0;
}

.achievement-desc,
.showcase-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.showcase-icon {
  font-size: 40px;
  flex-shrink: 0;
  animation: showcasePop 0.6s ease-out;
}

@keyframes showcasePop {
  0% { transform: scale(0) rotate(-10deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.rewards-section {
  display: flex;
  gap: 16px;
  animation: rewardsSlideUp 0.6s ease-out 0.5s both;
}

@keyframes rewardsSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 90px;
}

.reward-icon {
  font-size: 28px;
}

.reward-value {
  font-size: 20px;
  font-weight: 700;
}

.reward-item.coins .reward-value {
  color: #fbbf24;
}

.reward-item.exp .reward-value {
  color: #22c55e;
}

.reward-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.progress-dots {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.dot.active {
  background: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  transform: scale(1.2);
}

.continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 280px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--primary, #e94560), #ff6b6b);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: btnPulse 2s ease-in-out infinite;
}

.continue-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(233, 69, 96, 0.4);
}

@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0); }
  50% { box-shadow: 0 0 20px 5px rgba(233, 69, 96, 0.3); }
}

.btn-text {
  flex: 1;
  text-align: center;
}

.btn-icon {
  font-size: 20px;
}

.skip-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.celebration-fade-enter-active,
.celebration-fade-leave-active {
  transition: opacity 0.4s ease;
}

.celebration-fade-enter-from,
.celebration-fade-leave-to {
  opacity: 0;
}
</style>
