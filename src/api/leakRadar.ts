/**
 * Lysir谍卫 API 客户端
 * 
 * 架构调整：
 * 前端连接到 AWS EC2 上的后端代理服务。
 * 请在 .env 文件中设置 VITE_BACKEND_URL=http://你的EC2公网IP:3000
 */

// 根据环境动态选择API地址
// 开发环境强制使用本地后端服务器地址，确保API请求正确路由
// 生产环境使用当前域名的/api路径（Vercel部署的API函数）
const BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001'  // 开发环境使用本地后端
  : '';  // 生产环境使用当前域名，无需额外前缀
const API_PREFIX = '/api';

export interface LeakRadarProfile {
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

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    username: string;
    email: string;
  };
  error?: string;
}

export interface LeakRadarSearchResult {
  success: boolean;
  items: Array<{
    id: string;
    url: string;
    username: string;
    password?: string;
    password_strength?: number;
    unlocked?: boolean;
    is_email?: boolean;
    added_at: string;
    email?: string;
    password_plaintext?: string;
    password_hash?: string;
    hash_type?: string;
    website?: string;
    source?: string;
    leaked_at?: string;
    ip_address?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    zip?: string;
    country?: string;
    fields?: string[];
  }>;
  total: number;
  total_unlocked?: number;
  page?: number;
  page_size?: number;
  error?: string;
}

export interface LeakRadarDomainSummary {
  employees_compromised: number;
  third_parties_compromised: number;
  customers_compromised: number;
  employee_passwords: {
    total_pass: number;
    too_weak: { qty: number; perc: number };
    weak: { qty: number; perc: number };
    medium: { qty: number; perc: number };
    strong: { qty: number; perc: number };
  };
  third_parties_passwords: {
    total_pass: number;
    too_weak: { qty: number; perc: number };
    weak: { qty: number; perc: number };
    medium: { qty: number; perc: number };
    strong: { qty: number; perc: number };
  };
  customer_passwords: {
    total_pass: number;
    too_weak: { qty: number; perc: number };
    weak: { qty: number; perc: number };
    medium: { qty: number; perc: number };
    strong: { qty: number; perc: number };
  };
  blacklisted_value: any;
}

export interface LeakRadarStats {
  leaks: {
    total: number;
    today: number;
    per_week: Array<{ week: string; count: number }>;
    this_week: number;
    this_month: number;
  };
  raw_lines: {
    total: number;
    today: number;
    per_week: Array<{ week: string; count: number }>;
    this_week: number;
    this_month: number;
  };
}

class LeakRadarAPI {
  
  private sanitizeDomain(domain: string): string {
    return domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 优先使用实例中的API密钥，其次使用环境变量
    const apiKey = import.meta.env.VITE_LEAKRADAR_API_KEY || import.meta.env.LEAKRADAR_API_KEY;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 添加API密钥到请求头
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-Key'] = apiKey;
    }

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
      
