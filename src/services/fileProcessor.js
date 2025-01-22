import * as XLSX from 'xlsx';

export class FileProcessor {
  static async processExcel(file) {
    try {
      const data = await this.readExcelFile(file);
      const contractData = await this.extractContractData(data);
      const contractContent = await this.generateContractWithAI(contractData);

      return {
        success: true,
        data: contractData,
        contract: contractContent
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  static async extractContractData(data) {
    // 提取关键字段
    const keyFields = {
      partyA: this.findFieldValue(data[0], ['甲方', '购买方', '客户名称']),
      partyB: this.findFieldValue(data[0], ['乙方', '供应商', '销售方']),
      contractNo: this.findFieldValue(data[0], ['合同编号', '订单编号']),
      amount: this.findFieldValue(data[0], ['金额', '合同金额', '总价']),
      date: this.findFieldValue(data[0], ['日期', '签订日期', '合同日期']),
      // 添加其他需要提取的字段
    };

    return {
      ...keyFields,
      rawData: data[0] // 保存原始数据以备后用
    };
  }

  static findFieldValue(data, possibleFields) {
    for (const field of possibleFields) {
      if (data[field] !== undefined) {
        return data[field];
      }
    }
    return '';
  }

  static async generateContractWithAI(contractData) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen:7b",
          prompt: `请根据以下数据生成一份正式的合同文本，包含合同主体、合同内容、权利义务、其他条款等完整的合同结构：
          ${JSON.stringify(contractData, null, 2)}
          请以HTML格式返回，使用合适的标签结构。`,
          stream: false,
        }),
      });

      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  }
}