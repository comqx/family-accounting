<template>
  <view class="record-detail-page">
    <!-- 记录信息卡片 -->
    <view class="record-card">
      <view class="record-header">
        <view class="record-icon" :style="{ backgroundColor: record.categoryColor }">
          {{ record.categoryIcon }}
        </view>
        <view class="record-info">
          <text class="record-category">{{ record.categoryName }}</text>
          <text class="record-date">{{ formatDate(record.date) }}</text>
        </view>
        <view class="record-amount">
          <text
            class="amount-text"
            :class="record.type"
          >
            {{ record.type === 'expense' ? '-' : '+' }}¥{{ formatAmount(record.amount) }}
          </text>
        </view>
      </view>

      <view v-if="record.description" class="record-description">
        <text class="desc-label">备注</text>
        <text class="desc-text">{{ record.description }}</text>
      </view>

      <view v-if="record.tags && record.tags.length > 0" class="record-tags">
        <text class="tags-label">标签</text>
        <view class="tags-list">
          <text
            v-for="tag in record.tags"
            :key="tag"
            class="tag-item"
          >
            {{ tag }}
          </text>
        </view>
      </view>

      <view v-if="record.images && record.images.length > 0" class="record-images">
        <text class="images-label">图片</text>
        <view class="images-grid">
          <image
            v-for="(image, index) in record.images"
            :key="index"
            class="image-item"
            :src="image"
            mode="aspectFill"
            @tap="previewImage(index)"
          />
        </view>
      </view>
    </view>

    <!-- 创建信息 -->
    <view class="meta-info">
      <view class="meta-item">
        <text class="meta-label">创建人</text>
        <text class="meta-value">{{ record.createdBy || '我' }}</text>
      </view>
      <view class="meta-item">
        <text class="meta-label">创建时间</text>
        <text class="meta-value">{{ formatDateTime(record.createTime) }}</text>
      </view>
      <view v-if="record.updateTime && record.updateTime !== record.createTime" class="meta-item">
        <text class="meta-label">修改时间</text>
        <text class="meta-value">{{ formatDateTime(record.updateTime) }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="action-btn edit" @tap="editRecord">
        <text class="btn-icon">✏️</text>
        <text class="btn-text">编辑</text>
      </button>

      <button class="action-btn delete" @tap="confirmDelete">
        <text class="btn-icon">🗑️</text>
        <text class="btn-text">删除</text>
      </button>

      <button class="action-btn share" @tap="shareRecord">
        <text class="btn-icon">📤</text>
        <text class="btn-text">分享</text>
      </button>
    </view>

    <!-- 删除确认弹窗 -->
    <view v-if="showDeleteModal" class="modal-overlay" @tap="closeDeleteModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">确认删除</text>
        </view>
        <view class="modal-body">
          <text class="modal-text">确定要删除这条记录吗？删除后无法恢复。</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeDeleteModal">取消</button>
          <button class="modal-btn confirm" @tap="handleDelete">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore, useAppStore } from '../../../stores'
import { formatAmount, formatDate, formatRelativeTime } from '../../../utils/format'

// Store
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const showDeleteModal = ref(false)
const recordId = ref('')

// 模拟记录数据
const record = ref({
  id: '1',
  type: 'expense',
  amount: 25.50,
  categoryId: 'expense_0',
  categoryName: '餐饮',
  categoryIcon: '🍽️',
  categoryColor: '#ff6b6b',
  description: '和朋友一起吃午餐，味道不错',
  date: new Date(),
  tags: ['聚餐', '朋友'],
  images: [],
  createTime: new Date(),
  updateTime: new Date(),
  createdBy: '张三'
})

