import React, { useEffect, useState } from 'react';
import { Flame, Check, AlertCircle, Award, Zap } from 'lucide-react';
import { Student } from '../types';
import { StorageService } from '../services/storage';
import { triggerOrangeConfetti } from '../utils/confetti';

interface StreakBannerProps {
  student: Student;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({ student }) => {
  const [streakDays, setStreakDays] = useState(student.streakDays || 1);
  const [isNew, setIsNew] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check and update daily streak using real student data
    const res = StorageService.checkAndUpdateStudentStreak(student.id);
    setStreakDays(res.streakDays);

    if (res.isNewStreak) {
      setIsNew(true);
      triggerOrangeConfetti();
    }

    // Check if afternoon/evening and student hasn't watched a lesson today yet
    const currentHour = new Date().getHours();
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasActivityToday = student.lastActiveDate === todayStr;

    if (currentHour >= 12 && !hasActivityToday) {
      setShowWarning(true);
    }
  }, [student.id, student.lastActiveDate]);

  // Milestone calculation
  const targetMilestone = streakDays < 7 ? 7 : streakDays < 14 ? 14 : streakDays < 30 ? 30 : Math.ceil((streakDays + 1) / 10) * 10;
  
  // 7-day cycle representation for the visual tracker
  const completedInCycle = streakDays % 7 === 0 && streakDays > 0 ? 7 : streakDays % 7;
  const remainingInCycle = 7 - completedInCycle;
  const progressPercent = Math.min(100, Math.round((completedInCycle / 7) * 100));

  const dayLabels = ['ي 1', 'ي 2', 'ي 3', 'ي 4', 'ي 5', 'ي 6', 'ي 7'];

  return (
    <div className="space-y-2 font-sans" dir="rtl">
      {/* Compact Streak Card */}
      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 p-3 sm:p-4 shadow-xs">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-amber-100/80">
          
          {/* Flame & Streak Days */}
          <div className="flex items-center gap-3">
            <div className={`relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs ${isNew ? 'animate-bounce' : ''}`}>
              <Flame className="h-6 w-6 text-white fill-amber-200" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-800">الاستمرارية اليومية</span>
                <span className="text-[10px] font-bold text-slate-500">Daily Streak</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#0D1B3E] font-mono leading-none">
                  {streakDays}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  {streakDays === 1 ? 'يوم متتالي' : streakDays === 2 ? 'يومان متتاليان' : 'أيام متتالية'}
                </span>
              </div>
            </div>
          </div>

          {/* Completed vs Remaining Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <Check className="h-3 w-3 text-emerald-600" />
              <span>مكتمل: {completedInCycle} {completedInCycle === 1 ? 'يوم' : 'أيام'}</span>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-[11px] font-bold text-amber-900">
              <Zap className="h-3 w-3 text-amber-600" />
              <span>المتبقي للهدف: {remainingInCycle} {remainingInCycle === 1 ? 'يوم' : 'أيام'}</span>
            </div>
          </div>

        </div>

        {/* 7-Day Visual Track Bar (Compact & Sleek) */}
        <div className="pt-2.5 space-y-2">
          
          {/* Day Segments */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {dayLabels.map((label, idx) => {
              const dayNum = idx + 1;
              const isCompleted = dayNum <= completedInCycle;
              const isCurrent = dayNum === completedInCycle;
              const isNext = dayNum === completedInCycle + 1;

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-b from-amber-500 to-orange-500 text-white shadow-xs font-bold'
                      : isNext
                      ? 'border-2 border-dashed border-amber-400 bg-amber-50/80 text-amber-900 font-bold'
                      : 'bg-slate-100/90 text-slate-400 border border-slate-200/60'
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px] font-bold leading-tight">
                    {label}
                  </span>
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <Check className="h-3 w-3 stroke-[3]" />
                    ) : (
                      <div className={`h-1.5 w-1.5 rounded-full ${isNext ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar with Milestone */}
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#6B7280]">
              <span>إنجاز الدورة الأسبوعية ({progressPercent}%)</span>
              <span className="flex items-center gap-1 text-amber-800">
                <Award className="h-3 w-3 text-amber-600" />
                <span>الهدف القادم: {targetMilestone} يوم</span>
              </span>
            </div>
            
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#1E4FD8] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

      </div>

      {/* Afternoon Reminder Warning */}
      {showWarning && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>تذكير: حافظ على شعلتك اليوم! تصفح درساً أو حُل اختباراً سريعاً قبل منتصف الليل.</span>
          </div>
        </div>
      )}
    </div>
  );
};
