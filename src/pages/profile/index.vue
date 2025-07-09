<template>
  <view class="profile-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <view class="user-avatar">
          <text class="avatar-text">{{ userInitial }}</text>
        </view>
        <view class="user-details">
          <text class="user-name">{{ userName }}</text>
          <text class="user-role">{{ userRoleText }}</text>
        </view>
        <view class="edit-btn" @tap="editProfile">
          <text class="edit-icon">✏️</text>
        </view>
      </view>

      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">{{ recordCount }}</text>
          <text class="stat-label">记录数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ dayCount }}</text>
          <text class="stat-label">记账天数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ familyDays }}</text>
          <text class="stat-label">加入天数</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @tap="goToSettings">
          <view class="menu-icon">⚙️</view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @tap="goToHelp">
          <view class="menu-icon">❓</view>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @tap="goToAbout">
          <view class="menu-icon">ℹ️</view>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="exportData">
          <view class="menu-icon">📤</view>
          <text class="menu-text">导出数据</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @tap="clearCache">
          <view class="menu-icon">🗑️</view>
          <text class="menu-text">清理缓存</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item danger" @tap="confirmLogout">
          <view class="menu-icon">🚪</view>
          <text class="menu-text">退出登录</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">家账通 v1.0.0</text>
      <text class="copyright-text">© 2025 家账通团队</text>
    </view>

    <!-- 确认退出弹窗 -->
    <view v-if="showLogoutModal" class="modal-overlay" @tap="closeLogoutModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">确认退出</text>
        </view>
        <view class="modal-body">
          <text class="modal-text">确定要退出登录吗？退出后需要重新登录才能使用。</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeLogoutModal">取消</button>
          <button class="modal-btn confirm" @tap="handleLogout">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../stores'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const showLogoutModal = ref(false)
const recordCount = ref(156)
const dayCount = ref(45)
const familyDays = ref(30)

// 计算属性
const userName = computed(() => userStore.user?.nickName || '用户')
const userInitial = computed(() => userName.value.charAt(0))
const userRoleText = computed(() => {
  switch (userStore.userRole) {
    case 'ADMIN':
      return '家庭管理员'
    case 'MEMBER':
      return '家庭成员'
    case 'OBSERVER':
      return '财务观察员'
    default:
      return '家庭成员'
  }
})

// 方法
const editProfile = () => {
  appStore.showToast('功能开发中', 'none')
}

const goToSettings = () => {
  Taro.navigateTo({
    url: '/pages/settings/index'
  })
}

const goToHelp = () => {
  appStore.showToast('功能开发中', 'none')
}

const goToAbout = () => {
  appStore.showToast('功能开发中', 'none')
}

const exportData = async () => {
  try {
    appStore.showLoading('导出中...')

    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    appStore.hideLoading()
    appStore.showToast('导出成功', 'success')
  } catch (error) {
    appStore.hideLoading()
    appStore.showToast('导出失败', 'none')
  }
}

const clearCache = async () => {
  try {
    appStore.showLoading('清理中...')

    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    appStore.hideLoading()
    appStore.showToast('清理完成', 'success')
  } catch (error) {
    appStore.hideLoading()
    appStore.showToast('清理失败', 'none')
  }
}

const confirmLogout = () => {
  showLogoutModal.value = true
}

const closeLogoutModal = () => {
  showLogoutModal.value = false
}

const handleLogout = () => {
  userStore.logout()
  closeLogoutModal()
}

// 检查登录状态
const checkLoginStatus = () => {
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
  }
}

// 生命周期
onMounted(() => {
  checkLoginStatus()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '我的'
  })
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
.profile-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 用户信息卡片
  .user-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 30rpx;
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    color: white;

    .user-info {
      display: flex;
      align-items: center;
      margin-bottom: 40rpx;

      .user-avatar {
        width: 100rpx;
        height: 100rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 30rpx;

        .avatar-text {
          font-size: 48rpx;
          font-weight: bold;
        }
      }

      .user-details {
        flex: 1;

        .user-name {
          display: block;
          font-size: 36rpx;
          font-weight: bold;
          margin-bottom: 10rpx;
        }

        .user-role {
          display: block;
          font-size: 26rpx;
          opacity: 0.8;
        }
      }

      .edit-btn {
        padding: 10rpx;

        .edit-icon {
          font-size: 32rpx;
        }
      }
    }

    .user-stats {
      display: flex;
      align-items: center;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-value {
          display: block;
          font-size: 36rpx;
          font-weight: bold;
          margin-bottom: 8rpx;
        }

        .stat-label {
          display: block;
          font-size: 24rpx;
          opacity: 0.8;
        }
      }
    }
  }

  // 功能菜单
  .menu-section {
    margin: 30rpx;

    .menu-group {
      background: white;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      overflow: hidden;

      .menu-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        &.danger {
          .menu-text {
            color: #ff4757;
          }
        }

        .menu-icon {
          font-size: 40rpx;
          margin-right: 20rpx;
        }

        .menu-text {
          flex: 1;
          font-size: 30rpx;
          color: #333;
        }

        .menu-arrow {
          font-size: 24rpx;
          color: #ccc;
        }
      }
    }
  }

  // 版本信息
  .version-info {
    text-align: center;
    padding: 40rpx;

    .version-text {
      display: block;
      font-size: 26rpx;
      color: #999;
      margin-bottom: 10rpx;
    }

    .copyright-text {
      display: block;
      font-size: 24rpx;
      color: #ccc;
    }
  }

  // 确认弹窗
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
      max-width: 500rpx;

      .modal-header {
        padding: 40rpx 40rpx 20rpx;
        text-align: center;

        .modal-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
        }
      }

      .modal-body {
        padding: 20rpx 40rpx 40rpx;
        text-align: center;

        .modal-text {
          font-size: 28rpx;
          color: #666;
          line-height: 1.5;
        }
      }

      .modal-footer {
        display: flex;
        border-top: 2rpx solid #f0f0f0;

        .modal-btn {
          flex: 1;
          padding: 30rpx 0;
          border: none;
          background: white;
          font-size: 32rpx;

          &::after {
            border: none;
          }

          &.cancel {
            color: #666;
            border-right: 2rpx solid #f0f0f0;
          }

          &.confirm {
            color: #ff4757;
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
