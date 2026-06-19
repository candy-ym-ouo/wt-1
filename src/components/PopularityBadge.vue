<template>
  <div class="popularity-badge" :style="badgeStyle">
    <span class="popularity-icon">{{ popularity.icon }}</span>
    <span class="popularity-label">{{ popularity.label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMuseumStore } from '@/stores/museum'

const props = defineProps({
  mineralId: {
    type: Number,
    required: true
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'medium'
  }
})

const museumStore = useMuseumStore()

const popularity = computed(() => museumStore.getMineralPopularity(props.mineralId))

const badgeStyle = computed(() => ({
  backgroundColor: `${popularity.value.color}22`,
  borderColor: popularity.value.color,
  color: popularity.value.color
}))
</script>

<style scoped>
.popularity-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.3);
}

.popularity-icon {
  font-size: 14px;
}

.popularity-label {
  font-size: 12px;
}
</style>
