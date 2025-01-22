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
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">合同内容</h2>
          <button
            onClick={onRegenerate}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? '生成中...' : '重新生成'}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white"
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4" />
                预览
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                编辑
              </>
            )}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white"
          >
            <FileDown className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${isEditing ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`max-w-4xl mx-auto ${!isEditing ? 'contract-preview' : ''}`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};