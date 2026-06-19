<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">💎</span>
          <span class="logo-text">矿物标本拼贴</span>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-icon">📦</span>
            <span class="stat-value">{{ collectedCount }}/{{ totalCount }}</span>
          </div>
          <button 
            class="sound-btn" 
            @click="toggleSound"
            :class="{ active: soundEnabled }"
          >
            {{ soundEnabled ? '🔊' : '🔇' }}
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <nav class="app-nav">
      <RouterLink 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useGameStore } from './stores/game'
import { useAudioStore } from './stores/audio'

const gameStore = useGameStore()
const audioStore = useAudioStore()

const navItems = [
  { path: '/', icon: '🏠', label: '展柜' },
  { path: '/collage', icon: '🎨', label: '拼装' },
  { path: '/collection', icon: '📖', label: '图鉴' }
]

const collectedCount = computed(() => gameStore.collectedMinerals.length)
const totalCount = computed(() => gameStore.allMinerals.length)
const soundEnabled = computed(() => audioStore.soundEnabled)

const toggleSound = () => {
  audioStore.toggleSound()
}

onMounted(() => {
  audioStore.loadAudioSettings()
  gameStore.loadProgress()
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-header {
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  height: 60px;
  display: flex;
  align-items: center;
  z-index: 100;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary), #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.sound-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--bg-card);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sound-btn:hover {
  transform: scale(1.1);
}

.sound-btn.active {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.app-nav {
  flex-shrink: 0;
  height: 70px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 20px;
  border-radius: 12px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.nav-item.active {
  color: var(--primary);
  background: rgba(233, 69, 96, 0.1);
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@media (max-width: 480px) {
  .logo-text {
    font-size: 16px;
  }
  
  .stat-value {
    font-size: 12px;
  }
  
  .nav-item {
    padding: 8px 16px;
  }
}
</style>
