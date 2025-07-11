const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const router = express.Router();

// 获取分类列表
router.get('/list', async (req, res) => {
  try {
    const { familyId, type } = req.query;
    console.log('📝 获取分类列表请求:', { familyId, type });
    
    const pool = await getConnection();
    console.log('✅ 数据库连接成功');
    
    try {
      let whereConditions = ['1=1']; // 默认条件
      let queryParams = [];
      
      // 如果有familyId，优先查询该家庭的分类，否则查询默认分类
      if (familyId) {
        whereConditions.push('(family_id = ? OR family_id IS NULL)');
        queryParams.push(familyId);
      }
      
      if (type) {
        whereConditions.push('type = ?');
        queryParams.push(type);
      }
      
      const whereClause = whereConditions.join(' AND ');
      console.log('🔍 SQL查询条件:', whereClause);
      console.log('🔍 查询参数:', queryParams);
      
      // 从数据库获取分类列表
      const [categories] = await pool.execute(
        `SELECT id, name, icon, type, color, is_default, sort_order, family_id, created_at
         FROM categories 
         WHERE ${whereClause}
         ORDER BY sort_order ASC, created_at ASC`,
        queryParams
      );
      
      console.log(`✅ 查询成功，返回 ${categories.length} 个分类`);
      
      const formattedCategories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        type: cat.type,
        color: cat.color,
        isDefault: cat.is_default === 1,
        sort: cat.sort_order,
        familyId: cat.family_id,
        createdAt: cat.created_at
      }));

      res.json({
        success: true,
        data: formattedCategories
      });
      
    } catch (dbError) {
      console.error('❌ 数据库查询错误:', dbError);
      console.error('错误详情:', {
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage
      });
      res.status(500).json({ error: '获取分类列表失败', dbError: dbError.message, sql: dbError.sql });
    }
    
  } catch (error) {
    console.error('❌ 获取分类列表错误:', error);
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
    
    const pool = await getConnection();
    
    try {
      // 检查分类名称是否已存在
      const [existingCategories] = await pool.execute(
        'SELECT id FROM categories WHERE name = ? AND type = ? AND (family_id = ? OR family_id IS NULL)',
        [name, type, familyId]
      );
      
      if (existingCategories.length > 0) {
        return res.status(400).json({ error: '分类名称已存在' });
      }
      
      // 获取最大排序值
      const [maxSortResult] = await pool.execute(
        'SELECT MAX(sort_order) as maxSort FROM categories WHERE type = ?',
        [type]
      );
      
      const nextSort = (maxSortResult[0].maxSort || 0) + 1;
      
      // 保存分类到数据库
      const [result] = await pool.execute(
        'INSERT INTO categories (name, type, icon, color, is_default, sort_order, family_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, type, icon || '📝', color || '#666666', 0, nextSort, familyId]
      );
      
      const categoryId = result.insertId;
      
      // 获取新创建的分类
      const [newCategory] = await pool.execute(
        'SELECT id, name, icon, type, color, is_default, sort_order, family_id, created_at FROM categories WHERE id = ?',
        [categoryId]
      );
      
      const category = newCategory[0];
      
      res.json({
        success: true,
        message: '分类创建成功',
        data: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          type: category.type,
          color: category.color,
          isDefault: category.is_default === 1,
          sort: category.sort_order,
          familyId: category.family_id,
          createdAt: category.created_at
        }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '创建分类失败' });
    }
    
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
    
    const pool = await getConnection();
    
    try {
      // 检查分类是否存在
      const [existingCategory] = await pool.execute(
        'SELECT id, is_default FROM categories WHERE id = ?',
        [categoryId]
      );
      
      if (existingCategory.length === 0) {
        return res.status(404).json({ error: '分类不存在' });
      }
      
      // 如果是默认分类，不允许修改
      if (existingCategory[0].is_default === 1) {
        return res.status(400).json({ error: '默认分类不允许修改' });
      }
      
      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      
      if (updateData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updateData.name);
      }
      
      if (updateData.icon !== undefined) {
        updateFields.push('icon = ?');
        updateValues.push(updateData.icon);
      }
      
      if (updateData.color !== undefined) {
        updateFields.push('color = ?');
        updateValues.push(updateData.color);
      }
      
      if (updateData.sort !== undefined) {
        updateFields.push('sort_order = ?');
        updateValues.push(updateData.sort);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: '没有提供要更新的字段' });
      }
      
      updateValues.push(categoryId);
      
      // 更新数据库中的分类
      await pool.execute(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      res.json({
        success: true,
        message: '分类更新成功'
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '更新分类失败' });
    }
    
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ error: '更新分类失败' });
  }
});

// 删除分类
router.delete('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const pool = await getConnection();
    
    try {
      // 检查分类是否存在
      const [existingCategory] = await pool.execute(
        'SELECT id, is_default FROM categories WHERE id = ?',
        [categoryId]
      );
      
      if (existingCategory.length === 0) {
        return res.status(404).json({ error: '分类不存在' });
      }
      
      // 如果是默认分类，不允许删除
      if (existingCategory[0].is_default === 1) {
        return res.status(400).json({ error: '默认分类不允许删除' });
      }
      
      // 检查分类是否被使用
      const [usedRecords] = await pool.execute(
        'SELECT COUNT(*) as count FROM records WHERE category_id = ?',
        [categoryId]
      );
      
      if (usedRecords[0].count > 0) {
        return res.status(400).json({ error: '分类正在使用中，无法删除' });
      }
      
      // 从数据库删除分类
      await pool.execute(
        'DELETE FROM categories WHERE id = ?',
        [categoryId]
      );
      
      res.json({
        success: true,
        message: '分类删除成功'
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '删除分类失败' });
    }
    
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ error: '删除分类失败' });
  }
});

// 获取分类统计信息
router.get('/stats', async (req, res) => {
  try {
    const { familyId, startDate, endDate, type } = req.query;
    
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
      
      if (type) {
        whereConditions.push('r.type = ?');
        queryParams.push(type);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 获取总金额用于计算百分比
      const [totalResult] = await pool.execute(
        `SELECT SUM(amount) as totalAmount FROM records r WHERE ${whereClause}`,
        queryParams
      );
      
      const totalAmount = parseFloat(totalResult[0].totalAmount) || 0;
      
      // 从数据库获取分类统计信息
      const [categoryStats] = await pool.execute(
        `SELECT c.id as categoryId, c.name as categoryName, c.icon as categoryIcon,
                COUNT(r.id) as count, SUM(r.amount) as amount
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE ${whereClause}
         GROUP BY c.id, c.name, c.icon
         ORDER BY amount DESC`,
        queryParams
      );
      
      const stats = categoryStats.map(stat => ({
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        categoryIcon: stat.categoryIcon,
        count: stat.count,
        amount: parseFloat(stat.amount) || 0,
        percentage: totalAmount > 0 ? Math.round((parseFloat(stat.amount) / totalAmount) * 1000) / 10 : 0
      }));

      res.json({
        success: true,
        data: stats
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取分类统计失败' });
    }
    
  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({ error: '获取分类统计失败' });
  }
});

module.exports = router; 