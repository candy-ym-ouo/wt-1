<template>
  <div class="pixi-collage-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    <div v-if="!gameStarted" class="start-overlay">
      <div class="start-content">
        <div class="mineral-preview" v-if="mineral">
          <span class="mineral-emoji">{{ mineral.emoji }}</span>
          <div class="mineral-info">
            <h3 class="mineral-name">{{ mineral.name }}</h3>
            <span :class="['rarity-badge', `rarity-${mineral.rarity}`]">
              {{ rarityConfig.name }}
            </span>
          </div>
        </div>
        <p class="hint">将所有碎片拖放到正确位置，拼出完整的矿物标本</p>
        <button class="btn start-btn" @click="startGame">
          开始拼装
        </button>
      </div>
    </div>
    <div v-if="gameStarted && !isComplete" class="game-hud">
      <div class="progress-info">
        <span class="placed-count">{{ placedCount }}/{{ totalCount }}</span>
        <span class="mineral-name-hud">{{ mineral?.name }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import * as PIXI from 'pixi.js'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { RARITY_CONFIG } from '@/data/rarity'

const props = defineProps({
  mineral: Object,
  pieces: Array
})

const emit = defineEmits(['complete'])

const containerRef = ref(null)
const canvasRef = ref(null)
const gameStarted = ref(false)
const isComplete = ref(false)

const gameStore = useGameStore()
const audioStore = useAudioStore()

let app = null
let pieceSprites = []
let targetMarkers = []
let draggedPiece = null
let dragOffset = { x: 0, y: 0 }
let animationFrame = null

const rarityConfig = computed(() => {
  return props.mineral ? RARITY_CONFIG[props.mineral.rarity] : RARITY_CONFIG.common
})

const placedCount = computed(() => {
  return props.pieces?.filter(p => p.isPlaced).length || 0
})

const totalCount = computed(() => props.pieces?.length || 0)

const progressPercent = computed(() => {
  return totalCount.value > 0 ? (placedCount.value / totalCount.value) * 100 : 0
})

const initPixiApp = async () => {
  if (!containerRef.value || !canvasRef.value) return

  const container = containerRef.value
  const rect = container.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  app = new PIXI.Application({
    width,
    height,
    view: canvasRef.value,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })

  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen

  drawBackground()
  createTargetMarkers()
  createPieces()

  app.ticker.add(animate)
}

const drawBackground = () => {
  const bg = new PIXI.Graphics()
  bg.beginFill(0x1e293b, 0.3)
  bg.drawRoundedRect(10, 10, app.screen.width - 20, app.screen.height - 20, 16)
  bg.endFill()
  bg.lineStyle(2, 0x334155, 0.5)
  bg.drawRoundedRect(10, 10, app.screen.width - 20, app.screen.height - 20, 16)
  app.stage.addChild(bg)

  const centerX = app.screen.width / 2
  const centerY = app.screen.height / 2
  const outline = new PIXI.Graphics()
  outline.lineStyle(3, parseInt(rarityConfig.value.color.replace('#', ''), 16), 0.3)
  outline.drawCircle(centerX, centerY, 140)
  outline.endFill()
  app.stage.addChild(outline)

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const x = centerX + Math.cos(angle) * 140
    const y = centerY + Math.sin(angle) * 140
    const dot = new PIXI.Graphics()
    dot.beginFill(parseInt(rarityConfig.value.color.replace('#', ''), 16), 0.5)
    dot.drawCircle(x, y, 4)
    dot.endFill()
    app.stage.addChild(dot)
  }
}

const createTargetMarkers = () => {
  if (!props.pieces) return

  const centerX = app.screen.width / 2
  const centerY = app.screen.height / 2
  const offsetX = centerX - 200
  const offsetY = centerY - 200

  props.pieces.forEach((piece) => {
    const marker = new PIXI.Graphics()
    marker.lineStyle(2, parseInt(rarityConfig.value.color.replace('#', ''), 16), 0.4)
    marker.beginFill(0xffffff, 0.05)
    
    drawShape(marker, piece.shape, piece.targetX + offsetX, piece.targetY + offsetY, piece.size * 0.8)
    
    marker.endFill()
    marker.alpha = 0.5
    app.stage.addChild(marker)
    targetMarkers.push(marker)
  })
}

