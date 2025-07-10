<template>
  <view class="import-page">
    <view class="card">
      <view class="section-title">拍照识别</view>
      <view class="section-desc">拍照识别账单照片，自动识别记录</view>
    </view>
    <view class="card">
      <view class="section-title">相册选择</view>
      <view class="section-desc">相册选择账单图片</view>
    </view>
    <view class="card">
      <view class="section-title">批量导入</view>
      <view class="section-desc">一次选择多张图片批量识别</view>
    </view>
    <view class="card">
      <view class="section-title">支持的账单类型</view>
      <view class="type-list">
        <view class="type-item">支付宝</view>
        <view class="type-item">微信支付</view>
        <view class="type-item">银行卡</view>
        <view class="type-item">信用卡账单</view>
        <view class="type-item">购物小票</view>
      </view>
    </view>
    <view class="card">
      <view class="section-title">使用说明</view>
      <view class="section-desc">1. 确保账单图片清晰，文字可见</view>
      <view class="section-desc">2. 支持多种格式：JPG、PNG、PDF</view>
      <view class="section-desc">3. 识别后可手动调整分类和金额</view>
      <view class="section-desc">4. 批量导入最多支持10张图片</view>
    </view>
    <view class="card">
      <view class="section-title">最近导入</view>
      <view class="section-desc">支付宝账单 2小时前，5条记录 ¥156.80</view>
      <view class="section-desc">微信账单 1天前，3条记录 ¥89.50</view>
    </view>
  </view>
</template>

<script setup>
// 这里可按需引入逻辑
</script>

<style lang="scss">
.import-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  .card {
    background: #fff;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
    margin: 24rpx 30rpx;
    padding: 32rpx 24rpx;
    margin-bottom: 24rpx;
  }
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #1296db;
    margin-bottom: 12rpx;
  }
  .section-desc {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 8rpx;
  }
  .type-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 8rpx;
    .type-item {
      background: #f7b267;
      color: #fff;
      border-radius: 16rpx;
      padding: 8rpx 24rpx;
      font-size: 26rpx;
    }
  }
}
</style>
