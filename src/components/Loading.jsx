import React from 'react';
import { Loader2 } from 'lucide-react';

// Loading Spinner 组件
export const Spinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#1DB954]`} />
    </div>
  );
};

// Loading Overlay 组件
export const Overlay = ({ message = '加载中...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4">
        <Spinner size="large" />
        <p className="text-white">{message}</p>
      </div>
    </div>
  );
};

// Loading Button 组件
export const Button = ({
                         loading,
                         children,
                         disabled,
                         className = '',
                         ...props
                       }) => {
  return (
    <button
      disabled={loading || disabled}
      className={`
        inline-flex items-center justify-center
        bg-[#1DB954] text-white px-4 py-2 rounded-lg
        hover:bg-[#1aa34a] transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="small" className="mr-2" />
          处理中...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// 导出所有组件
export const Loading = {
  Spinner,
  Overlay,
  Button
};