const drawShape = (graphics, shape, x, y, size) => {
  const sides = {
    hexagon: 6,
    diamond: 4,
    triangle: 3,
    pentagon: 5
  }

  const numSides = sides[shape] || 6
  const angleOffset = -Math.PI / 2

  graphics.moveTo(
    x + size * Math.cos(angleOffset),
    y + size * Math.sin(angleOffset)
  )

  for (let i = 1; i <= numSides; i++) {
    const angle = angleOffset + (i * 2 * Math.PI / numSides)
    graphics.lineTo(
      x + size * Math.cos(angle),
      y + size * Math.sin(angle)
    )
  }

  graphics.closePath()
}

const createPieces = () => {
  if (!props.pieces) return

  const centerX = app.screen.width / 2
  const centerY = app.screen.height / 2
  const offsetX = centerX - 200
  const offsetY = centerY - 200

  props.pieces.forEach((piece, index) => {
    const container = new PIXI.Container()
    
    const sprite = new PIXI.Graphics()
    const color = parseInt(piece.color.replace('#', ''), 16)
    
    sprite.beginFill(color, 0.9)
    drawShape(sprite, piece.shape, 0, 0, piece.size)
    sprite.endFill()
    
    sprite.lineStyle(2, 0xffffff, 0.5)
    drawShape(sprite, piece.shape, 0, 0, piece.size)

    const highlight = new PIXI.Graphics()
    highlight.beginFill(0xffffff, 0.3)
    drawShape(highlight, piece.shape, -piece.size * 0.2, -piece.size * 0.2, piece.size * 0.5)
    highlight.endFill()

    container.addChild(sprite)
    container.addChild(highlight)

    container.x = piece.startX + offsetX
    container.y = piece.startY + offsetY
    container.rotation = piece.rotation * Math.PI / 180
    container.pivot.set(0, 0)
    container.eventMode = 'static'
    container.cursor = 'grab'
    container.alpha = 0.9

    container.pieceId = piece.id
    container.isPlaced = piece.isPlaced

    container
      .on('pointerdown', (e) => onDragStart(e, container, piece))
      .on('pointermove', onDragMove)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointercancel', onDragEnd)

    app.stage.addChild(container)
    pieceSprites.push(container)

    animatePieceEntrance(container, index * 100)
  })
}

const animatePieceEntrance = (sprite, delay) => {
  sprite.scale.set(0)
  sprite.alpha = 0

  setTimeout(() => {
    const startTime = Date.now()
    const duration = 500

    const animateIn = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)

      sprite.scale.set(ease)
      sprite.alpha = ease

      if (progress < 1) {
        requestAnimationFrame(animateIn)
      }
    }

    animateIn()
  }, delay)
}

const onDragStart = (event, sprite, piece) => {
  if (sprite.isPlaced) return

  audioStore.playPickup()
  
  draggedPiece = sprite
  const position = event.data.getLocalPosition(sprite.parent)
  dragOffset.x = position.x - sprite.x
  dragOffset.y = position.y - sprite.y

  sprite.cursor = 'grabbing'
  sprite.alpha = 1
  sprite.scale.set(1.1)
  
  app.stage.removeChild(sprite)
  app.stage.addChild(sprite)
}

const onDragMove = (event) => {
  if (!draggedPiece) return

  const position = event.data.getLocalPosition(draggedPiece.parent)
  draggedPiece.x = position.x - dragOffset.x
  draggedPiece.y = position.y - dragOffset.y
}

const onDragEnd = () => {
  if (!draggedPiece) return

  const piece = props.pieces.find(p => p.id === draggedPiece.pieceId)
  const centerX = app.screen.width / 2
  const centerY = app.screen.height / 2
  const offsetX = centerX - 200
  const offsetY = centerY - 200

  const targetX = piece.targetX + offsetX
  const targetY = piece.targetY + offsetY
  const distance = Math.sqrt(
    Math.pow(draggedPiece.x - targetX, 2) +
    Math.pow(draggedPiece.y - targetY, 2)
  )

  const snapDistance = 50

  if (distance < snapDistance) {
    audioStore.playDrop()
    animatePieceToTarget(draggedPiece, targetX, targetY, piece)
  } else {
    draggedPiece.cursor = 'grab'
    draggedPiece.scale.set(1)
    audioStore.playError()
  }

  draggedPiece = null
}

