<template>
  <view class="record-page" role="main" aria-label="家账通首页">
    <!-- 连接状态指示器 -->
    <view v-if="!isConnected" class="connection-status" aria-live="polite" role="alert">
      <text class="status-text">⚠️ 实时同步已断开</text>
    </view>

    <!-- 顶部统计卡片骨架屏 -->
    <view v-if="loadingData" class="stats-card-skeleton" aria-busy="true" aria-label="数据加载中"></view>
    <!-- 顶部统计卡片 -->
    <view v-else class="stats-card" role="region" aria-label="本月统计">
      <view class="stats-item" role="group" aria-label="支出统计">
        <text class="stats-label">{{ $t('index.expense') }}</text>
        <text class="stats-value expense" aria-label="本月支出金额">{{ formatAmount(monthExpense) }}</text>
      </view>
      <view class="stats-divider" aria-hidden="true"></view>
      <view class="stats-item" role="group" aria-label="收入统计">
        <text class="stats-label">{{ $t('index.income') }}</text>
        <text class="stats-value income" aria-label="本月收入金额">{{ formatAmount(monthIncome) }}</text>
      </view>
    </view>

    <!-- 快速记账区域 -->
    <view class="quick-record" role="form" aria-label="快速记账">
      <view class="record-type-tabs" role="tablist" aria-label="记录类型选择">
        <view
          class="type-tab"
          :class="{ active: recordForm.type === 'expense' }"
          @tap="throttledSwitchType('expense')"
          role="tab"
          :aria-selected="recordForm.type === 'expense'"
          aria-label="支出"
          tabindex="0"
        >
          {{ $t('index.expense') }}
        </view>
        <view
          class="type-tab"
          :class="{ active: recordForm.type === 'income' }"
          @tap="throttledSwitchType('income')"
          role="tab"
          :aria-selected="recordForm.type === 'income'"
          aria-label="收入"
          tabindex="0"
        >
          {{ $t('index.income') }}
        </view>
      </view>

      <!-- 金额输入 -->
      <view class="amount-input" role="group" aria-label="金额输入">
        <text class="currency-symbol" aria-hidden="true">¥</text>
        <input
          class="amount-value"
          type="digit"
          :value="recordForm.amount"
          @input="onAmountInput"
          placeholder="0.00"
          :focus="amountFocused"
          aria-label="金额输入框"
          aria-describedby="amount-hint"
        />
        <text id="amount-hint" class="sr-only">请输入记账金额</text>
      </view>

      <!-- 分类选择 -->
      <view class="category-section" role="group" aria-label="分类选择">
        <text class="section-title">选择分类</text>
        <scroll-view class="category-list" scroll-x aria-label="分类列表" role="listbox">
          <view
            v-for="category in currentCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: recordForm.categoryId === category.id }"
            @tap="throttledSelectCategory(category)"
            role="option"
            :aria-selected="recordForm.categoryId === category.id"
            :aria-label="category.name"
            tabindex="0"
          >
            <view class="category-icon" :style="{ backgroundColor: category.color }" aria-hidden="true">
              {{ category.icon }}
            </view>
            <text class="category-name">{{ category.name }}</text>
          </view>
          <view class="category-item add-category" @tap="goToAddCategory" role="button" aria-label="添加分类" tabindex="0">
            <view class="category-icon" aria-hidden="true">
              <text class="add-icon">+</text>
            </view>
            <text class="category-name">{{ $t('index.add') }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 备注输入 -->
      <view class="remark-section" role="group" aria-label="备注输入">
        <input
          class="remark-input"
          :value="recordForm.description"
          @input="onRemarkInput"
          :placeholder="$t('index.remark')"
          aria-label="备注输入框"
        />
      </view>

      <!-- 日期选择 -->
      <picker
        mode="date"
        :value="recordForm.date"
        :start="'2000-01-01'"
        :end="maxDate"
        @change="throttledOnDateChange"
        aria-label="记账日期选择"
      >
        <view class="date-section" role="button" tabindex="0" aria-label="选择记账日期">
        <text class="date-label">记账日期</text>
        <text class="date-value">{{ formatDate(recordForm.date) }}</text>
          <text class="arrow" aria-hidden="true">></text>
          <text style="font-size: 20rpx; color: #999; margin-left: 10rpx;">点击选择</text>
      </view>
      </picker>

      <!-- 保存按钮 -->
      <view class="save-section" role="group" aria-label="保存操作">
        <button
          class="save-btn"
          :class="{ disabled: !canSave }"
          @tap="debouncedSaveRecord"
          :loading="saving"
          :disabled="!canSave || saving"
          aria-label="保存记录"
          :aria-disabled="!canSave || saving"
          :aria-describedby="!canSave ? 'save-hint' : undefined"
        >
          {{ saving ? $t('index.saving') : $t('index.save') }}
        </button>
        <text v-if="!canSave" id="save-hint" class="sr-only">请填写完整信息后才能保存</text>
      </view>
    </view>

    <!-- 最近记录骨架屏 -->
    <view v-if="loadingData" class="recent-records-skeleton" aria-busy="true" aria-label="最近记录加载中">
      <view class="record-item-skeleton" v-for="i in 3" :key="i" role="presentation">
        <view class="record-icon-skeleton"></view>
        <view class="record-info-skeleton">
          <view class="record-category-skeleton"></view>
          <view class="record-desc-skeleton"></view>
        </view>
        <view class="record-amount-skeleton"></view>
      </view>
    </view>
    <!-- 最近记录 -->
    <view v-else class="recent-records" role="region" aria-label="最近记录">
      <view class="section-header">
        <text class="section-title">{{ $t('index.recentRecords') }}</text>
        <text class="more-link" @tap="goToLedger" role="button" tabindex="0" aria-label="查看更多记录">{{ $t('index.moreRecords') }}</text>
      </view>

      <view v-if="recentRecords.length === 0" class="empty-state" role="status" aria-label="暂无记录">
        <text class="empty-text">{{ $t('common.noData') }}</text>
      </view>

      <view v-else class="record-list" role="list" aria-label="最近记录列表">
        <VirtualList
          v-if="recentRecords.length > 10"
          :height="400"
          :item-count="recentRecords.length"
          :item-size="120"
          :item-data="recentRecords"
          :render="renderRecordItem"
          :loading="loadingData"
          :has-more="false"
          @scroll-to-lower="loadMoreRecords"
        />
        <view
          v-else
          v-for="record in recentRecords"
          :key="record.id"
          class="record-item"
          @tap="goToRecordDetail(record.id)"
          role="listitem"
          tabindex="0"
          :aria-label="`${record.categoryName} ${record.type === 'expense' ? '支出' : '收入'} ${formatAmount(record.amount)}`"
        >
          <view class="record-icon" :style="{ backgroundColor: record.categoryColor }" aria-hidden="true">
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
    <view class="smart-import-btn" @tap="goToImport" role="button" tabindex="0" aria-label="智能导入账单">
      <view class="import-icon" aria-hidden="true">📷</view>
      <text class="import-text">{{ $t('index.smartImport') }}</text>
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
import { throttle } from '../../utils/performance/debounce'
import VirtualList from '../../components/common/VirtualList.vue'
import { h } from 'vue'

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

const throttledSwitchType = throttle(switchType, 300)
const throttledSelectCategory = throttle(selectCategory, 300)
const throttledOnDateChange = throttle(onDateChange, 300)

// 虚拟列表渲染函数
const renderRecordItem = ({ item, style }) => {
  return h('view', {
    class: 'record-item',
    style,
    onClick: () => goToRecordDetail(item.id),
    role: 'listitem',
    tabIndex: 0,
    'aria-label': `${item.categoryName} ${item.type === 'expense' ? '支出' : '收入'} ${formatAmount(item.amount)}`
  }, [
    h('view', {
      class: 'record-icon',
      style: { backgroundColor: item.categoryColor },
      'aria-hidden': 'true'
    }, item.categoryIcon),
    h('view', { class: 'record-info' }, [
      h('text', { class: 'record-category' }, item.categoryName),
      h('text', { class: 'record-desc' }, item.description || '无备注')
    ]),
    h('view', { class: 'record-amount' }, [
      h('text', {
        class: 'amount-text',
        class: item.type
      }, `${item.type === 'expense' ? '-' : '+'}${formatAmount(item.amount, { showSymbol: false })}`),
      h('text', { class: 'record-time' }, formatRelativeTime(item.date))
    ])
  ])
}

// 加载更多记录
const loadMoreRecords = async () => {
  // 这里可以加载更多记录，目前首页只显示最近记录，所以暂时不需要
  console.log('Load more records triggered')
}

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
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
