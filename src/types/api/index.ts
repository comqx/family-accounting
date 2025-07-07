// API接口类型定义

import {
  User, Family, AccountRecord, Category, BillImport,
  ReportData, Notification, PaginationParams, PaginationResult,
  RecordForm, CategoryForm, FamilyForm, ReportPeriod
} from '../business';

// 基础响应类型
export interface BaseResponse {
  code: number;
  message: string;
  timestamp: number;
}

export interface ApiResponse<T = any> extends BaseResponse {
  data: T;
}

export interface ErrorResponse extends BaseResponse {
  error?: string;
  details?: any;
}

// 认证相关API
export namespace AuthAPI {
  export interface LoginRequest {
    code: string; // 微信登录code
  }

  export interface LoginResponse {
    token: string;
    user: User;
    family?: Family;
  }

  export interface RefreshTokenRequest {
    refreshToken: string;
  }

  export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
  }
}

// 用户相关API
export namespace UserAPI {
  export interface GetProfileResponse {
    user: User;
  }

  export interface UpdateProfileRequest {
    nickName?: string;
    avatarUrl?: string;
  }

  export interface UpdateProfileResponse {
    user: User;
  }
}

// 家庭相关API
export namespace FamilyAPI {
  export interface CreateFamilyRequest extends FamilyForm {}

  export interface CreateFamilyResponse {
    family: Family;
  }

  export interface JoinFamilyRequest {
    inviteCode: string;
  }

  export interface JoinFamilyResponse {
    family: Family;
  }

  export interface GetFamilyResponse {
    family: Family;
  }

  export interface UpdateFamilyRequest extends Partial<FamilyForm> {}

  export interface UpdateFamilyResponse {
    family: Family;
  }

  export interface InviteMemberRequest {
    userId: string;
    role: string;
  }

  export interface InviteMemberResponse {
    inviteCode: string;
    expireTime: Date;
  }

  export interface RemoveMemberRequest {
    userId: string;
  }

  export interface UpdateMemberRoleRequest {
    userId: string;
    role: string;
  }

  export interface GetMembersResponse {
    members: User[];
  }
}

// 记账记录相关API
export namespace RecordAPI {
  export interface CreateRecordRequest extends RecordForm {}

  export interface CreateRecordResponse {
    record: AccountRecord;
  }

  export interface UpdateRecordRequest extends Partial<RecordForm> {
    id: string;
  }

  export interface UpdateRecordResponse {
    record: AccountRecord;
  }

  export interface DeleteRecordRequest {
    id: string;
  }

  export interface GetRecordsRequest extends PaginationParams {
    familyId: string;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    categoryId?: string;
    userId?: string;
    keyword?: string;
  }

  export interface GetRecordsResponse extends PaginationResult<AccountRecord> {}

  export interface GetRecordDetailRequest {
    id: string;
  }

  export interface GetRecordDetailResponse {
    record: AccountRecord;
  }

  export interface BatchDeleteRequest {
    ids: string[];
  }

  export interface BatchDeleteResponse {
    deletedCount: number;
  }
}

// 分类相关API
export namespace CategoryAPI {
  export interface CreateCategoryRequest extends CategoryForm {}

  export interface CreateCategoryResponse {
    category: Category;
  }

  export interface UpdateCategoryRequest extends Partial<CategoryForm> {
    id: string;
  }

  export interface UpdateCategoryResponse {
    category: Category;
  }

  export interface DeleteCategoryRequest {
    id: string;
  }

  export interface GetCategoriesRequest {
    familyId?: string;
    type?: string;
    includeDefault?: boolean;
  }

  export interface GetCategoriesResponse {
    categories: Category[];
  }

  export interface SortCategoriesRequest {
    categoryIds: string[];
  }

  export interface SortCategoriesResponse {
    categories: Category[];
  }
}

// 账单导入相关API
export namespace BillImportAPI {
  export interface UploadImagesRequest {
    images: File[];
    platform?: string;
  }

  export interface UploadImagesResponse {
    uploadId: string;
    imageUrls: string[];
  }

  export interface ProcessBillRequest {
    uploadId: string;
    platform: string;
  }

