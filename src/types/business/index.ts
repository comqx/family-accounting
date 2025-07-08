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
  updateTime: Date;
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
  CREDIT_CARD = 'credit_card'
}

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// OCR相关类型
export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
}

export interface ParsedTransaction {
  amount: number;
  type: RecordType;
  merchant: string;
  date: Date;
  platform: BillPlatform;
  cardInfo?: CreditCardInfo;
  installment?: InstallmentInfo;
}

export interface CreditCardInfo {
  cardNumber: string;
  bankName: string;
  cardType: string;
  billingDate?: number;
  dueDate?: number;
  creditLimit?: number;
  availableCredit?: number;
}

export interface InstallmentInfo {
  currentPeriod: number;
  totalPeriods: number;
  monthlyAmount: number;
  remainingAmount: number;
}

// 预算相关类型
export interface Budget {
  id: string;
  familyId: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createTime: Date;
  updateTime: Date;
}

export enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// 报表相关类型
export interface Report {
  id: string;
  familyId: string;
  type: ReportType;
  period: ReportPeriod;
  data: ReportData;
  createTime: Date;
}

export enum ReportType {
  EXPENSE_CATEGORY = 'expense_category',
  INCOME_TREND = 'income_trend',
  EXPENSE_TREND = 'expense_trend',
  MEMBER_COMPARISON = 'member_comparison'
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

// 通知相关类型
export interface Notification {
  id: string;
  userId: string;
  familyId: string;
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
  data?: T;
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
  amount: number;
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

// 设置相关类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  notifications: {
    budgetAlerts: boolean;
    memberActivities: boolean;
  };
  privacy: {
    requirePasswordForReports: boolean;
  };
}