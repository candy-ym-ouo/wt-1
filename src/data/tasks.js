export const TASK_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly'
}

export const TASK_CATEGORY = {
  EXPEDITION: 'expedition',
  COLLECTION: 'collection',
  MARKET: 'market',
  COLLAGE: 'collage',
  SOCIAL: 'social'
}

export const DAILY_TASKS = [
  {
    id: 'daily_expedition_1',
    title: '初探矿脉',
    description: '完成1次远征考察',
    emoji: '🗺️',
    category: TASK_CATEGORY.EXPEDITION,
    target: 1,
    rewards: { coins: 30, exp: 20 },
    condition: (stats) => stats.expeditionsToday >= 1
  },
  {
    id: 'daily_expedition_3',
    title: '勤奋探险家',
    description: '完成3次远征考察',
    emoji: '⛏️',
    category: TASK_CATEGORY.EXPEDITION,
    target: 3,
    rewards: { coins: 80, exp: 50 },
    condition: (stats) => stats.expeditionsToday >= 3
  },
  {
    id: 'daily_collect_mineral',
    title: '矿物收获',
    description: '收集1个矿物标本',
    emoji: '💎',
    category: TASK_CATEGORY.COLLECTION,
    target: 1,
    rewards: { coins: 20, exp: 15 },
    condition: (stats) => stats.mineralsCollectedToday >= 1
  },
  {
    id: 'daily_collage',
    title: '拼装工匠',
    description: '完成1次矿物拼装',
    emoji: '🎨',
    category: TASK_CATEGORY.COLLAGE,
    target: 1,
    rewards: { coins: 25, exp: 20 },
    condition: (stats) => stats.collagesToday >= 1
  },
  {
    id: 'daily_market_bid',
    title: '市场观察者',
    description: '在市场出价1次',
    emoji: '🏪',
    category: TASK_CATEGORY.MARKET,
    target: 1,
    rewards: { coins: 15, exp: 10 },
    condition: (stats) => stats.bidsToday >= 1
  },
  {
    id: 'daily_spend_stamina',
    title: '精力充沛',
    description: '消耗50点体力',
    emoji: '⚡',
    category: TASK_CATEGORY.EXPEDITION,
    target: 50,
    rewards: { coins: 40, exp: 30 },
    condition: (stats) => stats.staminaSpentToday >= 50
  }
]

export const WEEKLY_GOALS = [
  {
    id: 'weekly_expedition_10',
    title: '远征达人',
    description: '本周完成10次远征',
    emoji: '🏔️',
    category: TASK_CATEGORY.EXPEDITION,
    target: 10,
    rewards: { coins: 300, exp: 200 },
    condition: (stats) => stats.expeditionsThisWeek >= 10
  },
  {
    id: 'weekly_collect_5',
    title: '收藏家',
    description: '本周收集5种不同矿物',
    emoji: '📦',
    category: TASK_CATEGORY.COLLECTION,
    target: 5,
    rewards: { coins: 200, exp: 150 },
    condition: (stats) => stats.mineralsCollectedThisWeek >= 5
  },
  {
    id: 'weekly_collage_5',
    title: '拼装大师',
    description: '本周完成5次矿物拼装',
    emoji: '🖌️',
    category: TASK_CATEGORY.COLLAGE,
    target: 5,
    rewards: { coins: 250, exp: 180 },
    condition: (stats) => stats.collagesThisWeek >= 5
  },
  {
    id: 'weekly_earn_coins',
    title: '矿商之路',
    description: '本周累计获得500金币',
    emoji: '💰',
    category: TASK_CATEGORY.MARKET,
    target: 500,
    rewards: { coins: 150, exp: 100 },
    condition: (stats) => stats.coinsEarnedThisWeek >= 500
  },
  {
    id: 'weekly_rare_mineral',
    title: '稀有猎手',
    description: '本周收集1个珍稀或以上品质矿物',
    emoji: '✨',
    category: TASK_CATEGORY.COLLECTION,
    target: 1,
    rewards: { coins: 400, exp: 250 },
    condition: (stats) => stats.rareMineralsThisWeek >= 1
  },
  {
    id: 'weekly_market_3',
    title: '交易专家',
    description: '本周在市场完成3次交易',
    emoji: '🤝',
    category: TASK_CATEGORY.MARKET,
    target: 3,
    rewards: { coins: 200, exp: 120 },
    condition: (stats) => stats.marketTransactionsThisWeek >= 3
  }
]

