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
      console.log(`[dataService] Starting sequential search for domain: ${domain}`);
      
      // 1. 动作 A：解锁 (Unlock) - 顺序执行并等待
      console.log(`[Debug] 正在解锁域名数据: ${domain}...`);
      const categories: Array<'employees' | 'customers' | 'third_parties'> = ['employees', 'customers', 'third_parties'];
      
      // 使用 Promise.allSettled 确保即使某个分类解锁失败，也能继续后续取数动作
      const unlockResults = await Promise.allSettled(
        categories.map(cat => leakRadarApi.unlockDomain(domain, cat).catch(err => {
          // 捕获并处理解锁错误，避免影响后续操作
          console.error(`[Debug] 解锁请求失败 (${cat}):`, err.message);
          // 对于异步任务端点，即使返回错误，也视为成功提交任务
          return { success: true, message: `异步解锁任务已提交 (${cat})` };
        }))
      );
      
      unlockResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          // 异步任务端点可能返回不同格式，我们只需要确认请求已发送
          console.log(`[Debug] 解锁任务已提交 (${categories[index]}):`, result.value.message || '成功');
        } else {
          console.error(`[Debug] 解锁执行失败 (${categories[index]}):`, result.reason);
        }
      });

      // 2. 轮询检查解锁状态 - 确保数据已解锁
      console.log(`[Debug] 等待解锁完成...`);
      let maxRetries = 5; // 最多重试 5 次
      let retryDelay = 1000; // 每次重试间隔 1 秒
      let isUnlocked = false;
      
      while (maxRetries > 0 && !isUnlocked) {
        // 检查是否有明文数据可用（测试一个分类即可）
        const testResult = await leakRadarApi.searchDomainCategory(domain, 'employees', 1, 0).catch(() => ({ items: [], total: 0, success: false }));
        
        // 检查是否有解锁的数据（包含 password_plaintext 或 unlocked 字段）
        isUnlocked = testResult.items.some(item => item.password_plaintext || item.unlocked);
        
        if (isUnlocked) {
          console.log(`[Debug] 解锁完成，开始取数...`);
          break;
        }
        
        maxRetries--;
        console.log(`[Debug] 解锁未完成，等待 ${retryDelay}ms 后重试 (剩余 ${maxRetries} 次)...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 1.5; // 指数退避
      }
      
      if (!isUnlocked) {
        console.log(`[Debug] 解锁超时，使用当前可用数据...`);
      }

      // 3. 动作 B：取数 (Search) - 在解锁完成或超时后执行
      const [apiSummary, urlsRes, subdomainsRes] = await Promise.all([
        leakRadarApi.getDomainSummary(domain),
        leakRadarApi.getDomainUrls(domain, 1, 0).catch(() => ({ total: 0 })),
        leakRadarApi.getDomainSubdomains(domain, 1, 0).catch(() => ({ total: 0 })),
      ]);
      
      // Fetch credentials for display
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
   * 直接调用API获取数据，不包含解锁步骤
   */
  searchCategory: async (domain: string, category: 'employees' | 'customers' | 'third_parties' | 'urls' | 'subdomains', limit = 100, offset = 0): Promise<LeakedCredential[]> => {
    try {
      if (category === 'urls') {
        const res = await leakRadarApi.getDomainUrls(domain, 1000, 0); // 获取所有数据进行统计
        
        // 统计URL出现次数
        const urlCounts: Record<string, number> = {};
        res.items.forEach(item => {
          const url = item.url || item.website || '';
          if (url) {
            urlCounts[url] = (urlCounts[url] || 0) + (item.count || 1);
          }
        });
        
        // 转换为数组并按出现次数从多到少排序
        const sortedUrls = Object.entries(urlCounts)
          .map(([url, count]) => ({ url, count }))
          .sort((a, b) => b.count - a.count)
          .slice(offset, offset + limit); // 应用分页
        
        return sortedUrls.map(({ url, count }) => ({
          id: `url-${url}`,
          email: '',
          username: '',
          password_plaintext: '',
          password_hash: '',
          hash_type: '',
          website: url,
          source: '',
          leaked_at: '',
          type: 'Employee',
          strength: 'Medium',
          count
        }));
      }

      if (category === 'subdomains') {
        const res = await leakRadarApi.getDomainSubdomains(domain, 1000, 0); // 获取所有数据进行统计
        
        // 统计子域名出现次数
        const subdomainCounts: Record<string, number> = {};
        res.items.forEach(item => {
          const subdomain = item.subdomain || item.domain || '';
          if (subdomain) {
            subdomainCounts[subdomain] = (subdomainCounts[subdomain] || 0) + (item.count || 1);
          }
        });
        
        // 转换为数组并按出现次数从多到少排序
        const sortedSubdomains = Object.entries(subdomainCounts)
          .map(([subdomain, count]) => ({ subdomain, count }))
          .sort((a, b) => b.count - a.count)
          .slice(offset, offset + limit); // 应用分页
        
        return sortedSubdomains.map(({ subdomain, count }) => ({
          id: `sub-${subdomain}`,
          email: '',
          username: '',
          password_plaintext: '',
          password_hash: '',
          hash_type: '',
          website: subdomain,
          source: '',
          leaked_at: '',
          type: 'Employee',
          strength: 'Medium',
          count
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
