import React from 'react';
import { Award, Calendar, CheckCircle2, AlertCircle, ChevronLeft, ArrowUpRight } from 'lucide-react';
import { ExamAttempt } from '../../types';

interface RecentExamsTableProps {
  attempts: ExamAttempt[];
  onViewAll?: () => void;
  onReviewAttempt?: (attemptId: string) => void;
  onTakeExam?: () => void;
}

export const RecentExamsTable: React.FC<RecentExamsTableProps> = ({
  attempts,
  onViewAll,
  onReviewAttempt,
  onTakeExam
}) => {
  // Sort descending by submission date
  const sortedAttempts = [...attempts].sort((a, b) => {
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  const displayList = sortedAttempts.slice(0, 5);

  if (displayList.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-xs flex flex-col items-center justify-center min-h-[220px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 mb-2">
          <Award className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-[#0D1B3E]">سجل الامتحانات</h3>
        <p className="mt-1 text-xs text-[#6B7280] max-w-sm leading-relaxed">
          لم تسجل أي اختبارات بعد. ابدأ بحل أسئلة الدروس أو امتحانات الفصول لتظهر نتائجك وتفاصيلها هنا.
        </p>
        {onTakeExam && (
          <button
            onClick={onTakeExam}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#1E4FD8] px-4 py-2 text-xs font-bold text-white hover:bg-[#163cb5] transition-all cursor-pointer shadow-xs"
          >
            <span>اختبر نفسك الآن</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0D1B3E]">
              سجل الامتحانات
            </h3>
            <span className="text-[11px] text-[#6B7280]">
              آخر الاختبارات والتقييمات المنجزة
            </span>
          </div>
        </div>

        {onViewAll && sortedAttempts.length > 5 && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-bold text-[#1E4FD8] hover:underline cursor-pointer"
          >
            <span>عرض كل الاختبارات ({sortedAttempts.length})</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* List / Table */}
      <div className="space-y-2.5">
        {displayList.map((att) => {
          const isPassed = att.passed;
          const formattedDate = new Date(att.submittedAt).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div
              key={att.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-200/60 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
            >
              {/* Exam title & info */}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isPassed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>مجتاز</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        <span>يحتاج تدريب</span>
                      </>
                    )}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0D1B3E] truncate">
                    {att.examTitle}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </span>
                  <span>•</span>
                  <span>الدرجة: {att.score} / {att.maxScore}</span>
                  {att.timeTakenSeconds > 0 && (
                    <>
                      <span>•</span>
                      <span>الزمن: {Math.round(att.timeTakenSeconds / 60)} دقيقة</span>
                    </>
                  )}
                </div>
              </div>

              {/* Score & Review Action */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className={`font-mono font-black text-sm sm:text-base px-2.5 py-1 rounded-xl border ${
                  isPassed
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}>
                  {att.percentage}%
                </span>

                {onReviewAttempt && (
                  <button
                    onClick={() => onReviewAttempt(att.id)}
                    className="flex items-center gap-1 text-xs font-bold text-[#1E4FD8] bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>عرض التفاصيل</span>
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
