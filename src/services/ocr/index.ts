// OCR文字识别服务

import Taro from '@tarojs/taro';
import request from '../../utils/request';

class OCRService {
  // 识别图片中的文字
  async recognizeText(imagePath) {
    try {
      // 方案1: 使用后端OCR服务
      const result = await this.callBackendOCR(imagePath);
      if (result) {
        return result;
      }

      // 方案2: 使用微信原生OCR能力（如果可用）
      const nativeResult = await this.tryNativeOCR(imagePath);
      if (nativeResult) {
        return nativeResult;
      }

      // 方案3: 降级到空数据
      console.warn('OCR服务不可用，返回空数据');
      return {
        text: '',
        words: [],
        regions: [],
        confidence: 0
      };

    } catch (error) {
      console.error('OCR recognition error:', error);

      // 降级到空数据
      return {
        text: '',
        words: [],
        regions: [],
        confidence: 0
      };
    }
  }

  // 调用后端OCR服务
  async callBackendOCR(imagePath) {
    try {
      // 上传图片到后端进行OCR识别
      const uploadResult = await Taro.uploadFile({
        url: 'https://api.family-accounting.com/ocr/recognize',
        filePath: imagePath,
        name: 'image',
        header: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (uploadResult.statusCode === 200) {
        const response = JSON.parse(uploadResult.data);
        return response.data;
      }
    } catch (error) {
      console.error('Backend OCR error:', error);
    }
    return null;
  }

  // 尝试使用微信原生OCR能力
  async tryNativeOCR(_imagePath) {
    try {
      // 检查是否支持微信原生OCR
      if (Taro.getSystemInfoSync().platform === 'devtools') {
        // 开发工具环境，返回null
        return null;
      }

      // 这里可以尝试其他OCR方案
      // 比如百度OCR、腾讯OCR等第三方服务

      return null;
    } catch (error) {
      console.error('Native OCR error:', error);
      return null;
    }
  }

  // 获取用户token
  getToken() {
    try {
      return Taro.getStorageSync('token') || '';
    } catch {
      return '';
    }
  }

  // 识别账单信息
  async recognizeBill(imagePath, platform) {
    try {
      // 先进行OCR识别
      const ocrResult = await this.recognizeText(imagePath);
      
      // 解析账单数据
      const parsedData = await this.parseBillData(ocrResult, platform);
      
      return parsedData;
    } catch (error) {
      console.error('Bill recognition error:', error);
      throw error;
    }
  }

  // 解析账单数据
  async parseBillData(ocrResult, platform) {
    try {
      // 发送到后端进行智能解析
      const response = await request.post('/api/ocr/parse-bill', {
        ocrText: ocrResult.text,
        platform,
        words: ocrResult.words,
        regions: ocrResult.regions
      });

      if (response.data) {
        return response.data;
      }

      // 如果后端不可用，使用本地解析
      return this.parseLocalBillData(ocrResult, platform);
    } catch (error) {
      console.error('Parse bill data error:', error);
      
      // 降级到本地解析
      return this.parseLocalBillData(ocrResult, platform);
    }
  }

  // 本地解析账单数据
  parseLocalBillData(ocrResult, platform) {
    const text = ocrResult.text;
    const _transactions = [];
    
    // 检测平台类型
    const detectedPlatform = platform || this.detectPlatform(text);
    
    // 根据平台类型解析
    switch (detectedPlatform) {
      case 'alipay':
        return this.parseAlipayBill(text);
      case 'wechat':
        return this.parseWechatBill(text);
      case 'credit_card':
        return this.parseCreditCardBill(text);
      case 'bank_card':
        return this.parseBankBill(text);
      default:
        return this.parseGenericBill(text);
    }
  }

  // 检测账单平台
  detectPlatform(text) {
    if (text.includes('支付宝') || text.includes('alipay')) {
      return 'alipay';
    } else if (text.includes('微信') || text.includes('wechat')) {
      return 'wechat';
    } else if (text.includes('信用卡') || text.includes('账单日') || text.includes('还款日') ||
               text.includes('招商银行') || text.includes('建设银行') || text.includes('工商银行')) {
      return 'credit_card';
    } else if (text.includes('银行') || text.includes('储蓄卡')) {
      return 'bank_card';
    } else {
      return 'alipay'; // 默认
    }
  }

  // 解析支付宝账单
  parseAlipayBill(text) {
    const transactions = [];
    
    // 正则表达式匹配交易记录
    const patterns = [
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)\s+([+-]?\d+\.?\d*)/g,
      /(.+?)\s+(\d+\.\d{2})\s+支付成功/g,
      /收钱码收款\s+(\d+\.\d{2})/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, 'alipay');
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, 'alipay');
  }

