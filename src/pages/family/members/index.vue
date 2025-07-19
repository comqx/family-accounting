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
        <view class="header-actions">
          <text v-if="familyStore.isAdmin && !isBatchMode" class="batch-btn" @tap="enterBatchMode">批量操作</text>
          <text v-if="familyStore.isAdmin" class="invite-btn" @tap="showInviteModal">邀请成员</text>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            v-model="searchKeyword" 
            placeholder="搜索成员姓名"
            @input="onSearchInput"
          />
          <text v-if="searchKeyword" class="clear-btn" @tap="clearSearch">×</text>
        </view>
        <view class="filter-btn" @tap="openFilterModal">
          <text class="filter-icon">⚙️</text>
        </view>
      </view>

      <!-- 批量操作工具栏 -->
      <view v-if="isBatchMode" class="batch-toolbar">
        <view class="batch-info">
          <text class="batch-count">已选择 {{ selectedMembers.length }} 个成员</text>
        </view>
        <view class="batch-actions">
          <text class="batch-action" @tap="selectAllMembers">全选</text>
          <text class="batch-action" @tap="clearSelection">清空</text>
          <text class="batch-action" @tap="exitBatchMode">取消</text>
        </view>
      </view>

      <view class="member-items">
        <view
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-item"
          :class="{ 'selected': isBatchMode && selectedMembers.includes(member.id) }"
          @tap="isBatchMode ? toggleMemberSelection(member.id) : showMemberActions(member)"
        >
          <!-- 批量选择复选框 -->
          <view v-if="isBatchMode" class="member-checkbox" @tap.stop="toggleMemberSelection(member.id)">
            <text class="checkbox-icon" :class="{ 'checked': selectedMembers.includes(member.id) }">
              {{ selectedMembers.includes(member.id) ? '✓' : '' }}
            </text>
          </view>
          
          <view class="member-avatar">
            <text class="avatar-text">{{ member.nickname ? member.nickname.charAt(0) : '用' }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ member.nickname || '微信用户' }}</text>
            <text class="member-role">{{ getRoleText(member.role) }}</text>
            <text class="member-join-time">{{ formatDate(member.joinTime) }}</text>
          </view>
          <view class="member-actions">
            <text v-if="canManageMember(member) && !isBatchMode" class="action-dot">⋯</text>
          </view>
        </view>
      </view>

      <!-- 批量操作按钮 -->
      <view v-if="isBatchMode && selectedMembers.length > 0" class="batch-operations">
        <button class="batch-operation-btn role-btn" @tap="showBatchRoleSelector">
          <text class="btn-icon">👑</text>
          <text class="btn-text">批量修改角色</text>
        </button>
        <button class="batch-operation-btn remove-btn" @tap="confirmBatchRemove">
          <text class="btn-icon">🚫</text>
          <text class="btn-text">批量移除</text>
        </button>
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

    <!-- 扫码加入家庭弹窗 -->
    <view v-if="showQRCodeModal" class="modal-overlay" @tap="closeQRCodeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">扫码加入家庭</text>
          <text class="close-btn" @tap="closeQRCodeModal">×</text>
        </view>
        <view class="modal-body" style="text-align:center;">
          <canvas canvas-id="invite-qrcode" style="width:320rpx;height:320rpx;margin:0 auto;" />
          <view style="margin-top:24rpx;font-size:26rpx;color:#888;">微信扫码，自动填写邀请码</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore, useFamilyStore, useAppStore } from '../../../stores'
import Taro from '@tarojs/taro'
import drawQrcode from 'weapp-qrcode'
import { formatDate } from '../../../utils/format'

const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

const showInvite = ref(false)
const currentInviteCode = ref('')
const showMemberModal = ref(false)
const selectedMember = ref({})
const showRoleModal = ref(false)
const selectedRole = ref('')
const showQRCodeModal = ref(false)

// 批量操作相关
const isBatchMode = ref(false)
const selectedMembers = ref([])
const showBatchRoleModal = ref(false)
const batchSelectedRole = ref('')

// 搜索和筛选相关
const searchKeyword = ref('')
const showFilterModal = ref(false)
const filterOptions = ref({
  role: '',
  joinTime: '',
  sortBy: 'name'
})

// 关键修正：members直接computed取store，保证为数组
const members = computed(() => Array.isArray(familyStore.members) ? familyStore.members : [])
const totalMembers = computed(() => members.value.length)
const adminCount = computed(() => members.value.filter(m => m.role === 'ADMIN' || m.role === 'owner').length)
const memberCount = computed(() => totalMembers.value - adminCount.value)

