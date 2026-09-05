import React from 'react';
import { Star } from 'lucide-react';

interface CourseRatingBadgeProps {
  rating?: number;
  ratingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'corner-edge' | 'inline';
  className?: string;
  showCount?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const CourseRatingBadge: React.FC<CourseRatingBadgeProps> = React.memo(({
  rating,
  ratingCount,
  size = 'sm',
  position = 'top-left',
  className = '',
  showCount = true,
  onClick
}) => {
  // Default to 4.9 if no rating is set yet
  const score = rating && rating > 0 ? rating : 4.9;
  const count = ratingCount !== undefined ? ratingCount : 68;

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-1 gap-1',
    md: 'text-xs px-3 py-1.5 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  };

  const starSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-4.5 w-4.5'
  };

  let posClass = '';
  if (position === 'top-left') {
    posClass = 'absolute top-3 left-3 z-20';
  } else if (position === 'top-right') {
    posClass = 'absolute top-3 right-3 z-20';
  } else if (position === 'bottom-left') {
    posClass = 'absolute bottom-3 left-3 z-20';
  } else if (position === 'bottom-right') {
    posClass = 'absolute bottom-3 right-3 z-20';
  } else if (position === 'corner-edge') {
    posClass = 'absolute top-3 left-3 z-20';
  }

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center rounded-xl bg-[#0D1B3E]/90 dark:bg-[#080D21]/95 backdrop-blur-md text-[#F5B301] border border-[#F5B301]/50 shadow-md transition-transform hover:scale-105 select-none ${sizeClasses[size]} ${posClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title={`تقييم الطلاب: ${score.toFixed(1)} من 5 نجوم (${count} تقييم)`}
    >
      <Star className={`${starSizes[size]} fill-[#F5B301] text-[#F5B301] shrink-0 drop-shadow-xs`} />
      <span className="font-black tracking-tight font-mono">{score.toFixed(1)}</span>
      {showCount && count > 0 && (
        <span className="text-[10px] text-slate-200 dark:text-slate-300 font-medium font-mono">
          ({count})
        </span>
      )}
    </Component>
  );
});
