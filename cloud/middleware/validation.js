const { body, param, query, validationResult } = require('express-validator');

// 统一错误处理
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '参数校验失败',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// 用户相关校验规则
const userValidation = {
  // 登录
  login: [
    body('code').notEmpty().withMessage('微信授权码不能为空'),
    handleValidationErrors
  ],
  
  // 更新用户信息
  updateProfile: [
    body('nickname').optional().isLength({ min: 1, max: 50 }).withMessage('昵称长度应在1-50字符之间'),
    body('avatarUrl').optional().isURL().withMessage('头像URL格式不正确'),
    handleValidationErrors
  ]
};

// 家庭相关校验规则
const familyValidation = {
  // 创建家庭
  create: [
    body('name').notEmpty().isLength({ min: 1, max: 50 }).withMessage('家庭名称长度应在1-50字符之间'),
    body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符'),
    handleValidationErrors
  ],
  
  // 加入家庭
  join: [
    body('inviteCode').notEmpty().isLength({ min: 6, max: 10 }).withMessage('邀请码长度应在6-10字符之间'),
    handleValidationErrors
  ],
  
  // 更新家庭信息
  update: [
    param('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    body('name').optional().isLength({ min: 1, max: 50 }).withMessage('家庭名称长度应在1-50字符之间'),
    body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符'),
    handleValidationErrors
  ],
  
  // 获取家庭信息
  getById: [
    param('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    handleValidationErrors
  ]
};

// 记录相关校验规则
const recordValidation = {
  // 创建记录
  create: [
    body('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    body('type').isIn(['expense', 'income']).withMessage('记录类型必须是expense或income'),
    body('amount').isFloat({ min: 0.01 }).withMessage('金额必须是大于0的数字'),
    body('categoryId').isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
    body('date').isISO8601().withMessage('日期格式不正确'),
    body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符'),
    handleValidationErrors
  ],
  
  // 更新记录
  update: [
    param('recordId').isInt({ min: 1 }).withMessage('记录ID必须是正整数'),
    body('type').optional().isIn(['expense', 'income']).withMessage('记录类型必须是expense或income'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('金额必须是大于0的数字'),
    body('categoryId').optional().isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
    body('date').optional().isISO8601().withMessage('日期格式不正确'),
    body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符'),
    handleValidationErrors
  ],
  
  // 获取记录列表
  list: [
    query('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页大小必须在1-100之间'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
    query('type').optional().isIn(['expense', 'income']).withMessage('记录类型必须是expense或income'),
    query('categoryId').optional().isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
    handleValidationErrors
  ],
  
  // 删除记录
  delete: [
    param('recordId').isInt({ min: 1 }).withMessage('记录ID必须是正整数'),
    handleValidationErrors
  ]
};

// 分类相关校验规则
const categoryValidation = {
  // 创建分类
  create: [
    body('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    body('name').notEmpty().isLength({ min: 1, max: 20 }).withMessage('分类名称长度应在1-20字符之间'),
    body('type').isIn(['expense', 'income']).withMessage('分类类型必须是expense或income'),
    body('icon').notEmpty().withMessage('分类图标不能为空'),
    body('color').matches(/^#[0-9A-F]{6}$/i).withMessage('颜色格式必须是十六进制颜色码'),
    handleValidationErrors
  ],
  
  // 更新分类
  update: [
    param('categoryId').isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
    body('name').optional().isLength({ min: 1, max: 20 }).withMessage('分类名称长度应在1-20字符之间'),
    body('icon').optional().notEmpty().withMessage('分类图标不能为空'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('颜色格式必须是十六进制颜色码'),
    handleValidationErrors
  ],
  
  // 删除分类
  delete: [
    param('categoryId').isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
    handleValidationErrors
  ]
};

// 预算相关校验规则
const budgetValidation = {
  // 创建预算
  create: [
    body('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    body('categoryId').isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
    body('amount').isFloat({ min: 0.01 }).withMessage('预算金额必须是大于0的数字'),
    body('month').matches(/^\d{4}-\d{2}$/).withMessage('月份格式必须是YYYY-MM'),
    handleValidationErrors
  ],
  
  // 更新预算
  update: [
    param('budgetId').isInt({ min: 1 }).withMessage('预算ID必须是正整数'),
    body('amount').isFloat({ min: 0.01 }).withMessage('预算金额必须是大于0的数字'),
    handleValidationErrors
  ]
};

// 分摊相关校验规则
const splitValidation = {
  // 创建分摊
  create: [
    body('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    body('description').notEmpty().isLength({ max: 200 }).withMessage('描述长度不能超过200字符'),
    body('totalAmount').isFloat({ min: 0.01 }).withMessage('总金额必须是大于0的数字'),
    body('participants').isArray({ min: 2 }).withMessage('参与者至少需要2人'),
    body('participants.*.userId').isInt({ min: 1 }).withMessage('用户ID必须是正整数'),
    body('participants.*.amount').isFloat({ min: 0.01 }).withMessage('分摊金额必须是大于0的数字'),
    handleValidationErrors
  ],
  
  // 更新分摊状态
  updateStatus: [
    param('splitId').isInt({ min: 1 }).withMessage('分摊ID必须是正整数'),
    body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('状态值不正确'),
    handleValidationErrors
  ]
};

// 报表相关校验规则
const reportValidation = {
  // 获取统计数据
  statistics: [
    query('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    query('startDate').isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').isISO8601().withMessage('结束日期格式不正确'),
    handleValidationErrors
  ],
  
  // 获取分类统计
  categories: [
    query('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    query('startDate').isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').isISO8601().withMessage('结束日期格式不正确'),
    query('type').isIn(['expense', 'income']).withMessage('类型必须是expense或income'),
    handleValidationErrors
  ],
  
  // 获取趋势数据
  trends: [
    query('familyId').isInt({ min: 1 }).withMessage('家庭ID必须是正整数'),
    query('startDate').isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').isISO8601().withMessage('结束日期格式不正确'),
    query('type').isIn(['expense', 'income']).withMessage('类型必须是expense或income'),
    query('period').isIn(['day', 'week', 'month']).withMessage('周期必须是day、week或month'),
    handleValidationErrors
  ]
};

// 文件上传相关校验规则
const uploadValidation = {
  // 上传图片
  image: [
    body('type').isIn(['avatar', 'receipt', 'other']).withMessage('上传类型不正确'),
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  familyValidation,
  recordValidation,
  categoryValidation,
  budgetValidation,
  splitValidation,
  reportValidation,
  uploadValidation,
  handleValidationErrors
}; 