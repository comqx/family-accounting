<template>
  <view
    class="category-card"
    :class="{ selected, clickable }"
    :style="{ backgroundColor: bgColor }"
    @tap="onClick"
    role="button"
    :aria-pressed="selected"
    :aria-label="category.name"
  >
    <view class="category-icon">{{ category.icon || '📂' }}</view>
    <view class="category-info">
      <text class="category-name">{{ category.name }}</text>
      <text class="category-type" v-if="category.type">{{ typeText }}</text>
    </view>
    <slot name="actions"></slot>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps<{
  category: {
    id: string | number
    name: string
    icon?: string
    color?: string
    type?: string // 'expense' | 'income'
  }
  selected?: boolean
  clickable?: boolean
}>()

const emits = defineEmits(['click'])

const bgColor = computed(() => props.category.color || '#f5f5f5')
const typeText = computed(() => props.category.type === 'income' ? '收入' : props.category.type === 'expense' ? '支出' : '')

function onClick() {
  if (props.clickable) emits('click', props.category)
}
</script>

<style lang="scss" scoped>
.category-card {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  margin-bottom: 16rpx;
  transition: box-shadow 0.2s;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
  &.selected {
    border: 2rpx solid #3a7afe;
    box-shadow: 0 4rpx 16rpx rgba(58,122,254,0.08);
  }
  &.clickable {
    cursor: pointer;
    &:active {
      background: #e6f0ff;
    }
  }
}
.category-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
}
.category-info {
  display: flex;
  flex-direction: column;
}
.category-name {
  font-size: 28rpx;
  color: #222;
  font-weight: 500;
}
.category-type {
  font-size: 20rpx;
  color: #888;
  margin-top: 4rpx;
}
</style> 