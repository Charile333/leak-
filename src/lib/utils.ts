import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 白名单相关类型定义
export interface WhitelistUser {
  email: string;
  addedAt: string;
  addedBy?: string;
  description?: string;
}

// 管理员相关工具
export const adminUtils = {
  // 存储键名
  ADMIN_KEY: 'leakradar_admins',
  
  // 获取管理员列表
  getAdmins(): string[] {
    try {
      const stored = localStorage.getItem(this.ADMIN_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting admins from localStorage:', error);
    }
    // 默认管理员（可根据实际情况修改）
    const defaultAdmins = ['admin@example.com', 'felix@example.com'];
    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(defaultAdmins));
    return defaultAdmins;
  },
  
  // 添加管理员
  addAdmin(email: string): void {
    try {
      const admins = this.getAdmins();
      if (!admins.includes(email.toLowerCase())) {
        admins.push(email.toLowerCase());
        localStorage.setItem(this.ADMIN_KEY, JSON.stringify(admins));
      }
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  },
  
  // 移除管理员
  removeAdmin(email: string): void {
    try {
      const admins = this.getAdmins();
      const filtered = admins.filter(admin => admin !== email.toLowerCase());
      localStorage.setItem(this.ADMIN_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  },
  
  // 检查用户是否为管理员
  isAdmin(email: string): boolean {
    try {
      const admins = this.getAdmins();
      return admins.includes(email.toLowerCase());
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    return false;
  }
};

// 白名单管理工具
export const whitelistUtils = {
  // 存储键名
  STORAGE_KEY: 'leakradar_whitelist',
  
  // 获取白名单列表
  getWhitelist(): WhitelistUser[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting whitelist from localStorage:', error);
    }
    return [];
  },
  
  // 添加用户到白名单
  addToWhitelist(email: string, addedBy?: string, description?: string): void {
    try {
      const whitelist = this.getWhitelist();
      // 检查是否已存在
      const exists = whitelist.some(user => user.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        const newUser: WhitelistUser = {
          email: email.toLowerCase(),
          addedAt: new Date().toISOString(),
          addedBy,
          description
        };
        whitelist.push(newUser);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(whitelist));
      }
    } catch (error) {
      console.error('Error adding to whitelist:', error);
    }
  },
  
  // 从白名单移除用户
  removeFromWhitelist(email: string): void {
    try {
      const whitelist = this.getWhitelist();
      const filtered = whitelist.filter(user => user.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from whitelist:', error);
    }
  },
  
  // 检查用户是否在白名单中
  isInWhitelist(email: string): boolean {
    try {
      const whitelist = this.getWhitelist();
      return whitelist.some(user => user.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.error('Error checking whitelist:', error);
    }
    return false;
  },
  
  // 清除所有白名单
  clearWhitelist(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing whitelist:', error);
    }
  }
};
