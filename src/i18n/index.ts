import { createI18n } from 'vue-i18n'
import Taro from '@tarojs/taro'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

// 语言包配置
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 获取默认语言
const getDefaultLocale = () => {
  try {
    // 从本地存储获取用户设置的语言
    const savedLocale = Taro.getStorageSync('app_language')
    if (savedLocale && messages[savedLocale]) {
      return savedLocale
    }
    
    // 获取系统语言
    const systemInfo = Taro.getSystemInfoSync()
    const systemLanguage = systemInfo.language || 'zh-CN'
    
    // 映射系统语言到支持的语言
    const languageMap: Record<string, string> = {
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-CN',
      'en': 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-US'
    }
    
    return languageMap[systemLanguage] || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

// 创建 i18n 实例
const i18n = createI18n({
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages,
  legacy: false, // 使用 Composition API
  globalInjection: true, // 全局注入 $t 方法
  silentTranslationWarn: true, // 静默翻译警告
  missingWarn: false, // 静默缺失翻译警告
  fallbackWarn: false // 静默回退警告
})

// 切换语言
export const setLocale = (locale: string) => {
  if (messages[locale]) {
    i18n.global.locale.value = locale
    try {
      Taro.setStorageSync('app_language', locale)
    } catch {
      // 忽略存储错误
    }
  }
}

// 获取当前语言
export const getLocale = () => {
  return i18n.global.locale.value
}

// 获取支持的语言列表
export const getSupportedLocales = () => {
  return Object.keys(messages).map(locale => ({
    value: locale,
    label: messages[locale].meta?.name || locale
  }))
}

export default i18n 