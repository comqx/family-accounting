import { createApp } from 'vue'
import Taro from '@tarojs/taro'
import pinia from './stores'
import { useUserStore, useAppStore } from './stores'

import './app.scss'

const App = createApp({
  onLaunch(options) {
    console.log('App onLaunch', options);

    try {
      const userStore = useUserStore();
      userStore.initUserState();

      // 初始化应用设置
      const appStore = useAppStore();
      appStore.initAppSettings();

      // 检查更新
      this.checkUpdate();

      // 设置全局错误处理
      this.setupGlobalErrorHandler();

    } catch (error) {
      console.error('Init app error:', error);
    }
  },

  async onShow() {
    const userStore = useUserStore();
    
    if (userStore.isLoggedIn) {
      // 验证token有效性
      const isValid = await userStore.checkLoginStatus();

      if (!isValid) {
        // token无效，跳转到登录页
        Taro.reLaunch({
          url: '/pages/login/index'
        });
      }
    }
  },

  checkUpdate() {
    if (process.env.NODE_ENV === 'production') {
      const updateManager = Taro.getUpdateManager();

      updateManager.onCheckForUpdate((res) => {
        console.log('检查更新结果:', res);
      });

      updateManager.onUpdateReady(() => {
        Taro.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败');
        Taro.showToast({
          title: '更新失败',
          icon: 'none'
        });
      });
    }
  },

  setupGlobalErrorHandler() {
    // 设置全局错误处理
    Taro.onError((error) => {
      console.error('全局错误:', error);
    });
  }
});

// 使用Pinia
App.use(pinia);

export default App;
