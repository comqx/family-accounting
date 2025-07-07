<template>
  <view class="import-page">
    <!-- 导入方式选择 -->
    <view class="import-methods">
      <view class="method-card" @tap="chooseImage">
        <view class="method-icon">📷</view>
        <text class="method-title">拍照识别</text>
        <text class="method-desc">拍摄账单照片，自动识别记录</text>
      </view>

      <view class="method-card" @tap="chooseFromAlbum">
        <view class="method-icon">🖼️</view>
        <text class="method-title">相册选择</text>
        <text class="method-desc">从相册选择账单图片</text>
      </view>

      <view class="method-card" @tap="batchImport">
        <view class="method-icon">📁</view>
        <text class="method-title">批量导入</text>
        <text class="method-desc">一次选择多张图片批量识别</text>
      </view>
    </view>

    <!-- 支持的平台 -->
    <view class="supported-platforms">
      <text class="section-title">支持的账单类型</text>
      <view class="platform-list">
        <view class="platform-item">
          <view class="platform-icon alipay">💙</view>
          <text class="platform-name">支付宝</text>
        </view>
        <view class="platform-item">
          <view class="platform-icon wechat">💚</view>
          <text class="platform-name">微信支付</text>
        </view>
        <view class="platform-item">
          <view class="platform-icon bank">🏦</view>
          <text class="platform-name">银行卡</text>
        </view>
        <view class="platform-item">
          <view class="platform-icon credit">💳</view>
          <text class="platform-name">信用卡账单</text>
        </view>
        <view class="platform-item">
          <view class="platform-icon receipt">🧾</view>
          <text class="platform-name">购物小票</text>
        </view>
      </view>
    </view>

    <!-- 使用说明 -->
    <view class="usage-tips">
      <text class="section-title">使用说明</text>
      <view class="tips-list">
        <view class="tip-item">
          <view class="tip-number">1</view>
          <text class="tip-text">确保账单图片清晰，文字可见</text>
        </view>
        <view class="tip-item">
          <view class="tip-number">2</view>
          <text class="tip-text">支持多种格式：JPG、PNG、PDF</text>
        </view>
        <view class="tip-item">
          <view class="tip-number">3</view>
          <text class="tip-text">识别后可手动调整分类和金额</text>
        </view>
        <view class="tip-item">
          <view class="tip-number">4</view>
          <text class="tip-text">批量导入最多支持10张图片</text>
        </view>
      </view>
    </view>

    <!-- 最近导入记录 -->
    <view v-if="recentImports.length > 0" class="recent-imports">
      <text class="section-title">最近导入</text>
      <view class="import-list">
        <view
          v-for="item in recentImports"
          :key="item.id"
          class="import-item"
          @tap="viewImportResult(item.id)"
        >
          <view class="import-info">
            <text class="import-platform">{{ item.platform }}</text>
            <text class="import-time">{{ formatRelativeTime(item.createTime) }}</text>
          </view>
          <view class="import-stats">
            <text class="import-count">{{ item.recordCount }}条记录</text>
            <text class="import-amount">¥{{ formatAmount(item.totalAmount) }}</text>
          </view>
          <text class="import-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="isProcessing" class="processing-overlay">
      <view class="processing-content">
        <view class="processing-icon">🔍</view>
        <text class="processing-text">{{ processingText }}</text>
        <view class="processing-progress">
          <view class="progress-bar" :style="{ width: progress + '%' }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../stores'
import { BillPlatform } from '../../types/business'
import { formatAmount, formatRelativeTime } from '../../utils/format'
import ocrService from '../../services/ocr'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const isProcessing = ref(false)
const processingText = ref('正在识别...')
const progress = ref(0)

// 模拟最近导入记录
const recentImports = ref([
  {
    id: '1',
    platform: '支付宝账单',
    recordCount: 5,
    totalAmount: 156.80,
    createTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    platform: '微信账单',
    recordCount: 3,
    totalAmount: 89.50,
    createTime: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
])

// 方法
const chooseImage = async () => {
  try {
    const result = await Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera']
    });

    if (result.tempFilePaths.length > 0) {
      await processImage(result.tempFilePaths[0]);
    }
  } catch (error: any) {
    if (!error.errMsg?.includes('cancel')) {
      appStore.showToast('拍照失败，请重试', 'none');
    }
  }
}

const chooseFromAlbum = async () => {
  try {
    const result = await Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album']
    });

    if (result.tempFilePaths.length > 0) {
      await processImage(result.tempFilePaths[0]);
    }
  } catch (error: any) {
    if (!error.errMsg?.includes('cancel')) {
      appStore.showToast('选择图片失败，请重试', 'none');
    }
  }
}

const batchImport = async () => {
  try {
    const result = await Taro.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album']
    });

    if (result.tempFilePaths.length > 0) {
      await processBatchImages(result.tempFilePaths);
    }
  } catch (error: any) {
    if (!error.errMsg?.includes('cancel')) {
      appStore.showToast('选择图片失败，请重试', 'none');
    }
  }
}

