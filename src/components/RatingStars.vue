<template>
  <div class="rating-stars" :class="{ interactive, readonly: !interactive }">
    <div 
      v-for="star in 5" 
      :key="star"
      class="star"
      :class="{ active: star <= displayValue, half: star - 0.5 <= displayValue && star > displayValue }"
      @click="handleClick(star)"
      @mouseenter="handleHover(star)"
      @mouseleave="handleLeave"
    >
      <span class="star-icon">{{ getStarIcon(star) }}</span>
    </div>
    <span v-if="showValue" class="rating-value">{{ displayValue.toFixed(1) }}</span>
    <span v-if="showCount && totalCount" class="rating-count">({{ totalCount }}人)</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  interactive: {
    type: Boolean,
    default: false
  },
  showValue: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: false
  },
  totalCount: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'medium'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const hoverValue = ref(0)

const displayValue = computed(() => {
  if (hoverValue.value > 0) return hoverValue.value
  return props.modelValue || 0
})

const getStarIcon = (star) => {
  if (star <= displayValue.value) return '⭐'
  if (star - 0.5 <= displayValue.value) return '🌟'
  return '☆'
}

const handleClick = (star) => {
  if (!props.interactive) return
  emit('update:modelValue', star)
  emit('change', star)
}

const handleHover = (star) => {
  if (!props.interactive) return
  hoverValue.value = star
}

const handleLeave = () => {
  hoverValue.value = 0
}
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.rating-stars.readonly .star {
  cursor: default;
}

.star {
  cursor: pointer;
  transition: transform 0.15s ease;
  line-height: 1;
}

.rating-stars:not(.readonly) .star:hover {
  transform: scale(1.2);
}

.star-icon {
  font-size: 20px;
  filter: grayscale(0.3);
}

.star.active .star-icon {
  filter: grayscale(0) drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
}

.star.half .star-icon {
  filter: grayscale(0) drop-shadow(0 0 4px rgba(251, 191, 36, 0.3));
}

.rating-value {
  margin-left: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
}

.rating-count {
  margin-left: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

:deep(.size-small) .star-icon {
  font-size: 14px;
}

:deep(.size-large) .star-icon {
  font-size: 28px;
}
</style>
