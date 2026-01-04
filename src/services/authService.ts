import axios from 'axios';

// 创建axios实例
const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/auth',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token过期或无效，清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_info');
      // 可以添加重定向到登录页的逻辑
    }
    return Promise.reject(error);
  }
);

export interface User {
  email: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  user: User;
}

// 登录 - 验证白名单并获取JWT
export const login = async (email: string): Promise<AuthResponse> => {
  const response = await authClient.post<AuthResponse>('/login', { email });
  if (response.data.success) {
    // 保存token和用户信息到本地存储
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user_email', response.data.user.email);
    localStorage.setItem('user_info', JSON.stringify(response.data.user));
  }
  return response.data;
};

// 验证token
export const verifyToken = async (): Promise<VerifyResponse> => {
  const response = await authClient.get<VerifyResponse>('/verify');
  return response.data;
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<VerifyResponse> => {
  const response = await authClient.get<VerifyResponse>('/me');
  return response.data;
};

// 登出
export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_info');
};

// 检查是否已登录
export const isLoggedIn = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const userEmail = localStorage.getItem('user_email');
  return !!token && !!userEmail;
};

// 获取当前用户
export const getCurrentUserFromStorage = (): User | null => {
  const userInfo = localStorage.getItem('user_info');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 白名单管理
export const getWhitelist = async (): Promise<string[]> => {
  const response = await authClient.get<{ success: boolean; whitelist: string[] }>('/whitelist');
  return response.data.whitelist;
};

export const addToWhitelist = async (email: string): Promise<string[]> => {
  const response = await authClient.post<{ success: boolean; whitelist: string[] }>('/whitelist', { email });
  return response.data.whitelist;
};

export const removeFromWhitelist = async (email: string): Promise<string[]> => {
  const response = await authClient.delete<{ success: boolean; whitelist: string[] }>(`/whitelist/${email}`);
  return response.data.whitelist;
};
