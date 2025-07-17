<template>
  <view class="record-page">
    <!-- 连接状态指示器 -->
    <view v-if="!isConnected" class="connection-status" aria-live="polite">
      <text class="status-text">⚠️ 实时同步已断开</text>
    </view>

    <!-- 顶部统计卡片骨架屏 -->
    <view v-if="loadingData" class="stats-card-skeleton" aria-busy="true" aria-label="数据加载中"></view>
    <!-- 顶部统计卡片 -->
    <view v-else class="stats-card" aria-label="本月统计">
      <view class="stats-item">
        <text class="stats-label">{{ $t('index.expense') }}</text>
        <text class="stats-value expense">{{ formatAmount(monthExpense) }}</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-label">{{ $t('index.income') }}</text>
        <text class="stats-value income">{{ formatAmount(monthIncome) }}</text>
      </view>
    </view>

    <!-- 快速记账区域 -->
    <view class="quick-record" aria-label="快速记账">
      <view class="record-type-tabs" role="tablist">
        <view
          class="type-tab"
          :class="{ active: recordForm.type === 'expense' }"
          @tap="switchType('expense')"
          role="tab"
          :aria-selected="recordForm.type === 'expense'"
          aria-label="支出"
        >
          {{ $t('index.expense') }}
        </view>
        <view
          class="type-tab"
          :class="{ active: recordForm.type === 'income' }"
          @tap="switchType('income')"
          role="tab"
          :aria-selected="recordForm.type === 'income'"
          aria-label="收入"
        >
          {{ $t('index.income') }}
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
          aria-label="金额输入"
        />
      </view>

      <!-- 分类选择 -->
      <view class="category-section">
        <view class="section-title">选择分类</view>
        <scroll-view class="category-list" scroll-x aria-label="分类列表">
          <view
            v-for="category in currentCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: recordForm.categoryId === category.id }"
            @tap="selectCategory(category)"
            role="button"
            :aria-pressed="recordForm.categoryId === category.id"
            :aria-label="category.name"
          >
            <view class="category-icon" :style="{ backgroundColor: category.color }">
              {{ category.icon }}
            </view>
            <text class="category-name">{{ category.name }}</text>
          </view>
          <view class="category-item add-category" @tap="goToAddCategory" role="button" aria-label="添加分类">
            <view class="category-icon">
              <text class="add-icon">+</text>
            </view>
            <text class="category-name">{{ $t('index.add') }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 备注输入 -->
      <view class="remark-section">
        <input
          class="remark-input"
          :value="recordForm.description"
          @input="onRemarkInput"
          placeholder="{{ $t('index.remark') }}"
          aria-label="备注"
        />
      </view>

      <!-- 日期选择 -->
      <picker
        mode="date"
        :value="recordForm.date"
        :start="'2000-01-01'"
        :end="maxDate"
        @change="onDateChange"
        aria-label="记账日期选择"
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
          @tap="debouncedSaveRecord"
          :loading="saving"
          :disabled="!canSave || saving"
          aria-label="保存"
          :aria-disabled="!canSave || saving"
        >
          {{ saving ? $t('index.saving') : $t('index.save') }}
        </button>
      </view>
    </view>

    <!-- 最近记录骨架屏 -->
    <view v-if="loadingData" class="recent-records-skeleton">
      <view class="record-item-skeleton" v-for="i in 3" :key="i">
        <view class="record-icon-skeleton"></view>
        <view class="record-info-skeleton">
          <view class="record-category-skeleton"></view>
          <view class="record-desc-skeleton"></view>
        </view>
        <view class="record-amount-skeleton"></view>
      </view>
    </view>
    <!-- 最近记录 -->
    <view v-else class="recent-records">
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

import { useRecordForm } from '../../hooks/useRecordForm'
import { useUserStore, useFamilyStore } from '../../stores'
import Taro from '@tarojs/taro'
import { onMounted } from 'vue'

const userStore = useUserStore()
const familyStore = useFamilyStore()
const {
  recordForm,
  amountFocused,
  saving,
  monthExpense,
  monthIncome,
  recentRecords,
  loadingData,
  maxDate,
  currentCategories,
  canSave,
  switchType,
  onAmountInput,
  onRemarkInput,
  selectCategory,
  onDateChange,
  resetForm,
  saveRecord,
  debouncedSaveRecord,
  loadData
} = useRecordForm()

const goToAddCategory = () => {
  Taro.navigateTo({
    url: `/pages/category/add/index?type=${recordForm.value.type}`
  })
}
const goToLedger = () => {
  Taro.switchTab({ url: '/pages/ledger/index' })
}
const goToRecordDetail = (recordId) => {
  Taro.navigateTo({ url: `/pages/record/detail/index?id=${recordId}` })
}
const goToImport = () => {
  Taro.navigateTo({ url: '/pages/import/index' })
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({ url: '/pages/login/index' })
    return
  }
  familyStore.initFamilyState()
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
.stats-card-skeleton {
  display: flex;
  background: #f2f3f5;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
  padding: 32rpx 24rpx;
  .stats-item-skeleton {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    .stats-label-skeleton {
      width: 60rpx;
      height: 20rpx;
      background: #e0e0e0;
      border-radius: 8rpx;
      margin-bottom: 12rpx;
    }
    .stats-value-skeleton {
      width: 80rpx;
      height: 28rpx;
      background: #e0e0e0;
      border-radius: 12rpx;
    }
  }
}
.recent-records-skeleton {
  margin-top: 32rpx;
  .record-item-skeleton {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    .record-icon-skeleton {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background: #e0e0e0;
      margin-right: 20rpx;
    }
    .record-info-skeleton {
      flex: 1;
      .record-category-skeleton {
        width: 80rpx;
        height: 20rpx;
        background: #e0e0e0;
        border-radius: 8rpx;
        margin-bottom: 8rpx;
      }
      .record-desc-skeleton {
        width: 120rpx;
        height: 16rpx;
        background: #e0e0e0;
        border-radius: 8rpx;
      }
    }
    .record-amount-skeleton {
      width: 60rpx;
      height: 20rpx;
      background: #e0e0e0;
      border-radius: 8rpx;
    }
  }
}
</style>
