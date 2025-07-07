// 用户状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { User, UserRole } from '../../types/business';
import { AuthAPI, UserAPI } from '../../types/api';
import request from '../../utils/request';
import { setToken, getToken, clearToken, setUserInfo, getUserInfo, clearUserData } from '../../utils/storage';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string>('');
  const isLoggedIn = ref<boolean>(false);
  const isLoading = ref<boolean>(false);

  // 计算属性
  const userRole = computed(() => user.value?.role || UserRole.MEMBER);
  const isAdmin = computed(() => userRole.value === UserRole.ADMIN);
  const isMember = computed(() => userRole.value === UserRole.MEMBER);
  const isObserver = computed(() => userRole.value === UserRole.OBSERVER);
  const hasFamily = computed(() => !!user.value?.familyId);

  // 初始化用户状态
  const initUserState = () => {
    const savedToken = getToken();
    const savedUser = getUserInfo();
    
    if (savedToken && savedUser) {
      token.value = savedToken;
      user.value = savedUser;
      isLoggedIn.value = true;
      request.setToken(savedToken);
    }
  };

  // 微信登录
  const login = async (): Promise<boolean> => {
    try {
      isLoading.value = true;

      // 获取微信登录code
      const loginResult = await Taro.login();
      if (!loginResult.code) {
        throw new Error('获取微信登录code失败');
      }

      // 调用登录接口
      const response = await request.post<AuthAPI.LoginResponse>('/auth/login', {
        code: loginResult.code
      });

      if (response.data) {
        const { token: newToken, user: userInfo, family } = response.data;
        
        // 保存token和用户信息
        token.value = newToken;
        user.value = userInfo;
        isLoggedIn.value = true;
        
        setToken(newToken);
        setUserInfo(userInfo);
        request.setToken(newToken);

        // 如果有家庭信息，触发家庭store更新
        if (family) {
          const { useFamilyStore } = await import('./family');
          const familyStore = useFamilyStore();
          familyStore.setFamily(family);
        }

        return true;
      }

      return false;
    } catch (error: any) {
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
  const getUserProfile = async (): Promise<boolean> => {
    try {
      const response = await request.get<UserAPI.GetProfileResponse>('/user/profile');
      
      if (response.data?.user) {
        user.value = response.data.user;
        setUserInfo(response.data.user);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Get user profile error:', error);
      return false;
    }
  };

  // 更新用户信息
  const updateProfile = async (profileData: {
    nickName?: string;
    avatarUrl?: string;
  }): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.put<UserAPI.UpdateProfileResponse>('/user/profile', profileData);
      
      if (response.data?.user) {
        user.value = response.data.user;
        setUserInfo(response.data.user);
        
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
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
  const getWechatUserInfo = async (): Promise<{
    nickName: string;
    avatarUrl: string;
  } | null> => {
    try {
      // 获取用户信息
      const userInfo = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      });

      return {
        nickName: userInfo.userInfo.nickName,
        avatarUrl: userInfo.userInfo.avatarUrl
      };
    } catch (error: any) {
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
  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        return false;
      }

      const response = await request.post<AuthAPI.RefreshTokenResponse>('/auth/refresh', {
        refreshToken: currentToken
      });

      if (response.data) {
        const { token: newToken } = response.data;
        token.value = newToken;
        setToken(newToken);
        request.setToken(newToken);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      // token刷新失败，清除登录状态
      logout();
      return false;
    }
  };

  // 检查登录状态
  const checkLoginStatus = async (): Promise<boolean> => {
    if (!isLoggedIn.value || !token.value) {
      return false;
    }

    try {
      // 尝试获取用户信息来验证token有效性
      const success = await getUserProfile();
      if (!success) {
        // 尝试刷新token
        return await refreshToken();
      }
      return true;
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
  const hasPermission = (permission: string): boolean => {
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
  const updateUserRole = (newRole: UserRole) => {
    if (user.value) {
      user.value.role = newRole;
      setUserInfo(user.value);
    }
  };

  // 设置用户信息（用于其他store调用）
  const setUser = (userInfo: User) => {
    user.value = userInfo;
    setUserInfo(userInfo);
  };

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
    setUser
  };
});
