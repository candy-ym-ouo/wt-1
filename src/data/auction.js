import { RARITY, RARITY_CONFIG } from './rarity'
import { MINERALS, getMineralsByRarity, getRandomMineralByRarity } from './minerals'

export const AUCTION_PHASE = {
  IDLE: 'idle',
  PREVIEW: 'preview',
  BIDDING: 'bidding',
  CLOSING: 'closing',
  RESULT: 'result',
  FINISHED: 'finished'
}

export const BID_INCREMENT_PERCENTAGE = 5

export const BID_QUICK_OPTIONS = [
  { label: '+5%', value: 0.05, color: '#6b7280' },
  { label: '+10%', value: 0.10, color: '#3b82f6' },
  { label: '+20%', value: 0.20, color: '#a855f7' },
  { label: '+50%', value: 0.50, color: '#f59e0b' }
]

export const ROUND_DURATION = {
  [RARITY.COMMON]: 25000,
  [RARITY.UNCOMMON]: 30000,
  [RARITY.RARE]: 40000,
  [RARITY.EPIC]: 50000,
  [RARITY.LEGENDARY]: 60000
}

export const PREVIEW_DURATION = 3000
export const RESULT_DURATION = 4000
export const CLOSING_WARNING_DURATION = 5000

export const AUCTIONEER_MESSAGES = {
  welcome: [
    '欢迎来到今日矿物拍卖会！',
    '各位收藏家，拍卖会即将开始！',
    '让我们一起见证珍稀矿物的归属！'
  ],
  introduce: [
    '下一件拍品是{name}，{rarity}级珍品！',
    '有请今天的焦点——{name}！',
    '现在登场的是{rarity}矿物{name}！'
  ],
  startBid: [
    '起拍价 {price} 金币，开始竞价！',
    '底价 {price} 金币，各位请出价！',
    '初始价格 {price} 金币，谁先举手？'
  ],
  bidReceived: [
    '{bidder} 出价 {price} 金币！',
    '收到！{bidder} 报价 {price} 金币！',
    '{bidder} 加价到 {price} 金币！'
  ],
  competition: [
    '竞争非常激烈！',
    '看来大家都势在必得！',
    '这件拍品备受追捧！',
    '精彩！价格不断攀升！'
  ],
  warning: [
    '即将落槌...',
    '最后机会！',
    '倒计时开始！'
  ],
  sold: [
    '成交！恭喜 {bidder} 以 {price} 金币拍得 {name}！',
    '落槌！{bidder} 以 {price} 金币成功竞得 {name}！',
    '{bidder} 胜出！{price} 金币拿下 {name}！'
  ],
  passed: [
    '无人出价，遗憾流拍...',
    '叫价三次无果，本次流拍。',
    '看来大家对此件兴致不高，流拍处理。'
  ],
  finish: [
    '今日拍卖会圆满结束！感谢各位参与！',
    '所有拍品均已展示，期待下次再会！',
    '拍卖会圆满落幕！恭喜所有竞得者！'
  ]
}

export const NPC_BIDDERS = [
  { id: 'npc_zhang', name: '矿商老张', avatar: '👔', aggressiveness: 0.6, wealth: 'medium' },
  { id: 'npc_li', name: '宝石猎人李', avatar: '🎩', aggressiveness: 0.8, wealth: 'high' },
  { id: 'npc_wang', name: '收藏家老王', avatar: '🧓', aggressiveness: 0.5, wealth: 'high' },
  { id: 'npc_chen', name: '探险家小陈', avatar: '🎒', aggressiveness: 0.4, wealth: 'low' },
  { id: 'npc_zhao', name: '珠宝商赵总', avatar: '💎', aggressiveness: 0.9, wealth: 'high' },
  { id: 'npc_sun', name: '矿物学家孙教授', avatar: '🔬', aggressiveness: 0.3, wealth: 'medium' },
  { id: 'npc_zhou', name: '神秘买家Z', avatar: '🎭', aggressiveness: 0.7, wealth: 'high' },
  { id: 'npc_wu', name: '博物馆代表', avatar: '🏛️', aggressiveness: 0.6, wealth: 'medium' }
]

export const generateAuctionRounds = (roundCount = 6) => {
  const rounds = []
  const usedMineralIds = new Set()

  const rarityDistribution = [
    RARITY.COMMON,
    RARITY.UNCOMMON,
    RARITY.UNCOMMON,
    RARITY.RARE,
    RARITY.RARE,
    RARITY.EPIC,
    RARITY.EPIC,
    RARITY.LEGENDARY
  ]

  const actualRounds = Math.min(roundCount, rarityDistribution.length)
  const selectedRarities = rarityDistribution.slice(0, actualRounds)

  for (let i = 0; i < actualRounds; i++) {
    const targetRarity = selectedRarities[i]
    const candidates = getMineralsByRarity(targetRarity).filter(
      m => !usedMineralIds.has(m.id)
    )

    let mineral
    if (candidates.length > 0) {
      mineral = candidates[Math.floor(Math.random() * candidates.length)]
    } else {
      mineral = getRandomMineralByRarity(targetRarity)
    }

    if (mineral) {
      usedMineralIds.add(mineral.id)
      const basePrice = RARITY_CONFIG[mineral.rarity].basePrice
      const fluctuation = 0.8 + Math.random() * 0.4

      rounds.push({
        roundNumber: i + 1,
        mineralId: mineral.id,
        mineral,
        startPrice: Math.round(basePrice * fluctuation),
        duration: ROUND_DURATION[mineral.rarity],
        status: 'pending'
      })
    }
  }

  return rounds
}

export const pickRandomMessage = (category) => {
  const messages = AUCTIONEER_MESSAGES[category]
  if (!messages || messages.length === 0) return ''
  return messages[Math.floor(Math.random() * messages.length)]
}

export const formatMessage = (template, vars) => {
  let result = template
  Object.keys(vars).forEach(key => {
    result = result.replace(`{${key}}`, vars[key])
  })
  return result
}

export const getNPCMaxBidRatio = (bidder, rarity) => {
  const wealthMultiplier = {
    low: 1.0,
    medium: 1.4,
    high: 2.0
  }[bidder.wealth] || 1.2

  const rarityBonus = {
    [RARITY.COMMON]: 0.2,
    [RARITY.UNCOMMON]: 0.3,
    [RARITY.RARE]: 0.5,
    [RARITY.EPIC]: 0.7,
    [RARITY.LEGENDARY]: 1.0
  }[rarity] || 0.3

  return (1 + rarityBonus * bidder.aggressiveness) * wealthMultiplier
}
