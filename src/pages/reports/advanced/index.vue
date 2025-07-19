<template>
  <view class="advanced-reports-page">
    <!-- 统计区骨架屏 -->
    <view v-if="loadingData" class="metrics-skeleton">
      <view class="metrics-item-skeleton" v-for="i in 3" :key="i">
        <view class="metrics-label-skeleton"></view>
        <view class="metrics-value-skeleton"></view>
      </view>
    </view>
    <!-- 统计区 -->
    <view v-else class="metrics-section">
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
          <Suspense>
            <template #default>
              <AsyncEChart v-if="categoryAnalysis.length > 0" :option="pieOption" style="width:100%;height:400rpx" />
              <view v-else class="chart-placeholder">
            <view class="chart-icon">📊</view>
                <text class="chart-text">暂无分类数据</text>
          </view>
            </template>
            <template #fallback>
              <view class="chart-placeholder"><text>加载中...</text></view>
            </template>
          </Suspense>
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
          <Suspense>
            <template #default>
              <AsyncEChart v-if="trendInsights.values && trendInsights.values.length > 0" :option="trendOption" style="width:100%;height:400rpx" />
              <view v-else class="chart-placeholder">
          <view class="chart-icon">📈</view>
                <text class="chart-text">暂无趋势数据</text>
        </view>
            </template>
            <template #fallback>
              <view class="chart-placeholder"><text>加载中...</text></view>
            </template>
          </Suspense>
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
  </view>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../../stores'
import { formatAmount } from '../../../utils/format'
import request from '../../../utils/request'

// 异步加载 taro-echarts 组件
const AsyncEChart = defineAsyncComponent(() => import('taro-echarts'))

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const selectedRange = ref('month')
const customStartDate = ref('')
const customEndDate = ref('')
const analysisView = ref('category')
const trendType = ref('daily')
const metrics = ref({
  totalExpense: 0,
  totalIncome: 0,
  balance: 0,
  expenseChange: 0,
  incomeChange: 0,
  balanceChange: 0
})
const categoryAnalysis = ref([])
const trendInsights = ref({
  avgExpense: 0,
  maxExpense: 0,
  volatility: 0
})
const memberAnalysis = ref([])
const loadingData = ref(true)

const timeRanges = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '本年', value: 'year' },
  { label: '自定义', value: 'custom' }
]

// 方法
const selectTimeRange = (range) => {
  selectedRange.value = range
  if (range === 'custom') {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    customStartDate.value = start.toISOString().split('T')[0]
    customEndDate.value = now.toISOString().split('T')[0]
  }
  loadReportData()
}

const onStartDateChange = (e) => {
  customStartDate.value = e.detail.value
  loadReportData()
}

const onEndDateChange = (e) => {
  customEndDate.value = e.detail.value
  loadReportData()
}

const switchAnalysisView = (view) => {
  analysisView.value = view
}

const switchTrendType = (type) => {
  trendType.value = type
  loadTrendData()
}

const getDateRange = () => {
  const now = new Date()
  let startDate = '', endDate = ''
  if (selectedRange.value === 'week') {
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    startDate = monday.toISOString().split('T')[0]
    endDate = now.toISOString().split('T')[0]
  } else if (selectedRange.value === 'month') {
    startDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-01`
    endDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-31`
  } else if (selectedRange.value === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3)
    startDate = `${now.getFullYear()}-${(quarter*3+1).toString().padStart(2,'0')}-01`
    endDate = `${now.getFullYear()}-${(quarter*3+3).toString().padStart(2,'0')}-31`
  } else if (selectedRange.value === 'year') {
    startDate = `${now.getFullYear()}-01-01`
    endDate = `${now.getFullYear()}-12-31`
  } else if (selectedRange.value === 'custom') {
    startDate = customStartDate.value
    endDate = customEndDate.value
  }
  return { startDate, endDate }
}

const loadReportData = async () => {
  loadingData.value = true
  try {
    const { startDate, endDate } = getDateRange()
    const familyId = userStore.user?.familyId
    // 1. 获取统计数据
    const statsRes = await request.get('/api/report/statistics', {
      familyId, startDate, endDate
    })
    if (statsRes.data && statsRes.data.data) {
      metrics.value = {
        totalExpense: statsRes.data.data.totalExpense || 0,
        totalIncome: statsRes.data.data.totalIncome || 0,
        balance: (statsRes.data.data.totalIncome || 0) - (statsRes.data.data.totalExpense || 0),
        expenseChange: statsRes.data.data.expenseChange || 0,
        incomeChange: statsRes.data.data.incomeChange || 0,
        balanceChange: statsRes.data.data.balanceChange || 0
      }
    }
    // 2. 获取分类统计
    const catRes = await request.get('/api/report/categories', {
      familyId, type: 'expense', period: selectedRange.value, startDate, endDate
    })
    if (catRes.data && catRes.data.data) {
      categoryAnalysis.value = catRes.data.data
    }
    // 3. 获取趋势数据
    const trendRes = await request.get('/api/report/trends', {
      familyId, period: selectedRange.value, days: 30
    })
    if (trendRes.data && trendRes.data.data) {
      trendInsights.value = trendRes.data.data
    }
    // 4. 获取成员分析（如有接口）
    // TODO: 如果 cloud 没有成员分析接口，可补充实现
  } catch (error) {
    console.error('加载报表数据失败:', error)
  } finally {
    loadingData.value = false
  }
}

const loadTrendData = () => {
  // 模拟加载趋势数据
  console.log('Loading trend data for type:', trendType.value)
}

const exportReport = async () => {
  Taro.navigateTo({
    url: '/pages/export/index'
  })
}

// 饼图 option
const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { top: '5%', left: 'center' },
  series: [
    {
      name: '分类占比',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: categoryAnalysis.value.map(cat => ({
        value: cat.amount,
        name: cat.name,
        itemStyle: { color: cat.color }
      }))
    }
  ]
}))

// 趋势图 option
const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: trendInsights.value.dates || [] },
  yAxis: { type: 'value' },
  series: [
    {
      data: trendInsights.value.values || [],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }
  ]
}))

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
  background: var(--color-bg);
  padding-bottom: 120rpx;

  // 统计区骨架屏
  .metrics-skeleton {
    display: flex;
    background: #f2f3f5;
    border-radius: 24rpx;
    margin-bottom: 32rpx;
    padding: 32rpx 24rpx;
    .metrics-item-skeleton {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      .metrics-label-skeleton {
        width: 60rpx;
        height: 20rpx;
        background: #e0e0e0;
        border-radius: 8rpx;
        margin-bottom: 12rpx;
      }
      .metrics-value-skeleton {
        width: 80rpx;
        height: 28rpx;
        background: #e0e0e0;
        border-radius: 12rpx;
      }
    }
  }

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
        color: var(--color-text-secondary);
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
      background: var(--color-card);
      border-radius: 16rpx;
      box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
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
