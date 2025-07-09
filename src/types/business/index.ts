// 业务类型定义 - 已转换为纯JavaScript

// 用户相关类型
/**
 * @typedef {Object} User
 * @property {string} id - 用户ID
 * @property {string} openid - 微信openid
 * @property {string} nickName - 昵称
 * @property {string} avatarUrl - 头像URL
 * @property {string} [familyId] - 家庭ID
 * @property {string} role - 用户角色
 * @property {Date} createTime - 创建时间
 * @property {Date} updateTime - 更新时间
 */

/**
 * @enum {string}
 */
export const UserRole = {
  ADMIN: 'admin',      // 家庭管理员
  MEMBER: 'member',    // 普通成员
  OBSERVER: 'observer' // 财务观察员
};

// 家庭相关类型
/**
 * @typedef {Object} Family
 * @property {string} id - 家庭ID
 * @property {string} name - 家庭名称
 * @property {string} [description] - 家庭描述
 * @property {string} adminId - 管理员ID
 * @property {Array} members - 成员列表
 * @property {Object} settings - 家庭设置
 * @property {Date} createTime - 创建时间
 * @property {Date} updateTime - 更新时间
 */

/**
 * @typedef {Object} FamilyMember
 * @property {string} userId - 用户ID
 * @property {string} nickName - 昵称
 * @property {string} avatarUrl - 头像URL
 * @property {string} role - 角色
 * @property {Date} joinTime - 加入时间
 */

/**
 * @typedef {Object} FamilySettings
 * @property {string} currency - 货币单位
 * @property {boolean} budgetAlert - 预算预警
 * @property {boolean} autoSync - 自动同步
 * @property {Object} memberPermissions - 成员权限
 * @property {boolean} memberPermissions.canAddRecord - 可添加记录
 * @property {boolean} memberPermissions.canEditRecord - 可编辑记录
 * @property {boolean} memberPermissions.canDeleteRecord - 可删除记录
 * @property {boolean} memberPermissions.canViewReports - 可查看报表
 */

// 记账记录类型
/**
 * @typedef {Object} AccountRecord
 * @property {string} id - 记录ID
 * @property {string} familyId - 家庭ID
 * @property {string} userId - 用户ID
 * @property {string} type - 记录类型
 * @property {number} amount - 金额
 * @property {string} category - 分类名称
 * @property {string} categoryId - 分类ID
 * @property {string} [description] - 描述
 * @property {Date} date - 日期
 * @property {Array<string>} [tags] - 标签
 * @property {Array<string>} [images] - 图片
 * @property {string} [location] - 位置
 * @property {boolean} isDeleted - 是否删除
 * @property {Date} createTime - 创建时间
 * @property {Date} updateTime - 更新时间
 * @property {string} createdBy - 创建者
 * @property {string} [updatedBy] - 更新者
 */

/**
 * @enum {string}
 */
export const RecordType = {
  INCOME: 'income',   // 收入
  EXPENSE: 'expense'  // 支出
};

// 分类类型
/**
 * @typedef {Object} Category
 * @property {string} id - 分类ID
 * @property {string} name - 分类名称
 * @property {string} icon - 图标
 * @property {string} color - 颜色
 * @property {string} type - 记录类型
 * @property {string} [parentId] - 父分类ID
 * @property {boolean} isDefault - 是否默认
 * @property {string} [familyId] - 家庭ID
 * @property {number} sort - 排序
 * @property {boolean} isActive - 是否激活
 * @property {Date} createTime - 创建时间
 */

// 账单导入相关类型
/**
 * @typedef {Object} BillImport
 * @property {string} id - 导入ID
 * @property {string} familyId - 家庭ID
 * @property {string} userId - 用户ID
 * @property {string} platform - 平台
 * @property {Array<string>} originalImages - 原始图片
 * @property {string} status - 状态
 * @property {Object} [ocrResult] - OCR结果
 * @property {Object} [parsedData] - 解析数据
 * @property {string} [errorMessage] - 错误信息
 * @property {Date} createTime - 创建时间
 * @property {Date} updateTime - 更新时间
 */

