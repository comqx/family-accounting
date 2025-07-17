// OCR文字识别服务
//
// 提供图片文字识别、账单解析、平台自动识别等核心能力，支持后端OCR、微信原生OCR、本地降级解析等多种方案。
// 典型场景：账单拍照/导入、OCR识别、自动分类、异常兜底。

import Taro from '@tarojs/taro';
import request from '../../utils/request';
import type { ParsedTransaction } from '@/types/business';

/**
 * OCR 文字识别与账单解析服务
 * @description 支持后端OCR、微信原生OCR、本地降级解析，自动识别账单平台与结构，适配支付宝、微信、银行卡、信用卡等多种格式。
 */
class OCRService {
  /**
   * 识别图片中的文字（多重兜底）
   * @param imagePath 图片本地路径
   * @returns Promise<OCRResult> 识别结果对象
   */
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

  /**
   * 调用后端OCR服务，上传图片并返回识别结果
   * @param imagePath 图片本地路径
   * @returns Promise<OCRResult|null>
   */
  async callBackendOCR(imagePath) {
    try {
      const uploadResult = await request.uploadFile({
        url: '/ocr/recognize',
        filePath: imagePath,
        name: 'image'
      });
      if (uploadResult && uploadResult.data) {
        return uploadResult.data;
      }
    } catch (error) {
      console.error('Backend OCR error:', error);
    }
    return null;
  }

  /**
   * 尝试使用微信原生OCR能力（如可用）
   * @param imagePath 图片本地路径
   * @returns Promise<OCRResult|null>
   */
  async tryNativeOCR(_imagePath) {
    try {
      if (Taro.getSystemInfoSync().platform === 'devtools') {
        return null;
      }
      // 可扩展第三方OCR方案
      return null;
    } catch (error) {
      console.error('Native OCR error:', error);
      return null;
    }
  }

  /**
   * 获取当前用户 token
   * @returns string
   */
  getToken() {
    try {
      return Taro.getStorageSync('token') || '';
    } catch {
      return '';
    }
  }

  /**
   * 识别账单图片并解析为结构化数据
   * @param imagePath 图片本地路径
   * @param platform 账单平台类型（可选）
   * @returns Promise<ParsedBillData>
   */
  async recognizeBill(imagePath, platform) {
    try {
      const ocrResult = await this.recognizeText(imagePath);
      const parsedData = await this.parseBillData(ocrResult, platform);
      return parsedData;
    } catch (error) {
      console.error('Bill recognition error:', error);
      throw error;
    }
  }

  /**
   * 解析OCR结果为账单结构化数据（优先后端，兜底本地）
   * @param ocrResult OCR识别结果
   * @param platform 账单平台类型
   * @returns Promise<ParsedBillData>
   */
  async parseBillData(ocrResult, platform) {
    try {
      const response = await request.post('/api/ocr/parse-bill', {
        ocrText: ocrResult.text,
        platform,
        words: ocrResult.words,
        regions: ocrResult.regions
      });
      if (response.data) {
        return response.data;
      }
      // 后端不可用，降级本地解析
      return this.parseLocalBillData(ocrResult, platform);
    } catch (error) {
      console.error('Parse bill data error:', error);
      return this.parseLocalBillData(ocrResult, platform);
    }
  }

  /**
   * 本地解析OCR结果为账单结构化数据（多平台适配）
   * @param ocrResult OCR识别结果
   * @param platform 账单平台类型
   * @returns ParsedBillData
   */
  parseLocalBillData(ocrResult, platform) {
    const text = ocrResult.text;
    const _transactions: ParsedTransaction[] = [];
    const detectedPlatform = platform || this.detectPlatform(text);
    const confidence = ocrResult.confidence ?? 0.8;
    switch (detectedPlatform) {
      case 'alipay':
        return this.createParsedBillData(this.parseAlipayBill(text).transactions, 'alipay', confidence);
      case 'wechat':
        return this.createParsedBillData(this.parseWechatBill(text).transactions, 'wechat', confidence);
      case 'credit_card':
        return this.createParsedBillData(this.parseCreditCardBill(text).transactions, 'credit_card', confidence);
      case 'bank_card':
        return this.createParsedBillData(this.parseBankBill(text).transactions, 'bank_card', confidence);
      default:
        return this.createParsedBillData(this.parseGenericBill(text).transactions, 'generic', confidence);
    }
  }

