import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { data } = await request.json();

    // 这里根据数据生成合同模板
    const contractTemplate = generateContractTemplate(data);

    return NextResponse.json({
      contract: contractTemplate,
      message: '合同生成成功'
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: '合同生成失败' },
      { status: 500 }
    );
  }
}

function generateContractTemplate(data) {
  // 从数据中提取关键字段
  const contractFields = extractContractFields(data);

  // 生成合同HTML模板
  const template = `
    <div class="contract-content">
      <h1 class="text-2xl font-bold mb-4">合同文件</h1>
      
      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">第一条 合同主体</h2>
        <p>甲方：${contractFields.partyA || '_______________'}</p>
        <p>乙方：${contractFields.partyB || '_______________'}</p>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">第二条 合同内容</h2>
        ${Object.entries(contractFields.content)
    .map(([key, value]) => `
            <div class="mb-2">
              <span class="font-medium">${key}：</span>
              <span>${value}</span>
            </div>
          `).join('')}
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">第三条 合同期限</h2>
        <p>合同期限：${contractFields.startDate || '_____'} 至 ${contractFields.endDate || '_____'}</p>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">第四条 其他条款</h2>
        <p>1. 本合同一式两份，双方各执一份。</p>
        <p>2. 本合同自双方签字盖章之日起生效。</p>
        <p>3. 本合同未尽事宜，双方另行协商解决。</p>
      </section>

      <section class="mt-12">
        <div class="grid grid-cols-2 gap-8">
          <div>
            <p>甲方签章：_____________</p>
            <p class="mt-2">日期：_____________</p>
          </div>
          <div>
            <p>乙方签章：_____________</p>
            <p class="mt-2">日期：_____________</p>
          </div>
        </div>
      </section>
    </div>
  `;

  return template;
}

function extractContractFields(data) {
  // 这里根据实际数据结构进行字段提取
  // 示例实现
  const fields = {
    partyA: data[0]?.partyA || data[0]?.['甲方'] || '',
    partyB: data[0]?.partyB || data[0]?.['乙方'] || '',
    startDate: data[0]?.startDate || data[0]?.['开始日期'] || '',
    endDate: data[0]?.endDate || data[0]?.['结束日期'] || '',
    content: {}
  };

  // 提取其他字段作为合同内容
  if (data[0]) {
    Object.entries(data[0]).forEach(([key, value]) => {
      if (!['partyA', 'partyB', 'startDate', 'endDate', '甲方', '乙方', '开始日期', '结束日期'].includes(key)) {
        fields.content[key] = value;
      }
    });
  }

  return fields;
}