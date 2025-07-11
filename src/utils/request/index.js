// 请求工具类
import Taro from '@tarojs/taro'

// API 配置
const API_CONFIG = {
  // 开发环境
  development: {
    baseURL: 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com',
    timeout: 10000
  },
  // 测试环境
  staging: {
    baseURL: 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com',
    timeout: 10000
  },
  // 生产环境 - 微信云托管
  production: {
    baseURL: 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com',
    timeout: 15000
  }
}

// 获取当前环境配置
const getApiConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return API_CONFIG[env] || API_CONFIG.development
}

// 请求拦截器
const requestInterceptor = (config) => {
  const token = Taro.getStorageSync('token')
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 添加小程序标识
  config.header = {
    ...config.header,
    'X-Client-Type': 'miniprogram',
    'X-Client-Version': '1.0.0'
  }
  
  return config
}

// 响应拦截器
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  
  if (statusCode >= 200 && statusCode < 300) {
    // 兼容不同的响应格式
    if (data.code && data.code !== 200) {
      throw new Error(data.message || '请求失败')
    }
    
    if (data.success === false) {
      throw new Error(data.error || data.message || '请求失败')
    }
    
    // 如果响应直接是数组，包装成标准格式
    if (Array.isArray(data)) {
      return { data: data }
    }
    
    return data
  }
  
  // 处理错误响应
  const error = new Error(data?.error || '请求失败')
  error.statusCode = statusCode
  error.data = data
  throw error
}

// 错误处理
const errorHandler = (error) => {
  console.error('Request Error:', error)
  
  // 处理网络错误
  if (error.errMsg && error.errMsg.includes('request:fail')) {
    Taro.showToast({
      title: '网络连接失败，请检查网络设置',
      icon: 'none',
      duration: 2000
    })
    return Promise.reject(error)
  }
  
  // 处理认证错误
  if (error.statusCode === 401) {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    
    Taro.showModal({
      title: '登录已过期',
      content: '请重新登录',
      showCancel: false,
      success: () => {
        Taro.reLaunch({
          url: '/pages/login/index'
        })
      }
    })
    return Promise.reject(error)
  }
  
  // 处理其他错误
  Taro.showToast({
    title: error.data?.error || '请求失败，请重试',
    icon: 'none',
    duration: 2000
  })
  
  return Promise.reject(error)
}

// 通用请求方法
const request = (options) => {
  const config = getApiConfig()
  
  const requestOptions = {
    url: `${config.baseURL}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...options.header
    },
    timeout: options.timeout || config.timeout
  }
  
  // 应用请求拦截器
  const interceptedOptions = requestInterceptor(requestOptions)
  console.log('[Request]', interceptedOptions)
  
  return Taro.request(interceptedOptions)
    .then(responseInterceptor)
    .catch(errorHandler)
}

// 导出请求方法
export default {
  // GET 请求
  get: (url, data, options = {}) => {
    return request({
      url,
      method: 'GET',
      data,
      ...options
    })
  },
  
  // POST 请求
  post: (url, data, options = {}) => {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    })
  },
  
  // PUT 请求
  put: (url, data, options = {}) => {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  },
  
  // DELETE 请求
  delete: (url, data, options = {}) => {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  },
  
  // 文件上传
  upload: (url, filePath, formData = {}, options = {}) => {
    const config = getApiConfig()
    const token = Taro.getStorageSync('token')
    
    const uploadOptions = {
      url: `${config.baseURL}${url}`,
      filePath,
      name: 'file',
      formData,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0',
        ...options.header
      },
      timeout: options.timeout || config.timeout
    }
    
    return Taro.uploadFile(uploadOptions)
      .then((response) => {
        const data = JSON.parse(response.data)
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return data
        }
        throw new Error(data?.error || '上传失败')
      })
      .catch(errorHandler)
  },

  // 当前登录用户 token，可供外部直接修改
  token: '',

  // 清除 token，登出时调用
  clearToken: () => {
    Taro.removeStorageSync('token')
    // @ts-ignore - 动态属性
    request.token = ''
  }
} 