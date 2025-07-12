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
      <button v-if="!user.avatar || !user.nickname" class="auth-btn" @tap="onGetWechatProfile">微信头像昵称</button>
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
        <text class="value">{{ family.member_count }}</text>
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
    <view class="card menu-card">
      <button @tap="goToExport">数据导出</button>
      <button @tap="goToImport">数据导入</button>
      <button @tap="goToSecurity">账号安全</button>
      <button @tap="goToHelp">帮助中心</button>
      <button @tap="goToFeedback">意见反馈</button>
    </view>
    <!-- 退出登录单独分组 -->
    <view class="card logout-card">
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
  .menu-card { display: flex; flex-direction: column; gap: 24rpx;
    button { font-size: 32rpx; border-radius: 20rpx; background: #f4f8fb; color: #1296db; padding: 24rpx 0; box-shadow: 0 2rpx 8rpx rgba(18,150,219,0.04); }
  }
  .logout-card { margin-bottom: 40rpx;
    .logout-btn { background: #ff4757; color: #fff; font-size: 32rpx; border-radius: 20rpx; padding: 24rpx 0; }
  }
}
</style> 