import Taro from '@tarojs/taro'
import CryptoJS from 'crypto-js'

export interface EncryptionOptions {
  algorithm?: 'AES' | 'DES' | 'TripleDES'
  keySize?: 128 | 192 | 256
  mode?: 'CBC' | 'ECB' | 'CFB' | 'OFB'
  padding?: 'Pkcs7' | 'Iso97971' | 'AnsiX923' | 'Iso10126' | 'ZeroPadding'
}

export interface EncryptedData {
  data: string
  iv?: string
  salt?: string
  algorithm: string
  timestamp: number
}

/**
 * 加密管理器
 */
class EncryptionManager {
  private masterKey: string = ''
  private isInitialized: boolean = false

  /**
   * 初始化加密管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 尝试从存储中获取主密钥
      const res = await Taro.getStorage({ key: 'master_key' })
      if (res.data) {
        this.masterKey = res.data
      } else {
        // 生成新的主密钥
        this.masterKey = this.generateMasterKey()
        await Taro.setStorage({
          key: 'master_key',
          data: this.masterKey
        })
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Initialize encryption manager error:', error)
      throw new Error('初始化加密管理器失败')
    }
  }

  /**
   * 生成主密钥
   */
  private generateMasterKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 加密数据
   * @param data 要加密的数据
   * @param options 加密选项
   */
  async encrypt(data: any, options: EncryptionOptions = {}): Promise<EncryptedData> {
    await this.ensureInitialized()

    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data)
      const algorithm = options.algorithm || 'AES'
      const keySize = options.keySize || 256
      const mode = options.mode || 'CBC'
      const padding = options.padding || 'Pkcs7'

      // 生成随机IV
      const iv = CryptoJS.lib.WordArray.random(16)
      
      // 生成随机盐值
      const salt = CryptoJS.lib.WordArray.random(16)

      // 从主密钥和盐值派生加密密钥
      const key = CryptoJS.PBKDF2(this.masterKey, salt, {
        keySize: keySize / 32,
        iterations: 1000
      })

