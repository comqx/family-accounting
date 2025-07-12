<template>
  <view class="mine-page">
    <view class="header-bg"></view>
    <!-- 个人信息卡片 -->
    <view class="user-card">
      <image :src="user.avatar || defaultAvatar" class="avatar" @tap="editProfile" />
      <view class="user-meta">
        <text class="nickname">{{ user.nickname || '未设置昵称' }}</text>
        <text class="phone">{{ user.phone ? maskPhone(user.phone) : '未绑定手机号' }}</text>
      </view>
      <button v-if="showWechatAuthBtn" class="auth-btn" @tap="onGetWechatProfile">微信头像昵称</button>
      <button class="edit-btn" @tap="editProfile">编辑资料</button>
    </view>

    <!-- 家庭信息卡片 -->
    <view class="card family-card" v-if="family">
      <view class="family-row">
        <text class="label">家庭：</text>
        <text class="value">{{ family.name }}</text>
        <button v-if="familyList.length > 1" class="switch-btn" @tap="switchFamily">切换</button>
      </view>
      <view class="family-row">
        <text class="label">角色：</text>
        <text class="value">{{ getRoleText(myRole) }}</text>
        <text class="label">成员：</text>
        <text class="value">{{ memberCount }}</text>
      </view>
      <view class="family-actions">
        <button @tap="goToFamily">家庭主页</button>
        <button @tap="goToFamilySettings">家庭设置</button>
      </view>
    </view>

    <!-- 账本统计卡片 -->
    <view class="card stats-card">
      <view class="stat-item">
        <text class="stat-label">本月支出</text>
        <text class="stat-value">¥{{ monthExpense }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">本月收入</text>
        <text class="stat-value">¥{{ monthIncome }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">记账笔数</text>
        <text class="stat-value">{{ recordCount }}</text>
      </view>
    </view>

    <!-- 常用操作区 -->
    <view class="card menu-card-grid">
      <view class="menu-grid">
        <view class="menu-item" @tap="goToExport">
          <image src="/assets/icons/export.png" class="menu-icon" mode="aspectFit" />
          <text>数据导出</text>
        </view>
        <view class="menu-item" @tap="goToImport">
          <image src="/assets/icons/import.png" class="menu-icon" mode="aspectFit" />
          <text>数据导入</text>
        </view>
        <view class="menu-item" @tap="goToSecurity">
          <image src="/assets/icons/security.png" class="menu-icon" mode="aspectFit" />
          <text>账号安全</text>
        </view>
        <view class="menu-item" @tap="goToHelp">
          <image src="/assets/icons/help.png" class="menu-icon" mode="aspectFit" />
          <text>帮助中心</text>
        </view>
        <view class="menu-item" @tap="goToFeedback">
          <image src="/assets/icons/feedback.png" class="menu-icon" mode="aspectFit" />
          <text>意见反馈</text>
        </view>
      </view>
    </view>
    <!-- 退出登录单独分组 -->
    <view class="card logout-card">
      <button @tap="logout" class="logout-btn">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore } from '@/stores'
import { useRecordStore } from '../../stores/modules/record'

const userStore = useUserStore()
const familyStore = useFamilyStore()
const recordStore = useRecordStore()

const user = ref({})
const family = ref(null)
// const myRole = ref('')
const monthExpense = ref(0)
const monthIncome = ref(0)
const recordCount = ref(0)
const familyList = ref([])
const defaultAvatar = '/assets/icons/profile.png'

const myRole = computed(() => {
  const me = familyStore.members.find(m => m.id === user.value.id)
  return me?.role || ''
})
const memberCount = computed(() => familyStore.members.length)

const showWechatAuthBtn = computed(() => {
  // 仅首次未设置头像或昵称时显示
  return !user.value.avatar || !user.value.nickname
})

function getMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  }
}

const loadData = async () => {
  user.value = await userStore.getUserInfo() || {}
  await familyStore.getFamilyInfo()
  family.value = familyStore.family
  await familyStore.loadMembers?.()
  // 获取本月统计
  const { startDate, endDate } = getMonthRange()
  const stats = await recordStore.getStatsByDateRange(startDate, endDate)
  monthExpense.value = stats.totalExpense || 0
  monthIncome.value = stats.totalIncome || 0
  recordCount.value = stats.count || 0
}
onMounted(loadData)

// 优化：仅首次需要授权，授权后自动保存
const onGetWechatProfile = async () => {
  const wxInfo = await userStore.getWechatUserInfo?.()
  if (wxInfo) {
    // 更新本地
    if (!user.value.avatar) user.value.avatar = wxInfo.avatarUrl
    if (!user.value.nickname) user.value.nickname = wxInfo.nickName
    // 同步到后端
    await userStore.updateUserInfo?.({
      avatar: user.value.avatar,
      nickname: user.value.nickname
    })
    // 重新拉取用户信息，确保本地和后端一致
    user.value = await userStore.getUserInfo() || user.value
  }
}

