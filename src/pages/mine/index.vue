<template>
  <view class="mine-page">
    <!-- 头部用户信息 -->
    <view class="user-info-card">
      <view class="avatar-box">
        <image :src="user.avatar || defaultAvatar" class="avatar" @tap="!user.avatar ? onGetWechatProfile : null" />
        <button v-if="!user.avatar || !user.nickname" class="auth-btn" @tap="onGetWechatProfile">授权微信头像昵称</button>
      </view>
      <view class="user-meta">
        <text class="nickname">{{ user.nickname || '未设置昵称' }}</text>
        <text class="phone">{{ user.phone ? maskPhone(user.phone) : '未绑定手机号' }}</text>
      </view>
      <button class="edit-btn" @tap="editProfile">编辑资料</button>
    </view>

    <!-- 家庭信息 -->
    <view class="card family-info-card" v-if="family">
      <view class="family-row">
        <text class="label">当前家庭：</text>
        <text class="value">{{ family.name }}</text>
      </view>
      <view class="family-row">
        <text class="label">我的角色：</text>
        <text class="value">{{ getRoleText(myRole) }}</text>
      </view>
      <view class="family-row">
        <text class="label">成员数：</text>
        <text class="value">{{ family.member_count }}</text>
      </view>
      <view class="family-actions">
        <button @tap="goToFamily">家庭主页</button>
        <button @tap="goToFamilySettings">家庭设置</button>
        <button v-if="familyList.length > 1" @tap="switchFamily">切换家庭</button>
      </view>
    </view>

    <!-- 账本统计 -->
    <view class="card stats-section">
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

    <!-- 常用操作 -->
    <view class="card menu-section">
      <button @tap="goToExport">数据导出</button>
      <button @tap="goToImport">数据导入</button>
      <button @tap="goToFeedback">意见反馈</button>
      <button @tap="logout" class="logout-btn">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore } from '@/stores'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const user = ref({})
const family = ref(null)
const myRole = ref('')
const monthExpense = ref(0)
const monthIncome = ref(0)
const recordCount = ref(0)
const familyList = ref([])
const defaultAvatar = '/assets/icons/profile.png'

const loadData = async () => {
  user.value = await userStore.getUserInfo() || {}
  // 不再自动调用 getWechatUserInfo，避免报错
  family.value = await familyStore.getFamilyInfo() || null
  myRole.value = familyStore.myRole
  // familyList.value = await familyStore.getFamilyList() || []
  // const stats = await userStore.getMyStats()
  // monthExpense.value = stats.expense
  // monthIncome.value = stats.income
  // recordCount.value = stats.count
}
onMounted(loadData)

// 新增：主动授权微信头像昵称
const onGetWechatProfile = async () => {
  const wxInfo = await userStore.getWechatUserInfo?.()
  if (wxInfo) {
    if (!user.value.avatar) user.value.avatar = wxInfo.avatarUrl
    if (!user.value.nickname) user.value.nickname = wxInfo.nickName
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
  padding-bottom: 120rpx;
  .user-info-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, #1296db 0%, #56ccf2 100%);
    border-radius: 24rpx;
    margin: 32rpx 30rpx 24rpx 30rpx;
    padding: 48rpx 30rpx 36rpx 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(18,150,219,0.08);
    position: relative;
    .avatar-box {
      position: relative;
      .avatar {
        width: 140rpx;
        height: 140rpx;
        border-radius: 50%;
        border: 4rpx solid #fff;
        background: #eee;
        box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
      }
      .auth-btn {
        position: absolute;
        left: 0; right: 0; bottom: -40rpx;
        margin: auto;
        width: 180rpx;
        font-size: 24rpx;
        background: #fff;
        color: #1296db;
        border-radius: 20rpx;
        box-shadow: 0 2rpx 8rpx rgba(18,150,219,0.08);
        padding: 8rpx 0;
      }
    }
    .user-meta {
      margin-top: 32rpx;
      text-align: center;
      .nickname {
        font-size: 38rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 8rpx;
        display: block;
      }
      .phone {
        font-size: 26rpx;
        color: #e0f0fa;
      }
    }
    .edit-btn {
      position: absolute;
      top: 32rpx;
      right: 32rpx;
      font-size: 26rpx;
      background: rgba(255,255,255,0.85);
      color: #1296db;
      border-radius: 16rpx;
      padding: 8rpx 24rpx;
      box-shadow: 0 2rpx 8rpx rgba(18,150,219,0.08);
    }
  }
  .card {
    background: #fff;
    border-radius: 20rpx;
    margin: 24rpx 30rpx;
    padding: 32rpx 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
  }
  .family-info-card {
    .family-row {
      display: flex;
      margin-bottom: 12rpx;
      .label {
        color: #888;
        width: 140rpx;
      }
      .value {
        color: #222;
        font-weight: 500;
      }
    }
    .family-actions {
      display: flex;
      gap: 20rpx;
      margin-top: 18rpx;
      button {
        flex: 1;
        font-size: 28rpx;
        background: #f4f8fb;
        color: #1296db;
        border-radius: 12rpx;
        padding: 16rpx 0;
      }
    }
  }
  .stats-section {
    display: flex;
    justify-content: space-between;
    .stat-item {
      flex: 1;
      text-align: center;
      .stat-label {
        font-size: 26rpx;
        color: #888;
        margin-bottom: 8rpx;
        display: block;
      }
      .stat-value {
        font-size: 34rpx;
        font-weight: bold;
        color: #1296db;
      }
    }
  }
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    button {
      font-size: 30rpx;
      border-radius: 16rpx;
      background: #f4f8fb;
      color: #1296db;
      padding: 20rpx 0;
      box-shadow: 0 2rpx 8rpx rgba(18,150,219,0.04);
    }
    .logout-btn {
      background: #ff4757;
      color: #fff;
    }
  }
}
</style> 