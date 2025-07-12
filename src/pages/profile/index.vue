<template>
  <view class="profile-edit-page">
    <image :src="avatar" class="avatar" @tap="chooseAvatar" />
    <input v-model="nickname" placeholder="昵称" />
    <input v-model="phone" placeholder="手机号" />
    <button @tap="saveProfile">保存</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import Taro from '@tarojs/taro'

const userStore = useUserStore()
const avatar = ref('')
const nickname = ref('')
const phone = ref('')

onMounted(async () => {
  const info = await userStore.getUserInfo()
  avatar.value = info.avatar
  nickname.value = info.nickname
  phone.value = info.phone
})

const chooseAvatar = async () => {
  const res = await Taro.chooseImage({ count: 1 })
  if (res.tempFilePaths && res.tempFilePaths.length > 0) {
    avatar.value = res.tempFilePaths[0]
    // 如需上传到服务器，可在此处上传并返回url
  }
}
const saveProfile = async () => {
  await userStore.updateUserInfo({ avatar: avatar.value, nickname: nickname.value, phone: phone.value })
  Taro.showToast({ title: '保存成功', icon: 'success' })
  const pages = Taro.getCurrentPages()
  if (pages.length > 1) {
    Taro.navigateBack()
  } else {
    Taro.switchTab({ url: '/pages/mine/index' })
  }
}
</script>

<style lang="scss">
.profile-edit-page {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60rpx;
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    margin-bottom: 40rpx;
    background: #eee;
  }
  input {
    width: 80vw;
    margin-bottom: 30rpx;
    padding: 20rpx;
    font-size: 32rpx;
    border-radius: 12rpx;
    border: 1rpx solid #ddd;
    background: #fff;
  }
  button {
    width: 80vw;
    margin-top: 30rpx;
    font-size: 32rpx;
    background: #1296db;
    color: #fff;
    border-radius: 12rpx;
    padding: 20rpx 0;
  }
}
</style>
