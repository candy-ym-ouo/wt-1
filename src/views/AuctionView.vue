<template>
  <div class="auction-view">
    <div class="auction-header">
      <div class="header-left">
        <div class="auction-title-section">
          <h1 class="page-title"><span class="title-icon">🎪</span>矿物拍卖会</h1>
          <p class="page-subtitle">与收藏名家竞价，竞得珍稀矿物</p>
        </div>
      </div>
      <div class="header-right">
        <div class="coins-display" :class="{ low: gameStore.coins < 500 }">
          <span class="coins-icon">💰</span>
          <span class="coins-value">{{ gameStore.coins.toLocaleString() }}</span>
        </div>
        <button class="btn btn-ghost btn-small" @click="goToCollection"><span>📖</span> 图鉴</button>
      </div>
    </div>

    <div class="auction-tabs">
      <button v-for="tab in tabs" :key="tab.value" :class="['tab-btn', { active: activeTab === tab.value }]" @click="activeTab = tab.value">
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'auction'" class="auction-main">
      <div v-if="auctionStore.phase === 'idle' && auctionStore.rounds.length === 0" class="idle-screen">
        <div class="idle-content">
          <div class="idle-icon">🎪</div>
          <h2 class="idle-title">欢迎来到矿物拍卖会</h2>
          <p class="idle-desc">本场拍卖会将呈现多件珍稀矿物拍品<br>与数位收藏名家同台竞价<br>把握机会，将心仪矿物收入囊中！</p>
          <div class="auction-stats-preview">
            <div class="stat-chip"><span class="stat-icon">🎯</span><span class="stat-text">累计参与 {{ auctionStore.totalAuctions }} 场</span></div>
            <div class="stat-chip"><span class="stat-icon">🏆</span><span class="stat-text">成功竞得 {{ auctionStore.totalWins }} 件</span></div>
            <div class="stat-chip"><span class="stat-icon">💸</span><span class="stat-text">累计花费 {{ auctionStore.totalSpent.toLocaleString() }} 金</span></div>
            <div class="stat-chip" v-if="auctionStore.bestRating !== 'D'"><span class="stat-icon">{{ SESSION_RATING_CONFIG[auctionStore.bestRating]?.icon || '📝' }}</span><span class="stat-text">历史最佳 {{ auctionStore.bestRating }} 级</span></div>
            <div class="stat-chip" v-if="auctionStore.totalCombos > 0"><span class="stat-icon">🔥</span><span class="stat-text">累计连击 {{ auctionStore.totalCombos }} 次</span></div>
          </div>
          <div class="start-options">
            <button class="btn btn-primary btn-large" @click="startAuction(6)"><span class="btn-icon">🎬</span>开始拍卖会 (6轮)</button>
            <button class="btn btn-secondary btn-large" @click="startAuction(8)"><span class="btn-icon">⭐</span>加长场 (8轮)</button>
          </div>
        </div>
      </div>

      <div v-else-if="auctionStore.phase === 'finished'" class="finished-screen">
        <div class="finished-content">
          <div class="finished-icon">🎊</div>
          <h2 class="finished-title">拍卖会圆满结束</h2>

          <div v-if="auctionStore.sessionRating" :class="['rating-section', { revealed: ratingRevealed }]">
            <div class="rating-label">本场评级</div>
            <div :class="['rating-badge', `rating-${auctionStore.sessionRating}`]" :style="{ '--rating-color': auctionStore.sessionRatingConfig.color }">
              <span class="rating-icon">{{ auctionStore.sessionRatingConfig.icon }}</span>
              <span class="rating-letter">{{ auctionStore.sessionRating }}</span>
            </div>
            <div class="rating-title">{{ auctionStore.sessionRatingConfig.title }}</div>
            <div class="rating-score">综合评分 {{ auctionStore.sessionScore }}</div>
            <div class="rating-rewards">
              <span class="reward-item">💰 +{{ auctionStore.sessionRatingConfig.coinBonus }}</span>
              <span class="reward-item">⭐ +{{ auctionStore.sessionRatingConfig.expBonus }} EXP</span>
            </div>
          </div>

          <div class="session-summary">
            <div class="summary-item"><span class="summary-icon">📦</span><span class="summary-label">总轮次</span><span class="summary-value">{{ auctionStore.progress.total }}</span></div>
            <div class="summary-item"><span class="summary-icon">🏆</span><span class="summary-label">本场收获</span><span class="summary-value">{{ sessionWins }} 件</span></div>
            <div class="summary-item"><span class="summary-icon">💸</span><span class="summary-label">本场花费</span><span class="summary-value">{{ sessionSpent.toLocaleString() }} 金</span></div>
          </div>
          <div class="session-bonus-stats">
            <div class="bonus-stat-item"><span class="bonus-icon">🔥</span><span class="bonus-label">最高连击</span><span class="bonus-value">{{ auctionStore.maxCombo }} 连</span></div>
            <div class="bonus-stat-item"><span class="bonus-icon">🎯</span><span class="bonus-label">限时加成</span><span class="bonus-value">{{ auctionStore.sessionTimeBonuses }} 次</span></div>
          </div>
          <div class="session-results" v-if="sessionResults.length > 0">
            <h3 class="results-title">本场成交记录</h3>
            <div class="results-list">
              <div v-for="result in sessionResults" :key="result.id" :class="['result-card', `rarity-${result.mineral.rarity}`]">
                <span class="mineral-emoji">{{ result.mineral.emoji }}</span>
                <div class="result-info">
                  <span class="mineral-name">{{ result.mineral.name }}</span>
                  <span class="result-winner">{{ result.isPlayerWin ? '🎉 你竞得' : result.passed ? '😢 流拍' : `被 ${result.winnerName} 拍走` }}</span>
                </div>
                <div class="result-badges">
                  <span v-if="result.comboCount > 1" class="result-combo-badge">🔥x{{ result.comboCount }}</span>
                  <span v-if="result.timeBonus === 'lastSecond'" class="result-time-badge last-second">⚡</span>
                  <span v-else-if="result.timeBonus === 'sniper'" class="result-time-badge sniper">🎯</span>
                  <span v-if="!result.passed" class="result-price">{{ result.finalPrice.toLocaleString() }} 💰</span>
                  <span v-else class="result-price passed">流拍</span>
                </div>
              </div>
            </div>
          </div>
          <div class="action-buttons">
            <button class="btn btn-primary btn-large" @click="startAuction(6)"><span class="btn-icon">🔄</span>再来一场</button>
            <button class="btn btn-secondary btn-large" @click="activeTab = 'archive'"><span class="btn-icon">📜</span>查看归档</button>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="progress-section">
          <div class="round-info">
            <div class="round-badge"><span class="round-label">第</span><span class="round-number">{{ auctionStore.progress.current }}</span><span class="round-label">轮</span></div>
            <span class="round-divider">/</span>
            <span class="total-rounds">共 {{ auctionStore.progress.total }} 轮</span>
          </div>
          <div class="progress-bar-wrapper"><div class="progress-bar" :style="{ width: `${auctionStore.progress.percentage}%` }"></div></div>
          <div v-if="auctionStore.comboCount > 1" :class="['combo-badge', { flash: comboFlash }]" :style="{ borderColor: `hsl(${30 + auctionStore.comboCount * 10}, 100%, 55%)` }">
            <span class="combo-icon">🔥</span>
            <span class="combo-text">{{ auctionStore.comboLabel }}</span>
            <span class="combo-mult">x{{ auctionStore.comboMultiplier.toFixed(2) }}</span>
          </div>
          <button v-if="auctionStore.phase === 'idle'" class="btn btn-small btn-primary" @click="auctionStore.startNextRound()">▶️ 开始</button>
        </div>

        <div class="auction-stage">
          <div class="mineral-display card" :class="[`rarity-${auctionStore.currentMineral?.rarity}`, { closing: auctionStore.isClosingWarning }]">
            <div class="mineral-stage-header">
              <div class="auctioneer">
                <span class="auctioneer-avatar">🎩</span>
                <div class="auctioneer-info">
                  <span class="auctioneer-name">拍卖师</span>
                  <span class="auctioneer-message" :class="{ typing: isTyping }">{{ auctionStore.auctioneerMessage }}<span v-if="isTyping" class="typing-dots">...</span></span>
                </div>
              </div>
            </div>
            <div class="mineral-showcase">
              <div class="mineral-emoji-large" :class="{ glow: isLegendary }">{{ auctionStore.currentMineral?.emoji || '💎' }}</div>
              <div class="mineral-details">
                <h2 class="mineral-name-large">{{ auctionStore.currentMineral?.name || '---' }}</h2>
                <div class="mineral-rarity-row">
                  <span class="rarity-tag" :class="`rarity-${auctionStore.currentMineral?.rarity}`">{{ getRarityStars(auctionStore.currentMineral?.rarity) }} {{ RARITY_CONFIG[auctionStore.currentMineral?.rarity]?.name || '---' }}</span>
                  <span class="mineral-formula" v-if="auctionStore.currentMineral">{{ auctionStore.currentMineral.formula }}</span>
                </div>
                <p class="mineral-desc" v-if="auctionStore.currentMineral">{{ auctionStore.currentMineral.description.slice(0, 60) }}...</p>
              </div>
            </div>
            <div class="price-display">
              <div class="current-price-box" :class="{ leading: auctionStore.playerLeading }">
                <div class="price-label-row">
                  <span class="price-label">{{ auctionStore.currentBidder ? '当前出价' : '起拍价' }}</span>
                  <span v-if="auctionStore.playerLeading" class="leading-tag">👤 你领先</span>
                  <span v-else-if="auctionStore.currentBidder" class="opponent-tag">{{ auctionStore.currentBidder.avatar }} {{ auctionStore.currentBidder.name }}</span>
                </div>
                <div class="price-row"><span class="price-currency">💰</span><span class="price-amount">{{ auctionStore.currentBid.toLocaleString() }}</span></div>
                <div class="price-note" v-if="auctionStore.currentBid > 0">下次加价至少 +{{ auctionStore.minBidIncrement.toLocaleString() }} 金币</div>
              </div>
              <div class="countdown-box" :class="{ urgent: auctionStore.isClosingWarning }">
                <div class="countdown-label">⏱️ 剩余时间</div>
                <div class="countdown-value">{{ auctionStore.formatTimeRemaining(auctionStore.timeRemaining) }}</div>
                <div class="countdown-bar-wrapper"><div class="countdown-bar" :style="{ width: countdownPercentage + '%' }"></div></div>
                <div v-if="auctionStore.isClosingWarning" class="time-bonus-hint">
                  <span v-if="auctionStore.timeRemaining <= TIME_BONUS_CONFIG.LAST_SECOND_WINDOW_MS">⚡ 绝杀出价双倍加成！</span>
                  <span v-else>🎯 限时狙击加成中！</span>
                </div>
              </div>
            </div>
          </div>

          <div class="side-panel">
            <div class="bidders-section card">
              <h3 class="section-title">🎯 竞拍参与者</h3>
              <div class="bidders-list">
                <div class="bidder-item player">
                  <span class="bidder-avatar">👤</span>
                  <div class="bidder-info"><span class="bidder-name">你</span><span class="bidder-coins">💰 {{ gameStore.coins.toLocaleString() }}</span></div>
                  <span v-if="auctionStore.playerLeading" class="bidder-status leading">领先</span>
                </div>
                <div v-for="npc in auctionStore.activeNPCs" :key="npc.id" class="bidder-item">
                  <span class="bidder-avatar">{{ npc.avatar }}</span>
                  <div class="bidder-info"><span class="bidder-name">{{ npc.name }}</span><span class="bidder-type">{{ getBidderType(npc) }}</span></div>
                  <span v-if="auctionStore.currentBidder?.id === npc.id" class="bidder-status leading">领先</span>
                </div>
              </div>
            </div>
            <div class="tips-section card">
              <h3 class="section-title">📢 竞价动态</h3>
              <div class="tips-list">
                <div v-for="tip in auctionStore.competitionTips.slice(0, 6)" :key="tip.id" :class="['tip-item', `tip-${tip.type}`]">{{ tip.text }}</div>
                <div v-if="auctionStore.competitionTips.length === 0" class="empty-tips">等待竞价开始...</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bidding-section card">
          <div class="bidding-header">
            <h3 class="section-title">💰 我的出价</h3>
            <div class="bidding-status">
              <span v-if="auctionStore.phase === 'preview'" class="status-info">预览阶段，即将开始竞价</span>
              <span v-else-if="auctionStore.phase === 'result'" class="status-success">本轮结束</span>
              <span v-else-if="auctionStore.playerLeading" class="status-success">✓ 暂时领先</span>
              <span v-else-if="!auctionStore.canPlayerBid" class="status-warning">金币不足</span>
            </div>
          </div>
          <div class="quick-bid-buttons">
            <button v-for="option in quickBidOptions" :key="option.label" class="quick-bid-btn" :style="{ borderColor: option.color + '66', color: option.color }" :disabled="!auctionStore.canPlayerBid" @click="handleQuickBid(option.value)">
              <span class="quick-bid-label">{{ option.label }}</span>
              <span class="quick-bid-amount">{{ calculateQuickBid(option.value).toLocaleString() }}</span>
            </button>
          </div>
          <div class="custom-bid-section">
            <div class="custom-bid-input">
              <span class="input-prefix">💰</span>
              <input type="number" v-model.number="customBidAmount" class="bid-input" :min="auctionStore.nextMinBid" :placeholder="`至少 ${auctionStore.nextMinBid.toLocaleString()}`" :disabled="!auctionStore.canPlayerBid" @keyup.enter="handleCustomBid" />
            </div>
            <button class="btn btn-primary btn-large bid-submit-btn" :disabled="!canSubmitBid" @click="handleCustomBid"><span class="btn-icon">🔨</span>确认出价</button>
          </div>
          <div class="bid-history-preview" v-if="auctionStore.sortedBids.length > 0">
            <div class="history-header"><span>📜 竞价记录 ({{ auctionStore.sortedBids.length }})</span></div>
            <div class="history-list">
              <div v-for="(bid, idx) in auctionStore.sortedBids.slice(0, 5)" :key="bid.timestamp + idx" :class="['history-item', { player: bid.isPlayer, top: idx === 0 }]">
                <span class="history-rank">{{ idx + 1 }}</span>
                <span class="history-avatar">{{ bid.bidderAvatar }}</span>
                <span class="history-name">{{ bid.bidderName }}</span>
                <span class="history-amount">{{ bid.amount.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="activeTab === 'archive'" class="archive-section">
      <div class="archive-stats">
        <div class="archive-stat-card"><div class="archive-stat-icon">🎪</div><div class="archive-stat-info"><span class="archive-stat-label">参与场次</span><span class="archive-stat-value">{{ auctionStore.totalAuctions }}</span></div></div>
        <div class="archive-stat-card success"><div class="archive-stat-icon">🏆</div><div class="archive-stat-info"><span class="archive-stat-label">成功竞得</span><span class="archive-stat-value">{{ auctionStore.totalWins }}</span></div></div>
        <div class="archive-stat-card warning"><div class="archive-stat-icon">💸</div><div class="archive-stat-info"><span class="archive-stat-label">累计花费</span><span class="archive-stat-value">{{ auctionStore.totalSpent.toLocaleString() }}</span></div></div>
        <div v-if="auctionStore.bestRating !== 'D'" class="archive-stat-card" :style="{ background: `linear-gradient(135deg, ${SESSION_RATING_CONFIG[auctionStore.bestRating]?.color}15, ${SESSION_RATING_CONFIG[auctionStore.bestRating]?.color}08)`, borderColor: `${SESSION_RATING_CONFIG[auctionStore.bestRating]?.color}40` }">
          <div class="archive-stat-icon">{{ SESSION_RATING_CONFIG[auctionStore.bestRating]?.icon }}</div><div class="archive-stat-info"><span class="archive-stat-label">历史最佳评级</span><span class="archive-stat-value" :style="{ color: SESSION_RATING_CONFIG[auctionStore.bestRating]?.color }">{{ auctionStore.bestRating }}</span></div></div>
      </div>
      <div class="archive-tabs">
        <button v-for="tab in archiveTabs" :key="tab.value" :class="['archive-tab', { active: archiveTab === tab.value }]" @click="archiveTab = tab.value">{{ tab.label }}<span class="tab-count" v-if="tab.count">({{ tab.count }})</span></button>
      </div>
      <div v-if="filteredArchive.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无相关记录</p>
      </div>
      <div v-else class="archive-list">
        <div v-for="record in filteredArchive" :key="record.id" class="archive-item card" :class="[`rarity-${record.mineral?.rarity}`, { win: record.isPlayerWin, lose: !record.isPlayerWin && !record.passed, passed: record.passed }]">
          <div class="archive-left">
            <div class="archive-mineral">
              <span class="archive-emoji">{{ record.mineral?.emoji }}</span>
              <div class="archive-mineral-info"><span class="archive-name">{{ record.mineral?.name }}</span><span class="archive-meta">第 {{ record.roundNumber }} 轮 · {{ formatArchiveTime(record.timestamp) }}</span></div>
            </div>
          </div>
          <div class="archive-right">
            <div class="archive-price-info">
              <span v-if="!record.passed" class="archive-price">💰 {{ record.finalPrice.toLocaleString() }}</span>
              <span v-else class="archive-price passed">流拍</span>
              <span class="archive-bids-count">🔨 {{ record.totalBids }} 次出价</span>
            </div>
            <div class="archive-result">
              <span v-if="record.isPlayerWin" class="result-tag win">🎉 我竞得</span>
              <span v-else-if="record.passed" class="result-tag passed">😢 流拍</span>
              <span v-else class="result-tag lose">❌ {{ record.winnerAvatar }} {{ record.winnerName }}</span>
            </div>
          </div>
          <div v-if="record.bidHistory?.length > 0" class="bid-detail-toggle">
            <button class="toggle-btn" @click="toggleExpand(record.id)">{{ expandedRecords.includes(record.id) ? '收起竞价详情 ▲' : '展开竞价详情 ▼' }}</button>
          </div>
          <Transition name="expand">
            <div v-if="expandedRecords.includes(record.id) && record.bidHistory" class="bid-detail">
              <div v-for="(bid, idx) in [...record.bidHistory].sort((a, b) => b.amount - a.amount)" :key="bid.timestamp + idx" :class="['bid-row', { player: bid.isPlayer }]">
                <span class="bid-rank">#{{ idx + 1 }}</span>
                <span class="bid-avatar">{{ bid.bidderAvatar }}</span>
                <span class="bid-name">{{ bid.bidderName }}</span>
                <span class="bid-amount">{{ bid.amount.toLocaleString() }} 金币</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="auctionStore.showResultModal" class="result-modal-overlay" @click.self="closeResult">
          <div class="result-modal card" :class="[`rarity-${auctionStore.lastResult?.mineral?.rarity}`, { win: auctionStore.lastResult?.isPlayerWin, lose: !auctionStore.lastResult?.isPlayerWin && !auctionStore.lastResult?.passed, passed: auctionStore.lastResult?.passed }]">
            <div class="result-modal-header">
              <template v-if="auctionStore.lastResult?.isPlayerWin"><div class="result-icon win">🎉</div><h2 class="result-title win">恭喜竞得！</h2></template>
              <template v-else-if="auctionStore.lastResult?.passed"><div class="result-icon passed">😢</div><h2 class="result-title passed">遗憾流拍</h2></template>
              <template v-else><div class="result-icon lose">💔</div><h2 class="result-title lose">未能竞得</h2></template>
            </div>
            <div class="result-modal-body">
              <div class="result-mineral-display">
                <span class="result-mineral-emoji">{{ auctionStore.lastResult?.mineral?.emoji }}</span>
                <div class="result-mineral-info">
                  <h3 class="result-mineral-name">{{ auctionStore.lastResult?.mineral?.name }}</h3>
                  <span class="result-rarity-tag" :class="`rarity-${auctionStore.lastResult?.mineral?.rarity}`">{{ getRarityStars(auctionStore.lastResult?.mineral?.rarity) }} {{ RARITY_CONFIG[auctionStore.lastResult?.mineral?.rarity]?.name }}</span>
                </div>
              </div>
              <div v-if="!auctionStore.lastResult?.passed" class="result-price-row"><span class="result-price-label">成交价</span><span class="result-price-value">💰 {{ auctionStore.lastResult?.finalPrice?.toLocaleString() }}</span></div>
              <div class="result-winner-row" v-if="!auctionStore.lastResult?.passed"><span class="result-winner-label">得主</span><span class="result-winner-value">{{ auctionStore.lastResult?.isPlayerWin ? '你' : `${auctionStore.lastResult?.winnerAvatar} ${auctionStore.lastResult?.winnerName}` }}</span></div>
              <div class="result-bids-row"><span class="result-bids-label">竞价次数</span><span class="result-bids-value">{{ auctionStore.lastResult?.totalBids || 0 }} 次</span></div>
              <div v-if="auctionStore.lastResult?.comboCount > 1" class="result-combo-row">
                <span class="result-combo-label">连击加成</span>
                <span class="result-combo-value">🔥 x{{ auctionStore.lastResult.comboCount }} (x{{ (1 + (auctionStore.lastResult.comboCount - 1) * 0.25).toFixed(2) }} 加成)</span>
              </div>
              <div v-if="auctionStore.lastResult?.timeBonus" class="result-time-row">
                <span class="result-time-label">限时加成</span>
                <span class="result-time-value">{{ auctionStore.lastResult.timeBonus === 'lastSecond' ? '⚡ 绝杀出价' : '🎯 限时狙击' }}</span>
              </div>
              <div v-if="auctionStore.lastResult?.isPlayerWin" class="result-collection-note">✨ 已加入你的收藏，并获得探险经验！</div>
            </div>
            <div class="result-modal-footer">
              <button class="btn btn-primary btn-large" @click="handleNextRound">{{ isLastRound ? '查看总结' : '进入下一轮 ▶' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastMessage" class="auction-toast" :class="{ success: toastSuccess, error: !toastSuccess }">{{ toastMessage }}</div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuctionStore } from '@/stores/auction'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG, getRarityStars, RARITY } from '@/data/rarity'
import { BID_QUICK_OPTIONS, TIME_BONUS_CONFIG, SESSION_RATING_CONFIG } from '@/data/auction'

const router = useRouter()
const gameStore = useGameStore()
const auctionStore = useAuctionStore()
const audioStore = useAudioStore()

const activeTab = ref('auction')
const archiveTab = ref('all')
const customBidAmount = ref(0)
const toastMessage = ref('')
const toastSuccess = ref(true)
const expandedRecords = ref([])
const isTyping = ref(false)
const comboFlash = ref(false)
const ratingRevealed = ref(false)
let toastTimer = null
let typingTimer = null

const tabs = computed(() => [
  { value: 'auction', label: '拍卖会', icon: '🎪' },
  { value: 'archive', label: '成交归档', icon: '📜', badge: auctionStore.auctionHistory.length > 0 ? auctionStore.auctionHistory.length : null }
])

const archiveTabs = computed(() => [
  { value: 'all', label: '全部记录', count: auctionStore.auctionHistory.length },
  { value: 'wins', label: '我的收获', count: auctionStore.playerBidHistory.length },
  { value: 'passed', label: '流拍记录', count: auctionStore.auctionHistory.filter(h => h.passed).length }
])

const filteredArchive = computed(() => {
  if (archiveTab.value === 'wins') return auctionStore.playerBidHistory
  if (archiveTab.value === 'passed') return auctionStore.auctionHistory.filter(h => h.passed)
  return auctionStore.auctionHistory
})

const quickBidOptions = BID_QUICK_OPTIONS
const isLegendary = computed(() => auctionStore.currentMineral?.rarity === RARITY.LEGENDARY)

const countdownPercentage = computed(() => {
  if (!auctionStore.currentRound) return 100
  const total = auctionStore.currentRound.duration
  const remaining = auctionStore.timeRemaining
  return Math.max(0, Math.min(100, (remaining / total) * 100))
})

const canSubmitBid = computed(() => {
  if (!auctionStore.canPlayerBid) return false
  if (!customBidAmount.value) return false
  return customBidAmount.value >= auctionStore.nextMinBid
})

const isLastRound = computed(() => auctionStore.currentRoundIndex + 1 >= auctionStore.rounds.length)

const sessionResults = computed(() => {
  if (auctionStore.rounds.length === 0) return []
  return auctionStore.auctionHistory.slice(0, auctionStore.rounds.length)
})

const sessionWins = computed(() => sessionResults.value.filter(r => r.isPlayerWin).length)
const sessionSpent = computed(() => sessionResults.value.filter(r => r.isPlayerWin).reduce((sum, r) => sum + r.finalPrice, 0))

const showToast = (message, success = true) => {
  toastMessage.value = message
  toastSuccess.value = success
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 2500)
}

const calculateQuickBid = (percentage) => {
  const base = auctionStore.currentBid || 0
  const quick = Math.round(base * (1 + percentage))
  return Math.max(quick, auctionStore.nextMinBid)
}

const handleQuickBid = (percentage) => {
  audioStore.playClick?.()
  const wasCombo = auctionStore.comboCount
  const result = auctionStore.placeQuickPlayerBid(percentage)
  showToast(result.message, result.success)
  if (result.success) {
    if (auctionStore.lastBidTimeBonus) {
      audioStore.playSniperBid?.()
    } else {
      audioStore.playSuccess?.()
    }
    triggerTyping()
  }
  else { audioStore.playError?.() }
}

const handleCustomBid = () => {
  if (!canSubmitBid.value) return
  audioStore.playClick?.()
  const result = auctionStore.placePlayerBid(customBidAmount.value)
  showToast(result.message, result.success)
  if (result.success) {
    customBidAmount.value = 0
    if (auctionStore.lastBidTimeBonus) {
      audioStore.playSniperBid?.()
    } else {
      audioStore.playSuccess?.()
    }
    triggerTyping()
  }
  else { audioStore.playError?.() }
}

const triggerTyping = () => {
  isTyping.value = true
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => { isTyping.value = false }, 600)
}

const startAuction = (rounds) => {
  audioStore.playClick?.()
  const started = auctionStore.startNewAuctionSession(rounds)
  if (started) setTimeout(() => { auctionStore.startNextRound() }, 800)
}

const handleNextRound = () => {
  audioStore.playClick?.()
  auctionStore.skipToNextRound()
}

const closeResult = () => auctionStore.closeResultModal()

const goToCollection = () => {
  audioStore.playClick?.()
  router.push('/collection')
}

const getBidderType = (npc) => {
  const types = { low: '保守型', medium: '稳健型', high: '激进型' }
  return types[npc.wealth] || '神秘买家'
}

const formatArchiveTime = (timestamp) => {
  const date = new Date(timestamp)
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const toggleExpand = (recordId) => {
  const idx = expandedRecords.value.indexOf(recordId)
  if (idx > -1) expandedRecords.value.splice(idx, 1)
  else expandedRecords.value.push(recordId)
}

watch(() => auctionStore.currentBid, (newVal, oldVal) => {
  if (newVal > oldVal && oldVal > 0) customBidAmount.value = Math.round(newVal * 1.1)
})

watch(() => auctionStore.currentRound, (newRound) => {
  if (newRound) customBidAmount.value = Math.round(newRound.startPrice * 1.1)
})

watch(() => auctionStore.comboCount, (newVal, oldVal) => {
  if (newVal > oldVal && newVal > 1) {
    comboFlash.value = true
    audioStore.playComboHit?.(newVal)
    setTimeout(() => { comboFlash.value = false }, 600)
  }
})

watch(() => auctionStore.lastResult, (result) => {
  if (result) {
    if (result.isPlayerWin) {
      audioStore.playAuctionWin?.()
    } else if (!result.passed) {
      audioStore.playAuctionLose?.()
    }
  }
})

watch(() => auctionStore.sessionRating, (rating) => {
  if (rating && auctionStore.phase === 'finished') {
    ratingRevealed.value = false
    setTimeout(() => {
      ratingRevealed.value = true
      audioStore.playRatingReveal?.(rating)
    }, 800)
  }
})

onMounted(() => auctionStore.loadAuctionData())
onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (typingTimer) clearTimeout(typingTimer)
})
</script>

<style scoped>
.auction-view { height: 100%; overflow-y: auto; padding: 16px; padding-bottom: 90px; }
.auction-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px; }
.title-icon { margin-right: 8px; }
.page-title { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px; display: flex; align-items: center; }
.page-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.coins-display { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.1)); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; }
.coins-display.low { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.1)); border-color: rgba(239,68,68,0.3); }
.coins-icon { font-size: 20px; }
.coins-value { font-size: 18px; font-weight: 800; color: #fbbf24; }
.btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); }
.auction-tabs { display: flex; gap: 8px; background: var(--bg-card); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px; position: sticky; top: -16px; z-index: 10; }
.tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; border-radius: 10px; border: none; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; position: relative; }
.tab-btn.active { background: linear-gradient(135deg, #e94560, #ff6b6b); color: white; box-shadow: 0 4px 12px rgba(233,69,96,0.3); }
.tab-badge { min-width: 18px; height: 18px; padding: 0 5px; background: #f59e0b; color: #fff; font-size: 10px; font-weight: 800; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.idle-screen, .finished-screen { display: flex; justify-content: center; align-items: center; min-height: 400px; }
.idle-content, .finished-content { text-align: center; max-width: 500px; width: 100%; padding: 32px; background: var(--bg-card); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); }
.idle-icon, .finished-icon { font-size: 72px; margin-bottom: 16px; animation: bounce 2s ease-in-out infinite; }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.idle-title, .finished-title { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 12px; }
.idle-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.8; margin: 0 0 24px; }
.auction-stats-preview { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 28px; }
.stat-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; font-size: 13px; color: var(--text-secondary); }
.start-options, .action-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.session-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.summary-item { padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.summary-icon { font-size: 24px; margin-bottom: 4px; }
.summary-label { font-size: 12px; color: var(--text-secondary); }
.summary-value { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.session-results { margin-bottom: 28px; text-align: left; }
.results-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
.results-list { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }
.result-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 10px; border-left: 3px solid; }
.result-card.rarity-common { border-left-color: #9ca3af; }
.result-card.rarity-uncommon { border-left-color: #22c55e; }
.result-card.rarity-rare { border-left-color: #3b82f6; }
.result-card.rarity-epic { border-left-color: #a855f7; }
.result-card.rarity-legendary { border-left-color: #f59e0b; }
.result-info { flex: 1; display: flex; flex-direction: column; gap: 2px; text-align: left; }
.mineral-name { font-weight: 600; color: var(--text-primary); }
.result-winner { font-size: 12px; color: var(--text-secondary); }
.result-price { font-weight: 700; color: #fbbf24; }
.result-price.passed { color: #6b7280; font-weight: 500; }
.progress-section { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 14px 16px; background: var(--bg-card); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); }
.round-info { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; }
.round-badge { display: inline-flex; align-items: baseline; gap: 2px; padding: 6px 12px; background: linear-gradient(135deg, #e94560, #ff6b6b); border-radius: 10px; color: white; font-weight: 700; }
.round-label { font-size: 12px; opacity: 0.9; }
.round-number { font-size: 20px; font-weight: 800; }
.round-divider { color: var(--text-secondary); font-weight: 700; margin: 0 2px; }
.total-rounds { color: var(--text-secondary); font-weight: 500; }
.progress-bar-wrapper { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.progress-bar { height: 100%; background: linear-gradient(90deg, #e94560, #ff6b6b, #fbbf24); border-radius: 4px; transition: width 0.5s ease; }
.auction-stage { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-bottom: 16px; }
@media (max-width: 768px) { .auction-stage { grid-template-columns: 1fr; } }
.card { background: var(--bg-card); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); padding: 20px; }
.mineral-display { position: relative; overflow: hidden; transition: all 0.3s ease; }
.mineral-display.rarity-common { border-color: rgba(156,163,175,0.25); }
.mineral-display.rarity-uncommon { border-color: rgba(34,197,94,0.25); }
.mineral-display.rarity-rare { border-color: rgba(59,130,246,0.25); }
.mineral-display.rarity-epic { border-color: rgba(168,85,247,0.3); }
.mineral-display.rarity-legendary { border-color: rgba(245,158,11,0.4); }
.mineral-display.closing { animation: closingPulse 0.8s ease-in-out infinite; }
@keyframes closingPulse { 0%,100% { box-shadow: 0 0 0 rgba(239,68,68,0); } 50% { box-shadow: 0 0 30px rgba(239,68,68,0.4); } }
.auctioneer { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.04)); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; margin-bottom: 16px; }
.auctioneer-avatar { font-size: 28px; flex-shrink: 0; }
.auctioneer-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.auctioneer-name { font-size: 12px; font-weight: 600; color: #a855f7; }
.auctioneer-message { font-size: 14px; font-weight: 500; color: var(--text-primary); line-height: 1.5; }
.auctioneer-message.typing { opacity: 0.7; }
.typing-dots { animation: typingBlink 0.5s ease-in-out infinite; }
@keyframes typingBlink { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
.mineral-showcase { display: flex; gap: 16px; margin-bottom: 20px; }
@media (max-width: 480px) { .mineral-showcase { flex-direction: column; align-items: center; text-align: center; } }
.mineral-emoji-large { font-size: 80px; flex-shrink: 0; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); transition: all 0.3s ease; }
.mineral-emoji-large.glow { animation: legendaryGlow 2s ease-in-out infinite; }
@keyframes legendaryGlow {
  0%,100% { filter: drop-shadow(0 0 10px rgba(245,158,11,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.3)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 25px rgba(245,158,11,0.8)) drop-shadow(0 4px 12px rgba(0,0,0,0.3)); transform: scale(1.05); }
}
.mineral-details { flex: 1; min-width: 0; }
.mineral-name-large { font-size: 26px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px; }
.mineral-rarity-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
@media (max-width: 480px) { .mineral-rarity-row { justify-content: center; } }
.rarity-tag { display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; background: rgba(0,0,0,0.3); }
.rarity-tag.rarity-common { color: #9ca3af; }
.rarity-tag.rarity-uncommon { color: #22c55e; }
.rarity-tag.rarity-rare { color: #3b82f6; }
.rarity-tag.rarity-epic { color: #a855f7; }
.rarity-tag.rarity-legendary { color: #f59e0b; }
.mineral-formula { font-family: 'Courier New', monospace; font-size: 13px; color: var(--text-secondary); padding: 3px 8px; background: rgba(255,255,255,0.05); border-radius: 6px; }
.mineral-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 8px 0 0; }
.price-display { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 480px) { .price-display { grid-template-columns: 1fr; } }
.current-price-box, .countdown-box { padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
.current-price-box.leading { background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05)); border-color: rgba(34,197,94,0.3); }
.price-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.price-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.leading-tag { padding: 3px 8px; background: rgba(34,197,94,0.2); border-radius: 6px; font-size: 11px; font-weight: 700; color: #22c55e; }
.opponent-tag { padding: 3px 8px; background: rgba(239,68,68,0.15); border-radius: 6px; font-size: 11px; font-weight: 600; color: #f87171; }
.price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
.price-currency { font-size: 24px; }
.price-amount { font-size: 32px; font-weight: 900; color: #fbbf24; line-height: 1; }
.price-note { font-size: 11px; color: var(--text-secondary); }
.countdown-box.urgent { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.05)); border-color: rgba(239,68,68,0.35); animation: urgentPulse 0.6s ease-in-out infinite; }
@keyframes urgentPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
.countdown-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500; }
.countdown-value { font-size: 36px; font-weight: 900; color: var(--text-primary); line-height: 1; margin-bottom: 8px; font-family: 'Courier New', monospace; }
.countdown-box.urgent .countdown-value { color: #ef4444; animation: valueBlink 0.5s ease-in-out infinite; }
@keyframes valueBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
.countdown-bar-wrapper { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
.countdown-bar { height: 100%; background: linear-gradient(90deg, #22c55e, #eab308, #ef4444); border-radius: 3px; transition: width 0.1s linear; }
.side-panel { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
.bidders-section, .tips-section { padding: 16px; }
.bidders-list { display: flex; flex-direction: column; gap: 8px; }
.bidder-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid transparent; transition: all 0.3s ease; }
.bidder-item.player { background: linear-gradient(135deg, rgba(233,69,96,0.1), rgba(255,107,107,0.05)); border-color: rgba(233,69,96,0.25); }
.bidder-avatar { font-size: 24px; flex-shrink: 0; }
.bidder-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.bidder-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.bidder-coins, .bidder-type { font-size: 11px; color: var(--text-secondary); }
.bidder-status { padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.bidder-status.leading { background: rgba(239,68,68,0.2); color: #f87171; }
.bidder-item.player .bidder-status.leading { background: rgba(34,197,94,0.2); color: #22c55e; }
.tips-list { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; }
.tip-item { font-size: 12px; padding: 8px 10px; border-radius: 8px; line-height: 1.4; animation: tipSlide 0.3s ease; }
@keyframes tipSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
.tip-info { background: rgba(59,130,246,0.1); color: #93c5fd; border-left: 2px solid #3b82f6; }
.tip-success { background: rgba(34,197,94,0.1); color: #86efac; border-left: 2px solid #22c55e; }
.tip-warning { background: rgba(239,68,68,0.1); color: #fca5a5; border-left: 2px solid #ef4444; }
.tip-legendary { background: rgba(245,158,11,0.15); color: #fcd34d; border-left: 2px solid #f59e0b; }
.tip-rare { background: rgba(59,130,246,0.1); color: #93c5fd; border-left: 2px solid #3b82f6; }
.tip-epic { background: rgba(168,85,247,0.1); color: #c4b5fd; border-left: 2px solid #a855f7; }
.empty-tips { font-size: 12px; color: var(--text-secondary); padding: 16px; text-align: center; opacity: 0.6; }
.empty-history { font-size: 12px; color: var(--text-secondary); padding: 16px; text-align: center; opacity: 0.6; }
.bidding-section { padding: 20px; }
.bidding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.bidding-status .status-warning { color: #f87171; font-size: 13px; font-weight: 600; }
.bidding-status .status-info { color: #60a5fa; font-size: 13px; font-weight: 600; }
.bidding-status .status-success { color: #4ade80; font-size: 13px; font-weight: 600; }
.quick-bid-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
@media (max-width: 480px) { .quick-bid-buttons { grid-template-columns: repeat(2, 1fr); } }
.quick-bid-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 8px; background: rgba(255,255,255,0.03); border: 2px solid; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; font-weight: 600; }
.quick-bid-btn:hover:not(:disabled) { transform: translateY(-2px); background: rgba(255,255,255,0.06); }
.quick-bid-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.quick-bid-label { font-size: 14px; font-weight: 800; }
.quick-bid-amount { font-size: 11px; opacity: 0.8; }
.custom-bid-section { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 16px; }
@media (max-width: 480px) { .custom-bid-section { grid-template-columns: 1fr; } }
.custom-bid-input { display: flex; align-items: center; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 14px; transition: all 0.3s ease; }
.custom-bid-input:focus-within { border-color: #e94560; }
.input-prefix { font-size: 20px; margin-right: 8px; }
.bid-input { flex: 1; background: transparent; border: none; outline: none; padding: 14px 0; font-size: 18px; font-weight: 700; color: var(--text-primary); font-family: inherit; }
.bid-input::placeholder { color: #6b7280; font-weight: 500; }
.bid-submit-btn { padding: 14px 24px; white-space: nowrap; }
.bid-history-preview { padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.history-header { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; }
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-item { display: grid; grid-template-columns: 24px 28px 1fr auto; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 13px; transition: all 0.3s ease; }
.history-item.top { background: linear-gradient(90deg, rgba(251,191,36,0.12), transparent); }
.history-item.player { background: linear-gradient(90deg, rgba(233,69,96,0.12), transparent); }
.history-rank { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border-radius: 6px; font-size: 10px; font-weight: 800; color: var(--text-secondary); }
.history-item.top .history-rank { background: #fbbf24; color: #1f2937; }
.history-avatar { font-size: 18px; }
.history-name { color: var(--text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-item.player .history-name { color: #f87171; font-weight: 600; }
.history-amount { font-weight: 700; color: #fbbf24; font-family: 'Courier New', monospace; }
.archive-section { padding-bottom: 20px; }
.archive-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
@media (max-width: 480px) { .archive-stats { grid-template-columns: 1fr; } }
.archive-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--bg-card); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); }
.archive-stat-card.success { background: linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.04)); border-color: rgba(34,197,94,0.25); }
.archive-stat-card.warning { background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04)); border-color: rgba(245,158,11,0.25); }
.archive-stat-icon { font-size: 32px; }
.archive-stat-info { display: flex; flex-direction: column; gap: 2px; }
.archive-stat-label { font-size: 12px; color: var(--text-secondary); }
.archive-stat-value { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.archive-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.archive-tab { padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
.archive-tab.active { background: linear-gradient(135deg, #e94560, #ff6b6b); color: white; border-color: transparent; }
.tab-count { margin-left: 4px; opacity: 0.7; }
.empty-state { text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 16px; color: var(--text-secondary); }
.archive-list { display: flex; flex-direction: column; gap: 10px; }
.archive-item { padding: 16px; position: relative; overflow: hidden; }
.archive-item.rarity-common { border-left: 3px solid #9ca3af; }
.archive-item.rarity-uncommon { border-left: 3px solid #22c55e; }
.archive-item.rarity-rare { border-left: 3px solid #3b82f6; }
.archive-item.rarity-epic { border-left: 3px solid #a855f7; }
.archive-item.rarity-legendary { border-left: 3px solid #f59e0b; }
.archive-item.win { background: linear-gradient(90deg, rgba(34,197,94,0.08), var(--bg-card)); }
.archive-item.lose { background: linear-gradient(90deg, rgba(239,68,68,0.05), var(--bg-card)); }
.archive-item.passed { opacity: 0.75; }
.archive-left, .archive-right { display: flex; align-items: center; }
.archive-left { justify-content: flex-start; flex: 1; margin-bottom: 12px; }
.archive-right { justify-content: space-between; width: 100%; }
.archive-mineral { display: flex; align-items: center; gap: 12px; }
.archive-emoji { font-size: 36px; }
.archive-mineral-info { display: flex; flex-direction: column; gap: 2px; }
.archive-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.archive-meta { font-size: 12px; color: var(--text-secondary); }
.archive-price-info { display: flex; align-items: center; gap: 12px; }
.archive-price { font-size: 18px; font-weight: 800; color: #fbbf24; }
.archive-price.passed { color: #6b7280; font-weight: 500; font-size: 14px; }
.archive-bids-count { font-size: 12px; color: var(--text-secondary); }
.archive-result { margin-left: 12px; }
.result-tag { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
.result-tag.win { background: rgba(34,197,94,0.2); color: #22c55e; }
.result-tag.lose { background: rgba(239,68,68,0.15); color: #f87171; }
.result-tag.passed { background: rgba(107,114,128,0.2); color: #9ca3af; }
.bid-detail-toggle { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.toggle-btn { background: transparent; border: none; color: var(--text-secondary); font-size: 12px; font-weight: 500; cursor: pointer; padding: 4px 0; transition: color 0.2s; }
.toggle-btn:hover { color: var(--text-primary); }
.bid-detail { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.bid-row { display: grid; grid-template-columns: 40px 28px 1fr auto; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; }
.bid-row.player { background: rgba(233,69,96,0.08); }
.bid-rank { font-weight: 700; color: var(--text-secondary); }
.bid-avatar { font-size: 16px; }
.bid-name { color: var(--text-primary); font-weight: 500; }
.bid-row.player .bid-name { color: #f87171; font-weight: 600; }
.bid-amount { color: #fbbf24; font-weight: 700; font-family: 'Courier New', monospace; }
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 500px; }
.result-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 5000; padding: 20px; }
.result-modal { max-width: 420px; width: 100%; padding: 28px; position: relative; overflow: hidden; }
.result-modal::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
.result-modal.rarity-common::before { background: #9ca3af; }
.result-modal.rarity-uncommon::before { background: #22c55e; }
.result-modal.rarity-rare::before { background: #3b82f6; }
.result-modal.rarity-epic::before { background: #a855f7; }
.result-modal.rarity-legendary::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.result-modal.win { animation: winPulse 0.6s ease; }
@keyframes winPulse { 0% { transform: scale(0.9); } 60% { transform: scale(1.03); } 100% { transform: scale(1); } }
.result-modal-header { text-align: center; margin-bottom: 24px; }
.result-icon { font-size: 64px; margin-bottom: 8px; }
.result-icon.win { animation: iconBounce 0.6s ease; }
@keyframes iconBounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.result-title { font-size: 26px; font-weight: 800; margin: 0; }
.result-title.win { color: #22c55e; }
.result-title.lose { color: #f87171; }
.result-title.passed { color: #9ca3af; }
.result-modal-body { margin-bottom: 24px; }
.result-mineral-display { display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 16px; }
.result-mineral-emoji { font-size: 52px; }
.result-mineral-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.result-mineral-name { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0; }
.result-rarity-tag { align-self: flex-start; }
.result-price-row, .result-winner-row, .result-bids-row, .result-combo-row, .result-time-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 8px; }
.result-price-label, .result-winner-label, .result-bids-label, .result-combo-label, .result-time-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.result-price-value { font-size: 24px; font-weight: 900; color: #fbbf24; }
.result-winner-value, .result-bids-value { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.result-combo-value { font-size: 15px; font-weight: 700; color: #f59e0b; }
.result-time-value { font-size: 15px; font-weight: 700; color: #a855f7; }
.result-collection-note { margin-top: 16px; padding: 12px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; text-align: center; font-size: 13px; font-weight: 600; color: #22c55e; }
.result-modal-footer { display: flex; justify-content: center; }
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .result-modal, .modal-leave-to .result-modal { transform: scale(0.9) translateY(20px); }
.auction-toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; z-index: 5000; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); max-width: 90%; text-align: center; }
.auction-toast.success { background: rgba(34,197,94,0.95); color: white; border: 1px solid rgba(34,197,94,0.5); }
.auction-toast.error { background: rgba(239,68,68,0.95); color: white; border: 1px solid rgba(239,68,68,0.5); }
.toast-enter-active { animation: toastIn 0.3s ease; }
.toast-leave-active { animation: toastOut 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-20px); } }
.combo-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08)); border: 2px solid #f59e0b; border-radius: 20px; flex-shrink: 0; animation: comboIn 0.3s ease; }
.combo-badge.flash { animation: comboFlash 0.6s ease; }
@keyframes comboIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes comboFlash { 0%,100% { transform: scale(1); } 30% { transform: scale(1.15); } 60% { transform: scale(0.95); } }
.combo-icon { font-size: 16px; }
.combo-text { font-size: 13px; font-weight: 800; color: #fbbf24; }
.combo-mult { font-size: 11px; font-weight: 700; color: #f59e0b; opacity: 0.8; }
.time-bonus-hint { margin-top: 8px; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; text-align: center; animation: bonusPulse 1s ease-in-out infinite; background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1)); color: #c4b5fd; }
@keyframes bonusPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
.rating-section { text-align: center; padding: 20px; margin-bottom: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); opacity: 0; transform: scale(0.8); transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rating-section.revealed { opacity: 1; transform: scale(1); }
.rating-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600; }
.rating-badge { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 16px; background: linear-gradient(135deg, var(--rating-color, #9ca3af), color-mix(in srgb, var(--rating-color, #9ca3af) 70%, white)); margin-bottom: 8px; }
.rating-badge.rating-S { animation: ratingGlow 1.5s ease-in-out infinite; }
@keyframes ratingGlow { 0%,100% { box-shadow: 0 0 15px rgba(251,191,36,0.3); } 50% { box-shadow: 0 0 35px rgba(251,191,36,0.6); } }
.rating-icon { font-size: 28px; }
.rating-letter { font-size: 36px; font-weight: 900; color: white; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.rating-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.rating-score { font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
.rating-rewards { display: flex; justify-content: center; gap: 16px; }
.reward-item { font-size: 14px; font-weight: 700; color: #fbbf24; padding: 4px 12px; background: rgba(251,191,36,0.1); border-radius: 8px; }
.session-bonus-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.bonus-stat-item { display: flex; align-items: center; gap: 10px; padding: 14px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
.bonus-icon { font-size: 24px; }
.bonus-label { font-size: 11px; color: var(--text-secondary); }
.bonus-value { font-size: 16px; font-weight: 800; color: var(--text-primary); }
.result-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.result-combo-badge { display: inline-flex; align-items: center; padding: 2px 8px; background: rgba(245,158,11,0.2); border-radius: 6px; font-size: 11px; font-weight: 700; color: #fbbf24; }
.result-time-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; font-size: 12px; }
.result-time-badge.last-second { background: rgba(168,85,247,0.2); }
.result-time-badge.sniper { background: rgba(59,130,246,0.2); }
</style>
