<template>
  <view class="skeleton" :class="type">
    <template v-if="type === 'card'">
      <view class="skeleton-card" v-for="n in rows" :key="n">
        <view class="skeleton-title"></view>
        <view class="skeleton-content"></view>
      </view>
    </template>
    <template v-else-if="type === 'list'">
      <view class="skeleton-list-item" v-for="n in rows" :key="n">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-lines">
          <view class="skeleton-line short"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>
    </template>
    <template v-else-if="type === 'text'">
      <view class="skeleton-line" v-for="n in rows" :key="n"></view>
    </template>
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  type?: 'card' | 'list' | 'text'
  rows?: number
}>()
</script>

<style lang="scss" scoped>
.skeleton {
  width: 100%;
  &.card {
    .skeleton-card {
      background: #f5f6fa;
      border-radius: 16rpx;
      margin-bottom: 24rpx;
      padding: 32rpx 24rpx;
      .skeleton-title {
        width: 40%;
        height: 28rpx;
        background: #eaeaea;
        border-radius: 8rpx;
        margin-bottom: 16rpx;
      }
      .skeleton-content {
        width: 100%;
        height: 20rpx;
        background: #eaeaea;
        border-radius: 8rpx;
      }
    }
  }
  &.list {
    .skeleton-list-item {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
    }
    .skeleton-avatar {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: #eaeaea;
      margin-right: 16rpx;
    }
    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .skeleton-line {
      height: 18rpx;
      background: #eaeaea;
      border-radius: 8rpx;
      margin-bottom: 8rpx;
      &.short {
        width: 60%;
      }
      &:not(.short) {
        width: 100%;
      }
    }
  }
  &.text {
    .skeleton-line {
      width: 100%;
      height: 18rpx;
      background: #eaeaea;
      border-radius: 8rpx;
      margin-bottom: 8rpx;
    }
  }
}
</style> 