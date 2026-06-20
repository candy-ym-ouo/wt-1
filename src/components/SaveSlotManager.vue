<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="save-slot-overlay" @click.self="handleClose">
        <div class="save-slot-modal">
          <div class="ssm-header">
            <div class="ssm-title-row">
              <span class="ssm-title-icon">💾</span>
              <div class="ssm-title-info">
                <h2 class="ssm-title">存档管理</h2>
                <p class="ssm-subtitle">多存档位与独立数据切换</p>
              </div>
            </div>
            <button class="ssm-close-btn" @click="handleClose">✕</button>
          </div>

          <div class="ssm-tabs">
            <button 
              :class="['ssm-tab-btn', { active: activeTab === 'slots' }]"
              @click="activeTab = 'slots'"
            >
              <span>📦</span> 存档位
            </button>
            <button 
              :class="['ssm-tab-btn', { active: activeTab === 'bindings' }]"
              @click="activeTab = 'bindings'"
            >
              <span>🔗</span> 数据绑定
            </button>
            <button 
              :class="['ssm-tab-btn', { active: activeTab === 'import-export' }]"
              @click="activeTab = 'import-export'"
            >
              <span>📤</span> 导入导出
            </button>
          </div>

          <div class="ssm-content">
            <div v-show="activeTab === 'slots'" class="ssm-slots-section">
              <div class="ssm-action-bar">
                <button class="btn btn-small btn-primary" @click="showCreateModal = true">
                  <span>➕</span> 新建存档
                </button>
                <span class="ssm-slot-count">共 {{ slotInfos.length }} 个存档位</span>
              </div>

              <div class="ssm-slots-grid">
                <div 
                  v-for="slot in slotInfos" 
                  :key="slot.id"
                  :class="['ssm-slot-card', { active: slot.id === gameStore.activeSlotId }]"
                >
                  <div class="ssm-slot-header">
                    <div class="ssm-slot-icon">{{ slot.icon }}</div>
                    <div class="ssm-slot-info">
                      <h3 class="ssm-slot-name">
                        {{ slot.name }}
                        <span v-if="slot.id === 'default'" class="ssm-default-tag">默认</span>
                        <span v-if="slot.id === gameStore.activeSlotId" class="ssm-active-tag">当前</span>
                      </h3>
                      <p class="ssm-slot-desc">{{ slot.description || '暂无描述' }}</p>
                    </div>
                  </div>

                  <div v-if="slot.snapshot" class="ssm-slot-stats">
                    <div class="ssm-stat-item">
                      <span class="ssm-stat-icon">💎</span>
                      <span class="ssm-stat-value">{{ slot.snapshot.collectedCount }}</span>
                      <span class="ssm-stat-label">藏品</span>
                    </div>
                    <div class="ssm-stat-item">
                      <span class="ssm-stat-icon">🪙</span>
                      <span class="ssm-stat-value">{{ formatNumber(slot.snapshot.coins) }}</span>
                      <span class="ssm-stat-label">金币</span>
                    </div>
                    <div class="ssm-stat-item">
                      <span class="ssm-stat-icon">🎨</span>
                      <span class="ssm-stat-value">{{ slot.snapshot.completedCollages }}</span>
                      <span class="ssm-stat-label">拼装</span>
                    </div>
                    <div class="ssm-stat-item">
                      <span class="ssm-stat-icon">⭐</span>
                      <span class="ssm-stat-value">Lv.{{ slot.snapshot.expeditionLevel }}</span>
                      <span class="ssm-stat-label">等级</span>
                    </div>
                  </div>

                  <div class="ssm-slot-meta">
                    <span class="ssm-meta-item">
                      <span>📅</span> {{ formatDate(slot.updatedAt) }}
                    </span>
                    <span class="ssm-meta-item">
                      <span>📊</span> {{ formatSize(slot.dataSize) }}
                    </span>
                  </div>

                  <div class="ssm-slot-categories">
                    <span 
                      v-for="cat in slot.categories" 
                      :key="cat"
                      :class="['ssm-category-tag', `cat-${cat}`]"
                      :title="gameStore.DATA_CATEGORY_CONFIG[cat]?.description"
                    >
                      {{ gameStore.DATA_CATEGORY_CONFIG[cat]?.icon }} 
                      {{ gameStore.DATA_CATEGORY_CONFIG[cat]?.name }}
                    </span>
                  </div>

                  <div class="ssm-slot-actions">
                    <button 
                      v-if="slot.id !== gameStore.activeSlotId"
                      class="btn btn-small btn-switch"
                      @click="handleSwitchSlot(slot.id)"
                      title="仅切换活动存档（保留独立数据绑定）"
                    >
                      🔄 切换
                    </button>
                    <button 
                      v-if="slot.id !== gameStore.activeSlotId"
                      class="btn btn-small btn-bind-all"
                      @click="handleBindAllToSlot(slot.id)"
                      title="将所有数据绑定到此存档（覆盖独立绑定）"
                    >
                      ⚡ 全绑定
                    </button>
                    <button 
                      v-else
                      class="btn btn-small btn-current"
                      disabled
                    >
                      ✓ 当前使用中
                    </button>
                    <button 
                      class="btn btn-small btn-secondary"
                      @click="handleDuplicateSlot(slot.id)"
                      title="复制存档"
                    >
                      📋
                    </button>
                    <button 
                      class="btn btn-small btn-secondary"
                      @click="handleQuickExport(slot.id)"
                      title="导出存档"
                    >
                      📤
                    </button>
                    <button 
                      v-if="slot.id !== 'default'"
                      class="btn btn-small btn-danger"
                      @click="handleDeleteSlot(slot.id)"
                      title="删除存档"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'bindings'" class="ssm-bindings-section">
              <div class="ssm-bindings-intro">
                <div class="ssm-info-card">
                  <span class="ssm-info-icon">💡</span>
                  <div class="ssm-info-content">
                    <h4>独立数据绑定</h4>
                    <p>可以将不同类型的数据绑定到不同的存档位，实现灵活的数据组合。例如：图鉴数据使用存档A，而拼装数据使用存档B。</p>
                  </div>
                </div>
              </div>

              <div class="ssm-bindings-list">
                <div 
                  v-for="(config, category) in gameStore.DATA_CATEGORY_CONFIG" 
                  :key="category"
                  class="ssm-binding-item"
                >
                  <div class="ssm-binding-info">
                    <span class="ssm-binding-icon">{{ config.icon }}</span>
                    <div class="ssm-binding-details">
                      <h4 class="ssm-binding-name">{{ config.name }}</h4>
                      <p class="ssm-binding-desc">{{ config.description }}</p>
                    </div>
                  </div>
                  <div class="ssm-binding-select">
                    <select 
                      :value="gameStore.slotCategoryBindings[category]"
                      @change="handleBindingChange(category, $event.target.value)"
                      class="ssm-select"
                    >
                      <option 
                        v-for="slot in slotInfos" 
                        :key="slot.id" 
                        :value="slot.id"
                      >
                        {{ slot.icon }} {{ slot.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="ssm-bindings-actions">
                <button 
                  class="btn btn-secondary"
                  @click="handleResetBindings"
                >
                  ↺ 重置为全部绑定到当前存档
                </button>
              </div>
            </div>

            <div v-show="activeTab === 'import-export'" class="ssm-import-export-section">
              <div class="ssm-ie-grid">
                <div class="ssm-ie-card">
                  <div class="ssm-ie-header">
                    <span class="ssm-ie-icon">📤</span>
                    <h3>导出存档</h3>
                    <p>选择要导出的存档和数据类型，生成JSON文件</p>
                  </div>
                  
                  <div class="ssm-ie-form">
                    <div class="ssm-form-group">
                      <label>选择存档</label>
                      <select v-model="exportSlotId" class="ssm-select">
                        <option 
                          v-for="slot in slotInfos" 
                          :key="slot.id" 
                          :value="slot.id"
                        >
                          {{ slot.icon }} {{ slot.name }}
                        </option>
                      </select>
                    </div>
                    
                    <div class="ssm-form-group">
                      <label>选择导出数据类型</label>
                      <div class="ssm-checkbox-group">
                        <label 
                          v-for="(config, category) in gameStore.DATA_CATEGORY_CONFIG" 
                          :key="category"
                          :class="['ssm-checkbox', { checked: exportCategories.includes(category) }]"
                        >
                          <input 
                            type="checkbox" 
                            :value="category"
                            v-model="exportCategories"
                          />
                          <span class="ssm-checkbox-custom"></span>
                          <span class="ssm-checkbox-label">
                            {{ config.icon }} {{ config.name }}
                          </span>
                        </label>
                      </div>
                    </div>

                    <button 
                      class="btn btn-primary w-full"
                      @click="handleExport"
                      :disabled="exportCategories.length === 0"
                    >
                      📥 导出为JSON文件
                    </button>
                  </div>
                </div>

                <div class="ssm-ie-card">
                  <div class="ssm-ie-header">
                    <span class="ssm-ie-icon">📥</span>
                    <h3>导入存档</h3>
                    <p>选择存档文件导入，可以选择创建新存档或合并到现有存档</p>
                  </div>
                  
                  <div class="ssm-ie-form">
                    <div class="ssm-form-group">
                      <label>导入模式</label>
                      <div class="ssm-radio-group">
                        <label :class="['ssm-radio', { checked: importMode === 'new' }]">
                          <input type="radio" value="new" v-model="importMode" />
                          <span class="ssm-radio-custom"></span>
                          <span>创建新存档</span>
                        </label>
                        <label :class="['ssm-radio', { checked: importMode === 'merge' }]">
                          <input type="radio" value="merge" v-model="importMode" />
                          <span class="ssm-radio-custom"></span>
                          <span>合并到现有存档</span>
                        </label>
                      </div>
                    </div>
                    
                    <div v-if="importMode === 'merge'" class="ssm-form-group">
                      <label>目标存档</label>
                      <select v-model="importTargetSlotId" class="ssm-select">
                        <option 
                          v-for="slot in slotInfos" 
                          :key="slot.id" 
                          :value="slot.id"
                        >
                          {{ slot.icon }} {{ slot.name }}
                        </option>
                      </select>
                    </div>

                    <button 
                      class="btn btn-secondary w-full"
                      @click="handleImport"
                    >
                      📁 选择文件导入
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="importResult" :class="['ssm-import-result', importResult.success ? 'success' : 'error']">
                <span class="ssm-result-icon">{{ importResult.success ? '✓' : '✕' }}</span>
                <span>{{ importResult.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showCreateModal" class="ssm-create-overlay" @click.self="showCreateModal = false">
        <div class="ssm-create-modal">
          <div class="ssm-create-header">
            <h3>新建存档</h3>
            <button class="ssm-close-btn" @click="showCreateModal = false">✕</button>
          </div>
          <div class="ssm-create-form">
            <div class="ssm-form-group">
              <label>存档名称</label>
              <input 
                v-model="newSlotName" 
                type="text" 
                class="ssm-input"
                placeholder="输入存档名称"
                maxlength="20"
              />
            </div>
            <div class="ssm-form-group">
              <label>选择图标</label>
              <div class="ssm-icon-picker">
                <button 
                  v-for="icon in availableIcons" 
                  :key="icon"
                  :class="['ssm-icon-btn', { selected: newSlotIcon === icon }]"
                  @click="newSlotIcon = icon"
                >
                  {{ icon }}
                </button>
              </div>
            </div>
            <div class="ssm-form-group">
              <label>描述（可选）</label>
              <input 
                v-model="newSlotDescription" 
                type="text" 
                class="ssm-input"
                placeholder="存档描述"
                maxlength="50"
              />
            </div>
            <div class="ssm-create-actions">
              <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
              <button 
                class="btn btn-primary" 
                @click="handleCreateSlot"
                :disabled="!newSlotName.trim()"
              >
                创建存档
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showConfirmDialog" class="ssm-confirm-overlay" @click.self="showConfirmDialog = false">
        <div class="ssm-confirm-modal">
          <div class="ssm-confirm-icon">{{ confirmDialog.icon }}</div>
          <h3 class="ssm-confirm-title">{{ confirmDialog.title }}</h3>
          <p class="ssm-confirm-message">{{ confirmDialog.message }}</p>
          <div class="ssm-confirm-actions">
            <button class="btn btn-secondary" @click="showConfirmDialog = false">取消</button>
            <button 
              :class="['btn', confirmDialog.danger ? 'btn-danger' : 'btn-primary']"
              @click="confirmAction"
            >
              {{ confirmDialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastMessage" :class="['ssm-toast', toastSuccess ? 'success' : 'error']">
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'slot-changed', 'binding-changed'])

const gameStore = useGameStore()
const audioStore = useAudioStore()

const activeTab = ref('slots')
const slotInfos = ref([])

const showCreateModal = ref(false)
const newSlotName = ref('')
const newSlotIcon = ref('💾')
const newSlotDescription = ref('')

const showConfirmDialog = ref(false)
const confirmDialog = ref({
  icon: '❓',
  title: '',
  message: '',
  confirmText: '确认',
  danger: false,
  action: null
})

const toastMessage = ref('')
const toastSuccess = ref(true)
let toastTimer = null

const exportSlotId = ref('default')
const exportCategories = ref(['home', 'collage', 'collection'])

const importMode = ref('new')
const importTargetSlotId = ref('default')
const importResult = ref(null)

const availableIcons = ['💾', '🎮', '📦', '🏆', '⭐', '🎯', '🚀', '🌟', '💎', '🎨', '📖', '🏛️']

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const formatDate = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const showToast = (message, success = true) => {
  toastMessage.value = message
  toastSuccess.value = success
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

const refreshSlotInfos = () => {
  slotInfos.value = gameStore.loadAllSlotInfos()
}

watch(() => props.visible, (val) => {
  if (val) {
    refreshSlotInfos()
    importResult.value = null
  }
})

const handleClose = () => {
  audioStore.playClick()
  emit('close')
}

const handleCreateSlot = () => {
  if (!newSlotName.value.trim()) return
  
  audioStore.playClick()
  const newSlot = gameStore.createSlot(
    newSlotName.value.trim(),
    newSlotIcon.value,
    newSlotDescription.value.trim()
  )
  
  if (newSlot) {
    showToast(`存档「${newSlot.name}」创建成功`, true)
    audioStore.playSuccess?.()
    showCreateModal.value = false
    newSlotName.value = ''
    newSlotIcon.value = '💾'
    newSlotDescription.value = ''
    refreshSlotInfos()
  } else {
    showToast('创建失败', false)
    audioStore.playError()
  }
}

const handleDeleteSlot = (slotId) => {
  audioStore.playClick()
  const slot = slotInfos.value.find(s => s.id === slotId)
  if (!slot) return
  
  confirmDialog.value = {
    icon: '⚠️',
    title: '删除存档',
    message: `确定要删除存档「${slot.name}」吗？此操作不可恢复！`,
    confirmText: '删除',
    danger: true,
    action: () => {
      const success = gameStore.deleteSlot(slotId)
      if (success) {
        showToast(`存档「${slot.name}」已删除`, true)
        audioStore.playSuccess?.()
        refreshSlotInfos()
      } else {
        showToast('删除失败', false)
        audioStore.playError()
      }
    }
  }
  showConfirmDialog.value = true
}

const handleSwitchSlot = (slotId) => {
  audioStore.playClick()
  const slot = slotInfos.value.find(s => s.id === slotId)
  if (!slot) return
  
  confirmDialog.value = {
    icon: '🔄',
    title: '切换活动存档',
    message: `确定要切换活动存档为「${slot.name}」吗？\n\n✅ 此操作将保留您的独立数据绑定设置\n✅ 各数据类别仍从各自绑定的存档加载\n✅ 当前进度将自动保存`,
    confirmText: '切换',
    danger: false,
    action: () => {
      const success = gameStore.switchActiveSlot(slotId)
      if (success) {
        showToast(`活动存档已切换为「${slot.name}」`, true)
        audioStore.playSuccess?.()
        refreshSlotInfos()
        emit('slot-changed', slotId)
      } else {
        showToast('切换失败', false)
        audioStore.playError()
      }
    }
  }
  showConfirmDialog.value = true
}

const handleBindAllToSlot = (slotId) => {
  audioStore.playClick()
  const slot = slotInfos.value.find(s => s.id === slotId)
  if (!slot) return
  
  confirmDialog.value = {
    icon: '⚡',
    title: '全部绑定到此存档',
    message: `确定要将首页、拼装、图鉴所有数据都绑定到存档「${slot.name}」吗？\n\n⚠️  此操作将覆盖现有的独立数据绑定\n⚠️  所有数据都将从此存档加载并保存\n✅ 当前进度将自动保存`,
    confirmText: '确认全绑定',
    danger: true,
    action: () => {
      const success = gameStore.bindAllCategoriesToSlot(slotId)
      if (success) {
        showToast(`所有数据已绑定到「${slot.name}」`, true)
        audioStore.playSuccess?.()
        refreshSlotInfos()
        emit('slot-changed', slotId)
        emit('binding-changed', null)
      } else {
        showToast('操作失败', false)
        audioStore.playError()
      }
    }
  }
  showConfirmDialog.value = true
}

const handleDuplicateSlot = (slotId) => {
  audioStore.playClick()
  const slot = slotInfos.value.find(s => s.id === slotId)
  if (!slot) return
  
  const newName = `${slot.name} 副本`
  const newSlot = gameStore.duplicateSlot(slotId, newName, slot.icon)
  
  if (newSlot) {
    showToast(`已复制为「${newSlot.name}」`, true)
    audioStore.playSuccess?.()
    refreshSlotInfos()
  } else {
    showToast('复制失败', false)
    audioStore.playError()
  }
}

const handleQuickExport = (slotId) => {
  audioStore.playClick()
  const success = gameStore.downloadExport(slotId)
  if (success) {
    showToast('导出成功', true)
    audioStore.playSuccess?.()
  } else {
    showToast('导出失败', false)
    audioStore.playError()
  }
}

const handleBindingChange = (category, slotId) => {
  audioStore.playClick()
  const success = gameStore.bindCategoryToSlot(category, slotId)
  if (success) {
    const slot = slotInfos.value.find(s => s.id === slotId)
    const config = gameStore.DATA_CATEGORY_CONFIG[category]
    showToast(`${config?.name} 已绑定到「${slot?.name}」`, true)
    audioStore.playSuccess?.()
    emit('binding-changed', { category, slotId })
  } else {
    showToast('绑定失败', false)
    audioStore.playError()
  }
}

const handleResetBindings = () => {
  audioStore.playClick()
  confirmDialog.value = {
    icon: '↺',
    title: '重置绑定',
    message: '确定要将所有数据类型重置为绑定到当前存档吗？',
    confirmText: '重置',
    danger: false,
    action: () => {
      for (const category of Object.values(gameStore.DATA_CATEGORY)) {
        gameStore.bindCategoryToSlot(category, gameStore.activeSlotId)
      }
      showToast('已重置所有绑定', true)
      audioStore.playSuccess?.()
      emit('binding-changed', null)
    }
  }
  showConfirmDialog.value = true
}

const handleExport = () => {
  if (exportCategories.value.length === 0) return
  
  audioStore.playClick()
  const categories = exportCategories.value.length === Object.keys(gameStore.DATA_CATEGORY).length 
    ? null 
    : exportCategories.value
  
  const success = gameStore.downloadExport(exportSlotId.value, categories)
  if (success) {
    showToast('导出成功', true)
    audioStore.playSuccess?.()
  } else {
    showToast('导出失败', false)
    audioStore.playError()
  }
}

const handleImport = async () => {
  audioStore.playClick()
  
  const targetSlotId = importMode.value === 'merge' ? importTargetSlotId.value : null
  const merge = importMode.value === 'merge'
  
  const result = await gameStore.triggerFileImport(targetSlotId, merge)
  importResult.value = result
  
  if (result.success) {
    showToast(result.message, true)
    audioStore.playSuccess?.()
    refreshSlotInfos()
  } else {
    showToast(result.message, false)
    audioStore.playError()
  }
}

const confirmAction = () => {
  if (confirmDialog.value.action) {
    confirmDialog.value.action()
  }
  showConfirmDialog.value = false
}
</script>

<style scoped>
.save-slot-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 6000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.save-slot-modal {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  max-width: 720px;
  width: 100%;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
  animation: ssmSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes ssmSlideIn {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.ssm-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.1), rgba(168, 85, 247, 0.05));
}

.ssm-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ssm-title-icon {
  font-size: 40px;
  animation: ssmTitleFloat 3s ease-in-out infinite;
}

@keyframes ssmTitleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.ssm-title-info .ssm-title {
  margin: 0 0 2px 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  background: linear-gradient(135deg, #e94560, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.ssm-title-info .ssm-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.ssm-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.ssm-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.ssm-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.ssm-tab-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ssm-tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.ssm-tab-btn.active {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(168, 85, 247, 0.15));
  color: var(--primary);
  border: 1px solid rgba(233, 69, 96, 0.3);
}

.ssm-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.ssm-content::-webkit-scrollbar {
  width: 6px;
}

.ssm-content::-webkit-scrollbar-track {
  background: transparent;
}

.ssm-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.ssm-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ssm-slot-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.ssm-slots-grid {
  display: grid;
  gap: 12px;
}

.ssm-slot-card {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.25s;
}

.ssm-slot-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.ssm-slot-card.active {
  border-color: rgba(233, 69, 96, 0.4);
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.08), var(--bg-card));
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.15);
}

.ssm-slot-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ssm-slot-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.ssm-slot-info {
  flex: 1;
  min-width: 0;
}

.ssm-slot-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ssm-default-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-weight: 600;
}

.ssm-active-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  font-weight: 600;
}

