<template>
  <view class="family-settings-page">
    <!-- 家庭信息设置 -->
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">家庭信息</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item" @tap="showFamilyInfoEdit">
          <view class="setting-left">
            <text class="setting-icon">🏠</text>
            <view class="setting-info">
              <text class="setting-label">家庭名称</text>
              <text class="setting-value">{{ familyStore.familyName }}</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showFamilyDescEdit">
          <view class="setting-left">
            <text class="setting-icon">📝</text>
            <view class="setting-info">
              <text class="setting-label">家庭描述</text>
              <text class="setting-value">{{ familyStore.family?.description || '暂无描述' }}</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 预算设置 -->
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">预算管理</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item" @tap="showBudgetSettings">
          <view class="setting-left">
            <text class="setting-icon">💰</text>
            <view class="setting-info">
              <text class="setting-label">月度预算</text>
              <text class="setting-value">¥{{ formatAmount(monthlyBudget) }}</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showBudgetAlerts">
          <view class="setting-left">
            <text class="setting-icon">🔔</text>
            <view class="setting-info">
              <text class="setting-label">预算提醒</text>
              <text class="setting-value">{{ budgetAlertsEnabled ? '已开启' : '已关闭' }}</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">数据管理</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item" @tap="showDataExport">
          <view class="setting-left">
            <text class="setting-icon">📤</text>
            <view class="setting-info">
              <text class="setting-label">导出数据</text>
              <text class="setting-value">备份家庭账本</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showDataImport">
          <view class="setting-left">
            <text class="setting-icon">📥</text>
            <view class="setting-info">
              <text class="setting-label">导入数据</text>
              <text class="setting-value">恢复家庭账本</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showDataSync">
          <view class="setting-left">
            <text class="setting-icon">🔄</text>
            <view class="setting-info">
              <text class="setting-label">数据同步</text>
              <text class="setting-value">{{ syncEnabled ? '已开启' : '已关闭' }}</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 高级设置 -->
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">高级设置</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item" @tap="showPrivacySettings">
          <view class="setting-left">
            <text class="setting-icon">🔒</text>
            <view class="setting-info">
              <text class="setting-label">隐私设置</text>
              <text class="setting-value">数据访问权限</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showNotificationSettings">
          <view class="setting-left">
            <text class="setting-icon">📱</text>
            <view class="setting-info">
              <text class="setting-label">通知设置</text>
              <text class="setting-value">消息提醒配置</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 危险操作 -->
    <view class="settings-section danger-section">
      <view class="section-header">
        <text class="section-title">危险操作</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item danger-item" @tap="showLeaveFamily">
          <view class="setting-left">
            <text class="setting-icon">🚪</text>
            <view class="setting-info">
              <text class="setting-label">离开家庭</text>
              <text class="setting-value">退出当前家庭</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view v-if="familyStore.isAdmin" class="setting-item danger-item" @tap="showDissolveFamily">
          <view class="setting-left">
            <text class="setting-icon">💥</text>
            <view class="setting-info">
              <text class="setting-label">解散家庭</text>
              <text class="setting-value">永久删除家庭</text>
            </view>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 家庭信息编辑弹窗 -->
    <view v-if="showFamilyInfo" class="modal-overlay" @tap="closeFamilyInfo">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">修改家庭信息</text>
          <text class="close-btn" @tap="closeFamilyInfo">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">家庭名称</text>
            <input 
              class="form-input" 
              v-model="familyName" 
              placeholder="请输入家庭名称"
              maxlength="50"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">家庭描述</text>
            <textarea 
              class="form-textarea" 
              v-model="familyDescription" 
              placeholder="请输入家庭描述（可选）"
              maxlength="200"
            />
          </view>
          
          <view class="form-actions">
            <button class="cancel-btn" @tap="closeFamilyInfo">取消</button>
            <button class="confirm-btn" @tap="saveFamilyInfo">保存</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 预算设置弹窗 -->
    <view v-if="showBudget" class="modal-overlay" @tap="closeBudget">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">预算设置</text>
          <text class="close-btn" @tap="closeBudget">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">月度预算金额</text>
            <input 
              class="form-input" 
              v-model="budgetAmount" 
              type="number"
              placeholder="请输入预算金额"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">预算提醒</text>
            <switch 
              :checked="budgetAlertsEnabled" 
              @change="onBudgetAlertsChange"
              color="#1296db"
            />
          </view>
          
          <view class="form-actions">
            <button class="cancel-btn" @tap="closeBudget">取消</button>
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
const showFamilyInfo = ref(false)
const showBudget = ref(false)
const familyName = ref('')
const familyDescription = ref('')
const budgetAmount = ref('')
const budgetAlertsEnabled = ref(false)
const syncEnabled = ref(true)

// 计算属性
const monthlyBudget = computed(() => familyStore.budget?.amount || 0)

