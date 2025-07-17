// 用户状态管理
//
// 负责管理全局用户登录、认证、信息、权限等相关状态，
// 提供微信登录、用户信息获取与更新、token 刷新、权限校验、登出等核心方法。
//
// 依赖 Pinia 状态管理，Taro 本地存储，统一 API 请求工具。
//
// 典型调用场景：
// - 页面初始化时自动恢复登录态
// - 登录页调用 login 进行微信认证
// - 个人中心、设置页获取/更新用户信息
// - 业务操作前校验权限
// - 退出登录时清理所有本地和全局状态

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { User, UserRole } from '../../types/business';
import { AuthAPI, UserAPI } from '../../types/api';
import request from '../../utils/request';
import { clearUserData } from '../../utils/storage';

/**
 * 用户 Pinia Store
 * @description 管理全局用户认证、信息、权限等状态，支持微信登录、token 刷新、登出、权限校验等。
 */
export const useUserStore = defineStore('user', () => {
  /**
   * 当前登录用户信息（未登录为 null）
   * @type {import('../../types/business').User|null}
   */
  const user = ref<User | null>(null);
  /**
   * 当前用户 token
   * @type {string}
   */
  const token = ref('');
  /**
   * 是否已登录
   * @type {boolean}
   */
  const isLoggedIn = ref(false);
  /**
   * 是否处于加载/请求中
   * @type {boolean}
   */
  const isLoading = ref(false);

  /**
   * 当前用户角色
   * @returns {UserRole}
   */
  const userRole = computed(() => user.value?.role || UserRole.MEMBER);
  /**
   * 是否为管理员
   */
  const isAdmin = computed(() => userRole.value === UserRole.ADMIN);
  /**
   * 是否为普通成员
   */
  const isMember = computed(() => userRole.value === UserRole.MEMBER);
  /**
   * 是否为观察员
   */
  const isObserver = computed(() => userRole.value === UserRole.OBSERVER);
  /**
   * 是否已加入家庭
   */
  const hasFamily = computed(() => !!user.value?.familyId);

  /**
   * 初始化用户状态（从本地存储恢复登录态）
   * 页面/应用启动时调用
   */
  const initUserState = () => {
    const savedToken = Taro.getStorageSync('token');
    const savedUser = Taro.getStorageSync('userInfo');
    
    if (savedToken && savedUser) {
      token.value = savedToken;
      if (savedUser && typeof savedUser === 'object' && 'id' in savedUser) {
        user.value = savedUser;
      }
      isLoggedIn.value = true;
      request.setToken(savedToken); // 修正：通过 setToken 设置
    }
  };

  /**
   * 微信登录
   * @param {object} options - 支持 { code, userInfo }，避免重复调用 Taro.login
   * @returns {Promise<boolean>} 登录是否成功
   */
  const login = async (options = {}) => {
    /**
     * @typedef LoginOptions
     * @property {string} [code]      - 小程序登录凭证
     * @property {object} [userInfo]  - 用户信息（昵称、头像等，可选）
     */
    let { code: externalCode, userInfo } = options as any;
    // 兼容旧调用方式：若直接传入用户信息对象（含 nickName / avatarUrl），而非 { userInfo }
    if (!externalCode && !userInfo && options && typeof options === 'object') {
      const maybeProfile = options as any;
      if ('nickName' in maybeProfile || 'avatarUrl' in maybeProfile) {
        userInfo = maybeProfile;
      }
    }
    try {
      isLoading.value = true;

      // 如果外部未提供 code，则自行调用 Taro.login()
      let loginCode = externalCode;
      if (!loginCode) {
      const loginResult = await Taro.login();
      if (!loginResult.code) {
        throw new Error('获取微信登录code失败');
        }
        loginCode = loginResult.code;
      }

      // 调用登录接口
      const response = await request.post('/api/auth/wechat-login', {
        code: loginCode,
        userInfo: userInfo
      }, undefined);

      if (response.data) {
        const { token: newToken, user: userInfo, family } = response.data;
        
        // 保存token和用户信息
        token.value = newToken;
        user.value = userInfo;
        isLoggedIn.value = true;
        
        // 只用 Taro API 存储
        Taro.setStorageSync('token', newToken);
        Taro.setStorageSync('userInfo', userInfo);
        request.setToken(newToken); // 修正：通过 setToken 设置

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

  /**
   * 获取用户信息（从后端）
   * @returns {Promise<boolean>} 是否成功
   */
  const getUserProfile = async () => {
    try {
      const response = await request.get('/api/user/profile', undefined);
      
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

  /**
   * 更新用户信息（昵称、头像等）
   * @param {object} profileData
   * @returns {Promise<boolean>} 是否成功
   */
  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true;

      const response = await request.put('/api/user/profile', profileData, undefined);
      
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

  /**
   * 获取微信用户信息（弹窗授权）
   * @returns {Promise<{nickName: string, avatarUrl: string}|null>}
   */
  const getWechatUserInfo = async () => {
    console.log('[userStore] 准备调用 Taro.getUserProfile')
    try {
      const userInfo = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      });
      console.log('[userStore] getUserProfile 授权成功', userInfo)
      return {
        nickName: userInfo.userInfo.nickName,
        avatarUrl: userInfo.userInfo.avatarUrl
      };
    } catch (error) {
      console.error('[userStore] getUserProfile 授权失败', error)
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        Taro.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      }
      return null;
    }
  };

  /**
   * 刷新 token（自动续期）
   * @returns {Promise<boolean>} 是否成功
   */
  const refreshToken = async () => {
    try {
      const currentToken = Taro.getStorageSync('token');
      if (!currentToken) {
        return false;
      }

      const response = await request.post('/api/auth/refresh', {
        token: currentToken
      }, undefined);

      if (response.data) {
        const { token: newToken } = response.data;
        token.value = newToken;
        Taro.setStorageSync('token', newToken);
        request.setToken(newToken); // 修正：通过 setToken 设置
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

  /**
   * 检查登录状态（token 有效性）
   * @returns {Promise<boolean>} 是否有效
   */
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

  /**
   * 退出登录，清除所有本地和全局状态
   */
  const logout = () => {
    user.value = null;
    token.value = '';
    isLoggedIn.value = false;
    
    // 清除所有本地数据
    clearUserData();
    request.clearToken(); // 修正：通过 clearToken 清除

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

  /**
   * 检查当前用户是否有指定权限
   * @param {string} permission - 权限标识
   * @returns {boolean}
   */
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

  /**
   * 更新当前用户角色（本地）
   * @param {string} newRole
   */
  const updateUserRole = (newRole) => {
    if (user.value) {
      user.value.role = newRole;
      Taro.setStorageSync('userInfo', user.value);
    }
  };

  /**
   * 设置用户信息（供其他 store 调用）
   * @param {object} userInfo
   */
  const setUser = (userInfo) => {
    user.value = userInfo;
    Taro.setStorageSync('userInfo', userInfo);
  };

  /**
   * 兼容页面调用的 getUserInfo
   * @returns {Promise<object|null>}
   */
  const getUserInfo = async () => {
    if (user.value) return user.value
    return null
  }

  /**
   * 兼容页面调用的 updateUserInfo
   * @param {object} profileData
   * @returns {Promise<boolean>}
   */
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
}, {
  persist: {
    paths: ['user', 'token', 'isLoggedIn']
  } as any
});
