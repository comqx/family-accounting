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
        <!-- 简单的数据可视化 -->
        <view v-if="categoryStats.length > 0" class="chart-content">
          <view class="chart-summary">
            <text class="summary-text">共 {{ categoryStats.length }} 个分类</text>
            <text class="summary-text">总支出 ¥{{ formatAmount(totalExpense) }}</text>
          </view>
        </view>
        <view v-else class="chart-placeholder">
          <view class="chart-icon">📊</view>
          <text class="chart-text">暂无支出数据</text>
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
        <view v-if="maxDailyExpense > 0" class="trend-content">
          <view class="trend-summary">
            <text class="summary-text">最高单日支出 ¥{{ formatAmount(maxDailyExpense) }}</text>
            <text class="summary-text">平均每日支出 ¥{{ formatAmount(avgDailyExpense) }}</text>
          </view>
        </view>
        <view v-else class="trend-placeholder">
          <view class="trend-icon">📈</view>
          <text class="trend-text">暂无趋势数据</text>
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
import { useUserStore, useAppStore, useFamilyStore } from '../../stores'
import { formatAmount } from '../../utils/format'
import request from '../../utils/request'

// Store
const userStore = useUserStore()
const appStore = useAppStore()
const familyStore = useFamilyStore()

// 响应式数据
const selectedPeriod = ref('month')
const customDate = ref(new Date().toISOString().split('T')[0].substring(0, 7))
const showTimePicker = ref(false)

// 真实数据
const totalExpense = ref(0)
const totalIncome = ref(0)
const avgDailyExpense = ref(0)
const maxDailyExpense = ref(0)
const recordDays = ref(0)

const categoryStats = ref([])

// 时间选项
const timeTabs = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' }
]

// 计算属性
const balance = computed(() => totalIncome.value - totalExpense.value)

const currentTimeText = computed(() => {
  if (selectedPeriod.value === 'custom') {
    const date = new Date(customDate.value + '-01')
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }
  
  const option = timeTabs.find(tab => tab.value === selectedPeriod.value)
  return option?.label || '本月'
})

// 方法
const selectPeriod = (period) => {
  selectedPeriod.value = period
  loadReportData()
}

const showCustomPicker = () => {
  selectedPeriod.value = 'custom'
  showTimePicker.value = true
}

const onCustomDateChange = (e) => {
  console.log('选择了新月份', e.detail.value)
  customDate.value = e.detail.value
  selectedPeriod.value = 'custom' // 强制切换为自定义
  showTimePicker.value = false
  loadReportData()
}

const getDateRange = () => {
  const now = new Date()
  let startDate = '', endDate = ''
  
  if (selectedPeriod.value === 'week') {
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    startDate = monday.toISOString().split('T')[0]
    endDate = now.toISOString().split('T')[0]
  } else if (selectedPeriod.value === 'month') {
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    startDate = `${year}-${month}-01`
    // 获取当月最后一天
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    endDate = `${year}-${month}-${lastDay}`
  } else if (selectedPeriod.value === 'year') {
    const year = now.getFullYear()
    startDate = `${year}-01-01`
    endDate = `${year}-12-31`
  } else if (selectedPeriod.value === 'custom') {
    startDate = `${customDate.value}-01`
    // 获取自定义月份的最后一天
    const [year, month] = customDate.value.split('-')
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    endDate = `${customDate.value}-${lastDay}`
  }
  
  console.log('📅 计算日期范围:', { 
    period: selectedPeriod.value, 
    startDate, 
    endDate,
    customDate: customDate.value 
  })
  
  return { startDate, endDate }
}

