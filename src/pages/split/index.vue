<template>
  <view class="split-page">
    <!-- 顶部统计 -->
    <view class="stats-header">
      <view class="stats-item">
        <text class="stats-label">待确认</text>
        <text class="stats-value pending">{{ pendingCount }}</text>
      </view>
      <view class="stats-item">
        <text class="stats-label">已确认</text>
        <text class="stats-value confirmed">{{ confirmedCount }}</text>
      </view>
      <view class="stats-item">
        <text class="stats-label">已结算</text>
        <text class="stats-value settled">{{ settledCount }}</text>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view 
        v-for="filter in statusFilters" 
        :key="filter.value"
        class="filter-item"
        :class="{ active: currentFilter === filter.value }"
        @tap="switchFilter(filter.value)"
      >
        {{ filter.label }}
      </view>
    </view>

    <!-- 分摊列表 -->
    <view class="split-list">
      <view v-if="filteredSplits.length === 0" class="empty-state">
        <view class="empty-icon">💰</view>
        <text class="empty-text">暂无分摊记录</text>
        <text class="empty-desc">创建记录时可以选择分摊给家庭成员</text>
      </view>

      <view v-else>
        <view 
          v-for="split in filteredSplits" 
          :key="split.id"
          class="split-item"
          @tap="goToSplitDetail(split.id)"
        >
          <view class="split-header">
            <view class="split-info">
              <text class="split-desc">{{ split.description || '费用分摊' }}</text>
              <text class="split-time">{{ formatRelativeTime(split.createTime) }}</text>
            </view>
            <view class="split-amount">
              <text class="amount-text">¥{{ formatAmount(split.totalAmount) }}</text>
              <view class="status-badge" :class="split.status">
                {{ getStatusText(split.status) }}
              </view>
            </view>
          </view>

          <view class="split-participants">
            <view 
              v-for="participant in split.participants" 
              :key="participant.userId"
              class="participant-item"
            >
              <image 
                class="participant-avatar" 
                :src="participant.avatarUrl || '/assets/default-avatar.png'"
                mode="aspectFill"
              />
              <view class="participant-info">
                <text class="participant-name">{{ participant.nickName }}</text>
                <text class="participant-amount">¥{{ formatAmount(participant.amount) }}</text>
              </view>
              <view class="participant-status" :class="participant.status">
                {{ getParticipantStatusText(participant.status) }}
              </view>
            </view>
          </view>

          <view v-if="split.status === 'pending' && hasUserParticipant(split)" class="split-actions">
            <button 
              class="action-btn confirm" 
              @tap.stop="confirmSplit(split.id)"
              :disabled="isProcessing"
            >
              确认
            </button>
            <button 
              class="action-btn decline" 
              @tap.stop="declineSplit(split.id)"
              :disabled="isProcessing"
            >
              拒绝
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 创建分摊按钮 -->
    <view class="create-btn" @tap="goToCreateSplit">
      <text class="create-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useFamilyStore, useAppStore } from '../../stores'
import { SplitRecord, SplitStatus, ParticipantStatus } from '../../types/business'
import { formatAmount, formatRelativeTime } from '../../utils/format'
import splitService from '../../services/split'

// Store
const userStore = useUserStore()
const familyStore = useFamilyStore()
const appStore = useAppStore()

// 响应式数据
const splitRecords = ref([])
const currentFilter = ref('all')
const isProcessing = ref(false)

// 状态筛选选项
const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '待确认', value.PENDING },
  { label: '已确认', value.CONFIRMED },
  { label: '已结算', value.SETTLED }
]

// 计算属性
const filteredSplits = computed(() => {
  if (currentFilter.value === 'all') {
    return splitRecords.value
  }
  return splitRecords.value.filter(split => split.status === currentFilter.value)
})

const pendingCount = computed(() => 
  splitRecords.value.filter(split => split.status === SplitStatus.PENDING).length
)

const confirmedCount = computed(() => 
  splitRecords.value.filter(split => split.status === SplitStatus.CONFIRMED).length
)

const settledCount = computed(() => 
  splitRecords.value.filter(split => split.status === SplitStatus.SETTLED).length
)

// 方法
const switchFilter = (filter) => {
  currentFilter.value = filter
}

const getStatusText = (status) => {
  const statusMap = {
    [SplitStatus.PENDING]: '待确认',
    [SplitStatus.CONFIRMED]: '已确认',
    [SplitStatus.SETTLED]: '已结算',
    [SplitStatus.CANCELLED]: '已取消'
  }
  return statusMap[status] || status
}

const getParticipantStatusText = (status) => {
  const statusMap = {
    [ParticipantStatus.PENDING]: '待确认',
    [ParticipantStatus.CONFIRMED]: '已确认',
    [ParticipantStatus.SETTLED]: '已结算',
    [ParticipantStatus.DECLINED]: '已拒绝'
  }
  return statusMap[status] || status
}

const hasUserParticipant = (split) => {
  return split.participants.some(p => 
    p.userId === userStore.user?.id && p.status === ParticipantStatus.PENDING
  )
}

const confirmSplit = async (splitId) => {
  if (isProcessing.value) return

  try {
    isProcessing.value = true
    
    const success = await splitService.confirmSplit(splitId, userStore.user?.id || '')
    
    if (success) {
      appStore.showToast('确认成功', 'success')
      await loadSplitRecords()
    } else {
      appStore.showToast('确认失败', 'none')
    }
  } catch (error) {
    console.error('Confirm split error:', error)
    appStore.showToast(error.message || '确认失败', 'none')
  } finally {
    isProcessing.value = false
  }
}

