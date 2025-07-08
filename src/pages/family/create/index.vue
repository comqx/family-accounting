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
            :value="familyForm.name"
            @input="onNameInput"
            placeholder="请输入家庭名称，如：张家小屋"
            maxlength="20"
          />
          <text class="char-count">{{ familyForm.name.length }}/20</text>
        </view>

        <view class="form-item">
          <text class="form-label">家庭描述</text>
          <textarea
            class="form-textarea"
            :value="familyForm.description"
            @input="onDescInput"
            placeholder="简单描述一下您的家庭（可选）"
            maxlength="100"
          />
          <text class="char-count">{{ familyForm.description.length }}/100</text>
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
          class="create-btn"
          :class="{ disabled: !canCreate }"
          @tap="handleCreateFamily"
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

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const familyForm = ref({
  name: '',
  description: ''
})

const isCreating = ref(false)

// 计算属性
const canCreate = computed(() => {
  return familyForm.value.name.trim().length >= 2
})

// 方法
const onNameInput = (e) => {
  familyForm.value.name = e.detail.value
}

const onDescInput = (e) => {
  familyForm.value.description = e.detail.value
}

const handleCreateFamily = async () => {
  if (!canCreate.value || isCreating.value) return

  try {
    isCreating.value = true

    const success = await familyStore.createFamily({
      name: familyForm.value.name.trim(),
      description: familyForm.value.description.trim()
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

<style lang="scss" scoped>
.family-create-page {
  min-height: 100vh;
  background: #f8f9fa;

  // 顶部导航
  .nav-header {
    background: 'white'
    padding: 20rpx 0;
    text-align: 'center'
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

    .nav-title {
      font-size: 36rpx;
      font-weight: 'bold'
      color: #333;
    }
  }

  // 主要内容
  .main-content {
    padding: 40rpx 30rpx;

    // 欢迎区域
    .welcome-section {
      text-align: 'center'
      margin-bottom: 60rpx;

      .welcome-icon {
        font-size: 120rpx;
        margin-bottom: 30rpx;
      }

      .welcome-title {
        display: 'block'
        font-size: 42rpx;
        font-weight: 'bold'
        color: #333;
        margin-bottom: 20rpx;
      }

      .welcome-desc {
        display: 'block'
        font-size: 28rpx;
        color: #666;
        line-height: 1.5;
      }
    }

    // 表单区域
    .form-section {
      background: 'white'
      border-radius: 20rpx;
      padding: 40rpx 30rpx;
      margin-bottom: 40rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

      .form-item {
        margin-bottom: 40rpx;
        position: 'relative'

        &:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: 'block'
          font-size: 30rpx;
          color: #333;
          margin-bottom: 20rpx;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 24rpx 20rpx;
          border: 2rpx solid #e0e0e0;
          border-radius: 12rpx;
          font-size: 30rpx;
          color: #333;
          background: #fafafa;

          &:focus {
            border-color: #1296db;
            background: 'white'
          }

          &::placeholder {
            color: #999;
          }
        }

        .form-textarea {
          width: 100%;
          min-height: 120rpx;
          padding: 24rpx 20rpx;
          border: 2rpx solid #e0e0e0;
          border-radius: 12rpx;
          font-size: 30rpx;
          color: #333;
          background: #fafafa;
          resize: 'none'

          &:focus {
            border-color: #1296db;
            background: 'white'
          }

          &::placeholder {
            color: #999;
          }
        }

        .char-count {
          position: 'absolute'
          right: 20rpx;
          bottom: 20rpx;
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    // 功能介绍
    .features-section {
      margin-bottom: 60rpx;

      .section-title {
        display: 'block'
        font-size: 32rpx;
        font-weight: 'bold'
        color: #333;
        margin-bottom: 30rpx;
      }

      .feature-list {
        .feature-item {
          display: 'flex'
          align-items: 'center'
          background: 'white'
          padding: 30rpx;
          border-radius: 16rpx;
          margin-bottom: 20rpx;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

          &:last-child {
            margin-bottom: 0;
          }

          .feature-icon {
            font-size: 48rpx;
            margin-right: 30rpx;
          }

          .feature-content {
            flex: 1;

            .feature-name {
              display: 'block'
              font-size: 30rpx;
              font-weight: 500;
              color: #333;
              margin-bottom: 8rpx;
            }

            .feature-desc {
              display: 'block'
              font-size: 26rpx;
              color: #666;
              line-height: 1.4;
            }
          }
        }
      }
    }

    // 操作区域
    .action-section {
      .create-btn {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: 'white'
        border: 'none'
        border-radius: 50rpx;
        padding: 28rpx 0;
        font-size: 32rpx;
        font-weight: 'bold'
        margin-bottom: 40rpx;
        box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);

        &.disabled {
          background: #ccc;
          box-shadow: 'none'
        }

        &::after {
          border: 'none'
        }
      }

      .or-divider {
        display: 'flex'
        align-items: 'center'
        margin-bottom: 40rpx;

        .divider-line {
          flex: 1;
          height: 2rpx;
          background: #e0e0e0;
        }

        .divider-text {
          margin: 0 30rpx;
          font-size: 26rpx;
          color: #999;
        }
      }

      .join-btn {
        width: 100%;
        background: 'white'
        color: #1296db;
        border: 2rpx solid #1296db;
        border-radius: 50rpx;
        padding: 28rpx 0;
        font-size: 32rpx;
        font-weight: 'bold'

        &::after {
          border: 'none'
        }
      }
    }
  }
}
</style>
