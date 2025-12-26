import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  Activity,
  HelpCircle, 
  Download, 
  FolderDown, 
  Wrench,
  Pin,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/紫色2.png';
import lisirLogo from '../../assets/lisir.png';

interface SidebarProps {
  isPinned: boolean;
  setIsPinned: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isPinned, setIsPinned }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // 侧边栏实际展示宽度由 isPinned 和 isHovered 共同决定
  const effectiveCollapsed = !isPinned && !isHovered;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem('sidebarPinned', JSON.stringify(newPinned));
  };

  const toggleMenu = (name: string) => {
    if (effectiveCollapsed) {
      return;
    }
    setOpenMenus(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const menuGroups = [
    {
      name: '检索',
      icon: Search,
      items: [
        { name: '情报检索中心', path: '/' },
      ]
    },
    {
      name: '工具',
      icon: Wrench,
      items: [
        { name: '页面监测', path: '/page-monitor' },
        { name: '资产分析', path: '/analysis' },
      ]
    }
  ];

  const singleItems = [
    { name: '常见问题', icon: HelpCircle, path: '/docs' },
    { name: '数据导出', icon: Download, path: '/alerts' },
    { name: '原始下载', icon: FolderDown, path: '/raw' },
    { name: '系统设置', icon: SettingsIcon, path: '/settings' },
  ];

  const smoothTransition = {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1] as const
  };

  return (
    <motion.aside 
      initial={false}
      animate={{
        width: effectiveCollapsed ? 80 : 256,
      }}
      transition={smoothTransition}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "h-screen bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-50 group/sidebar overflow-hidden shadow-2xl",
        !effectiveCollapsed && "bg-[#0a0a0c]/95 shadow-black/50"
      )}
    >
      <div className="relative h-20 shrink-0 flex items-center justify-center overflow-hidden">
        <motion.div 
          animate={{
            x: effectiveCollapsed ? 0 : -32
          }}
          transition={smoothTransition}
          className="flex items-center gap-3"
        >
          <AnimatePresence mode="wait">
            {effectiveCollapsed ? (
              <motion.img 
                key="collapsed"
                src={lisirLogo} 
                alt="Lysirsec Logo" 
                className="h-6 w-6 object-contain brightness-110" 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={smoothTransition}
              />
            ) : (
              <motion.img 
                key="expanded"
                src={logo} 
                alt="Lysirsec Logo" 
                className="h-6 w-auto object-contain brightness-110" 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={smoothTransition}
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        <AnimatePresence>
          {!effectiveCollapsed && (
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0, rotate: isPinned ? 45 : 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={smoothTransition}
              onClick={togglePin}
              className={cn(
                "absolute right-6 p-2 rounded-lg transition-all duration-300",
                isPinned 
                  ? "bg-accent/20 text-accent shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                  : "bg-white/5 text-gray-500 hover:text-white hover:bg-white/10"
              )}
              title={isPinned ? "取消固定" : "固定菜单"}
            >
              <Pin className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {/* Collapsible Groups: Search */}
        <div className="space-y-1">
          {menuGroups.map((group, groupIndex) => {
            const Icon = group.icon;
            return (
              <React.Fragment key={group.name}>
                {groupIndex === 1 && (
                  <div className="py-2">
                    {/* High-priority Monitoring Module */}
                    <motion.div
                      animate={{
                        paddingLeft: effectiveCollapsed ? 16 : 12,
                        paddingRight: effectiveCollapsed ? 16 : 12,
                      }}
                      transition={smoothTransition}
                      className="w-full"
                    >
                      <NavLink
                        to="/monitor"
                        className={({ isActive }) => cn(
                          "flex items-center rounded-xl text-sm font-bold transition-all duration-400 group shadow-lg overflow-hidden whitespace-nowrap w-full py-2.5",
                          effectiveCollapsed ? "justify-center" : "px-3",
                          isActive 
                            ? "bg-gradient-to-r from-accent to-accent/80 text-white shadow-accent/20 scale-[1.02]" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Activity className="w-4 h-4 transition-transform duration-400 group-hover:scale-110 shrink-0" />
                        <AnimatePresence mode="popLayout">
                          {!effectiveCollapsed && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }} 
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={smoothTransition}
                              className="ml-3"
                            >
                              资产监测
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </NavLink>
                    </motion.div>
                    <div className="h-[10px]" />
                  </div>
                )}
                <div className="space-y-1">
                  <motion.div
                    animate={{
                      paddingLeft: effectiveCollapsed ? 16 : 12,
                      paddingRight: effectiveCollapsed ? 16 : 12,
                    }}
                    transition={smoothTransition}
                    className="w-full"
                  >
                    <button
                        id={`button-${group.name}`}
                        onClick={() => toggleMenu(group.name)}
                        aria-expanded={openMenus.includes(group.name)}
                        aria-controls={`menu-${group.name}`}
                        className={cn(
                          "w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all duration-400 group overflow-hidden whitespace-nowrap",
                          effectiveCollapsed ? "justify-center" : "justify-between px-3",
                          openMenus.includes(group.name)
                            ? "bg-white/10 text-white shadow-lg border border-white/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                        )}
                      >
                      <div className="flex items-center">
                        <Icon className={cn(
                          "w-4 h-4 transition-transform duration-400 shrink-0",
                          openMenus.includes(group.name) ? "text-accent scale-110" : "group-hover:scale-110"
                        )} />
                        <AnimatePresence mode="popLayout">
                          {!effectiveCollapsed && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }} 
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={smoothTransition}
                              className="font-semibold ml-3"
                            >
                              {group.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <AnimatePresence mode="popLayout">
                        {!effectiveCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1, rotate: openMenus.includes(group.name) ? 180 : 0 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={smoothTransition}
                          >
                            <ChevronDown className="w-3 h-3 opacity-50 ml-2" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                  
                  <AnimatePresence initial={false}>
                    {!effectiveCollapsed && openMenus.includes(group.name) && (
                      <motion.div
                        id={`menu-${group.name}`}
                        role="region"
                        aria-labelledby={`button-${group.name}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={smoothTransition}
                        className="overflow-hidden bg-white/5 rounded-xl mt-1 border border-white/5"
                      >
                        <div className="pl-10 pr-4 py-2 space-y-1">
                          {group.items.map((item) => (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              className={({ isActive }) => cn(
                                "block px-3 py-2 text-xs rounded-lg transition-all duration-300 whitespace-nowrap",
                                isActive 
                                  ? "text-accent font-bold bg-accent/10 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]" 
                                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                              )}
                            >
                              {item.name}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Spacing before Tools link items */}
        <div className="h-4" />

        <div className="pt-4 border-t border-white/5 space-y-1">
          {singleItems.map((item) => (
            <motion.div
              key={item.path}
              animate={{
                paddingLeft: effectiveCollapsed ? 16 : 12,
                paddingRight: effectiveCollapsed ? 16 : 12,
              }}
              transition={smoothTransition}
              className="w-full"
            >
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center py-2.5 text-sm font-medium transition-all duration-400 rounded-xl group border border-transparent overflow-hidden whitespace-nowrap w-full",
                  effectiveCollapsed ? "justify-center" : "px-3",
                  isActive 
                    ? "text-accent font-bold bg-accent/10 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] border-accent/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-400 shrink-0",
                  "group-hover:scale-110"
                )} />
                <AnimatePresence mode="popLayout">
                  {!effectiveCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={smoothTransition}
                      className="ml-3"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>

      <div className="p-4 mt-auto shrink-0">
        <motion.div 
          layout
          className={cn(
            "bg-gradient-to-br from-brand/20 to-transparent rounded-xl border border-white/5 overflow-hidden whitespace-nowrap min-h-[48px] flex flex-col justify-center",
            effectiveCollapsed ? "items-center" : "px-4"
          )}
        >
          <AnimatePresence mode="wait">
            {!effectiveCollapsed ? (
              <motion.div
                key="full-status"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={smoothTransition}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-gray-300 font-medium">
                    系统服务已就绪
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-status"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={smoothTransition}
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
