<template>
  <view class="import-result-page">
    <!-- 识别结果概览 -->
    <view class="result-summary">
      <view class="summary-icon">
        <text class="icon-text">{{ isSuccess ? '✅' : '⚠️' }}</text>
      </view>
      <text class="summary-title">
        {{ isSuccess ? '识别成功' : '识别完成' }}
      </text>
      <text class="summary-desc">
        共识别到 {{ totalRecords }} 条记录，总金额 ¥{{ formatAmount(totalAmount) }}
      </text>
    </view>

    <!-- 平台信息 -->
    <view v-if="billData.platform" class="platform-info">
      <text class="platform-label">账单类型</text>
      <text class="platform-value">{{ getPlatformName(billData.platform) }}</text>
      <view class="confidence-bar">
        <text class="confidence-label">识别准确度</text>
        <view class="confidence-progress">
          <view
            class="progress-fill"
            :style="{ width: (billData.confidence * 100) + '%' }"
          ></view>
        </view>
        <text class="confidence-value">{{ Math.round(billData.confidence * 100) }}%</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <text class="section-title">识别记录</text>
        <text class="select-all" @tap="toggleSelectAll">
          {{ allSelected ? '取消全选' : '全选' }}
        </text>
      </view>

      <view class="records-list">
        <view
          v-for="(record, index) in editableRecords"
          :key="index"
          class="record-item"
          :class="{
            selected: record.selected,
            'needs-review': record.needsReview
          }"
        >
          <view class="record-checkbox" @tap="toggleRecord(index)">
            <text class="checkbox-icon">{{ record.selected ? '☑️' : '⬜' }}</text>
          </view>

          <view class="record-content" @tap="editRecord(index)">
            <view class="record-header">
              <text class="record-merchant">{{ record.merchant }}</text>
              <text class="record-amount">¥{{ formatAmount(record.amount) }}</text>
            </view>

            <view class="record-details">
              <text class="record-date">{{ formatDate(record.date) }}</text>
              <text class="record-desc">{{ record.description }}</text>
            </view>

            <view v-if="record.needsReview" class="review-badge">
              <text class="badge-text">需要确认</text>
            </view>

            <view v-if="record.creditCard" class="credit-card-info">
              <text class="card-info">{{ record.creditCard.bankName }} {{ record.creditCard.cardNumber }}</text>
            </view>

            <view v-if="record.installment" class="installment-info">
              <text class="installment-text">分期 {{ record.installment.currentPeriod }}/{{ record.installment.totalPeriods }}</text>
            </view>
          </view>

          <view class="record-actions">
            <text class="edit-btn" @tap="editRecord(index)">编辑</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="action-btn secondary" @tap="goBack">
        返回重新识别
      </button>

      <button
        class="action-btn primary"
        @tap="confirmImport"
        :disabled="selectedRecords.length === 0"
        :loading="isImporting"
      >
        {{ isImporting ? '导入中...' : `导入选中记录(${selectedRecords.length})` }}
      </button>
    </view>

    <!-- 编辑记录弹窗 -->
    <view v-if="showEditModal" class="modal-overlay" @tap="closeEditModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">编辑记录</text>
          <text class="close-btn" @tap="closeEditModal">×</text>
        </view>

        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">商户名称</text>
            <input
              class="form-input"
              :value="editingRecord.merchant"
              @input="onMerchantInput"
              placeholder="请输入商户名称"
            />
          </view>

          <view class="form-item">
            <text class="form-label">金额</text>
            <input
              class="form-input"
              type="digit"
              :value="editingRecord.amount"
              @input="onAmountInput"
              placeholder="0.00"
            />
          </view>

          <view class="form-item">
            <text class="form-label">日期</text>
            <picker
              mode="date"
              :value="formatDate(editingRecord.date, 'YYYY-MM-DD')"
              @change="onDateChange"
            >
              <view class="picker-input">
                {{ formatDate(editingRecord.date, 'YYYY-MM-DD') }}
              </view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">备注</text>
            <input
              class="form-input"
              :value="editingRecord.description"
              @input="onDescInput"
              placeholder="添加备注"
            />
          </view>
        </view>

        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeEditModal">取消</button>
          <button class="modal-btn confirm" @tap="saveEdit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useRecordStore, useAppStore } from '../../../stores'
import { useRealTimeSync } from '../../../hooks/useRealTimeSync'
import { formatAmount, formatDate } from '../../../utils/format'

// Store
const userStore = useUserStore()
const recordStore = useRecordStore()
const appStore = useAppStore()

// 实时同步
const { syncRecordChange } = useRealTimeSync()

// 响应式数据
const billData = ref({
  platform: 'ALIPAY',
  transactions: [],
  summary: {
    totalAmount: 0,
    transactionCount: 0,
    dateRange: {
      start: new Date(),
      end: new Date()
    }
  },
  confidence: 0
})

const editableRecords = ref([])
const showEditModal = ref(false)
const editingRecord = ref({
  amount: 0,
  type: 'expense',
  merchant: '',
  description: '',
  date: new Date(),
  confidence: 0,
  needsReview: false
})
const editingIndex = ref(-1)
const isImporting = ref(false)

