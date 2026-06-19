import { RARITY } from './rarity'
import { MINERALS } from './minerals'

export const QUIZ_DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  EXPERT: 'expert'
}

export const DIFFICULTY_CONFIG = {
  [QUIZ_DIFFICULTY.EASY]: {
    name: '入门',
    icon: '🌱',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #166534, #22c55e)',
    description: '适合初学者，题目简单直观',
    basePoints: 10,
    streakBonus: 5,
    timeLimit: 30,
    optionCount: 2,
    minRarity: RARITY.COMMON,
    maxRarity: RARITY.UNCOMMON,
    staminaCost: 2
  },
  [QUIZ_DIFFICULTY.NORMAL]: {
    name: '进阶',
    icon: '🌿',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    description: '有一定难度，需要掌握基础矿物知识',
    basePoints: 25,
    streakBonus: 10,
    timeLimit: 25,
    optionCount: 3,
    minRarity: RARITY.COMMON,
    maxRarity: RARITY.RARE,
    staminaCost: 5
  },
  [QUIZ_DIFFICULTY.HARD]: {
    name: '挑战',
    icon: '🌳',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce, #a855f7)',
    description: '难度较高，考验对矿物的深入了解',
    basePoints: 50,
    streakBonus: 20,
    timeLimit: 20,
    optionCount: 4,
    minRarity: RARITY.UNCOMMON,
    maxRarity: RARITY.EPIC,
    staminaCost: 10
  },
  [QUIZ_DIFFICULTY.EXPERT]: {
    name: '大师',
    icon: '🏔️',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
    description: '极高难度，只有矿物专家才能通关',
    basePoints: 100,
    streakBonus: 40,
    timeLimit: 15,
    optionCount: 4,
    minRarity: RARITY.RARE,
    maxRarity: RARITY.LEGENDARY,
    staminaCost: 20
  }
}

export const QUIZ_QUESTION_TYPES = {
  NAME_FROM_EMOJI: 'name_from_emoji',
  NAME_FROM_DESCRIPTION: 'name_from_description',
  HARDNESS: 'hardness',
  FORMULA: 'formula',
  RARITY: 'rarity',
  ORIGIN: 'origin',
  USES: 'uses',
  FUN_FACT: 'fun_fact',
  COLOR_IDENTIFY: 'color_identify'
}

const shuffleArray = (array) => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const getMineralsByDifficulty = (difficulty) => {
  const config = DIFFICULTY_CONFIG[difficulty]
  const rarityOrder = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY]
  const minIdx = rarityOrder.indexOf(config.minRarity)
  const maxIdx = rarityOrder.indexOf(config.maxRarity)
  return MINERALS.filter(m => {
    const idx = rarityOrder.indexOf(m.rarity)
    return idx >= minIdx && idx <= maxIdx
  })
}

const getWrongMinerals = (correctMineral, count, pool) => {
  const wrongs = pool.filter(m => m.id !== correctMineral.id)
  return shuffleArray(wrongs).slice(0, count)
}

const generateNameFromEmojiQuestion = (mineral, optionCount, pool) => {
  const wrongs = getWrongMinerals(mineral, optionCount - 1, pool)
  const options = shuffleArray([mineral, ...wrongs])
  
  return {
    type: QUIZ_QUESTION_TYPES.NAME_FROM_EMOJI,
    difficulty: null,
    mineral: mineral,
    question: `这个图标 ${mineral.emoji} 代表哪种矿物？`,
    options: options.map(m => ({ id: m.id, text: m.name })),
    correctOptionId: mineral.id,
    explanation: `${mineral.emoji} 是${mineral.name}（${mineral.nameEn}）的代表图标。`
  }
}

const generateNameFromDescriptionQuestion = (mineral, optionCount, pool) => {
  const wrongs = getWrongMinerals(mineral, optionCount - 1, pool)
  const options = shuffleArray([mineral, ...wrongs])
  const shortDesc = mineral.description.substring(0, 50) + '...'
  
  return {
    type: QUIZ_QUESTION_TYPES.NAME_FROM_DESCRIPTION,
    difficulty: null,
    mineral: mineral,
    question: `"${shortDesc}" 描述的是哪种矿物？`,
    options: options.map(m => ({ id: m.id, text: m.name })),
    correctOptionId: mineral.id,
    explanation: `这是${mineral.name}的描述。${mineral.description}`
  }
}

