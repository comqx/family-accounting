// 应用状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { AppSettings } from '../../types/business';
import { getAppSettings, setAppSettings } from '../../utils/storage';

export const useAppStore = defineStore('app', () => {
  // 状态
  const settings = ref<AppSettings>({
    theme: 'auto',
    language: 'zh-CN',
    autoBackup: true,
    notificationEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true
  });

  const systemInfo = ref<Taro.getSystemInfoSync.Result | null>(null);
  const networkType = ref<string>('unknown');
  const isOnline = ref<boolean>(true);
  const loading = ref<boolean>(false);
  const globalError = ref<string>('');

  // 计算属性
  const isDarkMode = computed(() => settings.value.theme === 'dark');
  const isIOS = computed(() => systemInfo.value?.platform === 'ios');
  const isAndroid = computed(() => systemInfo.value?.platform === 'android');
  const statusBarHeight = computed(() => systemInfo.value?.statusBarHeight || 0);
  const safeAreaTop = computed(() => systemInfo.value?.safeArea?.top || 0);
  const safeAreaBottom = computed(() => systemInfo.value?.safeArea?.bottom || 0);

  // 初始化应用设置
  const initAppSettings = () => {
    // 加载保存的设置
    const savedSettings = getAppSettings();
    if (savedSettings) {
      settings.value = {
        ...settings.value,
        ...savedSettings
      };
    }

    // 获取系统信息
    getSystemInfo();

    // 监听网络状态
    watchNetworkStatus();

    // 设置主题
    setTheme(settings.value.theme);
  };

  // 获取系统信息
  const getSystemInfo = () => {
    try {
      const info = Taro.getSystemInfoSync();
      systemInfo.value = info;
      
      // 根据系统主题设置默认主题
      if (settings.value.theme === 'auto') {
        const isDark = info.theme === 'dark';
        setTheme(isDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Get system info error:', error);
    }
  };

  // 监听网络状态
  const watchNetworkStatus = () => {
    // 获取当前网络状态
    Taro.getNetworkType({
      success: (res) => {
        networkType.value = res.networkType;
        isOnline.value = res.networkType !== 'none';
      }
    });

    // 监听网络状态变化
    Taro.onNetworkStatusChange((res) => {
      networkType.value = res.networkType;
      isOnline.value = res.isConnected;
      
      if (!res.isConnected) {
        showToast('网络连接已断开', 'none');
      } else {
        showToast('网络连接已恢复', 'success');
      }
    });
  };

  // 更新设置
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
    setAppSettings(settings.value);

    // 如果更新了主题，立即应用
    if (newSettings.theme) {
      setTheme(newSettings.theme);
    }
  };

  // 设置主题
  const setTheme = (theme: string) => {
    let actualTheme = theme;

    if (theme === 'auto') {
      // 根据系统主题自动设置
      actualTheme = systemInfo.value?.theme === 'dark' ? 'dark' : 'light';
    }

    // 设置页面样式
    if (actualTheme === 'dark') {
      Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#000000'
      });
    } else {
      Taro.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
    }

    // 更新CSS变量
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', actualTheme);
    }
  };

  // 设置语言
  const setLanguage = (language: string) => {
    updateSettings({ language });

    // 这里可以集成国际化库
    // i18n.locale = language;
  };

  // 设置货币
  const setCurrency = (currency: string) => {
    updateSettings({ currency });
  };

  // 显示加载状态
  const showLoading = (title = '加载中...') => {
    loading.value = true;
    Taro.showLoading({ title });
  };

  // 隐藏加载状态
  const hideLoading = () => {
    loading.value = false;
    Taro.hideLoading();
  };

  // 显示提示
  const showToast = (title: string, icon: any = 'none', duration = 2000) => {
    Taro.showToast({
      title,
      icon,
      duration
    });
  };

  // 显示模态框
  const showModal = (options: any) => {
    return new Promise((resolve) => {
      Taro.showModal({
        title: options.title || '提示',
        content: options.content || '',
        showCancel: options.showCancel !== false,
        cancelText: options.cancelText || '取消',
        confirmText: options.confirmText || '确定',
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  };

  // 显示操作菜单
  const showActionSheet = (itemList: string[]) => {
    return new Promise((resolve, reject) => {
      Taro.showActionSheet({
        itemList,
        success: (res) => {
          resolve(res.tapIndex);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  };

  // 设置全局错误
  const setGlobalError = (error: string) => {
    globalError.value = error;
    if (error) {
      showToast(error, 'none');
    }
  };

  // 清除全局错误
  const clearGlobalError = () => {
    globalError.value = '';
  };

  // 检查权限
  const checkPermission = async (scope: string) => {
    try {
      const result = await Taro.getSetting();
      return result.authSetting[scope] === true;
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  };

  // 请求权限
  const requestPermission = async (scope: string) => {
    try {
      await Taro.authorize({ scope });
      return true;
    } catch (error) {
      console.error('Request permission error:', error);
      return false;
    }
  };

  // 打开设置页面
  const openSetting = () => {
    return new Promise((resolve) => {
      Taro.openSetting({
        success: () => {
          resolve(true);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await Taro.setClipboardData({ data: text });
      showToast('已复制到剪贴板', 'success');
      return true;
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      showToast('复制失败', 'none');
      return false;
    }
  };

  // 分享
  const share = (options: any) => {
    // 这个方法主要用于设置分享信息
    // 实际分享由页面的onShareAppMessage处理
    return {
      title: options.title || '家账通',
      path: options.path || '/pages/index/index',
      imageUrl: options.imageUrl || ''
    };
  };

  // 预览图片
  const previewImage = (urls: string[], current?: string) => {
    Taro.previewImage({
      urls,
      current
    });
  };

  // 保存图片到相册
  const saveImageToPhotosAlbum = async (filePath: string) => {
    try {
      // 检查权限
      const hasPermission = await checkPermission('scope.writePhotosAlbum');
      
      if (!hasPermission) {
        const granted = await requestPermission('scope.writePhotosAlbum');
        if (!granted) {
          const openSettings = await showModal({
            content: '需要相册权限才能保存图片，是否前往设置开启？'
          });

          if (openSettings) {
            await openSetting();
          }
          return false;
        }
      }

      await Taro.saveImageToPhotosAlbum({ filePath });
      showToast('保存成功', 'success');
      return true;
    } catch (error) {
      console.error('Save image error:', error);
      showToast('保存失败', 'none');
      return false;
    }
  };

  return {
    // 状态
    settings,
    systemInfo,
    networkType,
    isOnline,
    loading,
    globalError,

    // 计算属性
    isDarkMode,
    isIOS,
    isAndroid,
    statusBarHeight,
    safeAreaTop,
    safeAreaBottom,

    // 方法
    initAppSettings,
    updateSettings,
    setTheme,
    setLanguage,
    setCurrency,
    showLoading,
    hideLoading,
    showToast,
    showModal,
    showActionSheet,
    setGlobalError,
    clearGlobalError,
    checkPermission,
    requestPermission,
    openSetting,
    copyToClipboard,
    share,
    previewImage,
    saveImageToPhotosAlbum
  };
});
