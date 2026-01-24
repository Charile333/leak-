import { motion } from 'framer-motion';
import { 
  Construction,
  Shield,
  Radio,
  Globe
} from 'lucide-react';

const Activity = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-2xl w-full relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a20]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl"
        >
          {/* 图标动画 */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-white/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-4 border-dashed border-white/10 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Construction className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            功能完善中
          </h1>
          
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            实时威胁情报流模块正在进行架构重构。我们正在接入更多的全球威胁情报源（OTX, VirusTotal等），并优化实时数据处理管道，以提供更低延迟的威胁预警。
          </p>

          {/* 进度指示器（装饰性） */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-500">全球节点</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-full h-full bg-blue-500/50" />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-2">
              <Radio className="w-5 h-5 text-red-400" />
              <span className="text-xs text-gray-500">实时流接入</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-full h-full bg-red-500/50" />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-500/80">关联分析</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-purple-500" 
                />
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Activity;
