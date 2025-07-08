// API接口类型定义

import {
  User, Family, AccountRecord, Category, BillImport,
  ReportData, Notification, PaginationParams, PaginationResult,
  RecordForm, CategoryForm, FamilyForm, ReportPeriod
} from '../business';

// 基础响应类型
export interface BaseResponse {
  code;
  message: '操作完成'
  timestamp;
}

export interface ApiResponse<T = any> extends BaseResponse {
  data;
}

export interface ErrorResponse extends BaseResponse {
  error?: 'string'
  details?: 'any'
}

// 认证相关API
export namespace AuthAPI {
  export interface LoginRequest {
    code; // 微信登录code
  }

  export interface LoginResponse {
    token;
    user;
    family?: 'Family'
  }

  export interface RefreshTokenRequest {
    refreshToken;
  }

  export interface RefreshTokenResponse {
    token;
    refreshToken;
  }
}

// 用户相关API
export namespace UserAPI {
  export interface GetProfileResponse {
    user;
  }

  export interface UpdateProfileRequest {
    nickName?: 'string'
    avatarUrl?: 'string'
  }

  export interface UpdateProfileResponse {
    user;
  }
}

// 家庭相关API
export namespace FamilyAPI {
  export interface CreateFamilyRequest extends FamilyForm {}

  export interface CreateFamilyResponse {
    family;
  }

  export interface JoinFamilyRequest {
    inviteCode;
  }

  export interface JoinFamilyResponse {
    family;
  }

  export interface GetFamilyResponse {
    family;
  }

  export interface UpdateFamilyRequest extends Partial<FamilyForm> {}

  export interface UpdateFamilyResponse {
    family;
  }

  export interface InviteMemberRequest {
    userId;
    role;
  }

  export interface InviteMemberResponse {
    inviteCode;
    expireTime;
  }

  export interface RemoveMemberRequest {
    userId;
  }

  export interface UpdateMemberRoleRequest {
    userId;
    role;
  }

  export interface GetMembersResponse {
    members;
  }
}

// 记账记录相关API
export namespace RecordAPI {
  export interface CreateRecordRequest extends RecordForm {}

  export interface CreateRecordResponse {
    record;
  }

  export interface UpdateRecordRequest extends Partial<RecordForm> {
    id;
  }

  export interface UpdateRecordResponse {
    record;
  }

  export interface DeleteRecordRequest {
    id;
  }

  export interface GetRecordsRequest extends PaginationParams {
    familyId;
    startDate?: 'Date'
    endDate?: 'Date'
    type?: 'string'
    categoryId?: 'string'
    userId?: 'string'
    keyword?: 'string'
  }

  export interface GetRecordsResponse extends PaginationResult<AccountRecord> {}

  export interface GetRecordDetailRequest {
    id;
  }

  export interface GetRecordDetailResponse {
    record;
  }

  export interface BatchDeleteRequest {
    ids;
  }

  export interface BatchDeleteResponse {
    deletedCount;
  }
}

// 分类相关API
export namespace CategoryAPI {
  export interface CreateCategoryRequest extends CategoryForm {}

  export interface CreateCategoryResponse {
    category;
  }

  export interface UpdateCategoryRequest extends Partial<CategoryForm> {
    id;
  }

  export interface UpdateCategoryResponse {
    category;
  }

  export interface DeleteCategoryRequest {
    id;
  }

  export interface GetCategoriesRequest {
    familyId?: 'string'
    type?: 'string'
    includeDefault?: 'boolean'
  }

  export interface GetCategoriesResponse {
    categories;
  }

  export interface SortCategoriesRequest {
    categoryIds;
  }

  export interface SortCategoriesResponse {
    categories;
  }
}

// 账单导入相关API
export namespace BillImportAPI {
  export interface UploadImagesRequest {
    images;
    platform?: 'string'
  }

  export interface UploadImagesResponse {
    uploadId;
    imageUrls;
  }

  export interface ProcessBillRequest {
    uploadId;
    platform;
  }

  export interface ProcessBillResponse {
    importId;
    status;
  }

  export interface GetImportStatusRequest {
    importId;
  }

  export interface GetImportStatusResponse {
    import;
  }

  export interface ConfirmImportRequest {
    importId;
    confirmedTransactions;
      data;
    }[];
  }

  export interface ConfirmImportResponse {
    records;
  }

  export interface GetImportHistoryRequest extends PaginationParams {
    familyId;
    status?: 'string'
    platform?: 'string'
  }

  export interface GetImportHistoryResponse extends PaginationResult<BillImport> {}
}

// 报表相关API
export namespace ReportAPI {
  export interface GetReportRequest {
    familyId;
    period;
    startDate?: 'Date'
    endDate?: 'Date'
    categoryIds?: string[];
    userIds?: string[];
  }

  export interface GetReportResponse {
    report;
  }

  export interface ExportReportRequest {
    familyId;
    period;
    startDate?: 'Date'
    endDate?: 'Date'
    format;
  }

  export interface ExportReportResponse {
    downloadUrl;
    fileName;
  }
}

// 通知相关API
export namespace NotificationAPI {
  export interface GetNotificationsRequest extends PaginationParams {
    familyId;
    isRead?: 'boolean'
    type?: 'string'
  }

  export interface GetNotificationsResponse extends PaginationResult<Notification> {}

  export interface MarkAsReadRequest {
    notificationIds;
  }

  export interface MarkAsReadResponse {
    updatedCount;
  }

  export interface GetUnreadCountRequest {
    familyId;
  }

  export interface GetUnreadCountResponse {
    count;
  }
}

// 文件上传相关API
export namespace UploadAPI {
  export interface UploadFileRequest {
    file;
    type;
  }

  export interface UploadFileResponse {
    url;
    fileName;
    size;
  }

  export interface BatchUploadRequest {
    files;
    type;
  }

  export interface BatchUploadResponse {
    results;
  }
}

// 统计相关API
export namespace StatAPI {
  export interface GetDashboardRequest {
    familyId;
    period?: 'ReportPeriod'
  }

  export interface GetDashboardResponse {
    summary;
      monthExpense;
      monthIncome;
      monthBalance;
    };
    recentRecords;
    topCategories;
      categoryName;
      amount;
      percentage;
    }[];
    trends;
      amount;
    }[];
  }

  export interface GetBudgetStatusRequest {
    familyId;
    month?: 'string'
  }

  export interface GetBudgetStatusResponse {
    budgets;
      categoryName;
      budgetAmount;
      usedAmount;
      percentage;
      isOverBudget;
    }[];
  }
}

// WebSocket消息类型
export namespace WSMessage {
  export interface BaseMessage {
    type;
    familyId;
    userId;
    timestamp;
  }

  export interface RecordChangedMessage extends BaseMessage {
    type;
    action;
    record;
  }

  export interface MemberChangedMessage extends BaseMessage {
    type;
    action;
    member;
  }

  export interface NotificationMessage extends BaseMessage {
    type;
    notification;
  }

  export interface SyncRequestMessage extends BaseMessage {
    type;
    lastSyncTime;
  }

  export interface SyncResponseMessage extends BaseMessage {
    type;
    changes;
      categories;
      members;
    };
  }
}

// 错误响应类型
export interface ErrorResponse {
  code;
  message: '操作完成'
  details?: 'any'
  timestamp;
}

// 通用请求配置
export interface RequestConfig {
  timeout?: 'number'
  retries?: 'number'
  cache?: 'boolean'
  loading?: 'boolean'
}
