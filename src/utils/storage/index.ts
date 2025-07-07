// 本地存储工具

import Taro from '@tarojs/taro';

// 存储键名常量
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  FAMILY_INFO: 'familyInfo',
  APP_SETTINGS: 'appSettings',
  CACHE_PREFIX: 'cache_',
  DRAFT_PREFIX: 'draft_'
} as const;

// 存储项接口
interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  expireTime?: number;
}

class StorageManager {
  // 设置存储项
  set<T>(key: string, value: T, expireTime?: number): boolean {
    try {
      const item: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        expireTime: expireTime ? Date.now() + expireTime : undefined
      };
      
      Taro.setStorageSync(key, item);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  // 获取存储项
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item: StorageItem<T> = Taro.getStorageSync(key);
      
      if (!item) {
        return defaultValue;
      }

      // 检查是否过期
      if (item.expireTime && Date.now() > item.expireTime) {
        this.remove(key);
        return defaultValue;
      }

      return item.data;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  // 移除存储项
  remove(key: string): boolean {
    try {
      Taro.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  // 清空所有存储
  clear(): boolean {
    try {
      Taro.clearStorageSync();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // 获取所有存储键
  getAllKeys(): string[] {
    try {
      const info = Taro.getStorageInfoSync();
      return info.keys;
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }

  // 获取存储信息
  getInfo(): { keys: string[]; currentSize: number; limitSize: number } {
    try {
      return Taro.getStorageInfoSync();
    } catch (error) {
      console.error('Storage getInfo error:', error);
      return { keys: [], currentSize: 0, limitSize: 0 };
    }
  }

  // 检查存储项是否存在
  has(key: string): boolean {
    try {
      const item = Taro.getStorageSync(key);
      return item !== undefined && item !== null && item !== '';
    } catch (error) {
      return false;
    }
  }

  // 设置缓存（带过期时间）
  setCache<T>(key: string, value: T, expireMinutes: number = 30): boolean {
    const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
    const expireTime = expireMinutes * 60 * 1000; // 转换为毫秒
    return this.set(cacheKey, value, expireTime);
  }

  // 获取缓存
  getCache<T>(key: string, defaultValue?: T): T | undefined {
    const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
    return this.get(cacheKey, defaultValue);
  }

  // 清除所有缓存
  clearCache(): boolean {
    try {
      const keys = this.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX));
      
      cacheKeys.forEach(key => {
        this.remove(key);
      });
      
      return true;
    } catch (error) {
      console.error('Clear cache error:', error);
      return false;
    }
  }

  // 设置草稿
  setDraft<T>(key: string, value: T): boolean {
    const draftKey = STORAGE_KEYS.DRAFT_PREFIX + key;
    return this.set(draftKey, value);
  }

  // 获取草稿
  getDraft<T>(key: string, defaultValue?: T): T | undefined {
    const draftKey = STORAGE_KEYS.DRAFT_PREFIX + key;
    return this.get(draftKey, defaultValue);
  }

  // 清除草稿
  clearDraft(key: string): boolean {
    const draftKey = STORAGE_KEYS.DRAFT_PREFIX + key;
    return this.remove(draftKey);
  }

  // 清除所有草稿
  clearAllDrafts(): boolean {
    try {
      const keys = this.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.DRAFT_PREFIX));
      
      draftKeys.forEach(key => {
        this.remove(key);
      });
      
      return true;
    } catch (error) {
      console.error('Clear all drafts error:', error);
      return false;
    }
  }
}

// 创建存储管理器实例
const storage = new StorageManager();

// 便捷方法
export const setToken = (token: string) => storage.set(STORAGE_KEYS.TOKEN, token);
export const getToken = () => storage.get<string>(STORAGE_KEYS.TOKEN);
export const clearToken = () => storage.remove(STORAGE_KEYS.TOKEN);

export const setUserInfo = (userInfo: any) => storage.set(STORAGE_KEYS.USER_INFO, userInfo);
export const getUserInfo = () => storage.get(STORAGE_KEYS.USER_INFO);
export const clearUserInfo = () => storage.remove(STORAGE_KEYS.USER_INFO);

export const setFamilyInfo = (familyInfo: any) => storage.set(STORAGE_KEYS.FAMILY_INFO, familyInfo);
export const getFamilyInfo = () => storage.get(STORAGE_KEYS.FAMILY_INFO);
export const clearFamilyInfo = () => storage.remove(STORAGE_KEYS.FAMILY_INFO);

export const setAppSettings = (settings: any) => storage.set(STORAGE_KEYS.APP_SETTINGS, settings);
export const getAppSettings = () => storage.get(STORAGE_KEYS.APP_SETTINGS, {
  theme: 'light',
  language: 'zh-CN',
  currency: 'CNY',
  notifications: {
    recordChanges: true,
    budgetAlerts: true,
    memberActivities: true
  },
  privacy: {
    showAmountInList: true,
    requirePasswordForReports: false
  }
});

// 清除所有用户相关数据
export const clearUserData = () => {
  clearToken();
  clearUserInfo();
  clearFamilyInfo();
  storage.clearCache();
  storage.clearAllDrafts();
};

export default storage;
