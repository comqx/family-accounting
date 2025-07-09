const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// 获取记账记录列表
router.get('/list', async (req, res) => {
  try {
    const { 
      familyId, 
      page = 1, 
      pageSize = 20, 
      startDate, 
      endDate, 
      categoryId,
      type 
    } = req.query;
    
    // TODO: 从数据库获取记账记录列表
    const mockRecords = [
      {
        id: 1,
        familyId: 1,
        userId: 1,
        type: 'expense',
        amount: 25.50,
        category: {
          id: 1,
          name: '餐饮',
          icon: '🍽️'
        },
        description: '午餐',
        date: '2024-01-15',
        createdAt: new Date().toISOString(),
        user: {
          id: 1,
          nickname: '张三',
          avatar: 'https://example.com/avatar1.jpg'
        }
      },
      {
        id: 2,
        familyId: 1,
        userId: 2,
        type: 'income',
        amount: 5000.00,
        category: {
          id: 2,
          name: '工资',
          icon: '💰'
        },
        description: '月薪',
        date: '2024-01-15',
        createdAt: new Date().toISOString(),
        user: {
          id: 2,
          nickname: '李四',
          avatar: 'https://example.com/avatar2.jpg'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        records: mockRecords,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: 156,
          totalPages: 8
        }
      }
    });
  } catch (error) {
    console.error('获取记账记录错误:', error);
    res.status(500).json({ error: '获取记账记录失败' });
  }
});

// 创建记账记录
router.post('/create', [
  body('familyId').isInt().withMessage('家庭ID必须是整数'),
  body('type').isIn(['expense', 'income']).withMessage('类型必须是expense或income'),
  body('amount').isFloat({ min: 0.01 }).withMessage('金额必须大于0'),
  body('categoryId').isInt().withMessage('分类ID必须是整数'),
  body('date').isISO8601().withMessage('日期格式不正确'),
  body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { 
      familyId, 
      type, 
      amount, 
      categoryId, 
      date, 
      description 
    } = req.body;
    
    // TODO: 保存记账记录到数据库
    
    const mockRecord = {
      id: Date.now(),
      familyId,
      type,
      amount: parseFloat(amount),
      categoryId,
      date,
      description,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: '记账记录创建成功',
      data: mockRecord
    });
  } catch (error) {
    console.error('创建记账记录错误:', error);
    res.status(500).json({ error: '创建记账记录失败' });
  }
});

// 更新记账记录
router.put('/:recordId', [
  body('type').optional().isIn(['expense', 'income']).withMessage('类型必须是expense或income'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('金额必须大于0'),
  body('categoryId').optional().isInt().withMessage('分类ID必须是整数'),
  body('date').optional().isISO8601().withMessage('日期格式不正确'),
  body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { recordId } = req.params;
    const updateData = req.body;
    
    // TODO: 更新数据库中的记账记录
    
    res.json({
      success: true,
      message: '记账记录更新成功'
    });
  } catch (error) {
    console.error('更新记账记录错误:', error);
    res.status(500).json({ error: '更新记账记录失败' });
  }
});

// 删除记账记录
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // TODO: 从数据库删除记账记录
    
    res.json({
      success: true,
      message: '记账记录删除成功'
    });
  } catch (error) {
    console.error('删除记账记录错误:', error);
    res.status(500).json({ error: '删除记账记录失败' });
  }
});

// 获取记账记录详情
router.get('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // TODO: 从数据库获取记账记录详情
    const mockRecord = {
      id: parseInt(recordId),
      familyId: 1,
      userId: 1,
      type: 'expense',
      amount: 25.50,
      category: {
        id: 1,
        name: '餐饮',
        icon: '🍽️'
      },
      description: '午餐',
      date: '2024-01-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 1,
        nickname: '张三',
        avatar: 'https://example.com/avatar1.jpg'
      }
    };

    res.json({
      success: true,
      data: mockRecord
    });
  } catch (error) {
    console.error('获取记账记录详情错误:', error);
    res.status(500).json({ error: '获取记账记录详情失败' });
  }
});

// 批量导入记账记录
router.post('/import', async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: '记录数据不能为空' });
    }
    
    // TODO: 批量保存记账记录到数据库
    
    res.json({
      success: true,
      message: `成功导入 ${records.length} 条记录`,
      data: {
        imported: records.length,
        failed: 0
      }
    });
  } catch (error) {
    console.error('批量导入错误:', error);
    res.status(500).json({ error: '批量导入失败' });
  }
});

module.exports = router; 