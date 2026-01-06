import axios from 'axios';

const OTX_API_BASE_URL = '/api/otx'; 

const otxAxios = axios.create({
  baseURL: OTX_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-OTX-API-KEY': import.meta.env.VITE_OTX_API_KEY || ''
  }
});

export const otxApi = {
  // 1.1 IPv4/IPv6 查询
  getIpInfo: async (ip: string, section: string = 'general', isIpv6: boolean = false) => {
    const ipVersion = isIpv6 ? 'IPv6' : 'IPv4';
    const response = await otxAxios.get(`/indicators/${ipVersion}/${ip}/${section}`);
    return response.data;
  },

  // 1.2 域名查询
  getDomainInfo: async (domain: string, section: string = 'general') => {
    const response = await otxAxios.get(`/indicators/domain/${domain}/${section}`);
    return response.data;
  },

  // 1.2 主机名查询
  getHostnameInfo: async (hostname: string, section: string = 'general') => {
    const response = await otxAxios.get(`/indicators/hostname/${hostname}/${section}`);
    return response.data;
  },

  // 1.3 URL检测
  getUrlInfo: async (url: string, section: string = 'general') => {
    const encodedUrl = encodeURIComponent(url);
    const response = await otxAxios.get(`/indicators/url/${encodedUrl}/${section}`);
    return response.data;
  },

  // 1.4 CVE漏洞情报
  getCveInfo: async (cveId: string, section: string = 'general') => {
    const response = await otxAxios.get(`/indicators/cve/${cveId}/${section}`);
    return response.data;
  },

  // 2.1 实时威胁流
  getActivity: async () => {
    const response = await otxAxios.get('/pulses/activity');
    return response.data;
  },

  // 2.2 关键词搜索
  searchPulses: async (keyword: string, sort: string = '-modified') => {
    const response = await otxAxios.get('/search/pulses', {
      params: {
        q: keyword,
        sort
      }
    });
    return response.data;
  }
};
