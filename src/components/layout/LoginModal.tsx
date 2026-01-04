import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { login } from '../../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!email || !email.includes('@')) {
        throw new Error('请输入有效的邮箱地址');
      }

      await login(email);
      setSuccess('登录成功！正在跳转...');
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-[#111114] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-3 rounded-full">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white">管理员登录</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              placeholder="请输入您的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm"
            >
              {success}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>登录中...</span>
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>仅白名单用户可登录，如未授权请联系管理员</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginModal;
