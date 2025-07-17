// API接口类型定义 - 已转换为纯JavaScript

// 导入业务类型（如果需要的话）
import {
  User, Family, AccountRecord, Category, BillImport, ReportData, Notification, ParsedBillData
} from '../business';

// 基础响应类型 - 使用JSDoc注释
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

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 认证相关API
export namespace AuthAPI {
  export interface LoginRequest { code: string; }
  export interface LoginResponse { token: string; user: User; family?: Family; }
  export interface RefreshTokenRequest { refreshToken: string; }
  export interface RefreshTokenResponse { token: string; refreshToken: string; }
}

// 用户相关API
export namespace UserAPI {
  export interface GetProfileResponse { user: User; }
  export interface UpdateProfileRequest { nickName?: string; avatarUrl?: string; }
  export interface UpdateProfileResponse { user: User; }
}

// 家庭相关API
export namespace FamilyAPI {
  export interface CreateFamilyRequest { }
  export interface CreateFamilyResponse { family: Family; }
  export interface JoinFamilyRequest { inviteCode: string; }
  export interface JoinFamilyResponse { family: Family; }
  export interface GetFamilyResponse { family: Family; }
  export interface UpdateFamilyRequest { }
  export interface UpdateFamilyResponse { family: Family; }
  export interface InviteMemberRequest { userId: string; role: string; }
  export interface InviteMemberResponse { inviteCode: string; expireTime: Date; }
  export interface RemoveMemberRequest { userId: string; }
  export interface UpdateMemberRoleRequest { userId: string; role: string; }
  export interface GetMembersResponse { members: User[]; }
}

// 记账记录相关API
export namespace RecordAPI {
  export interface CreateRecordRequest { }
  export interface CreateRecordResponse { record: AccountRecord; }
  export interface UpdateRecordRequest { id: string; }
  export interface UpdateRecordResponse { record: AccountRecord; }
  export interface DeleteRecordRequest { id: string; }
  export interface GetRecordsRequest {
    familyId: string;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    categoryId?: string;
    userId?: string;
    keyword?: string;
  }
  export interface GetRecordsResponse { records: AccountRecord[]; }
  export interface GetRecordDetailRequest { id: string; }
  export interface GetRecordDetailResponse { record: AccountRecord; }
  export interface BatchDeleteRequest { ids: string[]; }
  export interface BatchDeleteResponse { deletedCount: number; }
}

// 分类相关API
export namespace CategoryAPI {
  export interface CreateCategoryRequest { }
  export interface CreateCategoryResponse { category: Category; }
  export interface UpdateCategoryRequest { id: string; }
  export interface UpdateCategoryResponse { category: Category; }
  export interface DeleteCategoryRequest { id: string; }
  export interface GetCategoriesRequest {
    familyId?: string;
    type?: string;
    includeDefault?: boolean;
  }
  export interface GetCategoriesResponse { categories: Category[]; }
  export interface SortCategoriesRequest { categoryIds: string[]; }
  export interface SortCategoriesResponse { categories: Category[]; }
}

// 导出空对象，保持模块结构
export default {};
