<template>
  <view class="export-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">数据导出</text>
      <text class="page-subtitle">导出您的记账数据</text>
    </view>

    <!-- 导出选项 -->
    <view class="export-options">
      <view class="option-section">
        <text class="section-title">导出格式</text>
        <view class="format-options">
          <view 
            class="format-option" 
            :class="{ active: exportFormat === 'excel' }"
            @tap="exportFormat = 'excel'"
          >
            <text class="format-icon">📊</text>
            <text class="format-name">Excel</text>
            <text class="format-desc">适合数据分析</text>
          </view>
          <view 
            class="format-option" 
            :class="{ active: exportFormat === 'pdf' }"
            @tap="exportFormat = 'pdf'"
          >
            <text class="format-icon">📄</text>
            <text class="format-name">PDF</text>
            <text class="format-desc">适合打印分享</text>
          </view>
        </view>
      </view>

      <view class="option-section">
        <text class="section-title">时间范围</text>
        <view class="date-range">
          <picker 
            mode="date" 
            :value="startDate" 
            @change="onStartDateChange"
            class="date-picker"
          >
            <view class="picker-content">
              <text class="picker-label">开始日期</text>
              <text class="picker-value">{{ startDate || '请选择' }}</text>
            </view>
          </picker>
          <text class="date-separator">至</text>
          <picker 
            mode="date" 
            :value="endDate" 
            @change="onEndDateChange"
            class="date-picker"
          >
            <view class="picker-content">
              <text class="picker-label">结束日期</text>
              <text class="picker-value">{{ endDate || '请选择' }}</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="option-section">
        <text class="section-title">导出内容</text>
        <view class="content-options">
          <view class="content-item">
            <switch 
              :checked="includeCategories" 
              @change="onCategoriesChange"
              color="#1296db"
            />
            <view class="content-info">
              <text class="content-label">包含分类统计</text>
              <text class="content-desc">按分类汇总支出收入</text>
            </view>
          </view>
          <view class="content-item">
            <switch 
              :checked="includeMembers" 
              @change="onMembersChange"
              color="#1296db"
            />
            <view class="content-info">
              <text class="content-label">包含成员统计</text>
              <text class="content-desc">按成员汇总记账数据</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据预览 -->
    <view class="data-preview">
      <view class="preview-header">
        <text class="preview-title">数据预览</text>
        <text class="preview-count">{{ recordCount }} 条记录</text>
      </view>
      <view class="preview-summary">
        <view class="summary-item">
          <text class="summary-label">总支出</text>
          <text class="summary-value expense">¥{{ formatAmount(totalExpense) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">总收入</text>
          <text class="summary-value income">¥{{ formatAmount(totalIncome) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">结余</text>
          <text class="summary-value" :class="balance >= 0 ? 'income' : 'expense'">
            ¥{{ formatAmount(balance) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 导出按钮 -->
    <view class="export-actions">
      <button 
        class="export-btn" 
        :disabled="!canExport"
        @tap="startExport"
      >
        <text class="btn-icon">📤</text>
        <text class="btn-text">{{ exporting ? '导出中...' : '开始导出' }}</text>
      </button>
    </view>

    <!-- 导出历史 -->
    <view class="export-history" v-if="exportHistory.length > 0">
      <view class="history-header">
        <text class="history-title">导出历史</text>
      </view>
      <view class="history-list">
        <view 
          v-for="item in exportHistory" 
          :key="item.id"
          class="history-item"
        >
          <view class="history-info">
            <text class="history-name">{{ item.filename }}</text>
            <text class="history-time">{{ formatDate(item.createdAt) }}</text>
          </view>
          <view class="history-actions">
            <text class="action-btn" @tap="downloadFile(item.fileUrl)">下载</text>
            <text class="action-btn delete" @tap="deleteHistory(item.id)">删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../stores'
import { formatAmount, formatDate } from '../../utils/format'
import { exportData } from '../../utils/export'
import request from '../../utils/request'

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const exportFormat = ref('excel')
const startDate = ref('')
const endDate = ref('')
const includeCategories = ref(true)
const includeMembers = ref(true)
const exporting = ref(false)
const exportHistory = ref([])

// 数据统计
const recordCount = ref(0)
const totalExpense = ref(0)
const totalIncome = ref(0)
const balance = ref(0)

// 计算属性
const canExport = computed(() => {
  return startDate.value && endDate.value && !exporting.value
})

// 方法
const onStartDateChange = (e) => {
  startDate.value = e.detail.value
  loadDataPreview()
}

const onEndDateChange = (e) => {
  endDate.value = e.detail.value
  loadDataPreview()
}

const onCategoriesChange = (e) => {
  includeCategories.value = e.detail.value
}

const onMembersChange = (e) => {
  includeMembers.value = e.detail.value
}

const loadDataPreview = async () => {
  if (!startDate.value || !endDate.value) return
  
  try {
    const familyId = familyStore.familyId
    if (!familyId) {
      appStore.showToast('请先选择家庭', 'none')
      return
    }

    // 获取统计数据
    const statsRes = await request.get('/api/report/statistics', {
      familyId,
      startDate: startDate.value,
      endDate: endDate.value
    })

    if (statsRes.data) {
      totalExpense.value = parseFloat(statsRes.data.totalExpense) || 0
      totalIncome.value = parseFloat(statsRes.data.totalIncome) || 0
      recordCount.value = parseInt(statsRes.data.totalRecords) || 0
      balance.value = totalIncome.value - totalExpense.value
    }
  } catch (error) {
    console.error('加载数据预览失败:', error)
    appStore.showToast('加载数据失败', 'none')
  }
}

const startExport = async () => {
  if (!canExport.value) return

  try {
    exporting.value = true
    appStore.showLoading('正在导出数据...')

    const familyId = familyStore.familyId
    if (!familyId) {
      throw new Error('请先选择家庭')
    }

    // 获取导出数据
    const exportDataObj = await prepareExportData()

          // 导出选项
      const options = {
        format: exportFormat.value,
        dateRange: {
          start: startDate.value,
          end: endDate.value
        },
        includeCategories: includeCategories.value,
        includeMembers: includeMembers.value
      }

    // 执行导出
    const fileUrl = await exportData(exportDataObj, options)

    // 保存到导出历史
    const historyItem = {
      id: Date.now().toString(),
      filename: `家账通报表_${formatDate(new Date(), 'YYYY-MM-DD')}.${exportFormat.value === 'excel' ? 'xlsx' : 'pdf'}`,
      fileUrl,
      createdAt: new Date().toISOString(),
      format: exportFormat.value,
      recordCount: recordCount.value
    }

    exportHistory.value.unshift(historyItem)
    saveExportHistory()

    appStore.hideLoading()
    appStore.showToast('导出成功', 'success')

  } catch (error) {
    console.error('导出失败:', error)
    appStore.hideLoading()
    appStore.showToast(error.message || '导出失败', 'none')
  } finally {
    exporting.value = false
  }
}

const prepareExportData = async () => {
  const familyId = familyStore.familyId

  // 获取记录数据
  const recordsRes = await request.get('/api/record/list', {
    familyId,
    startDate: startDate.value,
    endDate: endDate.value,
    pageSize: 10000 // 获取所有记录
  })

  const records = recordsRes.data?.list || recordsRes.data?.records || []

  // 获取分类数据
  const categoriesRes = await request.get('/api/category/list', { familyId })
  const categories = categoriesRes.data || []

  // 获取成员数据
  const membersRes = await request.get('/api/family/members', { familyId })
  const members = membersRes.data || []

  return {
    records,
    categories,
    members,
    summary: {
      totalExpense: totalExpense.value,
      totalIncome: totalIncome.value,
      balance: balance.value,
      recordCount: recordCount.value
    }
  }
}

const downloadFile = async (fileUrl) => {
  try {
    appStore.showLoading('下载中...')
    
    const downloadRes = await Taro.downloadFile({ url: fileUrl })
    
    if (downloadRes.statusCode === 200) {
      await Taro.saveFile({
        tempFilePath: downloadRes.tempFilePath
      })
      
      appStore.hideLoading()
      appStore.showToast('文件已保存', 'success')
    } else {
      throw new Error('下载失败')
    }
  } catch (error) {
    console.error('下载文件失败:', error)
    appStore.hideLoading()
    appStore.showToast('下载失败', 'none')
  }
}

const deleteHistory = async (id) => {
  const confirmed = await appStore.showModal({
    content: '确定要删除这条导出记录吗？'
  })

  if (confirmed) {
    exportHistory.value = exportHistory.value.filter(item => item.id !== id)
    saveExportHistory()
    appStore.showToast('删除成功', 'success')
  }
}

const loadExportHistory = async () => {
  try {
    const history = await Taro.getStorage({ key: 'export_history' })
    exportHistory.value = history.data || []
  } catch (error) {
    exportHistory.value = []
  }
}

const saveExportHistory = async () => {
  try {
    await Taro.setStorage({
      key: 'export_history',
      data: exportHistory.value.slice(0, 10) // 只保留最近10条
    })
  } catch (error) {
    console.error('保存导出历史失败:', error)
  }
}

// 初始化默认日期范围（本月）
const initDefaultDateRange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  startDate.value = `${year}-${month.toString().padStart(2, '0')}-01`
  endDate.value = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
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
  initDefaultDateRange()
  loadDataPreview()
  loadExportHistory()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '数据导出'
  })
})
</script>

<style lang="scss" scoped>
.export-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 30rpx;
}

.page-header {
  text-align: center;
  margin-bottom: 40rpx;

  .page-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }

  .page-subtitle {
    font-size: 28rpx;
    color: #666;
  }
}

