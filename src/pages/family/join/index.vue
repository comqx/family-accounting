<template>
  <view class="family-join-page">
    <view class="form-section">
      <input class="form-input" v-model="inviteCode" placeholder="请输入邀请码" maxlength="8" @input="onInviteCodeInput" />
      <button class="join-btn" @tap="handleJoin" :loading="isJoining" :disabled="!canJoin || isJoining">
        {{ isJoining ? '加入中...' : '加入' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../../stores'

const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

const inviteCode = ref('')
const isJoining = ref(false)

const canJoin = computed(() => inviteCode.value.length === 8)

const onInviteCodeInput = (e) => {
  // 只允许输入数字和字母
  const value = e.detail.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  inviteCode.value = value
}

const handleJoin = async () => {
  if (!canJoin.value || isJoining.value) return
  try {
    isJoining.value = true
    await familyStore.joinFamily(inviteCode.value)
    appStore.showToast('加入成功', 'success')
    setTimeout(() => {
      Taro.navigateBack()
    }, 1000)
  } catch (error) {
    appStore.showToast(error.message || '加入失败', 'none')
  } finally {
    isJoining.value = false
  }
}
</script>

<style lang="scss" scoped>
.family-join-page {
  min-height: 100vh;
  background: #f8f9fa;
  .form-section {
    padding: 30rpx;
    .form-input {
      width: 100%;
      padding: 24rpx 20rpx;
      border: 2rpx solid #e0e0e0;
      border-radius: 12rpx;
      font-size: 30rpx;
      color: #333;
      background: #fafafa;
      margin-bottom: 30rpx;
      &:focus {
        border-color: #1296db;
        background: white;
      }
      &::placeholder {
        color: #999;
      }
    }
    .join-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50rpx;
      padding: 28rpx 0;
      font-size: 32rpx;
      font-weight: bold;
      &.disabled {
        background: #ccc;
        opacity: 0.6;
      }
      &::after {
        border: none;
      }
    }
  }
}
</style>
