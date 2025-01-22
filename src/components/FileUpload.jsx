'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

export const FileUpload = ({ onFileUpload, isProcessing }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateFile = (file) => {
    // 检查文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv' // csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('文件类型不支持，请上传 .xlsx, .xls 或 .csv 文件');
    }

    // 检查文件大小 (例如限制为10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('文件大小不能超过10MB');
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      // 验证文件
      validateFile(selectedFile);
      
      setFile(selectedFile);
      setStatus('loading');
      setErrorMessage('');
      console.log('Selected file:', selectedFile.name);

      if (onFileUpload) {
        await onFileUpload(selectedFile);
        // 只有在 onFileUpload 成功完成时才设置成功状态
        setStatus('success');
      }

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || '文件处理失败，请重试');
      setFile(null);
    }
  };

  // 使用 isProcessing 来控制加载状态
  useEffect(() => {
    if (isProcessing) {
      setStatus('loading');
    }
  }, [isProcessing]);

  // 监听 isProcessing 的变化
  useEffect(() => {
    if (!isProcessing && status === 'loading') {
      setStatus('success');
    }
  }, [isProcessing]);

  return (
    <div className="w-full">
      <div className={`relative border-2 border-dashed rounded-lg p-8 text-center
        ${status === 'success' ? 'border-green-500' : 'border-gray-600'}
        ${status === 'error' ? 'border-red-500' : ''}`}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center space-y-4">
          <div>
            {status === 'success' ? (
              <Check className="w-12 h-12 text-green-500" />
            ) : status === 'error' ? (
              <AlertCircle className="w-12 h-12 text-red-500" />
            ) : status === 'loading' ? (
              <div className="w-12 h-12 border-4 border-t-[#1DB954] border-r-[#1DB954] border-b-[#1DB954] border-l-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-[#1DB954]" />
            )}
          </div>
          <div className="text-sm">
            {file ? (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
            ) : (
              <>
                <p className="font-semibold">点击或拖拽文件到此处上传</p>
                <p className="text-gray-400">支持 .xlsx, .xls, .csv 格式</p>
              </>
            )}
            {status === 'error' && (
              <p className="text-red-500 mt-2">{errorMessage}</p>
            )}
            {status === 'loading' && (
              <p className="text-gray-500 mt-2">正在处理文件，请稍候...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};