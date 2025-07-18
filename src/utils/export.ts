import Taro from '@tarojs/taro'
import { formatAmount, formatDate } from './format'

interface ExcelSheet {
  name: string
  headers: string[]
  data: any[][]
}

export interface ExportOptions {
  format: 'excel' | 'pdf'
  dateRange?: {
    start: string
    end: string
  }
  includeCategories?: boolean
  includeMembers?: boolean
}

export interface ExportData {
  records: any[]
  categories: any[]
  members: any[]
  summary: {
    totalExpense: number
    totalIncome: number
    balance: number
    recordCount: number
  }
}

/**
 * 导出数据为 Excel 格式
 * @param data 要导出的数据
 * @param options 导出选项
 */
export const exportToExcel = async (data: ExportData, options: ExportOptions): Promise<string> => {
  try {
    // 构建 Excel 数据
    const excelData = buildExcelData(data, options)
    
    // 调用后端导出接口
    const response = await Taro.request({
      url: '/api/export/excel',
      method: 'POST',
      data: {
        data: excelData,
        options
      }
    })
    
    if (response.statusCode === 200 && response.data?.fileUrl) {
      // 下载文件
      await downloadFile(response.data.fileUrl, `家账通报表_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`)
      return response.data.fileUrl
    } else {
      throw new Error('导出失败')
    }
  } catch (error) {
    console.error('Export to Excel error:', error)
    throw new Error('导出 Excel 失败')
  }
}

/**
 * 导出数据为 PDF 格式
 * @param data 要导出的数据
 * @param options 导出选项
 */
export const exportToPDF = async (data: ExportData, options: ExportOptions): Promise<string> => {
  try {
    // 构建 PDF 数据
    const pdfData = buildPDFData(data, options)
    
    // 调用后端导出接口
    const response = await Taro.request({
      url: '/api/export/pdf',
      method: 'POST',
      data: {
        data: pdfData,
        options
      }
    })
    
    if (response.statusCode === 200 && response.data?.fileUrl) {
      // 下载文件
      await downloadFile(response.data.fileUrl, `家账通报表_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`)
      return response.data.fileUrl
    } else {
      throw new Error('导出失败')
    }
  } catch (error) {
    console.error('Export to PDF error:', error)
    throw new Error('导出 PDF 失败')
  }
}

/**
 * 构建 Excel 数据
 */
