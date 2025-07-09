const express = require('express');
const router = express.Router();

// 获取月度报表
router.get('/monthly', async (req, res) => {
  try {
    const { familyId, year, month } = req.query;
    
    // TODO: 从数据库获取月度报表数据
    const mockMonthlyReport = {
      year: parseInt(year) || 2024,
      month: parseInt(month) || 1,
      totalIncome: 15000.00,
      totalExpense: 8500.50,
      balance: 6499.50,
      expenseByCategory: [
        { categoryId: 1, categoryName: '餐饮', amount: 3200.50, percentage: 37.7 },
        { categoryId: 2, categoryName: '交通', amount: 890.30, percentage: 10.5 },
        { categoryId: 3, categoryName: '购物', amount: 2100.80, percentage: 24.7 },
        { categoryId: 4, categoryName: '娱乐', amount: 800.00, percentage: 9.4 },
        { categoryId: 5, categoryName: '其他', amount: 1508.90, percentage: 17.7 }
      ],
      incomeByCategory: [
        { categoryId: 6, categoryName: '工资', amount: 12000.00, percentage: 80.0 },
        { categoryId: 7, categoryName: '奖金', amount: 3000.00, percentage: 20.0 }
      ],
      dailyStats: [
        { date: '2024-01-01', income: 0, expense: 150.50 },
        { date: '2024-01-02', income: 0, expense: 89.30 },
        { date: '2024-01-03', income: 12000.00, expense: 0 },
        // ... 更多日期数据
      ]
    };

    res.json({
      success: true,
      data: mockMonthlyReport
    });
  } catch (error) {
    console.error('获取月度报表错误:', error);
    res.status(500).json({ error: '获取月度报表失败' });
  }
});

// 获取年度报表
router.get('/yearly', async (req, res) => {
  try {
    const { familyId, year } = req.query;
    
    // TODO: 从数据库获取年度报表数据
    const mockYearlyReport = {
      year: parseInt(year) || 2024,
      totalIncome: 180000.00,
      totalExpense: 102000.50,
      balance: 77999.50,
      monthlyStats: [
        { month: 1, income: 15000.00, expense: 8500.50, balance: 6499.50 },
        { month: 2, income: 15000.00, expense: 9200.30, balance: 5799.70 },
        { month: 3, income: 15000.00, expense: 7800.80, balance: 7199.20 },
        // ... 更多月份数据
      ],
      topExpenseCategories: [
        { categoryId: 1, categoryName: '餐饮', totalAmount: 38400.00 },
        { categoryId: 3, categoryName: '购物', totalAmount: 25200.00 },
        { categoryId: 2, categoryName: '交通', totalAmount: 10680.00 }
      ],
      topIncomeCategories: [
        { categoryId: 6, categoryName: '工资', totalAmount: 144000.00 },
        { categoryId: 7, categoryName: '奖金', totalAmount: 36000.00 }
      ]
    };

    res.json({
      success: true,
      data: mockYearlyReport
    });
  } catch (error) {
    console.error('获取年度报表错误:', error);
    res.status(500).json({ error: '获取年度报表失败' });
  }
});

// 获取自定义时间段报表
router.get('/custom', async (req, res) => {
  try {
    const { familyId, startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: '开始日期和结束日期不能为空' });
    }
    
    // TODO: 从数据库获取自定义时间段报表数据
    const mockCustomReport = {
      startDate,
      endDate,
      totalIncome: 45000.00,
      totalExpense: 25500.50,
      balance: 19499.50,
      expenseByCategory: [
        { categoryId: 1, categoryName: '餐饮', amount: 9600.50, percentage: 37.6 },
        { categoryId: 2, categoryName: '交通', amount: 2670.30, percentage: 10.5 },
        { categoryId: 3, categoryName: '购物', amount: 6300.80, percentage: 24.7 }
      ],
      incomeByCategory: [
        { categoryId: 6, categoryName: '工资', amount: 36000.00, percentage: 80.0 },
        { categoryId: 7, categoryName: '奖金', amount: 9000.00, percentage: 20.0 }
      ],
      dailyStats: [
        { date: '2024-01-01', income: 0, expense: 150.50 },
        { date: '2024-01-02', income: 0, expense: 89.30 },
        { date: '2024-01-03', income: 12000.00, expense: 0 }
        // ... 更多日期数据
      ]
    };

    res.json({
      success: true,
      data: mockCustomReport
    });
  } catch (error) {
    console.error('获取自定义报表错误:', error);
    res.status(500).json({ error: '获取自定义报表失败' });
  }
});

// 获取趋势分析
router.get('/trends', async (req, res) => {
  try {
    const { familyId, type, period } = req.query;
    
    // TODO: 从数据库获取趋势分析数据
    const mockTrends = {
      type: type || 'expense',
      period: period || 'monthly',
      data: [
        { period: '2024-01', amount: 8500.50, change: 0 },
        { period: '2024-02', amount: 9200.30, change: 8.2 },
        { period: '2024-03', amount: 7800.80, change: -15.2 },
        { period: '2024-04', amount: 8900.40, change: 14.1 },
        { period: '2024-05', amount: 9500.60, change: 6.7 },
        { period: '2024-06', amount: 8200.20, change: -13.7 }
      ],
      average: 8683.63,
      trend: 'stable' // increasing, decreasing, stable
    };

    res.json({
      success: true,
      data: mockTrends
    });
  } catch (error) {
    console.error('获取趋势分析错误:', error);
    res.status(500).json({ error: '获取趋势分析失败' });
  }
});

// 获取预算分析
router.get('/budget', async (req, res) => {
  try {
    const { familyId, year, month } = req.query;
    
    // TODO: 从数据库获取预算分析数据
    const mockBudgetAnalysis = {
      year: parseInt(year) || 2024,
      month: parseInt(month) || 1,
      totalBudget: 10000.00,
      totalSpent: 8500.50,
      remaining: 1499.50,
      percentage: 85.0,
      categoryBudgets: [
        {
          categoryId: 1,
          categoryName: '餐饮',
          budget: 4000.00,
          spent: 3200.50,
          remaining: 799.50,
          percentage: 80.0
        },
        {
          categoryId: 2,
          categoryName: '交通',
          budget: 1000.00,
          spent: 890.30,
          remaining: 109.70,
          percentage: 89.0
        },
        {
          categoryId: 3,
          categoryName: '购物',
          budget: 3000.00,
          spent: 2100.80,
          remaining: 899.20,
          percentage: 70.0
        }
      ]
    };

    res.json({
      success: true,
      data: mockBudgetAnalysis
    });
  } catch (error) {
    console.error('获取预算分析错误:', error);
    res.status(500).json({ error: '获取预算分析失败' });
  }
});

module.exports = router; 