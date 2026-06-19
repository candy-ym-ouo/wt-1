import { RARITY } from './rarity'

export const RESEARCH_CATEGORY = {
  CRYSTALLOGRAPHY: 'crystallography',
  MINERALOGY: 'mineralogy',
  GEMOLOGY: 'gemology',
  ECONOMIC: 'economic',
  PLANETARY: 'planetary'
}

export const CATEGORY_CONFIG = {
  [RESEARCH_CATEGORY.CRYSTALLOGRAPHY]: {
    name: '结晶学',
    icon: '🔬',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    description: '研究矿物的晶体结构与形成规律'
  },
  [RESEARCH_CATEGORY.MINERALOGY]: {
    name: '矿物学',
    icon: '🧪',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #166534, #22c55e)',
    description: '探究矿物的化学组成与物理性质'
  },
  [RESEARCH_CATEGORY.GEMOLOGY]: {
    name: '宝石学',
    icon: '💎',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce, #a855f7)',
    description: '解密宝石的光学效应与鉴定方法'
  },
  [RESEARCH_CATEGORY.ECONOMIC]: {
    name: '经济地质',
    icon: '⛏️',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    description: '研究矿物的工业应用与经济价值'
  },
  [RESEARCH_CATEGORY.PLANETARY]: {
    name: '行星地质',
    icon: '🌌',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #991b1b, #ef4444)',
    description: '探索地外矿物与宇宙地质奥秘'
  }
}

