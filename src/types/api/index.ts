// API接口类型定义 - 已转换为纯JavaScript

// 导入业务类型（如果需要的话）
// import {
//   User, Family, AccountRecord, Category, BillImport,
//   ReportData, Notification, PaginationParams, PaginationResult,
//   RecordForm, CategoryForm, FamilyForm, ReportPeriod
// } from '../business';

// 基础响应类型 - 使用JSDoc注释
/**
 * @typedef {Object} BaseResponse
 * @property {number} code - 响应状态码
 * @property {string} message - 响应消息
 * @property {number} timestamp - 时间戳
 */

/**
 * @typedef {Object} ApiResponse
 * @property {number} code - 响应状态码
 * @property {string} message - 响应消息
 * @property {number} timestamp - 时间戳
 * @property {*} data - 响应数据
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {number} code - 响应状态码
 * @property {string} message - 响应消息
 * @property {number} timestamp - 时间戳
 * @property {string} [error] - 错误信息
 * @property {*} [details] - 错误详情
 */

// 认证相关API
/**
 * @typedef {Object} AuthAPI.LoginRequest
 * @property {string} code - 微信登录code
 */

/**
 * @typedef {Object} AuthAPI.LoginResponse
 * @property {string} token - 访问令牌
 * @property {Object} user - 用户信息
 * @property {Object} [family] - 家庭信息
 */

/**
 * @typedef {Object} AuthAPI.RefreshTokenRequest
 * @property {string} refreshToken - 刷新令牌
 */

/**
 * @typedef {Object} AuthAPI.RefreshTokenResponse
 * @property {string} token - 新的访问令牌
 * @property {string} refreshToken - 新的刷新令牌
 */

// 用户相关API
/**
 * @typedef {Object} UserAPI.GetProfileResponse
 * @property {Object} user - 用户信息
 */

/**
 * @typedef {Object} UserAPI.UpdateProfileRequest
 * @property {string} [nickName] - 昵称
 * @property {string} [avatarUrl] - 头像URL
 */

/**
 * @typedef {Object} UserAPI.UpdateProfileResponse
 * @property {Object} user - 更新后的用户信息
 */

// 家庭相关API
/**
 * @typedef {Object} FamilyAPI.CreateFamilyRequest
 */

/**
 * @typedef {Object} FamilyAPI.CreateFamilyResponse
 * @property {Object} family - 创建的家庭信息
 */

/**
 * @typedef {Object} FamilyAPI.JoinFamilyRequest
 * @property {string} inviteCode - 邀请码
 */

/**
 * @typedef {Object} FamilyAPI.JoinFamilyResponse
 * @property {Object} family - 加入的家庭信息
 */

/**
 * @typedef {Object} FamilyAPI.GetFamilyResponse
 * @property {Object} family - 家庭信息
 */

/**
 * @typedef {Object} FamilyAPI.UpdateFamilyRequest
 */

/**
 * @typedef {Object} FamilyAPI.UpdateFamilyResponse
 * @property {Object} family - 更新后的家庭信息
 */

/**
 * @typedef {Object} FamilyAPI.InviteMemberRequest
 * @property {string} userId - 用户ID
 * @property {string} role - 角色
 */

/**
 * @typedef {Object} FamilyAPI.InviteMemberResponse
 * @property {string} inviteCode - 邀请码
 * @property {Date} expireTime - 过期时间
 */

/**
 * @typedef {Object} FamilyAPI.RemoveMemberRequest
 * @property {string} userId - 用户ID
 */

/**
 * @typedef {Object} FamilyAPI.UpdateMemberRoleRequest
 * @property {string} userId - 用户ID
 * @property {string} role - 新角色
 */

/**
 * @typedef {Object} FamilyAPI.GetMembersResponse
 * @property {Array} members - 成员列表
 */

// 记账记录相关API
/**
 * @typedef {Object} RecordAPI.CreateRecordRequest
 */

/**
 * @typedef {Object} RecordAPI.CreateRecordResponse
 * @property {Object} record - 创建的记录
 */

/**
 * @typedef {Object} RecordAPI.UpdateRecordRequest
 * @property {string} id - 记录ID
 */

/**
 * @typedef {Object} RecordAPI.UpdateRecordResponse
 * @property {Object} record - 更新后的记录
 */

/**
 * @typedef {Object} RecordAPI.DeleteRecordRequest
 * @property {string} id - 记录ID
 */

/**
 * @typedef {Object} RecordAPI.GetRecordsRequest
 * @property {string} familyId - 家庭ID
 * @property {Date} [startDate] - 开始日期
 * @property {Date} [endDate] - 结束日期
 * @property {string} [type] - 记录类型
 * @property {string} [categoryId] - 分类ID
 * @property {string} [userId] - 用户ID
 * @property {string} [keyword] - 关键词
 */

/**
 * @typedef {Object} RecordAPI.GetRecordsResponse
 */

/**
 * @typedef {Object} RecordAPI.GetRecordDetailRequest
 * @property {string} id - 记录ID
 */

/**
 * @typedef {Object} RecordAPI.GetRecordDetailResponse
 * @property {Object} record - 记录详情
 */

/**
 * @typedef {Object} RecordAPI.BatchDeleteRequest
 * @property {Array<string>} ids - 记录ID列表
 */

/**
 * @typedef {Object} RecordAPI.BatchDeleteResponse
 * @property {number} deletedCount - 删除的记录数量
 */

// 分类相关API
/**
 * @typedef {Object} CategoryAPI.CreateCategoryRequest
 */

/**
 * @typedef {Object} CategoryAPI.CreateCategoryResponse
 * @property {Object} category - 创建的分类
 */

/**
 * @typedef {Object} CategoryAPI.UpdateCategoryRequest
 * @property {string} id - 分类ID
 */

/**
 * @typedef {Object} CategoryAPI.UpdateCategoryResponse
 * @property {Object} category - 更新后的分类
 */

/**
 * @typedef {Object} CategoryAPI.DeleteCategoryRequest
 * @property {string} id - 分类ID
 */

/**
 * @typedef {Object} CategoryAPI.GetCategoriesRequest
 * @property {string} [familyId] - 家庭ID
 * @property {string} [type] - 分类类型
 * @property {boolean} [includeDefault] - 是否包含默认分类
 */

/**
 * @typedef {Object} CategoryAPI.GetCategoriesResponse
 * @property {Array} categories - 分类列表
 */

/**
 * @typedef {Object} CategoryAPI.SortCategoriesRequest
 * @property {Array<string>} categoryIds - 分类ID列表
 */

/**
 * @typedef {Object} CategoryAPI.SortCategoriesResponse
 * @property {Array} categories - 排序后的分类列表
 */

// 导出空对象，保持模块结构
export default {};
