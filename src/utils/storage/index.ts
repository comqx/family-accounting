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
};

// 存储项类型 - 使用JSDoc注释
/**
 * @typedef {Object} StorageItem
 * @property {*} data - 存储的数据
 * @property {number} timestamp - 时间戳
 * @property {number} [expireTime] - 过期时间
 */

class StorageManager {
  // 设置存储项
  set(key, value, expireTime) {
    try {
      const item = {
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
  get(key, defaultValue) {
    try {
      const item = Taro.getStorageSync(key);
      
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
  remove(key) {
    try {
      Taro.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  // 清空所有存储
  clear() {
    try {
      Taro.clearStorageSync();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // 获取所有存储键
  getAllKeys() {
    try {
      const info = Taro.getStorageInfoSync();
      return info.keys;
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }

  // 获取存储信息
  getInfo() {
    try {
      return Taro.getStorageInfoSync();
    } catch (error) {
      console.error('Storage getInfo error:', error);
      return { keys: [], currentSize: 0, limitSize: 0 };
    }
  }

  // 检查存储项是否存在
  has(key) {
    try {
      const item = Taro.getStorageSync(key);
      return item !== undefined && item !== null && item !== '';
    } catch (error) {
      return false;
    }
  }

  // 设置缓存（带过期时间）
  setCache(key, value, expireMinutes = 30) {
    const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
    const expireTime = expireMinutes * 60 * 1000; // 转换为毫秒
    return this.set(cacheKey, value, expireTime);
  }

  // 获取缓存
  getCache(key, defaultValue) {
    const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
    return this.get(cacheKey, defaultValue);
  }

  // 清除所有缓存
  clearCache() {
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
  setDraft(key, value) {
    const draftKey = STORAGE_KEYS.DRAFT_PREFIX + key;
    return this.set(draftKey, value);
  }

  // 获取草稿
  getDraft(key, defaultValue) {
    const draftKey = STORAGE_KEYS.DRAFT_PREFIX + key;
    return this.get(draftKey, defaultValue);
  }

  // 清除草稿
  clearDraft(key) {
    const draftKey = STORAGE_KEYS.DRAFT_PREFIX + key;
    return this.remove(draftKey);
  }

  // 清除所有草稿
  clearAllDrafts() {
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
export function setToken(token) {
  return storage.set(STORAGE_KEYS.TOKEN, token);
}

export function getToken() {
  return storage.get(STORAGE_KEYS.TOKEN);
}

export function clearToken() {
  return storage.remove(STORAGE_KEYS.TOKEN);
}

export function setUserInfo(userInfo) {
  return storage.set(STORAGE_KEYS.USER_INFO, userInfo);
}

export function getUserInfo() {
  return storage.get(STORAGE_KEYS.USER_INFO);
}

export function clearUserInfo() {
  return storage.remove(STORAGE_KEYS.USER_INFO);
}

export function setFamilyInfo(familyInfo) {
  return storage.set(STORAGE_KEYS.FAMILY_INFO, familyInfo);
}

export function getFamilyInfo() {
  return storage.get(STORAGE_KEYS.FAMILY_INFO);
}

export function clearFamilyInfo() {
  return storage.remove(STORAGE_KEYS.FAMILY_INFO);
}

export function setAppSettings(settings) {
  return storage.set(STORAGE_KEYS.APP_SETTINGS, settings);
}

export function getAppSettings() {
  return storage.get(STORAGE_KEYS.APP_SETTINGS, {
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
}

export function clearAppSettings() {
  return storage.remove(STORAGE_KEYS.APP_SETTINGS);
}

// 清除所有用户数据
export const clearUserData = () => {
  clearToken();
  clearUserInfo();
  clearFamilyInfo();
  clearAppSettings();
  storage.clearCache();
  storage.clearAllDrafts();
};

// 导出存储管理器实例
export default storage;
