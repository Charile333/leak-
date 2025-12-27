import axios from 'axios';

const DNS_API_BASE_URL = '/api'; 

const dnsAxios = axios.create({
  baseURL: DNS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const dnsApi = {
  // 子域名查询 /api/v1/domain
  getSubdomains: async (domain: string, pageState?: string, limit: number = 20) => {
    const response = await dnsAxios.get('/dns-v1/domain', {
      params: { domain, page_state: pageState, limit }
    });
    return response.data;
  },

  // DNS 解析查询 /api/v1/dnsx (可能需要确认该端点在 src.0zqq.com 是否存在，不存在则回退到 domain)
  getDnsRecords: async (domain: string, page: number = 1, limit: number = 20) => {
    try {
      const response = await dnsAxios.get('/dns-v1/dnsx', {
        params: { domain, page, limit }
      });
      return response.data;
    } catch (error) {
      console.warn('dnsx endpoint failed, falling back to domain endpoint');
      return dnsApi.getSubdomains(domain, undefined, limit);
    }
  },

  // DNS 反向查询 /api/v1/dns
  getReverseDns: async (ip: string, pageState?: string, limit: number = 20) => {
    const response = await dnsAxios.get('/dns-v1/dns', {
      params: { ip, page_state: pageState, limit }
    });
    return response.data;
  },

  // SSL 证书查询 /api/v1/cert
  getSslCert: async (domain: string) => {
    const response = await dnsAxios.get('/dns-v1/cert', {
      params: { domain }
    });
    return response.data;
  }
};
