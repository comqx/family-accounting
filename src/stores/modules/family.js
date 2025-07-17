// 家庭状态管理
//
// 负责管理全局家庭信息、成员、预算、权限等相关状态，
// 提供家庭创建/加入/解散、成员管理、预算设置、权限校验等核心方法。
//
// 依赖 Pinia 状态管理，Taro 本地存储，统一 API 请求工具。
//
// 典型调用场景：
// - 用户登录后自动恢复家庭信息
// - 家庭创建/加入/解散等操作
// - 家庭成员增删改查、角色变更
// - 预算设置与获取、分类预算管理
// - 业务操作前校验家庭和成员权限

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import { setFamilyInfo, clearFamilyInfo } from '../../utils/storage';

/**
 * 家庭 Pinia Store
 * @description 管理全局家庭信息、成员、预算、权限等状态，支持家庭创建/加入/解散、成员管理、预算设置、权限校验等。
 */
export const useFamilyStore = defineStore('family', () => {
  /**
   * 当前家庭信息（未加入为 null）
   * @type {object|null}
   */
  const family = ref(null);
  /**
   * 当前家庭成员列表
   * @type {Array}
   */
  const members = ref([]);
  /**
   * 是否处于加载/请求中
   * @type {boolean}
   */
  const isLoading = ref(false);

  /**
   * 是否已加入家庭
   * @returns {boolean}
   */
  const hasFamily = computed(() => !!family.value);
  /**
   * 当前家庭ID
   * @returns {string}
   */
  const familyId = computed(() => family.value?.id || '');
  /**
   * 当前家庭名称
   * @returns {string}
   */
  const familyName = computed(() => family.value?.name || '');

  /**
   * 是否为当前家庭管理员
   * @returns {boolean}
   */
  const isAdmin = computed(() => {
    const { useUserStore } = require('./user');
    const userStore = useUserStore();
    if (!userStore.user || !family.value) {
      return false;
    }
    // 检查家庭信息中的 role 字段
    if (family.value.role === 'owner' || family.value.role === 'admin') {
      return true;
    }
    // 检查用户ID是否匹配 adminId
    if (userStore.user.id === family.value.adminId) {
      return true;
    }
    // 检查成员列表中的角色
    const currentMember = members.value.find(member => member.id === userStore.user.id);
    if (currentMember && (currentMember.role === 'owner' || currentMember.role === 'admin')) {
      return true;
    }
    return false;
  });

  /**
   * 家庭成员总数
   * @returns {number}
   */
  const memberCount = computed(() => members.value.length);
  /**
   * 管理员成员对象
   */
  const adminMember = computed(() => 
    members.value.find(member => member.id === family.value?.adminId)
  );
  /**
   * 普通成员列表
   */
  const regularMembers = computed(() => 
    members.value.filter(member => member.role === 'MEMBER')
  );
  /**
   * 观察员成员列表
   */
  const observers = computed(() => 
    members.value.filter(member => member.role === 'OBSERVER')
  );

  /**
   * 家庭预算信息
   * @type {object|null}
   */
  const budget = ref(null)

  /**
   * 获取家庭预算
   * @param {number} year
   * @param {number} month
   * @returns {Promise<object|null>}
   */
  const getBudget = async (year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
    if (!family.value?.id) return null
    try {
      isLoading.value = true
      const response = await request.get(`/api/budget/${family.value.id}`, { year, month })
      if (response.success && response.data) {
        budget.value = {
          amount: response.data.monthlyBudget,
          used: response.data.totalExpense,
          remaining: response.data.remainingBudget,
          progress: response.data.budgetProgress,
          alerts_enabled: response.data.budgetAlerts,
          alert_threshold: response.data.alertThreshold,
          daily_budget: response.data.dailyBudget
        }
        return budget.value
      }
      return null
    } catch (error) {
      console.error('获取预算失败:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 设置家庭预算
   * @param {object} param0
   * @returns {Promise<boolean>}
   */
  const setBudget = async ({ year = new Date().getFullYear(), month = new Date().getMonth() + 1, amount, alerts_enabled = true, alert_threshold = 80 }) => {
    if (!family.value?.id) throw new Error('未加入家庭')
    try {
      isLoading.value = true
      const response = await request.post(`/api/budget/${family.value.id}`, {
        year,
        month,
        amount,
        alertsEnabled: alerts_enabled,
        alertThreshold: alert_threshold
      })
      if (response.success) {
        await getBudget(year, month)
        return true
      }
      throw new Error(response.error || '设置预算失败')
    } catch (error) {
      console.error('设置预算失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取分类预算
   * @param {number} year
   * @param {number} month
   * @returns {Promise<Array>}
   */
  const getCategoryBudgets = async (year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
    if (!family.value?.id) return []
    try {
      isLoading.value = true
      const response = await request.get(`/api/budget/${family.value.id}/categories`, { year, month })
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(cat => ({
          id: cat.categoryId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          budget: cat.budget,
          used: cat.used,
          remaining: cat.remaining,
          progress: cat.progress
        }))
      }
      return []
    } catch (error) {
      console.error('获取分类预算失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 设置分类预算
   * @param {object} param0
   * @returns {Promise<boolean>}
   */
  const setCategoryBudget = async ({ category_id, year = new Date().getFullYear(), month = new Date().getMonth() + 1, amount }) => {
    if (!family.value?.id) throw new Error('未加入家庭')
    try {
      isLoading.value = true
      const response = await request.post(`/api/budget/${family.value.id}/categories`, {
        categoryId: category_id,
        year,
        month,
        amount
      })
      if (response.success) {
        return true
      }
      throw new Error(response.error || '设置分类预算失败')
    } catch (error) {
      console.error('设置分类预算失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取预算历史
   * @returns {Promise<Array>}
   */
  const getBudgetHistory = async () => {
    if (!family.value?.id) return []
    try {
      isLoading.value = true
      const response = await request.get(`/api/budget/${family.value.id}/history`)
      if (response.success && Array.isArray(response.data)) {
        return response.data
      }
      return []
    } catch (error) {
      console.error('获取预算历史失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 初始化家庭状态（从本地存储恢复）
   */
  const initFamilyState = () => {
    const { getFamilyInfo } = require('../../utils/storage');
    const savedFamily = getFamilyInfo();
    if (savedFamily) {
      if (savedFamily && typeof savedFamily === 'object' && 'id' in savedFamily) {
        family.value = savedFamily;
      }
    }
  };

  /**
   * 创建家庭
   * @param {object} familyData
   * @returns {Promise<boolean>}
   */
  const createFamily = async (familyData) => {
    console.log('[FamilyStore] createFamily called', familyData)
    try {
      isLoading.value = true;

      const response = await request.post('/api/family/create', familyData);

      if (response.data?.family) {
        family.value = response.data.family;
        setFamilyInfo(response.data.family);
        
        // 更新用户信息
        const { useUserStore } = require('./user');
        const userStore = useUserStore();
        if (userStore.user) {
          userStore.user.familyId = response.data.family.id;
          userStore.user.role = 'ADMIN';
          userStore.setUser(userStore.user);
        }

        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Create family error:', error);
      Taro.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 加入家庭
   * @param {string} inviteCode
   * @returns {Promise<boolean>}
   */
  const joinFamily = async (inviteCode) => {
    try {
      isLoading.value = true;

      const response = await request.post('/api/family/join', {
        inviteCode
      });

      if (response.data?.family) {
        family.value = response.data.family;
        setFamilyInfo(response.data.family);
        
        // 更新用户信息
        const { useUserStore } = require('./user');
        const userStore = useUserStore();
        if (userStore.user) {
          userStore.user.familyId = response.data.family.id;
          userStore.user.role = 'MEMBER';
          userStore.setUser(userStore.user);
        }

        Taro.showToast({
          title: '加入成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Join family error:', error);
      Taro.showToast({
        title: error.message || '加入失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取家庭信息（从后端）
   * @returns {Promise<boolean>}
   */
  const getFamilyInfo = async () => {
    try {
      const response = await request.get('/api/family/list');

      if (response.data && response.data.length > 0) {
        family.value = response.data[0];
        setFamilyInfo(response.data[0]);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Get family info error:', error);
      return false;
    }
  };

  /**
   * 更新家庭信息
   * @param {object} familyData
   * @returns {Promise<boolean>}
   */
  const updateFamily = async (familyData) => {
    try {
      isLoading.value = true;

      const response = await request.put(`/api/family/${family.value?.id}`, familyData);

      if (response.data) {
        family.value = response.data;
        setFamilyInfo(response.data);
        
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Update family error:', error);
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
   * 加载家庭成员列表
   * @returns {Promise<boolean>}
   */
  const loadMembers = async () => {
    try {
      const response = await request.get(`/api/family/${family.value?.id}/members`);

      if (response.data) {
        members.value = response.data;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Load members error:', error);
      return false;
    }
  };

  /**
   * 生成家庭邀请码
   * @returns {Promise<string>}
   */
  const generateInviteCode = async () => {
    try {
      const response = await request.post(`/api/family/${family.value?.id}/invite`);

      if (response.success) {
        return response;
      }

      return { success: false };
    } catch (error) {
      console.error('Generate invite code error:', error);
      throw error;
    }
  };

  /**
   * 邀请成员加入家庭
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<boolean>}
   */
  const inviteMember = async (userId, role = 'MEMBER') => {
    try {
      const response = await request.post(`/api/family/${family.value?.id}/invite`, {
        userId,
        role
      });

      if (response.data) {
        Taro.showToast({
          title: '邀请成功',
          icon: 'success'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Invite member error:', error);
      Taro.showToast({
        title: error.message || '邀请失败',
        icon: 'none'
      });
      return false;
    }
  };

  /**
   * 移除家庭成员
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  const removeMember = async (userId) => {
    try {
      const response = await request.delete(`/api/family/${family.value?.id}/members/${userId}`);

      if (response.data) {
        Taro.showToast({
          title: '移除成功',
          icon: 'success'
        });
        
        // 重新加载成员列表
        await loadMembers();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Remove member error:', error);
      Taro.showToast({
        title: error.message || '移除失败',
        icon: 'none'
      });
      return false;
    }
  };

  /**
   * 更新成员角色
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<boolean>}
   */
  const updateMemberRole = async (userId, role) => {
    try {
      const response = await request.put(`/api/family/${family.value?.id}/members/${userId}/role`, {
        role
      });

      if (response.data) {
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        // 重新加载成员列表
        await loadMembers();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Update member role error:', error);
      Taro.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
      return false;
    }
  };

  /**
   * 退出家庭
   * @returns {Promise<boolean>}
   */
  const leaveFamily = async () => {
    try {
      const response = await request.post(`/api/family/${family.value?.id}/leave`);

      if (response.data) {
        // 清除家庭信息
        family.value = null;
        members.value = [];
        clearFamilyInfo();
        
        // 更新用户信息
        const { useUserStore } = require('./user');
        const userStore = useUserStore();
        if (userStore.user) {
          userStore.user.familyId = null;
          userStore.user.role = null;
          userStore.setUser(userStore.user);
        }

        Taro.showToast({
          title: '已离开家庭',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Leave family error:', error);
      Taro.showToast({
        title: error.message || '离开失败',
        icon: 'none'
      });
      return false;
    }
  };

  /**
   * 解散家庭
   * @returns {Promise<boolean>}
   */
  const dissolveFamily = async () => {
    try {
      const response = await request.delete(`/api/family/${family.value?.id}`);

      if (response.data) {
        // 清除家庭信息
        family.value = null;
        members.value = [];
        clearFamilyInfo();
        
        // 更新用户信息
        const { useUserStore } = require('./user');
        const userStore = useUserStore();
        if (userStore.user) {
          userStore.user.familyId = null;
          userStore.user.role = null;
          userStore.setUser(userStore.user);
        }

        Taro.showToast({
          title: '家庭已解散',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Dissolve family error:', error);
      Taro.showToast({
        title: error.message || '解散失败',
        icon: 'none'
      });
      return false;
    }
  };

  /**
   * 设置家庭信息（供其他 store 调用）
   * @param {object} familyInfo
   */
  const setFamily = (familyInfo) => {
    family.value = familyInfo;
    setFamilyInfo(familyInfo);
  };

  /**
   * 检查成员权限
   * @param {string} userId
   * @param {string} permission
   * @returns {boolean}
   */
  const checkMemberPermission = (userId, permission) => {
    if (!family.value || !members.value.length) {
      return false;
    }

    const member = members.value.find(m => m.id === userId);
    if (!member) {
      return false;
    }

    // 管理员拥有所有权限
    if (member.role === 'owner' || member.role === 'admin') {
      return true;
    }

    // 观察员只有查看权限
    if (member.role === 'observer') {
      return permission.startsWith('view') || permission.startsWith('read');
    }

    // 普通成员的权限根据家庭设置决定
    return true;
  };

  /**
   * 重置家庭状态
   */
  const $reset = () => {
    family.value = null;
    members.value = [];
    isLoading.value = false;
  };

  return {
    // 状态
    family,
    members,
    isLoading,
    
    // 计算属性
    hasFamily,
    familyId,
    familyName,
    isAdmin,
    memberCount,
    adminMember,
    regularMembers,
    observers,
    budget,
    
    // 方法
    initFamilyState,
    createFamily,
    joinFamily,
    getFamilyInfo,
    updateFamily,
    loadMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    leaveFamily,
    dissolveFamily,
    setFamily,
    checkMemberPermission,
    getBudget,
    setBudget,
    getCategoryBudgets,
    setCategoryBudget,
    getBudgetHistory,
    generateInvite: generateInviteCode,
    $reset
  };
}, {
  persist: {
    paths: ['family']
  }
}); 