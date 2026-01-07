import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import DomainMonitor from './pages/DomainMonitor';
import LeakQuery from './pages/LeakQuery';
import HashLookup from './pages/HashLookup';
import PageMonitor from './pages/PageMonitor';
import Analysis from './pages/Analysis';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthWrapper from './components/AuthWrapper';

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthWrapper>
          <Routes>
            {/* 登录页面 - 不需要认证 */}
            <Route path="/login" element={<Login />} />
            
            {/* 受保护的页面 - 需要登录 */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dns"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/monitor"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <DomainMonitor />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/leak-query"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <LeakQuery />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hash-lookup"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <HashLookup />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/page-monitor"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <PageMonitor />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/analysis"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Analysis />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/documentation"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Documentation />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <div className="p-8 text-center text-gray-500">告警中心模块正在开发中...</div>
                  </MainLayout>
                </PrivateRoute>
              }
            />
            
            {/* 重定向所有未匹配的路由到登录页面 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;
