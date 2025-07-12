<template>
  <view class="family-budget-page">
    <!-- 预算总览 -->
    <view class="budget-overview">
      <view class="overview-header">
        <text class="overview-title">本月预算</text>
        <text class="overview-period">{{ currentMonth }}</text>
      </view>
      
      <view class="budget-progress">
        <view class="progress-bar">
          <view 
            class="progress-fill" 
            :style="{ width: budgetProgress + '%', backgroundColor: budgetColor }"
          ></view>
        </view>
        <view class="progress-info">
          <text class="progress-text">已使用 {{ budgetProgress }}%</text>
          <text class="progress-amount">¥{{ formatAmount(usedAmount) }} / ¥{{ formatAmount(totalBudget) }}</text>
        </view>
      </view>
      
      <view class="budget-stats">
        <view class="stat-item">
          <text class="stat-value">¥{{ formatAmount(remainingBudget) }}</text>
          <text class="stat-label">剩余预算</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ remainingDays }}</text>
          <text class="stat-label">剩余天数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">¥{{ formatAmount(dailyBudget) }}</text>
          <text class="stat-label">日均预算</text>
        </view>
      </view>
    </view>

    <!-- 预算设置 -->
    <view class="budget-settings">
      <view class="section-header">
        <text class="section-title">预算设置</text>
        <text v-if="familyStore.isAdmin" class="edit-btn" @tap="showBudgetEdit">编辑</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item">
          <text class="setting-label">月度预算</text>
          <text class="setting-value">¥{{ formatAmount(totalBudget) }}</text>
        </view>
        
        <view class="setting-item">
          <text class="setting-label">预算提醒</text>
          <text class="setting-value">{{ budgetAlerts ? '已开启' : '已关闭' }}</text>
        </view>
        
        <view class="setting-item">
          <text class="setting-label">提醒阈值</text>
          <text class="setting-value">{{ alertThreshold }}%</text>
        </view>
      </view>
    </view>

    <!-- 分类预算 -->
    <view class="category-budget">
      <view class="section-header">
        <text class="section-title">分类预算</text>
        <text v-if="familyStore.isAdmin" class="edit-btn" @tap="showCategoryBudget">设置</text>
      </view>
      
      <view class="category-list">
        <view 
          v-for="category in categoryBudgets" 
          :key="category.id"
          class="category-item"
        >
          <view class="category-info">
            <view class="category-icon" :style="{ backgroundColor: category.color }">
              {{ category.icon }}
            </view>
            <view class="category-details">
              <text class="category-name">{{ category.name }}</text>
              <text class="category-progress">¥{{ formatAmount(category.used) }} / ¥{{ formatAmount(category.budget) }}</text>
            </view>
          </view>
          
          <view class="category-progress-bar">
            <view 
              class="category-progress-fill" 
              :style="{ 
                width: Math.min((category.used / category.budget) * 100, 100) + '%',
                backgroundColor: category.used > category.budget ? '#ff4757' : category.color
              }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 预算历史 -->
    <view class="budget-history">
      <view class="section-header">
        <text class="section-title">预算历史</text>
      </view>
      
      <view class="history-list">
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

// 模拟数据
const totalBudget = ref(5000)
const usedAmount = ref(3200)
const budgetAlerts = ref(true)
const alertThreshold = ref(80)

const categoryBudgets = ref([
  { id: 1, name: '餐饮', icon: '🍽️', color: '#ff6b6b', budget: 1500, used: 1200 },
  { id: 2, name: '交通', icon: '🚗', color: '#4ecdc4', budget: 800, used: 600 },
  { id: 3, name: '购物', icon: '🛒', color: '#45b7d1', budget: 1000, used: 800 },
  { id: 4, name: '娱乐', icon: '🎮', color: '#96ceb4', budget: 500, used: 300 },
  { id: 5, name: '其他', icon: '📦', color: '#feca57', budget: 1200, used: 300 }
])

const budgetHistory = ref([
  { month: '2024年1月', budget: 5000, used: 4800, status: 'normal' },
  { month: '2023年12月', budget: 5000, used: 5200, status: 'over' },
  { month: '2023年11月', budget: 5000, used: 4900, status: 'near' },
  { month: '2023年10月', budget: 5000, used: 4500, status: 'normal' }
])

// 计算属性
const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

const budgetProgress = computed(() => {
  if (totalBudget.value <= 0) return 0
  return Math.min(Math.round((usedAmount.value / totalBudget.value) * 100), 100)
})

