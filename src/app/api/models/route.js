// src/app/api/models/route.js
import { NextResponse } from 'next/server';

// Ollama API 基础 URL
const OLLAMA_API_BASE = 'http://localhost:11434/api';

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_API_BASE}/tags`);
    const data = await response.json();

    // 过滤出支持的模型
    const supportedModels = data.models.filter(model =>
      ['qwen:7b', 'llama2', 'mistral'].includes(model.name)
    );

    return NextResponse.json({
      models: supportedModels.map(model => ({
        id: model.name,
        name: model.name.charAt(0).toUpperCase() + model.name.slice(1),
        description: model.details || '暂无描述',
        size: model.size,
        modified: model.modified
      }))
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// 切换模型
export async function POST(request) {
  try {
    const { modelId } = await request.json();

    // 验证模型是否可用
    const response = await fetch(`${OLLAMA_API_BASE}/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelId }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Model not available' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, modelId });
  } catch (error) {
    console.error('Error switching model:', error);
    return NextResponse.json(
      { error: 'Failed to switch model' },
      { status: 500 }
    );
  }
}