// 计算属性
const totalRecords = computed(() => editableRecords.value.length)
const totalAmount = computed(() =>
  editableRecords.value.reduce((sum, record) => sum + record.amount, 0)
)
const selectedRecords = computed(() =>
  editableRecords.value.filter(record => record.selected)
)
const allSelected = computed(() =>
  editableRecords.value.length > 0 && editableRecords.value.every(record => record.selected)
)
const isSuccess = computed(() =>
  billData.value.confidence > 0.8 && totalRecords.value > 0
)

// 方法
const getPlatformName = (platform) => {
  const names = {
    'ALIPAY': '支付宝账单',
    'WECHAT': '微信账单',
    'BANK_CARD': '银行卡账单',
    'CREDIT_CARD': '信用卡账单'
  }
  return names[platform] || '未知类型'
}

const toggleSelectAll = () => {
  const newSelected = !allSelected.value
  editableRecords.value.forEach(record => {
    record.selected = newSelected
  })
}

const toggleRecord = (index) => {
  editableRecords.value[index].selected = !editableRecords.value[index].selected
}

const editRecord = (index) => {
  editingIndex.value = index
  editingRecord.value = { ...editableRecords.value[index] }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingIndex.value = -1
}

const onMerchantInput = (e) => {
  editingRecord.value.merchant = e.detail.value
}

const onAmountInput = (e) => {
  editingRecord.value.amount = parseFloat(e.detail.value) || 0
}

const onDateChange = (e) => {
  editingRecord.value.date = new Date(e.detail.value)
}

const onDescInput = (e) => {
  editingRecord.value.description = e.detail.value
}

const saveEdit = () => {
  if (editingIndex.value >= 0) {
    editableRecords.value[editingIndex.value] = {
      ...editingRecord.value,
      selected: editableRecords.value[editingIndex.value].selected
    }
  }
  closeEditModal()
}

const confirmImport = async () => {
  if (selectedRecords.value.length === 0) {
    appStore.showToast('请选择要导入的记录', 'none')
    return
  }

  try {
    isImporting.value = true

    // 模拟导入过程
    for (const record of selectedRecords.value) {
      // 创建记录数据
      const recordData = {
        id: Date.now().toString() + Math.random(),
        type: record.type,
        amount: record.amount,
        categoryId: 'expense_0', // 默认分类，实际应该智能匹配
        description: record.description || record.merchant,
        date: record.date,
        createTime: new Date(),
        updateTime: new Date()
      }

      // 同步到其他设备
      syncRecordChange('create', recordData)

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    appStore.showToast('导入成功', 'success')

    // 跳转到账本页面
    setTimeout(() => {
      Taro.switchTab({
        url: '/pages/ledger/index'
      })
    }, 1000)

  } catch (error) {
    console.error('Import error:', error)
    appStore.showToast(error.message || '导入失败', 'none')
  } finally {
    isImporting.value = false
  }
}

const goBack = () => {
  Taro.navigateBack()
}

// 初始化数据
const initData = () => {
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}

  if (options.data) {
    try {
      const data = JSON.parse(decodeURIComponent(options.data))

      if (options.batch === 'true') {
        // 批量导入结果
        const allTransactions = []
        data.forEach((billData) => {
          allTransactions.push(...billData.transactions)
        })

        billData.value = {
          platform: 'ALIPAY',
          transactions: allTransactions,
          summary: {
            totalAmount: allTransactions.reduce((sum, t) => sum + t.amount, 0),
            transactionCount: allTransactions.length,
            dateRange: {
              start: new Date(),
              end: new Date()
            }
          },
          confidence: allTransactions.length > 0 ?
            allTransactions.reduce((sum, t) => sum + t.confidence, 0) / allTransactions.length : 0
        }
      } else {
        // 单个导入结果
        billData.value = data
      }

      // 初始化可编辑记录
      editableRecords.value = billData.value.transactions.map(transaction => ({
        ...transaction,
        selected: true
      }))

    } catch (error) {
      console.error('Parse import data error:', error)
      appStore.showToast('数据解析失败', 'none')
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    }
  } else {
    // 没有数据，返回上一页
    appStore.showToast('没有识别数据', 'none')
    setTimeout(() => {
      Taro.navigateBack()
    }, 1500)
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
  initData()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '导入结果'
  })
})
</script>