const animatePieceToTarget = (sprite, targetX, targetY, piece) => {
  const startX = sprite.x
  const startY = sprite.y
  const startRot = sprite.rotation
  const startTime = Date.now()
  const duration = 300

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)

    sprite.x = startX + (targetX - startX) * ease
    sprite.y = startY + (targetY - startY) * ease
    sprite.rotation = startRot + (-startRot) * ease
    sprite.scale.set(1 + 0.2 * Math.sin(progress * Math.PI))

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate)
    } else {
      sprite.isPlaced = true
      sprite.eventMode = 'none'
      sprite.cursor = 'default'
      
      createGlowEffect(targetX, targetY, piece)
      
      const complete = gameStore.placePiece(piece.id)
      if (complete) {
        audioStore.playComplete()
        isComplete.value = true
        emit('complete')
      } else {
        audioStore.playSuccess()
      }
    }
  }

  animate()
}

const createGlowEffect = (x, y, piece) => {
  const color = parseInt(piece.color.replace('#', ''), 16)
  
  for (let i = 0; i < 8; i++) {
    const particle = new PIXI.Graphics()
    particle.beginFill(color, 1)
    particle.drawCircle(0, 0, 4)
    particle.endFill()
    
    particle.x = x
    particle.y = y
    particle.alpha = 0
    
    app.stage.addChild(particle)

    const angle = (i / 8) * Math.PI * 2
    const distance = 40 + Math.random() * 20
    const targetX = x + Math.cos(angle) * distance
    const targetY = y + Math.sin(angle) * distance
    const startTime = Date.now()
    const duration = 600

    const animateParticle = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      particle.x = x + (targetX - x) * progress
      particle.y = y + (targetY - y) * progress
      particle.alpha = progress < 0.5 ? progress * 2 : 2 - progress * 2
      particle.scale.set(1 - progress * 0.5)

      if (progress < 1) {
        requestAnimationFrame(animateParticle)
      } else {
        app.stage.removeChild(particle)
        particle.destroy()
      }
    }

    animateParticle()
  }
}

const animate = () => {
  pieceSprites.forEach((sprite, index) => {
    if (!sprite.isPlaced && sprite !== draggedPiece) {
      const time = Date.now() * 0.001 + index * 0.5
      sprite.y += Math.sin(time) * 0.3
    }
  })
}

const startGame = () => {
  audioStore.playClick()
  audioStore.startBackgroundMusic()
  gameStarted.value = true
  
  if (props.mineral && props.mineral.rarity === 'legendary') {
    audioStore.playRareFound()
  }
}

const cleanup = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  
  if (app) {
    app.ticker.remove(animate)
    app.destroy(true, { children: true, texture: true, baseTexture: true })
    app = null
  }
  
  pieceSprites = []
  targetMarkers = []
  draggedPiece = null
}

watch(() => props.pieces, () => {
  if (gameStarted.value && app) {
    pieceSprites.forEach(sprite => {
      const piece = props.pieces.find(p => p.id === sprite.pieceId)
      if (piece && piece.isPlaced && !sprite.isPlaced) {
        const centerX = app.screen.width / 2
        const centerY = app.screen.height / 2
        const offsetX = centerX - 200
        const offsetY = centerY - 200
        sprite.isPlaced = true
        sprite.x = piece.targetX + offsetX
        sprite.y = piece.targetY + offsetY
        sprite.rotation = 0
        sprite.eventMode = 'none'
      }
    })
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initPixiApp()
  })

  const handleResize = () => {
    if (app && containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      app.renderer.resize(rect.width, rect.height)
    }
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.pixi-collage-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.start-content {
  text-align: center;
  padding: 32px;
}

.mineral-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.mineral-emoji {
  font-size: 72px;
  animation: float 3s ease-in-out infinite;
}

.mineral-info {
  text-align: left;
}

.mineral-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.rarity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.hint {
  color: var(--text-secondary);
  font-size: 16px;
  margin-bottom: 32px;
  max-width: 300px;
}

.start-btn {
  min-width: 160px;
  font-size: 18px;
  padding: 16px 32px;
}

.game-hud {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 5;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.placed-count {
  background: var(--bg-card);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  color: var(--primary);
  font-size: 16px;
}

.mineral-name-hud {
  color: var(--text-secondary);
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b);
  border-radius: 4px;
  transition: width 0.3s ease;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
