'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Search, Loader2 } from 'lucide-react';
import { Loading } from './Loading';

export const ChatBox = ({ selectedModel, selectedText, contractContent, onContractUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedText) {
      setInput(`请分析并修改以下文本内容：${selectedText}`);
    }
  }, [selectedText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAnalyzeContract = async () => {
    if (!contractContent) return;
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: `请分析当前合同内容中的繁体字和不规范用语，并给出修改建议。以下是合同内容：

${contractContent}

请按以下格式返回分析结果：
{
  "type": "suggestion",
  "analysis": [
    {"location": "位置描述", "original": "原文", "suggested": "建议修改为", "reason": "修改原因"}
  ],
  "content": "完整的修改后内容"
}`,
          stream: false
        })
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        suggestion: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('分析合同时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: `请分析以下问题并给出修改建议：${input}\n\n当前合同内容：${contractContent}\n\n请给出具体的修改建议并以合适的文档格式返回修改后的内容。`,
          stream: false
        }),
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        suggestion: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="sticky top-4 flex flex-col h-[calc(100vh-16rem)] bg-gray-900 rounded-lg"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">AI 助手</h2>
        <button
          onClick={handleAnalyzeContract}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1DB954] hover:bg-[#1aa34a] text-white"
          disabled={isLoading}
        >
          <Search className="w-4 h-4" />
          分析当前内容
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`p-2 rounded-lg flex items-start gap-2 max-w-[80%]
                ${message.role === 'user'
                ? 'bg-[#1DB954] text-white ml-auto'
                : 'bg-gray-800 text-white'}`}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
              <div className="space-y-1">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.suggestion && (
                  <button
                    onClick={() => onContractUpdate?.(message.suggestion)}
                    className="mt-2 text-xs bg-[#1DB954] text-white px-2 py-1 rounded hover:bg-[#1aa34a] transition-colors"
                  >
                    应用修改建议
                  </button>
                )}
                <span className="text-xs opacity-50 block mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && <Loading.Spinner />}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-800"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入修改建议..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
          />
          <Loading.Button
            type="submit"
            loading={isLoading}
            disabled={!input.trim()}
          >
            发送
          </Loading.Button>
        </div>
      </form>
    </div>
  );
};
