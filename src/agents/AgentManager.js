import { TableProcessingAgent } from './models/TableProcessingAgent';

export class AgentManager {
  constructor() {
    this.agents = new Map();
    this.currentModel = null;
    this.tableAgent = new TableProcessingAgent({});
  }

  registerAgent(modelName, agent) {
    this.agents.set(modelName, agent);
  }

  async setModel(modelName) {
    const agent = this.agents.get(modelName);
    if (!agent) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    try {
      await agent.initialize();
      this.currentModel = agent;
      return true;
    } catch (error) {
      console.error('Failed to initialize model:', error);
      throw error;
    }
  }

  getCurrentModel() {
    return this.currentModel;
  }

  async processFile(file) {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }
    return await this.currentModel.processFile(file);
  }

  async modifyContract(content, modification) {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }
    try {
      const result = await this.currentModel.modifyContract(content, modification);
      return {
        success: true,
        content: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeContract(content) {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }
    try {
      const result = await this.currentModel.analyzeContract(content);
      return {
        success: true,
        analysis: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 辅助方法：验证数据
  validateData(data) {
    return this.tableAgent.validateData(data);
  }

  // 辅助方法：计算统计信息
  calculateStatistics(data) {
    return {
      totals: this.tableAgent.calculateTotals(data),
      validation: this.tableAgent.validateCalculations(data)
    };
  }
}