  export interface ProcessBillResponse {
    importId: string;
    status: string;
  }

  export interface GetImportStatusRequest {
    importId: string;
  }

  export interface GetImportStatusResponse {
    import: BillImport;
  }

  export interface ConfirmImportRequest {
    importId: string;
    confirmedTransactions: {
      index: number;
      data: RecordForm;
    }[];
  }

  export interface ConfirmImportResponse {
    records: AccountRecord[];
  }

  export interface GetImportHistoryRequest extends PaginationParams {
    familyId: string;
    status?: string;
    platform?: string;
  }

  export interface GetImportHistoryResponse extends PaginationResult<BillImport> {}
}

// 报表相关API
export namespace ReportAPI {
  export interface GetReportRequest {
    familyId: string;
    period: ReportPeriod;
    startDate?: Date;
    endDate?: Date;
    categoryIds?: string[];
    userIds?: string[];
  }

  export interface GetReportResponse {
    report: ReportData;
  }

  export interface ExportReportRequest {
    familyId: string;
    period: ReportPeriod;
    startDate?: Date;
    endDate?: Date;
    format: 'excel' | 'pdf' | 'csv';
  }

  export interface ExportReportResponse {
    downloadUrl: string;
    fileName: string;
  }
}

// 通知相关API
export namespace NotificationAPI {
  export interface GetNotificationsRequest extends PaginationParams {
    familyId: string;
    isRead?: boolean;
    type?: string;
  }

  export interface GetNotificationsResponse extends PaginationResult<Notification> {}

  export interface MarkAsReadRequest {
    notificationIds: string[];
  }

  export interface MarkAsReadResponse {
    updatedCount: number;
  }

  export interface GetUnreadCountRequest {
    familyId: string;
  }

  export interface GetUnreadCountResponse {
    count: number;
  }
}

// 文件上传相关API
export namespace UploadAPI {
  export interface UploadFileRequest {
    file: File;
    type: 'avatar' | 'record_image' | 'bill_image';
  }

  export interface UploadFileResponse {
    url: string;
    fileName: string;
    size: number;
  }

  export interface BatchUploadRequest {
    files: File[];
    type: 'avatar' | 'record_image' | 'bill_image';
  }

  export interface BatchUploadResponse {
    results: UploadFileResponse[];
  }
}

// 统计相关API
export namespace StatAPI {
  export interface GetDashboardRequest {
    familyId: string;
    period?: ReportPeriod;
  }

  export interface GetDashboardResponse {
    summary: {
      todayExpense: number;
      monthExpense: number;
      monthIncome: number;
      monthBalance: number;
    };
    recentRecords: AccountRecord[];
    topCategories: {
      categoryId: string;
      categoryName: string;
      amount: number;
      percentage: number;
    }[];
    trends: {
      date: string;
      amount: number;
    }[];
  }

  export interface GetBudgetStatusRequest {
    familyId: string;
    month?: string;
  }

  export interface GetBudgetStatusResponse {
    budgets: {
      categoryId: string;
      categoryName: string;
      budgetAmount: number;
      usedAmount: number;
      percentage: number;
      isOverBudget: boolean;
    }[];
  }
}

// WebSocket消息类型
export namespace WSMessage {
  export interface BaseMessage {
    type: string;
    familyId: string;
    userId: string;
    timestamp: number;
  }

  export interface RecordChangedMessage extends BaseMessage {
    type: 'record_changed';
    action: 'create' | 'update' | 'delete';
    record: AccountRecord;
  }

  export interface MemberChangedMessage extends BaseMessage {
    type: 'member_changed';
    action: 'join' | 'leave' | 'role_updated';
    member: User;
  }

  export interface NotificationMessage extends BaseMessage {
    type: 'notification';
    notification: Notification;
  }

  export interface SyncRequestMessage extends BaseMessage {
    type: 'sync_request';
    lastSyncTime: number;
  }

  export interface SyncResponseMessage extends BaseMessage {
    type: 'sync_response';
    changes: {
      records: AccountRecord[];
      categories: Category[];
      members: User[];
    };
  }
}

// 错误响应类型
export interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
  timestamp: number;
}

// 通用请求配置
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  loading?: boolean;
}
