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
    originalRecord: AccountRecord,
    splitType: SplitType,
    participants: Partial<SplitParticipant>[],
    description?: string
  ): Promise<SplitRecord> {
    try {
      // 计算分摊金额
      const calculatedParticipants = this.calculateSplitAmounts(
        originalRecord.amount,
        splitType,
        participants
      );

      const splitRecord: Omit<SplitRecord, 'id' | 'createTime' | 'updateTime'> = {
        originalRecordId: originalRecord.id,
        familyId: originalRecord.familyId,
        totalAmount: originalRecord.amount,
        splitType,
        participants: calculatedParticipants,
        description,
        status: SplitStatus.PENDING,
        createdBy: originalRecord.userId
      };

      // 发送到后端创建
      const response = await request.post('/api/split/create', splitRecord);
      
      if (response.data) {
        return response.data;
      }

      // 如果后端不可用，返回模拟数据
      return {
        ...splitRecord,
        id: Date.now().toString(),
        createTime: new Date(),
        updateTime: new Date()
      } as SplitRecord;

    } catch (error) {
      console.error('Create split record error:', error);
      throw error;
    }
  }

  // 计算分摊金额
  private calculateSplitAmounts(
    totalAmount: number,
    splitType: SplitType,
    participants: Partial<SplitParticipant>[]
  ): SplitParticipant[] {
    const result: SplitParticipant[] = [];

    switch (splitType) {
      case SplitType.EQUAL:
        // 平均分摊
        const equalAmount = Math.round((totalAmount / participants.length) * 100) / 100;
        let remainingAmount = totalAmount;

        participants.forEach((participant, index) => {
          const amount = index === participants.length - 1 ? remainingAmount : equalAmount;
          remainingAmount -= amount;

          result.push({
            userId: participant.userId!,
            nickName: participant.nickName!,
            avatarUrl: participant.avatarUrl!,
            amount,
            percentage: Math.round((amount / totalAmount) * 10000) / 100,
            status: ParticipantStatus.PENDING
          });
        });
        break;

      case SplitType.PERCENTAGE:
        // 按比例分摊
        participants.forEach(participant => {
          const percentage = participant.percentage || 0;
          const amount = Math.round((totalAmount * percentage / 100) * 100) / 100;

          result.push({
            userId: participant.userId!,
            nickName: participant.nickName!,
            avatarUrl: participant.avatarUrl!,
            amount,
            percentage,
            status: ParticipantStatus.PENDING
          });
        });
        break;

      case SplitType.AMOUNT:
        // 按金额分摊
        participants.forEach(participant => {
          const amount = participant.amount || 0;
          const percentage = Math.round((amount / totalAmount) * 10000) / 100;

          result.push({
            userId: participant.userId!,
            nickName: participant.nickName!,
            avatarUrl: participant.avatarUrl!,
            amount,
            percentage,
            status: ParticipantStatus.PENDING
          });
        });
        break;

      case SplitType.CUSTOM:
        // 自定义分摊
        participants.forEach(participant => {
          result.push({
            userId: participant.userId!,
            nickName: participant.nickName!,
            avatarUrl: participant.avatarUrl!,
            amount: participant.amount || 0,
            percentage: participant.percentage,
            status: ParticipantStatus.PENDING
          });
        });
        break;
    }

    return result;
  }

  // 确认分摊
  async confirmSplit(splitId: string, userId: string): Promise<boolean> {
    try {
      const response = await request.post(`/api/split/${splitId}/confirm`, { userId });
      return response.data?.success || true;
    } catch (error) {
      console.error('Confirm split error:', error);
      return false;
    }
  }

  // 拒绝分摊
  async declineSplit(splitId: string, userId: string, reason?: string): Promise<boolean> {
    try {
      const response = await request.post(`/api/split/${splitId}/decline`, { userId, reason });
      return response.data?.success || true;
    } catch (error) {
      console.error('Decline split error:', error);
      return false;
    }
  }

  // 结算分摊
  async settleSplit(splitId: string, userId: string): Promise<boolean> {
    try {
      const response = await request.post(`/api/split/${splitId}/settle`, { userId });
      return response.data?.success || true;
    } catch (error) {
      console.error('Settle split error:', error);
      return false;
    }
  }

  // 获取分摊记录列表
  async getSplitRecords(familyId: string, status?: SplitStatus): Promise<SplitRecord[]> {
    try {
      const params = { familyId, status };
      const response = await request.get('/api/split/list', { params });
      
      if (response.data) {
        return response.data;
      }

      // 返回模拟数据
      return this.getMockSplitRecords();
    } catch (error) {
      console.error('Get split records error:', error);
      return [];
    }
  }

  // 获取分摊详情
  async getSplitDetail(splitId: string): Promise<SplitRecord | null> {
    try {
      const response = await request.get(`/api/split/${splitId}`);
      return response.data || null;
    } catch (error) {
      console.error('Get split detail error:', error);
      return null;
    }
  }

  // 创建分摊模板
  async createSplitTemplate(template: Omit<SplitTemplate, 'id' | 'createTime'>): Promise<SplitTemplate> {
    try {
      const response = await request.post('/api/split/template', template);
      
      if (response.data) {
        return response.data;
      }

      // 返回模拟数据
      return {
        ...template,
        id: Date.now().toString(),
        createTime: new Date()
      };
    } catch (error) {
      console.error('Create split template error:', error);
      throw error;
    }
  }

  // 获取分摊模板列表
  async getSplitTemplates(familyId: string): Promise<SplitTemplate[]> {
    try {
      const response = await request.get('/api/split/templates', { params: { familyId } });
      return response.data || [];
    } catch (error) {
      console.error('Get split templates error:', error);
      return [];
    }
  }

  // 应用分摊模板
  async applySplitTemplate(
    templateId: string,
    originalRecord: AccountRecord,
    familyMembers: FamilyMember[]
  ): Promise<SplitRecord> {
    try {
      // 获取模板
      const template = await this.getSplitTemplate(templateId);
      if (!template) {
        throw new Error('分摊模板不存在');
      }

      // 构建参与者列表
      const participants: Partial<SplitParticipant>[] = template.participants.map(tp => {
        const member = familyMembers.find(m => m.userId === tp.userId);
        if (!member) {
          throw new Error(`成员 ${tp.userId} 不存在`);
        }

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
        `使用模板: ${template.name}`
      );
    } catch (error) {
      console.error('Apply split template error:', error);
      throw error;
    }
  }

  // 获取分摊模板详情
  private async getSplitTemplate(templateId: string): Promise<SplitTemplate | null> {
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
    totalAmount: number,
    splitType: SplitType,
    participants: Partial<SplitParticipant>[]
  ): { valid: boolean; message?: string } {
    if (participants.length === 0) {
      return { valid: false, message: '至少需要一个参与者' };
    }

    switch (splitType) {
      case SplitType.PERCENTAGE:
        const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return { valid: false, message: '百分比总和必须等于100%' };
        }
        break;

      case SplitType.AMOUNT:
        const totalSplitAmount = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
        if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
          return { valid: false, message: '分摊金额总和必须等于总金额' };
        }
        break;
    }

    return { valid: true };
  }

  // 获取模拟分摊记录
  private getMockSplitRecords(): SplitRecord[] {
    return [
      {
        id: '1',
        originalRecordId: 'record_1',
        familyId: 'family_1',
        totalAmount: 120.00,
        splitType: SplitType.EQUAL,
        participants: [
          {
            userId: 'user_1',
            nickName: '张三',
            avatarUrl: '',
            amount: 60.00,
            percentage: 50,
            status: ParticipantStatus.CONFIRMED,
            confirmTime: new Date()
          },
          {
            userId: 'user_2',
            nickName: '李四',
            avatarUrl: '',
            amount: 60.00,
            percentage: 50,
            status: ParticipantStatus.PENDING
          }
        ],
        description: '晚餐费用分摊',
        status: SplitStatus.PENDING,
        createTime: new Date(),
        updateTime: new Date(),
        createdBy: 'user_1'
      }
    ];
  }
}

// 创建分摊服务实例
const splitService = new SplitService();

export default splitService;
