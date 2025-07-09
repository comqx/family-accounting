// 实时同步 Hook
import { ref, onMounted, onUnmounted } from 'vue';
import Taro from '@tarojs/taro';
import { useUserStore } from '../stores/modules/user';
import { useRecordStore } from '../stores/modules/record';
import { useCategoryStore } from '../stores/modules/category';
import { useFamilyStore } from '../stores/modules/family';
import { useAppStore } from '../stores/modules/app';
import wsService from '../services/websocket';

export function useRealTimeSync() {
  const userStore = useUserStore();
  const recordStore = useRecordStore();
  const categoryStore = useCategoryStore();
  const familyStore = useFamilyStore();
  const appStore = useAppStore();
  const isConnected = ref(false);
  const lastSyncTime = ref(0);

  // 初始化连接
  const initConnection = async () => {
    if (!userStore.user?.id || !familyStore.familyId) {
      console.log('User or family info not available');
      return;
    }

    try {
      const token = userStore.token;
      const success = await wsService.connect(token, familyStore.familyId);
      
      if (success) {
        isConnected.value = true;
        setupMessageHandlers();
        requestInitialSync();
        console.log('WebSocket connected');
      } else {
        console.error('Failed to connect WebSocket');
      }
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  };

  // 设置消息处理器
  const setupMessageHandlers = () => {
    // 处理记录变更
    wsService.on('record_changed', handleRecordChanged);
    
    // 处理成员变更
    wsService.on('member_changed', handleMemberChanged);
    
    // 处理通知
    wsService.on('notification', handleNotification);
    
    // 处理同步响应
    wsService.on('sync_response', handleSyncResponse);
    
    // 处理连接状态
    wsService.on('connected', () => {
      isConnected.value = true;
      console.log('WebSocket reconnected');
    });
    
    wsService.on('disconnected', () => {
      isConnected.value = false;
      console.log('WebSocket disconnected');
    });
  };

  // 处理记录变更
  const handleRecordChanged = (message) => {
    // 如果是自己的操作，忽略
    if (message.userId === userStore.user?.id) {
      return;
    }

    const { action, record } = message;
    
    switch (action) {
      case 'create':
        // 添加新记录到本地store
        recordStore.records.unshift(record);
        showSyncNotification(`${getUserName(message.userId)}添加了一条记录`);
        break;
        
      case 'update':
        // 更新本地记录
        const updateIndex = recordStore.records.findIndex(r => r.id === record.id);
        if (updateIndex !== -1) {
          recordStore.records[updateIndex] = record;
          showSyncNotification(`${getUserName(message.userId)}修改了一条记录`);
        }
        break;
        
      case 'delete':
        // 删除本地记录
        const deleteIndex = recordStore.records.findIndex(r => r.id === record.id);
        if (deleteIndex !== -1) {
          recordStore.records.splice(deleteIndex, 1);
          showSyncNotification(`${getUserName(message.userId)}删除了一条记录`);
        }
        break;
    }
    
    // 更新同步时间
    lastSyncTime.value = message.timestamp;
  };

  // 处理成员变更
  const handleMemberChanged = (message) => {
    const { action, member } = message;
    
    switch (action) {
      case 'join':
        // 添加新成员
        familyStore.members.push(member);
        showSyncNotification(`${member.nickName}加入了家庭`);
        break;
        
      case 'leave':
        // 移除成员
        const leaveIndex = familyStore.members.findIndex(m => m.id === member.id);
        if (leaveIndex !== -1) {
          familyStore.members.splice(leaveIndex, 1);
          showSyncNotification(`${member.nickName}离开了家庭`);
        }
        break;
        
      case 'role_updated':
        // 更新成员角色
        const updateIndex = familyStore.members.findIndex(m => m.id === member.id);
        if (updateIndex !== -1) {
          familyStore.members[updateIndex] = member;
          showSyncNotification(`${member.nickName}的角色已更新`);
        }
        break;
    }
    
    lastSyncTime.value = message.timestamp;
  };

  // 处理通知
  const handleNotification = (message) => {
    const { notification } = message;
    
    // 显示通知
    if (appStore.settings.notifications.recordChanges) {
      Taro.showToast({
        title: notification.title,
        icon: 'none',
        duration: 2000
      });
    }
    
    lastSyncTime.value = message.timestamp;
  };

  // 处理同步响应
  const handleSyncResponse = (message) => {
    const { changes } = message;
    
    // 更新本地数据
    if (changes.records && changes.records.length > 0) {
      // 合并记录数据
      changes.records.forEach(record => {
        const existingIndex = recordStore.records.findIndex(r => r.id === record.id);
        if (existingIndex !== -1) {
          recordStore.records[existingIndex] = record;
        } else {
          recordStore.records.push(record);
        }
      });
    }
    
    if (changes.categories && changes.categories.length > 0) {
      // 合并分类数据
      changes.categories.forEach(category => {
        const existingIndex = categoryStore.categories.findIndex(c => c.id === category.id);
        if (existingIndex !== -1) {
          categoryStore.categories[existingIndex] = category;
        } else {
          categoryStore.categories.push(category);
        }
      });
    }
    
    if (changes.members && changes.members.length > 0) {
      // 更新成员数据
      familyStore.members = changes.members;
    }
    
    lastSyncTime.value = message.timestamp;
    console.log('Data synchronized');
  };

  // 请求初始同步
  const requestInitialSync = () => {
    if (wsService.connected) {
      wsService.requestSync(lastSyncTime.value, familyStore.familyId, userStore.user?.id || '');
    }
  };

  // 发送记录变更
  const syncRecordChange = (action, record) => {
    if (wsService.connected) {
      wsService.sendRecordChanged(action, record, familyStore.familyId, userStore.user?.id || '');
    }
  };

  // 发送成员变更
  const syncMemberChange = (action, member) => {
    if (wsService.connected) {
      wsService.sendMemberChanged(action, member, familyStore.familyId, userStore.user?.id || '');
    }
  };

  // 显示同步通知
  const showSyncNotification = (message) => {
    if (appStore.settings.notifications.recordChanges) {
      Taro.showToast({
        title: message,
        icon: 'none',
        duration: 1500
      });
    }
  };

  // 获取用户名称
  const getUserName = (userId) => {
    const member = familyStore.members.find(m => m.id === userId);
    return member?.nickName || '家庭成员';
  };

  // 断开连接
  const disconnect = () => {
    wsService.disconnect();
    isConnected.value = false;
  };

  // 重新连接
  const reconnect = () => {
    disconnect();
    setTimeout(() => {
      initConnection();
    }, 1000);
  };

  // 手动同步
  const manualSync = () => {
    if (wsService.connected) {
      requestInitialSync();
      appStore.showToast('同步中...', 'loading');
    } else {
      reconnect();
    }
  };

  // 生命周期
  onMounted(() => {
    initConnection();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    lastSyncTime,
    initConnection,
    disconnect,
    reconnect,
    manualSync,
    syncRecordChange,
    syncMemberChange
  };
}
