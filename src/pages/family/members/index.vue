<template>
  <view class="family-members-page">
    <!-- 成员统计 -->
    <view class="members-stats">
      <view class="stat-item">
        <text class="stat-value">{{ totalMembers }}</text>
        <text class="stat-label">总成员</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ adminCount }}</text>
        <text class="stat-label">管理员</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ memberCount }}</text>
        <text class="stat-label">普通成员</text>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="members-list">
      <view class="list-header">
        <text class="header-title">成员列表</text>
        <text v-if="familyStore.isAdmin" class="invite-btn" @tap="showInviteModal">邀请成员</text>
      </view>

      <view class="member-items">
        <view
          v-for="member in members"
          :key="member.id"
          class="member-item"
          @tap="showMemberActions(member)"
        >
          <view class="member-avatar">
            <text class="avatar-text">{{ member.nickname ? member.nickname.charAt(0) : '用' }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ member.nickname || '微信用户' }}</text>
            <text class="member-role">{{ getRoleText(member.role) }}</text>
            <text class="member-join-time">{{ formatDate(member.joinTime) }}</text>
          </view>
          <view class="member-actions">
            <text v-if="canManageMember(member)" class="action-dot">⋯</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 邀请成员弹窗 -->
    <view v-if="showInvite" class="modal-overlay" @tap="closeInviteModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">邀请家庭成员</text>
          <text class="close-btn" @tap="closeInviteModal">×</text>
        </view>
        <view class="modal-body">
          <view class="invite-code-section">
            <text class="invite-label">邀请码</text>
            <view class="invite-code-display">
              <text class="invite-code">{{ currentInviteCode }}</text>
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

    <!-- 成员操作弹窗 -->
    <view v-if="showMemberModal" class="modal-overlay" @tap="closeMemberModal">
      <view class="modal-content member-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">成员操作</text>
          <text class="close-btn" @tap="closeMemberModal">×</text>
        </view>
        <view class="modal-body">
          <view class="member-detail">
            <view class="member-avatar large">
              <text class="avatar-text">{{ selectedMember.nickname ? selectedMember.nickname.charAt(0) : '用' }}</text>
            </view>
            <view class="member-info">
              <text class="member-name">{{ selectedMember.nickname || '微信用户' }}</text>
              <text class="member-role">{{ getRoleText(selectedMember.role) }}</text>
            </view>
          </view>

          <view class="action-buttons">
            <button 
              v-if="canChangeRole(selectedMember)"
              class="action-btn role-btn" 
              @tap="showRoleSelector"
            >
              <text class="btn-icon">👑</text>
              <text class="btn-text">修改角色</text>
            </button>
            
            <button 
              v-if="canRemoveMember(selectedMember)"
              class="action-btn remove-btn" 
              @tap="confirmRemoveMember"
            >
              <text class="btn-icon">🚫</text>
              <text class="btn-text">移除成员</text>
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 角色选择弹窗 -->
    <view v-if="showRoleModal" class="modal-overlay" @tap="closeRoleModal">
      <view class="modal-content role-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择角色</text>
          <text class="close-btn" @tap="closeRoleModal">×</text>
        </view>
        <view class="modal-body">
          <view class="role-options">
            <view 
              v-for="role in availableRoles" 
              :key="role.value"
              class="role-option"
              :class="{ selected: selectedRole === role.value }"
              @tap="selectRole(role.value)"
            >
              <text class="role-icon">{{ role.icon }}</text>
              <view class="role-info">
                <text class="role-name">{{ role.label }}</text>
                <text class="role-desc">{{ role.description }}</text>
              </view>
              <text v-if="selectedRole === role.value" class="role-check">✓</text>
            </view>
          </view>
          
          <view class="role-actions">
            <button class="cancel-btn" @tap="closeRoleModal">取消</button>
            <button class="confirm-btn" @tap="confirmChangeRole">确认</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../../stores'
import { formatDate } from '../../../utils/format'

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const showInvite = ref(false)
const showMemberModal = ref(false)
const showRoleModal = ref(false)
const currentInviteCode = ref('')
const selectedMember = ref({})
const selectedRole = ref('')

// 计算属性
const members = computed(() => familyStore.members)
const totalMembers = computed(() => members.value.length)
const adminCount = computed(() => members.value.filter(m => m.role === 'ADMIN' || m.role === 'owner').length)
const memberCount = computed(() => totalMembers.value - adminCount.value)