.export-options {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

  .option-section {
    margin-bottom: 40rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }

    .format-options {
      display: flex;
      gap: 20rpx;

      .format-option {
        flex: 1;
        padding: 30rpx;
        border: 2rpx solid #e0e0e0;
        border-radius: 12rpx;
        text-align: center;
        transition: all 0.3s ease;

        &.active {
          border-color: #1296db;
          background: rgba(18, 150, 219, 0.1);
        }

        .format-icon {
          display: block;
          font-size: 48rpx;
          margin-bottom: 10rpx;
        }

        .format-name {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 5rpx;
        }

        .format-desc {
          font-size: 24rpx;
          color: #666;
        }
      }
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 20rpx;

      .date-picker {
        flex: 1;

        .picker-content {
          padding: 20rpx;
          border: 2rpx solid #e0e0e0;
          border-radius: 12rpx;
          background: #f8f9fa;

          .picker-label {
            display: block;
            font-size: 24rpx;
            color: #666;
            margin-bottom: 5rpx;
          }

          .picker-value {
            font-size: 28rpx;
            color: #333;
          }
        }
      }

      .date-separator {
        font-size: 28rpx;
        color: #666;
      }
    }

    .content-options {
      .content-item {
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .content-info {
          flex: 1;
          margin-left: 20rpx;

          .content-label {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 5rpx;
          }

          .content-desc {
            font-size: 24rpx;
            color: #666;
          }
        }
      }
    }
  }
}

