import { useState, useEffect } from 'react';
import { leakRadarApi } from '../../api/leakRadar';

const Header = () => {
  const [points, setPoints] = useState<number | string>('---');

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
        } else if ((profile as any).quota) {
          remaining = (profile as any).quota.remaining;
        } else if ((profile as any).data && (profile as any).data.quota) {
          remaining = (profile as any).data.quota.remaining;
        } else if ((profile as any).remaining !== undefined) {
          remaining = (profile as any).remaining;
        } else if ((profile as any).credits !== undefined) {
          remaining = (profile as any).credits;
        }

        // 如果找到了积分，或者是 0，都进行设置
        if (remaining !== null && remaining !== undefined) {
          setPoints(remaining);
        } else {
          // 兜底：如果 API 成功但没找到积分字段，可能是免费账户或结构变了
          console.warn('[Header] Could not find quota fields in profile:', profile);
          setPoints(0);
        }
      } catch (error: any) {
        console.error('[Header] Error fetching user data:', error);
        // 如果是开发环境且报错，可以尝试显示具体的错误状态
        const errorMsg = error.message || '';
        if (errorMsg.includes('401')) {
          setPoints('Unauth');
        } else if (errorMsg.includes('500')) {
          setPoints('Server Err');
        } else if (errorMsg.includes('404')) {
          setPoints('Not Found');
        } else {
          setPoints('Error');
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <header className="h-16 bg-transparent sticky top-0 z-40 px-8 flex items-center justify-end">
      <div className="flex items-center gap-4">
        {/* Points Display */}
        <div className="hidden md:flex items-center gap-2 bg-[#1a1a1f] border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-xs font-bold text-emerald-500">{typeof points === 'number' ? points.toLocaleString() : points} 积分</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
