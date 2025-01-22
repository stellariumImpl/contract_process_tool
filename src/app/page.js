'use client';

import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ChatBox } from '../components/ChatBox';
import { ContractEditor } from '../components/ContractEditor';
import { ModelSelector } from '../components/ModelSelector';
import { AgentManager } from '../agents/AgentManager';
import { OllamaAgent } from '../agents/models/OllamaAgent';
import { Toast } from '../components/Toast';
import { ErrorAlert } from '../components/ErrorAlert';
import { RefreshCw, Edit2, FileDown, Eye } from 'lucide-react';
import { AIAssistant } from '@/components/AIAssistant';

// 初始化 Agent 管理器
const agentManager = new AgentManager();
agentManager.registerAgent('qwen:7b', new OllamaAgent({ modelName: 'qwen:7b' }));

export default function Home() {
  const [selectedModel, setSelectedModel] = useState('qwen:7b');
  const [contractContent, setContractContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelStatus, setModelStatus] = useState('checking'); // 'checking' | 'installed' | 'not-installed' | 'error'
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // 检查并初始化模型
  const initializeModel = async () => {
    try {
      setModelStatus('checking');
      
      // 1. 检查 Ollama 服务是否在运行
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      
      // 2. 检查模型是否已安装
      const isInstalled = data.models?.some(model => model.name === 'qwen:7b');
      if (!isInstalled) {
        setModelStatus('not-installed');
        setError('请先安装 qwen:7b 模型。在命令行中运行: ollama pull qwen:7b');
        return;
      }

      // 3. 初始化模型
      await agentManager.setModel(selectedModel);
      const currentModel = agentManager.getCurrentModel();
      
      if (!currentModel) {
        setModelStatus('error');
        setError('模型初始化失败，请刷新页面重试');
        return;
      }

      setModelStatus('installed');
      setError(null);
      console.log('模型初始化成功:', currentModel.modelName);
      
    } catch (error) {
      console.error('初始化模型失败:', error);
      setModelStatus('error');
      setError('模型加载失败，请检查 Ollama 服务是否正常运行，然后刷新页面重试');
    }
  };

  // 在组件加载和模型切换时初始化
  useEffect(() => {
    initializeModel();
  }, [selectedModel]);

  const handleFileUpload = async (file) => {
    try {
      if (modelStatus !== 'installed') {
        throw new Error(
          modelStatus === 'not-installed' 
            ? '请先安装模型，在命令行运行: ollama pull qwen:7b' 
            : '模型未正确加载，请刷新页面重试'
        );
      }

      setIsProcessing(true);
      console.log('开始处理文件:', file.name);

      const currentModel = agentManager.getCurrentModel();
      if (!currentModel) {
        throw new Error('未选择模型或模型未正确初始化');
      }
      
      console.log('当前使用的模型:', currentModel.modelName);

      // 确保模型已经设置
      await agentManager.setModel(selectedModel);
      
      const result = await agentManager.processFile(file);
      
      if (!result) {
        throw new Error('文件处理返回结果为空');
      }

      if (!result.success) {
        throw new Error(result.error || '处理文件失败');
      }

      if (!result.contract) {
        throw new Error('处理结果中缺少合同内容');
      }

      console.log('处理结果:', result);
      setContractContent(result.contract);
      setCurrentContent(result.contract);

    } catch (error) {
      console.error('处理文件时出错:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRegenerateContract = async () => {
    try {
      if (!contractContent) {
        showToast('没有可重新生成的内容', 'error');
        return;
      }

      setIsProcessing(true);
      const result = await agentManager.getCurrentModel().generateContract({
        type: 'regenerate',
        content: currentContent
      });

      if (!result) {
        throw new Error('生成结果为空');
      }

      setContractContent(result);
      setCurrentContent(result);
      showToast('合同已重新生成');
    } catch (error) {
      console.error('重新生成合同时出错:', error);
      setError(error.message || '重新生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContractSave = async () => {
    try {
      // 保存逻辑...
      showToast('合同已保存');
    } catch (error) {
      showToast('保存失败，请重试', 'error');
    }
  };

  const handleContractExport = async () => {
    try {
      // 导出逻辑...
      showToast('合同已导出');
    } catch (error) {
      showToast('导出失败，请重试', 'error');
    }
  };

  const handleContractEdit = () => {
    try {
      setIsEditing(!isEditing);
      showToast(isEditing ? '已切换到预览模式' : '已切换到编辑模式', 'info');
    } catch (error) {
      showToast('切换模式失败，请重试', 'error');
    }
  };

  const handleContractUpdate = async (suggestion) => {
    try {
      if (!suggestion) return;

      const result = await agentManager.modifyContract(currentContent, suggestion);

      if (result.success) {
        setContractContent(result.content);
        setCurrentContent(result.content);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('更新合同内容时出错:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 固定导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* 左侧标题 */}
            <h1 className="text-xl lg:text-2xl font-bold text-[#1DB954]">合同处理系统</h1>

            {/* 右侧模型信息和选择器 */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-sm text-gray-400">
                当前模型: {selectedModel}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                  ${modelStatus === 'checking' ? 'bg-gray-600' : ''} 
                  ${modelStatus === 'installed' ? 'bg-green-600' : ''} 
                  ${modelStatus === 'not-installed' ? 'bg-red-600' : ''} 
                  ${modelStatus === 'error' ? 'bg-red-600' : ''}`}
                >
                  {modelStatus === 'checking' && '检查中...'}
                  {modelStatus === 'installed' && '已加载'}
                  {modelStatus === 'not-installed' && '未安装'}
                  {modelStatus === 'error' && '加载失败'}
                </span>
              </div>
              <ModelSelector
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
                disabled={modelStatus === 'checking'}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* 错误提示 */}
      {error && (
        <ErrorAlert
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左侧区域 */}
          <div className="space-y-4">
            <FileUpload
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
            />
            <div className="sticky top-20">
              <AIAssistant
                selectedModel={selectedModel}
                selectedText={selectedText}
                contractContent={currentContent}
                onContractUpdate={handleContractUpdate}
                agentManager={agentManager}
              />
            </div>
          </div>

          {/* 右侧合同编辑区 */}
          <div className="min-h-[calc(100vh-5rem)]">
            <ContractEditor
              content={contractContent}
              onContentChange={setContractContent}
              onTextSelect={setSelectedText}
              onRegenerate={handleRegenerateContract}
              onSave={handleContractSave}
              onExport={handleContractExport}
              onEdit={handleContractEdit}
              isProcessing={isProcessing}
              isEditing={isEditing}
            >
              {/* 在合同内容区域的按钮组 */}
              <div className="flex items-center gap-3">
                {/* 重新生成按钮 */}
                <button
                  onClick={handleRegenerateContract}
                  disabled={isProcessing}
                  className={`
                    group relative inline-flex items-center gap-2 px-4 py-2.5
                    bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600
                    hover:from-blue-500 hover:via-blue-400 hover:to-blue-500
                    text-white font-medium rounded-lg
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    disabled:hover:scale-100 disabled:hover:shadow-none
                    overflow-hidden
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <RefreshCw className={`w-5 h-5 relative ${isProcessing ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                  <span className="relative">{isProcessing ? '生成中...' : '重新生成'}</span>
                </button>

                {/* 编辑/预览按钮 */}
                <button
                  onClick={handleContractEdit}
                  className={`
                    group relative inline-flex items-center gap-2 px-4 py-2.5
                    bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700
                    hover:from-gray-600 hover:via-gray-500 hover:to-gray-600
                    text-white font-medium rounded-lg
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-[0_0_20px_rgba(75,85,99,0.5)]
                    overflow-hidden
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isEditing ? (
                    <>
                      <Eye className="w-5 h-5 relative group-hover:animate-pulse" />
                      <span className="relative">预览</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-5 h-5 relative group-hover:animate-pulse" />
                      <span className="relative">编辑</span>
                    </>
                  )}
                </button>

                {/* 导出按钮 */}
                <button
                  onClick={handleContractExport}
                  className={`
                    group relative inline-flex items-center gap-2 px-4 py-2.5
                    bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600
                    hover:from-purple-500 hover:via-purple-400 hover:to-purple-500
                    text-white font-medium rounded-lg
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]
                    overflow-hidden
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <FileDown className="w-5 h-5 relative group-hover:animate-pulse" />
                  <span className="relative">导出</span>
                </button>
              </div>
            </ContractEditor>
          </div>
        </div>
      </main>

      {/* Toast 组件 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}