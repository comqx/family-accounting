import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  subMessage?: string
  icon?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showClose?: boolean
  type?: 'danger' | 'warning' | 'info' | 'success'
}

export function useConfirm() {
  const visible = ref(false)
  const options = ref<ConfirmOptions>({
    title: '确认操作',
    message: '',
    subMessage: '',
    icon: '',
    confirmText: '确认',
    cancelText: '取消',
    showCancel: true,
    showClose: true,
    type: 'info'
  })

  let resolvePromise: (value: boolean) => void
  let rejectPromise: (reason?: any) => void

  const show = (confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      options.value = { ...options.value, ...confirmOptions }
      visible.value = true
      resolvePromise = resolve
      rejectPromise = reject
    })
  }

  const confirm = () => {
    visible.value = false
    resolvePromise(true)
  }

  const cancel = () => {
    visible.value = false
    resolvePromise(false)
  }

  const close = () => {
    visible.value = false
    rejectPromise(new Error('Dialog closed'))
  }

  // 预定义的确认操作
  const confirmDelete = (itemName: string) => {
    return show({
      title: '确认删除',
      message: `确定要删除"${itemName}"吗？`,
      subMessage: '此操作不可撤销，请谨慎操作。',
      icon: '🗑️',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger'
    })
  }

  const confirmRemove = (itemName: string) => {
    return show({
      title: '确认移除',
      message: `确定要移除"${itemName}"吗？`,
      subMessage: '移除后需要重新添加才能恢复。',
      icon: '🚫',
      confirmText: '移除',
      cancelText: '取消',
      type: 'warning'
    })
  }

  const confirmExit = (groupName: string) => {
    return show({
      title: '确认退出',
      message: `确定要退出"${groupName}"吗？`,
      subMessage: '退出后将无法访问相关数据，需要重新加入。',
      icon: '🚪',
      confirmText: '退出',
      cancelText: '取消',
      type: 'warning'
    })
  }

  const confirmLogout = () => {
    return show({
      title: '确认退出登录',
      message: '确定要退出登录吗？',
      subMessage: '退出后需要重新登录才能使用应用。',
      icon: '🔓',
      confirmText: '退出',
      cancelText: '取消',
      type: 'warning'
    })
  }

  const confirmReset = () => {
    return show({
      title: '确认重置',
      message: '确定要重置所有数据吗？',
      subMessage: '重置后所有数据将被清空，此操作不可撤销！',
      icon: '⚠️',
      confirmText: '重置',
      cancelText: '取消',
      type: 'danger'
    })
  }

  const confirmBatchOperation = (operation: string, count: number) => {
    return show({
      title: '确认批量操作',
      message: `确定要对 ${count} 个项目执行"${operation}"操作吗？`,
      subMessage: '批量操作将影响所有选中的项目。',
      icon: '⚡',
      confirmText: '确认',
      cancelText: '取消',
      type: 'warning'
    })
  }

  return {
    visible,
    options,
    show,
    confirm,
    cancel,
    close,
    confirmDelete,
    confirmRemove,
    confirmExit,
    confirmLogout,
    confirmReset,
    confirmBatchOperation
  }
} 