export const ACHIEVEMENT_TIERS = {
  BRONZE: { name: '铜', color: '#cd7f32', icon: '🥉', threshold: 1 },
  SILVER: { name: '银', color: '#c0c0c0', icon: '🥈', threshold: 3 },
  GOLD: { name: '金', color: '#ffd700', icon: '🥇', threshold: 5 },
  DIAMOND: { name: '钻', color: '#b9f2ff', icon: '💎', threshold: 10 }
}

export const ACHIEVEMENTS = [
  {
    id: 'ach_collector',
    title: '矿物收藏家',
    description: '收集不同种类的矿物',
    emoji: '📦',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 3, rewards: { coins: 100 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 8, rewards: { coins: 300 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 14, rewards: { coins: 800 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 18, rewards: { coins: 2000 } }
    ],
    getValue: (stats) => stats.uniqueMinerals
  },
  {
    id: 'ach_explorer',
    title: '远征先锋',
    description: '累计完成远征次数',
    emoji: '🗺️',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 10, rewards: { coins: 100 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 30, rewards: { coins: 300 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 60, rewards: { coins: 800 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 100, rewards: { coins: 2000 } }
    ],
    getValue: (stats) => stats.totalExpeditions
  },
  {
    id: 'ach_artisan',
    title: '拼装工匠',
    description: '累计完成矿物拼装次数',
    emoji: '🎨',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 5, rewards: { coins: 100 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 20, rewards: { coins: 300 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 50, rewards: { coins: 800 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 100, rewards: { coins: 2000 } }
    ],
    getValue: (stats) => stats.totalCollages
  },
  {
    id: 'ach_mogul',
    title: '矿业大亨',
    description: '累计获得金币数量',
    emoji: '💰',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 1000, rewards: { coins: 150 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 5000, rewards: { coins: 400 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 20000, rewards: { coins: 1000 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 50000, rewards: { coins: 2500 } }
    ],
    getValue: (stats) => stats.totalCoinsEarned
  },
  {
    id: 'ach_rare_hunter',
    title: '稀有猎手',
    description: '收集珍稀或以上品质矿物数量',
    emoji: '✨',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 1, rewards: { coins: 200 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 3, rewards: { coins: 500 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 6, rewards: { coins: 1200 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 10, rewards: { coins: 3000 } }
    ],
    getValue: (stats) => stats.rareOrBetterMinerals
  },
  {
    id: 'ach_trader',
    title: '市场商人',
    description: '累计完成市场交易次数',
    emoji: '🏪',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 5, rewards: { coins: 100 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 15, rewards: { coins: 300 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 30, rewards: { coins: 800 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 50, rewards: { coins: 2000 } }
    ],
    getValue: (stats) => stats.totalMarketTransactions
  },
  {
    id: 'ach_legendary',
    title: '传说追寻者',
    description: '收集传说品质矿物数量',
    emoji: '👑',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 1, rewards: { coins: 500 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 2, rewards: { coins: 1000 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 3, rewards: { coins: 2000 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 4, rewards: { coins: 5000 } }
    ],
    getValue: (stats) => stats.legendaryMinerals
  },
  {
    id: 'ach_stamina_master',
    title: '体力管理大师',
    description: '远征等级达到指定等级',
    emoji: '⚡',
    tiers: [
      { tier: ACHIEVEMENT_TIERS.BRONZE, target: 3, rewards: { coins: 100 } },
      { tier: ACHIEVEMENT_TIERS.SILVER, target: 5, rewards: { coins: 300 } },
      { tier: ACHIEVEMENT_TIERS.GOLD, target: 8, rewards: { coins: 800 } },
      { tier: ACHIEVEMENT_TIERS.DIAMOND, target: 15, rewards: { coins: 2000 } }
    ],
    getValue: (stats) => stats.expeditionLevel
  }
]

export const getDailyTaskById = (id) => DAILY_TASKS.find(t => t.id === id)
export const getWeeklyGoalById = (id) => WEEKLY_GOALS.find(t => t.id === id)
export const getAchievementById = (id) => ACHIEVEMENTS.find(a => a.id === id)
