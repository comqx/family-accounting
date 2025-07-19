import Taro from '@tarojs/taro'

interface PerformanceMetrics {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
}

interface ErrorInfo {
  message: string
  stack?: string
  timestamp: number
  page?: string
  userAgent?: string
}

interface UserBehavior {
  event: string
  timestamp: number
  page?: string
  data?: any
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {}
  private errors: ErrorInfo[] = []
  private behaviors: UserBehavior[] = []
  private isEnabled = true
  private sampleRate = 0.1 // 采样率

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 初始化性能监控
  init(config?: { sampleRate?: number; enabled?: boolean }) {
    if (config) {
      this.sampleRate = config.sampleRate || 0.1
      this.isEnabled = config.enabled !== false
    }

    if (!this.isEnabled) return

    // 监听页面加载
    this.observePageLoad()
    
    // 监听错误
    this.observeErrors()
    
    // 监听用户行为
    this.observeUserBehavior()
  }

  // 监听页面加载性能
  private observePageLoad() {
    try {
      // 获取页面加载时间
      const startTime = Date.now()
      
      Taro.eventCenter.on('pageReady', () => {
        const loadTime = Date.now() - startTime
        this.recordMetric('TTFB', loadTime)
      })

      // 模拟其他性能指标（实际项目中可以使用真实的性能API）
      setTimeout(() => {
        this.recordMetric('FCP', Math.random() * 1000 + 500)
        this.recordMetric('LCP', Math.random() * 1500 + 800)
      }, 100)
    } catch (error) {
      console.warn('性能监控初始化失败:', error)
    }
  }

  // 监听错误
  private observeErrors() {
    // 监听全局错误
    Taro.eventCenter.on('error', (error: any) => {
      this.recordError(error)
    })

    // 监听网络错误
    Taro.eventCenter.on('networkError', (error: any) => {
      this.recordError(error)
    })
  }

  // 监听用户行为
  private observeUserBehavior() {
    // 监听页面访问
    Taro.eventCenter.on('pageShow', (page: string) => {
      this.recordBehavior('page_view', { page })
    })

    // 监听按钮点击
    Taro.eventCenter.on('buttonClick', (data: any) => {
      this.recordBehavior('button_click', data)
    })
  }

  // 记录性能指标
  recordMetric(name: keyof PerformanceMetrics, value: number) {
    if (!this.isEnabled || Math.random() > this.sampleRate) return

    this.metrics[name] = value
    console.log(`📊 性能指标 ${name}:`, value)
    
    // 上报性能数据
    this.reportMetrics()
  }

  // 记录错误
  recordError(error: Error | string, page?: string) {
    if (!this.isEnabled) return

    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      page: page || this.getCurrentPage(),
      userAgent: this.getUserAgent()
    }

    this.errors.push(errorInfo)
    console.error('❌ 错误记录:', errorInfo)
    
    // 上报错误数据
    this.reportErrors()
  }

  // 记录用户行为
  recordBehavior(event: string, data?: any) {
    if (!this.isEnabled || Math.random() > this.sampleRate) return

    const behavior: UserBehavior = {
      event,
      timestamp: Date.now(),
      page: this.getCurrentPage(),
      data
    }

    this.behaviors.push(behavior)
    console.log(`👤 用户行为 ${event}:`, behavior)
    
    // 上报行为数据
    this.reportBehaviors()
  }

  // 获取当前页面
  private getCurrentPage(): string {
    try {
      const pages = Taro.getCurrentPages()
      const currentPage = pages[pages.length - 1]
      return currentPage?.route || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // 获取用户代理
  private getUserAgent(): string {
    try {
      const systemInfo = Taro.getSystemInfoSync()
      return `${systemInfo.platform} ${systemInfo.system}`
    } catch {
      return 'unknown'
    }
  }

  // 上报性能指标
  private async reportMetrics() {
    try {
      // 这里可以上报到后端或第三方监控服务
      // await request.post('/api/monitor/performance', this.metrics)
      console.log('📊 性能指标上报:', this.metrics)
    } catch (error) {
      console.warn('性能指标上报失败:', error)
    }
  }

  // 上报错误
  private async reportErrors() {
    try {
      const recentErrors = this.errors.slice(-10) // 只上报最近10个错误
      // await request.post('/api/monitor/errors', recentErrors)
      console.log('❌ 错误上报:', recentErrors)
    } catch (error) {
      console.warn('错误上报失败:', error)
    }
  }

  // 上报用户行为
  private async reportBehaviors() {
    try {
      const recentBehaviors = this.behaviors.slice(-20) // 只上报最近20个行为
      // await request.post('/api/monitor/behaviors', recentBehaviors)
      console.log('👤 用户行为上报:', recentBehaviors)
    } catch (error) {
      console.warn('用户行为上报失败:', error)
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      metrics: this.metrics,
      errors: this.errors.length,
      behaviors: this.behaviors.length,
      timestamp: Date.now()
    }
  }

  // 清理数据
  clear() {
    this.metrics = {}
    this.errors = []
    this.behaviors = []
  }
}

// 导出单例
export const performanceMonitor = PerformanceMonitor.getInstance()

// 导出便捷方法
export const recordMetric = (name: keyof PerformanceMetrics, value: number) => {
  performanceMonitor.recordMetric(name, value)
}

export const recordError = (error: Error | string, page?: string) => {
  performanceMonitor.recordError(error, page)
}

export const recordBehavior = (event: string, data?: any) => {
  performanceMonitor.recordBehavior(event, data)
}

export default performanceMonitor 