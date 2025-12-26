import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bug, 
  Key, 
  Zap as Bolt,
  Download,
  Shield,
  User,
  Users,
  Briefcase,
  LayoutGrid,
  Globe,
  Link as LinkIcon,
  Loader2,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  ChevronLeft
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import type { LeakedCredential, DomainSearchSummary } from '../services/dataService';
import { leakRadarApi } from '../api/leakRadar';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('Report');
  const [results, setResults] = useState<{ summary: DomainSearchSummary, credentials: LeakedCredential[] } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [totalLeaks, setTotalLeaks] = useState<string>('---,---,---,---');
  const [weeklyGrowth, setWeeklyGrowth] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(100);
  
  // Fetch global stats
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        console.log('[Dashboard] Fetching stats from /api/leakradar/stats...');
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

          const leaksWeekly = statsObj.leaks?.per_week || [];
          const rawWeekly = statsObj.raw_lines?.per_week || [];
          const maxLen = Math.max(leaksWeekly.length, rawWeekly.length);

          if (maxLen > 0) {
            let runningTotal = total;
            const currentLeaksTotal = safeNumber(statsObj.leaks?.total || (total * 0.19));
            const currentRawTotal = safeNumber(statsObj.raw_lines?.total || (total * 0.81));
            
            let runningLeaks = currentLeaksTotal;
            let runningRaw = currentRawTotal;

            const growthData = Array.from({ length: maxLen }, (_, i) => {
              const lIdx = leaksWeekly.length - 1 - i;
              const rIdx = rawWeekly.length - 1 - i;
              const leaksInc = lIdx >= 0 ? safeNumber(leaksWeekly[lIdx].count) : 0;
              const rawInc = rIdx >= 0 ? safeNumber(rawWeekly[rIdx].count) : 0;
              const weeklyInc = leaksInc + rawInc;
              
              const weekDate = leaksWeekly[lIdx]?.week || rawWeekly[rIdx]?.week;
              const dateStr = weekDate ? `Week of ${weekDate}` : `Week -${i}`;

              const previousTotal = runningTotal - weeklyInc;
              const growthRate = previousTotal > 0 ? ((weeklyInc / previousTotal) * 100).toFixed(1) : '0';

              const dp = {
                date: dateStr,
                displayDate: i === 0 ? '本周' : (i % 8 === 0 ? (weekDate || '') : ''),
                total: Math.floor(runningTotal),
                leaks: Math.floor(runningLeaks),
                raw: Math.floor(runningRaw),
                weeklyTotal: Math.floor(weeklyInc),
                growth: growthRate
              };

              // 逆向递减，生成历史轨迹
              runningTotal -= weeklyInc;
              runningLeaks -= leaksInc;
              runningRaw -= rawInc;
              
              return dp;
            }).reverse();

            if (growthData.length < 52) {
              const paddingCount = 52 - growthData.length;
              const firstDate = new Date(Date.now() - (growthData.length - 1) * 7 * 24 * 60 * 60 * 1000);
              const padded = Array.from({ length: paddingCount }, (_, i) => {
                const weekNum = i + 1;
                const d = new Date(firstDate.getTime() - weekNum * 7 * 24 * 60 * 60 * 1000);
                const day = d.getDay() || 7;
                const monday = new Date(d);
                monday.setDate(d.getDate() - day + 1);
                const dateStr = `Week of ${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
                
                // 向前补全使用 0 填充，确保不产生虚假历史数据
                const dp = {
                  date: dateStr,
                  displayDate: (growthData.length + weekNum - 1) % 8 === 0 ? monday.toLocaleDateString() : '',
                  total: 0,
                  leaks: 0,
                  raw: 0,
                  weeklyTotal: 0,
                  growth: '0'
                };
                return dp;
              }).reverse();
              setWeeklyGrowth([...padded, ...growthData]);
            } else {
              setWeeklyGrowth(growthData.slice(-52));
            }
          } else {
            // No weekly data from API
            setWeeklyGrowth([]);
          }
        } else {
          // API failed to return any stats
          setTotalLeaks('0');
          setWeeklyGrowth([]);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching stats:', error);
        setTotalLeaks('0');
        setWeeklyGrowth([]);
      } finally {
        setIsLoadingStats(false);
      }
    };

    // 移除 generateFallbackData 函数
    
    fetchStats();
  }, []);
  
  // Filter states
  const [sortField, setSortField] = useState<keyof LeakedCredential>('leaked_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSearch = async (e?: React.FormEvent, page = 0) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    if (page === 0) {
      setShowResults(false);
      setCurrentPage(0);
    }
    
    try {
      const data = await dataService.searchDomain(searchQuery, pageSize, page * pageSize);
      setResults(data);
      setIsSearching(false);
      setShowResults(true);
      setCurrentPage(page);
      
      if (page === 0) {
        setTimeout(() => {
          const resultElement = document.getElementById('search-results');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(undefined, newPage);
  };

  const filteredCredentials = useMemo(() => {
    if (!results) return [];
    
    let list = [...results.credentials];
    
    // Tab filtering
    if (activeTab === 'Employees') list = list.filter(c => c.type === 'Employee');
    if (activeTab === 'Third-Parties') list = list.filter(c => c.type === 'Third-Party');
    if (activeTab === 'Customers') list = list.filter(c => c.type === 'Customer');

    // Sorting
    list.sort((a, b) => {
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
  }, [results, activeTab, sortField, sortOrder]);

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { name: 'Report', icon: LayoutGrid, count: results?.summary.total ?? 0 },
    { name: 'Employees', icon: User, count: results?.summary.employees.count ?? 0 },
    { name: 'Third-Parties', icon: Briefcase, count: results?.summary.third_parties.count ?? 0 },
    { name: 'Customers', icon: Users, count: results?.summary.customers.count ?? 0 },
    { name: 'URLs', icon: LinkIcon, count: results?.summary.urls_count ?? 0 },
    { name: 'Subdomains', icon: Globe, count: results?.summary.subdomains_count ?? 0 },
  ];

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

  const DetailCard = ({ title, icon: Icon, data, colorClass }: { title: string, icon: any, data: any, colorClass: string }) => (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:bg-white/[0.05] transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform", colorClass)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] leading-tight">
              {title === 'Employees' ? "网站和邮箱域名均匹配搜索域名。" : 
               title === 'Third Parties' ? "邮箱域名匹配，但网站域名不匹配。" : 
               "网站域名匹配，但邮箱域名不匹配。"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-tighter">泄露账户数</p>
        <p className="text-4xl font-black text-white">{data.count}</p>
      </div>

      <div>
        <p className="text-[10px] text-gray-500 mb-3 font-bold uppercase tracking-wider">密码强度分布</p>
        <StrengthBar strength={data.strength} />
        
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
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
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-700">
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
                  {totalLeaks}
                </h1>
              </motion.div>
              
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent" />
                <p className="text-xs font-black text-accent tracking-[0.5em] uppercase opacity-90">
                  已索引的泄露记录
                </p>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent" />
              </div>
              
              <p className="max-w-3xl text-xl text-gray-400 mb-14 leading-relaxed font-medium">
                几秒钟内即可检查域名下的泄露凭证。我们监控全球数千个数据泄露源。
              </p>

              <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
                <div className="relative flex items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[28px] overflow-hidden p-2 shadow-2xl focus-within:border-accent/50 focus-within:shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all duration-500">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入域名 (例如: chinabond.com.cn)..."
                    className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 px-8 py-5 text-xl font-medium"
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-12 py-5 rounded-[22px] font-black transition-all text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 purple-glow"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        检索中...
                      </>
                    ) : (
                      '立即检索'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索结果区域 */}
      <AnimatePresence>
        {showResults && results && (
          <motion.div 
            id="search-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full"
          >
            {/* 顶部标签页 */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                    activeTab === tab.name
                      ? "bg-white/10 text-white shadow-xl border border-white/10"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.count !== null && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black",
                      tab.count === 0 ? "bg-white/5 text-gray-500" : "bg-accent text-white shadow-lg"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 结果内容区域 */}
            {activeTab === 'Report' ? (
              <div className="space-y-12">
                {/* 结果标题 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">安全报告: {results.summary.domain}</h2>
                      <p className="text-sm text-gray-500 font-medium">生成日期: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="bg-[#00c2ff] hover:bg-[#00c2ff]/80 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg">
                    <Download className="w-4 h-4" />
                    下载 PDF 报告
                  </button>
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
                    title="Employees" 
                    icon={User} 
                    data={results.summary.employees} 
                    colorClass="text-emerald-500"
                  />
                  <DetailCard 
                    title="Third Parties" 
                    icon={Briefcase} 
                    data={results.summary.third_parties} 
                    colorClass="text-orange-500"
                  />
                  <DetailCard 
                    title="Customers" 
                    icon={Users} 
                    data={results.summary.customers} 
                    colorClass="text-blue-500"
                  />
                </div>

                {/* 引导查看详情 */}
                <div 
                  onClick={() => setActiveTab('Customers')}
                  className="mt-12 p-8 bg-accent/5 border border-accent/20 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-accent/10 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                      <Bolt className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight">查看详细泄露项分析</h4>
                      <p className="text-gray-500 font-medium">深度解析受影响的凭证详情、来源及修复建议</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                    <ChevronRight className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                {/* 过滤器和操作栏 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => setActiveTab('Report')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-all border border-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      返回报告
                    </button>
                    <div className="h-4 w-px bg-white/10 hidden md:block" />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-400">
                      <Filter className="w-3.5 h-3.5" />
                      <span>排序依据:</span>
                      <select 
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as any)}
                        className="bg-transparent border-none focus:ring-0 text-white font-bold p-0 cursor-pointer"
                      >
                        <option value="leaked_at">日期</option>
                        <option value="email">邮箱</option>
                        <option value="strength">强度</option>
                      </select>
                      <button 
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    显示 {filteredCredentials.length} 条记录
                  </div>
                </div>

                {/* 凭证列表表格 */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">凭证信息</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">密码 / 哈希</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">更多资料</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">泄露来源</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">日期</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredCredentials.map((cred) => (
                        <tr key={cred.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-white flex items-center gap-2">
                                {cred.email}
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] uppercase font-black",
                                  cred.type === 'Employee' ? "bg-emerald-500/20 text-emerald-500" :
                                  cred.type === 'Third-Party' ? "bg-orange-500/20 text-orange-500" :
                                  "bg-blue-500/20 text-blue-500"
                                )}>
                                  {cred.type}
                                </span>
                              </span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-2">
                                <Globe className="w-3 h-3" />
                                {cred.website}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-accent bg-accent/5 px-2 py-0.5 rounded">
                                  {showPasswords[cred.id] ? cred.password_plaintext : '••••••••••••'}
                                </span>
                                <button 
                                  onClick={() => togglePassword(cred.id)}
                                  className="text-gray-500 hover:text-white transition-colors"
                                >
                                  {showPasswords[cred.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(cred.password_plaintext || '');
                                    // 可以加个 Toast 提示
                                  }}
                                  className="text-gray-500 hover:text-white transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-mono opacity-50 truncate max-w-[150px]">
                                  {cred.password_hash}
                                </span>
                                <span className="text-[9px] text-gray-600 border border-white/5 px-1 rounded uppercase">
                                  {cred.hash_type}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1 text-[10px]">
                              {cred.first_name || cred.last_name ? (
                                <span className="text-gray-300 font-medium">姓名: {cred.first_name} {cred.last_name}</span>
                              ) : null}
                              {cred.phone ? (
                                <span className="text-gray-300 font-medium">电话: {cred.phone}</span>
                              ) : null}
                              {cred.country || cred.city ? (
                                <span className="text-gray-500">位置: {cred.country} {cred.city}</span>
                              ) : null}
                              {!cred.first_name && !cred.last_name && !cred.phone && !cred.country && (
                                <span className="text-gray-600 italic">无额外信息</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-gray-300 flex items-center gap-2">
                                <Bug className="w-3 h-3 text-rose-500" />
                                {cred.source}
                              </span>
                              {cred.ip_address && (
                                <span className="text-[10px] text-gray-500">IP: {cred.ip_address}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs text-gray-500 font-medium">{cred.leaked_at}</span>
                          </td>
                          <td className="px-6 py-5">
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-accent">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredCredentials.length === 0 && (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Search className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-500 font-medium">在该分类下未发现相关泄露记录</p>
                    </div>
                  )}
                </div>

                {/* 分页控制 */}
                {results && results.summary.total > pageSize && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0 || isSearching}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">第 {currentPage + 1} 页</span>
                      <span className="text-sm text-gray-500">/ 共 {Math.ceil(results.summary.total / pageSize)} 页</span>
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(results.summary.total / pageSize) - 1 || isSearching}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 中间文本区 */}
      {!showResults && (
        <>
          <div className="max-w-5xl mx-auto px-4 text-center pt-24 pb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
              立即发现地下泄露中关于您的信息
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium">
              数秒内检索从恶意软件日志中收集的数十亿条明文凭证。
            </p>
          </div>

          {/* Weekly Growth Chart */}
          <div className="w-full px-4 sm:px-6 lg:px-8 mb-24">
            <div className="max-w-full mx-auto bg-[#0a0a0c] border border-white/5 rounded-[40px] p-8 lg:p-10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
              {/* 装饰性背景 */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Live Indexing</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter">每周数据增长趋势</h3>
                  <p className="text-gray-500 text-xs font-medium mt-1">最近 12 个月内索引的新增记录分布</p>
                </div>
                
                <div className="flex items-center gap-6 bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">本周新增</p>
                    <p className="text-lg font-black text-white">
                      {isLoadingStats ? (
                        <span className="opacity-20 animate-pulse">---,---</span>
                      ) : (
                        weeklyGrowth && weeklyGrowth.length > 0 && weeklyGrowth[weeklyGrowth.length - 1]
                          ? (weeklyGrowth[weeklyGrowth.length - 1].weeklyTotal || 0).toLocaleString() 
                          : '0'
                      )}
                    </p>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">平均每周</p>
                    <p className="text-lg font-black text-white">
                      {isLoadingStats ? (
                        <span className="opacity-20 animate-pulse">---,---</span>
                      ) : (
                        weeklyGrowth && weeklyGrowth.length > 0 
                          ? Math.floor(weeklyGrowth.reduce((acc, curr) => acc + (Number(curr.weeklyTotal) || 0), 0) / weeklyGrowth.length).toLocaleString() 
                          : '0'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Container with fixed height to prevent ResponsiveContainer width/height error */}
              <div className="h-[300px] min-h-[300px] w-full relative min-w-0">
                {isLoadingStats && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Loader2 className="w-3 h-3 text-accent animate-spin" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">同步中...</span>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
                  <AreaChart 
                    key={`chart-${weeklyGrowth.length}`}
                    data={weeklyGrowth} 
                    margin={{ top: 10, right: 0, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRaw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 800 }}
                      interval={Math.floor(weeklyGrowth.length / 6)}
                      tickFormatter={(value, index) => {
                        if (!weeklyGrowth || weeklyGrowth.length === 0) return '';
                        if (index === weeklyGrowth.length - 1) return '本周';
                        return value;
                      }}
                    />
                    <YAxis 
                      hide={true} 
                      domain={[0, 'dataMax + 1000000']}
                    />
                    <Tooltip 
                      cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const leaksItem = payload[0]?.payload?.leaks || 0;
                          const rawItem = payload[0]?.payload?.raw || 0;
                          const totalItem = payload[0]?.payload?.total || 0;
                          const growth = payload[0]?.payload?.growth || '0';

                          const formatVal = (val: any) => {
                            return Number(val || 0).toLocaleString();
                          };

                          return (
                            <div className="bg-[#1a1b26] border border-white/5 p-4 rounded-md shadow-2xl min-w-[280px]">
                              <div className="mb-4">
                                <span className="text-lg font-bold text-gray-200">
                                  {label}
                                </span>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-lg font-bold text-[#6366f1]">Total (+{growth}%):</span>
                                  <span className="text-lg font-bold text-[#6366f1]">{formatVal(totalItem)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-lg font-bold text-[#22d3ee]">url:user:pass:</span>
                                  <span className="text-lg font-bold text-[#22d3ee]">{formatVal(leaksItem)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-lg font-bold text-[#f59e0b]">Raw lines:</span>
                                  <span className="text-lg font-bold text-[#f59e0b]">{formatVal(rawItem)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      content={(props) => {
                        const { payload } = props;
                        if (!payload) return null;
                        return (
                          <div className="flex items-center justify-center gap-8 mt-8">
                            {payload.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  {entry.value === '总索引量' ? 'Total' : entry.value === '凭证' ? 'url:user:pass' : 'Raw lines'}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="总索引量"
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="leaks" 
                      name="凭证"
                      stroke="#22d3ee" 
                      strokeWidth={2}
                      fill="transparent"
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="raw" 
                      name="原始行"
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRaw)" 
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 功能卡片区 */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 卡片 1 */}
              <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[32px] hover:border-[#4f46e5]/30 transition-all group flex flex-col items-center text-center shadow-2xl hover:shadow-[#4f46e5]/5">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl border border-white/5">
                  <Bug className="w-10 h-10 text-gray-400 group-hover:text-[#a855f7] transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">恶意软件日志</h3>
                <p className="text-gray-500 text-base leading-relaxed font-medium">
                  由 RedLine、Vidar、Raccoon 等信息窃取者盗取的凭证。
                </p>
              </div>

              {/* 卡片 2 */}
              <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[32px] hover:border-[#4f46e5]/30 transition-all group flex flex-col items-center text-center shadow-2xl hover:shadow-[#4f46e5]/5">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl border border-white/5">
                  <Key className="w-10 h-10 text-gray-400 group-hover:text-[#a855f7] transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">明文凭证</h3>
                <p className="text-gray-500 text-base leading-relaxed font-medium">
                  完全还原被盗时的 URL、用户名和密码，并经过清洗和去重。
                </p>
              </div>

              {/* 卡片 3 */}
              <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[32px] hover:border-[#4f46e5]/30 transition-all group flex flex-col items-center text-center shadow-2xl hover:shadow-[#4f46e5]/5">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl border border-white/5">
                  <Bolt className="w-10 h-10 text-gray-400 group-hover:text-[#a855f7] transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">极速检索</h3>
                <p className="text-gray-500 text-base leading-relaxed font-medium">
                  针对毫秒级查找进行索引，即使是在全球超过 70 亿条记录中。
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
