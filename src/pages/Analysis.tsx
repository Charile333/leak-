import { useEffect } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Zap, Globe, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const TREND_DATA = [
  { name: '1月', value: 400 },
  { name: '2月', value: 300 },
  { name: '3月', value: 600 },
  { name: '4月', value: 800 },
  { name: '5月', value: 500 },
  { name: '6月', value: 900 },
];

const SECTOR_DATA = [
  { name: '金融', value: 85 },
  { name: '科技', value: 72 },
  { name: '医疗', value: 45 },
  { name: '政府', value: 30 },
  { name: '教育', value: 55 },
];

const Analysis = () => {
  // Fix Recharts width error by ensuring container is visible and has size
  useEffect(() => {
    const timers = [100, 500, 1000, 2000].map(delay => 
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, delay)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="text-accent w-8 h-8" />
            资产安全分析
          </h1>
          <p className="text-gray-500 mt-1">全维度资产风险评估与威胁趋势分析报告</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[#4f46e5]/10 text-[#a855f7] border border-[#4f46e5]/20 rounded-xl text-sm font-bold hover:bg-[#4f46e5] hover:text-white transition-all">
            导出报告
          </button>
          <button className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold purple-glow">
            生成实时评估
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-[#4f46e5]/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#4f46e5]/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-[#a855f7]" />
            </div>
            <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <ArrowDownRight className="w-3 h-3" />
              -12%
            </span>
          </div>
          <p className="text-sm text-gray-500">高危漏洞资产</p>
          <p className="text-3xl font-black text-white mt-1">24</p>
        </div>
        
        <div className="glass-card p-6 border-[#4f46e5]/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <span className="flex items-center gap-1 text-rose-500 text-xs font-bold">
              <ArrowUpRight className="w-3 h-3" />
              +5%
            </span>
          </div>
          <p className="text-sm text-gray-500">平均风险指数</p>
          <p className="text-3xl font-black text-white mt-1">68.5</p>
        </div>

        <div className="glass-card p-6 border-[#4f46e5]/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Globe className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">受监控域名</p>
          <p className="text-3xl font-black text-white mt-1">1,420</p>
        </div>

        <div className="glass-card p-6 border-[#4f46e5]/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">受影响员工</p>
          <p className="text-3xl font-black text-white mt-1">8,432</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-[#4f46e5]/20">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            近半年风险趋势
          </h3>
          <div className="h-72" style={{ minHeight: '288px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Area type="monotone" dataKey="value" stroke="#a855f7" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 border-[#4f46e5]/20">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            资产风险分布 (按行业)
          </h3>
          <div className="h-72" style={{ minHeight: '288px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <BarChart data={SECTOR_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asset Table Preview */}
      <div className="glass-card overflow-hidden border-[#4f46e5]/20">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold">高风险资产列表</h3>
          <button className="text-xs text-accent hover:underline">查看全部资产</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/20 text-left">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">资产名称</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">风险等级</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">关联泄露</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'internal-dev.corp.net', risk: '极高', leaks: 12, status: '修复中' },
                { name: 'mail.server-primary.io', risk: '高', leaks: 45, status: '待处理' },
                { name: 'backup-2024.cloud-storage.com', risk: '中', leaks: 3, status: '监控中' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      item.risk === '极高' ? 'bg-rose-500/10 text-rose-500' :
                      item.risk === '高' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {item.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{item.leaks} 个源</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.status === '修复中' ? 'bg-[#4f46e5] animate-pulse' :
                        item.status === '待处理' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-xs text-gray-400">{item.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
