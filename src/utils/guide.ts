import Taro from '@tarojs/taro'

export interface GuideStep {
  id: string
  title: string
  description: string
  icon: string
  type: 'welcome' | 'feature' | 'finish'
  target?: string // 目标元素选择器
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export interface GuideConfig {
  id: string
  name: string
  steps: GuideStep[]
  autoShow?: boolean
  showOnce?: boolean
}

// 预定义的引导配置
export const guideConfigs: Record<string, GuideConfig> = {
  welcome: {
    id: 'welcome',
    name: '欢迎引导',
    steps: [
      {
        id: 'welcome-1',
        title: '欢迎使用家账通',
        description: '让我们一起开始记账之旅吧！',
        icon: '👋',
        type: 'welcome'
      },
      {
        id: 'welcome-2',
        title: '快速记账',
        description: '点击首页的"+"按钮，快速记录您的收支',
        icon: '📝',
        type: 'feature'
      },
      {
        id: 'welcome-3',
        title: '数据统计',
        description: '在报表页面查看详细的收支分析',
        icon: '📊',
        type: 'feature'
      },
      {
        id: 'welcome-4',
        title: '家庭共享',
        description: '创建家庭账本，与家人一起记账',
        icon: '👨‍👩‍👧‍👦',
        type: 'feature'
      },
      {
        id: 'welcome-5',
        title: '开始使用',
        description: '现在您可以开始使用家账通了！',
        icon: '🎉',
        type: 'finish'
      }
    ],
    autoShow: true,
    showOnce: true
  },
  record: {
    id: 'record',
    name: '记账引导',
    steps: [
      {
        id: 'record-1',
        title: '选择类型',
        description: '选择收入或支出类型',
        icon: '📱',
        type: 'feature'
      },
      {
        id: 'record-2',
        title: '选择分类',
        description: '选择合适的消费分类',
        icon: '🏷️',
        type: 'feature'
      },
      {
        id: 'record-3',
        title: '输入金额',
        description: '输入具体的金额数字',
        icon: '💰',
        type: 'feature'
      },
      {
        id: 'record-4',
        title: '添加备注',
        description: '可以添加详细的备注信息',
        icon: '📝',
        type: 'feature'
      },
      {
        id: 'record-5',
        title: '保存记录',
        description: '点击保存按钮完成记账',
        icon: '✅',
        type: 'finish'
      }
    ],
    autoShow: false,
    showOnce: true
  },
  family: {
    id: 'family',
    name: '家庭功能引导',
    steps: [
      {
        id: 'family-1',
        title: '创建家庭',
        description: '创建一个新的家庭账本',
        icon: '🏠',
        type: 'feature'
      },
      {
        id: 'family-2',
        title: '邀请成员',
        description: '邀请家人加入家庭账本',
        icon: '👥',
        type: 'feature'
      },
      {
        id: 'family-3',
        title: '共同记账',
        description: '家庭成员可以一起记账',
        icon: '📊',
        type: 'feature'
      },
      {
        id: 'family-4',
        title: '预算管理',
        description: '设置家庭预算，控制支出',
        icon: '🎯',
        type: 'finish'
      }
    ],
    autoShow: false,
    showOnce: true
  },
  export: {
    id: 'export',
    name: '导出功能引导',
    steps: [
      {
        id: 'export-1',
        title: '选择格式',
        description: '选择 Excel 或 PDF 导出格式',
        icon: '📄',
        type: 'feature'
      },
      {
        id: 'export-2',
        title: '设置范围',
        description: '选择要导出的时间范围',
        icon: '📅',
        type: 'feature'
      },
      {
        id: 'export-3',
        title: '选择内容',
        description: '选择是否包含分类和成员统计',
        icon: '📊',
        type: 'feature'
      },
      {
        id: 'export-4',
        title: '开始导出',
        description: '点击导出按钮生成文件',
        icon: '📤',
        type: 'finish'
      }
    ],
    autoShow: false,
    showOnce: false
  }
}

/**
 * 检查引导是否已完成
 */
export const isGuideCompleted = async (guideId: string): Promise<boolean> => {
  try {
    const result = await Taro.getStorage({ key: `guide_${guideId}_completed` })
    return result.data === true
  } catch (error) {
    return false
  }
}

/**
 * 检查引导是否已跳过
 */
export const isGuideSkipped = async (guideId: string): Promise<boolean> => {
  try {
    const result = await Taro.getStorage({ key: `guide_${guideId}_skipped` })
    return result.data === true
  } catch (error) {
    return false
  }
}

/**
 * 标记引导为已完成
 */
export const markGuideCompleted = async (guideId: string): Promise<void> => {
  try {
    await Taro.setStorage({
      key: `guide_${guideId}_completed`,
      data: true
    })
  } catch (error) {
    console.error('标记引导完成失败:', error)
  }
}

/**
 * 标记引导为已跳过
 */
export const markGuideSkipped = async (guideId: string): Promise<void> => {
  try {
    await Taro.setStorage({
      key: `guide_${guideId}_skipped`,
      data: true
    })
  } catch (error) {
    console.error('标记引导跳过失败:', error)
  }
}

/**
 * 重置引导状态
 */
export const resetGuide = async (guideId: string): Promise<void> => {
  try {
    await Taro.removeStorage({ key: `guide_${guideId}_completed` })
    await Taro.removeStorage({ key: `guide_${guideId}_skipped` })
  } catch (error) {
    console.error('重置引导状态失败:', error)
  }
}

/**
 * 检查是否应该显示引导
 */
export const shouldShowGuide = async (guideId: string): Promise<boolean> => {
  const config = guideConfigs[guideId]
  if (!config) return false

  // 如果配置为不自动显示，返回 false
  if (!config.autoShow) return false

  // 如果配置为只显示一次，检查是否已完成或跳过
  if (config.showOnce) {
    const completed = await isGuideCompleted(guideId)
    const skipped = await isGuideSkipped(guideId)
    return !completed && !skipped
  }

  return true
}

/**
 * 获取所有引导配置
 */
export const getAllGuideConfigs = (): GuideConfig[] => {
  return Object.values(guideConfigs)
}

/**
 * 获取特定引导配置
 */
export const getGuideConfig = (guideId: string): GuideConfig | null => {
  return guideConfigs[guideId] || null
}

/**
 * 显示引导
 */
export const showGuide = async (guideId: string): Promise<void> => {
  const config = getGuideConfig(guideId)
  if (!config) {
    console.error(`引导配置不存在: ${guideId}`)
    return
  }

  // 这里可以通过事件总线或其他方式通知组件显示引导
  // 暂时使用 Taro.showModal 作为示例
  Taro.showModal({
    title: config.name,
    content: `是否显示${config.name}？`,
    success: (res) => {
      if (res.confirm) {
        // 触发引导显示事件
        Taro.eventCenter.trigger('showGuide', { guideId, config })
      }
    }
  })
}

/**
 * 自动检查并显示引导
 */
export const autoShowGuides = async (): Promise<void> => {
  for (const guideId of Object.keys(guideConfigs)) {
    const shouldShow = await shouldShowGuide(guideId)
    if (shouldShow) {
      await showGuide(guideId)
      break // 一次只显示一个引导
    }
  }
} 