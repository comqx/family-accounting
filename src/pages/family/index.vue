<template>
  <view class="family-page">
    <!-- 家庭信息卡片 -->
    <view class="family-card">
      <view class="family-header">
        <view class="family-avatar">🏠</view>
        <view class="family-info">
          <text class="family-name">{{ familyName || '我的家庭' }}</text>
          <text class="family-desc">{{ memberCount }}位成员</text>
        </view>
        <view class="family-actions">
          <text class="action-btn" @tap="showFamilySettings">⚙️</text>
        </view>
      </view>

      <view class="family-s
      
      
      tats">
        <view class="stat-item">
          <text class="stat-value">¥{{ formatAmount(monthExpense) }}</text>
          <text class="stat-label">本月支出</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">¥{{ formatAmount(monthIncome) }}</text>
          <text class="stat-label">本月收入</text>
        </view>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="members-section">
      <view class="section-header">
        <text class="section-title">家庭成员</text>
        <text class="invite-btn" @tap="handleInviteMember">邀请成员</text>
      </view>

      <view class="members-list">
        <view
          v-for="member in familyStore.members"
          :key="member.id"
          class="member-item"
        >
          <view class="member-avatar">
            <text class="avatar-text">{{ member.nickname ? member.nickname.charAt(0) : '用' }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ member.nickname || '微信用户' }}</text>
            <text class="member-role">{{ getRoleText(member.role) }}</text>
          </view>
          <view class="member-status">
            <text class="status-dot" :class="{ online: true }"></text>
            <text class="status-text">在线</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goToMembers">
        <view class="menu-icon">👥</view>
        <text class="menu-text">成员管理</text>
        <text class="menu-arrow">></text>
      </view>

      <view class="menu-item" @tap="goToCategories">
        <view class="menu-icon">📂</view>
        <text class="menu-text">分类管理</text>
        <text class="menu-arrow">></text>
      </view>

      <view class="menu-item" @tap="showBudgetSettings">
        <view class="menu-icon">💰</view>
        <text class="menu-text">预算设置</text>
        <text class="menu-arrow">></text>
      </view>

      <view class="menu-item" @tap="showDataSync">
        <view class="menu-icon">🔄</view>
        <text class="menu-text">数据同步</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 邀请码弹窗 -->
    <view v-if="showInviteModal" class="modal-overlay" @tap="closeInviteModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">邀请家庭成员</text>
          <text class="close-btn" @tap="closeInviteModal">×</text>
        </view>
        <view class="modal-body">
          <view class="invite-code-section">
            <text class="invite-label">邀请码</text>
            <view class="invite-code-display">
              <text class="invite-code">{{ inviteCode }}</text>
              <text class="copy-btn" @tap="copyInviteCode">复制</text>
            </view>
            <text class="invite-tips">邀请码有效期24小时，请及时分享给家人</text>
          </view>

          <view class="share-section">
            <text class="share-label">分享方式</text>
            <view class="share-buttons">
              <button class="share-btn wechat" @tap="shareToWechat">
                <text class="share-icon">💬</text>
                <text class="share-text">微信分享</text>
              </button>
              <button class="share-btn qr" @tap="showQRCode">
                <text class="share-icon">📱</text>
                <text class="share-text">二维码</text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../stores'
import { formatAmount } from '../../utils/format'

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const showInviteModal = ref(false)
const inviteCode = ref('ABC123')
const monthExpense = ref(1250.80)
const monthIncome = ref(5000.00)

// 计算属性
const familyName = computed(() => familyStore.familyName || '我的家庭')
const memberCount = computed(() => familyStore.members.length)

// 方法
const getRoleText = (role) => {
  switch (role) {
    case 'owner':
      return '管理员'
    case 'admin':
      return '管理员'
    case 'member':
      return '成员'
    case 'observer':
      return '观察员'
    default:
      return '成员'
  }
}

const handleInviteMember = async () => {
  if (!familyStore.isAdmin) {
    appStore.showToast('只有管理员可以邀请成员', 'none')
    return
  }

  // 生成邀请码
  inviteCode.value = generateInviteCode()
  showInviteModal.value = true
}

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const closeInviteModal = () => {
  showInviteModal.value = false
}

const copyInviteCode = async () => {
  const success = await appStore.copyToClipboard(inviteCode.value)
  if (success) {
    appStore.showToast('邀请码已复制', 'success')
  }
}

const shareToWechat = () => {
  // 微信分享逻辑
  appStore.showToast('功能开发中', 'none')
}

const showQRCode = () => {
  // 显示二维码逻辑
  appStore.showToast('功能开发中', 'none')
}

const showFamilySettings = () => {
  appStore.showToast('功能开发中', 'none')
}

const goToMembers = () => {
  Taro.navigateTo({
    url: '/pages/family/members/index'
  })
}

const goToCategories = () => {
  Taro.navigateTo({
    url: '/pages/category/index'
  })
}

const showBudgetSettings = () => {
  appStore.showToast('功能开发中', 'none')
}

const showDataSync = () => {
  appStore.showToast('功能开发中', 'none')
}

// 检查用户状态
const checkUserStatus = () => {
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
    return
  }

  if (!userStore.hasFamily) {
    Taro.reLaunch({
      url: '/pages/family/create/index'
    })
    return
  }
}

