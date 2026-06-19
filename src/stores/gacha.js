import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  TICKET_CONFIG,
  BOX_CONFIG,
  PITY_CONFIG,
  TICKET_TYPES,
  BOX_TYPES,
  rollRarityByWeights,
  getTicketById,
  getBoxById,
  getPityConfig
} from '@/data/gacha'
import { getRandomMineralByRarity } from '@/data/minerals'
import { RARITY, RARITY_CONFIG } from '@/data/rarity'
import { useGameStore } from '@/stores/game'
import { useDetectorStore } from '@/stores/detector'

const STORAGE_KEY = 'mineral_gacha_progress'

export const useGachaStore = defineStore('gacha', () => {
  const tickets = ref({
    [TICKET_TYPES.BASIC]: 3,
    [TICKET_TYPES.ADVANCED]: 1,
    [TICKET_TYPES.LEGENDARY]: 0
  })

  const pityCounters = ref({
    [BOX_TYPES.BASIC]: 0,
    [BOX_TYPES.ADVANCED]: 0,
    [BOX_TYPES.LEGENDARY]: 0
  })

  const gachaHistory = ref([])

  const isAnimating = ref(false)
  const showResult = ref(false)
  const currentResults = ref(null)
  const showShopModal = ref(false)

  const totalTickets = computed(() => {
    return Object.values(tickets.value).reduce((sum, count) => sum + count, 0)
  })

  const hasTicket = (ticketType) => {
    return tickets.value[ticketType] > 0
  }

  const getTicketCount = (ticketType) => {
    return tickets.value[ticketType] || 0
  }

  const addTicket = (ticketType, count = 1) => {
    tickets.value[ticketType] = (tickets.value[ticketType] || 0) + count
    saveProgress()
  }

  const useTicket = (ticketType, count = 1) => {
    if (tickets.value[ticketType] >= count) {
      tickets.value[ticketType] -= count
      saveProgress()
      return true
    }
    return false
  }

  const buyTicket = async (ticketType) => {
    const ticket = getTicketById(ticketType)
    if (!ticket) return { success: false, message: '无效的券类型' }

    const gameStore = useGameStore()

    if (gameStore.coins < ticket.coinPrice) {
      return { success: false, message: '金币不足' }
    }

    gameStore.coins -= ticket.coinPrice
    tickets.value[ticketType] = (tickets.value[ticketType] || 0) + 1
    gameStore.emitTaskEvent?.('coinsEarned', -ticket.coinPrice)
    gameStore.saveProgress()
    saveProgress()

    return { success: true, message: `成功购买 ${ticket.name}` }
  }

  const buyTickets = async (ticketType, count = 10) => {
    const ticket = getTicketById(ticketType)
    if (!ticket) return { success: false, message: '无效的券类型' }

    const gameStore = useGameStore()
    const totalCost = ticket.coinPrice * count

    if (gameStore.coins < totalCost) {
      return { success: false, message: '金币不足' }
    }

    gameStore.coins -= totalCost
    tickets.value[ticketType] = (tickets.value[ticketType] || 0) + count
    gameStore.emitTaskEvent?.('coinsEarned', -totalCost)
    gameStore.saveProgress()
    saveProgress()

    return { success: true, message: `成功购买 ${count} 张 ${ticket.name}` }
  }

  const performGacha = async (boxType, count = 1) => {
    const box = getBoxById(boxType)
    if (!box) return { success: false, message: '无效的盲盒类型' }

    const ticketType = box.ticketType
    if (!useTicket(ticketType, count)) {
      return { success: false, message: '券数量不足' }
    }

    const pityConfig = getPityConfig(boxType)
    const ticket = getTicketById(ticketType)
    const detectorStore = useDetectorStore()
    const results = []
    let pityCount = pityCounters.value[boxType] || 0

    for (let i = 0; i < count; i++) {
      pityCount++
      let rarity

      if (pityConfig.enabled && pityCount >= pityConfig.pityCount) {
        rarity = pityConfig.guaranteedRarity
        pityCount = 0
      } else {
        let weights = { ...ticket.rarityWeights }
        weights = detectorStore.applySpecificRarityBoost(rarity, weights) || weights

        if (pityConfig.enabled && pityCount >= pityConfig.softPityStart) {
          const multiplier = pityConfig.softPityMultiplier
          Object.keys(weights).forEach(r => {
            const rLevel = getRarityLevel(r)
            const gLevel = getRarityLevel(pityConfig.guaranteedRarity)
            if (rLevel >= gLevel) {
              weights[r] *= multiplier
            }
          })
        }

        rarity = rollRarityByWeights(weights)
        rarity = detectorStore.applyRarityBoost(rarity)

        if (pityConfig.enabled) {
          const rLevel = getRarityLevel(rarity)
          const gLevel = getRarityLevel(pityConfig.guaranteedRarity)
          if (rLevel >= gLevel) {
            pityCount = 0
          }
        }
      }

      const mineral = getRandomMineralByRarity(rarity)
      results.push({
        mineral,
        rarity,
        isPity: pityConfig.enabled && pityCount === 0 && rarity === pityConfig.guaranteedRarity
      })
    }

    pityCounters.value[boxType] = pityCount

    const gameStore = useGameStore()

    results.forEach(result => {
      const isNew = gameStore.collectMineral(result.mineral)
      result.isNew = isNew
    })

    results.forEach(result => {
      gachaHistory.value.unshift({
        id: Date.now() + Math.random(),
        mineral: result.mineral,
        boxType,
        rarity: result.rarity,
        isNew: result.isNew,
        isPity: result.isPity,
        timestamp: Date.now()
      })
    })

    gachaHistory.value = gachaHistory.value.slice(0, 100)

    saveProgress()

    return { success: true, results }
  }

  const getRarityLevel = (rarity) => {
    const levels = {
      [RARITY.COMMON]: 0,
      [RARITY.UNCOMMON]: 1,
      [RARITY.RARE]: 2,
      [RARITY.EPIC]: 3,
      [RARITY.LEGENDARY]: 4
    }
    return levels[rarity] || 0
  }

  const setAnimating = (value) => {
    isAnimating.value = value
  }

  const showGachaResult = (results) => {
    currentResults.value = results
    showResult.value = true
  }

  const closeGachaResult = () => {
    showResult.value = false
    currentResults.value = null
  }

  const openShopModal = () => {
    showShopModal.value = true
  }

  const closeShopModal = () => {
    showShopModal.value = false
  }

  const saveProgress = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tickets: tickets.value,
        pityCounters: pityCounters.value,
        gachaHistory: gachaHistory.value,
        savedAt: Date.now()
      }))
    } catch (e) {
      console.error('Failed to save gacha progress:', e)
    }
  }

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        tickets.value = progress.tickets || {
          [TICKET_TYPES.BASIC]: 3,
          [TICKET_TYPES.ADVANCED]: 1,
          [TICKET_TYPES.LEGENDARY]: 0
        }
        pityCounters.value = progress.pityCounters || {
          [BOX_TYPES.BASIC]: 0,
          [BOX_TYPES.ADVANCED]: 0,
          [BOX_TYPES.LEGENDARY]: 0
        }
        gachaHistory.value = progress.gachaHistory || []
      }
    } catch (e) {
      console.error('Failed to load gacha progress:', e)
    }
  }

  return {
    tickets,
    pityCounters,
    gachaHistory,
    isAnimating,
    showResult,
    currentResults,
    showShopModal,
    totalTickets,
    hasTicket,
    getTicketCount,
    addTicket,
    useTicket,
    buyTicket,
    buyTickets,
    performGacha,
    setAnimating,
    showGachaResult,
    closeGachaResult,
    openShopModal,
    closeShopModal,
    saveProgress,
    loadProgress
  }
})
