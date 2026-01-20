import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Original images from the demo (now local)
const baseData = [
  { 
    id: '1', 
    src: "/card/card-1.png", 
    title: "全源情报捕获",
    desc: [
      "需覆盖暗网Tor/I2P网络、35+主流代码平台、黑产Telegram/Discord社群，钓鱼插件等立体监测面",
      "建立包含数据特征指纹、交易模式画像、攻击者身份图谱的多维情报仓库"
    ]
  },
  { 
    id: '2', 
    src: "/card/card-2.png", 
    title: "智能风险决策",
    desc: [
      "建立3200万节点企业数字资产关系网，实现「0.5%数据碎片→完整业务系统→APT组织画像」的链式追溯",
      "自研NLP框架可解析黑市暗语47类变体（如用「蔬菜包」指代用户信息、「钢板价」隐喻商业秘密交易）"
    ]
  },
  { 
    id: '3', 
    src: "/card/card-3.png", 
    title: "闭环处置支撑",
    desc: [
      "提供月度报告以及年度报告，线上咨询，给予事件闭环支撑",
      "减缓外泄行为带来的负面影响，弥补安全能力的短板"
    ]
  },
];

// Construct a 5-card array for stacking effect, cycling through baseData
// We want the visible stack order (Top -> Bottom) to be: 1, 2, 3, 1, 2
// In DOM/React array, the last element is rendered on top.
// So array should be: [Bottom...Top]
// Array: [2, 1, 3, 2, 1]
// Index 4 (Top): 1
// Index 3: 2
// Index 2: 3
// Index 1: 1
// Index 0 (Bottom): 2

// Let's re-verify the request: "1-2-3 cycle"
// If Top is 1. Next click -> 1 goes away, 2 becomes Top.
// Next click -> 2 goes away, 3 becomes Top.
// Next click -> 3 goes away, 1 becomes Top.

// Current array logic:
// const originalImages = [
//   { ...baseData[1], id: 'img-2-bottom' }, // 2
//   { ...baseData[0], id: 'img-1-bottom' }, // 1
//   { ...baseData[2], id: 'img-3-middle' }, // 3
//   { ...baseData[1], id: 'img-2-top' },    // 2
//   { ...baseData[0], id: 'img-1-top' },    // 1 (Top)
// ];

// When we pop 1 (Top):
// Array becomes [2, 1, 3, 2] -> Top is 2. Correct.
// We unshift 1 to bottom: [1, 2, 1, 3, 2].
// Next pop 2 (Top):
// Array becomes [1, 2, 1, 3] -> Top is 3. Correct.
// We unshift 2 to bottom: [2, 1, 2, 1, 3].
// Next pop 3 (Top):
// Array becomes [2, 1, 2, 1] -> Top is 1. Correct.

// The issue described by user: "1-2-1-2-3"
// Let's trace the current code:
// Base: 1, 2, 3
// Init Array: [2, 1, 3, 2, 1] (Top is 1)
// Click 1 -> Pop 1. Rem: [2, 1, 3, 2]. Top is 2. Unshift 1. New: [1, 2, 1, 3, 2]. Correct so far (1->2).
// Click 2 -> Pop 2. Rem: [1, 2, 1, 3]. Top is 3. Unshift 2. New: [2, 1, 2, 1, 3]. Correct so far (2->3).
// Click 3 -> Pop 3. Rem: [2, 1, 2, 1]. Top is 1. Unshift 3. New: [3, 2, 1, 2, 1]. Correct so far (3->1).
// Click 4 -> Pop 1. Rem: [3, 2, 1, 2]. Top is 2. Unshift 1. New: [1, 3, 2, 1, 2]. Correct (1->2).

// Wait, why did the user see 1-2-1-2-3?
// Maybe the baseData indices were confusing.
// baseData[0] is 1. baseData[1] is 2. baseData[2] is 3.

// Let's just reset the array to be strictly compliant with the visual stack 1(Top), 2, 3, 1, 2(Bottom).
// Array (Bottom -> Top): [2, 1, 3, 2, 1]
// This matches my manual trace.

// However, let's look at the initialization in code:
// const originalImages = [
//   { ...baseData[1], id: 'img-2-bottom' },
//   { ...baseData[0], id: 'img-1-bottom' },
//   { ...baseData[2], id: 'img-3-middle' },
//   { ...baseData[1], id: 'img-2-top' },
//   { ...baseData[0], id: 'img-1-top' },
// ];

// If the user says it's wrong, maybe I should just strictly ensure the order.
// I will re-enforce the initialization to be absolutely sure.
const originalImages = [
  { ...baseData[1], id: 'img-2-bh' },
  { ...baseData[0], id: 'img-1-bh' },
  { ...baseData[2], id: 'img-3-bh' },
  { ...baseData[1], id: 'img-2-bh-2' },
  { ...baseData[0], id: 'img-1-top' },
];

