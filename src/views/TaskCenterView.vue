<template>
  <div class="task-view">
    <div class="task-header">
      <div class="header-top">
        <div class="header-title-group">
          <h1 class="page-title">⛏️ 任务中心</h1>
          <p class="page-subtitle">完成矿物主题任务，赢取丰厚奖励</p>
        </div>
        <button class="coin-flow-btn" @click="openCoinFlow">
          <span class="btn-icon">💰</span>
          <span class="btn-text">收支记录</span>
          <span class="btn-amount">+{{ formatNumber(taskCoinStats.totalIncome) }}</span>
        </button>
      </div>
      <div v-if="claimableCount > 0" class="claimable-badge" @click="handleClaimAll">
        <span class="badge-pulse"></span>
        <span class="badge-text">{{ claimableCount }} 个奖励可领取</span>
        <span class="badge-arrow">→</span>
      </div>
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <div class="tab-content">
      <transition name="tab-switch" mode="out-in">
        <div v-if="activeTab === 'daily'" key="daily" class="task-list">
          <div class="list-header">
            <div class="reset-info">
              <span class="reset-icon">⏰</span>
              <span class="reset-text">每日 {{ dailyResetTime }}</span>
            </div>
            <div class="completion-info">
              <div class="completion-bar">
                <div class="completion-fill" :style="{ width: dailyCompletionRate + '%' }"></div>
              </div>
              <span class="completion-text">{{ dailyCompletionRate }}%</span>
            </div>
          </div>
          <div class="task-cards">
            <div
              v-for="task in dailyTasks"
              :key="task.id"
              class="task-card"
              :class="{ complete: task.isComplete, claimed: task.isClaimed }"
            >
              <div class="task-main">
                <div class="task-emoji">{{ task.emoji }}</div>
                <div class="task-info">
                  <h3 class="task-title">{{ task.title }}</h3>
                  <p class="task-desc">{{ task.description }}</p>
                  <div class="task-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :class="{ full: task.isComplete }"
                        :style="{ width: Math.min(100, (task.progress / task.target) * 100) + '%' }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ task.progress }}/{{ task.target }}</span>
                  </div>
                </div>
                <button
                  v-if="!task.isClaimed"
                  class="claim-btn"
                  :class="{ ready: task.canClaim, disabled: !task.canClaim }"
                  :disabled="!task.canClaim"
                  @click="handleClaimDaily(task.id)"
                >
                  <span v-if="task.canClaim">领取</span>
                  <span v-else>未完成</span>
                </button>
                <div v-else class="claimed-tag">
                  <span class="claimed-icon">✓</span>
                </div>
              </div>
              <div class="task-rewards">
                <span class="reward-item">💰 {{ task.rewards.coins }}</span>
                <span class="reward-item">⭐ {{ task.rewards.exp }} EXP</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'weekly'" key="weekly" class="task-list">
          <div class="list-header">
            <div class="reset-info">
              <span class="reset-icon">📅</span>
              <span class="reset-text">每周一重置</span>
            </div>
            <div class="completion-info">
              <div class="completion-bar">
                <div class="completion-fill weekly" :style="{ width: weeklyCompletionRate + '%' }"></div>
              </div>
              <span class="completion-text">{{ weeklyCompletionRate }}%</span>
            </div>
          </div>
          <div class="task-cards">
            <div
              v-for="task in weeklyGoals"
              :key="task.id"
              class="task-card weekly-card"
              :class="{ complete: task.isComplete, claimed: task.isClaimed }"
            >
              <div class="task-main">
                <div class="task-emoji">{{ task.emoji }}</div>
                <div class="task-info">
                  <h3 class="task-title">{{ task.title }}</h3>
                  <p class="task-desc">{{ task.description }}</p>
                  <div class="task-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill weekly"
                        :class="{ full: task.isComplete }"
                        :style="{ width: Math.min(100, (task.progress / task.target) * 100) + '%' }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ task.progress }}/{{ task.target }}</span>
                  </div>
                </div>
                <button
                  v-if="!task.isClaimed"
                  class="claim-btn weekly-claim"
                  :class="{ ready: task.canClaim, disabled: !task.canClaim }"
                  :disabled="!task.canClaim"
                  @click="handleClaimWeekly(task.id)"
                >
                  <span v-if="task.canClaim">领取</span>
                  <span v-else>未完成</span>
                </button>
                <div v-else class="claimed-tag weekly-claimed">
                  <span class="claimed-icon">✓</span>
                </div>
              </div>
              <div class="task-rewards">
                <span class="reward-item">💰 {{ task.rewards.coins }}</span>
                <span class="reward-item">⭐ {{ task.rewards.exp }} EXP</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'achievements'" key="achievements" class="achievement-list">
          <div class="achievement-summary">
            <div class="summary-card">
              <span class="summary-icon">🏅</span>
              <div class="summary-info">
                <span class="summary-value">{{ achievementStats.claimed }}/{{ achievementStats.total }}</span>
                <span class="summary-label">已解锁徽章</span>
              </div>
            </div>
          </div>
          <div class="achievement-cards">
            <div
              v-for="ach in achievements"
              :key="ach.id"
              class="achievement-card"
              :class="{ maxed: ach.isMaxed }"
            >
              <div class="ach-header">
                <span class="ach-emoji">{{ ach.emoji }}</span>
                <div class="ach-info">
                  <h3 class="ach-title">{{ ach.title }}</h3>
                  <p class="ach-desc">{{ ach.description }}</p>
                </div>
                <div v-if="ach.currentTier" class="ach-tier-badge" :style="{ borderColor: ach.currentTier.tier.color, color: ach.currentTier.tier.color }">
                  {{ ach.currentTier.tier.icon }} {{ ach.currentTier.tier.name }}
                </div>
              </div>
              <div class="ach-progress-section">
                <div class="ach-tier-track">
                  <div
                    v-for="(tier, idx) in ach.tiers"
                    :key="idx"
                    class="tier-node"
                    :class="{ unlocked: ach.currentTierIndex >= idx, current: ach.currentTierIndex === idx, claimed: ach.claimedTiers.includes(idx) }"
                    :style="{ '--tier-color': tier.tier.color }"
                  >
                    <span class="tier-icon">{{ tier.tier.icon }}</span>
                    <span class="tier-name">{{ tier.tier.name }}</span>
                  </div>
                </div>
                <div class="ach-value-bar">
                  <div class="ach-value-fill" :style="{ width: ach.progressPercent + '%', background: ach.currentTier ? ach.currentTier.tier.color : '#64748b' }"></div>
                </div>
                <div class="ach-value-text">
                  <span>{{ ach.currentValue }}{{ ach.nextTier ? ' / ' + ach.nextTier.target : '' }}</span>
                  <span>{{ ach.progressPercent }}%</span>
                </div>
              </div>
              <div v-if="ach.canClaim" class="ach-claim-section">
                <button
                  class="claim-btn ach-claim-btn"
                  :style="{ background: ach.currentTier.tier.color }"
                  @click="handleClaimAchievement(ach.id, ach.currentTierIndex)"
                >
                  🎁 领取{{ ach.currentTier.tier.icon }}{{ ach.currentTier.tier.name }}阶奖励 💰{{ ach.currentTier.rewards.coins }}
                </button>
              </div>
              <div v-else-if="ach.isMaxed && ach.claimedTiers.length === ach.tiers.length" class="ach-claim-section">
                <div class="maxed-tag">🏆 全部达成</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div v-if="taskStore.claimAnimation" class="reward-overlay" @click="taskStore.claimAnimation = null">
      <div class="reward-popup" @click.stop>
        <div class="reward-popup-icon">🎁</div>
        <h2 class="reward-popup-title">奖励已领取！</h2>
        <div class="reward-popup-items">
          <div class="popup-reward-item">
            <span class="popup-reward-icon">💰</span>
            <span class="popup-reward-value">+{{ taskStore.claimAnimation.rewards.coins }}</span>
          </div>
          <div v-if="taskStore.claimAnimation.rewards.exp" class="popup-reward-item">
            <span class="popup-reward-icon">⭐</span>
            <span class="popup-reward-value">+{{ taskStore.claimAnimation.rewards.exp }} EXP</span>
          </div>
        </div>
        <button class="popup-close-btn" @click="taskStore.claimAnimation = null">太棒了！</button>
      </div>
    </div>
    
    <CoinFlowModal 
      :visible="showCoinFlow" 
      :default-types="[
        'task_reward',
        'achievement_reward'
      ]"
      @close="closeCoinFlow" 
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useAudioStore } from '@/stores/audio'
import { useGameStore } from '@/stores/game'
import CoinFlowModal from '@/components/CoinFlowModal.vue'

