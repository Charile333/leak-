import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Globe, Brain, Zap, Layers, BarChart3, PieChart, Key, ChevronUp, AlertTriangle, Code, FileText, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
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
        // 确保 data.leaks 存在，如果 API 返回格式不一致，提供默认值
        const safeStats = {
          leaks: {
            // 官网显示逻辑：raw_lines (原始行数) + leaks (去重记录)
            total: (data?.raw_lines?.total || 0) + (data?.leaks?.total || 0),
            today: (data?.raw_lines?.today || 0) + (data?.leaks?.today || 0),
            this_week: (data?.raw_lines?.this_week || 0) + (data?.leaks?.this_week || 0),
            this_month: (data?.raw_lines?.this_month || 0) + (data?.leaks?.this_month || 0)
          },
          raw_lines: {
            total: data?.raw_lines?.total || 0
          }
        };
        setStats(safeStats);
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 出错时不使用模拟数据覆盖，保持初始状态或显示错误状态
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const statItems = [
    {
      label: "今日新增",
      value: stats.leaks.today,
      icon: <Layers className="w-6 h-6 text-yellow-300" />,
      bg: "bg-gradient-to-br from-yellow-500/10 to-orange-500/5",
      border: "border-yellow-500/20",
      glow: "shadow-[0_0_20px_rgba(234,179,8,0.1)]"
    },
    {
      label: "本周新增",
      value: stats.leaks.this_week,
      icon: <BarChart3 className="w-6 h-6 text-blue-300" />,
      bg: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
      border: "border-blue-500/20",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.1)]"
    },
    {
      label: "本月新增",
      value: stats.leaks.this_month,
      icon: <PieChart className="w-6 h-6 text-emerald-300" />,
      bg: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]"
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-white/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mb-6 flex flex-col gap-6">
      {/* 主要数据展示 - 总泄露记录 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.01, boxShadow: "0 25px 60px -15px rgba(139, 92, 246, 0.5)" }}
        className="backdrop-blur-2xl bg-gradient-to-br from-purple-900/60 via-slate-900/80 to-purple-900/60 border border-purple-500/40 rounded-3xl p-10 relative overflow-hidden group text-center shadow-[0_0_40px_rgba(139,92,246,0.2)]"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_70%)]" />
        
        {/* 动态光流效果 */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-6">
            <h3 className="text-xl font-medium text-purple-200/70 tracking-[0.3em] uppercase">总泄露记录</h3>
          </div>
          
          <div className="flex items-center justify-center relative">
             <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
             <span className="relative text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              {formatNumber(stats.leaks.total)}
            </span>
          </div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <p className="text-purple-200/50 text-xs font-bold tracking-[0.2em] uppercase">Global Data Leaks Index</p>
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </motion.div>

      {/* 次要数据展示 - 三列布局 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)" }}
            className={`backdrop-blur-xl border ${item.border} ${item.bg} ${item.glow} rounded-2xl p-8 relative overflow-hidden group flex flex-col items-start gap-4 transition-all duration-300`}
          >
            {/* 顶部高光条 */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex justify-between items-start w-full">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors duration-300`}>
                {React.cloneElement(item.icon as React.ReactElement)}
              </div>
              <div className="text-white/20 group-hover:text-white/40 transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-white/60 text-xs font-bold tracking-wider uppercase mb-2">{item.label}</p>
              <p className="text-4xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                {formatNumber(item.value)}
              </p>
            </div>

            {/* 装饰性背景光 */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
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
          // 假设API返回的数据格式与预期一致
          const formattedData = data.leaks.per_week.map((week: any) => ({
            date: week.week,
            total: week.count,
            'url:user:pass': week.count * 0.8, // 模拟数据
            'raw_lines': week.count * 1.2 // 模拟数据
          }));
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 max-w-6xl mx-auto relative overflow-hidden group shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xl font-medium text-white tracking-wide">
                数据库增长趋势
              </h3>
            </div>
            <p className="text-white/40 text-xs tracking-wider uppercase font-medium">Real-time Data Monitoring (12 Months)</p>
          </div>
          
          <div className="flex gap-4">
            {[
              { name: 'Total', color: 'bg-purple-500' },
              { name: 'User:Pass', color: 'bg-blue-500' },
              { name: 'Raw lines', color: 'bg-emerald-500' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-white/60">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#a855f7" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUrlUserPass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRawLines" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255, 255, 255, 0.2)" 
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={false}
                dy={15}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.2)" 
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                dx={-15}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} 
              />
              <Area 
                type="monotone" 
                dataKey="raw_lines" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRawLines)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              />
              <Area 
                type="monotone" 
                dataKey="url:user:pass" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorUrlUserPass)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#a855f7" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#a855f7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

// 底部悬浮导航栏组件
const BottomAnchorNav: React.FC = () => {
  const [activeId, setActiveId] = useState('features');
  
  const navItems = [
    { id: 'features', label: '核心能力', icon: <Brain className="w-4 h-4" /> },
    { id: 'process', label: '服务流程', icon: <Layers className="w-4 h-4" /> },
    { id: 'data', label: '数据规模', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'subscription', label: '情报订阅', icon: <Zap className="w-4 h-4" /> },
    { id: 'services', label: '服务内容', icon: <Shield className="w-4 h-4" /> },
    { id: 'advantages', label: '服务优势', icon: <Globe className="w-4 h-4" /> },
    { id: 'partners', label: '合作伙伴', icon: <Globe className="w-4 h-4" /> },
  ];

  const activeIndex = navItems.findIndex(item => item.id === activeId);
  const progressPercentage = (activeIndex / (navItems.length - 1)) * 100;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-4xl px-4">
      {/* 去掉外层椭圆边框和背景，仅保留进度条和节点 */}
      <div className="relative flex items-center justify-between px-4 py-3">
        
        {/* Navigation Items Container */}
        <div className="relative flex items-center justify-between w-full mr-4">
          {/* Progress Line Background - Strictly confined between first and last node centers */}
          <div className="absolute top-1/2 left-[6px] right-[6px] h-[2px] bg-white/10 -z-20 rounded-full" />
          
          {/* Progress Line Active - Follows active node */}
          <div 
            className="absolute top-1/2 left-[6px] h-[2px] bg-accent -z-10 rounded-full transition-all duration-500 ease-in-out shadow-[0_0_10px_#8B5CF6]"
            style={{ width: `calc(${progressPercentage}% - 12px)` }} 
          />
          {/* Note: -12px is a slight correction to prevent overshoot visually */}

          {navItems.map((item) => (
            <ScrollLink
              key={item.id}
              to={item.id}
              spy={true}
              smooth={true}
              offset={-100}
              duration={800}
              onSetActive={() => setActiveId(item.id)}
              className="group cursor-pointer relative flex flex-col items-center justify-center w-3"
              activeClass="active-nav-item"
            >
              {/* Node Dot */}
              <div className="w-3 h-3 rounded-full bg-[#050505] border-2 border-white/20 group-[.active-nav-item]:border-accent group-[.active-nav-item]:bg-accent group-[.active-nav-item]:scale-125 transition-all duration-300 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
              
              {/* Label */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-[.active-nav-item]:opacity-100 transition-all duration-300 whitespace-nowrap">
                <span className="text-xs font-medium text-white/80 bg-black/80 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm">
                  {item.label}
                </span>
              </div>
            </ScrollLink>
          ))}
        </div>
        
        {/* Back to Top Button */}
        <ScrollLink
          to="top"
          spy={true}
          smooth={true}
          duration={800}
          className="cursor-pointer p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300 ml-2"
        >
          <ChevronUp className="w-5 h-5" />
        </ScrollLink>
      </div>
    </div>
  );
};

// 3D Sphere Scan 组件 - 从源文件一比一复刻
const SphereScan: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 从源文件复制的常量和配置 - 扫描线颜色改为紫色
    const CANVAS_WIDTH = 180;
    const CANVAS_HEIGHT = 180;
    // 将扫描线颜色改为紫色 (#8B5CF6 是紫色主色调)
    const PURPLE_FILL = (opacity: number) => `rgba(139, 92, 246, ${Math.max(0, Math.min(1, opacity))})`;
    // @ts-ignore: Unused variable from source file
    const PURPLE_STROKE = (opacity: number) => `rgba(139, 92, 246, ${Math.max(0, Math.min(1, opacity))})`;
    const GLOBAL_SPEED = 0.5;

    // 从源文件复制的缓动函数 - 完全一致
    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // 设置画布大小 - 完全一致
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    let lastTime = 0;
    let time = 0;

    // 从源文件复制的3D Sphere Scan动画实现 - 完全一致
    const centerX = CANVAS_WIDTH / 2,
          centerY = CANVAS_HEIGHT / 2;
    const radius = CANVAS_WIDTH * 0.4,
          numDots = 250;
    // 为dots数组添加明确的类型声明
    const dots: Array<{ x: number; y: number; z: number }> = [];
    
    // 从源文件复制的点初始化逻辑 - 完全一致
    for (let i = 0; i < numDots; i++) {
      const theta = Math.acos(1 - 2 * (i / numDots));
      const phi = Math.sqrt(numDots * Math.PI) * theta;
      dots.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta)
      });
    }

    // 从源文件复制的动画函数 - 完全一致
    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.0005 * GLOBAL_SPEED;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const rotX = Math.sin(time * 0.3) * 0.5,
            rotY = time * 0.5;
      const easedTime = easeInOutCubic((Math.sin(time * 2.5) + 1) / 2);
      const scanLine = (easedTime * 2 - 1) * radius,
            scanWidth = 25;

      dots.forEach((dot) => {
        let { x, y, z } = dot;
        let nX = x * Math.cos(rotY) - z * Math.sin(rotY);
        let nZ = x * Math.sin(rotY) + z * Math.cos(rotY);
        x = nX;
        z = nZ;
        let nY = y * Math.cos(rotX) - z * Math.sin(rotX);
        nZ = y * Math.sin(rotX) + z * Math.cos(rotX);
        y = nY;
        z = nZ;
        const scale = (z + radius * 1.5) / (radius * 2.5);
        const pX = centerX + x,
              pY = centerY + y;
        const distToScan = Math.abs(y - scanLine);
        let scanInfluence = 
          distToScan < scanWidth
            ? Math.cos((distToScan / scanWidth) * (Math.PI / 2))
            : 0;
        const size = Math.max(0, scale * 2.0 + scanInfluence * 2.5);
        const opacity = Math.max(0, scale * 0.6 + scanInfluence * 0.4);
        ctx.beginPath();
        ctx.arc(pX, pY, size, 0, Math.PI * 2);
        ctx.fillStyle = PURPLE_FILL(opacity);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    // 启动动画
    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-64 h-64 md:w-80 md:h-80"
      style={{ 
        background: 'transparent',
        // 保持与原文件一致的显示效果
      }}
    />
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div id="top" className="min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-white font-sans relative overflow-x-hidden">
      <BottomAnchorNav />
      {/* 左侧装饰光 - 弱光 */}
      <div className="fixed top-[40%] left-[-200px] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="relative z-10">
        {/* 头部区域（包含导航栏和英雄区域） - 动态背景仅在此区域显示 */}
        <div className="relative w-full min-h-screen flex flex-col overflow-hidden">
          <LiquidGradientBackground />
          
          {/* Hero Overlay - Darkens the hero section slightly for better readability */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />
          
          {/* 渐变过渡效果 - 弱化与下方板块的边界感 */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#070509] to-transparent pointer-events-none z-10" />
          
          {/* 导航栏 */}
          <nav className="container mx-auto px-4 py-6 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <img 
                src="/紫色2.png" 
                alt="Product Logo" 
                className="h-10 w-auto object-contain" 
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

          {/* 英雄区域 */}
          <section className="container mx-auto px-4 py-20 flex flex-col items-center text-center relative z-10 flex-grow justify-center">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl flex flex-col items-center"
            >
              {/* Logo - Added above title */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <img 
                  src="/diewei-w.png" 
                  alt="DieWei Logo" 
                  className="h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                />
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 drop-shadow-sm">
                理是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">暗网及互联网</span> <br className="hidden md:block" /> 泄露情报服务
              </h1>
              <p className="text-lg md:text-2xl text-white/60 mb-12 font-normal tracking-wider max-w-3xl mx-auto">
                洞悉数字暗流 <span className="mx-2 text-accent/50">•</span> 智筑安全穹顶
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 20px 40px -10px rgba(109, 40, 217, 0.4)",
                    backgroundColor: "rgba(109, 40, 217, 0.95)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut"
                  }}
                  className="bg-gradient-to-r from-accent to-purple-600 text-white font-semibold px-10 py-4.5 rounded-full flex items-center gap-3 text-lg tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-300 border border-purple-500/30"
                  onClick={() => navigate('/login')}
                >
                  立即开始
                  <ArrowRight className="w-5 h-5 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 15px 35px -10px rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut",
                    delay: 0.1
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4.5 rounded-full border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-300 backdrop-blur-sm"
                >
                  了解更多
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>

        {/* 三维防御体的AI元博弈 - 重新设计 */}
        <section id="features" className="container mx-auto px-4 py-24 relative overflow-hidden bg-[#070509]">
          {/* 背景效果 - 网格纹理 */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_70%)]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">三维防御体的AI元博弈</h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              构建全方位的情报监测与风险防御体系，为您的数字资产保驾护航
            </p>
          </motion.div>

          {/* 顶部模块：核心能力横向卡片布局 */}
          <div className="mb-32">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Globe className="w-6 h-6" />,
                  title: "全源情报捕获",
                  value: "覆盖全球暗网与公开网络的情报监测",
                  features: [
                    "23个国际暗网市场",
                    "35+主流代码平台",
                    "146个黑产聚集平台"
                  ],
                  iconColor: "text-purple-400",
                  highlight: "368个威胁情报节点"
                },
                {
                  icon: <Brain className="w-6 h-6" />,
                  title: "智能风险决策",
                  value: "基于AI的实时威胁分析与决策支持",
                  features: [
                    "3200万节点资产关系网",
                    "0.5%数据碎片追溯",
                    "47类黑市暗语解析"
                  ],
                  iconColor: "text-blue-400",
                  highlight: "12种AI模型协同"
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "闭环处置支撑",
                  value: "从监测到处置的全流程安全服务",
                  features: [
                    "7×24小时专家值守",
                    "48小时事件闭环",
                    "月度/年度安全报告"
                  ],
                  iconColor: "text-emerald-400",
                  highlight: "线上+线下安服支撑"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -12, 
                    boxShadow: "0 25px 50px -15px rgba(139, 92, 246, 0.4)",
                    scale: 1.02
                  }}
                  className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-8 transition-all duration-400 hover:border-purple-500/40 hover:bg-white/[0.06]"
                >
                  {/* 卡片背景光效 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* 图标 */}
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent flex items-center justify-center ${feature.iconColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  
                  {/* 标题 */}
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  
                  {/* 价值点 */}
                  <p className="text-white/70 mb-6 text-sm leading-relaxed">{feature.value}</p>
                  
                  {/* 关键特性 */}
                  <ul className="space-y-3 mb-6">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${feature.iconColor.replace('text-', 'bg-')} flex-shrink-0`} />
                        <span className="text-white/60">{item.split(' ').map((word, i) => 
                          word.match(/(\d+|\d+\.\d+|\d+\+)/) ? 
                          <span key={i} className="text-purple-400 font-medium">{word} </span> : 
                          <span key={i}>{word} </span>
                        )}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* 高亮数据 */}
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <span className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{feature.highlight}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 下方模块：流程引导时间轴设计 */}
          <div className="relative max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h3 className="text-2xl font-bold text-white mb-3">服务执行流程</h3>
              <p className="text-white/70">从监测到处置的完整安全闭环</p>
            </motion.div>
            
            {/* 时间轴容器 */}
            <div className="relative">
              {/* 紫色渐变时间轴线 - 左侧对齐 */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-purple-500 opacity-60 rounded-full" />
              
              {[
                {
                  id: 1,
                  title: "首次排查",
                  description: "多维度扫描企业数字资产，建立敏感数据智能基线，输出泄露情报与优先级处置建议"
                },
                {
                  id: 2,
                  title: "实时监测",
                  description: "基于AI驱动的动态指纹识别技术，7×24小时追踪数据流转路径，实现异常行为识别准确率与分钟级应急响应"
                },
                {
                  id: 3,
                  title: "线上咨询支撑",
                  description: "安全专家团队在线值守，提供漏洞解读、处置策略优化等实时指导，建立快速响应通道"
                },
                {
                  id: 4,
                  title: "月度/年度报告",
                  description: "可视化呈现风险趋势、处置效能及合规水位，附带攻击面收敛方案与防护体系迭代路线图"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
                  className="relative mb-20 group pl-16"
                >
                  {/* 数字节点 - 精确居中在线条上 */}
                  <div className="absolute left-[-20px] top-0 w-11 h-11 rounded-full border-2 border-purple-500 bg-[#070509] flex items-center justify-center z-10 transition-all duration-400 group-hover:bg-purple-500 group-hover:border-purple-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.6)]">
                    <span className="text-sm font-bold text-white">{step.id}</span>
                  </div>
                  
                  {/* 内容 */}
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-8 hover:border-purple-500/40 hover:bg-white/[0.05] transition-all duration-400">
                    <h4 className="text-2xl font-bold text-white mb-4">{step.title}</h4>
                    <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
                      {step.description.split(' ').map((word, i) => 
                        word.match(/(\d+|\d+×\d+|\d+小时)/) ? 
                        <span key={i} className="text-purple-400 font-medium">{word} </span> : 
                        <span key={i}>{word} </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 产品介绍区域 - 简化版 */}
        <section id="data" className="container mx-auto px-4 py-20 relative overflow-hidden">
          {/* 背景效果 - 数据可视化风格 */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.3)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.3)_75%,rgba(0,0,0,0.3))] bg-[size:100px_100px] opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
              已经索引的 <span className="text-accent">泄露总数</span>
            </h2>
            
            {/* API统计数据显示 */}
            <StatsDisplay />
            
            {/* 数据库增长图表 */}
            <ChartDisplay />
          </motion.div>
        </section>

        {/* 特色服务区域 - 账号风险情报订阅 */}
        <section id="subscription" className="container mx-auto px-4 py-20 relative overflow-hidden">
          {/* 背景装饰 - 科技网格风格 */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
          
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                特色泄露情报 <span className="text-accent">–</span> 账号风险情报订阅服务
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                基于百亿级数据监测能力，为您提供精准、实时的威胁预警与风控情报
              </p>
            </motion.div>

            {/* 特色服务卡片 - 参考图排版优化：左侧大图标 + 右侧文字，交错排列 */}
            <div className="flex flex-col gap-24 max-w-5xl mx-auto">
              {[
                {
                  icon: <Globe className="w-12 h-12 text-accent" />,
                  title: "全域账号威胁预警",
                  desc: "基于百亿级暗网数据监测能力，以及亿级高危账号泄露情报，实现企业核心数据泄露事件的分钟级预警响应，抢占黄金处置窗口。"
                },
                {
                  icon: <Key className="w-12 h-12 text-accent" />,
                  title: "精准特权账号风控情报",
                  desc: "聚焦特权账号泄露风险，通过域名/邮箱维度精准匹配企业关联的格式化暗网数据，提供可行动威胁情报（IoC），支撑一键封禁、凭证重置等风控闭环。"
                },
                {
                  icon: <Zap className="w-12 h-12 text-accent" />,
                  title: "轻量化数据订阅服务",
                  desc: "极具竞争力的价格优势，数据订阅模式以及API交付，帮助企业以轻投入、低成本的方式完善组织的数据安全体系，减少ATO攻击造成的系列风险。"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* 左侧：图标视觉中心 */}
                  <div className="relative flex-shrink-0 group">
                    {/* 背景光环 */}
                    <div className="absolute inset-0 bg-accent/20 rounded-full blur-[40px] group-hover:bg-accent/30 transition-all duration-500" />
                    
                    {/* 核心圆环 */}
                    <div className="relative w-32 h-32 rounded-full border border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.15)] group-hover:scale-110 group-hover:border-accent/50 transition-all duration-500">
                      {/* 内部小圆环 */}
                      <div className="absolute inset-2 rounded-full border border-white/5" />
                      
                      {/* 图标 */}
                      <div className="bg-white rounded-full p-4 shadow-lg group-hover:rotate-12 transition-transform duration-500">
                        {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-8 h-8 text-accent" })}
                      </div>
                    </div>

                    {/* 装饰线条 - 连接下一个元素 (除最后一个外) */}
                    {index !== 2 && (
                       <div className={`hidden md:block absolute top-full left-1/2 w-[2px] h-24 bg-gradient-to-b from-accent/30 to-transparent -translate-x-1/2`} />
                    )}
                  </div>

                  {/* 右侧：文字内容 */}
                  <div className={`flex-1 text-center ${index % 2 === 1 ? 'md:text-right' : 'md:text-left'}`}>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 group-hover:text-accent transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-white/60 leading-relaxed text-lg">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 服务内容区域 */}
        <section id="services" className="container mx-auto px-4 py-20 relative overflow-hidden">
          {/* 背景效果 - 动态波纹风格 */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(79,70,229,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_center,rgba(168,85,247,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.2)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.2)_75%,rgba(0,0,0,0.2))] bg-[size:60px_60px] opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              服务内容
            </h2>
            <p className="text-white/60 tracking-widest uppercase text-sm">
              全方位泄露情报服务体系
            </p>
          </motion.div>

          {/* 三栏布局：左侧3个卡片 + 中心动画 + 右侧3个卡片 */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl mx-auto">
            {/* 左侧3个卡片 */}
            <div className="flex flex-col gap-8 w-full lg:w-1/3">
              {[
                {
                id: "01",
                title: "暗网情报监测",
                description: "覆盖AlphaBay、Hydra等23个国际暗网交易市场，监测中文/俄语/暗网暗语论坛对话，追踪数字货币交易链与勒索信息泄露动态",
                icon: <Globe className="w-6 h-6 text-purple-400" />
              },
              {
                id: "02",
                title: "黑产舆情监测",
                description: "监控Telegram、Discord等146个黑产聚集平台，识别银行卡四件套\"爬虫API\"等38类黑产术语，日均分析2TB级非结构化数据",
                icon: <AlertTriangle className="w-6 h-6 text-purple-400" />
              },
              {
                id: "03",
                title: "代码泄露监测",
                description: "采用AST语法树分析技术，扫描GitHub、GitLab等12个代码库，识别Java/Python等21种语言的密钥硬编码、核心算法暴露等7类风险",
                icon: <Code className="w-6 h-6 text-purple-400" />
              }
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{
                    x: -5,
                    opacity: 1
                  }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  className="cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3 justify-start">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed pl-13">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* 中心3D Sphere Scan动画 */}
            <div className="flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                {/* 3D Sphere Scan Canvas */}
                <SphereScan />
              </motion.div>
            </div>

            {/* 右侧3个卡片 */}
            <div className="flex flex-col gap-8 w-full lg:w-1/3">
              {[
                {
                id: "04",
                title: "敏感文件监测",
                description: "扫描百度网盘、MEGA等38个共享平台，基于文档DNA指纹算法，建立PDF/DOCX/CAD等132种文件格式的特征库，实现敏感文档传播路径的拓扑重构与泄露源头定位",
                icon: <FileText className="w-6 h-6 text-purple-400" />
              },
              {
                id: "05",
                title: "资产失陷监测",
                description: "基于十亿级DNS解析历史数据库和IP信誉图谱，构建C2通信特征匹配引擎，结合HTTPS证书指纹、JA3指纹等9类指纹特征，实现失陷资产72小时内自动识别与IOC提取",
                icon: <Server className="w-6 h-6 text-purple-400" />
              },
              {
                id: "06",
                title: "对外账密泄露监测",
                description: "对接全球泄露数据库，且收集暗网、钓鱼邮件等渠道泄露账号，构建专业属关联证库，通过彩虹表碰撞检测与Salt值模糊匹配技术，实现员工/客户账号密码的泄露实时预警",
                icon: <Shield className="w-6 h-6 text-purple-400" />
              }
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{
                    x: 5,
                    opacity: 1
                  }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  className="cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3 justify-start">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed pl-13">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 服务优势区域 - 新增板块 */}
        <section id="advantages" className="container mx-auto px-4 py-20 relative overflow-hidden">
          {/* 背景效果 - 几何图形风格 */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.15)_75%,rgba(0,0,0,0.15))] bg-[size:80px_80px] opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              服务优势
            </h2>
            <p className="text-accent/80 font-medium tracking-widest uppercase text-sm">
              不可复制的竞争力壁垒
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                id: "01",
                title: "全维情报采集网络",
                content: (
                  <ul className="space-y-4 text-white/70 text-sm leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>覆盖全球87个国家/地区的368个威胁情报节点，包括暗网交易市场（16类）、代码托管平台（9类）、黑产通讯渠道（23类）</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>建立多语言处理能力，支持中文/英文/俄语/暗网俚语等12种语言体系的NLP分析模块</span>
                    </li>
                  </ul>
                )
              },
              {
                id: "02",
                title: "认知智能分析中枢",
                content: (
                  <ul className="space-y-4 text-white/70 text-sm leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>融合图神经网络（GNN）与动态本体建模技术，构建包含6.8万实体节点的威胁知识图谱</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>部署孤立森林异常检测、BERT语义理解等12种AI模型</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>采用AST语法树深度分析引擎，支持21种编程语言的敏感模式识别与风险溯源</span>
                    </li>
                  </ul>
                )
              },
              {
                id: "03",
                title: "战术级响应机制",
                content: (
                  <p className="text-white/70 text-sm leading-relaxed text-justify">
                    理是科技提供平台化服务，用户可获得<span className="text-white font-medium">线上安全专家指导</span>，安全专家在线值守，提供漏洞解读、处置策略优化等实时指导，建立"监测-研判-处置"的快速响应通道；<span className="text-white font-medium">线下安服专家</span>覆盖大部分省市，针对重大事件，线下安服专家可及时响应提供应急服务，协助处置。
                  </p>
                )
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="relative h-full bg-white/[0.03] backdrop-blur-md border border-white/10 group-hover:border-accent/30 rounded-2xl p-8 transition-all duration-300 flex flex-col overflow-hidden">
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Number Watermark */}
                  <div className="text-5xl font-bold text-white/5 mb-6 font-mono group-hover:text-accent/10 transition-colors duration-300">
                    {item.id}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-6 group-hover:text-accent transition-colors duration-300">
                    {item.title}
                  </h3>
                  
                  <div className="flex-grow">
                    {item.content}
                  </div>
                  
                  {/* Bottom Decoration */}
                  <div className="mt-8 flex justify-end">
                     <div className="w-12 h-[2px] bg-white/10 group-hover:bg-accent/50 transition-colors duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 合作伙伴区域 */}
        <section id="partners" className="container mx-auto px-4 py-20 relative overflow-hidden pb-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              合作伙伴
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              与行业领先企业和机构建立战略合作关系，共同构建安全生态
            </p>
          </motion.div>

          {/* 合作伙伴logo - 统一白模 + 呼吸感交互 */}
          <div className="relative z-10 max-w-5xl mx-auto">
            {/* 半透明深色面板背景 */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-8">
              {/* 3x3网格布局 */}
              <div className="grid grid-cols-3 gap-8">
                {/* 按图片顺序排列logo */}
                {[
                  'miit', 'ccdc', 'bmw',
                  'byd', 'nio', 'xpeng',
                  'gac', 'seres', 'misc'
                ].map((partner, index) => {
                  // 单独放大指定的logo，misc再额外放大20%
                  let scaleClass = '';
                  if (partner === 'misc') {
                    scaleClass = 'transform scale-168'; // 当前140% * 1.2 = 168%
                  } else if (['ccdc', 'miit'].includes(partner)) {
                    scaleClass = 'transform scale-140';
                  }
                  return (
                    <motion.div
                      key={partner}
                      initial={{ opacity: 0, scale: 1 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      className="flex items-center justify-center h-24 bg-transparent hover:bg-white/[0.04] rounded-xl transition-all duration-300"
                    >
                      <img 
                        src={`/partners/${partner}.png`} 
                        alt={`${partner} logo`} 
                        className={`w-auto h-auto max-w-[80%] max-h-[80%] object-contain opacity-40 brightness-0 invert transition-all duration-300 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${scaleClass}`}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;