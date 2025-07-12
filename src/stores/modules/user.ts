// 用户状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { User, UserRole } from '../../types/business';
import { AuthAPI, UserAPI } from '../../types/api';
import request from '../../utils/request';
import { clearUserData } from '../../utils/storage';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null);
  const token = ref('');
  const isLoggedIn = ref(false);
  const isLoading = ref(false);

  // 计算属性
  const userRole = computed(() => user.value?.role || UserRole.MEMBER);
  const isAdmin = computed(() => userRole.value === UserRole.ADMIN);
  const isMember = computed(() => userRole.value === UserRole.MEMBER);
  const isObserver = computed(() => userRole.value === UserRole.OBSERVER);
  const hasFamily = computed(() => !!user.value?.familyId);

  // 初始化用户状态
  const initUserState = () => {
    const savedToken = Taro.getStorageSync('token');
    const savedUser = Taro.getStorageSync('userInfo');
    
    if (savedToken && savedUser) {
      token.value = savedToken;
      if (savedUser && typeof savedUser === 'object' && 'id' in savedUser) {
        user.value = savedUser;
      }
      isLoggedIn.value = true;
      request.token = savedToken;
    }
  };

  // 微信登录
  const login = async (userInfo) => {
    try {
      isLoading.value = true;

      // 获取微信登录code
      const loginResult = await Taro.login();
      if (!loginResult.code) {
        throw new Error('获取微信登录code失败');
      }

      // 调用登录接口
      const response = await request.post('/api/auth/wechat-login', {
        code: loginResult.code,
        userInfo: userInfo
      });

      if (response.data) {
        const { token: newToken, user: userInfo, family } = response.data;
        
        // 保存token和用户信息
        token.value = newToken;
        user.value = userInfo;
        isLoggedIn.value = true;
        
        // 只用 Taro API 存储
        Taro.setStorageSync('token', newToken);
        Taro.setStorageSync('userInfo', userInfo);
        request.token = newToken;

        // 如果有家庭信息，触发家庭store更新
        if (family) {
          const { useFamilyStore } = await import('./family');
          const familyStore = useFamilyStore();
          familyStore.setFamily(family);
        } else if (userInfo.familyId) {
          // 如果用户有家庭ID但没有家庭信息，主动获取家庭信息
          try {
            const { useFamilyStore } = await import('./family');
            const familyStore = useFamilyStore();
            await familyStore.getFamilyInfo();
          } catch (error) {
            console.error('获取家庭信息失败:', error);
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取用户信息
  const getUserProfile = async () => {
    try {
      const response = await request.get('/api/user/profile');
      
      if (response.data?.user) {
        user.value = response.data.user;
        Taro.setStorageSync('userInfo', response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Get user profile error:', error);
      return false;
    }
  };

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true;

      const response = await request.put('/api/user/profile', profileData);
      
      if (response.data?.user) {
        user.value = response.data.user;
        Taro.setStorageSync('userInfo', response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      Taro.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取微信用户信息
  const getWechatUserInfo = async () => {
    try {
      // 获取用户信息
      const userInfo = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      });

      return {
        nickName: userInfo.userInfo.nickName,
        avatarUrl: userInfo.userInfo.avatarUrl
      };
    } catch (error) {
      console.error('Get wechat user info error:', error);
      
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        Taro.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      }
      
      return null;
    }
  };

  // 刷新token
  const refreshToken = async () => {
    try {
      const currentToken = Taro.getStorageSync('token');
      if (!currentToken) {
        return false;
      }

      const response = await request.post('/api/auth/refresh', {
        token: currentToken
      });

      if (response.data) {
        const { token: newToken } = response.data;
        token.value = newToken;
        Taro.setStorageSync('token', newToken);
        request.token = newToken;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      // token刷新失败，清除登录状态
      logout();
      return false;
    }
  };

  // 检查登录状态
  const checkLoginStatus = async () => {
    if (!isLoggedIn.value || !token.value) {
      return false;
    }

    try {
      // 尝试刷新token来验证token有效性，而不是获取用户信息
      return await refreshToken();
    } catch (error) {
      // token无效，清除登录状态
      logout();
      return false;
    }
  };

  // 登出
  const logout = () => {
    user.value = null;
    token.value = '';
    isLoggedIn.value = false;
    
    // 清除所有本地数据
    clearUserData();
    request.clearToken();

    // 清除其他store的数据
    const { useFamilyStore } = require('./family');
    const { useRecordStore } = require('./record');
    const { useCategoryStore } = require('./category');
    
    const familyStore = useFamilyStore();
    const recordStore = useRecordStore();
    const categoryStore = useCategoryStore();
    
    familyStore.$reset();
    recordStore.$reset();
    categoryStore.$reset();

    // 跳转到登录页
    Taro.reLaunch({
      url: '/pages/login/index'
    });
  };

  // 检查权限
  const hasPermission = (permission) => {
    if (!user.value || !hasFamily.value) {
      return false;
    }

    // 管理员拥有所有权限
    if (isAdmin.value) {
      return true;
    }

    // 观察员只有查看权限
    if (isObserver.value) {
      return permission.startsWith('view') || permission.startsWith('read');
    }

    // 普通成员的权限根据家庭设置决定
    // 这里可以根据实际需求扩展权限检查逻辑
    return true;
  };

  // 更新用户角色
  const updateUserRole = (newRole) => {
    if (user.value) {
      user.value.role = newRole;
      Taro.setStorageSync('userInfo', user.value);
    }
  };

  // 设置用户信息（用于其他store调用）
  const setUser = (userInfo) => {
    user.value = userInfo;
    Taro.setStorageSync('userInfo', userInfo);
  };

  // 兼容页面调用的 getUserInfo
  const getUserInfo = async () => {
    if (user.value) return user.value
    return null
  }

  // 兼容页面调用的 updateUserInfo
  const updateUserInfo = async (profileData) => {
    return await updateProfile(profileData)
  }

  return {
    // 状态
    user,
    token,
    isLoggedIn,
    isLoading,
    
    // 计算属性
    userRole,
    isAdmin,
    isMember,
    isObserver,
    hasFamily,
    
    // 方法
    initUserState,
    login,
    logout,
    getUserProfile,
    updateProfile,
    getWechatUserInfo,
    refreshToken,
    checkLoginStatus,
    hasPermission,
    updateUserRole,
    setUser,
    getUserInfo,
    updateUserInfo
  };
});
