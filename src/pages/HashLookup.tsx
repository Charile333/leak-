import { useState } from 'react';
import { Hash, ShieldCheck, Copy, ExternalLink, AlertTriangle, Fingerprint, History } from 'lucide-react';
import { cn } from '../lib/utils';

const HashLookup = () => {
  const [hash, setHash] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash) return;
    
    setIsSearching(true);
    // 模拟 API 调用
    setTimeout(() => {
      setResults({
        hash: hash,
        type: hash.length === 32 ? 'MD5' : hash.length === 40 ? 'SHA-1' : '未知',
        found: Math.random() > 0.3,
        source: '全球密码库 #4',
        plaintext: '******** (仅限授权用户)',
        complexity: '中等',
        leaked_date: '2024-05-12'
      });
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-accent/10 rounded-2xl mb-2">
          <Fingerprint className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl font-black text-white">哈希值逆向检索</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          支持 MD5、SHA-1、SHA-256 等哈希值的反向查询，快速识别泄露密码的原始明文或关联信息。
        </p>
      </div>

      <div className="glass-card p-8 border-[#4f46e5]/20 shadow-2xl relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Hash className="w-32 h-32 rotate-12" />
        </div>

        <form onSubmit={handleSearch} className="relative z-10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">哈希字符串</label>
            <div className="relative group">
              <input 
                type="text"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="输入 MD5 或 SHA-1 哈希值..."
                className="w-full bg-black/40 border border-[#4f46e5]/20 rounded-xl px-6 py-4 text-lg font-mono focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none"
              />
              <button 
                type="submit"
                disabled={isSearching}
                className={cn(
                  "absolute right-2 top-2 bottom-2 px-8 rounded-lg font-bold text-white transition-all",
                  isSearching ? "bg-gray-700 cursor-not-allowed" : "bg-accent hover:bg-accent/80 purple-glow"
                )}
              >
                {isSearching ? '检索中...' : '立即查询'}
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>多源数据比对</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>实时结果返回</span>
            </div>
          </div>
        </form>
      </div>

      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={cn(
            "glass-card border-l-4 p-8",
            results.found ? "border-l-rose-500 border-rose-500/20" : "border-l-emerald-500 border-emerald-500/20"
          )}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {results.found ? (
                    <>
                      <AlertTriangle className="text-rose-500 w-6 h-6" />
                      发现匹配项！
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="text-emerald-500 w-6 h-6" />
                      未发现泄露记录
                    </>
                  )}
                </h3>
                <p className="text-gray-500 text-sm mt-1">检索结果基于全球 2000+ 已知泄露库</p>
              </div>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500">
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {results.found && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">原始哈希</p>
                    <p className="font-mono text-sm text-white break-all">{results.hash}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">潜在明文</p>
                    <p className="text-lg font-black text-accent">{results.plaintext}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">哈希类型</p>
                      <p className="font-bold text-white">{results.type}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">复杂度等级</p>
                      <p className="font-bold text-amber-500">{results.complexity}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">泄露来源</p>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-white">{results.source}</p>
                      <span className="text-[10px] text-gray-500">{results.leaked_date}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="glass-card p-6 border-[#4f46e5]/20">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          最近查询记录
        </h3>
        <div className="space-y-4">
          {[
            '5d41402abc4b2a76b9719d911017c592',
            '7c4a8d09ca3762af61e59520943dc26494f8941b',
            '098f6bcd4621d373cade4e832627b4f6'
          ].map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors" />
                <span className="text-sm font-mono text-gray-500 group-hover:text-gray-300">{h}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HashLookup;
