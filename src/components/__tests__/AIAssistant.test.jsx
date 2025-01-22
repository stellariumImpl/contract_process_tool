import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { AIAssistant } from '../AIAssistant';

// Mock agentManager
const mockAgentManager = {
  getCurrentModel: () => ({
    chat: async ({ content }) => {
      // 模拟智能提示
      if (content.includes('预测用户可能想问的完整问题')) {
        if (inputValue.startsWith('这个合同')) {
          return '这个合同的主要风险点是什么？';
        }
        return '';
      }
      // 模拟正常对话
      return '这是一个测试回复';
    },
    analyze: async () => '这是分析结果'
  })
};

describe('AIAssistant', () => {
  it('应该正确显示智能提示并响应 Tab 键', async () => {
    const { getByRole, getByText } = render(
      <AIAssistant
        contractContent="测试合同内容"
        agentManager={mockAgentManager}
        onShowToast={() => {}}
      />
    );

    const textarea = getByRole('textbox');
    
    // 输入文本
    fireEvent.change(textarea, { target: { value: '这个合同' } });
    
    // 等待智能提示出现
    await waitFor(() => {
      expect(getByText('这个合同的主要风险点是什么？')).toBeInTheDocument();
    });

    // 模拟按下 Tab 键
    fireEvent.keyDown(textarea, { key: 'Tab' });
    
    // 验证输入框的值被更新
    expect(textarea.value).toBe('这个合同的主要风险点是什么？');
  });

  // 更多测试用例...
}); 