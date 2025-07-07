<template>
  <view class="ledger-page">
    <!-- 顶部统计 -->
    <view class="stats-header">
      <view class="stats-item">
        <text class="stats-label">本月支出</text>
        <text class="stats-value expense">¥{{ formatAmount(monthExpense) }}</text>
      </view>
      <view class="stats-item">
        <text class="stats-label">本月收入</text>
        <text class="stats-value income">¥{{ formatAmount(monthIncome) }}</text>
      </view>
      <view class="stats-item">
        <text class="stats-label">结余</text>
        <text class="stats-value" :class="balance >= 0 ? 'income' : 'expense'">
          ¥{{ formatAmount(Math.abs(balance)) }}
        </text>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" @tap="showDatePicker">
        <text class="filter-text">{{ currentMonth }}</text>
        <text class="filter-arrow">▼</text>
      </view>

      <view class="filter-item" @tap="showTypeFilter">
        <text class="filter-text">{{ typeFilterText }}</text>
        <text class="filter-arrow">▼</text>
      </view>

      <view class="filter-item" @tap="showCategoryFilter">
        <text class="filter-text">{{ categoryFilterText }}</text>
        <text class="filter-arrow">▼</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="records-section">
      <view v-if="groupedRecords.length === 0" class="empty-state">
        <view class="empty-icon">📝</view>
        <text class="empty-text">暂无记录</text>
        <text class="empty-desc">点击下方"+"按钮开始记账</text>
      </view>

      <view v-else class="records-list">
        <view
          v-for="group in groupedRecords"
          :key="group.date"
          class="record-group"
        >
          <view class="group-header">
            <text class="group-date">{{ group.date }}</text>
            <view class="group-stats">
              <text class="group-expense">支出 ¥{{ formatAmount(group.totalExpense) }}</text>
              <text class="group-income">收入 ¥{{ formatAmount(group.totalIncome) }}</text>
            </view>
          </view>

          <view class="group-records">
            <view
              v-for="record in group.records"
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
                  {{ record.type === 'expense' ? '-' : '+' }}¥{{ formatAmount(record.amount) }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加按钮 -->
    <view class="add-btn" @tap="goToAddRecord">
      <text class="add-icon">+</text>
    </view>

    <!-- 日期选择器 -->
    <picker
      v-if="showDatePickerModal"
      mode="date"
      fields="month"
      :value="selectedDate"
      @change="onDateChange"
      @cancel="showDatePickerModal = false"
    >
      <view></view>
    </picker>

    <!-- 类型筛选弹窗 -->
    <view v-if="showTypeModal" class="modal-overlay" @tap="closeTypeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择类型</text>
        </view>
        <view class="modal-body">
          <view
            v-for="option in typeOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: typeFilter === option.value }"
            @tap="selectTypeFilter(option.value)"
          >
            <text class="option-text">{{ option.label }}</text>
            <text v-if="typeFilter === option.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分类筛选弹窗 -->
    <view v-if="showCategoryModal" class="modal-overlay" @tap="closeCategoryModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择分类</text>
        </view>
        <view class="modal-body">
          <view
            class="option-item"
            :class="{ active: categoryFilter === '' }"
            @tap="selectCategoryFilter('')"
          >
            <text class="option-text">全部分类</text>
            <text v-if="categoryFilter === ''" class="check-icon">✓</text>
          </view>
          <view
            v-for="category in currentCategories"
            :key="category.id"
            class="option-item"
            :class="{ active: categoryFilter === category.id }"
            @tap="selectCategoryFilter(category.id)"
          >
            <view class="option-icon" :style="{ backgroundColor: category.color }">
              {{ category.icon }}
            </view>
            <text class="option-text">{{ category.name }}</text>
            <text v-if="categoryFilter === category.id" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useCategoryStore, useAppStore } from '../../stores'
import { RecordType } from '../../types/business'
import { formatAmount, formatDate } from '../../utils/format'

// Store
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const appStore = useAppStore()

// 响应式数据
const monthExpense = ref(1250.80)
const monthIncome = ref(5000.00)
const selectedDate = ref(new Date().toISOString().split('T')[0].substring(0, 7))
const typeFilter = ref('')
const categoryFilter = ref('')
const showDatePickerModal = ref(false)
const showTypeModal = ref(false)
const showCategoryModal = ref(false)

// 模拟记录数据
const mockRecords = ref([
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
  },
  {
    id: '3',
    type: 'income',
    amount: 5000.00,
    categoryId: 'income_0',
    categoryName: '工资',
    categoryIcon: '💼',
    categoryColor: '#00d2d3',
    description: '月薪',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createTime: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
])

// 类型选项
const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' }
]

// 计算属性
const balance = computed(() => monthIncome.value - monthExpense.value)

const currentMonth = computed(() => {
  const date = new Date(selectedDate.value + '-01')
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

const typeFilterText = computed(() => {
  const option = typeOptions.find(opt => opt.value === typeFilter.value)
  return option?.label || '全部类型'
})

const categoryFilterText = computed(() => {
  if (!categoryFilter.value) return '全部分类'
  const category = categoryStore.getCategoryById(categoryFilter.value)
  return category?.name || '全部分类'
})

const currentCategories = computed(() => {
  if (!typeFilter.value) return categoryStore.categories
  return categoryStore.categories.filter(cat => cat.type === typeFilter.value)
})

const filteredRecords = computed(() => {
  let records = mockRecords.value

  // 按类型筛选
  if (typeFilter.value) {
    records = records.filter(record => record.type === typeFilter.value)
  }

  // 按分类筛选
  if (categoryFilter.value) {
    records = records.filter(record => record.categoryId === categoryFilter.value)
  }

  return records
})

const groupedRecords = computed(() => {
  const groups: { [key: string]: any } = {}

  filteredRecords.value.forEach(record => {
    const dateKey = formatDate(record.date, 'MM-DD')

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        records: [],
        totalExpense: 0,
        totalIncome: 0
      }
    }

    groups[dateKey].records.push(record)

    if (record.type === 'expense') {
      groups[dateKey].totalExpense += record.amount
    } else {
      groups[dateKey].totalIncome += record.amount
    }
  })

  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})

