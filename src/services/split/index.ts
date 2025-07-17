// 自动分摊服务
//
// 提供账单分摊、金额/比例/自定义分配、分摊模板、分摊确认/拒绝/结算等核心能力，适配家庭多人协作场景。
// 典型场景：多人消费、账单分摊、分摊模板复用、分摊状态流转。

// import Taro from '@tarojs/taro'; // 暂时注释，未使用
import request from '../../utils/request';

/**
 * 自动分摊服务
 * @description 支持账单分摊、金额/比例/自定义分配、分摊模板、分摊确认/拒绝/结算等，适配家庭多人协作场景。
 */
class SplitService {
  /**
   * 创建分摊记录
   * @param originalRecord 原始账单记录
   * @param splitType 分摊类型（EQUAL/PERCENTAGE/AMOUNT/CUSTOM）
   * @param participants 参与者列表
   * @param description 分摊说明
   * @returns Promise<any> 分摊记录
   */
  async createSplitRecord(
    originalRecord,
    splitType,
    participants,
    description
  ) {
    try {
      // 计算分摊金额
      const calculatedParticipants = this.calculateSplitAmounts(
        originalRecord.amount,
        splitType,
        participants
      );
      const splitRecord = {
        originalRecordId: originalRecord.id,
        familyId: originalRecord.familyId,
        totalAmount: originalRecord.amount,
        splitType,
        participants: calculatedParticipants,
        description,
        status: 'PENDING',
        createdBy: originalRecord.userId
      };
      // 发送到后端创建
      const response = await request.post('/api/split/create', splitRecord);
      if (response.data) {
        return response.data;
      }
      // 如果后端不可用，返回空
      return null;
    } catch (error) {
      console.error('Create split record error:', error);
      throw error;
    }
  }

  /**
   * 计算分摊金额/比例
   * @param totalAmount 总金额
   * @param splitType 分摊类型
   * @param participants 参与者列表
   * @returns Array<{userId, nickName, avatarUrl, amount, percentage, status}>
   */
  calculateSplitAmounts(
    totalAmount,
    splitType,
    participants
  ) {
    const result = [];
    switch (splitType) {
      case 'EQUAL':
        // 平均分摊
        const equalAmount = Math.round((totalAmount / participants.length) * 100) / 100;
        let remainingAmount = totalAmount;
        participants.forEach((participant, index) => {
          const amount = index === participants.length - 1 ? remainingAmount : equalAmount;
          remainingAmount -= amount;
          result.push({
            userId: participant.userId,
            nickName: participant.nickName,
            avatarUrl: participant.avatarUrl,
            amount,
            percentage: Math.round((amount / totalAmount) * 10000) / 100,
            status: 'PENDING'
          });
        });
        break;
      case 'PERCENTAGE':
        // 按比例分摊
        participants.forEach(participant => {
          const percentage = participant.percentage || 0;
          const amount = Math.round((totalAmount * percentage / 100) * 100) / 100;
          result.push({
            userId: participant.userId,
            nickName: participant.nickName,
            avatarUrl: participant.avatarUrl,
            amount,
            percentage,
            status: 'PENDING'
          });
        });
        break;
      case 'AMOUNT':
        // 按金额分摊
        participants.forEach(participant => {
          const amount = participant.amount || 0;
          const percentage = Math.round((amount / totalAmount) * 10000) / 100;
          result.push({
            userId: participant.userId,
            nickName: participant.nickName,
            avatarUrl: participant.avatarUrl,
            amount,
            percentage,
            status: 'PENDING'
          });
        });
        break;
      case 'CUSTOM':
        // 自定义分摊
        participants.forEach(participant => {
          result.push({
            userId: participant.userId,
            nickName: participant.nickName,
            avatarUrl: participant.avatarUrl,
            amount: participant.amount || 0,
            percentage: participant.percentage,
            status: 'PENDING'
          });
        });
        break;
    }
    return result;
  }

  /**
   * 确认分摊
   * @param splitId 分摊记录ID
   * @param userId 当前用户ID
   * @returns Promise<boolean>
   */
  async confirmSplit(splitId, userId) {
    try {
      const response = await request.post(`/api/split/${splitId}/confirm`, { userId });
      return response.data?.success || true;
    } catch (error) {
      console.error('Confirm split error:', error);
      return false;
    }
  }

