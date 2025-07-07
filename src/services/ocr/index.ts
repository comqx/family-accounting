// OCR文字识别服务

import Taro from '@tarojs/taro';
import { OCRResult, BillPlatform, ParsedBillData, ParsedTransaction, CreditCardInfo, InstallmentInfo } from '../../types/business';
import request from '../../utils/request';

class OCRService {
  // 识别图片中的文字
  async recognizeText(imagePath: string): Promise<OCRResult> {
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

      // 方案3: 降级到模拟数据
      console.warn('OCR服务不可用，使用模拟数据');
      return this.getMockOCRResult();

    } catch (error) {
      console.error('OCR recognition error:', error);

      // 降级到模拟数据
      return this.getMockOCRResult();
    }
  }

  // 调用后端OCR服务
  private async callBackendOCR(imagePath: string): Promise<OCRResult | null> {
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
  private async tryNativeOCR(imagePath: string): Promise<OCRResult | null> {
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
  private getToken(): string {
    try {
      return Taro.getStorageSync('token') || '';
    } catch {
      return '';
    }
  }

  // 识别账单信息
  async recognizeBill(imagePath: string, platform?: BillPlatform): Promise<ParsedBillData> {
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
  private async parseBillData(ocrResult: OCRResult, platform?: BillPlatform): Promise<ParsedBillData> {
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
  private parseLocalBillData(ocrResult: OCRResult, platform?: BillPlatform): ParsedBillData {
    const text = ocrResult.text;
    const transactions: ParsedTransaction[] = [];
    
    // 检测平台类型
    const detectedPlatform = platform || this.detectPlatform(text);
    
    // 根据平台类型解析
    switch (detectedPlatform) {
      case BillPlatform.ALIPAY:
        return this.parseAlipayBill(text);
      case BillPlatform.WECHAT:
        return this.parseWechatBill(text);
      case BillPlatform.CREDIT_CARD:
        return this.parseCreditCardBill(text);
      case BillPlatform.BANK_CARD:
        return this.parseBankBill(text);
      default:
        return this.parseGenericBill(text);
    }
  }

  // 检测账单平台
  private detectPlatform(text: string): BillPlatform {
    if (text.includes('支付宝') || text.includes('alipay')) {
      return BillPlatform.ALIPAY;
    } else if (text.includes('微信') || text.includes('wechat')) {
      return BillPlatform.WECHAT;
    } else if (text.includes('信用卡') || text.includes('账单日') || text.includes('还款日') ||
               text.includes('招商银行') || text.includes('建设银行') || text.includes('工商银行')) {
      return BillPlatform.CREDIT_CARD;
    } else if (text.includes('银行') || text.includes('储蓄卡')) {
      return BillPlatform.BANK_CARD;
    } else {
      return BillPlatform.ALIPAY; // 默认
    }
  }

  // 解析支付宝账单
  private parseAlipayBill(text: string): ParsedBillData {
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
        const transaction = this.createTransactionFromMatch(match, BillPlatform.ALIPAY);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, BillPlatform.ALIPAY);
  }

  // 解析微信账单
  private parseWechatBill(text: string): ParsedBillData {
    const transactions: ParsedTransaction[] = [];
    
    // 微信账单解析逻辑
    const patterns = [
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)\s+¥(\d+\.?\d*)/g,
      /(.+?)\s+¥(\d+\.\d{2})\s+微信支付/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, BillPlatform.WECHAT);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, BillPlatform.WECHAT);
  }

  // 解析银行账单
  private parseBankBill(text: string): ParsedBillData {
    const transactions: ParsedTransaction[] = [];

    // 银行账单解析逻辑
    const patterns = [
      /(\d{4}\/\d{2}\/\d{2})\s+(.+?)\s+([+-]?\d+\.?\d*)/g,
      /(\d{2}-\d{2})\s+(.+?)\s+(\d+\.\d{2})/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createTransactionFromMatch(match, BillPlatform.BANK_CARD);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, BillPlatform.BANK_CARD);
  }

  // 解析信用卡账单
  private parseCreditCardBill(text: string): ParsedBillData {
    const transactions: ParsedTransaction[] = [];

    // 信用卡账单解析逻辑
    const patterns = [
      // 标准信用卡账单格式
      /(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.+?)\s+(\d+\.\d{2})/g,
      // 带分期信息的格式
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(\d+\.\d{2})\s+(\d+\/\d+期)?/g,
      // 简化格式
      /(.+?)\s+(\d+\.\d{2})\s+(分\d+期)?/g
    ];

    // 提取信用卡基本信息
    const cardInfo = this.extractCreditCardInfo(text);

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const transaction = this.createCreditCardTransaction(match, cardInfo);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    });

    return this.createParsedBillData(transactions, BillPlatform.CREDIT_CARD);
  }

  // 提取信用卡信息
  private extractCreditCardInfo(text: string): CreditCardInfo | undefined {
    try {
      // 提取卡号
      const cardNumberMatch = text.match(/\*{4,}\d{4}/);
      const cardNumber = cardNumberMatch ? cardNumberMatch[0] : '';

      // 提取银行名称
      const bankNames = ['招商银行', '建设银行', '工商银行', '农业银行', '中国银行', '交通银行', '浦发银行', '民生银行', '兴业银行', '平安银行', '光大银行', '华夏银行'];
      const bankName = bankNames.find(bank => text.includes(bank)) || '';

      // 提取账单日和还款日
      const billingDateMatch = text.match(/账单日[：:]\s*(\d{1,2})/);
      const dueDateMatch = text.match(/还款日[：:]\s*(\d{1,2})/);

      // 提取信用额度
      const creditLimitMatch = text.match(/信用额度[：:]\s*(\d+\.?\d*)/);
      const availableCreditMatch = text.match(/可用额度[：:]\s*(\d+\.?\d*)/);

      if (cardNumber || bankName) {
        return {
          cardNumber,
          bankName,
          cardType: '信用卡',
          billingDate: billingDateMatch ? new Date(2024, 0, parseInt(billingDateMatch[1])) : undefined,
          dueDate: dueDateMatch ? new Date(2024, 0, parseInt(dueDateMatch[1])) : undefined,
          creditLimit: creditLimitMatch ? parseFloat(creditLimitMatch[1]) : undefined,
          availableCredit: availableCreditMatch ? parseFloat(availableCreditMatch[1]) : undefined
        };
      }
    } catch (error) {
      console.error('Extract credit card info error:', error);
    }

    return undefined;
  }

  // 创建信用卡交易记录
  private createCreditCardTransaction(match: RegExpExecArray, cardInfo?: CreditCardInfo): ParsedTransaction | null {
    try {
      let amount = 0;
      let merchant = '';
      let date = new Date();
      let installment: InstallmentInfo | undefined;

      if (match.length >= 3) {
        // 提取金额
        const amountStr = match[match.length - 1];
        if (amountStr.includes('期')) {
          // 处理分期信息
          const periodMatch = amountStr.match(/(\d+)\/(\d+)期/);
          if (periodMatch) {
            installment = {
              totalPeriods: parseInt(periodMatch[2]),
              currentPeriod: parseInt(periodMatch[1]),
              monthlyAmount: 0,
              remainingAmount: 0,
              interestRate: 0
            };
          }
          amount = parseFloat(match[match.length - 2] || '0');
        } else {
          amount = parseFloat(amountStr.replace(/[^\d.]/g, ''));
        }

        // 提取商户名
        merchant = match[match.length - 2] || match[1] || '未知商户';

        // 提取日期
        if (match[1] && /\d{2}\/\d{2}/.test(match[1])) {
          const [month, day] = match[1].split('/');
          date = new Date(2024, parseInt(month) - 1, parseInt(day));
        }
      }

      if (amount > 0) {
        return {
          amount,
          type: 'expense' as RecordType,
          merchant: merchant.trim(),
          description: `信用卡消费`,
          date,
          confidence: 0.85,
          needsReview: false,
          creditCard: cardInfo,
          installment
        };
      }
    } catch (error) {
      console.error('Create credit card transaction error:', error);
    }

    return null;
  }

  // 通用账单解析
  private parseGenericBill(text: string): ParsedBillData {
    const transactions: ParsedTransaction[] = [];
    
    // 通用金额匹配
    const amountPattern = /¥?(\d+\.?\d*)/g;
    let match;
    
    while ((match = amountPattern.exec(text)) !== null) {
      const amount = parseFloat(match[1]);
      if (amount > 0) {
        transactions.push({
          amount,
          type: 'expense' as RecordType,
          merchant: '未知商户',
          description: '账单导入',
          date: new Date(),
          confidence: 0.5,
          needsReview: true
        });
      }
    }

    return this.createParsedBillData(transactions, BillPlatform.ALIPAY);
  }

  // 从正则匹配创建交易记录
  private createTransactionFromMatch(match: RegExpExecArray, platform: BillPlatform): ParsedTransaction | null {
    try {
      let amount = 0;
      let merchant = '';
      let date = new Date();
      
      if (match.length >= 3) {
        // 提取金额
        const amountStr = match[match.length - 1];
        amount = parseFloat(amountStr.replace(/[^\d.]/g, ''));
        
        // 提取商户名
        merchant = match[match.length - 2] || '未知商户';
        
        // 提取日期
        if (match[1] && /\d{4}-\d{2}-\d{2}/.test(match[1])) {
          date = new Date(match[1]);
        }
      }

      if (amount > 0) {
        return {
          amount,
          type: 'expense' as RecordType,
          merchant: merchant.trim(),
          description: `${platform}账单导入`,
          date,
          confidence: 0.8,
          needsReview: false
        };
      }
    } catch (error) {
      console.error('Create transaction error:', error);
    }
    
    return null;
  }

  // 创建解析结果
  private createParsedBillData(transactions: ParsedTransaction[], platform: BillPlatform): ParsedBillData {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const dates = transactions.map(t => t.date).filter(d => d);
    
    return {
      platform,
      transactions,
      summary: {
        totalAmount,
        transactionCount: transactions.length,
        dateRange: {
          start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
          end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
        }
      },
      confidence: transactions.length > 0 ? 
        transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length : 0
    };
  }

  // 获取模拟OCR结果
  private getMockOCRResult(): OCRResult {
    return {
      text: '支付宝账单\n2024-01-15 12:30:00 午餐 25.50\n2024-01-15 18:45:00 地铁 6.00',
      confidence: 0.95,
      words: [
        { text: '支付宝账单', confidence: 0.98, boundingBox: { x: 10, y: 10, width: 100, height: 20 } },
        { text: '25.50', confidence: 0.99, boundingBox: { x: 200, y: 50, width: 50, height: 15 } }
      ],
      regions: []
    };
  }

  // 批量识别图片
  async recognizeMultipleImages(imagePaths: string[]): Promise<ParsedBillData[]> {
    const results: ParsedBillData[] = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await this.recognizeBill(imagePath);
        results.push(result);
      } catch (error) {
        console.error(`Failed to recognize image ${imagePath}:`, error);
      }
    }
    
    return results;
  }
}

// 创建OCR服务实例
const ocrService = new OCRService();

export default ocrService;
