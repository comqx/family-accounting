<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>

    <!-- 主要内容 -->
    <view class="main-content">
      <!-- Logo和标题 -->
      <view class="header">
        <view class="logo">
          <text class="logo-icon">💰</text>
        </view>
        <text class="app-name">家账通</text>
        <text class="app-desc">智能家庭记账助手</text>
      </view>

      <!-- 功能介绍 -->
      <view class="features">
        <view class="feature-item">
          <view class="feature-icon">📊</view>
          <text class="feature-text">智能记账分析</text>
        </view>
        <view class="feature-item">
          <view class="feature-icon">👨‍👩‍👧‍👦</view>
          <text class="feature-text">家庭协作记账</text>
        </view>
        <view class="feature-item">
          <view class="feature-icon">📷</view>
          <text class="feature-text">账单智能识别</text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view class="login-section">
        <button
          class="login-btn"
          @tap="handleWechatLogin"
          :loading="isLogging"
          :disabled="isLogging"
        >
          <view class="btn-content">
            <text class="wechat-icon">💬</text>
            <text class="btn-text">{{ isLogging ? '登录中...' : '微信一键登录' }}</text>
          </view>
        </button>

        <view class="login-tips">
          <text class="tips-text">登录即表示同意</text>
          <text class="link-text" @tap="showPrivacyPolicy">《隐私政策》</text>
          <text class="tips-text">和</text>
          <text class="link-text" @tap="showUserAgreement">《用户协议》</text>
        </view>
      </view>
    </view>

    <!-- 底部装饰 -->
    <view class="footer">
      <text class="footer-text">让记账变得简单有趣</text>
    </view>

    <!-- 隐私政策弹窗 -->
    <view v-if="showPrivacyModal" class="modal-overlay" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">隐私政策</text>
          <text class="close-btn" @tap="closeModal">×</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <text class="policy-text">
            我们非常重视您的隐私保护。本应用仅会收集必要的用户信息用于提供记账服务，
            不会泄露您的个人信息给第三方。您的记账数据将安全存储在云端，
            仅您和您的家庭成员可以访问。
          </text>
        </scroll-view>
        <view class="modal-footer">
          <button class="modal-btn" @tap="closeModal">我知道了</button>
        </view>
      </view>
    </view>

    <!-- 用户协议弹窗 -->
    <view v-if="showAgreementModal" class="modal-overlay" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">用户协议</text>
          <text class="close-btn" @tap="closeModal">×</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <text class="policy-text">
            欢迎使用家账通！请仔细阅读本用户协议。使用本应用即表示您同意遵守相关条款。
            本应用致力于为用户提供优质的记账服务，请合理使用应用功能，
            不要进行违法违规操作。如有问题请联系客服。
          </text>
        </scroll-view>
        <view class="modal-footer">
          <button class="modal-btn" @tap="closeModal">我知道了</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../stores'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const isLogging = ref(false)
const showPrivacyModal = ref(false)
const showAgreementModal = ref(false)

// 微信登录
const handleWechatLogin = async () => {
  if (isLogging.value) return

  try {
    isLogging.value = true

    // 执行登录
    const success = await userStore.login()

    if (success) {
      // 登录成功，跳转到主页
      if (userStore.hasFamily) {
        // 有家庭，直接进入主页
        Taro.reLaunch({
          url: '/pages/index/index'
        })
      } else {
        // 没有家庭，引导创建或加入家庭
        Taro.reLaunch({
          url: '/pages/family/create/index'
        })
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    appStore.showToast(error.message || '登录失败，请重试', 'none')
  } finally {
    isLogging.value = false
  }
}

// 显示隐私政策
const showPrivacyPolicy = () => {
  showPrivacyModal.value = true
}

// 显示用户协议
const showUserAgreement = () => {
  showAgreementModal.value = true
}

// 关闭弹窗
const closeModal = () => {
  showPrivacyModal.value = false
  showAgreementModal.value = false
}

// 检查登录状态
const checkLoginStatus = () => {
  if (userStore.isLoggedIn) {
    // 已登录，跳转到主页
    Taro.reLaunch({
      url: '/pages/index/index'
    })
  }
}

// 生命周期
onMounted(() => {
  checkLoginStatus()
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 智能家庭记账助手',
    path: '/pages/login/index'
  })
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  // 背景装饰
  .bg-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;

    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &.circle-1 {
        width: 300rpx;
        height: 300rpx;
        top: -150rpx;
        right: -150rpx;
      }

      &.circle-2 {
        width: 200rpx;
        height: 200rpx;
        bottom: 200rpx;
        left: -100rpx;
      }

      &.circle-3 {
        width: 150rpx;
        height: 150rpx;
        top: 300rpx;
        left: 50rpx;
      }
    }
  }

  // 主要内容
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80rpx 60rpx;
    position: relative;
    z-index: 1;

    // 头部
    .header {
      text-align: center;
      margin-bottom: 120rpx;

      .logo {
        margin-bottom: 30rpx;

        .logo-icon {
          font-size: 120rpx;
          display: block;
        }
      }

      .app-name {
        display: block;
        font-size: 48rpx;
        font-weight: bold;
        color: white;
        margin-bottom: 20rpx;
      }

      .app-desc {
        display: block;
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    // 功能介绍
    .features {
      margin-bottom: 120rpx;

      .feature-item {
        display: flex;
        align-items: center;
        margin-bottom: 40rpx;
        padding: 0 20rpx;

        .feature-icon {
          font-size: 40rpx;
          margin-right: 30rpx;
        }

        .feature-text {
          font-size: 32rpx;
          color: white;
          font-weight: 500;
        }
      }
    }

    // 登录区域
    .login-section {
      .login-btn {
        width: 100%;
        background: white;
        border: none;
        border-radius: 50rpx;
        padding: 0;
        margin-bottom: 40rpx;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);

        &::after {
          border: none;
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28rpx 0;

          .wechat-icon {
            font-size: 36rpx;
            margin-right: 20rpx;
          }

          .btn-text {
            font-size: 32rpx;
            color: #333;
            font-weight: bold;
          }
        }

        &:disabled {
          opacity: 0.7;
        }
      }

      .login-tips {
        text-align: center;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);

        .link-text {
          color: #ffd700;
          text-decoration: underline;
        }
      }
    }
  }

  // 底部
  .footer {
    text-align: center;
    padding: 40rpx;
    position: relative;
    z-index: 1;

    .footer-text {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  // 弹窗样式
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 60rpx;

    .modal-content {
      background: white;
      border-radius: 20rpx;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 40rpx 40rpx 20rpx;
        border-bottom: 2rpx solid #f0f0f0;

        .modal-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
        }

        .close-btn {
          font-size: 48rpx;
          color: #999;
          width: 60rpx;
          height: 60rpx;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .modal-body {
        flex: 1;
        padding: 40rpx;

        .policy-text {
          font-size: 28rpx;
          line-height: 1.6;
          color: #666;
        }
      }

      .modal-footer {
        padding: 20rpx 40rpx 40rpx;

        .modal-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12rpx;
          padding: 24rpx 0;
          font-size: 32rpx;

          &::after {
            border: none;
          }
        }
      }
    }
  }
}
</style>
