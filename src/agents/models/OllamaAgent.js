import { ContractAgent } from '../base/Agent';
import * as XLSX from 'xlsx';

export class OllamaAgent extends ContractAgent {
  constructor({ modelName }) {
    super({ modelName });
    this.modelName = modelName;
    this.baseUrl = 'http://localhost:11434';
  }

  async initialize() {
    try {
      // 验证模型是否可用
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      
      const isAvailable = data.models?.some(model => model.name === this.modelName);
      if (!isAvailable) {
        throw new Error(`Model ${this.modelName} is not available`);
      }

      // 测试模型是否可以正常响应
      const testResponse = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: 'test',
          stream: false
        })
      });

      if (!testResponse.ok) {
        throw new Error('Failed to initialize model');
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize OllamaAgent:', error);
      throw error;
    }
  }

  async processFile(file) {
    try {
      // 读取文件内容
      const fileContent = await this._readFileContent(file);
      
      // 使用 Ollama 的 generate API 处理文件内容
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: `请分析以下文件内容并生成合同：\n\n${fileContent}`,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contract: result.response
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error.message || 'Failed to process file'
      };
    }
  }

  // 添加文件读取方法
  async _readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (file.name.endsWith('.csv')) {
            resolve(event.target.result); // CSV 文件直接返回文本内容
          } else {
            // 处理 Excel 文件
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // 转换为 CSV 格式
            const csvContent = XLSX.utils.sheet_to_csv(firstSheet);
            resolve(csvContent);
          }
        } catch (error) {
          reject(new Error('Failed to parse file content: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  async generateContract(tableData) {
    const prompt = this._generateContractPrompt(tableData);
    return this._callModel(prompt);
  }

  async modifyContract(content, modification) {
    const prompt = this._generateModificationPrompt(content, modification);
    return this._callModel(prompt);
  }

  async analyzeContract(content) {
    const prompt = this._generateAnalysisPrompt(content);
    return this._callModel(prompt);
  }

  async _callModel(prompt) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          }
        }),
      });

      const result = await response.json();
      return result.response;
    } catch (error) {
      throw new Error(`Model call failed: ${error.message}`);
    }
  }

  _generateContractPrompt(tableData) {
    // 计算总金额
    const totalAmount = tableData.reduce((sum, item) => sum + parseFloat(item['总金额'] || 0), 0);

    return `请根据以下采购订单数据生成一份完整的合同文本。

订单数据：
${JSON.stringify(tableData, null, 2)}

总金额：${totalAmount.toFixed(2)}元

要求：
1. 生成正式的采购合同
2. 包含以下内容：
   - 合同编号（使用订单编号）
   - 签订日期（使用订单日期）
   - 甲方（采购方）信息
   - 乙方（供应商）信息
   - 详细的产品清单（包含数量、规格、单价、总价）
   - 具体的付款条件和方式
   - 交付要求和验收标准
   - 质量保证条款
   - 违约责任
   - 争议解决方式
3. 使用正式的法律用语
4. 确保所有金额和数字的准确性
5. 合同格式规范、结构清晰

请直接生成合同内容，不需要解释说明。`;
  }

  _generateModificationPrompt(content, modification) {
    return `请根据以下修改建议修改合同内容：

当前合同内容：
${content}

修改要求：
${modification}

请返回完整的修改后内容，保持合同格式规范。`;
  }

  _generateAnalysisPrompt(content) {
    return `请分析以下合同内容，找出所有需要修改的地方（包括但不限于错别字、语法问题、逻辑问题、法律用语不规范等）：

${content}

请按以下格式返回分析结果：
{
  "type": "analysis",
  "issues": [
    {
      "location": "问题位置描述",
      "original": "原文内容",
      "suggestion": "修改建议",
      "reason": "修改原因"
    }
  ]
}`;
  }
}