<template>
  <view class="category-picker" :class="{ horizontal }">
    <scroll-view v-if="horizontal" class="category-list" scroll-x aria-label="分类列表">
      <CategoryCard
        v-for="cat in categories"
        :key="cat.id"
        :category="cat"
        :selected="modelValue === cat.id"
        clickable
        @click="onSelect(cat)"
      />
      <view class="category-card add-category" @tap="onAddCategory" role="button" aria-label="添加分类">
        <view class="category-icon"><text class="add-icon">+</text></view>
        <text class="category-name">添加</text>
      </view>
    </scroll-view>
    <view v-else class="category-list-vertical">
      <CategoryCard
        v-for="cat in categories"
        :key="cat.id"
        :category="cat"
        :selected="modelValue === cat.id"
        clickable
        @click="onSelect(cat)"
      />
      <view class="category-card add-category" @tap="onAddCategory" role="button" aria-label="添加分类">
        <view class="category-icon"><text class="add-icon">+</text></view>
        <text class="category-name">添加</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import CategoryCard from './CategoryCard.vue'

const props = defineProps<{
  categories: Array<any>
  modelValue: string | number
  horizontal?: boolean
}>()
const emits = defineEmits(['update:modelValue', 'add'])

function onSelect(cat: any) {
  emits('update:modelValue', cat.id)
}
function onAddCategory() {
  emits('add')
}
</script>

<style lang="scss" scoped>
.category-picker {
  width: 100%;
  &.horizontal {
    .category-list {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      white-space: nowrap;
    }
    .category-card {
      margin-right: 16rpx;
      display: inline-flex;
    }
  }
  .category-list-vertical {
    display: flex;
    flex-direction: column;
  }
  .add-category {
    background: #f0f4fa;
    color: #3a7afe;
    border: 1rpx dashed #3a7afe;
    .category-icon {
      background: #fff;
      color: #3a7afe;
    }
    .add-icon {
      font-size: 32rpx;
      font-weight: bold;
    }
  }
}
</style> 