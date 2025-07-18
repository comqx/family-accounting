import Taro from '@tarojs/taro'
import { formatDate } from './format'

export interface BackupData {
  version: string
  timestamp: number
  family: any
  records: any[]
  categories: any[]
  members: any[]
  budgets: any[]
  settings: any
  encrypted?: boolean
}

export interface BackupOptions {
  includeRecords?: boolean
  includeCategories?: boolean
  includeMembers?: boolean
  includeBudgets?: boolean
  includeSettings?: boolean
  encrypt?: boolean
}

/**
 * 创建数据备份
 * @param data 要备份的数据
 * @param options 备份选项
 */
export const createBackup = async (data: Partial<BackupData>, options: BackupOptions = {}): Promise<string> => {
  try {
    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: Date.now(),
      family: data.family || null,
      records: options.includeRecords !== false ? (data.records || []) : [],
      categories: options.includeCategories !== false ? (data.categories || []) : [],
      members: options.includeMembers !== false ? (data.members || []) : [],
      budgets: options.includeBudgets !== false ? (data.budgets || []) : [],
      settings: options.includeSettings !== false ? (data.settings || {}) : {}
    }

    // 如果启用加密，对敏感数据进行加密
    if (options.encrypt) {
      backupData.records = encryptRecords(backupData.records)
      backupData.family = encryptFamily(backupData.family)
    }

    // 压缩数据
    const compressedData = await compressData(backupData)
    
    // 保存到本地存储
    const backupKey = `backup_${Date.now()}`
    await Taro.setStorage({
      key: backupKey,
      data: compressedData
    })

    // 保存备份元信息
    const backupMeta = {
      key: backupKey,
      timestamp: backupData.timestamp,
      size: compressedData.length,
      recordCount: backupData.records.length,
      categoryCount: backupData.categories.length,
      memberCount: backupData.members.length,
      budgetCount: backupData.budgets.length,
      encrypted: options.encrypt || false
    }

    const metaList = await getBackupMetaList()
    metaList.unshift(backupMeta)
    
    // 只保留最近10个备份
    if (metaList.length > 10) {
      metaList.splice(10)
    }

    await Taro.setStorage({
      key: 'backup_meta_list',
      data: metaList
    })

    return backupKey
  } catch (error) {
    console.error('Create backup error:', error)
    throw new Error('创建备份失败')
  }
}

/**
 * 恢复数据备份
 * @param backupKey 备份标识
 */
export const restoreBackup = async (backupKey: string): Promise<BackupData> => {
  try {
    // 获取备份数据
    const backupRes = await Taro.getStorage({ key: backupKey })
    if (!backupRes.data) {
      throw new Error('备份数据不存在')
    }

    // 解压数据
    const backupData = await decompressData(backupRes.data) as BackupData

    // 验证数据完整性
    if (!validateBackupData(backupData)) {
      throw new Error('备份数据损坏')
    }

    // 如果数据已加密，进行解密
    if (backupData.encrypted) {
      backupData.records = decryptRecords(backupData.records)
      backupData.family = decryptFamily(backupData.family)
    }

    return backupData
  } catch (error) {
    console.error('Restore backup error:', error)
    throw new Error('恢复备份失败')
  }
}

/**
 * 获取备份列表
 */
export const getBackupList = async (): Promise<any[]> => {
  try {
    const metaList = await getBackupMetaList()
    return metaList.map(meta => ({
      ...meta,
      date: formatDate(meta.timestamp, 'YYYY-MM-DD HH:mm:ss'),
      sizeFormatted: formatFileSize(meta.size)
    }))
  } catch (error) {
    console.error('Get backup list error:', error)
    return []
  }
}

/**
 * 删除备份
 * @param backupKey 备份标识
 */
export const deleteBackup = async (backupKey: string): Promise<void> => {
  try {
    // 删除备份数据
    await Taro.removeStorage({ key: backupKey })
    
    // 更新元信息列表
    const metaList = await getBackupMetaList()
    const updatedList = metaList.filter(meta => meta.key !== backupKey)
    
    await Taro.setStorage({
      key: 'backup_meta_list',
      data: updatedList
    })
  } catch (error) {
    console.error('Delete backup error:', error)
    throw new Error('删除备份失败')
  }
}

