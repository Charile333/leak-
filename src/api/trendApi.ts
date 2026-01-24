import axios from 'axios';

// 使用 Vercel 代理地址，避免 Mixed Content 问题
// 生产环境为空字符串（相对路径），开发环境可以配置 VITE_BACKEND_URL
const TREND_API_BASE_URL = '/api/opinion';

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
      return false;
    }
  }
};
