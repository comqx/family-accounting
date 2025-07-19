<template>
  <view v-if="visible" class="guide-modal">
    <view class="guide-overlay" @tap="closeGuide"></view>
    
    <view class="guide-content" :class="currentStep.type">
      <!-- 步骤指示器 -->
      <view class="guide-indicator">
        <view 
          v-for="(step, index) in steps" 
          :key="index"
          class="indicator-dot"
          :class="{ active: index === currentStepIndex }"
        ></view>
      </view>

      <!-- 引导内容 -->
      <view class="guide-body">
        <view class="guide-icon">{{ currentStep.icon }}</view>
        <text class="guide-title">{{ currentStep.title }}</text>
        <text class="guide-desc">{{ currentStep.description }}</text>
      </view>

      <!-- 操作按钮 -->
      <view class="guide-actions">
        <button 
          v-if="currentStepIndex > 0" 
          class="guide-btn prev-btn" 
          @tap="prevStep"
        >
          上一步
        </button>
        
        <button 
          v-if="currentStepIndex < steps.length - 1" 
          class="guide-btn next-btn" 
          @tap="nextStep"
        >
          下一步
        </button>
        
        <button 
          v-if="currentStepIndex === steps.length - 1" 
          class="guide-btn finish-btn" 
          @tap="finishGuide"
        >
          完成
        </button>
      </view>

      <!-- 跳过按钮 -->
      <view class="guide-skip">
        <text class="skip-text" @tap="skipGuide">跳过引导</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  guideType: {
    type: String,
    default: 'default'
  }
})

// Emits
const emit = defineEmits(['close', 'finish'])

// 响应式数据
const currentStepIndex = ref(0)

// 引导步骤配置
const guideSteps = {
  default: [
    {
      type: 'welcome',
      icon: '👋',
      title: '欢迎使用家账通',
      description: '让我们一起开始记账之旅吧！'
    },
    {
      type: 'feature',
      icon: '📝',
      title: '快速记账',
      description: '点击首页的"+"按钮，快速记录您的收支'
    },
    {
      type: 'feature',
      icon: '📊',
      title: '数据统计',
      description: '在报表页面查看详细的收支分析'
    },
    {
      type: 'feature',
      icon: '👨‍👩‍👧‍👦',
      title: '家庭共享',
      description: '创建家庭账本，与家人一起记账'
    },
    {
      type: 'finish',
      icon: '🎉',
      title: '开始使用',
      description: '现在您可以开始使用家账通了！'
    }
  ],
  record: [
    {
      type: 'feature',
      icon: '📱',
      title: '选择类型',
      description: '选择收入或支出类型'
    },
    {
      type: 'feature',
      icon: '🏷️',
      title: '选择分类',
      description: '选择合适的消费分类'
    },
    {
      type: 'feature',
      icon: '💰',
      title: '输入金额',
      description: '输入具体的金额数字'
    },
    {
      type: 'feature',
      icon: '📝',
      title: '添加备注',
      description: '可以添加详细的备注信息'
    },
    {
      type: 'finish',
      icon: '✅',
      title: '保存记录',
      description: '点击保存按钮完成记账'
    }
  ],
  family: [
    {
      type: 'feature',
      icon: '🏠',
      title: '创建家庭',
      description: '创建一个新的家庭账本'
    },
    {
      type: 'feature',
      icon: '👥',
      title: '邀请成员',
      description: '邀请家人加入家庭账本'
    },
    {
      type: 'feature',
      icon: '📊',
      title: '共同记账',
      description: '家庭成员可以一起记账'
    },
    {
      type: 'finish',
      icon: '🎯',
      title: '预算管理',
      description: '设置家庭预算，控制支出'
    }
  ]
}

// 计算属性
const steps = computed(() => {
  return guideSteps[props.guideType] || guideSteps.default
})

const currentStep = computed(() => {
  return steps.value[currentStepIndex.value]
})

// 方法
const nextStep = () => {
  if (currentStepIndex.value < steps.value.length - 1) {
    currentStepIndex.value++
  }
}

const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const finishGuide = () => {
  // 标记引导已完成
  Taro.setStorage({
    key: `guide_${props.guideType}_completed`,
    data: true
  })
  
  emit('finish', props.guideType)
  closeGuide()
}

const skipGuide = () => {
  // 标记引导已跳过
  Taro.setStorage({
    key: `guide_${props.guideType}_skipped`,
    data: true
  })
  
  emit('close')
}

const closeGuide = () => {
  emit('close')
}

// 重置步骤
const resetSteps = () => {
  currentStepIndex.value = 0
}

// 暴露方法
defineExpose({
  resetSteps
})
</script>

<style lang="scss" scoped>
.guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
}

.guide-content {
  position: relative;
  background: white;
  border-radius: 20rpx;
  width: 90%;
  max-width: 600rpx;
  padding: 40rpx 30rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);

  &.welcome {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  &.feature {
    background: white;
    color: #333;
  }

  &.finish {
    background: linear-gradient(135deg, #2ed573 0%, #7bed9f 100%);
    color: white;
  }
}

.guide-indicator {
  display: flex;
  justify-content: center;
  gap: 10rpx;
  margin-bottom: 30rpx;

  .indicator-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;

    &.active {
      background: rgba(255, 255, 255, 0.9);
      transform: scale(1.2);
    }
  }

  .guide-content:not(.welcome):not(.finish) & {
    .indicator-dot {
      background: rgba(0, 0, 0, 0.2);

      &.active {
        background: #1296db;
      }
    }
  }
}

.guide-body {
  margin-bottom: 40rpx;

  .guide-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .guide-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 15rpx;
  }

  .guide-desc {
    font-size: 28rpx;
    line-height: 1.5;
    opacity: 0.9;
  }
}

.guide-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;

  .guide-btn {
    flex: 1;
    border: none;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    font-weight: bold;

    &::after {
      border: none;
    }

    &.prev-btn {
      background: #f8f9fa;
      color: #666;
    }

    &.next-btn {
      background: #1296db;
      color: white;
    }

    &.finish-btn {
      background: #2ed573;
      color: white;
    }
  }
}

.guide-skip {
  .skip-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: underline;
  }

  .guide-content:not(.welcome):not(.finish) & {
    .skip-text {
      color: #999;
    }
  }
}
</style> 