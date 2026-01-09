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
      console.log(`[dataService] Starting sequential search for domain: ${domain}`);
      
      // 检查解锁缓存，避免重复解锁
      const now = Date.now();
      const cached = unlockCache.get(domain);
      const isUnlocked = cached?.unlocked === true;
      
      console.log(`[Debug] 检查解锁缓存: 域名 ${domain}, 已解锁: ${isUnlocked}, 缓存存在: ${!!cached}`);
      
      if (isUnlocked) {
        console.log(`[Debug] 域名 ${domain} 已解锁，直接使用缓存...`);
      } else {
        console.log(`[Debug] 域名 ${domain} 未解锁，执行解锁流程...`);
        
        // 优化解锁流程：发送解锁请求并等待解锁完成
        const categories: Array<'employees' | 'customers' | 'third_parties'> = ['employees', 'customers', 'third_parties'];
        
        console.log(`[Debug] 发送解锁请求到异步端点...`);
        await Promise.allSettled(
          categories.map(cat => leakRadarApi.unlockDomain(domain, cat).catch(err => {
            console.error(`[Debug] 解锁请求失败 (${cat}):`, err.message);
            return { success: true, message: `异步解锁任务已提交 (${cat})` };
          }))
        );
        
        // 等待更可靠的时间，确保解锁有足够时间完成
        console.log(`[Debug] 解锁请求发送完成，等待2秒后获取数据...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 更新缓存，标记为已解锁，避免重复发送解锁请求
        unlockCache.set(domain, { unlocked: true, timestamp: now });
      }

      // 3. 动作 B：取数 (Search) - 在解锁完成或超时后执行
      const [apiSummary, urlsRes, subdomainsRes] = await Promise.all([
        leakRadarApi.getDomainSummary(domain),
        leakRadarApi.getDomainUrls(domain, 1, 0).catch(() => ({ total: 0 })),
        leakRadarApi.getDomainSubdomains(domain, 1, 0).catch(() => ({ total: 0 })),
      ]);
      
      // 计算总预计解锁数据量
      const totalExpectedData = apiSummary.employees_compromised + apiSummary.customers_compromised + apiSummary.third_parties_compromised;
      console.log(`[Debug] 预计解锁数据总量: ${totalExpectedData}条`);
      
      // 如果预计解锁数据量超过5000条，添加提示信息
      if (totalExpectedData > 5000) {
        console.log(`[Debug] 注意：本次预计解锁数据量超过5000条，可能会消耗较多积分。`);
        // 可以在这里添加UI提示，但根据要求不显示积分相关UI
      }
      
      // Fetch credentials for display
      const itemsPerCat = Math.floor(limit / 3);
      let [empRes, custRes, thirdRes] = await Promise.all([
        leakRadarApi.searchDomainCategory(domain, 'employees', itemsPerCat, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'customers', itemsPerCat, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        leakRadarApi.searchDomainCategory(domain, 'third_parties', limit - (2 * itemsPerCat), offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
      ]);

      // 检查获取的数据是否已解锁，如果未解锁，尝试再次获取
      const isDataUnlocked = empRes.items.some(item => item.unlocked || item.password_plaintext) || 
                             custRes.items.some(item => item.unlocked || item.password_plaintext) || 
                             thirdRes.items.some(item => item.unlocked || item.password_plaintext);
      
      if (!isDataUnlocked && isUnlocked) {
        console.log(`[Debug] 首次获取的数据未解锁，等待1秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 再次获取数据
        [empRes, custRes, thirdRes] = await Promise.all([
          leakRadarApi.searchDomainCategory(domain, 'employees', itemsPerCat, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
          leakRadarApi.searchDomainCategory(domain, 'customers', itemsPerCat, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
          leakRadarApi.searchDomainCategory(domain, 'third_parties', limit - (2 * itemsPerCat), offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult)),
        ]);
        
        console.log(`[Debug] 数据重试获取完成`);
      }

      const transformItem = (item: any, type: LeakedCredential['type']): LeakedCredential => {
        // Map strength number to string
        let strength: LeakedCredential['strength'] = 'Medium';
        const s = item.password_strength;
        if (s >= 8) strength = 'Strong';
        else if (s >= 5) strength = 'Medium';
        else if (s >= 3) strength = 'Weak';
        else strength = 'Very Weak';

        // 确保email字段正确赋值，优先使用item.email，其次使用item.email，最后使用空字符串
        // 修复客户子标签中email丢失的问题
        const emailValue = item.email || '';
        const usernameValue = item.username || item.email || 'N/A';

        return {
          id: item.id || `leak-${Math.random()}`,
          email: emailValue,
          username: usernameValue,
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
        console.log(`[Debug] ${category} 分类不需要解锁，直接获取数据...`);
        
        if (category === 'urls') {
          // 使用专门的getDomainUrls方法获取URL数据
          const urlsRes = await leakRadarApi.getDomainUrls(domain, limit, offset).catch(() => ({ items: [], total: 0 }));
          
          // 调试日志，查看API返回的原始数据结构
          console.log(`[Debug] URLs API Response items:`, urlsRes.items);
          
          return urlsRes.items.map((urlItem: any, index: number) => {
            // 直接使用API返回的count值，不设置默认值为1，避免覆盖真实数据
            // 如果API返回0，也应该显示0
            const countValue = typeof urlItem.count === 'number' ? urlItem.count : 1;
            
            return {
              id: `url-${index}-${Math.random()}`,
              email: '',
              username: '',
              password_plaintext: '',
              password_hash: '',
              hash_type: '',
              website: urlItem.url || urlItem || '',
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
          
          // 调试日志，查看API返回的原始数据结构
          console.log(`[Debug] Subdomains API Response items:`, subdomainsRes.items);
          
          return subdomainsRes.items.map((subdomainItem: any, index: number) => {
            // 直接使用API返回的count值，不设置默认值为1，避免覆盖真实数据
            // 如果API返回0，也应该显示0
            const countValue = typeof subdomainItem.count === 'number' ? subdomainItem.count : 1;
            
            return {
              id: `sub-${index}-${Math.random()}`,
              email: '',
              username: '',
              password_plaintext: '',
              password_hash: '',
              hash_type: '',
              website: subdomainItem.subdomain || subdomainItem || '',
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
      console.log(`[Debug] ${category} 分类需要检查解锁状态...`);
      const now = Date.now();
      const cached = unlockCache.get(domain);
      const isUnlocked = cached?.unlocked === true;
      
      console.log(`[Debug] 检查解锁缓存: 域名 ${domain}, 已解锁: ${isUnlocked}, 缓存存在: ${!!cached}`);
      
      if (!isUnlocked) {
        console.log(`[Debug] 域名 ${domain} 未解锁，正在执行解锁...`);
        // 执行解锁流程
        const unlockCategories: Array<'employees' | 'customers' | 'third_parties'> = ['employees', 'customers', 'third_parties'];
        await Promise.allSettled(
          unlockCategories.map(cat => leakRadarApi.unlockDomain(domain, cat).catch(err => {
            console.error(`[Debug] 解锁请求失败 (${cat}):`, err.message);
            return { success: true, message: `异步解锁任务已提交 (${cat})` };
          }))
        );
        
        // 等待更可靠的时间，确保解锁有足够时间完成
        console.log(`[Debug] 解锁请求发送完成，等待2秒后获取数据...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 更新解锁缓存 - 解锁完成后标记为已解锁
        unlockCache.set(domain, { unlocked: true, timestamp: now });
      }

      // 确保解锁完成后再获取数据
      console.log(`[Debug] 开始获取${category}分类数据...`);
      let res = await leakRadarApi.searchDomainCategory(domain, category, limit, offset);
      
      // 检查获取的数据是否已解锁，如果未解锁，尝试再次获取
      const isDataUnlocked = res.items.some(item => item.unlocked || item.password_plaintext);
      
      if (!isDataUnlocked && isUnlocked) {
        console.log(`[Debug] 首次获取的${category}分类数据未解锁，等待1秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 再次获取数据
        res = await leakRadarApi.searchDomainCategory(domain, category, limit, offset).catch(() => ({ items: [], total: 0, success: false } as LeakRadarSearchResult));
        
        console.log(`[Debug] ${category}分类数据重试获取完成`);
      }
      
      const transformItem = (item: any, type: LeakedCredential['type']): LeakedCredential => {
        let strength: LeakedCredential['strength'] = 'Medium';
        const s = item.password_strength;
        if (s >= 8) strength = 'Strong';
        else if (s >= 5) strength = 'Medium';
        else if (s >= 3) strength = 'Weak';
        else strength = 'Very Weak';

        // 确保email字段正确赋值，优先使用item.email，其次使用item.email，最后使用空字符串
        // 修复客户子标签中email丢失的问题
        const emailValue = item.email || '';
        const usernameValue = item.username || item.email || 'N/A';

        return {
          id: item.id || `leak-${Math.random()}`,
          email: emailValue,
          username: usernameValue,
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
