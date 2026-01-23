import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ParticleWaves from '../components/ParticleWaves';
// import LiquidGradientBackground from '../components/LiquidGradientBackground'; // Removed as requested
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import FullPageScroll from '../components/FullPageScroll';
import CoreServiceMatrix from '../components/CoreServiceMatrix';
import {
  ServiceProcessSection,
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
    <div className="w-full max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6">
      {/* 仪表盘主容器 - 优化响应式网格布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* 左侧：核心指标卡片 */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-1 flex flex-col gap-3 sm:gap-4"
        >
          {/* 总数卡片 - 赛博风格 */}
          <div className="flex-1 bg-black/40 backdrop-blur-xl border border-accent/30 rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col justify-center items-center relative overflow-hidden group hover:border-accent/60 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/20 blur-[60px] rounded-full group-hover:bg-accent/30 transition-all duration-500" />
            
            <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-[0.2em] mb-3 sm:mb-4">Total Indexed Leaks</h3>
            <div className="relative w-full text-center">
              <p className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter break-all">
                {formatNumber(stats.leaks.total)}
              </p>
              {/* 故障效果装饰 */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-20 animate-pulse bg-accent blur-xl" />
            </div>
            <div className="mt-4 sm:mt-6 flex items-center gap-2 text-accent text-[10px] sm:text-xs font-mono bg-accent/10 px-2 sm:px-3 py-1 rounded-full border border-accent/20">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              SYSTEM ACTIVE
            </div>
          </div>

          {/* 小指标卡片网格 */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {[
              { label: "Today", value: stats.leaks.today, color: "text-emerald-400", border: "border-emerald-500/30" },
              { label: "This Week", value: stats.leaks.this_week, color: "text-blue-400", border: "border-blue-500/30" },
              { label: "This Month", value: stats.leaks.this_month, color: "text-purple-400", border: "border-purple-500/30" }
            ].map((item, idx) => (
              <div key={idx} className={`bg-black/40 backdrop-blur-md border ${item.border} rounded-xl p-3 sm:p-4 flex items-center justify-between hover:bg-white/5 transition-colors`}>
                <span className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">{item.label}</span>
                <span className={`text-lg sm:text-xl font-mono font-bold ${item.color}`}>+{formatNumber(item.value)}</span>
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
          className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 relative overflow-hidden"
        >
          {/* 装饰性网格背景 */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 relative z-10 gap-2 sm:gap-4">
            <h3 className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-5 sm:h-6 bg-accent rounded-full" />
              Database Growth Analysis
            </h3>
            <div className="flex gap-2 sm:gap-4 flex-wrap">
               {[
                { name: 'Total', color: '#8b5cf6' },
                { name: 'Verified', color: '#3b82f6' },
                { name: 'Raw', color: '#10b981' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full relative z-10">
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      {/* 液体渐变背景 - 固定在底层 - 仅在第一页显示 */}
      {/* 移除全局的 LiquidGradientBackground，因为它现在只在第一屏使用 */}
      
      {/* 导航栏 - 固定在顶层，优化响应式设计 */}
      <div className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <nav className="container mx-auto px-4 sm:px-6 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/Lysir-w.png" 
              alt="Product Logo" 
              className="h-10 sm:h-12 md:h-15 w-auto object-contain" 
            />
          </div>
          
          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/80 hover:text-white transition-colors text-sm lg:text-base"
            >
              产品
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/80 hover:text-white transition-colors text-sm lg:text-base"
            >
              解决方案
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/80 hover:text-white transition-colors text-sm lg:text-base"
            >
              关于我们
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="bg-accent hover:bg-accent/90 text-white font-medium px-4 lg:px-6 py-2 lg:py-3 rounded-full flex items-center gap-2 text-sm lg:text-base"
              onClick={() => navigate('/login')}
            >
              登录
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </nav>

        {/* 移动端菜单 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white/80 hover:text-white transition-colors text-left py-2 text-base"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                >
                  产品
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white/80 hover:text-white transition-colors text-left py-2 text-base"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                >
                  解决方案
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white/80 hover:text-white transition-colors text-left py-2 text-base"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                >
                  关于我们
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-accent hover:bg-accent/90 text-white font-medium px-6 py-3 rounded-full flex items-center justify-center gap-2 text-base w-full"
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  登录
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 全屏滚动区域 */}
      <FullPageScroll config={{ animationType: 'slide', animationDuration: 1000 }}>
        {/* 第一屏：英雄区域 - 优化响应式布局 */}
        <div className="h-full flex items-center justify-center relative overflow-hidden">
          {/* 背景图片 */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(/background/banner-1.jpg)',
              filter: 'brightness(0.6)' // 稍微压暗背景，确保文字清晰
            }}
          />
          {/* 渐变遮罩，增强底部融合 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 z-0 pointer-events-none" />
          
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl lg:max-w-5xl xl:max-w-6xl flex flex-col items-center w-full"
            >
              <img 
                src="/diewei-w.png" 
                alt="Diewei Logo" 
                className="h-12 sm:h-14 md:h-16 w-auto object-contain mb-4 sm:mb-6 opacity-90" 
              />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                保护您的 <span className="text-accent">数字资产</span> 免受数据泄露威胁
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-6 sm:mb-8 md:mb-10 leading-relaxed max-w-3xl lg:max-w-4xl mx-auto px-4">
                基于自然语言熵值分析与密码模式识别技术，对暗网数据黑市、GitHub/Gitee等代码平台、Pastebin、钓鱼插件等临时文本存储站点及社交媒体进行深度扫描，精准捕获企业员工/客户账号密码组合
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center w-full px-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-accent hover:bg-accent/90 text-white font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-full flex items-center justify-center gap-2 text-base sm:text-lg w-full sm:w-auto"
                  onClick={() => navigate('/login')}
                >
                  立即开始
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/20 w-full sm:w-auto"
                >
                  了解更多
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>

        {/* 第二屏：核心服务矩阵 */}
        <CoreServiceMatrix />

        {/* 第三屏：合作案例展示区 - 暂时隐藏 */}
        {/* <div className="h-full relative z-10 flex items-center justify-center bg-gray-900">
          <div className="relative z-10 w-full">
            <PartnersSection />
          </div>
        </div> */}

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
          <section className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 sm:mb-10 md:mb-12 text-center">
                已经索引的 <span className="text-accent">泄露总数</span>
              </h2>
              
              <DataDashboard />
            </motion.div>
          </section>
        </div>

        {/* 第八屏：行动召唤与页脚 */}
        <div className="h-full flex flex-col justify-center relative z-10">
          <section className="container mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-accent/20 to-accent/10 backdrop-blur-lg border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 text-center"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                准备好保护您的数据了吗？
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 md:mb-10 max-w-2xl sm:max-w-3xl mx-auto px-2">
                立即加入我们，访问超过千万的泄露数据索引，保护您的企业和客户数据安全。
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="bg-accent hover:bg-accent/90 text-white font-medium px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full flex items-center justify-center gap-2 text-base sm:text-lg mx-auto w-full sm:w-auto"
                onClick={() => navigate('/login')}
              >
                登录并开始使用
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
              </motion.button>
            </motion.div>
          </section>

          <footer className="bg-black/50 border-t border-white/10 py-6 sm:py-8 mt-auto">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <img 
                      src="/diewei-w.png" 
                      alt="Diewei Logo" 
                      className="h-6 sm:h-8 w-auto object-contain opacity-80" 
                    />
                  </div>
                  <p className="text-white/60 text-xs sm:text-sm">
                    保护您的数字资产免受数据泄露威胁。
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2 text-sm">产品</h3>
                  <ul className="space-y-1">
                    {["功能特性", "定价方案"].map((item, index) => (
                      <li key={index}><a href="#" className="text-white/60 text-xs sm:text-sm hover:text-white">{item}</a></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2 text-sm">解决方案</h3>
                  <ul className="space-y-1">
                    {["企业安全", "政府机构"].map((item, index) => (
                      <li key={index}><a href="#" className="text-white/60 text-xs sm:text-sm hover:text-white">{item}</a></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2 text-sm">关于</h3>
                  <ul className="space-y-1">
                    {["联系我们", "隐私政策"].map((item, index) => (
                      <li key={index}><a href="#" className="text-white/60 text-xs sm:text-sm hover:text-white">{item}</a></li>
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