export const RESEARCH_TOPICS = [
  {
    id: 'topic_01',
    name: '硅酸盐家族',
    category: RESEARCH_CATEGORY.CRYSTALLOGRAPHY,
    description: '深入研究地壳中最丰富的硅酸盐矿物，揭示其晶体结构的共性规律。',
    icon: '🔮',
    difficulty: 1,
    stages: [
      {
        id: 'topic_01_s1',
        name: '基础硅酸盐',
        description: '收集常见硅酸盐矿物，建立基础认知框架',
        requiredMaterials: [
          { rarity: RARITY.COMMON, count: 3 },
          { rarity: RARITY.UNCOMMON, count: 1 }
        ],
        coinCost: 200,
        rewards: {
          coins: 100,
          exp: 50
        },
        knowledgeCard: {
          id: 'kc_01_01',
          title: '硅氧四面体',
          content: '硅酸盐矿物的核心结构单元是硅氧四面体[SiO₄]⁴⁻，由一个硅离子被四个氧离子包围形成。这种结构是所有硅酸盐矿物的建筑基础，通过不同的连接方式，可以形成岛状、环状、链状、层状和架状五大类硅酸盐结构。',
          category: RESEARCH_CATEGORY.CRYSTALLOGRAPHY,
          relatedMineralIds: [1, 2, 6, 7],
          icon: '🔷'
        }
      },
      {
        id: 'topic_01_s2',
        name: '链状与层状结构',
        description: '探索辉石与云母族矿物的结构奥秘',
        requiredMaterials: [
          { rarity: RARITY.UNCOMMON, count: 2 },
          { rarity: RARITY.RARE, count: 1 }
        ],
        coinCost: 500,
        rewards: {
          coins: 300,
          exp: 120
        },
        knowledgeCard: {
          id: 'kc_01_02',
          title: '解理与结构',
          content: '链状硅酸盐（如辉石）具有两组近90°的解理，层状硅酸盐（如云母）具有极完全的底面解理。这些宏观物理性质直接源于微观晶体结构——链状结构中硅氧四面体共顶连接，层状结构中共面连接形成薄弱面。',
          category: RESEARCH_CATEGORY.CRYSTALLOGRAPHY,
          relatedMineralIds: [6, 7, 8],
          icon: '📐'
        }
      },
      {
        id: 'topic_01_s3',
        name: '架状硅酸盐',
        description: '解密石英与长石的架状网络结构',
        requiredMaterials: [
          { rarity: RARITY.RARE, count: 2 },
          { rarity: RARITY.EPIC, count: 1 }
        ],
        coinCost: 1000,
        rewards: {
          coins: 600,
          exp: 250
        },
        knowledgeCard: {
          id: 'kc_01_03',
          title: '压电效应',
          content: '石英等架状硅酸盐晶体具有压电性——在机械应力作用下产生电荷，反之亦然。这一特性使石英成为现代电子工业的关键材料，广泛应用于谐振器、滤波器和精密计时装置。石英表的精确度可达每年误差不超过几秒。',
          category: RESEARCH_CATEGORY.CRYSTALLOGRAPHY,
          relatedMineralIds: [1, 2],
          icon: '⚡'
        }
      }
    ]
  },
  {
    id: 'topic_02',
    name: '碳酸盐与硫酸盐',
    category: RESEARCH_CATEGORY.MINERALOGY,
    description: '研究碳酸盐和硫酸盐矿物的化学特性与沉积环境指示意义。',
    icon: '🧪',
    difficulty: 1,
    stages: [
      {
        id: 'topic_02_s1',
        name: '碳酸盐矿物',
        description: '研究方解石等碳酸盐矿物的溶解与沉淀',
        requiredMaterials: [
          { rarity: RARITY.COMMON, count: 3 },
          { rarity: RARITY.UNCOMMON, count: 1 }
        ],
        coinCost: 200,
        rewards: {
          coins: 100,
          exp: 50
        },
        knowledgeCard: {
          id: 'kc_02_01',
          title: '双折射现象',
          content: '方解石（冰洲石）是展示双折射现象最经典的矿物。当光线穿过方解石晶体时，会分裂成两束偏振方向不同的光，产生"双重影像"。这一现象由其三方晶系的光学各向异性导致，对偏光显微镜的发展具有里程碑意义。',
          category: RESEARCH_CATEGORY.MINERALOGY,
          relatedMineralIds: [3],
          icon: '🌈'
        }
      },
      {
        id: 'topic_02_s2',
        name: '菱锰矿之谜',
        description: '研究红纹石的条带状结构与形成条件',
        requiredMaterials: [
          { rarity: RARITY.UNCOMMON, count: 2 },
          { rarity: RARITY.EPIC, count: 1 }
        ],
        coinCost: 600,
        rewards: {
          coins: 350,
          exp: 150
        },
        knowledgeCard: {
          id: 'kc_02_02',
          title: '印加玫瑰',
          content: '红纹石（菱锰矿）因其优美的粉红色条带被称为"印加玫瑰"。其条带结构反映了沉积环境中锰离子浓度的周期性变化，每一条纹路都是地质历史的记录。阿根廷卡帕里塔矿出产的红纹石品质最优，阿根廷将其定为国石。',
          category: RESEARCH_CATEGORY.MINERALOGY,
          relatedMineralIds: [14],
          icon: '🌹'
        }
      },
      {
        id: 'topic_02_s3',
        name: '荧光矿物',
        description: '探索萤石等矿物的荧光与磷光现象',
        requiredMaterials: [
          { rarity: RARITY.RARE, count: 2 },
          { rarity: RARITY.EPIC, count: 1 }
        ],
        coinCost: 1000,
        rewards: {
          coins: 600,
          exp: 250
        },
        knowledgeCard: {
          id: 'kc_02_03',
          title: '荧光效应',
          content: '荧光（Fluorescence）一词源自萤石（Fluorite）。当紫外线照射萤石时，晶体中的微量稀土元素吸收高能光子后发射低能可见光，呈现蓝、绿、紫等荧光色。这一发现由斯托克斯于1852年系统描述，荧光灯、荧光显微镜等技术均因此得名。',
          category: RESEARCH_CATEGORY.MINERALOGY,
          relatedMineralIds: [4],
          icon: '💡'
        }
      }
    ]
  },
  {
    id: 'topic_03',
    name: '刚玉与绿柱石',
    category: RESEARCH_CATEGORY.GEMOLOGY,
    description: '深入研究刚玉族和绿柱石族宝石的致色机理与鉴定特征。',
    icon: '💎',
    difficulty: 2,
    stages: [
      {
        id: 'topic_03_s1',
        name: '刚玉的致色',
        description: '探索铬与钛铁如何赋予刚玉传世之美',
        requiredMaterials: [
          { rarity: RARITY.UNCOMMON, count: 2 },
          { rarity: RARITY.RARE, count: 1 }
        ],
        coinCost: 400,
        rewards: {
          coins: 250,
          exp: 100
        },
        knowledgeCard: {
          id: 'kc_03_01',
          title: '微量致色',
          content: '纯净的刚玉（Al₂O₃）是无色的，但仅1%-2%的微量杂质就能赋予其惊人色彩：Cr³⁶替代Al³⁶产生红色（红宝石），Fe²⁺与Ti⁴⁺的电荷转移产生蓝色（蓝宝石）。这种"微量致色"现象是宝石学最迷人的主题之一。',
          category: RESEARCH_CATEGORY.GEMOLOGY,
          relatedMineralIds: [15, 16],
          icon: '🎨'
        }
      },
      {
        id: 'topic_03_s2',
        name: '绿柱石家族',
        description: '从海蓝宝到祖母绿的色彩之旅',
        requiredMaterials: [
          { rarity: RARITY.RARE, count: 2 },
          { rarity: RARITY.EPIC, count: 1 }
        ],
        coinCost: 800,
        rewards: {
          coins: 500,
          exp: 200
        },
        knowledgeCard: {
          id: 'kc_03_02',
          title: '内含物花园',
          content: '祖母绿中的内含物被称为"花园"（Jardin），是鉴定天然与合成品的关键依据。天然祖母绿常含三相包裹体（固体、液体、气体共存）、锯齿状生长纹和阳起石针状晶体。这些"瑕疵"恰恰是自然造物的证明，完美无瑕的祖母绿反而值得警惕。',
          category: RESEARCH_CATEGORY.GEMOLOGY,
          relatedMineralIds: [9, 17],
          icon: '🌿'
        }
      },
      {
        id: 'topic_03_s3',
        name: '星光与猫眼',
        description: '研究刚玉与绿柱石的特殊光学效应',
        requiredMaterials: [
          { rarity: RARITY.EPIC, count: 2 },
          { rarity: RARITY.LEGENDARY, count: 1 }
        ],
        coinCost: 1500,
        rewards: {
          coins: 1000,
          exp: 400
        },
        knowledgeCard: {
          id: 'kc_03_03',
          title: '星光效应',
          content: '星光红蓝宝石展现的六射星光线，是由三组定向排列的金红石针状包裹体对光的反射所致。当宝石被切割成弧面型且针状包裹体排列有序时，点光源下便出现美丽的星芒。最珍贵的星光红宝石"德朗之星"重达100.18克拉，星线锐利灵动。',
          category: RESEARCH_CATEGORY.GEMOLOGY,
          relatedMineralIds: [15, 16],
          icon: '⭐'
        }
      }
    ]
  },
  {
    id: 'topic_04',
    name: '矿物与工业',
    category: RESEARCH_CATEGORY.ECONOMIC,
    description: '探究矿物在冶金、电子、建材等工业领域的核心应用。',
    icon: '⛏️',
    difficulty: 2,
    stages: [
      {
        id: 'topic_04_s1',
        name: '矿石与冶金',
        description: '研究黄铁矿等矿石矿物的经济价值',
        requiredMaterials: [
          { rarity: RARITY.COMMON, count: 2 },
          { rarity: RARITY.UNCOMMON, count: 2 }
        ],
        coinCost: 300,
        rewards: {
          coins: 200,
          exp: 80
        },
        knowledgeCard: {
          id: 'kc_04_01',
          title: '愚人金的真价值',
          content: '黄铁矿虽因外观被戏称"愚人金"，但它是工业制硫酸的核心原料。全球约80%的硫酸由黄铁矿焙烧制取，而硫酸被称为"工业之母"，年消费量被视为衡量国家工业水平的指标。此外，黄铁矿也是锂离子电池中硫化物正极材料的研究对象。',
          category: RESEARCH_CATEGORY.ECONOMIC,
          relatedMineralIds: [5],
          icon: '🏭'
        }
      },
      {
        id: 'topic_04_s2',
        name: '宝石切割工艺',
        description: '从原石到宝石的蜕变之旅',
        requiredMaterials: [
          { rarity: RARITY.RARE, count: 2 },
          { rarity: RARITY.EPIC, count: 1 }
        ],
        coinCost: 800,
        rewards: {
          coins: 500,
          exp: 200
        },
        knowledgeCard: {
          id: 'kc_04_02',
          title: '切割与火彩',
          content: '托帕石的莫氏硬度为8，硬度高且折射率优良，是展现"火彩"的理想宝石。现代宝石切割通过精确计算亭角和冠角，使入射光在宝石内部经过全反射后从台面射出，产生耀眼的色散闪光。一颗切割优良的托帕石可呈现如同钻石般的火彩效果。',
          category: RESEARCH_CATEGORY.ECONOMIC,
          relatedMineralIds: [11],
          icon: '✂️'
        }
      },
      {
        id: 'topic_04_s3',
        name: '高科技矿物',
        description: '矿物在半导体与量子技术中的前沿应用',
        requiredMaterials: [
          { rarity: RARITY.EPIC, count: 2 },
          { rarity: RARITY.LEGENDARY, count: 1 }
        ],
        coinCost: 1500,
        rewards: {
          coins: 1000,
          exp: 400
        },
        knowledgeCard: {
          id: 'kc_04_03',
          title: '碧玺的热电性',
          content: '碧玺的压电性和热电性使其在现代科技中大有作为。加热碧玺晶体时，两端产生相反电荷，可吸附灰尘和微粒。这一特性被用于空气净化设备和静电发生器。在声学领域，碧玺压电片被用于超声波探测和声纳系统，是军事和医疗领域的核心传感器材料。',
          category: RESEARCH_CATEGORY.ECONOMIC,
          relatedMineralIds: [12],
          icon: '🔬'
        }
      }
    ]
  },
  {
    id: 'topic_05',
    name: '宇宙矿物学',
    category: RESEARCH_CATEGORY.PLANETARY,
    description: '探索陨石矿物、月壤成分与地外宝石的神秘世界。',
    icon: '🌌',
    difficulty: 3,
    stages: [
      {
        id: 'topic_05_s1',
        name: '陨石矿物',
        description: '研究来自太空的橄榄石与铁镍合金',
        requiredMaterials: [
          { rarity: RARITY.RARE, count: 2 },
          { rarity: RARITY.EPIC, count: 1 }
        ],
        coinCost: 600,
        rewards: {
          coins: 400,
          exp: 160
        },
        knowledgeCard: {
          id: 'kc_05_01',
          title: '天外来石',
          content: '橄榄石是地球上为数不多在陨石中也大量存在的矿物。在橄榄陨铁中，橄榄石晶体镶嵌在铁镍合金基体中，形成如同天然镶嵌宝石般的美丽结构。这种陨石源自小行星核幔边界，其橄榄石品质甚至超过地球产出的宝石级橄榄石。',
          category: RESEARCH_CATEGORY.PLANETARY,
          relatedMineralIds: [10],
          icon: '☄️'
        }
      },
      {
        id: 'topic_05_s2',
        name: '变色宝石',
        description: '揭秘变石在宇宙射线影响下的致色机理',
        requiredMaterials: [
          { rarity: RARITY.EPIC, count: 2 },
          { rarity: RARITY.LEGENDARY, count: 1 }
        ],
        coinCost: 1200,
        rewards: {
          coins: 800,
          exp: 320
        },
        knowledgeCard: {
          id: 'kc_05_02',
          title: '亚历山大效应',
          content: '变石的变色效应源于Cr³⁺离子在金绿宝石晶格中的特殊能级分布。在日光（富含蓝绿光）下，Cr³⁺吸收蓝绿光以外的波段，呈现绿色；在白炽灯（富含红光）下，吸收红光以外的波段，呈现红色。这种对光源光谱的"选择性响应"是晶体场理论的经典案例。',
          category: RESEARCH_CATEGORY.PLANETARY,
          relatedMineralIds: [18],
          icon: '🔄'
        }
      },
      {
        id: 'topic_05_s3',
        name: '深地矿物',
        description: '探索地幔与地核中的超高压矿物相',
        requiredMaterials: [
          { rarity: RARITY.LEGENDARY, count: 3 }
        ],
        coinCost: 2500,
        rewards: {
          coins: 1500,
          exp: 600
        },
        knowledgeCard: {
          id: 'kc_05_03',
          title: '布里奇曼石',
          content: '布里奇曼石（(Mg,Fe)SiO₃钙钛矿）是地球内部含量最丰富的矿物，约占地球体积的38%，但直到2014年才在陨石中发现天然样本并正式命名。它存在于660公里以下的下地幔，承受着超过24万大气压的极端压力。其高压相变对地幔对流和板块运动具有决定性影响。',
          category: RESEARCH_CATEGORY.PLANETARY,
          relatedMineralIds: [15, 16, 17],
          icon: '🕳️'
        }
      }
    ]
  },
  {
    id: 'topic_06',
    name: '宝石鉴定术',
    category: RESEARCH_CATEGORY.GEMOLOGY,
    description: '系统学习宝石鉴定的核心方法与仪器原理。',
    icon: '🔍',
    difficulty: 2,
    stages: [
      {
        id: 'topic_06_s1',
        name: '肉眼鉴定',
        description: '掌握宝石的颜色、光泽与包裹体观察',
        requiredMaterials: [
          { rarity: RARITY.UNCOMMON, count: 3 },
          { rarity: RARITY.RARE, count: 1 }
        ],
        coinCost: 350,
        rewards: {
          coins: 200,
          exp: 90
        },
        knowledgeCard: {
          id: 'kc_06_01',
          title: '石榴石族鉴定',
          content: '石榴石族包含多个端元种属：铁铝榴石（暗红）、镁铝榴石（亮红）、锰铝榴石（橙红）、钙铝榴石（黄绿）等。通过折射率和吸收光谱可以精确区分：铁铝榴石在504nm和520nm有特征吸收带，镁铝榴石在575nm有铬吸收带。手持分光镜是野外鉴定石榴石种属的利器。',
          category: RESEARCH_CATEGORY.GEMOLOGY,
          relatedMineralIds: [8],
          icon: '🧫'
        }
      },
      {
        id: 'topic_06_s2',
        name: '仪器鉴定',
        description: '学习折射仪、分光镜与偏光镜的使用',
        requiredMaterials: [
          { rarity: RARITY.RARE, count: 2 },
          { rarity: RARITY.EPIC, count: 2 }
        ],
        coinCost: 900,
        rewards: {
          coins: 550,
          exp: 220
        },
        knowledgeCard: {
          id: 'kc_06_02',
          title: '坦桑石的鉴定',
          content: '坦桑石具有强烈的三色性：从不同方向观察分别呈现蓝、紫红和黄绿色。这一特性可通过二色镜轻松检测。其折射率（1.69-1.70）和密度（3.35）也与其他蓝色宝石明显不同。市场上最常见的仿制品是蓝色玻璃和合成蓝尖晶石，但它们均无多色性。',
          category: RESEARCH_CATEGORY.GEMOLOGY,
          relatedMineralIds: [13],
          icon: '🔬'
        }
      },
      {
        id: 'topic_06_s3',
        name: '高级鉴定',
        description: '掌握合成宝石与处理宝石的鉴别',
        requiredMaterials: [
          { rarity: RARITY.EPIC, count: 2 },
          { rarity: RARITY.LEGENDARY, count: 1 }
        ],
        coinCost: 1500,
        rewards: {
          coins: 1000,
          exp: 400
        },
        knowledgeCard: {
          id: 'kc_06_03',
          title: '合成宝石鉴别',
          content: '合成红宝石与天然红宝石的化学和物理性质几乎完全相同，鉴别关键在于内部特征：合成品常见弧形生长纹、气泡和未熔粉末，而天然品含矿物包裹体和直角状生长纹。此外，天然红宝石在短波紫外线下荧光较弱且不均匀，而合成品荧光强烈且均匀。',
          category: RESEARCH_CATEGORY.GEMOLOGY,
          relatedMineralIds: [15],
          icon: '🏆'
        }
      }
    ]
  }
]

export const getTopicById = (id) => {
  return RESEARCH_TOPICS.find(t => t.id === id)
}

export const getTopicsByCategory = (category) => {
  return RESEARCH_TOPICS.filter(t => t.category === category)
}

export const getKnowledgeCardById = (id) => {
  for (const topic of RESEARCH_TOPICS) {
    for (const stage of topic.stages) {
      if (stage.knowledgeCard && stage.knowledgeCard.id === id) {
        return stage.knowledgeCard
      }
    }
  }
  return null
}

export const getAllKnowledgeCards = () => {
  const cards = []
  for (const topic of RESEARCH_TOPICS) {
    for (const stage of topic.stages) {
      if (stage.knowledgeCard) {
        cards.push({
          ...stage.knowledgeCard,
          topicId: topic.id,
          topicName: topic.name,
          stageId: stage.id,
          stageName: stage.name
        })
      }
    }
  }
  return cards
}

export const getKnowledgeCardsByCategory = (category) => {
  return getAllKnowledgeCards().filter(c => c.category === category)
}

export const getKnowledgeCardsByMineralId = (mineralId) => {
  return getAllKnowledgeCards().filter(c => c.relatedMineralIds.includes(mineralId))
}
