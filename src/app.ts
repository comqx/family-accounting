
import { createApp } from 'vue'
import Taro from '@tarojs/taro'
import pinia from './stores'
import { useUserStore, useAppStore } from './stores'

import './app.scss'

const App = createApp({
  onLaunch(options) {
    console.log('App onLaunch:', options)

    // 初始化应用
    this.initApp()
  },

  onShow(options) {
    console.log('App onShow:', options)

    // 检查登录状态
    this.checkLoginStatus()
  },

  onHide() {
    console.log('App onHide')
  },

  onError(error) {
    console.error('App onError:', error)

    // 错误上报
    this.reportError(error)
  },

  methods: {
    // 初始化应用
    async initApp() {
      try {
        // 初始化用户状态
        const userStore = useUserStore()
        userStore.initUserState()

        // 初始化应用设置
        const appStore = useAppStore()
        appStore.initAppSettings()

        // 检查更新
        this.checkUpdate()

        // 设置全局错误处理
        this.setupGlobalErrorHandler()

      } catch (error) {
        console.error('Init app error:', error)
      }
    },

    // 检查登录状态
    async checkLoginStatus() {
      const userStore = useUserStore()

      if (userStore.isLoggedIn) {
        // 验证token有效性
        const isValid = await userStore.checkLoginStatus()

        if (!isValid) {
          // token无效，跳转到登录页
          Taro.reLaunch({
            url: '/pages/login/index'
          })
        }
      }
    },

    // 检查小程序更新
    checkUpdate() {
      if (Taro.canIUse('getUpdateManager')) {
        const updateManager = Taro.getUpdateManager()

        updateManager.onCheckForUpdate((res) => {
          console.log('检查更新结果:', res.hasUpdate)
        })

        updateManager.onUpdateReady(() => {
          Taro.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: (res) => {
              if (res.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        })

        updateManager.onUpdateFailed(() => {
          console.error('新版本下载失败')
        })
      }
    },

    // 设置全局错误处理
    setupGlobalErrorHandler() {
      // 监听未处理的Promise rejection
      if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event) => {
          console.error('Unhandled promise rejection:', event.reason)
          this.reportError(event.reason)
        })
      }
    },

    // 错误上报
    reportError(error: any) {
      // 这里可以集成错误监控服务，如Sentry等
      console.error('Error reported:', error)

      // 简单的错误统计
      const _errorInfo = {
        message: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: Taro.getSystemInfoSync()
      }

      // 可以发送到后端进行错误收集
      // request.post('/api/error/report', errorInfo).catch(() => {})
    }
  }
})

// 使用Pinia
App.use(pinia)

export default App
