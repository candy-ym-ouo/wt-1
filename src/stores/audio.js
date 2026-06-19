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
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleSound,
    toggleMusic,
    setMusicVolume,
    setSfxVolume
  }
})
