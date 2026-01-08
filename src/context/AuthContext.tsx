import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  loginWithCredentials: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyLoginLink: (token: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // 从localStorage获取认证状态
    const savedAuth = localStorage.getItem('leakradar_auth');
    return savedAuth ? JSON.parse(savedAuth) : false;
  });

  // 登录方法 - 调用白名单登录API
  const loginWithCredentials = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // 根据环境动态选择API地址
      const isProduction = import.meta.env.PROD;
      const BASE_URL = isProduction ? '' : 'http://localhost:3001';
      const API_PREFIX = isProduction ? '/api' : '';
      const loginUrl = `${BASE_URL}${API_PREFIX}/auth/login`;
      
      // 调用白名单登录API
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'same-origin', // 仅在同域请求中包含凭证
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || '登录失败'
        };
      }

      // 登录成功，保存认证状态
      setIsAuthenticated(true);
      localStorage.setItem('leakradar_auth', 'true');
      
      // 保存用户信息
      if (data.user) {
        localStorage.setItem('leakradar_user', JSON.stringify(data.user));
      }

      return { success: true };
    } catch (error: any) {
      console.error('登录错误:', error);
      return { 
        success: false, 
        message: error.message || '登录失败，请检查网络连接'
      };
    }
  };

  // 登录链接验证方法
  const verifyLoginLink = async (token: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // 根据环境动态选择API地址
      const isProduction = import.meta.env.PROD;
      const BASE_URL = isProduction ? '' : 'http://localhost:3001';
      const API_PREFIX = isProduction ? '/api' : '';
      // 修复：使用正确的API路径，我们的后端只实现了/api/auth/login，没有/api/auth/login/verify
      const verifyUrl = `${BASE_URL}${API_PREFIX}/auth/login?token=${token}`;
      
      // 调用登录链接验证API
      const response = await fetch(verifyUrl, {
        method: 'GET',
        credentials: 'same-origin', // 仅在同域请求中包含凭证
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || '登录验证失败'
        };
      }

      // 验证成功，设置认证状态
      setIsAuthenticated(true);
      localStorage.setItem('leakradar_auth', 'true');
      
      // 保存用户信息
      if (data.user) {
        localStorage.setItem('leakradar_user', JSON.stringify(data.user));
      }

      return { success: true };
    } catch (error: any) {
      console.error('登录验证错误:', error);
      return { 
        success: false, 
        message: error.message || '登录验证失败，请检查网络连接' 
      };
    }
  };

  // 登出方法
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('leakradar_auth');
    localStorage.removeItem('leakradar_user');
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, loginWithCredentials, verifyLoginLink, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义Hook，方便组件使用AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
