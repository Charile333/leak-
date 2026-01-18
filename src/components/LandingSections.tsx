import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  MessageSquare, 
  Code, 
  FileText, 
  Server, 
  Key,
  Shield,
  Zap,
  Activity,
  Search,
  AlertTriangle
} from 'lucide-react';

// 核心服务数据
const coreServices = [
  {
    title: "暗网情报监测",
    icon: Globe,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    coreAbility: "23 个国际暗网交易市场实时追踪，覆盖多语言对话监测与勒索泄露动态预警",
    techHighlight: "数字货币交易链溯源 + 暗网俚语语义识别"
  },
  {
    title: "黑产舆情监测",
    icon: MessageSquare,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    coreAbility: "146 个黑产聚集平台（Telegram/Discord 等）7×24 小时监控，日均解析 2TB 非结构化数据",
    techHighlight: "38 类黑产术语智能识别（如“银行卡四件套”“爬虫 API”）"
  },
  {
    title: "代码泄露监测",
    icon: Code,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    coreAbility: "12 大代码库（GitHub/GitLab 等）全覆盖，21 种编程语言敏感信息识别",
    techHighlight: "AST 语法树深度分析，精准捕获密钥硬编码、核心算法暴露等 7 类风险"
  },
  {
    title: "敏感文件监测",
    icon: FileText,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    coreAbility: "38 个共享平台（百度网盘 / MEGA 等）扫描，132 种文件格式精准匹配",
    techHighlight: "文档 DNA 指纹算法，重构传播路径 + 定位泄露源头"
  },
  {
    title: "资产失陷监测",
    icon: Server,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    coreAbility: "十亿级 DNS 数据库支撑，72 小时内自动识别失陷资产",
    techHighlight: "9 类指纹特征匹配（HTTPS 证书 / JA3 等），快速提取攻击 IOC"
  },
  {
    title: "对外账密泄露监测",
    icon: Key,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    coreAbility: "全球泄露数据库对接，员工 / 客户账密泄露实时预警",
    techHighlight: "彩虹表碰撞检测 + 模糊匹配，自动触发密码重置与多因素认证"
  }
];

// 服务流程数据
const serviceProcess = [
  {
    step: "01",
    title: "首次排查",
    desc: "多维度扫描资产，建立敏感数据基线，输出处置建议",
    icon: Search
  },
  {
    step: "02",
    title: "实时监测",
    desc: "AI 动态指纹追踪，7×24 小时异常识别，分钟级预警",
    icon: Activity
  },
  {
    step: "03",
    title: "专家支撑",
    desc: "合规解读 + 攻防优化 + 溯源服务，48 小时闭环处置",
    icon: Shield
  },
  {
    step: "04",
    title: "持续优化",
    desc: "月度 / 年度报告，可视化风险趋势，迭代防护体系（风险暴露面降低 30%+）",
    icon: AlertTriangle
  }
];

