import React, { useState, useEffect, useRef } from 'react';
import { Command } from 'lucide-react';

const COMMANDS = [
  {
    id: 'analyze',
    icon: '🔍',
    title: '分析当前内容',
    description: '分析当前合同内容并提供建议',
    placeholder: '分析这份合同有什么需要注意的地方？'
  },
  {
    id: 'format',
    icon: '📝',
    title: '格式规范建议',
    description: '检查并提供格式规范建议',
    placeholder: '这份合同的格式是否符合规范？'
  },
  {
    id: 'terms',
    icon: '⚖️',
    title: '条款完整性检查',
    description: '检查合同条款是否完整',
    placeholder: '这份合同的条款是否完整？'
  },
  {
    id: 'risk',
    icon: '⚠️',
    title: '风险评估',
    description: '评估合同中的潜在风险',
    placeholder: '这份合同有哪些潜在风险？'
  },
  {
    id: 'compare',
    icon: '🔄',
    title: '版本对比',
    description: '与标准模板进行对比',
    placeholder: '这份合同与标准模板有什么区别？'
  }
];

export const CommandPalette = ({ onSelect, onClose, isOpen }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredCommands, setFilteredCommands] = useState(COMMANDS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const query = inputValue.toLowerCase();
    setFilteredCommands(
      COMMANDS.filter(
        cmd => 
          cmd.title.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query)
      )
    );
  }, [inputValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedCommand = filteredCommands[selectedIndex];
      if (selectedCommand) {
        onSelect(selectedCommand);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2">
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索命令..."
              className="flex-1 bg-transparent outline-none text-white"
            />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-700
                ${selectedIndex === index ? 'bg-gray-700' : ''}`}
              onClick={() => onSelect(cmd)}
            >
              <span className="text-xl">{cmd.icon}</span>
              <div>
                <div className="font-medium text-white">{cmd.title}</div>
                <div className="text-sm text-gray-400">{cmd.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 