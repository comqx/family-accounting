// HTTP请求工具

import Taro from '@tarojs/taro';
// import { ApiResponse } from '../../types/api';

// 请求配置 - 使用JSDoc注释
/**
 * @typedef {Object} RequestConfig
 * @property {string} url - 请求URL
 * @property {string} [method] - 请求方法
 * @property {*} [data] - 请求数据
 * @property {Object} [header] - 请求头
 * @property {number} [timeout] - 超时时间
 * @property {boolean} [loading] - 是否显示加载提示
 * @property {boolean} [cache] - 是否缓存
 */

// 响应拦截器类型 - 使用JSDoc注释
/**
 * @typedef {Function} ResponseInterceptor
 * @param {*} response - 响应数据
 * @returns {*} 处理后的响应数据
 */

/**
 * @typedef {Function} ErrorInterceptor
 * @param {*} error - 错误信息
 * @returns {*} 处理后的错误信息
 */

class RequestManager {
  baseURL: string;
  defaultTimeout: number;
  token: string;
  responseInterceptors: Array<(res: any) => any>;
  errorInterceptors: Array<(err: any) => any>;

  constructor() {
    // 初始化属性
    this.baseURL = 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com';
    this.defaultTimeout = 10000;
    this.token = '';
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    this.init();
  }

  init() {
    // 从存储中获取token
    this.token = Taro.getStorageSync('token') || '';
    
    // 如需按环境切换 API 域名，可在此处通过环境变量或配置文件动态注入。
    // 默认保持初始 baseURL（云函数地址）。
    // const accountInfo = Taro.getAccountInfoSync();
    // if (accountInfo.miniProgram.envVersion === 'develop') {
    //   this.baseURL = 'https://dev-api.example.com';
    // } else if (accountInfo.miniProgram.envVersion === 'trial') {
    //   this.baseURL = 'https://test-api.example.com';
    // } else {
    //   this.baseURL = 'https://api.example.com';
    // }
  }

  // 设置token
  setToken(token) {
    console.log('[TAG] request.setToken called', token, new Date().toISOString());
    this.token = token;
    Taro.setStorageSync('token', token);
  }

  // 清除token
  clearToken() {
    console.log('[TAG] request.clearToken called', new Date().toISOString());
    this.token = '';
    Taro.removeStorageSync('token');
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor) {
    this.errorInterceptors.push(interceptor);
  }

