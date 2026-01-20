import { motion } from 'framer-motion';
import {
  Bot,
  Search,
  BarChart3,
  MessageSquare,
  Network,
  Calendar,
  Loader2,
  Flame,
  Newspaper
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  TrendRadarAnalysisResult,
  TrendRadarLatestNewsResult,
  TrendRadarTrendingTopicsResult
} from '../api/trendRadar';
// 导入Recharts图表组件
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const OpinionAnalysis = () => {
  const [topic, setTopic] = useState('');
  const [analysisType, setAnalysisType] = useState('trend');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TrendRadarAnalysisResult | null>(null);
  
  // 热点数据状态管理
  const [loadingHotNews, setLoadingHotNews] = useState(false);
  const [latestNews, setLatestNews] = useState<TrendRadarLatestNewsResult | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendRadarTrendingTopicsResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 由于TrendRadar服务只生成HTML报告，不提供API端点，这里使用模拟数据
      let mockResult;
      
      // 根据分析类型生成不同的模拟结果
      if (analysisType === 'trend') {
        // 生成模拟趋势数据
        const mockTrendData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 100) + 50
          };
        });
        
        mockResult = {
          success: true,
          summary: {
            description: `模拟${topic}的热度趋势分析结果`,
            topic: topic,
            date_range: {
              start: dateRange.start,
              end: dateRange.end,
              total_days: 7
            },
            granularity: 'day',
            total_mentions: 500,
            average_mentions: 71,
            peak_count: 145,
            peak_time: new Date().toISOString(),
            change_rate: 0.25,
            trend_direction: '上升'
          },
          data: mockTrendData
        };
        
        setAnalysisResult({
          topic: topic,
          type: analysisType,
          dateRange: dateRange,
          data: {
            trend: mockResult.data
          },
          summary: mockResult.summary
        });
      } else if (analysisType === 'sentiment') {
        // 生成模拟情感分析结果
        mockResult = {
          success: true,
          method: 'ai_analysis',
          summary: {
            description: `模拟${topic}的情感分析结果`,
            total_found: 100,
            returned: 50,
            requested_limit: 50,
            duplicates_removed: 10,
            topic: topic,
            time_range: `${dateRange.start} to ${dateRange.end}`,
            platforms: ['微博', '抖音', '知乎'],
            sorted_by_weight: true
          },
          ai_prompt: `分析${topic}的情感倾向`,
          data: [],
          usage_note: '模拟数据仅供演示'
        };
        
        setAnalysisResult({
          topic: topic,
          type: analysisType,
          dateRange: dateRange,
          data: {
            sentiment: {
              positive: Math.floor(Math.random() * 50) + 40,
              negative: Math.floor(Math.random() * 30),
              neutral: Math.floor(Math.random() * 30) + 20
            }
          },
          summary: mockResult.summary
        });
      } else if (analysisType === 'cooccurrence') {
        // 生成模拟关键词共现分析结果
        const mockCooccurrenceData = [
          { keyword1: topic, keyword2: 'AI', count: 45 },
          { keyword1: topic, keyword2: '技术', count: 38 },
          { keyword1: topic, keyword2: '发展', count: 32 },
          { keyword1: topic, keyword2: '未来', count: 28 },
          { keyword1: topic, keyword2: '应用', count: 25 }
        ];
        
        mockResult = {
          success: true,
          summary: {
            description: `模拟${topic}的关键词共现分析结果`,
            total: 5,
            min_frequency: 25,
            generated_at: new Date().toISOString()
          },
          data: mockCooccurrenceData
        };
        
        setAnalysisResult({
          topic: topic,
          type: analysisType,
          dateRange: dateRange,
          data: {
            cooccurrence: mockResult.data
          },
          summary: mockResult.summary
        });
      }
    } catch (error) {
      console.error('分析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`分析失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisTypeName = () => {
    switch (analysisType) {
      case 'trend': return '热度趋势分析';
      case 'sentiment': return '情感分析';
      case 'cooccurrence': return '关键词共现分析';
      default: return '热度趋势分析';
    }
  };

  // 获取热点数据的函数
  const fetchHotNewsData = async () => {
    setLoadingHotNews(true);
    try {
      // 由于TrendRadar服务只生成HTML报告，不提供API端点，这里使用模拟数据
      // 模拟热点新闻数据
      const mockLatestNews = {
        success: true,
        summary: {
          description: "模拟最新新闻数据",
          total_news: 5,
          platforms: ["微博", "抖音", "知乎"],
          generated_at: new Date().toISOString()
        },
        data: [
          {
            title: "AI技术突破：H200芯片发布",
            platform: "微博",
            rank: 1,
            weight: 98.5,
            timestamp: new Date().toISOString(),
            url: "https://example.com/news/1"
          },
          {
            title: "新能源汽车销量创新高",
            platform: "抖音",
            rank: 2,
            weight: 95.2,
            timestamp: new Date().toISOString(),
            url: "https://example.com/news/2"
          },
          {
            title: "科技创新政策发布",
            platform: "知乎",
            rank: 3,
            weight: 92.8,
            timestamp: new Date().toISOString(),
            url: "https://example.com/news/3"
          },
          {
            title: "数字经济发展报告",
            platform: "微博",
            rank: 4,
            weight: 90.5,
            timestamp: new Date().toISOString(),
            url: "https://example.com/news/4"
          },
          {
            title: "人工智能伦理规范出台",
            platform: "抖音",
            rank: 5,
            weight: 88.9,
            timestamp: new Date().toISOString(),
            url: "https://example.com/news/5"
          }
        ]
      };

      // 模拟热点话题数据
      const mockTrendingTopics = {
        success: true,
        summary: {
          description: "模拟热点话题数据",
          total_topics: 5,
          mode: "current",
          extract_mode: "auto_extract",
          generated_at: new Date().toISOString()
        },
        data: [
          {
            topic: "人工智能",
            frequency: 120,
            sample_titles: ["AI技术突破：H200芯片发布", "人工智能伦理规范出台"],
            platforms: ["微博", "抖音", "知乎"]
          },
          {
            topic: "新能源汽车",
            frequency: 95,
            sample_titles: ["新能源汽车销量创新高", "充电桩建设加速"],
            platforms: ["微博", "抖音"]
          },
          {
            topic: "数字经济",
            frequency: 88,
            sample_titles: ["数字经济发展报告", "数字人民币试点扩大"],
            platforms: ["知乎", "微博"]
          },
          {
            topic: "科技创新",
            frequency: 76,
            sample_titles: ["科技创新政策发布", "科研经费投入增长"],
            platforms: ["知乎"]
          },
          {
            topic: "气候变化",
            frequency: 65,
            sample_titles: ["全球气候峰会召开", "碳减排目标推进"],
            platforms: ["微博", "抖音"]
          }
        ]
      };
      
      setLatestNews(mockLatestNews);
      setTrendingTopics(mockTrendingTopics);
    } catch (error) {
      console.error('获取热点数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`获取热点数据失败: ${errorMessage}`);
    } finally {
      setLoadingHotNews(false);
    }
  };

  // 组件加载时获取热点数据
  useEffect(() => {
    fetchHotNewsData();
  }, []);

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

        {/* Analysis Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a20] border border-white/5 rounded-3xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Topic Search */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分析话题
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="输入要分析的话题，例如：人工智能"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a30] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Analysis Type */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分析类型
                </label>
                <div className="relative">
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-[#2a2a30] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="trend">热度趋势分析</option>
                    <option value="sentiment">情感分析</option>
                    <option value="cooccurrence">关键词共现分析</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="w-5 h-5 text-gray-400">▼</div>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  日期范围
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#2a2a30] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#2a2a30] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>开始分析</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* 热点数据展示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* 热点话题卡片 */}
          <div className="bg-[#1a1a20] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl border border-orange-500/30">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">当前热点话题</h2>
              </div>
              {loadingHotNews && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
            </div>
            
            {loadingHotNews ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-[#2a2a30] rounded-xl border border-white/10 p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-3 w-3/4"></div>
                    <div className="h-3 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded mb-2 w-5/6"></div>
                    <div className="h-3 bg-gray-600 rounded w-4/6"></div>
                  </div>
                ))}
              </div>
            ) : trendingTopics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendingTopics.data.map((topic, index) => (
                  <div key={index} className="bg-[#2a2a30] rounded-xl border border-white/10 p-4 hover:border-orange-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-400">TOP {index + 1}</span>
                      <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                        {topic.frequency}次提及
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3 line-clamp-1">{topic.topic}</h3>
                    <div className="space-y-2">
                      {topic.sample_titles.slice(0, 2).map((title, idx) => (
                        <p key={idx} className="text-sm text-gray-300 line-clamp-1">
                          • {title}
                        </p>
                      ))}
                      {topic.sample_titles.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{topic.sample_titles.length - 2}条相关新闻
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {topic.platforms.slice(0, 3).map((platform, idx) => (
                        <span key={idx} className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>暂无热点话题数据</p>
              </div>
            )}
          </div>
          
          {/* 最新新闻卡片 */}
          <div className="bg-[#1a1a20] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Newspaper className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">最新新闻</h2>
              </div>
              {loadingHotNews && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
            </div>
            
            {loadingHotNews ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-[#2a2a30] rounded-xl border border-white/10 p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded mb-3"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-600 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/5"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : latestNews ? (
              <div className="space-y-4">
                {latestNews.data.map((news, index) => (
                  <a 
                    key={index} 
                    href={news.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#2a2a30] rounded-xl border border-white/10 p-4 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-2 line-clamp-2">{news.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="bg-gray-700/50 px-2 py-0.5 rounded-full">{news.platform}</span>
                          <span>排名: {news.rank}</span>
                          <span>权重: {news.weight.toFixed(2)}</span>
                          <span>{new Date(news.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>暂无最新新闻数据</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Analysis Result */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a20] border border-white/5 rounded-3xl p-8 space-y-8"
          >
            {/* Result Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {analysisResult.topic} - {getAnalysisTypeName()}
                </h2>
                <p className="text-gray-400">
                  分析日期范围：{analysisResult.dateRange.start} 至 {analysisResult.dateRange.end}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                {analysisType === 'trend' && <BarChart3 className="w-6 h-6 text-purple-400" />}
                {analysisType === 'sentiment' && <MessageSquare className="w-6 h-6 text-purple-400" />}
                {analysisType === 'cooccurrence' && <Network className="w-6 h-6 text-purple-400" />}
                <span className="text-sm font-medium">{getAnalysisTypeName()}</span>
              </div>
            </div>

            {/* Result Content */}
            <div className="space-y-6">
              {/* Trend Analysis */}
              {analysisType === 'trend' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">热度趋势图</h3>
                  <div className="h-80 bg-[#2a2a30] rounded-xl border border-white/10 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analysisResult.data.trend}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1a1a20', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="提及次数" 
                          fill="url(#colorGradient)" 
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* 趋势摘要 */}
                  {analysisResult.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#2a2a30] rounded-xl border border-white/10 p-4">
                        <div className="text-sm text-gray-400 mb-1">总提及次数</div>
                        <div className="text-2xl font-bold text-white">{analysisResult.summary.total_mentions}</div>
                      </div>
                      <div className="bg-[#2a2a30] rounded-xl border border-white/10 p-4">
                        <div className="text-sm text-gray-400 mb-1">平均每日提及</div>
                        <div className="text-2xl font-bold text-white">{analysisResult.summary.average_mentions}</div>
                      </div>
                      <div className="bg-[#2a2a30] rounded-xl border border-white/10 p-4">
                        <div className="text-sm text-gray-400 mb-1">热度趋势</div>
                        <div className={`text-2xl font-bold ${analysisResult.summary.trend_direction === '上升' ? 'text-green-400' : analysisResult.summary.trend_direction === '下降' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {analysisResult.summary.trend_direction}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sentiment Analysis */}
              {analysisType === 'sentiment' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">情感分析结果</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 饼图展示 */}
                    <div className="h-80 bg-[#2a2a30] rounded-xl border border-white/10 p-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '正面', value: analysisResult.data.sentiment?.positive || 0, color: '#10b981' },
                              { name: '中性', value: analysisResult.data.sentiment?.neutral || 0, color: '#f59e0b' },
                              { name: '负面', value: analysisResult.data.sentiment?.negative || 0, color: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                          >
                            {[
                              { name: '正面', value: analysisResult.data.sentiment?.positive || 0, color: '#10b981' },
                              { name: '中性', value: analysisResult.data.sentiment?.neutral || 0, color: '#f59e0b' },
                              { name: '负面', value: analysisResult.data.sentiment?.negative || 0, color: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1a1a20', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: '#ffffff' 
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* 情感分布详情 */}
                    <div className="space-y-6">
                      <div className="bg-[#2a2a30] rounded-xl border border-white/10 p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">情感分布详情</h4>
                        <div className="space-y-4">
                          <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-300">正面情感</span>
                                  <span className="text-sm font-medium text-green-400">{analysisResult.data.sentiment?.positive || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                  <div 
                                    className="bg-green-500 h-2.5 rounded-full" 
                                    style={{ width: `${analysisResult.data.sentiment?.positive || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-300">中性情感</span>
                                  <span className="text-sm font-medium text-yellow-400">{analysisResult.data.sentiment?.neutral || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                  <div 
                                    className="bg-yellow-500 h-2.5 rounded-full" 
                                    style={{ width: `${analysisResult.data.sentiment?.neutral || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-300">负面情感</span>
                                  <span className="text-sm font-medium text-red-400">{analysisResult.data.sentiment?.negative || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                  <div 
                                    className="bg-red-500 h-2.5 rounded-full" 
                                    style={{ width: `${analysisResult.data.sentiment?.negative || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                        </div>
                      </div>
                      
                      {/* 情感摘要 */}
                      {analysisResult.summary && (
                        <div className="bg-[#2a2a30] rounded-xl border border-white/10 p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">分析摘要</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p>总新闻数：{analysisResult.summary.total_found}</p>
                            <p>返回条数：{analysisResult.summary.returned}</p>
                            <p>去重数量：{analysisResult.summary.duplicates_removed}</p>
                            <p>涉及平台：{analysisResult.summary.platforms.join(', ')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Keyword Cooccurrence Analysis */}
              {analysisType === 'cooccurrence' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">关键词共现分析</h3>
                  <div className="h-80 bg-[#2a2a30] rounded-xl border border-white/10 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analysisResult.data.cooccurrence?.map((item: any) => ({
                          ...item,
                          name: `${item.keyword1} & ${item.keyword2}`
                        })) || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          type="number" 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                          width={180}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1a1a20', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                          formatter={(value) => [`${value}次共现`, '共现次数']}
                        />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="共现次数" 
                          fill="url(#cooccurrenceGradient)" 
                          radius={[0, 4, 4, 0]}
                        />
                        <defs>
                          <linearGradient id="cooccurrenceGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* 共现摘要 */}
                  {analysisResult.summary && (
                    <div className="bg-[#2a2a30] rounded-xl border border-white/10 p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">共现分析摘要</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">总共现对</div>
                          <div className="text-2xl font-bold text-white">{analysisResult.summary.total}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">最小共现频次</div>
                          <div className="text-2xl font-bold text-white">{analysisResult.summary.min_frequency}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm text-gray-400 mb-1">生成时间</div>
                          <div className="text-lg font-medium text-white">{analysisResult.summary.generated_at}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OpinionAnalysis;
