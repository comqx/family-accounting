const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// 获取分类列表
router.get('/list', async (req, res) => {
  try {
    const { familyId, type } = req.query;
    
    // TODO: 从数据库获取分类列表
    const mockCategories = [
      {
        id: 1,
        name: '餐饮',
        icon: '🍽️',
        type: 'expense',
        color: '#FF6B6B',
        isDefault: true,
        sort: 1
      },
      {
        id: 2,
        name: '交通',
        icon: '🚗',
        type: 'expense',
        color: '#4ECDC4',
        isDefault: true,
        sort: 2
      },
      {
        id: 3,
        name: '购物',
        icon: '🛒',
        type: 'expense',
        color: '#45B7D1',
        isDefault: true,
        sort: 3
      },
      {
        id: 4,
        name: '工资',
        icon: '💰',
        type: 'income',
        color: '#96CEB4',
        isDefault: true,
        sort: 1
      },
      {
        id: 5,
        name: '奖金',
        icon: '🎁',
        type: 'income',
        color: '#FFEAA7',
        isDefault: true,
        sort: 2
      }
    ];

    let filteredCategories = mockCategories;
    
    if (type) {
      filteredCategories = mockCategories.filter(cat => cat.type === type);
    }

    res.json({
      success: true,
      data: filteredCategories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ error: '获取分类列表失败' });
  }
});

// 创建分类
router.post('/create', [
  body('name').isLength({ min: 1, max: 20 }).withMessage('分类名称长度应在1-20字符之间'),
  body('type').isIn(['expense', 'income']).withMessage('类型必须是expense或income'),
  body('icon').optional().isLength({ max: 10 }).withMessage('图标长度不能超过10字符'),
  body('color').optional().isHexColor().withMessage('颜色格式不正确'),
  body('familyId').optional().isInt().withMessage('家庭ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, type, icon, color, familyId } = req.body;
    
    // TODO: 保存分类到数据库
    
    const mockCategory = {
      id: Date.now(),
      name,
      type,
      icon: icon || '📝',
      color: color || '#666666',
      isDefault: false,
      sort: 999,
      familyId,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: '分类创建成功',
      data: mockCategory
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({ error: '创建分类失败' });
  }
});

// 更新分类
router.put('/:categoryId', [
  body('name').optional().isLength({ min: 1, max: 20 }).withMessage('分类名称长度应在1-20字符之间'),
  body('icon').optional().isLength({ max: 10 }).withMessage('图标长度不能超过10字符'),
  body('color').optional().isHexColor().withMessage('颜色格式不正确'),
  body('sort').optional().isInt().withMessage('排序必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { categoryId } = req.params;
    const updateData = req.body;
    
    // TODO: 更新数据库中的分类
    
    res.json({
      success: true,
      message: '分类更新成功'
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ error: '更新分类失败' });
  }
});

// 删除分类
router.delete('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // TODO: 检查分类是否被使用，如果被使用则不允许删除
    // TODO: 从数据库删除分类
    
    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ error: '删除分类失败' });
  }
});

// 获取分类统计信息
router.get('/stats', async (req, res) => {
  try {
    const { familyId, startDate, endDate, type } = req.query;
    
    // TODO: 从数据库获取分类统计信息
    const mockStats = [
      {
        categoryId: 1,
        categoryName: '餐饮',
        categoryIcon: '🍽️',
        count: 45,
        amount: 3200.50,
        percentage: 25.4
      },
      {
        categoryId: 2,
        categoryName: '交通',
        categoryIcon: '🚗',
        count: 23,
        amount: 890.30,
        percentage: 7.1
      },
      {
        categoryId: 3,
        categoryName: '购物',
        categoryIcon: '🛒',
        count: 34,
        amount: 2100.80,
        percentage: 16.7
      }
    ];

    res.json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({ error: '获取分类统计失败' });
  }
});

module.exports = router; 