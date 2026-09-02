import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getTheme, toggleTheme, ThemeMode } from '../utils/theme';

interface ThemeToggleProps {
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showText = false }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    setMode(getTheme());
  }, []);

  const handleToggle = () => {
    const newMode = toggleTheme();
    setMode(newMode);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`relative inline-flex items-center gap-2 rounded-2xl border p-2.5 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1E4FD8] ${
        mode === 'dark'
          ? 'border-amber-500/30 bg-[#16224D] text-amber-400 hover:bg-[#1E2E66]'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#1E4FD8]'
      } ${className}`}
      title={mode === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
      aria-label="تغيير المظهر (ليلي / نهاري)"
    >
      {mode === 'dark' ? (
        <>
          <Sun className="h-5 w-5 text-amber-400 shrink-0 animate-in spin-in-90 duration-300" />
          {showText && <span className="text-xs font-bold text-amber-400">نهاري</span>}
        </>
      ) : (
        <>
          <Moon className="h-5 w-5 text-[#0D1B3E] shrink-0 animate-in spin-in-90 duration-300" />
          {showText && <span className="text-xs font-bold text-[#0D1B3E]">ليلي</span>}
        </>
      )}
    </button>
  );
};
