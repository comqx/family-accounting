<template>
  <view class="budget-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">预算管理</text>
      <text class="page-subtitle">{{ currentMonth }}</text>
    </view>

    <!-- 预算总览 -->
    <view class="budget-overview">
      <view class="budget-card">
        <view class="budget-header">
          <text class="budget-title">月度预算</text>
          <text class="budget-edit" @tap="showBudgetEdit">编辑</text>
        </view>
        
        <view class="budget-amounts">
          <view class="amount-item">
            <text class="amount-label">总预算</text>
            <text class="amount-value">¥{{ formatAmount(totalBudget) }}</text>
          </view>
          <view class="amount-item">
            <text class="amount-label">已使用</text>
            <text class="amount-value used">¥{{ formatAmount(usedAmount) }}</text>
          </view>
          <view class="amount-item">
            <text class="amount-label">剩余</text>
            <text class="amount-value remaining">¥{{ formatAmount(remainingBudget) }}</text>
          </view>
        </view>

        <!-- 预算进度条 -->
        <view class="budget-progress">
          <view class="progress-bar">
            <view 
              class="progress-fill" 
              :style="{ 
                width: `${budgetProgress}%`, 
                backgroundColor: budgetColor 
              }"
            ></view>
          </view>
          <text class="progress-text">{{ budgetProgress }}%</text>
        </view>

        <!-- 预算状态 -->
        <view class="budget-status">
          <text class="status-text" :style="{ color: budgetColor }">
            {{ budgetProgress >= 100 ? '已超支' : budgetProgress >= 80 ? '接近预算' : '正常' }}
          </text>
          <text class="daily-budget">日均预算: ¥{{ formatAmount(dailyBudget) }}</text>
        </view>
      </view>
    </view>

    <!-- 分类预算 -->
    <view class="category-budgets">
      <view class="section-header">
        <text class="section-title">分类预算</text>
        <text class="add-btn" @tap="showCategoryEdit">添加</text>
      </view>

      <view v-if="categoryBudgets.length > 0" class="category-list">
        <view 
          v-for="category in categoryBudgets" 
          :key="category.id"
          class="category-item"
          @tap="editCategoryBudget(category)"
        >
          <view class="category-info">
            <view class="category-icon" :style="{ backgroundColor: category.color }">
              {{ category.icon || '📊' }}
            </view>
            <view class="category-details">
              <text class="category-name">{{ category.name }}</text>
              <text class="category-amount">
                ¥{{ formatAmount(category.used) }} / ¥{{ formatAmount(category.budget) }}
              </text>
            </view>
          </view>
          
          <view class="category-progress">
            <view class="progress-bar">
              <view 
                class="progress-fill" 
                :style="{ 
                  width: `${Math.min((category.used / category.budget) * 100, 100)}%`,
                  backgroundColor: category.color
                }"
              ></view>
            </view>
            <text class="progress-percent">
              {{ Math.round((category.used / category.budget) * 100) }}%
            </text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无分类预算</text>
        <text class="empty-desc">点击添加按钮设置分类预算</text>
      </view>
    </view>

    <!-- 预算历史 -->
    <view class="budget-history">
      <view class="section-header">
        <text class="section-title">预算历史</text>
      </view>

      <view v-if="budgetHistory.length > 0" class="history-list">
        <view 
          v-for="month in budgetHistory" 
          :key="month.month"
          class="history-item"
        >
          <view class="history-info">
            <text class="history-month">{{ month.month }}</text>
            <text class="history-status" :class="month.status">
              {{ month.status === 'over' ? '超支' : month.status === 'near' ? '接近' : '正常' }}
            </text>
          </view>
          
          <view class="history-amounts">
            <text class="history-used">¥{{ formatAmount(month.used) }}</text>
            <text class="history-total">/ ¥{{ formatAmount(month.budget) }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📈</text>
        <text class="empty-text">暂无预算历史</text>
        <text class="empty-desc">开始使用预算功能后查看历史记录</text>
      </view>
    </view>

    <!-- 预算编辑弹窗 -->
    <view v-if="showBudgetModal" class="modal-overlay" @tap="closeBudgetModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">预算设置</text>
          <text class="close-btn" @tap="closeBudgetModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">月度预算金额</text>
            <input 
              class="form-input" 
              v-model="editBudgetAmount" 
              type="number"
              placeholder="请输入预算金额"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">预算提醒</text>
            <switch 
              :checked="editBudgetAlerts" 
              @change="onBudgetAlertsChange"
              color="#1296db"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">提醒阈值 (%)</text>
            <input 
              class="form-input" 
              v-model="editAlertThreshold" 
              type="number"
              placeholder="80"
              max="100"
            />
          </view>
          
          <view class="form-actions">
            <button class="cancel-btn" @tap="closeBudgetModal">取消</button>
            <button class="confirm-btn" @tap="saveBudget">保存</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 分类预算编辑弹窗 -->
    <view v-if="showCategoryModal" class="modal-overlay" @tap="closeCategoryModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editCategory ? '编辑' : '添加' }}分类预算</text>
          <text class="close-btn" @tap="closeCategoryModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">分类名称</text>
            <input 
              class="form-input" 
              v-model="editCategory.name" 
              placeholder="请输入分类名称"
            />
          </view>
          <view class="form-item">
            <text class="form-label">预算金额</text>
            <input 
              class="form-input" 
              v-model="editCategoryAmount" 
              type="number"
              placeholder="请输入预算金额"
            />
          </view>
          <view class="form-item">
            <text class="form-label">分类颜色</text>
            <view class="color-picker">
              <view 
                v-for="color in colors" 
                :key="color" 
                class="color-option" 
                :style="{ backgroundColor: color }"
                @tap="editCategory.color = color"
              ></view>
            </view>
          </view>
          <view class="form-actions">
            <button class="cancel-btn" @tap="closeCategoryModal">取消</button>
            <button class="confirm-btn" @tap="saveCategoryBudget">{{ editCategory ? '保存' : '添加' }}</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../../stores'
import { formatAmount } from '../../../utils/format'

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const showBudgetModal = ref(false)
const editBudgetAmount = ref('')
const editBudgetAlerts = ref(true)
const editAlertThreshold = ref('80')
const showCategoryModal = ref(false)
const editCategory = ref(null)
const editCategoryAmount = ref('')

const totalBudget = ref(0)
const usedAmount = ref(0)
const budgetAlerts = ref(true)
const alertThreshold = ref(80)
const categoryBudgets = ref([])
const budgetHistory = ref([])

const colors = ref([
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ffa502', '#2ed573', '#1296db'
])

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

const loadData = async () => {
  try {
    // 获取预算总览
    const budget = await familyStore.getBudget()
    totalBudget.value = budget.amount || 0
    usedAmount.value = budget.used || 0
    budgetAlerts.value = budget.alerts_enabled
    alertThreshold.value = budget.alert_threshold
    
    // 获取分类预算
    categoryBudgets.value = await familyStore.getCategoryBudgets()
    
    // 获取预算历史
    budgetHistory.value = await familyStore.getBudgetHistory()
  } catch (error) {
    console.error('加载预算数据失败:', error)
    appStore.showToast('加载数据失败', 'none')
  }
}

onMounted(loadData)

const budgetProgress = computed(() => {
  if (totalBudget.value <= 0) return 0
  return Math.min(Math.round((usedAmount.value / totalBudget.value) * 100), 100)
})

const budgetColor = computed(() => {
  if (budgetProgress.value >= 100) return '#ff4757'
  if (budgetProgress.value >= 80) return '#ffa502'
  return '#2ed573'
})

const remainingBudget = computed(() => Math.max(totalBudget.value - usedAmount.value, 0))

const remainingDays = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
})