.ssm-slot-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.ssm-slot-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.ssm-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ssm-stat-icon {
  font-size: 16px;
}

.ssm-stat-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.ssm-stat-label {
  font-size: 10px;
  color: var(--text-secondary);
}

.ssm-slot-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 11px;
  color: var(--text-secondary);
}

.ssm-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ssm-slot-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.ssm-category-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
}

.ssm-category-tag.cat-home {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.ssm-category-tag.cat-collage {
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.ssm-category-tag.cat-collection {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.ssm-slot-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-switch {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  color: white;
  border: none;
}

.btn-bind-all {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  border: none;
}

.btn-current {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
  cursor: not-allowed;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.w-full {
  width: 100%;
}

.ssm-bindings-intro {
  margin-bottom: 20px;
}

.ssm-info-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 146, 60, 0.05));
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 14px;
}

.ssm-info-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.ssm-info-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.ssm-info-content p {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.ssm-bindings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ssm-binding-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.ssm-binding-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.ssm-binding-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.ssm-binding-details {
  flex: 1;
}

.ssm-binding-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.ssm-binding-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

.ssm-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-primary);
  font-size: 13px;
  min-width: 160px;
  cursor: pointer;
}

.ssm-select:focus {
  outline: none;
  border-color: var(--primary);
}

