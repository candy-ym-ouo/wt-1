import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { HALLS, getHallById } from '@/data/halls'
import { EXHIBITIONS, getExhibitionById, getActiveExhibitions } from '@/data/exhibitions'
import { MINERALS, getMineralById } from '@/data/minerals'
import { RARITY_CONFIG } from '@/data/rarity'

const STORAGE_KEY = 'mineral_museum_data'

export const useMuseumStore = defineStore('museum', () => {
  const mineralRatings = ref({})
  const mineralViews = ref({})
  const hallVisits = ref({})
  const exhibitionVisits = ref({})
  const userRatings = ref({})
  const favoriteMinerals = ref([])
  const totalVisitors = ref(125680)
  const todayVisitors = ref(342)

  const allHalls = computed(() => HALLS)
  const allExhibitions = computed(() => EXHIBITIONS)
  const activeExhibitions = computed(() => getActiveExhibitions())

  const museumStats = computed(() => {
    const totalMineralViews = Object.values(mineralViews.value).reduce((a, b) => a + b, 0)
    
    let totalRatingCount = 0
    let weightedRatingSum = 0
    Object.values(mineralRatings.value).forEach(rating => {
      totalRatingCount += rating.count
      weightedRatingSum += rating.average * rating.count
    })
    
    const avgRating = totalRatingCount > 0
      ? Number((weightedRatingSum / totalRatingCount).toFixed(1))
      : 0

    return {
      totalVisitors: totalVisitors.value,
      todayVisitors: todayVisitors.value,
      totalMinerals: MINERALS.length,
      totalHalls: HALLS.length,
      totalExhibitions: EXHIBITIONS.length,
      totalMineralViews,
      totalRatings: totalRatingCount,
      avgRating,
      favoriteCount: favoriteMinerals.value.length
    }
  })

  const getMineralRating = (mineralId) => {
    if (!mineralRatings.value[mineralId]) {
      const rarityStars = RARITY_CONFIG[getMineralById(mineralId)?.rarity]?.starCount || 3
      const baseRating = Number((3 + rarityStars * 0.3).toFixed(1))
      
      const dist = {
        1: Math.floor(Math.random() * 5),
        2: Math.floor(Math.random() * 10),
        3: Math.floor(Math.random() * 30),
        4: Math.floor(Math.random() * 60),
        5: Math.floor(Math.random() * 100)
      }
      
      const count = dist[1] + dist[2] + dist[3] + dist[4] + dist[5]
      
      let total = 0
      for (let i = 1; i <= 5; i++) {
        total += i * dist[i]
      }
      const average = Number((total / count).toFixed(1))
      
      mineralRatings.value[mineralId] = {
        average,
        count,
        distribution: dist
      }
    }
    return mineralRatings.value[mineralId]
  }

  const getMineralViews = (mineralId) => {
    if (!mineralViews.value[mineralId]) {
      mineralViews.value[mineralId] = Math.floor(Math.random() * 5000) + 500
    }
    return mineralViews.value[mineralId]
  }

  const getMineralPopularity = (mineralId) => {
    const views = getMineralViews(mineralId)
    const rating = getMineralRating(mineralId)
    const score = (views / 100) * rating.average + rating.count * 2

    if (score > 500) return { level: 'hot', label: '爆火', icon: '🔥', color: '#ef4444' }
    if (score > 300) return { level: 'trending', label: '热门', icon: '📈', color: '#f97316' }
    if (score > 150) return { level: 'warm', label: '受关注', icon: '💫', color: '#eab308' }
    return { level: 'normal', label: '普通', icon: '✨', color: '#6b7280' }
  }

  const getHallVisits = (hallId) => {
    if (!hallVisits.value[hallId]) {
      const hall = getHallById(hallId)
      hallVisits.value[hallId] = {
        total: Math.floor(Math.random() * 30000) + 10000,
        today: Math.floor(Math.random() * 200) + 20,
        week: Math.floor(Math.random() * 1500) + 300,
        current: Math.floor(Math.random() * (hall?.visitorCapacity || 100) * 0.6)
      }
    }
    return hallVisits.value[hallId]
  }

  const getExhibitionVisits = (exhibitionId) => {
    if (!exhibitionVisits.value[exhibitionId]) {
      const exhibition = getExhibitionById(exhibitionId)
      exhibitionVisits.value[exhibitionId] = {
        total: exhibition?.stats?.visitors || Math.floor(Math.random() * 20000) + 5000,
        today: Math.floor(Math.random() * 150) + 30,
        avgRating: exhibition?.stats?.rating || (Math.random() * 0.8 + 4).toFixed(1)
      }
    }
    return exhibitionVisits.value[exhibitionId]
  }

  const getUserRating = (mineralId) => {
    return userRatings.value[mineralId] || 0
  }

  const rateMineral = (mineralId, rating) => {
    const oldRating = userRatings.value[mineralId] || 0

    if (!mineralRatings.value[mineralId]) {
      getMineralRating(mineralId)
    }

    const data = mineralRatings.value[mineralId]

    if (oldRating > 0 && data.distribution[oldRating] > 0) {
      data.distribution[oldRating]--
      data.count--
    }

    data.distribution[rating] = (data.distribution[rating] || 0) + 1
    data.count++

    let total = 0
    let count = 0
    for (let i = 1; i <= 5; i++) {
      total += i * (data.distribution[i] || 0)
      count += data.distribution[i] || 0
    }
    data.average = count > 0 ? Number((total / count).toFixed(1)) : 0

    userRatings.value[mineralId] = rating

    saveData()
    return data
  }

  const toggleFavorite = (mineralId) => {
    const index = favoriteMinerals.value.indexOf(mineralId)
    if (index > -1) {
      favoriteMinerals.value.splice(index, 1)
    } else {
      favoriteMinerals.value.push(mineralId)
    }
    saveData()
    return favoriteMinerals.value.includes(mineralId)
  }

  const isFavorite = (mineralId) => {
    return favoriteMinerals.value.includes(mineralId)
  }

  const recordMineralView = (mineralId) => {
    mineralViews.value[mineralId] = (mineralViews.value[mineralId] || 0) + 1
    saveData()
  }

  const getHallMinerals = (hallId) => {
    const hall = getHallById(hallId)
    if (!hall) return []
    return hall.mineralIds.map(id => getMineralById(id)).filter(Boolean)
  }

  const getExhibitionMinerals = (exhibitionId) => {
    const exhibition = getExhibitionById(exhibitionId)
    if (!exhibition) return []
    return exhibition.mineralIds.map(id => getMineralById(id)).filter(Boolean)
  }

  const getTopRatedMinerals = (limit = 5) => {
    return [...MINERALS]
      .map(m => ({
        mineral: m,
        rating: getMineralRating(m.id)
      }))
      .sort((a, b) => b.rating.average - a.rating.average)
      .slice(0, limit)
  }

  const getTopViewedMinerals = (limit = 5) => {
    return [...MINERALS]
      .map(m => ({
        mineral: m,
        views: getMineralViews(m.id),
        popularity: getMineralPopularity(m.id)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  }

  const getHallsByPopularity = () => {
    return [...HALLS]
      .map(h => ({
        hall: h,
        visits: getHallVisits(h.id)
      }))
      .sort((a, b) => b.visits.total - a.visits.total)
  }

  const saveData = () => {
    const data = {
      mineralRatings: mineralRatings.value,
      mineralViews: mineralViews.value,
      hallVisits: hallVisits.value,
      exhibitionVisits: exhibitionVisits.value,
      userRatings: userRatings.value,
      favoriteMinerals: favoriteMinerals.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const validateAndFixRatingData = () => {
    Object.keys(mineralRatings.value).forEach(mineralId => {
      const rating = mineralRatings.value[mineralId]
      
      if (!rating.distribution) {
        rating.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
      
      let distSum = 0
      let weightedSum = 0
      for (let i = 1; i <= 5; i++) {
        const count = rating.distribution[i] || 0
        distSum += count
        weightedSum += i * count
      }
      
      if (rating.count !== distSum) {
        rating.count = distSum
      }
      
      if (distSum > 0) {
        const calculatedAvg = Number((weightedSum / distSum).toFixed(1))
        if (Math.abs(rating.average - calculatedAvg) > 0.1) {
          rating.average = calculatedAvg
        }
      }
      
      if (!rating.average || rating.average < 0 || rating.average > 5) {
        rating.average = distSum > 0 ? Number((weightedSum / distSum).toFixed(1)) : 0
      }
    })
  }

  const loadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        mineralRatings.value = data.mineralRatings || {}
        mineralViews.value = data.mineralViews || {}
        hallVisits.value = data.hallVisits || {}
        exhibitionVisits.value = data.exhibitionVisits || {}
        userRatings.value = data.userRatings || {}
        favoriteMinerals.value = data.favoriteMinerals || []
        
        validateAndFixRatingData()
      }
    } catch (e) {
      console.error('Failed to load museum data:', e)
    }
  }

  return {
    allHalls,
    allExhibitions,
    activeExhibitions,
    museumStats,
    favoriteMinerals,
    getMineralRating,
    getMineralViews,
    getMineralPopularity,
    getHallVisits,
    getExhibitionVisits,
    getUserRating,
    rateMineral,
    toggleFavorite,
    isFavorite,
    recordMineralView,
    getHallMinerals,
    getExhibitionMinerals,
    getTopRatedMinerals,
    getTopViewedMinerals,
    getHallsByPopularity,
    loadData,
    saveData
  }
})