const dailyBudget = computed(() => {
  if (remainingDays.value <= 0) return 0
  return Math.round(remainingBudget.value / remainingDays.value)
})

const showBudgetEdit = () => {
  if (!familyStore.isAdmin) {
    appStore.showToast('只有管理员可以设置预算', 'none')
    return
  }
  editBudgetAmount.value = totalBudget.value.toString()
  editBudgetAlerts.value = budgetAlerts.value
  editAlertThreshold.value = alertThreshold.value.toString()
  showBudgetModal.value = true
}

const closeBudgetModal = () => showBudgetModal.value = false

const onBudgetAlertsChange = (e) => editBudgetAlerts.value = e.detail.value

const saveBudget = async () => {
  if (!editBudgetAmount.value || parseFloat(editBudgetAmount.value) <= 0) {
    appStore.showToast('请输入有效的预算金额', 'none')
    return
  }
  
  try {
    await familyStore.setBudget({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: parseFloat(editBudgetAmount.value),
      alerts_enabled: editBudgetAlerts.value,
      alert_threshold: parseInt(editAlertThreshold.value)
    })
    
    appStore.showToast('预算设置保存成功', 'success')
    closeBudgetModal()
    await loadData()
  } catch (error) {
    console.error('保存预算设置失败:', error)
    appStore.showToast('保存失败', 'none')
  }
}

const showCategoryEdit = () => {
  if (!familyStore.isAdmin) {
    appStore.showToast('只有管理员可以设置分类预算', 'none')
    return
  }
  editCategory.value = { name: '', color: colors.value[0] }
  editCategoryAmount.value = ''
  showCategoryModal.value = true
}

const editCategoryBudget = (category) => {
  if (!familyStore.isAdmin) {
    appStore.showToast('只有管理员可以编辑分类预算', 'none')
    return
  }
  editCategory.value = { ...category }
  editCategoryAmount.value = category.budget.toString()
  showCategoryModal.value = true
}

const closeCategoryModal = () => showCategoryModal.value = false

