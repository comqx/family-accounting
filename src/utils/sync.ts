import Taro from '@tarojs/taro'
import { formatDate } from './format'

export interface SyncItem {
  id: string
  type: 'record' | 'category' | 'member' | 'budget' | 'family'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  userId: string
  deviceId: string
}

export interface SyncResult {
  success: boolean
  syncedItems: number
  conflicts: SyncConflict[]
  errors: string[]
}

export interface SyncConflict {
  item: SyncItem
  reason: 'version_conflict' | 'data_conflict' | 'permission_denied'
  serverData?: any
  localData?: any
}

export interface SyncOptions {
  force?: boolean
  resolveConflicts?: 'local' | 'server' | 'manual'
  includeDeleted?: boolean
  batchSize?: number
}

/**
 * 数据同步管理器
 */
class SyncManager {
  private syncQueue: SyncItem[] = []
  private isSyncing = false
  private lastSyncTime = 0
  private deviceId = ''

  constructor() {
    this.initDeviceId()
  }

  /**
   * 初始化设备ID
   */
  private async initDeviceId() {
    try {
      const res = await Taro.getStorage({ key: 'device_id' })
      if (res.data) {
        this.deviceId = res.data
      } else {
        this.deviceId = this.generateDeviceId()
        await Taro.setStorage({
          key: 'device_id',
          data: this.deviceId
        })
      }
    } catch (error) {
      this.deviceId = this.generateDeviceId()
      await Taro.setStorage({
        key: 'device_id',
        data: this.deviceId
      })
    }
  }

  /**
   * 生成设备ID
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 添加同步项到队列
   */
  addToSyncQueue(item: Omit<SyncItem, 'timestamp' | 'deviceId'>): void {
    const syncItem: SyncItem = {
      ...item,
      timestamp: Date.now(),
      deviceId: this.deviceId
    }

    this.syncQueue.push(syncItem)
    this.saveSyncQueue()
  }

