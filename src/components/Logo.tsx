import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-11 w-11 text-xl',
    lg: 'h-14 w-14 text-2xl',
    xl: 'h-18 w-18 text-3xl'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Visual Physics Quantum Badge */}
      <div className="relative group">
        {/* Outer Glow Halo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#2E86FF]/40 via-[#FFB020]/30 to-[#2E86FF]/40 blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />
        
        {/* Inner Badge Frame */}
        <div className={`relative flex ${iconSizes[size]} items-center justify-center rounded-2xl bg-white dark:bg-[#16224D] border-2 border-[#1E4FD8]/40 dark:border-[#3B82F6]/60 shadow-md overflow-hidden shrink-0`}>
          
          {/* Subtle Atomic Orbit SVG in Background */}
          <svg className="absolute inset-0 h-full w-full opacity-60 animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="#1E4FD8" strokeWidth="2" strokeDasharray="4 3" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="#F5B301" strokeWidth="1.5" strokeDasharray="3 3" transform="rotate(-30 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="#1E4FD8" strokeWidth="1.5" transform="rotate(90 50 50)" />
          </svg>

          {/* Central Greek Psi Symbol (Ψ) + Quantum Spark */}
          <div className="relative z-10 flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-b from-[#0D1B3E] to-[#1E4FD8] dark:from-white dark:to-[#60A5FA] drop-shadow-sm">
            <span>Ψ</span>
          </div>

          {/* Small Quantum Particle Dot */}
          <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F5B301] shadow-[0_0_8px_#F5B301] animate-pulse" />
        </div>
      </div>

      {/* Typography: ويكي فيزياء */}
      <div className="flex flex-col text-right">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSizes[size]} font-black tracking-tight text-[#0D1B3E] dark:text-white flex items-center gap-1 whitespace-nowrap`}>
            <span>ويكي</span>
            <span className="text-[#1E4FD8] dark:text-[#38BDF8]">فيزياء</span>
          </span>
          <span className="rounded-md bg-[#1E4FD8]/10 dark:bg-[#1E4FD8]/30 border border-[#1E4FD8]/25 dark:border-[#38BDF8]/40 px-1.5 py-0.5 text-[10px] font-extrabold text-[#1E4FD8] dark:text-[#38BDF8] shadow-sm whitespace-nowrap">
            PHYSICS
          </span>
        </div>
        
        {showSubtitle && (
          <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] dark:text-slate-300 whitespace-nowrap hidden sm:block">
            المنصة الأولى لفيزياء الثانوية العامة
          </span>
        )}
      </div>
    </div>
  );
};