const loadReportData = async () => {
  try {
    const { startDate, endDate } = getDateRange()
    const familyId = familyStore.familyId
    
    console.log('📊 加载报表数据:', { familyId, startDate, endDate })
    
    if (!familyId) {
      console.error('❌ 家庭ID为空，无法加载报表数据')
      appStore.showToast('请先选择家庭', 'none')
      return
    }
    
    // 1. 获取统计数据
    const statsRes = await request.get('/api/report/statistics', {
      familyId, startDate, endDate
    })
    
    console.log('📊 统计数据响应:', statsRes)
    
    // 兼容不同的响应格式
    const stats = statsRes.data || statsRes
    console.log('📊 解析的统计数据:', stats)
    
    if (stats) {
      totalExpense.value = parseFloat(stats.totalExpense) || 0
      totalIncome.value = parseFloat(stats.totalIncome) || 0
      recordDays.value = parseInt(stats.totalRecords) || 0
      
      // 计算平均每日支出
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
      avgDailyExpense.value = days > 0 ? totalExpense.value / days : 0
      
      console.log('📊 统计数据已更新:', { 
        totalExpense: totalExpense.value, 
        totalIncome: totalIncome.value, 
        recordDays: recordDays.value,
        avgDailyExpense: avgDailyExpense.value
      })
    }
    
    // 2. 获取分类统计
    const catRes = await request.get('/api/report/categories', {
      familyId, startDate, endDate, type: 'expense'
    })
    
    console.log('📈 分类统计响应:', catRes)
    
    // 兼容不同的响应格式
    const categories = catRes.data || catRes
    console.log('📈 解析的分类数据:', categories)
    
    if (categories && Array.isArray(categories)) {
      categoryStats.value = categories.map(cat => ({
        categoryId: cat.categoryId,
        name: cat.categoryName,
        icon: cat.categoryIcon,
        color: cat.categoryColor,
        amount: parseFloat(cat.amount) || 0,
        count: parseInt(cat.count) || 0,
        percentage: totalExpense.value > 0 ? Math.round((cat.amount / totalExpense.value) * 100) : 0
      }))
      
      console.log('📈 分类统计已更新:', categoryStats.value)
    }
    
    // 3. 获取趋势数据计算最大日支出
    const trendRes = await request.get('/api/report/trends', {
      familyId, startDate, endDate, type: 'expense', period: 'day'
    })
    
    console.log('📉 趋势数据响应:', trendRes)
    
    // 兼容不同的响应格式
    const trends = trendRes.data || trendRes
    console.log('📉 解析的趋势数据:', trends)
    
    if (trends && Array.isArray(trends) && trends.length > 0) {
      const maxExpense = Math.max(...trends.map(item => parseFloat(item.expense) || 0))
      maxDailyExpense.value = maxExpense || 0
      
      console.log('📉 趋势数据已更新:', { 
        maxDailyExpense: maxDailyExpense.value,
        trendCount: trends.length
      })
    }
    
  } catch (error) {
    console.error('❌ 加载报表数据失败:', error)
    console.error('错误详情:', error.message, error.stack)
    appStore.showToast('加载数据失败', 'none')
  }
}

const exportReport = () => {
  appStore.showToast('功能开发中', 'none')
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
onMounted(async () => {
  // 检查用户状态
  checkUserStatus()
  
  // 检查用户信息
  const { useUserStore } = require('../../stores')
  const userStore = useUserStore()
  console.log('👤 用户信息:', {
    isLoggedIn: userStore.isLoggedIn,
    user: userStore.user
  })
  
  // 如果用户未登录，直接返回
  if (!userStore.isLoggedIn) {
    console.log('❌ 用户未登录，无法加载报表数据')
    return
  }
  
  console.log('🏠 初始家庭状态:', {
    hasFamily: familyStore.hasFamily,
    familyId: familyStore.familyId,
    familyName: familyStore.familyName,
    family: familyStore.family
  })
  
  // 确保家庭信息已加载
  if (!familyStore.hasFamily) {
    console.log('🏠 家庭信息未加载，尝试获取...')
    const success = await familyStore.getFamilyInfo()
    console.log('🏠 获取家庭信息结果:', success)
    
    if (!success) {
      console.log('❌ 获取家庭信息失败，无法加载报表数据')
      appStore.showToast('请先创建或加入家庭', 'none')
      return
    }
  }
  
  console.log('🏠 最终家庭信息:', {
    hasFamily: familyStore.hasFamily,
    familyId: familyStore.familyId,
    familyName: familyStore.familyName,
    family: familyStore.family
  })
  
  loadReportData()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '报表分析'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 财务报表分析',
    path: '/pages/reports/index'
  })
})
</script>

<style lang="scss">
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
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 20rpx;
    margin: 20rpx 30rpx;
    border-radius: $card-radius;
    box-shadow: $card-shadow;

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
        font-weight: bold;

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
  .analysis-section,
  .trend-section {
    margin: 20rpx 30rpx;
    background: #ffffff;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    padding: 20rpx 0 30rpx;

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

    .chart-container,
    .trend-chart {
      padding: 40rpx 20rpx;

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

      .chart-content, .trend-content {
        height: 200rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;

        .chart-summary, .trend-summary {
          text-align: center;

          .summary-text {
            display: block;
            font-size: 28rpx;
            margin-bottom: 10rpx;
            font-weight: 500;
          }
        }
      }
    }

    .category-stats {
      .stat-item {
        display: flex;
        align-items: center;
        margin-bottom: 30rpx;
        position: relative;

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
    gap: 30rpx;
    padding: 20rpx 30rpx 140rpx;

    .action-btn {
      flex: 1;
      background: linear-gradient(135deg, #1296db 0%, #56ccf2 100%);
      color: white;
      border: none;
      border-radius: 50rpx;
      font-size: 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20rpx 0;
      box-shadow: 0 8rpx 16rpx rgba(18, 150, 219, 0.3);

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