  // 解析微信账单
  parseWechatBill(text) {
    const transactions = [];
    
    // 微信账单解析逻辑
    const patterns = [
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)\s+¥(\d+\.?\d*)/g,
      /(.+?)\s+¥(\d+\.\d{2})\s+微信支付/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, 'wechat');
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, 'wechat');
  }

  // 解析银行账单
  parseBankBill(text) {
    const transactions = [];
    
    // 银行账单解析逻辑
    const patterns = [
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([+-]?\d+\.?\d*)/g,
      /(.+?)\s+(\d+\.\d{2})\s+转账/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, 'bank_card');
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, 'bank_card');
  }

  // 解析信用卡账单
  parseCreditCardBill(text) {
    const transactions = [];
    
    // 信用卡账单解析逻辑
    const patterns = [
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([+-]?\d+\.?\d*)/g,
      /(.+?)\s+(\d+\.\d{2})\s+消费/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, 'credit_card');
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    // 提取信用卡信息
    const cardInfo = this.extractCreditCardInfo(text);
    
    return {
      ...this.createParsedBillData(transactions, 'credit_card'),
      cardInfo
    };
  }

  // 提取信用卡信息
  extractCreditCardInfo(text) {
    // 提取信用卡号
    const cardNumberMatch = text.match(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/);
    const cardNumber = cardNumberMatch ? cardNumberMatch[0].replace(/[-\s]/g, '') : '';
    
    // 提取账单日
    const billDateMatch = text.match(/账单日[：:]\s*(\d{1,2})/);
    const billDate = billDateMatch ? parseInt(billDateMatch[1]) : 0;
    
    // 提取还款日
    const dueDateMatch = text.match(/还款日[：:]\s*(\d{1,2})/);
    const dueDate = dueDateMatch ? parseInt(dueDateMatch[1]) : 0;
    
    // 提取信用额度
    const creditLimitMatch = text.match(/信用额度[：:]\s*(\d+\.?\d*)/);
    const creditLimit = creditLimitMatch ? parseFloat(creditLimitMatch[1]) : 0;
    
    // 提取本期账单金额
    const billAmountMatch = text.match(/本期账单金额[：:]\s*(\d+\.?\d*)/);
    const billAmount = billAmountMatch ? parseFloat(billAmountMatch[1]) : 0;
    
    // 提取最低还款额
    const minPaymentMatch = text.match(/最低还款额[：:]\s*(\d+\.?\d*)/);
    const minPayment = minPaymentMatch ? parseFloat(minPaymentMatch[1]) : 0;
    
    // 提取分期信息
    const installmentMatch = text.match(/分期期数[：:]\s*(\d+)\/(\d+)/);
    const installmentInfo = installmentMatch ? {
      totalPeriods: parseInt(installmentMatch[2]),
      currentPeriod: parseInt(installmentMatch[1])
    } : null;
    
    if (cardNumber || billDate || dueDate || creditLimit || billAmount) {
      return {
        cardNumber,
        billDate,
        dueDate,
        creditLimit,
        billAmount,
        minPayment,
        installmentInfo
      };
    }
    
    return undefined;
  }

  // 创建信用卡交易记录
  createCreditCardTransaction(match, cardInfo) {
    try {
      const date = match[1];
      const description = match[2];
      const amount = parseFloat(match[3]);
      
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: new Date(date),
        description,
        amount: Math.abs(amount),
        type: amount > 0 ? 'income' : 'expense',
        category: '信用卡',
        platform: 'credit_card',
        cardInfo
      };
    } catch (error) {
      console.error('Create credit card transaction error:', error);
      return null;
    }
  }

  // 解析通用账单
  parseGenericBill(text) {
    const transactions = [];
    
    // 通用账单解析逻辑
    const patterns = [
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([+-]?\d+\.?\d*)/g,
      /(.+?)\s+(\d+\.\d{2})/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, 'generic');
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, 'generic');
  }

  // 从正则匹配创建交易记录
  createTransactionFromMatch(match, platform) {
    try {
      let date, description, amount;
      
      if (match.length >= 4) {
        // 格式: 日期 描述 金额
        date = match[1];
        description = match[2];
        amount = parseFloat(match[3]);
      } else if (match.length >= 3) {
        // 格式: 描述 金额
        description = match[1];
        amount = parseFloat(match[2]);
        date = new Date().toISOString().split('T')[0];
      } else {
        return null;
      }
      
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: new Date(date),
        description,
        amount: Math.abs(amount),
        type: amount > 0 ? 'income' : 'expense',
        category: '其他',
        platform
      };
    } catch (error) {
      console.error('Create transaction from match error:', error);
      return null;
    }
  }

  // 创建解析后的账单数据
  createParsedBillData(transactions, platform) {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      platform,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        transactionCount: transactions.length
      },
      parseTime: new Date(),
      confidence: 0.8
    };
  }

  // 识别图片（通过 cloud 接口）
  async recognizeImage(filePath, platform) {
    try {
      const formData = { platform };
      const response = await Taro.uploadFile({
        url: '/api/ocr/recognize',
        filePath,
        name: 'file',
        formData
      });
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return JSON.parse(response.data);
      }
      throw new Error('OCR识别失败');
    } catch (error) {
      console.error('OCR识别失败:', error);
      throw error;
    }
  }

  // 识别多张图片
  async recognizeMultipleImages(imagePaths) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await this.recognizeBill(imagePath);
        results.push(result);
      } catch (error) {
        console.error(`OCR recognition failed for ${imagePath}:`, error);
        results.push(null);
      }
    }
    
    return results.filter(result => result !== null);
  }
}

// 创建OCR服务实例
const ocrService = new OCRService();

export default ocrService;
