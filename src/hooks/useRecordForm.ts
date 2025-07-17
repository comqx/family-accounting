import { ref, computed } from 'vue'
import { useUserStore, useFamilyStore, useCategoryStore, useRecordStore } from '../stores'
import { debounce } from '../utils/performance/debounce'
import Taro from '@tarojs/taro'
import request from '../utils/request'
import { useRealTimeSync } from './useRealTimeSync'

/**
 * 记账表单业务逻辑复用 composable
 * 用于首页、记账弹窗等场景，统一表单状态、校验、保存、数据加载等
 */
export function useRecordForm() {
  // Store
  const userStore = useUserStore()
  const familyStore = useFamilyStore()
  const categoryStore = useCategoryStore()
  const recordStore = useRecordStore()
  const { syncRecordChange } = useRealTimeSync()

  // 表单状态
  const recordForm = ref({
    type: 'expense',
    amount: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const amountFocused = ref(false)
  const saving = ref(false)
  const monthExpense = ref(0)
  const monthIncome = ref(0)
  const recentRecords = ref([])
  const loadingData = ref(true)
  const maxDate = new Date().toISOString().split('T')[0]

  // 计算属性
  const currentCategories = computed(() => {
    return (categoryStore.categories as any[]).filter(cat => cat.type === recordForm.value.type)
  })
  const canSave = computed(() => {
    return recordForm.value.amount &&
      parseFloat(recordForm.value.amount) > 0 &&
      recordForm.value.categoryId
  })

  // 方法
  const switchType = (type: string) => {
    recordForm.value.type = type
    recordForm.value.categoryId = ''
    loadCategories()
  }
  const onAmountInput = (e: any) => {
    let value = e.detail.value
    if (value.includes('.')) {
      const parts = value.split('.')
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2)
      }
    }
    recordForm.value.amount = value
  }
  const onRemarkInput = (e: any) => {
    recordForm.value.description = e.detail.value
  }
  const selectCategory = (category: any) => {
    recordForm.value.categoryId = String(category.id)
  }
  const onDateChange = (e: any) => {
    recordForm.value.date = e.detail.value
  }
  const resetForm = () => {
    recordForm.value = {
      type: 'expense',
      amount: '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    }
  }
  const saveRecord = async () => {
    if (!canSave.value || saving.value) return
    if (!familyStore.familyId) {
      Taro.showToast({ title: '请先加入或创建家庭', icon: 'none' })
      return
    }
    try {
      saving.value = true
      const recordData = {
        familyId: familyStore.familyId,
        type: recordForm.value.type,
        amount: parseFloat(recordForm.value.amount),
        categoryId: recordForm.value.categoryId,
        description: recordForm.value.description,
        date: recordForm.value.date
      }
      const success = await recordStore.createRecord(recordData)
      if (success) {
        syncRecordChange('create', recordData)
        Taro.showToast({ title: '保存成功', icon: 'success' })
        resetForm()
        await loadData()
      } else {
        throw new Error('保存失败')
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      saving.value = false
    }
  }
  const debouncedSaveRecord = debounce(saveRecord, 800)

  // 数据加载
  const loadCategories = async () => {
    try {
      await categoryStore.loadCategories(familyStore.familyId)
    } catch (error) {
      // ignore
    }
  }
  const loadRecentRecords = async () => {
    try {
      const res = await recordStore.getRecentRecords(10)
      recentRecords.value = res || []
    } catch {}
  }
  const loadMonthStats = async () => {
    try {
      const now = new Date()
      const startDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-01`
      const endDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-31`
      const res = await request.get('/api/report/statistics', {
        familyId: familyStore.familyId,
        startDate,
        endDate
      }, undefined)
      if (res.data) {
        monthExpense.value = res.data.totalExpense || 0
        monthIncome.value = res.data.totalIncome || 0
      }
    } catch {}
  }
  const loadData = async () => {
    loadingData.value = true
    await loadCategories()
    await loadRecentRecords()
    await loadMonthStats()
    loadingData.value = false
  }

  return {
    recordForm,
    amountFocused,
    saving,
    monthExpense,
    monthIncome,
    recentRecords,
    loadingData,
    maxDate,
    currentCategories,
    canSave,
    switchType,
    onAmountInput,
    onRemarkInput,
    selectCategory,
    onDateChange,
    resetForm,
    saveRecord,
    debouncedSaveRecord,
    loadData
  }
} 