const taskStore = useTaskStore()
const audioStore = useAudioStore()
const gameStore = useGameStore()

const showCoinFlow = ref(false)

const openCoinFlow = () => {
  audioStore.playClick()
  showCoinFlow.value = true
}

const closeCoinFlow = () => {
  showCoinFlow.value = false
}

const taskCoinStats = computed(() => {
  const categories = [
    'task_reward',
    'achievement_reward'
  ]
  return gameStore.getCoinStats({ categories })
})

const activeTab = ref('daily')

const tabs = computed(() => [
  {
    key: 'daily',
    icon: '📋',
    label: '每日任务',
    count: taskStore.dailyTasks.filter(t => t.canClaim).length
  },
  {
    key: 'weekly',
    icon: '🎯',
    label: '周目标',
    count: taskStore.weeklyGoals.filter(t => t.canClaim).length
  },
  {
    key: 'achievements',
    icon: '🏅',
    label: '成就徽章',
    count: taskStore.achievements.filter(a => a.canClaim).length
  }
])

const dailyTasks = computed(() => taskStore.dailyTasks)
const weeklyGoals = computed(() => taskStore.weeklyGoals)
const achievements = computed(() => taskStore.achievements)
const claimableCount = computed(() => taskStore.claimableCount)
const dailyCompletionRate = computed(() => taskStore.dailyCompletionRate)
const weeklyCompletionRate = computed(() => taskStore.weeklyCompletionRate)
const achievementStats = computed(() => taskStore.totalAchievementCount)

