import React from 'react';

export const AtomicHeroVisual: React.FC = () => {
  return (
    <div className="relative mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
      {/* Container with soft background glow */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
        
        {/* Ambient Radial Blur Glow */}
        <div className="absolute inset-2 bg-[#1E4FD8]/10 rounded-full blur-xl pointer-events-none" />

        {/* Orbit 1: 0 degrees angle, rotates continuously */}
        <div 
          className="absolute inset-0 flex items-center justify-center animate-[spin_18s_linear_infinite]"
          style={{ transformOrigin: 'center center' }}
        >
          <svg className="w-full h-full" viewBox="0 0 240 240">
            <ellipse 
              cx="120" cy="120" rx="95" ry="36" 
              fill="none" 
              stroke="#1E4FD8" 
              strokeWidth="1.8" 
              strokeOpacity="0.4" 
              strokeDasharray="8 4"
            />
            {/* Electron 1 on Orbit 1 */}
            <circle cx="215" cy="120" r="4" fill="#1E4FD8" />
            <circle cx="215" cy="120" r="7" fill="#1E4FD8" fillOpacity="0.2" />
          </svg>
        </div>

        {/* Orbit 2: 60 degrees angle, rotates at different speed */}
        <div 
          className="absolute inset-0 flex items-center justify-center animate-[spin_22s_linear_infinite_reverse]"
          style={{ transform: 'rotate(60deg)', transformOrigin: 'center center' }}
        >
          <svg className="w-full h-full" viewBox="0 0 240 240">
            <ellipse 
              cx="120" cy="120" rx="95" ry="36" 
              fill="none" 
              stroke="#1E4FD8" 
              strokeWidth="1.8" 
              strokeOpacity="0.35" 
            />
          </svg>
        </div>

        {/* Orbit 3: 120 degrees angle, rotates at 16s speed */}
        <div 
          className="absolute inset-0 flex items-center justify-center animate-[spin_16s_linear_infinite]"
          style={{ transform: 'rotate(120deg)', transformOrigin: 'center center' }}
        >
          <svg className="w-full h-full" viewBox="0 0 240 240">
            <ellipse 
              cx="120" cy="120" rx="95" ry="36" 
              fill="none" 
              stroke="#1E4FD8" 
              strokeWidth="1.8" 
              strokeOpacity="0.4" 
              strokeDasharray="12 4"
            />
            {/* Electron 2 on Orbit 3 */}
            <circle cx="25" cy="120" r="4" fill="#1E4FD8" />
            <circle cx="25" cy="120" r="7" fill="#1E4FD8" fillOpacity="0.2" />
          </svg>
        </div>

        {/* Center Atomic Nucleus */}
        <div className="absolute z-10 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#F5B301] shadow-[0_0_12px_#F5B301] border-2 border-white animate-pulse" />
            <div className="absolute w-7 h-7 rounded-full bg-[#F5B301]/20 animate-ping pointer-events-none" />
          </div>
        </div>

        {/* Left Physics Equation Badge: E = mc² */}
        <div className="absolute -left-5 sm:-left-8 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-md border border-[#F5B301]/40 px-2 py-0.5 rounded-xl shadow-xs">
          <span className="text-[11px] sm:text-xs font-black font-mono text-[#0D1B3E] tracking-wide dir-ltr inline-block">
            E = mc²
          </span>
        </div>

        {/* Right Physics Equation Badge: F = ma */}
        <div className="absolute -right-5 sm:-right-8 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-md border border-[#1E4FD8]/30 px-2 py-0.5 rounded-xl shadow-xs">
          <span className="text-[11px] sm:text-xs font-black font-mono text-[#1E4FD8] tracking-wide dir-ltr inline-block">
            F = ma
          </span>
        </div>

      </div>
    </div>
  );
};
