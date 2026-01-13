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

// 解锁状态缓存，避免重复解锁
// 使用sessionStorage持久化缓存，避免页面刷新后缓存丢失
class UnlockCache {
  private readonly CACHE_KEY = 'leakradar_unlock_cache';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 缓存有效期：30分钟
  
  get(domain: string): { unlocked: boolean; timestamp: number } | undefined {
    try {
      const cacheStr = sessionStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return undefined;
      
      const cache = JSON.parse(cacheStr) as Record<string, { unlocked: boolean; timestamp: number }>;
      const entry = cache[domain];
      if (!entry) return undefined;
      
      // 检查缓存是否过期
      if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
        this.remove(domain);
        return undefined;
      }
      
      return entry;
    } catch (e) {
      console.error('[UnlockCache] Get cache error:', e);
      return undefined;
    }
  }
  
  set(domain: string, value: { unlocked: boolean; timestamp: number }): void {
    try {
      const cacheStr = sessionStorage.getItem(this.CACHE_KEY);
      const cache = cacheStr ? JSON.parse(cacheStr) as Record<string, { unlocked: boolean; timestamp: number }> : {};
      
      cache[domain] = value;
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      console.log(`[UnlockCache] 缓存已更新: 域名 ${domain}, 状态: ${value.unlocked}, 时间: ${new Date(value.timestamp).toLocaleString()}`);
    } catch (e) {
      console.error('[UnlockCache] Set cache error:', e);
    }
  }
  
  remove(domain: string): void {
    try {
      const cacheStr = sessionStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return;
      
      const cache = JSON.parse(cacheStr) as Record<string, { unlocked: boolean; timestamp: number }>;
      delete cache[domain];
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('[UnlockCache] Remove cache error:', e);
    }
  }
}

