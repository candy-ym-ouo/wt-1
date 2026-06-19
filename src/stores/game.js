import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MINERALS, getMineralById, getRandomMineralByRarity } from '@/data/minerals'
import { getRarityByProbability, RARITY_CONFIG } from '@/data/rarity'

const STORAGE_KEY = 'mineral_collage_progress'

export const useGameStore = defineStore('game', () => {
  const collectedMinerals = ref([])
  const currentCollage = ref(null)
  const collagePieces = ref([])
  const completedCollages = ref([])
  const coins = ref(100)
  const totalCollages = ref(0)
  const showNewMineralModal = ref(false)
  const newMineral = ref(null)
  const isNewMineral = ref(false)

  const allMinerals = computed(() => MINERALS)

  const collectionProgress = computed(() => {
    return {
      collected: collectedMinerals.value.length,
      total: MINERALS.length,
      percentage: Math.round((collectedMinerals.value.length / MINERALS.length) * 100)
    }
  })

  const isMineralCollected = (mineralId) => {
    return collectedMinerals.value.some(m => m.id === mineralId)
  }

  const collectMineral = (mineral) => {
    if (!isMineralCollected(mineral.id)) {
      collectedMinerals.value.push({
        ...mineral,
        collectedAt: Date.now(),
        count: 1
      })
      saveProgress()
      return true
    } else {
      const existing = collectedMinerals.value.find(m => m.id === mineral.id)
      existing.count++
      coins.value += 10
      saveProgress()
      return false
    }
  }

  const startNewCollage = (mineral = null) => {
    let targetMineral = mineral
    if (!targetMineral) {
      const rarity = getRarityByProbability()
      targetMineral = getRandomMineralByRarity(rarity)
    }

    const pieceCount = RARITY_CONFIG[targetMineral.rarity].pieceCount
    const pieces = generateCollagePieces(targetMineral, pieceCount)

    currentCollage.value = targetMineral
    collagePieces.value = pieces
    totalCollages.value++

    saveProgress()
    return { mineral: targetMineral, pieces }
  }

  const generateCollagePieces = (mineral, count) => {
    const pieces = []
    const centerX = 200
    const centerY = 200
    const radius = 120

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const targetX = centerX + Math.cos(angle) * radius
      const targetY = centerY + Math.sin(angle) * radius

      pieces.push({
        id: i,
        mineralId: mineral.id,
        index: i,
        total: count,
        targetX,
        targetY,
        startX: Math.random() * 300 + 50,
        startY: Math.random() * 300 + 50,
        currentX: 0,
        currentY: 0,
        isPlaced: false,
        isDragging: false,
        rotation: Math.random() * 360 - 180,
        size: 40 + Math.random() * 20,
        color: mineral.colors[i % mineral.colors.length],
        shape: ['hexagon', 'diamond', 'triangle', 'pentagon'][i % 4]
      })
    }

    return shuffleArray([...pieces])
  }

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const placePiece = (pieceId) => {
    const piece = collagePieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.isPlaced = true
      piece.currentX = piece.targetX
      piece.currentY = piece.targetY
      saveProgress()
      return checkCollageComplete()
    }
    return false
  }

  const updatePiecePosition = (pieceId, x, y) => {
    const piece = collagePieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.currentX = x
      piece.currentY = y
    }
  }

  const checkCollageComplete = () => {
    const allPlaced = collagePieces.value.every(p => p.isPlaced)
    if (allPlaced && currentCollage.value) {
      const isNew = collectMineral(currentCollage.value)
      coins.value += RARITY_CONFIG[currentCollage.value.rarity].starCount * 20

      completedCollages.value.push({
        mineral: currentCollage.value,
        completedAt: Date.now(),
        timeTaken: Math.floor(Math.random() * 60) + 30
      })

      newMineral.value = currentCollage.value
      isNewMineral.value = isNew
      showNewMineralModal.value = true

      saveProgress()
      return true
    }
    return false
  }

  const closeNewMineralModal = () => {
    showNewMineralModal.value = false
    newMineral.value = null
    currentCollage.value = null
    collagePieces.value = []
  }

  const resetCurrentCollage = () => {
    currentCollage.value = null
    collagePieces.value = []
  }

  const saveProgress = () => {
    const progress = {
      collectedMinerals: collectedMinerals.value,
      completedCollages: completedCollages.value,
      coins: coins.value,
      totalCollages: totalCollages.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        collectedMinerals.value = progress.collectedMinerals || []
        completedCollages.value = progress.completedCollages || []
        coins.value = progress.coins ?? 100
        totalCollages.value = progress.totalCollages || 0
      }
    } catch (e) {
      console.error('Failed to load progress:', e)
    }
  }

  const resetProgress = () => {
    collectedMinerals.value = []
    completedCollages.value = []
    coins.value = 100
    totalCollages.value = 0
    currentCollage.value = null
    collagePieces.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  const getMineral = (id) => getMineralById(id)

  return {
    collectedMinerals,
    currentCollage,
    collagePieces,
    completedCollages,
    coins,
    totalCollages,
    showNewMineralModal,
    newMineral,
    isNewMineral,
    allMinerals,
    collectionProgress,
    isMineralCollected,
    collectMineral,
    startNewCollage,
    placePiece,
    updatePiecePosition,
    checkCollageComplete,
    closeNewMineralModal,
    resetCurrentCollage,
    saveProgress,
    loadProgress,
    resetProgress,
    getMineral
  }
})
