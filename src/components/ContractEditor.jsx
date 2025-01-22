'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Edit2, Eye, Save, FileDown, RefreshCw } from 'lucide-react';

export const ContractEditor = ({
  content,
  onContentChange,
  onTextSelect,
  onRegenerate,
  isProcessing
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        history: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setLocalContent(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      if (text) {
        onTextSelect?.(text);
      }
    },
  });

  // 当外部 content 更新时更新编辑器
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setLocalContent(content);
    }
  }, [editor, content]);

  // 根据编辑状态设置编辑器是否可编辑
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  if (!mounted) return null;

  const handleSave = () => {
    onContentChange?.(localContent);
    setIsEditing(false);
  };

  const handleExport = () => {
    const element = document.createElement('div');
    element.innerHTML = localContent;
    element.className = 'contract-for-export';
    document.body.appendChild(element);
    window.print();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* 顶部工具栏 - 响应式设计 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 bg-gray-800 border-b border-gray-700 space-y-3 lg:space-y-0">
        {/* 左侧标题和重新生成按钮 */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
          <h2 className="text-lg font-semibold text-white">合同内容</h2>
          <button
            onClick={onRegenerate}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? '生成中...' : '重新生成'}
          </button>
        </div>

        {/* 右侧操作按钮组 */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white flex-1 lg:flex-none justify-center min-w-[80px]"
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">预览</span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">编辑</span>
              </>
            )}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white flex-1 lg:flex-none justify-center min-w-[80px]"
            >
              <Save className="w-4 h-4" />
              <span className="hidden lg:inline ml-1">保存</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white flex-1 lg:flex-none justify-center min-w-[80px]"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden lg:inline ml-1">导出</span>
          </button>
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div className={`flex-1 overflow-y-auto ${isEditing ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`max-w-4xl mx-auto p-4 lg:p-6 ${!isEditing ? 'contract-preview' : ''}`}>
          <EditorContent 
            editor={editor} 
            className="prose prose-sm lg:prose-base xl:prose-lg max-w-none"
          />
        </div>
      </div>
    </div>
  );
};