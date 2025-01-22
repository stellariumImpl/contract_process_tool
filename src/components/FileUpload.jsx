'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, Eye } from 'lucide-react';
import { TableEditor } from './TableEditor';
import { read, utils } from 'xlsx';

export const FileUpload = ({ onFileUpload, isProcessing }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [tableData, setTableData] = useState(null);

  const validateFile = (file) => {
    // 检查文件扩展名而不是 MIME 类型
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
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
      validateFile(selectedFile);
      
      setFile(selectedFile);
      setStatus('loading');
      setErrorMessage('');
      
      const content = await readExcelContent(selectedFile);
      
      // 检查数据是否有效
      if (!content || !content.length || !content[0].length) {
        throw new Error('无法读取文件内容，请检查文件格式是否正确');
      }

      console.log('Parsed content:', content); // 调试用
      setTableData(content);
      
      if (onFileUpload) {
        await onFileUpload(selectedFile);
        setStatus('success');
      }

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || '文件处理失败，请重试');
      setFile(null);
    }
  };

  const handleTableSave = async (csvContent) => {
    // 创建新的文件对象，保持原始文件名
    const newFile = new File([csvContent], file.name, {
      type: file.type
    });
    setFile(newFile);
    onFileUpload(newFile);
    setShowPreview(false);
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
    <div className="relative">
      <div className={`relative border-2 border-dashed rounded-lg p-8 text-center
        ${status === 'success' ? 'border-green-500' : 'border-gray-600'}
        ${status === 'error' ? 'border-red-500' : ''}`}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
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

      {file && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">{file.name}</span>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
          >
            <Eye className="w-4 h-4" />
            预览和编辑
          </button>
        </div>
      )}

      {showPreview && tableData && (
        <TableEditor
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          initialData={tableData}
          onSave={handleTableSave}
          fileName={file?.name}
        />
      )}
    </div>
  );
};

// 修改文件读取函数
const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        resolve(arrayBuffer);
      } catch (error) {
        reject(new Error('文件读取失败'));
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

// 修改 Excel 文件读取函数
const readExcelContent = async (file) => {
  try {
    const arrayBuffer = await readFileContent(file);
    const workbook = read(arrayBuffer, { 
      type: 'array',
      codepage: 936,  // GBK编码
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 使用 sheet_to_json 而不是 sheet_to_csv
    const data = utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: '',
      raw: true
    });

    // 过滤空行并格式化数据
    return data
      .filter(row => row.some(cell => cell != null && cell !== ''))
      .map(row => 
        row.map(cell => {
          if (cell === null || cell === undefined) return '';
          if (typeof cell === 'number') return cell.toString();
          if (cell instanceof Date) return cell.toISOString().split('T')[0];
          return cell.toString().trim();
        })
      );

  } catch (error) {
    console.error('Excel读取错误:', error);
    throw new Error('无法读取Excel文件，请确保文件格式正确');
  }
};

// 添加 CSV 解码函数
const decodeCSV = (content) => {
  // 尝试检测编码
  if (content.includes('')) {
    // 如果发现乱码，尝试使用 GBK 解码
    try {
      const decoder = new TextDecoder('gbk');
      const buffer = new TextEncoder().encode(content);
      return decoder.decode(buffer);
    } catch (e) {
      console.warn('GBK decode failed:', e);
    }
  }
  return content;
};

// 修改 CSV 解析函数
const parseCSVToArray = (csvString) => {
  // 使用更健壮的 CSV 解析逻辑
  const rows = csvString.split(/\r?\n/);
  return rows.map(row => {
    // 处理带引号的字段
    const matches = row.match(/(".*?"|[^,]+)/g) || [];
    return matches.map(field => {
      // 移除引号并处理转义字符
      return field.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
    });
  });
};