const declineSplit = async (splitId) => {
  if (isProcessing.value) return

  try {
    const confirmed = await appStore.showModal({
      content: '确定要拒绝这个分摊吗？'
    })

    if (!confirmed) return

    isProcessing.value = true
    
    const success = await splitService.declineSplit(splitId, userStore.user?.id || '')
    
    if (success) {
      appStore.showToast('已拒绝', 'success')
      await loadSplitRecords()
    } else {
      appStore.showToast('操作失败', 'none')
    }
  } catch (error) {
    console.error('Decline split error:', error)
    appStore.showToast(error.message || '操作失败', 'none')
  } finally {
    isProcessing.value = false
  }
}

const goToSplitDetail = (splitId) => {
  Taro.navigateTo({
    url: `/pages/split/detail/index?id=${splitId}`
  })
}

const goToCreateSplit = () => {
  Taro.navigateTo({
    url: '/pages/split/create/index'
  })
}

const loadSplitRecords = async () => {
  try {
    const records = await splitService.getSplitRecords(familyStore.familyId)
    splitRecords.value = records
  } catch (error) {
    console.error('Load split records error:', error)
    appStore.showToast('加载失败', 'none')
  }
}

// 检查用户状态
const checkUserStatus = () => {
  if (!userStore.isLoggedIn || !userStore.hasFamily) {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
    return
  }
}

// 生命周期
onMounted(() => {
  checkUserStatus()
  loadSplitRecords()
})

// 页面配置
Taro.useLoad(() => {
  Taro.setNavigationBarTitle({
    title: '费用分摊'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: '家账通 - 费用分摊',
    path: '/pages/split/index'
  })
})
</script>

<style lang="scss" scoped>
.split-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 顶部统计
  .stats-header {
    background: white;
    display: flex;
    padding: 30rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

    .stats-item {
      flex: 1;
      text-align: center;

      .stats-label {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 8rpx;
      }

      .stats-value {
        display: block;
        font-size: 32rpx;
        font-weight: bold
;
        &.pending {
          color: #ff9500;
        }

        &.confirmed {
          color: #1296db;
        }

        &.settled {
          color: #2ed573;
        }
      }
    }
  }

  // 筛选栏
  .filter-bar {
    background: white;
    display: flex;
    padding: 20rpx 30rpx;
    border-top: 2rpx solid #f0f0f0;

    .filter-item {
      flex: 1;
      text-align: center;
      padding: 16rpx 20rpx;
      background: #f8f9fa;
      border-radius: 20rpx;
      margin: 0 10rpx;
      font-size: 26rpx;
      color: #666;
      transition: all 0.3s ease;

      &.active {
        background: #1296db;
        color: white;
      }
    }
  }

  // 分摊列表
  .split-list {
    padding: 30rpx;

    .empty-state {
      text-align: center;
      padding: 120rpx 0;

      .empty-icon {
        font-size: 120rpx;
        margin-bottom: 30rpx;
      }

      .empty-text {
        display: block;
        font-size: 32rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .empty-desc {
        display: block;
        font-size: 26rpx;
        color: #999;
      }
    }

    .split-item {
      background: white;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

      .split-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20rpx;

        .split-info {
          flex: 1;

          .split-desc {
            display: block;
            font-size: 30rpx;
            color: #333;
            font-weight: 500;
            margin-bottom: 6rpx;
          }

          .split-time {
            display: block;
            font-size: 24rpx;
            color: #999;
          }
        }

        .split-amount {
          text-align: right;

          .amount-text {
            display: block;
            font-size: 32rpx;
            color: #333;
            font-weight: bold;
            margin-bottom: 8rpx;
          }

          .status-badge {
            padding: 4rpx 12rpx;
            border-radius: 10rpx;
            font-size: 20rpx;
            color: white
;
            &.pending {
              background: #ff9500;
            }

            &.confirmed {
              background: #1296db;
            }

            &.settled {
              background: #2ed573;
            }

            &.cancelled {
              background: #999;
            }
          }
        }
      }

      .split-participants {
        margin-bottom: 20rpx;

        .participant-item {
          display: flex;
          align-items: center;
          padding: 15rpx 0;
          border-bottom: 2rpx solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .participant-avatar {
            width: 60rpx;
            height: 60rpx;
            border-radius: 50%;
            margin-right: 20rpx;
          }

          .participant-info {
            flex: 1;

            .participant-name {
              display: block;
              font-size: 26rpx;
              color: #333;
              margin-bottom: 4rpx;
            }

            .participant-amount {
              display: block;
              font-size: 24rpx;
              color: #666;
            }
          }

          .participant-status {
            padding: 4rpx 12rpx;
            border-radius: 10rpx;
            font-size: 20rpx;
            color: white
;
            &.pending {
              background: #ff9500;
            }

            &.confirmed {
              background: #1296db;
            }

            &.settled {
              background: #2ed573;
            }

            &.declined {
              background: #ff4757;
            }
          }
        }
      }

      .split-actions {
        display: flex;
        gap: 20rpx;

        .action-btn {
          flex: 1;
          border: none;
          border-radius: 20rpx;
          padding: 20rpx 0;
          font-size: 26rpx;

          &::after {
            border: none;
          }

          &.confirm {
            background: #1296db;
            color: white;
          }

          &.decline {
            background: #ff4757;
            color: white;
          }

          &:disabled {
            opacity: 0.6;
          }
        }
      }
    }
  }

  // 创建按钮
  .create-btn {
    position: fixed;
    bottom: 120rpx;
    right: 30rpx;
    width: 100rpx;
    height: 100rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.4);
    z-index: 100;

    .create-icon {
      font-size: 48rpx;
      color: white;
      font-weight: bold;
    }
  }
}
</style>
