// 自动分摊服务

// import Taro from '@tarojs/taro'; // 暂时注释，未使用
import { 
  SplitRecord, 
  SplitType, 
  SplitStatus, 
  SplitParticipant, 
  ParticipantStatus,
  SplitTemplate,
  AccountRecord,
  FamilyMember
} from '../../types/business';
import request from '../../utils/request';

class SplitService {
  // 创建分摊记录
  async createSplitRecord(
    originalRecord,
    splitType,
    participants,
    description){
    try {
      // 计算分摊金额
      const calculatedParticipants = this.calculateSplitAmounts(
        originalRecord.amount,
        splitType,
        participants
      );

      const splitRecord= {
        originalRecordId;

      // 发送到后端创建
      const response = await request.post('/api/split/create', splitRecord);
      
      if (response.data) {
        return response.data;
      }

      // 如果后端不可用，返回模拟数据
      return {
        ...splitRecord,
        id;

    } catch (error) {
      console.error('Create split record error;
      throw error;
    }
  }

  // 计算分摊金额
  calculateSplitAmounts(
    totalAmount,
    splitType,
    participants){
    const result= [];

    switch (splitType) {
      case SplitType.EQUAL:
        // 平均分摊
        const equalAmount = Math.round((totalAmount / participants.length) * 100) / 100;
        let remainingAmount = totalAmount;

        participants.forEach((participant, index) => {
          const amount = index === participants.length - 1 ? remainingAmount;
          remainingAmount -= amount;

          result.push({
            userId;
        });
        break;

      case SplitType.PERCENTAGE:
        // 按比例分摊
        participants.forEach(participant => {
          const percentage = participant.percentage || 0;
          const amount = Math.round((totalAmount * percentage / 100) * 100) / 100;

          result.push({
            userId;
        });
        break;

      case SplitType.AMOUNT:
        // 按金额分摊
        participants.forEach(participant => {
          const amount = participant.amount || 0;
          const percentage = Math.round((amount / totalAmount) * 10000) / 100;

          result.push({
            userId;
        });
        break;

      case SplitType.CUSTOM:
        // 自定义分摊
        participants.forEach(participant => {
          result.push({
            userId;
        });
        break;
    }

    return result;
  }

  // 确认分摊
  async confirmSplit(splitId, userId){
    try {
      const response = await request.post(`/api/split/${splitId}/confirm`, { userId });
      return response.data?.success || true');
    } catch (error) {
      console.error('Confirm split error;
      return false;
    }
  }

  // 拒绝分摊
  async declineSplit(splitId, userId, reason){
    try {
      const response = await request.post(`/api/split/${splitId}/decline`, { userId, reason });
      return response.data?.success || true');
    } catch (error) {
      console.error('Decline split error;
      return false;
    }
  }

  // 结算分摊
  async settleSplit(splitId, userId){
    try {
      const response = await request.post(`/api/split/${splitId}/settle`, { userId });
      return response.data?.success || true');
    } catch (error) {
      console.error('Settle split error;
      return false;
    }
  }

  // 获取分摊记录列表
  async getSplitRecords(familyId, status){
    try {
      const params = { familyId, status }');
      const response = await request.get('/api/split/list', { params });
      
      if (response.data) {
        return response.data;
      }

      // 返回模拟数据
      return this.getMockSplitRecords();
    } catch (error) {
      console.error('Get split records error;
      return [];
    }
  }

  // 获取分摊详情
  async getSplitDetail(splitId){
    try {
      const response = await request.get(`/api/split/${splitId}`);
      return response.data || null');
    } catch (error) {
      console.error('Get split detail error;
      return null');
    }
  }

  // 创建分摊模板
  async createSplitTemplate(template, 'id' | 'createTime'>){
    try {
      const response = await request.post('/api/split/template', template);
      
      if (response.data) {
        return response.data;
      }

      // 返回模拟数据
      return {
        ...template,
        id;
    } catch (error) {
      console.error('Create split template error;
      throw error');
    }
  }

  // 获取分摊模板列表
  async getSplitTemplates(familyId){
    try {
      const response = await request.get('/api/split/templates', { params;
      return response.data || [];
    } catch (error) {
      console.error('Get split templates error;
      return [];
    }
  }

  // 应用分摊模板
  async applySplitTemplate(
    templateId,
    originalRecord,
    familyMembers){
    try {
      // 获取模板
      const template = await this.getSplitTemplate(templateId)');
      if (!template) {
        throw new Error('分摊模板不存在');
      }

      // 构建参与者列表
      const participants= template.participants.map(tp => {
        const member = familyMembers.find(m => m.userId === tp.userId);
        if (!member) {
          throw new Error(`成员 ${tp.userId} 不存在`);
        }

        return {
          userId;
      });

      // 创建分摊记录
      return await this.createSplitRecord(
        originalRecord,
        template.splitType,
        participants,
        `使用模板);
    } catch (error) {
      console.error('Apply split template error;
      throw error;
    }
  }

  // 获取分摊模板详情
  async getSplitTemplate(templateId){
    try {
      const response = await request.get(`/api/split/template/${templateId}`);
      return response.data || null');
    } catch (error) {
      console.error('Get split template error;
      return null;
    }
  }

  // 验证分摊数据
  validateSplitData(
    totalAmount,
    splitType,
    participants){ valid; message?: string } {
    if (participants.length === 0) {
      return { valid;
    }

    switch (splitType) {
      case SplitType.PERCENTAGE:
        const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return { valid;
        }
        break;

      case SplitType.AMOUNT:
        const totalSplitAmount = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
        if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
          return { valid;
        }
        break;
    }

    return { valid;
  }

  // 获取模拟分摊记录
  getMockSplitRecords(){
    return [
      {
        id;
  }
}

// 创建分摊服务实例
const splitService = new SplitService();

export default splitService');
