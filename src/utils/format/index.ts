// 格式化工具函数

// 金额格式化
export const formatAmount = (amount, options) => {
  const {
    currency = 'CNY',
    showSymbol = true,
    precision = 2,
    showSign = false
  } = options || {};

  // 处理无效值
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showSymbol ? '¥0.00' : '0.00';
  }

  // 格式化数字
  const formattedNumber = Math.abs(amount).toFixed(precision);
  
  // 添加千分位分隔符
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const result = parts.join('.');

  // 添加符号
  let finalResult = result;
  
  if (showSign && amount !== 0) {
    finalResult = amount > 0 ? `+${result}` : `-${result}`;
  } else if (amount < 0) {
    finalResult = `-${result}`;
  }

  // 添加货币符号
  if (showSymbol) {
    const symbols = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥'
    };
    const symbol = symbols[currency] || '¥';
    finalResult = `${symbol}${finalResult}`;
  }

  return finalResult;
};

// 简化金额显示（大数值转换）
export const formatAmountSimple = (amount) => {
  if (Math.abs(amount) >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}亿`;
  } else if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  } else {
    return formatAmount(amount, { showSymbol: false });
  }
};

// 日期格式化
export const formatDate = (date, format) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  const formatMap = {
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'YYYY/MM/DD': `${year}/${month}/${day}`,
    'MM-DD': `${month}-${day}`,
    'MM/DD': `${month}/${day}`,
    'YYYY-MM-DD HH:mm': `${year}-${month}-${day} ${hour}:${minute}`,
    'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hour}:${minute}:${second}`,
    'HH:mm': `${hour}:${minute}`,
    'HH:mm:ss': `${hour}:${minute}:${second}`
  };

  return formatMap[format || 'YYYY-MM-DD'] || formatMap['YYYY-MM-DD'];
};

// 相对时间格式化
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatDate(d, 'MM-DD');
  }
};

// 手机号格式化
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
};

// 手机号脱敏
export const maskPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  return phone;
};

// 文件大小格式化
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 百分比格式化
export const formatPercentage = (value, precision = 1) => {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(precision)}%`;
};

// 数字格式化（添加千分位分隔符）
export const formatNumber = (num, precision) => {
  if (isNaN(num)) return '0';
  
  const fixed = precision !== undefined ? num.toFixed(precision) : num.toString();
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

// 银行卡号格式化
export const formatBankCard = (cardNumber) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// 银行卡号脱敏
export const maskBankCard = (cardNumber) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length >= 8) {
    const start = cleaned.slice(0, 4);
    const end = cleaned.slice(-4);
    const middle = '*'.repeat(cleaned.length - 8);
    return `${start} ${middle} ${end}`;
  }
  
  return cardNumber;
};

// 身份证号脱敏
export const maskIdCard = (idCard) => {
  if (!idCard) return '';
  
  const cleaned = idCard.replace(/\D/g, '');
  
  if (cleaned.length === 18) {
    return cleaned.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  } else if (cleaned.length === 15) {
    return cleaned.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2');
  }
  
  return idCard;
};

// 邮箱脱敏
export const maskEmail = (email) => {
  if (!email) return '';
  
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const username = parts[0];
  const domain = parts[1];
  
  if (username.length <= 2) {
    return email;
  }
  
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
};

// 姓名脱敏
export const maskName = (name) => {
  if (!name) return '';
  
  if (name.length <= 1) {
    return name;
  }
  
  return name.slice(0, 1) + '*'.repeat(name.length - 1);
};

// 地址脱敏
export const maskAddress = (address) => {
  if (!address) return '';
  
  if (address.length <= 6) {
    return address;
  }
  
  const start = address.slice(0, 3);
  const end = address.slice(-3);
  const middle = '*'.repeat(address.length - 6);
  return `${start}${middle}${end}`;
};

// 时长格式化
export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}小时${minutes}分${remainingSeconds}秒`;
  }
};

// 距离格式化
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}米`;
  } else {
    const kilometers = (meters / 1000).toFixed(1);
    return `${kilometers}公里`;
  }
};

// 温度格式化
export const formatTemperature = (celsius, unit = 'C') => {
  if (unit === 'F') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  } else {
    return `${celsius.toFixed(1)}°C`;
  }
};
