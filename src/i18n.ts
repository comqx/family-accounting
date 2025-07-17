import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import { useAppStore } from './stores/modules/app'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 获取当前语言，优先 appStore 设置，其次浏览器
function getLocale() {
  try {
    const appStore = useAppStore()
    return appStore?.settings?.language || navigator.language || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

const i18n = createI18n({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'zh-CN',
  messages
})

export default i18n 