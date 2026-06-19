import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './game'
import {
  RESEARCH_TOPICS,
  CATEGORY_CONFIG,
  getTopicById,
  getAllKnowledgeCards,
  getKnowledgeCardById,
  getKnowledgeCardsByCategory,
  getKnowledgeCardsByMineralId
} from '@/data/research'
import { RARITY_CONFIG } from '@/data/rarity'
import { MINERALS, getMineralById, getMineralsByRarity } from '@/data/minerals'

const STORAGE_KEY = 'mineral_research_progress'

export const useResearchStore = defineStore('research', () => {
  const gameStore = useGameStore()

  const completedStages = ref([])
  const unlockedCards = ref([])
  const activeResearch = ref(null)
  const submittedMaterials = ref({})
  const researchHistory = ref([])
  const researchPoints = ref(0)

  const allTopics = computed(() => RESEARCH_TOPICS)

  const allCards = computed(() => getAllKnowledgeCards())

  const isStageCompleted = (stageId) => {
    return completedStages.value.includes(stageId)
  }

  const isCardUnlocked = (cardId) => {
    return unlockedCards.value.some(c => c.id === cardId)
  }

  const getStageProgress = (stageId) => {
    return submittedMaterials.value[stageId] || {}
  }

  const getTopicProgress = (topicId) => {
    const topic = getTopicById(topicId)
    if (!topic) return { completed: 0, total: 0, percentage: 0 }
    const completed = topic.stages.filter(s => completedStages.value.includes(s.id)).length
    return {
      completed,
      total: topic.stages.length,
      percentage: Math.round((completed / topic.stages.length) * 100)
    }
  }

  const isStageUnlocked = (topicId, stageIndex) => {
    if (stageIndex === 0) return true
    const topic = getTopicById(topicId)
    if (!topic) return false
    const prevStage = topic.stages[stageIndex - 1]
    return completedStages.value.includes(prevStage.id)
  }

  const getCollectedMineralsByRarity = (rarity) => {
    return gameStore.collectedMinerals.filter(m => m.rarity === rarity)
  }

  const getAvailableMineralsForStage = (stageId) => {
    const topic = RESEARCH_TOPICS.find(t => t.stages.some(s => s.id === stageId))
    if (!topic) return []
    const stage = topic.stages.find(s => s.id === stageId)
    if (!stage) return []

    const progress = submittedMaterials.value[stageId] || {}
    const available = []

    for (const req of stage.requiredMaterials) {
      const submitted = progress[req.rarity] || 0
      const remaining = req.count - submitted
      if (remaining > 0) {
        const minerals = getCollectedMineralsByRarity(req.rarity)
        for (const m of minerals) {
          if (m.count > 0) {
            available.push({
              ...m,
              rarity: req.rarity,
              remaining,
              required: req.count
            })
          }
        }
      }
    }

    return available
  }

  const canSubmitMaterial = (stageId, rarity) => {
    const topic = RESEARCH_TOPICS.find(t => t.stages.some(s => s.id === stageId))
    if (!topic) return false
    const stage = topic.stages.find(s => s.id === stageId)
    if (!stage) return false

    const req = stage.requiredMaterials.find(r => r.rarity === rarity)
    if (!req) return false

    const progress = submittedMaterials.value[stageId] || {}
    const submitted = progress[rarity] || 0
    if (submitted >= req.count) return false

    const collected = getCollectedMineralsByRarity(rarity)
    return collected.length > 0
  }

  const submitMaterial = (stageId, rarity) => {
    const topic = RESEARCH_TOPICS.find(t => t.stages.some(s => s.id === stageId))
    if (!topic) return { success: false, message: '课题不存在' }
    const stage = topic.stages.find(s => s.id === stageId)
    if (!stage) return { success: false, message: '阶段不存在' }

    const req = stage.requiredMaterials.find(r => r.rarity === rarity)
    if (!req) return { success: false, message: '不需要该材料' }

    if (!submittedMaterials.value[stageId]) {
      submittedMaterials.value[stageId] = {}
    }
    const submitted = submittedMaterials.value[stageId][rarity] || 0
    if (submitted >= req.count) return { success: false, message: '该材料已满足' }

    const collected = getCollectedMineralsByRarity(rarity)
    if (collected.length === 0) return { success: false, message: '没有该稀有度的矿物' }

    const mineral = collected[Math.floor(Math.random() * collected.length)]
    if (mineral.count <= 0) return { success: false, message: '矿物数量不足' }

    mineral.count--

    if (mineral.count <= 0) {
      const idx = gameStore.collectedMinerals.findIndex(m => m.id === mineral.id)
      if (idx > -1) {
        gameStore.collectedMinerals.splice(idx, 1)
      }
    }

    submittedMaterials.value[stageId][rarity] = submitted + 1

    saveProgress()
    return { success: true, message: `提交了 ${mineral.name}`, mineral }
  }

  const submitMaterialByMineralId = (stageId, mineralId) => {
    const topic = RESEARCH_TOPICS.find(t => t.stages.some(s => s.id === stageId))
    if (!topic) return { success: false, message: '课题不存在' }
    const stage = topic.stages.find(s => s.id === stageId)
    if (!stage) return { success: false, message: '阶段不存在' }

    const mineral = gameStore.collectedMinerals.find(m => m.id === mineralId)
    if (!mineral || mineral.count <= 0) return { success: false, message: '矿物不存在或数量不足' }

    const rarity = mineral.rarity
    const req = stage.requiredMaterials.find(r => r.rarity === rarity)
    if (!req) return { success: false, message: '不需要该稀有度的材料' }

    if (!submittedMaterials.value[stageId]) {
      submittedMaterials.value[stageId] = {}
    }
    const submitted = submittedMaterials.value[stageId][rarity] || 0
    if (submitted >= req.count) return { success: false, message: '该材料已满足' }

    mineral.count--
    if (mineral.count <= 0) {
      const idx = gameStore.collectedMinerals.findIndex(m => m.id === mineral.id)
      if (idx > -1) {
        gameStore.collectedMinerals.splice(idx, 1)
      }
    }

    submittedMaterials.value[stageId][rarity] = submitted + 1

    saveProgress()
    return { success: true, message: `提交了 ${mineral.name}`, mineral }
  }

  const canCompleteStage = (stageId) => {
    const topic = RESEARCH_TOPICS.find(t => t.stages.some(s => s.id === stageId))
    if (!topic) return false
    const stage = topic.stages.find(s => s.id === stageId)
    if (!stage) return false

    if (gameStore.coins < stage.coinCost) return false

    const progress = submittedMaterials.value[stageId] || {}
    for (const req of stage.requiredMaterials) {
      if ((progress[req.rarity] || 0) < req.count) return false
    }
    return true
  }

  const completeStage = (stageId) => {
    if (!canCompleteStage(stageId)) return { success: false, message: '条件未满足' }

    const topic = RESEARCH_TOPICS.find(t => t.stages.some(s => s.id === stageId))
    if (!topic) return { success: false, message: '课题不存在' }
    const stage = topic.stages.find(s => s.id === stageId)
    if (!stage) return { success: false, message: '阶段不存在' }

    gameStore.coins -= stage.coinCost
    
    gameStore.addCoinTransaction('research_cost', stage.coinCost, `研究消耗: ${stage.name}`, {
      stageId,
      stageName: stage.name,
      topicId: topic.id,
      topicName: topic.name,
      difficulty: topic.difficulty
    })

    if (stage.rewards.coins) {
      gameStore.coins += stage.rewards.coins
      
      gameStore.addCoinTransaction('research_reward', stage.rewards.coins, `研究奖励: ${stage.name}`, {
        stageId,
        stageName: stage.name,
        topicId: topic.id,
        topicName: topic.name,
        difficulty: topic.difficulty
      })
    }
    if (stage.rewards.exp) {
      gameStore.addExp(stage.rewards.exp)
    }

    completedStages.value.push(stageId)

    researchPoints.value += 10 * topic.difficulty

    if (stage.knowledgeCard) {
      unlockedCards.value.push({
        id: stage.knowledgeCard.id,
        unlockedAt: Date.now(),
        topicId: topic.id,
        stageId: stage.id
      })
    }

    researchHistory.value.unshift({
      stageId,
      topicName: topic.name,
      stageName: stage.name,
      completedAt: Date.now(),
      rewards: stage.rewards
    })
    if (researchHistory.value.length > 100) {
      researchHistory.value = researchHistory.value.slice(0, 100)
    }

    gameStore.emitTaskEvent('researchComplete', stage.rewards)

    activeResearch.value = null
    submittedMaterials.value[stageId] = {}

    saveProgress()
    gameStore.saveProgress()

    return {
      success: true,
      message: `完成研究: ${stage.name}`,
      knowledgeCard: stage.knowledgeCard,
      rewards: stage.rewards
    }
  }

  const startResearch = (topicId, stageId) => {
    const topic = getTopicById(topicId)
    if (!topic) return { success: false, message: '课题不存在' }

    const stageIndex = topic.stages.findIndex(s => s.id === stageId)
    if (stageIndex < 0) return { success: false, message: '阶段不存在' }
    if (!isStageUnlocked(topicId, stageIndex)) return { success: false, message: '前置阶段未完成' }
    if (completedStages.value.includes(stageId)) return { success: false, message: '阶段已完成' }

    activeResearch.value = {
      topicId,
      stageId,
      startedAt: Date.now()
    }

    if (!submittedMaterials.value[stageId]) {
      submittedMaterials.value[stageId] = {}
    }

    saveProgress()
    return { success: true }
  }

  const cancelResearch = () => {
    if (activeResearch.value) {
      const stageId = activeResearch.value.stageId
      const progress = submittedMaterials.value[stageId] || {}

      for (const [rarity, count] of Object.entries(progress)) {
        if (count > 0) {
          const minerals = getCollectedMineralsByRarity(rarity)
          for (let i = 0; i < count; i++) {
            if (minerals.length > 0) {
              minerals[0].count++
            } else {
              const mineralData = getMineralsByRarity(rarity)
              if (mineralData.length > 0) {
                const m = mineralData[0]
                gameStore.collectedMinerals.push({
                  ...m,
                  collectedAt: Date.now(),
                  count: 1,
                  sources: [{ source: 'research_refund', sourceData: {}, obtainedAt: Date.now() }]
                })
              }
            }
          }
        }
      }

      submittedMaterials.value[stageId] = {}
    }

    activeResearch.value = null
    saveProgress()
    gameStore.saveProgress()
  }

  const getCardsForMineral = (mineralId) => {
    return getKnowledgeCardsByMineralId(mineralId).filter(c =>
      unlockedCards.value.some(uc => uc.id === c.id)
    )
  }

  const totalProgress = computed(() => {
    let completed = 0
    let total = 0
    for (const topic of RESEARCH_TOPICS) {
      for (const stage of topic.stages) {
        total++
        if (completedStages.value.includes(stage.id)) completed++
      }
    }
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  const cardStats = computed(() => {
    const total = getAllKnowledgeCards().length
    const unlocked = unlockedCards.value.length
    return {
      total,
      unlocked,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0
    }
  })

  const categoryStats = computed(() => {
    const stats = {}
    for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
      const topics = RESEARCH_TOPICS.filter(t => t.category === key)
      let stagesCompleted = 0
      let stagesTotal = 0
      for (const topic of topics) {
        for (const stage of topic.stages) {
          stagesTotal++
          if (completedStages.value.includes(stage.id)) stagesCompleted++
        }
      }
      stats[key] = {
        ...config,
        topicCount: topics.length,
        stagesCompleted,
        stagesTotal,
        percentage: stagesTotal > 0 ? Math.round((stagesCompleted / stagesTotal) * 100) : 0
      }
    }
    return stats
  })

  const saveProgress = () => {
    const data = {
      completedStages: completedStages.value,
      unlockedCards: unlockedCards.value,
      activeResearch: activeResearch.value,
      submittedMaterials: submittedMaterials.value,
      researchHistory: researchHistory.value,
      researchPoints: researchPoints.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        completedStages.value = data.completedStages || []
        unlockedCards.value = data.unlockedCards || []
        activeResearch.value = data.activeResearch || null
        submittedMaterials.value = data.submittedMaterials || {}
        researchHistory.value = data.researchHistory || []
        researchPoints.value = data.researchPoints || 0
      }
    } catch (e) {
      console.error('Failed to load research progress:', e)
    }
  }

  const resetProgress = () => {
    completedStages.value = []
    unlockedCards.value = []
    activeResearch.value = null
    submittedMaterials.value = {}
    researchHistory.value = []
    researchPoints.value = 0
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    completedStages,
    unlockedCards,
    activeResearch,
    submittedMaterials,
    researchHistory,
    researchPoints,
    allTopics,
    allCards,
    totalProgress,
    cardStats,
    categoryStats,
    isStageCompleted,
    isCardUnlocked,
    isStageUnlocked,
    getStageProgress,
    getTopicProgress,
    getAvailableMineralsForStage,
    getCollectedMineralsByRarity,
    canSubmitMaterial,
    submitMaterial,
    submitMaterialByMineralId,
    canCompleteStage,
    completeStage,
    startResearch,
    cancelResearch,
    getCardsForMineral,
    saveProgress,
    loadProgress,
    resetProgress
  }
})
