import { RARITY } from './rarity'

export const SEASON_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  SETTLING: 'settling',
  ENDED: 'ended'
}

export const PASS_TYPE = {
  FREE: 'free',
  PREMIUM: 'premium'
}

export const SEASONS = [
  {
    id: 's1_crystal_era',
    name: '水晶纪元',
    subtitle: '探索大地的璀璨之心',
    emoji: '💎',
    themeColor: '#60a5fa',
    themeGradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #93c5fd)',
    startDate: '2026-06-01',
    endDate: '2026-07-15',
    limitedSpecimens: [
      {
        id: 's1_limited_1',
        name: '蓝锥矿',
        nameEn: 'Benitoite',
        emoji: '💠',
        rarity: RARITY.EPIC,
        colors: ['#dbeafe', '#93c5fd', '#3b82f6'],
        crystalColor: 0x93c5fd,
        formula: 'BaTiSi₃O₉',
        hardness: '6-6.5',
        description: '蓝锥矿是一种极为稀有的蓝色矿物，在紫外线下会发出明亮的蓝色荧光，被誉为"宝石界的蓝精灵"。',
        origin: '唯一商业产地为美国加利福尼亚州圣贝尼托县。',
        uses: '作为珍贵的收藏宝石，因其稀有性而价值极高。',
        funFact: '蓝锥矿是加利福尼亚州的州石，在短波紫外线下会发出如同蓝宝石般的荧光。',
        seasonExclusive: true,
        unlockTier: 30
      },
      {
        id: 's1_limited_2',
        name: '帕帕拉恰',
        nameEn: 'Padparadscha',
        emoji: '🧡',
        rarity: RARITY.LEGENDARY,
        colors: ['#fed7aa', '#fdba74', '#fb923c'],
        crystalColor: 0xfed7aa,
        formula: 'Al₂O₃',
        hardness: '9',
        description: '帕帕拉恰是蓝宝石中最稀有的颜色变种，呈现出独特的粉橙色调，如同斯里兰卡日落时的莲花色彩。',
        origin: '主要产于斯里兰卡和马达加斯加。',
        uses: '是世界最珍贵的宝石之一，价值甚至超过同等品质的红宝石。',
        funFact: '帕帕拉恰的名字来自僧伽罗语，意为"莲花之色"，是蓝宝石中的至高珍品。',
        seasonExclusive: true,
        unlockTier: 50
      }
    ],
    rankingRewards: [
      { rankMin: 1, rankMax: 1, rewards: { coins: 10000, title: '💎 水晶之王', specimens: ['s1_limited_2'] } },
      { rankMin: 2, rankMax: 3, rewards: { coins: 5000, title: '🏆 水晶守护者' } },
      { rankMin: 4, rankMax: 10, rewards: { coins: 3000, title: '⭐ 水晶猎手' } },
      { rankMin: 11, rankMax: 50, rewards: { coins: 1500, title: '✨ 水晶学徒' } },
      { rankMin: 51, rankMax: 100, rewards: { coins: 800, title: '🔮 矿脉探者' } },
      { rankMin: 101, rankMax: 500, rewards: { coins: 300 } }
    ]
  },
  {
    id: 's2_magma_forge',
    name: '熔岩锻造',
    subtitle: '深潜地心，淬炼不灭之石',
    emoji: '🌋',
    themeColor: '#f97316',
    themeGradient: 'linear-gradient(135deg, #7c2d12, #ea580c, #fb923c)',
    startDate: '2026-07-16',
    endDate: '2026-08-31',
    limitedSpecimens: [
      {
        id: 's2_limited_1',
        name: '火欧泊',
        nameEn: 'Fire Opal',
        emoji: '🔥',
        rarity: RARITY.EPIC,
        colors: ['#fef3c7', '#fbbf24', '#f97316'],
        crystalColor: 0xfbbf24,
        formula: 'SiO₂·nH₂O',
        hardness: '5.5-6.5',
        description: '火欧泊是欧泊中的珍稀品种，以其鲜明的橙红色调和内部跳动的火焰般游彩而闻名，仿佛封印了地心之火。',
        origin: '主要产于墨西哥和埃塞俄比亚。',
        uses: '作为珍贵宝石收藏，墨西哥将其视为国石。',
        funFact: '阿兹特克人将火欧泊称为"quetzalitzlipyollitli"，意为"鸟之灵魂之石"。',
        seasonExclusive: true,
        unlockTier: 30
      },
      {
        id: 's2_limited_2',
        name: '黑欧泊',
        nameEn: 'Black Opal',
        emoji: '🌈',
        rarity: RARITY.LEGENDARY,
        colors: ['#1e1b4b', '#4338ca', '#818cf8'],
        crystalColor: 0x4338ca,
        formula: 'SiO₂·nH₂O',
        hardness: '5.5-6.5',
        description: '黑欧泊是世上最珍贵的欧泊品种，深色底色上游动着绚烂的彩虹色游彩，宛如暗夜中的烟火，价值远超钻石。',
        origin: '唯一优质产地为澳大利亚闪电岭。',
        uses: '是世界最昂贵的宝石之一，被誉为"宝石中的皇后"。',
        funFact: '古罗马人相信欧泊是所有宝石之美的结晶，黑欧泊则被认为是众神遗落在人间的彩虹碎片。',
        seasonExclusive: true,
        unlockTier: 50
      }
    ],
    rankingRewards: [
      { rankMin: 1, rankMax: 1, rewards: { coins: 10000, title: '🌋 熔岩霸主', specimens: ['s2_limited_2'] } },
      { rankMin: 2, rankMax: 3, rewards: { coins: 5000, title: '🏆 熔岩守护者' } },
      { rankMin: 4, rankMax: 10, rewards: { coins: 3000, title: '⭐ 熔岩猎手' } },
      { rankMin: 11, rankMax: 50, rewards: { coins: 1500, title: '✨ 熔岩学徒' } },
      { rankMin: 51, rankMax: 100, rewards: { coins: 800, title: '🔮 岩浆探者' } },
      { rankMin: 101, rankMax: 500, rewards: { coins: 300 } }
    ]
  }
]

