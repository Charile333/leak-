import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar,
  Eye, 
  ShieldAlert,
  Activity
} from 'lucide-react';
import SphereScan from './ui/SphereScan';

const services = [
  {
    icon: Radar,
    title: "外部威胁态势感知",
    description: [
      "第一时间感知来自互联网与攻击者侧的真实威胁",
      "AI 自动分析全网安全舆情，识别与企业相关的风险信号",
      "7×24 监控暗网论坛、黑产市场与私密交易渠道",
      "实时接入全球安全社区威胁情报流",
      "在漏洞爆发、攻击扩散初期即可获取关键信息"
    ],
    position: "left-top"
  },
  {
    icon: Eye,
    title: "敏感信息泄露监测",
    description: [
      "全面发现企业在外部世界中的真实暴露面",
      "持续监测代码平台中的源码、密钥、配置泄露",
      "实时发现员工账号、系统账密在暗网或黑市流通",
      "监测合同、架构图、配置文件等敏感文件外泄",
      "评估泄露信息可被利用的风险等级与影响范围"
    ],
    position: "left-bottom"
  },
  {
    icon: ShieldAlert,
    title: "资产失陷与入侵监测",
    description: [
      "找出已经被攻破或正在被利用的企业资产",
      "发现被植入 WebShell、后门、挖矿程序的系统",
      "监测暗网中被标记为“已入侵”的企业资产",
      "识别被用于攻击跳板或 C2 通信的风险主机",
      "弥补传统防火墙、WAF、EDR 的监测盲区"
    ],
    position: "right-top"
  },
  {
    icon: Activity,
    title: "威胁分析与 IOC 中心",
    description: [
      "10 秒完成一次安全判断",
      "快速查询 IP、域名、Hash、CVE、IOC 威胁状态",
      "自动关联攻击组织、恶意家族与历史攻击事件",
      "支持一键导出恶意 IP、域名，用于封禁与处置",
      "降低人工分析成本，提高安全响应效率"
    ],
    position: "right-bottom"
  }
];

const CoreServiceMatrix: React.FC = () => {
  const sphereTransitionDuration = 1.0;
  const sideContentDelay = sphereTransitionDuration * 0.6; // Start slightly before sphere finishes

  // Ensure unique ID for animation key to force re-render if needed, 
  // but viewport={{ once: true }} should handle it.
  
  return (
    <div className="min-h-[120vh] flex items-center justify-center relative z-20 overflow-hidden py-32 bg-[#EDE3E9]">
      {/* 紫色光效 - 从右侧投射 */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none z-0" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            核心服务<span className="text-accent">矩阵</span>
          </h2>
          <p className="text-black/60 max-w-2xl mx-auto">
            以数据为核心，构建全方位的数字资产防御体系
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-16">
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
                <div className="flex-1 md:text-right text-center w-full">
                  <h3 className="text-xl font-bold text-black mb-3 group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <ul className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-1.5 inline-block md:block text-left md:text-right w-full">
                    {Array.isArray(service.description) && service.description.map((item, i) => (
                      <li key={i} className="flex items-start md:justify-end justify-start gap-2">
                         {/* Mobile bullet */}
                         <div className="md:hidden w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 shrink-0" />
                         
                         <span>{item}</span>
                         
                         {/* Desktop bullet */}
                         <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 shrink-0" />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-black/5 border border-black/10 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300 md:mt-1 shrink-0">
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
                <div className="text-2xl font-bold text-black tracking-widest mb-1">CORE</div>
                <div className="text-[10px] text-accent uppercase tracking-[0.3em]">System</div>
              </div>

              {/* Orbital Rings */}
              <div className="absolute inset-0 border border-black/10 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-10 border border-black/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-16">
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
                <div className="flex-1 md:text-left text-center w-full">
                  <h3 className="text-xl font-bold text-black mb-3 group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <ul className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-1.5 inline-block md:block text-left w-full">
                    {Array.isArray(service.description) && service.description.map((item, i) => (
                      <li key={i} className="flex items-start justify-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 shrink-0" />
                         <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-black/5 border border-black/10 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300 md:mt-1 shrink-0">
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
