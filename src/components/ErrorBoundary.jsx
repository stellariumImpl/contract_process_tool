import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">出错了</h1>
          <p className="text-gray-400 mb-4">
            很抱歉，应用程序遇到了一个错误。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1DB954] text-white px-4 py-2 rounded-lg hover:bg-[#1aa34a] transition-colors"
          >
            刷新页面
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-gray-800 rounded-lg overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };