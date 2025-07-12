const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 数据库相关
const { testConnection, initPool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 80;

// 中间件配置
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://servicewechat.com'] 
    : true,
  credentials: true
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'family-accounting-cloud',
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/family', require('./routes/family'));
app.use('/api/record', require('./routes/record'));
app.use('/api/category', require('./routes/category'));
app.use('/api/report', require('./routes/report'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/split', require('./routes/split'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 1. 初始化数据库连接池
    initPool();
    
    // 2. 测试数据库连接（启动脚本已经确保数据库可用）
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务启动终止');
      process.exit(1);
    }
    
    // 3. 启动HTTP服务
    app.listen(PORT, () => {
      console.log(`🚀 家账通云托管服务启动成功`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error('💥 服务启动失败:', error);
    process.exit(1);
  }
};

// 启动服务
startServer();

module.exports = app; 