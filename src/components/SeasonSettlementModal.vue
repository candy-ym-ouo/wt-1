<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && result" class="modal-overlay">
        <div class="modal-content">
          <div class="settlement-header">
            <div class="sparkles">
              <span v-for="i in 8" :key="i" class="sparkle" :style="getSparkleStyle(i)">✨</span>
            </div>
            <span class="settlement-emoji">{{ result.seasonEmoji }}</span>
            <h2 class="settlement-title">{{ result.seasonName }} 已结算</h2>
            <p class="settlement-subtitle">赛季征程圆满结束</p>
          </div>

          <div class="stats-section">
            <div class="stat-card">
              <span class="stat-emoji">🏆</span>
              <span class="stat-value rank-value">第 {{ result.rank }} 名</span>
              <span class="stat-label">最终排名</span>
            </div>
            <div class="stat-card">
              <span class="stat-emoji">⭐</span>
              <span class="stat-value">{{ result.totalPoints }}</span>
              <span class="stat-label">总积分</span>
            </div>
            <div class="stat-card">
              <span class="stat-emoji">📊</span>
              <span class="stat-value">Lv.{{ result.passLevel }}</span>
              <span class="stat-label">通行证等级</span>
            </div>
          </div>

          <div class="rewards-section">
            <h3 class="rewards-title">🎁 结算奖励</h3>
            <div class="rewards-list">
              <div class="reward-row" v-if="result.rewards.coins > 0">
                <span class="reward-icon">💰</span>
                <span class="reward-name">金币</span>
                <span class="reward-amount">+{{ result.rewards.coins }}</span>
              </div>
              <div class="reward-row" v-for="title in result.titles" :key="title">
                <span class="reward-icon">🏅</span>
                <span class="reward-name">称号</span>
                <span class="reward-amount title-amount">{{ title }}</span>
              </div>
              <div
                class="reward-row specimen-row"
                v-for="specimenId in result.specimenIds"
                :key="specimenId"
              >
                <span class="reward-icon">🔮</span>
                <span class="reward-name">限定标本</span>
                <span class="reward-amount specimen-amount">{{ getSpecimenName(specimenId) }}</span>
              </div>
            </div>
          </div>

          <div class="encouragement" v-if="result.rank > 10">
            <p>下个赛季继续加油，冲击更高排名！💪</p>
          </div>

          <button class="confirm-btn" @click="$emit('close')">
            收下奖励 🎉
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { SEASONS } from '@/data/season'

defineProps({
  show: Boolean,
  result: Object
})

defineEmits(['close'])

const getSparkleStyle = (index) => {
  const angle = (index / 8) * 360
  const delay = index * 0.15
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const getSpecimenName = (specimenId) => {
  for (const season of SEASONS) {
    const specimen = season.limitedSpecimens?.find(s => s.id === specimenId)
    if (specimen) return specimen.name
  }
  return '未知标本'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 24px;
  max-width: 400px;
  width: 100%;
  overflow: hidden;
  animation: modalIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.15);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.5) translateY(40px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.settlement-header {
  position: relative;
  padding: 32px 20px 20px;
  text-align: center;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.1));
  overflow: hidden;
}

.sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 16px;
  animation: sparkleMove 2s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes sparkleMove {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 100px),
      calc(-50% + sin(var(--angle)) * 100px)
    ) rotate(180deg) scale(1);
    opacity: 1;
  }
}

.settlement-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.settlement-title {
  font-size: 24px;
  font-weight: 800;
  color: #fbbf24;
  margin: 0 0 4px 0;
}

.settlement-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 16px 20px;
}

.stat-card {
  text-align: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.stat-emoji {
  font-size: 20px;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.rank-value {
  color: #fbbf24;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.rewards-section {
  padding: 0 20px 16px;
}

.rewards-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  text-align: center;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.specimen-row {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.25);
}

.reward-icon {
  font-size: 20px;
}

.reward-name {
  font-size: 13px;
  color: var(--text-secondary);
  flex: 1;
}

.reward-amount {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
}

.title-amount {
  color: #60a5fa;
  font-size: 14px;
}

.specimen-amount {
  color: #c084fc;
  font-size: 14px;
}

.encouragement {
  padding: 0 20px 12px;
  text-align: center;
}

.encouragement p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.confirm-btn {
  width: calc(100% - 40px);
  margin: 0 20px 20px;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