  /**
   * 拒绝分摊
   * @param splitId 分摊记录ID
   * @param userId 当前用户ID
   * @param reason 拒绝原因
   * @returns Promise<boolean>
   */
  async declineSplit(splitId, userId, reason) {
    try {
      const response = await request.post(`/api/split/${splitId}/decline`, { userId, reason });
      return response.data?.success || true;
    } catch (error) {
      console.error('Decline split error:', error);
      return false;
    }
  }

  /**
   * 结算分摊
   * @param splitId 分摊记录ID
   * @param userId 当前用户ID
   * @returns Promise<boolean>
   */
  async settleSplit(splitId, userId) {
    try {
      const response = await request.post(`/api/split/${splitId}/settle`, { userId });
      return response.data?.success || true;
    } catch (error) {
      console.error('Settle split error:', error);
      return false;
    }
  }

  /**
   * 获取分摊记录列表
   * @param familyId 家庭ID
   * @param status 分摊状态（可选）
   * @returns Promise<Array>
   */
  async getSplitRecords(familyId, status) {
    try {
      const params = { familyId, status };
      const response = await request.get('/api/split/list', params);
      return response.data || [];
    } catch (error) {
      console.error('Get split records error:', error);
      return [];
    }
  }

  /**
   * 获取分摊详情
   * @param splitId 分摊记录ID
   * @returns Promise<any|null>
   */
  async getSplitDetail(splitId) {
    try {
      const response = await request.get(`/api/split/${splitId}`);
      return response.data || null;
    } catch (error) {
      console.error('Get split detail error:', error);
      return null;
    }
  }

  /**
   * 创建分摊模板
   * @param template 模板对象
   * @returns Promise<any|null>
   */
  async createSplitTemplate(template) {
    try {
      const response = await request.post('/api/split/template/create', template);
      return response.data || null;
    } catch (error) {
      console.error('Create split template error:', error);
      throw error;
    }
  }

  /**
   * 获取分摊模板列表
   * @param familyId 家庭ID
   * @returns Promise<Array>
   */
  async getSplitTemplates(familyId) {
    try {
      const params = { familyId };
      const response = await request.get('/api/split/template/list', params);
      return response.data || [];
    } catch (error) {
      console.error('Get split templates error:', error);
      return [];
    }
  }

  /**
   * 应用分摊模板，自动生成分摊记录
   * @param templateId 模板ID
   * @param originalRecord 原始账单记录
   * @param familyMembers 家庭成员列表
   * @returns Promise<any>
   */
  async applySplitTemplate(
    templateId,
    originalRecord,
    familyMembers
  ) {
    try {
      // 获取模板
      const template = await this.getSplitTemplate(templateId);
      if (!template) {
        throw new Error('模板不存在');
      }
      // 根据模板创建参与者列表
      const participants = template.participants.map(tp => {
        const member = familyMembers.find(m => m.userId === tp.userId);
        return {
          userId: member.userId,
          nickName: member.nickName,
          avatarUrl: member.avatarUrl,
          percentage: tp.percentage
        };
      });
      // 创建分摊记录
      return await this.createSplitRecord(
        originalRecord,
        template.splitType,
        participants,
        template.description
      );
    } catch (error) {
      console.error('Apply split template error:', error);
      throw error;
    }
  }

  /**
   * 获取分摊模板详情
   * @param templateId 模板ID
   * @returns Promise<any|null>
   */
  async getSplitTemplate(templateId) {
    try {
      const response = await request.get(`/api/split/template/${templateId}`);
      return response.data || null;
    } catch (error) {
      console.error('Get split template error:', error);
      return null;
    }
  }

  // 验证分摊数据
  validateSplitData(
    totalAmount,
    splitType,
    participants
  ) {
    if (!participants || participants.length === 0) {
      return { valid: false, message: '至少需要一个参与者' };
    }

    if (splitType === 'PERCENTAGE') {
      const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { valid: false, message: '百分比总和必须等于100%' };
      }
    }

    if (splitType === 'AMOUNT') {
      const totalSplitAmount = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        return { valid: false, message: '分摊金额总和必须等于总金额' };
      }
    }

    return { valid: true };
  }
}

export default new SplitService();