  // 通用请求方法
  async request(config) {
    const {
      url,
      method = 'GET',
      data,
      header = {},
      timeout = this.defaultTimeout,
      loading = false,
      cache = false
    } = config;

    // 显示加载提示
    if (loading) {
      Taro.showLoading({ title: '加载中...' });
    }

    // 检查缓存
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
    if (cache && method === 'GET') {
      const cachedData = Taro.getStorageSync(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
        if (loading) Taro.hideLoading();
        return cachedData.data;
      }
    }

    try {
      // 构建请求头
      const requestHeader = {
        'Content-Type': 'application/json',
        ...header
      };

      if (this.token) {
        requestHeader['Authorization'] = `Bearer ${this.token}`;
      }

      // 发起请求
      const response = await Taro.request({
        url: this.baseURL + url,
        method,
        data,
        header: requestHeader,
        timeout
      });

      if (loading) {
        Taro.hideLoading();
      }

      // 处理响应
      let result = response.data;

      // 应用响应拦截器
      for (const interceptor of this.responseInterceptors) {
        result = interceptor(result);
      }

      // 检查业务状态码 - 兼容不同的响应格式
      if (result.code && result.code !== 200) {
        throw new Error(result.message || '请求失败');
      }
      
      // 如果没有code字段，检查success字段
      if (result.success === false) {
        throw new Error(result.error || result.message || '请求失败');
      }
      
      // 如果响应直接是数组，包装成标准格式
      if (Array.isArray(result)) {
        return { data: result };
      }

      // 缓存GET请求结果
      if (cache && method === 'GET') {
        Taro.setStorageSync(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      if (loading) {
        Taro.hideLoading();
      }

      // 应用错误拦截器
      for (const interceptor of this.errorInterceptors) {
        error = interceptor(error);
      }

      // 处理网络错误
      if (error.errMsg) {
        if (error.errMsg.includes('timeout')) {
          throw new Error('请求超时，请检查网络连接');
        } else if (error.errMsg.includes('fail')) {
          throw new Error('网络连接失败，请检查网络设置');
        }
      }

      // 处理HTTP状态码错误
      if (error.statusCode) {
        switch (error.statusCode) {
          case 401:
            this.clearToken();
            Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
            // 跳转到登录页
            Taro.reLaunch({ url: '/pages/login/index' });
            break;
          case 403:
            throw new Error('没有权限访问');
          case 404:
            throw new Error('请求的资源不存在');
          case 500:
            throw new Error('服务器内部错误');
          default:
            throw new Error(`请求失败 (${error.statusCode})`);
        }
      }

      throw error;
    }
  }

  // GET请求
  get(url, params, config) {
    const queryString = params ? this.buildQueryString(params) : '';
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.request({
      url: fullUrl,
      method: 'GET',
      ...config
    });
  }

  // POST请求
  post(url, data, config) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...config
    });
  }

  // PUT请求
  put(url, data, config) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...config
    });
  }

  // DELETE请求
  delete(url, config) {
    return this.request({
      url,
      method: 'DELETE',
      ...config
    });
  }

  // 构建查询字符串
  buildQueryString(params) {
    if (!params || typeof params !== 'object') {
      return '';
    }

    const queryParts = [];
    for (const key in params) {
      if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
        const value = typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key];
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }

    return queryParts.join('&');
  }

  // 文件上传
  async uploadFile(config) {
    const {
      url,
      filePath,
      name,
      formData = {},
      header = {}
    } = config;

    // 显示加载提示
    Taro.showLoading({ title: '上传中...' });

    try {
      // 构建请求头
      const requestHeader = {
        ...header
      };

      if (this.token) {
        requestHeader['Authorization'] = `Bearer ${this.token}`;
      }

      // 发起上传请求
      const response = await Taro.uploadFile({
        url: this.baseURL + url,
        filePath,
        name,
        formData,
        header: requestHeader
      });

      Taro.hideLoading();

      // 解析响应数据
      const result = JSON.parse(response.data);

      // 检查业务状态码
      if (result.code !== 200) {
        throw new Error(result.message || '上传失败');
      }

      return result;

    } catch (error) {
      Taro.hideLoading();

      // 处理网络错误
      if (error.errMsg) {
        if (error.errMsg.includes('timeout')) {
          throw new Error('上传超时，请检查网络连接');
        } else if (error.errMsg.includes('fail')) {
          throw new Error('网络连接失败，请检查网络设置');
        }
      }

      throw error;
    }
  }

  // 文件下载
  async downloadFile(url: string, fileName?: string) {
    // 显示加载提示
    Taro.showLoading({ title: '下载中...' });

    try {
      // 发起下载请求
      const downloadRes = await Taro.downloadFile({ url: url as string });

      Taro.hideLoading();

      // 保存文件
      if (downloadRes.statusCode === 200) {
        const savedPath = await Taro.saveFile({
          tempFilePath: downloadRes.tempFilePath
        });

        Taro.showToast({
          title: '下载成功',
          icon: 'success'
        });

        if (typeof savedPath === 'object' && 'savedFilePath' in savedPath) {
          return (savedPath as any).savedFilePath;
        }
        return '';
      } else {
        throw new Error('下载失败');
      }

    } catch (error) {
      Taro.hideLoading();

      // 处理网络错误
      if (error.errMsg) {
        if (error.errMsg.includes('timeout')) {
          throw new Error('下载超时，请检查网络连接');
        } else if (error.errMsg.includes('fail')) {
          throw new Error('网络连接失败，请检查网络设置');
        }
      }

      throw error;
    }
  }
}

// 创建默认实例
const request = new RequestManager();

// 全局响应拦截器（可扩展）
request.addResponseInterceptor((res) => {
  // 可在此统一处理后端自定义 code，如 401/403/500 等
  if (res.code === 401) {
    request.clearToken();
    Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
    Taro.reLaunch({ url: '/pages/login/index' });
    throw new Error('登录已过期');
  }
  if (res.code === 403) {
    Taro.showToast({ title: '无权限访问', icon: 'none' });
    throw new Error('无权限访问');
  }
  if (res.code === 500) {
    Taro.showToast({ title: '服务器异常', icon: 'none' });
    throw new Error('服务器异常');
  }
  return res;
});

// 全局错误拦截器（可扩展）
request.addErrorInterceptor((err) => {
  if (err && err.message) {
    // 统一 toast 提示
    Taro.showToast({ title: err.message, icon: 'none' });
  }
  return err;
});

// 导出实例和类
export default request;
export { RequestManager };
