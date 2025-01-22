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
      // 1. 检查服务是否可用
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Ollama 服务未响应');
      }

      // 2. 验证模型是否可用
      const data = await response.json();
      const isAvailable = data.models?.some(model => model.name === this.modelName);
      if (!isAvailable) {
        throw new Error(`模型 ${this.modelName} 未安装`);
      }

      // 3. 测试模型响应
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
        throw new Error('模型测试失败');
      }

      return true;
    } catch (error) {
      console.error('OllamaAgent 初始化失败:', error);
      throw error;
    }
  }

  async processFile(file) {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // 使用更可靠的选项来转换数据
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        raw: false, // 返回格式化的字符串
        defval: '', // 空单元格的默认值
        header: 1, // 使用数组格式而不是对象
        blankrows: false // 跳过空行
      });

      // 过滤和清理数据
      const cleanData = jsonData
        .filter(row => row.some(cell => cell !== '')) // 移除完全空的行
        .map(row => row.map(cell => 
          typeof cell === 'string' ? cell.trim() : cell
        ));

      return {
        success: true,
        data: cleanData
      };
    } catch (error) {
      console.error('处理文件失败:', error);
      return {
        success: false,
        error: '文件处理失败，请确保文件格式正确'
      };
    }
  }

  async _parseTableData(data) {
    try {
      // 确保数据是字符串
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // 清理可能导致 JSON 解析错误的字符
      const cleanedString = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
        .replace(/\n\s*\n/g, '\n') // 移除多余的空行
        .trim();

      return JSON.parse(cleanedString);
    } catch (error) {
      console.error('解析表格数据失败:', error);
      throw new Error('表格数据格式不正确');
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

    const response = await fetch(`${this.baseUrl}/api/generate`, {
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
      } else if (type === 'generate') {
        prompt = `
          请基于以下表格数据生成一份完整的采购合同。
          表格数据：${content}
          
          要求：
          1. 生成规范的合同格式
          2. 包含所有必要的合同条款
          3. 使用专业的法律语言
          4. 确保数据准确转换为合同条款
        `;
      } else {
        prompt = `请根据以下内容生成一份合同：${content}`;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
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

    const response = await fetch(`${this.baseUrl}/api/generate`, {
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

      const response = await fetch(`${this.baseUrl}/api/generate`, {
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

      const response = await fetch(`${this.baseUrl}/api/generate`, {
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

      const response = await fetch(`${this.baseUrl}/api/generate`, {
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