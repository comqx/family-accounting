const jwt = require('jsonwebtoken');
const { getUserById } = require('../utils/database');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// 验证JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: '未提供认证令牌',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: '认证令牌无效或已过期',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // 验证用户是否存在
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatar_url
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      error: '认证服务异常',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// 家庭权限检查中间件
const checkFamilyPermission = (requiredRole = 'MEMBER') => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const familyId = req.params.familyId || req.body.familyId || req.query.familyId;

      if (!familyId) {
        return res.status(400).json({
          error: '缺少家庭ID',
          code: 'FAMILY_ID_MISSING'
        });
      }

      // 获取用户在该家庭中的角色
      const memberRole = await getFamilyMemberRole(user.id, familyId);
      
      if (!memberRole) {
        return res.status(403).json({
          error: '您不是该家庭的成员',
          code: 'NOT_FAMILY_MEMBER'
        });
      }

      // 检查权限等级
      const roleHierarchy = {
        'OBSERVER': 1,
        'MEMBER': 2,
        'ADMIN': 3,
        'owner': 4
      };

      const userRoleLevel = roleHierarchy[memberRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          error: '权限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole,
          currentRole: memberRole
        });
      }

      // 将家庭信息添加到请求对象
      req.family = {
        id: familyId,
        userRole: memberRole
      };

      next();
    } catch (error) {
      console.error('家庭权限检查错误:', error);
      return res.status(500).json({
        error: '权限检查服务异常',
        code: 'PERMISSION_SERVICE_ERROR'
      });
    }
  };
};

// 获取用户在家庭中的角色
const getFamilyMemberRole = async (userId, familyId) => {
  try {
    const pool = require('../config/database').getPool();
    const [rows] = await pool.execute(
      'SELECT role FROM family_members WHERE user_id = ? AND family_id = ?',
      [userId, familyId]
    );
    
    return rows.length > 0 ? rows[0].role : null;
  } catch (error) {
    console.error('获取家庭成员角色错误:', error);
    return null;
  }
};

// 记录权限检查中间件
const checkRecordPermission = async (req, res, next) => {
  try {
    const { user } = req;
    const recordId = req.params.recordId || req.body.recordId;

    if (!recordId) {
      return res.status(400).json({
        error: '缺少记录ID',
        code: 'RECORD_ID_MISSING'
      });
    }

    // 检查记录是否存在且用户有权限访问
    const pool = require('../config/database').getPool();
    const [rows] = await pool.execute(
      `SELECT r.*, fm.role as user_role 
       FROM records r 
       JOIN family_members fm ON r.family_id = fm.family_id 
       WHERE r.id = ? AND fm.user_id = ?`,
      [recordId, user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: '记录不存在或无权限访问',
        code: 'RECORD_NOT_FOUND'
      });
    }

    const record = rows[0];
    
    // 检查权限：只有记录创建者、管理员或家庭所有者可以修改/删除
    const canModify = record.user_id === user.id || 
                     record.user_role === 'ADMIN' || 
                     record.user_role === 'owner';

    req.record = {
      ...record,
      canModify
    };

    next();
  } catch (error) {
    console.error('记录权限检查错误:', error);
    return res.status(500).json({
      error: '权限检查服务异常',
      code: 'PERMISSION_SERVICE_ERROR'
    });
  }
};

// 分类权限检查中间件
const checkCategoryPermission = async (req, res, next) => {
  try {
    const { user } = req;
    const categoryId = req.params.categoryId || req.body.categoryId;

    if (!categoryId) {
      return res.status(400).json({
        error: '缺少分类ID',
        code: 'CATEGORY_ID_MISSING'
      });
    }

    // 检查分类是否存在且用户有权限访问
    const pool = require('../config/database').getPool();
    const [rows] = await pool.execute(
      `SELECT c.*, fm.role as user_role 
       FROM categories c 
       JOIN family_members fm ON c.family_id = fm.family_id 
       WHERE c.id = ? AND fm.user_id = ?`,
      [categoryId, user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: '分类不存在或无权限访问',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    const category = rows[0];
    
    // 检查权限：只有管理员或家庭所有者可以修改/删除分类
    const canModify = category.user_role === 'ADMIN' || category.user_role === 'owner';

    req.category = {
      ...category,
      canModify
    };

    next();
  } catch (error) {
    console.error('分类权限检查错误:', error);
    return res.status(500).json({
      error: '权限检查服务异常',
      code: 'PERMISSION_SERVICE_ERROR'
    });
  }
};

// 预算权限检查中间件
const checkBudgetPermission = async (req, res, next) => {
  try {
    const { user } = req;
    const budgetId = req.params.budgetId || req.body.budgetId;

    if (!budgetId) {
      return res.status(400).json({
        error: '缺少预算ID',
        code: 'BUDGET_ID_MISSING'
      });
    }

    // 检查预算是否存在且用户有权限访问
    const pool = require('../config/database').getPool();
    const [rows] = await pool.execute(
      `SELECT b.*, fm.role as user_role 
       FROM budgets b 
       JOIN family_members fm ON b.family_id = fm.family_id 
       WHERE b.id = ? AND fm.user_id = ?`,
      [budgetId, user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: '预算不存在或无权限访问',
        code: 'BUDGET_NOT_FOUND'
      });
    }

    const budget = rows[0];
    
    // 检查权限：只有管理员或家庭所有者可以修改/删除预算
    const canModify = budget.user_role === 'ADMIN' || budget.user_role === 'owner';

    req.budget = {
      ...budget,
      canModify
    };

    next();
  } catch (error) {
    console.error('预算权限检查错误:', error);
    return res.status(500).json({
      error: '权限检查服务异常',
      code: 'PERMISSION_SERVICE_ERROR'
    });
  }
};

// 角色权限常量
const ROLES = {
  OBSERVER: 'OBSERVER',    // 观察员：只能查看数据
  MEMBER: 'MEMBER',        // 普通成员：可以记账和查看数据
  ADMIN: 'ADMIN',          // 管理员：可以管理成员和设置
  OWNER: 'owner'           // 家庭所有者：拥有所有权限
};

// 权限检查工具函数
const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    'OBSERVER': 1,
    'MEMBER': 2,
    'ADMIN': 3,
    'owner': 4
  };

  const userRoleLevel = roleHierarchy[userRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  checkFamilyPermission,
  checkRecordPermission,
  checkCategoryPermission,
  checkBudgetPermission,
  getFamilyMemberRole,
  hasPermission,
  ROLES
}; 