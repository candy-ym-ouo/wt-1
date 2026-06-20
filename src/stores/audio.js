import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'

const AUDIO_STORAGE_KEY = 'mineral_collage_audio_settings'

export const useAudioStore = defineStore('audio', () => {
  const soundEnabled = ref(true)
  const musicEnabled = ref(true)
  const audioContext = ref(null)
  const backgroundOscillator = ref(null)
  const backgroundGain = ref(null)
  const musicVolume = ref(0.15)
  const sfxVolume = ref(0.3)

  const saveAudioSettings = () => {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
        soundEnabled: soundEnabled.value,
        musicEnabled: musicEnabled.value,
        musicVolume: musicVolume.value,
        sfxVolume: sfxVolume.value
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

  const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
    if (!soundEnabled.value || !audioContext.value) return

    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.value.currentTime)

    gainNode.gain.setValueAtTime(volume * sfxVolume.value, audioContext.value.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.value.currentTime + duration)

    oscillator.start(audioContext.value.currentTime)
    oscillator.stop(audioContext.value.currentTime + duration)
  }

  const playSuccess = () => {
    initAudioContext()
    setTimeout(() => playTone(523.25, 0.1, 'sine', 0.4), 0)
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.4), 100)
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.5), 200)
  }

  const playClick = () => {
    initAudioContext()
    playTone(800, 0.08, 'square', 0.2)
  }

  const playPickup = () => {
    initAudioContext()
    playTone(440, 0.05, 'triangle', 0.3)
    setTimeout(() => playTone(550, 0.05, 'triangle', 0.3), 50)
  }

  const playDrop = () => {
    initAudioContext()
    playTone(330, 0.1, 'triangle', 0.3)
  }

  const playComplete = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.3, 'sine', 0.5), i * 150)
    })
    setTimeout(() => playTone(1318.51, 0.6, 'sine', 0.6), 600)
  }

  const playRareFound = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5), i * 80)
    })
  }

  const playError = () => {
    initAudioContext()
    playTone(200, 0.15, 'sawtooth', 0.3)
    setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.3), 100)
  }

  const playExpeditionStart = () => {
    initAudioContext()
    playTone(392, 0.1, 'triangle', 0.4)
    setTimeout(() => playTone(523.25, 0.1, 'triangle', 0.4), 100)
    setTimeout(() => playTone(659.25, 0.15, 'triangle', 0.4), 200)
  }

  const playEventFound = () => {
    initAudioContext()
    playTone(440, 0.08, 'sine', 0.3)
    setTimeout(() => playTone(550, 0.08, 'sine', 0.3), 80)
    setTimeout(() => playTone(660, 0.12, 'sine', 0.3), 160)
  }

  const playChoiceSuccess = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.4), i * 100)
    })
  }

  const playChoiceFailure = () => {
    initAudioContext()
    playTone(300, 0.15, 'triangle', 0.3)
    setTimeout(() => playTone(250, 0.2, 'triangle', 0.3), 150)
  }

  const playReward = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'sine', 0.4), i * 120)
    })
    setTimeout(() => playTone(1567.98, 0.4, 'sine', 0.5), 600)
  }

  const playFirstDiscovery = (rarity = 'rare') => {
    initAudioContext()
    
    const introNotes = [523.25, 659.25, 783.99]
    introNotes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.3), i * 100)
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
          playTone(note, 0.25, 'sine', 0.5)
          if (i < notes.length - 1) {
            setTimeout(() => playTone(note * 1.5, 0.1, 'triangle', 0.2), 50)
          }
        }, i * 120)
      })
      
      setTimeout(() => {
        const finalNote = notes[notes.length - 1]
        playTone(finalNote, 0.6, 'sine', 0.6)
        playTone(finalNote * 2, 0.4, 'triangle', 0.3)
        setTimeout(() => playTone(finalNote * 1.25, 0.3, 'sine', 0.4), 150)
      }, notes.length * 120)
    }, 350)
    
    setTimeout(() => {
      const chordNotes = [523.25, 659.25, 783.99]
      chordNotes.forEach(note => {
        playTone(note, 0.8, 'sine', 0.15)
      })
    }, 800)
  }

  const playAchievementUnlock = () => {
    initAudioContext()
    const notes = [783.99, 987.77, 1174.66, 1318.51]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'sine', 0.5), i * 100)
    })
    setTimeout(() => {
      playTone(1567.98, 0.4, 'sine', 0.6)
      setTimeout(() => playTone(2093.00, 0.3, 'triangle', 0.4), 100)
    }, 450)
  }

  const playSparkle = () => {
    initAudioContext()
    playTone(1567.98, 0.08, 'sine', 0.2)
    setTimeout(() => playTone(2093.00, 0.08, 'sine', 0.15), 50)
  }

  const playLevelUp = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5), i * 80)
    })
    setTimeout(() => {
      const notes2 = [2093.00, 1567.98, 2093.00, 2637.02]
      notes2.forEach((note, i) => {
        setTimeout(() => playTone(note, 0.2, 'sine', 0.5), i * 100)
      })
    }, 600)
  }

  const playStaminaLow = () => {
    initAudioContext()
    playTone(220, 0.1, 'square', 0.2)
    setTimeout(() => playTone(220, 0.1, 'square', 0.2), 200)
  }

  const playExploreStep = () => {
    initAudioContext()
    playTone(330, 0.05, 'triangle', 0.2)
  }

  const playQuizStart = () => {
    initAudioContext()
    playTone(523.25, 0.1, 'sine', 0.4)
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.4), 100)
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.4), 200)
    setTimeout(() => playTone(1046.50, 0.2, 'sine', 0.5), 300)
  }

  const playQuizCorrect = () => {
    initAudioContext()
    const notes = [659.25, 783.99, 1046.50]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.12, 'sine', 0.5), i * 80)
    })
  }

  const playQuizWrong = () => {
    initAudioContext()
    playTone(300, 0.15, 'sawtooth', 0.3)
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.3), 120)
  }

  const playQuizStreak = (level) => {
    initAudioContext()
    const baseNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
    const count = Math.min(level, 5)
    for (let i = 0; i < count; i++) {
      setTimeout(() => playTone(baseNotes[i], 0.12, 'sine', 0.5), i * 60)
    }
    setTimeout(() => playTone(1567.98, 0.3, 'sine', 0.6), count * 60)
  }

  const playQuizTimeout = () => {
    initAudioContext()
    playTone(440, 0.1, 'square', 0.3)
    setTimeout(() => playTone(330, 0.1, 'square', 0.3), 100)
    setTimeout(() => playTone(220, 0.2, 'square', 0.3), 200)
  }

  const playQuizComplete = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.18, 'sine', 0.5), i * 100)
    })
  }

  const playQuizShopBuy = () => {
    initAudioContext()
    playTone(783.99, 0.08, 'sine', 0.4)
    setTimeout(() => playTone(1046.50, 0.08, 'sine', 0.4), 80)
    setTimeout(() => playTone(1318.51, 0.15, 'sine', 0.5), 160)
  }

  const playQuizTick = () => {
    initAudioContext()
    playTone(880, 0.03, 'square', 0.15)
  }

  const playAuctionWin = () => {
    initAudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5), i * 100)
    })
    setTimeout(() => playTone(1318.51, 0.4, 'sine', 0.6), 400)
  }

  const playAuctionLose = () => {
    initAudioContext()
    playTone(392, 0.15, 'triangle', 0.3)
    setTimeout(() => playTone(349.23, 0.15, 'triangle', 0.3), 150)
    setTimeout(() => playTone(329.63, 0.2, 'triangle', 0.3), 300)
  }

  const playComboHit = (level) => {
    initAudioContext()
    const baseFreq = 440 + Math.min(level, 6) * 80
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.1, 'sine', 0.5), i * 60)
    })
    setTimeout(() => playTone(baseFreq * 2, 0.3, 'sine', 0.6), notes.length * 60)
  }

  const playSniperBid = () => {
    initAudioContext()
    playTone(880, 0.06, 'sine', 0.4)
    setTimeout(() => playTone(1100, 0.06, 'sine', 0.4), 60)
    setTimeout(() => playTone(1320, 0.12, 'sine', 0.5), 120)
  }

  const playRatingReveal = (rating) => {
    initAudioContext()
    const ratingFreq = { S: 1046.50, A: 783.99, B: 659.25, C: 523.25, D: 392 }
    const base = ratingFreq[rating] || 523.25
    const notes = [base * 0.5, base * 0.75, base, base * 1.25, base * 1.5]
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'sine', 0.5), i * 120)
    })
    if (rating === 'S' || rating === 'A') {
      setTimeout(() => {
        playTone(base * 2, 0.4, 'sine', 0.7)
        setTimeout(() => playTone(base * 2.5, 0.5, 'sine', 0.6), 200)
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

  return {
    soundEnabled,
    musicEnabled,
    musicVolume,
    sfxVolume,
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
    setMusicVolume,
    setSfxVolume
  }
})