const generateHardnessQuestion = (mineral, optionCount, pool) => {
  const correctHardness = mineral.hardness
  const allHardness = [...new Set(MINERALS.map(m => m.hardness))]
  const wrongHardness = shuffleArray(allHardness.filter(h => h !== correctHardness)).slice(0, optionCount - 1)
  const options = shuffleArray([
    { id: 'correct', text: correctHardness },
    ...wrongHardness.map((h, i) => ({ id: `wrong_${i}`, text: h }))
  ])
  const correctOption = options.find(o => o.text === correctHardness)
  
  return {
    type: QUIZ_QUESTION_TYPES.HARDNESS,
    difficulty: null,
    mineral: mineral,
    question: `${mineral.emoji} ${mineral.name}的莫氏硬度是多少？`,
    options: options,
    correctOptionId: correctOption.id,
    explanation: `${mineral.name}的莫氏硬度为${correctHardness}，在矿物硬度表中属于${parseFloat(correctHardness) < 4 ? '较软' : parseFloat(correctHardness) < 7 ? '中等' : '较硬'}级别。`
  }
}

const generateFormulaQuestion = (mineral, optionCount, pool) => {
  const correctFormula = mineral.formula
  const allFormulas = [...new Set(MINERALS.map(m => m.formula))]
  const wrongFormulas = shuffleArray(allFormulas.filter(f => f !== correctFormula)).slice(0, optionCount - 1)
  const options = shuffleArray([
    { id: 'correct', text: correctFormula },
    ...wrongFormulas.map((f, i) => ({ id: `wrong_${i}`, text: f }))
  ])
  const correctOption = options.find(o => o.text === correctFormula)
  
  return {
    type: QUIZ_QUESTION_TYPES.FORMULA,
    difficulty: null,
    mineral: mineral,
    question: `${mineral.emoji} ${mineral.name}的化学分子式是什么？`,
    options: options,
    correctOptionId: correctOption.id,
    explanation: `${mineral.name}的化学分子式为${correctFormula}。`
  }
}

const generateRarityQuestion = (mineral, optionCount, pool) => {
  const rarityLabels = Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => ({ id: k, text: v.name }))
  const correctRarity = mineral.rarity
  const rarityNames = {
    [RARITY.COMMON]: '普通',
    [RARITY.UNCOMMON]: '稀有',
    [RARITY.RARE]: '珍稀',
    [RARITY.EPIC]: '史诗',
    [RARITY.LEGENDARY]: '传说'
  }
  const allRarityOptions = Object.entries(rarityNames).map(([key, name]) => ({ id: key, text: name }))
  const wrongRarities = shuffleArray(allRarityOptions.filter(r => r.id !== correctRarity)).slice(0, optionCount - 1)
  const options = shuffleArray([
    { id: correctRarity, text: rarityNames[correctRarity] },
    ...wrongRarities
  ])
  
  return {
    type: QUIZ_QUESTION_TYPES.RARITY,
    difficulty: null,
    mineral: mineral,
    question: `${mineral.emoji} ${mineral.name}属于哪种稀有度？`,
    options: options,
    correctOptionId: correctRarity,
    explanation: `${mineral.name}的稀有度为「${rarityNames[correctRarity]}」级。`
  }
}

const generateOriginQuestion = (mineral, optionCount, pool) => {
  const allOrigins = MINERALS.map(m => m.origin.split('、')[0].split('，')[0].split('。')[0])
  const uniqueOrigins = [...new Set(allOrigins.filter(o => o.length > 3))]
  const correctOrigin = mineral.origin.split('。')[0]
  const wrongOrigins = shuffleArray(uniqueOrigins.filter(o => !correctOrigin.includes(o) && o.length > 3)).slice(0, optionCount - 1)
  const options = shuffleArray([
    { id: 'correct', text: correctOrigin },
    ...wrongOrigins.map((o, i) => ({ id: `wrong_${i}`, text: o }))
  ])
  const correctOption = options.find(o => o.text === correctOrigin)
  
  return {
    type: QUIZ_QUESTION_TYPES.ORIGIN,
    difficulty: null,
    mineral: mineral,
    question: `${mineral.emoji} ${mineral.name}的主要产地是哪里？`,
    options: options,
    correctOptionId: correctOption.id,
    explanation: `${mineral.name}${mineral.origin}`
  }
}

const generateUsesQuestion = (mineral, optionCount, pool) => {
  const allUses = MINERALS.map(m => m.uses)
  const correctUses = mineral.uses
  const wrongUses = shuffleArray(allUses.filter(u => u !== correctUses)).slice(0, optionCount - 1)
  const options = shuffleArray([
    { id: 'correct', text: correctUses },
    ...wrongUses.map((u, i) => ({ id: `wrong_${i}`, text: u }))
  ])
  const correctOption = options.find(o => o.text === correctUses)
  
  return {
    type: QUIZ_QUESTION_TYPES.USES,
    difficulty: null,
    mineral: mineral,
    question: `${mineral.emoji} ${mineral.name}的主要用途是什么？`,
    options: options,
    correctOptionId: correctOption.id,
    explanation: `${mineral.name}的用途：${correctUses}`
  }
}

