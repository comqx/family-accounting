// 业务类型定义

// 用户相关类型
export interface User {
  id: string;
  openid: string;
  nickName: string;
  avatarUrl: string;
  familyId?: string;
  role: UserRole;
  createTime: Date;
  updateTime: Date;
}

export enum UserRole {
  ADMIN = 'admin',      // 家庭管理员
  MEMBER = 'member',    // 普通成员
  OBSERVER = 'observer' // 财务观察员
}

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
  role: UserRole;
  joinTime: Date;
}

export interface FamilySettings {
  currency: string;           // 货币单位
  budgetAlert: boolean;       // 预算预警
  autoSync: boolean;          // 自动同步
  memberPermissions: {        // 成员权限
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
  type: RecordType;
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

export enum RecordType {
  INCOME = 'income',   // 收入
  EXPENSE = 'expense'  // 支出
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: RecordType;
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
  platform: BillPlatform;
  originalImages: string[];
  status: ImportStatus;
  ocrResult?: OCRResult;
  parsedData?: ParsedBillData;
  errorMessage?: string;
  createTime: Date;
  updateTime: Date;
}

export enum BillPlatform {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BANK_CARD = 'bank_card',
  CREDIT_CARD = 'credit_card',
  JD_BAITIAO = 'jd_baitiao'
}

export enum ImportStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  MANUAL_REVIEW = 'manual_review'
}

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
  platform: BillPlatform;
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
  type: RecordType;
  merchant: string;
  category?: string;
  description: string;
  date: Date;
  confidence: number;
  needsReview: boolean;
  // 信用卡特有字段
  creditCard?: CreditCardInfo;
  installment?: InstallmentInfo;
}

// 信用卡信息
export interface CreditCardInfo {
  cardNumber: string;      // 卡号后四位
  bankName: string;        // 银行名称
  cardType: string;        // 卡片类型
  billingDate?: Date;      // 账单日
  dueDate?: Date;          // 还款日
  creditLimit?: number;    // 信用额度
  availableCredit?: number; // 可用额度
}

// 分期信息
export interface InstallmentInfo {
  totalPeriods: number;    // 总期数
  currentPeriod: number;   // 当前期数
  monthlyAmount: number;   // 每期金额
  remainingAmount: number; // 剩余金额
  interestRate: number;    // 利率
  feeAmount?: number;      // 手续费
}

// 报表相关类型
export interface ReportData {
  period: ReportPeriod;
  summary: ReportSummary;
  categoryStats: CategoryStat[];
  trends: TrendData[];
  comparisons?: ComparisonData[];
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

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
  trend: number; // 相比上期的变化百分比
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
  userId?: string; // 如果为空则是全家庭通知
  type: NotificationType;
  title: string;
  content: string;
  data?: any;
  isRead: boolean;
  createTime: Date;
}

export enum NotificationType {
  RECORD_ADDED = 'record_added',
  RECORD_UPDATED = 'record_updated',
  RECORD_DELETED = 'record_deleted',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  BUDGET_ALERT = 'budget_alert',
  BILL_IMPORTED = 'bill_imported'
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 表单相关类型
export interface RecordForm {
  type: RecordType;
  amount: string;
  categoryId: string;
  description: string;
  date: Date;
  images: string[];
  tags: string[];
}

export interface CategoryForm {
  name: string;
  icon: string;
  color: string;
  type: RecordType;
  parentId?: string;
}

export interface FamilyForm {
  name: string;
  description: string;
}

// 自动分摊相关类型
export interface SplitRecord {
  id: string;
  originalRecordId: string;
  familyId: string;
  totalAmount: number;
  splitType: SplitType;
  participants: SplitParticipant[];
  description?: string;
  status: SplitStatus;
  createTime: Date;
  updateTime: Date;
  createdBy: string;
}

export enum SplitType {
  EQUAL = 'equal',           // 平均分摊
  PERCENTAGE = 'percentage', // 按比例分摊
  AMOUNT = 'amount',         // 按金额分摊
  CUSTOM = 'custom'          // 自定义分摊
}

export enum SplitStatus {
  PENDING = 'pending',       // 待确认
  CONFIRMED = 'confirmed',   // 已确认
  SETTLED = 'settled',       // 已结算
  CANCELLED = 'cancelled'    // 已取消
}

export interface SplitParticipant {
  userId: string;
  nickName: string;
  avatarUrl: string;
  amount: number;
  percentage?: number;
  status: ParticipantStatus;
  confirmTime?: Date;
  settleTime?: Date;
}

export enum ParticipantStatus {
  PENDING = 'pending',       // 待确认
  CONFIRMED = 'confirmed',   // 已确认
  SETTLED = 'settled',       // 已结算
  DECLINED = 'declined'      // 已拒绝
}

// 分摊模板
export interface SplitTemplate {
  id: string;
  name: string;
  familyId: string;
  splitType: SplitType;
  participants: {
    userId: string;
    percentage?: number;
    isDefault: boolean;
  }[];
  isActive: boolean;
  createTime: Date;
}

// 设置相关类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  currency: string;
  notifications: {
    recordChanges: boolean;
    budgetAlerts: boolean;
    memberActivities: boolean;
  };
  privacy: {
    showAmountInList: boolean;
    requirePasswordForReports: boolean;
  };
}
