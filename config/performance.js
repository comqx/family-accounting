// 性能优化配置

const config = {
  // 代码分割配置
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // 第三方库单独打包
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'all'
        },
        // 公共组件单独打包
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          chunks: 'all',
          reuseExistingChunk: true
        },
        // 工具函数单独打包
        utils: {
          name: 'utils',
          test: /[\\/]src[\\/]utils[\\/]/,
          priority: 8,
          chunks: 'all'
        },
        // 状态管理单独打包
        stores: {
          name: 'stores',
          test: /[\\/]src[\\/]stores[\\/]/,
          priority: 8,
          chunks: 'all'
        }
      }
    },
    // 运行时代码单独提取
    runtimeChunk: {
      name: 'runtime'
    }
  },

  // 压缩配置
  compression: {
    // 启用 gzip 压缩
    gzip: true,
    // 启用 brotli 压缩
    brotli: true,
    // 压缩阈值
    threshold: 1024,
    // 压缩比率
    minRatio: 0.8
  },

  // 图片优化配置
  imageOptimization: {
    // 图片压缩质量
    quality: 80,
    // 支持的图片格式
    formats: ['webp', 'jpg', 'png'],
    // 响应式图片尺寸
    sizes: [320, 640, 960, 1280, 1920],
    // 懒加载配置
    lazyLoading: {
      enabled: true,
      placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4='
    }
  },

  // 缓存策略配置
  caching: {
    // 静态资源缓存时间（秒）
    staticAssets: 31536000, // 1年
    // API 缓存时间（秒）
    apiCache: 300, // 5分钟
    // 页面缓存时间（秒）
    pageCache: 3600, // 1小时
    // 缓存策略
    strategies: {
      // 图片缓存策略
      images: 'cache-first',
      // API 缓存策略
      api: 'network-first',
      // 页面缓存策略
      pages: 'stale-while-revalidate'
    }
  },

  // 预加载配置
  preloading: {
    // 关键资源预加载
    critical: [
      '/assets/fonts/main.woff2',
      '/assets/css/critical.css'
    ],
    // 路由预加载
    routes: {
      // 首页相关路由
      home: ['/pages/ledger/index', '/pages/reports/index'],
      // 记账相关路由
      record: ['/pages/category/index', '/pages/import/index']
    },
    // 预加载策略
    strategy: 'idle' // 'idle' | 'visible' | 'load'
  },

  // 懒加载配置
  lazyLoading: {
    // 组件懒加载
    components: {
      enabled: true,
      // 懒加载阈值（像素）
      threshold: 100,
      // 预加载边距（像素）
      rootMargin: '50px'
    },
    // 路由懒加载
    routes: {
      enabled: true,
      // 预加载策略
      preloadStrategy: 'hover' // 'hover' | 'visible' | 'load'
    }
  },

  // 内存优化配置
  memory: {
    // 组件缓存大小
    componentCacheSize: 50,
    // 图片缓存大小（MB）
    imageCacheSize: 100,
    // 数据缓存大小
    dataCacheSize: 20,
    // 自动清理策略
    autoCleanup: {
      enabled: true,
      // 清理间隔（毫秒）
      interval: 300000, // 5分钟
      // 内存使用阈值（MB）
      threshold: 200
    }
  },

  // 网络优化配置
  network: {
    // 请求超时时间（毫秒）
    timeout: 10000,
    // 重试次数
    retryCount: 3,
    // 重试延迟（毫秒）
    retryDelay: 1000,
    // 并发请求限制
    concurrency: 6,
    // 请求去重
    deduplication: true,
    // 请求缓存
    cache: {
      enabled: true,
      // 缓存大小
      maxSize: 100,
      // 缓存时间（毫秒）
      ttl: 300000 // 5分钟
    }
  },

  // 渲染优化配置
  rendering: {
    // 虚拟滚动
    virtualScroll: {
      enabled: true,
      // 缓冲区大小
      bufferSize: 5,
      // 项目高度
      itemHeight: 80
    },
    // 防抖配置
    debounce: {
      // 搜索防抖延迟（毫秒）
      search: 300,
      // 滚动防抖延迟（毫秒）
      scroll: 16,
      // 输入防抖延迟（毫秒）
      input: 200
    },
    // 节流配置
    throttle: {
      // 滚动节流延迟（毫秒）
      scroll: 16,
      // 窗口大小变化节流延迟（毫秒）
      resize: 100
    }
  },

  // 监控配置
  monitoring: {
    // 性能监控
    performance: {
      enabled: true,
      // 采样率
      sampleRate: 0.1,
      // 监控指标
      metrics: [
        'FCP', // First Contentful Paint
        'LCP', // Largest Contentful Paint
        'FID', // First Input Delay
        'CLS', // Cumulative Layout Shift
        'TTFB' // Time to First Byte
      ]
    },
    // 错误监控
    error: {
      enabled: true,
      // 采样率
      sampleRate: 1.0,
      // 过滤规则
      filters: [
        // 忽略网络错误
        /Network Error/,
        // 忽略脚本错误
        /Script error/
      ]
    },
    // 用户行为监控
    behavior: {
      enabled: true,
      // 采样率
      sampleRate: 0.05,
      // 监控事件
      events: [
        'page_view',
        'button_click',
        'form_submit',
        'error_occurred'
      ]
    }
  },

  // 开发环境配置
  development: {
    // 热重载
    hotReload: true,
    // 源码映射
    sourceMap: true,
    // 调试工具
    devtools: true,
    // 性能分析
    profiling: false
  },

  // 生产环境配置
  production: {
    // 代码压缩
    minify: true,
    // 移除调试代码
    removeDebugCode: true,
    // 移除控制台输出
    removeConsole: true,
    // 源码映射
    sourceMap: false,
    // 资源内联
    inlineAssets: {
      // 内联小于 8KB 的图片
      images: 8192,
      // 内联小于 4KB 的字体
      fonts: 4096,
      // 内联小于 2KB 的 CSS
      css: 2048
    }
  }
}

module.exports = config
