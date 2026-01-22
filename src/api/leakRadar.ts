/**
 * Lysir谍卫 API 客户端
 * 
 * 架构调整：
 * 前端连接到 AWS EC2 上的后端代理服务。
 * 请在 .env 文件中设置 VITE_BACKEND_URL=http://你的EC2公网IP:3000
 */

// 根据环境动态选择API地址
// 开发环境使用本地后端服务器地址
// 生产环境使用Vercel代理，避免CORS问题
const BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001'  // 开发环境使用本地后端
  : '';  // 生产环境使用当前域名，通过Vercel代理访问
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
  blacklisted_value?: string | null;
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
      // console.log(`[LeakRadar API] Using API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
    } else {
      console.warn('[LeakRadar API] No API Key found!');
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
      
      // console.log(`[LeakRadar API] Sending request: ${url}`);
      // console.log(`[LeakRadar API] Request Method: ${options.method || 'GET'}`);
      // console.log(`[LeakRadar API] Request Headers:`, JSON.stringify(headers, null, 2));
      if (options.body) {
        // console.log(`[LeakRadar API] Request Body:`, options.body);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin', // 仅在同域请求中包含凭证，解决CORS问题
      });

      console.log(`[LeakRadar API] Received response: ${response.status} for ${url}`);

      // 获取原始响应文本，用于调试和错误处理
      const responseText = await response.text();
      console.log(`[LeakRadar API] Response Text:`, responseText);
      
      // 检查响应是否为HTML（通常是错误或重定向）
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        throw new Error(`API返回HTML而非JSON：${response.status} ${response.statusText}`);
      }

      // 尝试解析JSON响应，无论响应状态码如何
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        // 处理JSON解析失败
        const errorMsg = jsonError instanceof Error 
          ? jsonError.message 
          : typeof jsonError === 'string' 
            ? jsonError 
            : '未知错误';
        throw new Error(`JSON解析失败：${errorMsg}。响应内容：${responseText}`);
      }

      if (!response.ok) {
        // 处理非2xx响应
        let errorMsg = `请求失败 (${response.status})`;
        if (typeof responseData === 'object' && responseData !== null) {
          // 如果是401错误，不要打印error，改为warn，避免控制台报错干扰
          if (response.status === 401) {
             console.warn(`[LeakRadar API] Authentication failed for ${endpoint}:`, responseData);
          } else {
             console.error(`[LeakRadar API] Error Detail for ${endpoint}:`, responseData);
          }
          // 使用响应中的错误信息，如果有的话
          if (responseData.detail) {
            errorMsg = `${errorMsg}: ${responseData.detail}`;
          } else if (responseData.message) {
            errorMsg = `${errorMsg}: ${responseData.message}`;
          } else {
            errorMsg = `${errorMsg}: ${JSON.stringify(responseData)}`;
          }
        } else {
          errorMsg = `${errorMsg}: ${responseText}`;
        }
        throw new Error(errorMsg);
      }

      // 确保响应数据包含必要字段
      if (typeof responseData === 'object' && responseData !== null) {
        // 为搜索结果添加默认字段，确保兼容性
        if (endpoint === '/search/email' && !responseData.blacklisted_value) {
          responseData.blacklisted_value = null;
        }
      }

      return responseData as T;
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
      
      // 处理401认证错误 - 抛出错误，不再使用模拟数据
      if (msg.includes('401') || msg.includes('Authentication is required')) {
        console.warn('[LeakRadar API] Authentication failed. Please check your API key.');
        throw new Error('API认证失败 (401)。请检查您的API密钥是否配置正确。');
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

  // Mock response method is now commented out as it's no longer used
  // private async getMockResponse<T>(endpoint: string, options: RequestInit): Promise<T> {
  //   console.log(`[LeakRadar API] Generating mock response for ${endpoint}`);
  //   await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

  //   // Handle /search/email
  //   if (endpoint.includes('/search/email')) {
  //     const body = options.body ? JSON.parse(options.body as string) : {};
  //     const email = body.email || 'mock@example.com';
  //     const isEmailInput = email.includes('@');
  //     
  //     // 生成确定的伪随机数，让同一个搜索词每次返回相同结果
  //     const seed = email.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  //     const count = (seed % 20) + 5; // 5-25 results

  //     return {
  //       success: true,
  //       items: Array.from({ length: count }).map((_, i) => {
  //         const sites = ['linkedin.com', 'adobe.com', 'canva.com', 'dropbox.com', 'yahoo.com', 'myspace.com', 'twitter.com', 'vk.com'];
  //         const site = sites[(seed + i) % sites.length];
  //         return {
  //           id: `mock-${seed}-${i}`,
  //           url: `https://${site}`,
  //           username: isEmailInput ? email.split('@')[0] : email,
  //           email: isEmailInput ? email : `${email}@${site}`,
  //           is_email: isEmailInput,
  //           password_plaintext: `Pass${(seed + i).toString(16)}word!`, // Ensure password exists
  //           password_hash: '5f4dcc3b5aa765d61d8327deb882cf99',
  //           hash_type: 'MD5',
  //           website: site,
  //           source: `Collection #${(i % 5) + 1}`,
  //           leaked_at: new Date(Date.now() - ((seed * i * 10000000) % 100000000000)).toISOString(),
  //           fields: ['email', 'password', 'username', 'website']
  //         };
  //       }),
  //       total: count,
  //       page: 1,
  //       page_size: 100,
  //       blacklisted_value: null
  //     } as unknown as T;
  //   }

  //   // Handle /profile
  //   if (endpoint === '/profile') {
  //     return {
  //       success: true,
  //       user: {
  //         username: 'Demo User',
  //         email: 'demo@example.com',
  //         plan: 'Enterprise',
  //         expires_at: '2099-12-31',
  //         quota: {
  //           total: 10000,
  //           used: 123,
  //           remaining: 9877,
  //           reset_at: '2099-12-31'
  //         }
  //       }
  //     } as unknown as T;
  //   }
  //   
  //   // Handle /stats
  //   if (endpoint === '/stats') {
  //       return {
  //           leaks: { 
  //               total: 12345678, 
  //               today: 1234, 
  //               per_week: [
  //                   { week: '2023-W01', count: 100 }, 
  //                   { week: '2023-W02', count: 200 }
  //               ], 
  //               this_week: 5000, 
  //               this_month: 20000 
  //           },
  //           raw_lines: { 
  //               total: 98765432, 
  //               today: 5678, 
  //               per_week: [], 
  //               this_week: 10000, 
  //               this_month: 40000 
  //           }
  //       } as unknown as T;
  //   }

  //   // Handle /search/domain/*
  //   if (endpoint.includes('/search/domain')) {
  //       return {
  //           success: true,
  //           items: Array.from({ length: 10 }).map((_, i) => ({
  //               id: `mock-domain-${i}`,
  //               email: `user${i}@example.com`,
  //               username: `user${i}`,
  //               password_plaintext: 'password123',
  //               source: 'Mock Breach',
  //               leaked_at: new Date().toISOString()
  //           })),
  //           total: 100,
  //           employees_compromised: 42,
  //           third_parties_compromised: 15,
  //           customers_compromised: 120,
  //           employee_passwords: {
  //               total_pass: 42,
  //               too_weak: { qty: 10, perc: 23 },
  //               weak: { qty: 10, perc: 23 },
  //               medium: { qty: 10, perc: 23 },
  //               strong: { qty: 12, perc: 29 }
  //           },
  //           third_parties_passwords: {
  //               total_pass: 15,
  //               too_weak: { qty: 5, perc: 33 },
  //               weak: { qty: 5, perc: 33 },
  //               medium: { qty: 5, perc: 33 },
  //               strong: { qty: 0, perc: 0 }
  //           },
  //           customer_passwords: {
  //               total_pass: 120,
  //               too_weak: { qty: 30, perc: 25 },
  //               weak: { qty: 30, perc: 25 },
  //               medium: { qty: 30, perc: 25 },
  //               strong: { qty: 30, perc: 25 }
  //           },
  //           blacklisted_value: null
  //       } as unknown as T;
  //   }

  //   // Default mock response
  //   return {
  //     success: true,
  //     items: [],
  //     total: 0,
  //     error: 'Mock data for this endpoint is not implemented',
  //     blacklisted_value: null
  //   } as unknown as T;
  // }

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

    // Default to email search for username or other queries
    // As per user feedback, /search/email handles both email and username lookups
    return this.searchByEmail(query, safeLimit, offset);
  }

  /**
   * Search for leaks by email or username
   * @param email Email or username to search
   * @param limit Results per page (1-100)
   * @param offset Offset for pagination
   * @param search Optional free-text filter
   * @param isEmail Optional filter: true=email only, false=username only, null=both
   */
  async searchByEmail(
    email: string, 
    limit = 100, 
    offset = 0,
    search?: string,
    isEmail?: boolean | null
  ): Promise<LeakRadarSearchResult> {
    // 限制单次请求最多100条（根据官方API限制）
    const safeLimit = Math.min(limit, 100);
    const page = Math.floor(offset / safeLimit) + 1;
    
    // 构建请求体 - 注意：根据官方文档，search/email接口需要请求体中的email字段
    const requestBody: any = {
      email,
      page,
      page_size: safeLimit
    };
    
    // 添加可选参数
    if (search !== undefined) {
      requestBody.search = search;
    }
    
    if (isEmail !== undefined && isEmail !== null) {
      requestBody.is_email = isEmail;
    }
    
    try {
      return await this.request<LeakRadarSearchResult>(`/search/email`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
    } catch (error: any) {
      console.error(`[LeakRadar API] Search by email failed:`, error.message);
      
      // 返回模拟数据作为降级方案
      return {
        success: false,
        items: [],
        total: 0,
        page,
        page_size: safeLimit,
        error: error.message,
        // 添加空的blacklisted_value字段以保持兼容性
        blacklisted_value: null
      };
    }
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
    
    // 使用同步解锁端点，因为我们只解锁10条数据，远低于10k的限制
    // 根据API文档，同步端点支持max查询参数来限制解锁数量
    return this.request<{ success: boolean; message?: string }>(`/search/domain/${sanitized}/${category}/unlock?max=10`, {
      method: 'POST'
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
   * Unlock email search results
   * POST /search/email/unlock
   * @param email The email or username that was searched
   */
  async unlockEmailSearch(email: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/search/email/unlock?max=10`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
}

export const leakRadarApi = new LeakRadarAPI();
