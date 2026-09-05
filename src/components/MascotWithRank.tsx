import React from 'react';
import { Crown, Trophy, Flame } from 'lucide-react';
import { StudentRankStats } from '../utils/studentLevels';
import { RankTierIcon } from './RankTierIcon';

interface MascotWithRankProps {
  gender?: 'male' | 'female';
  stats?: StudentRankStats;
  isHalfBody?: boolean;
  className?: string;
  imageClassName?: string;
  onClick?: () => void;
  showLevelBadge?: boolean;
}

export const MascotWithRank: React.FC<MascotWithRankProps> = ({
  gender = 'male',
  stats,
  isHalfBody = true,
  className = '',
  imageClassName = '',
  onClick,
  showLevelBadge = true
}) => {
  const isFemale = gender === 'female';
  
  const baseImageSrc = isHalfBody
    ? (isFemale ? '/images/student-mascot-female-half.png' : '/images/student-mascot-male-half.png')
    : (isFemale ? '/images/student-mascot-female.png' : '/images/student-mascot-male.png');

  const isFirst = stats?.isFirstOnPlatform ?? false;
  const isTopThree = stats?.isTopThree ?? false;
  const rank = stats?.rank ?? 1;
  const level = stats?.level;

  return (
    <div 
      className={`relative select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      onClick={onClick}
    >
      {/* 1. Base 3D Clean Mascot Character Image */}
      <img
        src={baseImageSrc}
        alt={isFemale ? 'شخصية الطالبة المتميزة' : 'شخصية الطالب المتميز'}
        referrerPolicy="no-referrer"
        className={`w-full h-auto object-contain filter drop-shadow-2xl align-bottom block transition-transform duration-300 ${onClick ? 'group-hover:scale-[1.02]' : ''} ${imageClassName}`}
      />

      {/* 2. Top-Rank Overhead Platform Trophy / Crown Floating Indicator */}
      {showLevelBadge && stats && (
        <div 
          className="absolute -top-3 sm:-top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-95 whitespace-nowrap"
        >
          {isFirst ? (
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-[11px] sm:text-xs shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/80 animate-pulse">
              <Crown className="h-4 w-4 text-slate-950 fill-slate-950" />
              <span>المركز الأول على المنصة</span>
            </div>
          ) : isTopThree ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[10px] sm:text-[11px] shadow-md shadow-blue-500/30 ring-2 ring-blue-300/60">
              <Trophy className="h-3.5 w-3.5 text-[#F5B301]" />
              <span>المركز #{rank} على المنصة</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D1B3E]/90 text-amber-300 font-bold text-[10px] sm:text-[11px] shadow-md border border-amber-400/40 backdrop-blur-xs">
              <RankTierIcon tier={level?.tier || 'bronze'} className="h-3.5 w-3.5 text-amber-300" />
              <span>رتبة {level?.badge || 'برونزي'} • #{rank}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Bottom Rank Floating Pill */}
      {showLevelBadge && stats && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-slate-950/80 text-white text-[10px] sm:text-[11px] font-mono font-black border border-white/20 shadow-md backdrop-blur-xs">
            <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span>{stats.points} نقطة</span>
          </div>
        </div>
      )}
    </div>
  );
};

