export const EXHIBITIONS = [
  {
    id: 'birthstone',
    name: '生辰石特展',
    icon: '🎂',
    description: '探索每个月份对应的守护宝石，了解它们的传说与寓意',
    tagline: '寻找属于你的诞生之石',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    featured: true,
    color: '#f43f5e',
    bgGradient: 'linear-gradient(135deg, #e11d48, #be123c)',
    mineralIds: [8, 17, 9, 6, 10, 15, 11, 18, 16],
    stats: { visitors: 15680, rating: 4.8 }
  },
  {
    id: 'rainbow',
    name: '彩虹矿物展',
    icon: '🌈',
    description: '按照彩虹七色排列的矿物展览，体验自然的色彩盛宴',
    tagline: '七色矿物，七彩人生',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    featured: true,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    mineralIds: [15, 14, 11, 10, 9, 6, 12],
    stats: { visitors: 12450, rating: 4.9 }
  },
  {
    id: 'crystal_healing',
    name: '水晶疗愈展',
    icon: '✨',
    description: '了解水晶的能量属性与疗愈功效，感受矿物的神秘力量',
    tagline: '晶石能量，身心同频',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    featured: false,
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
    mineralIds: [1, 6, 9, 12, 17],
    stats: { visitors: 8930, rating: 4.6 }
  },
  {
    id: 'earth_treasure',
    name: '地球宝藏展',
    icon: '🌍',
    description: '来自世界各地的珍稀矿物，讲述地球亿万年的故事',
    tagline: '跨越山海的自然馈赠',
    startDate: '2026-05-01',
    endDate: '2026-10-31',
    featured: true,
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #059669, #047857)',
    mineralIds: [15, 16, 17, 18, 13, 12],
    stats: { visitors: 21300, rating: 4.9 }
  },
  {
    id: 'beginner',
    name: '入门科普展',
    icon: '📚',
    description: '适合矿物爱好者入门的基础展览，从零开始认识矿物',
    tagline: '开启你的矿物之旅',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    featured: false,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #d97706, #b45309)',
    mineralIds: [1, 2, 3, 4, 5, 7],
    stats: { visitors: 9870, rating: 4.5 }
  },
  {
    id: 'night_museum',
    name: '夜场特别展',
    icon: '🌙',
    description: '夜晚开放的特别展览，在灯光下感受矿物不一样的魅力',
    tagline: '夜幕下的晶石奇境',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    featured: true,
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    mineralIds: [4, 6, 15, 16, 18],
    stats: { visitors: 6540, rating: 4.7 }
  }
]

export const getExhibitionById = (id) => {
  return EXHIBITIONS.find(e => e.id === id)
}

export const getFeaturedExhibitions = () => {
  return EXHIBITIONS.filter(e => e.featured)
}

export const getActiveExhibitions = (date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0]
  return EXHIBITIONS.filter(e => dateStr >= e.startDate && dateStr <= e.endDate)
}