/**
 * @enum {string}
 */
export const BillPlatform = {
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
  BANK_CARD: 'bank_card',
  CREDIT_CARD: 'credit_card',
  JD_BAITIAO: 'jd_baitiao'
};

/**
 * @enum {string}
 */
export const ImportStatus = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  MANUAL_REVIEW: 'manual_review'
};

/**
 * @typedef {Object} OCRResult
 * @property {string} text - 识别文本
 * @property {number} confidence - 置信度
 * @property {Array} words - 单词列表
 * @property {Array} regions - 区域列表
 */

/**
 * @typedef {Object} OCRWord
 * @property {string} text - 文本
 * @property {number} confidence - 置信度
 * @property {Object} boundingBox - 边界框
 */

/**
 * @typedef {Object} OCRRegion
 * @property {string} text - 文本
 * @property {number} confidence - 置信度
 * @property {Object} boundingBox - 边界框
 * @property {Array} words - 单词列表
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 */

/**
 * @typedef {Object} ParsedBillData
 * @property {string} platform - 平台
 * @property {Array} transactions - 交易列表
 * @property {Object} summary - 汇总信息
 * @property {number} confidence - 置信度
 */

/**
 * @typedef {Object} ParsedTransaction
 * @property {number} amount - 金额
 * @property {string} type - 类型
 * @property {string} merchant - 商户
 * @property {string} [category] - 分类
 * @property {string} description - 描述
 * @property {Date} date - 日期
 * @property {number} confidence - 置信度
 * @property {boolean} needsReview - 需要审核
 */

// 报表相关类型
/**
 * @typedef {Object} ReportData
 * @property {string} period - 报表周期
 * @property {Object} summary - 汇总信息
 * @property {Array} categoryStats - 分类统计
 * @property {Array} trends - 趋势数据
 * @property {Array} [comparisons] - 对比数据
 */

/**
 * @enum {string}
 */
export const ReportPeriod = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
};

/**
 * @typedef {Object} ReportSummary
 * @property {number} totalIncome - 总收入
 * @property {number} totalExpense - 总支出
 * @property {number} balance - 余额
 * @property {number} transactionCount - 交易数量
 * @property {number} avgDailyExpense - 平均日支出
 */

/**
 * @typedef {Object} CategoryStat
 * @property {string} categoryId - 分类ID
 * @property {string} categoryName - 分类名称
 * @property {number} amount - 金额
 * @property {number} percentage - 百分比
 * @property {number} transactionCount - 交易数量
 * @property {number} trend - 趋势变化
 */

/**
 * @typedef {Object} TrendData
 * @property {string} date - 日期
 * @property {number} income - 收入
 * @property {number} expense - 支出
 * @property {number} balance - 余额
 */

/**
 * @typedef {Object} ComparisonData
 * @property {string} period - 周期
 * @property {number} income - 收入
 * @property {number} expense - 支出
 * @property {number} change - 变化
 */

// 通知相关类型
/**
 * @typedef {Object} Notification
 * @property {string} id - 通知ID
 * @property {string} familyId - 家庭ID
 * @property {string} [userId] - 用户ID
 * @property {string} type - 通知类型
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {*} [data] - 数据
 * @property {boolean} isRead - 是否已读
 * @property {Date} createTime - 创建时间
 */

/**
 * @enum {string}
 */
export const NotificationType = {
  RECORD_ADDED: 'record_added',
  RECORD_UPDATED: 'record_updated',
  RECORD_DELETED: 'record_deleted',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  BUDGET_ALERT: 'budget_alert',
  BILL_IMPORTED: 'bill_imported'
};

// API相关类型
/**
 * @typedef {Object} ApiResponse
 * @property {number} code - 状态码
 * @property {string} message - 消息
 * @property {*} data - 数据
 * @property {number} timestamp - 时间戳
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} page - 页码
 * @property {number} pageSize - 页大小
 */