/**
 * 自动备份
 * @param data 要备份的数据
 */
export const autoBackup = async (data: Partial<BackupData>): Promise<void> => {
  try {
    const settings = await getBackupSettings()
    
    if (!settings.autoBackup) {
      return
    }

    // 检查是否需要备份（距离上次备份超过指定时间）
    const lastBackupTime = settings.lastBackupTime || 0
    const now = Date.now()
    const backupInterval = settings.backupInterval || 24 * 60 * 60 * 1000 // 默认24小时

    if (now - lastBackupTime < backupInterval) {
      return
    }

    // 执行备份
    await createBackup(data, {
      includeRecords: settings.includeRecords,
      includeCategories: settings.includeCategories,
      includeMembers: settings.includeMembers,
      includeBudgets: settings.includeBudgets,
      includeSettings: settings.includeSettings,
      encrypt: settings.encrypt
    })

    // 更新最后备份时间
    settings.lastBackupTime = now
    await saveBackupSettings(settings)

    console.log('Auto backup completed')
  } catch (error) {
    console.error('Auto backup error:', error)
  }
}

/**
 * 获取备份设置
 */
export const getBackupSettings = async (): Promise<any> => {
  try {
    const res = await Taro.getStorage({ key: 'backup_settings' })
    return res.data || {
      autoBackup: false,
      backupInterval: 24 * 60 * 60 * 1000, // 24小时
      includeRecords: true,
      includeCategories: true,
      includeMembers: true,
      includeBudgets: true,
      includeSettings: true,
      encrypt: false
    }
  } catch (error) {
    return {
      autoBackup: false,
      backupInterval: 24 * 60 * 60 * 1000,
      includeRecords: true,
      includeCategories: true,
      includeMembers: true,
      includeBudgets: true,
      includeSettings: true,
      encrypt: false
    }
  }
}

/**
 * 保存备份设置
 */
export const saveBackupSettings = async (settings: any): Promise<void> => {
  await Taro.setStorage({
    key: 'backup_settings',
    data: settings
  })
}

// 辅助函数

/**
 * 获取备份元信息列表
 */
const getBackupMetaList = async (): Promise<any[]> => {
  try {
    const res = await Taro.getStorage({ key: 'backup_meta_list' })
    return res.data || []
  } catch (error) {
    return []
  }
}

/**
 * 压缩数据
 */
const compressData = async (data: any): Promise<string> => {
  // 简单的数据压缩（实际项目中可以使用更高效的压缩算法）
  return JSON.stringify(data)
}

/**
 * 解压数据
 */
const decompressData = async (compressedData: string): Promise<any> => {
  return JSON.parse(compressedData)
}

/**
 * 验证备份数据完整性
 */
const validateBackupData = (data: any): boolean => {
  return data && 
         typeof data.version === 'string' && 
         typeof data.timestamp === 'number' &&
         Array.isArray(data.records) &&
         Array.isArray(data.categories) &&
         Array.isArray(data.members)
}

/**
 * 加密记录数据
 */
const encryptRecords = (records: any[]): any[] => {
  // 简单的数据加密（实际项目中应使用更安全的加密算法）
  return records.map(record => ({
    ...record,
    description: record.description ? btoa(record.description) : '',
    amount: btoa(record.amount.toString())
  }))
}

/**
 * 解密记录数据
 */
const decryptRecords = (records: any[]): any[] => {
  return records.map(record => ({
    ...record,
    description: record.description ? atob(record.description) : '',
    amount: parseFloat(atob(record.amount))
  }))
}

/**
 * 加密家庭数据
 */
const encryptFamily = (family: any): any => {
  if (!family) return null
  return {
    ...family,
    name: family.name ? btoa(family.name) : ''
  }
}

/**
 * 解密家庭数据
 */
const decryptFamily = (family: any): any => {
  if (!family) return null
  return {
    ...family,
    name: family.name ? atob(family.name) : ''
  }
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 