import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
  Search, 
  User,
  Users,
  Briefcase,
  LayoutGrid,
  Globe,
  Link as LinkIcon,
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ChevronLeft,
  UserCheck,
  ShieldAlert,
  UserMinus,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import type { LeakedCredential, DomainSearchSummary } from '../services/dataService';
import { leakRadarApi } from '../api/leakRadar';
import { otxApi } from '../api/otxApi';

const AnimatedNumber = ({ value }: { value: string }) => {
  const numericValue = parseInt(value.replace(/,/g, '')) || 0;
  const count = useSpring(0, {
    mass: 1,
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const display = useTransform(count, (latest) => 
    Math.floor(latest).toLocaleString()
  );

  useEffect(() => {
    count.set(numericValue);
  }, [numericValue, count]);

  return <motion.span>{display}</motion.span>;
};

const DetailCard = ({ title, icon: Icon, data, colorClass, onClick }: { title: string, icon: any, data: any, colorClass: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:bg-white/[0.05] transition-all group",
      onClick && "cursor-pointer hover:border-accent/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]"
    )}
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className={cn("group-hover:scale-110 transition-transform", colorClass)}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] leading-tight">
            {title === '员工' ? "网站和邮箱域名均匹配搜索域名。" : 
             title === '第三方' ? "邮箱域名匹配，但网站域名不匹配。" : 
             "网站域名匹配，但邮箱域名不匹配。"}
          </p>
        </div>
      </div>
      {onClick && (
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent/20 group-hover:text-accent transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
    
    <div className="mb-8">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">泄露账户数</p>
      <p className="text-4xl font-black text-white">{data.count}</p>
    </div>

    <div>
      <p className="text-[10px] text-gray-500 mb-3 font-bold uppercase tracking-wider">密码强度分布</p>
      <StrengthBar strength={data.strength} />
      
      <div className="grid grid-cols-4 gap-2 mt-6">
        {
          [
            { label: 'STRONG', val: data.strength.strong || 0, color: 'text-emerald-500' },
            { label: 'MEDIUM', val: data.strength.medium || 0, color: 'text-blue-500' },
            { label: 'WEAK', val: data.strength.weak || 0, color: 'text-orange-500' },
            { label: 'VERY WEAK', val: data.strength.very_weak || 0, color: 'text-red-500' },
          ].map((item) => {
            const total = (data.strength.strong || 0) + (data.strength.medium || 0) + (data.strength.weak || 0) + (data.strength.very_weak || 0);
            const percentage = total > 0 ? ((item.val / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={item.label} className="text-center">
                <p className={cn("text-xs font-black mb-1", item.color)}>{item.val}</p>
                <p className="text-[9px] text-white font-bold mb-0.5">{percentage} %</p>
                <p className="text-[8px] text-gray-500 font-bold uppercase whitespace-nowrap">{item.label}</p>
              </div>
            );
          })
        }
      </div>
    </div>
  </div>
);

const StrengthBar = ({ strength }: { strength: any }) => {
  const total = (strength.strong || 0) + (strength.medium || 0) + (strength.weak || 0) + (strength.very_weak || 0);
  if (total === 0) return <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden" />;
  
  const p1 = ((strength.strong || 0) / total) * 100;
  const p2 = ((strength.medium || 0) / total) * 100;
  const p3 = ((strength.weak || 0) / total) * 100;
  const p4 = ((strength.very_weak || 0) / total) * 100;

  return (
    <div className="h-2 w-full flex rounded-full overflow-hidden">
      <div style={{ width: `${p1}%` }} className="bg-emerald-500" />
      <div style={{ width: `${p2}%` }} className="bg-blue-500" />
      <div style={{ width: `${p3}%` }} className="bg-orange-500" />
      <div style={{ width: `${p4}%` }} className="bg-red-500" />
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const isDnsPage = location.pathname === '/dns';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('报告');
  const [filterType, setFilterType] = useState<'All' | 'Email' | 'Username'>('All');
  const [innerSearchQuery, setInnerSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [results, setResults] = useState<{ summary: DomainSearchSummary, credentials: LeakedCredential[] } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const autoUnlock = true; // 固定开启自动解锁
  const [totalLeaks, setTotalLeaks] = useState<string>('---,---,---,---');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  // 保存各个分类的数据，避免替换原始完整数据
  const [categoryCredentials, setCategoryCredentials] = useState<Record<string, LeakedCredential[]>>({});
  
  // 导出功能相关状态
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  
  // 防止搜索时页面跳动：当用户开始输入新查询时隐藏搜索结果
  useEffect(() => {
    // 当用户开始输入新的搜索查询，且不是正在搜索时，隐藏结果区域
    if (searchQuery && !isSearching) {
      setShowResults(false);
    }
  }, [searchQuery, isSearching]);
  
  // DNS数据集相关状态
  const [activeSearchType, setActiveSearchType] = useState<'ip' | 'domain' | 'url' | 'cve'>('ip');
  const [otxResults, setOtxResults] = useState<any>(null);
  const [otxLoading, setOtxLoading] = useState(false);
  const [otxError, setOtxError] = useState<string>('');
  
  // 导出功能实现 - 只保留CSV导出
  const handleExport = async () => {
    if (!searchQuery || !results) return;
    
    setExportLoading(true);
    setExportMessage('');
    
    try {
      const domain = searchQuery.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
      
      // 先获取当前分类，确保使用有效的category值
      const categoryMap: Record<string, 'employees' | 'customers' | 'third_parties'> = {
        '员工': 'employees',
        '客户': 'customers',
        '第三方': 'third_parties'
      };
      // 默认使用employees分类，避免使用无效的'all'分类
      const category = categoryMap[activeTab] || 'employees';
      
      // 使用getLeaksFull API获取完整数据，然后手动导出为CSV
      const fullResults = await leakRadarApi.getLeaksFull(domain, category);
      
      // 生成CSV内容
      const csvHeader = 'URL,TYPE,EMAIL/USERNAME,PASSWORD,Indexed At\n';
      const csvRows = fullResults.items.map((item: any) => {
        const url = item.website || item.url || domain || '';
        const type = item.email && item.email.includes('@') ? 'EMAIL' : 'USERNAME';
        const emailUsername = item.email || item.username || '';
        const password = item.password_plaintext || item.password || '';
        const leakedAt = item.leaked_at || item.added_at || '';
        
        // CSV转义处理
        const escapeCsv = (value: string) => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };
        
        return `${escapeCsv(url)},${escapeCsv(type)},${escapeCsv(emailUsername)},${escapeCsv(password)},${escapeCsv(leakedAt)}\n`;
      }).join('');
      
      // 创建CSV blob
      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${domain}-${category}-泄露数据.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setExportMessage('CSV数据已成功导出');
    } catch (error: any) {
      console.error('导出失败:', error);
      setExportMessage(`导出失败: ${error.message}`);
    } finally {
      setExportLoading(false);
      // 3秒后清除消息
      setTimeout(() => setExportMessage(''), 3000);
    }
  };
  
  // 当页签切换时，滚动到结果区域顶部并重置相关状态
  useEffect(() => {
    // 只有当 showResults 为 true 且不是初始化状态时才触发
    if (showResults && activeTab) {
      // 重置筛选和页码
      setFilterType('All');
      setInnerSearchQuery('');
      setCurrentPage(0);
      
      // 清除当前分类之外的缓存数据，避免数据混淆
      const categoryMap: Record<string, string> = {
        '员工': 'employees',
        '客户': 'customers',
        '第三方': 'third_parties',
        'URLs': 'urls',
        '子域名': 'subdomains'
      };
      const currentCategory = categoryMap[activeTab];
      
      // 只有当前分类的数据保留在缓存中
      if (currentCategory) {
        setCategoryCredentials(prev => ({ [currentCategory]: prev[currentCategory] || [] }));
      } else {
        // 对于报告标签，清除所有分类缓存
        setCategoryCredentials({});
      }

      const resultElement = document.getElementById('search-results');
      if (resultElement) {
        // 延迟执行以确保内容已开始渲染
        const timer = setTimeout(() => {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, showResults, searchQuery]);
  
  // 当标签页切换到URLs或Subdomains时，如果没有缓存数据，自动加载数据
  useEffect(() => {
    if (showResults && activeTab && searchQuery) {
      const categoryMap: Record<string, string> = {
        '员工': 'employees',
        '客户': 'customers',
        '第三方': 'third_parties',
        'URLs': 'urls',
        '子域名': 'subdomains'
      };
      const currentCategory = categoryMap[activeTab];
      
      // 对于URLs和Subdomains标签页，如果没有缓存数据，自动加载
      if (currentCategory && (currentCategory === 'urls' || currentCategory === 'subdomains') && !categoryCredentials[currentCategory]) {
        handleSearch(undefined, 'default', 0);
      }
    }
  }, [activeTab, showResults, categoryCredentials, searchQuery]);
  
  // OTX API 查询函数
  const handleOtxSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || otxLoading) return;
    
    setOtxLoading(true);
    setOtxError('');
    setOtxResults(null);
    
    try {
      let result;
      
      // 为所有类型的查询添加多section数据获取
      switch (activeSearchType) {
        case 'ip':
          // 检测是IPv4还是IPv6
          const isIpv6 = searchQuery.includes(':');
          // 并行获取多个section的数据
          const [ipGeneral, ipPassiveDns, ipMalware, ipUrlList] = await Promise.all([
            otxApi.getIpInfo(searchQuery, 'general', isIpv6),
            otxApi.getIpInfo(searchQuery, 'passive_dns', isIpv6),
            otxApi.getIpInfo(searchQuery, 'malware', isIpv6),
            otxApi.getIpInfo(searchQuery, 'url_list', isIpv6)
          ]);
          
          // 合并IP查询数据
          result = {
            ...ipGeneral,
            passive_dns: ipPassiveDns?.passive_dns || [],
            malware: ipMalware?.malware || [],
            url_list: ipUrlList?.url_list || []
          };
          break;
        
        case 'domain':
          // 并行获取多个section的数据
          const [generalData, passiveDnsData, whoisData, malwareData] = await Promise.all([
            otxApi.getDomainInfo(searchQuery, 'general'),
            otxApi.getDomainInfo(searchQuery, 'passive_dns'),
            otxApi.getDomainInfo(searchQuery, 'whois'),
            otxApi.getDomainInfo(searchQuery, 'malware')
          ]);
          
          // 合并域名查询数据
          result = {
            ...generalData,
            passive_dns: passiveDnsData?.passive_dns || [],
            whois: whoisData || {}, // 直接使用whoisData，不假设它有whois属性
            malware: malwareData?.malware || []
          };
          break;
        
        case 'url':
          // 并行获取URL的多个section数据
          const [urlGeneral, urlUrlList] = await Promise.all([
            otxApi.getUrlInfo(searchQuery, 'general'),
            otxApi.getUrlInfo(searchQuery, 'url_list')
          ]);
          
          // 合并URL查询数据
          result = {
            ...urlGeneral,
            url_list: urlUrlList?.url_list || []
          };
          break;
        
        case 'cve':
          // 并行获取CVE的多个section数据
          const [cveGeneral, cveTopPulses] = await Promise.all([
            otxApi.getCveInfo(searchQuery, 'general'),
            otxApi.getCveInfo(searchQuery, 'top_n_pulses')
          ]);
          
          // 合并CVE查询数据
          result = {
            ...cveGeneral,
            top_n_pulses: cveTopPulses?.top_n_pulses || []
          };
          break;
        
        default:
          throw new Error('未知的搜索类型');
      }
      
      setOtxResults(result);
      setShowResults(true);
    } catch (error: any) {
      console.error('OTX API 查询错误:', error);
      setOtxError(error.message || '查询失败，请重试');
    } finally {
      setOtxLoading(false);
    }
  };
  
  // Fetch global stats
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await leakRadarApi.getStats();
        
        const safeNumber = (val: any) => {
          const n = Number(val);
          return isNaN(n) ? 0 : n;
        };

        if (stats) {
          const statsObj = (stats as any).data || (stats as any).stats || stats;
          const rawTotal = safeNumber(statsObj.raw_lines?.total || statsObj.total_lines);
          const leaksTotal = safeNumber(statsObj.leaks?.total || statsObj.total_leaks);
          const total = safeNumber(statsObj.total_indexed || (rawTotal + leaksTotal) || statsObj.total);

          if (total > 0) {
            setTotalLeaks(total.toLocaleString());
          }
        } else {
          // API failed to return any stats
          setTotalLeaks('0');
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching stats:', error);
        setTotalLeaks('0');
      }
    };

    fetchStats();
  }, []);
  
  // Filter states
  const [sortField] = useState<keyof LeakedCredential>('leaked_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Fix Recharts width error by ensuring container is visible and has size
  useEffect(() => {
    // 增加多次触发，确保在不同渲染阶段都能捕捉到容器尺寸
    const timers = [100, 500, 1000, 2000].map(delay => 
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, delay)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, [results, activeTab]);

  const handleSearch = async (e?: React.FormEvent, _type?: any, page: number = 0) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);

    if (page === 0) {
      setShowResults(false);
      // 当进行新的搜索时，清除所有分类缓存
      setCategoryCredentials({});
    }
    
    try {
      // 总是先进行完整的域名搜索，更新results状态
      // 这样无论在哪个标签页搜索，都会先获取完整数据
      if (page === 0) {
        const data = await dataService.searchDomain(searchQuery, pageSize, page * pageSize);
        setResults(data);
      }

      // 然后根据当前活动标签页获取对应分类的数据
      let category: 'employees' | 'customers' | 'third_parties' | 'urls' | 'subdomains' | null = null;
      if (activeTab === '员工') category = 'employees';
      else if (activeTab === '客户') category = 'customers';
      else if (activeTab === '第三方') category = 'third_parties';
      else if (activeTab === 'URLs') category = 'urls';
      else if (activeTab === '子域名') category = 'subdomains';

      if (category) {
        // 分类数据请求逻辑
        const newCredentials = await dataService.searchCategory(searchQuery, category, pageSize, page * pageSize);
        
        // 保存当前分类的数据，根据页码决定是替换还是合并
        setCategoryCredentials(prev => ({
          ...prev,
          [category]: newCredentials
        }));
      }

      setIsSearching(false);
      setShowResults(true);
      setCurrentPage(page);
      
      if (page === 0) {
        setTimeout(() => {
          const resultElement = document.getElementById('search-results');
          if (resultElement) {
            const rect = resultElement.getBoundingClientRect();
            if (rect.top < 0 || rect.top > window.innerHeight * 0.8) {
              resultElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(undefined, 'default', newPage);
  };

  const filteredCredentials = useMemo(() => {
    let list: LeakedCredential[] = [];
    const categoryMap: Record<string, string> = {
      '员工': 'employees',
      '客户': 'customers',
      '第三方': 'third_parties',
      'URLs': 'urls',
      '子域名': 'subdomains'
    };
    
    const currentCategory = categoryMap[activeTab];
    
    // 检查是否有分页数据缓存
    const hasPagedData = currentCategory && categoryCredentials[currentCategory] && categoryCredentials[currentCategory].length > 0;
    
    // 检查results是否存在且有数据
    const hasResults = results && results.credentials && results.credentials.length > 0;
    
    // URL和子域名标签的数据处理
    if (activeTab === 'URLs' || activeTab === '子域名') {
      if (hasPagedData) {
        list = [...categoryCredentials[currentCategory]];
      } else if (hasResults) {
        // 初始化数据时，URL和子域名标签也应该有数据
        list = [...results.credentials];
      }
    } 
    // 其他标签的数据处理
    else if (hasResults) {
      if (hasPagedData) {
        list = [...categoryCredentials[currentCategory]];
      } else {
        // 使用原始数据并过滤
        list = [...results.credentials];
        
        // Tab filtering
        if (activeTab === '员工') {
          list = list.filter(c => c.type === 'Employee');
        } else if (activeTab === '第三方') {
          list = list.filter(c => c.type === 'Third-Party');
        } else if (activeTab === '客户') {
          list = list.filter(c => c.type === 'Customer');
        } 
        // 报告标签页显示所有数据，不需要过滤
        else if (activeTab === '报告') {
          // 报告标签页显示所有数据
          list = [...results.credentials];
        }
      }
    }

    // Category filtering (只适用于非URL/子域名标签)
    if (activeTab !== 'URLs' && activeTab !== '子域名') {
      if (filterType === 'Email') {
        list = list.filter(c => c.email?.includes('@'));
      } else if (filterType === 'Username') {
        list = list.filter(c => c.email && !c.email.includes('@'));
      }

      // Inner search filtering
      if (innerSearchQuery.trim()) {
        const query = innerSearchQuery.toLowerCase();
        list = list.filter(c => 
          c.email?.toLowerCase().includes(query) || 
          c.website?.toLowerCase().includes(query) ||
          c.password_plaintext?.toLowerCase().includes(query)
        );
      }
    }

    // Sorting
    list.sort((a, b) => {
      // URLs/子域名标签按count排序
      if (activeTab === 'URLs' || activeTab === '子域名') {
        const countA = a.count || 0;
        const countB = b.count || 0;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      }

      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      
      // 特殊处理强度排序
      if (sortField === 'strength') {
        const order = { 'Strong': 3, 'Medium': 2, 'Weak': 1, 'Very Weak': 0 };
        const sA = order[a.strength as keyof typeof order] || 0;
        const sB = order[b.strength as keyof typeof order] || 0;
        return sortOrder === 'asc' ? sA - sB : sB - sA;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [results, activeTab, sortField, sortOrder, filterType, innerSearchQuery, categoryCredentials]);

  // 格式化日期为 YYYY/MM/DD
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    } catch (e) {
      return dateStr;
    }
  };

  const togglePassword = (id: string | number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { name: '报告', icon: LayoutGrid, count: results?.summary.total ?? 0 },
    { name: '员工', icon: User, count: results?.summary.employees.count ?? 0 },
    { name: '第三方', icon: Briefcase, count: results?.summary.third_parties.count ?? 0 },
    { name: '客户', icon: Users, count: results?.summary.customers.count ?? 0 },
    { name: 'URLs', icon: LinkIcon, count: results?.summary.urls_count ?? 0 },
    { name: '子域名', icon: Globe, count: results?.summary.subdomains_count ?? 0 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-700">
      {/* 功能完善中横幅 */}
      {isDnsPage && (
        <div className="w-full bg-yellow-500/20 border-b border-yellow-500/40 p-4 text-center">
          <p className="text-yellow-400 font-bold text-lg">功能完善中</p>
        </div>
      )}
      
      {/* 核心展示区 */}
      <div className="relative pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[50px] border border-white/10 bg-[#0a0a0c] backdrop-blur-2xl p-16 lg:p-24 shadow-[0_0_100px_rgba(168,85,247,0.1)]">
            {/* 装饰性背景 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-7xl md:text-[10rem] font-black text-white tracking-tighter mb-6 leading-none select-none drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <AnimatedNumber value={totalLeaks} />
                </h1>
              </motion.div>
              
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent" />
                <p className="text-xs font-black text-accent tracking-[0.5em] uppercase opacity-90">
                  已索引的泄露记录总数
                </p>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent" />
              </div>
              
              <p className="max-w-3xl text-xl text-gray-400 mb-14 leading-relaxed font-medium">
                几秒钟内即可检查域名下的泄露凭证。我们监控全球数千个数据泄露源。
              </p>

              <form 
                onSubmit={(e) => isDnsPage ? handleOtxSearch(e) : handleSearch(e)} 
                className="w-full max-w-3xl relative group"
              >
                {/* DNS数据集页面的搜索表单 */}
                {isDnsPage ? (
                  <div>
                    {/* 搜索类型选项卡 */}
                    <div className="flex gap-2 mb-4 justify-center bg-[#1a1a2e] p-1.5 rounded-full">
                      {
                        [
                          { type: 'ip', label: 'IP', placeholder: '输入IP地址' },
                          { type: 'domain', label: '域名', placeholder: '输入域名' },
                          { type: 'url', label: 'URL', placeholder: '输入URL' },
                          { type: 'cve', label: 'CVE', placeholder: '输入CVE编号' }
                        ].map(({ type, label }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setActiveSearchType(type as any);
                            }}
                            disabled
                            className={cn(
                              "px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-not-allowed",
                              activeSearchType === type
                                ? "bg-accent/50 text-white/70 shadow-lg"
                                : "text-gray-500"
                            )}
                          >
                            {label}
                          </button>
                        ))
                      }
                    </div>
                    
                    {/* 搜索框 */}
                    <div className="relative flex items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[28px] overflow-hidden p-2 shadow-2xl focus-within:border-accent/50 focus-within:shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all duration-500">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          activeSearchType === 'ip' ? "输入IP地址 (例如: 8.8.8.8)..." :
                          activeSearchType === 'domain' ? "输入域名 (例如: example.com)..." :
                          activeSearchType === 'url' ? "输入URL (例如: https://example.com)..." :
                          "输入CVE编号 (例如: CVE-2021-44228)..."
                        }
                        disabled
                        className="flex-1 bg-transparent border-none text-white/70 placeholder:text-gray-500 focus:ring-0 px-8 py-5 text-xl font-medium cursor-not-allowed"
                      />
                      <button 
                        type="submit"
                        disabled
                        className="bg-accent/50 text-white/70 px-12 py-5 rounded-[22px] font-black transition-all text-xl shadow-xl cursor-not-allowed"
                      >
                        立即检索
                      </button>
                    </div>
                    
                    {/* 错误信息 */}
                    {otxError && (
                      <div className="mt-4 text-center text-red-400 text-sm">
                        {otxError}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 原始搜索表单 */
                  <div className="relative flex items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[28px] overflow-hidden p-2 shadow-2xl focus-within:border-accent/50 focus-within:shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all duration-500">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="输入域名 (例如: Domain.com)"
                      className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 px-8 py-5 text-xl font-medium"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-12 py-5 rounded-[22px] font-black transition-all text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 purple-glow"
                    >
                      {isSearching ? (
                        <div>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          检索中...
                        </div>
                      ) : (
                        '立即检索'
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索结果区域 */}
      <div id="search-results" className="scroll-mt-24 min-h-[600px]">
        {/* DNS数据集页面结果 */}
        {isDnsPage && showResults && otxResults && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            <div className="bg-[#1a1a20] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-8">
                <h2 className="text-2xl font-black text-white mb-6">
                  {activeSearchType === 'ip' ? 'IP查询结果' :
                   activeSearchType === 'domain' ? '域名查询结果' :
                   activeSearchType === 'url' ? 'URL检测结果' :
                   'CVE漏洞情报'}
                </h2>
                
                {/* IP查询结果优化展示 */}
                {activeSearchType === 'ip' && (
                  <div className="space-y-6">
                    {/* 概览信息 */}
                    <div className="bg-[#25252e] rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">概览信息</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">IP地址</p>
                          <p className="text-sm font-bold text-white">{otxResults.indicator || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">ASN归属</p>
                          <p className="text-sm font-bold text-white">{otxResults.asn || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">地理位置</p>
                          <p className="text-sm font-bold text-white">{`${otxResults.country || 'N/A'} ${otxResults.city || ''}`}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">信誉评分</p>
                          <p className="text-sm font-bold text-white">{otxResults.reputation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 原始搜索结果 */}
        {!isDnsPage && showResults && results && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            {/* 页签导航 */}
            <div className="flex overflow-x-auto pb-4 mb-10 gap-2 w-full scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap",
                    activeTab === tab.name
                      ? "bg-accent text-white shadow-lg"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* 结果内容区域 */}
                {activeTab === '报告' && results ? (
                  <div className="space-y-12">
                    {/* 结果标题 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                          {/* 使用Google的favicon服务获取域名图标 */}
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${results.summary.domain}&sz=128`} 
                            alt={`${results.summary.domain} favicon`} 
                            className="w-8 h-8 object-contain" 
                            onError={(e) => {
                              // 当favicon获取失败时，显示默认盾牌图标
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // 创建并添加默认盾牌图标
                              const shieldIcon = document.createElement('div');
                              shieldIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-accent"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
                              target.parentElement?.appendChild(shieldIcon);
                            }}
                          />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">安全报告: {results.summary.domain}</h2>
                          <p className="text-sm text-gray-500 font-medium">生成日期: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* 总计卡片 */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-12 text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4">泄露账户总数</p>
                      <p className="text-7xl font-black text-white tracking-tighter">{results.summary.total}</p>
                    </div>

                    {/* 详情卡片网格 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <DetailCard 
                        title="员工" 
                        icon={UserCheck} 
                        data={results.summary.employees} 
                        colorClass="text-emerald-500"
                        onClick={() => {
                          setActiveTab('员工');
                          setCurrentPage(0);
                        }}
                      />
                      <DetailCard 
                        title="第三方" 
                        icon={ShieldAlert} 
                        data={results.summary.third_parties} 
                        colorClass="text-orange-500"
                        onClick={() => {
                          setActiveTab('第三方');
                          setCurrentPage(0);
                        }}
                      />
                      <DetailCard 
                        title="客户" 
                        icon={UserMinus} 
                        data={results.summary.customers} 
                        colorClass="text-blue-500"
                        onClick={() => {
                          setActiveTab('客户');
                          setCurrentPage(0);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    {/* 过滤器和操作栏 */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative">
                          <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-3 px-4 py-2 bg-[#25252e] border border-white/10 rounded-xl text-sm font-medium text-gray-200 hover:bg-white/5 transition-all min-w-[120px] justify-between"
                          >
                            {filterType}
                            {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <AnimatePresence>
                            {isFilterOpen && (
                              <div>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setIsFilterOpen(false)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute left-0 mt-2 w-full bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20"
                                >
                                  {(['All', 'Email', 'Username'] as const).map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => {
                                        setFilterType(type);
                                        setIsFilterOpen(false);
                                      }}
                                      className={cn(
                                        "w-full text-left px-4 py-3 text-sm font-medium transition-all",
                                        filterType === type
                                          ? "text-white bg-accent/20"
                                          : "text-gray-400 hover:text-white hover:bg-white/5"
                                      )}
                                    >
                                      {type === 'All' ? '全部' : type === 'Email' ? '邮箱' : '用户名'}
                                    </button>
                                  ))}
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      
                        {/* 内部搜索框 */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="搜索结果..."
                            value={innerSearchQuery}
                            onChange={(e) => setInnerSearchQuery(e.target.value)}
                            className="bg-[#25252e] border border-white/10 pl-10 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-0 focus:border-accent/50"
                          />
                        </div>
                      </div>
                      
                      {/* 导出按钮 - 只保留CSV导出，URLs和子域名标签页不显示 */}
                      {activeTab !== 'URLs' && activeTab !== '子域名' && (
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          {/* 导出消息显示 */}
                          {exportMessage && (
                            <span className="text-sm text-green-400 font-medium">{exportMessage}</span>
                          )}
                          
                          <button
                            onClick={handleExport}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
                          >
                            <Download className="w-4 h-4" />
                            {exportLoading ? '导出中...' : '导出CSV数据'}
                          </button>
                        </div>
                      )}
                    </div>
                  
                    {/* 结果展示表格 */}
                    <div className="overflow-x-auto bg-white/5 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-gradient-to-r from-accent/20 to-transparent">
                            {/* URL和子域名标签页只显示URL和次数 */}
                            {activeTab === 'URLs' || activeTab === '子域名' ? (
                              [
                                <th key="url" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  {activeTab === 'URLs' ? 'URL' : 'SUBDOMAIN'}
                                </th>,
                                <th key="count" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  次数
                                </th>
                              ]
                            ) : (
                              // 其他标签页显示完整列
                              [
                                <th key="url" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  URL
                                </th>,
                                <th key="type" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  TYPE
                                </th>,
                                <th key="email" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  EMAIL/USERNAME
                                </th>,
                                <th key="password" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  PASSWORD
                                </th>,
                                <th key="indexed" className="px-8 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">
                                  Indexed At
                                </th>
                              ]
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredCredentials.map((credential, index) => (
                            <tr 
                              key={credential.id || index} 
                              className="transition-all duration-200 hover:bg-white/10 hover:shadow-[inset_0_0_0_1px_rgba(168,85,247,0.2)] group"
                            >
                              {/* URL和子域名标签页只显示URL和次数 */}
                              {activeTab === 'URLs' || activeTab === '子域名' ? (
                                [
                                  <td key="url" className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Globe className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                                      <div className="text-sm text-white font-medium group-hover:text-accent transition-colors">
                                        {credential.website || credential.source || 'N/A'}
                                      </div>
                                    </div>
                                  </td>,
                                  <td key="count" className="px-8 py-5 whitespace-nowrap">
                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold">
                                      {credential.count || 1}
                                    </div>
                                  </td>
                                ]
                              ) : (
                                // 其他标签页显示完整数据
                                [
                                  <td key="url" className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Globe className="w-4 h-4 text-blue-400" />
                                      <div className="text-sm text-white font-medium">
                                        {credential.website || credential.source || 'N/A'}
                                      </div>
                                    </div>
                                  </td>,
                                  <td key="type" className="px-8 py-5 whitespace-nowrap">
                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold">
                                      {credential.email && credential.email.includes('@') ? (
                                        <span className="bg-blue-500/20 text-blue-400">EMAIL</span>
                                      ) : (
                                        <span className="bg-green-500/20 text-green-400">USERNAME</span>
                                      )}
                                    </div>
                                  </td>,
                                  <td key="email" className="px-8 py-5 whitespace-nowrap">
                                    <div className="text-sm text-white font-medium truncate max-w-[250px]">
                                      {credential.email || credential.username || 'N/A'}
                                    </div>
                                  </td>,
                                  <td key="password" className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      {autoUnlock ? (
                                        <div className="text-sm font-medium">
                                          {credential.password_plaintext ? (
                                            <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">
                                              {credential.password_plaintext}
                                            </span>
                                          ) : credential.password_hash ? (
                                            <span className="text-gray-400 font-mono">{credential.password_hash.slice(0, 15)}...</span>
                                          ) : (
                                            <span className="text-gray-500 italic">N/A</span>
                                          )}
                                        </div>
                                      ) : (
                                        <div>
                                          {showPasswords[credential.id || index] ? (
                                            <div className="flex items-center gap-2">
                                              {credential.password_plaintext ? (
                                                <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">
                                                  {credential.password_plaintext}
                                                </span>
                                              ) : credential.password_hash ? (
                                                <span className="text-gray-400 font-mono">{credential.password_hash.slice(0, 15)}...</span>
                                              ) : (
                                                <span className="text-gray-500 italic">N/A</span>
                                              )}
                                              <button
                                                onClick={() => togglePassword(credential.id || index)}
                                                className="p-1 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                                              >
                                                <EyeOff className="w-4 h-4" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-400 font-mono">••••••••</span>
                                              <button
                                                onClick={() => togglePassword(credential.id || index)}
                                                className="p-1 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                                              >
                                                <Eye className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>,
                                  <td key="indexed" className="px-8 py-5 whitespace-nowrap">
                                    <div className="text-sm text-gray-400 font-medium">
                                      {formatDate(credential.leaked_at || '')}
                                    </div>
                                  </td>
                                ]
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  
                    {/* 分页控件 */}
                    <div className="flex justify-center mt-8 space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        上一页
                      </button>
                      <span className="flex items-center justify-center px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg text-sm font-medium text-white shadow-sm">
                        第 {currentPage + 1} 页
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={filteredCredentials.length < pageSize}
                        className="flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200"
                      >
                        下一页
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;