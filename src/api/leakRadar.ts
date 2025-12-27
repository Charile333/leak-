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
const API_PREFIX = '/api/leakradar';

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
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      // Ensure endpoint starts with / if not already
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${BASE_URL}${API_PREFIX}${formattedEndpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `请求失败 (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorData.detail || errorMsg;
          if (Array.isArray(errorMsg)) errorMsg = JSON.stringify(errorMsg);
        } catch (e) {
          const text = await response.text().catch(() => '');
          if (text) errorMsg += `: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      return response.json();
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
    const sanitized = this.sanitizeDomain(domain);
    const page = Math.floor(offset / limit) + 1;
    return this.request<LeakRadarSearchResult>(`/search/domain/${sanitized}/${category}?page=${page}&page_size=${limit}`);
  }

  private async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const headers = {
      ...options.headers,
    };

    try {
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${BASE_URL}${API_PREFIX}${formattedEndpoint}`, {
        ...options,
        headers,
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
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    if (isEmail) {
      return this.searchByEmail(query, limit, offset);
    }
    
    // If it looks like a domain or just a keyword
    const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(query);
    if (isDomain) {
      // For domain, we might want a summary or a specific category. 
      // Here we'll default to 'employees' as it's the most common search target
      return this.searchDomainCategory(query, 'employees', limit, offset);
    }

    // Default to advanced search if available, or fallback to email search (as it might be a partial email)
    return this.request<LeakRadarSearchResult>(`/search/advanced`, {
      method: 'POST',
      body: JSON.stringify({ query, page: Math.floor(offset / limit) + 1, page_size: limit })
    });
  }

  /**
   * Search for leaks by email
   */
  async searchByEmail(email: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    const page = Math.floor(offset / limit) + 1;
    return this.request<LeakRadarSearchResult>(`/search/email`, {
      method: 'POST',
      body: JSON.stringify({ email, page, page_size: limit })
    });
  }

  /**
   * Search for leaks by hash
   */
  async searchByHash(hash: string, limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    return this.request<LeakRadarSearchResult>(`/search/advanced`, {
      method: 'POST',
      body: JSON.stringify({ hash, page: Math.floor(offset / limit) + 1, page_size: limit })
    });
  }

  /**
   * Search for URLs by domain
   */
  async getDomainUrls(domain: string, limit = 100, offset = 0): Promise<{ items: any[], total: number }> {
    const sanitized = this.sanitizeDomain(domain);
    const page = Math.floor(offset / limit) + 1;
    return this.request<{ items: any[], total: number }>(`/search/domain/${sanitized}/urls?page=${page}&page_size=${limit}`);
  }

  /**
   * Search for subdomains by domain
   */
  async getDomainSubdomains(domain: string, limit = 100, offset = 0): Promise<{ items: any[], total: number }> {
    const sanitized = this.sanitizeDomain(domain);
    const page = Math.floor(offset / limit) + 1;
    return this.request<{ items: any[], total: number }>(`/search/domain/${sanitized}/subdomains?page=${page}&page_size=${limit}`);
  }

  /**
   * 获取域名的完整泄露数据（用于前端生成 CSV）
   */
  async getLeaksFull(domain: string, category: 'employees' | 'customers' | 'third_parties' | 'all' = 'all'): Promise<LeakRadarSearchResult> {
    const sanitized = this.sanitizeDomain(domain);
    // 使用用户提供的路径格式：/leaks/@domain?type=category
    const type = category === 'all' ? '' : `?type=${category}`;
    return this.request<LeakRadarSearchResult>(`/leaks/@${sanitized}${type}`);
  }

  /**
   * Unlock all results for a domain and category
   */
  async unlockDomain(domain: string, category: 'employees' | 'customers' | 'third_parties'): Promise<{ success: boolean; message?: string }> {
    const sanitized = this.sanitizeDomain(domain);
    return this.request<{ success: boolean; message?: string }>(`/search/domain/${sanitized}/${category}/unlock`, {
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
  async exportDomainPDF(domainInput: string): Promise<Blob> {
    const domain = this.sanitizeDomain(domainInput);
    return this.requestBlob(`/search/domain/${domain}/report`, {
      method: 'POST',
      headers: {
        'Accept': 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ format: 'pdf' }),
    });
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
