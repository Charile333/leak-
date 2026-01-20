/**
 * TrendRadar API 客户端
 * 
 * 架构说明：
 * 前端连接到 AWS EC2 上的后端代理服务。
 * 后端代理服务会转发请求到 TrendRadar API。
 * 请在 .env 文件中设置 VITE_BACKEND_URL 和 TRENDRADAR_API_URL。
 */

// 根据环境动态选择API地址
// 开发环境使用VITE_BACKEND_URL环境变量或默认本地地址
// 生产环境使用当前域名，通过Vercel代理访问
const BASE_URL = import.meta.env.DEV 
  ? import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'  // 开发环境优先使用环境变量配置
  : '';  // 生产环境使用当前域名，通过Vercel代理访问
const API_PREFIX = '/api/opinion';

// 舆情分析相关类型定义

export interface TrendRadarTrendData {
  date: string;
  count: number;
  sample_titles?: string[];
}

export interface TrendRadarSentimentData {
  positive: number;
  negative: number;
  neutral: number;
}

export interface TrendRadarCooccurrencePair {
  keyword1: string;
  keyword2: string;
  count: number;
  sample_titles?: string[];
}

export interface TrendRadarTrendResult {
  success: boolean;
  summary: {
    description: string;
    topic: string;
    date_range: {
      start: string;
      end: string;
      total_days: number;
    };
    granularity: string;
    total_mentions: number;
    average_mentions: number;
    peak_count: number;
    peak_time: string;
    change_rate: number;
    trend_direction: string;
  };
  data: TrendRadarTrendData[];
  error?: string;
}

export interface TrendRadarSentimentResult {
  success: boolean;
  method: string;
  summary: {
    description: string;
    total_found: number;
    returned: number;
    requested_limit: number;
    duplicates_removed: number;
    topic: string;
    time_range: string;
    platforms: string[];
    sorted_by_weight: boolean;
  };
  ai_prompt: string;
  data: any[];
  usage_note: string;
  error?: string;
}

export interface TrendRadarCooccurrenceResult {
  success: boolean;
  summary: {
    description: string;
    total: number;
    min_frequency: number;
    generated_at: string;
  };
  data: TrendRadarCooccurrencePair[];
  error?: string;
}

// 热点数据相关类型定义
export interface TrendRadarNewsItem {
  title: string;
  platform: string;
  rank: number;
  weight: number;
  timestamp: string;
  url?: string;
}

export interface TrendRadarTrendingTopic {
  topic: string;
  frequency: number;
  sample_titles: string[];
  platforms: string[];
}

export interface TrendRadarLatestNewsResult {
  success: boolean;
  summary: {
    description: string;
    total_news: number;
    platforms: string[];
    generated_at: string;
  };
  data: TrendRadarNewsItem[];
  error?: string;
}

export interface TrendRadarTrendingTopicsResult {
  success: boolean;
  summary: {
    description: string;
    total_topics: number;
    mode: string;
    extract_mode: string;
    generated_at: string;
  };
  data: TrendRadarTrendingTopic[];
  error?: string;
}

export interface TrendRadarAnalysisResult {
  topic: string;
  type: string;
  dateRange: {
    start: string;
    end: string;
  };
  data: {
    trend?: TrendRadarTrendData[];
    sentiment?: TrendRadarSentimentData;
    cooccurrence?: TrendRadarCooccurrencePair[];
  };
  summary?: any;
}

class TrendRadarAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    try {
      // Ensure endpoint starts with / if not already
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${BASE_URL}${API_PREFIX}${formattedEndpoint}`;
      
      console.log(`[TrendRadar API] Sending request: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin', // 仅在同域请求中包含凭证，解决CORS问题
      });

      console.log(`[TrendRadar API] Received response: ${response.status} for ${url}`);

      // 获取原始响应文本，用于调试和错误处理
      const responseText = await response.text();
      console.log(`[TrendRadar API] Response Text (first 100 chars):`, responseText.substring(0, 100));
      
      // 检查响应是否为HTML（通常是错误或重定向）
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        throw new Error(`API返回HTML而非JSON：${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        let errorMsg = `请求失败 (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          console.error(`[TrendRadar API] Error Detail for ${endpoint}:`, errorData);
          // 将错误详情转为字符串，方便在 Error 对象中查看
          errorMsg = `${errorMsg}: ${typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData)}`;
        } catch (e) {
          console.error(`[TrendRadar API] Raw Error Text for ${endpoint}:`, responseText);
          errorMsg = `${errorMsg}: ${responseText}`;
        }
        throw new Error(errorMsg);
      }

      // 尝试解析JSON响应
      try {
        return JSON.parse(responseText) as T;
      } catch (jsonError) {
        // 处理unknown类型的错误
        const errorMsg = jsonError instanceof Error 
          ? jsonError.message 
          : typeof jsonError === 'string' 
            ? jsonError 
            : '未知错误';
        throw new Error(`JSON解析失败：${errorMsg}。响应内容：${responseText}`);
      }
    } catch (error: any) {
      // 提取错误信息
      let msg = 'Unknown Error';
      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      } else {
        try {
          msg = JSON.stringify(error);
        } catch (e) {
          msg = String(error);
        }
      }
      
      console.error(`[TrendRadar API] Request to ${endpoint} error:`, msg);
      
      // 更友好的错误信息处理
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        throw new Error('无法连接到服务器，请检查网络连接或服务器状态');
      }
      
      // 处理HTML响应错误
      if (msg.includes('API返回HTML而非JSON')) {
        throw new Error('API请求失败，服务器返回了HTML页面。请检查API端点配置或服务器状态。');
      }
      
      throw new Error(msg);
    }
  }

  /**
   * 热度趋势分析 - 追踪特定话题的热度变化趋势
   * @param topic 话题关键词
   * @param dateRange 日期范围，格式: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
   * @param granularity 时间粒度，仅支持 day
   */
  async analyzeTrend(
    topic: string, 
    dateRange: { start: string; end: string },
    granularity: string = 'day'
  ): Promise<TrendRadarTrendResult> {
    return this.request<TrendRadarTrendResult>('/trend', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        date_range: dateRange,
        granularity
      })
    });
  }

  /**
   * 情感分析 - 生成用于 AI 情感分析的结构化提示词
   * @param topic 话题关键词
   * @param dateRange 日期范围，格式: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
   * @param limit 返回新闻数量限制
   */
  async analyzeSentiment(
    topic: string, 
    dateRange: { start: string; end: string },
    limit: number = 50
  ): Promise<TrendRadarSentimentResult> {
    return this.request<TrendRadarSentimentResult>('/sentiment', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        date_range: dateRange,
        limit
      })
    });
  }

  /**
   * 关键词共现分析 - 分析哪些关键词经常同时出现
   * @param topic 话题关键词（可选）
   * @param dateRange 日期范围，格式: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
   * @param minFrequency 最小共现频次
   * @param topN 返回TOP N关键词对
   */
  async analyzeCooccurrence(
    topic?: string, 
    dateRange?: { start: string; end: string },
    minFrequency: number = 3,
    topN: number = 20
  ): Promise<TrendRadarCooccurrenceResult> {
    return this.request<TrendRadarCooccurrenceResult>('/cooccurrence', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        date_range: dateRange,
        min_frequency: minFrequency,
        top_n: topN
      })
    });
  }

  /**
   * 获取可用的平台列表
   */
  async getPlatforms(): Promise<{ platforms: string[]; description: string }> {
    return this.request<{ platforms: string[]; description: string }>('/platforms');
  }

  /**
   * 获取可用的数据日期范围
   */
  async getAvailableDates(): Promise<{ dates: string[]; description: string }> {
    return this.request<{ dates: string[]; description: string }>('/available-dates');
  }

  /**
   * 获取最新一批爬取的新闻数据，快速了解当前热点
   * @param platforms 平台ID列表，如 ['zhihu', 'weibo']，不指定则使用所有平台
   * @param limit 返回条数限制，默认50，最大1000
   * @param includeUrl 是否包含URL链接，默认False（节省token）
   */
  async getLatestNews(
    platforms?: string[],
    limit: number = 50,
    includeUrl: boolean = false
  ): Promise<TrendRadarLatestNewsResult> {
    return this.request<TrendRadarLatestNewsResult>('/latest-news', {
      method: 'POST',
      body: JSON.stringify({
        platforms,
        limit,
        include_url: includeUrl
      })
    });
  }

  /**
   * 获取热点话题统计
   * @param topN 返回TOP N话题，默认10
   * @param mode 时间模式
   *   - "daily": 当日累计数据统计
   *   - "current": 最新一批数据统计（默认）
   * @param extractMode 提取模式
   *   - "keywords": 统计预设关注词（基于 config/frequency_words.txt，默认）
   *   - "auto_extract": 自动从新闻标题提取高频词（无需预设，自动发现热点）
   */
  async getTrendingTopics(
    topN: number = 10,
    mode: string = 'current',
    extractMode: string = 'auto_extract'
  ): Promise<TrendRadarTrendingTopicsResult> {
    return this.request<TrendRadarTrendingTopicsResult>('/trending-topics', {
      method: 'POST',
      body: JSON.stringify({
        top_n: topN,
        mode,
        extract_mode: extractMode
      })
    });
  }
}

export const trendRadarApi = new TrendRadarAPI();
