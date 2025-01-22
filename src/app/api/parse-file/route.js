import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json(
        { error: '没有收到文件' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 读取Excel文件
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });

    // 提取表头和数据
    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    // 转换为对象数组
    const processedData = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // 生成合同内容
    const contractContent = generateContractTemplate(processedData[0]); // 使用第一行数据

    return NextResponse.json({
      success: true,
      data: processedData,
      contract: contractContent
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: '文件处理失败: ' + error.message },
      { status: 500 }
    );
  }
}

function generateContractTemplate(data) {
  // 定义一些常见的字段映射
  const fieldMappings = {
    'supplier': '乙方',
    'supplier_name': '乙方',
    'vendor': '乙方',
    'customer': '甲方',
    'customer_name': '甲方',
    'buyer': '甲方',
  };

  // 处理数据中的字段
  const processedFields = {};
  Object.entries(data).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (fieldMappings[lowerKey]) {
      processedFields[fieldMappings[lowerKey]] = value;
    } else {
      processedFields[key] = value;
    }
  });

  // 生成合同模板
  const template = `
    <div class="contract-content">
      <h1 class="text-2xl font-bold mb-6">合同</h1>
      
      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-4">第一条 合同主体</h2>
        <p class="mb-2">甲方：${processedFields['甲方'] || '_________________'}</p>
        <p class="mb-2">乙方：${processedFields['乙方'] || '_________________'}</p>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-4">第二条 合同内容</h2>
        ${Object.entries(processedFields)
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