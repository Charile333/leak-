import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Search, 
  FileText,
  Eye,
  Server,
  Lock
} from 'lucide-react';
import SphereScan from './ui/SphereScan';

const services = [
  {
    icon: Search,
    title: "暗网情报检索",
    description: "实时监控 Tor/I2P 网络，捕获地下交易市场的敏感数据泄露。",
    position: "left-top"
  },
  {
    icon: Database,
    title: "资产泄露监测",
    description: "7x24小时全网扫描，第一时间发现企业凭证、代码及文档泄露。",
    position: "left-center"
  },
  {
    icon: Lock,
    title: "账户接管防御",
    description: "基于AI的行为分析，精准识别撞库攻击与异常登录行为。",
    position: "left-bottom"
  },
  {
    icon: Eye,
    title: "员工隐私保护",
    description: "定期扫描高管及核心员工的个人隐私暴露面，降低社工风险。",
    position: "right-top"
  },
  {
    icon: FileText,
    title: "威胁情报分析",
    description: "提供定制化的威胁情报报告，辅助安全团队进行决策。",
    position: "right-center"
  },
  {
    icon: Server,
    title: "API 安全网关",
    description: "集成式 API 防护，阻断恶意爬虫与数据窃取攻击。",
    position: "right-bottom"
  }
];

const CoreServiceMatrix: React.FC = () => {
  const sphereTransitionDuration = 1.0;
  const sideContentDelay = sphereTransitionDuration * 0.6; // Start slightly before sphere finishes

  // Ensure unique ID for animation key to force re-render if needed, 
  // but viewport={{ once: true }} should handle it.
  
  return (
    <div className="h-full flex items-center justify-center relative z-10 overflow-hidden py-10">
      {/* 紫色光效 - 从右侧投射 */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/30 rounded-full blur-[150px] pointer-events-none z-0" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            核心服务<span className="text-accent">矩阵</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            以数据为核心，构建全方位的数字资产防御体系
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-12">
            {services.filter(s => s.position.startsWith('left')).map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 100, filter: "blur(10px)" }} // Start closer to center (positive x for left items moves them right towards center)
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.3 }} // Lower amount to trigger earlier
                transition={{ 
                  duration: 0.8, 
                  delay: sideContentDelay + (idx * 0.2), // Staggered delay after sphere
                  type: "spring", 
                  stiffness: 50 
                }}
                className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-right group"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                  <service.icon className="w-6 h-6 text-accent" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Center Column - Sphere Scan */}
          <motion.div
            initial={{ opacity: 0, y: 200, scale: 0.5 }} // More dramatic start from bottom
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }} // Trigger earlier
            transition={{ 
              duration: 1.2, 
              ease: "easeOut", // Smoother ease out
              type: "spring",
              bounce: 0.3
            }}
            className="relative h-[400px] w-full flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-accent/5 blur-[100px] rounded-full" />
            <div className="w-full h-full max-w-[400px] max-h-[400px] relative">
              <SphereScan />
              
              {/* Central Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-2xl font-bold text-white tracking-widest mb-1">CORE</div>
                <div className="text-[10px] text-accent uppercase tracking-[0.3em]">System</div>
              </div>

              {/* Orbital Rings */}
              <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-10 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-12">
            {services.filter(s => s.position.startsWith('right')).map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -100, filter: "blur(10px)" }} // Start closer to center (negative x for right items moves them left towards center)
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.3 }} // Lower amount
                transition={{ 
                  duration: 0.8, 
                  delay: sideContentDelay + (idx * 0.2), // Staggered delay after sphere
                  type: "spring", 
                  stiffness: 50 
                }}
                className="flex flex-col md:flex-row-reverse items-center md:items-start gap-4 text-center md:text-left group"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                  <service.icon className="w-6 h-6 text-accent" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreServiceMatrix;
