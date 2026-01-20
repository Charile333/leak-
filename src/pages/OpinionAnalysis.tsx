import React from 'react';
import { motion } from 'framer-motion';
import {
  Bot
} from 'lucide-react';

const OpinionAnalysis = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Internet Opinion Intelligence
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time trend monitoring and AI-powered sentiment analysis
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a20] border border-white/5 rounded-3xl p-16 text-center"
        >
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-purple-500/20 rounded-full border border-purple-500/30">
              <Bot className="w-16 h-16 text-purple-400" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            功能完善中
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            互联网舆情AI分析功能正在紧张开发中，敬请期待！
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OpinionAnalysis;
