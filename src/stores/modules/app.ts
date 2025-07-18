// 应用状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  currency: 'CNY' | 'USD' | 'EUR'
  notifications: {
    newRecord: boolean
    budgetAlert: boolean
    familyInvite: boolean
    syncComplete: boolean
  }
  privacy: {
    dataSync: boolean
    analytics: boolean
    crashReport: boolean
  }
}

export const useAppStore = defineStore('app', () => {
  // 状态
  const settings = ref<AppSettings>({
    theme: 'auto',
    language: 'zh-CN',
    currency: 'CNY',
    notifications: {
      newRecord: true,
      budgetAlert: true,
      familyInvite: true,
      syncComplete: false
    },
    privacy: {
      dataSync: true,
      analytics: true,
      crashReport: true
    }
  })

  const isLoading = ref(false)
  const isConnected = ref(true)

  // 计算属性
  const isDarkMode = computed(() => {
    if (settings.value.theme === 'auto') {
      // 自动跟随系统主题
      return Taro.getSystemInfoSync().theme === 'dark'
    }
    return settings.value.theme === 'dark'
  })

  const currentTheme = computed(() => {
    return isDarkMode.value ? 'dark' : 'light'
  })

  // 方法
  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    settings.value.theme = theme
    applyTheme()
    saveSettings()
  }

  const applyTheme = () => {
    // 设置 data-theme 属性
    const theme = currentTheme.value
    document?.documentElement?.setAttribute('data-theme', theme)
    
    // 设置导航栏样式
    Taro.setNavigationBarColor({
      frontColor: theme === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
    })
  }

  const setLanguage = (language: 'zh-CN' | 'en-US') => {
    settings.value.language = language
    saveSettings()
  }

  const setCurrency = (currency: 'CNY' | 'USD' | 'EUR') => {
    settings.value.currency = currency
    saveSettings()
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  const saveSettings = () => {
    try {
      Taro.setStorageSync('app_settings', settings.value)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const loadSettings = () => {
    try {
      const saved = Taro.getStorageSync('app_settings')
      if (saved) {
        settings.value = { ...settings.value, ...saved }
      }
      applyTheme()
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const showToast = (title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none', duration = 2000) => {
    Taro.showToast({
      title,
      icon,
      duration
    })
  }

  const showLoading = (title: string = '加载中...') => {
    isLoading.value = true
    Taro.showLoading({
      title,
      mask: true
    })
  }

  const hideLoading = () => {
    isLoading.value = false
    Taro.hideLoading()
  }

  const showModal = async (options: { title?: string; content: string; showCancel?: boolean }): Promise<boolean> => {
    return new Promise((resolve) => {
      Taro.showModal({
        title: options.title || '提示',
        content: options.content,
        showCancel: options.showCancel !== false,
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }

  const share = (options: { title: string; path: string; imageUrl?: string }) => {
    return {
      title: options.title,
      path: options.path,
      imageUrl: options.imageUrl
    }
  }

  const previewImage = (urls: string[], current?: string) => {
    Taro.previewImage({
      urls,
      current
    })
  }

  const setConnectionStatus = (connected: boolean) => {
    isConnected.value = connected
  }

  // 初始化
  const init = () => {
    loadSettings()
    
    // 监听系统主题变化
    Taro.onThemeChange((res) => {
      if (settings.value.theme === 'auto') {
        applyTheme()
    }
    })
  }

  return {
    // 状态
    settings,
    isLoading,
    isConnected,

    // 计算属性
    isDarkMode,
    currentTheme,

    // 方法
    setTheme,
    setLanguage,
    setCurrency,
    updateSettings,
    showToast,
    showLoading,
    hideLoading,
    showModal,
    share,
    previewImage,
    setConnectionStatus,
    init
  }
}, {
  persist: {
    key: 'app-store',
    storage: {
      getItem: (key) => {
        try {
          return Taro.getStorageSync(key)
        } catch {
          return null
        }
      },
      setItem: (key, value) => {
        try {
          Taro.setStorageSync(key, value)
        } catch {
          // 忽略存储错误
        }
      }
    }
  }
})
