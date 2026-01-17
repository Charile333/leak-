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
  CoreServicesSection, 
  TechAdvantagesSection, 
  ServiceProcessSection, 
  PartnersSection,
  FlipCardDemoSection
} from '../components/LandingSections';
import { leakRadarApi } from '../api/leakRadar';

// 统计数据显示组件
const StatsDisplay: React.FC = () => {
  const [stats, setStats] = useState<any>({
    leaks: {
      total: 0,
      today: 0,
      this_week: 0,
      this_month: 0
    },
    raw_lines: {
      total: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await leakRadarApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-white/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ boxShadow: "0 20px 40px -10px rgba(109, 40, 217, 0.3)" }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-2xl mx-auto hover:shadow-xl transition-all duration-300 scale-90"
    >
      <div className="flex flex-col items-center gap-6">
        {/* 上方：总泄露记录（放大显示） */}
        <div className="w-full text-center p-2 border-b border-white/10 pb-6">
          <p className="text-white/60 text-base mb-2">总泄露记录</p>
          <p className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            {formatNumber(stats.leaks.total)}
          </p>
        </div>
        
        {/* 下方：其他三个数据（横向排列） */}
        <div className="flex flex-row justify-between w-full gap-4">
          <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/10 flex flex-col items-center">
            <p className="text-white/50 text-[10px] mb-1">今日新增</p>
            <p className="text-xl font-bold text-accent">
              +{formatNumber(stats.leaks.today)}
            </p>
          </div>
          
          <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/10 flex flex-col items-center">
            <p className="text-white/50 text-[10px] mb-1">本周新增</p>
            <p className="text-xl font-bold text-white">
              +{formatNumber(stats.leaks.this_week)}
            </p>
          </div>
          
          <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/10 flex flex-col items-center">
            <p className="text-white/50 text-[10px] mb-1">本月新增</p>
            <p className="text-xl font-bold text-white">
              +{formatNumber(stats.leaks.this_month)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 图表显示组件
const ChartDisplay: React.FC = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await leakRadarApi.getStats();
        // 转换数据格式以适应图表
        if (data.leaks && data.leaks.per_week) {
          // 获取 Raw Lines 数据（如果存在）
          const rawLinesData = data.raw_lines?.per_week || [];
          
          // 转换数据格式以适应图表
          const formattedData = data.leaks.per_week.map((week: any) => {
            // 查找对应的 Raw Lines 数据
            const rawLineItem = rawLinesData.find((r: any) => r.week === week.week);
            const rawLineCount = rawLineItem ? rawLineItem.count : 0;
            
            return {
              date: week.week,
              total: week.count,
              // 这里我们使用 leaks.count 作为主要数据
              'url:user:pass': week.count, 
              // 使用真实的 raw_lines 数据
              'raw_lines': rawLineCount
            };
          });
          setChartData(formattedData);
        } else {
          // 生成模拟数据
          const mockData = generateMockChartData();
          setChartData(mockData);
        }
      } catch (error) {
        console.error('获取图表数据失败:', error);
        // 生成模拟数据
        const mockData = generateMockChartData();
        setChartData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  // 生成模拟数据
  const generateMockChartData = () => {
    const data = [];
    const startDate = new Date('2025-04-14');
    let count = 1000000000; // 1 billion
    
    for (let i = 0; i < 40; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i * 7);
      
      // 指数增长
      count *= 1.15;
      
      data.push({
        date: date.toISOString().split('T')[0],
        total: count,
        'url:user:pass': count * 0.8,
        'raw_lines': count * 1.2
      });
    }
    
    return data;
  };

  // 自定义Y轴标签格式化
  const formatYAxis = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} B`;
    }
    return `${value.toLocaleString()}`;
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-white">
          <p className="mb-2 font-medium">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatYAxis(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-white/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-5xl mx-auto mt-12"
    >
      <h3 className="text-lg font-semibold text-white mb-6 text-left">
        Weekly database growth (last 12 months)
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUrlUserPass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRawLines" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255, 255, 255, 0.6)" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255, 255, 255, 0.6)" 
              tick={{ fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="raw_lines" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorRawLines)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="url:user:pass" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorUrlUserPass)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* 图例 */}
      <div className="flex justify-center gap-8 mt-4">
        {[
          { name: 'Total', color: '#8b5cf6' },
          { name: 'url:user:pass', color: '#3b82f6' },
          { name: 'Raw lines', color: '#10b981' }
        ].map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-white/80">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
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
      <FullPageScroll config={{ animationType: 'fade', animationDuration: 800 }}>
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
        <div className="h-full relative z-10 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/background/bg.png')" }}>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 w-full">
            <PartnersSection />
          </div>
        </div>

        {/* 核心功能壁垒展示 */}
        <FlipCardDemoSection />

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
              
              <StatsDisplay />
              <ChartDisplay />
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
              <div className="text-center text-white/40 text-xs">
                <p>© 2026 DieWei. 保留所有权利。</p>
              </div>
            </div>
          </footer>
        </div>
      </FullPageScroll>
    </div>
  );
};

export default Home;