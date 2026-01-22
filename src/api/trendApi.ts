import axios from 'axios';

// 临时硬编码 AWS 后端地址，绕过 Vite 代理，排查连接问题
// baseURL 只保留主机地址，具体路径在 get 方法里写
const TREND_API_BASE_URL = 'http://13.236.132.48:8000';

const trendAxios = axios.create({
  baseURL: TREND_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface TrendArticle {
  id: number;
  title: string;
  url: string;
  source: string;
  publish_time: string;
  content?: string;
  created_at?: string;
}

export interface AnalysisResult {
  id: number;
  article_id: number;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string;
  created_at: string;
}

export const trendApi = {
  // 1. 获取最新舆情列表
  getTrends: async (limit: number = 50, source?: string) => {
    try {
      const params: any = { limit };
      if (source) params.source = source;
      
      const response = await trendAxios.get<TrendArticle[]>('/api/trends', { params });
      return response.data;
    } catch (error: any) {
      console.error('[Trend API] Failed to fetch trends:', error);
      // 如果后端数据库还未生成，可能会报错，返回空数组兜底
      return [];
    }
  },

  // 2. 获取 AI 分析结果
  getAnalysis: async (limit: number = 20) => {
    try {
      const response = await trendAxios.get<AnalysisResult[]>('/api/analysis', { 
        params: { limit } 
      });
      return response.data;
    } catch (error: any) {
      console.error('[Trend API] Failed to fetch analysis:', error);
      return [];
    }
  },

  // 3. 健康检查
  checkHealth: async () => {
    try {
      // 不再请求 /health，直接请求 /api/trends?limit=1
      // 这样可以避免因后端 api.py 版本不同步导致的 404 问题
      await trendAxios.get('/api/trends', { params: { limit: 1 } });
      return true;
    } catch (error) {
      console.warn('[Trend API] Health check failed:', error);
      return false;
    }
  }
};