export const generatePassTiers = () => {
  const tiers = []
  for (let i = 1; i <= 50; i++) {
    const tier = {
      level: i,
      expRequired: 100 + i * 30,
      freeReward: null,
      premiumReward: null
    }

    if (i % 5 === 0) {
      tier.freeReward = {
        coins: 100 + i * 20,
        items: i % 10 === 0 ? [{ type: 'stamina', value: 30 }] : []
      }
    } else {
      tier.freeReward = {
        coins: 30 + i * 5,
        items: []
      }
    }

    if (i % 5 === 0) {
      tier.premiumReward = {
        coins: 200 + i * 40,
        items: i % 10 === 0 ? [{ type: 'gacha_ticket', value: 1 }] : [{ type: 'stamina', value: 50 }]
      }
    } else {
      tier.premiumReward = {
        coins: 50 + i * 10,
        items: []
      }
    }

    if (i === 30) {
      tier.premiumReward.items.push({ type: 'season_specimen', value: 0 })
    }
    if (i === 50) {
      tier.premiumReward.items.push({ type: 'season_specimen', value: 1 })
    }

    tiers.push(tier)
  }
  return tiers
}

export const PASS_TIERS = generatePassTiers()

export const NPC_RANKING_DATA = [
  { name: '矿石猎人·李', avatar: '⛏️', baseScore: 8500, variance: 500 },
  { name: '宝石鉴定师·王', avatar: '🔍', baseScore: 7800, variance: 600 },
  { name: '矿物学者·陈', avatar: '📚', baseScore: 7200, variance: 400 },
  { name: '探险家·赵', avatar: '🗺️', baseScore: 6600, variance: 500 },
  { name: '珠宝商·刘', avatar: '💰', baseScore: 6100, variance: 450 },
  { name: '地质学家·张', avatar: '🧪', baseScore: 5600, variance: 400 },
  { name: '收藏家·孙', avatar: '📦', baseScore: 5200, variance: 350 },
  { name: '矿工·周', avatar: '⚒️', baseScore: 4800, variance: 300 },
  { name: '石匠·吴', avatar: '🪨', baseScore: 4400, variance: 350 },
  { name: '工匠·郑', avatar: '🔨', baseScore: 3900, variance: 300 }
]

export const SEASON_POINT_SOURCES = {
  expedition_complete: { points: 15, label: '远征完成' },
  mineral_collect: { points: 10, label: '矿物收集' },
  collage_complete: { points: 12, label: '拼装完成' },
  rare_mineral: { points: 30, label: '珍稀矿物' },
  epic_mineral: { points: 60, label: '史诗矿物' },
  legendary_mineral: { points: 120, label: '传说矿物' },
  daily_task_complete: { points: 20, label: '每日任务' },
  weekly_goal_complete: { points: 50, label: '周目标' },
  market_transaction: { points: 8, label: '市场交易' },
  quiz_correct: { points: 5, label: '问答正确' }
}

export const getSeasonById = (id) => SEASONS.find(s => s.id === id)

export const getActiveSeason = () => {
  const now = new Date()
  return SEASONS.find(s => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    return now >= start && now <= end
  })
}

export const getUpcomingSeason = () => {
  const now = new Date()
  return SEASONS.find(s => new Date(s.startDate) > now)
}

export const getSeasonStatus = (season) => {
  if (!season) return SEASON_STATUS.ENDED
  const now = new Date()
  const start = new Date(season.startDate)
  const end = new Date(season.endDate)
  const settleEnd = new Date(end.getTime() + 3 * 24 * 60 * 60 * 1000)

  if (now < start) return SEASON_STATUS.UPCOMING
  if (now >= start && now <= end) return SEASON_STATUS.ACTIVE
  if (now > end && now <= settleEnd) return SEASON_STATUS.SETTLING
  return SEASON_STATUS.ENDED
}
