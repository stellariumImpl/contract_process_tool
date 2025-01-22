// src/services/api.js

const OLLAMA_API_BASE = 'http://localhost:11434/api';

export const ollamaAPI = {
  // 获取可用模型列表
  async getModels() {
    const response = await fetch(`${OLLAMA_API_BASE}/tags`);
    const data = await response.json();
    return data.models;
  },

  // 生成回复
  async generateResponse(model, prompt, context = []) {
    try {
      const response = await fetch(`${OLLAMA_API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          context,
          stream: true,
        }),
      });

      // 使用 streaming 响应
      const reader = response.body.getReader();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          const data = JSON.parse(line);
          result += data.response;

          // 如果是最后一条消息，返回上下文供后续使用
          if (data.done) {
            return {
              response: result.trim(),
              context: data.context,
            };
          }
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  },
};

// 文件处理服务
export const fileService = {
  // 解析Excel/CSV文件
  async parseFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File parsing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error parsing file:', error);
      throw error;
    }
  },

  // 生成合同
  async generateContract(data) {
    try {
      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Contract generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },
};