.ssm-bindings-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.ssm-ie-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .ssm-ie-grid {
    grid-template-columns: 1fr;
  }
}

.ssm-ie-card {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
}

.ssm-ie-header {
  text-align: center;
  margin-bottom: 16px;
}

.ssm-ie-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.ssm-ie-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.ssm-ie-header p {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.ssm-ie-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ssm-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ssm-form-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.ssm-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-primary);
  font-size: 13px;
}

.ssm-input:focus {
  outline: none;
  border-color: var(--primary);
}

.ssm-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ssm-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--text-primary);
}

.ssm-checkbox:hover {
  background: rgba(255, 255, 255, 0.05);
}

.ssm-checkbox.checked {
  background: rgba(233, 69, 96, 0.1);
  border-color: rgba(233, 69, 96, 0.3);
}

.ssm-checkbox input {
  display: none;
}

.ssm-checkbox-custom {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ssm-checkbox.checked .ssm-checkbox-custom {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border-color: #e94560;
}

.ssm-checkbox.checked .ssm-checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.ssm-radio-group {
  display: flex;
  gap: 8px;
}

.ssm-radio {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: var(--text-primary);
}

.ssm-radio:hover {
  background: rgba(255, 255, 255, 0.05);
}

.ssm-radio.checked {
  background: rgba(233, 69, 96, 0.15);
  border-color: rgba(233, 69, 96, 0.4);
}

.ssm-radio input {
  display: none;
}

.ssm-radio-custom {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ssm-radio.checked .ssm-radio-custom {
  border-color: #e94560;
}

.ssm-radio.checked .ssm-radio-custom::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e94560;
}

.ssm-import-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.ssm-import-result.success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.ssm-import-result.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.ssm-result-icon {
  font-size: 16px;
}

.ssm-create-overlay,
.ssm-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 6100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ssm-create-modal,
.ssm-confirm-modal {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  max-width: 420px;
  width: 100%;
  padding: 24px;
  animation: ssmModalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes ssmModalPop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.ssm-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ssm-create-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.ssm-create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ssm-icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ssm-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.ssm-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.ssm-icon-btn.selected {
  background: rgba(233, 69, 96, 0.2);
  border-color: #e94560;
}

.ssm-create-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.ssm-create-actions .btn {
  flex: 1;
}

.ssm-confirm-modal {
  text-align: center;
  max-width: 360px;
}

.ssm-confirm-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.ssm-confirm-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.ssm-confirm-message {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.ssm-confirm-actions {
  display: flex;
  gap: 10px;
}

.ssm-confirm-actions .btn {
  flex: 1;
}

.ssm-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 7000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: toastIn 0.3s ease-out;
}

.ssm-toast.success {
  background: rgba(34, 197, 94, 0.95);
  color: white;
}

.ssm-toast.error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

@media (max-width: 560px) {
  .save-slot-modal {
    max-height: 92vh;
    border-radius: 18px;
  }
  
  .ssm-header,
  .ssm-tabs,
  .ssm-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  
  .ssm-slot-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .ssm-binding-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .ssm-binding-select {
    width: 100%;
  }
  
  .ssm-select {
    width: 100%;
  }
}
</style>
