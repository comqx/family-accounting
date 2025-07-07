<template>
  <view class="advanced-reports-page">
    <!-- 时间范围选择 -->
    <view class="time-range-selector">
      <view class="range-tabs">
        <view 
          v-for="range in timeRanges" 
          :key="range.value"
          class="range-tab"
          :class="{ active: selectedRange === range.value }"
          @tap="selectTimeRange(range.value)"
        >
          {{ range.label }}
        </view>
      </view>
      
      <view v-if="selectedRange === 'custom'" class="custom-range">
        <picker 
          mode="date" 
          :value="customStartDate"
          @change="onStartDateChange"
        >
          <view class="date-picker">{{ customStartDate }}</view>
        </picker>
        <text class="range-separator">至</text>
        <picker 
          mode="date" 
          :value="customEndDate"
          @change="onEndDateChange"
        >
          <view class="date-picker">{{ customEndDate }}</view>
        </picker>
      </view>
    </view>

    <!-- 核心指标 -->
    <view class="key-metrics">
      <view class="metric-card">
        <text class="metric-label">总支出</text>
        <text class="metric-value expense">¥{{ formatAmount(metrics.totalExpense) }}</text>
        <text class="metric-change" :class="metrics.expenseChange >= 0 ? 'increase' : 'decrease'">
          {{ metrics.expenseChange >= 0 ? '+' : '' }}{{ metrics.expenseChange.toFixed(1) }}%
        </text>
      </view>
      
      <view class="metric-card">
        <text class="metric-label">总收入</text>
        <text class="metric-value income">¥{{ formatAmount(metrics.totalIncome) }}</text>
        <text class="metric-change" :class="metrics.incomeChange >= 0 ? 'increase' : 'decrease'">
          {{ metrics.incomeChange >= 0 ? '+' : '' }}{{ metrics.incomeChange.toFixed(1) }}%
        </text>
      </view>
      
      <view class="metric-card">
        <text class="metric-label">结余</text>
        <text class="metric-value" :class="metrics.balance >= 0 ? 'income' : 'expense'">
          ¥{{ formatAmount(Math.abs(metrics.balance)) }}
        </text>
        <text class="metric-change" :class="metrics.balanceChange >= 0 ? 'increase' : 'decrease'">
          {{ metrics.balanceChange >= 0 ? '+' : '' }}{{ metrics.balanceChange.toFixed(1) }}%
        </text>
      </view>
    </view>

    <!-- 分类分析 -->
    <view class="analysis-section">
      <view class="section-header">
        <text class="section-title">分类分析</text>
        <view class="view-toggle">
          <text 
            class="toggle-item"
            :class="{ active: analysisView === 'chart' }"
            @tap="switchAnalysisView('chart')"
          >
            图表
          </text>
          <text 
            class="toggle-item"
            :class="{ active: analysisView === 'list' }"
            @tap="switchAnalysisView('list')"
          >
            列表
          </text>
        </view>
      </view>

      <view v-if="analysisView === 'chart'" class="chart-view">
        <view class="chart-container">
          <view class="chart-placeholder">
            <view class="chart-icon">📊</view>
            <text class="chart-text">饼图显示各分类占比</text>
          </view>
        </view>
      </view>

      <view v-else class="list-view">
        <view 
          v-for="category in categoryAnalysis" 
          :key="category.id"
          class="category-analysis-item"
        >
          <view class="category-header">
            <view class="category-icon" :style="{ backgroundColor: category.color }">
              {{ category.icon }}
            </view>
            <view class="category-info">
              <text class="category-name">{{ category.name }}</text>
              <text class="category-count">{{ category.count }}笔</text>
            </view>
            <view class="category-amount">
              <text class="amount-value">¥{{ formatAmount(category.amount) }}</text>
              <text class="amount-percent">{{ category.percentage.toFixed(1) }}%</text>
            </view>
          </view>
          
          <view class="category-trend">
            <text class="trend-label">较上期</text>
            <text class="trend-value" :class="category.trend >= 0 ? 'increase' : 'decrease'">
              {{ category.trend >= 0 ? '+' : '' }}{{ category.trend.toFixed(1) }}%
            </text>
          </view>
          
          <view class="category-bar">
            <view 
              class="bar-fill" 
              :style="{ 
                width: category.percentage + '%',
                backgroundColor: category.color 
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
        <view class="trend-type-selector">
          <text 
            class="type-item"
            :class="{ active: trendType === 'daily' }"
            @tap="switchTrendType('daily')"
          >
            日
          </text>
          <text 
            class="type-item"
            :class="{ active: trendType === 'weekly' }"
            @tap="switchTrendType('weekly')"
          >
            周
          </text>
          <text 
            class="type-item"
            :class="{ active: trendType === 'monthly' }"
            @tap="switchTrendType('monthly')"
          >
            月
          </text>
        </view>
      </view>

      <view class="trend-chart">
        <view class="chart-placeholder">
          <view class="chart-icon">📈</view>
          <text class="chart-text">{{ trendType === 'daily' ? '日' : trendType === 'weekly' ? '周' : '月' }}度趋势图</text>
        </view>
      </view>

      <view class="trend-insights">
        <view class="insight-item">
          <text class="insight-label">平均{{ trendType === 'daily' ? '日' : trendType === 'weekly' ? '周' : '月' }}支出</text>
          <text class="insight-value">¥{{ formatAmount(trendInsights.avgExpense) }}</text>
        </view>
        <view class="insight-item">
          <text class="insight-label">最高单{{ trendType === 'daily' ? '日' : trendType === 'weekly' ? '周' : '月' }}</text>
          <text class="insight-value">¥{{ formatAmount(trendInsights.maxExpense) }}</text>
        </view>
        <view class="insight-item">
          <text class="insight-label">波动率</text>
          <text class="insight-value">{{ trendInsights.volatility.toFixed(1) }}%</text>
        </view>
      </view>
    </view>

    <!-- 成员分析 -->
    <view class="member-section">
      <view class="section-header">
        <text class="section-title">成员分析</text>
      </view>

      <view class="member-list">
        <view 
          v-for="member in memberAnalysis" 
          :key="member.userId"
          class="member-item"
        >
          <image 
            class="member-avatar" 
            :src="member.avatarUrl || '/assets/default-avatar.png'"
            mode="aspectFill"
          />
          <view class="member-info">
            <text class="member-name">{{ member.nickName }}</text>
            <text class="member-records">{{ member.recordCount }}笔记录</text>
          </view>
          <view class="member-stats">
            <text class="member-expense">支出 ¥{{ formatAmount(member.totalExpense) }}</text>
            <text class="member-income">收入 ¥{{ formatAmount(member.totalIncome) }}</text>
          </view>
          <view class="member-percentage">
            <text class="percentage-text">{{ member.expensePercentage.toFixed(1) }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导出按钮 -->
    <view class="export-section">
      <button class="export-btn" @tap="exportReport">
        <text class="btn-icon">📤</text>
        <text class="btn-text">导出详细报表</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../../stores'
import { formatAmount } from '../../../utils/format'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const selectedRange = ref('month')
const customStartDate = ref('')
const customEndDate = ref('')
const analysisView = ref<'chart' | 'list'>('list')
const trendType = ref<'daily' | 'weekly' | 'monthly'>('daily')

// 时间范围选项
const timeRanges = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '本年', value: 'year' },
  { label: '自定义', value: 'custom' }
]

