const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// 日志目录
const LOG_DIR = path.join(__dirname, '../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 当前日志级别
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

// 敏感字段列表（需要脱敏的字段）
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'openid',
  'session_key',
  'phone',
  'email',
  'id_card',
  'bank_card'
];

// 数据脱敏函数
const maskSensitiveData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      // 脱敏处理
      if (typeof value === 'string') {
        if (value.length <= 4) {
          masked[key] = '*'.repeat(value.length);
        } else {
          masked[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        }
      } else {
        masked[key] = '***';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
};

// 日志格式
const logFormat = (tokens, req, res) => {
  const maskedBody = maskSensitiveData(req.body);
  const maskedQuery = maskSensitiveData(req.query);
  
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
    userAgent: tokens['user-agent'](req, res),
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    body: maskedBody,
    query: maskedQuery,
    headers: {
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization') ? '***' : undefined
    }
  });
};

// 错误日志格式
const errorLogFormat = (err, req, res) => {
  const maskedBody = maskSensitiveData(req.body);
  const maskedQuery = maskSensitiveData(req.query);
  
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    method: req.method,
    url: req.url,
    status: res.statusCode,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      code: err.code
    },
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    body: maskedBody,
    query: maskedQuery,
    userAgent: req.get('user-agent')
  });
};

// 创建日志流
const createLogStream = (filename) => {
  return fs.createWriteStream(
    path.join(LOG_DIR, filename),
    { flags: 'a' }
  );
};

// 访问日志
const accessLogStream = createLogStream('access.log');
const accessLogger = morgan(logFormat, { stream: accessLogStream });

// 错误日志
const errorLogStream = createLogStream('error.log');

// 业务日志
const businessLogStream = createLogStream('business.log');

// 日志写入函数
const writeLog = (level, message, data = {}, stream = null) => {
  const logLevel = LOG_LEVELS[level] || 0;
  const currentLevel = LOG_LEVELS[CURRENT_LOG_LEVEL] || 0;

  if (logLevel > currentLevel) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: maskSensitiveData(data)
  };

  const logString = JSON.stringify(logEntry) + '\n';

  // 写入控制台
  if (process.env.NODE_ENV !== 'production') {
    console.log(logString.trim());
  }

  // 写入文件
  if (stream) {
    stream.write(logString);
  } else {
    // 根据级别选择日志文件
    let targetStream;
    switch (level) {
      case 'ERROR':
        targetStream = errorLogStream;
        break;
      case 'WARN':
      case 'INFO':
        targetStream = businessLogStream;
        break;
      default:
        targetStream = businessLogStream;
    }
    targetStream.write(logString);
  }
};

// 日志级别函数
const logger = {
  error: (message, data = {}) => writeLog('ERROR', message, data),
  warn: (message, data = {}) => writeLog('WARN', message, data),
  info: (message, data = {}) => writeLog('INFO', message, data),
  debug: (message, data = {}) => writeLog('DEBUG', message, data)
};

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  const logEntry = errorLogFormat(err, req, res);
  errorLogStream.write(logEntry + '\n');
  
  // 继续错误处理
  next(err);
};

// 业务日志中间件
const businessLogger = (req, res, next) => {
  // 记录请求开始
  const startTime = Date.now();
  
  // 在响应结束时记录业务日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId: req.user?.id || 'anonymous',
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      logger.warn('API请求异常', logData);
    } else {
      logger.info('API请求完成', logData);
    }
  });

  next();
};

// 安全日志中间件
const securityLogger = (req, res, next) => {
  // 检测可疑请求
  const suspiciousPatterns = [
    /\.\.\//,  // 路径遍历
    /<script/i,  // XSS
    /union\s+select/i,  // SQL注入
    /eval\s*\(/i,  // 代码注入
  ];

  const url = req.url;
  const body = JSON.stringify(req.body);
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body)
  );

  if (isSuspicious) {
    logger.warn('检测到可疑请求', {
      url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: maskSensitiveData(req.body)
    });
  }

  next();
};

// 性能日志中间件
const performanceLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 记录慢请求
    if (duration > 1000) { // 超过1秒的请求
      logger.warn('慢请求检测', {
        method: req.method,
        url: req.url,
        duration,
        userId: req.user?.id || 'anonymous'
      });
    }
  });

  next();
};

// 日志轮转（每天轮转一次）
const rotateLogs = () => {
  const today = new Date().toISOString().split('T')[0];
  
  ['access.log', 'error.log', 'business.log'].forEach(filename => {
    const logPath = path.join(LOG_DIR, filename);
    const archivePath = path.join(LOG_DIR, `${filename}.${today}`);
    
    if (fs.existsSync(logPath)) {
      fs.renameSync(logPath, archivePath);
    }
  });
};

// 每天凌晨轮转日志
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    rotateLogs();
  }
}, 60000); // 每分钟检查一次

module.exports = {
  accessLogger,
  errorLogger,
  businessLogger,
  securityLogger,
  performanceLogger,
  logger,
  maskSensitiveData,
  writeLog
}; 