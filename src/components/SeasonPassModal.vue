<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content">
          <div class="modal-header" :style="{ background: season?.themeGradient }">
            <div class="header-info">
              <span class="header-emoji">{{ season?.emoji }}</span>
              <div>
                <h2 class="header-title">{{ season?.name }}</h2>
                <p class="header-subtitle">赛季通行证 · Lv.{{ passLevel }}</p>
              </div>
            </div>
            <button class="close-btn" @click="$emit('close')">✕</button>
          </div>

          <div class="pass-progress">
            <div class="progress-info">
              <span class="progress-level">Lv.{{ passLevel }}/{{ totalTiers }}</span>
              <span class="progress-exp">{{ seasonExp }}/{{ nextExp }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: expPercent + '%' }"></div>
            </div>
          </div>

          <div class="premium-banner" v-if="!isPremium">
            <div class="banner-info">
              <span class="banner-icon">👑</span>
              <div>
                <span class="banner-title">解锁高级通行证</span>
                <span class="banner-desc">获取限定标本与额外奖励</span>
              </div>
            </div>
            <button class="premium-btn" @click="$emit('activatePremium')">
              🔓 激活
            </button>
          </div>

          <div class="tier-list">
            <div
              v-for="(tier, index) in visibleTiers"
              :key="index"
              class="tier-row"
              :class="{
                locked: index >= passLevel,
                current: index === passLevel,
                free_claimed: freeClaimed.includes(index),
                premium_claimed: premiumClaimed.includes(index)
              }"
            >
              <div class="tier-level" :class="{ active: index < passLevel }">
                <span class="level-num">{{ tier.level }}</span>
              </div>

              <div class="tier-rewards">
                <div class="reward-track free-track">
                  <div class="track-label">免费</div>
                  <div class="reward-content">
                    <span class="reward-coins">💰 {{ tier.freeReward?.coins || 0 }}</span>
                    <span
                      v-for="item in (tier.freeReward?.items || [])"
                      :key="item.type"
                      class="reward-item-badge"
                    >
                      {{ getItemEmoji(item.type) }} {{ item.value }}
                    </span>
                  </div>
                  <button
                    v-if="index < passLevel && !freeClaimed.includes(index)"
                    class="claim-btn free-claim"
                    @click="$emit('claimFree', index)"
                  >领取</button>
                  <span v-else-if="freeClaimed.includes(index)" class="claimed-check">✓</span>
                </div>

                <div class="reward-track premium-track" :class="{ locked: !isPremium }">
                  <div class="track-label premium-label">👑 高级</div>
                  <div class="reward-content">
                    <span class="reward-coins">💰 {{ tier.premiumReward?.coins || 0 }}</span>
                    <span
                      v-for="item in (tier.premiumReward?.items || [])"
                      :key="item.type"
                      class="reward-item-badge specimen-badge"
                    >
                      {{ getItemEmoji(item.type) }} {{ getItemName(item) }}
                    </span>
                  </div>
                  <button
                    v-if="isPremium && index < passLevel && !premiumClaimed.includes(index)"
                    class="claim-btn premium-claim"
                    @click="$emit('claimPremium', index)"
                  >领取</button>
                  <span v-else-if="premiumClaimed.includes(index)" class="claimed-check">✓</span>
                  <span v-else-if="!isPremium" class="lock-icon">🔒</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bulk-actions" v-if="totalClaimable > 0">
            <button class="bulk-btn free-bulk" @click="$emit('claimAllFree')" v-if="freeClaimable > 0">
              📦 一键领取免费 ({{ freeClaimable }})
            </button>
            <button class="bulk-btn premium-bulk" @click="$emit('claimAllPremium')" v-if="isPremium && premiumClaimable > 0">
              👑 一键领取高级 ({{ premiumClaimable }})
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  season: Object,
  passLevel: { type: Number, default: 0 },
  seasonExp: { type: Number, default: 0 },
  nextExp: { type: Number, default: 100 },
  isPremium: { type: Boolean, default: false },
  freeClaimed: { type: Array, default: () => [] },
  premiumClaimed: { type: Array, default: () => [] },
  totalClaimable: { type: Number, default: 0 },
  freeClaimable: { type: Number, default: 0 },
  premiumClaimable: { type: Number, default: 0 },
  tiers: { type: Array, default: () => [] }
})

defineEmits(['close', 'claimFree', 'claimPremium', 'claimAllFree', 'claimAllPremium', 'activatePremium'])

const totalTiers = computed(() => props.tiers.length)

const expPercent = computed(() => {
  if (props.nextExp <= 0) return 100
  return Math.min(100, Math.round((props.seasonExp / props.nextExp) * 100))
})

const visibleTiers = computed(() => {
  const start = Math.max(0, props.passLevel - 3)
  const end = Math.min(props.tiers.length, props.passLevel + 6)
  return props.tiers.slice(start, end)
})

const getItemEmoji = (type) => {
  const map = {
    stamina: '⚡',
    gacha_ticket: '🎫',
    season_specimen: '🔮'
  }
  return map[type] || '🎁'
}

const getItemName = (item) => {
  if (item.type === 'season_specimen' && props.season) {
    const specimen = props.season.limitedSpecimens?.[item.value]
    return specimen?.name || '限定标本'
  }
  return item.value
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
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 20px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-emoji {
  font-size: 40px;
}

.header-title {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.header-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 2px 0 0 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pass-progress {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-level {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-exp {
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #a855f7, #3b82f6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.premium-banner {
  margin: 12px 20px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.15));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-icon {
  font-size: 28px;
}

.banner-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.banner-desc {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
}

.premium-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.premium-btn:hover {
  transform: scale(1.05);
}

.tier-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.tier-row {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
}

.tier-row.current {
  border-color: rgba(233, 69, 96, 0.4);
  background: rgba(233, 69, 96, 0.05);
}

.tier-row.locked {
  opacity: 0.45;
}

.tier-level {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 14px;
  color: var(--text-secondary);
}

.tier-level.active {
  background: linear-gradient(135deg, var(--primary), #a855f7);
  color: #fff;
}

.tier-rewards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-track {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.reward-track.locked {
  opacity: 0.4;
}

.track-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 28px;
  flex-shrink: 0;
}

.premium-label {
  color: #fbbf24;
}

.reward-content {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.reward-coins {
  font-size: 12px;
  font-weight: 600;
  color: #fbbf24;
}

.reward-item-badge {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}

.specimen-badge {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.claim-btn {
  padding: 4px 12px;
  border-radius: 8px;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
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

.claim-btn:hover {
  transform: scale(1.05);
}

.claimed-check {
  color: #22c55e;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.lock-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.bulk-actions {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 8px;
}

.bulk-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
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

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
