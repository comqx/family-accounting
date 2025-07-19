<template>
  <view class="virtual-list-container" :style="{ height: height + 'px' }">
    <virtual-list
      :height="height"
      :width="width"
      :item-count="itemCount"
      :item-size="itemSize"
      :item-data="itemData"
      :render="renderItem"
      @scrolltolower="onScrollToLower"
      class="virtual-list"
    />
    <view v-if="loading" class="loading-indicator">
      <text class="loading-text">加载中...</text>
    </view>
    <view v-if="!hasMore && itemCount > 0" class="no-more-indicator">
      <text class="no-more-text">没有更多了</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import VirtualList from 'taro-virtual-list'

interface Props {
  height: number
  width?: string
  itemCount: number
  itemSize: number
  itemData: any[]
  renderItem: (props: { item: any; index: number; style: any }) => any
  loading?: boolean
  hasMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  loading: false,
  hasMore: true
})

const emit = defineEmits<{
  scrollToLower: []
}>()

const onScrollToLower = () => {
  if (props.hasMore && !props.loading) {
    emit('scrollToLower')
  }
}
</script>

<style lang="scss" scoped>
.virtual-list-container {
  position: relative;
  overflow: hidden;
}

.virtual-list {
  width: 100%;
}

.loading-indicator,
.no-more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
  color: #999;
  font-size: 24rpx;
}

.loading-text,
.no-more-text {
  color: #999;
}
</style> 