// 方法
const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${formatDate(d, 'YYYY-MM-DD')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const previewImage = (index) => {
  if (record.value.images && record.value.images.length > 0) {
    appStore.previewImage(record.value.images, record.value.images[index])
  }
}

const editRecord = () => {
  Taro.navigateTo({
    url: `/pages/record/edit/index?id=${recordId.value}`
  })
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const handleDelete = async () => {
  try {
    appStore.showLoading('删除中...')

    // 模拟删除过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    appStore.hideLoading()
    appStore.showToast('删除成功', 'success')

    closeDeleteModal()

    // 返回上一页
    setTimeout(() => {
      Taro.navigateBack()
    }, 1000)

  } catch (error) {
    appStore.hideLoading()
    appStore.showToast(error.message || '删除失败', 'none')
  }
}

const shareRecord = () => {
  const shareText = `我在家账通记了一笔${record.value.type === 'expense' ? '支出' : '收入'}：${record.value.categoryName} ¥${formatAmount(record.value.amount)}`

  // 这里可以调用分享API
  appStore.showToast('功能开发中', 'none')
}

const loadRecordDetail = (id) => {
  // 模拟加载记录详情
  console.log('Loading record detail for:', id)

  // 这里应该从API获取记录详情
  // const detail = await recordStore.getRecordDetail(id)
  // record.value = detail
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

// 初始化页面
const initPage = () => {
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}

  if (options.id) {
    recordId.value = options.id
    loadRecordDetail(options.id)
  } else {
    appStore.showToast('记录不存在', 'none')
    setTimeout(() => {
      Taro.navigateBack()
    }, 1500)
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
    title: '记录详情'
  })
})

// 页面分享
Taro.useShareAppMessage(() => {
  return appStore.share({
    title: `家账通 - ${record.value.categoryName} ¥${formatAmount(record.value.amount)}`,
    path: `/pages/record/detail/index?id=${recordId.value}`
  })
})
</script>

<style lang="scss" scoped>
.record-detail-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;

  // 记录信息卡片
  .record-card {
    background: white;
    margin: 30rpx;
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

    .record-header {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;

      .record-icon {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48rpx;
        margin-right: 30rpx;
      }

      .record-info {
        flex: 1;

        .record-category {
          display: block;
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }

        .record-date {
          display: block;
          font-size: 26rpx;
          color: #666;
        }
      }

      .record-amount {
        .amount-text {
          font-size: 42rpx;
          font-weight: bold;

          &.expense {
            color: #ff4757;
          }

          &.income {
            color: #2ed573;
          }
        }
      }
    }

    .record-description {
      margin-bottom: 30rpx;
      padding: 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;

      .desc-label {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 10rpx;
      }

      .desc-text {
        font-size: 30rpx;
        color: #333;
        line-height: 1.5;
      }
    }

    .record-tags {
      margin-bottom: 30rpx;

      .tags-label {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 15rpx;
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10rpx;

        .tag-item {
          padding: 8rpx 16rpx;
          background: #e3f2fd;
          color: #1296db;
          border-radius: 20rpx;
          font-size: 24rpx;
        }
      }
    }

    .record-images {
      .images-label {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 15rpx;
      }

      .images-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15rpx;

        .image-item {
          aspect-ratio: 1;
          border-radius: 12rpx;
          background: #f0f0f0;
        }
      }
    }
  }

  // 元信息
  .meta-info {
    background: white;
    margin: 30rpx;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

    .meta-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 0;
      border-bottom: 2rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .meta-label {
        font-size: 28rpx;
        color: #666;
      }

      .meta-value {
        font-size: 28rpx;
        color: #333;
      }
    }
  }

  // 操作按钮
  .action-buttons {
    display: flex;
    gap: 20rpx;
    padding: 0 30rpx;

    .action-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30rpx 20rpx;
      border: none;
      border-radius: 16rpx;
      font-size: 26rpx;

      &::after {
        border: none;
      }

      .btn-icon {
        font-size: 36rpx;
        margin-bottom: 8rpx;
      }

      .btn-text {
        font-weight: 500;
      }

      &.edit {
        background: #e3f2fd;
        color: #1296db;
      }

      &.delete {
        background: #ffebee;
        color: #ff4757;
      }

      &.share {
        background: #f3e5f5;
        color: #9c27b0;
      }
    }
  }

  // 删除确认弹窗
  .modal-overlay {
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
    padding: 60rpx;

    .modal-content {
      background: white;
      border-radius: 20rpx;
      width: 100%;
      max-width: 500rpx;

      .modal-header {
        padding: 40rpx 40rpx 20rpx;
        text-align: center;

        .modal-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
        }
      }

      .modal-body {
        padding: 20rpx 40rpx 40rpx;
        text-align: center;

        .modal-text {
          font-size: 28rpx;
          color: #666;
          line-height: 1.5;
        }
      }

      .modal-footer {
        display: flex;
        border-top: 2rpx solid #f0f0f0;

        .modal-btn {
          flex: 1;
          padding: 30rpx 0;
          border: none;
          background: white;
          font-size: 32rpx;

          &::after {
            border: none;
          }

          &.cancel {
            color: #666;
            border-right: 2rpx solid #f0f0f0;
          }

          &.confirm {
            color: #ff4757;
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
