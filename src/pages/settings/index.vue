<template>
  <view class="settings-page">
    <!-- 个人设置 -->
    <view class="settings-section">
      <text class="section-title">个人设置</text>

      <view class="settings-group">
        <view class="setting-item" @tap="editProfile">
          <view class="setting-info">
            <text class="setting-label">个人资料</text>
            <text class="setting-desc">修改昵称和头像</text>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item">
          <view class="setting-info">
            <text class="setting-label">主题模式</text>
            <text class="setting-desc">{{ themeText }}</text>
          </view>
          <switch
            :checked="isDarkMode"
            @change="onThemeChange"
            color="#1296db"
          />
        </view>

        <view class="setting-item" @tap="showLanguageSelector">
          <view class="setting-info">
            <text class="setting-label">语言</text>
            <text class="setting-desc">{{ languageText }}</text>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showCurrencySelector">
          <view class="setting-info">
            <text class="setting-label">货币单位</text>
            <text class="setting-desc">{{ currencyText }}</text>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 通知设置 -->
    <view class="settings-section">
      <text class="section-title">通知设置</text>

      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-info">
            <text class="setting-label">记录变更通知</text>
            <text class="setting-desc">家庭成员记账时通知</text>
          </view>
          <switch
            :checked="notifications.recordChanges"
            @change="onNotificationChange('recordChanges', $event)"
            color="#1296db"
          />
        </view>

        <view class="setting-item">
          <view class="setting-info">
            <text class="setting-label">预算预警</text>
            <text class="setting-desc">超出预算时提醒</text>
          </view>
          <switch
            :checked="notifications.budgetAlerts"
            @change="onNotificationChange('budgetAlerts', $event)"
            color="#1296db"
          />
        </view>

        <view class="setting-item">
          <view class="setting-info">
            <text class="setting-label">成员活动</text>
            <text class="setting-desc">成员加入/离开通知</text>
          </view>
          <switch
            :checked="notifications.memberActivities"
            @change="onNotificationChange('memberActivities', $event)"
            color="#1296db"
          />
        </view>
      </view>
    </view>

    <!-- 隐私设置 -->
    <view class="settings-section">
      <text class="section-title">隐私设置</text>

      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-info">
            <text class="setting-label">列表显示金额</text>
            <text class="setting-desc">在记录列表中显示具体金额</text>
          </view>
          <switch
            :checked="privacy.showAmountInList"
            @change="onPrivacyChange('showAmountInList', $event)"
            color="#1296db"
          />
        </view>

        <view class="setting-item">
          <view class="setting-info">
            <text class="setting-label">报表密码保护</text>
            <text class="setting-desc">查看报表时需要验证密码</text>
          </view>
          <switch
            :checked="privacy.requirePasswordForReports"
            @change="onPrivacyChange('requirePasswordForReports', $event)"
            color="#1296db"
          />
        </view>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="settings-section">
      <text class="section-title">数据管理</text>

      <view class="settings-group">
        <view class="setting-item" @tap="exportData">
          <view class="setting-info">
            <text class="setting-label">导出数据</text>
            <text class="setting-desc">导出所有记账数据</text>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="syncData">
          <view class="setting-info">
            <text class="setting-label">同步数据</text>
            <text class="setting-desc">手动同步云端数据</text>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="clearCache">
          <view class="setting-info">
            <text class="setting-label">清理缓存</text>
            <text class="setting-desc">清理本地缓存数据</text>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 关于 -->
    <view class="settings-section">
      <text class="section-title">关于</text>

      <view class="settings-group">
        <view class="setting-item" @tap="checkUpdate">
          <view class="setting-info">
            <text class="setting-label">检查更新</text>
            <text class="setting-desc">当前版本 v1.0.0</text>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showPrivacyPolicy">
          <view class="setting-info">
            <text class="setting-label">隐私政策</text>
            <text class="setting-desc">查看隐私保护政策</text>
          </view>
          <text class="setting-arrow">></text>
        </view>

        <view class="setting-item" @tap="showUserAgreement">
          <view class="setting-info">
            <text class="setting-label">用户协议</text>
            <text class="setting-desc">查看使用条款</text>
          </view>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 语言选择弹窗 -->
    <view v-if="showLanguageModal" class="modal-overlay" @tap="closeLanguageModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择语言</text>
        </view>
        <view class="modal-body">
          <view
            v-for="lang in languageOptions"
            :key="lang.value"
            class="option-item"
            :class="{ active: currentLanguage === lang.value }"
            @tap="selectLanguage(lang.value)"
          >
            <text class="option-text">{{ lang.label }}</text>
            <text v-if="currentLanguage === lang.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 货币选择弹窗 -->
    <view v-if="showCurrencyModal" class="modal-overlay" @tap="closeCurrencyModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择货币</text>
        </view>
        <view class="modal-body">
          <view
            v-for="currency in currencyOptions"
            :key="currency.value"
            class="option-item"
            :class="{ active: currentCurrency === currency.value }"
            @tap="selectCurrency(currency.value)"
          >
            <text class="option-text">{{ currency.label }}</text>
            <text v-if="currentCurrency === currency.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../stores'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const showLanguageModal = ref(false)
