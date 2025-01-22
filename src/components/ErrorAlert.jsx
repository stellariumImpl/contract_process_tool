import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';

export const ErrorAlert = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-16 left-0 right-0 z-50 animate-slide-in">
      <div className="bg-red-500 text-white p-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <p>{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-red-100"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 