const unlockCache = new UnlockCache();
// 删除旧的常量定义，因为现在使用UnlockCache类
// const CACHE_DURATION = 30 * 60 * 1000;

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

  searchDomain: async (domainInput: string, limit = 10, offset = 0): Promise<{ summary: DomainSearchSummary, credentials: LeakedCredential[] }> => {
    const domain = domainInput.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    try {
      // 检查解锁缓存，避免重复解锁
      const now = Date.now();
      const cached = unlockCache.get(domain);
      const isUnlocked = cached?.unlocked === true;
      
      if (!isUnlocked) {
        // 并行解锁三个分类，提高解锁效率
        await Promise.all([
          leakRadarApi.unlockDomain(domain, 'employees'),
          leakRadarApi.unlockDomain(domain, 'customers'),
          leakRadarApi.unlockDomain(domain, 'third_parties')
        ]).catch(() => {
          // 忽略解锁失败，继续执行
        });
        
        // 更新缓存，标记为已解锁
        unlockCache.set(domain, { unlocked: true, timestamp: now });
      }

          // 并行获取所有数据，提高搜索速度
      const [apiSummary, urlsRes, subdomainsRes, empRes, custRes, thirdRes] = await Promise.all([
        leakRadarApi.getDomainSummary(domain),
        leakRadarApi.getDomainUrls(domain, 1, 0).catch(() => ({ total: 0 })),
        leakRadarApi.getDomainSubdomains(domain, 1, 0).catch(() => ({ total: 0 })),
        leakRadarApi.searchDomainCategory(domain, 'employees', limit, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'customers', limit, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'third_parties', limit, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
      ]);
      
      // 限制每个分类返回的数据量为limit
      empRes.items = empRes.items.slice(0, limit);
      custRes.items = custRes.items.slice(0, limit);
      thirdRes.items = thirdRes.items.slice(0, limit);

      const transformItem = (item: any, type: LeakedCredential['type']): LeakedCredential => {
        // Map strength number to string
        let strength: LeakedCredential['strength'] = 'Medium';
        const s = item.password_strength;
        if (s >= 8) strength = 'Strong';
        else if (s >= 5) strength = 'Medium';
        else if (s >= 3) strength = 'Weak';
        else strength = 'Very Weak';

        // 官方API使用is_email字段来标识是否为邮箱
        const isEmail = item.is_email === true;
        const credentialValue = item.email || item.username || item.user || item.account || '';

        return {
          id: item.id || `leak-${Math.random()}`,
          email: isEmail ? credentialValue : '',
          username: isEmail ? (item.username || 'N/A') : credentialValue,
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
   * 直接调用API获取数据，不包含解锁步骤
   */
  searchCategory: async (domainInput: string, category: 'employees' | 'customers' | 'third_parties' | 'urls' | 'subdomains', limit = 10, offset = 0): Promise<LeakedCredential[]> => {
    try {
      // 统一处理domain，确保缓存键一致
      const domain = domainInput.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
      
      // URL和subdomains分类不需要解锁，直接获取数据
      if (category === 'urls' || category === 'subdomains') {
        if (category === 'urls') {
          // 使用专门的getDomainUrls方法获取URL数据
          const urlsRes = await leakRadarApi.getDomainUrls(domain, limit, offset).catch(() => ({ items: [], total: 0 }));
          
          return urlsRes.items.map((urlItem: any, index: number) => {
            let url = '';
            let countValue = 1;
            
            if (typeof urlItem === 'string') {
              url = urlItem;
            } else if (typeof urlItem === 'object' && urlItem !== null) {
              url = urlItem.url || urlItem.link || urlItem.href || urlItem.address || '';
              
              // 检查API返回的数据结构，寻找出现次数相关字段
              const possibleCountFields = ['count', 'times', 'occurrences', 'frequency', 'appearances'];
              for (const field of possibleCountFields) {
                if (typeof urlItem[field] === 'number') {
                  countValue = urlItem[field];
                  break;
                }
              }
              
              // 特殊情况：如果API返回的是类似 { "https://example.com": 5 } 这样的键值对
              if (countValue === 1 && Object.keys(urlItem).length === 1 && typeof urlItem[Object.keys(urlItem)[0]] === 'number') {
                const key = Object.keys(urlItem)[0];
                url = key;
                countValue = urlItem[key];
              }
            }
            
            return {
              id: `url-${index}-${Math.random()}`,
              email: '',
              username: '',
              password_plaintext: '',
              password_hash: '',
              hash_type: '',
              website: url || urlItem || '',
              source: '',
              leaked_at: '',
              type: 'Employee',
              strength: 'Medium',
              count: countValue
            };
          });
        }

        if (category === 'subdomains') {
          // 使用专门的getDomainSubdomains方法获取子域名数据
          const subdomainsRes = await leakRadarApi.getDomainSubdomains(domain, limit, offset).catch(() => ({ items: [], total: 0 }));
          
          return subdomainsRes.items.map((subdomainItem: any, index: number) => {
            let subdomain = '';
            let countValue = 1;
            
            if (typeof subdomainItem === 'string') {
              subdomain = subdomainItem;
            } else if (typeof subdomainItem === 'object' && subdomainItem !== null) {
              subdomain = subdomainItem.subdomain || subdomainItem.domain || subdomainItem.name || '';
              
              // 检查API返回的数据结构，寻找出现次数相关字段
              const possibleCountFields = ['count', 'times', 'occurrences', 'frequency', 'appearances'];
              for (const field of possibleCountFields) {
                if (typeof subdomainItem[field] === 'number') {
                  countValue = subdomainItem[field];
                  break;
                }
              }
              
              // 特殊情况：如果API返回的是类似 { "subdomain.com": 5 } 这样的键值对
              if (countValue === 1 && Object.keys(subdomainItem).length === 1 && typeof subdomainItem[Object.keys(subdomainItem)[0]] === 'number') {
                const key = Object.keys(subdomainItem)[0];
                subdomain = key;
                countValue = subdomainItem[key];
              }
            }
            
            return {
              id: `sub-${index}-${Math.random()}`,
              email: '',
              username: '',
              password_plaintext: '',
              password_hash: '',
              hash_type: '',
              website: subdomain || subdomainItem || '',
              source: '',
              leaked_at: '',
              type: 'Employee',
              strength: 'Medium',
              count: countValue
            };
          });
        }
      }
      
      // 其他分类（Employees、Customers、Third-Parties）需要检查解锁状态
      const now = Date.now();
      const cached = unlockCache.get(domain);
      const isUnlocked = cached?.unlocked === true;
      
      if (!isUnlocked) {
        // 并行解锁三个分类，提高解锁效率
        await Promise.all([
          leakRadarApi.unlockDomain(domain, 'employees'),
          leakRadarApi.unlockDomain(domain, 'customers'),
          leakRadarApi.unlockDomain(domain, 'third_parties')
        ]).catch(() => {
          // 忽略解锁失败，继续执行
        });
        
        // 更新解锁缓存
        unlockCache.set(domain, { unlocked: true, timestamp: now });
      }

      // 获取分类数据
      let res = await leakRadarApi.searchDomainCategory(domain, category, limit, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult));
      
      // 限制返回的数据量
      res.items = res.items.slice(0, limit);
      
      const transformItem = (item: any, type: LeakedCredential['type']): LeakedCredential => {
        let strength: LeakedCredential['strength'] = 'Medium';
        const s = item.password_strength;
        if (s >= 8) strength = 'Strong';
        else if (s >= 5) strength = 'Medium';
        else if (s >= 3) strength = 'Weak';
        else strength = 'Very Weak';

        // 官方API使用is_email字段来标识是否为邮箱
        const isEmail = item.is_email === true;
        const credentialValue = item.email || item.username || item.user || item.account || '';

        return {
          id: item.id || `leak-${Math.random()}`,
          email: isEmail ? credentialValue : '',
          username: isEmail ? (item.username || 'N/A') : credentialValue,
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
