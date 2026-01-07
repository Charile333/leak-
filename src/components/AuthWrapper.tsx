import React from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  // 简化AuthWrapper，移除API密钥管理逻辑
  // 所有API请求现在通过后端代理，不需要在前端设置API密钥
  return <>{children}</>;
};

export default AuthWrapper;