<style lang="scss" scoped>
.import-result-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 结果概览
  .result-summary {
    background: white;
    text-align: center;
    padding: 60rpx 30rpx;
    margin-bottom: 30rpx;

    .summary-icon {
      margin-bottom: 20rpx;

      .icon-text {
        font-size: 100rpx;
      }
    }

    .summary-title {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 15rpx;
    }

    .summary-desc {
      display: block;
      font-size: 28rpx;
      color: #666;
      line-height: 1.5;
    }
  }

  // 平台信息
  .platform-info {
    background: white;
    margin: 0 30rpx 30rpx;
    border-radius: 16rpx;
    padding: 30rpx;

    .platform-label {
      font-size: 26rpx;
      color: #666;
    }

    .platform-value {
      display: block;
      font-size: 30rpx;
      color: #333;
      font-weight: bold;
      margin: 10rpx 0 20rpx;
    }

    .confidence-bar {
      display: flex;
      align-items: center;
      gap: 15rpx;

      .confidence-label {
        font-size: 24rpx;
        color: #666;
      }

      .confidence-progress {
        flex: 1;
        height: 8rpx;
        background: #f0f0f0;
        border-radius: 4rpx;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4rpx;
          transition: width 0.3s ease;
        }
      }

      .confidence-value {
        font-size: 24rpx;
        color: #333;
        font-weight: bold;
      }
    }
  }

  // 记录列表
  .records-section {
    margin: 0 30rpx 30rpx;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;

      .section-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
      }

      .select-all {
        font-size: 26rpx;
        color: #1296db;
        padding: 10rpx 20rpx;
        background: rgba(18, 150, 219, 0.1);
        border-radius: 20rpx;
      }
    }

    .records-list {
      background: white;
      border-radius: 16rpx;
      overflow: hidden;

      .record-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f0f0f0;
        position: relative;

        &:last-child {
          border-bottom: none;
        }

        &.selected {
          background: rgba(18, 150, 219, 0.05);
        }

        &.needs-review {
          border-left: 6rpx solid #ff9500;
        }

        .record-checkbox {
          margin-right: 20rpx;

          .checkbox-icon {
            font-size: 32rpx;
          }
        }

        .record-content {
          flex: 1;

          .record-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10rpx;

            .record-merchant {
              font-size: 30rpx;
              color: #333;
              font-weight: 500;
            }

            .record-amount {
              font-size: 30rpx;
              color: #ff4757;
              font-weight: bold;
            }
          }

          .record-details {
            display: flex;
            align-items: center;
            gap: 20rpx;

            .record-date {
              font-size: 24rpx;
              color: #999;
            }

            .record-desc {
              font-size: 24rpx;
              color: #666;
            }
          }

          .review-badge {
            position: absolute;
            top: 20rpx;
            right: 80rpx;

            .badge-text {
              font-size: 20rpx;
              color: #ff9500;
              background: rgba(255, 149, 0, 0.1);
              padding: 4rpx 12rpx;
              border-radius: 10rpx;
            }
          }

          .credit-card-info {
            margin-top: 10rpx;

            .card-info {
              font-size: 22rpx;
              color: #1296db;
              background: rgba(18, 150, 219, 0.1);
              padding: 4rpx 12rpx;
              border-radius: 10rpx;
            }
          }

          .installment-info {
            margin-top: 10rpx;

            .installment-text {
              font-size: 22rpx;
              color: #722ed1;
              background: rgba(114, 46, 209, 0.1);
              padding: 4rpx 12rpx;
              border-radius: 10rpx;
            }
          }
        }

        .record-actions {
          .edit-btn {
            font-size: 26rpx;
            color: #1296db;
            padding: 10rpx 15rpx;
            background: rgba(18, 150, 219, 0.1);
            border-radius: 15rpx;
          }
        }
      }
    }
  }

  // 操作按钮
  .action-buttons {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 30rpx;
    display: flex;
    gap: 20rpx;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);

    .action-btn {
      flex: 1;
      border: none;
      border-radius: 50rpx;
      padding: 28rpx 0;
      font-size: 32rpx;
      font-weight: bold;

      &::after {
        border: none;
      }

      &.secondary {
        background: #f8f9fa;
        color: #666;
      }

      &.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        &:disabled {
          background: #ccc;
          opacity: 0.6;
        }
      }
    }
  }

  // 编辑弹窗
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 60rpx;

    .modal-content {
      background: white;
      border-radius: 20rpx;
      width: 100%;
      max-height: 80vh;

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 40rpx 40rpx 20rpx;
        border-bottom: 2rpx solid #f0f0f0;

        .modal-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
        }

        .close-btn {
          font-size: 48rpx;
          color: #999;
          width: 60rpx;
          height: 60rpx;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .modal-body {
        padding: 40rpx;
        max-height: 400rpx;
        overflow-y: auto;

        .form-item {
          margin-bottom: 30rpx;

          &:last-child {
            margin-bottom: 0;
          }

          .form-label {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 15rpx;
          }

          .form-input {
            width: 100%;
            padding: 20rpx;
            border: 2rpx solid #e0e0e0;
            border-radius: 12rpx;
            font-size: 28rpx;
            color: #333;

            &:focus {
              border-color: #1296db;
            }
          }

          .picker-input {
            padding: 20rpx;
            border: 2rpx solid #e0e0e0;
            border-radius: 12rpx;
            font-size: 28rpx;
            color: #333;
            background: #fafafa;
          }
        }
      }

      .modal-footer {
        display: flex;
        border-top: 2rpx solid #f0f0f0;

        .modal-btn {
          flex: 1;
          padding: 30rpx 0;
          border: none;
          background: white;
          font-size: 32rpx;

          &::after {
            border: none;
          }

          &.cancel {
            color: #666;
            border-right: 2rpx solid #f0f0f0;
          }

          &.confirm {
            color: #1296db;
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
