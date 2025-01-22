import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: '合同处理系统',
  description: '智能合同处理和编辑系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
    <body>
    <ThemeProvider>
      {children}
    </ThemeProvider>
    </body>
    </html>
  );
}