  /**
   * 自动检测账单平台类型
   * @param text 账单文本
   * @returns string 平台类型
   */
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

  /**
   * 解析支付宝账单文本为结构化数据
   * @param text 账单文本
   * @returns ParsedBillData
   */
  parseAlipayBill(text): any {
    const transactions: ParsedTransaction[] = [];
    
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

    return this.createParsedBillData(transactions, 'alipay', 0.8);
  }

  // 解析微信账单
  parseWechatBill(text): any {
    const transactions: ParsedTransaction[] = [];
    
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

    return this.createParsedBillData(transactions, 'wechat', 0.8);
  }

  // 解析银行账单
  parseBankBill(text): any {
    const transactions: ParsedTransaction[] = [];
    
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

    return this.createParsedBillData(transactions, 'bank_card', 0.8);
  }

  // 解析信用卡账单
  parseCreditCardBill(text): any {
    const transactions: ParsedTransaction[] = [];
    
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
    
    const billData = this.createParsedBillData(transactions, 'credit_card', 0.8);
    return { ...billData, cardInfo };
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
  createCreditCardTransaction(match: RegExpMatchArray, cardInfo: any): ParsedTransaction | null {
    try {
      const date = match[1];
      const description = match[2];
      const amount = parseFloat(match[3]);
      const merchant = match[2];
      const confidence = 0.8;
      const needsReview = false;
      
      return {
        date: new Date(date),
        description,
        amount: Math.abs(amount),
        type: amount > 0 ? 'income' : 'expense',
        category: '信用卡',
        merchant,
        confidence,
        needsReview
      };
    } catch (error) {
      console.error('Create credit card transaction error:', error);
      return null;
    }
  }

  // 解析通用账单
  parseGenericBill(text): any {
    const transactions: ParsedTransaction[] = [];
    
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

    return this.createParsedBillData(transactions, 'generic', 0.8);
  }

  // 从正则匹配创建交易记录
  createTransactionFromMatch(match: RegExpMatchArray, platform: string): ParsedTransaction | null {
    try {
      let date, description, amount;
      let merchant = '';
      let confidence = 0.8;
      let needsReview = false;
      
      if (match.length >= 4) {
        // 格式: 日期 描述 金额
        date = match[1];
        description = match[2];
        amount = parseFloat(match[3]);
        merchant = match[2];
      } else if (match.length >= 3) {
        // 格式: 描述 金额
        description = match[1];
        amount = parseFloat(match[2]);
        date = new Date().toISOString().split('T')[0];
        merchant = match[1];
      } else {
        return null;
      }
      
      return {
        date: new Date(date),
        description,
        amount: Math.abs(amount),
        type: amount > 0 ? 'income' : 'expense',
        category: '其他',
        merchant,
        confidence,
        needsReview
      };
    } catch (error) {
      console.error('Create transaction from match error:', error);
      return null;
    }
  }

  // 创建解析后的账单数据
  createParsedBillData(transactions: ParsedTransaction[], platform: string, confidence: number = 0.8): any {
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
      confidence
    };
  }

  // 识别图片（通过 cloud 接口）
  async recognizeImage(filePath, platform) {
    try {
      const formData = { platform };
      const response = await request.uploadFile({
        url: '/ocr/recognize',
        filePath,
        name: 'file',
        formData
      });
      if (response && response.data) {
        return response.data;
      }
      throw new Error('OCR识别失败');
    } catch (error) {
      console.error('OCR识别失败:', error);
      throw error;
    }
  }

  // 识别多张图片
  async recognizeMultipleImages(imagePaths: string[], platform: string = 'alipay'): Promise<any[]> {
    const results: any[] = [];
    for (const imagePath of imagePaths) {
      try {
        const result = await this.recognizeBill(imagePath, platform);
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
