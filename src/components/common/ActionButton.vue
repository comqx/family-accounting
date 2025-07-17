<template>
  <button
    class="action-btn"
    :class="[type, { loading, disabled }]"
    :disabled="disabled || loading"
    @tap="onClick"
  >
    <view v-if="loading" class="btn-loading"><slot name="loading"><text>⏳</text></slot></view>
    <view v-else-if="icon" class="btn-icon"><slot name="icon"><text>{{ icon }}</text></slot></view>
    <text class="btn-text"><slot>{{ text }}</slot></text>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  text?: string
  type?: 'primary' | 'secondary' | 'danger'
  icon?: string
  loading?: boolean
  disabled?: boolean
}>()
const emits = defineEmits(['click'])

function onClick(e: Event) {
  if (!props.disabled && !props.loading) emits('click', e)
}
</script>

<style lang="scss" scoped>
.action-btn {
  width: 100%;
  padding: 24rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  background: #3a7afe;
  color: #fff;
  border: none;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &.secondary {
    background: #f5f6fa;
    color: #3a7afe;
  }
  &.danger {
    background: #e55;
    color: #fff;
  }
  &.loading {
    opacity: 0.7;
  }
  &.disabled {
    background: #ccc;
    color: #fff;
    cursor: not-allowed;
  }
}
.btn-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}
.btn-loading {
  margin-right: 12rpx;
  font-size: 28rpx;
}
.btn-text {
  display: inline-block;
}
</style> 