const availableRoles = [
  { value: 'MEMBER', label: '普通成员', description: '可以记账和查看数据', icon: '👤' },
  { value: 'ADMIN', label: '管理员', description: '可以管理成员和设置', icon: '👑' },
  { value: 'OBSERVER', label: '观察员', description: '只能查看数据', icon: '👁️' }
]

// 方法
const getRoleText = (role) => {
  switch (role) {
    case 'owner':
    case 'ADMIN':
      return '管理员'
    case 'MEMBER':
      return '成员'
    case 'OBSERVER':
      return '观察员'
    default:
      return '成员'
  }
}

const canManageMember = (member) => {
  if (!familyStore.isAdmin) return false
  if (member.id === userStore.user?.id) return false
  return true
}

const canChangeRole = (member) => {
  if (!familyStore.isAdmin) return false
  if (member.id === userStore.user?.id) return false
  if (member.role === 'owner') return false
  return true
}

const canRemoveMember = (member) => {
  if (!familyStore.isAdmin) return false
  if (member.id === userStore.user?.id) return false
  if (member.role === 'owner') return false
  return true
}

const showInviteModal = async () => {
  try {
    // 生成邀请码
    const response = await familyStore.generateInviteCode()
    if (response.success) {
      currentInviteCode.value = response.data.inviteCode
      showInvite.value = true
    }
  } catch (error) {
    console.error('生成邀请码失败:', error)
    appStore.showToast('生成邀请码失败', 'none')
  }
}

const closeInviteModal = () => {
  showInvite.value = false
}

const copyInviteCode = async () => {
  const success = await appStore.copyToClipboard(currentInviteCode.value)
  if (success) {
    appStore.showToast('邀请码已复制', 'success')
  }
}

const shareToWechat = () => {
  appStore.showToast('功能开发中', 'none')
}

const showQRCode = () => {
  appStore.showToast('功能开发中', 'none')
}

const showMemberActions = (member) => {
  if (!canManageMember(member)) return
  selectedMember.value = member
  showMemberModal.value = true
}

const closeMemberModal = () => {
  showMemberModal.value = false
  selectedMember.value = {}
}

const showRoleSelector = () => {
  selectedRole.value = selectedMember.value.role
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  selectedRole.value = ''
}

const selectRole = (role) => {
  selectedRole.value = role
}

const confirmChangeRole = async () => {
  try {
    const success = await familyStore.updateMemberRole(selectedMember.value.id, selectedRole.value)
    if (success) {
      appStore.showToast('角色更新成功', 'success')
      closeRoleModal()
      closeMemberModal()
      // 重新加载成员列表
      await familyStore.loadMembers()
    }
  } catch (error) {
    console.error('更新角色失败:', error)
    appStore.showToast('更新角色失败', 'none')
  }
}

