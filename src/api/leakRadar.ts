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
    return this.request<LeakRadarDomainSummary>(`/search/domain/${domain}`);
  }

  /**
   * Search for leaks by domain (Category based)
   */
  async searchDomainCategory(domain: string, category: 'employees' | 'customers' | 'third_parties', limit = 100, offset = 0): Promise<LeakRadarSearchResult> {
    const page = Math.floor(offset / limit) + 1;
    return this.request<LeakRadarSearchResult>(`/search/domain/${domain}/${category}?page=${page}&page_size=${limit}`);
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
   * Search for URLs by domain
   */
  async getDomainUrls(domain: string, limit = 100, offset = 0): Promise<{ items: any[], total: number }> {
    const page = Math.floor(offset / limit) + 1;
    return this.request<{ items: any[], total: number }>(`/search/domain/${domain}/urls?page=${page}&page_size=${limit}`);
  }

  /**
   * Search for subdomains by domain
   */
  async getDomainSubdomains(domain: string, limit = 100, offset = 0): Promise<{ items: any[], total: number }> {
    const page = Math.floor(offset / limit) + 1;
    return this.request<{ items: any[], total: number }>(`/search/domain/${domain}/subdomains?page=${page}&page_size=${limit}`);
  }

  /**
   * Unlock all results for a domain and category
   */
  async unlockDomain(domain: string, category: 'employees' | 'customers' | 'third_parties'): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/search/domain/${domain}/${category}/unlock`, {
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
   * Export domain search results as PDF
   */
  async exportDomainPDF(domain: string): Promise<Blob> {
    const response = await fetch(`${BASE_URL}${API_PREFIX}/search/domain/${domain}/pdf`, {
      headers: {
        'Accept': 'application/pdf',
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'PDF 导出失败';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    return response.blob();
  }

  /**
   * Request CSV export for a domain and category
   * Returns an export_id
   */
  async requestDomainCSV(domain: string, category: 'employees' | 'customers' | 'third_parties' = 'employees'): Promise<{ export_id: number }> {
    return this.request<{ export_id: number }>(`/search/domain/${domain}/${category}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ format: 'csv' }),
    });
  }

  /**
   * Download a prepared export file
   */
  async downloadExport(exportId: number): Promise<Blob> {
    const response = await fetch(`${BASE_URL}${API_PREFIX}/search/export/${exportId}/download`, {
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`下载失败 (${response.status})`);
    }
    return response.blob();
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
