<template>
  <view v-if="visible" class="confirm-dialog-overlay" @tap="handleOverlayTap">
    <view class="confirm-dialog" @tap.stop>
      <view class="dialog-header">
        <text class="dialog-title">{{ title }}</text>
        <text v-if="showClose" class="close-btn" @tap="handleCancel">×</text>
      </view>
      
      <view class="dialog-content">
        <view v-if="icon" class="dialog-icon">
          <text class="icon-text">{{ icon }}</text>
        </view>
        <text class="dialog-message">{{ message }}</text>
        <text v-if="subMessage" class="dialog-sub-message">{{ subMessage }}</text>
      </view>
      
      <view class="dialog-actions">
        <button 
          v-if="showCancel" 
          class="action-btn cancel-btn" 
          @tap="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button 
          class="action-btn confirm-btn" 
          :class="confirmBtnClass"
          @tap="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  subMessage: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['danger', 'warning', 'info', 'success'].includes(value)
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel', 'close'])

// 计算属性
const confirmBtnClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    default:
      return 'info'
  }
})

// 方法
const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayTap = () => {
  if (props.showClose) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: white;
  border-radius: 20rpx;
  width: 90%;
  max-width: 600rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .dialog-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .close-btn {
      font-size: 40rpx;
      color: #999;
      padding: 10rpx;
    }
  }

  .dialog-content {
    padding: 40rpx 30rpx;
    text-align: center;

    .dialog-icon {
      margin-bottom: 20rpx;

      .icon-text {
        font-size: 80rpx;
      }
    }

    .dialog-message {
      display: block;
      font-size: 30rpx;
      color: #333;
      line-height: 1.5;
      margin-bottom: 10rpx;
    }

    .dialog-sub-message {
      display: block;
      font-size: 26rpx;
      color: #666;
      line-height: 1.4;
    }
  }

  .dialog-actions {
    display: flex;
    gap: 20rpx;
    padding: 0 30rpx 30rpx;

    .action-btn {
      flex: 1;
      border: none;
      border-radius: 12rpx;
      padding: 20rpx;
      font-size: 28rpx;
      font-weight: bold;

      &::after {
        border: none;
      }

      &.cancel-btn {
        background: #f8f9fa;
        color: #666;
      }

      &.confirm-btn {
        color: white;

        &.danger {
          background: #ff4757;
        }

        &.warning {
          background: #ffa502;
        }

        &.success {
          background: #2ed573;
        }

        &.info {
          background: #1296db;
        }
      }
    }
  }
}
</style> 