const buildExcelData = (data: ExportData, options: ExportOptions): ExcelSheet[] => {
  const sheets: ExcelSheet[] = []
  
  // 记录表
  const recordsSheet: ExcelSheet = {
    name: '记账记录',
    headers: ['日期', '类型', '分类', '金额', '备注', '创建人'],
    data: data.records.map(record => [
      formatDate(record.date, 'YYYY-MM-DD'),
      record.type === 'expense' ? '支出' : '收入',
      record.categoryName,
      formatAmount(record.amount, { showSymbol: false }),
      record.description || '',
      record.createdBy || ''
    ])
  }
  sheets.push(recordsSheet)
  
  // 分类统计表
  if (options.includeCategories) {
    const categoryStats = calculateCategoryStats(data.records)
    const categoriesSheet: ExcelSheet = {
      name: '分类统计',
      headers: ['分类', '支出金额', '收入金额', '记录数量'],
      data: categoryStats.map(stat => [
        stat.categoryName,
        formatAmount(stat.expenseAmount, { showSymbol: false }),
        formatAmount(stat.incomeAmount, { showSymbol: false }),
        stat.count.toString()
      ])
    }
    sheets.push(categoriesSheet)
  }
  
  // 成员统计表
  if (options.includeMembers && data.members.length > 0) {
    const memberStats = calculateMemberStats(data.records, data.members)
    const membersSheet: ExcelSheet = {
      name: '成员统计',
      headers: ['成员', '支出金额', '收入金额', '记录数量'],
      data: memberStats.map(stat => [
        stat.memberName,
        formatAmount(stat.expenseAmount, { showSymbol: false }),
        formatAmount(stat.incomeAmount, { showSymbol: false }),
        stat.count.toString()
      ])
    }
    sheets.push(membersSheet)
  }
  
  // 汇总表
  const summarySheet: ExcelSheet = {
    name: '汇总',
    headers: ['项目', '数值'],
    data: [
      ['总支出', formatAmount(data.summary.totalExpense, { showSymbol: false })],
      ['总收入', formatAmount(data.summary.totalIncome, { showSymbol: false })],
      ['结余', formatAmount(data.summary.balance, { showSymbol: false })],
      ['记录数量', data.summary.recordCount.toString()],
      ['导出时间', formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')]
    ]
  }
  sheets.push(summarySheet)
  
  return sheets
}

/**
 * 构建 PDF 数据
 */
const buildPDFData = (data: ExportData, options: ExportOptions) => {
  return {
    title: '家账通财务报表',
    dateRange: options.dateRange ? `${options.dateRange.start} 至 ${options.dateRange.end}` : '全部时间',
    summary: {
      totalExpense: formatAmount(data.summary.totalExpense, { showSymbol: false }),
      totalIncome: formatAmount(data.summary.totalIncome, { showSymbol: false }),
      balance: formatAmount(data.summary.balance, { showSymbol: false }),
      recordCount: data.summary.recordCount
    },
    records: data.records.slice(0, 100), // PDF 限制记录数量
    categories: options.includeCategories ? calculateCategoryStats(data.records) : [],
    members: options.includeMembers ? calculateMemberStats(data.records, data.members) : [],
    exportTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  }
}

/**
 * 计算分类统计
 */
const calculateCategoryStats = (records: any[]) => {
  const stats = new Map()
  
  records.forEach(record => {
    const key = record.categoryId
    if (!stats.has(key)) {
      stats.set(key, {
        categoryName: record.categoryName,
        expenseAmount: 0,
        incomeAmount: 0,
        count: 0
      })
    }
    
    const stat = stats.get(key)
    if (record.type === 'expense') {
      stat.expenseAmount += parseFloat(record.amount)
    } else {
      stat.incomeAmount += parseFloat(record.amount)
    }
    stat.count++
  })
  
  return Array.from(stats.values())
}

/**
 * 计算成员统计
 */
const calculateMemberStats = (records: any[], members: any[]) => {
  const stats = new Map()
  
  // 初始化成员统计
  members.forEach(member => {
    stats.set(member.id, {
      memberName: member.nickname || member.name,
      expenseAmount: 0,
      incomeAmount: 0,
      count: 0
    })
  })
  
  // 统计记录
  records.forEach(record => {
    const memberId = record.createdBy
    if (stats.has(memberId)) {
      const stat = stats.get(memberId)
      if (record.type === 'expense') {
        stat.expenseAmount += parseFloat(record.amount)
      } else {
        stat.incomeAmount += parseFloat(record.amount)
      }
      stat.count++
    }
  })
  
  return Array.from(stats.values())
}

/**
 * 下载文件
 */
const downloadFile = async (url: string, filename: string) => {
  try {
    const downloadRes = await Taro.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册或文件管理器
          Taro.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              Taro.showToast({
                title: '文件已保存',
                icon: 'success'
              })
            },
            fail: () => {
              Taro.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        }
      },
      fail: () => {
        Taro.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    })
  } catch (error) {
    console.error('Download file error:', error)
    throw new Error('下载文件失败')
  }
}

/**
 * 通用导出函数
 */
export const exportData = async (data: ExportData, options: ExportOptions): Promise<string> => {
  switch (options.format) {
    case 'excel':
      return await exportToExcel(data, options)
    case 'pdf':
      return await exportToPDF(data, options)
    default:
      throw new Error('不支持的导出格式')
  }
} 