const saveCategoryBudget = async () => {
  if (!editCategory.value.name || !editCategoryAmount.value) {
    appStore.showToast('请填写完整信息', 'none')
    return
  }
  
  try {
    const categoryData = {
      name: editCategory.value.name,
      budget: parseFloat(editCategoryAmount.value),
      color: editCategory.value.color
    }
    
    if (editCategory.value.id) {
      // 编辑现有分类预算
      await familyStore.updateCategoryBudget(editCategory.value.id, categoryData)
    } else {
      // 添加新分类预算
      await familyStore.addCategoryBudget(categoryData)
    }
    
    appStore.showToast('分类预算保存成功', 'success')
    closeCategoryModal()
    await loadData()
  } catch (error) {
    console.error('保存分类预算失败:', error)
    appStore.showToast('保存失败', 'none')
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
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '预算管理'
  })
})
</script>

<style lang="scss" scoped>
.budget-page {
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

.budget-overview {
  margin-bottom: 30rpx;

  .budget-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .budget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;

      .budget-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .budget-edit {
        font-size: 28rpx;
        color: #1296db;
        padding: 10rpx;
      }
    }

    .budget-amounts {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30rpx;

      .amount-item {
        text-align: center;
        flex: 1;

        .amount-label {
          display: block;
          font-size: 24rpx;
          color: #666;
          margin-bottom: 8rpx;
        }

        .amount-value {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;

          &.used {
            color: #ff4757;
          }

          &.remaining {
            color: #2ed573;
          }
        }
      }
    }

    .budget-progress {
      margin-bottom: 20rpx;

      .progress-bar {
        height: 12rpx;
        background: #f0f0f0;
        border-radius: 6rpx;
        overflow: hidden;
        margin-bottom: 10rpx;

        .progress-fill {
          height: 100%;
          border-radius: 6rpx;
          transition: width 0.3s ease;
        }
      }

      .progress-text {
        font-size: 24rpx;
        color: #666;
        text-align: center;
      }
    }

    .budget-status {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .status-text {
        font-size: 28rpx;
        font-weight: bold;
      }

      .daily-budget {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}

.category-budgets {
  margin-bottom: 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .add-btn {
      font-size: 28rpx;
      color: #1296db;
      padding: 10rpx;
    }
  }

  .category-list {
    background: white;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .category-item {
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .category-info {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

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

        .category-details {
          flex: 1;

          .category-name {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 5rpx;
          }

          .category-amount {
            font-size: 24rpx;
            color: #666;
          }
        }
      }

      .category-progress {
        display: flex;
        align-items: center;
        gap: 15rpx;

        .progress-bar {
          flex: 1;
          height: 8rpx;
          background: #f0f0f0;
          border-radius: 4rpx;
          overflow: hidden;

          .progress-fill {
            height: 100%;
            border-radius: 4rpx;
            transition: width 0.3s ease;
          }
        }

        .progress-percent {
          font-size: 24rpx;
          color: #666;
          min-width: 60rpx;
          text-align: right;
        }
      }
    }
  }

  .empty-state {
    background: white;
    border-radius: 16rpx;
    padding: 60rpx 30rpx;
    text-align: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }

    .empty-text {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 10rpx;
    }

    .empty-desc {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.budget-history {
  .section-header {
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .history-list {
    background: white;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .history-info {
        .history-month {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 4rpx;
        }

        .history-status {
          font-size: 24rpx;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;

          &.normal {
            background: rgba(46, 213, 115, 0.1);
            color: #2ed573;
          }

          &.near {
            background: rgba(255, 165, 2, 0.1);
            color: #ffa502;
          }

          &.over {
            background: rgba(255, 71, 87, 0.1);
            color: #ff4757;
          }
        }
      }

      .history-amounts {
        text-align: right;

        .history-used {
          font-size: 28rpx;
          color: #333;
          font-weight: bold;
        }

        .history-total {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
  }

  .empty-state {
    background: white;
    border-radius: 16rpx;
    padding: 60rpx 30rpx;
    text-align: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }

    .empty-text {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 10rpx;
    }

    .empty-desc {
      font-size: 24rpx;
      color: #666;
    }
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
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    background: white;
    border-radius: 20rpx;
    width: 90%;
    max-width: 600rpx;
    max-height: 80vh;
    overflow: hidden;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .modal-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .close-btn {
        font-size: 40rpx;
        color: #999;
        padding: 10rpx;
      }
    }

    .modal-body {
      padding: 30rpx;

      .form-item {
        margin-bottom: 30rpx;

        .form-label {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 15rpx;
        }

        .form-input {
          width: 100%;
          padding: 20rpx;
          border: 2rpx solid #f0f0f0;
          border-radius: 12rpx;
          font-size: 28rpx;
          background: #f8f9fa;

          &:focus {
            border-color: #1296db;
            background: white;
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 20rpx;
        margin-top: 40rpx;

        .cancel-btn, .confirm-btn {
          flex: 1;
          border: none;
          border-radius: 12rpx;
          padding: 20rpx;
          font-size: 28rpx;

          &::after {
            border: none;
          }
        }

        .cancel-btn {
          background: #f8f9fa;
          color: #666;
        }

        .confirm-btn {
          background: #1296db;
          color: white;
        }
      }

      .color-picker {
        display: flex;
        gap: 10rpx;
        margin-top: 15rpx;

        .color-option {
          width: 50rpx;
          height: 50rpx;
          border-radius: 50%;
          border: 2rpx solid #eee;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}
</style> 