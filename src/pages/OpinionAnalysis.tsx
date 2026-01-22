import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  MessageSquare, 
  Activity,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { trendApi, type TrendArticle, type AnalysisResult } from '../api/trendApi';

const OpinionAnalysis = () => {
  const [trends, setTrends] = useState<TrendArticle[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // 初始化加载
  useEffect(() => {
    checkBackend();
    fetchData();
  }, []);

  const checkBackend = async () => {
    const isOnline = await trendApi.checkHealth();
    setApiStatus(isOnline ? 'online' : 'offline');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trendsData, analysisData] = await Promise.all([
        trendApi.getTrends(50),
        trendApi.getAnalysis(20)
      ]);
      setTrends(trendsData);
      setAnalysis(analysisData);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据（如果后端为空）
  const displayTrends = trends.length > 0 ? trends : [
    { id: 1, title: '等待后端采集数据中...', source: 'System', publish_time: new Date().toISOString(), url: '#' },
    { id: 2, title: '请确保 AWS 上的 TrendRadar 容器正常运行', source: 'System', publish_time: new Date().toISOString(), url: '#' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6">
      {/* 顶部状态栏 */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            舆情态势感知
          </h1>
          <p className="text-gray-400 mt-1">实时监控全网热点，AI 智能研判风险</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
            apiStatus === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            {apiStatus === 'online' ? '后端在线' : '连接断开'}
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* 左侧：实时舆情流 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-[#1a1a20] rounded-xl border border-white/5 p-6 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="text-blue-400" /> 
                实时资讯流
              </h2>
              <div className="flex gap-2">
                {['全部', '微博', '知乎', 'Twitter'].map(src => (
                  <button key={src} className="px-3 py-1 text-xs bg-white/5 rounded-md hover:bg-white/10">
                    {src}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {displayTrends.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.05] transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded">
                          {item.source}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.publish_time).toLocaleString()}
                        </span>
                      </div>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-base font-medium text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </a>
                    </div>
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：AI 分析概览 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* 情感分布 */}
          <div className="bg-[#1a1a20] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-purple-400" />
              AI 情感研判
            </h2>
            <div className="h-48 flex items-center justify-center">
              {analysis.length > 0 ? (
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {analysis.filter(a => a.sentiment === 'negative').length}
                  </div>
                  <div className="text-sm text-gray-400">今日负面预警</div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">暂无分析数据</div>
              )}
            </div>
          </div>

          {/* 热门关键词 */}
          <div className="bg-[#1a1a20] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="text-green-400" />
              热词云
            </h2>
            <div className="flex flex-wrap gap-2">
              {['网络安全', '数据泄露', '漏洞', '勒索软件', 'APT攻击'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300 border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpinionAnalysis;
