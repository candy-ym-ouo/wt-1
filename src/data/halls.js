export const HALLS = [
  {
    id: 'common',
    name: '基础矿物厅',
    icon: '🏛️',
    description: '展示地壳中最常见的矿物，了解地球的基本构成',
    color: '#64748b',
    bgGradient: 'linear-gradient(135deg, #475569, #334155)',
    mineralIds: [1, 2, 3, 4],
    visitorCapacity: 200,
    openingYear: 2020
  },
  {
    id: 'gem',
    name: '宝石矿物厅',
    icon: '💎',
    description: '璀璨夺目的宝石矿物，大自然最珍贵的馈赠',
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
    mineralIds: [6, 9, 11, 12, 13],
    visitorCapacity: 150,
    openingYear: 2021
  },
  {
    id: 'crystal',
    name: '晶体矿物厅',
    icon: '🔮',
    description: '展示完美的晶体结构与形态之美',
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
    mineralIds: [1, 5, 7, 8],
    visitorCapacity: 180,
    openingYear: 2022
  },
  {
    id: 'rare',
    name: '珍稀矿物厅',
    icon: '👑',
    description: '世间稀有的珍贵矿物，每一件都价值连城',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #d97706, #b45309)',
    mineralIds: [12, 13, 14, 15, 16, 17, 18],
    visitorCapacity: 100,
    openingYear: 2023
  },
  {
    id: 'color',
    name: '色彩矿物厅',
    icon: '🎨',
    description: '五彩斑斓的矿物世界，感受自然的调色盘',
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, #db2777, #be185d)',
    mineralIds: [6, 8, 9, 10, 14],
    visitorCapacity: 160,
    openingYear: 2024
  },
  {
    id: 'industrial',
    name: '工业矿物厅',
    icon: '⚙️',
    description: '工业生产中不可或缺的矿物资源',
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    mineralIds: [1, 2, 3, 5],
    visitorCapacity: 120,
    openingYear: 2022
  }
]

export const getHallById = (id) => {
  return HALLS.find(h => h.id === id)
}

export const getHallsByMineralId = (mineralId) => {
  return HALLS.filter(h => h.mineralIds.includes(mineralId))
}