// 方法
const showDatePicker = () => {
  showDatePickerModal.value = true
}

const onDateChange = (e: any) => {
  selectedDate.value = e.detail.value
  showDatePickerModal.value = false
  // 重新加载数据
  loadData()
}

const showTypeFilter = () => {
  showTypeModal.value = true
}

const closeTypeModal = () => {
  showTypeModal.value = false
}

const selectTypeFilter = (value: string) => {
  typeFilter.value = value
  categoryFilter.value = '' // 重置分类筛选
  closeTypeModal()
}

const showCategoryFilter = () => {
  showCategoryModal.value = true
}

const closeCategoryModal = () => {
  showCategoryModal.value = false
}

const selectCategoryFilter = (value: string) => {
  categoryFilter.value = value
  closeCategoryModal()
}

const goToRecordDetail = (recordId: string) => {
  Taro.navigateTo({
    url: `/pages/record/detail/index?id=${recordId}`
  })
}

const goToAddRecord = () => {
  Taro.switchTab({
    url: '/pages/index/index'
  })
}

const loadData = () => {
  // 初始化默认分类
  if (categoryStore.categories.length === 0) {
    categoryStore.initDefaultCategories()
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
  loadData()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '账本'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 查看我的账本',
    path: '/pages/ledger/index'
  })
})
</script>

<style lang="scss" scoped>
.ledger-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 顶部统计
  .stats-header {
    background: white;
    display: flex;
    padding: 30rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

    .stats-item {
      flex: 1;
      text-align: center;

      .stats-label {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 8rpx;
      }

      .stats-value {
        display: block;
        font-size: 28rpx;
        font-weight: bold;

        &.expense {
          color: #ff4757;
        }

        &.income {
          color: #2ed573;
        }
      }
    }
  }

  // 筛选栏
  .filter-bar {
    background: white;
    display: flex;
    padding: 20rpx 30rpx;
    border-top: 2rpx solid #f0f0f0;

    .filter-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16rpx 20rpx;
      background: #f8f9fa;
      border-radius: 20rpx;
      margin: 0 10rpx;

      .filter-text {
        font-size: 26rpx;
        color: #333;
        margin-right: 8rpx;
      }

      .filter-arrow {
        font-size: 20rpx;
        color: #999;
      }
    }
  }

  // 记录列表
  .records-section {
    padding: 20rpx 30rpx;

    .empty-state {
      text-align: center;
      padding: 120rpx 0;

      .empty-icon {
        font-size: 120rpx;
        margin-bottom: 30rpx;
      }

      .empty-text {
        display: block;
        font-size: 32rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .empty-desc {
        display: block;
        font-size: 26rpx;
        color: #999;
      }
    }

    .records-list {
      .record-group {
        margin-bottom: 30rpx;

        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20rpx;

          .group-date {
            font-size: 28rpx;
            color: #333;
            font-weight: 500;
          }

          .group-stats {
            display: flex;
            gap: 20rpx;

            .group-expense {
              font-size: 24rpx;
              color: #ff4757;
            }

            .group-income {
              font-size: 24rpx;
              color: #2ed573;
            }
          }
        }

        .group-records {
          background: white;
          border-radius: 16rpx;
          overflow: hidden;

          .record-item {
            display: flex;
            align-items: center;
            padding: 30rpx;
            border-bottom: 2rpx solid #f0f0f0;

            &:last-child {
              border-bottom: none;
            }

            .record-icon {
              width: 80rpx;
              height: 80rpx;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32rpx;
              margin-right: 20rpx;
            }

            .record-info {
              flex: 1;

              .record-category {
                display: block;
                font-size: 30rpx;
                color: #333;
                margin-bottom: 6rpx;
              }

              .record-desc {
                display: block;
                font-size: 24rpx;
                color: #999;
              }
            }

            .record-amount {
              .amount-text {
                font-size: 30rpx;
                font-weight: bold;

                &.expense {
                  color: #ff4757;
                }

                &.income {
                  color: #2ed573;
                }
              }
            }
          }
        }
      }
    }
  }

  // 添加按钮
  .add-btn {
    position: fixed;
    bottom: 120rpx;
    right: 30rpx;
    width: 100rpx;
    height: 100rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.4);
    z-index: 100;

    .add-icon {
      font-size: 48rpx;
      color: white;
      font-weight: bold;
    }
  }

  // 弹窗样式
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    z-index: 1000;

    .modal-content {
      background: white;
      border-radius: 20rpx 20rpx 0 0;
      width: 100%;
      max-height: 60vh;

      .modal-header {
        padding: 40rpx;
        text-align: center;
        border-bottom: 2rpx solid #f0f0f0;

        .modal-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
      }

      .modal-body {
        max-height: 400rpx;
        overflow-y: auto;

        .option-item {
          display: flex;
          align-items: center;
          padding: 30rpx 40rpx;
          border-bottom: 2rpx solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          &.active {
            background: #f0f8ff;
          }

          .option-icon {
            width: 60rpx;
            height: 60rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24rpx;
            margin-right: 20rpx;
          }

          .option-text {
            flex: 1;
            font-size: 30rpx;
            color: #333;
          }

          .check-icon {
            font-size: 32rpx;
            color: #1296db;
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
