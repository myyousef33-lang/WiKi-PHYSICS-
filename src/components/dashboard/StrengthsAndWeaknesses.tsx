import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { ExamAttempt } from '../../types';

interface StrengthsAndWeaknessesProps {
  attempts: ExamAttempt[];
  onReviewTopic?: (topic: string) => void;
}

export const StrengthsAndWeaknesses: React.FC<StrengthsAndWeaknessesProps> = ({
  attempts,
  onReviewTopic
}) => {
  // Aggregate real attempts by unit/topic
  const topicMap: Record<string, { totalScore: number; maxScore: number; count: number }> = {};

  attempts.forEach((a) => {
    const key = a.unitTitle || a.courseTitle || a.examTitle;
    if (!topicMap[key]) {
      topicMap[key] = { totalScore: 0, maxScore: 0, count: 0 };
    }
    topicMap[key].totalScore += a.score;
    topicMap[key].maxScore += a.maxScore;
    topicMap[key].count += 1;
  });

  const topicList = Object.entries(topicMap).map(([title, stats]) => {
    const percentage = stats.maxScore > 0 ? Math.round((stats.totalScore / stats.maxScore) * 100) : 0;
    return { title, percentage, count: stats.count };
  });

  // Strengths: >= 75%
  const strengths = topicList
    .filter((t) => t.percentage >= 75)
    .sort((a, b) => b.percentage - a.percentage);

  // Needs review: < 75%
  const needsReview = topicList
    .filter((t) => t.percentage < 75)
    .sort((a, b) => a.percentage - b.percentage);

  if (topicList.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 text-center shadow-xs flex flex-col items-center justify-center min-h-[160px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-black text-[#0D1B3E]">نقاط القوة</h4>
          <p className="text-[11px] text-[#6B7280] mt-1">
            أجرِ اختبارات الوحدات لتحديد الموضوعات التي تميزت فيها
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 text-center shadow-xs flex flex-col items-center justify-center min-h-[160px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-black text-[#0D1B3E]">يحتاج إلى مراجعة</h4>
          <p className="text-[11px] text-[#6B7280] mt-1">
            سيظهر هنا أي جزء أو وحدة تحتاج منك لمزيد من التدريب
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Strengths */}
      <div className="rounded-2xl sm:rounded-3xl border border-emerald-100 bg-emerald-50/30 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#0D1B3E]">نقاط القوة</h4>
            <span className="text-[10px] text-[#6B7280]">أعلى الموضوعات استيعاباً وتفوقاً</span>
          </div>
        </div>

        {strengths.length === 0 ? (
          <p className="text-xs text-[#6B7280] py-3 text-center">
            واصل التدريب والامتحانات للوصول لنسبة إتقان أعلى من 75%
          </p>
        ) : (
          <div className="space-y-2">
            {strengths.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200/70"
              >
                <div className="flex items-center gap-2 truncate max-w-[80%]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-[#0D1B3E] truncate">
                    {item.title}
                  </span>
                </div>
                <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Needs Review */}
      <div className="rounded-2xl sm:rounded-3xl border border-amber-100 bg-amber-50/30 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-amber-100 pb-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#0D1B3E]">يحتاج إلى مراجعة</h4>
            <span className="text-[10px] text-[#6B7280]">موضوعات ننصح بإعادة مشاهدتها وحل تمارينها</span>
          </div>
        </div>

        {needsReview.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold">
            رائع! لا توجد وحدات بدرجة أقل من 75% حاليًا.
          </div>
        ) : (
          <div className="space-y-2">
            {needsReview.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200/70"
              >
                <div className="flex items-center gap-2 truncate max-w-[80%]">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-[#0D1B3E] truncate">
                    {item.title}
                  </span>
                </div>
                <span className="font-mono font-black text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