// 筛选后的成员列表
const filteredMembers = computed(() => {
  let result = members.value

  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(member => 
      member.nickname?.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      member.username?.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 角色过滤
  if (filterOptions.value.role) {
    result = result.filter(member => member.role === filterOptions.value.role)
  }

  // 加入时间过滤
  if (filterOptions.value.joinTime) {
    const now = new Date()
    const filterDate = new Date()
    
    switch (filterOptions.value.joinTime) {
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3)
        break
    }
    
    result = result.filter(member => new Date(member.joinTime) >= filterDate)
  }

  // 排序
  switch (filterOptions.value.sortBy) {
    case 'name':
      result = result.sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''))
      break
    case 'joinTime':
      result = result.sort((a, b) => new Date(b.joinTime) - new Date(a.joinTime))
      break
    case 'role':
      result = result.sort((a, b) => a.role.localeCompare(b.role))
      break
  }

  return result
})

const availableRoles = [
  { value: 'MEMBER', label: '普通成员', description: '可以记账和查看数据', icon: '👤' },
  { value: 'ADMIN', label: '管理员', description: '可以管理成员和设置', icon: '👑' },
  { value: 'OBSERVER', label: '观察员', description: '只能查看数据', icon: '👁️' }
]

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
    const response = await familyStore.generateInvite()
    if (response.code) {
      currentInviteCode.value = response.code
      showInvite.value = true
    }
  } catch (error) {
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
  // 直接调起小程序原生分享
  Taro.showShareMenu({
    withShareTicket: true
  })
  // 提示用户点击右上角分享
  appStore.showToast('请点击右上角“···”进行微信分享', 'none')
}

Taro.useShareAppMessage(() => {
  // 分享到微信时带上邀请码
  return {
    title: '邀请你加入我的家庭账本',
    path: `/pages/family/join/index?code=${currentInviteCode.value}`,
    imageUrl: '' // 可自定义分享图
  }
})

const showQRCode = async () => {
  showQRCodeModal.value = true
  // 生成二维码内容：小程序路径+邀请码
  const qrContent = `/pages/family/join/index?code=${currentInviteCode.value}`
  setTimeout(() => {
    drawQrcode({
      width: 320,
      height: 320,
      canvasId: 'invite-qrcode',
      text: qrContent,
      // 兼容Taro3，需传入this
      _this: getCurrentInstance().proxy
    })
  }, 100)
}
const closeQRCodeModal = () => {
  showQRCodeModal.value = false
}

// 批量操作方法
const enterBatchMode = () => {
  isBatchMode.value = true
  selectedMembers.value = []
}

const exitBatchMode = () => {
  isBatchMode.value = false
  selectedMembers.value = []
}

const toggleMemberSelection = (memberId) => {
  const index = selectedMembers.value.indexOf(memberId)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(memberId)
  }
}

const selectAllMembers = () => {
  selectedMembers.value = members.value
    .filter(member => canManageMember(member))
    .map(member => member.id)
}

const clearSelection = () => {
  selectedMembers.value = []
}

const showBatchRoleSelector = () => {
  if (selectedMembers.value.length === 0) {
    appStore.showToast('请先选择成员', 'none')
    return
  }
  batchSelectedRole.value = ''
  showBatchRoleModal.value = true
}

const confirmBatchRemove = async () => {
  if (selectedMembers.value.length === 0) {
    appStore.showToast('请先选择成员', 'none')
    return
  }

  const confirmed = await appStore.showModal({
    title: '确认批量移除',
    content: `确定要移除选中的 ${selectedMembers.value.length} 个成员吗？此操作不可撤销。`
  })

  if (confirmed) {
    try {
      appStore.showLoading('正在移除成员...')
      
      // 批量移除成员
      const promises = selectedMembers.value.map(memberId => 
        familyStore.removeMember(memberId)
      )
      
      await Promise.all(promises)
      
      appStore.hideLoading()
      appStore.showToast('批量移除成功', 'success')
      
      // 退出批量模式
      exitBatchMode()
      
      // 重新加载成员列表
      await familyStore.getFamilyMembers()
    } catch (error) {
      console.error('批量移除成员失败:', error)
      appStore.hideLoading()
      appStore.showToast('批量移除失败', 'none')
    }
  }
}

