<template>
  <view class="family-create-page">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <text class="nav-title">创建家庭</text>
    </view>

    <!-- 主要内容 -->
    <view class="main-content">
      <!-- 欢迎信息 -->
      <view class="welcome-section">
        <view class="welcome-icon">🏠</view>
        <text class="welcome-title">欢迎使用家账通</text>
        <text class="welcome-desc">创建您的家庭账本，开始智能记账之旅</text>
      </view>

      <!-- 表单区域 -->
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">家庭名称</text>
          <input
            class="form-input"
            v-model="familyName"
            placeholder="请输入家庭名称，如：张家小屋"
            maxlength="20"
          />
          <text class="char-count">{{ familyName.length }}/20</text>
        </view>

        <view class="form-item">
          <text class="form-label">家庭描述</text>
          <textarea
            class="form-textarea"
            v-model="familyDescription"
            placeholder="简单描述一下您的家庭（可选）"
            maxlength="100"
          />
          <text class="char-count">{{ familyDescription.length }}/100</text>
        </view>
      </view>

      <!-- 功能介绍 -->
      <view class="features-section">
        <text class="section-title">家庭记账功能</text>
        <view class="feature-list">
          <view class="feature-item">
            <view class="feature-icon">👨‍👩‍👧‍👦</view>
            <view class="feature-content">
              <text class="feature-name">多人协作</text>
              <text class="feature-desc">邀请家人一起记账，实时同步</text>
            </view>
          </view>
          <view class="feature-item">
            <view class="feature-icon">📊</view>
            <view class="feature-content">
              <text class="feature-name">智能分析</text>
              <text class="feature-desc">自动生成消费报表和趋势分析</text>
            </view>
          </view>
          <view class="feature-item">
            <view class="feature-icon">🔒</view>
            <view class="feature-content">
              <text class="feature-name">隐私保护</text>
              <text class="feature-desc">数据加密存储，仅家庭成员可见</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <button
          class="family-btn"
          :class="{ 'family-btn--disabled': !canCreate }"
          @tap="debouncedHandleCreateFamily"
          :loading="isCreating"
          :disabled="!canCreate || isCreating"
        >
          {{ isCreating ? '创建中...' : '创建家庭' }}
        </button>

        <view class="or-divider">
          <view class="divider-line"></view>
          <text class="divider-text">或者</text>
          <view class="divider-line"></view>
        </view>

        <button
          class="join-btn"
          @tap="goToJoinFamily"
        >
          加入现有家庭
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../../stores'
import { debounce } from '../../../utils/performance/debounce'

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const familyName = ref('')
const familyDescription = ref('')
const isCreating = ref(false)

// 计算属性
const canCreate = computed(() => {
  return familyName.value.trim().length >= 2
})

// 方法
const handleCreateFamily = async () => {
  console.log('[Create] click', familyName.value, canCreate.value, isCreating.value)
  if (!canCreate.value || isCreating.value) return

  try {
    isCreating.value = true

    const success = await familyStore.createFamily({
      name: familyName.value.trim(),
      description: familyDescription.value.trim()
    })

    if (success) {
      // 创建成功，跳转到主页
      Taro.reLaunch({
        url: '/pages/index/index'
      })
    }
  } catch (error) {
    console.error('Create family error:', error)
    appStore.showToast(error.message || '创建失败，请重试', 'none')
  } finally {
    isCreating.value = false
  }
}

const debouncedHandleCreateFamily = debounce(handleCreateFamily, 800)

const goToJoinFamily = () => {
  Taro.navigateTo({
    url: '/pages/family/join/index'
  })
}

// 检查用户状态
const checkUserStatus = () => {
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
    return
  }

  if (userStore.hasFamily) {
    Taro.reLaunch({
      url: '/pages/index/index'
    })
    return
  }
}

// 生命周期
onMounted(() => {
  checkUserStatus()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '创建家庭'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 创建您的家庭账本',
    path: '/pages/family/create/index'
  })
})
</script>

<style lang="scss">
.family-create-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7b267 0%, #f4845f 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx 80rpx 24rpx;
  box-sizing: border-box;
}

.family-card {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
  padding: 40rpx 32rpx 32rpx 32rpx;
  width: 100%;
  max-width: 700rpx;
  margin-bottom: 40rpx;
}

.family-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  text-align: center;
}

.family-desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 32rpx;
  text-align: center;
}

.input-label {
  font-size: 28rpx;
  color: #444;
  margin-bottom: 8rpx;
}

.input-box {
  width: 100%;
  background: #f7f8fa;
  border-radius: 12rpx;
  border: 1rpx solid #eee;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.input-box:focus {
  border-color: #f4845f;
}

.family-feature-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
  margin: 32rpx 0 12rpx 0;
}

.family-feature-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.family-feature-item {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #444;
  margin-bottom: 16rpx;
}

.family-feature-item .icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.family-btn {
  width: 100%;
  background: linear-gradient(135deg, #f4845f 0%, #f7b267 100%);
  color: #222 !important;
  font-size: 36rpx;
  font-weight: bold;
  border: none;
  border-radius: 16rpx;
  padding: 32rpx 0;
  margin-top: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(244,132,95,0.12);
  transition: background 0.2s, color 0.2s;
}

.family-btn--disabled {
  background: #eee !important;
  color: #222 !important;
  opacity: 1 !important;
}

.family-or {
  text-align: center;
  color: #aaa;
  font-size: 28rpx;
  margin: 32rpx 0 24rpx 0;
}
</style>
