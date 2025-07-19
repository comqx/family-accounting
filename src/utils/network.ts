import Taro from '@tarojs/taro'

export interface NetworkStatus {
  isOnline: boolean
  type: 'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown'
  strength?: number
}

export interface OfflineData {
  key: string
  data: any
  timestamp: number
  expires?: number
}

/**
 * 检测网络状态
 */
export const getNetworkStatus = (): Promise<NetworkStatus> => {
  return new Promise((resolve) => {
    Taro.getNetworkType({
      success: (res) => {
        const isOnline = res.networkType !== 'none'
        resolve({
          isOnline,
          type: res.networkType as any,
          strength: isOnline ? 100 : 0
        })
      },
      fail: () => {
        resolve({
          isOnline: false,
          type: 'unknown'
        })
      }
    })
  })
}

/**
 * 监听网络状态变化
 */
export const onNetworkStatusChange = (callback: (status: NetworkStatus) => void) => {
  Taro.onNetworkStatusChange((res) => {
    const status: NetworkStatus = {
      isOnline: res.isConnected,
      type: res.networkType as any,
      strength: res.isConnected ? 100 : 0
    }
    callback(status)
  })
}

/**
 * 保存离线数据
 */
export const saveOfflineData = async (key: string, data: any, expires?: number): Promise<void> => {
  try {
    const offlineData: OfflineData = {
      key,
      data,
      timestamp: Date.now(),
      expires
    }

    await Taro.setStorage({
      key: `offline_${key}`,
      data: offlineData
    })
  } catch (error) {
    console.error('保存离线数据失败:', error)
  }
}

/**
 * 获取离线数据
 */
export const getOfflineData = async (key: string): Promise<any | null> => {
  try {
    const result = await Taro.getStorage({ key: `offline_${key}` })
    const offlineData: OfflineData = result.data

    // 检查是否过期
    if (offlineData.expires && Date.now() > offlineData.timestamp + offlineData.expires) {
      await Taro.removeStorage({ key: `offline_${key}` })
      return null
    }

    return offlineData.data
  } catch (error) {
    return null
  }
}

/**
 * 清理过期的离线数据
 */
export const cleanExpiredOfflineData = async (): Promise<void> => {
  try {
    const storageInfo = await Taro.getStorageInfo()
    const keys = (storageInfo as any).keys?.filter((key: string) => key.startsWith('offline_')) || []

    for (const key of keys) {
      try {
        const result = await Taro.getStorage({ key })
        const offlineData: OfflineData = result.data

        if (offlineData.expires && Date.now() > offlineData.timestamp + offlineData.expires) {
          await Taro.removeStorage({ key })
        }
      } catch (error) {
        // 忽略单个键的错误
      }
    }
  } catch (error) {
    console.error('清理过期离线数据失败:', error)
  }
}

/**
 * 检查是否有离线数据
 */
export const hasOfflineData = async (key: string): Promise<boolean> => {
  try {
    await Taro.getStorage({ key: `offline_${key}` })
    return true
  } catch (error) {
    return false
  }
}

/**
 * 显示网络状态提示
 */
export const showNetworkStatus = (status: NetworkStatus) => {
  if (!status.isOnline) {
    Taro.showToast({
      title: '网络连接已断开，部分功能可能受限',
      icon: 'none',
      duration: 3000
    })
  } else if (status.type === '2g' || status.type === '3g') {
    Taro.showToast({
      title: '当前网络较慢，建议使用WiFi',
      icon: 'none',
      duration: 2000
    })
  }
}

/**
 * 网络请求重试机制
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError!
}

/**
 * 离线优先的数据获取
 */
export const getDataWithOfflineFallback = async <T>(
  key: string,
  requestFn: () => Promise<T>,
  expires: number = 24 * 60 * 60 * 1000 // 默认24小时
): Promise<T> => {
  try {
    // 先尝试在线获取
    const networkStatus = await getNetworkStatus()
    
    if (networkStatus.isOnline) {
      const data = await requestFn()
      // 保存到离线缓存
      await saveOfflineData(key, data, expires)
      return data
    } else {
      // 离线时使用缓存数据
      const offlineData = await getOfflineData(key)
      if (offlineData) {
        Taro.showToast({
          title: '当前为离线模式，显示缓存数据',
          icon: 'none',
          duration: 2000
        })
        return offlineData
      } else {
        throw new Error('无可用数据')
      }
    }
  } catch (error) {
    // 在线请求失败，尝试使用离线数据
    const offlineData = await getOfflineData(key)
    if (offlineData) {
      Taro.showToast({
        title: '网络请求失败，显示缓存数据',
        icon: 'none',
        duration: 2000
      })
      return offlineData
    }
    throw error
  }
} 