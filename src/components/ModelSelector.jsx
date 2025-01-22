'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const ModelSelector = ({ selectedModel, onSelect, disabled, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const models = [
    { id: 'qwen:7b', name: 'Qwen 7B' },
    { id: 'llama2', name: 'Llama 2' },
    { id: 'mistral', name: 'Mistral' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between w-[200px] px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{models.find(m => m.id === selectedModel)?.name || selectedModel}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-700 text-white transition-colors ${
                  selectedModel === model.id ? 'bg-[#1DB954] hover:bg-[#1aa34a]' : ''
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};