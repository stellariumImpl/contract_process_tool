import React, { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { ArrowLeft, Save } from 'lucide-react';

// 注册所有 Handsontable 模块
registerAllModules();

export const TableEditor = ({ 
  isOpen, 
  onClose, 
  initialData,
  onSave
}) => {
  const hotRef = useRef(null);
  
  useEffect(() => {
    if (hotRef.current && initialData) {
      const hot = hotRef.current.hotInstance;
      const headers = initialData[0] || [];
      const data = initialData.slice(1);
      
      hot.updateSettings({
        data: data,
        colHeaders: headers,
        rowHeaders: true,
        contextMenu: {
          items: {
            'row_above': {
              name: '上方插入行'
            },
            'row_below': {
              name: '下方插入行'
            },
            'remove_row': {
              name: '删除行'
            },
            'col_left': {
              name: '左侧插入列'
            },
            'col_right': {
              name: '右侧插入列'
            },
            'remove_col': {
              name: '删除列'
            },
            'copy': {
              name: '复制'
            },
            'cut': {
              name: '剪切'
            },
            'paste': {
              name: '粘贴'
            }
          }
        },
        height: '100%',
        width: '100%',
        stretchH: 'all',
        manualColumnResize: true,
        manualRowResize: true,
        outsideClickDeselects: false,
        selectionMode: 'multiple',
        licenseKey: 'non-commercial-and-evaluation'
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    const hot = hotRef.current.hotInstance;
    const data = hot.getData();
    const headers = hot.getColHeader();
    
    const csvRows = [headers];
    data.forEach(row => {
      const processedRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvRows.push(processedRow);
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    onSave(csvContent);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80">
      <div className="fixed inset-4 bg-white rounded-lg shadow-xl flex flex-col">
        {/* 工具栏 */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>应用更改</span>
          </button>
        </div>

        {/* 表格区域 */}
        <div className="flex-1 overflow-hidden p-4">
          <HotTable
            ref={hotRef}
            className="custom-handsontable"
          />
        </div>
      </div>
    </div>
  );
}; 