<template>
  <view class="reports-page">
    <!-- 时间选择 -->
    <view class="time-selector">
      <view class="time-tabs">
        <view
          v-for="tab in timeTabs"
          :key="tab.value"
          class="time-tab"
          :class="{ active: selectedPeriod === tab.value }"
          @tap="selectPeriod(tab.value)"
        >
          {{ tab.label }}
        </view>
      </view>

      <view class="custom-time" @tap="showCustomPicker">
        <text class="time-text">{{ currentTimeText }}</text>
        <text class="time-arrow">▼</text>
      </view>
    </view>

    <!-- 总览卡片 -->
    <view class="overview-card">
      <view class="overview-item">
        <text class="overview-label">总支出</text>
        <text class="overview-value expense">¥{{ formatAmount(totalExpense) }}</text>
      </view>
      <view class="overview-divider"></view>
      <view class="overview-item">
        <text class="overview-label">总收入</text>
        <text class="overview-value income">¥{{ formatAmount(totalIncome) }}</text>
      </view>
      <view class="overview-divider"></view>
      <view class="overview-item">
        <text class="overview-label">结余</text>
        <text class="overview-value" :class="balance >= 0 ? 'income' : 'expense'">
          ¥{{ formatAmount(Math.abs(balance)) }}
        </text>
      </view>
    </view>

    <!-- 支出分析 -->
    <view class="analysis-section">
      <view class="section-header">
        <text class="section-title">支出分析</text>
        <text class="section-subtitle">按分类统计</text>
      </view>

      <view class="chart-container">
        <!-- 这里可以集成图表库，暂时用简单的进度条代替 -->
        <view class="chart-placeholder">
          <view class="chart-icon">📊</view>
          <text class="chart-text">图表功能开发中</text>
        </view>
      </view>

      <view class="category-stats">
        <view
          v-for="stat in categoryStats"
          :key="stat.categoryId"
          class="stat-item"
        >
          <view class="stat-info">
            <view class="stat-icon" :style="{ backgroundColor: stat.color }">
              {{ stat.icon }}
            </view>
            <view class="stat-details">
              <text class="stat-name">{{ stat.name }}</text>
              <text class="stat-count">{{ stat.count }}笔</text>
            </view>
          </view>
          <view class="stat-amount">
            <text class="amount-value">¥{{ formatAmount(stat.amount) }}</text>
            <text class="amount-percent">{{ stat.percentage }}%</text>
          </view>
          <view class="stat-bar">
            <view
              class="bar-fill"
              :style="{
                width: stat.percentage + '%',
                backgroundColor: stat.color
              }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 趋势分析 -->
    <view class="trend-section">
      <view class="section-header">
        <text class="section-title">趋势分析</text>
        <text class="section-subtitle">近7天</text>
      </view>

      <view class="trend-chart">
        <view class="trend-placeholder">
          <view class="trend-icon">📈</view>
          <text class="trend-text">趋势图表开发中</text>
        </view>
      </view>

      <view class="trend-summary">
        <view class="summary-item">
          <text class="summary-label">日均支出</text>
          <text class="summary-value">¥{{ formatAmount(avgDailyExpense) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">最高单日</text>
          <text class="summary-value">¥{{ formatAmount(maxDailyExpense) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">记账天数</text>
          <text class="summary-value">{{ recordDays }}天</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="action-btn" @tap="exportReport">
        <text class="btn-icon">📤</text>
        <text class="btn-text">导出报表</text>
      </button>

      <button class="action-btn" @tap="shareReport">
        <text class="btn-icon">📱</text>
        <text class="btn-text">分享报表</text>
      </button>
    </view>

    <!-- 自定义时间选择器 -->
    <picker
      v-if="showTimePicker"
      mode="date"
      fields="month"
      :value="customDate"
      @change="onCustomDateChange"
      @cancel="showTimePicker = false"
    >
      <view></view>
    </picker>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../stores'
import { formatAmount } from '../../utils/format'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const selectedPeriod = ref('month')
const customDate = ref(new Date().toISOString().split('T')[0].substring(0, 7))
const showTimePicker = ref(false)

// 模拟数据
const totalExpense = ref(1250.80)
const totalIncome = ref(5000.00)
const avgDailyExpense = ref(178.69)
const maxDailyExpense = ref(356.50)
const recordDays = ref(7)

const categoryStats = ref([
  {
    categoryId: '1',
    name: '餐饮',
    icon: '🍽️',
    color: '#ff6b6b',
    amount: 450.50,
    count: 15,
    percentage: 36
  },
  {
    categoryId: '2',
    name: '交通',
    icon: '🚗',
    color: '#4ecdc4',
    amount: 280.30,
    count: 8,
    percentage: 22
  },
  {
    categoryId: '3',
    name: '购物',
    icon: '🛍️',
    color: '#45b7d1',
    amount: 320.00,
    count: 6,
    percentage: 26
  },
  {
    categoryId: '4',
    name: '娱乐',
    icon: '🎮',
    color: '#96ceb4',
    amount: 200.00,
    count: 4,
    percentage: 16
  }
])

// 时间选项
const timeTabs = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' }
]

// 计算属性
const balance = computed(() => totalIncome.value - totalExpense.value)

const currentTimeText = computed(() => {
  const date = new Date(customDate.value + '-01')
  switch (selectedPeriod.value) {
    case 'week':
      return '本周'
    case 'month':
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    case 'year':
      return `${date.getFullYear()}年`
    default:
      return '本月'
  }
})

// 方法
const selectPeriod = (period) => {
  selectedPeriod.value = period
  loadReportData()
}

const showCustomPicker = () => {
  showTimePicker.value = true
}

const onCustomDateChange = (e) => {
  customDate.value = e.detail.value
  showTimePicker.value = false
  loadReportData()
}

const loadReportData = () => {
  // 模拟加载报表数据
  console.log('Loading report data for:', selectedPeriod.value, customDate.value)
}

const exportReport = async () => {
  try {
    appStore.showLoading('导出中...')

    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    appStore.hideLoading()
    appStore.showToast('导出成功', 'success')
  } catch (error) {
    appStore.hideLoading()
    appStore.showToast('导出失败', 'none')
  }
}

const shareReport = () => {
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
}

// 生命周期
onMounted(() => {
  checkUserStatus()
  loadReportData()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '报表'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 我的财务报表',
    path: '/pages/reports/index'
  })
})
</script>

<style lang="scss" scoped>
.reports-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 时间选择器
  .time-selector {
    background: white;
    padding: 30rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

    .time-tabs {
      display: flex;
      background: #f8f9fa;
      border-radius: 20rpx;
      padding: 6rpx;

      .time-tab {
        padding: 12rpx 24rpx;
        border-radius: 16rpx;
        font-size: 26rpx;
        color: #666;
        transition: all 0.3s ease;

        &.active {
          background: white;
          color: #1296db;
          font-weight: bold;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
        }
      }
    }

    .custom-time {
      display: flex;
      align-items: center;
      padding: 12rpx 20rpx;
      background: #f8f9fa;
      border-radius: 20rpx;

      .time-text {
        font-size: 26rpx;
        color: #333;
        margin-right: 8rpx;
      }

      .time-arrow {
        font-size: 20rpx;
        color: #999;
      }
    }
  }

  // 总览卡片
  .overview-card {
    background: white;
    margin: 30rpx;
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

    .overview-item {
      flex: 1;
      text-align: center;

      .overview-label {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .overview-value {
        display: block;
        font-size: 32rpx;
        font-weight: bold
;
        &.expense {
          color: #ff4757;
        }

        &.income {
          color: #2ed573;
        }
      }
    }

    .overview-divider {
      width: 2rpx;
      height: 60rpx;
      background: #f0f0f0;
      margin: 0 20rpx;
    }
  }

  // 分析区域
  .analysis-section, .trend-section {
    background: white;
    margin: 30rpx;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .section-subtitle {
        font-size: 24rpx;
        color: #999;
      }
    }

    .chart-container, .trend-chart {
      margin-bottom: 30rpx;

      .chart-placeholder, .trend-placeholder {
        height: 200rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .chart-icon, .trend-icon {
          font-size: 60rpx;
          margin-bottom: 10rpx;
        }

        .chart-text, .trend-text {
          font-size: 26rpx;
          color: #999;
        }
      }
    }

    .category-stats {
      .stat-item {
        display: flex;
        align-items: center;
        margin-bottom: 30rpx;
        position: relative
;
        &:last-child {
          margin-bottom: 0;
        }

        .stat-info {
          display: flex;
          align-items: center;
          flex: 1;

          .stat-icon {
            width: 60rpx;
            height: 60rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24rpx;
            margin-right: 20rpx;
          }

          .stat-details {
            .stat-name {
              display: block;
              font-size: 28rpx;
              color: #333;
              margin-bottom: 4rpx;
            }

            .stat-count {
              display: block;
              font-size: 22rpx;
              color: #999;
            }
          }
        }

        .stat-amount {
          text-align: right;
          margin-right: 20rpx;

          .amount-value {
            display: block;
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
            margin-bottom: 4rpx;
          }

          .amount-percent {
            display: block;
            font-size: 22rpx;
            color: #999;
          }
        }

        .stat-bar {
          position: absolute;
          bottom: 0;
          left: 80rpx;
          right: 0;
          height: 6rpx;
          background: #f0f0f0;
          border-radius: 3rpx;

          .bar-fill {
            height: 100%;
            border-radius: 3rpx;
            transition: width 0.3s ease;
          }
        }
      }
    }

    .trend-summary {
      display: flex;
      justify-content: space-around;

      .summary-item {
        text-align: center;

        .summary-label {
          display: block;
          font-size: 24rpx;
          color: #666;
          margin-bottom: 8rpx;
        }

        .summary-value {
          display: block;
          font-size: 28rpx;
          color: #333;
          font-weight: bold;
        }
      }
    }
  }

  // 操作按钮
  .action-section {
    display: flex;
    gap: 20rpx;
    padding: 0 30rpx;

    .action-btn {
      flex: 1;
      background: white;
      border: 2rpx solid #e0e0e0;
      border-radius: 50rpx;
      padding: 28rpx 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      color: #333;

      &::after {
        border: none;
      }

      .btn-icon {
        font-size: 32rpx;
        margin-right: 10rpx;
      }

      .btn-text {
        font-weight: 500;
      }
    }
  }
}
</style>
