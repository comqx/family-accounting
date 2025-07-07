// 家庭状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { Family, User, UserRole, FamilySettings } from '../../types/business';
import { FamilyAPI } from '../../types/api';
import request from '../../utils/request';
import { setFamilyInfo, getFamilyInfo, clearFamilyInfo } from '../../utils/storage';

export const useFamilyStore = defineStore('family', () => {
  // 状态
  const family = ref<Family | null>(null);
  const members = ref<User[]>([]);
  const isLoading = ref(false);

  // 计算属性
  const hasFamily = computed(() => !!family.value);
  const familyId = computed(() => family.value?.id || '');
  const familyName = computed(() => family.value?.name || '');
  const isAdmin = computed(() => {
    const { useUserStore } = require('./user');
    const userStore = useUserStore();
    return userStore.user?.id === family.value?.adminId;
  });

  const memberCount = computed(() => members.value.length);
  const adminMember = computed(() => 
    members.value.find(member => member.id === family.value?.adminId)
  );

  const regularMembers = computed(() => 
    members.value.filter(member => member.role === UserRole.MEMBER)
  );

  const observers = computed(() => 
    members.value.filter(member => member.role === UserRole.OBSERVER)
  );

  // 初始化家庭状态
  const initFamilyState = () => {
    const savedFamily = getFamilyInfo();
    if (savedFamily) {
      family.value = savedFamily;
    }
  };

  // 创建家庭
  const createFamily = async (familyData: {
    name: string;
    description?: string;
  }): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.post<FamilyAPI.CreateFamilyResponse>('/families', familyData);

      if (response.data?.family) {
        family.value = response.data.family;
        setFamilyInfo(response.data.family);
        
        // 更新用户信息
        const { useUserStore } = require('./user');
        const userStore = useUserStore();
        if (userStore.user) {
          userStore.user.familyId = response.data.family.id;
          userStore.user.role = UserRole.ADMIN;
          userStore.setUser(userStore.user);
        }

        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error: any) {
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

  // 加入家庭
  const joinFamily = async (inviteCode: string): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.post<FamilyAPI.JoinFamilyResponse>('/families/join', {
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
          userStore.user.role = UserRole.MEMBER;
          userStore.setUser(userStore.user);
        }

        Taro.showToast({
          title: '加入成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error: any) {
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

  // 获取家庭信息
  const getFamilyInfo = async (): Promise<boolean> => {
    try {
      const response = await request.get<FamilyAPI.GetFamilyResponse>('/families/current');

      if (response.data?.family) {
        family.value = response.data.family;
        setFamilyInfo(response.data.family);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Get family info error:', error);
      return false;
    }
  };

  // 更新家庭信息
  const updateFamily = async (familyData: {
    name?: string;
    description?: string;
    settings?: Partial<FamilySettings>;
  }): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.put<FamilyAPI.UpdateFamilyResponse>('/families/current', familyData);

      if (response.data?.family) {
        family.value = response.data.family;
        setFamilyInfo(response.data.family);
        
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error: any) {
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

  // 获取家庭成员
  const loadMembers = async (): Promise<boolean> => {
    try {
      const response = await request.get<FamilyAPI.GetMembersResponse>('/families/members');

      if (response.data?.members) {
        members.value = response.data.members;
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Load members error:', error);
      return false;
    }
  };

  // 邀请成员
  const inviteMember = async (userId: string, role: UserRole = UserRole.MEMBER): Promise<{
    inviteCode: string;
    expireTime: Date;
  } | null> => {
    try {
      isLoading.value = true;

      const response = await request.post<FamilyAPI.InviteMemberResponse>('/families/invite', {
        userId,
        role
      });

      if (response.data) {
        return {
          inviteCode: response.data.inviteCode,
          expireTime: response.data.expireTime
        };
      }

      return null;
    } catch (error: any) {
      console.error('Invite member error:', error);
      Taro.showToast({
        title: error.message || '邀请失败',
        icon: 'none'
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 移除成员
  const removeMember = async (userId: string): Promise<boolean> => {
    try {
      isLoading.value = true;

      await request.post('/families/remove-member', {
        userId
      });

      // 从本地成员列表中移除
      const index = members.value.findIndex(member => member.id === userId);
      if (index !== -1) {
        members.value.splice(index, 1);
      }

      Taro.showToast({
        title: '移除成功',
        icon: 'success'
      });
      
      return true;
    } catch (error: any) {
      console.error('Remove member error:', error);
      Taro.showToast({
        title: error.message || '移除失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新成员角色
  const updateMemberRole = async (userId: string, role: UserRole): Promise<boolean> => {
    try {
      isLoading.value = true;

      await request.put('/families/member-role', {
        userId,
        role
      });

      // 更新本地成员信息
      const member = members.value.find(m => m.id === userId);
      if (member) {
        member.role = role;
      }

      Taro.showToast({
        title: '更新成功',
        icon: 'success'
      });
      
      return true;
    } catch (error: any) {
      console.error('Update member role error:', error);
      Taro.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 离开家庭
  const leaveFamily = async (): Promise<boolean> => {
    try {
      isLoading.value = true;

      await request.post('/families/leave');

      // 清除家庭信息
      family.value = null;
      members.value = [];
      clearFamilyInfo();

      // 更新用户信息
      const { useUserStore } = require('./user');
      const userStore = useUserStore();
      if (userStore.user) {
        userStore.user.familyId = undefined;
        userStore.user.role = UserRole.MEMBER;
        userStore.setUser(userStore.user);
      }

      Taro.showToast({
        title: '已离开家庭',
        icon: 'success'
      });
      
      return true;
    } catch (error: any) {
      console.error('Leave family error:', error);
      Taro.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 解散家庭（仅管理员）
  const dissolveFamily = async (): Promise<boolean> => {
    try {
      isLoading.value = true;

      await request.delete('/families/current');

      // 清除家庭信息
      family.value = null;
      members.value = [];
      clearFamilyInfo();

      // 更新用户信息
      const { useUserStore } = require('./user');
      const userStore = useUserStore();
      if (userStore.user) {
        userStore.user.familyId = undefined;
        userStore.user.role = UserRole.MEMBER;
        userStore.setUser(userStore.user);
      }

      Taro.showToast({
        title: '家庭已解散',
        icon: 'success'
      });
      
      return true;
    } catch (error: any) {
      console.error('Dissolve family error:', error);
      Taro.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 设置家庭信息（用于其他store调用）
  const setFamily = (familyInfo: Family) => {
    family.value = familyInfo;
    setFamilyInfo(familyInfo);
  };

  // 检查成员权限
  const checkMemberPermission = (userId: string, permission: string): boolean => {
    const member = members.value.find(m => m.id === userId);
    if (!member || !family.value) {
      return false;
    }

    // 管理员拥有所有权限
    if (member.role === UserRole.ADMIN) {
      return true;
    }

    // 观察员只有查看权限
    if (member.role === UserRole.OBSERVER) {
      return permission.startsWith('view') || permission.startsWith('read');
    }

    // 普通成员根据家庭设置判断
    const settings = family.value.settings;
    switch (permission) {
      case 'add_record':
        return settings.memberPermissions.canAddRecord;
      case 'edit_record':
        return settings.memberPermissions.canEditRecord;
      case 'delete_record':
        return settings.memberPermissions.canDeleteRecord;
      case 'view_reports':
        return settings.memberPermissions.canViewReports;
      default:
        return false;
    }
  };

  // 重置状态
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
    $reset
  };
});