      console.log(`[LeakRadar API] Sending request: ${url}`);
      console.log(`[LeakRadar API] Using API Key: ${apiKey ? 'Yes' : 'No'}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin', // 仅在同域请求中包含凭证，解决CORS问题
      });

      console.log(`[LeakRadar API] Received response: ${response.status} for ${url}`);

      // 获取原始响应文本，用于调试和错误处理
      const responseText = await response.text();
      console.log(`[LeakRadar API] Response Text (first 100 chars):`, responseText.substring(0, 100));
      
      // 检查响应是否为HTML（通常是错误或重定向）
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        throw new Error(`API返回HTML而非JSON：${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        let errorMsg = `请求失败 (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          console.error(`[LeakRadar API] Error Detail for ${endpoint}:`, errorData);
          // 将错误详情转为字符串，方便在 Error 对象中查看
          errorMsg = `${errorMsg}: ${typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData)}`;
        } catch (e) {
          console.error(`[LeakRadar API] Raw Error Text for ${endpoint}:`, responseText);
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
      
      console.error(`[LeakRadar API] Request to ${endpoint} error:`, msg);
      
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
   * Get user profile and quota information
   */
  async getProfile(): Promise<LeakRadarProfile> {
    return this.request<LeakRadarProfile>('/profile');
  }

  /**
   * Get domain search summary
   */
  async getDomainSummary(domain: string): Promise<LeakRadarDomainSummary> {
    const sanitized = this.sanitizeDomain(domain);
    return this.request<LeakRadarDomainSummary>(`/search/domain/${sanitized}`);
  }

  /**
   * Search for leaks by domain (Category based)
   */
  async searchDomainCategory(domain: string, category: 'employees' | 'customers' | 'third_parties', limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    // 限制单次请求最多1000条（根据API实际限制调整）
    const safeLimit = Math.min(limit, 1000);
    const sanitized = this.sanitizeDomain(domain);
    const page = Math.floor(offset / safeLimit) + 1;
    return this.request<LeakRadarSearchResult>(`/search/domain/${sanitized}/${category}?page=${page}&page_size=${safeLimit}`);
  }

  private async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    // 优先使用实例中的API密钥，其次使用环境变量
    const apiKey = import.meta.env.VITE_LEAKRADAR_API_KEY || import.meta.env.LEAKRADAR_API_KEY;
    const headers: Record<string, string> = {};

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${BASE_URL}${API_PREFIX}${formattedEndpoint}`, {
        ...options,
        headers,
        credentials: 'same-origin', // 仅在同域请求中包含凭证，解决CORS问题
      });

      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`);
      }

      return response.blob();
    } catch (error: any) {
      console.error(`[LeakRadar API] Blob Request to ${endpoint} error:`, error.message);
      throw error;
    }
  }

  /**
   * Search for leaks by general query (auto-detects domain or email)
   */
  async search(query: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    // 限制单次请求最多1000条（根据API实际限制调整）
    const safeLimit = Math.min(limit, 1000);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    if (isEmail) {
      return this.searchByEmail(query, safeLimit, offset);
    }
    
    // If it looks like a domain or just a keyword
    const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(query);
    if (isDomain) {
      // For domain, we might want a summary or a specific category. 
      // Here we'll default to 'employees' as it's the most common search target
      return this.searchDomainCategory(query, 'employees', safeLimit, offset);
    }

    // Default to advanced search if available, or fallback to email search (as it might be a partial email)
    return this.request<LeakRadarSearchResult>(`/search/advanced`, {
      method: 'POST',
      body: JSON.stringify({ query, page: Math.floor(offset / safeLimit) + 1, page_size: safeLimit })
    });
  }

  /**
   * Search for leaks by email
   */
  async searchByEmail(email: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    // 限制单次请求最多1000条（根据API实际限制调整）
    const safeLimit = Math.min(limit, 1000);
    const page = Math.floor(offset / safeLimit) + 1;
    return this.request<LeakRadarSearchResult>(`/search/email`, {
      method: 'POST',
      body: JSON.stringify({ email, page, page_size: safeLimit })
    });
  }

  /**
   * Search for leaks by hash
   */
  async searchByHash(hash: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    // 限制单次请求最多1000条（根据API实际限制调整）
    const safeLimit = Math.min(limit, 1000);
    return this.request<LeakRadarSearchResult>(`/search/advanced`, {
      method: 'POST',
      body: JSON.stringify({ hash, page: Math.floor(offset / safeLimit) + 1, page_size: safeLimit })
    });
  }

  /**
   * Search for URLs by domain
   */
  async getDomainUrls(domain: string, limit = 100, offset = 0): Promise<{ items: any[], total: number }> {
    // 限制单次请求最多1000条（根据API实际限制调整）
    const safeLimit = Math.min(limit, 1000);
    const sanitized = this.sanitizeDomain(domain);
    const page = Math.floor(offset / safeLimit) + 1;
    return this.request<{ items: any[], total: number }>(`/search/domain/${sanitized}/urls?page=${page}&page_size=${safeLimit}`);
  }

  /**
   * Search for subdomains by domain
   */
  async getDomainSubdomains(domain: string, limit = 100, offset = 0): Promise<{ items: any[], total: number }> {
    // 限制单次请求最多1000条（根据API实际限制调整）
    const safeLimit = Math.min(limit, 1000);
    const sanitized = this.sanitizeDomain(domain);
    const page = Math.floor(offset / safeLimit) + 1;
    return this.request<{ items: any[], total: number }>(`/search/domain/${sanitized}/subdomains?page=${page}&page_size=${safeLimit}`);
  }

  /**
   * 获取域名的完整泄露数据（用于前端生成 CSV）
   */
  async getLeaksFull(domain: string, category: 'employees' | 'customers' | 'third_parties' | 'all' = 'all'): Promise<LeakRadarSearchResult> {
    const sanitized = this.sanitizeDomain(domain);
    // 方案 1: 尝试最原始的 search 路径，因为它在仪表盘显示时是正常的
    const path = category === 'all' 
      ? `/search/domain/${sanitized}`
      : `/search/domain/${sanitized}/${category}`;
    
    console.log(`[Debug] Frontend CSV Export requesting path: ${path}`);
    // 限制单次请求最多1000条（根据API实际限制调整）
    return this.request<LeakRadarSearchResult>(`${path}?page=1&page_size=1000`);
  }

  /**
   * Unlock all results for a domain and category
   * 使用异步任务端点，解决 "Too many unlocks" 错误
   */
  async unlockDomain(domain: string, category: 'employees' | 'customers' | 'third_parties'): Promise<{ success: boolean; message?: string }> {
    const sanitized = this.sanitizeDomain(domain);
    
    // 根据 API 错误提示，使用异步任务端点
    // 错误信息："Too many unlocks for synchronous endpoint (>10k). Use /search/domain/{domain}/{leak_type}/unlock/task."
    return this.request<{ success: boolean; message?: string }>(`/search/domain/${sanitized}/${category}/unlock/task`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  /**
   * Get global statistics
   */
  async getStats(): Promise<LeakRadarStats> {
    return this.request<LeakRadarStats>('/stats');
  }

  /**
   * 登录到后端服务
   * @param email 邮箱
   * @param password 密码
   * @returns 登录响应，包含token和用户信息
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  }



  /**
   * Export unlocked leaks for the current profile
   * Optional query to filter results
   */
  async exportUnlockedLeaks(format: 'csv' | 'json' | 'txt' = 'csv', query?: string): Promise<Blob> {
    return this.requestBlob('/profile/unlocked/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ format, query }),
    });
  }

  /**
   * Export domain search results as PDF
   */
  /**
   * Export domain search results as PDF with custom settings
   * @param domainInput - The domain to search
   * @param options - Custom options for the report
   */
  async exportDomainPDF(domainInput: string, options?: {
    language?: 'en' | 'zh-CN';
    logoUrl?: string;
    title?: string;
  }): Promise<Blob> {
    const domain = this.sanitizeDomain(domainInput);
    const endpoint = `/search/domain/${domain}/report`;
    
    // 添加调试日志，输出完整URL
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${BASE_URL}${API_PREFIX}${formattedEndpoint}`;
    console.log(`[Debug] 生成PDF请求URL: ${fullUrl}`);
    
