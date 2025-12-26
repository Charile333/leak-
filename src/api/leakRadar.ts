/**
 * LeakRadar API 客户端
 * 
 * 架构调整：
 * 前端连接到 AWS EC2 上的后端代理服务。
 * 请在 .env 文件中设置 VITE_BACKEND_URL=http://你的EC2公网IP:3000
 */

// 切换到方案 B：Vercel Serverless 后端
// 在本地开发时，Vercel 会自动处理 /api 路由
const BASE_URL = window.location.origin;

export interface LeakRadarProfile {
// ... (保持接口定义不变)
  success: boolean;
  user?: {
    username: string;
    email: string;
    plan: string;
    expires_at: string;
    quota: {
      total: number;
      used: number;
      remaining: number;
      reset_at: string;
    };
  };
  error?: string;
}

export interface LeakRadarSearchResult {
  success: boolean;
  found: number;
  results: Array<{
    email: string;
    username?: string;
    password_plaintext?: string;
    password_hash?: string;
    hash_type?: string;
    website?: string;
    source?: string;
    leaked_at?: string;
    ip_address?: string;
    // 官方文档可能返回的额外字段
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    zip?: string;
    country?: string;
    fields?: string[];
  }>;
  error?: string;
}

export interface LeakRadarStats {
  leaks: {
    total: number;
    today: number;
    per_week: number[];
    this_week: number;
    this_month: number;
  };
  raw_lines: {
    total: number;
    today: number;
    per_week: number[];
    this_week: number;
    this_month: number;
  };
}

class LeakRadarAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `请求失败 (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (e) {
          // 如果不是 JSON 格式，尝试读取文本
          const text = await response.text().catch(() => '');
          if (text) errorMsg += `: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      return response.json();
    } catch (error: any) {
      // 记录详细错误方便调试
      console.warn(`[LeakRadar API] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get user profile and quota information
   * Tag: Profile
   */
  async getProfile(): Promise<LeakRadarProfile> {
    return this.request<LeakRadarProfile>('/api/profile');
  }

  /**
   * Search for leaks by domain
   */
  async searchByDomain(domain: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    return this.request<LeakRadarSearchResult>(`/api/search?domain=${domain}&limit=${limit}&offset=${offset}`);
  }

  /**
   * Search for leaks by email
   */
  async searchByEmail(email: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    return this.request<LeakRadarSearchResult>(`/api/search/email?query=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`);
  }

  /**
   * Get global statistics
   * Tag: Stats
   */
  async getStats(): Promise<LeakRadarStats> {
    return this.request<LeakRadarStats>('/api/stats');
  }
}

export const leakRadarApi = new LeakRadarAPI();
