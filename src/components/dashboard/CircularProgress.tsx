import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  primaryColor?: string;
  trackColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  title = 'نسبة الإنجاز',
  subtitle = 'من إجمالي المحتوى',
  className = '',
  primaryColor = '#1E4FD8',
  trackColor = '#E2E8F0'
}) => {
  const cleanPercent = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercent / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Foreground progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#0D1B3E] tracking-tight">
            {cleanPercent}%
          </span>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            مكتمل
          </span>
        </div>
      </div>

      {title && (
        <span className="mt-2 text-xs font-bold text-[#0D1B3E]">
          {title}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] text-[#6B7280]">
          {subtitle}
        </span>
      )}
    </div>
  );
};
