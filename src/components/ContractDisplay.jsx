import React, { useState, useCallback } from 'react';
import { FileText, Edit2 } from 'lucide-react';

export const ContractDisplay = ({ content, onTextSelect }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setSelectionCoords({
        x: rect.left + (rect.width / 2),
        y: rect.top - 10
      });
    } else {
      setSelectedText('');
      setSelectionCoords(null);
    }
  }, []);

  const handleAnalyzeClick = useCallback(() => {
    if (selectedText && onTextSelect) {
      onTextSelect(selectedText);
      setSelectedText('');
      setSelectionCoords(null);
    }
  }, [selectedText, onTextSelect]);

  return (
    <div className="relative h-full bg-gray-900 rounded-lg">
      <div className="flex items-center gap-2 p-4 border-b border-gray-800">
        <FileText className="w-5 h-5 text-[#1DB954]" />
        <h3 className="font-semibold">合同预览</h3>
      </div>

      <div
        className="prose prose-invert max-w-none p-4 h-[500px] overflow-y-auto"
        onMouseUp={handleTextSelection}
      >
        {content ? (
          <div
            className="whitespace-pre-wrap text-gray-200"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="w-12 h-12 mb-2" />
            <p>请上传文件以预览合同内容</p>
          </div>
        )}
      </div>

      {selectedText && selectionCoords && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: selectionCoords.x,
            top: selectionCoords.y
          }}
        >
          <button
            onClick={handleAnalyzeClick}
            className="flex items-center gap-2 bg-[#1DB954] text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-[#1aa34a] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            分析选中文本
          </button>
        </div>
      )}
    </div>
  );
};