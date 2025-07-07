// HTTP请求工具

import Taro from '@tarojs/taro';
import { ApiResponse, ErrorResponse } from '../../types/api';

// 请求配置
interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  loading?: boolean;
  cache?: boolean;
}

// 响应拦截器类型
type ResponseInterceptor = (response: any) => any;
type ErrorInterceptor = (error: any) => any;

class RequestManager {
  private baseURL = '';
  private defaultTimeout = 10000;
  private token = '';
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 从存储中获取token
    this.token = Taro.getStorageSync('token') || '';
    
    // 设置基础URL
    const accountInfo = Taro.getAccountInfoSync();
    if (accountInfo.miniProgram.envVersion === 'develop') {
      this.baseURL = 'https://dev-api.example.com';
    } else if (accountInfo.miniProgram.envVersion === 'trial') {
      this.baseURL = 'https://test-api.example.com';
    } else {
      this.baseURL = 'https://api.example.com';
    }
  }

  // 设置token
  setToken(token: string) {
    this.token = token;
    Taro.setStorageSync('token', token);
  }

  // 清除token
  clearToken() {
    this.token = '';
    Taro.removeStorageSync('token');
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  // 通用请求方法
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
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
      let result = response.data as ApiResponse<T>;

      // 应用响应拦截器
      for (const interceptor of this.responseInterceptors) {
        result = interceptor(result);
      }

      // 检查业务状态码
      if (result.code !== 200) {
        throw new Error(result.message || '请求失败');
      }

      // 缓存GET请求结果
      if (cache && method === 'GET') {
        Taro.setStorageSync(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error: any) {
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
  get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : '';
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.request<T>({
      url: fullUrl,
      method: 'GET',
      ...config
    });
  }

  // POST请求
  post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config
    });
  }

  // PUT请求
  put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    });
  }

  // DELETE请求
  delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
    });
  }

  // 构建查询字符串
  private buildQueryString(params: Record<string, any>): string {
    const pairs: string[] = [];
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    
    return pairs.join('&');
  }

  // 上传文件
  async uploadFile(config: {
    url: string;
    filePath: string;
    name: string;
    formData?: Record<string, any>;
    header?: Record<string, string>;
  }): Promise<any> {
    const { url, filePath, name, formData, header = {} } = config;

    if (this.token) {
      header['Authorization'] = `Bearer ${this.token}`;
    }

    return new Promise((resolve, reject) => {
      const uploadTask = Taro.uploadFile({
        url: this.baseURL + url,
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve(data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            reject(new Error('响应数据格式错误'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });

      // 可以返回uploadTask用于监听上传进度
      return uploadTask;
    });
  }

  // 下载文件
  async downloadFile(url: string, fileName?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      Taro.downloadFile({
        url: this.baseURL + url,
        success: (res) => {
          if (res.statusCode === 200) {
            // 保存到本地
            if (fileName) {
              Taro.saveFile({
                tempFilePath: res.tempFilePath,
                success: (saveRes) => {
                  resolve(saveRes.savedFilePath);
                },
                fail: reject
              });
            } else {
              resolve(res.tempFilePath);
            }
          } else {
            reject(new Error('下载失败'));
          }
        },
        fail: reject
      });
    });
  }
}

// 创建请求实例
const request = new RequestManager();

// 添加默认拦截器
request.addResponseInterceptor((response) => {
  // 可以在这里添加全局响应处理逻辑
  return response;
});

request.addErrorInterceptor((error) => {
  // 可以在这里添加全局错误处理逻辑
  console.error('Request Error:', error);
  return error;
});

export default request;
