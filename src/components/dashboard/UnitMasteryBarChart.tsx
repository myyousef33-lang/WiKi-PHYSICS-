import React from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { ExamAttempt, Course } from '../../types';

interface UnitMasteryBarChartProps {
  attempts: ExamAttempt[];
  courses: Course[];
  onSelectUnit?: (courseId: string, unitId: string) => void;
}

export const UnitMasteryBarChart: React.FC<UnitMasteryBarChartProps> = ({
  attempts,
  courses,
  onSelectUnit
}) => {
  // Aggregate attempts by unit or course
  const unitStatsMap: Record<string, {
    title: string;
    courseTitle?: string;
    totalPercentage: number;
    count: number;
    passedCount: number;
  }> = {};

  // 1. Group by attempt unit or course
  attempts.forEach((att) => {
    const key = att.unitTitle || att.courseTitle || 'الوحدة الأولى: التيار الكهربي وقانون أوم';
    if (!unitStatsMap[key]) {
      unitStatsMap[key] = {
        title: key,
        courseTitle: att.courseTitle,
        totalPercentage: 0,
        count: 0,
        passedCount: 0
      };
    }
    unitStatsMap[key].totalPercentage += (att.percentage || 0);
    unitStatsMap[key].count += 1;
    if (att.passed) {
      unitStatsMap[key].passedCount += 1;
    }
  });

  // 2. If no attempts, populate from enrolled courses units to show 0% initial baseline
  if (Object.keys(unitStatsMap).length === 0 && courses.length > 0) {
    courses.forEach((c) => {
      (c.units || []).forEach((u) => {
        if (!unitStatsMap[u.title]) {
          unitStatsMap[u.title] = {
            title: u.title,
            courseTitle: c.title,
            totalPercentage: 0,
            count: 0,
            passedCount: 0
          };
        }
      });
    });
  }

  const unitList = Object.values(unitStatsMap).map((u) => {
    const avg = u.count > 0 ? Math.round(u.totalPercentage / u.count) : 0;
    return {
      ...u,
      average: avg
    };
  });

  if (unitList.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 text-center shadow-xs flex flex-col items-center justify-center min-h-[220px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-[#F5B301] mb-2">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-[#0D1B3E]">مستواك حسب الوحدات</h3>
        <p className="mt-1 text-xs text-[#6B7280] max-w-sm leading-relaxed">
          اشترك في كورس وأجرِ اختبارات الفصول لعرض تقييم استيعابك لكل وحدة فيزيائية.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-[#F5B301] border border-amber-200">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0D1B3E]">
              مستواك حسب الوحدات
            </h3>
            <span className="text-[11px] text-[#6B7280]">
              متوسط درجاتك الحقيقية في كل فصل ووحدة دراسية
            </span>
          </div>
        </div>

        <span className="text-xs font-bold text-[#1E4FD8] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
          {unitList.length} وحدة
        </span>
      </div>

      {/* Bar Chart list */}
      <div className="space-y-3.5 pt-1">
        {unitList.slice(0, 5).map((unit, idx) => {
          const isMastered = unit.average >= 85;
          const isGood = unit.average >= 65 && unit.average < 85;
          const needsWork = unit.average < 65 && unit.count > 0;
          const isUnattempted = unit.count === 0;

          return (
            <div key={idx} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate max-w-[75%]">
                  <span className="font-bold text-[#0D1B3E] truncate">
                    {unit.title}
                  </span>
                  {unit.count > 0 ? (
                    <span className="text-[10px] text-[#6B7280] shrink-0 font-medium">
                      ({unit.count} اختبار)
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-sm shrink-0">
                      قيد البدء
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${
                    isMastered
                      ? 'text-emerald-700'
                      : isGood
                      ? 'text-[#1E4FD8]'
                      : needsWork
                      ? 'text-amber-700'
                      : 'text-slate-400'
                  }`}>
                    {isMastered ? 'متقن' : isGood ? 'جيد' : needsWork ? 'يحتاج مراجعة' : 'لم يختبر'}
                  </span>
                  <span className="font-mono font-black text-sm text-[#0D1B3E]">
                    {unit.average}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMastered
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : isGood
                      ? 'bg-gradient-to-r from-[#1E4FD8] to-blue-400'
                      : needsWork
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${Math.max(4, unit.average)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
