<template>
  <view class="record-page">
    <!-- 连接状态指示器 -->
    <view v-if="!isConnected" class="connection-status">
      <text class="status-text">⚠️ 实时同步已断开</text>
    </view>

    <!-- 顶部统计卡片 -->
    <view class="stats-card">
      <view class="stats-item">
        <text class="stats-label">本月支出</text>
        <text class="stats-value expense">{{ formatAmount(monthExpense) }}</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-label">本月收入</text>
        <text class="stats-value income">{{ formatAmount(monthIncome) }}</text>
      </view>
    </view>

    <!-- 快速记账区域 -->
    <view class="quick-record">
      <view class="record-type-tabs">
        <view
          class="type-tab"
          :class="{ active: recordForm.type === 'expense' }"
          @tap="switchType('expense')"
        >
          支出
        </view>
        <view
          class="type-tab"
          :class="{ active: recordForm.type === 'income' }"
          @tap="switchType('income')"
        >
          收入
        </view>
      </view>

      <!-- 金额输入 -->
      <view class="amount-input">
        <text class="currency-symbol">¥</text>
        <input
          class="amount-value"
          type="digit"
          :value="recordForm.amount"
          @input="onAmountInput"
          placeholder="0.00"
          :focus="amountFocused"
        />
      </view>

      <!-- 分类选择 -->
      <view class="category-section">
        <view class="section-title">选择分类</view>
        <scroll-view class="category-list" scroll-x>
          <view
            v-for="category in currentCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: recordForm.categoryId === category.id }"
            @tap="selectCategory(category)"
          >
            <view class="category-icon" :style="{ backgroundColor: category.color }">
              {{ category.icon }}
            </view>
            <text class="category-name">{{ category.name }}</text>
          </view>
          <view class="category-item add-category" @tap="goToAddCategory">
            <view class="category-icon">
              <text class="add-icon">+</text>
            </view>
            <text class="category-name">添加</text>
          </view>
        </scroll-view>
      </view>

      <!-- 备注输入 -->
      <view class="remark-section">
        <input
          class="remark-input"
          :value="recordForm.description"
          @input="onRemarkInput"
          placeholder="添加备注..."
        />
      </view>

      <!-- 日期选择 -->
      <picker
        mode="date"
        :value="recordForm.date"
        :start="'2000-01-01'"
        :end="maxDate"
        @change="onDateChange"
      >
        <view class="date-section">
          <text class="date-label">记账日期</text>
          <text class="date-value">{{ formatDate(recordForm.date) }}</text>
          <text class="arrow">></text>
          <text style="font-size: 20rpx; color: #999; margin-left: 10rpx;">点击选择</text>
        </view>
      </picker>

      <!-- 保存按钮 -->
      <view class="save-section">
        <button
          class="save-btn"
          :class="{ disabled: !canSave }"
          @tap="saveRecord"
          :loading="saving"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="recent-records">
      <view class="section-header">
        <text class="section-title">最近记录</text>
        <text class="more-link" @tap="goToLedger">查看更多</text>
      </view>

      <view v-if="recentRecords.length === 0" class="empty-state">
        <text class="empty-text">暂无记录</text>
      </view>

      <view v-else class="record-list">
        <view
          v-for="record in recentRecords"
          :key="record.id"
          class="record-item"
          @tap="goToRecordDetail(record.id)"
        >
          <view class="record-icon" :style="{ backgroundColor: record.categoryColor }">
            {{ record.categoryIcon }}
          </view>
          <view class="record-info">
            <text class="record-category">{{ record.categoryName }}</text>
            <text class="record-desc">{{ record.description || '无备注' }}</text>
          </view>
          <view class="record-amount">
            <text
              class="amount-text"
              :class="record.type"
            >
              {{ record.type === 'expense' ? '-' : '+' }}{{ formatAmount(record.amount, { showSymbol: false }) }}
            </text>
            <text class="record-time">{{ formatRelativeTime(record.date) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 智能导入按钮 -->
    <view class="smart-import-btn" @tap="goToImport">
      <view class="import-icon">📷</view>
      <text class="import-text">智能导入</text>
    </view>


  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useCategoryStore, useRecordStore, useFamilyStore } from '../../stores'
import { useRealTimeSync } from '../../hooks/useRealTimeSync'
import { formatAmount, formatDate, formatRelativeTime } from '../../utils/format'
import './index.scss'
import request from '../../utils/request'

// Store
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const recordStore = useRecordStore()
const familyStore = useFamilyStore()

// 实时同步
const { isConnected, syncRecordChange } = useRealTimeSync()

// 响应式数据
const recordForm = ref({
  type: 'expense',
  amount: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().split('T')[0]
})

const amountFocused = ref(false)
const saving = ref(false)
const monthExpense = ref(0)
const monthIncome = ref(0)
const recentRecords = ref([])

// 日期选择器范围
const maxDate = new Date().toISOString().split('T')[0]

// 计算属性
const currentCategories = computed(() => {
  return categoryStore.categories.filter(cat => cat.type === recordForm.value.type)
})

const canSave = computed(() => {
  return recordForm.value.amount &&
         parseFloat(recordForm.value.amount) > 0 &&
         recordForm.value.categoryId
})

// 方法
const switchType = (type) => {
  recordForm.value.type = type
  recordForm.value.categoryId = '' // 清空分类选择
  // 重新加载分类
  loadCategories()
}

const onAmountInput = (e) => {
  let value = e.detail.value
  // 限制小数点后两位
  if (value.includes('.')) {
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2)
    }
  }
  recordForm.value.amount = value
}

