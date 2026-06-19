<template>
  <div class="season-view">
    <div class="reward-toasts">
      <TransitionGroup name="toast">
        <div
          v-for="notification in seasonStore.rewardNotifications"
          :key="notification.id"
          class="reward-toast"
          :class="`type-${notification.type}`"
        >
          <span class="toast-emoji">{{ notification.emoji }}</span>
          <span class="toast-label">{{ notification.label }}</span>
          <span class="toast-value">+{{ notification.value }}</span>
        </div>
      </TransitionGroup>
    </div>

    <div class="season-hero" :style="{ background: season?.themeGradient }" v-if="season">
      <div class="hero-bg-effects">
        <span v-for="i in 6" :key="i" class="hero-shape" :style="getShapeStyle(i)"></span>
      </div>
      <div class="hero-content">
        <span class="hero-emoji">{{ season.emoji }}</span>
        <h1 class="hero-title">{{ season.name }}</h1>
        <p class="hero-subtitle">{{ season.subtitle }}</p>
        <div class="hero-meta">
          <div class="meta-item" v-if="timeRemaining">
            <span class="meta-icon">⏰</span>
            <span class="meta-value">{{ timeRemaining.days }}天 {{ timeRemaining.hours }}时 {{ timeRemaining.minutes }}分</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">⭐</span>
            <span class="meta-value">{{ seasonStore.seasonPoints }} 积分</span>
          </div>
          <div class="meta-item" v-if="seasonStore.totalClaimableCount > 0">
            <span class="meta-icon">🎁</span>
            <span class="meta-value claimable-value">{{ seasonStore.totalClaimableCount }} 可领</span>
          </div>
        </div>
      </div>
    </div>

    <div class="no-season" v-else>
      <div class="no-season-icon">🌙</div>
      <h2 class="no-season-title">暂无进行中的赛季</h2>
      <p class="no-season-desc">下一个赛季即将到来，敬请期待！</p>
    </div>

    <div class="tabs-bar" v-if="season">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge > 0" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <div class="tab-content" v-if="season">
      <div v-if="activeTab === 'pass'" class="pass-section">
        <div class="pass-header">
          <div class="pass-info-card">
            <div class="pass-level-display">
              <div class="level-circle">
                <span class="level-num">{{ seasonStore.passLevel }}</span>
              </div>
              <div class="level-info">
                <span class="level-label">通行证等级</span>
                <span class="level-progress">{{ seasonStore.passLevel }}/50</span>
              </div>
            </div>
            <div class="exp-bar-wrap">
              <div class="exp-bar">
                <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
              </div>
              <span class="exp-text">{{ seasonStore.seasonExp }}/{{ seasonStore.nextTierExp }}</span>
            </div>
          </div>

          <div class="pass-type-toggle" v-if="!seasonStore.isPremiumPass">
            <div class="toggle-info">
              <span class="toggle-icon">👑</span>
              <div>
                <span class="toggle-title">高级通行证</span>
                <span class="toggle-desc">解锁限定标本与额外奖励</span>
              </div>
            </div>
            <button class="activate-btn" @click="handleActivatePremium">
              🔓 激活
            </button>
          </div>
          <div class="premium-active-badge" v-else>
            <span class="premium-icon">👑</span>
            <span class="premium-text">高级通行证已激活</span>
          </div>
        </div>

        <div class="pass-tiers">
          <div
            v-for="(tier, index) in visiblePassTiers"
            :key="index"
            class="pass-tier-card"
            :class="{
              locked: index + scrollOffset >= seasonStore.passLevel,
              current: index + scrollOffset === seasonStore.passLevel,
              free_claimed: seasonStore.freeClaimedTiers.includes(index + scrollOffset),
              premium_claimed: seasonStore.premiumClaimedTiers.includes(index + scrollOffset)
            }"
          >
            <div class="tier-header">
              <div class="tier-level-badge" :class="{ active: index + scrollOffset < seasonStore.passLevel }">
                Lv.{{ tier.level }}
              </div>
              <span class="tier-exp">需 {{ tier.expRequired }} EXP</span>
            </div>

            <div class="tier-rewards">
              <div class="reward-row free-row">
                <span class="row-label free-label">免费</span>
                <div class="row-items">
                  <span class="coin-reward">💰{{ tier.freeReward?.coins || 0 }}</span>
                  <span
                    v-for="item in (tier.freeReward?.items || [])"
                    :key="'f'+item.type+item.value"
                    class="item-reward"
                  >{{ getItemEmoji(item.type) }}{{ item.value }}</span>
                </div>
                <button
                  v-if="index + scrollOffset < seasonStore.passLevel && !seasonStore.freeClaimedTiers.includes(index + scrollOffset)"
                  class="mini-claim free-claim"
                  @click="handleClaimFree(index + scrollOffset)"
                >领取</button>
                <span v-else-if="seasonStore.freeClaimedTiers.includes(index + scrollOffset)" class="done-check">✓</span>
              </div>

              <div class="reward-row premium-row" :class="{ locked: !seasonStore.isPremiumPass }">
                <span class="row-label premium-label">👑</span>
                <div class="row-items">
                  <span class="coin-reward">💰{{ tier.premiumReward?.coins || 0 }}</span>
                  <span
                    v-for="item in (tier.premiumReward?.items || [])"
                    :key="'p'+item.type+item.value"
                    class="item-reward specimen"
                  >{{ getItemEmoji(item.type) }}{{ getItemName(item) }}</span>
                </div>
                <button
                  v-if="seasonStore.isPremiumPass && index + scrollOffset < seasonStore.passLevel && !seasonStore.premiumClaimedTiers.includes(index + scrollOffset)"
                  class="mini-claim premium-claim"
                  @click="handleClaimPremium(index + scrollOffset)"
                >领取</button>
                <span v-else-if="seasonStore.premiumClaimedTiers.includes(index + scrollOffset)" class="done-check">✓</span>
                <span v-else-if="!seasonStore.isPremiumPass" class="lock-mark">🔒</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bulk-claim" v-if="seasonStore.totalClaimableCount > 0">
          <button
            class="bulk-btn free-bulk"
            @click="handleClaimAllFree"
            v-if="seasonStore.freeClaimableCount > 0"
          >
            📦 领取全部免费奖励 ({{ seasonStore.freeClaimableCount }})
          </button>
          <button
            class="bulk-btn premium-bulk"
            @click="handleClaimAllPremium"
            v-if="seasonStore.isPremiumPass && seasonStore.premiumClaimableCount > 0"
          >
            👑 领取全部高级奖励 ({{ seasonStore.premiumClaimableCount }})
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'ranking'" class="ranking-section">
        <div class="my-rank-card" v-if="season">
          <div class="rank-medal">{{ getRankMedal(seasonStore.playerRank) }}</div>
          <div class="rank-info">
            <span class="rank-position">第 {{ seasonStore.playerRank }} 名</span>
            <span class="rank-points">{{ seasonStore.seasonPoints }} 积分</span>
          </div>
          <div class="rank-rewards-preview">
            <span class="preview-label">预计奖励</span>
            <span class="preview-value">{{ getRankRewardPreview() }}</span>
          </div>
        </div>

        <div class="ranking-table">
          <div
            v-for="entry in seasonStore.fullRanking"
            :key="entry.rank"
            class="rank-row"
            :class="{ player: entry.isPlayer, top3: entry.rank <= 3 }"
          >
            <span class="rank-num" :class="`rank-${entry.rank <= 3 ? entry.rank : 'normal'}`">
              {{ entry.rank <= 3 ? getMedalEmoji(entry.rank) : entry.rank }}
            </span>
            <span class="rank-avatar">{{ entry.avatar }}</span>
            <span class="rank-name">{{ entry.name }}</span>
            <span class="rank-score">{{ entry.score.toLocaleString() }}</span>
          </div>
        </div>

        <div class="ranking-rewards-info">
          <h3 class="info-title">🏆 排名奖励</h3>
          <div class="reward-tiers">
            <div
              v-for="(reward, idx) in season.rankingRewards"
              :key="idx"
              class="reward-tier-row"
            >
              <span class="tier-rank">{{ getRankLabel(reward) }}</span>
              <span class="tier-coins">💰 {{ reward.rewards.coins }}</span>
              <span class="tier-title" v-if="reward.rewards.title">{{ reward.rewards.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'specimens'" class="specimens-section">
        <div class="specimens-intro">
          <span class="intro-icon">🔮</span>
          <p class="intro-text">本赛季限定标本，仅可通过高级通行证获取，赛季结束后将无法获得！</p>
        </div>

        <div class="specimens-grid">
          <div
            v-for="specimen in season.limitedSpecimens"
            :key="specimen.id"
            class="specimen-card"
            :class="{ collected: seasonStore.collectedSpecimens.includes(specimen.id), [`rarity-${specimen.rarity}`]: true }"
          >
            <div class="specimen-glow"></div>
            <div class="season-exclusive-badge">赛季限定</div>
            <span class="specimen-emoji">{{ specimen.emoji }}</span>
            <h3 class="specimen-name">{{ specimen.name }}</h3>
            <span class="specimen-en">{{ specimen.nameEn }}</span>
            <div class="specimen-rarity-badge" :class="`rarity-${specimen.rarity}`">
              {{ getRarityName(specimen.rarity) }}
            </div>
            <p class="specimen-desc">{{ specimen.description.slice(0, 60) }}...</p>
            <div class="specimen-unlock" v-if="!seasonStore.collectedSpecimens.includes(specimen.id)">
              <span class="unlock-icon">🔒</span>
              <span class="unlock-text">通行证 Lv.{{ specimen.unlockTier }} 解锁</span>
            </div>
            <div class="specimen-unlock collected-unlock" v-else>
              <span class="unlock-icon">✓</span>
              <span class="unlock-text">已获得</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SeasonPassModal
      :show="showPassModal"
      :season="season"
      :pass-level="seasonStore.passLevel"
      :season-exp="seasonStore.seasonExp"
      :next-exp="seasonStore.nextTierExp"
      :is-premium="seasonStore.isPremiumPass"
      :free-claimed="seasonStore.freeClaimedTiers"
      :premium-claimed="seasonStore.premiumClaimedTiers"
      :total-claimable="seasonStore.totalClaimableCount"
      :free-claimable="seasonStore.freeClaimableCount"
      :premium-claimable="seasonStore.premiumClaimableCount"
      :tiers="seasonStore.passTiers"
      @close="showPassModal = false"
      @claimFree="handleClaimFree"
      @claimPremium="handleClaimPremium"
      @claimAllFree="handleClaimAllFree"
      @claimAllPremium="handleClaimAllPremium"
      @activatePremium="handleActivatePremium"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeasonStore } from '@/stores/season'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import { SEASON_STATUS } from '@/data/season'
import SeasonPassModal from '@/components/SeasonPassModal.vue'

const seasonStore = useSeasonStore()
const audioStore = useAudioStore()

const activeTab = ref('pass')
const showPassModal = ref(false)

const season = computed(() => seasonStore.currentSeason)
const timeRemaining = computed(() => seasonStore.seasonTimeRemaining)

const tabs = computed(() => [
  {
    id: 'pass',
    icon: '📋',
    label: '通行证',
    badge: seasonStore.totalClaimableCount
  },
  {
    id: 'ranking',
    icon: '🏆',
    label: '积分排名',
    badge: 0
  },
  {
    id: 'specimens',
    icon: '🔮',
    label: '限定标本',
    badge: 0
  }
])

const expPercent = computed(() => {
  if (seasonStore.nextTierExp <= 0) return 100
  return Math.min(100, Math.round((seasonStore.seasonExp / seasonStore.nextTierExp) * 100))
})

const scrollOffset = computed(() => Math.max(0, seasonStore.passLevel - 3))

const visiblePassTiers = computed(() => {
  const start = scrollOffset.value
  const end = Math.min(seasonStore.passTiers.length, seasonStore.passLevel + 6)
  return seasonStore.passTiers.slice(start, end)
})

const getShapeStyle = (index) => {
  const angle = (index / 6) * 360
  const delay = index * 0.3
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const getItemEmoji = (type) => {
  const map = {
    stamina: '⚡',
    gacha_ticket: '🎫',
    season_specimen: '🔮'
  }
  return map[type] || '🎁'
}

const getItemName = (item) => {
  if (item.type === 'season_specimen' && season.value) {
    const specimen = season.value.limitedSpecimens?.[item.value]
    return specimen?.name || '限定标本'
  }
  return item.value
}

const getRarityName = (rarity) => RARITY_CONFIG[rarity]?.name || ''

const getRankMedal = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '🏅'
}

const getMedalEmoji = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank
}

