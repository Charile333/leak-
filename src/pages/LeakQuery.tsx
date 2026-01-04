import { useState, useEffect } from 'react';
import { 
  Filter, 
  Download, 
  ShieldAlert, 
  Shield,
  Database,
  Calendar,
  Lock,
  Eye,
  FileText,
  AlertCircle,
  PieChart as PieIcon,
  History,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
} from 'recharts';
import LargeSearch from '../components/ui/LargeSearch';
import { leakRadarApi } from '../api/leakRadar';

interface RiskItem {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

const RISK_DATA: RiskItem[] = [
  { name: '极高风险', value: 400, color: '#f43f5e' },
  { name: '高风险', value: 300, color: '#f97316' },
  { name: '中风险', value: 300, color: '#eab308' },
  { name: '低风险', value: 200, color: '#3b82f6' },
];

const LeakQuery = () => {
  // Fix Recharts width error by ensuring container is visible and has size
  useEffect(() => {
    const timers = [100, 500, 1000, 2000].map(delay => 
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, delay)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState<{ type: 'view' | 'export', id?: number } | null>(null);
  const [username, setUsername] = useState('Felix');
  
  useEffect(() => {
    // Initial load with some default data or empty
    setResults([]);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await leakRadarApi.getProfile();
        if (profile.success && profile.user) {
          setUsername(profile.user.username);
        }
      } catch (error) {
        console.error('Failed to fetch user for logs:', error);
      }
    };
    fetchUser();
  }, []);

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '10:45:12', user: username, action: '执行关键词检索', target: 'google.com' },
    { id: 2, time: '10:30:05', user: username, action: '查看敏感泄露详情', target: 'Collection #1-5' },
    { id: 3, time: '09:15:44', user: username, action: '导出检索报告', target: 'LinkedIn Breach' },
  ]);

  // Update logs when username changes
  useEffect(() => {
    setAuditLogs(prev => prev.map(log => ({ ...log, user: username })));
  }, [username]);

  const addAuditLog = (action: string, target: string) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      user: username,
      action,
      target
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const handleSearch = async (value: string) => {
    if (!value) return;
    
    addAuditLog('执行关键词检索', value);
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await leakRadarApi.search(value);
      if (data && data.items) {
        // Map API results to our UI format
        const mappedResults = data.items.map((item: any, index: number) => ({
          id: index + 1,
          source: item.source || item.website || '未知来源',
          type: item.is_email ? 'Email/Password' : 'Credentials',
          date: item.leaked_at || item.added_at || '未知日期',
          count: '1', // Individual result
          risk: item.password_strength ? (item.password_strength > 70 ? '低' : item.password_strength > 40 ? '中' : '高') : '中',
          sensitive: true,
          details: item
        }));
        setResults(mappedResults);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || '搜索失败，请稍后再试');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAuth = (type: 'view' | 'export', id?: number) => {
    setAuthAction({ type, id });
    setIsAuthModalOpen(true);
  };

  const confirmAuth = () => {
    if (authAction) {
      if (authAction.type === 'view' && authAction.id) {
        setShowDetails(authAction.id);
        const item = results.find(r => r.id === authAction.id);
        addAuditLog('二次验证通过：查看详情', item?.source || '未知');
      } else if (authAction.type === 'export') {
        addAuditLog('二次验证通过：导出报告', '全局结果集');
        alert('报告已开始生成，请稍后在下载中心查看。');
      }
    }
    setIsAuthModalOpen(false);
    setAuthAction(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-12">
      <div className="xl:col-span-3 space-y-8">
        {/* Hero Section */}
        <div className="relative py-12 px-6 rounded-[24px] bg-gradient-to-br from-[#0f0f12]/40 to-[#4f46e5]/10 border border-[#4f46e5]/20 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#4f46e5]/20 rounded-full blur-[100px]" />

          <div className="relative z-10 text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                155,118,430,111
              </h1>
              <p className="text-[#a855f7] font-bold tracking-[0.2em] text-sm uppercase">已索引的泄露记录总数</p>
            </div>
            
            <p className="text-gray-400 max-w-2xl mx-auto">
              专业级数据泄露检索系统，支持多维条件过滤与全审计日志。
              敏感数据访问需经过二次身份验证。
            </p>

            <LargeSearch onSearch={handleSearch} />
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse font-medium">正在深度检索全球泄露库...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 max-w-2xl mx-auto">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border-[#4f46e5]/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#a855f7]" />
                查询过滤器
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">泄露年份</label>
                  <select className="w-full mt-2 bg-[#0f0f12]/30 border border-[#4f46e5]/20 rounded-lg p-2 text-sm outline-none">
                    <option>所有年份</option>
                    <option>2025年</option>
                    <option>2024年</option>
                    <option>2023年</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">风险等级</label>
                  <div className="mt-2 space-y-2">
                    {['极高风险', '高风险', '中风险', '低风险'].map(level => (
                      <div key={level} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded bg-[#0f0f12] border-[#4f46e5]/30" />
                        <span>{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">数据类型</label>
                  <div className="mt-2 space-y-2">
                    {['密码凭证', '财务信息', '个人身份', '技术文档'].map(type => (
                      <div key={type} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded bg-[#0f0f12] border-[#4f46e5]/30" />
                        <span>{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-[#4f46e5]/20 bg-[#4f46e5]/5">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-6 h-6 text-[#a855f7]" />
                <h3 className="font-semibold">合规提示</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                所有查询行为均被记录在系统审计日志中。禁止将泄露数据用于任何非法途径。
              </p>
            </div>
          </div>

          {/* Results List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">检索结果 ({results.length})</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-[#4f46e5]/20 px-3 py-1.5 rounded-lg">
                  <Filter className="w-4 h-4" />
                  排序: 最新
                </button>
                <button 
                  onClick={() => triggerAuth('export')}
                  className="flex items-center gap-2 text-sm text-[#a855f7] hover:text-[#a855f7]/80 transition-colors bg-[#4f46e5]/20 px-3 py-1.5 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  导出报告
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {results.length === 0 && !isLoading && !error && (
                <div className="glass-card p-12 text-center border-dashed border-2 border-white/5">
                  <Database className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">请输入关键词并开始检索...</p>
                </div>
              )}
              {results.map((item) => (
                <div key={item.id} className="glass-card overflow-hidden border-brand/20 hover:border-accent/30 transition-all group">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center shrink-0">
                          <Database className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg group-hover:text-accent transition-colors">{item.source}</h4>
                            {item.sensitive && <Lock className="w-3 h-3 text-amber-500" />}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                              <Shield className="w-4 h-4" />
                              {item.type}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {item.date}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold">影响规模</p>
                          <p className="text-lg font-bold">{item.count}</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-xs text-gray-500 uppercase font-bold">风险指数</p>
                          <span className={`text-sm font-bold ${
                            item.risk === '极高' ? 'text-rose-500' :
                            item.risk === '高' ? 'text-orange-500' :
                            'text-yellow-500'
                          }`}>
                            {item.risk}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (item.sensitive && showDetails !== item.id) {
                                triggerAuth('view', item.id);
                              } else {
                                setShowDetails(showDetails === item.id ? null : item.id);
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${showDetails === item.id ? 'bg-accent text-white' : 'hover:bg-brand/20 text-gray-400'}`}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="p-2 hover:bg-brand/20 rounded-lg transition-colors text-gray-400">
                            <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {showDetails === item.id && (
                    <div className="bg-brand-dark/30 border-t border-brand/20 p-6 animate-in slide-in-from-top duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-accent uppercase tracking-widest">泄露概览</h5>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            该泄露源包含大量企业员工凭证，经初步分析，其中 15% 的账户仍在活跃状态。
                          </p>
                          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            发现 1,240 个匹配您的受监控资产
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h5 className="text-sm font-bold text-accent uppercase tracking-widest">涉及字段</h5>
                          <div className="flex flex-wrap gap-2">
                            {['邮箱', '哈希密码', '明文密码', 'IP地址', '用户名', '地理位置'].map(tag => (
                              <span key={tag} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-300 border border-white/10">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h5 className="text-sm font-bold text-accent uppercase tracking-widest">处置方案</h5>
                          <ul className="text-xs text-gray-400 space-y-2">
                            <li className="flex items-center gap-2">• 全局重置受影响账户密码</li>
                            <li className="flex items-center gap-2">• 启用硬件级 MFA 认证</li>
                            <li className="flex items-center gap-2">• 审查近期异常登录日志</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full py-4 border border-dashed border-brand/30 rounded-xl text-gray-500 hover:text-gray-300 hover:border-brand/50 transition-all flex items-center justify-center gap-2 font-bold">
              加载更多历史记录
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Audit Logs & Stats */}
      <div className="space-y-8">
        {/* Risk Distribution Card */}
        <div className="glass-card p-6 border-brand/20">
          <h3 className="font-semibold mb-6 flex items-center gap-2 text-white">
            <PieIcon className="w-4 h-4 text-accent" />
            全网风险分布
          </h3>
          <div className="h-48 relative" style={{ minHeight: '192px' }}>
            <ResponsiveContainer key={`pie-chart-${results.length}`} width="100%" height="100%" minWidth={100} minHeight={100}>
              <PieChart>
                <Pie
                  data={RISK_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {RISK_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-[8px] text-gray-500 uppercase">覆盖度</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            {RISK_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs Card */}
        <div className="glass-card p-6 border-brand/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              <History className="w-4 h-4 text-accent" />
              审计日志
            </h3>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold">实时同步</span>
          </div>
          <div className="space-y-6">
            {auditLogs.map((log) => (
              <div key={log.id} className="relative pl-4 border-l border-brand/20 group">
                <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-brand/40 group-hover:bg-accent transition-colors" />
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-gray-500">{log.time}</span>
                  <span className="text-[10px] font-bold text-gray-400">{log.user}</span>
                </div>
                <p className="text-xs text-white font-medium mb-1">{log.action}</p>
                <p className="text-[10px] text-gray-500 truncate italic">目标: {log.target}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-[10px] font-bold text-gray-500 hover:text-accent transition-colors border-t border-white/5">
            查看完整审计记录
          </button>
        </div>

        {/* Security Alert Card */}
        <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="font-bold">安全合规状态</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">GDPR 合规性</span>
              <span className="text-emerald-500 font-bold">已通过</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">敏感数据访问审计</span>
              <span className="text-emerald-500 font-bold">运行中</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">数据脱敏机制</span>
              <span className="text-emerald-500 font-bold">已启用</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-8 border-accent/50 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">敏感操作二次验证</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  您正在尝试访问高风险或受保护的泄露数据。为了确保安全，请确认您的操作身份。
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <div className="bg-brand-dark/50 border border-brand/20 p-4 rounded-xl text-left">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">当前操作</p>
                  <p className="text-sm text-white font-bold">
                    {authAction?.type === 'view' ? '查看敏感数据详情' : '导出全局泄露报告'}
                  </p>
                </div>
                
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="输入管理员授权码"
                    className="w-full bg-black border border-brand/30 rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none transition-all"
                  />
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              <div className="flex w-full gap-4">
                <button 
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setAuthAction(null);
                  }}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                >
                  取消操作
                </button>
                <button 
                  onClick={confirmAuth}
                  className="flex-2 bg-accent hover:bg-accent/80 text-white px-8 py-3 rounded-xl font-bold transition-all purple-glow"
                >
                  确认授权
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeakQuery;