/**
 * @typedef {Object} PaginationResult
 * @property {Array} list - 列表
 * @property {number} total - 总数
 * @property {number} page - 页码
 * @property {number} pageSize - 页大小
 * @property {boolean} hasMore - 是否有更多
 */

// 表单相关类型
/**
 * @typedef {Object} RecordForm
 * @property {string} type - 类型
 * @property {string} amount - 金额
 * @property {string} categoryId - 分类ID
 * @property {string} description - 描述
 * @property {Date} date - 日期
 * @property {Array<string>} images - 图片
 * @property {Array<string>} tags - 标签
 */

/**
 * @typedef {Object} CategoryForm
 * @property {string} name - 名称
 * @property {string} icon - 图标
 * @property {string} color - 颜色
 * @property {string} type - 类型
 * @property {string} [parentId] - 父分类ID
 */

/**
 * @typedef {Object} FamilyForm
 * @property {string} name - 名称
 * @property {string} description - 描述
 */

// 分摊相关类型
/**
 * @typedef {Object} SplitRecord
 * @property {string} id - 分摊记录ID
 * @property {string} originalRecordId - 原始记录ID
 * @property {string} familyId - 家庭ID
 * @property {number} totalAmount - 总金额
 * @property {string} splitType - 分摊类型
 * @property {Array} participants - 参与者列表
 * @property {string} [description] - 描述
 * @property {string} status - 状态
 * @property {Date} createTime - 创建时间
 * @property {Date} updateTime - 更新时间
 * @property {string} createdBy - 创建者
 */

/**
 * @enum {string}
 */
export const SplitType = {
  EQUAL: 'equal',           // 平均分摊
  PERCENTAGE: 'percentage', // 按比例分摊
  AMOUNT: 'amount',         // 按金额分摊
  CUSTOM: 'custom'          // 自定义分摊
};

/**
 * @enum {string}
 */
export const SplitStatus = {
  PENDING: 'pending',       // 待确认
  CONFIRMED: 'confirmed',   // 已确认
  SETTLED: 'settled',       // 已结算
  CANCELLED: 'cancelled'    // 已取消
};

/**
 * @typedef {Object} SplitParticipant
 * @property {string} userId - 用户ID
 * @property {string} nickName - 昵称
 * @property {string} avatarUrl - 头像URL
 * @property {number} amount - 金额
 * @property {number} [percentage] - 百分比
 * @property {string} status - 状态
 * @property {Date} [confirmTime] - 确认时间
 * @property {Date} [settleTime] - 结算时间
 */

/**
 * @enum {string}
 */
export const ParticipantStatus = {
  PENDING: 'pending',       // 待确认
  CONFIRMED: 'confirmed',   // 已确认
  SETTLED: 'settled',       // 已结算
  DECLINED: 'declined'      // 已拒绝
};

/**
 * @typedef {Object} SplitTemplate
 * @property {string} id - 模板ID
 * @property {string} name - 模板名称
 * @property {string} familyId - 家庭ID
 * @property {string} splitType - 分摊类型
 * @property {Array} participants - 参与者列表
 * @property {boolean} isActive - 是否激活
 * @property {Date} createTime - 创建时间
 */

// 应用设置类型
/**
 * @typedef {Object} AppSettings
 * @property {string} theme - 主题
 * @property {string} language - 语言
 * @property {string} currency - 货币
 * @property {Object} notifications - 通知设置
 * @property {boolean} notifications.recordChanges - 记录变更通知
 * @property {boolean} notifications.budgetAlerts - 预算预警通知
 * @property {boolean} notifications.memberActivities - 成员活动通知
 * @property {Object} privacy - 隐私设置
 * @property {boolean} privacy.showAmountInList - 列表中显示金额
 * @property {boolean} privacy.requirePasswordForReports - 报表需要密码
 */

// 导出所有枚举和常量
// 已在上面分别导出，无需重复导出
