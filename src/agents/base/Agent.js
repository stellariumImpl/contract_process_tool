// Agent 接口
export class Agent {
  constructor(config = {}) {
    this.config = config;
  }

  async initialize() {
    throw new Error('Method initialize() must be implemented');
  }

  async process(input) {
    throw new Error('Method process() must be implemented');
  }

  async cleanup() {
    // 可选的清理方法
  }
}

// 合同生成 Agent
export class ContractAgent extends Agent {
  constructor(config) {
    super(config);
    this.model = null;
  }

  async generateContract(tableData) {
    throw new Error('Method generateContract() must be implemented');
  }

  async modifyContract(content, modification) {
    throw new Error('Method modifyContract() must be implemented');
  }

  async analyzeContract(content) {
    throw new Error('Method analyzeContract() must be implemented');
  }
}

// 表格处理 Agent
export class TableAgent extends Agent {
  constructor(config) {
    super(config);
  }

  async parseTable(file) {
    throw new Error('Method parseTable() must be implemented');
  }

  async validateData(data) {
    throw new Error('Method validateData() must be implemented');
  }

  async transformData(data) {
    throw new Error('Method transformData() must be implemented');
  }
}