const processImage = async (imagePath: string) => {
  try {
    isProcessing.value = true;
    processingText.value = '正在识别账单...';
    progress.value = 0;

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10;
      }
    }, 200);

    // 识别账单
    const result = await ocrService.recognizeBill(imagePath);

    clearInterval(progressInterval);
    progress.value = 100;

    // 跳转到结果页面
    setTimeout(() => {
      Taro.navigateTo({
        url: `/pages/import/result/index?data=${encodeURIComponent(JSON.stringify(result))}`
      });
    }, 500);

  } catch (error: any) {
    console.error('Process image error:', error);
    appStore.showToast(error.message || '识别失败，请重试', 'none');
  } finally {
    isProcessing.value = false;
    progress.value = 0;
  }
}

const processBatchImages = async (imagePaths: string[]) => {
  try {
    isProcessing.value = true;
    processingText.value = `正在批量识别 ${imagePaths.length} 张图片...`;
    progress.value = 0;

    const results = [];

    for (let i = 0; i < imagePaths.length; i++) {
      processingText.value = `正在识别第 ${i + 1}/${imagePaths.length} 张图片...`;
      progress.value = (i / imagePaths.length) * 100;

      try {
        const result = await ocrService.recognizeBill(imagePaths[i]);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
      }
    }

    progress.value = 100;

    // 跳转到批量结果页面
    setTimeout(() => {
      Taro.navigateTo({
        url: `/pages/import/result/index?batch=true&data=${encodeURIComponent(JSON.stringify(results))}`
      });
    }, 500);

  } catch (error: any) {
    console.error('Process batch images error:', error);
    appStore.showToast(error.message || '批量识别失败', 'none');
  } finally {
    isProcessing.value = false;
    progress.value = 0;
  }
}

const viewImportResult = (importId: string) => {
  Taro.navigateTo({
    url: `/pages/import/result/index?id=${importId}`
  });
}

// 检查用户状态
const checkUserStatus = () => {
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    });
    return;
  }
}

// 生命周期
onMounted(() => {
  checkUserStatus();
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '智能导入'
  });
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 智能账单识别',
    path: '/pages/import/index'
  });
})
</script>

<style lang="scss" scoped>
.import-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 30rpx;
  padding-bottom: 120rpx;

  // 导入方式
  .import-methods {
    margin-bottom: 40rpx;

    .method-card {
      background: white;
      border-radius: 20rpx;
      padding: 40rpx 30rpx;
      margin-bottom: 20rpx;
      text-align: center;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;

      &:active {
        transform: scale(0.98);
      }

      .method-icon {
        font-size: 80rpx;
        margin-bottom: 20rpx;
      }

      .method-title {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 10rpx;
      }

      .method-desc {
        display: block;
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
      }
    }
  }

  // 支持平台
  .supported-platforms {
    margin-bottom: 40rpx;

    .section-title {
      display: block;
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }

    .platform-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20rpx;

      .platform-item {
        background: white;
        border-radius: 16rpx;
        padding: 30rpx 20rpx;
        text-align: center;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

        .platform-icon {
          font-size: 48rpx;
          margin-bottom: 10rpx;

          &.alipay {
            color: #1677ff;
          }

          &.wechat {
            color: #07c160;
          }

          &.bank {
            color: #ff6b35;
          }

          &.credit {
            color: #f5222d;
          }

          &.receipt {
            color: #722ed1;
          }
        }

        .platform-name {
          display: block;
          font-size: 26rpx;
          color: #333;
        }
      }
    }
  }

  // 使用说明
  .usage-tips {
    margin-bottom: 40rpx;

    .section-title {
      display: block;
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }

    .tips-list {
      background: white;
      border-radius: 16rpx;
      padding: 30rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

      .tip-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 20rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .tip-number {
          width: 40rpx;
          height: 40rpx;
          background: #1296db;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22rpx;
          font-weight: bold;
          margin-right: 20rpx;
          flex-shrink: 0;
        }

        .tip-text {
          flex: 1;
          font-size: 26rpx;
          color: #666;
          line-height: 1.5;
          padding-top: 6rpx;
        }
      }
    }
  }

  // 最近导入
  .recent-imports {
    .section-title {
      display: block;
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }

    .import-list {
      background: white;
      border-radius: 16rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

      .import-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .import-info {
          flex: 1;

          .import-platform {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 6rpx;
          }

          .import-time {
            display: block;
            font-size: 24rpx;
            color: #999;
          }
        }

        .import-stats {
          text-align: right;
          margin-right: 20rpx;

          .import-count {
            display: block;
            font-size: 24rpx;
            color: #666;
            margin-bottom: 6rpx;
          }

          .import-amount {
            display: block;
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
          }
        }

        .import-arrow {
          font-size: 24rpx;
          color: #ccc;
        }
      }
    }
  }

  // 处理状态覆盖层
  .processing-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .processing-content {
      background: white;
      border-radius: 20rpx;
      padding: 60rpx 40rpx;
      text-align: center;
      min-width: 400rpx;

      .processing-icon {
        font-size: 80rpx;
        margin-bottom: 20rpx;
      }

      .processing-text {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 30rpx;
      }

      .processing-progress {
        width: 100%;
        height: 8rpx;
        background: #f0f0f0;
        border-radius: 4rpx;
        overflow: hidden;

        .progress-bar {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4rpx;
          transition: width 0.3s ease;
        }
      }
    }
  }
}
</style>
