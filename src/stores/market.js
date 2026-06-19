import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MINERALS, getMineralById } from '@/data/minerals'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import { useGameStore } from './game'

const STORAGE_KEY = 'mineral_market_data'

const AUCTION_DURATION = 300000

const mockSellers = ['矿商老王', '宝石猎人', '收藏家老李', '探险家阿明', '矿物专家']

export const useMarketStore = defineStore('market', () => {
  const listings = ref([])
  const transactionHistory = ref([])
  const priceHistory = ref({})
  const showListModal = ref(false)
  const showBidModal = ref(false)
  const selectedListing = ref(null)
  const selectedMineralForList = ref(null)

  const gameStore = useGameStore()

  const activeListings = computed(() => {
    return listings.value.filter(l => l.status === 'active').sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
      const aMineral = getMineralById(a.mineralId)
      const bMineral = getMineralById(b.mineralId)
      if (!aMineral || !bMineral) return 0
      return rarityOrder[aMineral.rarity] - rarityOrder[bMineral.rarity]
    })
  })

  const myListings = computed(() => {
    return listings.value.filter(l => l.sellerId === 'player').sort((a, b) => b.createdAt - a.createdAt)
  })

  const myBids = computed(() => {
    return listings.value.filter(l => 
      l.bids && l.bids.some(b => b.bidderId === 'player')
    ).sort((a, b) => {
      const aBid = a.bids?.find(b => b.bidderId === 'player')
      const bBid = b.bids?.find(b => b.bidderId === 'player')
      return (bBid?.timestamp || 0) - (aBid?.timestamp || 0)
    })
  })

  const getBasePrice = (mineral) => {
    if (!mineral) return 0
    const config = RARITY_CONFIG[mineral.rarity]
    return config.basePrice
  }

  const getMarketPrice = (mineralId) => {
    const mineral = getMineralById(mineralId)
    if (!mineral) return 0
    
    const history = priceHistory.value[mineralId] || []
    if (history.length === 0) {
      return getBasePrice(mineral)
    }
    
    const recentPrices = history.slice(-10)
    const avgPrice = recentPrices.reduce((sum, h) => sum + h.price, 0) / recentPrices.length
    const fluctuation = (Math.random() - 0.5) * 0.2
    return Math.round(avgPrice * (1 + fluctuation))
  }

  const getPriceTrend = (mineralId) => {
    const history = priceHistory.value[mineralId] || []
    if (history.length < 2) return { trend: 'stable', change: 0 }
    
    const recentPrices = history.slice(-5)
    const oldPrices = history.slice(-10, -5)
    
    if (oldPrices.length === 0) return { trend: 'stable', change: 0 }
    
    const recentAvg = recentPrices.reduce((sum, h) => sum + h.price, 0) / recentPrices.length
    const oldAvg = oldPrices.reduce((sum, h) => sum + h.price, 0) / oldPrices.length
    const change = ((recentAvg - oldAvg) / oldAvg) * 100
    
    let trend = 'stable'
    if (change > 5) trend = 'up'
    else if (change < -5) trend = 'down'
    
    return { trend, change: Math.round(change * 10) / 10 }
  }

  const addMineralToPlayer = (mineralId) => {
    const mineral = getMineralById(mineralId)
    if (!mineral) return false
    
    const existing = gameStore.collectedMinerals.find(m => m.id === mineralId)
    if (existing) {
      existing.count++
    } else {
      gameStore.collectedMinerals.push({
        ...mineral,
        collectedAt: Date.now(),
        count: 1
      })
    }
    return true
  }
  
  const createListing = (mineralId, startPrice, duration = AUCTION_DURATION) => {
    const mineral = getMineralById(mineralId)
    if (!mineral) return null
    
    const collectedMineral = gameStore.collectedMinerals.find(m => m.id === mineralId)
    if (!collectedMineral || collectedMineral.count < 1) return null
    
    const basePrice = getBasePrice(mineral)
    const finalStartPrice = startPrice || Math.round(basePrice * (0.8 + Math.random() * 0.4))
    
    const listing = {
      id: Date.now(),
      mineralId,
      sellerId: 'player',
      sellerName: '我',
      startPrice: finalStartPrice,
      currentPrice: finalStartPrice,
      createdAt: Date.now(),
      endTime: Date.now() + duration,
      status: 'active',
      bids: [],
      winner: null
    }
    
    collectedMineral.count--
    if (collectedMineral.count === 0) {
      const index = gameStore.collectedMinerals.findIndex(m => m.id === mineralId)
      if (index > -1) {
        gameStore.collectedMinerals.splice(index, 1)
      }
    }
    
    listings.value.push(listing)
    saveMarketData()
    gameStore.saveProgress()
    
    return listing
  }

  const placeBid = (listingId, bidAmount) => {
    const listing = listings.value.find(l => l.id === listingId)
    if (!listing) return { success: false, message: '拍卖不存在' }
    
    if (listing.status === 'active' && Date.now() >= listing.endTime) {
      checkAuctionEnd(listing)
    }
    
    if (listing.status !== 'active') {
      return { success: false, message: '拍卖已结束' }
    }
    
    if (bidAmount <= listing.currentPrice) {
      return { success: false, message: '出价必须高于当前价格' }
    }
    
    if (gameStore.coins < bidAmount) {
      return { success: false, message: '金币不足' }
    }
    
    const minIncrement = Math.max(10, Math.round(listing.currentPrice * 0.05))
    if (bidAmount < listing.currentPrice + minIncrement) {
      return { success: false, message: `每次加价至少 ${minIncrement} 金币` }
    }
    
    const existingBid = listing.bids?.find(b => b.bidderId === 'player')
    if (existingBid) {
      existingBid.amount = bidAmount
      existingBid.timestamp = Date.now()
    } else {
      if (!listing.bids) listing.bids = []
      listing.bids.push({
        bidderId: 'player',
        bidderName: '我',
        amount: bidAmount,
        timestamp: Date.now()
      })
    }
    
    listing.currentPrice = bidAmount
    saveMarketData()
    gameStore.saveProgress()
    gameStore.emitTaskEvent('marketBid', bidAmount)
    
    return { success: true, message: '出价成功' }
  }

  const checkAuctionEnd = (listing) => {
    if (!listing || listing.status !== 'active') return false
    
    if (Date.now() < listing.endTime) return false
    
    listing.status = 'ended'
    
    if (listing.bids && listing.bids.length > 0) {
      const winningBid = listing.bids.reduce((max, bid) => 
        bid.amount > max.amount ? bid : max, listing.bids[0]
      )
      listing.winner = winningBid
      
      if (winningBid.bidderId === 'player') {
        gameStore.coins -= winningBid.amount
        addMineralToPlayer(listing.mineralId)
      }
      
      if (listing.sellerId === 'player') {
        const sellerEarnings = Math.round(winningBid.amount * 0.95)
        gameStore.coins += sellerEarnings
        gameStore.emitTaskEvent('marketTransaction', sellerEarnings)
      }
      
      recordTransaction(listing, winningBid)
      updatePriceHistory(listing.mineralId, winningBid.amount)
    } else {
      if (listing.sellerId === 'player') {
        addMineralToPlayer(listing.mineralId)
      }
    }
    
    saveMarketData()
    gameStore.saveProgress()
    
    return true
  }

  const recordTransaction = (listing, winningBid) => {
    const mineral = getMineralById(listing.mineralId)
    transactionHistory.value.unshift({
      id: Date.now(),
      mineralId: listing.mineralId,
      mineralName: mineral?.name,
      mineralEmoji: mineral?.emoji,
      rarity: mineral?.rarity,
      sellerName: listing.sellerName,
      buyerName: winningBid.bidderName,
      price: winningBid.amount,
      timestamp: Date.now()
    })
    
    if (transactionHistory.value.length > 100) {
      transactionHistory.value = transactionHistory.value.slice(0, 100)
    }
  }

  const updatePriceHistory = (mineralId, price) => {
    if (!priceHistory.value[mineralId]) {
      priceHistory.value[mineralId] = []
    }
    priceHistory.value[mineralId].push({
      price,
      timestamp: Date.now()
    })
    
    if (priceHistory.value[mineralId].length > 50) {
      priceHistory.value[mineralId] = priceHistory.value[mineralId].slice(-50)
    }
  }
  
  const cancelListing = (listingId) => {
    const listing = listings.value.find(l => l.id === listingId)
    if (!listing || listing.status !== 'active') return false
    if (listing.sellerId !== 'player') return false
    if (listing.bids && listing.bids.length > 0) return false
    
    listing.status = 'cancelled'
    addMineralToPlayer(listing.mineralId)
    saveMarketData()
    gameStore.saveProgress()
    
    return true
  }

  const generateMockListings = () => {
    const now = Date.now()
    const existingActive = activeListings.value.length
    
    if (existingActive >= 15) return
    
    const mineralsToAdd = MINERALS.filter(m => {
      const collected = gameStore.isMineralCollected(m.id)
      return collected || Math.random() < 0.3
    })
    
    const toGenerate = Math.min(8, 15 - existingActive)
    
    for (let i = 0; i < toGenerate; i++) {
      const mineral = mineralsToAdd[Math.floor(Math.random() * mineralsToAdd.length)]
      if (!mineral) continue
      
      const config = RARITY_CONFIG[mineral.rarity]
      const basePrice = config.basePrice
      const startPrice = Math.round(basePrice * (0.7 + Math.random() * 0.6))
      
      const listing = {
        id: now + i,
        mineralId: mineral.id,
        sellerId: `npc_${i}`,
        sellerName: mockSellers[Math.floor(Math.random() * mockSellers.length)],
        startPrice,
        currentPrice: startPrice,
        createdAt: now - Math.random() * 1800000,
        endTime: now + 1800000 + Math.random() * 3600000,
        status: 'active',
        bids: [],
        winner: null
      }
      
      if (Math.random() < 0.6) {
        const bidCount = Math.floor(Math.random() * 5) + 1
        for (let j = 0; j < bidCount; j++) {
          const bidAmount = Math.round(listing.currentPrice * (1.05 + Math.random() * 0.15))
          listing.bids.push({
            bidderId: `npc_bidder_${j}`,
            bidderName: mockSellers[Math.floor(Math.random() * mockSellers.length)],
            amount: bidAmount,
            timestamp: now - (bidCount - j) * 60000
          })
          listing.currentPrice = bidAmount
        }
      }
      
      listings.value.push(listing)
    }
    
    saveMarketData()
  }

  const simulateNPCBids = () => {
    activeListings.value.forEach(listing => {
      if (listing.sellerId === 'player') return
      if (Date.now() >= listing.endTime - 60000) return
      if (Math.random() > 0.02) return
      
      const mineral = getMineralById(listing.mineralId)
      if (!mineral) return
      
      const config = RARITY_CONFIG[mineral.rarity]
      const maxPrice = Math.round(config.basePrice * 1.5)
      
      if (listing.currentPrice >= maxPrice) return
      
      const increment = Math.max(10, Math.round(listing.currentPrice * (0.03 + Math.random() * 0.07)))
      const newBid = listing.currentPrice + increment
      
      if (newBid > maxPrice) return
      
      if (!listing.bids) listing.bids = []
      listing.bids.push({
        bidderId: `npc_${Date.now()}`,
        bidderName: mockSellers[Math.floor(Math.random() * mockSellers.length)],
        amount: newBid,
        timestamp: Date.now()
      })
      listing.currentPrice = newBid
    })
    
    saveMarketData()
  }

  const checkAllAuctions = () => {
    activeListings.value.forEach(listing => {
      if (Date.now() >= listing.endTime) {
        checkAuctionEnd(listing)
      }
    })
  }

  const openListModal = (mineral = null) => {
    selectedMineralForList.value = mineral
    showListModal.value = true
  }

  const closeListModal = () => {
    showListModal.value = false
    selectedMineralForList.value = null
  }

  const openBidModal = (listing) => {
    selectedListing.value = listing
    showBidModal.value = true
  }

  const closeBidModal = () => {
    showBidModal.value = false
    selectedListing.value = null
  }

  const saveMarketData = () => {
    const data = {
      listings: listings.value,
      transactionHistory: transactionHistory.value,
      priceHistory: priceHistory.value,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadMarketData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        listings.value = data.listings || []
        transactionHistory.value = data.transactionHistory || []
        priceHistory.value = data.priceHistory || {}
      }
    } catch (e) {
      console.error('Failed to load market data:', e)
    }
    
    if (activeListings.value.length < 5) {
      generateMockListings()
    }
  }

  const resetMarketData = () => {
    listings.value = []
    transactionHistory.value = []
    priceHistory.value = []
    localStorage.removeItem(STORAGE_KEY)
    generateMockListings()
  }

  const getMineral = (id) => getMineralById(id)

  return {
    listings,
    transactionHistory,
    priceHistory,
    showListModal,
    showBidModal,
    selectedListing,
    selectedMineralForList,
    activeListings,
    myListings,
    myBids,
    getBasePrice,
    getMarketPrice,
    getPriceTrend,
    createListing,
    placeBid,
    checkAuctionEnd,
    cancelListing,
    generateMockListings,
    simulateNPCBids,
    checkAllAuctions,
    openListModal,
    closeListModal,
    openBidModal,
    closeBidModal,
    saveMarketData,
    loadMarketData,
    resetMarketData,
    getMineral
  }
})
