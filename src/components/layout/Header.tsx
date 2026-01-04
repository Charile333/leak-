
import { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import LoginModal from './LoginModal';
import { isLoggedIn, logout, getCurrentUserFromStorage } from '../../services/authService';

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedInUser, setIsLoggedInUser] = useState(isLoggedIn());
  const user = getCurrentUserFromStorage();

  const handleLoginSuccess = () => {
    setIsLoggedInUser(true);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedInUser(false);
  };

  return (
    <header className="h-16 bg-transparent sticky top-0 z-40 px-8 flex items-center justify-end">
      <div className="flex items-center gap-4">
        {isLoggedInUser ? (
          // 已登录状态
          <div className="flex items-center gap-3">
            <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border border-gray-700">
              <User className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-white">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        ) : (
          // 未登录状态
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <LogIn className="h-4 w-4" />
            登录
          </button>
        )}
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </header>
  );
};

export default Header;
