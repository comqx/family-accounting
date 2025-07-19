const { logger } = require('./logger');

// 错误码定义
const ERROR_CODES = {
  // 认证相关错误 (1000-1999)
  AUTH_TOKEN_MISSING: { code: 1001, message: '未提供认证令牌' },
  AUTH_TOKEN_INVALID: { code: 1002, message: '认证令牌无效或已过期' },
  USER_NOT_FOUND: { code: 1003, message: '用户不存在' },
  AUTH_SERVICE_ERROR: { code: 1004, message: '认证服务异常' },
  
  // 权限相关错误 (2000-2999)
  INSUFFICIENT_PERMISSIONS: { code: 2001, message: '权限不足' },
  NOT_FAMILY_MEMBER: { code: 2002, message: '您不是该家庭的成员' },
  FAMILY_ID_MISSING: { code: 2003, message: '缺少家庭ID' },
  RECORD_ID_MISSING: { code: 2004, message: '缺少记录ID' },
  CATEGORY_ID_MISSING: { code: 2005, message: '缺少分类ID' },
  BUDGET_ID_MISSING: { code: 2006, message: '缺少预算ID' },
  RECORD_NOT_FOUND: { code: 2007, message: '记录不存在或无权限访问' },
  CATEGORY_NOT_FOUND: { code: 2008, message: '分类不存在或无权限访问' },
  BUDGET_NOT_FOUND: { code: 2009, message: '预算不存在或无权限访问' },
  PERMISSION_SERVICE_ERROR: { code: 2010, message: '权限检查服务异常' },
  
  // 参数校验错误 (3000-3999)
  VALIDATION_ERROR: { code: 3001, message: '参数校验失败' },
  INVALID_INPUT: { code: 3002, message: '输入参数无效' },
  MISSING_REQUIRED_FIELD: { code: 3003, message: '缺少必填字段' },
  
  // 业务逻辑错误 (4000-4999)
  FAMILY_ALREADY_EXISTS: { code: 4001, message: '家庭已存在' },
  FAMILY_NOT_FOUND: { code: 4002, message: '家庭不存在' },
  INVITE_CODE_INVALID: { code: 4003, message: '邀请码无效' },
  INVITE_CODE_EXPIRED: { code: 4004, message: '邀请码已过期' },
  USER_ALREADY_IN_FAMILY: { code: 4005, message: '用户已是该家庭成员' },
  CANNOT_REMOVE_OWNER: { code: 4006, message: '不能移除家庭所有者' },
  RECORD_CREATE_FAILED: { code: 4007, message: '记录创建失败' },
  RECORD_UPDATE_FAILED: { code: 4008, message: '记录更新失败' },
  RECORD_DELETE_FAILED: { code: 4009, message: '记录删除失败' },
  CATEGORY_CREATE_FAILED: { code: 4010, message: '分类创建失败' },
  CATEGORY_UPDATE_FAILED: { code: 4011, message: '分类更新失败' },
  CATEGORY_DELETE_FAILED: { code: 4012, message: '分类删除失败' },
  CATEGORY_IN_USE: { code: 4013, message: '分类正在使用中，无法删除' },
  BUDGET_CREATE_FAILED: { code: 4014, message: '预算创建失败' },
  BUDGET_UPDATE_FAILED: { code: 4015, message: '预算更新失败' },
  BUDGET_DELETE_FAILED: { code: 4016, message: '预算删除失败' },
  
  // 数据库错误 (5000-5999)
  DATABASE_CONNECTION_ERROR: { code: 5001, message: '数据库连接失败' },
  DATABASE_QUERY_ERROR: { code: 5002, message: '数据库查询失败' },
  DATABASE_TRANSACTION_ERROR: { code: 5003, message: '数据库事务失败' },
  DATABASE_CONSTRAINT_ERROR: { code: 5004, message: '数据库约束违反' },
  
  // 外部服务错误 (6000-6999)
  WECHAT_API_ERROR: { code: 6001, message: '微信API调用失败' },
  OCR_SERVICE_ERROR: { code: 6002, message: 'OCR服务异常' },
  FILE_UPLOAD_ERROR: { code: 6003, message: '文件上传失败' },
  FILE_PROCESSING_ERROR: { code: 6004, message: '文件处理失败' },
  
  // 系统错误 (9000-9999)
  INTERNAL_SERVER_ERROR: { code: 9001, message: '服务器内部错误' },
  SERVICE_UNAVAILABLE: { code: 9002, message: '服务暂时不可用' },
  UNKNOWN_ERROR: { code: 9999, message: '未知错误' }
};