// 模拟数据
const metrics = ref({
  totalExpense: 2580.50,
  totalIncome: 8000.00,
  balance: 5419.50,
  expenseChange: 12.5,
  incomeChange: -3.2,
  balanceChange: -8.7
})

const categoryAnalysis = ref([
  {
    id: '1',
    name: '餐饮',
    icon: '🍽️',
    color: '#ff6b6b',
    amount: 856.30,
    count: 25,
    percentage: 33.2,
    trend: 15.6
  },
  {
    id: '2',
    name: '交通',
    icon: '🚗',
    color: '#4ecdc4',
    amount: 420.80,
    count: 18,
    percentage: 16.3,
    trend: -8.2
  },
  {
    id: '3',
    name: '购物',
    icon: '🛍️',
    color: '#45b7d1',
    amount: 680.90,
    count: 12,
    percentage: 26.4,
    trend: 22.1
  }
])

const trendInsights = ref({
  avgExpense: 86.2,
  maxExpense: 256.8,
  volatility: 18.5
})

const memberAnalysis = ref([
  {
    userId: '1',
    nickName: '张三',
    avatarUrl: '',
    recordCount: 35,
    totalExpense: 1580.30,
    totalIncome: 5000.00,
    expensePercentage: 61.2
  },
  {
    userId: '2',
    nickName: '李四',
    avatarUrl: '',
    recordCount: 20,
    totalExpense: 1000.20,
    totalIncome: 3000.00,
    expensePercentage: 38.8
  }
])

// 方法
const selectTimeRange = (range: string) => {
  selectedRange.value = range
  if (range === 'custom') {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    customStartDate.value = start.toISOString().split('T')[0]
    customEndDate.value = now.toISOString().split('T')[0]
  }
  loadReportData()
}

const onStartDateChange = (e: any) => {
  customStartDate.value = e.detail.value
  loadReportData()
}

const onEndDateChange = (e: any) => {
  customEndDate.value = e.detail.value
  loadReportData()
}

const switchAnalysisView = (view: 'chart' | 'list') => {
  analysisView.value = view
}

const switchTrendType = (type: 'daily' | 'weekly' | 'monthly') => {
  trendType.value = type
  loadTrendData()
}

const loadReportData = () => {
  // 模拟加载报表数据
  console.log('Loading report data for range:', selectedRange.value)
}

const loadTrendData = () => {
  // 模拟加载趋势数据
  console.log('Loading trend data for type:', trendType.value)
}

const exportReport = async () => {
  try {
    appStore.showLoading('生成报表中...')
    
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    appStore.hideLoading()
    appStore.showToast('报表已生成', 'success')
  } catch (error) {
    appStore.hideLoading()
    appStore.showToast('导出失败', 'none')
  }
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
    title: '高级报表'
  })
})
</script>

