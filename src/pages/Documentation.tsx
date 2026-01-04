import { Book, Shield, Zap, Terminal, Code, Lock } from 'lucide-react';

const Documentation = () => {
  const sections = [
    {
      title: '系统架构',
      icon: Code,
      content: '基于 React 19 + Vite 7 构建的企业级情报监测平台。采用 Tailwind CSS v4 引擎实现高性能、响应式的深色系 UI 系统。数据可视化由 Recharts 驱动，提供毫秒级的图表渲染性能。'
    },
    {
      title: '域名监控机制',
      icon: Shield,
      content: '系统通过分布式爬虫集群和公开情报源（OSINT）实时检索目标域名的安全漏洞。监控频率支持实时（秒级）、每小时、每日三种级别，确保企业资产变更在第一时间被捕获。'
    },
    {
      title: '泄露检测算法',
      icon: Zap,
      content: '集成全球主流泄露数据库，支持精确和模糊匹配。采用布隆过滤器技术加速海量数据检索，并结合机器学习模型对泄露源的真实性和影响范围进行分级（极高/高/中/低）。'
    },
    {
      title: '安全审计与合规',
      icon: Lock,
      content: '所有查询请求均经过加密处理，且支持敏感词过滤和访问审计日志。平台符合 GDPR 和等保 2.0 相关安全标准，确保监测过程本身的合法合规。'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-[#4f46e5]/30 rounded-2xl purple-glow mb-2">
          <Book className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">系统技术文档</h1>
        <p className="text-gray-400 text-lg">LeakRadar Pro 核心技术架构与安全规范指南</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="glass-card p-8 border-[#4f46e5]/20 hover:border-accent/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-[#4f46e5]/20 rounded-lg">
                <section.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">{section.title}</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 border-[#4f46e5]/20 bg-gradient-to-r from-[#4f46e5]/10 to-transparent">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent" />
          部署与性能指标
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="text-sm text-gray-400">平均检索延迟 (10B 数据量)</span>
            <span className="text-accent font-mono">&lt; 150ms</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="text-sm text-gray-400">并发处理能力</span>
            <span className="text-accent font-mono">10,000+ QPS</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="text-sm text-gray-400">系统可用性 (SLA)</span>
            <span className="text-accent font-mono">99.99%</span>
          </div>
        </div>
      </div>

      <div className="text-center pb-12">
        <p className="text-xs text-gray-600">
          © 2025 LeakRadar Security Group. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Documentation;