// 自定义错误类
class AppError extends Error {
  constructor(errorCode, message = null, details = null, statusCode = 500) {
    super(message || ERROR_CODES[errorCode]?.message || '未知错误');
    this.name = 'AppError';
    this.errorCode = errorCode;
    this.code = ERROR_CODES[errorCode]?.code || 9999;
    this.message = message || ERROR_CODES[errorCode]?.message || '未知错误';
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// 业务错误类
class BusinessError extends AppError {
  constructor(errorCode, message = null, details = null) {
    super(errorCode, message, details, 400);
    this.name = 'BusinessError';
  }
}

// 认证错误类
class AuthError extends AppError {
  constructor(errorCode, message = null, details = null) {
    super(errorCode, message, details, 401);
    this.name = 'AuthError';
  }
}

// 权限错误类
class PermissionError extends AppError {
  constructor(errorCode, message = null, details = null) {
    super(errorCode, message, details, 403);
    this.name = 'PermissionError';
  }
}

// 参数错误类
class ValidationError extends AppError {
  constructor(errorCode, message = null, details = null) {
    super(errorCode, message, details, 400);
    this.name = 'ValidationError';
  }
}

// 资源不存在错误类
class NotFoundError extends AppError {
  constructor(errorCode, message = null, details = null) {
    super(errorCode, message, details, 404);
    this.name = 'NotFoundError';
  }
}

// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // 如果不是自定义错误，转换为标准格式
  if (!(err instanceof AppError)) {
    // 处理数据库错误
    if (err.code === 'ER_DUP_ENTRY') {
      error = new BusinessError('DUPLICATE_ENTRY', '数据已存在', { field: err.sqlMessage });
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      error = new BusinessError('FOREIGN_KEY_CONSTRAINT', '关联数据不存在');
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      error = new BusinessError('FOREIGN_KEY_CONSTRAINT', '数据正在被使用，无法删除');
    } else if (err.name === 'ValidationError') {
      error = new ValidationError('VALIDATION_ERROR', err.message, err.details);
    } else if (err.name === 'JsonWebTokenError') {
      error = new AuthError('AUTH_TOKEN_INVALID', '认证令牌无效');
    } else if (err.name === 'TokenExpiredError') {
      error = new AuthError('AUTH_TOKEN_INVALID', '认证令牌已过期');
    } else {
      error = new AppError('UNKNOWN_ERROR', err.message, null, err.status || 500);
    }
  }
  
  // 记录错误日志
  logger.error('API错误', {
    errorCode: error.errorCode,
    code: error.code,
    message: error.message,
    details: error.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // 构建错误响应
  const errorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      errorCode: error.errorCode,
      timestamp: error.timestamp
    }
  };
  
  // 在开发环境下添加详细信息
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.details = error.details;
    errorResponse.error.stack = error.stack;
  }
  
  // 发送错误响应
  res.status(error.statusCode || 500).json(errorResponse);
};

// 404错误处理
const notFoundHandler = (req, res) => {
  const error = new NotFoundError('RESOURCE_NOT_FOUND', `接口不存在: ${req.originalUrl}`);
  
  logger.warn('404错误', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  res.status(404).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      errorCode: error.errorCode,
      timestamp: error.timestamp
    }
  });
};

// 异步错误包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 错误响应工具函数
const sendError = (res, errorCode, message = null, details = null, statusCode = 500) => {
  const error = new AppError(errorCode, message, details, statusCode);
  errorHandler(error, {}, res, () => {});
};

const sendBusinessError = (res, errorCode, message = null, details = null) => {
  const error = new BusinessError(errorCode, message, details);
  errorHandler(error, {}, res, () => {});
};

const sendAuthError = (res, errorCode, message = null, details = null) => {
  const error = new AuthError(errorCode, message, details);
  errorHandler(error, {}, res, () => {});
};

const sendPermissionError = (res, errorCode, message = null, details = null) => {
  const error = new PermissionError(errorCode, message, details);
  errorHandler(error, {}, res, () => {});
};

const sendValidationError = (res, errorCode, message = null, details = null) => {
  const error = new ValidationError(errorCode, message, details);
  errorHandler(error, {}, res, () => {});
};

const sendNotFoundError = (res, errorCode, message = null, details = null) => {
  const error = new NotFoundError(errorCode, message, details);
  errorHandler(error, {}, res, () => {});
};

module.exports = {
  ERROR_CODES,
  AppError,
  BusinessError,
  AuthError,
  PermissionError,
  ValidationError,
  NotFoundError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sendError,
  sendBusinessError,
  sendAuthError,
  sendPermissionError,
  sendValidationError,
  sendNotFoundError
}; 