<style lang="scss" scoped>
.advanced-reports-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 时间范围选择器
  .time-range-selector {
    background: white;
    padding: 30rpx;
    margin-bottom: 20rpx;

    .range-tabs {
      display: flex;
      background: #f8f9fa;
      border-radius: 20rpx;
      padding: 6rpx;
      margin-bottom: 20rpx;

      .range-tab {
        flex: 1;
        text-align: center;
        padding: 12rpx 0;
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

    .custom-range {
      display: flex;
      align-items: center;
      gap: 20rpx;

      .date-picker {
        flex: 1;
        padding: 20rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        text-align: center;
        font-size: 26rpx;
        color: #333;
      }

      .range-separator {
        font-size: 26rpx;
        color: #666;
      }
    }
  }

  // 核心指标
  .key-metrics {
    display: flex;
    gap: 20rpx;
    padding: 0 30rpx;
    margin-bottom: 30rpx;

    .metric-card {
      flex: 1;
      background: white;
      border-radius: 16rpx;
      padding: 30rpx 20rpx;
      text-align: center;

      .metric-label {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .metric-value {
        display: block;
        font-size: 28rpx;
        font-weight: bold;
        margin-bottom: 8rpx;

        &.expense {
          color: #ff4757;
        }

        &.income {
          color: #2ed573;
        }
      }

      .metric-change {
        display: block;
        font-size: 22rpx;

        &.increase {
          color: #2ed573;
        }

        &.decrease {
          color: #ff4757;
        }
      }
    }
  }

  // 分析区域
  .analysis-section, .trend-section, .member-section {
    background: white;
    margin: 0 30rpx 30rpx;
    border-radius: 16rpx;
    padding: 30rpx;

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

      .view-toggle, .trend-type-selector {
        display: flex;
        background: #f8f9fa;
        border-radius: 20rpx;
        padding: 4rpx;

        .toggle-item, .type-item {
          padding: 8rpx 20rpx;
          border-radius: 16rpx;
          font-size: 24rpx;
          color: #666;
          transition: all 0.3s ease;

          &.active {
            background: white;
            color: #1296db;
            font-weight: bold;
          }
        }
      }
    }

    .chart-container, .trend-chart {
      height: 300rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30rpx;

      .chart-placeholder {
        text-align: center;

        .chart-icon {
          font-size: 60rpx;
          margin-bottom: 10rpx;
        }

        .chart-text {
          font-size: 26rpx;
          color: #999;
        }
      }
    }

    .category-analysis-item {
      margin-bottom: 30rpx;
      padding-bottom: 20rpx;
      border-bottom: 2rpx solid #f0f0f0;

      &:last-child {
        margin-bottom: 0;
        border-bottom: none;
      }

      .category-header {
        display: flex;
        align-items: center;
        margin-bottom: 15rpx;

        .category-icon {
          width: 60rpx;
          height: 60rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24rpx;
          margin-right: 20rpx;
        }

        .category-info {
          flex: 1;

          .category-name {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 4rpx;
          }

          .category-count {
            display: block;
            font-size: 22rpx;
            color: #999;
          }
        }

        .category-amount {
          text-align: right;

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
      }

      .category-trend {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15rpx;

        .trend-label {
          font-size: 24rpx;
          color: #666;
        }

        .trend-value {
          font-size: 24rpx;
          font-weight: bold;

          &.increase {
            color: #2ed573;
          }

          &.decrease {
            color: #ff4757;
          }
        }
      }

      .category-bar {
        height: 8rpx;
        background: #f0f0f0;
        border-radius: 4rpx;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          border-radius: 4rpx;
          transition: width 0.3s ease;
        }
      }
    }

    .trend-insights {
      display: flex;
      justify-content: space-around;

      .insight-item {
        text-align: center;

        .insight-label {
          display: block;
          font-size: 24rpx;
          color: #666;
          margin-bottom: 8rpx;
        }

        .insight-value {
          display: block;
          font-size: 28rpx;
          color: #333;
          font-weight: bold;
        }
      }
    }

    .member-list {
      .member-item {
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 2rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .member-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          margin-right: 20rpx;
        }

        .member-info {
          flex: 1;

          .member-name {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 6rpx;
          }

          .member-records {
            display: block;
            font-size: 24rpx;
            color: #999;
          }
        }

        .member-stats {
          text-align: right;
          margin-right: 20rpx;

          .member-expense {
            display: block;
            font-size: 24rpx;
            color: #ff4757;
            margin-bottom: 4rpx;
          }

          .member-income {
            display: block;
            font-size: 24rpx;
            color: #2ed573;
          }
        }

        .member-percentage {
          .percentage-text {
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
          }
        }
      }
    }
  }

  // 导出按钮
  .export-section {
    padding: 0 30rpx;

    .export-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50rpx;
      padding: 28rpx 0;
      font-size: 32rpx;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;

      &::after {
        border: none;
      }

      .btn-icon {
        font-size: 36rpx;
        margin-right: 10rpx;
      }
    }
  }
}
</style>
