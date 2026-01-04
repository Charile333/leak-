import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import logo from '../../assets/紫色2.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isPinned, setIsPinned] = React.useState(() => {
    const saved = localStorage.getItem('sidebarPinned');
    return saved ? JSON.parse(saved) : false;
  });

  const smoothTransition = {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1] as const
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex overflow-hidden relative">
      {/* Global Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-brand/5 blur-[130px] rounded-full" />
      </div>
      
      {/* Logo in top right corner */}
      <div className="fixed top-8 right-8 z-50">
        <img 
          src={logo} 
          alt="Lysirsec Logo" 
          className="h-8 w-auto object-contain brightness-110"
        />
      </div>

      <Sidebar 
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />
      
      <motion.div 
        initial={false}
        animate={{ 
          paddingLeft: isPinned ? 256 : 80 
        }}
        transition={smoothTransition}
        className="flex-1 flex flex-col min-h-screen relative z-10 w-full"
      >
        <Header />
        <main className="p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
};

export default MainLayout;