// 方法
const showFamilyInfoEdit = () => {
  if (!familyStore.isAdmin) {
    appStore.showToast('只有管理员可以修改家庭信息', 'none')
    return
  }
  familyName.value = familyStore.familyName || ''
  familyDescription.value = familyStore.family?.description || ''
  showFamilyInfo.value = true
}

const closeFamilyInfo = () => {
  showFamilyInfo.value = false
}

const saveFamilyInfo = async () => {
  if (!familyName.value.trim()) {
    appStore.showToast('请输入家庭名称', 'none')
    return
  }
  try {
    const success = await familyStore.updateFamily({
      name: familyName.value.trim(),
      description: familyDescription.value.trim()
    })
    if (success) {
      appStore.showToast('家庭信息更新成功', 'success')
      closeFamilyInfo()
      await familyStore.getFamilyInfo()
    }
  } catch (error) {
    console.error('更新家庭信息失败:', error)
    appStore.showToast('更新失败', 'none')
  }
}

const showFamilyDescEdit = () => {
  showFamilyInfoEdit()
}

const showBudgetSettings = async () => {
  if (!familyStore.isAdmin) {
    appStore.showToast('只有管理员可以设置预算', 'none')
    return
  }
  await familyStore.getBudget()
  budgetAmount.value = familyStore.budget?.amount?.toString() || ''
  budgetAlertsEnabled.value = familyStore.budget?.alerts_enabled || false
  showBudget.value = true
}

const closeBudget = () => {
  showBudget.value = false
}

const onBudgetAlertsChange = (e) => {
  budgetAlertsEnabled.value = e.detail.value
}

const saveBudget = async () => {
  try {
    await familyStore.setBudget({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: parseFloat(budgetAmount.value),
      alerts_enabled: budgetAlertsEnabled.value,
      alert_threshold: 80 // 可扩展为可编辑
    })
    appStore.showToast('预算设置保存成功', 'success')
    closeBudget()
    await familyStore.getBudget()
  } catch (error) {
    console.error('保存预算设置失败:', error)
    appStore.showToast('保存失败', 'none')
  }
}

const showBudgetAlerts = () => {
  showBudgetSettings()
}

const showDataExport = async () => {
  Taro.navigateTo({
    url: '/pages/export/index'
  })
}

const showDataImport = async (e) => {
  try {
    const file = e?.target?.files?.[0]
    if (!file) return
    await familyStore.importData(file)
    appStore.showToast('导入成功', 'success')
  } catch (e) {
    appStore.showToast('导入失败', 'none')
  }
}

const showDataSync = () => {
  appStore.showToast('功能开发中', 'none')
}

const showPrivacySettings = () => {
  appStore.showToast('功能开发中', 'none')
}

const showNotificationSettings = () => {
  appStore.showToast('功能开发中', 'none')
}

const showLeaveFamily = () => {
  Taro.showModal({
    title: '确认离开',
    content: '确定要离开当前家庭吗？离开后将无法访问家庭数据。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const success = await familyStore.leaveFamily()
          if (success) {
            Taro.reLaunch({ url: '/pages/family/create/index' })
          }
        } catch (error) {
          console.error('离开家庭失败:', error)
          appStore.showToast('操作失败', 'none')
        }
      }
    }
  })
}

const showDissolveFamily = () => {
  Taro.showModal({
    title: '确认解散',
    content: '确定要解散家庭吗？此操作不可恢复，所有数据将被删除。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const success = await familyStore.dissolveFamily()
          if (success) {
            Taro.reLaunch({ url: '/pages/family/create/index' })
          }
        } catch (error) {
          console.error('解散家庭失败:', error)
          appStore.showToast('操作失败', 'none')
        }
      }
    }
  })
}

// 生命周期
onMounted(async () => {
  await familyStore.getFamilyInfo()
  await familyStore.getBudget()
})

Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '家庭设置'
  })
})
</script>

<style lang="scss">
.family-settings-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  .settings-section {
    margin: 24rpx 30rpx;

    .section-header {
      margin-bottom: 20rpx;

      .section-title {
        font-size: 28rpx;
        color: #666;
        font-weight: 500;
      }
    }

    .settings-list {
      background: white;
      border-radius: 16rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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

        &.danger-item {
          .setting-icon {
            color: #ff4757;
          }

          .setting-label {
            color: #ff4757;
          }
        }

        .setting-left {
          display: flex;
          align-items: center;
          flex: 1;

          .setting-icon {
            font-size: 36rpx;
            margin-right: 20rpx;
          }

          .setting-info {
            flex: 1;

            .setting-label {
              display: block;
              font-size: 30rpx;
              color: #333;
              margin-bottom: 4rpx;
            }

            .setting-value {
              display: block;
              font-size: 24rpx;
              color: #666;
            }
          }
        }

        .setting-arrow {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    &.danger-section {
      .section-title {
        color: #ff4757;
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

          .form-textarea {
            width: 100%;
            padding: 20rpx;
            border: 2rpx solid #f0f0f0;
            border-radius: 12rpx;
            font-size: 28rpx;
            background: #f8f9fa;
            min-height: 120rpx;
            resize: none;

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