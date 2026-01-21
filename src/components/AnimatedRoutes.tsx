import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import DomainMonitor from '../pages/DomainMonitor';
import Login from '../pages/Login';
import LoginVerify from '../pages/LoginVerify';
import Activity from '../pages/Activity';
import OpinionAnalysis from '../pages/OpinionAnalysis';
import EmailUsernameSearch from '../pages/EmailUsernameSearch';
import { useAuth } from '../context/AuthContext';

// 私有路由组件 - 只有登录后才能访问
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // 未登录，重定向到登录页面，并记录当前位置
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// 页面切换动画配置
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
} as const;

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 首页 */}
        <Route 
          path="/" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="w-full h-full"
            >
              <Home />
            </motion.div>
          } 
        />
        
        {/* 登录页面 */}
        <Route 
          path="/login" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="w-full h-full"
            >
              <Login />
            </motion.div>
          } 
        />
        {/* 登录链接验证页面 */}
        <Route 
          path="/login/verify" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="w-full h-full"
            >
              <LoginVerify />
            </motion.div>
          } 
        />
        
        {/* 受保护的页面 - 需要登录 */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <Dashboard />
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/monitor"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <DomainMonitor />
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <div className="p-8 text-center text-gray-500">告警中心模块正在开发中...</div>
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <Activity />
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dns"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <Dashboard />
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/email-username-search"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <EmailUsernameSearch />
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/opinion"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <OpinionAnalysis />
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/darkweb"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <div className="p-8 text-center text-gray-500">暗网及黑产泄露情报监测模块正在开发中...</div>
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/code-leak"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <div className="p-8 text-center text-gray-500">敏感代码泄露情报模块正在开发中...</div>
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/file-leak"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <div className="p-8 text-center text-gray-500">敏感文件泄露情报模块正在开发中...</div>
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/asset-compromise"
          element={
            <PrivateRoute>
              <MainLayout>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full h-full"
                >
                  <div className="p-8 text-center text-gray-500">资产失陷监测模块正在开发中...</div>
                </motion.div>
              </MainLayout>
            </PrivateRoute>
          }
        />
        
        {/* 重定向所有未匹配的路由到登录页面 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
