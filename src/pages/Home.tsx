import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ParticleWaves from '../components/ParticleWaves';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

import LiquidGradientBackground from '../components/LiquidGradientBackground';
import FullPageScroll from '../components/FullPageScroll';
import CoreServiceMatrix from '../components/CoreServiceMatrix';
import { 
  ServiceProcessSection, 
  PartnersSection,
  FlipCardReplicaSection
} from '../components/LandingSections';
import { leakRadarApi } from '../api/leakRadar';

// 综合数据仪表盘组件
const DataDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
    leaks: { total: 0, today: 0, this_week: 0, this_month: 0 },
    raw_lines: { total: 0 }
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await leakRadarApi.getStats();
        
        // 计算包含raw_lines的总数
        if (data.leaks && data.raw_lines) {
          data.leaks.total = data.leaks.total + data.raw_lines.total;
          data.leaks.today = data.leaks.today + data.raw_lines.today;
          data.leaks.this_week = data.leaks.this_week + data.raw_lines.this_week;
          data.leaks.this_month = data.leaks.this_month + data.raw_lines.this_month;
        }
        
        setStats(data);

        // 处理图表数据
        if (data.leaks && data.leaks.per_week) {
          const rawLinesData = data.raw_lines?.per_week || [];
          const formattedData = data.leaks.per_week.map((week: any) => {
            const rawLineItem = rawLinesData.find((r: any) => r.week === week.week);
            return {
              date: week.week,
              total: week.count + (rawLineItem ? rawLineItem.count : 0),
              'url:user:pass': week.count,
              'raw_lines': rawLineItem ? rawLineItem.count : 0
            };
          });
          setChartData(formattedData);
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        // API连接失败时不生成模拟数据，确保只展示真实数据或错误状态
        setChartData([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num: number) => num.toLocaleString();
  
  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
    return `${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-accent/30 rounded-lg p-4 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]">
          <p className="mb-2 font-mono text-accent">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-mono my-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400">{entry.name}:</span>
              <span className="text-white">{formatYAxis(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 仪表盘主容器 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左侧：核心指标卡片 */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-1 flex flex-col gap-4"
        >
          {/* 总数卡片 - 赛博风格 */}
          <div className="flex-1 bg-black/40 backdrop-blur-xl border border-accent/30 rounded-2xl p-8 flex flex-col justify-center items-center relative overflow-hidden group hover:border-accent/60 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/20 blur-[60px] rounded-full group-hover:bg-accent/30 transition-all duration-500" />
            
            <h3 className="text-gray-400 text-sm uppercase tracking-[0.2em] mb-4">Total Indexed Leaks</h3>
            <div className="relative w-full text-center">
              <p className="text-4xl lg:text-5xl xl:text-6xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter break-all">
                {formatNumber(stats.leaks.total)}
              </p>
              {/* 故障效果装饰 */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-20 animate-pulse bg-accent blur-xl" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-accent text-xs font-mono bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              SYSTEM ACTIVE
            </div>
          </div>

          {/* 小指标卡片网格 */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: "Today", value: stats.leaks.today, color: "text-emerald-400", border: "border-emerald-500/30" },
              { label: "This Week", value: stats.leaks.this_week, color: "text-blue-400", border: "border-blue-500/30" },
              { label: "This Month", value: stats.leaks.this_month, color: "text-purple-400", border: "border-purple-500/30" }
            ].map((item, idx) => (
              <div key={idx} className={`bg-black/40 backdrop-blur-md border ${item.border} rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors`}>
                <span className="text-gray-400 text-xs uppercase tracking-wider">{item.label}</span>
                <span className={`text-xl font-mono font-bold ${item.color}`}>+{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 右侧：趋势图表 */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden"
        >
          {/* 装饰性网格背景 */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-white text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-6 bg-accent rounded-full" />
              Database Growth Analysis
            </h3>
            <div className="flex gap-4">
               {[
                { name: 'Total', color: '#8b5cf6' },
                { name: 'Verified', color: '#3b82f6' },
                { name: 'Raw', color: '#10b981' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradRaw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="raw_lines" stroke="#10b981" strokeWidth={2} fill="url(#gradRaw)" />
                <Area type="monotone" dataKey="url:user:pass" stroke="#3b82f6" strokeWidth={2} fill="url(#gradVerified)" />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      {/* 液体渐变背景 - 固定在底层 - 仅在第一页显示 */}
      {/* 移除全局的 LiquidGradientBackground，因为它现在只在第一屏使用 */}
      
      {/* 导航栏 - 固定在顶层 */}
      <div className="fixed top-0 left-0 w-full z-50">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/Lysir-w.png" 
              alt="Product Logo" 
              className="h-15 w-auto object-contain" 
            />
          </div>
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/80 hover:text-white transition-colors"
            >
              产品
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/80 hover:text-white transition-colors"
            >
              解决方案
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/80 hover:text-white transition-colors"
            >
              关于我们
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-accent hover:bg-accent/90 text-white font-medium px-6 py-3 rounded-full flex items-center gap-2"
              onClick={() => navigate('/login')}
            >
              登录
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </nav>
      </div>

      {/* 全屏滚动区域 */}
      <FullPageScroll config={{ animationType: 'slide', animationDuration: 1000 }}>
        {/* 第一屏：英雄区域 */}
        <div className="h-full flex items-center justify-center relative overflow-hidden">
          <LiquidGradientBackground />
          <div className="absolute inset-0 backdrop-blur-[5px] z-0 pointer-events-none" />
          <section className="container mx-auto px-4 flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl flex flex-col items-center"
            >
              <img 
                src="/diewei-w.png" 
                alt="Diewei Logo" 
                className="h-16 w-auto object-contain mb-6 opacity-90" 
              />
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                保护您的 <span className="text-accent">数字资产</span> 免受数据泄露威胁
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-4xl mx-auto">
                基于自然语言熵值分析与密码模式识别技术，对暗网数据黑市、GitHub/Gitee等代码平台、Pastebin、钓鱼插件等临时文本存储站点及社交媒体进行深度扫描，精准捕获企业员工/客户账号密码组合
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-accent hover:bg-accent/90 text-white font-medium px-8 py-4 rounded-full flex items-center gap-2 text-lg"
                  onClick={() => navigate('/login')}
                >
                  立即开始
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-full border border-white/20"
                >
                  了解更多
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>

        {/* 第二屏：核心服务矩阵 */}
        <CoreServiceMatrix />

        {/* 第三屏：合作案例 (原在页脚上方，现移至第二屏后) */}
        <div className="h-full relative z-10 flex items-center justify-center bg-black">
          <div className="relative z-10 w-full">
            <PartnersSection />
          </div>
        </div>

        {/* 核心功能壁垒展示 - 已移除 */}
        
        {/* 1:1 复刻板块 */}
        <FlipCardReplicaSection />

        {/* 第五屏：服务流程 */}
        <div className="h-full relative z-10 overflow-hidden bg-black">
          {/* 使用登录页面的动态粒子波背景 - 修改为仅占据底部 2/5 */}
          <div className="absolute bottom-0 left-0 right-0 h-[40%] z-0">
             <ParticleWaves />
          </div>
          <div className="relative z-10 h-full">
            <ServiceProcessSection />
          </div>
        </div>

        {/* 第六屏：数据统计区域 */}
        <div className="h-full flex items-center justify-center relative z-10">
          <section className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
                已经索引的 <span className="text-accent">泄露总数</span>
              </h2>
              
              <DataDashboard />
            </motion.div>
          </section>
        </div>

        {/* 第八屏：行动召唤与页脚 */}
        <div className="h-full flex flex-col justify-center relative z-10">
          <section className="container mx-auto px-4 flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-accent/20 to-accent/10 backdrop-blur-lg border border-white/20 rounded-3xl p-12 md:p-16 text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                准备好保护您的数据了吗？
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto">
                立即加入我们，访问超过千万的泄露数据索引，保护您的企业和客户数据安全。
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="bg-accent hover:bg-accent/90 text-white font-medium px-10 py-5 rounded-full flex items-center gap-2 text-lg mx-auto"
                onClick={() => navigate('/login')}
              >
                登录并开始使用
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </section>

          <footer className="bg-black/50 border-t border-white/10 py-8 mt-auto">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <img 
                      src="/diewei-w.png" 
                      alt="Diewei Logo" 
                      className="h-8 w-auto object-contain opacity-80" 
                    />
                  </div>
                  <p className="text-white/60 text-sm">
                    保护您的数字资产免受数据泄露威胁。
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">产品</h3>
                  <ul className="space-y-1">
                    {["功能特性", "定价方案"].map((item, index) => (
                      <li key={index}><a href="#" className="text-white/60 text-sm hover:text-white">{item}</a></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">解决方案</h3>
                  <ul className="space-y-1">
                    {["企业安全", "政府机构"].map((item, index) => (
                      <li key={index}><a href="#" className="text-white/60 text-sm hover:text-white">{item}</a></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">关于</h3>
                  <ul className="space-y-1">
                    {["联系我们", "隐私政策"].map((item, index) => (
                      <li key={index}><a href="#" className="text-white/60 text-sm hover:text-white">{item}</a></li>
                    ))}
                  </ul>
                </div>
              </div>
              
            </div>
          </footer>
        </div>
      </FullPageScroll>
    </div>
  );
};

export default Home;