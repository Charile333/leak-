import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LargeSearchProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

const LargeSearch: React.FC<LargeSearchProps> = ({ 
  placeholder = "输入邮箱、用户名或域名进行检索...", 
  onSearch,
  className
}) => {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={cn("w-full flex flex-col items-center pt-[20px] pb-[15px]", className)}>
      <div className="relative w-[95%] md:w-[80%] lg:w-[70%] max-w-5xl group transition-all duration-300">
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <Search className="w-6 h-6 text-gray-500 group-focus-within:text-accent transition-colors duration-300" />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full h-16 md:h-20 pl-16 pr-32",
            "bg-white/5 backdrop-blur-md border border-white/10 rounded-[12px]",
            "text-lg md:text-xl text-white placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/10",
            "transition-all duration-300 shadow-2xl"
          )}
        />
        
        <button
          onClick={() => onSearch?.(value)}
          className={cn(
            "absolute right-3 top-3 bottom-3 px-8",
            "bg-accent hover:bg-accent/80 text-white font-bold rounded-lg",
            "transition-all duration-300 purple-glow active:scale-95",
            "hidden md:block"
          )}
        >
          检索
        </button>
      </div>
    </div>
  );
};

export default LargeSearch;
