<template>
  <view class="category-page">
    <view class="section">
      <view class="section-title">支出分类</view>
      <view v-if="expenseCategories.length === 0" class="empty-text">暂无支出分类</view>
      <view v-for="cat in expenseCategories" :key="cat.id" class="category-card">
        <view class="category-info">
          <view class="category-icon" :style="{ backgroundColor: cat.color }">{{ cat.icon || '📂' }}</view>
          <view class="category-meta">
            <text class="category-name">{{ cat.name }}</text>
            <text class="category-type">支出</text>
          </view>
        </view>
        <view class="category-actions">
          <button size="mini" @tap="editCategory(cat)">编辑</button>
          <button size="mini" type="warn" @tap="deleteCategory(cat)">删除</button>
        </view>
      </view>
    </view>
    <view class="section">
      <view class="section-title">收入分类</view>
      <view v-if="incomeCategories.length === 0" class="empty-text">暂无收入分类</view>
      <view v-for="cat in incomeCategories" :key="cat.id" class="category-card">
        <view class="category-info">
          <view class="category-icon" :style="{ backgroundColor: cat.color }">{{ cat.icon || '📂' }}</view>
          <view class="category-meta">
            <text class="category-name">{{ cat.name }}</text>
            <text class="category-type">收入</text>
          </view>
        </view>
        <view class="category-actions">
          <button size="mini" @tap="editCategory(cat)">编辑</button>
          <button size="mini" type="warn" @tap="deleteCategory(cat)">删除</button>
        </view>
      </view>
    </view>
    <view class="add-btn-bar">
      <button type="primary" @tap="addCategory">新增分类</button>
    </view>

    <!-- 分类编辑弹窗 -->
    <view v-if="showModal" class="modal-mask" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">{{ modalType === 'add' ? '新增分类' : '编辑分类' }}</view>
        <view class="form-item">
          <text class="form-label">分类名称</text>
          <input class="form-input" v-model="form.name" placeholder="请输入分类名称" />
        </view>
        <view class="form-item">
          <text class="form-label">类型</text>
          <picker :range="typeOptions" range-key="label" :value="form.typeIndex" @change="onTypeChange">
            <view class="picker-value">{{ typeOptions[form.typeIndex].label }}</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">颜色</text>
          <view class="color-list">
            <view v-for="(color, idx) in colorOptions" :key="color" class="color-dot" :style="{ backgroundColor: color, border: form.color === color ? '3rpx solid #1677ff' : '2rpx solid #eee' }" @tap="form.color = color"></view>
          </view>
        </view>
        <view class="form-actions">
          <button size="mini" @tap="closeModal">取消</button>
          <button size="mini" type="primary" @tap="saveCategory">保存</button>
        </view>
      </view>
    </view>
    <!-- 删除确认弹窗 -->
    <view v-if="showDeleteModal" class="modal-mask" @tap="closeDeleteModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">确认删除</view>
        <view class="modal-body">确定要删除分类“{{ deleteTarget?.name }}”吗？</view>
        <view class="form-actions">
          <button size="mini" @tap="closeDeleteModal">取消</button>
          <button size="mini" type="warn" @tap="confirmDeleteCategory">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useCategoryStore } from '@/stores/modules/category'
import { useFamilyStore } from '@/stores'

const categoryStore = useCategoryStore()
const familyStore = useFamilyStore()

const expenseCategories = computed(() => categoryStore.expenseCategories)
const incomeCategories = computed(() => categoryStore.incomeCategories)

const colorOptions = ['#1296db', '#ff6b6b', '#4ecdc4', '#ffa502', '#2ed573', '#a29bfe', '#fdcb6e', '#636e72']
const typeOptions = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' }
]

const showModal = ref(false)
const modalType = ref('add') // 'add' or 'edit'
const form = ref({
  id: null,
  name: '',
  type: 'expense',
  typeIndex: 0,
  color: colorOptions[0],
})

const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const loadData = async () => {
  await categoryStore.loadCategories(familyStore.familyId)
}
onMounted(loadData)

