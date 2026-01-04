import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isLoggedIn, verifyToken, getCurrentUserFromStorage } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'admin' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // 检查是否已登录
      if (!isLoggedIn()) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // 验证token有效性
        const response = await verifyToken();
        if (response.success) {
          const user = getCurrentUserFromStorage();
          const isAdminUser = user?.isAdmin || false;
          
          // 检查角色权限
          if (requiredRole === 'admin' && !isAdminUser) {
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // 监听本地存储变化，实时更新认证状态
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user_info' || e.key === 'user_email') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [requiredRole]);

  // 加载状态
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">正在验证权限...</p>
        </div>
      </div>
    );
  }

  // 未授权，显示无权限页面
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">无权访问</h2>
          <p className="text-gray-500 mb-6">您没有访问该页面的权限，请确保您已登录且具有相应角色。</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-accent hover:bg-accent/80 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 授权通过，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;