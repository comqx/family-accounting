// 分类状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { Category, RecordType } from '../../types/business';
import { CategoryAPI } from '../../types/api';
import request from '../../utils/request';

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);

  // 计算属性
  const expenseCategories = computed(() => 
    categories.value.filter(cat => cat.type === RecordType.EXPENSE && cat.isActive)
  );

  const incomeCategories = computed(() => 
    categories.value.filter(cat => cat.type === RecordType.INCOME && cat.isActive)
  );

  const defaultCategories = computed(() => 
    categories.value.filter(cat => cat.isDefault)
  );

  const customCategories = computed(() => 
    categories.value.filter(cat => !cat.isDefault)
  );

  // 获取分类列表
  const loadCategories = async (familyId?: string): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.get<CategoryAPI.GetCategoriesResponse>('/categories', {
        familyId,
        includeDefault: true
      });

      if (response.data?.categories) {
        categories.value = response.data.categories.sort((a, b) => a.sort - b.sort);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Load categories error:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 创建分类
  const createCategory = async (categoryData: {
    name: string;
    icon: string;
    color: string;
    type: RecordType;
    parentId?: string;
  }): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.post<CategoryAPI.CreateCategoryResponse>('/categories', categoryData);

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
    } catch (error: any) {
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
  const updateCategory = async (id: string, categoryData: Partial<{
    name: string;
    icon: string;
    color: string;
    type: RecordType;
    parentId?: string;
  }>): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await request.put<CategoryAPI.UpdateCategoryResponse>(`/categories/${id}`, categoryData);

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
    } catch (error: any) {
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
  const deleteCategory = async (id: string): Promise<boolean> => {
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
    } catch (error: any) {
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
  const updateCategoriesSort = async (categoryIds: string[]): Promise<boolean> => {
    try {
      const response = await request.put<CategoryAPI.SortCategoriesResponse>('/categories/sort', {
        categoryIds
      });

      if (response.data?.categories) {
        categories.value = response.data.categories;
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Update categories sort error:', error);
      return false;
    }
  };

  // 根据ID获取分类
  const getCategoryById = (id: string): Category | undefined => {
    return categories.value.find(cat => cat.id === id);
  };

  // 根据类型获取分类
  const getCategoriesByType = (type: RecordType): Category[] => {
    return categories.value.filter(cat => cat.type === type && cat.isActive);
  };

  // 搜索分类
  const searchCategories = (keyword: string): Category[] => {
    if (!keyword.trim()) {
      return categories.value;
    }
    
    return categories.value.filter(cat => 
      cat.name.toLowerCase().includes(keyword.toLowerCase()) && cat.isActive
    );
  };

  // 初始化默认分类
  const initDefaultCategories = () => {
    const defaultExpenseCategories = [
      { name: '餐饮', icon: '🍽️', color: '#ff6b6b' },
      { name: '交通', icon: '🚗', color: '#4ecdc4' },
      { name: '购物', icon: '🛍️', color: '#45b7d1' },
      { name: '娱乐', icon: '🎮', color: '#96ceb4' },
      { name: '医疗', icon: '🏥', color: '#feca57' },
      { name: '教育', icon: '📚', color: '#ff9ff3' },
      { name: '住房', icon: '🏠', color: '#54a0ff' },
      { name: '通讯', icon: '📱', color: '#5f27cd' },
      { name: '其他', icon: '💰', color: '#999999' }
    ];

    const defaultIncomeCategories = [
      { name: '工资', icon: '💼', color: '#00d2d3' },
      { name: '奖金', icon: '🎁', color: '#ff9f43' },
      { name: '投资', icon: '📈', color: '#10ac84' },
      { name: '兼职', icon: '💻', color: '#ee5a24' },
      { name: '红包', icon: '🧧', color: '#ff3838' },
      { name: '其他', icon: '💰', color: '#999999' }
    ];

    // 支出分类
    defaultExpenseCategories.forEach((cat, index) => {
      categories.value.push({
        id: `expense_${index}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: RecordType.EXPENSE,
        isDefault: true,
        sort: index,
        isActive: true,
        createTime: new Date()
      });
    });

    // 收入分类
    defaultIncomeCategories.forEach((cat, index) => {
      categories.value.push({
        id: `income_${index}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: RecordType.INCOME,
        isDefault: true,
        sort: index,
        isActive: true,
        createTime: new Date()
      });
    });
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
    defaultCategories,
    customCategories,

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
    initDefaultCategories,
    $reset
  };
});