export const FlipCardOriginal: React.FC = () => {
  const [cards, setCards] = useState(originalImages);

  const moveCard = () => {
    setCards((currentCards) => {
      // Logic for 1-2-3 cyclic rotation
      // Remove Top (index 4)
      // Add New Bottom (index 0)
      // The New Bottom must be calculated based on the REMOVED Top card to maintain sequence.
      // Sequence: 1 -> 2 -> 3 -> 1...
      // If removed Top is 1 (index 0 in baseData), New Bottom must be 3 (index 2 in baseData) so that when it eventually rises, it follows 2.
      // Wait, let's trace stack:
      // [B, ..., T]
      // [2, 1, 3, 2, 1] (Top 1)
      // Pop 1. Stack: [2, 1, 3, 2].
      // We want the stack to look like: [3, 2, 1, 3, 2] (Top 2)
      // So we need to add 3 to bottom.
      // Formula: NewBottom = (RemovedTop.index + 2) % 3.
      // (0 + 2) % 3 = 2 (Card 3). Correct.

      // Let's try Pop 2 (index 1).
      // Stack: [3, 2, 1, 3, 2] (Top 2)
      // Pop 2. Stack: [3, 2, 1, 3].
      // We want stack: [1, 3, 2, 1, 3] (Top 3)
      // So we need to add 1 to bottom.
      // Formula: (1 + 2) % 3 = 0 (Card 1). Correct.

      const newCards = [...currentCards];
      const lastCard = newCards.pop();
      
      if (lastCard) {
        // Find which baseData item this was
        const lastIndex = baseData.findIndex(item => item.title === lastCard.title);
        
        // Calculate next item to add to bottom
        // Logic: The item we add to bottom will be visible after 4 more clicks.
        // It's actually easier to think: The card we just removed (1) will appear again after 2 and 3.
        // So we are cycling 3 items in a 5-slot buffer.
        // Actually, simpler logic: Just rotate the baseData index.
        // If we just removed 1, we should add... let's see.
        // If we add 1 to bottom: [1, 2, 1, 3, 2] -> Top 2.
        // Next pop 2. Add 2. [2, 1, 2, 1, 3] -> Top 3.
        // Next pop 3. Add 3. [3, 2, 1, 2, 1] -> Top 1.
        // This simple rotation works! Why did I think it failed?
        // Ah, because I was reusing the object spread `...lastCard`.
        // If `lastCard` had some stale state or id, maybe?
        // No, let's stick to the formula that definitely works:
        // New Bottom should be: (RemovedIndex + 2) % 3
        
        const nextBottomIndex = (lastIndex + 2) % 3;
        const newBaseItem = baseData[nextBottomIndex];
        
        const newCard = { 
            ...newBaseItem, 
            id: `img-${Date.now()}` 
        };
        newCards.unshift(newCard);
      }
      return newCards;
    });
  };

  // 获取当前最上面的卡片（数组最后一个）
  const topCard = cards[cards.length - 1];

  return (
    <div className="relative w-full h-[500px] flex items-center justify-between perspective-100 max-w-6xl mx-auto px-4">
      {/* 左侧：卡片区域 */}
      <div 
        className="relative w-[300px] h-[200px] cursor-pointer" 
        onClick={moveCard}
        style={{
            transform: 'translateX(0%)' 
        }}
      >
        <AnimatePresence mode='popLayout'>
          {cards.map((card, index) => {
            // CSS Logic Replication:
            // .item:nth-child(5) { left: 0; top: 0; } -> Top card (Last in DOM/Array)
            // .item:nth-child(4) { left: 20px; top: -20px; }
            // ...
            
            // In our array, the last element (index = length-1) is the top card.
            const offsetStep = cards.length - 1 - index;
            
            // CSS: left increases by 20px, top decreases by 20px (moves up)
            // But wait, the demo CSS:
            // nth-child(5) (Top): 0, 0
            // nth-child(4) (Below): left 20px, top -20px
            // nth-child(1) (Bottom): left 80px, top -80px
            
            const xOffset = offsetStep * 20; 
            const yOffset = -offsetStep * 20;

            return (
              <motion.img
                key={card.id}
                layoutId={card.id}
                src={card.src}
                alt=""
                initial={{ 
                  y: 60, // approx 20% of 300px or relative container
                  opacity: 0 
                }}
                animate={{
                  x: xOffset,
                  y: yOffset,
                  scale: 1,
                  zIndex: index,
                  opacity: 1,
                }}
                exit={{
                  x: -15, // -5% of 300px
                  y: 10,  // 5% of 200px? (Demo aspect ratio is 2/3, so height ~450px?)
                          // Wait, .slider is 300x200. .item is width 300, aspect-ratio 2/3.
                          // So item height is 450px.
                          // 5% of 450 is ~22.5px.
                  opacity: 0,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                transition={{
                  layout: { duration: 0.4, ease: "easeInOut" },
                  opacity: { duration: 0.3, ease: "easeOut" }
                }}
                className="absolute shadow-xl object-cover rounded-lg"
                style={{
                  width: '300px',
                  aspectRatio: '2/3',
                  transformOrigin: "bottom left",
                  left: 0,
                  top: 0,
                  // The CSS sets position absolute.
                  // We simulate the stacking context.
                }}
              />
            );
          })}
        </AnimatePresence>
        
        {/* Button simulation */}
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-pulse">
            Click to Flip
        </div>
      </div>

      {/* 右侧：标题区域 */}
      <div className="flex-1 flex items-center justify-end pl-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={topCard.title} // Use title to trigger animation
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-right"
          >
            <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 leading-tight">
              {topCard.title}
            </h2>
            <div className="w-24 h-2 bg-accent mt-6 ml-auto rounded-full" />
            
            <div className="mt-8 space-y-4 max-w-xl ml-auto">
              {(topCard as any).desc?.map((text: string, i: number) => (
                <p key={i} className="text-lg text-white/60 font-light leading-relaxed">
                  {text}
                </p>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
