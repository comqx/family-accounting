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
  const loadCategories = async (familyId: string, includeDefault = true) => {
    try {
      isLoading.value = true;

      const response = await request.get<CategoryAPI.GetCategoriesResponse>('/categories', {
        familyId,
        includeDefault
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
  const createCategory = async (categoryData: Partial<Category>) => {
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
    } catch (error) {
      console.error('Create category error:', error);
      Taro.showToast({
        title: '创建失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新分类
  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
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
    } catch (error) {
      console.error('Update category error:', error);
      Taro.showToast({
        title: '更新失败',
        icon: 'none'
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 删除分类
  const deleteCategory = async (id: string) => {
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
        title: '删除失败',
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
  const updateCategoriesSort = async (categoryIds: string[]) => {
    try {
      const response = await request.put<CategoryAPI.SortCategoriesResponse>('/categories/sort', {
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
  const getCategoryById = (id: string) => {
    return categories.value.find(cat => cat.id === id);
  };

  // 根据类型获取分类
  const getCategoriesByType = (type: RecordType) => {
    return categories.value.filter(cat => cat.type === type && cat.isActive);
  };

  // 搜索分类
  const searchCategories = (keyword: string) => {
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
      { name: '餐饮', icon: '🍽️' },
      { name: '交通', icon: '🚗' },
      { name: '购物', icon: '🛍️' },
      { name: '娱乐', icon: '🎮' },
      { name: '医疗', icon: '🏥' },
      { name: '教育', icon: '📚' },
      { name: '住房', icon: '🏠' },
      { name: '其他', icon: '📝' }
    ];

    const defaultIncomeCategories = [
      { name: '工资', icon: '💰' },
      { name: '奖金', icon: '🎁' },
      { name: '投资', icon: '📈' },
      { name: '兼职', icon: '💼' },
      { name: '其他', icon: '📝' }
    ];

    // 支出分类
    defaultExpenseCategories.forEach((cat, index) => {
      categories.value.push({
        id: `expense_${index}`,
        name: cat.name,
        icon: cat.icon,
        type: RecordType.EXPENSE,
        isDefault: true,
        isActive: true,
        sort: index,
        familyId: '',
        createTime: new Date(),
        updateTime: new Date()
      });
    });

    // 收入分类
    defaultIncomeCategories.forEach((cat, index) => {
      categories.value.push({
        id: `income_${index}`,
        name: cat.name,
        icon: cat.icon,
        type: RecordType.INCOME,
        isDefault: true,
        isActive: true,
        sort: index,
        familyId: '',
        createTime: new Date(),
        updateTime: new Date()
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
