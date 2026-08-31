import React from 'react';

export const AtomicHeroVisual: React.FC = () => {
  return (
    <div className="relative mx-auto flex items-center justify-center my-3 select-none pointer-events-none">
      {/* Container with soft background glow */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        
        {/* Ambient Radial Blur Glow */}
        <div className="absolute inset-2 bg-[#2E86FF]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Orbit 1: 0 degrees angle, rotates continuously */}
        <div 
          className="absolute inset-0 flex items-center justify-center animate-[spin_18s_linear_infinite]"
          style={{ transformOrigin: 'center center' }}
        >
          <svg className="w-full h-full" viewBox="0 0 240 240">
            <ellipse 
              cx="120" cy="120" rx="95" ry="36" 
              fill="none" 
              stroke="#2E86FF" 
              strokeWidth="1.8" 
              strokeOpacity="0.5" 
              strokeDasharray="8 4"
            />
            {/* Electron 1 on Orbit 1 */}
            <circle cx="215" cy="120" r="4" fill="#2E86FF" className="shadow-[0_0_8px_#2E86FF]" />
            <circle cx="215" cy="120" r="7" fill="#2E86FF" fillOpacity="0.2" />
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
              stroke="#2E86FF" 
              strokeWidth="1.8" 
              strokeOpacity="0.4" 
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
              stroke="#2E86FF" 
              strokeWidth="1.8" 
              strokeOpacity="0.5" 
              strokeDasharray="12 4"
            />
            {/* Electron 2 on Orbit 3 */}
            <circle cx="25" cy="120" r="4" fill="#2E86FF" className="shadow-[0_0_8px_#2E86FF]" />
            <circle cx="25" cy="120" r="7" fill="#2E86FF" fillOpacity="0.2" />
          </svg>
        </div>

        {/* Center Atomic Nucleus */}
        <div className="absolute z-10 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#FFB020] shadow-[0_0_15px_#FFB020] border-2 border-[#0C1B33] animate-pulse" />
            <div className="absolute w-8 h-8 rounded-full bg-[#FFB020]/20 animate-ping pointer-events-none" />
          </div>
        </div>

        {/* Left Physics Equation Badge: E = mc² */}
        <div className="absolute -left-7 sm:-left-12 top-1/2 -translate-y-1/2 z-20 bg-[#122442]/90 backdrop-blur-md border border-[#FFB020]/40 px-2.5 py-1 rounded-xl shadow-lg shadow-[#FFB020]/10">
          <span className="text-xs sm:text-sm font-black font-mono text-[#FFB020] tracking-wide dir-ltr inline-block">
            E = mc²
          </span>
        </div>

        {/* Right Physics Equation Badge: F = ma */}
        <div className="absolute -right-7 sm:-right-12 top-1/2 -translate-y-1/2 z-20 bg-[#122442]/90 backdrop-blur-md border border-[#2E86FF]/40 px-2.5 py-1 rounded-xl shadow-lg shadow-[#2E86FF]/10">
          <span className="text-xs sm:text-sm font-black font-mono text-[#2E86FF] tracking-wide dir-ltr inline-block">
            F = ma
          </span>
        </div>

      </div>
    </div>
  );
};