const budgetColor = computed(() => {
  if (budgetProgress.value >= 100) return '#ff4757'
  if (budgetProgress.value >= 80) return '#ffa502'
  return '#2ed573'
})

const remainingBudget = computed(() => {
  return Math.max(totalBudget.value - usedAmount.value, 0)
})

const remainingDays = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
})

const dailyBudget = computed(() => {
  if (remainingDays.value <= 0) return 0
  return Math.round(remainingBudget.value / remainingDays.value)
})

// 方法
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

const closeBudgetModal = () => {
  showBudgetModal.value = false
}

const onBudgetAlertsChange = (e) => {
  editBudgetAlerts.value = e.detail.value
}

const saveBudget = async () => {
  if (!editBudgetAmount.value || parseFloat(editBudgetAmount.value) <= 0) {
    appStore.showToast('请输入有效的预算金额', 'none')
    return
  }
  
  try {
    // TODO: 调用后端API保存预算设置
    totalBudget.value = parseFloat(editBudgetAmount.value)
    budgetAlerts.value = editBudgetAlerts.value
    alertThreshold.value = parseInt(editAlertThreshold.value)
    
    appStore.showToast('预算设置保存成功', 'success')
    closeBudgetModal()
  } catch (error) {
    console.error('保存预算设置失败:', error)
    appStore.showToast('保存失败', 'none')
  }
}

const showCategoryBudget = () => {
  appStore.showToast('功能开发中', 'none')
}

// 加载数据
const loadData = async () => {
  try {
    // TODO: 从后端加载预算数据
  } catch (error) {
    console.error('加载预算数据失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadData()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '预算管理'
  })
})
</script>

<style lang="scss">
.family-budget-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 预算总览
  .budget-overview {
    background: linear-gradient(135deg, #1296db 0%, #56ccf2 100%);
    margin: 24rpx 30rpx;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    padding: 40rpx 30rpx;
    color: white;

    .overview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30rpx;

      .overview-title {
        font-size: 32rpx;
        font-weight: bold;
      }

      .overview-period {
        font-size: 26rpx;
        opacity: 0.8;
      }
    }

    .budget-progress {
      margin-bottom: 30rpx;

      .progress-bar {
        height: 12rpx;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 6rpx;
        overflow: hidden;
        margin-bottom: 15rpx;

        .progress-fill {
          height: 100%;
          border-radius: 6rpx;
          transition: width 0.3s ease;
        }
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .progress-text {
          font-size: 26rpx;
          opacity: 0.9;
        }

        .progress-amount {
          font-size: 28rpx;
          font-weight: bold;
        }
      }
    }

    .budget-stats {
      display: flex;
      align-items: center;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-value {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          margin-bottom: 8rpx;
        }

        .stat-label {
          display: block;
          font-size: 22rpx;
          opacity: 0.8;
        }
      }

      .stat-divider {
        width: 2rpx;
        height: 50rpx;
        background: rgba(255, 255, 255, 0.3);
        margin: 0 20rpx;
      }
    }
  }

  // 设置区域
  .budget-settings,
  .category-budget,
  .budget-history {
    margin: 24rpx 30rpx;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .edit-btn {
        font-size: 28rpx;
        color: #1296db;
        padding: 10rpx 20rpx;
        background: rgba(18, 150, 219, 0.1);
        border-radius: 20rpx;
      }
    }

    .settings-list {
      background: white;
      border-radius: $card-radius;
      box-shadow: $card-shadow;
      overflow: hidden;

      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 30rpx;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .setting-label {
          font-size: 28rpx;
          color: #333;
        }

        .setting-value {
          font-size: 28rpx;
          color: #666;
        }
      }
    }

    .category-list {
      background: white;
      border-radius: $card-radius;
      box-shadow: $card-shadow;
      overflow: hidden;

      .category-item {
        padding: 30rpx;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .category-info {
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

          .category-details {
            flex: 1;

            .category-name {
              display: block;
              font-size: 28rpx;
              color: #333;
              margin-bottom: 4rpx;
            }

            .category-progress {
              display: block;
              font-size: 24rpx;
              color: #666;
            }
          }
        }

        .category-progress-bar {
          height: 8rpx;
          background: #f0f0f0;
          border-radius: 4rpx;
          overflow: hidden;

          .category-progress-fill {
            height: 100%;
            border-radius: 4rpx;
            transition: width 0.3s ease;
          }
        }
      }
    }

    .history-list {
      background: white;
      border-radius: $card-radius;
      box-shadow: $card-shadow;
      overflow: hidden;

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
      }
    }
  }
}
</style> 