const getRankRewardPreview = () => {
  if (!season.value) return '-'
  const reward = season.value.rankingRewards.find(
    r => seasonStore.playerRank >= r.rankMin && seasonStore.playerRank <= r.rankMax
  )
  if (!reward) return '暂无'
  return `💰${reward.rewards.coins}` + (reward.rewards.title ? ` ${reward.rewards.title}` : '')
}

const getRankLabel = (reward) => {
  if (reward.rankMin === reward.rankMax) return `第${reward.rankMin}名`
  return `第${reward.rankMin}-${reward.rankMax}名`
}

const handleClaimFree = (tierIndex) => {
  audioStore.playReward()
  seasonStore.claimFreeReward(tierIndex)
}

const handleClaimPremium = (tierIndex) => {
  audioStore.playReward()
  seasonStore.claimPremiumReward(tierIndex)
}

const handleClaimAllFree = () => {
  audioStore.playReward()
  seasonStore.claimAllFree()
}

const handleClaimAllPremium = () => {
  audioStore.playReward()
  seasonStore.claimAllPremium()
}

const handleActivatePremium = () => {
  audioStore.playClick()
  seasonStore.activatePremiumPass()
}
</script>

<style scoped>
.reward-toasts {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.reward-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-emoji {
  font-size: 20px;
}

.toast-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.toast-value {
  font-size: 15px;
  font-weight: 800;
  color: #fbbf24;
}

.reward-toast.type-season_specimen {
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2));
}

