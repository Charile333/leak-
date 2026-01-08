import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle } from 'lucide-react';
import dieLogo from '../assets/diep.png';
import purpleLogo from '../assets/紫色2.png';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ParticleWaves from '../components/ParticleWaves';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  // 从localStorage加载记住的邮箱
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // 邮箱格式验证
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 表单验证
  const validateForm = (): boolean => {
    let isValid = true;
    
    // 重置错误信息
    setEmailError('');
    setError('');
    
    // 邮箱验证
    if (!email.trim()) {
      setEmailError('请输入邮箱');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱格式');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
      // 验证表单
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }
      
      const trimmedEmail = email.trim();
      
      // 保存记住的邮箱
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', trimmedEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      const result = await loginWithCredentials(trimmedEmail);
      if (!result.success) {
        setError(result.message || '登录失败');
      } else {
        // 登录成功，跳转到首页
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的输入或网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 粒子波背景 */}
      <ParticleWaves />
      
      {/* 右上角logo */}
      <div className="absolute top-4 right-4 z-10">
        <motion.img
          src={purpleLogo}
          alt="Purple Logo"
          className="h-16 w-auto object-contain opacity-60"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
            className="flex items-center justify-center mb-4"
          >
            <img 
              src={dieLogo} 
              alt="Product Logo" 
              className="h-32 w-32 object-contain rounded-full" 
            />
          </motion.div>
        </div>

        {/* Login Form */}
        <motion.div
          className="glass-card p-8 border border-white/10 rounded-2xl shadow-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  邮箱
                </label>
                {emailError && (
                  <motion.div 
                    className="flex items-center text-xs text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    {emailError}
                  </motion.div>
                )}
              </div>
              <div className="relative">
                <motion.input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-accent'}`}
                  disabled={isLoading}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center text-sm mt-2">
              <motion.div 
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-accent bg-white/5 border-white/10 rounded focus:ring-accent"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-400">
                  记住我
                </label>
              </motion.div>
            </div>

            {/* Global Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              发送登录链接
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
          </form>
        </motion.div>


      </motion.div>
    </div>
  );
};

export default Login;
