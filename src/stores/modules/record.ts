// 记录状态管理

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { AccountRecord, RecordType } from '../../types/business';
import { RecordAPI } from '../../types/api';
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
      .filter(record => record.type === RecordType.INCOME)
      .reduce((sum, record) => sum + record.amount, 0)
  );

  const totalExpense = computed(() => 
    records.value
      .filter(record => record.type === RecordType.EXPENSE)
      .reduce((sum, record) => sum + record.amount, 0)
  );

  const balance = computed(() => totalIncome.value - totalExpense.value);

  const recentRecords = computed(() => 
    records.value
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .slice(0, 10)
  );

  // 创建记录
  const createRecord = async (recordData) => {
    try {
      isLoading.value = true;

      const response = await request.post<RecordAPI.CreateRecordResponse>('/records', recordData);

      if (response.data?.record) {
        records.value.unshift(response.data.record);
        return true;
      }

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

      const response = await request.put<RecordAPI.UpdateRecordResponse>(`/records/${id}`, {
        id,
        ...recordData
      });

      if (response.data?.record) {
        const index = records.value.findIndex(record => record.id === id);
        if (index !== -1) {
          records.value[index] = response.data.record;
        }
        
        // 更新当前记录
        if (currentRecord.value?.id === id) {
          currentRecord.value = response.data.record;
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

      await request.delete(`/records/${id}`);

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

      const response = await request.post<RecordAPI.BatchDeleteResponse>('/records/batch-delete', {
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

      const page = params?.refresh ? 1 : (params?.page || currentPage.value);
      
      const response = await request.get<RecordAPI.GetRecordsResponse>('/records', {
        ...params,
        page,
        pageSize: params?.pageSize || 20
      });

      if (response.data) {
        if (params?.refresh || page === 1) {
          records.value = response.data.list;
        } else {
          records.value.push(...response.data.list);
        }
        
        hasMore.value = response.data.hasMore;
        currentPage.value = page;
        
        return true;
      }

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

      const response = await request.get<RecordAPI.GetRecordDetailResponse>(`/records/${id}`);

      if (response.data?.record) {
        currentRecord.value = response.data.record;
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
      const response = await request.get<RecordAPI.GetRecordsResponse>('/records', {
        page: 1,
        pageSize: limit
      });

      if (response.data?.list) {
        return response.data.list;
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
      const response = await request.get<RecordAPI.GetRecordsResponse>('/records', {
        startDate,
        endDate,
        page: 1,
        pageSize: 1000 // 获取所有记录用于统计
      });

      if (response.data?.list) {
        const records = response.data.list;
        const totalIncome = records
          .filter(record => record.type === RecordType.INCOME)
          .reduce((sum, record) => sum + record.amount, 0);
        
        const totalExpense = records
          .filter(record => record.type === RecordType.EXPENSE)
          .reduce((sum, record) => sum + record.amount, 0);

        return {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          recordCount: records.length
        };
      }

      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        recordCount: 0
      };
    } catch (error) {
      console.error('Get stats by date range error:', error);
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        recordCount: 0
      };
    }
  };

  // 按分类统计
  const getStatsByCategory = async (startDate, endDate) => {
    try {
      const response = await request.get<RecordAPI.GetRecordsResponse>('/records', {
        startDate,
        endDate,
        page: 1,
        pageSize: 1000
      });

      if (response.data?.list) {
        const records = response.data.list;
        const categoryStats = new Map();
        let totalAmount = 0;

        records.forEach(record => {
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
      const response = await request.get<RecordAPI.GetRecordsResponse>('/records', {
        keyword,
        page: 1,
        pageSize: 100
      });

      if (response.data?.list) {
        return response.data.list;
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
