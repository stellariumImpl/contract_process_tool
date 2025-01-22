import { ContractAgent } from '../base/Agent';
import * as XLSX from 'xlsx';

export class OllamaAgent extends ContractAgent {
  constructor({ modelName }) {
    super({ modelName });
    this.modelName = modelName;
    this.baseUrl = 'http://localhost:11434/api';
  }

  async initialize() {
    try {
      // 验证模型是否可用
      const response = await fetch(`${this.baseUrl}/tags`);
      const data = await response.json();
      
      const isAvailable = data.models?.some(model => model.name === this.modelName);
      if (!isAvailable) {
        throw new Error(`Model ${this.modelName} is not available`);
      }

      // 测试模型是否可以正常响应
      const testResponse = await fetch(`${this.baseUrl}/generate`, {
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
      // 1. 读取并解析表格内容
      const tableData = await this._readFileContent(file);
      
      // 2. 使用 LLM 解析表格数据为结构化信息
      const structuredData = await this._parseTableData(tableData);
      
      // 3. 基于模板和结构化数据生成合同
      const contract = await this._generateContractFromTemplate(structuredData);
      
      return {
        success: true,
        contract: contract
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error.message || 'Failed to process file'
      };
    }
  }

  async _parseTableData(tableContent) {
    const parsePrompt = `
你是一个专业的采购合同分析助手。请分析以下采购订单表格内容，提取关键信息并按以下格式返回（请确保返回的是合法的 JSON 格式）：

{
  "基本信息": {
    "合同编号": "",
    "签订日期": "",
    "交付期限": ""
  },
  "供应商信息": {
    "供应商名称": "",
    "供应商地址": "",
    "联系人": ""
  },
  "采购物品信息": {
    "物品名称": "",
    "规格型号": "",
    "数量": 0,
    "单价": "",
    "总金额": ""
  },
  "付款信息": {
    "付款方式": "",
    "付款条件": "",
    "付款周期": ""
  }
}

请仔细分析以下表格内容，将信息填入上述结构中（注意保持 JSON 格式的正确性）：

${tableContent}`;

    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt: parsePrompt,
          stream: false,
          options: {
            temperature: 0.1, // 降低温度以获得更确定的输出
            top_p: 0.9,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse table data');
      }

      const result = await response.json();
      
      // 尝试从响应中提取 JSON
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // 如果解析失败，返回一个基本结构
        return {
          基本信息: {},
          供应商信息: {},
          采购物品信息: {},
          付款信息: {}
        };
      }
    } catch (error) {
      console.error('Error in _parseTableData:', error);
      throw error;
    }
  }

  async _generateContractFromTemplate(structuredData) {
    const templatePrompt = `
你是一个专业的采购合同生成助手。请使用以下结构化数据，生成一份正式的采购合同。合同应包含以下部分：

1. 合同标题和编号
2. 甲乙双方信息
3. 采购内容和规格
4. 合同金额和支付方式
5. 交付条款
6. 质量要求和验收标准
7. 违约责任
8. 其他条款
9. 签署部分

请确保：
- 使用正式的法律语言
- 条款清晰明确
- 符合合同法规范
- 保护双方权益
- 包含必要的法律条款

以下是结构化数据：
${JSON.stringify(structuredData, null, 2)}

请生成完整的合同文本：`;

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: templatePrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate contract');
    }

    const result = await response.json();
    return result.response;
  }

  async generateContract({ type, content }) {
    try {
      let prompt;
      if (type === 'regenerate') {
        prompt = `
          请基于以下内容重新生成一份更规范的合同：
          ${content}
          
          要求：
          1. 保持原有的主要内容
          2. 使用更规范的合同语言
          3. 确保条款完整性
          4. 改进格式和结构
        `;
      } else {
        prompt = `请根据以下内容生成一份合同：${content}`;
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: prompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  }

  async _extractStructuredData(contractContent) {
    const extractPrompt = `
请从以下合同文本中提取关键信息，并以结构化的 JSON 格式返回。
需要提取的信息包括：基本信息、供应商信息、采购物品信息、付款信息等。

合同文本：
${contractContent}`;

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: extractPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract structured data');
    }

    const result = await response.json();
    return JSON.parse(result.response);
  }

  // 添加文件读取方法
  async _readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          let content = '';
          if (file.name.endsWith('.csv')) {
            content = event.target.result;
          } else {
            // 处理 Excel 文件
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // 转换为文本格式，保持表格结构
            content = XLSX.utils.sheet_to_csv(firstSheet, { 
              blankrows: false,
              defval: '',
              rawNumbers: true
            });
          }

          // 清理和格式化内容
          content = content.trim()
            .replace(/\r\n/g, '\n')
            .replace(/,,+/g, ',')  // 移除多余的逗号
            .replace(/\n,/g, '\n') // 移除行末逗号
            .replace(/,\n/g, '\n'); // 移除行首逗号

          resolve(content);
        } catch (error) {
          reject(new Error(`解析文件失败: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  async modifyContract(content, suggestion) {
    try {
      const prompt = `
        请根据以下建议修改合同内容：
        
        原合同内容：
        ${content}
        
        修改建议：
        ${suggestion}
        
        请提供修改后的完整合同内容。
      `;

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: prompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('修改失败');
      }

      const data = await response.json();
      return {
        success: true,
        content: data.response
      };

    } catch (error) {
      console.error('Modification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyze(contractContent) {
    try {
      const prompt = `
        请分析以下合同内容，重点关注：
        1. 合同主要条款
        2. 潜在风险点
        3. 特殊条件和要求
        4. 建议和改进意见

        合同内容:
        ${contractContent}

        请提供详细的分析报告。
      `;

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: prompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('分析失败');
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  async chat({ content, context }) {
    try {
      const prompt = `
        基于以下合同内容回答问题:
        ${context}

        问题: ${content}

        请提供专业、准确的回答。
      `;

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: prompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('AI 响应失败');
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }
}