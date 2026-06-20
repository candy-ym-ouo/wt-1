import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const AUDIO_STORAGE_KEY = 'mineral_collage_audio_settings'

export const SCENE_CATEGORIES = {
  UI: { id: 'ui', name: '界面交互', icon: '🖱️', description: '点击、按钮、弹窗等界面音效' },
  COLLAGE: { id: 'collage', name: '拼装工坊', icon: '🎨', description: '拖拽、拾取、完成拼装等' },
  EXPEDITION: { id: 'expedition', name: '探险远征', icon: '🗺️', description: '探险开始、发现、事件触发等' },
  QUIZ: { id: 'quiz', name: '知识问答', icon: '❓', description: '答题正确/错误、计时、连胜等' },
  GACHA: { id: 'gacha', name: '盲盒抽取', icon: '🎁', description: '开盲盒、稀有揭示等' },
  MARKET: { id: 'market', name: '市场交易', icon: '🏪', description: '购买、出价、拍卖结果等' },
  DISCOVERY: { id: 'discovery', name: '稀有发现', icon: '✨', description: '稀有矿物发现、首次发现庆祝' },
  REWARD: { id: 'reward', name: '奖励成就', icon: '🏆', description: '奖励领取、成就解锁、升级等' }
}

export const SFX_SAMPLES = {
  click: { name: '按钮点击', category: 'ui', fn: 'playClick' },
  success: { name: '操作成功', category: 'ui', fn: 'playSuccess' },
  error: { name: '操作失败', category: 'ui', fn: 'playError' },
  pickup: { name: '拾取矿物', category: 'collage', fn: 'playPickup' },
  drop: { name: '放下矿物', category: 'collage', fn: 'playDrop' },
  complete: { name: '拼装完成', category: 'collage', fn: 'playComplete' },
  expeditionStart: { name: '探险出发', category: 'expedition', fn: 'playExpeditionStart' },
  eventFound: { name: '发现事件', category: 'expedition', fn: 'playEventFound' },
  exploreStep: { name: '探索脚步', category: 'expedition', fn: 'playExploreStep' },
  quizStart: { name: '问答开始', category: 'quiz', fn: 'playQuizStart' },
  quizCorrect: { name: '回答正确', category: 'quiz', fn: 'playQuizCorrect' },
  quizWrong: { name: '回答错误', category: 'quiz', fn: 'playQuizWrong' },
  quizTick: { name: '倒计时', category: 'quiz', fn: 'playQuizTick' },
  quizStreak: { name: '连胜提示', category: 'quiz', fn: 'playQuizStreak', args: [3] },
  rareFound: { name: '稀有发现', category: 'discovery', fn: 'playRareFound' },
  firstDiscovery: { name: '首次发现', category: 'discovery', fn: 'playFirstDiscovery', args: ['rare'] },
  reward: { name: '获得奖励', category: 'reward', fn: 'playReward' },
  achievement: { name: '成就解锁', category: 'reward', fn: 'playAchievementUnlock' },
  levelUp: { name: '等级提升', category: 'reward', fn: 'playLevelUp' },
  auctionWin: { name: '拍卖胜利', category: 'market', fn: 'playAuctionWin' },
  auctionLose: { name: '拍卖失利', category: 'market', fn: 'playAuctionLose' },
  comboHit: { name: '连击命中', category: 'market', fn: 'playComboHit', args: [3] },
  sparkle: { name: '闪光特效', category: 'discovery', fn: 'playSparkle' },
  staminaLow: { name: '体力不足', category: 'expedition', fn: 'playStaminaLow' },
  choiceSuccess: { name: '选择成功', category: 'expedition', fn: 'playChoiceSuccess' },
  choiceFailure: { name: '选择失败', category: 'expedition', fn: 'playChoiceFailure' }
}

