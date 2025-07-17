<template>
  <view class="empty-state">
    <view class="empty-icon">
      <slot name="icon">
        <text class="default-icon">🗂️</text>
      </slot>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
    <slot name="action"></slot>
  </view>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  title: string
  desc?: string
}>()
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 0;
  color: #bbb;
}
.empty-icon {
  font-size: 64rpx;
  margin-bottom: 24rpx;
}
.default-icon {
  font-size: 64rpx;
}
.empty-title {
  font-size: 28rpx;
  color: #888;
  margin-bottom: 8rpx;
}
.empty-desc {
  font-size: 22rpx;
  color: #bbb;
  margin-bottom: 16rpx;
}
</style> 