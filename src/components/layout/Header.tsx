import { useState, useEffect } from 'react';
import { Bell, Twitter, Github, MessageCircle, Send, Linkedin, Database } from 'lucide-react';
import { leakRadarApi } from '../../api/leakRadar';

const Header = () => {
  const [points, setPoints] = useState<number | string>('---');
  const [username, setUsername] = useState('Felix');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('[Header] Fetching profile...');
        const profile = await leakRadarApi.getProfile();
        console.log('[Header] Profile Response:', profile);
        
        if (!profile) {
          throw new Error('Empty response from API');
        }

        // 深度查找积分字段
        let remaining: any = null;
        let name: string = 'Felix';

        // 记录所有可能的路径
        console.log('[Header] Checking paths in profile:', {
          user_quota: profile.user?.quota?.remaining,
          direct_quota: (profile as any).quota?.remaining,
          data_quota: (profile as any).data?.quota?.remaining,
          credits: (profile as any).credits,
          balance: (profile as any).balance,
          points: (profile as any).points
        });

        if (profile.user && profile.user.quota) {
          remaining = profile.user.quota.remaining;
          name = profile.user.username || name;
        } else if ((profile as any).quota) {
          remaining = (profile as any).quota.remaining;
          name = (profile as any).username || (profile as any).user?.username || name;
        } else if ((profile as any).data && (profile as any).data.quota) {
          remaining = (profile as any).data.quota.remaining;
          name = (profile as any).data.username || name;
        } else if ((profile as any).remaining !== undefined) {
          remaining = (profile as any).remaining;
        }

        if (remaining !== null && remaining !== undefined) {
          setPoints(remaining);
          setUsername(name);
        } else {
          console.warn('[Header] Could not find quota in profile response, using 0');
          setPoints(0);
        }
      } catch (error: any) {
        console.error('[Header] Error fetching user data:', error);
        if (error.message.includes('401')) {
          setPoints('Unauth');
        } else {
          setPoints('Error');
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <header className="h-16 bg-transparent sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex gap-4 text-gray-500">
          <Twitter className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <Github className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <Send className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <MessageCircle className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <Linkedin className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Points Display */}
        <div className="hidden md:flex items-center gap-2 bg-[#1a1a1f] border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-xs font-bold text-emerald-500">{typeof points === 'number' ? points.toLocaleString() : points} 积分</span>
        </div>

        {/* Storage Display */}
        <div className="hidden md:flex items-center gap-2 bg-[#1a1a1f] border-[#4f46e5]/30 border px-3 py-1.5 rounded-full">
          <Database className="w-3.5 h-3.5 text-[#a855f7]" />
          <span className="text-xs font-bold text-[#a855f7]">0 GB 存储</span>
        </div>

        <div className="h-8 w-px bg-white/5 mx-2" />
        
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#a855f7] rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-[#4f46e5] transition-colors">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white">{username}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 border border-black" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
