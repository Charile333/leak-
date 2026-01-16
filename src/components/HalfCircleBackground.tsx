import React from 'react';

export const HalfCircleBackground: React.FC = () => {
  // 基础宽度为 600px (实心半圆)
  // 环1 (gap 60): 600 + 120 = 720px (半径 360px)
  // 环2 (gap 70): 720 + 140 = 860px (半径 430px)
  // 环3 (gap 80): 860 + 160 = 1020px (半径 510px)
  // 环4 (gap 105): 1020 + 210 = 1230px (半径 615px) - 增加 15px 间距 (90+15=105)

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1230px] h-[615px] pointer-events-none -z-10 flex items-end justify-center">
      {/* 最外层大圆环 (环4) - 虚线 - gap 105 - w-[1230px] */}
      <div className="absolute bottom-0 w-full h-full border-t border-l border-r border-dashed border-accent/30 rounded-t-full" />
      
      {/* 环3 (最外实线) - gap 80 - w-[1020px] */}
      <div className="absolute bottom-0 w-[1020px] h-[510px] border-t border-l border-r border-accent/40 rounded-t-full" />

      {/* 环2 (中间粒子环) - gap 70 - w-[860px] */}
      <div className="absolute bottom-0 w-[860px] h-[430px] overflow-hidden">
        {/* 使用 SVG 来实现更大间隔的虚线圆环 */}
        <div className="absolute inset-0 w-full h-[200%] flex items-center justify-center animate-[spin_30s_linear_infinite]">
          <svg width="860" height="860" viewBox="0 0 860 860" className="w-full h-full">
            <circle 
              cx="430" 
              cy="430" 
              r="426" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeDasharray="4 30" 
              className="text-accent/80"
            />
          </svg>
        </div>
      </div>

      {/* 环1 (内层实线) - gap 60 - w-[720px] */}
      <div className="absolute bottom-0 w-[720px] h-[360px] border-t border-l border-r border-accent rounded-t-full opacity-80" />
      
      {/* 底部实心半圆装饰 - w-[600px] - 移除光效 (shadow) */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[600px] h-[300px] border-t-2 border-accent rounded-t-full bg-accent/90 overflow-hidden flex items-end justify-center">
        <img 
          src="/diewei-w.png" 
          alt="Background Pattern" 
          className="w-[90%] h-[90%] object-contain opacity-5 translate-y-12"
        />
      </div>
      
      {/* 装饰点 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-[0_0_15px_#a855f7] z-20" />
    </div>
  );
};