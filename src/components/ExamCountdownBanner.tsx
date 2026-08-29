import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles, Target, Zap, ChevronLeft } from 'lucide-react';
import { StorageService } from '../services/storage';

interface ExamCountdownBannerProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const ExamCountdownBanner: React.FC<ExamCountdownBannerProps> = ({ onNavigate }) => {
  const settings = StorageService.getSettings();
  const examDateStr = settings.ministryExamDate || '2026-06-14T09:00:00.000Z';
  const targetDate = new Date(examDateStr).getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const physicsTips = [
    '💡 نصيحة اليوم: تأكد من مراجعة العلاقات البيانية في الفصل الرابع (دوائر التيار المتردد والرنين).',
    '💡 نصيحة اليوم: مسائل كيرشوف تحتاج تحديد دقيق لاتجاهات التيارات في المسارات المغلقة.',
    '💡 نصيحة اليوم: تذكر أن ظاهرة كومتون أثبتت الطبيعة الجسيمية للإشعاع الكهرومغناطيسي.',
    '💡 نصيحة اليوم: المحول الكهربائي لا يعمل مع التيار المستمر إطلاقاً بسبب ثبات الفيض.'
  ];

  const [currentTip] = useState(() => physicsTips[Math.floor(Math.random() * physicsTips.length)]);

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Title & Daily Tip */}
        <div className="space-y-2 text-center lg:text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-black text-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>العد التنازلي لامتحان الفيزياء للثانوية العامة 2026</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            رحلة الـ 60 من 60 في الفيزياء تقترب! 🚀
          </h3>
          <p className="text-xs text-amber-200/90 font-medium">{currentTip}</p>
        </div>

        {/* Countdown Digits Grid */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{timeLeft.days}</span>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">يوم</span>
          </div>

          <div className="text-amber-500 font-black text-lg">:</div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{timeLeft.hours}</span>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">ساعة</span>
          </div>

          <div className="text-amber-500 font-black text-lg">:</div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{timeLeft.minutes}</span>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">دقيقة</span>
          </div>

          <div className="text-amber-500 font-black text-lg">:</div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{timeLeft.seconds}</span>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">ثانية</span>
          </div>
        </div>

        {/* Quick Review Plan Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('weakness-profile')}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-5 py-3 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <span>خطة المراجعة الذكية</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

      </div>
    </div>
  );
};