const confirmRemoveMember = async () => {
  Taro.showModal({
    title: '确认移除',
    content: `确定要移除成员 ${selectedMember.value.nickname} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const success = await familyStore.removeMember(selectedMember.value.id)
          if (success) {
            appStore.showToast('成员已移除', 'success')
            closeMemberModal()
            // 重新加载成员列表
            await familyStore.loadMembers()
          }
        } catch (error) {
          console.error('移除成员失败:', error)
          appStore.showToast('移除成员失败', 'none')
        }
      }
    }
  })
}

// 加载数据
const loadData = async () => {
  try {
    await familyStore.loadMembers()
  } catch (error) {
    console.error('加载成员数据失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadData()
})

Taro.useDidShow(() => {
  loadData()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '成员管理'
  })
})
</script>

<style lang="scss">
.family-members-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 成员统计
  .members-stats {
    background: white;
    margin: 24rpx 30rpx;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    padding: 40rpx 30rpx;
    display: flex;
    align-items: center;

    .stat-item {
      flex: 1;
      text-align: center;

      .stat-value {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }

      .stat-label {
        display: block;
        font-size: 24rpx;
        color: #666;
      }
    }

    .stat-divider {
      width: 2rpx;
      height: 60rpx;
      background: #f0f0f0;
      margin: 0 30rpx;
    }
  }

  // 成员列表
  .members-list {
    margin: 24rpx 30rpx;

    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;

      .header-title {
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

    .member-items {
      background: white;
      border-radius: $card-radius;
      box-shadow: $card-shadow;
      overflow: hidden;

      .member-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .member-avatar {
          width: 80rpx;
          height: 80rpx;
          background: linear-gradient(135deg, #1296db 0%, #56ccf2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;

          &.large {
            width: 120rpx;
            height: 120rpx;
            font-size: 48rpx;
          }

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
            color: #1296db;
            margin-bottom: 4rpx;
          }

          .member-join-time {
            display: block;
            font-size: 22rpx;
            color: #999;
          }
        }

        .member-actions {
          .action-dot {
            font-size: 40rpx;
            color: #999;
            padding: 10rpx;
          }
        }
      }
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

    .modal-content {
      background: white;
      border-radius: 20rpx;
      width: 80%;
      max-width: 600rpx;
      max-height: 80vh;
      overflow: hidden;

      &.member-modal {
        width: 90%;
      }

      &.role-modal {
        width: 90%;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 30rpx;
        border-bottom: 1rpx solid #f0f0f0;

        .modal-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }

        .close-btn {
          font-size: 40rpx;
          color: #999;
          padding: 10rpx;
        }
      }

      .modal-body {
        padding: 30rpx;

        .invite-code-section {
          margin-bottom: 40rpx;

          .invite-label {
            display: block;
            font-size: 28rpx;
            color: #333;
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
              font-size: 32rpx;
              font-weight: bold;
              color: #1296db;
              text-align: center;
            }

            .copy-btn {
              font-size: 26rpx;
              color: #1296db;
              padding: 10rpx 20rpx;
              background: rgba(18, 150, 219, 0.1);
              border-radius: 16rpx;
            }
          }

          .invite-tips {
            font-size: 24rpx;
            color: #999;
            text-align: center;
          }
        }

        .share-section {
          .share-label {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 20rpx;
          }

          .share-buttons {
            display: flex;
            gap: 20rpx;

            .share-btn {
              flex: 1;
              background: #f8f9fa;
              border: none;
              border-radius: 12rpx;
              padding: 20rpx;
              display: flex;
              flex-direction: column;
              align-items: center;

              &::after {
                border: none;
              }

              .share-icon {
                font-size: 40rpx;
                margin-bottom: 10rpx;
              }

              .share-text {
                font-size: 24rpx;
                color: #333;
              }

              &.wechat {
                background: rgba(7, 193, 96, 0.1);
                .share-icon { color: #07c160; }
              }

              &.qr {
                background: rgba(18, 150, 219, 0.1);
                .share-icon { color: #1296db; }
              }
            }
          }
        }

        .member-detail {
          display: flex;
          align-items: center;
          margin-bottom: 40rpx;
          padding: 20rpx;
          background: #f8f9fa;
          border-radius: 12rpx;
        }

        .action-buttons {
          .action-btn {
            width: 100%;
            background: #f8f9fa;
            border: none;
            border-radius: 12rpx;
            padding: 20rpx;
            margin-bottom: 20rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            &::after {
              border: none;
            }

            .btn-icon {
              font-size: 32rpx;
              margin-right: 10rpx;
            }

            .btn-text {
              font-size: 28rpx;
              color: #333;
            }

            &.role-btn {
              background: rgba(18, 150, 219, 0.1);
              .btn-icon { color: #1296db; }
            }

            &.remove-btn {
              background: rgba(255, 71, 87, 0.1);
              .btn-icon { color: #ff4757; }
            }
          }
        }

        .role-options {
          margin-bottom: 40rpx;

          .role-option {
            display: flex;
            align-items: center;
            padding: 20rpx;
            border-radius: 12rpx;
            margin-bottom: 20rpx;
            border: 2rpx solid transparent;

            &.selected {
              background: rgba(18, 150, 219, 0.1);
              border-color: #1296db;
            }

            .role-icon {
              font-size: 40rpx;
              margin-right: 20rpx;
            }

            .role-info {
              flex: 1;

              .role-name {
                display: block;
                font-size: 28rpx;
                color: #333;
                margin-bottom: 4rpx;
              }

              .role-desc {
                display: block;
                font-size: 24rpx;
                color: #666;
              }
            }

            .role-check {
              font-size: 32rpx;
              color: #1296db;
              font-weight: bold;
            }
          }
        }

        .role-actions {
          display: flex;
          gap: 20rpx;

          .cancel-btn, .confirm-btn {
            flex: 1;
            border: none;
            border-radius: 12rpx;
            padding: 20rpx;
            font-size: 28rpx;

            &::after {
              border: none;
            }
          }

          .cancel-btn {
            background: #f8f9fa;
            color: #666;
          }

          .confirm-btn {
            background: #1296db;
            color: white;
          }
        }
      }
    }
  }
}
</style>