.reward-toast.type-season_specimen .toast-value {
  color: #c084fc;
}

.reward-toast.type-gacha_ticket {
  border-color: rgba(239, 68, 68, 0.3);
}

.reward-toast.type-gacha_ticket .toast-value {
  color: #f87171;
}

.reward-toast.type-stamina {
  border-color: rgba(251, 146, 60, 0.3);
}

.reward-toast.type-stamina .toast-value {
  color: #fb923c;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.season-view {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 90px;
}

.season-hero {
  position: relative;
  padding: 32px 20px 28px;
  overflow: hidden;
}

.hero-bg-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.hero-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: floatAround 10s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes floatAround {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg) translateX(120px); }
  50% { transform: translate(-50%, -50%) rotate(180deg) translateX(150px); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px 0;
  background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 20px 0;
}

.hero-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 14px;
}

.meta-icon {
  font-size: 14px;
}

.meta-value {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.claimable-value {
  color: #fbbf24;
  animation: claimPulse 2s ease-in-out infinite;
}

@keyframes claimPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.no-season {
  text-align: center;
  padding: 80px 20px;
}

.no-season-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-season-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.no-season-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.tabs-bar {
  display: flex;
  gap: 4px;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 4px;
  margin: -16px 16px 0;
  position: relative;
  z-index: 2;
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
  background: linear-gradient(135deg, var(--primary), #a855f7);
  color: #fff;
  box-shadow: 0 2px 10px rgba(233, 69, 96, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
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
  padding: 20px 16px;
}

.pass-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pass-info-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pass-level-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.level-circle {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.level-num {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
}

.level-info {
  display: flex;
  flex-direction: column;
}

.level-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.level-progress {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.exp-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exp-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #a855f7, #3b82f6);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.exp-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.pass-type-toggle {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 88, 12, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  font-size: 28px;
}

.toggle-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #fbbf24;
}

.toggle-desc {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
}

.activate-btn {
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.activate-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.premium-active-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 88, 12, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 14px;
}

.premium-icon {
  font-size: 24px;
}

.premium-text {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.pass-tiers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pass-tier-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.pass-tier-card.current {
  border-color: rgba(233, 69, 96, 0.4);
  background: rgba(233, 69, 96, 0.04);
}

.pass-tier-card.locked {
  opacity: 0.4;
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tier-level-badge {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.tier-level-badge.active {
  background: linear-gradient(135deg, var(--primary), #a855f7);
  color: #fff;
}

.tier-exp {
  font-size: 11px;
  color: var(--text-secondary);
}

.tier-rewards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.reward-row.locked {
  opacity: 0.35;
}

.row-label {
  font-size: 10px;
  font-weight: 700;
  min-width: 28px;
  flex-shrink: 0;
}

.free-label {
  color: var(--text-secondary);
}

.premium-label {
  color: #fbbf24;
}

.row-items {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.coin-reward {
  font-size: 12px;
  font-weight: 600;
  color: #fbbf24;
}

.item-reward {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.item-reward.specimen {
  background: rgba(168, 85, 247, 0.12);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.mini-claim {
  padding: 4px 12px;
  border-radius: 8px;
  border: none;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.free-claim {
  background: linear-gradient(135deg, #22c55e, #4ade80);
  color: #fff;
}

.premium-claim {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
}

.mini-claim:hover {
  transform: scale(1.05);
}

.done-check {
  color: #22c55e;
  font-weight: 700;
  flex-shrink: 0;
}

.lock-mark {
  flex-shrink: 0;
  font-size: 14px;
}

.bulk-claim {
  display: flex;
  gap: 8px;
}

.bulk-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.free-bulk {
  background: linear-gradient(135deg, #22c55e, #4ade80);
  color: #fff;
}

.premium-bulk {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
}

.bulk-btn:hover {
  transform: translateY(-2px);
}

.ranking-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.my-rank-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.08);
}

.rank-medal {
  font-size: 40px;
}

.rank-info {
  flex: 1;
}

.rank-position {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #fbbf24;
}

.rank-points {
  font-size: 13px;
  color: var(--text-secondary);
}

.rank-rewards-preview {
  text-align: right;
}

.preview-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
}

.preview-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.ranking-table {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
}

.rank-row:last-child {
  border-bottom: none;
}

.rank-row.player {
  background: rgba(233, 69, 96, 0.08);
  border-bottom-color: rgba(233, 69, 96, 0.1);
}

.rank-row.top3 {
  background: rgba(245, 158, 11, 0.05);
}

.rank-num {
  width: 32px;
  text-align: center;
  font-weight: 800;
  font-size: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rank-num.rank-1 { color: #ffd700; }
.rank-num.rank-2 { color: #c0c0c0; }
.rank-num.rank-3 { color: #cd7f32; }

.rank-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.rank-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.rank-row.player .rank-name {
  color: var(--primary);
}

.rank-score {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
  flex-shrink: 0;
}

.ranking-rewards-info {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.info-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.reward-tiers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-tier-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.tier-rank {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 80px;
}

.tier-coins {
  font-size: 13px;
  color: #fbbf24;
  font-weight: 600;
}

.tier-title {
  font-size: 13px;
  color: #60a5fa;
  font-weight: 600;
  margin-left: auto;
}

.specimens-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.specimens-intro {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.05));
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 14px;
}

.intro-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.intro-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.specimens-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.specimen-card {
  position: relative;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.specimen-card.collected {
  border-color: rgba(168, 85, 247, 0.35);
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.1);
}

.specimen-card.rarity-epic {
  border-color: rgba(168, 85, 247, 0.25);
}

.specimen-card.rarity-legendary {
  border-color: rgba(245, 158, 11, 0.35);
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.1);
}

.specimen-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: inherit;
  filter: blur(40px);
  opacity: 0.2;
  pointer-events: none;
}

.rarity-epic .specimen-glow { background: #a855f7; }
.rarity-legendary .specimen-glow { background: #f59e0b; }

.season-exclusive-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.specimen-emoji {
  font-size: 72px;
  display: block;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.specimen-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  position: relative;
  z-index: 1;
}

.rarity-legendary .specimen-name {
  background: linear-gradient(135deg, #ffd700, #ffec8b, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.specimen-en {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.specimen-rarity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  background: rgba(0, 0, 0, 0.3);
}

.specimen-rarity-badge.rarity-epic { color: #a855f7; }
.specimen-rarity-badge.rarity-legendary { color: #f59e0b; }

.specimen-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 16px 0;
  position: relative;
  z-index: 1;
}

.specimen-unlock {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.specimen-unlock.collected-unlock {
  background: rgba(34, 197, 94, 0.1);
}

.unlock-icon {
  font-size: 16px;
}

.unlock-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.collected-unlock .unlock-icon {
  color: #22c55e;
}

.collected-unlock .unlock-text {
  color: #22c55e;
}

@media (min-width: 600px) {
  .specimens-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
