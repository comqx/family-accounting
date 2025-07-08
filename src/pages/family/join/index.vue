<template>
  <view class="family-join-page">
    <!-- 主要内容 -->
    <view class="main-content">
      <!-- 头部信息 -->
      <view class="header-section">
        <view class="header-icon">👨‍👩‍👧‍👦</view>
        <text class="header-title">加入家庭</text>
        <text class="header-desc">输入邀请码加入现有家庭账本</text>
      </view>

      <!-- 输入区域 -->
      <view class="input-section">
        <view class="input-item">
          <text class="input-label">邀请码</text>
          <input
            class="invite-input"
            :value="inviteCode"
            @input="onInviteCodeInput"
            placeholder="请输入6位邀请码"
            maxlength="6"
            type="text"
          />
        </view>

        <view class="input-tips">
          <text class="tips-text">💡 邀请码由家庭管理员提供，有效期为24小时</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <button
          class="join-btn"
          :class="{ disabled: !canJoin }"
          @tap="handleJoinFamily"
          :loading="isJoining"
          :disabled="!canJoin || isJoining"
        >
          {{ isJoining ? '加入中...' : '加入家庭' }}
        </button>

        <view class="back-section">
          <text class="back-text">还没有邀请码？</text>
          <text class="back-link" @tap="goToCreateFamily">创建新家庭</text>
        </view>
      </view>

      <!-- 帮助信息 -->
      <view class="help-section">
        <text class="help-title">如何获取邀请码？</text>
        <view class="help-steps">
          <view class="help-step">
            <view class="step-number">1</view>
            <text class="step-text">请家庭管理员打开家账通</text>
          </view>
          <view class="help-step">
            <view class="step-number">2</view>
            <text class="step-text">进入"家庭"页面，点击"邀请成员"</text>
          </view>
          <view class="help-step">
            <view class="step-number">3</view>
            <text class="step-text">获取6位邀请码并分享给您</text>
          </view>
        </view>
      </view>

      <!-- 扫码加入 -->
      <view class="scan-section">
        <view class="scan-divider">
          <view class="divider-line"></view>
          <text class="divider-text">或者</text>
          <view class="divider-line"></view>
        </view>

        <button class="scan-btn" @tap="handleScanCode">
          <view class="scan-content">
            <text class="scan-icon">📷</text>
            <text class="scan-text">扫描二维码加入</text>
          </view>
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
const inviteCode = ref('')
const isJoining = ref(false)

// 计算属性
const canJoin = computed(() => {
  return inviteCode.value.trim().length === 6
})

// 方法
const onInviteCodeInput = (e) => {
  // 只允许输入数字和字母
  const value = e.detail.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  inviteCode.value = value
}

const handleJoinFamily = async () => {
  if (!canJoin.value || isJoining.value) return

  try {
    isJoining.value = true

    const success = await familyStore.joinFamily(inviteCode.value.trim())

    if (success) {
      // 加入成功，跳转到主页
      Taro.reLaunch({
        url: '/pages/index/index'
      })
    }
  } catch (error) {
    console.error('Join family error:', error)
    appStore.showToast(error.message || '加入失败，请检查邀请码', 'none')
  } finally {
    isJoining.value = false
  }
}

const goToCreateFamily = () => {
  Taro.navigateBack()
}

const handleScanCode = async () => {
  try {
    const result = await Taro.scanCode({
      scanType: ['qrCode']
    })

    if (result.result) {
      // 解析二维码内容，提取邀请码
      const codeMatch = result.result.match(/invite[_-]?code[=:]?([A-Z0-9]{6})/i)
      if (codeMatch && codeMatch[1]) {
        inviteCode.value = codeMatch[1].toUpperCase()
        appStore.showToast('已识别邀请码', 'success')
      } else {
        appStore.showToast('无效的邀请二维码', 'none')
      }
    }
  } catch (error) {
    console.error('Scan code error:', error)
    if (error.errMsg && error.errMsg.includes('cancel')) {
      // 用户取消扫码
      return
    }
    appStore.showToast('扫码失败，请重试', 'none')
  }
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
    title: '加入家庭'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 加入家庭账本',
    path: '/pages/family/join/index'
  })
})
</script>

