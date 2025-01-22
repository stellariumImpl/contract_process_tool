import * as XLSX from 'xlsx';

// 字段映射关系
const FIELD_MAPPINGS = {
  // 甲方相关字段
  'customer': '甲方',
  'customer_name': '甲方',
  'buyer': '甲方',
  'client': '甲方',
  'purchaser': '甲方',

  // 乙方相关字段
  'supplier': '乙方',
  'vendor': '乙方',
  'provider': '乙方',
  'supplier_name': '乙方',
  'contractor': '乙方',
};

export class ContractProcessor {
  // 从Excel中提取数据
  static async extractFromExcel(file) {
    const data = await this.readExcelFile(file);
    return this.processExcelData(data);
  }

  // 读取Excel文件
  static async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // 处理Excel数据
  static processExcelData(data) {
    const headers = data[0];
    const rows = data.slice(1);
    const processedData = [];

    // 找到关键字段的列索引
    const fieldIndices = this.findFieldIndices(headers);

    // 处理每一行数据
    rows.forEach(row => {
      const processedRow = {};

      // 根据映射关系处理字段
      Object.entries(fieldIndices).forEach(([field, index]) => {
        if (index !== -1) {
          const value = row[index];
          const mappedField = FIELD_MAPPINGS[field.toLowerCase()] || field;
          processedRow[mappedField] = value;
        }
      });

      processedData.push(processedRow);
    });

    return processedData;
  }

  // 查找关键字段的列索引
  static findFieldIndices(headers) {
    const indices = {};

    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      Object.keys(FIELD_MAPPINGS).forEach(key => {
        if (headerLower.includes(key)) {
          indices[key] = index;
        }
      });
    });

    return indices;
  }

  // 生成合同内容
  static generateContract(data) {
    // 这里可以根据需要自定义合同模板
    const template = `
      <div class="contract">
        <h1 class="text-2xl font-bold mb-6">合同</h1>
        
        <section class="mb-6">
          <h2 class="text-xl font-semibold mb-4">第一条 合同主体</h2>
          <p class="mb-2">甲方：${data.甲方 || '_________________'}</p>
          <p class="mb-2">乙方：${data.乙方 || '_________________'}</p>
        </section>

        <section class="mb-6">
          <h2 class="text-xl font-semibold mb-4">第二条 合同内容</h2>
          ${Object.entries(data)
      .filter(([key]) => !['甲方', '乙方'].includes(key))
      .map(([key, value]) => `
              <div class="mb-2">
                <span class="font-medium">${key}：</span>
                <span>${value || ''}</span>
              </div>
            `).join('')}
        </section>

        <section class="mb-6">
          <h2 class="text-xl font-semibold mb-4">第三条 其他条款</h2>
          <p class="mb-2">1. 本合同一式两份，双方各执一份。</p>
          <p class="mb-2">2. 本合同自双方签字盖章之日起生效。</p>
          <p class="mb-2">3. 本合同未尽事宜，双方另行协商解决。</p>
        </section>

        <section class="mt-12">
          <div class="grid grid-cols-2 gap-8">
            <div>
              <p>甲方签章：_________________</p>
              <p class="mt-4">日期：_________________</p>
            </div>
            <div>
              <p>乙方签章：_________________</p>
              <p class="mt-4">日期：_________________</p>
            </div>
          </div>
        </section>
      </div>
    `;

    return template;
  }

  // 分析用户指令
  static analyzeUserInstruction(instruction) {
    const intent = {
      type: null,
      target: null,
      value: null
    };

    // 解析修改甲方/乙方的指令
    const partyMatch = instruction.match(/[将把]?(甲方|乙方)[改为修改成]+(.+)/);
    if (partyMatch) {
      intent.type = 'update_party';
      intent.target = partyMatch[1];
      intent.value = partyMatch[2].trim();
      return intent;
    }

    // 解析其他修改指令
    const modifyMatch = instruction.match(/[将把]?(.+)[改为修改成]+(.+)/);
    if (modifyMatch) {
      intent.type = 'replace';
      intent.target = modifyMatch[1].trim();
      intent.value = modifyMatch[2].trim();
      return intent;
    }

    return intent;
  }
}