const showCurrencyModal = ref(false)

const notifications = ref({
  recordChanges: true,
  budgetAlerts: true,
  memberActivities: true
})

const privacy = ref({
  showAmountInList: true,
  requirePasswordForReports: false
})

const currentLanguage = ref('zh-CN')
const currentCurrency = ref('CNY')

// 选项数据
const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

const currencyOptions = [
  { label: '人民币 (¥)', value: 'CNY' },
  { label: '美元 ($)', value: 'USD' },
  { label: '欧元 (€)', value: 'EUR' },
  { label: '英镑 (£)', value: 'GBP' },
  { label: '日元 (¥)', value: 'JPY' }
]

// 计算属性
const isDarkMode = computed(() => appStore.isDarkMode)

const themeText = computed(() => {
  return isDarkMode.value ? '深色模式' : '浅色模式'
})

const languageText = computed(() => {
  const lang = languageOptions.find(l => l.value === currentLanguage.value)
  return lang?.label || '简体中文'
})

const currencyText = computed(() => {
  const currency = currencyOptions.find(c => c.value === currentCurrency.value)
  return currency?.label || '人民币 (¥)'
})

// 方法
const editProfile = () => {
  appStore.showToast('功能开发中', 'none')
}

const onThemeChange = (e) => {
  const isDark = e.detail.value
  appStore.setTheme(isDark ? 'dark' : 'light')
}

const showLanguageSelector = () => {
  showLanguageModal.value = true
}

const closeLanguageModal = () => {
  showLanguageModal.value = false
}

const selectLanguage = (language) => {
  currentLanguage.value = language
      appStore.setLanguage(language)
  closeLanguageModal()
  appStore.showToast('语言设置已保存', 'success')
}

const showCurrencySelector = () => {
  showCurrencyModal.value = true
}

const closeCurrencyModal = () => {
  showCurrencyModal.value = false
}

const selectCurrency = (currency) => {
  currentCurrency.value = currency
  appStore.setCurrency(currency)
  closeCurrencyModal()
  appStore.showToast('货币设置已保存', 'success')
}

const onNotificationChange = (key: string, e) => {
  notifications.value[key] = e.detail.value
  saveSettings()
}

const onPrivacyChange = (key: string, e) => {
  privacy.value[key] = e.detail.value
  saveSettings()
}

const saveSettings = () => {
  // 保存设置到本地存储
  const settings = {
    notifications: notifications.value,
    privacy: privacy.value,
    language: currentLanguage.value,
    currency: currentCurrency.value
  }

  appStore.updateSettings(settings)
  appStore.showToast('设置已保存', 'success')
}

const exportData = async () => {
  try {
    appStore.showLoading('导出中...')

    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    appStore.hideLoading()
    appStore.showToast('导出成功', 'success')
  } catch (error) {
    appStore.hideLoading()
    appStore.showToast('导出失败', 'none')
  }
}

const syncData = async () => {
  try {
    appStore.showLoading('同步中...')

    // 模拟同步过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    appStore.hideLoading()
    appStore.showToast('同步完成', 'success')
  } catch (error) {
    appStore.hideLoading()
    appStore.showToast('同步失败', 'none')
  }
}

const clearCache = async () => {
  const confirmed = await appStore.showModal({
    content: '确定要清理缓存吗？这将删除所有本地缓存数据。'
  })

  if (confirmed) {
    try {
      appStore.showLoading('清理中...')

      // 模拟清理过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      appStore.hideLoading()
      appStore.showToast('清理完成', 'success')
    } catch (error) {
      appStore.hideLoading()
      appStore.showToast('清理失败', 'none')
    }
  }
}

const checkUpdate = () => {
  appStore.showToast('已是最新版本', 'success')
}

const showPrivacyPolicy = () => {
  appStore.showToast('功能开发中', 'none')
}

const showUserAgreement = () => {
  appStore.showToast('功能开发中', 'none')
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

// 加载设置
const loadSettings = () => {
  const settings = appStore.settings

  notifications.value = settings.notifications
  privacy.value = settings.privacy
  currentLanguage.value = settings.language
  currentCurrency.value = settings.currency
}

// 生命周期
onMounted(() => {
  checkUserStatus()
  loadSettings()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '设置'
  })
})
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 设置区域
  .settings-section {
    margin-bottom: 40rpx;

    .section-title {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin: 30rpx 30rpx 20rpx;
      font-weight: 500;
    }

    .settings-group {
      background: white;
      margin: 0 30rpx;
      border-radius: 16rpx;
      overflow: hidden;

      .setting-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;

          .setting-label {
            display: block;
            font-size: 30rpx;
            color: #333;
            margin-bottom: 6rpx;
          }

          .setting-desc {
            display: block;
            font-size: 24rpx;
            color: #999;
          }
        }

        .setting-arrow {
          font-size: 24rpx;
          color: #ccc;
          margin-left: 20rpx;
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
          justify-content: space-between;
          padding: 30rpx 40rpx;
          border-bottom: 2rpx solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          &.active {
            background: #f0f8ff;
          }

          .option-text {
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
