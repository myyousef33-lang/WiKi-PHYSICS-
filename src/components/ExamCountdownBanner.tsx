import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles, Target, Zap, ChevronLeft } from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';

interface ExamCountdownBannerProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const ExamCountdownBanner: React.FC<ExamCountdownBannerProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  useEffect(() => {
    const unsub = subscribeToStorage(() => {
      setSettings(StorageService.getSettings());
    });
    return unsub;
  }, []);

  const rawExamDate = settings.ministryExamDate;
  let parsedTarget = rawExamDate ? new Date(rawExamDate).getTime() : NaN;
  
  // If no valid date or stored date has already passed, fallback to June 14, 2027
  if (isNaN(parsedTarget) || parsedTarget <= Date.now()) {
    parsedTarget = new Date('2027-06-14T09:00:00.000Z').getTime();
  }
  const targetDate = parsedTarget;

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
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const physicsTips = [
    'نصيحة اليوم: تأكد من مراجعة العلاقات البيانية في الفصل الرابع (دوائر التيار المتردد والرنين).',
    'نصيحة اليوم: مسائل كيرشوف تحتاج تحديد دقيق لاتجاهات التيارات في المسارات المغلقة.',
    'نصيحة اليوم: تذكر أن ظاهرة كومتون أثبتت الطبيعة الجسيمية للإشعاع الكهرومغناطيسي.',
    'نصيحة اليوم: المحول الكهربائي لا يعمل مع التيار المستمر إطلاقاً بسبب ثبات الفيض.'
  ];

  const [currentTip] = useState(() => physicsTips[Math.floor(Math.random() * physicsTips.length)]);

  return (
    <div className="rounded-3xl border border-[#2E86FF]/30 bg-[#122442] p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Title & Daily Tip */}
        <div className="space-y-2 text-center lg:text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2E86FF]/40 bg-[#2E86FF]/10 px-3 py-0.5 text-[11px] font-black text-[#2E86FF]">
            <Clock className="h-3.5 w-3.5 text-[#2E86FF]" />
            <span>العد التنازلي لامتحان الفيزياء للثانوية العامة</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            رحلة الـ 60 من 60 في الفيزياء تقترب!
          </h3>
          <p className="text-xs text-slate-300 font-medium">{currentTip}</p>
        </div>

        {/* Countdown Digits Grid */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="rounded-2xl border border-[#1E375E] bg-[#0C1B33] p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-[#FFB020] font-mono">{timeLeft.days}</span>
            <span className="text-[10px] text-slate-300 font-bold block mt-0.5">يوم</span>
          </div>

          <div className="text-[#FFB020] font-black text-lg">:</div>

          <div className="rounded-2xl border border-[#1E375E] bg-[#0C1B33] p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{timeLeft.hours}</span>
            <span className="text-[10px] text-slate-300 font-bold block mt-0.5">ساعة</span>
          </div>

          <div className="text-[#FFB020] font-black text-lg">:</div>

          <div className="rounded-2xl border border-[#1E375E] bg-[#0C1B33] p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{timeLeft.minutes}</span>
            <span className="text-[10px] text-slate-300 font-bold block mt-0.5">دقيقة</span>
          </div>

          <div className="text-[#FFB020] font-black text-lg">:</div>

          <div className="rounded-2xl border border-[#1E375E] bg-[#0C1B33] p-3 sm:p-4 text-center min-w-[65px] sm:min-w-[75px] shadow-lg">
            <span className="text-xl sm:text-2xl font-black text-[#FFB020] font-mono">{timeLeft.seconds}</span>
            <span className="text-[10px] text-slate-300 font-bold block mt-0.5">ثانية</span>
          </div>
        </div>

        {/* Quick Review Plan Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('weakness-profile')}
            className="flex items-center gap-1.5 rounded-2xl bg-[#FFB020] px-5 py-3 text-xs font-black text-[#0C1B33] hover:bg-[#e59e1c] transition-all shadow-md shadow-[#FFB020]/20 shrink-0"
          >
            <span>خطة المراجعة الذكية</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

      </div>
    </div>
  );
};
