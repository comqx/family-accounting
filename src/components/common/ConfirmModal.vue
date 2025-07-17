<template>
  <view v-if="visible" class="modal-overlay" @tap="onCancel">
    <view class="modal-content" @tap.stop>
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
      </view>
      <view class="modal-body">
        <slot>
          <text class="modal-message">{{ message }}</text>
        </slot>
      </view>
      <view class="modal-footer">
        <button class="modal-btn cancel" @tap="onCancel">{{ cancelText }}</button>
        <button class="modal-btn confirm" :loading="loading" @tap="onConfirm">{{ confirmText }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>()
const emits = defineEmits(['confirm', 'cancel'])

function onConfirm(e: Event) {
  if (!props.loading) emits('confirm', e)
}
function onCancel(e: Event) {
  emits('cancel', e)
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  border-radius: 20rpx;
  width: 80vw;
  max-width: 600rpx;
  padding: 40rpx 32rpx 24rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-header {
  margin-bottom: 16rpx;
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #222;
}
.modal-body {
  margin-bottom: 32rpx;
  text-align: center;
}
.modal-message {
  font-size: 26rpx;
  color: #666;
}
.modal-footer {
  display: flex;
  width: 100%;
  justify-content: space-between;
}
.modal-btn {
  flex: 1;
  margin: 0 8rpx;
  padding: 20rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  &.cancel {
    background: #f5f6fa;
    color: #888;
  }
  &.confirm {
    background: #3a7afe;
    color: #fff;
  }
}
</style> 