const addCategory = () => {
  modalType.value = 'add'
  form.value = {
    id: null,
    name: '',
    type: 'expense',
    typeIndex: 0,
    color: colorOptions[0],
  }
  showModal.value = true
}
const editCategory = (cat) => {
  modalType.value = 'edit'
  form.value = {
    id: cat.id,
    name: cat.name,
    type: cat.type,
    typeIndex: cat.type === 'income' ? 1 : 0,
    color: cat.color || colorOptions[0],
  }
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
}
const onTypeChange = (e) => {
  form.value.typeIndex = e.detail.value
  form.value.type = typeOptions[e.detail.value].value
}
const saveCategory = async () => {
  if (!form.value.name.trim()) {
    Taro.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  const data = {
    name: form.value.name.trim(),
    type: form.value.type,
    color: form.value.color,
    familyId: familyStore.familyId
  }
  let success = false
  if (modalType.value === 'add') {
    success = await categoryStore.createCategory(data)
  } else {
    success = await categoryStore.updateCategory(form.value.id, data)
  }
  if (success) {
    showModal.value = false
    loadData()
  }
}
const deleteCategory = (cat) => {
  deleteTarget.value = cat
  showDeleteModal.value = true
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
}
const confirmDeleteCategory = async () => {
  if (deleteTarget.value) {
    const success = await categoryStore.deleteCategory(deleteTarget.value.id)
    if (success) {
      showDeleteModal.value = false
      loadData()
    }
  }
}
</script>

<style lang="scss" scoped>
.category-page {
  padding: 24rpx;
  .section {
    margin-bottom: 48rpx;
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      margin-bottom: 18rpx;
      color: #1677ff;
    }
    .empty-text {
      color: #bbb;
      font-size: 26rpx;
      margin-bottom: 18rpx;
    }
    .category-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      border-radius: 18rpx;
      box-shadow: 0 2rpx 8rpx rgba(22,119,255,0.06);
      padding: 24rpx 18rpx;
      margin-bottom: 18rpx;
      .category-info {
        display: flex;
        align-items: center;
        .category-icon {
          width: 60rpx;
          height: 60rpx;
          border-radius: 50%;
          background: #f4f6fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32rpx;
          margin-right: 18rpx;
        }
        .category-meta {
          .category-name {
            font-size: 30rpx;
            color: #222;
            font-weight: 500;
          }
          .category-type {
            font-size: 24rpx;
            color: #888;
          }
        }
      }
      .category-actions {
        display: flex;
        gap: 12rpx;
      }
    }
  }
  .add-btn-bar {
    margin-top: 32rpx;
    text-align: center;
    button {
      width: 80%;
      font-size: 30rpx;
      border-radius: 16rpx;
      padding: 18rpx 0;
    }
  }
}
.modal-mask {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  border-radius: 18rpx;
  padding: 40rpx 32rpx 32rpx 32rpx;
  min-width: 540rpx;
  box-shadow: 0 8rpx 32rpx rgba(22,119,255,0.10);
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 28rpx;
  text-align: center;
}
.form-item {
  margin-bottom: 28rpx;
  .form-label {
    font-size: 26rpx;
    color: #888;
    margin-bottom: 8rpx;
    display: block;
  }
  .form-input {
    width: 100%;
    font-size: 30rpx;
    padding: 16rpx 12rpx;
    border: 1rpx solid #eee;
    border-radius: 12rpx;
    background: #f7f8fa;
    margin-top: 6rpx;
  }
  .picker-value {
    font-size: 28rpx;
    color: #1677ff;
    padding: 12rpx 0;
  }
  .color-list {
    display: flex;
    gap: 16rpx;
    margin-top: 8rpx;
    .color-dot {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      border: 2rpx solid #eee;
      box-sizing: border-box;
      cursor: pointer;
    }
  }
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 18rpx;
  margin-top: 18rpx;
}
.modal-body {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 18rpx;
  text-align: center;
}
</style>