    // 尝试使用request方法发送请求，获取更详细的错误信息
    try {
      return this.requestBlob(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'pdf',
          language: options?.language || 'zh-CN', // 默认中文
          logo_url: options?.logoUrl,
          custom_title: options?.title
        }),
      });
    } catch (error: any) {
      console.error(`[Debug] PDF生成失败详情:`, error);
      console.error(`[Debug] 请求URL: ${fullUrl}`);
      console.error(`[Debug] 请求参数:`, JSON.stringify({
        format: 'pdf',
        language: options?.language || 'zh-CN',
        logo_url: options?.logoUrl,
        custom_title: options?.title
      }));
      throw error;
    }
  }

  /**
   * Request an export for a domain (PDF, CSV, etc.)
   * 根据官方文档: POST /search/domain/{domain}/{leak_type}/export?format=csv
   */
  async requestDomainExport(
    domainInput: string, 
    format: 'pdf' | 'csv' | 'json' = 'pdf',
    category: 'employees' | 'customers' | 'third_parties' | 'all' = 'all'
  ): Promise<{ export_id: number }> {
    const domain = this.sanitizeDomain(domainInput);
    // 官方端点: /search/domain/{domain}/{leak_type}/export?format=csv
    return this.request<{ export_id: number }>(`/search/domain/${domain}/${category}/export?format=${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Request CSV export for a domain and category (Legacy wrapper)
   * Returns an export_id
   */
  async requestDomainCSV(domainInput: string, category: 'employees' | 'customers' | 'third_parties' = 'employees'): Promise<{ export_id: number }> {
    return this.requestDomainExport(domainInput, 'csv', category);
  }

  /**
   * Get export status
   * 官方端点: GET /exports/{export_id}
   */
  async getExportStatus(exportId: number): Promise<{ status: 'pending' | 'success' | 'failed'; download_url?: string }> {
    // 尝试同时支持 /exports/{id} 和 /search/export/{id} (通过代理自动探测)
    return this.request<{ status: 'pending' | 'success' | 'failed'; download_url?: string }>(`/exports/${exportId}`);
  }

  /**
   * Download a prepared export file
   * 官方端点: GET /exports/{export_id}/download
   */
  async downloadExport(exportId: number): Promise<Blob> {
    return this.requestBlob(`/exports/${exportId}/download`, {
      headers: {
        'Accept': '*/*',
      },
    });
  }

  /**
   * Export domain search results as CSV (Deprecated: use request + download instead)
   */
  async exportDomainCSV(domain: string, category: 'employees' | 'customers' | 'third_parties' = 'employees'): Promise<Blob> {
    const res = await this.requestDomainCSV(domain, category);
    // Give it a small delay for backend to prepare
    await new Promise(r => setTimeout(r, 2000));
    return this.downloadExport(res.export_id);
  }
}

export const leakRadarApi = new LeakRadarAPI();
