<template>
  <view class="mine-page">
    <!-- 头部用户信息展示 -->
    <view class="user-info">
      <image :src="user.avatar || defaultAvatar" class="avatar" />
      <view class="user-details">
        <text class="nickname">{{ user.nickname || '未设置昵称' }}</text>
        <text class="phone">{{ user.phone ? maskPhone(user.phone) : '未绑定手机号' }}</text>
      </view>
      <button class="edit-btn" @tap="editProfile">编辑资料</button>
    </view>

    <!-- 家庭信息区 -->
    <view class="family-info-card" v-if="family">
      <text>当前家庭：{{ family.name }}</text>
      <text>我的角色：{{ getRoleText(myRole) }}</text>
      <text>成员数：{{ family.member_count }}</text>
      <button @tap="goToFamily">进入家庭主页</button>
      <button @tap="goToFamilySettings">家庭设置</button>
      <button v-if="familyList.length > 1" @tap="switchFamily">切换家庭</button>
    </view>

    <!-- 账本统计区 -->
    <view class="stats-section">
      <text>本月支出：¥{{ monthExpense }}</text>
      <text>本月收入：¥{{ monthIncome }}</text>
      <text>记账笔数：{{ recordCount }}</text>
    </view>

    <!-- 常用操作区 -->
    <view class="menu-section">
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
  // 优先展示微信头像昵称
  if ((!user.value.avatar || !user.value.nickname) && Taro.canIUse && Taro.canIUse('getUserProfile')) {
    const wxInfo = await userStore.getWechatUserInfo?.()
    if (wxInfo) {
      if (!user.value.avatar) user.value.avatar = wxInfo.avatarUrl
      if (!user.value.nickname) user.value.nickname = wxInfo.nickName
    }
  }
  family.value = await familyStore.getFamilyInfo() || null
  myRole.value = familyStore.myRole
  // familyList.value = await familyStore.getFamilyList() || []
  // const stats = await userStore.getMyStats()
  // monthExpense.value = stats.expense
  // monthIncome.value = stats.income
  // recordCount.value = stats.count
}
onMounted(loadData)

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
  background: #f8f9fa;
  padding-bottom: 120rpx;
  .user-info {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 30rpx;
    border-radius: 20rpx;
    margin: 24rpx 30rpx;
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      margin-right: 30rpx;
      background: #eee;
    }
    .user-details {
      flex: 1;
      .nickname {
        font-size: 36rpx;
        font-weight: bold;
      }
      .phone {
        font-size: 26rpx;
        color: #888;
      }
    }
    .edit-btn {
      font-size: 28rpx;
      margin-left: 20rpx;
      background: #1296db;
      color: #fff;
      border-radius: 8rpx;
      padding: 10rpx 24rpx;
    }
  }
  .family-info-card {
    background: #fff;
    border-radius: 20rpx;
    margin: 24rpx 30rpx;
    padding: 30rpx;
    text {
      display: block;
      margin-bottom: 10rpx;
    }
    button {
      margin-right: 20rpx;
      margin-top: 10rpx;
    }
  }
  .stats-section {
    background: #fff;
    border-radius: 20rpx;
    margin: 24rpx 30rpx;
    padding: 30rpx;
    text {
      display: block;
      margin-bottom: 10rpx;
    }
  }
  .menu-section {
    background: #fff;
    border-radius: 20rpx;
    margin: 24rpx 30rpx;
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    button {
      margin-bottom: 20rpx;
      font-size: 30rpx;
    }
    .logout-btn {
      background: #ff4757;
      color: #fff;
    }
  }
}
</style> 