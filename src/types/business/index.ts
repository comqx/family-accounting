// 业务类型定义 - 已转换为纯JavaScript

// 用户相关类型
export interface User {
  id: string;
  nickName: string;
  avatarUrl: string;
  phone?: string;
  familyId?: string;
  role: string;
  createTime: Date;
  updateTime: Date;
}

/**
 * @enum {string}
 */
export const UserRole = {
  ADMIN: 'admin',      // 家庭管理员
  MEMBER: 'member',    // 普通成员
  OBSERVER: 'observer' // 财务观察员
};

// 家庭相关类型
export interface Family {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  members: FamilyMember[];
  settings: FamilySettings;
  createTime: Date;
  updateTime: Date;
}

export interface FamilyMember {
  userId: string;
  nickName: string;
  avatarUrl: string;
  role: string;
  joinTime: Date;
}

export interface FamilySettings {
  currency: string;
  budgetAlert: boolean;
  autoSync: boolean;
  memberPermissions: {
    canAddRecord: boolean;
    canEditRecord: boolean;
    canDeleteRecord: boolean;
    canViewReports: boolean;
  };
}

// 记账记录类型
export interface AccountRecord {
  id: string;
  familyId: string;
  userId: string;
  type: string;
  amount: number;
  category: string;
  categoryId: string;
  description?: string;
  date: Date;
  tags?: string[];
  images?: string[];
  location?: string;
  isDeleted: boolean;
  createTime: Date;
  updateTime: Date;
  createdBy: string;
  updatedBy?: string;
}

/**
 * @enum {string}
 */
export const RecordType = {
  INCOME: 'income',   // 收入
  EXPENSE: 'expense'  // 支出
};

// 分类类型
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  parentId?: string;
  isDefault: boolean;
  familyId?: string;
  sort: number;
  isActive: boolean;
  createTime: Date;
}

// 账单导入相关类型
export interface BillImport {
  id: string;
  familyId: string;
  userId: string;
  platform: string;
  originalImages: string[];
  status: string;
  ocrResult?: any;
  parsedData?: any;
  errorMessage?: string;
  createTime: Date;
  updateTime: Date;
}

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

// OCR 相关类型
export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
  regions: OCRRegion[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface OCRRegion {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words: OCRWord[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedBillData {
  platform: string;
  transactions: ParsedTransaction[];
  summary: {
    totalAmount: number;
    transactionCount: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  confidence: number;
}

export interface ParsedTransaction {
  amount: number;
  type: string;
  merchant: string;
  category?: string;
  description: string;
  date: Date;
  confidence: number;
  needsReview: boolean;
}

// 报表相关类型
export interface ReportData {
  period: string;
  summary: ReportSummary;
  categoryStats: CategoryStat[];
  trends: TrendData[];
  comparisons?: ComparisonData[];
}

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

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  avgDailyExpense: number;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: number;
}

export interface TrendData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ComparisonData {
  period: string;
  income: number;
  expense: number;
  change: number;
}

// 通知相关类型
export interface Notification {
  id: string;
  familyId: string;
  userId?: string;
  type: string;
  title: string;
  content: string;
  data?: any;
  isRead: boolean;
  createTime: Date;
}

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
