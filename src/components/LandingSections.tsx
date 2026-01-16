import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  MessageSquare, 
  Code, 
  FileText, 
  Server, 
  Key,
  Database,
  Shield,
  Zap,
  Activity,
  Map as MapIcon,
  Search,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { HalfCircleBackground } from './HalfCircleBackground';

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

// 技术优势数据
const techAdvantages = [
  {
    title: "全维情报采集网络",
    keyData: "覆盖 87 国 / 368 个威胁节点",
    subData: "支持 12 种语言",
    desc: "暗网、代码库、黑产渠道全链路覆盖，无死角捕获威胁情报",
    icon: MapIcon,
    visual: "世界地图标注节点分布",
    details: [
      "需覆盖暗网Tor/12P网络、35+主流代码平台、黑产Telegram/Discord社群，钓鱼插件等立体监测面建立包含数据特征指纹、交易模式画像、攻击者身份图谱的多维情报仓库，",
    ]
  },
  {
    title: "认知智能分析中枢",
    keyData: "6.8 万实体节点威胁知识图谱",
    subData: "12 种 AI 模型协同",
    desc: "融合图神经网络与动态本体建模，实现从数据碎片到攻击画像的链式追溯",
    icon: Database,
    visual: "AI 模型架构图",
    details: [
      "建立3200万节点企业数字资产关系网，实现「0.5%数据碎片→完整业务系统→APT组织画像」的链式追溯；自研NLP框架可解析黑市暗语47类变体（如用「蔬菜包」指代用户信息、「钢板价」隐喻商业秘密交易",
    ]
  },
  {
    title: "战术级响应机制",
    keyData: "7×24 小时线上专家值守",
    subData: "48 小时闭环处置",
    desc: "线上实时指导 + 线下应急支援，重大事件快速响应，拒绝延迟",
    icon: Zap,
    visual: "监测-研判-处置流程",
    details: [
      "提供月度报告以及年度报告，线上咨询，给予事件闭环支撑",
      "减缓外泄行为带来的负面影响，弥补安全能力的短板"
    ]
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

export const TechAdvantagesSection: React.FC = () => {
  const [activeTechIndex, setActiveTechIndex] = useState<number | null>(null);

  return (
    <section className="h-full flex flex-col justify-between relative overflow-hidden pb-0">
      <div className="absolute inset-0 bg-accent/5 skew-y-3 transform origin-top-left scale-110" />
      <div className="container mx-auto px-4 relative z-10 h-full flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center absolute top-20 left-0 right-0"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">不可复制的技术竞争力</h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
        </motion.div>

        {/* 半圆和圆环背景装饰 - 使用独立组件 */}
        <HalfCircleBackground />
        
        {/* 中心信息展示区域 - 仅当有选中的图标时显示 */}
        <AnimatePresence>
          {activeTechIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] z-30 flex flex-col items-center justify-center text-center px-8 pb-4 pointer-events-none"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                {techAdvantages[activeTechIndex].title}
              </h3>
              <div className="space-y-4">
                {techAdvantages[activeTechIndex].details?.map((detail, idx) => (
                  <p key={idx} className="text-sm text-white/80 leading-relaxed">
                    {detail}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10 w-full mb-0 h-[400px]">
          {techAdvantages.map((tech, index) => {
            // Ring 3 (Outer Solid) has radius 510px
            // Center Icon: Top of the ring -> bottom-[510px]
            // Side Icons: Positioned along the arc
            // Using translate to fine-tune exact position on the ring
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center ${
                  index === 0 ? 'lg:-translate-x-[450px] bottom-[230px]' : // Adjusted for Ring 3
                  index === 1 ? 'bottom-[480px]' : // Adjusted for Ring 3 (Radius ~510px)
                  'lg:translate-x-[450px] bottom-[230px]' // Adjusted for Ring 3
                }`}
              >
                {/* 图标样式设计：去掉外边框，图标圆环放大，里面的图标缩小 */}
                {/* 图标圆缩小一点: w-32 h-32 -> w-28 h-28 */}
                <div 
                  className={`w-28 h-28 rounded-full bg-[#0a0a0a] shadow-[0_0_30px_rgba(168,85,247,0.4)] flex flex-col items-center justify-center relative z-20 group cursor-pointer transition-all duration-300 hover:scale-110 hover:border-2 hover:border-accent ${activeTechIndex === index ? 'scale-110 border-2 border-accent shadow-[0_0_50px_rgba(168,85,247,0.6)]' : ''}`}
                  onClick={() => setActiveTechIndex(activeTechIndex === index ? null : index)}
                >
                  {/* 里面的图标缩小并向上移动 */}
                  <tech.icon className="w-8 h-8 text-accent mb-2" />
                  
                  {/* 将文字放入图标圆环里面 */}
                  <div className="text-xs font-bold text-white/80 text-center leading-tight px-3 scale-90">
                    {index === 0 ? "全源情报捕获" : 
                     index === 1 ? "智能风险决策" : 
                     "闭环处置支撑"}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};



export const ServiceProcessSection: React.FC = () => (
  <section className="h-full flex items-center justify-center bg-gradient-to-b from-transparent to-black/30">
    <div className="container mx-auto px-4 w-full">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
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

export const PartnersSection: React.FC = () => (
  <section className="h-full flex items-center justify-center container mx-auto px-4 text-center border-t border-white/5">
    <div className="w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white/40 mb-16">深受行业领袖信赖</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 place-items-center">
        {[
          'bmw.png',
          'byd.png',
          'ccdc.png',
          'gac.png',
          'gjdw.png',
          'miit.png',
          'nio.png',
          'seres.png',
          'xpeng.png',
          'more' // Marker for the "More" button
        ].map((item, i) => {
          // Check if this item is one of the logos to be enlarged
          const isEnlarged = ['ccdc.png', 'gjdw.png', 'miit.png'].includes(item);
          const isSlightlyEnlarged = ['byd.png'].includes(item);
          
          return (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-full aspect-video flex items-center justify-center bg-white rounded-xl p-6 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300"
            >
              {item === 'more' ? (
                <div className="text-gray-800 font-bold text-xl flex items-center gap-2">
                  <span>更多</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <img 
                  src={`/partners/${item}`} 
                  alt={`Partner ${i + 1}`} 
                  className={`max-w-full max-h-full object-contain ${isEnlarged ? 'scale-[1.8]' : isSlightlyEnlarged ? 'scale-125' : ''}`}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
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
