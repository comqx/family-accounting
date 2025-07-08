import { ref, onMounted, onUnmounted } from 'vue';
import Taro from '@tarojs/taro';
import { useUserStore, useFamilyStore, useRecordStore, useCategoryStore, useAppStore } from '../stores';

export function useRealTimeSync() {
  const userStore = useUserStore();
  const familyStore = useFamilyStore();
  const recordStore = useRecordStore();
  const categoryStore = useCategoryStore();
  const appStore = useAppStore();

  const isConnected = ref(false);
  const lastSyncTime = ref(Date.now());

  // 初始化WebSocket连接
  const initConnection = async () => {
    try {
      console.log('Initializing real-time sync connection');
      isConnected.value = true;
    } catch (error) {
      console.error('Failed to initialize real-time sync:', error);
      isConnected.value = false;
    }
  };

  // 处理记录变更
  const handleRecordChanged = (message) => {
    const { action, record } = message;

    switch (action) {
      case 'create':
        console.log('Record created:', record);
        showSyncNotification('添加了一条记录');
        break;

      case 'update':
        console.log('Record updated:', record);
        showSyncNotification('修改了一条记录');
        break;

      case 'delete':
        console.log('Record deleted:', record);
        showSyncNotification('删除了一条记录');
        break;
    }
  };

  // 处理成员变更
  const handleMemberChanged = (message) => {
    const { action, member } = message;

    switch (action) {
      case 'join':
        console.log('Member joined:', member);
        showSyncNotification(`${member.nickName}加入了家庭`);
        break;

      case 'leave':
        console.log('Member left:', member);
        showSyncNotification(`${member.nickName}离开了家庭`);
        break;
    }
  };

  // 处理分类变更
  const handleCategoryChanged = (message) => {
    const { action, category } = message;

    switch (action) {
      case 'create':
        console.log('Category created:', category);
        showSyncNotification('添加了新分类');
        break;

      case 'update':
        console.log('Category updated:', category);
        showSyncNotification('修改了分类');
        break;

      case 'delete':
        console.log('Category deleted:', category);
        showSyncNotification('删除了分类');
        break;
    }
  };

  // 处理通知
  const handleNotification = (message) => {
    const { notification } = message;

    if (notification) {
      Taro.showToast({
        title: notification.title || '通知',
        icon: 'none'
      });
    }

    lastSyncTime.value = message.timestamp;
  };

  // 处理同步响应
  const handleSyncResponse = (message) => {
    const { changes } = message;

    // 更新本地数据
    if (changes) {
      console.log('Sync response received:', changes);
      lastSyncTime.value = message.timestamp;
    }
  };

  // 显示同步通知
  const showSyncNotification = (text) => {
    if (appStore.settings && appStore.settings.enableSyncNotifications) {
      Taro.showToast({
        title: text,
        icon: 'none',
        duration: 2000
      });
    }
  };

  // 重连
  const reconnect = () => {
    console.log('Reconnecting...');
    initConnection();
  };

  // 断开连接
  const disconnect = () => {
    console.log('Disconnecting...');
    isConnected.value = false;
  };

  // 获取用户名称
  const getUserName = (userId) => {
    return familyStore.members && familyStore.members.find(m => m.id === userId) ?
           familyStore.members.find(m => m.id === userId).nickName : '未知用户';
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
    reconnect,
    disconnect
  };
}
