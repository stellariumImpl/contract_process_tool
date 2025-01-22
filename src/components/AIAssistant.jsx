import React, { useState, useRef, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { Search, MessageCircle } from 'lucide-react';

// 添加打字机效果的组件
const TypewriterText = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30); // 调整速度
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return <div className="whitespace-pre-wrap">{displayText}</div>;
};

// 添加加载动画组件
const LoadingDots = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
  </div>
);

export const AIAssistant = ({
  selectedModel,
  selectedText,
  contractContent,
  onContractUpdate,
  agentManager
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 随机提示语
  const tips = [
    'AI 仅供参考，请结合专业判断',
    '遇到复杂问题建议咨询专业人士',
    '内容仅供参考，请以实际合同为准',
    'AI 可能存在误差，请谨慎核实',
  ];

  const [currentTip, setCurrentTip] = useState(tips[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value === '/') {
      setShowCommands(true);
    }
  };

  const handleCommand = (command) => {
    setInputValue(command.placeholder);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSendMessage(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  const handleAnalyze = async () => {
    if (!contractContent) return;
    
    try {
      setMessages(prev => [...prev, {
        type: 'user',
        content: '分析当前合同内容'
      }]);

      const response = await agentManager.getCurrentModel().analyze(contractContent);
      
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response || '抱歉，我无法分析这份合同。'
      }]);

    } catch (error) {
      console.error('分析失败:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: '分析过程出错，请重试。'
      }]);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      setMessages(prev => [...prev, { type: 'user', content }]);
      setInputValue('');
      setIsLoading(true);

      const response = await agentManager.getCurrentModel().chat({
        content,
        context: contractContent
      });

      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: response || '抱歉，我现在无法回答这个问题。',
        isNew: true
      }]);

    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: '处理消息时出错，请重试。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查是否应该禁用交互
  const isDisabled = !contractContent;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">AI 助手</h2>
        </div>
        <div className="text-sm text-gray-400 animate-fade-in">
          {currentTip}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isDisabled}
          className={`px-4 py-2 rounded-md flex items-center gap-2 text-white transition-colors
            ${isDisabled 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          <Search className="w-4 h-4" />
          分析当前内容
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isDisabled ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            请先上传合同文件
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg p-3 text-white
                  ${msg.type === 'user' 
                    ? 'bg-blue-500 ml-auto' 
                    : 'bg-gray-700 mr-auto'}`}
                >
                  {msg.type === 'assistant' && (
                    <div className="text-xs text-gray-300 mb-1">AI 助手</div>
                  )}
                  {msg.type === 'assistant' && msg.isNew ? (
                    <TypewriterText text={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg p-3">
                  <LoadingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-gray-700 bg-gray-900 p-4 mt-auto">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={isDisabled ? "请先上传合同文件..." : "输入 / 打开命令面板，或直接输入问题..."}
            className={`w-full p-3 rounded-lg bg-gray-800 border border-gray-700 
              resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 
              text-white transition-colors
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={3}
          />
          {showCommands && !isDisabled && (
            <CommandPalette
              onSelect={handleCommand}
              onClose={() => setShowCommands(false)}
              isOpen={showCommands}
            />
          )}
        </div>
      </div>
    </div>
  );
}; 