const confirmBatchChangeRole = async () => {
  if (!batchSelectedRole.value) {
    appStore.showToast('请选择角色', 'none')
    return
  }

  try {
    appStore.showLoading('正在修改角色...')
    
    // 批量修改角色
    const promises = selectedMembers.value.map(memberId => 
      familyStore.changeMemberRole(memberId, batchSelectedRole.value)
    )
    
    await Promise.all(promises)
    
    appStore.hideLoading()
    appStore.showToast('批量修改角色成功', 'success')
    
    // 关闭弹窗并退出批量模式
    showBatchRoleModal.value = false
    exitBatchMode()
    
    // 重新加载成员列表
    await familyStore.getFamilyMembers()
  } catch (error) {
    console.error('批量修改角色失败:', error)
    appStore.hideLoading()
    appStore.showToast('批量修改角色失败', 'none')
  }
}

// 搜索和筛选方法
const onSearchInput = () => {
  // 搜索输入时的处理逻辑
  console.log('搜索关键词:', searchKeyword.value)
}

const clearSearch = () => {
  searchKeyword.value = ''
}

const openFilterModal = () => {
  showFilterModal.value = true
}

const closeFilterModal = () => {
  showFilterModal.value = false
}

const applyFilter = () => {
  closeFilterModal()
  appStore.showToast('筛选已应用', 'success')
}

const resetFilter = () => {
  filterOptions.value = {
    role: '',
    joinTime: '',
    sortBy: 'name'
  }
  closeFilterModal()
  appStore.showToast('筛选已重置', 'success')
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
    const success = await familyStore.changeMemberRole(selectedMember.value.id, selectedRole.value)
    if (success) {
      appStore.showToast('角色更新成功', 'success')
      closeRoleModal()
      closeMemberModal()
      await loadData()
    }
  } catch (error) {
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
            await loadData()
          }
        } catch (error) {
          appStore.showToast('移除成员失败', 'none')
        }
      }
    }
  })
}

const loadData = async () => {
  try {
    await familyStore.loadMembers()
  } catch (error) {
    appStore.showToast('加载成员数据失败', 'none')
  }
}

onMounted(loadData)
Taro.useDidShow(loadData)
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({ title: '成员管理' })
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
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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

      .header-actions {
        display: flex;
        gap: 20rpx;

        .batch-btn, .invite-btn {
          font-size: 28rpx;
          color: #1296db;
          padding: 10rpx 20rpx;
          background: rgba(18, 150, 219, 0.1);
          border-radius: 20rpx;
        }
      }
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 20rpx;
      margin-bottom: 20rpx;

      .search-input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        background: white;
        border-radius: 12rpx;
        padding: 0 20rpx;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

        .search-icon {
          font-size: 28rpx;
          color: #999;
          margin-right: 15rpx;
        }

        .search-input {
          flex: 1;
          height: 80rpx;
          font-size: 28rpx;
          color: #333;
          background: transparent;
          border: none;
        }

        .clear-btn {
          font-size: 32rpx;
          color: #999;
          padding: 10rpx;
        }
      }

      .filter-btn {
        width: 80rpx;
        height: 80rpx;
        background: white;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

        .filter-icon {
          font-size: 32rpx;
        }
      }
    }

    .batch-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx;
      background: rgba(18, 150, 219, 0.1);
      border-radius: 12rpx;
      margin-bottom: 20rpx;

      .batch-info {
        .batch-count {
          font-size: 28rpx;
          color: #1296db;
          font-weight: bold;
        }
      }

      .batch-actions {
        display: flex;
        gap: 20rpx;

        .batch-action {
          font-size: 26rpx;
          color: #1296db;
          padding: 8rpx 16rpx;
          background: rgba(18, 150, 219, 0.2);
          border-radius: 8rpx;
        }
      }
    }

    .member-items {
      background: white;
      border-radius: 16rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
      overflow: hidden;

      .member-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 1rpx solid #f0f0f0;
        transition: all 0.3s ease;

        &:last-child {
          border-bottom: none;
        }

        &.selected {
          background: rgba(18, 150, 219, 0.1);
          border-left: 4rpx solid #1296db;
        }

        .member-checkbox {
          width: 40rpx;
          height: 40rpx;
          border: 2rpx solid #ddd;
          border-radius: 8rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;
          background: white;

          .checkbox-icon {
            font-size: 24rpx;
            color: white;
            font-weight: bold;

            &.checked {
              color: #1296db;
            }
          }

          &:has(.checked) {
            background: #1296db;
            border-color: #1296db;
          }
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

      .batch-operations {
        display: flex;
        gap: 20rpx;
        padding: 30rpx;
        background: white;
        border-radius: 16rpx;
        margin-top: 20rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

        .batch-operation-btn {
          flex: 1;
          background: #f8f9fa;
          border: none;
          border-radius: 12rpx;
          padding: 20rpx;
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