// 加载数据
const loadData = async () => {
  try {
    // 确保家庭信息已加载
    if (!familyStore.hasFamily) {
      await familyStore.getFamilyInfo()
    }
    
    // 加载家庭成员
    await familyStore.loadMembers()
    
    console.log('家庭信息:', familyStore.family)
    console.log('家庭成员:', familyStore.members)
    console.log('是否管理员:', familyStore.isAdmin)
  } catch (error) {
    console.error('加载家庭数据失败:', error)
  }
}

// 生命周期
onMounted(() => {
  checkUserStatus()
  loadData()
})

Taro.useDidShow(() => {
  if (userStore.isLoggedIn && familyStore.hasFamily) {
    loadData()
  }
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '家庭'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 加入我的家庭账本',
    path: `/pages/family/join/index?code=${inviteCode.value}`
  })
})
</script>

<style lang="scss">
.family-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 家庭信息卡片
  .family-card {
    background: linear-gradient(135deg, #1296db 0%, #56ccf2 100%);
    margin: 24rpx 30rpx;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    padding: 40rpx 30rpx;
    color: #ffffff;

    .family-header {
      display: flex;
      align-items: center;
      margin-bottom: 40rpx;

      .family-avatar {
        width: 80rpx;
        height: 80rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
        margin-right: 20rpx;
      }

      .family-info {
        flex: 1;

        .family-name {
          display: block;
          font-size: 36rpx;
          font-weight: bold;
          margin-bottom: 8rpx;
        }

        .family-desc {
          display: block;
          font-size: 26rpx;
          opacity: 0.8;
        }
      }

      .family-actions {
        .action-btn {
          font-size: 36rpx;
          padding: 10rpx;
        }
      }
    }

    .family-stats {
      display: flex;
      align-items: center;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-value {
          display: block;
          font-size: 32rpx;
          font-weight: bold;
          margin-bottom: 8rpx;
        }

        .stat-label {
          display: block;
          font-size: 24rpx;
          opacity: 0.8;
        }
      }

      .stat-divider {
        width: 2rpx;
        height: 60rpx;
        background: rgba(255, 255, 255, 0.3);
        margin: 0 30rpx;
      }
    }
  }

  // 成员列表
  .members-section {
    margin: 24rpx 30rpx;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .invite-btn {
        font-size: 28rpx;
        color: #1296db;
        padding: 10rpx 20rpx;
        background: rgba(18, 150, 219, 0.1);
        border-radius: 20rpx;
      }
    }

    .members-list {
      background: #ffffff;
      border-radius: $card-radius;
      box-shadow: $card-shadow;
      overflow: hidden;

      .member-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .member-avatar {
          width: 80rpx;
          height: 80rpx;
          background: #1296db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;

          .avatar-text {
            color: white;
            font-size: 32rpx;
            font-weight: bold;
          }
        }

        .member-info {
          flex: 1;

          .member-name {
            display: block;
            font-size: 30rpx;
            color: #333;
            margin-bottom: 8rpx;
          }

          .member-role {
            display: block;
            font-size: 24rpx;
            color: #666;
          }
        }

        .member-status {
          display: flex;
          align-items: center;

          .status-dot {
            width: 16rpx;
            height: 16rpx;
            border-radius: 50%;
            background: #ccc;
            margin-right: 10rpx;

            &.online {
              background: #2ed573;
            }
          }

          .status-text {
            font-size: 24rpx;
            color: #666;
          }
        }
      }
    }
  }

  // 功能菜单
  .menu-section {
    background: #ffffff;
    margin: 24rpx 30rpx 120rpx;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    overflow: hidden;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 2rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
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

  // 邀请弹窗
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
        padding: 40rpx;

        .invite-code-section {
          margin-bottom: 40rpx;

          .invite-label {
            display: block;
            font-size: 28rpx;
            color: #666;
            margin-bottom: 20rpx;
          }

          .invite-code-display {
            display: flex;
            align-items: center;
            background: #f8f9fa;
            border-radius: 12rpx;
            padding: 20rpx;
            margin-bottom: 20rpx;

            .invite-code {
              flex: 1;
              font-size: 36rpx;
              font-weight: bold;
              color: #333;
              letter-spacing: 4rpx;
            }

            .copy-btn {
              font-size: 28rpx;
              color: #1296db;
              padding: 10rpx 20rpx;
              background: rgba(18, 150, 219, 0.1);
              border-radius: 8rpx;
            }
          }

          .invite-tips {
            font-size: 24rpx;
            color: #999;
            line-height: 1.4;
          }
        }

        .share-section {
          .share-label {
            display: block;
            font-size: 28rpx;
            color: #666;
            margin-bottom: 20rpx;
          }

          .share-buttons {
            display: flex;
            gap: 20rpx;

            .share-btn {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 30rpx 20rpx;
              border: 2rpx solid #e0e0e0;
              border-radius: 12rpx;
              background: white;

              &::after {
                border: none;
              }

              .share-icon {
                font-size: 40rpx;
                margin-bottom: 10rpx;
              }

              .share-text {
                font-size: 26rpx;
                color: #666;
              }

              &.wechat {
                border-color: #07c160;
                color: #07c160;
              }

              &.qr {
                border-color: #1296db;
                color: #1296db;
              }
            }
          }
        }
      }
    }
  }
}
</style>
