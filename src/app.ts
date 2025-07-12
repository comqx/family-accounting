
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { handleGlobalError, setupGlobalErrorHandler } from './utils/error-handler'
import './app.scss'

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

App.use(createPinia())

export default App
