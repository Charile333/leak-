import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Globe, Users, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ParticleWaves from '../components/ParticleWaves';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 粒子波背景 */}
      <ParticleWaves />
      
      {/* 内容区域 */}
      <div className="relative z-10 flex flex-col">
        {/* 导航栏 */}
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/diewei-w.png" 
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
        <section className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              保护您的 <span className="text-accent">数字资产</span> 免受数据泄露威胁
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10 leading-relaxed">
              利用先进的数据分析和AI技术，实时监测和防范数据泄露风险，保护您的企业和客户数据安全。
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

        {/* 特性区域 */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">强大的功能特性</h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              全方位的数据泄露监测和保护方案，为您的数字资产保驾护航
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Globe className="w-12 h-12" />,
                title: "全球数据监测",
                description: "实时监测全球数千个数据泄露源，第一时间发现您的信息泄露风险",
                border: "border-white/10",
                textColor: "text-purple-400"
              },
              {
                icon: <Users className="w-12 h-12" />,
                title: "用户数据保护",
                description: "保护员工和客户数据安全，防止敏感信息泄露和滥用",
                border: "border-white/10",
                textColor: "text-blue-400"
              },
              {
                icon: <Database className="w-12 h-12" />,
                title: "深度数据分析",
                description: "利用AI技术深度分析泄露数据，提供详细的风险评估和解决方案",
                border: "border-white/10",
                textColor: "text-emerald-400"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{
                  y: -10,
                  boxShadow: `0 20px 40px -10px ${index === 0 ? 'rgba(139, 92, 246, 0.3)' : index === 1 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  scale: 1.02
                }}
                className={`bg-black/30 backdrop-blur-xl ${feature.border} rounded-2xl p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}
              >
                {/* 图标 */}
                <div className={`mb-6 rounded-xl bg-white/5 w-20 h-20 flex items-center justify-center backdrop-blur-sm`}>
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className={feature.textColor}
                  >
                    {feature.icon}
                  </motion.div>
                </div>
                
                {/* 标题 */}
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{feature.title}</h3>
                
                {/* 描述 */}
                <p className="text-white/80 leading-relaxed relative z-10">{feature.description}</p>
                
                {/* 悬停效果 - 底部线条 */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-white/20 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500`}></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 产品介绍区域 */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                全面的 <span className="text-accent">数据泄露防护</span> 解决方案
              </h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                我们的平台提供全方位的数据泄露监测、分析和防护服务，帮助您及时发现和应对数据泄露风险，保护您的企业声誉和客户信任。
              </p>
              <ul className="space-y-4">
                {[
                  "实时监测全球数据泄露源",
                  "深度分析泄露数据的风险等级",
                  "提供详细的泄露报告和修复建议",
                  "持续监测和预警机制"
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-white/80">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="mt-10 bg-accent hover:bg-accent/90 text-white font-medium px-8 py-4 rounded-full flex items-center gap-2"
                onClick={() => navigate('/login')}
              >
                开始免费试用
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl mb-6 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/50 text-center">
                      <Shield className="w-16 h-16 mx-auto mb-4" />
                      <p>数据泄露监测仪表盘</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "已监测域名", value: "1,234" },
                    { label: "发现泄露", value: "56" },
                    { label: "已修复风险", value: "48" },
                    { label: "当前风险", value: "8" }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* 装饰元素 */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </section>

        {/* 行动召唤区域 */}
        <section className="container mx-auto px-4 py-20 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-accent/20 to-accent/10 backdrop-blur-lg border border-white/20 rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              准备好保护您的数据了吗？
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto">
              立即加入我们，获得全面的数据泄露防护服务，保护您的企业和客户数据安全。
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

        {/* 页脚 */}
        <footer className="bg-black/50 border-t border-white/10 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-6 h-6 text-accent" />
                  <span className="text-lg font-bold text-white">DieWei</span>
                </div>
                <p className="text-white/60 mb-6">
                  保护您的数字资产免受数据泄露威胁，提供全面的监测和防护服务。
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">产品</h3>
                <ul className="space-y-2">
                  {["功能特性", "定价方案", "使用案例", "更新日志"].map((item, index) => (
                    <li key={index}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">解决方案</h3>
                <ul className="space-y-2">
                  {["企业安全", "政府机构", "金融服务", "医疗健康"].map((item, index) => (
                    <li key={index}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">关于我们</h3>
                <ul className="space-y-2">
                  {["公司介绍", "团队成员", "联系我们", "隐私政策"].map((item, index) => (
                    <li key={index}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 text-center text-white/60 text-sm">
              <p>© 2026 DieWei. 保留所有权利。</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;