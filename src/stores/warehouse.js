import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './game'
import { useMuseumStore } from './museum'
import { RARITY, RARITY_CONFIG } from '@/data/rarity'
import { MINERALS, getMineralById } from '@/data/minerals'
import { SEASONS } from '@/data/season'
import { EXPEDITION_LOCATIONS } from '@/data/expeditions'

export const SOURCE_TYPES = {
  COLLAGE: 'collage',
  EXPEDITION: 'expedition',
  MARKET: 'market',
  EXCHANGE: 'exchange',
  GACHA: 'gacha',
  SEASON: 'season',
  QUIZ: 'quiz'
}

export const SOURCE_CONFIG = {
  [SOURCE_TYPES.COLLAGE]: {
    name: '拼装',
    emoji: '🎨',
    color: '#e94560'
  },
  [SOURCE_TYPES.EXPEDITION]: {
    name: '探险',
    emoji: '🗺️',
    color: '#3b82f6'
  },
  [SOURCE_TYPES.MARKET]: {
    name: '市场',
    emoji: '🏪',
    color: '#f59e0b'
  },
  [SOURCE_TYPES.EXCHANGE]: {
    name: '交换',
    emoji: '🔄',
    color: '#06b6d4'
  },
  [SOURCE_TYPES.GACHA]: {
    name: '盲盒',
    emoji: '🎁',
    color: '#a855f7'
  },
  [SOURCE_TYPES.SEASON]: {
    name: '赛季',
    emoji: '🏆',
    color: '#ec4899'
  },
  [SOURCE_TYPES.QUIZ]: {
    name: '问答',
    emoji: '❓',
    color: '#10b981'
  }
}

export const SORT_OPTIONS = [
  { value: 'rarity_desc', label: '稀有度降序', icon: '💎' },
  { value: 'rarity_asc', label: '稀有度升序', icon: '💎' },
  { value: 'count_desc', label: '数量降序', icon: '📦' },
  { value: 'count_asc', label: '数量升序', icon: '📦' },
  { value: 'date_desc', label: '最新获取', icon: '📅' },
  { value: 'date_asc', label: '最早获取', icon: '📅' },
  { value: 'favorite', label: '收藏优先', icon: '❤️' },
  { value: 'name_asc', label: '名称A-Z', icon: '🔤' },
  { value: 'value_desc', label: '价值降序', icon: '💰' }
]

