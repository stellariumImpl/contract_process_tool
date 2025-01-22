import React, { useState, useRef, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { Search, MessageCircle, MoreVertical, Edit2, Trash2, Copy } from 'lucide-react';

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

// 修改 MessageActions 组件
const MessageActions = ({ type, content, onEdit, onDelete, onShowToast }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      onShowToast?.('内容已复制', 'success');
    } catch (error) {
      console.error('复制失败:', error);
      onShowToast?.('复制失败，请手动复制', 'error');
    }
  };

  return (
    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-1">
        {type === 'user' ? (
          <>
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-600/50 rounded-md transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
            </button>
          </>
        ) : (
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-blue-500/20 rounded-md transition-colors"
            title="复制内容"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-blue-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// 添加一个 useClickOutside hook
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// 修改 PromptSuggestion 组件
const PromptSuggestion = ({ suggestion, currentInput }) => {
  if (!suggestion) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="p-3">
        <span className="text-white">{currentInput}</span>
        <span className="text-gray-500 bg-gray-700/50 rounded">
          {suggestion.slice(currentInput.length)}
        </span>
      </div>
    </div>
  );
};

export const AIAssistant = ({
  selectedModel,
  selectedText,
  contractContent,
  onContractUpdate,
  agentManager,
  onShowToast
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const commandPaletteRef = useRef(null);
  const [promptSuggestion, setPromptSuggestion] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

  // 使用 useClickOutside hook
  useClickOutside(commandPaletteRef, () => {
    setShowCommands(false);
  });

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

  // 获取提示建议
  const generateSuggestion = async (value) => {
    if (!value || value.length < 2 || isGeneratingSuggestion) return;
    
    try {
      setIsGeneratingSuggestion(true);
      
      const suggestion = await agentManager.getCurrentModel().chat({
        content: `基于以下上下文和用户当前的输入，预测用户可能想问的完整问题。
要求：
1. 预测必须以用户当前输入开头
2. 预测要简短自然，像正常人会问的问题
3. 只返回预测的问题，不要其他内容

当前合同内容：
${contractContent?.slice(0, 300)}...

最近的对话：
${messages.slice(-2).map(m => `${m.type === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}

用户当前输入：${value}`,
        context: '',
        temperature: 0.3
      });

      // 更严格的建议验证
      if (suggestion && 
          suggestion.toLowerCase().startsWith(value.toLowerCase()) && 
          suggestion.length > value.length &&
          suggestion.length < 100 &&
          suggestion !== value) {
        setPromptSuggestion(suggestion);
      } else {
        setPromptSuggestion('');
      }
    } catch (error) {
      console.error('生成建议失败:', error);
      setPromptSuggestion('');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && !inputValue.startsWith('/')) {
        generateSuggestion(inputValue);
      } else {
        setPromptSuggestion('');
      }
    }, 300); // 减少延迟时间

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 当输入 / 时显示命令面板
    if (value === '/') {
      setShowCommands(true);
    } 
    // 当删除 / 或输入框为空时隐藏命令面板
    else if (!value.startsWith('/') || value === '') {
      setShowCommands(false);
    }
  };

  const handleCommand = (command) => {
    setInputValue(command.placeholder);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Tab' && promptSuggestion) {
      // Tab 键必须放在最前面处理
      e.preventDefault(); // 阻止默认的 Tab 行为
      setInputValue(promptSuggestion);
      setPromptSuggestion('');
      return; // 重要：处理完 Tab 键后直接返回
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSendMessage(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowCommands(false);
      setPromptSuggestion('');
    }
  };

  const handleAnalyze = async () => {
    if (!contractContent) return;
    
    try {
      const newUserMessage = {
        id: Date.now(),
        type: 'user',
        content: '分析当前合同内容',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newUserMessage]);
      setIsLoading(true);

      const response = await agentManager.getCurrentModel().analyze(contractContent);
      
      const newAIMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response || '抱歉，我无法分析这份合同。',
        isNew: true,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAIMessage]);

    } catch (error) {
      console.error('分析失败:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: '分析过程出错，请重试。',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      const newUserMessage = {
        id: Date.now(),
        type: 'user',
        content,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setInputValue('');
      setIsLoading(true);

      const response = await agentManager.getCurrentModel().chat({
        content,
        context: contractContent
      });

      const newAIMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response || '抱歉，我现在无法回答这个问题。',
        isNew: true,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAIMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: '处理消息时出错，请重试。',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '';
    }
  };

  // 检查是否需要显示时间
  const shouldShowTime = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const timeDiff = currentMsg.timestamp - prevMsg.timestamp;
    return timeDiff > 2 * 60 * 1000; // 2分钟
  };

  // 修改处理消息编辑的函数
  const handleEdit = async (messageId, newContent) => {
    try {
      if (!newContent.trim()) {
        onShowToast?.('消息内容不能为空', 'error');
        return;
      }

      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];
      if (message.content === newContent) {
        setEditingMessageId(null);
        setEditValue('');
        return;
      }

      // 立即更新当前消息
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...message,
        content: newContent,
        edited: true,
        editedAt: Date.now()
      };

      // 如果是用户消息，需要重新获取 AI 响应
      if (message.type === 'user') {
        setMessages(updatedMessages); // 先更新用户消息
        setEditingMessageId(null);
        setEditValue('');
        setIsLoading(true);

        try {
          const response = await agentManager.getCurrentModel().chat({
            content: newContent,
            context: contractContent
          });

          // 删除原有的 AI 响应（如果存在）
          const newMessages = updatedMessages.filter((_, index) => index !== messageIndex + 1);
          
          // 添加新的 AI 响应
          newMessages.splice(messageIndex + 1, 0, {
            id: Date.now(),
            type: 'assistant',
            content: response,
            isNew: true,
            timestamp: Date.now()
          });

          setMessages(newMessages);
          onShowToast?.('消息已更新', 'success');
        } catch (error) {
          console.error('获取新回答失败:', error);
          onShowToast?.('更新回答失败', 'error');
          // 回滚到原始消息
          setMessages(messages);
        } finally {
          setIsLoading(false);
        }
      } else {
        // 如果不是用户消息，直接更新
        setMessages(updatedMessages);
        setEditingMessageId(null);
        setEditValue('');
        onShowToast?.('消息已更新', 'success');
      }

    } catch (error) {
      console.error('编辑消息失败:', error);
      onShowToast?.('编辑失败，请重试', 'error');
      setEditingMessageId(null);
      setEditValue('');
    }
  };

  // 处理消息删除
  const handleDelete = (messageId) => {
    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      let updatedMessages = [...messages];
      // 如果是用户消息，同时删除下一条 AI 响应
      if (messages[messageIndex].type === 'user' && messageIndex + 1 < messages.length) {
        updatedMessages = messages.filter((_, index) => 
          index !== messageIndex && index !== messageIndex + 1
        );
      } else {
        updatedMessages = messages.filter(m => m.id !== messageId);
      }

      setMessages(updatedMessages);
      // 使用父组件的 Toast
      onShowToast?.('消息已删除', 'success');
    } catch (error) {
      console.error('删除消息失败:', error);
      onShowToast?.('删除失败，请重试', 'error');
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
            {messages.map((msg, index) => {
              const showTime = shouldShowTime(msg, messages[index - 1]);
              
              return (
                <div key={msg.id} className="space-y-1">
                  {showTime && (
                    <div className="text-center text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </div>
                  )}
                  <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`group max-w-[80%] rounded-lg p-3 text-white relative
                      ${msg.type === 'user' ? 'bg-blue-500' : 'bg-gray-700'}
                      hover:shadow-lg transition-shadow duration-200`}
                    >
                      {msg.type === 'assistant' && (
                        <div className="text-xs text-gray-300 mb-1 flex items-center gap-2">
                          <MessageCircle className="w-3 h-3" />
                          AI 助手
                        </div>
                      )}
                      
                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full p-2 bg-gray-800/50 rounded border border-gray-600 
                              text-white min-h-[60px] focus:outline-none focus:ring-2 
                              focus:ring-blue-500/50 resize-none"
                            placeholder="输入新的消息内容..."
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditValue('');
                              }}
                              className="px-3 py-1 text-sm rounded bg-gray-700/50 
                                hover:bg-gray-600 transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleEdit(msg.id, editValue)}
                              className="px-3 py-1 text-sm rounded bg-blue-600/50 
                                hover:bg-blue-500 transition-colors"
                              disabled={!editValue.trim()}
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pr-14"> {/* 为操作按钮留出空间 */}
                            {msg.type === 'assistant' && msg.isNew ? (
                              <TypewriterText text={msg.content} />
                            ) : (
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            )}
                          </div>
                          
                          {msg.edited && (
                            <div className="text-xs text-gray-400/80 mt-1">
                              已编辑 · {formatTime(msg.editedAt)}
                            </div>
                          )}
                          
                          <MessageActions
                            type={msg.type}
                            content={msg.content}
                            onEdit={() => {
                              if (msg.type === 'user') {
                                setEditingMessageId(msg.id);
                                setEditValue(msg.content);
                              }
                            }}
                            onDelete={() => handleDelete(msg.id)}
                            onShowToast={onShowToast}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
              text-white transition-colors relative z-10
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={3}
          />
          <PromptSuggestion 
            suggestion={promptSuggestion}
            currentInput={inputValue}
          />
          {showCommands && !isDisabled && inputValue.startsWith('/') && (
            <div ref={commandPaletteRef}>
              <CommandPalette
                onSelect={handleCommand}
                onClose={() => setShowCommands(false)}
                isOpen={showCommands}
              />
            </div>
          )}
        </div>
        {!isDisabled && (
          <div className="mt-2 text-xs text-gray-500">
            按 Tab 使用建议 · Enter 发送 · Shift + Enter 换行
          </div>
        )}
      </div>
    </div>
  );
}; 