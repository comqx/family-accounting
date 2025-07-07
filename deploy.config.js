// 部署配置文件

const config = {
  // 环境配置
  environments: {
    development: {
      name: '开发环境',
      appId: 'wx1234567890abcdef',
      apiBaseUrl: 'https://dev-api.family-accounting.com',
      wsUrl: 'wss://dev-ws.family-accounting.com',
      cdnUrl: 'https://dev-cdn.family-accounting.com',
      enableDebug: true,
      enableMock: true,
      logLevel: 'debug'
    },
    staging: {
      name: '测试环境',
      appId: 'wx1234567890abcdef',
      apiBaseUrl: 'https://staging-api.family-accounting.com',
      wsUrl: 'wss://staging-ws.family-accounting.com',
      cdnUrl: 'https://staging-cdn.family-accounting.com',
      enableDebug: true,
      enableMock: false,
      logLevel: 'info'
    },
    production: {
      name: '生产环境',
      appId: 'wx0987654321fedcba',
      apiBaseUrl: 'https://api.family-accounting.com',
      wsUrl: 'wss://ws.family-accounting.com',
      cdnUrl: 'https://cdn.family-accounting.com',
      enableDebug: false,
      enableMock: false,
      logLevel: 'error'
    }
  },

  // 构建配置
  build: {
    // 输出目录
    outputDir: 'dist',
    // 静态资源目录
    assetsDir: 'static',
    // 是否生成 source map
    sourceMap: false,
    // 代码压缩
    minify: true,
    // 移除 console
    dropConsole: true,
    // 移除 debugger
    dropDebugger: true,
    // 文件名哈希
    filenameHashing: true,
    // 资源内联阈值
    assetsInlineLimit: 4096
  },

  // 优化配置
  optimization: {
    // 代码分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'all'
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          chunks: 'all'
        }
      }
    },
    // 压缩配置
    minimize: true,
    // Tree shaking
    usedExports: true,
    // 副作用标记
    sideEffects: false
  },

  // 小程序配置
  miniProgram: {
    // 分包配置
    subPackages: [
      {
        root: 'pages/reports',
        name: 'reports',
        pages: [
          'index',
          'advanced/index'
        ]
      },
      {
        root: 'pages/import',
        name: 'import',
        pages: [
          'index',
          'result/index'
        ]
      },
      {
        root: 'pages/split',
        name: 'split',
        pages: [
          'index',
          'create/index',
          'detail/index'
        ]
      }
    ],
    // 预下载配置
    preloadRule: {
      'pages/index/index': {
        network: 'all',
        packages: ['reports']
      },
      'pages/ledger/index': {
        network: 'wifi',
        packages: ['import', 'split']
      }
    },
    // 权限配置
    permission: {
      'scope.userInfo': {
        desc: '用于完善用户资料'
      },
      'scope.camera': {
        desc: '用于拍摄账单进行识别'
      },
      'scope.album': {
        desc: '用于选择账单图片进行识别'
      }
    },
    // 网络超时配置
    networkTimeout: {
      request: 10000,
      downloadFile: 10000,
      uploadFile: 10000,
      connectSocket: 10000
    }
  },

  // 部署脚本
  deploy: {
    // 构建前钩子
    beforeBuild: [
      'npm run lint',
      'npm run type-check'
    ],
    // 构建后钩子
    afterBuild: [
      'npm run analyze-bundle',
      'npm run generate-sitemap'
    ],
    // 部署前钩子
    beforeDeploy: [
      'npm run test',
      'npm run security-check'
    ],
    // 部署后钩子
    afterDeploy: [
      'npm run smoke-test',
      'npm run notify-team'
    ]
  },

  // 监控配置
  monitoring: {
    // 性能监控
    performance: {
      enabled: true,
      sampleRate: 0.1,
      endpoint: 'https://api.family-accounting.com/monitoring/performance'
    },
    // 错误监控
    error: {
      enabled: true,
      sampleRate: 1.0,
      endpoint: 'https://api.family-accounting.com/monitoring/errors'
    },
    // 用户行为分析
    analytics: {
      enabled: true,
      sampleRate: 0.05,
      endpoint: 'https://api.family-accounting.com/monitoring/analytics'
    }
  },

  // CDN 配置
  cdn: {
    // 静态资源 CDN
    assets: {
      enabled: true,
      domain: 'https://cdn.family-accounting.com',
      paths: ['/static/']
    },
    // 图片 CDN
    images: {
      enabled: true,
      domain: 'https://img.family-accounting.com',
      formats: ['webp', 'jpg', 'png'],
      quality: 80
    }
  },

  // 安全配置
  security: {
    // HTTPS 强制
    forceHttps: true,
    // 内容安全策略
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'wss:', 'https:']
    },
    // API 安全
    api: {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100 // 最大请求数
      },
      cors: {
        origin: ['https://family-accounting.com'],
        credentials: true
      }
    }
  },

  // 缓存配置
  cache: {
    // 静态资源缓存
    static: {
      maxAge: 31536000, // 1年
      immutable: true
    },
    // API 缓存
    api: {
      maxAge: 300, // 5分钟
      staleWhileRevalidate: 60
    },
    // 页面缓存
    page: {
      maxAge: 3600, // 1小时
      staleWhileRevalidate: 300
    }
  },

  // 备份配置
  backup: {
    // 数据库备份
    database: {
      enabled: true,
      schedule: '0 2 * * *', // 每天凌晨2点
      retention: 30 // 保留30天
    },
    // 文件备份
    files: {
      enabled: true,
      schedule: '0 3 * * 0', // 每周日凌晨3点
      retention: 12 // 保留12周
    }
  },

  // 通知配置
  notifications: {
    // 部署通知
    deploy: {
      enabled: true,
      channels: ['slack', 'email'],
      recipients: ['dev-team@company.com']
    },
    // 错误通知
    error: {
      enabled: true,
      threshold: 10, // 10个错误后通知
      channels: ['slack'],
      recipients: ['alerts@company.com']
    },
    // 性能通知
    performance: {
      enabled: true,
      threshold: 3000, // 3秒响应时间阈值
      channels: ['email'],
      recipients: ['ops-team@company.com']
    }
  }
}

module.exports = config
