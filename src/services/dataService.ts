import { leakRadarApi, type LeakRadarSearchResult } from '../api/leakRadar';

export interface LeakedCredential {
  id: string;
  email: string;
  username: string;
  password_plaintext: string;
  password_hash: string;
  hash_type: string;
  website: string;
  source: string;
  leaked_at: string;
  type: 'Employee' | 'Third-Party' | 'Customer';
  strength: 'Strong' | 'Medium' | 'Weak' | 'Very Weak';
  ip_address?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
  count?: number;
}

export interface DomainSearchSummary {
  domain: string;
  total: number;
  employees: {
    count: number;
    strength: Record<string, number>;
  };
  third_parties: {
    count: number;
    strength: Record<string, number>;
  };
  customers: {
    count: number;
    strength: Record<string, number>;
  };
  urls_count: number;
  subdomains_count: number;
}

export const dataService = {
  /**
   * Search domain leaks using Real API
   */
  /**
   * 清理域名：移除 http(s):// 和 www. 前缀
   */
  sanitizeDomain(domain: string): string {
    return domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
  },

  searchDomain: async (domainInput: string, limit = 100, offset = 0): Promise<{ summary: DomainSearchSummary, credentials: LeakedCredential[] }> => {
    const domain = domainInput.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    try {
      console.log(`[dataService] Searching domain: ${domain}`);
      
      // 1. Get summary and counts from API
      const [apiSummary, urlsRes, subdomainsRes] = await Promise.all([
        leakRadarApi.getDomainSummary(domain),
        leakRadarApi.getDomainUrls(domain, 1, 0).catch(() => ({ total: 0 })),
        leakRadarApi.getDomainSubdomains(domain, 1, 0).catch(() => ({ total: 0 })),
      ]);
      
      // 2. 自动解锁域名 (方案 B: 增加详细调试日志)
      try {
        console.log(`[Debug] 准备自动解锁域名分类: ${domain}`);
        const categories: Array<'employees' | 'customers' | 'third_parties'> = ['employees', 'customers', 'third_parties'];
        
        // 依次尝试解锁，并记录每个请求的结果
        categories.forEach(cat => {
          leakRadarApi.unlockDomain(domain, cat)
            .then(res => {
              console.log(`[Debug] 解锁成功 (${cat}):`, res);
            })
            .catch(err => {
              console.error(`[Debug] 解锁失败 (${cat}):`, err.message);
            });
        });
      } catch (e) {
        console.error(`[Debug] 自动解锁流程发生异常:`, e);
      }
      
      // 3. Fetch some credentials for display (we combine them for the table)
      // For performance, we fetch from each category based on limit and offset
      const itemsPerCat = Math.floor(limit / 3);
      const [empRes, custRes, thirdRes] = await Promise.all([
        leakRadarApi.searchDomainCategory(domain, 'employees', itemsPerCat, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'customers', itemsPerCat, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'third_parties', limit - (2 * itemsPerCat), offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
      ]);

      const transformItem = (item: any, type: LeakedCredential['type']): LeakedCredential => {
        // Map strength number to string
        let strength: LeakedCredential['strength'] = 'Medium';
        const s = item.password_strength;
        if (s >= 8) strength = 'Strong';
        else if (s >= 5) strength = 'Medium';
        else if (s >= 3) strength = 'Weak';
        else strength = 'Very Weak';

        return {
          id: item.id || `leak-${Math.random()}`,
          email: item.email || item.username || '',
          username: item.username || 'N/A',
          password_plaintext: item.password_plaintext || item.password || '********',
          password_hash: item.password_hash || '',
          hash_type: item.hash_type || 'Unknown',
          website: item.website || item.url || domain || 'N/A',
          source: item.source || 'Leak Database',
          leaked_at: item.leaked_at || item.added_at || new Date().toISOString(),
          type,
          strength,
          ip_address: item.ip_address,
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
          city: item.city,
          country: item.country
        };
      };

      const credentials: LeakedCredential[] = [
        ...empRes.items.map(item => transformItem(item, 'Employee')),
        ...custRes.items.map(item => transformItem(item, 'Customer')),
        ...thirdRes.items.map(item => transformItem(item, 'Third-Party')),
      ];

      const summary: DomainSearchSummary = {
        domain,
        total: apiSummary.employees_compromised + apiSummary.customers_compromised + apiSummary.third_parties_compromised,
        employees: {
          count: apiSummary.employees_compromised,
          strength: {
            strong: apiSummary.employee_passwords.strong.qty,
            medium: apiSummary.employee_passwords.medium.qty,
            weak: apiSummary.employee_passwords.weak.qty,
            very_weak: apiSummary.employee_passwords.too_weak.qty,
          }
        },
        third_parties: {
          count: apiSummary.third_parties_compromised,
          strength: {
            strong: apiSummary.third_parties_passwords.strong.qty,
            medium: apiSummary.third_parties_passwords.medium.qty,
            weak: apiSummary.third_parties_passwords.weak.qty,
            very_weak: apiSummary.third_parties_passwords.too_weak.qty,
          }
        },
        customers: {
          count: apiSummary.customers_compromised,
          strength: {
            strong: apiSummary.customer_passwords.strong.qty,
            medium: apiSummary.customer_passwords.medium.qty,
            weak: apiSummary.customer_passwords.weak.qty,
            very_weak: apiSummary.customer_passwords.too_weak.qty,
          }
        },
        urls_count: urlsRes.total || 0,
        subdomains_count: subdomainsRes.total || 0,
      };

      return { summary, credentials };
    } catch (error) {
      console.error('[dataService] Error searching domain:', error);
      throw error;
    }
  },

  /**
   * Search specific category leaks with pagination
   */
  searchCategory: async (domain: string, category: 'employees' | 'customers' | 'third_parties' | 'urls' | 'subdomains', limit = 100, offset = 0): Promise<LeakedCredential[]> => {
    try {
      if (category === 'urls') {
        const res = await leakRadarApi.getDomainUrls(domain, limit, offset);
        return res.items.map(item => ({
          id: `url-${Math.random()}`,
          email: '',
          username: '',
          password_plaintext: '',
          password_hash: '',
          hash_type: '',
          website: item.url || item.website || '',
          source: '',
          leaked_at: '',
          type: 'Employee',
          strength: 'Medium',
          count: item.count || 0
        }));
      }

      if (category === 'subdomains') {
        const res = await leakRadarApi.getDomainSubdomains(domain, limit, offset);
        return res.items.map(item => ({
          id: `sub-${Math.random()}`,
          email: '',
          username: '',
          password_plaintext: '',
          password_hash: '',
          hash_type: '',
          website: item.subdomain || item.domain || '',
          source: '',
          leaked_at: '',
          type: 'Employee',
          strength: 'Medium',
          count: item.count || 0
        }));
      }

      const res = await leakRadarApi.searchDomainCategory(domain, category, limit, offset);
      
      const transformItem = (item: any, type: LeakedCredential['type']): LeakedCredential => {
        let strength: LeakedCredential['strength'] = 'Medium';
        const s = item.password_strength;
        if (s >= 8) strength = 'Strong';
        else if (s >= 5) strength = 'Medium';
        else if (s >= 3) strength = 'Weak';
        else strength = 'Very Weak';

        return {
          id: item.id || `leak-${Math.random()}`,
          email: item.email || item.username || '',
          username: item.username || 'N/A',
          password_plaintext: item.password_plaintext || item.password || '********',
          password_hash: item.password_hash || '',
          hash_type: item.hash_type || 'Unknown',
          website: item.website || item.url || domain || 'N/A',
          source: item.source || 'Leak Database',
          leaked_at: item.leaked_at || item.added_at || new Date().toISOString(),
          type,
          strength,
          ip_address: item.ip_address,
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
          city: item.city,
          country: item.country
        };
      };

      const typeMap = {
        'employees': 'Employee',
        'customers': 'Customer',
        'third_parties': 'Third-Party'
      } as const;

      return res.items.map(item => transformItem(item, typeMap[category as keyof typeof typeMap]));
    } catch (error) {
      console.error(`[dataService] Error searching category ${category}:`, error);
      return [];
    }
  }
};
