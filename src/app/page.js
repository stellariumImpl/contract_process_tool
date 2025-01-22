'use client';

import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ChatBox } from '../components/ChatBox';
import { ContractEditor } from '../components/ContractEditor';
import { ModelSelector } from '../components/ModelSelector';
import { AgentManager } from '../agents/AgentManager';
import { OllamaAgent } from '../agents/models/OllamaAgent';
import { Toast } from '../components/Toast';

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
        console.error('qwen:7b 模型未安装，请先安装模型');
        return;
      }

      // 3. 初始化模型
      await agentManager.setModel(selectedModel);
      const currentModel = agentManager.getCurrentModel();
      
      if (!currentModel) {
        setModelStatus('error');
        console.error('模型初始化失败');
        return;
      }

      setModelStatus('installed');
      console.log('模型初始化成功:', currentModel.modelName);
      
    } catch (error) {
      console.error('初始化模型失败:', error);
      setModelStatus('error');
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
      console.log('当前使用的模型:', currentModel?.modelName);

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
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRegenerateContract = async () => {
    try {
      setIsProcessing(true);
      const result = await agentManager.getCurrentModel().generateContract({
        type: 'regenerate',
        content: currentContent
      });

      setContractContent(result);
      setCurrentContent(result);
      showToast('合同已重新生成');
    } catch (error) {
      console.error('重新生成合同时出错:', error);
      showToast('重新生成失败，请重试', 'error');
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

  const handleContractPreview = () => {
    try {
      // 预览逻辑...
      showToast('已切换到预览模式', 'info');
    } catch (error) {
      showToast('预览失败，请重试', 'error');
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
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1DB954]">合同处理系统</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              当前模型: {selectedModel}
              {modelStatus === 'checking' && ' (检查中...)'}
              {modelStatus === 'installed' && ' (已加载)'}
              {modelStatus === 'not-installed' && (
                <span className="text-red-500"> (未安装)</span>
              )}
              {modelStatus === 'error' && (
                <span className="text-red-500"> (加载失败)</span>
              )}
            </div>
            <ModelSelector
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              disabled={modelStatus === 'checking'}
            />
          </div>
        </div>
      </nav>

      {/* 错误提示 */}
      {modelStatus === 'not-installed' && (
        <div className="fixed top-16 left-0 right-0 bg-red-500 text-white p-2 text-center">
          请先安装 qwen:7b 模型。在命令行中运行: ollama pull qwen:7b
        </div>
      )}
      {modelStatus === 'error' && (
        <div className="fixed top-16 left-0 right-0 bg-red-500 text-white p-2 text-center">
          模型加载失败，请检查 Ollama 服务是否正常运行，然后刷新页面重试
        </div>
      )}

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 pt-20">
        <div className="grid grid-cols-2 gap-4">
          {/* 左侧区域 */}
          <div className="space-y-4">
            <FileUpload
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
            />
            <div className="sticky top-20">
              <ChatBox
                selectedModel={selectedModel}
                selectedText={selectedText}
                contractContent={currentContent}
                onContractUpdate={handleContractUpdate}
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
              onPreview={handleContractPreview}
              isProcessing={isProcessing}
            />
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