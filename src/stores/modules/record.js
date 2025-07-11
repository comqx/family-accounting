// 记录状态管理 - JavaScript版本

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import request from '../../utils/request';

export const useRecordStore = defineStore('record', () => {
  // 状态
  const records = ref([]);
  const currentRecord = ref(null);
  const isLoading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(1);

  // 计算属性
  const totalIncome = computed(() => 
    records.value
      .filter(record => record.type === 'income')
      .reduce((sum, record) => sum + record.amount, 0)
  );

  const totalExpense = computed(() => 
    records.value
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + record.amount, 0)
  );

  const balance = computed(() => totalIncome.value - totalExpense.value);

  const recentRecords = computed(() => 
    records.value
      .sort((a, b) => new Date(b.createTime || b.createdAt).getTime() - new Date(a.createTime || a.createdAt).getTime())
      .slice(0, 10)
  );

  // 创建记录
  const createRecord = async (recordData) => {
    try {
      isLoading.value = true;
      console.log('Creating record with data:', recordData);

      const response = await request.post('/api/record/create', recordData);
      console.log('Create record response:', response);

      // 兼容不同的响应格式
      let record = null;
      if (response.data?.record) {
        // 格式：{ data: { record: {...} } }
        record = response.data.record;
      } else if (response.data) {
        // 格式：{ data: {...} }
        record = response.data;
      }

      if (record) {
        records.value.unshift(record);
        console.log('Record created successfully:', record);
        return true;
      }

      console.warn('No record data in response');
      return false;
    } catch (error) {
      console.error('Create record error:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新记录
  const updateRecord = async (id, recordData) => {
    try {
      isLoading.value = true;

      const response = await request.put(`/api/record/${id}`, {
        id,
        ...recordData
      });

      // 兼容不同的响应格式
      let record = null;
      if (response.data?.record) {
        record = response.data.record;
      } else if (response.data) {
        record = response.data;
      }

      if (record) {
        const index = records.value.findIndex(record => record.id === id);
        if (index !== -1) {
          records.value[index] = record;
        }
        
        // 更新当前记录
        if (currentRecord.value?.id === id) {
          currentRecord.value = record;
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Update record error:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 删除记录
  const deleteRecord = async (id) => {
    try {
      isLoading.value = true;

      await request.delete(`/api/record/${id}`);

      const index = records.value.findIndex(record => record.id === id);
      if (index !== -1) {
        records.value.splice(index, 1);
      }
      
      // 清除当前记录
      if (currentRecord.value?.id === id) {
        currentRecord.value = null;
      }
      
      return true;
    } catch (error) {
      console.error('Delete record error:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 批量删除记录
  const batchDeleteRecords = async (ids) => {
    try {
      isLoading.value = true;

      const response = await request.post('/api/record/batch-delete', {
        ids
      });

      if (response.data?.deletedCount) {
        // 从本地数组中移除已删除的记录
        records.value = records.value.filter(record => !ids.includes(record.id));
        
        Taro.showToast({
          title: `已删除${response.data.deletedCount}条记录`,
          icon: 'success'
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Batch delete records error:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取记录列表
  const loadRecords = async (params) => {
    try {
      isLoading.value = true;
      console.log('Loading records with params:', params);

      const page = params?.refresh ? 1 : (params?.page || currentPage.value);
      
      const response = await request.get('/api/record/list', {
        ...params,
        page,
        pageSize: params?.pageSize || 20
      });

      console.log('Load records response:', response);

      // 兼容不同的响应格式
      let recordsData = null;
      let paginationData = null;
      
      if (response.data?.records) {
        // 格式：{ data: { records: [...], pagination: {...} } }
        recordsData = response.data.records;
        paginationData = response.data.pagination;
      } else if (response.data?.list) {
        // 格式：{ data: { list: [...], hasMore: boolean } }
        recordsData = response.data.list;
        paginationData = { hasMore: response.data.hasMore };
      } else if (Array.isArray(response.data)) {
        // 格式：{ data: [...] }
        recordsData = response.data;
        paginationData = { hasMore: false };
      }

      if (recordsData) {
        if (params?.refresh || page === 1) {
          records.value = recordsData;
        } else {
          records.value.push(...recordsData);
        }
        
        hasMore.value = paginationData?.hasMore || false;
        currentPage.value = page;
        
        console.log('Records loaded successfully:', recordsData.length);
        return true;
      }

      console.warn('No records data in response');
      return false;
    } catch (error) {
      console.error('Load records error:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取记录详情
  const getRecordDetail = async (id) => {
    try {
      isLoading.value = true;

      const response = await request.get(`/api/record/${id}`);

      // 兼容不同的响应格式
      let record = null;
      if (response.data?.record) {
        record = response.data.record;
      } else if (response.data) {
        record = response.data;
      }

      if (record) {
        currentRecord.value = record;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Get record detail error:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取最近记录
  const getRecentRecords = async (limit = 10) => {
    try {
      const response = await request.get('/api/record/list', {
        page: 1,
        pageSize: limit
      });

      // 兼容不同的响应格式
      let recordsData = null;
      if (response.data?.list) {
        recordsData = response.data.list;
      } else if (response.data?.records) {
        recordsData = response.data.records;
      } else if (Array.isArray(response.data)) {
        recordsData = response.data;
      }

      if (recordsData) {
        return recordsData;
      }

      return [];
    } catch (error) {
      console.error('Get recent records error:', error);
      return [];
    }
  };

  // 获取统计数据
  const getStatsByDateRange = async (startDate, endDate) => {
    try {
      const response = await request.get('/api/record/list', {
        startDate,
        endDate,
        page: 1,
        pageSize: 1000 // 获取所有记录用于统计
      });

      // 兼容不同的响应格式
      let recordsData = null;
      if (response.data?.list) {
        recordsData = response.data.list;
      } else if (response.data?.records) {
        recordsData = response.data.records;
      } else if (Array.isArray(response.data)) {
        recordsData = response.data;
      }

      if (recordsData) {
        const totalIncome = recordsData
          .filter(record => record.type === 'income')
          .reduce((sum, record) => sum + record.amount, 0);
        
        const totalExpense = recordsData
          .filter(record => record.type === 'expense')
          .reduce((sum, record) => sum + record.amount, 0);
        
        return {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          count: recordsData.length
        };
      }

      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        count: 0
      };
    } catch (error) {
      console.error('Get stats by date range error:', error);
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        count: 0
      };
    }
  };

  // 按分类统计
  const getStatsByCategory = async (startDate, endDate) => {
    try {
      const response = await request.get('/api/record/list', {
        startDate,
        endDate,
        page: 1,
        pageSize: 1000
      });

      // 兼容不同的响应格式
      let recordsData = null;
      if (response.data?.list) {
        recordsData = response.data.list;
      } else if (response.data?.records) {
        recordsData = response.data.records;
      } else if (Array.isArray(response.data)) {
        recordsData = response.data;
      }

      if (recordsData) {
        const categoryStats = new Map();
        let totalAmount = 0;

        recordsData.forEach(record => {
          const categoryId = record.categoryId;
          const current = categoryStats.get(categoryId) || { amount: 0, count: 0 };
          current.amount += record.amount;
          current.count += 1;
          categoryStats.set(categoryId, current);
          totalAmount += record.amount;
        });

        return Array.from(categoryStats.entries()).map(([categoryId, stats]) => ({
          categoryId,
          categoryName: '', // 需要从分类store获取
          amount: stats.amount,
          count: stats.count,
          percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0
        }));
      }

      return [];
    } catch (error) {
      console.error('Get stats by category error:', error);
      return [];
    }
  };

  // 搜索记录
  const searchRecords = async (keyword) => {
    try {
      const response = await request.get('/api/record/list', {
        keyword,
        page: 1,
        pageSize: 100
      });

      // 兼容不同的响应格式
      let recordsData = null;
      if (response.data?.list) {
        recordsData = response.data.list;
      } else if (response.data?.records) {
        recordsData = response.data.records;
      } else if (Array.isArray(response.data)) {
        recordsData = response.data;
      }

      if (recordsData) {
        return recordsData;
      }

      return [];
    } catch (error) {
      console.error('Search records error:', error);
      return [];
    }
  };

  // 加载更多记录
  const loadMoreRecords = async () => {
    if (!hasMore.value || isLoading.value) {
      return false;
    }

    return await loadRecords({
      page: currentPage.value + 1
    });
  };

  // 刷新记录列表
  const refreshRecords = async () => {
    return await loadRecords({
      refresh: true
    });
  };

  // 重置状态
  const $reset = () => {
    records.value = [];
    currentRecord.value = null;
    isLoading.value = false;
    hasMore.value = true;
    currentPage.value = 1;
  };

  return {
    // 状态
    records,
    currentRecord,
    isLoading,
    hasMore,
    currentPage,

    // 计算属性
    totalIncome,
    totalExpense,
    balance,
    recentRecords,

    // 方法
    createRecord,
    updateRecord,
    deleteRecord,
    batchDeleteRecords,
    loadRecords,
    getRecordDetail,
    getRecentRecords,
    getStatsByDateRange,
    getStatsByCategory,
    searchRecords,
    loadMoreRecords,
    refreshRecords,
    $reset
  };
}); 