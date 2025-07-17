
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import { handleGlobalError, setupGlobalErrorHandler } from './utils/error-handler'
import './app.scss'
import i18n from './i18n'

const App = createApp({
  onLaunch (options) {
    console.log('App onLaunch', options)
    // 设置全局错误处理
    setupGlobalErrorHandler()
  },
  onShow (options) {
    console.log('App onShow', options)
  },
  onHide () {
    console.log('App onHide')
  },
  onError (error) {
    handleGlobalError(error)
  },
  onPageNotFound (options) {
    console.log('App onPageNotFound', options)
  },
  onUnhandledRejection (options) {
    handleGlobalError(options.reason)
  }
})

App.use(createPinia().use(piniaPersistedstate))
App.use(i18n)

export default App