.data-preview {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .preview-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .preview-count {
      font-size: 24rpx;
      color: #666;
    }
  }

  .preview-summary {
    display: flex;
    gap: 20rpx;

    .summary-item {
      flex: 1;
      text-align: center;
      padding: 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;

      .summary-label {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .summary-value {
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
}

.export-actions {
  margin-bottom: 30rpx;

  .export-btn {
    width: 100%;
    background: linear-gradient(135deg, #1296db 0%, #667eea 100%);
    color: white;
    border: none;
    border-radius: 50rpx;
    padding: 28rpx 0;
    font-size: 32rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;

    &:disabled {
      background: #ccc;
    }

    &::after {
      border: none;
    }

    .btn-icon {
      font-size: 36rpx;
      margin-right: 10rpx;
    }
  }
}

.export-history {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

  .history-header {
    margin-bottom: 20rpx;

    .history-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .history-list {
    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .history-info {
        flex: 1;

        .history-name {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 5rpx;
        }

        .history-time {
          font-size: 24rpx;
          color: #666;
        }
      }

      .history-actions {
        display: flex;
        gap: 20rpx;

        .action-btn {
          padding: 10rpx 20rpx;
          border-radius: 8rpx;
          font-size: 24rpx;
          background: #f8f9fa;
          color: #1296db;

          &.delete {
            color: #ff4757;
          }
        }
      }
    }
  }
}
</style> 