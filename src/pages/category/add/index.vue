<template>
  <view class="category-add-page">
    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 分类类型 -->
      <view class="form-item">
        <text class="form-label">分类类型</text>
        <view class="type-tabs">
          <view
            class="type-tab"
            :class="{ active: categoryForm.type === RecordType.EXPENSE }"
            @tap="switchType(RecordType.EXPENSE)"
          >
            支出
          </view>
          <view
            class="type-tab"
            :class="{ active: categoryForm.type === RecordType.INCOME }"
            @tap="switchType(RecordType.INCOME)"
          >
            收入
          </view>
        </view>
      </view>

      <!-- 分类名称 -->
      <view class="form-item">
        <text class="form-label">分类名称</text>
        <input
          class="form-input"
          :value="categoryForm.name"
          @input="onNameInput"
          placeholder="请输入分类名称"
          maxlength="10"
        />
        <text class="char-count">{{ categoryForm.name.length }}/10</text>
      </view>

      <!-- 图标选择 -->
      <view class="form-item">
        <text class="form-label">选择图标</text>
        <view class="icon-grid">
          <view
            v-for="icon in currentIcons"
            :key="icon"
            class="icon-item"
            :class="{ active: categoryForm.icon === icon }"
            @tap="selectIcon(icon)"
          >
            <text class="icon-text">{{ icon }}</text>
          </view>
        </view>
      </view>

      <!-- 颜色选择 -->
      <view class="form-item">
        <text class="form-label">选择颜色</text>
        <view class="color-grid">
          <view
            v-for="color in colorOptions"
            :key="color"
            class="color-item"
            :class="{ active: categoryForm.color === color }"
            :style="{ backgroundColor: color }"
            @tap="selectColor(color)"
          >
            <text v-if="categoryForm.color === color" class="check-icon">✓</text>
          </view>
        </view>
      </view>

      <!-- 预览 -->
      <view class="form-item">
        <text class="form-label">预览效果</text>
        <view class="preview-section">
          <view class="preview-item">
            <view class="preview-icon" :style="{ backgroundColor: categoryForm.color }">
              {{ categoryForm.icon || '💰' }}
            </view>
            <text class="preview-name">{{ categoryForm.name || '分类名称' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="action-section">
      <button
        class="save-btn"
        :class="{ disabled: !canSave }"
        @tap="handleSave"
        :loading="isSaving"
        :disabled="!canSave || isSaving"
      >
        {{ isSaving ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useCategoryStore, useAppStore } from '../../../stores'
import { RecordType } from '../../../types/business'

// Store
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const appStore = useAppStore()

// 响应式数据
const categoryForm = ref<{
  type: RecordType,
  name: string,
  icon: string,
  color: string
}>({
  type: RecordType.EXPENSE,
  name: '',
  icon: '',
  color: '#ff6b6b'
})

const isSaving = ref(false)

// 图标选项
const expenseIcons = [
  '🍽️', '🚗', '🛍️', '🎮', '🏥', '📚', '🏠', '📱',
  '✈️', '🎬', '💄', '👕', '⚽', '🎵', '🍺', '💰'
]

const incomeIcons = [
  '💼', '🎁', '📈', '💻', '🧧', '🏆', '💎', '🎯',
  '📊', '💳', '🏪', '📱', '🎪', '🎨', '📝', '💰'
]

// 颜色选项
const colorOptions = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
  '#10ac84', '#ee5a24', '#ff3838', '#8395a7', '#222f3e'
]

// 计算属性
const currentIcons = computed(() => {
  return categoryForm.value.type === 'expense' ? expenseIcons : incomeIcons
})

const canSave = computed(() => {
  return categoryForm.value.name.trim().length > 0 &&
         categoryForm.value.icon.length > 0
})

// 方法
const switchType = (type) => {
  categoryForm.value.type = type
  // 切换类型时重置图标
  categoryForm.value.icon = ''
}

const onNameInput = (e) => {
  categoryForm.value.name = e.detail.value
}

const selectIcon = (icon) => {
  categoryForm.value.icon = icon
}

const selectColor = (color) => {
  categoryForm.value.color = color
}

const handleSave = async () => {
  if (!canSave.value || isSaving.value) return

  try {
    isSaving.value = true

    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    appStore.showToast('保存成功', 'success')

    // 返回上一页
    setTimeout(() => {
      Taro.navigateBack()
    }, 1000)

  } catch (error) {
    console.error('Save category error:', error)
    appStore.showToast(error.message || '保存失败', 'none')
  } finally {
    isSaving.value = false
  }
}

// 检查用户状态
const checkUserStatus = () => {
  if (!userStore.isLoggedIn) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
    return
  }
}

// 初始化
const initPage = () => {
  // 从页面参数获取类型
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}

  if (options.type) {
    categoryForm.value.type = options.type as RecordType
  }
}

// 生命周期
onMounted(() => {
  checkUserStatus()
  initPage()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '添加分类'
  })
})
</script>

<style lang="scss" scoped>
.category-add-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 表单区域
  .form-section {
    padding: 30rpx;

    .form-item {
      background: white;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      position: relative;

      .form-label {
        display: block;
        font-size: 30rpx;
        color: #333;
        margin-bottom: 20rpx;
        font-weight: 500;
      }

      // 类型切换
      .type-tabs {
        display: flex;
        background: #f8f9fa;
        border-radius: 12rpx;
        padding: 6rpx;

        .type-tab {
          flex: 1;
          text-align: center;
          padding: 16rpx 0;
          border-radius: 8rpx;
          font-size: 30rpx;
          color: #666;
          transition: all 0.3s ease;

          &.active {
            background: white;
            color: #1296db;
            font-weight: bold;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
          }
        }
      }

      // 输入框
      .form-input {
        width: 100%;
        padding: 24rpx 20rpx;
        border: 2rpx solid #e0e0e0;
        border-radius: 12rpx;
        font-size: 30rpx;
        color: #333;
        background: #fafafa;

        &:focus {
          border-color: #1296db;
          background: white;
        }

        &::placeholder {
          color: #999;
        }
      }

      .char-count {
        position: absolute;
        right: 30rpx;
        bottom: 30rpx;
        font-size: 24rpx;
        color: #999;
      }

      // 图标网格
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 20rpx;

        .icon-item {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 12rpx;
          border: 2rpx solid transparent;
          transition: all 0.3s ease;

          &.active {
            background: #e3f2fd;
            border-color: #1296db;
          }

          .icon-text {
            font-size: 32rpx;
          }
        }
      }

      // 颜色网格
      .color-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 20rpx;

        .color-item {
          aspect-ratio: 1;
          border-radius: 50%;
          border: 4rpx solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;

          &.active {
            border-color: #333;
            transform: scale(1.1);
          }

          .check-icon {
            color: white;
            font-size: 24rpx;
            font-weight: bold;
            text-shadow: 0 0 4rpx rgba(0, 0, 0, 0.5);
          }
        }
      }

      // 预览区域
      .preview-section {
        .preview-item {
          display: flex;
          align-items: center;
          padding: 20rpx;
          background: #f8f9fa;
          border-radius: 12rpx;

          .preview-icon {
            width: 80rpx;
            height: 80rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32rpx;
            margin-right: 20rpx;
          }

          .preview-name {
            font-size: 30rpx;
            color: #333;
          }
        }
      }
    }
  }

  // 操作区域
  .action-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 30rpx;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);

    .save-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50rpx;
      padding: 28rpx 0;
      font-size: 32rpx;
      font-weight: bold;

      &.disabled {
        background: #ccc;
        opacity: 0.6;
      }

      &::after {
        border: none;
      }
    }
  }
}
</style>