export const useWarehouseStore = defineStore('warehouse', () => {
  const gameStore = useGameStore()
  const museumStore = useMuseumStore()

  const activeFilters = ref({
    rarity: [],
    source: [],
    hasDuplicates: false,
    searchText: '',
    minCount: 1
  })

  const sortBy = ref('rarity_desc')
  const groupByDuplicates = ref(true)
  const selectedMineralIds = ref([])
  const batchMode = ref(false)

  const getAllMinerals = () => {
    const all = []
    for (const m of MINERALS) {
      all.push(m)
    }
    for (const season of SEASONS) {
      if (season.limitedSpecimens) {
        for (const specimen of season.limitedSpecimens) {
          all.push({ ...specimen, seasonExclusive: true, seasonId: season.id, seasonName: season.name })
        }
      }
    }
    return all
  }

  const collectedMineralsWithDetails = computed(() => {
    return gameStore.collectedMinerals.map(cm => {
      const mineralData = getMineralById(cm.id) || getAllMinerals().find(m => m.id === cm.id)
      const sources = cm.sources || generateMockSources(cm)
      
      return {
        ...cm,
        ...mineralData,
        sources,
        isFavorite: museumStore.isFavorite(cm.id),
        firstObtainedAt: Math.min(...sources.map(s => s.obtainedAt)),
        lastObtainedAt: Math.max(...sources.map(s => s.obtainedAt)),
        sourceBreakdown: getSourceBreakdown(sources),
        locationBreakdown: getLocationBreakdown(sources),
        estimatedValue: calculateEstimatedValue(cm, mineralData)
      }
    })
  })

  const generateMockSources = (mineral) => {
    const sources = []
    const sourceTypes = Object.values(SOURCE_TYPES)
    const locations = EXPEDITION_LOCATIONS.map(l => ({ id: l.id, name: l.name }))
    const boxTypes = ['basic', 'advanced', 'legendary']
    const boxNames = ['普通盲盒', '高级盲盒', '传说盲盒']
    
    for (let i = 0; i < mineral.count; i++) {
      const sourceType = sourceTypes[Math.floor(Math.random() * sourceTypes.length)]
      let sourceData = {}
      
      switch (sourceType) {
        case SOURCE_TYPES.EXPEDITION:
          sourceData = { ...locations[Math.floor(Math.random() * locations.length)] }
          break
        case SOURCE_TYPES.GACHA:
          const boxIndex = Math.floor(Math.random() * boxTypes.length)
          sourceData = {
            boxType: boxTypes[boxIndex],
            boxName: boxNames[boxIndex],
            isPity: Math.random() < 0.1
          }
          break
        case SOURCE_TYPES.COLLAGE:
          sourceData = {
            timeTaken: Math.floor(Math.random() * 60) + 20
          }
          break
        case SOURCE_TYPES.EXCHANGE:
          sourceData = {
            type: 'rarity_conversion',
            fromRarity: mineral.rarity,
            coinCost: Math.floor(Math.random() * 500) + 100
          }
          break
        case SOURCE_TYPES.SEASON:
          const season = SEASONS[Math.floor(Math.random() * SEASONS.length)]
          sourceData = {
            type: 'pass_reward',
            seasonId: season?.id,
            seasonName: season?.name,
            tier: Math.floor(Math.random() * 50) + 1
          }
          break
        case SOURCE_TYPES.QUIZ:
          sourceData = {
            type: 'reward_unlock',
            rarity: mineral.rarity,
            cost: Math.floor(Math.random() * 100) + 20
          }
          break
        case SOURCE_TYPES.MARKET:
          sourceData = {
            price: Math.floor(Math.random() * 1000) + 100
          }
          break
      }
      
      sources.push({
        source: sourceType,
        sourceData,
        obtainedAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
      })
    }
    return sources
  }

  const getSourceBreakdown = (sources) => {
    const breakdown = {}
    for (const s of sources) {
      breakdown[s.source] = (breakdown[s.source] || 0) + 1
    }
    return breakdown
  }

  const getLocationBreakdown = (sources) => {
    const breakdown = {}
    for (const s of sources) {
      if (s.source === SOURCE_TYPES.EXPEDITION && s.sourceData?.locationName) {
        breakdown[s.sourceData.locationName] = (breakdown[s.sourceData.locationName] || 0) + 1
      }
    }
    return breakdown
  }

  const calculateEstimatedValue = (mineral, mineralData) => {
    if (!mineralData) return 0
    const rarityMultiplier = {
      [RARITY.COMMON]: 10,
      [RARITY.UNCOMMON]: 25,
      [RARITY.RARE]: 100,
      [RARITY.EPIC]: 500,
      [RARITY.LEGENDARY]: 2500
    }
    return (rarityMultiplier[mineralData.rarity] || 10) * mineral.count
  }

  const duplicateGroups = computed(() => {
    return collectedMineralsWithDetails.value
      .filter(m => m.count > 1)
      .sort((a, b) => b.count - a.count)
  })

  const filteredMinerals = computed(() => {
    let minerals = [...collectedMineralsWithDetails.value]

    if (activeFilters.value.rarity.length > 0) {
      minerals = minerals.filter(m => activeFilters.value.rarity.includes(m.rarity))
    }

    if (activeFilters.value.source.length > 0) {
      minerals = minerals.filter(m => {
        return activeFilters.value.source.some(s => m.sourceBreakdown[s] > 0)
      })
    }

    if (activeFilters.value.hasDuplicates) {
      minerals = minerals.filter(m => m.count > 1)
    }

    if (activeFilters.value.minCount > 1) {
      minerals = minerals.filter(m => m.count >= activeFilters.value.minCount)
    }

    if (activeFilters.value.searchText) {
      const search = activeFilters.value.searchText.toLowerCase()
      minerals = minerals.filter(m => 
        m.name.toLowerCase().includes(search) ||
        m.nameEn?.toLowerCase().includes(search) ||
        m.formula?.toLowerCase().includes(search)
      )
    }

    return sortMinerals(minerals, sortBy.value)
  })

  const sortMinerals = (minerals, sortOption) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
    
    return [...minerals].sort((a, b) => {
      switch (sortOption) {
        case 'rarity_desc':
          return rarityOrder[a.rarity] - rarityOrder[b.rarity]
        case 'rarity_asc':
          return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        case 'count_desc':
          return b.count - a.count
        case 'count_asc':
          return a.count - b.count
        case 'date_desc':
          return b.lastObtainedAt - a.lastObtainedAt
        case 'date_asc':
          return a.firstObtainedAt - b.firstObtainedAt
        case 'favorite':
          if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1
          return rarityOrder[a.rarity] - rarityOrder[b.rarity]
        case 'name_asc':
          return a.name.localeCompare(b.name, 'zh-CN')
        case 'value_desc':
          return b.estimatedValue - a.estimatedValue
        default:
          return rarityOrder[a.rarity] - rarityOrder[b.rarity]
      }
    })
  }

  const stats = computed(() => {
    const minerals = collectedMineralsWithDetails.value
    const totalSpecimens = minerals.reduce((sum, m) => sum + m.count, 0)
    const duplicateCount = minerals.filter(m => m.count > 1).reduce((sum, m) => sum + m.count - 1, 0)
    const totalValue = minerals.reduce((sum, m) => sum + m.estimatedValue, 0)

    const sourceStats = {}
    for (const type of Object.values(SOURCE_TYPES)) {
      sourceStats[type] = 0
    }
    for (const m of minerals) {
      for (const [source, count] of Object.entries(m.sourceBreakdown)) {
        sourceStats[source] = (sourceStats[source] || 0) + count
      }
    }

    const rarityStats = {}
    for (const rarity of Object.values(RARITY)) {
      rarityStats[rarity] = {
        typeCount: 0,
        specimenCount: 0
      }
    }
    for (const m of minerals) {
      rarityStats[m.rarity].typeCount++
      rarityStats[m.rarity].specimenCount += m.count
    }

    return {
      totalTypes: minerals.length,
      totalSpecimens,
      duplicateCount,
      totalValue,
      sourceStats,
      rarityStats,
      favoriteCount: minerals.filter(m => m.isFavorite).length
    }
  })

  const setFilter = (filterType, value) => {
    activeFilters.value[filterType] = value
  }

  const toggleFilter = (filterType, value) => {
    const current = activeFilters.value[filterType]
    if (Array.isArray(current)) {
      const index = current.indexOf(value)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }
    } else {
      activeFilters.value[filterType] = !activeFilters.value[filterType]
    }
  }

  const clearFilters = () => {
    activeFilters.value = {
      rarity: [],
      source: [],
      hasDuplicates: false,
      searchText: '',
      minCount: 1
    }
    sortBy.value = 'rarity_desc'
  }

  const setSortBy = (value) => {
    sortBy.value = value
  }

  const toggleGroupByDuplicates = () => {
    groupByDuplicates.value = !groupByDuplicates.value
  }

  const toggleSelectMineral = (id) => {
    const index = selectedMineralIds.value.indexOf(id)
    if (index > -1) {
      selectedMineralIds.value.splice(index, 1)
    } else {
      selectedMineralIds.value.push(id)
    }
  }

  const selectAll = () => {
    selectedMineralIds.value = filteredMinerals.value.map(m => m.id)
  }

  const clearSelection = () => {
    selectedMineralIds.value = []
  }

  const toggleBatchMode = () => {
    batchMode.value = !batchMode.value
    if (!batchMode.value) {
      clearSelection()
    }
  }

  const getMineralSources = (id) => {
    const mineral = collectedMineralsWithDetails.value.find(m => m.id === id)
    return mineral?.sources || []
  }

  const getCollectedMineralById = (id) => {
    return collectedMineralsWithDetails.value.find(m => m.id === id)
  }

  return {
    activeFilters,
    sortBy,
    groupByDuplicates,
    selectedMineralIds,
    batchMode,
    collectedMineralsWithDetails,
    filteredMinerals,
    duplicateGroups,
    stats,
    setFilter,
    toggleFilter,
    clearFilters,
    setSortBy,
    toggleGroupByDuplicates,
    toggleSelectMineral,
    selectAll,
    clearSelection,
    toggleBatchMode,
    getMineralSources,
    getCollectedMineralById,
    SOURCE_CONFIG,
    SORT_OPTIONS
  }
})
