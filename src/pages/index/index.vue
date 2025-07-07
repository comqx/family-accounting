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
      <view class="date-section" @tap="showDatePicker">
        <text class="date-label">记账日期</text>
        <text class="date-value">{{ formatDate(recordForm.date) }}</text>
        <text class="arrow">></text>
      </view>

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

    <!-- 日期选择器 -->
    <picker
      v-if="showDatePickerModal"
      mode="date"
      :value="recordForm.date"
      @change="onDateChange"
      @cancel="showDatePickerModal = false"
    >
      <view></view>
    </picker>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useCategoryStore, useRecordStore } from '../../stores'
import { useRealTimeSync } from '../../hooks/useRealTimeSync'
import { RecordType, Category, AccountRecord } from '../../types/business'
import { formatAmount, formatDate, formatRelativeTime } from '../../utils/format'
import './index.scss'

// Store
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const recordStore = useRecordStore()

// 实时同步
const { isConnected, syncRecordChange } = useRealTimeSync()

// 响应式数据
const recordForm = ref({
  type: 'expense' as RecordType,
  amount: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().split('T')[0]
})

const amountFocused = ref(false)
const saving = ref(false)
const showDatePickerModal = ref(false)
const monthExpense = ref(0)
const monthIncome = ref(0)
const recentRecords = ref<any[]>([])

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
const switchType = (type: RecordType) => {
  recordForm.value.type = type
  recordForm.value.categoryId = '' // 清空分类选择
}

const onAmountInput = (e: any) => {
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

const onRemarkInput = (e: any) => {
  recordForm.value.description = e.detail.value
}

const selectCategory = (category: Category) => {
  recordForm.value.categoryId = category.id
}

const showDatePicker = () => {
  showDatePickerModal.value = true
}

const onDateChange = (e: any) => {
  recordForm.value.date = e.detail.value
  showDatePickerModal.value = false
}

const saveRecord = async () => {
  if (!canSave.value || saving.value) return

  try {
    saving.value = true

    // 创建记录数据
    const recordData = {
      id: Date.now().toString(),
      type: recordForm.value.type,
      amount: parseFloat(recordForm.value.amount),
      categoryId: recordForm.value.categoryId,
      description: recordForm.value.description,
      date: new Date(recordForm.value.date),
      createTime: new Date(),
      updateTime: new Date()
    }

    // 模拟保存记录
    await new Promise(resolve => setTimeout(resolve, 1000))

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
  } catch (error: any) {
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

const goToRecordDetail = (recordId: string) => {
  Taro.navigateTo({
    url: `/pages/record/detail/index?id=${recordId}`
  })
}

const goToImport = () => {
  Taro.navigateTo({
    url: '/pages/import/index'
  })
}

const loadData = async () => {
  try {
    // 初始化默认分类（如果没有分类数据）
    if (categoryStore.categories.length === 0) {
      categoryStore.initDefaultCategories()
    }

    // 加载最近记录
    await loadRecentRecords()

    // 加载月度统计
    await loadMonthStats()
  } catch (error) {
    console.error('Load data error:', error)
  }
}

const loadRecentRecords = async () => {
  try {
    // 模拟一些最近记录数据
    recentRecords.value = [
      {
        id: '1',
        type: 'expense',
        amount: 25.50,
        categoryId: 'expense_0',
        categoryName: '餐饮',
        categoryIcon: '🍽️',
        categoryColor: '#ff6b6b',
        description: '午餐',
        date: new Date(),
        createTime: new Date()
      },
      {
        id: '2',
        type: 'expense',
        amount: 12.00,
        categoryId: 'expense_1',
        categoryName: '交通',
        categoryIcon: '🚗',
        categoryColor: '#4ecdc4',
        description: '地铁',
        date: new Date(),
        createTime: new Date()
      }
    ]
  } catch (error) {
    console.error('Load recent records error:', error)
  }
}

const loadMonthStats = async () => {
  try {
    // 模拟月度统计数据
    monthExpense.value = 1250.80
    monthIncome.value = 5000.00
  } catch (error) {
    console.error('Load month stats error:', error)
  }
}

// 生命周期
onMounted(() => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
    return
  }

  // 加载数据
  loadData()
})

// 页面显示时刷新数据
Taro.useDidShow(() => {
  if (userStore.isLoggedIn) {
    loadData()
  }
})
</script>
