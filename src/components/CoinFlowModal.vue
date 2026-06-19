<template>
  <div class="coin-flow-modal" v-if="visible" @click.self="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="title-icon">💰</span>
          金币流水
        </h2>
        <button class="close-btn" @click="close">
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div class="stats-overview">
          <div class="overview-card income">
            <span class="overview-icon">📈</span>
            <div class="overview-info">
              <span class="overview-label">总收入</span>
              <span class="overview-value income">{{ formatNumber(stats.totalIncome) }}</span>
            </div>
          </div>
          <div class="overview-card expense">
            <span class="overview-icon">📉</span>
            <div class="overview-info">
              <span class="overview-label">总支出</span>
              <span class="overview-value expense">{{ formatNumber(stats.totalExpense) }}</span>
            </div>
          </div>
          <div class="overview-card net">
            <span class="overview-icon">💎</span>
            <div class="overview-info">
              <span class="overview-label">净变化</span>
              <span class="overview-value" :class="stats.netChange >= 0 ? 'income' : 'expense'">
                {{ stats.netChange >= 0 ? '+' : '' }}{{ formatNumber(stats.netChange) }}
              </span>
            </div>
          </div>
        </div>

        <div class="filter-tabs">
          <button 
            class="filter-tab" 
          :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            全部
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: activeFilter === 'income' }"
            @click="activeFilter = 'income'"
          >
            收入
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: activeFilter === 'expense' }"
            @click="activeFilter = 'expense'"
          >
            支出
          </button>
        </div>

        <div class="category-breakdown" v-if="stats.categoryStats.length > 0">
          <h3 class="section-title">分类统计</h3>
          <div class="category-list">
            <div 
              v-for="cat in stats.categoryStats" 
              :key="cat.category"
              class="category-item"
            >
              <div class="category-left">
                <span class="category-icon" :style="{ background: cat.color + '20' }">
                  {{ cat.icon }}
                </span>
                <div class="category-info">
                  <span class="category-name">{{ cat.name }}</span>
                  <span class="category-count">{{ cat.count }} 笔</span>
                </div>
              </div>
              <span class="category-amount" :class="cat.type">
                {{ cat.type === 'income' ? '+' : '-' }}{{ formatNumber(cat.amount) }}
              </span>
            </div>
          </div>
        </div>

        <div class="transaction-list">
          <h3 class="section-title">交易记录</h3>
          <div class="transactions">
            <div 
              v-for="tx in filteredTransactions" 
              :key="tx.id"
              class="transaction-item"
            >
              <div class="tx-left">
                <span class="tx-icon" :style="{ background: tx.categoryColor + '20' }">
                  {{ tx.categoryIcon }}
                </span>
                <div class="tx-info">
                  <span class="tx-category">{{ tx.categoryName }}</span>
                  <span class="tx-desc">{{ tx.description }}</span>
                  <span class="tx-time">{{ formatTime(tx.timestamp) }}</span>
                </div>
              </div>
              <div class="tx-right">
                <span class="tx-amount" :class="tx.type">
                  {{ tx.type === 'income' ? '+' : '-' }}{{ formatNumber(tx.amount) }}
                </span>
                <span class="tx-balance">余额: {{ formatNumber(tx.balanceAfter) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="filteredTransactions.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>暂无交易记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mineralId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close'])

const gameStore = useGameStore()
const activeFilter = ref('all')

const stats = computed(() => {
  if (props.mineralId) {
    return gameStore.getMineralCoinStats(props.mineralId)
  }
  return gameStore.getCoinStats()
})

const filteredTransactions = computed(() => {
  let transactions
  if (props.mineralId) {
    transactions = gameStore.getCoinTransactions({ mineralId: props.mineralId })
  } else {
    transactions = gameStore.coinTransactions
  }
  
  if (activeFilter.value === 'all') {
    return transactions
  }
  
  return transactions.filter(t => t.type === activeFilter.value)
})

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.coin-flow-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  width: 90%;
  max-width: 420px;
  max-height: 85vh;
  background: var(--bg-card);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.overview-card.income {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(255, 255, 255, 0.03));
  border-color: rgba(34, 197, 94, 0.2);
}

.overview-card.expense {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(255, 255, 255, 0.03));
  border-color: rgba(239, 68, 68, 0.2);
}

.overview-card.net {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(255, 255, 255, 0.03));
  border-color: rgba(245, 158, 11, 0.2);
}

.overview-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 6px;
}

.overview-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.overview-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.overview-value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.overview-value.income {
  color: #22c55e;
}

.overview-value.expense {
  color: #ef4444;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 10px;
}

.filter-tab {
  flex: 1;
  padding: 8px 12px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--primary);
  color: white;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.category-breakdown {
  margin-bottom: 20px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.category-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-count {
  font-size: 11px;
  color: var(--text-secondary);
}

.category-amount {
  font-size: 14px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.category-amount.income {
  color: #22c55e;
}

.category-amount.expense {
  color: #ef4444;
}

.transaction-list {
  margin-top: 20px;
}

.transactions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tx-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.tx-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tx-category {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.tx-desc {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-time {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 15px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.tx-amount.income {
  color: #22c55e;
}

.tx-amount.expense {
  color: #ef4444;
}

.tx-balance {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.6;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .stats-overview {
    gap: 8px;
  }
  
  .overview-card {
    padding: 10px 8px;
  }
  
  .overview-value {
    font-size: 14px;
  }
}
</style>