  /**
   * 执行同步
   */
  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing && !options.force) {
      throw new Error('同步正在进行中')
    }

    this.isSyncing = true

    try {
      const result: SyncResult = {
        success: true,
        syncedItems: 0,
        conflicts: [],
        errors: []
      }

      // 检查网络连接
      if (!await this.checkNetworkConnection()) {
        throw new Error('网络连接不可用')
      }

      // 获取本地同步队列
      const localQueue = await this.getSyncQueue()
      if (localQueue.length === 0) {
        this.isSyncing = false
        return result
      }

      // 分批同步
      const batchSize = options.batchSize || 50
      const batches = this.chunkArray(localQueue, batchSize)

      for (const batch of batches) {
        const batchResult = await this.syncBatch(batch, options)
        
        result.syncedItems += batchResult.syncedItems
        result.conflicts.push(...batchResult.conflicts)
        result.errors.push(...batchResult.errors)

        if (batchResult.errors.length > 0) {
          result.success = false
        }
      }

      // 更新最后同步时间
      this.lastSyncTime = Date.now()
      await this.saveLastSyncTime()

      // 清理已同步的项
      await this.clearSyncedItems()

      return result
    } catch (error) {
      console.error('Sync error:', error)
      return {
        success: false,
        syncedItems: 0,
        conflicts: [],
        errors: [error.message]
      }
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 同步单个批次
   */
  private async syncBatch(batch: SyncItem[], options: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      conflicts: [],
      errors: []
    }

    try {
      // 发送同步请求到服务器
      const response = await Taro.request({
        url: '/api/sync/batch',
        method: 'POST',
        data: {
          items: batch,
          options
        }
      })

      if (response.statusCode === 200) {
        const syncResponse = response.data
        
        result.syncedItems = syncResponse.syncedItems || 0
        result.conflicts = syncResponse.conflicts || []
        
        // 处理冲突
        if (result.conflicts.length > 0) {
          await this.handleConflicts(result.conflicts, options.resolveConflicts)
        }

        // 获取服务器更新
        if (syncResponse.serverUpdates) {
          await this.applyServerUpdates(syncResponse.serverUpdates)
        }
      } else {
        result.success = false
        result.errors.push(`同步失败: ${response.statusCode}`)
      }
    } catch (error) {
      result.success = false
      result.errors.push(error.message)
    }

    return result
  }

  /**
   * 处理同步冲突
   */
  private async handleConflicts(conflicts: SyncConflict[], resolveStrategy?: string): Promise<void> {
    for (const conflict of conflicts) {
      switch (resolveStrategy) {
        case 'local':
          await this.resolveConflictLocal(conflict)
          break
        case 'server':
          await this.resolveConflictServer(conflict)
          break
        case 'manual':
        default:
          await this.resolveConflictManual(conflict)
          break
      }
    }
  }

  /**
   * 本地优先解决冲突
   */
  private async resolveConflictLocal(conflict: SyncConflict): Promise<void> {
    // 强制使用本地数据
    const forceUpdateItem: SyncItem = {
      ...conflict.item,
      timestamp: Date.now(),
      deviceId: this.deviceId
    }
    
    this.addToSyncQueue(forceUpdateItem)
  }

  /**
   * 服务器优先解决冲突
   */
  private async resolveConflictServer(conflict: SyncConflict): Promise<void> {
    // 使用服务器数据更新本地
    if (conflict.serverData) {
      await this.updateLocalData(conflict.item.type, conflict.serverData)
    }
  }

  /**
   * 手动解决冲突
   */
  private async resolveConflictManual(conflict: SyncConflict): Promise<void> {
    // 显示冲突解决对话框
    const result = await Taro.showModal({
      title: '数据冲突',
      content: `检测到数据冲突，请选择要保留的数据版本。\n\n冲突类型: ${conflict.reason}`,
      confirmText: '使用本地',
      cancelText: '使用服务器',
      showCancel: true
    })

    if (result.confirm) {
      await this.resolveConflictLocal(conflict)
    } else {
      await this.resolveConflictServer(conflict)
    }
  }

  /**
   * 应用服务器更新
   */
  private async applyServerUpdates(updates: any[]): Promise<void> {
    for (const update of updates) {
      try {
        await this.updateLocalData(update.type, update.data)
      } catch (error) {
        console.error('Apply server update error:', error)
      }
    }
  }

  /**
   * 更新本地数据
   */
  private async updateLocalData(type: string, data: any): Promise<void> {
    // 根据类型更新对应的本地存储
    switch (type) {
      case 'record':
        await this.updateLocalRecords(data)
        break
      case 'category':
        await this.updateLocalCategories(data)
        break
      case 'member':
        await this.updateLocalMembers(data)
        break
      case 'budget':
        await this.updateLocalBudgets(data)
        break
      case 'family':
        await this.updateLocalFamily(data)
        break
    }
  }

  /**
   * 更新本地记录
   */
  private async updateLocalRecords(data: any): Promise<void> {
    const records = await this.getLocalRecords()
    const index = records.findIndex(r => r.id === data.id)
    
    if (index >= 0) {
      records[index] = { ...records[index], ...data }
    } else {
      records.push(data)
    }
    
    await Taro.setStorage({
      key: 'local_records',
      data: records
    })
  }

  /**
   * 更新本地分类
   */
  private async updateLocalCategories(data: any): Promise<void> {
    const categories = await this.getLocalCategories()
    const index = categories.findIndex(c => c.id === data.id)
    
    if (index >= 0) {
      categories[index] = { ...categories[index], ...data }
    } else {
      categories.push(data)
    }
    
    await Taro.setStorage({
      key: 'local_categories',
      data: categories
    })
  }

  /**
   * 更新本地成员
   */
  private async updateLocalMembers(data: any): Promise<void> {
    const members = await this.getLocalMembers()
    const index = members.findIndex(m => m.id === data.id)
    
    if (index >= 0) {
      members[index] = { ...members[index], ...data }
    } else {
      members.push(data)
    }
    
    await Taro.setStorage({
      key: 'local_members',
      data: members
    })
  }

  /**
   * 更新本地预算
   */
  private async updateLocalBudgets(data: any): Promise<void> {
    const budgets = await this.getLocalBudgets()
    const index = budgets.findIndex(b => b.id === data.id)
    
    if (index >= 0) {
      budgets[index] = { ...budgets[index], ...data }
    } else {
      budgets.push(data)
    }
    
    await Taro.setStorage({
      key: 'local_budgets',
      data: budgets
    })
  }

  /**
   * 更新本地家庭信息
   */
  private async updateLocalFamily(data: any): Promise<void> {
    await Taro.setStorage({
      key: 'local_family',
      data
    })
  }

  /**
   * 检查网络连接
   */
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      const networkType = await Taro.getNetworkType()
      return networkType.networkType !== 'none'
    } catch (error) {
      return false
    }
  }

  /**
   * 获取同步队列
   */
  private async getSyncQueue(): Promise<SyncItem[]> {
    try {
      const res = await Taro.getStorage({ key: 'sync_queue' })
      return res.data || []
    } catch (error) {
      return []
    }
  }

  /**
   * 保存同步队列
   */
  private async saveSyncQueue(): Promise<void> {
    await Taro.setStorage({
      key: 'sync_queue',
      data: this.syncQueue
    })
  }

  /**
   * 清理已同步的项
   */
  private async clearSyncedItems(): Promise<void> {
    this.syncQueue = []
    await this.saveSyncQueue()
  }

  /**
   * 保存最后同步时间
   */
  private async saveLastSyncTime(): Promise<void> {
    await Taro.setStorage({
      key: 'last_sync_time',
      data: this.lastSyncTime
    })
  }

  /**
   * 获取最后同步时间
   */
  async getLastSyncTime(): Promise<number> {
    try {
      const res = await Taro.getStorage({ key: 'last_sync_time' })
      return res.data || 0
    } catch (error) {
      return 0
    }
  }

  /**
   * 获取本地记录
   */
  private async getLocalRecords(): Promise<any[]> {
    try {
      const res = await Taro.getStorage({ key: 'local_records' })
      return res.data || []
    } catch (error) {
      return []
    }
  }

  /**
   * 获取本地分类
   */
  private async getLocalCategories(): Promise<any[]> {
    try {
      const res = await Taro.getStorage({ key: 'local_categories' })
      return res.data || []
    } catch (error) {
      return []
    }
  }

  /**
   * 获取本地成员
   */
  private async getLocalMembers(): Promise<any[]> {
    try {
      const res = await Taro.getStorage({ key: 'local_members' })
      return res.data || []
    } catch (error) {
      return []
    }
  }

  /**
   * 获取本地预算
   */
  private async getLocalBudgets(): Promise<any[]> {
    try {
      const res = await Taro.getStorage({ key: 'local_budgets' })
      return res.data || []
    } catch (error) {
      return []
    }
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): { isSyncing: boolean; queueLength: number; lastSyncTime: number } {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime
    }
  }
}

// 创建全局同步管理器实例
export const syncManager = new SyncManager()

// 导出便捷函数
export const addToSyncQueue = (item: Omit<SyncItem, 'timestamp' | 'deviceId'>) => {
  syncManager.addToSyncQueue(item)
}

export const sync = (options?: SyncOptions) => syncManager.sync(options)

export const getSyncStatus = () => syncManager.getSyncStatus()

export const getLastSyncTime = () => syncManager.getLastSyncTime() 