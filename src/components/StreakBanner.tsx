import React, { useEffect, useState } from 'react';
import { Flame, Sparkles, AlertCircle, Award } from 'lucide-react';
import { Student } from '../types';
import { StorageService } from '../services/storage';
import { triggerOrangeConfetti } from '../utils/confetti';

interface StreakBannerProps {
  student: Student;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({ student }) => {
  const [streakDays, setStreakDays] = useState(student.streakDays || 1);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check and update daily streak
    const res = StorageService.checkAndUpdateStudentStreak(student.id);
    setStreakDays(res.streakDays);

    if (res.isNewStreak) {
      triggerOrangeConfetti();
    }

    // Check if afternoon/evening and student hasn't watched a lesson today yet
    const currentHour = new Date().getHours();
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasActivityToday = student.lastActiveDate === todayStr;

    if (currentHour >= 12 && !hasActivityToday) {
      setShowWarning(true);
    }
  }, [student.id]);

  return (
    <div className="space-y-2 font-sans">
      {/* Main Streak Badge */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-xl shadow-md shadow-orange-500/30 animate-pulse">
            <Flame className="h-7 w-7 text-white fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>الاستمرارية اليومية المتتالية (Daily Streak)</span>
            </div>
            <h4 className="text-lg font-black text-white flex items-center gap-2">
              <span>أنت مستمر لليوم</span>
              <span className="font-mono text-2xl text-amber-400 font-black">{streakDays}</span>
              <span>على التوالي! 🔥</span>
            </h4>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
          <Award className="h-4 w-4 text-orange-400" />
          <span>استمر يومياً لزيادة مكافآتك ومستواك!</span>
        </div>
      </div>

      {/* Afternoon Reminder Warning */}
      {showWarning && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>⚠️ تذكير: لا تفقد شعلتك اليوم! تصفح درساً أو حُل اختباراً سريعاً قبل انتهاء اليوم لحفظ استمراريتك.</span>
          </div>
        </div>
      )}
    </div>
  );
};