const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
const editProfile = () => Taro.navigateTo({ url: '/pages/profile/index' })
const goToFamily = () => Taro.navigateTo({ url: '/pages/family/index' })
const goToFamilySettings = () => Taro.navigateTo({ url: '/pages/family/settings/index' })
const switchFamily = () => Taro.navigateTo({ url: '/pages/family/switch/index' })
const goToExport = () => Taro.navigateTo({ url: '/pages/family/settings/index?tab=data' })
const goToImport = () => Taro.navigateTo({ url: '/pages/family/settings/index?tab=data' })
const goToFeedback = () => Taro.navigateTo({ url: '/pages/feedback/index' })
const logout = async () => {
  await userStore.logout()
  Taro.reLaunch({ url: '/pages/login/index' })
}
const getRoleText = (role) => {
  switch (role) {
    case 'owner': return '拥有者'
    case 'ADMIN': return '管理员'
    case 'MEMBER': return '成员'
    case 'OBSERVER': return '观察员'
    default: return '成员'
  }
}
</script>

<style lang="scss">
.mine-page {
  min-height: 100vh;
  background: #f4f6fa;
  .header-bg {
    position: absolute; top: 0; left: 0; right: 0;
    height: 320rpx;
    background: linear-gradient(135deg, #1296db 0%, #56ccf2 100%);
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;
    z-index: 0;
  }
  .user-card {
    position: relative; z-index: 1;
    margin: 0 30rpx; margin-top: 48rpx; margin-bottom: 32rpx;
    background: #fff; border-radius: 28rpx;
    box-shadow: 0 8rpx 32rpx rgba(18,150,219,0.10);
    display: flex; flex-direction: column; align-items: center;
    padding: 48rpx 0 36rpx 0;
    .avatar { width: 140rpx; height: 140rpx; border-radius: 50%; border: 4rpx solid #fff; background: #eee; margin-bottom: 18rpx; }
    .user-meta { text-align: center;
      .nickname { font-size: 40rpx; font-weight: bold; color: #222; margin-bottom: 8rpx; }
      .phone { font-size: 26rpx; color: #888; }
    }
    .auth-btn { margin-top: 12rpx; font-size: 24rpx; background: #f4f8fb; color: #1296db; border-radius: 16rpx; padding: 8rpx 32rpx; }
    .edit-btn { margin-top: 18rpx; font-size: 28rpx; background: #1296db; color: #fff; border-radius: 20rpx; padding: 12rpx 40rpx; }
  }
  .card { background: #fff; border-radius: 20rpx; margin: 32rpx 30rpx 0 30rpx; padding: 32rpx 30rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);}
  .family-card {
    .family-row { display: flex; align-items: center; margin-bottom: 12rpx;
      .label { color: #888; width: 90rpx; }
      .value { color: #222; font-weight: 500; margin-right: 24rpx; }
      .switch-btn { font-size: 24rpx; background: #f4f8fb; color: #1296db; border-radius: 12rpx; padding: 8rpx 24rpx; margin-left: 12rpx; }
    }
    .family-actions { display: flex; gap: 20rpx; margin-top: 18rpx;
      button { flex: 1; font-size: 28rpx; background: #f4f8fb; color: #1296db; border-radius: 12rpx; padding: 16rpx 0; }
    }
  }
  .stats-card { display: flex; justify-content: space-between;
    .stat-item { flex: 1; text-align: center;
      .stat-label { font-size: 26rpx; color: #888; margin-bottom: 8rpx; display: block; }
      .stat-value { font-size: 38rpx; font-weight: bold; color: #1296db; }
    }
  }
  .menu-card-grid {
    padding: 0;
    .menu-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12rpx 0;
      padding: 24rpx 0;
      .menu-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 12rpx 0;
        background: #f7f8fa;
        border-radius: 20rpx;
        box-shadow: 0 2rpx 8rpx rgba(18,150,219,0.04);
        padding: 32rpx 0 24rpx 0;
        .menu-icon {
          width: 56rpx;
          height: 56rpx;
          margin-bottom: 10rpx;
        }
        text {
          font-size: 28rpx;
          color: #1677ff;
        }
      }
    }
  }
  .logout-card { margin-bottom: 40rpx;
    .logout-btn { background: #ff4757; color: #fff; font-size: 32rpx; border-radius: 20rpx; padding: 24rpx 0; }
  }
}
</style> 