<style lang="scss" scoped>
.family-join-page {
  min-height: 100vh;
  background: #f8f9fa;

  // 主要内容
  .main-content {
    padding: 60rpx 30rpx;

    // 头部区域
    .header-section {
      text-align: 'center'
      margin-bottom: 80rpx;

      .header-icon {
        font-size: 120rpx;
        margin-bottom: 30rpx;
      }

      .header-title {
        display: 'block'
        font-size: 42rpx;
        font-weight: 'bold'
        color: #333;
        margin-bottom: 20rpx;
      }

      .header-desc {
        display: 'block'
        font-size: 28rpx;
        color: #666;
        line-height: 1.5;
      }
    }

    // 输入区域
    .input-section {
      background: 'white'
      border-radius: 20rpx;
      padding: 40rpx 30rpx;
      margin-bottom: 40rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

      .input-item {
        .input-label {
          display: 'block'
          font-size: 30rpx;
          color: #333;
          margin-bottom: 20rpx;
          font-weight: 500;
        }

        .invite-input {
          width: 100%;
          padding: 24rpx 20rpx;
          border: 2rpx solid #e0e0e0;
          border-radius: 12rpx;
          font-size: 36rpx;
          color: #333;
          background: #fafafa;
          text-align: 'center'
          letter-spacing: 8rpx;
          font-weight: 'bold'

          &:focus {
            border-color: #1296db;
            background: 'white'
          }

          &::placeholder {
            color: #999;
            letter-spacing: 'normal'
            font-weight: 'normal'
          }
        }
      }

      .input-tips {
        margin-top: 20rpx;

        .tips-text {
          font-size: 26rpx;
          color: #666;
          line-height: 1.4;
        }
      }
    }

    // 操作区域
    .action-section {
      margin-bottom: 60rpx;

      .join-btn {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: 'white'
        border: 'none'
        border-radius: 50rpx;
        padding: 28rpx 0;
        font-size: 32rpx;
        font-weight: 'bold'
        margin-bottom: 30rpx;
        box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);

        &.disabled {
          background: #ccc;
          box-shadow: 'none'
        }

        &::after {
          border: 'none'
        }
      }

      .back-section {
        text-align: 'center'

        .back-text {
          font-size: 28rpx;
          color: #666;
        }

        .back-link {
          font-size: 28rpx;
          color: #1296db;
          margin-left: 10rpx;
        }
      }
    }

    // 帮助区域
    .help-section {
      background: 'white'
      border-radius: 20rpx;
      padding: 40rpx 30rpx;
      margin-bottom: 40rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

      .help-title {
        display: 'block'
        font-size: 32rpx;
        font-weight: 'bold'
        color: #333;
        margin-bottom: 30rpx;
      }

      .help-steps {
        .help-step {
          display: 'flex'
          align-items: flex-start;
          margin-bottom: 24rpx;

          &:last-child {
            margin-bottom: 0;
          }

          .step-number {
            width: 48rpx;
            height: 48rpx;
            background: #1296db;
            color: 'white'
            border-radius: 50%;
            display: 'flex'
            align-items: 'center'
            justify-content: 'center'
            font-size: 24rpx;
            font-weight: 'bold'
            margin-right: 20rpx;
            flex-shrink: 0;
          }

          .step-text {
            flex: 1;
            font-size: 28rpx;
            color: #666;
            line-height: 1.5;
            padding-top: 8rpx;
          }
        }
      }
    }

    // 扫码区域
    .scan-section {
      .scan-divider {
        display: 'flex'
        align-items: 'center'
        margin-bottom: 30rpx;

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

      .scan-btn {
        width: 100%;
        background: 'white'
        color: #333;
        border: 2rpx solid #e0e0e0;
        border-radius: 50rpx;
        padding: 28rpx 0;
        font-size: 32rpx;

        &::after {
          border: 'none'
        }

        .scan-content {
          display: 'flex'
          align-items: 'center'
          justify-content: 'center'

          .scan-icon {
            font-size: 36rpx;
            margin-right: 20rpx;
          }

          .scan-text {
            font-weight: 500;
          }
        }
      }
    }
  }
}
</style>
