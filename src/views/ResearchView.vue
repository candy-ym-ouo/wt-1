<template>
  <div class="research-view">
    <div class="tabs-section">
      <div class="tabs-wrapper">
        <button
          :class="['tab-btn', { active: activeTab === 'topics' }]"
          @click="activeTab = 'topics'"
        >
          <span class="tab-icon">🔬</span>
          <span class="tab-label">研究课题</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'active' }]"
          @click="activeTab = 'active'"
        >
          <span class="tab-icon">⚗️</span>
          <span class="tab-label">进行中</span>
          <span v-if="researchStore.activeResearch" class="tab-badge">!</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'cards' }]"
          @click="activeTab = 'cards'"
        >
          <span class="tab-icon">📇</span>
          <span class="tab-label">知识卡片</span>
          <span v-if="researchStore.cardStats.unlocked > 0" class="tab-badge cards-badge">
            {{ researchStore.cardStats.unlocked }}
          </span>
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'topics'">
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">矿物研究院</h1>
          <p class="page-subtitle">深入研究矿物奥秘，解锁知识卡片，丰富图鉴内容</p>
        </div>
        <div class="header-stats">
          <div class="points-badge">
            <span class="points-icon">🧪</span>
            <span class="points-value">{{ researchStore.researchPoints }}</span>
          </div>
        </div>
      </div>

      <div class="progress-overview">
        <div class="progress-card card">
          <div class="progress-row">
            <div class="progress-item">
              <span class="progress-label">研究进度</span>
              <span class="progress-value">{{ researchStore.totalProgress.completed }}/{{ researchStore.totalProgress.total }}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">知识卡片</span>
              <span class="progress-value">{{ researchStore.cardStats.unlocked }}/{{ researchStore.cardStats.total }}</span>
            </div>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${researchStore.totalProgress.percentage}%` }"></div>
            </div>
            <span class="progress-text">{{ researchStore.totalProgress.percentage }}%</span>
          </div>
        </div>
      </div>

      <div class="coins-indicator">
        <span class="coins-icon">💰</span>
        <span class="coins-value">{{ gameStore.coins.toLocaleString() }}</span>
        <span class="coins-label">可用金币</span>
      </div>

      <div class="category-section">
        <h2 class="section-title">研究领域</h2>
        <div class="category-grid">
          <div
            v-for="(stat, key) in researchStore.categoryStats"
            :key="key"
            class="category-card card"
            :style="{ '--cat-color': stat.color, '--cat-gradient': stat.gradient }"
            @click="filterCategory = filterCategory === key ? null : key"
            :class="{ active: filterCategory === key }"
          >
            <div class="category-icon">{{ stat.icon }}</div>
            <div class="category-info">
              <span class="category-name">{{ stat.name }}</span>
              <span class="category-desc">{{ stat.topicCount }} 个课题 · {{ stat.stagesCompleted }}/{{ stat.stagesTotal }}</span>
            </div>
            <div class="category-progress">
              <div class="mini-bar">
                <div class="mini-fill" :style="{ width: `${stat.percentage}%`, background: stat.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="topics-section">
        <h2 class="section-title">研究课题</h2>
        <div class="topics-list">
          <div
            v-for="topic in filteredTopics"
            :key="topic.id"
            class="topic-card card"
          >
            <div class="topic-header" :style="{ borderLeftColor: getCategoryColor(topic.category) }">
              <div class="topic-icon-wrap" :style="{ background: getCategoryGradient(topic.category) }">
                {{ topic.icon }}
              </div>
              <div class="topic-info">
                <div class="topic-meta">
                  <span class="topic-category" :style="{ color: getCategoryColor(topic.category) }">
                    {{ getCategoryName(topic.category) }}
                  </span>
                  <span class="topic-difficulty">
                    <span v-for="i in topic.difficulty" :key="i">⭐</span>
                  </span>
                </div>
                <h3 class="topic-name">{{ topic.name }}</h3>
                <p class="topic-desc">{{ topic.description }}</p>
              </div>
            </div>

            <div class="stages-list">
              <div
                v-for="(stage, idx) in topic.stages"
                :key="stage.id"
                class="stage-item"
                :class="{
                  completed: researchStore.isStageCompleted(stage.id),
                  locked: !researchStore.isStageUnlocked(topic.id, idx),
                  active: researchStore.activeResearch?.stageId === stage.id
                }"
              >
                <div class="stage-connector" v-if="idx > 0"></div>
                <div class="stage-node">
                  <span v-if="researchStore.isStageCompleted(stage.id)" class="stage-check">✓</span>
                  <span v-else-if="researchStore.isStageUnlocked(topic.id, idx)" class="stage-number">{{ idx + 1 }}</span>
                  <span v-else class="stage-lock">🔒</span>
                </div>
                <div class="stage-content">
                  <div class="stage-header">
                    <h4 class="stage-name">{{ stage.name }}</h4>
                    <span v-if="researchStore.isStageCompleted(stage.id)" class="stage-badge done">已完成</span>
                    <span v-else-if="researchStore.activeResearch?.stageId === stage.id" class="stage-badge current">进行中</span>
                  </div>
                  <p class="stage-desc">{{ stage.description }}</p>

                  <div v-if="researchStore.isStageUnlocked(topic.id, idx) && !researchStore.isStageCompleted(stage.id)" class="stage-details">
                    <div class="materials-req">
                      <span class="req-label">需要材料:</span>
                      <div class="req-items">
                        <div
                          v-for="mat in stage.requiredMaterials"
                          :key="mat.rarity"
                          class="req-item"
                          :class="{ fulfilled: getMaterialProgress(stage.id, mat.rarity) >= mat.count }"
                        >
                          <span class="req-rarity" :style="{ color: RARITY_CONFIG[mat.rarity].color }">
                            {{ RARITY_CONFIG[mat.rarity].name }}
                          </span>
                          <span class="req-count">
                            {{ getMaterialProgress(stage.id, mat.rarity) }}/{{ mat.count }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="stage-cost">
                      <span class="cost-label">费用:</span>
                      <span class="cost-value">{{ stage.coinCost }} 💰</span>
                    </div>
                    <div class="stage-rewards">
                      <span class="reward-label">奖励:</span>
                      <span class="reward-item" v-if="stage.rewards.coins">{{ stage.rewards.coins }} 💰</span>
                      <span class="reward-item" v-if="stage.rewards.exp">{{ stage.rewards.exp }} EXP</span>
                      <span class="reward-item card-reward" v-if="stage.knowledgeCard">📇 {{ stage.knowledgeCard.title }}</span>
                    </div>
                    <button
                      v-if="!researchStore.activeResearch || researchStore.activeResearch.stageId === stage.id"
                      class="btn btn-small start-stage-btn"
                      :disabled="researchStore.activeResearch && researchStore.activeResearch.stageId !== stage.id"
                      :style="{ background: getCategoryGradient(topic.category) }"
                      @click="handleStartResearch(topic.id, stage.id)"
                    >
                      {{ researchStore.activeResearch?.stageId === stage.id ? '前往提交' : '开始研究' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'active'">
      <div class="active-section">
        <div v-if="!researchStore.activeResearch" class="empty-state card">
          <div class="empty-icon">🔬</div>
          <p class="empty-text">当前没有进行中的研究</p>
          <p class="empty-hint">在"研究课题"中选择一个课题开始研究</p>
        </div>

        <div v-else class="active-research">
          <div class="active-header card">
            <div class="active-title-row">
              <div class="active-icon" :style="{ background: getCategoryGradient(currentTopic?.category) }">
                {{ currentTopic?.icon }}
              </div>
              <div class="active-info">
                <h2 class="active-name">{{ currentStage?.name }}</h2>
                <p class="active-topic">{{ currentTopic?.name }} · {{ getCategoryName(currentTopic?.category) }}</p>
              </div>
              <button class="cancel-btn" @click="handleCancel">取消</button>
            </div>
          </div>

          <div class="submit-section card">
            <h3 class="section-title">提交材料</h3>
            <div class="submit-materials">
              <div
                v-for="mat in currentStage?.requiredMaterials"
                :key="mat.rarity"
                class="submit-material-card"
                :class="{ fulfilled: getMaterialProgress(currentStage?.id, mat.rarity) >= mat.count }"
              >
                <div class="mat-header">
                  <span class="mat-rarity" :style="{ color: RARITY_CONFIG[mat.rarity].color }">
                    {{ RARITY_CONFIG[mat.rarity].name }}矿物
                  </span>
                  <span class="mat-progress">
                    {{ getMaterialProgress(currentStage?.id, mat.rarity) }}/{{ mat.count }}
                  </span>
                </div>
                <div class="mat-bar">
                  <div
                    class="mat-fill"
                    :style="{
                      width: `${Math.min(100, (getMaterialProgress(currentStage?.id, mat.rarity) / mat.count) * 100)}%`,
                      background: RARITY_CONFIG[mat.rarity].color
                    }"
                  ></div>
                </div>
                <div class="mat-inventory">
                  可用: {{ getAvailableCount(mat.rarity) }} 种
                </div>
                <button
                  class="btn btn-small submit-btn"
                  :disabled="!researchStore.canSubmitMaterial(currentStage?.id, mat.rarity)"
                  :style="{ background: RARITY_CONFIG[mat.rarity].bgGradient }"
                  @click="handleSubmit(currentStage?.id, mat.rarity)"
                >
                  {{ getMaterialProgress(currentStage?.id, mat.rarity) >= mat.count ? '已满足' : '提交' }}
                </button>
              </div>
            </div>
          </div>

          <div class="complete-section">
            <button
              class="btn complete-btn"
              :disabled="!researchStore.canCompleteStage(currentStage?.id)"
              @click="handleComplete"
            >
              <span class="complete-icon">🎓</span>
              <span>完成研究</span>
              <span class="complete-cost">{{ currentStage?.coinCost }} 💰</span>
            </button>
            <p v-if="!researchStore.canCompleteStage(currentStage?.id)" class="complete-hint">
              请先提交所有材料并确保金币充足
            </p>
          </div>

          <div v-if="currentStage?.knowledgeCard" class="preview-card card">
            <div class="preview-header">
              <span class="preview-icon">📇</span>
              <span class="preview-label">完成后解锁</span>
            </div>
            <h4 class="preview-title">{{ currentStage.knowledgeCard.title }}</h4>
            <p class="preview-desc">{{ currentStage.knowledgeCard.content.slice(0, 80) }}...</p>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'cards'">
      <div class="cards-section">
        <div class="cards-header">
          <h1 class="page-title">📇 知识卡片</h1>
          <p class="page-subtitle">通过研究解锁的矿物知识，丰富图鉴内容</p>
          <div class="cards-stats">
            <span class="stats-text">{{ researchStore.cardStats.unlocked }}/{{ researchStore.cardStats.total }} 已解锁</span>
          </div>
        </div>

        <div class="card-filter">
          <button
            :class="['filter-btn', { active: cardFilter === 'all' }]"
            @click="cardFilter = 'all'"
          >全部</button>
          <button
            v-for="(config, key) in CATEGORY_CONFIG"
            :key="key"
            :class="['filter-btn', { active: cardFilter === key }]"
            @click="cardFilter = key"
          >{{ config.icon }} {{ config.name }}</button>
        </div>

        <div v-if="filteredCards.length === 0" class="empty-state card">
          <div class="empty-icon">📇</div>
          <p class="empty-text">暂无已解锁的知识卡片</p>
          <p class="empty-hint">完成研究课题来解锁知识卡片</p>
        </div>

        <div v-else class="cards-grid">
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="knowledge-card card"
            :class="{ locked: !researchStore.isCardUnlocked(card.id) }"
            :style="{ '--card-color': getCategoryColor(card.category) }"
            @click="openCardDetail(card)"
          >
            <div class="kcard-header">
              <span class="kcard-icon">{{ card.icon }}</span>
              <span v-if="researchStore.isCardUnlocked(card.id)" class="kcard-category" :style="{ color: getCategoryColor(card.category) }">
                {{ getCategoryName(card.category) }}
              </span>
              <span v-else class="kcard-lock">🔒</span>
            </div>
            <h4 class="kcard-title">
              {{ researchStore.isCardUnlocked(card.id) ? card.title : '???' }}
            </h4>
            <p class="kcard-excerpt">
              {{ researchStore.isCardUnlocked(card.id) ? card.content.slice(0, 60) + '...' : '完成研究解锁' }}
            </p>
            <div class="kcard-minerals" v-if="researchStore.isCardUnlocked(card.id)">
              <span class="kcard-mineral-label">关联矿物:</span>
              <span
                v-for="mid in card.relatedMineralIds"
                :key="mid"
                class="kcard-mineral-tag"
                @click.stop="goToMineral(mid)"
              >
                {{ getMineralEmoji(mid) }} {{ getMineralName(mid) }}
              </span>
            </div>
            <div class="kcard-source" v-if="researchStore.isCardUnlocked(card.id)">
              来自: {{ card.topicName }} · {{ card.stageName }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCardModal" class="modal-overlay" @click.self="showCardModal = false">
      <div class="modal-content card-detail-modal card">
        <div class="modal-header">
          <div class="modal-title-row">
            <span class="modal-card-icon">{{ selectedCard?.icon }}</span>
            <div>
              <h2 class="modal-card-title">{{ selectedCard?.title }}</h2>
              <span class="modal-card-category" :style="{ color: getCategoryColor(selectedCard?.category) }">
                {{ getCategoryName(selectedCard?.category) }}
              </span>
            </div>
          </div>
          <button class="close-btn" @click="showCardModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-card-content">{{ selectedCard?.content }}</p>
          <div class="modal-related">
            <h4 class="modal-related-title">关联矿物</h4>
            <div class="modal-related-list">
              <div
                v-for="mid in selectedCard?.relatedMineralIds || []"
                :key="mid"
                class="modal-related-item"
                @click="goToMineral(mid)"
              >
                <span class="related-emoji">{{ getMineralEmoji(mid) }}</span>
                <span class="related-name">{{ getMineralName(mid) }}</span>
                <span :class="['related-rarity', `rarity-${getMineralRarity(mid)}`]">
                  {{ getRarityName(getMineralRarity(mid)) }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-source">
            📋 来源: {{ selectedCard?.topicName }} · {{ selectedCard?.stageName }}
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="goToCollection">在图鉴中查看</button>
          <button class="btn" @click="showCardModal = false">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showResultModal" class="modal-overlay" @click.self="showResultModal = false">
      <div class="modal-content result-modal card">
        <div class="result-sparkles">
          <span v-for="i in 8" :key="i" class="result-sparkle" :style="getSparkleStyle(i)">✨</span>
        </div>
        <div class="result-emoji">🎓</div>
        <h2 class="result-title">研究完成！</h2>
        <p class="result-stage">{{ resultData?.stageName }}</p>

        <div class="result-rewards">
          <div class="result-reward" v-if="resultData?.rewards?.coins">
            <span class="reward-icon">💰</span>
            <span class="reward-value">+{{ resultData.rewards.coins }}</span>
          </div>
          <div class="result-reward" v-if="resultData?.rewards?.exp">
            <span class="reward-icon">⚡</span>
            <span class="reward-value">+{{ resultData.rewards.exp }} EXP</span>
          </div>
        </div>

        <div v-if="resultData?.knowledgeCard" class="result-card-preview">
          <span class="result-card-icon">{{ resultData.knowledgeCard.icon }}</span>
          <div class="result-card-info">
            <span class="result-card-label">解锁知识卡片</span>
            <h3 class="result-card-title">{{ resultData.knowledgeCard.title }}</h3>
          </div>
        </div>

        <button class="btn result-close-btn" @click="showResultModal = false">继续</button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastMessage" class="research-toast" :class="{ success: toastSuccess, error: !toastSuccess }">
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useResearchStore } from '@/stores/research'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG } from '@/data/rarity'
import { getMineralById } from '@/data/minerals'
import {
  CATEGORY_CONFIG,
  getAllKnowledgeCards,
  getKnowledgeCardsByCategory
} from '@/data/research'

const router = useRouter()
const gameStore = useGameStore()
const researchStore = useResearchStore()
const audioStore = useAudioStore()

const activeTab = ref('topics')
const filterCategory = ref(null)
const cardFilter = ref('all')
const showCardModal = ref(false)
const selectedCard = ref(null)
const showResultModal = ref(false)
const resultData = ref(null)
const toastMessage = ref('')
const toastSuccess = ref(true)
let toastTimer = null

onMounted(() => {
  researchStore.loadProgress()
})

const showToast = (message, success = true) => {
  toastMessage.value = message
  toastSuccess.value = success
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 2500)
}

const getCategoryColor = (category) => CATEGORY_CONFIG[category]?.color || '#6b7280'
const getCategoryName = (category) => CATEGORY_CONFIG[category]?.name || '未知'
const getCategoryGradient = (category) => CATEGORY_CONFIG[category]?.gradient || 'linear-gradient(135deg, #6b7280, #9ca3af)'

const filteredTopics = computed(() => {
  if (!filterCategory.value) return researchStore.allTopics
  return researchStore.allTopics.filter(t => t.category === filterCategory.value)
})

const currentTopic = computed(() => {
  if (!researchStore.activeResearch) return null
  return researchStore.allTopics.find(t => t.id === researchStore.activeResearch.topicId)
})

const currentStage = computed(() => {
  if (!currentTopic.value) return null
  return currentTopic.value.stages.find(s => s.id === researchStore.activeResearch.stageId)
})

const filteredCards = computed(() => {
  const all = getAllKnowledgeCards()
  if (cardFilter.value === 'all') return all
  return getKnowledgeCardsByCategory(cardFilter.value)
})

const getMaterialProgress = (stageId, rarity) => {
  const progress = researchStore.getStageProgress(stageId)
  return progress[rarity] || 0
}

const getAvailableCount = (rarity) => {
  return researchStore.getCollectedMineralsByRarity(rarity).length
}

const getMineralEmoji = (id) => getMineralById(id)?.emoji || '❓'
const getMineralName = (id) => getMineralById(id)?.name || '???'
const getMineralRarity = (id) => getMineralById(id)?.rarity || 'common'
const getRarityName = (rarity) => RARITY_CONFIG[rarity]?.name || '普通'

const handleStartResearch = (topicId, stageId) => {
  audioStore.playClick()
  if (researchStore.activeResearch) {
    if (researchStore.activeResearch.stageId === stageId) {
      activeTab.value = 'active'
      return
    }
    showToast('请先完成或取消当前研究', false)
    return
  }
  const result = researchStore.startResearch(topicId, stageId)
  if (result.success) {
    showToast('开始研究！')
    activeTab.value = 'active'
    audioStore.playSuccess?.()
  } else {
    showToast(result.message, false)
    audioStore.playError()
  }
}

const handleSubmit = (stageId, rarity) => {
  audioStore.playClick()
  const result = researchStore.submitMaterial(stageId, rarity)
  if (result.success) {
    showToast(`提交了 ${result.mineral.name}`)
  } else {
    showToast(result.message, false)
    audioStore.playError()
  }
}

const handleComplete = () => {
  audioStore.playClick()
  const result = researchStore.completeStage(currentStage.value.id)
  if (result.success) {
    resultData.value = result
    showResultModal.value = true
    audioStore.playSuccess?.()
  } else {
    showToast(result.message, false)
    audioStore.playError()
  }
}

const handleCancel = () => {
  if (confirm('确定要取消当前研究吗？已提交的材料将退还。')) {
    researchStore.cancelResearch()
    showToast('已取消研究，材料已退还')
  }
}

const openCardDetail = (card) => {
  if (!researchStore.isCardUnlocked(card.id)) {
    audioStore.playError()
    showToast('该卡片尚未解锁', false)
    return
  }
  audioStore.playClick()
  selectedCard.value = card
  showCardModal.value = true
}

const goToMineral = (id) => {
  audioStore.playClick()
  if (gameStore.isMineralCollected(id)) {
    showCardModal.value = false
    router.push(`/mineral/${id}`)
  } else {
    showToast('尚未收集该矿物', false)
  }
}

const goToCollection = () => {
  showCardModal.value = false
  router.push('/collection')
}

const getSparkleStyle = (index) => {
  const angle = (index / 8) * 360
  const delay = index * 0.15
  return { '--angle': `${angle}deg`, '--delay': `${delay}s` }
}
</script>

<style scoped>
.research-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.tabs-section {
  margin-bottom: 20px;
  position: sticky;
  top: -16px;
  z-index: 10;
  padding: 12px 0 8px;
  margin: -16px -16px 0;
  padding-left: 16px;
  padding-right: 16px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tabs-wrapper {
  display: flex;
  gap: 8px;
  background: var(--bg-card);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: white;
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: 12px;
  min-width: 16px;
  height: 16px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.tab-badge.cards-badge {
  background: #a855f7;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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
}

.points-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  color: white;
}

.points-icon {
  font-size: 16px;
}

.points-value {
  font-size: 16px;
}

.progress-overview {
  margin-bottom: 16px;
}

.progress-card {
  padding: 16px;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.progress-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.progress-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #a855f7, #3b82f6);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

.coins-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  margin-bottom: 20px;
}

.coins-icon {
  font-size: 20px;
}

.coins-value {
  font-size: 18px;
  font-weight: 800;
  color: #fbbf24;
}

.coins-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: auto;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.category-card {
  padding: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.category-card:hover {
  transform: translateY(-2px);
}

.category-card.active {
  border-color: var(--cat-color);
  box-shadow: 0 0 20px color-mix(in srgb, var(--cat-color) 30%, transparent);
}

.category-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.category-desc {
  font-size: 11px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 8px;
}

.mini-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topic-card {
  overflow: hidden;
}

.topic-header {
  display: flex;
  gap: 14px;
  padding: 18px;
  border-left: 4px solid;
}

.topic-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.topic-category {
  font-size: 12px;
  font-weight: 700;
}

.topic-difficulty {
  font-size: 10px;
}

.topic-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.topic-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.stages-list {
  padding: 0 18px 18px;
}

.stage-item {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 14px 0;
}

.stage-connector {
  position: absolute;
  left: 15px;
  top: -10px;
  width: 2px;
  height: 10px;
  background: rgba(255, 255, 255, 0.15);
}

.stage-item.completed .stage-connector {
  background: #22c55e;
}

.stage-node {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.stage-item.completed .stage-node {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
  color: #22c55e;
}

.stage-item.active .stage-node {
  background: rgba(233, 69, 96, 0.2);
  border-color: rgba(233, 69, 96, 0.5);
  color: var(--primary);
  animation: activePulse 2s ease-in-out infinite;
}

@keyframes activePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0); }
  50% { box-shadow: 0 0 12px 2px rgba(233, 69, 96, 0.3); }
}

.stage-item.locked .stage-node {
  opacity: 0.5;
}

.stage-check {
  font-size: 16px;
}

.stage-lock {
  font-size: 14px;
}

.stage-content {
  flex: 1;
  min-width: 0;
}

.stage-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  display: inline;
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stage-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
}

.stage-badge.done {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.stage-badge.current {
  background: rgba(233, 69, 96, 0.15);
  color: var(--primary);
}

.stage-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
}

.stage-details {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.materials-req {
  margin-bottom: 10px;
}

.req-label {
  font-size: 12px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 6px;
}

.req-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.req-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.req-item.fulfilled {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.req-rarity {
  font-weight: 600;
}

.req-count {
  color: var(--text-secondary);
}

.req-item.fulfilled .req-count {
  color: #22c55e;
}

.stage-cost,
.stage-rewards {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.cost-label,
.reward-label {
  margin-right: 6px;
}

.cost-value {
  color: #fbbf24;
  font-weight: 600;
}

.reward-item {
  margin-right: 10px;
}

.reward-item.card-reward {
  color: #a855f7;
  font-weight: 600;
}

.start-stage-btn {
  margin-top: 10px;
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.active-section {
  padding-top: 8px;
}

.active-header {
  padding: 18px;
  margin-bottom: 16px;
}

.active-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.active-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.active-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.active-topic {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 2px 0 0 0;
}

.cancel-btn {
  margin-left: auto;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.submit-section {
  padding: 18px;
  margin-bottom: 16px;
}

.submit-section .section-title {
  font-size: 16px;
  margin-bottom: 14px;
}

.submit-materials {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.submit-material-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.submit-material-card.fulfilled {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.mat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mat-rarity {
  font-size: 13px;
  font-weight: 700;
}

.mat-progress {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.submit-material-card.fulfilled .mat-progress {
  color: #22c55e;
}

.mat-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.mat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.mat-inventory {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.submit-btn {
  width: 100%;
}

.complete-section {
  margin-bottom: 16px;
  text-align: center;
}

.complete-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

.complete-btn:disabled {
  background: linear-gradient(135deg, #4b5563, #6b7280);
  box-shadow: none;
  opacity: 0.7;
}

.complete-icon {
  font-size: 20px;
}

.complete-cost {
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  font-size: 13px;
}

.complete-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.preview-card {
  padding: 16px;
  border: 1px dashed rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-icon {
  font-size: 18px;
}

.preview-label {
  font-size: 12px;
  color: #a855f7;
  font-weight: 600;
}

.preview-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.preview-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.cards-header {
  margin-bottom: 20px;
}

.cards-stats {
  margin-top: 8px;
}

.stats-text {
  font-size: 14px;
  font-weight: 600;
  color: #a855f7;
}

.card-filter {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 20px;
  padding-bottom: 4px;
}

.filter-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: #a855f7;
  border-color: #a855f7;
  color: white;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.knowledge-card {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid var(--card-color);
}

.knowledge-card:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.knowledge-card.locked {
  opacity: 0.5;
  border-left-style: dashed;
}

.kcard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kcard-icon {
  font-size: 24px;
}

.kcard-category {
  font-size: 11px;
  font-weight: 700;
}

.kcard-lock {
  font-size: 16px;
}

.kcard-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.kcard-excerpt {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.kcard-minerals {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.kcard-mineral-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.kcard-mineral-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.kcard-mineral-tag:hover {
  background: rgba(255, 255, 255, 0.1);
}

.kcard-source {
  font-size: 10px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
}

.card-detail-modal {
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.modal-title-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-card-icon {
  font-size: 36px;
}

.modal-card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-card-category {
  font-size: 12px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.modal-card-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.8;
  margin: 0 0 20px 0;
}

.modal-related {
  margin-bottom: 16px;
}

.modal-related-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px 0;
}

.modal-related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-related-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-related-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.related-emoji {
  font-size: 24px;
}

.related-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.related-rarity {
  font-size: 11px;
  font-weight: 700;
}

.modal-source {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-actions .btn {
  flex: 1;
}

.result-modal {
  text-align: center;
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
}

.result-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.result-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 18px;
  animation: sparkleAnim 2s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes sparkleAnim {
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

.result-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.result-stage {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

.result-rewards {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.result-reward {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reward-icon {
  font-size: 18px;
}

.reward-value {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
}

.result-card-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 14px;
  margin-bottom: 24px;
}

.result-card-icon {
  font-size: 32px;
}

.result-card-label {
  font-size: 11px;
  color: #a855f7;
  font-weight: 600;
}

.result-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 2px 0 0 0;
}

.result-close-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary), #a855f7);
}

.research-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 5000;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 90%;
  text-align: center;
}

.research-toast.success {
  background: rgba(34, 197, 94, 0.95);
  color: white;
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.research-toast.error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.toast-enter-active {
  animation: toastIn 0.3s ease;
}

.toast-leave-active {
  animation: toastOut 0.3s ease;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: white;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.6);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, #475569, #64748b);
  box-shadow: 0 4px 15px rgba(71, 85, 105, 0.4);
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}

@media (min-width: 600px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .category-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .submit-materials {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .header-section {
    flex-direction: column;
    gap: 12px;
  }

  .submit-materials {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
