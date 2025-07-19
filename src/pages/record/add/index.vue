<template>
  <view class="record-add-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ $t('record.addRecord') }}</text>
    </view>

    <!-- 记录类型选择 -->
    <view class="type-selector">
      <view 
        class="type-tab" 
        :class="{ active: recordForm.type === 'expense' }"
        @tap="switchType('expense')"
      >
        <text class="type-text">{{ $t('index.expense') }}</text>
      </view>
      <view 
        class="type-tab" 
        :class="{ active: recordForm.type === 'income' }"
        @tap="switchType('income')"
      >
        <text class="type-text">{{ $t('index.income') }}</text>
      </view>
    </view>

    <!-- 金额输入 -->
    <view class="amount-section">
      <text class="section-label">{{ $t('record.amount') }}</text>
      <view class="amount-input">
        <text class="currency-symbol">¥</text>
        <input
          class="amount-field"
          type="digit"
          :value="recordForm.amount"
          @input="onAmountInput"
          placeholder="0.00"
          :focus="amountFocused"
        />
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="category-section">
      <text class="section-label">{{ $t('record.category') }}</text>
      <view class="category-grid">
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
      </view>
    </view>

    <!-- 日期选择 -->
    <view class="date-section">
      <text class="section-label">{{ $t('record.date') }}</text>
      <picker
        mode="date"
        :value="recordForm.date"
        :start="'2000-01-01'"
        :end="maxDate"
        @change="onDateChange"
      >
        <view class="date-picker">
          <text class="date-text">{{ formatDate(recordForm.date) }}</text>
          <text class="date-arrow">></text>
        </view>
      </picker>
    </view>

    <!-- 备注输入 -->
    <view class="remark-section">
      <text class="section-label">{{ $t('record.description') }}</text>
      <textarea
        class="remark-input"
        :value="recordForm.description"
        @input="onRemarkInput"
        placeholder="添加备注..."
        maxlength="200"
      />
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button
        class="save-btn"
        :class="{ disabled: !canSave }"
        @tap="saveRecord"
        :loading="saving"
        :disabled="!canSave || saving"
      >
        {{ saving ? $t('index.saving') : $t('index.save') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useCategoryStore, useFamilyStore } from '../../stores'
import { formatAmount, formatDate } from '../../utils/format'
import request from '../../utils/request'

// Store
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const familyStore = useFamilyStore()

// 响应式数据
const recordForm = ref({
  type: 'expense',
  amount: '',
  categoryId: null,
  date: new Date().toISOString().split('T')[0],
  description: ''
})

const amountFocused = ref(false)
const saving = ref(false)

// 日期选择器范围
const maxDate = new Date().toISOString().split('T')[0]

// 计算属性
const currentCategories = computed(() => {
  return categoryStore.categories.filter(cat => cat.type === recordForm.value.type)
})

const canSave = computed(() => {
  return recordForm.value.amount && 
         recordForm.value.categoryId && 
         parseFloat(recordForm.value.amount) > 0
})

// 方法
const switchType = (type) => {
  recordForm.value.type = type
  recordForm.value.categoryId = null // 重置分类选择
}

const onAmountInput = (e) => {
  recordForm.value.amount = e.detail.value
}

const selectCategory = (category) => {
  recordForm.value.categoryId = category.id
}

const onDateChange = (e) => {
  recordForm.value.date = e.detail.value
}

const onRemarkInput = (e) => {
  recordForm.value.description = e.detail.value
}

const saveRecord = async () => {
  if (!canSave.value || saving.value) return

  try {
    saving.value = true

    if (!familyStore.hasFamily) {
      await familyStore.getFamilyInfo()
    }

    const familyId = familyStore.familyId
    if (!familyId) {
      Taro.showToast({
        title: '请先加入家庭',
        icon: 'none'
      })
      return
    }

    const recordData = {
      familyId,
      type: recordForm.value.type,
      amount: parseFloat(recordForm.value.amount),
      categoryId: recordForm.value.categoryId,
      date: recordForm.value.date,
      description: recordForm.value.description
    }

    const response = await request.post('/api/record/create', recordData)
    
    if (response.success) {
      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 重置表单
      recordForm.value = {
        type: 'expense',
        amount: '',
        categoryId: null,
        date: new Date().toISOString().split('T')[0],
        description: ''
      }
      
      // 返回上一页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } else {
      Taro.showToast({
        title: response.error || '保存失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('保存记录失败:', error)
    Taro.showToast({
      title: '保存失败，请重试',
      icon: 'none'
    })
  } finally {
    saving.value = false
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
onMounted(async () => {
  checkUserStatus()
  
  if (!familyStore.hasFamily) {
    await familyStore.getFamilyInfo()
  }
  
  const familyId = familyStore.familyId
  if (familyId) {
    await categoryStore.loadCategories(familyId)
  }
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '添加记录'
  })
})
</script>

<style lang="scss" scoped>
.record-add-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 32rpx 24rpx;

  .page-header {
    text-align: center;
    margin-bottom: 40rpx;

    .page-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .type-selector {
    display: flex;
    background: #fff;
    border-radius: 16rpx;
    padding: 8rpx;
    margin-bottom: 32rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .type-tab {
      flex: 1;
      text-align: center;
      padding: 20rpx;
      border-radius: 12rpx;
      transition: all 0.3s;

      &.active {
        background: #1296db;
        color: #fff;
      }

      .type-text {
        font-size: 28rpx;
        font-weight: 500;
      }
    }
  }

  .amount-section,
  .category-section,
  .date-section,
  .remark-section {
    background: #fff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .section-label {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 20rpx;
      font-weight: 500;
    }
  }

  .amount-input {
    display: flex;
    align-items: center;
    border-bottom: 2rpx solid #e0e0e0;
    padding-bottom: 16rpx;

    .currency-symbol {
      font-size: 32rpx;
      color: #333;
      margin-right: 16rpx;
      font-weight: bold;
    }

    .amount-field {
      flex: 1;
      font-size: 32rpx;
      color: #333;
      border: none;
      outline: none;
    }
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;

    .category-item {
      text-align: center;
      padding: 20rpx 10rpx;
      border-radius: 12rpx;
      transition: all 0.3s;

      &.active {
        background: #f0f8ff;
        border: 2rpx solid #1296db;
      }

      .category-icon {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12rpx;
        font-size: 24rpx;
        color: #fff;
      }

      .category-name {
        font-size: 24rpx;
        color: #666;
      }
    }
  }

  .date-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 2rpx solid #e0e0e0;

    .date-text {
      font-size: 28rpx;
      color: #333;
    }

    .date-arrow {
      font-size: 24rpx;
      color: #999;
    }
  }

  .remark-input {
    width: 100%;
    min-height: 120rpx;
    font-size: 28rpx;
    color: #333;
    border: none;
    outline: none;
    resize: none;
    line-height: 1.5;
  }

  .save-section {
    margin-top: 40rpx;

    .save-btn {
      width: 100%;
      height: 88rpx;
      background: #1296db;
      color: #fff;
      border: none;
      border-radius: 16rpx;
      font-size: 32rpx;
      font-weight: 500;
      transition: all 0.3s;

      &.disabled {
        background: #ccc;
        color: #999;
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }
}
</style>