const dailyResetTime = computed(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const diff = tomorrow - now
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}小时${mins}分后重置`
})

const handleClaimDaily = (taskId) => {
  audioStore.playReward()
  taskStore.claimDailyReward(taskId)
}

const handleClaimWeekly = (taskId) => {
  audioStore.playReward()
  taskStore.claimWeeklyReward(taskId)
}

const handleClaimAchievement = (achId, tierIndex) => {
  audioStore.playReward()
  taskStore.claimAchievementReward(achId, tierIndex)
}

const handleClaimAll = () => {
  audioStore.playReward()
  const dailyClaimed = taskStore.claimAllDaily()
  const weeklyClaimed = taskStore.claimAllWeekly()
  if (dailyClaimed > 0 || weeklyClaimed > 0) {
    audioStore.playRareFound()
  }
}

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
</script>

<style scoped>
.task-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.task-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.header-title-group {
  flex: 1;
}

.coin-flow-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.coin-flow-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2));
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.coin-flow-btn .btn-icon {
  font-size: 18px;
}

.coin-flow-btn .btn-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.coin-flow-btn .btn-amount {
  font-size: 13px;
  font-weight: 700;
  color: #22c55e;
  font-family: 'Courier New', monospace;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.claimable-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.claimable-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.5);
}

.badge-pulse {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.2);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.badge-text {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  position: relative;
  z-index: 1;
}

.badge-arrow {
  font-size: 16px;
  color: #fff;
  position: relative;
  z-index: 1;
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: #fff;
  box-shadow: 0 2px 10px rgba(233, 69, 96, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  white-space: nowrap;
}

.tab-count {
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  padding: 0 4px;
}

.tab-content {
  min-height: 300px;
}

.tab-switch-enter-active,
.tab-switch-leave-active {
  transition: all 0.25s ease;
}

.tab-switch-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.tab-switch-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.reset-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reset-icon {
  font-size: 16px;
}

.reset-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.completion-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.completion-bar {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.completion-fill.weekly {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.completion-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 32px;
  text-align: right;
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.task-card.complete {
  border-color: rgba(34, 197, 94, 0.4);
}

.task-card.claimed {
  opacity: 0.65;
}

.task-card.weekly-card {
  border-left: 3px solid #3b82f6;
}

.task-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-emoji {
  font-size: 32px;
  flex-shrink: 0;
  width: 44px;
  text-align: center;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.task-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.weekly {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.progress-fill.full {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.claim-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.claim-btn.ready {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: #fff;
  box-shadow: 0 2px 10px rgba(233, 69, 96, 0.3);
  animation: claimPulse 2s ease-in-out infinite;
}

@keyframes claimPulse {
  0%, 100% { box-shadow: 0 2px 10px rgba(233, 69, 96, 0.3); }
  50% { box-shadow: 0 2px 20px rgba(233, 69, 96, 0.6); }
}

.claim-btn.ready:hover {
  transform: scale(1.05);
}

.claim-btn.weekly-claim.ready {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
}

.claim-btn.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.claimed-tag {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 50%;
}

.claimed-icon {
  color: #22c55e;
  font-size: 18px;
  font-weight: 700;
}

.weekly-claimed {
  background: rgba(59, 130, 246, 0.2);
}

.weekly-claimed .claimed-icon {
  color: #3b82f6;
}

.task-rewards {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.reward-item {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 10px;
  border-radius: 8px;
}

.achievement-summary {
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-icon {
  font-size: 36px;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #f59e0b;
}

.summary-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.achievement-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.achievement-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.achievement-card.maxed {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
}

.ach-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.ach-emoji {
  font-size: 36px;
  flex-shrink: 0;
}

.ach-info {
  flex: 1;
  min-width: 0;
}

.ach-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.ach-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.ach-tier-badge {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.ach-progress-section {
  margin-bottom: 4px;
}

.ach-tier-track {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tier-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 56px;
  transition: all 0.3s ease;
}

.tier-node.unlocked {
  background: rgba(var(--tier-color-rgb, 100, 116, 139), 0.15);
  border-color: var(--tier-color);
  opacity: 1;
}

.tier-node.current {
  box-shadow: 0 0 12px var(--tier-color);
}

.tier-node.claimed {
  background: rgba(34, 197, 94, 0.15);
  border-color: #22c55e;
}

.tier-icon {
  font-size: 18px;
}

.tier-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
}

.ach-value-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.ach-value-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.ach-value-text {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.ach-claim-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.claim-btn.ach-claim-btn {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: claimPulse 2s ease-in-out infinite;
}

.claim-btn.ach-claim-btn:hover {
  transform: scale(1.02);
  filter: brightness(1.15);
}

.maxed-tag {
  text-align: center;
  padding: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
}

.reward-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.reward-popup {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 32px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.5) translateY(40px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.reward-popup-icon {
  font-size: 56px;
  margin-bottom: 12px;
  animation: float 2s ease-in-out infinite;
}

.reward-popup-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.reward-popup-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.popup-reward-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.popup-reward-icon {
  font-size: 24px;
}

.popup-reward-value {
  font-size: 20px;
  font-weight: 700;
  color: #facc15;
}

.popup-close-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.popup-close-btn:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}
</style>
