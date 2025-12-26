import type { LeakedCredential, DomainSearchSummary } from './mockDataService';
import { leakRadarApi } from '../api/leakRadar';

export type { LeakedCredential, DomainSearchSummary };

export const dataService = {
  /**
   * Search domain leaks
   * Automatically switches between Mock and Real API based on API key presence
   */
  searchDomain: async (domain: string, limit = 100, offset = 0): Promise<{ summary: DomainSearchSummary, credentials: LeakedCredential[] }> => {
    try {
      console.log(`[dataService] Searching domain: ${domain} (limit: ${limit}, offset: ${offset})`);
      const response = await leakRadarApi.searchByDomain(domain, limit, offset);
      
      const cleanDomain = domain.toLowerCase().trim();
      
      // 一些 API 可能返回 result 而不是 results
      const resultsArray = (response as any).results || (response as any).result || [];

      // 1. 数据转换与分类
      const credentials: LeakedCredential[] = resultsArray.map((item: any, index: number) => {
        const email = item.email || '';
        const emailDomain = email.split('@')[1]?.toLowerCase() || '';
        const websiteDomain = (item.website || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        
        // 增强的分类逻辑：
        // - Employees (员工): 邮箱后缀匹配搜索域，且泄露来源网站也是该域或其子域
        // - Third-Party (第三方): 邮箱后缀匹配搜索域，但泄露来源是第三方网站 (如 LinkedIn, Adobe 等)
        // - Customers (客户): 邮箱后缀不匹配搜索域，但泄露来源是该搜索域网站 (如用户在公司官网注册的账号)
        
        const isEmailMatch = emailDomain === cleanDomain || emailDomain.endsWith(`.${cleanDomain}`);
        const isWebsiteMatch = websiteDomain === cleanDomain || websiteDomain.endsWith(`.${cleanDomain}`);
        
        let type: LeakedCredential['type'] = 'Customer';
        if (isEmailMatch && isWebsiteMatch) {
          type = 'Employee';
        } else if (isEmailMatch && !isWebsiteMatch) {
          type = 'Third-Party';
        } else if (!isEmailMatch && isWebsiteMatch) {
          type = 'Customer';
        }

        // 密码强度估算 (简单逻辑)
        let strength: LeakedCredential['strength'] = 'Medium';
        const pwd = item.password_plaintext || '';
        if (pwd.length > 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) strength = 'Strong';
        else if (pwd.length < 6 || pwd === '123456' || pwd === 'password') strength = 'Very Weak';
        else if (pwd.length < 8) strength = 'Weak';

        return {
          id: `leak-${index}`,
          email: item.email,
          username: item.username || 'N/A',
          password_plaintext: item.password_plaintext || '********',
          password_hash: item.password_hash || '',
          hash_type: item.hash_type || 'Unknown',
          website: item.website || domain,
          source: item.source || 'LeakRadar',
          leaked_at: item.leaked_at || new Date().toISOString().split('T')[0],
          type,
          strength,
          ip_address: item.ip_address,
          // 扩展字段
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
          city: item.city,
          country: item.country
        };
      });

      // 2. 生成基于真实数据的统计汇总
      // 注意：API 返回的 response.found 是总匹配数，而 credentials 只是当前页的数据
      // 为了让 UI 显示一致，我们需要基于 credentials 数组的实际内容来生成 summary
      const employees = credentials.filter(c => c.type === 'Employee');
      const customers = credentials.filter(c => c.type === 'Customer');
      const thirdParties = credentials.filter(c => c.type === 'Third-Party');

      const getStrengthStats = (list: LeakedCredential[]) => {
        return {
          strong: list.filter(c => c.strength === 'Strong').length,
          medium: list.filter(c => c.strength === 'Medium').length,
          weak: list.filter(c => c.strength === 'Weak').length,
          very_weak: list.filter(c => c.strength === 'Very Weak').length,
        };
      };

      const summary: DomainSearchSummary = {
        domain,
        total: response.found || credentials.length,
        employees: {
          count: employees.length,
          strength: getStrengthStats(employees)
        },
        third_parties: {
          count: thirdParties.length,
          strength: getStrengthStats(thirdParties)
        },
        customers: {
          count: customers.length,
          strength: getStrengthStats(customers)
        }
      };

      return { summary, credentials };
    } catch (error: any) {
      console.error('[dataService] API Search failed:', error);
      // 不再回退到 mockDataService，直接向上层抛出错误，让 UI 处理加载失败状态
      throw error;
    }
  }
};
