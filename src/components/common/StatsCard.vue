<template>
  <view class="stats-card" :class="customClass">
    <slot name="header">
      <view class="stats-header" v-if="title">
        <text class="stats-title">{{ title }}</text>
      </view>
    </slot>
    <view class="stats-content">
      <view v-for="(item, idx) in stats" :key="item.label + '-' + idx" class="stats-item">
        <text class="stats-label">{{ item.label }}</text>
        <text class="stats-value" :class="item.type">{{ item.prefix || '' }}{{ formatAmount(item.value) }}</text>
        <view v-if="idx < stats.length - 1" class="stats-divider"></view>
      </view>
    </view>
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { formatAmount } from '../../utils/format'

defineProps<{
  title?: string
  stats: Array<{
    label: string
    value: number
    type?: string // 'expense' | 'income' | 'balance' | ...
    prefix?: string
  }>
  customClass?: string
}>()
</script>

<style lang="scss" scoped>
.stats-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
}
.stats-header {
  margin-bottom: 16rpx;
}
.stats-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #222;
}
.stats-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stats-label {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 8rpx;
}
.stats-value {
  font-size: 32rpx;
  font-weight: bold;
  &.expense { color: #e55; }
  &.income { color: #2abf6a; }
  &.balance { color: #3a7afe; }
}
.stats-divider {
  width: 1rpx;
  height: 40rpx;
  background: #eee;
  margin: 0 16rpx;
}
</style> 