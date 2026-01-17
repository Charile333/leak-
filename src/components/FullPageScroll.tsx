import React, { useState, useEffect, useRef } from 'react';

// 定义动画类型
type AnimationType = 'fade' | 'slide' | 'scale' | 'none';

// 定义配置选项接口
interface FullPageScrollConfig {
  animationType?: AnimationType;
  animationDuration?: number;
  scrollThreshold?: number;
}

// 定义组件属性接口
interface FullPageScrollProps {
  children: React.ReactNode;
  config?: FullPageScrollConfig;
  className?: string;
}

const FullPageScroll: React.FC<FullPageScrollProps> = ({ 
  children, 
  config = {},
  className = '' 
}) => {
  // 默认配置
  const defaultConfig: Required<FullPageScrollConfig> = {
    animationType: 'slide',
    animationDuration: 600,
    scrollThreshold: 100
  };

  // 合并配置
  const { animationType, animationDuration, scrollThreshold } = {
    ...defaultConfig,
    ...config
  };

  // 状态管理
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  // Removed currentEffect state as we calculate it directly now

  // 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const startYRef = useRef<number>(0);
  
  // 切换动画效果
  // useEffect(() => {
  //   // 每次切换页面时，交替使用动画效果
  //   // 偶数页切到奇数页用 stack，奇数页切到偶数页用 flip，或者随机
  //   // 这里简单地在每次滚动开始前切换
  // }, [activeIndex]);

  // 将子元素转换为数组
  const sections = React.Children.toArray(children);

  // 处理触摸开始事件
  const handleTouchStart = (e: TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  // 处理触摸结束事件
  const handleTouchEnd = (e: TouchEvent) => {
    if (isAnimating) return;

    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startYRef.current;

    handleScroll(deltaY);
  };

  // 处理鼠标滚轮事件
  const handleWheel = (e: WheelEvent) => {
    if (isAnimating) return;

    const deltaY = e.deltaY;
    handleScroll(deltaY);
  };

  // 统一处理滚动逻辑
  const handleScroll = (deltaY: number) => {
    // 判断滚动方向
    const direction = deltaY > 0 ? 'down' : 'up';
    
    // 如果动画正在进行，直接返回，避免冲突
    if (isAnimating) return;
    
    setScrollDirection(direction);

    // 检查是否超过阈值
    if (Math.abs(deltaY) < scrollThreshold) return;

    // 计算下一个活动索引
    let nextIndex = activeIndex;
    if (direction === 'down' && activeIndex < sections.length - 1) {
      nextIndex = activeIndex + 1;
    } else if (direction === 'up' && activeIndex > 0) {
      nextIndex = activeIndex - 1;
    }

    // 如果索引没有变化，不执行动画
    if (nextIndex === activeIndex) return;

    // 执行页面切换动画
    setIsAnimating(true);
    
    // 决定本次动画类型：交替使用
    // 按照用户要求：交错使用
    // 如果是从 index 0 -> 1，我们使用 stack
    // 如果是从 index 1 -> 2，我们使用 flip
    
    // 我们不再依赖 state，而是直接在 getAnimationClass 中计算
    // 这里只负责触发动画状态
    
    setIsAnimating(true);
    
    setTimeout(() => {
      setActiveIndex(nextIndex);
      setIsAnimating(false);
    }, animationDuration);
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (activeIndex < sections.length - 1) {
          handleScroll(100); // 模拟向下滚动
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (activeIndex > 0) {
          handleScroll(-100); // 模拟向上滚动
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating, activeIndex, sections.length]);

  // 添加事件监听器
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 添加触摸事件监听
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    // 添加鼠标滚轮事件监听
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 清理事件监听器
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isAnimating, activeIndex, sections.length, scrollThreshold, animationDuration]);

  // 获取当前活动的动画类名
  const getAnimationClass = (index: number) => {
    // 如果没有在动画中，只给当前页添加 active
    if (!isAnimating) {
      return index === activeIndex ? 'active' : '';
    }

    // 确定下一页和当前页
    const isNext = index === (scrollDirection === 'down' ? activeIndex + 1 : activeIndex - 1);
    const isCurrent = index === activeIndex;

    if (!isNext && !isCurrent) return '';

    let animationClass = '';
    const duration = `${animationDuration}ms`;

    switch (animationType) {
      case 'fade':
        animationClass = isNext 
          ? `animate-fade-in duration-${duration}` 
          : `animate-fade-out duration-${duration}`;
        break;
      // case 'slide': block removed to use mixed mode in default/slide below
      case 'scale':
        animationClass = isNext 
          ? `animate-scale-in duration-${duration}` 
          : `animate-scale-out duration-${duration}`;
        break;
      case 'slide': // 保持原有 slide 逻辑作为 fallback，或者如果用户没有选择 stack/flip
      default:
         // 混合模式逻辑
         // 确定本次交互的目标索引
         const targetIndex = scrollDirection === 'down' ? activeIndex + 1 : activeIndex - 1;
         
         // 决定动画类型：
         // 进入偶数页 (targetIndex % 2 === 0) -> Flip
         // 进入奇数页 (targetIndex % 2 !== 0) -> Stack
         // 修正逻辑以符合用户要求：
         // 0 -> 1 (奇数): Stack
         // 1 -> 2 (偶数): Flip
         const effectType = Math.abs(targetIndex) % 2 === 0 ? 'flip' : 'stack';
         
         // 如果是 stack
         if (effectType === 'stack') {
            if (scrollDirection === 'down') {
                if (isCurrent) animationClass = `animate-stack-up-out`; // 当前页向上滑出并缩小
                if (isNext) animationClass = `animate-stack-up-in`; // 下一页从底部覆盖上来
            } else {
                if (isCurrent) animationClass = `animate-stack-down-out`; // 当前页向下滑出并缩小
                if (isNext) animationClass = `animate-stack-down-in`; // 下一页从顶部覆盖下来
            }
         } else { // flip
            if (scrollDirection === 'down') {
                if (isCurrent) animationClass = `animate-flip-up-out`; // 当前页向上翻转消失
                if (isNext) animationClass = `animate-flip-up-in`; // 下一页从底部翻转出现
            } else {
                if (isCurrent) animationClass = `animate-flip-down-out`; // 当前页向下翻转消失
                if (isNext) animationClass = `animate-flip-down-in`; // 下一页从顶部翻转出现
            }
         }
        break;
    }

    return animationClass;
  };

  // 内联样式对象，使用正确的 CSSProperties 类型
  const containerStyle: React.CSSProperties = {
    height: '100vh',
    width: '100%',
    scrollBehavior: 'auto'
  };

  const sectionBaseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    visibility: 'hidden',
    transition: `opacity ${animationDuration}ms ease, visibility ${animationDuration}ms ease`,
    // transformOrigin removed here to let CSS classes control it
    backfaceVisibility: 'hidden', // Add backface-visibility
    WebkitBackfaceVisibility: 'hidden'
  };

  const sectionActiveStyle: React.CSSProperties = {
    opacity: 1,
    visibility: 'visible',
    transform: 'translate3d(0, 0, 0) scale(1)'
  };

  return (
    <div 
      ref={containerRef} 
      className={`full-page-scroll overflow-hidden relative ${className}`}
      style={containerStyle}
    >
      {/* CSS 样式通过类名和内联样式结合实现 */}
      <style>{`
        /* 3D 容器基础样式 */
        .full-page-scroll {
          perspective: 1000px; /* 增强透视感 */
          transform-style: preserve-3d;
        }

        /* 
          Stack 效果 (堆叠) 
          进入：从底部/顶部滑入，带有轻微缩放和遮挡感
          退出：缩小变暗，被覆盖
        */
        @keyframes stackUpIn {
          from { opacity: 0; transform: translate3d(0, 100%, 200px); z-index: 10; }
          to { opacity: 1; transform: translate3d(0, 0, 0); z-index: 10; }
        }
        @keyframes stackUpOut {
          from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: brightness(1); }
          to { opacity: 0.5; transform: translate3d(0, -20%, -100px) scale(0.9); filter: brightness(0.5); }
        }
        @keyframes stackDownIn {
          from { opacity: 0; transform: translate3d(0, -100%, 200px); z-index: 10; }
          to { opacity: 1; transform: translate3d(0, 0, 0); z-index: 10; }
        }
        @keyframes stackDownOut {
          from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: brightness(1); }
          to { opacity: 0.5; transform: translate3d(0, 20%, -100px) scale(0.9); filter: brightness(0.5); }
        }

        /* 
          Flip 效果 (3D 翻转) 
          围绕 X 轴翻转
        */
        @keyframes flipUpIn {
          from { opacity: 0; transform: rotateX(-90deg); }
          to { opacity: 1; transform: rotateX(0); }
        }
        @keyframes flipUpOut {
          from { opacity: 1; transform: rotateX(0); }
          to { opacity: 0; transform: rotateX(90deg); }
        }
        @keyframes flipDownIn {
          from { opacity: 0; transform: rotateX(90deg); }
          to { opacity: 1; transform: rotateX(0); }
        }
        @keyframes flipDownOut {
          from { opacity: 1; transform: rotateX(0); }
          to { opacity: 0; transform: rotateX(-90deg); }
        }


        /* 原有动画关键帧 (fade, slide, scale) 保留用于兼容... */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUpIn { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDownOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-100%); } }
        @keyframes slideDownIn { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(100%); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes scaleOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.2); } }

        /* 新增动画类 */
        .animate-stack-up-in { animation: stackUpIn ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-stack-up-out { animation: stackUpOut ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-stack-down-in { animation: stackDownIn ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-stack-down-out { animation: stackDownOut ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

        .animate-flip-up-in { animation: flipUpIn ${animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards; transform-origin: top center; }
        .animate-flip-up-out { animation: flipUpOut ${animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards; transform-origin: bottom center; }
        .animate-flip-down-in { animation: flipDownIn ${animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards; transform-origin: bottom center; }
        .animate-flip-down-out { animation: flipDownOut ${animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards; transform-origin: top center; }

        /* 兼容原有类 */
        .animate-fade-in { animation: fadeIn ${animationDuration}ms ease forwards; }
        .animate-fade-out { animation: fadeOut ${animationDuration}ms ease forwards; }
        .animate-slide-up-in { animation: slideUpIn ${animationDuration}ms ease forwards; }
        .animate-slide-down-out { animation: slideDownOut ${animationDuration}ms ease forwards; }
        .animate-slide-down-in { animation: slideDownIn ${animationDuration}ms ease forwards; }
        .animate-slide-up-out { animation: slideUpOut ${animationDuration}ms ease forwards; }
        .animate-scale-in { animation: scaleIn ${animationDuration}ms ease forwards; }
        .animate-scale-out { animation: scaleOut ${animationDuration}ms ease forwards; }
      `}</style>

      {sections.map((section, index) => (
        <div
          key={index}
          ref={(el) => {
            sectionsRef.current[index] = el as HTMLDivElement;
          }}
          className={`${getAnimationClass(index)} ${index === activeIndex ? 'active' : ''}`}
          style={{
            ...sectionBaseStyle,
            ...(index === activeIndex ? sectionActiveStyle : {})
          }}
        >
          {section}
        </div>
      ))}

      {/* 指示器 */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
        {sections.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setTimeout(() => {
                  setActiveIndex(index);
                  setIsAnimating(false);
                }, animationDuration);
              }
            }}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FullPageScroll;