      // 执行加密
      const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })

      return {
        data: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
        algorithm: `${algorithm}-${keySize}-${mode}-${padding}`,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Encrypt error:', error)
      throw new Error('加密失败')
    }
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据
   */
  async decrypt(encryptedData: EncryptedData): Promise<any> {
    await this.ensureInitialized()

    try {
      const { data, iv, salt, algorithm } = encryptedData

      if (!data || !iv || !salt) {
        throw new Error('加密数据格式错误')
      }

      // 从主密钥和盐值派生解密密钥
      const key = CryptoJS.PBKDF2(this.masterKey, CryptoJS.enc.Hex.parse(salt), {
        keySize: 256 / 32,
        iterations: 1000
      })

      // 执行解密
      const decrypted = CryptoJS.AES.decrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)
      
      // 尝试解析JSON
      try {
        return JSON.parse(decryptedText)
      } catch {
        return decryptedText
      }
    } catch (error) {
      console.error('Decrypt error:', error)
      throw new Error('解密失败')
    }
  }

  /**
   * 加密敏感字段
   * @param obj 要加密的对象
   * @param fields 需要加密的字段名数组
   * @param options 加密选项
   */
  async encryptFields(obj: any, fields: string[], options: EncryptionOptions = {}): Promise<any> {
    const result = { ...obj }
    
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        const encrypted = await this.encrypt(result[field], options)
        result[field] = encrypted
      }
    }
    
    return result
  }

  /**
   * 解密敏感字段
   * @param obj 要解密的对象
   * @param fields 需要解密的字段名数组
   */
  async decryptFields(obj: any, fields: string[]): Promise<any> {
    const result = { ...obj }
    
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'object' && result[field].data) {
        try {
          result[field] = await this.decrypt(result[field])
        } catch (error) {
          console.error(`Decrypt field ${field} error:`, error)
          // 解密失败时保留原始值
        }
      }
    }
    
    return result
  }

  /**
   * 加密记录数据
   * @param record 记录对象
   */
  async encryptRecord(record: any): Promise<any> {
    const sensitiveFields = ['description', 'amount', 'categoryName']
    return await this.encryptFields(record, sensitiveFields)
  }

  /**
   * 解密记录数据
   * @param record 记录对象
   */
  async decryptRecord(record: any): Promise<any> {
    const sensitiveFields = ['description', 'amount', 'categoryName']
    return await this.decryptFields(record, sensitiveFields)
  }

  /**
   * 加密用户数据
   * @param user 用户对象
   */
  async encryptUser(user: any): Promise<any> {
    const sensitiveFields = ['nickname', 'phone', 'email']
    return await this.encryptFields(user, sensitiveFields)
  }

  /**
   * 解密用户数据
   * @param user 用户对象
   */
  async decryptUser(user: any): Promise<any> {
    const sensitiveFields = ['nickname', 'phone', 'email']
    return await this.decryptFields(user, sensitiveFields)
  }

  /**
   * 加密家庭数据
   * @param family 家庭对象
   */
  async encryptFamily(family: any): Promise<any> {
    const sensitiveFields = ['name', 'description']
    return await this.encryptFields(family, sensitiveFields)
  }

  /**
   * 解密家庭数据
   * @param family 家庭对象
   */
  async decryptFamily(family: any): Promise<any> {
    const sensitiveFields = ['name', 'description']
    return await this.decryptFields(family, sensitiveFields)
  }

  /**
   * 生成数据哈希
   * @param data 要哈希的数据
   * @param algorithm 哈希算法
   */
  generateHash(data: any, algorithm: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512' = 'SHA256'): string {
    const text = typeof data === 'string' ? data : JSON.stringify(data)
    
    switch (algorithm) {
      case 'MD5':
        return CryptoJS.MD5(text).toString()
      case 'SHA1':
        return CryptoJS.SHA1(text).toString()
      case 'SHA256':
        return CryptoJS.SHA256(text).toString()
      case 'SHA512':
        return CryptoJS.SHA512(text).toString()
      default:
        return CryptoJS.SHA256(text).toString()
    }
  }

  /**
   * 验证数据完整性
   * @param data 原始数据
   * @param hash 哈希值
   * @param algorithm 哈希算法
   */
  verifyHash(data: any, hash: string, algorithm: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512' = 'SHA256'): boolean {
    const calculatedHash = this.generateHash(data, algorithm)
    return calculatedHash === hash
  }

  /**
   * 生成随机密钥
   * @param length 密钥长度
   */
  generateRandomKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * 重置主密钥
   */
  async resetMasterKey(): Promise<void> {
    this.masterKey = this.generateMasterKey()
    this.isInitialized = true
    
    await Taro.setStorage({
      key: 'master_key',
      data: this.masterKey
    })
  }

  /**
   * 获取加密状态
   */
  getEncryptionStatus(): { isInitialized: boolean; hasMasterKey: boolean } {
    return {
      isInitialized: this.isInitialized,
      hasMasterKey: !!this.masterKey
    }
  }
}

// 创建全局加密管理器实例
export const encryptionManager = new EncryptionManager()

// 导出便捷函数
export const encrypt = (data: any, options?: EncryptionOptions) => 
  encryptionManager.encrypt(data, options)

export const decrypt = (encryptedData: EncryptedData) => 
  encryptionManager.decrypt(encryptedData)

export const encryptRecord = (record: any) => 
  encryptionManager.encryptRecord(record)

export const decryptRecord = (record: any) => 
  encryptionManager.decryptRecord(record)

export const encryptUser = (user: any) => 
  encryptionManager.encryptUser(user)

export const decryptUser = (user: any) => 
  encryptionManager.decryptUser(user)

export const encryptFamily = (family: any) => 
  encryptionManager.encryptFamily(family)

export const decryptFamily = (family: any) => 
  encryptionManager.decryptFamily(family)

export const generateHash = (data: any, algorithm?: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512') => 
  encryptionManager.generateHash(data, algorithm)

export const verifyHash = (data: any, hash: string, algorithm?: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512') => 
  encryptionManager.verifyHash(data, hash, algorithm)

export const generateRandomKey = (length?: number) => 
  encryptionManager.generateRandomKey(length)

export const getEncryptionStatus = () => 
  encryptionManager.getEncryptionStatus()

export const resetMasterKey = () => 
  encryptionManager.resetMasterKey() 