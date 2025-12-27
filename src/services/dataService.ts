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
  searchDomain: async (domain: string, _limit = 100, _offset = 0): Promise<{ summary: DomainSearchSummary, credentials: LeakedCredential[] }> => {
    try {
      console.log(`[dataService] Searching domain: ${domain}`);
      
      // 1. Get summary and counts from API
      const [apiSummary, urlsRes, subdomainsRes] = await Promise.all([
        leakRadarApi.getDomainSummary(domain),
        leakRadarApi.getDomainUrls(domain, 1, 0).catch(() => ({ total: 0 })),
        leakRadarApi.getDomainSubdomains(domain, 1, 0).catch(() => ({ total: 0 })),
      ]);
      
      // 2. 自动解锁域名 (用户要求搜索后自动解锁)
      try {
        console.log(`[dataService] Auto-unlocking domain categories: ${domain}`);
        // 解锁所有分类，不等待它们完成以加快响应速度，但通过 Promise.allSettled 确保尝试过
        Promise.allSettled([
          leakRadarApi.unlockDomain(domain, 'employees'),
          leakRadarApi.unlockDomain(domain, 'customers'),
          leakRadarApi.unlockDomain(domain, 'third_parties')
        ]).then(results => {
          results.forEach((res, i) => {
            const cats = ['employees', 'customers', 'third_parties'];
            if (res.status === 'rejected') {
              console.warn(`[dataService] Auto-unlock failed for ${cats[i]}:`, res.reason);
            }
          });
        });
      } catch (e) {
        console.warn(`[dataService] Auto-unlock process error:`, e);
      }
      
      // 3. Fetch some credentials for display (we combine them for the table)
      // For performance, we fetch a few from each category
      const [empRes, custRes, thirdRes] = await Promise.all([
        leakRadarApi.searchDomainCategory(domain, 'employees', 20, 0).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'customers', 50, 0).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'third_parties', 30, 0).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
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
          website: item.url || domain,
          source: item.source || 'LeakRadar',
          leaked_at: item.added_at || new Date().toISOString(),
          type,
          strength,
          ip_address: item.ip_address
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
        subdomains_count: subdomainsRes.total || 0
      };

      return { summary, credentials };
    } catch (error: any) {
      console.error('[dataService] API Search failed:', error);
      throw error;
    }
  },

  /**
   * Search specific category leaks with pagination
   */
  searchCategory: async (domain: string, category: 'employees' | 'customers' | 'third_parties', limit = 100, offset = 0): Promise<LeakedCredential[]> => {
    try {
      console.log(`[dataService] Searching category ${category} for domain: ${domain}, offset: ${offset}`);
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
          website: item.website || item.url || 'N/A',
          source: item.source || 'Leak Database',
          leaked_at: item.leaked_at || item.added_at || new Date().toISOString(),
          type: type,
          strength: strength,
          ip_address: item.ip_address,
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
          city: item.city,
          country: item.country
        };
      };

      const typeMap: Record<string, LeakedCredential['type']> = {
        'employees': 'Employee',
        'customers': 'Customer',
        'third_parties': 'Third-Party'
      };

      return (res.items || []).map(item => transformItem(item, typeMap[category]));
    } catch (error) {
      console.error(`[dataService] Category search failed:`, error);
      return [];
    }
  }
};