export const CoreServicesSection: React.FC = () => (
  <section className="h-full flex items-center justify-center container mx-auto px-4">
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">核心服务矩阵</h2>
        <p className="text-white/60">六大维度构建全方位数字资产防御体系</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coreServices.map((service, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className={`p-6 rounded-2xl border ${service.border} ${service.bg} backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${service.color}`}>
                <service.icon className="w-8 h-8" />
              </div>
              <div className="text-xs font-mono text-white/30 px-2 py-1 border border-white/10 rounded">
                MOD_0{index + 1}
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-4 group-hover:text-white transition-colors">
              {service.title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">核心能力</div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {service.coreAbility}
                </p>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <div className="text-xs text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> 技术亮点
                </div>
                <p className="text-sm text-white/60">
                  {service.techHighlight}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

import { FlipCardStack } from './FlipCardStack';
import { FlipCardOriginal } from './FlipCardOriginal';

export const TechAdvantagesSection: React.FC = () => {
  return (
    <section className="h-full flex flex-col justify-between relative overflow-hidden pb-0 bg-gradient-to-br from-purple-900/30 via-black to-orange-900/20">
      {/* 橙色渐变光晕 - 调整位置和强度 */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* 紫色渐变光晕 - 添加在右下角 */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="absolute inset-0 bg-accent/5 skew-y-3 transform origin-top-left scale-110" />
      <div className="container mx-auto px-4 relative z-10 h-full flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">核心优势壁垒</h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
        </motion.div>

        <FlipCardStack />
      </div>
    </section>
  );
};

export const FlipCardDemoSection: React.FC = () => (
  <section className="h-full flex items-center justify-center bg-black relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />
    <div className="container mx-auto px-4 flex flex-col items-start">
      <FlipCardStack />
    </div>
  </section>
);

export const FlipCardReplicaSection: React.FC = () => (
  <section className="h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="text-center mb-16"
    >
      <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">核心技术壁垒</h2>
      <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
    </motion.div>
    <div className="container mx-auto px-4 flex flex-col items-center">
      <FlipCardOriginal />
    </div>
  </section>
);



export const ServiceProcessSection: React.FC = () => (
  <section className="h-full flex items-center justify-center bg-gradient-to-b from-transparent to-black/30">
    <div className="container mx-auto px-4 w-full -mt-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16 flex flex-col items-center"
      >
        <img 
          src="/diewei-w.png" 
          alt="Diewei Logo" 
          className="h-16 w-auto object-contain mb-6 opacity-80" 
        />
        <h2 className="text-3xl md:text-5xl font-bold mb-4">从部署到防护，全程无忧</h2>
        <p className="text-white/60">标准化四步服务流程，确保安全落地</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />

        {serviceProcess.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="relative text-center group"
          >
            <div className="w-24 h-24 mx-auto bg-black border-4 border-accent rounded-full flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <step.icon className="w-8 h-8 text-white" />
              <div className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                {step.step}
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
              {step.title}
            </h3>
            <p className="text-sm text-white/60 leading-relaxed px-4">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

import { ParticleLogo } from './ParticleLogo';

export const PartnersSection: React.FC = () => {
  const allLogos = [
    'miit.png', 'ccdc.png', 'bmw.png', 'byd.png', 'gac.png',
    'gwm.png', 'changan.png', 'nio.png', 'seres.png', 'xpeng.png'
  ];
  
  // 状态：当前选中的 Logo
  const [activeLogo, setActiveLogo] = React.useState<string | null>(null);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center container mx-auto px-4 py-20 border-t border-white/5 relative overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">深受行业领袖信赖</h2>
          <p className="text-white/60">保护核心资产，共筑数字安全防线</p>
        </motion.div>

        <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center">
          {/* 粒子特效 - 底层全覆盖 */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent rounded-full blur-3xl opacity-30" />
            <div className="w-full h-full opacity-60">
                <ParticleLogo 
                    className="w-full h-full" 
                    activeLogo={activeLogo} 
                />
            </div>
          </div>

          {/* 统一 Logo 组 - 居中悬浮 */}
          <div className="w-full px-4 relative" style={{ zIndex: 9999 }}>
            <div className="pointer-events-auto w-full max-w-6xl mx-auto">
                <LogoGrid logos={allLogos} activeLogo={activeLogo} setActiveLogo={setActiveLogo} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 将 LogoGrid 提取到组件外部以避免不必要的重渲染
const LogoGrid = ({ logos, activeLogo, setActiveLogo }: { logos: string[], activeLogo: string | null, setActiveLogo: (logo: string) => void }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-24 w-full">
      {logos.map((item, i) => {
        const isEnlarged = ['ccdc.png', 'miit.png'].includes(item);
        const isSlightlyEnlarged = ['byd.png'].includes(item);
        const isMediumEnlarged = ['changan.png'].includes(item);
        const logoPath = `/partners/patyicle/${item}`;
        
        return (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`w-full aspect-[3/2] flex items-center justify-center transition-all duration-300 cursor-pointer p-4`}
            onClick={() => setActiveLogo(logoPath)}
          >
            <img 
              src={`/partners/${item}`} 
              alt={`Partner ${i + 1}`} 
              className={`max-w-full max-h-full object-contain filter brightness-0 invert transition-all duration-300 ${
                activeLogo === logoPath ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-80 hover:opacity-100'
              } ${
                isEnlarged ? 'scale-[1.5]' : 
                isMediumEnlarged ? 'scale-125' : 
                isSlightlyEnlarged ? 'scale-110' : ''
              }`}
            />
          </motion.div>
        );
      })}
    </div>
);

const LandingSections: React.FC = () => (
  <div className="w-full">
    <CoreServicesSection />
    <TechAdvantagesSection />
    <ServiceProcessSection />
    <PartnersSection />
  </div>
);

export default LandingSections;
