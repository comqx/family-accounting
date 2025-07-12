// 全局错误处理器
import Taro from '@tarojs/taro'

// 需要忽略的系统错误
const IGNORED_ERRORS = [
  'wxfile://',
  'miniprogramLog',
  'backgroundfetch',
  'no such file or directory',
  'private_getBackgroundFetchData',
  'backgroundfetch privacy fail'
]

// 检查是否为需要忽略的错误
export const shouldIgnoreError = (error: any): boolean => {
  if (!error) return false
  
  const errorString = typeof error === 'string' ? error : JSON.stringify(error)
  
  return IGNORED_ERRORS.some(ignored => 
    errorString.toLowerCase().includes(ignored.toLowerCase())
  )
}

// 全局错误处理
export const handleGlobalError = (error: any) => {
  if (shouldIgnoreError(error)) {
    console.warn('忽略系统错误:', error)
    return
  }
  
  console.error('应用错误:', error)
  
  // 可以在这里添加错误上报逻辑
  // reportError(error)
}

// 设置全局错误处理
export const setupGlobalErrorHandler = () => {
  // 处理未捕获的Promise错误
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (shouldIgnoreError(event.reason)) {
        console.warn('忽略未处理的Promise错误:', event.reason)
        event.preventDefault()
        return
      }
      
      console.error('未处理的Promise错误:', event.reason)
      event.preventDefault()
    })
  }
  
  // 处理全局错误
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      if (shouldIgnoreError(event.error || event.message)) {
        console.warn('忽略全局错误:', event.error || event.message)
        event.preventDefault()
        return
      }
      
      console.error('全局错误:', event.error || event.message)
    })
  }
}

// 网络请求错误处理
export const handleRequestError = (error: any) => {
  if (shouldIgnoreError(error)) {
    console.warn('忽略请求错误:', error)
    return
  }
  
  console.error('请求错误:', error)
  
  // 显示用户友好的错误提示
  Taro.showToast({
    title: '网络请求失败，请重试',
    icon: 'none',
    duration: 2000
  })
} 