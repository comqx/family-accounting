// WebSocket实时通信服务

import Taro from '@tarojs/taro';
// import { WSMessage } from '../../types/api'; // 移除类型依赖

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.heartbeatInterval = null;
    this.messageHandlers = new Map();
    this.url = '';
    this._token = '';
    this.init();
  }

  init() {
    // 根据环境设置WebSocket URL
    const accountInfo = Taro.getAccountInfoSync();
    if (accountInfo.miniProgram.envVersion === 'develop') {
      this.url = 'wss://dev-ws.example.com';
    } else if (accountInfo.miniProgram.envVersion === 'trial') {
      this.url = 'wss://test-ws.example.com';
    } else {
      this.url = 'wss://ws.example.com';
    }
  }

  // 连接WebSocket
  connect(token, familyId) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      this._token = token;
      try {
        this.socket = Taro.connectSocket({
          url: `${this.url}?token=${token}&familyId=${familyId}`,
          success: () => {
            console.log('WebSocket connecting...');
          },
          fail: (error) => {
            console.error('WebSocket connect failed:', error);
            reject(error);
          }
        });

        this.socket.onOpen(() => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve(true);
        });

        this.socket.onMessage((res) => {
          this.handleMessage(res.data);
        });

        this.socket.onClose((res) => {
          console.log('WebSocket closed:', res);
          this.isConnected = false;
          this.stopHeartbeat();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect(token, familyId);
          }
        });

        this.socket.onError((error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        });
      } catch (error) {
        console.error('WebSocket connect error:', error);
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.close({
        code: 1000,
        reason: 'Normal closure'
      });
      this.socket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.messageHandlers.clear();
  }

  // 重连
  reconnect(token, familyId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
    setTimeout(() => {
      this.connect(token, familyId).catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, this.reconnectInterval);
  }

  // 发送消息
  send(message) {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket not connected');
      return false;
    }
    try {
      this.socket.send({
        data: JSON.stringify(message),
        success: () => {
          console.log('Message sent:', message.type);
        },
        fail: (error) => {
          console.error('Send message failed:', error);
        }
      });
      return true;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  }

  // 处理接收到的消息
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Message handler error:', error);
          }
        });
      }
      const globalHandlers = this.messageHandlers.get('*');
      if (globalHandlers) {
        globalHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Global message handler error:', error);
          }
        });
      }
    } catch (error) {
      console.error('Parse message error:', error);
    }
  }

  // 添加消息处理器
  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }

  // 移除消息处理器
  off(messageType, handler) {
    if (!handler) {
      this.messageHandlers.delete(messageType);
      return;
    }
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.messageHandlers.delete(messageType);
      }
    }
  }

  // 开始心跳
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'heartbeat',
          familyId: '',
          userId: '',
          timestamp: Date.now()
        });
      }
    }, 30000);
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 发送记录变更消息
  sendRecordChanged(action, record, familyId, userId) {
    const message = {
      type: 'record_changed',
      action,
      record,
      familyId,
      userId,
      timestamp: Date.now()
    };
    return this.send(message);
  }

  // 发送成员变更消息
  sendMemberChanged(action, member, familyId, userId) {
    const message = {
      type: 'member_changed',
      action,
      member,
      familyId,
      userId,
      timestamp: Date.now()
    };
    return this.send(message);
  }

  // 发送通知消息
  sendNotification(notification, familyId, userId) {
    const message = {
      type: 'notification',
      notification,
      familyId,
      userId,
      timestamp: Date.now()
    };
    return this.send(message);
  }

  // 请求数据同步
  requestSync(lastSyncTime, familyId, userId) {
    const message = {
      type: 'sync_request',
      lastSyncTime,
      familyId,
      userId,
      timestamp: Date.now()
    };
    return this.send(message);
  }

  // 获取连接状态
  get connected() {
    return this.isConnected;
  }

  // 获取重连次数
  get reconnectCount() {
    return this.reconnectAttempts;
  }
}

// 创建WebSocket服务实例
const wsService = new WebSocketService();

export default wsService;