const onRemarkInput = (e) => {
  recordForm.value.description = e.detail.value
}

const selectCategory = (category) => {
  recordForm.value.categoryId = Number(category.id)
}

const onDateChange = (e) => {
  console.log('日期选择变化:', e.detail.value)
  recordForm.value.date = e.detail.value
  console.log('更新后的日期:', recordForm.value.date)
}

const saveRecord = async () => {
  if (!canSave.value || saving.value) return

  // 检查家庭ID
  if (!familyStore.familyId) {
    Taro.showToast({
      title: '请先加入或创建家庭',
      icon: 'none'
    })
    return
  }

  try {
    saving.value = true

    // 创建记录数据
    const recordData = {
      familyId: familyStore.familyId,
      type: recordForm.value.type,
      amount: parseFloat(recordForm.value.amount),
      categoryId: Number(recordForm.value.categoryId),
      description: recordForm.value.description,
      date: recordForm.value.date
    }
    
    // 调试：打印发送的数据
    console.log('发送记账数据:', {
      familyId: familyStore.familyId,
      familyStore: familyStore,
      recordData: recordData
    })

    // 调用后端 API 保存记录
    const success = await recordStore.createRecord(recordData)

    if (success) {
      // 同步到其他设备
      syncRecordChange('create', recordData)

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 重置表单
      resetForm()

      // 刷新数据
      loadData()
    } else {
      throw new Error('保存失败')
    }
  } catch (error) {
    console.error('保存记录错误:', error)
    Taro.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  recordForm.value = {
    type: 'expense',
    amount: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  }
}

const goToAddCategory = () => {
  Taro.navigateTo({
    url: `/pages/category/add/index?type=${recordForm.value.type}`
  })
}

const goToLedger = () => {
  Taro.switchTab({
    url: '/pages/ledger/index'
  })
}

const goToRecordDetail = (recordId) => {
  Taro.navigateTo({
    url: `/pages/record/detail/index?id=${recordId}`
  })
}

const goToImport = () => {
  Taro.navigateTo({
    url: '/pages/import/index'
  })
}

// 加载分类
const loadCategories = async () => {
  try {
    await categoryStore.loadCategories(familyStore.familyId)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载最近记录
const loadRecentRecords = async () => {
  try {
    console.log('开始加载最近记录...')
    const res = await recordStore.getRecentRecords(10)
    console.log('loadRecentRecords result:', res)
    recentRecords.value = res || []
    console.log('recentRecords.value:', recentRecords.value)
  } catch (error) {
    console.error('加载最近记录失败:', error)
  }
}

// 加载月统计
const loadMonthStats = async () => {
  try {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-01`
    const endDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-31`
    const res = await request.get('/api/report/statistics', {
      familyId: familyStore.familyId,
      startDate,
      endDate
    })
    if (res.data) {
      monthExpense.value = res.data.totalExpense || 0
      monthIncome.value = res.data.totalIncome || 0
    }
  } catch (error) {
    console.error('加载月统计失败:', error)
  }
}

const loadData = async () => {
  await loadCategories()
  await loadRecentRecords()
  await loadMonthStats()
}

// 生命周期
onMounted(async () => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
    return
  }
  
  // 初始化家庭状态
  familyStore.initFamilyState()
  
  // 如果没有家庭信息，尝试获取
  if (!familyStore.hasFamily) {
    await familyStore.getFamilyInfo()
  }
  
  loadData()
})

Taro.useDidShow(() => {
  if (userStore.isLoggedIn) {
    loadData()
  }
})
</script>

<style lang="scss">
.index-page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  padding: 32rpx 24rpx 80rpx 24rpx;
  box-sizing: border-box;
}

.index-header {
  margin-bottom: 40rpx;
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.index-section {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.04);
  margin-bottom: 32rpx;
  padding: 32rpx 24rpx;
}

.index-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 16rpx;
}

.index-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.index-list-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 28rpx;
  color: #444;
}

.index-list-item:last-child {
  border-bottom: none;
}
</style>
