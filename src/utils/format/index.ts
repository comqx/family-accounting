// 格式化工具函数

// 金额格式化
export const formatAmount = (amount: number, options?: any) => {
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
    const symbols: Record<string, string> = {
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
export const formatAmountSimple = (amount: number) => {
  if (Math.abs(amount) >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}亿`;
  } else if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  } else {
    return formatAmount(amount, { showSymbol: false });
  }
};

// 日期格式化
export const formatDate = (date: Date | string | number, format?: string) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  const formatMap: Record<string, string> = {
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'YYYY/MM/DD': `${year}/${month}/${day}`,
    'MM-DD': `${month}-${day}`,
    'MM/DD': `${month}/${day}`,
    'YYYY-MM-DD HH:mm': `${year}-${month}-${day} ${hour}:${minute}`,
    'YYYY/MM/DD HH:mm': `${year}/${month}/${day} ${hour}:${minute}`
  };

  return formatMap[format || 'YYYY-MM-DD'] || formatMap['YYYY-MM-DD'];
};

// 相对时间格式化
export const formatRelativeTime = (date: Date | string | number) => {
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
export const formatPhone = (phone: string) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
};

// 手机号脱敏
export const maskPhone = (phone: string) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  return phone;
};

// 文件大小格式化
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 百分比格式化
export const formatPercentage = (value: number, precision = 1) => {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(precision)}%`;
};

// 数字格式化（添加千分位分隔符）
export const formatNumber = (num: number, precision?: number) => {
  if (isNaN(num)) return '0';
  
  const fixed = precision !== undefined ? num.toFixed(precision) : num.toString();
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

// 银行卡号格式化
export const formatBankCard = (cardNumber: string) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// 银行卡号脱敏
export const maskBankCard = (cardNumber: string) => {
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
export const maskIdCard = (idCard: string) => {
  if (!idCard) return '';
  
  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  } else if (idCard.length === 15) {
    return idCard.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2');
  }
  
  return idCard;
};

// 邮箱脱敏
export const maskEmail = (email: string) => {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  } else {
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  }
};

// 姓名脱敏
export const maskName = (name: string) => {
  if (!name) return '';
  
  if (name.length === 1) {
    return name;
  } else if (name.length === 2) {
    return name[0] + '*';
  } else {
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }
};

// 地址脱敏
export const maskAddress = (address: string) => {
  if (!address) return '';
  
  if (address.length <= 6) {
    return address;
  } else {
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}****${end}`;
  }
};

// 时长格式化（秒转换为时分秒）
export const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

// 距离格式化
export const formatDistance = (meters: number) => {
  if (isNaN(meters) || meters < 0) return '0m';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

// 温度格式化
export const formatTemperature = (celsius: number, unit = 'C') => {
  if (isNaN(celsius)) return '0°C';
  
  if (unit === 'F') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  } else {
    return `${Math.round(celsius)}°C`;
  }
};
