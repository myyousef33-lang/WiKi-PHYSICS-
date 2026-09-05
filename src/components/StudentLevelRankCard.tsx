import React from 'react';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Award, 
  Sparkles, 
  Zap, 
  TrendingUp,
  Shield,
  ChevronLeft,
  Star
} from 'lucide-react';
import { StudentRankStats, STUDENT_LEVELS } from '../utils/studentLevels';
import { RankTierIcon } from './RankTierIcon';

interface StudentLevelRankCardProps {
  stats: StudentRankStats;
  onOpenLeaderboard?: () => void;
  className?: string;
  compact?: boolean;
}

export const StudentLevelRankCard: React.FC<StudentLevelRankCardProps> = ({
  stats,
  onOpenLeaderboard,
  className = '',
  compact = false
}) => {
  const {
    points,
    rank,
    totalStudents,
    isFirstOnPlatform,
    isTopThree,
    level,
    nextLevel,
    progressToNextLevel,
    pointsToNextLevel,
    rankTitleArabic
  } = stats;

  if (compact) {
    return (
      <div 
        onClick={onOpenLeaderboard}
        className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
          isFirstOnPlatform 
            ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border-amber-400/80 shadow-xs hover:border-amber-500' 
            : 'bg-white dark:bg-[#16224D] border-slate-200 dark:border-slate-800 hover:border-blue-400 shadow-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-xs ${
            isFirstOnPlatform 
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-amber-400/50' 
              : isTopThree 
              ? 'bg-blue-100 text-[#1E4FD8] dark:bg-blue-900/60 dark:text-blue-300' 
              : 'bg-slate-100 dark:bg-slate-800 text-[#0D1B3E] dark:text-slate-200'
          }`}>
            {isFirstOnPlatform ? (
              <Crown className="h-5 w-5 text-slate-950 animate-bounce" />
            ) : isTopThree ? (
              <Trophy className="h-5 w-5 text-[#1E4FD8] dark:text-blue-300" />
            ) : (
              <span className="font-mono font-black">#{rank}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <RankTierIcon tier={level.tier} className="h-3.5 w-3.5 text-[#1E4FD8] shrink-0" />
              <span className="text-xs font-black text-[#0D1B3E] dark:text-white truncate">
                {level.title}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${level.badgeClass}`}>
                {level.badge}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] dark:text-slate-400 font-bold truncate">
              {rankTitleArabic}
            </p>
          </div>
        </div>

        <div className="text-left shrink-0">
          <span className="text-xs font-black text-[#1E4FD8] dark:text-blue-400 font-mono">
            {points} نقطة
          </span>
          {onOpenLeaderboard && (
            <span className="flex items-center justify-end text-[10px] text-[#6B7280] dark:text-slate-400 font-medium">
              <span>لوحة الشرف</span>
              <ChevronLeft className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border transition-all relative overflow-hidden p-5 sm:p-6 ${
      isFirstOnPlatform 
        ? 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-white dark:from-amber-950/40 dark:via-[#16224D] dark:to-[#0D1B3E] border-amber-300 dark:border-amber-500/60 shadow-md' 
        : 'bg-white dark:bg-[#16224D] border-slate-200/90 dark:border-slate-800 shadow-sm'
    } ${className}`}>
      
      {/* Decorative background glow */}
      {isFirstOnPlatform && (
        <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      )}

      <div className="relative z-10 space-y-4">
        
        {/* Top Row: Rank Badge & First on Platform Highlight */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Big Rank Badge Icon */}
            <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl font-black shadow-sm ${
              isFirstOnPlatform 
                ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-400 text-slate-950 ring-4 ring-amber-400/30' 
                : rank === 2 
                ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 ring-2 ring-slate-300' 
                : rank === 3 
                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 ring-2 ring-amber-600/30' 
                : 'bg-blue-50 dark:bg-blue-950/80 text-[#1E4FD8] dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {isFirstOnPlatform ? (
                <Crown className="h-7 w-7 sm:h-8 sm:w-8 text-slate-950" />
              ) : isTopThree ? (
                <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <span className="font-mono text-lg sm:text-xl">#{rank}</span>
              )}
            </div>

            <div>
              {/* Level & Badge Title */}
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-[#0D1B3E] dark:text-white">
                  المستوى {level.level}: {level.title}
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${level.badgeClass}`}>
                  {level.badge}
                </span>
              </div>

              {/* Rank Position Arabic Subtitle */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {isFirstOnPlatform ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-xs animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    <span>المركز الأول على مستوى الجمهورية والمنصة</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#1E4FD8] dark:text-blue-400">
                    {rankTitleArabic} (من بين {totalStudents} طالب)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Points Counter Badge */}
          <div className="flex items-center gap-2 bg-[#F5F7FA] dark:bg-[#0D1B3E]/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-2xl shrink-0">
            <Flame className="h-5 w-5 text-amber-500 fill-amber-400" />
            <div>
              <span className="text-[10px] text-[#6B7280] dark:text-slate-400 font-bold block">إجمالي النقاط</span>
              <span className="text-base sm:text-lg font-black text-[#0D1B3E] dark:text-white font-mono leading-none">
                {points} نقطة
              </span>
            </div>
          </div>
        </div>

        {/* Level Description */}
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-slate-300 leading-relaxed font-medium">
          {level.description}
        </p>

        {/* Progress Bar to Next Level */}
        {nextLevel ? (
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#0D1B3E] dark:text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#1E4FD8] dark:text-blue-400" />
                <span>الترقية إلى: {nextLevel.title}</span>
              </span>
              <span className="text-[#1E4FD8] dark:text-blue-400 font-mono font-black">
                باقي {pointsToNextLevel} نقطة ({progressToNextLevel}%)
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-[#1E4FD8] to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#6B7280] dark:text-slate-400 font-mono font-bold">
              <span>{level.minPoints} نقطة</span>
              <span>{nextLevel.minPoints} نقطة</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
            <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>لقد حققت أعلى رتبة (ماستر)! أنت متصدر قائمة أوائل الجمهورية.</span>
          </div>
        )}

        {/* Level Tiers Grid (Visual Progress across 6 ranks) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
          {STUDENT_LEVELS.map((lvl) => {
            const isReached = points >= lvl.minPoints;
            const isCurrent = level.level === lvl.level;

            return (
              <div
                key={lvl.level}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center border transition-all ${
                  isCurrent 
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-[#1E4FD8] ring-2 ring-blue-400/40 shadow-xs' 
                    : isReached 
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
                title={`${lvl.title} (${lvl.minPoints} نقطة)`}
              >
                <div className={`p-1.5 rounded-lg mb-1 ${
                  isCurrent ? 'bg-blue-100 text-[#1E4FD8]' : isReached ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <RankTierIcon tier={lvl.tier} className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black truncate max-w-full text-[#0D1B3E] dark:text-slate-200">
                  {lvl.badge}
                </span>
                <span className="text-[9px] font-mono font-bold text-[#6B7280] dark:text-slate-400">
                  {lvl.minPoints}ن
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA to Leaderboard */}
        {onOpenLeaderboard && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-2 text-xs font-black text-[#1E4FD8] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
            >
              <span>فتح لوحة الشرف ومنافسة الأوائل</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
