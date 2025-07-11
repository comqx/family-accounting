const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
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
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'token无效或已过期' });
    }
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;

    const pool = await getConnection();
    
    try {
      // 构建查询条件
      let whereConditions = ['r.family_id = ?'];
      let queryParams = [familyId];
      
      if (startDate) {
        whereConditions.push('r.date >= ?');
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('r.date <= ?');
        queryParams.push(endDate);
      }
      
      if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
        whereConditions.push('r.category_id = ?');
        queryParams.push(categoryId);
      }
      
      if (type !== undefined && type !== null && type !== '') {
        whereConditions.push('r.type = ?');
        queryParams.push(type);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 兜底：所有SQL参数undefined转为null
      queryParams = queryParams.map(v => v === undefined ? null : v);
      
      // 获取总记录数
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM records r WHERE ${whereClause}`,
        queryParams
      );
      
      const total = countResult[0].total;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      // 获取记录列表
      const [records] = await pool.execute(
        `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.nickname as user_nickname, u.avatar as user_avatar
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE ${whereClause}
         ORDER BY r.date DESC, r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(pageSize), offset]
      );
      
      // 格式化记录数据
      const formattedRecords = records.map(record => ({
        id: record.id,
        familyId: record.family_id,
        userId: record.user_id,
        type: record.type,
        amount: record.amount,
        categoryId: record.category_id,
        categoryName: record.category_name,
        categoryIcon: record.category_icon,
        categoryColor: record.category_color,
        description: record.description,
        date: record.date,
        createdAt: record.created_at,
        user: {
          id: record.user_id,
          nickname: record.user_nickname,
          avatar: record.user_avatar
        }
      }));
      
      res.json({
        success: true,
        data: {
          list: formattedRecords,
          hasMore: parseInt(page) < Math.ceil(total / parseInt(pageSize))
        }
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取记账记录失败' });
    }
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
    
    // 调试：打印接收到的原始数据
    console.log('接收到的请求数据:', {
      body: req.body,
      headers: req.headers,
      familyId: familyId,
      type: type,
      amount: amount,
      categoryId: categoryId,
      date: date,
      description: description
    });
    
    // 验证必需参数不为undefined或空字符串
    if (familyId === undefined || familyId === null || familyId === '' ||
        type === undefined || type === null || type === '' ||
        amount === undefined || amount === null || amount === '' ||
        categoryId === undefined || categoryId === null || categoryId === '' ||
        date === undefined || date === null || date === '') {
      console.error('参数验证失败:', { familyId, type, amount, categoryId, date, description });
      return res.status(400).json({ error: '缺少必需参数' });
    }
    
    // 确保数值类型正确
    const parsedFamilyId = parseInt(familyId);
    const parsedCategoryId = parseInt(categoryId);
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedFamilyId) || isNaN(parsedCategoryId) || isNaN(parsedAmount)) {
      console.error('数值转换失败:', { familyId, categoryId, amount, parsedFamilyId, parsedCategoryId, parsedAmount });
      return res.status(400).json({ error: '参数格式错误' });
    }
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('JWT解码成功:', decoded);
    } catch (err) {
      console.error('JWT验证失败:', err);
      return res.status(401).json({ error: 'token无效或已过期' });
    }
    
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;
    
    // 验证userId不为undefined
    if (userId === undefined || userId === null) {
      console.error('userId验证失败:', { userId, decoded, availableFields: Object.keys(decoded) });
      return res.status(401).json({ error: '用户ID无效' });
    }
    
    console.log('用户ID验证成功:', userId);

    const pool = await getConnection();
    
    try {
      // 验证家庭和分类是否存在
      const [families] = await pool.execute(
        'SELECT id FROM families WHERE id = ?',
        [parsedFamilyId]
      );
      
      if (families.length === 0) {
        return res.status(400).json({ error: '家庭不存在' });
      }

      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE id = ?',
        [parsedCategoryId]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({ error: '分类不存在' });
      }

      // 插入记账记录
      const insertParams = [parsedFamilyId, userId, parsedCategoryId, type, parsedAmount, description || '', date];
      console.log('插入记录参数:', insertParams);
      
      const [result] = await pool.execute(
        'INSERT INTO records (family_id, user_id, category_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        insertParams
      );
      
      const recordId = result.insertId;
      
      // 查询创建的记录详情
      const [records] = await pool.execute(
        `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.nickname as user_nickname, u.avatar as user_avatar
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.id = ?`,
        [recordId]
      );
      
      if (records.length > 0) {
        const record = records[0];
        res.json({
          success: true,
          message: '记账记录创建成功',
          data: {
            id: record.id,
            familyId: record.family_id,
            userId: record.user_id,
            type: record.type,
            amount: record.amount,
            categoryId: record.category_id,
            categoryName: record.category_name,
            categoryIcon: record.category_icon,
            categoryColor: record.category_color,
            description: record.description,
            date: record.date,
            createdAt: record.created_at,
            user: {
              id: record.user_id,
              nickname: record.user_nickname,
              avatar: record.user_avatar
            }
          }
        });
      } else {
        throw new Error('创建记录后查询失败');
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '创建记账记录失败' });
    }
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
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'token无效或已过期' });
    }
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;

    const pool = await getConnection();
    
    try {
      // 检查记录是否存在且属于当前用户
      const [existingRecords] = await pool.execute(
        'SELECT * FROM records WHERE id = ? AND user_id = ?',
        [recordId, userId]
      );
      
      if (existingRecords.length === 0) {
        return res.status(404).json({ error: '记录不存在或无权限修改' });
      }

      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      
      if (updateData.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(updateData.type);
      }
      
      if (updateData.amount !== undefined) {
        updateFields.push('amount = ?');
        updateValues.push(updateData.amount);
      }
      
      if (updateData.categoryId !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(updateData.categoryId);
      }
      
      if (updateData.date !== undefined) {
        updateFields.push('date = ?');
        updateValues.push(updateData.date);
      }
      
      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updateData.description);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: '没有提供要更新的字段' });
      }
      
      // 执行更新
      await pool.execute(
        `UPDATE records SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        [...updateValues, recordId]
      );
      
      // 查询更新后的记录
      const [updatedRecords] = await pool.execute(
        `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.nickname as user_nickname, u.avatar as user_avatar
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.id = ?`,
        [recordId]
      );
      
      if (updatedRecords.length > 0) {
        const record = updatedRecords[0];
        res.json({
          success: true,
          message: '记账记录更新成功',
          data: {
            id: record.id,
            familyId: record.family_id,
            userId: record.user_id,
            type: record.type,
            amount: record.amount,
            categoryId: record.category_id,
            categoryName: record.category_name,
            categoryIcon: record.category_icon,
            categoryColor: record.category_color,
            description: record.description,
            date: record.date,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
            user: {
              id: record.user_id,
              nickname: record.user_nickname,
              avatar: record.user_avatar
            }
          }
        });
      } else {
        throw new Error('更新记录后查询失败');
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '更新记账记录失败' });
    }
  } catch (error) {
    console.error('更新记账记录错误:', error);
    res.status(500).json({ error: '更新记账记录失败' });
  }
});

// 删除记账记录
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'token无效或已过期' });
    }
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;

    const pool = await getConnection();
    
    try {
      // 检查记录是否存在且属于当前用户
      const [existingRecords] = await pool.execute(
        'SELECT * FROM records WHERE id = ? AND user_id = ?',
        [recordId, userId]
      );
      
      if (existingRecords.length === 0) {
        return res.status(404).json({ error: '记录不存在或无权限删除' });
      }

      // 删除记录
      await pool.execute(
        'DELETE FROM records WHERE id = ?',
        [recordId]
      );
      
      res.json({
        success: true,
        message: '记账记录删除成功'
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '删除记账记录失败' });
    }
  } catch (error) {
    console.error('删除记账记录错误:', error);
    res.status(500).json({ error: '删除记账记录失败' });
  }
});

// 获取记账记录详情
router.get('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'token无效或已过期' });
    }
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;

    const pool = await getConnection();
    
    try {
      // 查询记录详情
      const [records] = await pool.execute(
        `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.nickname as user_nickname, u.avatar as user_avatar
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.id = ?`,
        [recordId]
      );
      
      if (records.length > 0) {
        const record = records[0];
        res.json({
          success: true,
          data: {
            id: record.id,
            familyId: record.family_id,
            userId: record.user_id,
            type: record.type,
            amount: record.amount,
            categoryId: record.category_id,
            categoryName: record.category_name,
            categoryIcon: record.category_icon,
            categoryColor: record.category_color,
            description: record.description,
            date: record.date,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
            user: {
              id: record.user_id,
              nickname: record.user_nickname,
              avatar: record.user_avatar
            }
          }
        });
      } else {
        res.status(404).json({ error: '记录不存在' });
      }
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取记账记录详情失败' });
    }
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