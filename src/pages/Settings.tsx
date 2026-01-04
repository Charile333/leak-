import { useState, useEffect } from 'react';
import { Shield, Key, Lock, User, Bell, Database, Save, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { leakRadarApi } from '../api/leakRadar';
import { whitelistUtils, type WhitelistUser } from '../lib/utils';

const Settings = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [activeTab, setActiveTab] = useState('基本资料');
  const [newEmail, setNewEmail] = useState('');
  const [whitelist, setWhitelist] = useState<WhitelistUser[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await leakRadarApi.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile in settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 加载白名单
  useEffect(() => {
    const loadWhitelist = () => {
      setWhitelist(whitelistUtils.getWhitelist());
    };
    loadWhitelist();
  }, []);

  // 添加用户到白名单
  const handleAddToWhitelist = () => {
    if (!newEmail.trim() || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newEmail)) {
      setMessage({ type: 'error', content: '请输入有效的电子邮箱地址' });
      return;
    }

    whitelistUtils.addToWhitelist(newEmail, profile?.user?.email);
    setWhitelist(whitelistUtils.getWhitelist());
    setNewEmail('');
    setMessage({ type: 'success', content: '用户已成功添加到白名单' });
    setTimeout(() => setMessage({ type: '', content: '' }), 3000);
  };

  // 从白名单移除用户
  const handleRemoveFromWhitelist = (email: string) => {
    whitelistUtils.removeFromWhitelist(email);
    setWhitelist(whitelistUtils.getWhitelist());
    setMessage({ type: 'success', content: '用户已成功从白名单移除' });
    setTimeout(() => setMessage({ type: '', content: '' }), 3000);
  };

  const handleSave = () => {
    setMessage({ type: 'success', content: '设置已成功保存（模拟）' });
    setTimeout(() => setMessage({ type: '', content: '' }), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white tracking-tight">账户设置</h1>
        <p className="text-gray-500 font-medium">管理您的个人资料、API 访问及系统偏好设置。</p>
      </div>

      {message.content && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{message.content}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左侧导航 */}
        <div className="space-y-2">
          {[
            { name: '基本资料', icon: User, active: activeTab === '基本资料' },
            { name: 'API 管理', icon: Key, active: activeTab === 'API 管理' },
            { name: '白名单管理', icon: Shield, active: activeTab === '白名单管理' },
            { name: '安全中心', icon: Lock, active: activeTab === '安全中心' },
            { name: '通知提醒', icon: Bell, active: activeTab === '通知提醒' },
            { name: '数据存储', icon: Database, active: activeTab === '数据存储' },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                item.active 
                  ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="md:col-span-2 space-y-8">
          {activeTab === '基本资料' && (
            <>
              {/* 基本资料 */}
              <section className="glass-card p-8 border-white/5">
                <h3 className="text-lg font-black text-white mb-6">基本资料</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">用户名</label>
                      <input 
                        type="text" 
                        defaultValue={profile?.user?.username || 'Felix'}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">显示名称</label>
                      <input 
                        type="text" 
                        defaultValue="Felix Chen"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">电子邮箱</label>
                    <input 
                      type="email" 
                      defaultValue={profile?.user?.email || 'felix@example.com'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-4">
                <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors">
                  重置修改
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20"
                >
                  <Save className="w-4 h-4" />
                  保存更改
                </button>
              </div>
            </>
          )}

          {activeTab === 'API 管理' && (
            <>
              {/* API 管理 */}
              <section className="glass-card p-8 border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">API 访问令牌</h3>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded uppercase tracking-widest border border-emerald-500/20">
                    后端托管中
                  </span>
                </div>
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl mb-6">
                  <div className="flex gap-3">
                    <Lock className="w-5 h-5 text-accent shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      <strong>安全说明：</strong> 您的 API Key 目前已通过后端代理进行安全托管。
                      前端请求将自动通过代理转发并注入凭证，您无需在代码中直接暴露 Key。
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">当前 API 状态</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm text-white font-medium">已连接到 LeakRadar API</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === '白名单管理' && (
            <>
              {/* 白名单管理 */}
              <section className="glass-card p-8 border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">白名单管理</h3>
                  <span className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-black rounded uppercase tracking-widest border border-accent/20">
                    {whitelist.length} 个用户
                  </span>
                </div>

                {/* 添加白名单表单 */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-8">
                  <h4 className="text-sm font-black text-white mb-4">添加新用户到白名单</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="输入电子邮箱地址"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                    />
                    <button
                      onClick={handleAddToWhitelist}
                      className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      添加到白名单
                    </button>
                  </div>
                </div>

                {/* 白名单列表 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">电子邮箱</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">添加时间</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">添加人</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {whitelist.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="text-gray-500 text-sm">暂无白名单用户</div>
                            <div className="text-gray-600 text-xs mt-1">使用上方表单添加用户到白名单</div>
                          </td>
                        </tr>
                      ) : (
                        whitelist.map((user, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-white">{user.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-gray-500">
                                {new Date(user.addedAt).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-gray-500">{user.addedBy || '系统'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRemoveFromWhitelist(user.email)}
                                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