const generateFunFactQuestion = (mineral, optionCount, pool) => {
  return {
    type: QUIZ_QUESTION_TYPES.FUN_FACT,
    difficulty: null,
    mineral: mineral,
    question: `${mineral.emoji} 关于${mineral.name}，以下说法正确的是？`,
    options: [
      { id: 'correct', text: mineral.funFact },
      { id: 'wrong_1', text: `${mineral.name}是世界上最硬的矿物` },
      { id: 'wrong_2', text: `${mineral.name}只存在于外太空` },
      { id: 'wrong_3', text: `${mineral.name}不能作为宝石使用` }
    ].slice(0, optionCount),
    correctOptionId: 'correct',
    explanation: mineral.funFact
  }
}

const QUESTION_GENERATORS = {
  [QUIZ_DIFFICULTY.EASY]: [
    generateNameFromEmojiQuestion,
    generateNameFromDescriptionQuestion,
    generateRarityQuestion
  ],
  [QUIZ_DIFFICULTY.NORMAL]: [
    generateNameFromEmojiQuestion,
    generateHardnessQuestion,
    generateFormulaQuestion,
    generateRarityQuestion
  ],
  [QUIZ_DIFFICULTY.HARD]: [
    generateHardnessQuestion,
    generateFormulaQuestion,
    generateOriginQuestion,
    generateUsesQuestion,
    generateNameFromDescriptionQuestion
  ],
  [QUIZ_DIFFICULTY.EXPERT]: [
    generateFormulaQuestion,
    generateOriginQuestion,
    generateUsesQuestion,
    generateFunFactQuestion,
    generateHardnessQuestion
  ]
}

export const generateQuestion = (difficulty) => {
  const config = DIFFICULTY_CONFIG[difficulty]
  const pool = getMineralsByDifficulty(difficulty)
  const generators = QUESTION_GENERATORS[difficulty]
  const randomMineral = pool[Math.floor(Math.random() * pool.length)]
  const randomGenerator = generators[Math.floor(Math.random() * generators.length)]
  
  const question = randomGenerator(randomMineral, config.optionCount, pool)
  question.difficulty = difficulty
  
  return question
}

export const generateQuestionSet = (difficulty, count = 10) => {
  const questions = []
  const usedMineralIds = new Set()
  const pool = getMineralsByDifficulty(difficulty)
  
  for (let i = 0; i < count; i++) {
    let question
    let attempts = 0
    do {
      question = generateQuestion(difficulty)
      attempts++
    } while (usedMineralIds.has(question.mineral.id) && attempts < 10 && usedMineralIds.size < pool.length)
    
    usedMineralIds.add(question.mineral.id)
    questions.push(question)
  }
  
  return questions
}

export const REWARD_SHOP_ITEMS = [
  {
    id: 'stamina_small',
    name: '小体力药水',
    icon: '🧪',
    description: '恢复20点体力',
    cost: 50,
    type: 'stamina',
    value: 20
  },
  {
    id: 'stamina_large',
    name: '大体力药水',
    icon: '⚗️',
    description: '恢复50点体力',
    cost: 100,
    type: 'stamina',
    value: 50
  },
  {
    id: 'coins_small',
    name: '金币小包',
    icon: '💰',
    description: '获得100金币',
    cost: 80,
    type: 'coins',
    value: 100
  },
  {
    id: 'coins_large',
    name: '金币大包',
    icon: '💎',
    description: '获得300金币',
    cost: 200,
    type: 'coins',
    value: 300
  },
  {
    id: 'unlock_common',
    name: '普通矿物碎片',
    icon: '💠',
    description: '随机解锁一种普通矿物',
    cost: 150,
    type: 'unlock_mineral',
    rarity: RARITY.COMMON
  },
  {
    id: 'unlock_uncommon',
    name: '稀有矿物碎片',
    icon: '🟢',
    description: '随机解锁一种稀有矿物',
    cost: 400,
    type: 'unlock_mineral',
    rarity: RARITY.UNCOMMON
  },
  {
    id: 'unlock_rare',
    name: '珍稀矿物碎片',
    icon: '🔵',
    description: '随机解锁一种珍稀矿物',
    cost: 800,
    type: 'unlock_mineral',
    rarity: RARITY.RARE
  },
  {
    id: 'unlock_epic',
    name: '史诗矿物碎片',
    icon: '🟣',
    description: '随机解锁一种史诗矿物',
    cost: 2000,
    type: 'unlock_mineral',
    rarity: RARITY.EPIC
  }
]

export const getRewardItemById = (id) => {
  return REWARD_SHOP_ITEMS.find(item => item.id === id)
}
