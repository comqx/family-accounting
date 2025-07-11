// 分类状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { Category, RecordType } from '../../types/business';
import { CategoryAPI } from '../../types/api';
import request from '../../utils/request';

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const categories = ref([]);
  const isLoading = ref(false);

  // 计算属性
  const expenseCategories = computed(() => 
    categories.value.filter(cat => cat.type === RecordType.EXPENSE && cat.isActive)
  );

  const incomeCategories = computed(() => 
    categories.value.filter(cat => cat.type === RecordType.INCOME && cat.isActive)
  );

  // 获取分类列表
  const loadCategories = async (familyId) => {
    try {
      isLoading.value = true;
      // cloud接口：/api/category/list
      const response = await request.get('/api/category/list', {
        familyId
      });
      if (response.data?.categories) {
        categories.value = response.data.categories.sort((a, b) => a.sort - b.sort);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Load categories error:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 创建分类
  const createCategory = async (categoryData) => {
    try {
      isLoading.value = true;

      const response = await request.post('/categories', categoryData);

      if (response.data?.category) {
        categories.value.push(response.data.category);
        sortCategories();
        
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Create category error:', error);
      Taro.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新分类
  const updateCategory = async (id, categoryData) => {
    try {
      isLoading.value = true;

      const response = await request.put(`/categories/${id}`, categoryData);

      if (response.data?.category) {
        const index = categories.value.findIndex(cat => cat.id === id);
        if (index !== -1) {
          categories.value[index] = response.data.category;
        }
        
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Update category error:', error);
      Taro.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 删除分类
  const deleteCategory = async (id) => {
    try {
      isLoading.value = true;

      await request.delete(`/categories/${id}`);

      const index = categories.value.findIndex(cat => cat.id === id);
      if (index !== -1) {
        categories.value.splice(index, 1);
      }
      
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Delete category error:', error);
      Taro.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 排序分类
  const sortCategories = () => {
    categories.value.sort((a, b) => {
      // 默认分类排在前面
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // 按类型排序
      if (a.type !== b.type) {
        return a.type === RecordType.EXPENSE ? -1 : 1;
      }
      
      // 按排序字段排序
      return a.sort - b.sort;
    });
  };

  // 更新分类排序
  const updateCategoriesSort = async (categoryIds) => {
    try {
      const response = await request.put('/categories/sort', {
        categoryIds
      });

      if (response.data?.categories) {
        categories.value = response.data.categories;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Update categories sort error:', error);
      return false;
    }
  };

  // 根据ID获取分类
  const getCategoryById = (id) => {
    return categories.value.find(cat => cat.id === id);
  };

  // 根据类型获取分类
  const getCategoriesByType = (type) => {
    return categories.value.filter(cat => cat.type === type && cat.isActive);
  };

  // 搜索分类
  const searchCategories = (keyword) => {
    if (!keyword.trim()) {
      return categories.value;
    }
    
    return categories.value.filter(cat => 
      cat.name.toLowerCase().includes(keyword.toLowerCase()) && cat.isActive
    );
  };

  // 重置状态
  const $reset = () => {
    categories.value = [];
    isLoading.value = false;
  };

  return {
    // 状态
    categories,
    isLoading,

    // 计算属性
    expenseCategories,
    incomeCategories,

    // 方法
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    sortCategories,
    updateCategoriesSort,
    getCategoryById,
    getCategoriesByType,
    searchCategories,
    $reset
  };
});
