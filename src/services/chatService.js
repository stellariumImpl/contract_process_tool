export class ChatService {
  static async analyzeContract(content, selectedText = '') {
    try {
      const prompt = selectedText ?
        `请分析以下合同文本中选中的内容："${selectedText}"，指出可能存在的问题（如错别字、语病、重复用词等）并给出修改建议。请以JSON格式返回，包含原文、问题分析、修改建议等字段。` :
        `请全面分析这份合同的内容，指出可能存在的问题（如错别字、语病、重复用词等）并给出修改建议。请以JSON格式返回，包含分析结果和具体的修改建议。合同内容：${content}`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen:7b",
          prompt: prompt,
          stream: false,
        }),
      });

      const result = await response.json();

      // 尝试解析返回的JSON
      try {
        const analysis = JSON.parse(result.response);
        return {
          type: 'structured',
          content: analysis
        };
      } catch (e) {
        // 如果不是JSON格式，返回原始响应
        return {
          type: 'text',
          content: result.response
        };
      }
    } catch (error) {
      console.error('Error analyzing contract:', error);
      throw error;
    }
  }

  static async generateRevision(suggestion) {
    try {
      const prompt = `请根据以下修改建议给出具体的修改后文本：${JSON.stringify(suggestion)}`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen:7b",
          prompt: prompt,
          stream: false,
        }),
      });

      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error generating revision:', error);
      throw error;
    }
  }
}