export const useAudioStore = defineStore('audio', () => {
  const soundEnabled = ref(true)
  const musicEnabled = ref(true)
  const audioContext = ref(null)
  const backgroundOscillator = ref(null)
  const backgroundGain = ref(null)
  const musicVolume = ref(0.15)
  const sfxVolume = ref(0.3)
  const rareDiscoveryEnabled = ref(true)

  const sceneVolumes = ref({
    ui: 1.0,
    collage: 1.0,
    expedition: 1.0,
    quiz: 1.0,
    gacha: 1.0,
    market: 1.0,
    discovery: 1.0,
    reward: 1.0
  })

  const currentPreviewScene = ref(null)

  const saveAudioSettings = () => {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
        soundEnabled: soundEnabled.value,
        musicEnabled: musicEnabled.value,
        musicVolume: musicVolume.value,
        sfxVolume: sfxVolume.value,
        rareDiscoveryEnabled: rareDiscoveryEnabled.value,
        sceneVolumes: sceneVolumes.value
      }))
    } catch (e) {
      console.error('Failed to save audio settings:', e)
    }
  }

  const loadAudioSettings = () => {
    try {
      const saved = localStorage.getItem(AUDIO_STORAGE_KEY)
      if (saved) {
        const settings = JSON.parse(saved)
        soundEnabled.value = settings.soundEnabled ?? true
        musicEnabled.value = settings.musicEnabled ?? true
        musicVolume.value = settings.musicVolume ?? 0.15
        sfxVolume.value = settings.sfxVolume ?? 0.3
        rareDiscoveryEnabled.value = settings.rareDiscoveryEnabled ?? true
        sceneVolumes.value = {
          ui: settings.sceneVolumes?.ui ?? 1.0,
          collage: settings.sceneVolumes?.collage ?? 1.0,
          expedition: settings.sceneVolumes?.expedition ?? 1.0,
          quiz: settings.sceneVolumes?.quiz ?? 1.0,
          gacha: settings.sceneVolumes?.gacha ?? 1.0,
          market: settings.sceneVolumes?.market ?? 1.0,
          discovery: settings.sceneVolumes?.discovery ?? 1.0,
          reward: settings.sceneVolumes?.reward ?? 1.0
        }
      }
    } catch (e) {
      console.error('Failed to load audio settings:', e)
    }
  }

  const initAudioContext = () => {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
  }

  const getSceneVolume = (scene) => {
    if (!scene) return 1.0
    return sceneVolumes.value[scene] ?? 1.0
  }

  const playTone = (frequency, duration, type = 'sine', volume = 0.3, scene = null) => {
    if (!soundEnabled.value || !audioContext.value) return

    const sceneMultiplier = getSceneVolume(scene)

    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.value.currentTime)

    gainNode.gain.setValueAtTime(volume * sfxVolume.value * sceneMultiplier, audioContext.value.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.value.currentTime + duration)

    oscillator.start(audioContext.value.currentTime)
    oscillator.stop(audioContext.value.currentTime + duration)
  }

  const playSuccess = () => {
    initAudioContext()
    setTimeout(() => playTone(523.25, 0.1, 'sine', 0.4, 'ui'), 0)
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.4, 'ui'), 100)
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.5, 'ui'), 200)
  }

  const playClick = () => {
    initAudioContext()
    playTone(800, 0.08, 'square', 0.2, 'ui')
  }

  const playPickup = () => {
    initAudioContext()
    playTone(440, 0.05, 'triangle', 0.3, 'collage')
    setTimeout(() => playTone(550, 0.05, 'triangle', 0.3, 'collage'), 50)
  }

  const playDrop = () => {
    initAudioContext()
    playTone(330, 0.1, 'triangle', 0.3, 'collage')
  }

  const playComplete = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.3, 'sine', 0.5, 'collage'), i * 150)
    })
    setTimeout(() => playTone(1318.51, 0.6, 'sine', 0.6, 'collage'), 600)
  }

  const playRareFound = () => {
    if (!rareDiscoveryEnabled.value) return
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5, 'discovery'), i * 80)
    })
  }

  const playError = () => {
    initAudioContext()
    playTone(200, 0.15, 'sawtooth', 0.3, 'ui')
    setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.3, 'ui'), 100)
  }

  const playExpeditionStart = () => {
    initAudioContext()
    playTone(392, 0.1, 'triangle', 0.4, 'expedition')
    setTimeout(() => playTone(523.25, 0.1, 'triangle', 0.4, 'expedition'), 100)
    setTimeout(() => playTone(659.25, 0.15, 'triangle', 0.4, 'expedition'), 200)
  }

  const playEventFound = () => {
    initAudioContext()
    playTone(440, 0.08, 'sine', 0.3, 'expedition')
    setTimeout(() => playTone(550, 0.08, 'sine', 0.3, 'expedition'), 80)
    setTimeout(() => playTone(660, 0.12, 'sine', 0.3, 'expedition'), 160)
  }

  const playChoiceSuccess = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.4, 'expedition'), i * 100)
    })
  }

  const playChoiceFailure = () => {
    initAudioContext()
    playTone(300, 0.15, 'triangle', 0.3, 'expedition')
    setTimeout(() => playTone(250, 0.2, 'triangle', 0.3, 'expedition'), 150)
  }

  const playReward = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'sine', 0.4, 'reward'), i * 120)
    })
    setTimeout(() => playTone(1567.98, 0.4, 'sine', 0.5, 'reward'), 600)
  }

  const playFirstDiscovery = (rarity = 'rare') => {
    if (!rareDiscoveryEnabled.value) return
    initAudioContext()
    
    const introNotes = [523.25, 659.25, 783.99]
    introNotes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.3, 'discovery'), i * 100)
    })
    
    setTimeout(() => {
      const fanfareNotes = {
        common: [783.99, 987.77, 1174.66],
        uncommon: [783.99, 987.77, 1174.66, 1318.51],
        rare: [659.25, 783.99, 987.77, 1174.66, 1318.51],
        epic: [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51],
        legendary: [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 2093.00]
      }
      const notes = fanfareNotes[rarity] || fanfareNotes.rare
      
      notes.forEach((note, i) => {
        setTimeout(() => {
          playTone(note, 0.25, 'sine', 0.5, 'discovery')
          if (i < notes.length - 1) {
            setTimeout(() => playTone(note * 1.5, 0.1, 'triangle', 0.2, 'discovery'), 50)
          }
        }, i * 120)
      })
      
      setTimeout(() => {
        const finalNote = notes[notes.length - 1]
        playTone(finalNote, 0.6, 'sine', 0.6, 'discovery')
        playTone(finalNote * 2, 0.4, 'triangle', 0.3, 'discovery')
        setTimeout(() => playTone(finalNote * 1.25, 0.3, 'sine', 0.4, 'discovery'), 150)
      }, notes.length * 120)
    }, 350)
    
    setTimeout(() => {
      const chordNotes = [523.25, 659.25, 783.99]
      chordNotes.forEach(note => {
        playTone(note, 0.8, 'sine', 0.15, 'discovery')
      })
    }, 800)
  }

  const playAchievementUnlock = () => {
    initAudioContext()
    const notes = [783.99, 987.77, 1174.66, 1318.51]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'sine', 0.5, 'reward'), i * 100)
    })
    setTimeout(() => {
      playTone(1567.98, 0.4, 'sine', 0.6, 'reward')
      setTimeout(() => playTone(2093.00, 0.3, 'triangle', 0.4, 'reward'), 100)
    }, 450)
  }

  const playSparkle = () => {
    if (!rareDiscoveryEnabled.value) return
    initAudioContext()
    playTone(1567.98, 0.08, 'sine', 0.2, 'discovery')
    setTimeout(() => playTone(2093.00, 0.08, 'sine', 0.15, 'discovery'), 50)
  }

  const playLevelUp = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5, 'reward'), i * 80)
    })
    setTimeout(() => {
      const notes2 = [2093.00, 1567.98, 2093.00, 2637.02]
      notes2.forEach((note, i) => {
        setTimeout(() => playTone(note, 0.2, 'sine', 0.5, 'reward'), i * 100)
      })
    }, 600)
  }

  const playStaminaLow = () => {
    initAudioContext()
    playTone(220, 0.1, 'square', 0.2, 'expedition')
    setTimeout(() => playTone(220, 0.1, 'square', 0.2, 'expedition'), 200)
  }

  const playExploreStep = () => {
    initAudioContext()
    playTone(330, 0.05, 'triangle', 0.2, 'expedition')
  }

  const playQuizStart = () => {
    initAudioContext()
    playTone(523.25, 0.1, 'sine', 0.4, 'quiz')
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.4, 'quiz'), 100)
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.4, 'quiz'), 200)
    setTimeout(() => playTone(1046.50, 0.2, 'sine', 0.5, 'quiz'), 300)
  }

  const playQuizCorrect = () => {
    initAudioContext()
    const notes = [659.25, 783.99, 1046.50]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.12, 'sine', 0.5, 'quiz'), i * 80)
    })
  }

  const playQuizWrong = () => {
    initAudioContext()
    playTone(300, 0.15, 'sawtooth', 0.3, 'quiz')
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.3, 'quiz'), 120)
  }

  const playQuizStreak = (level) => {
    initAudioContext()
    const baseNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
    const count = Math.min(level, 5)
    for (let i = 0; i < count; i++) {
      setTimeout(() => playTone(baseNotes[i], 0.12, 'sine', 0.5, 'quiz'), i * 60)
    }
    setTimeout(() => playTone(1567.98, 0.3, 'sine', 0.6, 'quiz'), count * 60)
  }

  const playQuizTimeout = () => {
    initAudioContext()
    playTone(440, 0.1, 'square', 0.3, 'quiz')
    setTimeout(() => playTone(330, 0.1, 'square', 0.3, 'quiz'), 100)
    setTimeout(() => playTone(220, 0.2, 'square', 0.3, 'quiz'), 200)
  }

  const playQuizComplete = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.18, 'sine', 0.5, 'quiz'), i * 100)
    })
  }

  const playQuizShopBuy = () => {
    initAudioContext()
    playTone(783.99, 0.08, 'sine', 0.4, 'quiz')
    setTimeout(() => playTone(1046.50, 0.08, 'sine', 0.4, 'quiz'), 80)
    setTimeout(() => playTone(1318.51, 0.15, 'sine', 0.5, 'quiz'), 160)
  }

  const playQuizTick = () => {
    initAudioContext()
    playTone(880, 0.03, 'square', 0.15, 'quiz')
  }

  const playAuctionWin = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5, 'market'), i * 100)
    })
    setTimeout(() => playTone(1318.51, 0.4, 'sine', 0.6, 'market'), 400)
  }

  const playAuctionLose = () => {
    initAudioContext()
    playTone(392, 0.15, 'triangle', 0.3, 'market')
    setTimeout(() => playTone(349.23, 0.15, 'triangle', 0.3, 'market'), 150)
    setTimeout(() => playTone(329.63, 0.2, 'triangle', 0.3, 'market'), 300)
  }

  const playComboHit = (level) => {
    initAudioContext()
    const baseFreq = 440 + Math.min(level, 6) * 80
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.1, 'sine', 0.5, 'market'), i * 60)
    })
    setTimeout(() => playTone(baseFreq * 2, 0.3, 'sine', 0.6, 'market'), notes.length * 60)
  }

  const playSniperBid = () => {
    initAudioContext()
    playTone(880, 0.06, 'sine', 0.4, 'market')
    setTimeout(() => playTone(1100, 0.06, 'sine', 0.4, 'market'), 60)
    setTimeout(() => playTone(1320, 0.12, 'sine', 0.5, 'market'), 120)
  }

  const playRatingReveal = (rating) => {
    initAudioContext()
    const ratingFreq = { S: 1046.50, A: 783.99, B: 659.25, C: 523.25, D: 392 }
    const base = ratingFreq[rating] || 523.25
    const notes = [base * 0.5, base * 0.75, base, base * 1.25, base * 1.5]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5, 'gacha'), i * 120)
    })
    if (rating === 'S' || rating === 'A') {
      setTimeout(() => {
        playTone(base * 2, 0.4, 'sine', 0.7, 'gacha')
        setTimeout(() => playTone(base * 2.5, 0.5, 'sine', 0.6, 'gacha'), 200)
      }, notes.length * 120)
    }
  }

  const startBackgroundMusic = () => {
    if (!soundEnabled.value || !musicEnabled.value || !audioContext.value) return
    if (backgroundOscillator.value) return

    initAudioContext()

    const playNote = () => {
      if (!soundEnabled.value || !musicEnabled.value || !audioContext.value) return

      const baseNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]
      const melody = [0, 2, 4, 5, 4, 2, 0, 2, 4, 7, 5, 4, 2, 0, 2, 4]
      let noteIndex = 0

      const playNextNote = () => {
        if (!soundEnabled.value || !musicEnabled.value || !audioContext.value) return

        const note = baseNotes[melody[noteIndex % melody.length]]
        const osc = audioContext.value.createOscillator()
        const gain = audioContext.value.createGain()

        osc.connect(gain)
        gain.connect(audioContext.value.destination)

        osc.type = 'sine'
        osc.frequency.setValueAtTime(note, audioContext.value.currentTime)

        gain.gain.setValueAtTime(0, audioContext.value.currentTime)
        gain.gain.linearRampToValueAtTime(musicVolume.value, audioContext.value.currentTime + 0.1)
        gain.gain.linearRampToValueAtTime(0, audioContext.value.currentTime + 0.5)

        osc.start(audioContext.value.currentTime)
        osc.stop(audioContext.value.currentTime + 0.5)

        noteIndex++
        setTimeout(playNextNote, 500)
      }

      playNextNote()
    }

    playNote()

    const bassOsc = audioContext.value.createOscillator()
    const bassGain = audioContext.value.createGain()

    bassOsc.connect(bassGain)
    bassGain.connect(audioContext.value.destination)

    bassOsc.type = 'triangle'
    bassOsc.frequency.setValueAtTime(65.41, audioContext.value.currentTime)
    bassGain.gain.setValueAtTime(musicVolume.value * 0.5, audioContext.value.currentTime)

    bassOsc.start()
    backgroundOscillator.value = bassOsc
    backgroundGain.value = bassGain
  }

  const stopBackgroundMusic = () => {
    if (backgroundOscillator.value) {
      backgroundOscillator.value.stop()
      backgroundOscillator.value = null
    }
    if (backgroundGain.value) {
      backgroundGain.value = null
    }
  }

  const toggleSound = () => {
    initAudioContext()
    soundEnabled.value = !soundEnabled.value
    if (!soundEnabled.value) {
      stopBackgroundMusic()
    } else if (musicEnabled.value) {
      startBackgroundMusic()
    }
    saveAudioSettings()
  }

  const toggleMusic = () => {
    initAudioContext()
    musicEnabled.value = !musicEnabled.value
    if (musicEnabled.value) {
      startBackgroundMusic()
    } else {
      stopBackgroundMusic()
    }
    saveAudioSettings()
  }

  const toggleRareDiscovery = () => {
    rareDiscoveryEnabled.value = !rareDiscoveryEnabled.value
    saveAudioSettings()
  }

  const setMusicVolume = (volume) => {
    musicVolume.value = Math.max(0, Math.min(1, volume))
    if (backgroundGain.value) {
      backgroundGain.value.gain.setValueAtTime(musicVolume.value * 0.5, audioContext.value.currentTime)
    }
    saveAudioSettings()
  }

  const setSfxVolume = (volume) => {
    sfxVolume.value = Math.max(0, Math.min(1, volume))
    saveAudioSettings()
  }

  const setSceneVolume = (scene, volume) => {
    if (sceneVolumes.value[scene] !== undefined) {
      sceneVolumes.value[scene] = Math.max(0, Math.min(1, volume))
      saveAudioSettings()
    }
  }

  const resetSceneVolumes = () => {
    Object.keys(sceneVolumes.value).forEach(key => {
      sceneVolumes.value[key] = 1.0
    })
    saveAudioSettings()
  }

  const playPreview = (sfxKey) => {
    const sample = SFX_SAMPLES[sfxKey]
    if (!sample) return
    const fn = {
      playClick, playSuccess, playError, playPickup, playDrop, playComplete,
      playRareFound, playExpeditionStart, playEventFound, playExploreStep,
      playQuizStart, playQuizCorrect, playQuizWrong, playQuizTick, playQuizStreak,
      playReward, playAchievementUnlock, playLevelUp, playAuctionWin, playAuctionLose,
      playComboHit, playSparkle, playStaminaLow, playChoiceSuccess, playChoiceFailure,
      playFirstDiscovery
    }[sample.fn]
    if (fn) {
      currentPreviewScene.value = sample.category
      fn(...(sample.args || []))
      setTimeout(() => {
        currentPreviewScene.value = null
      }, 1500)
    }
  }

  const getSamplesByCategory = (categoryId) => {
    return Object.entries(SFX_SAMPLES)
      .filter(([_, sample]) => sample.category === categoryId)
      .map(([key, sample]) => ({ key, ...sample }))
  }

  return {
    soundEnabled,
    musicEnabled,
    musicVolume,
    sfxVolume,
    rareDiscoveryEnabled,
    sceneVolumes,
    currentPreviewScene,
    initAudioContext,
    loadAudioSettings,
    saveAudioSettings,
    playTone,
    playSuccess,
    playClick,
    playPickup,
    playDrop,
    playComplete,
    playRareFound,
    playError,
    playExpeditionStart,
    playEventFound,
    playChoiceSuccess,
    playChoiceFailure,
    playReward,
    playFirstDiscovery,
    playAchievementUnlock,
    playSparkle,
    playLevelUp,
    playStaminaLow,
    playExploreStep,
    playQuizStart,
    playQuizCorrect,
    playQuizWrong,
    playQuizStreak,
    playQuizTimeout,
    playQuizComplete,
    playQuizShopBuy,
    playQuizTick,
    playAuctionWin,
    playAuctionLose,
    playComboHit,
    playSniperBid,
    playRatingReveal,
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleSound,
    toggleMusic,
    toggleRareDiscovery,
    setMusicVolume,
    setSfxVolume,
    setSceneVolume,
    resetSceneVolumes,
    playPreview,
    getSamplesByCategory,
    SCENE_CATEGORIES,
    SFX_SAMPLES
  }
})
