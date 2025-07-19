<template>
  <view v-if="showStatus" class="network-status" :class="statusClass">
    <text class="status-icon">{{ statusIcon }}</text>
    <text class="status-text">{{ statusText }}</text>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getNetworkStatus, onNetworkStatusChange } from '../../utils/network'

// Props
const props = defineProps({
  showOffline: {
    type: Boolean,
    default: true
  },
  showSlow: {
    type: Boolean,
    default: true
  }
})

// 响应式数据
const networkStatus = ref<NetworkStatus>({
  isOnline: true,
  type: 'unknown'
})

const showStatus = ref(false)

// 计算属性
const statusClass = computed(() => {
  if (!networkStatus.value.isOnline) return 'offline'
  if (networkStatus.value.type === '2g' || networkStatus.value.type === '3g') return 'slow'
  return ''
})

const statusIcon = computed(() => {
  if (!networkStatus.value.isOnline) return '📶'
  if (networkStatus.value.type === '2g' || networkStatus.value.type === '3g') return '🐌'
  return ''
})

const statusText = computed(() => {
  if (!networkStatus.value.isOnline) return '网络连接已断开'
  if (networkStatus.value.type === '2g' || networkStatus.value.type === '3g') return '网络较慢，建议使用WiFi'
  return ''
})

// 方法
const updateNetworkStatus = (status) => {
  networkStatus.value = status
  
  // 根据配置决定是否显示状态
  if (!status.isOnline && props.showOffline) {
    showStatus.value = true
  } else if ((status.type === '2g' || status.type === '3g') && props.showSlow) {
    showStatus.value = true
  } else {
    showStatus.value = false
  }
}

// 生命周期
onMounted(async () => {
  // 获取初始网络状态
  const status = await getNetworkStatus()
  updateNetworkStatus(status)
  
  // 监听网络状态变化
  onNetworkStatusChange(updateNetworkStatus)
})

onUnmounted(() => {
  // 清理监听器（如果需要）
})
</script>

<style lang="scss" scoped>
.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 30rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;

  &.offline {
    background: rgba(255, 71, 87, 0.9);
    color: white;
  }

  &.slow {
    background: rgba(255, 165, 2, 0.9);
    color: white;
  }

  .status-icon {
    margin-right: 10rpx;
    font-size: 28rpx;
  }

  .status-text {
    font-weight: 500;
  }
}
</style> 