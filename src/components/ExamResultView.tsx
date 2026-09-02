import React, { useEffect, useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  HelpCircle, 
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Brain,
  Share2,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storage';
import { ExamAttempt, QuizExam } from '../types';

interface ExamResultViewProps {
  attemptId: string;
  onNavigate: (view: string, params?: any) => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  attemptId,
  onNavigate
}) => {
  const [attempt, setAttempt] = useState<ExamAttempt | undefined>(StorageService.getAttemptById(attemptId));
  const [exam, setExam] = useState<QuizExam | undefined>();
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  useEffect(() => {
    const att = StorageService.getAttemptById(attemptId);
    setAttempt(att);
    if (att) {
      const ex = StorageService.getExamById(att.examId);
      setExam(ex);

      if (ex) {
        // Automatically analyze errors and update student's weakness profile
        StorageService.recordExamWeaknesses(att, ex);
      }

      if (att.passed && att.percentage >= 70) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore if canvas not supported
        }
      }
    }
  }, [attemptId]);

  const handleSendParentWhatsApp = async () => {
    if (!attempt || !exam) return;
    setIsSendingWhatsApp(true);
    try {
      const student = StorageService.getCurrentStudent() || StorageService.getStudents().find(s => s.id === attempt.studentId);
      const studentName = attempt.studentName || student?.name || 'الطالب';
      const parentPhone = student?.parentPhone || '01000000000';
      const cleanParentPhone = parentPhone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanParentPhone.startsWith('0') ? `20${cleanParentPhone.substring(1)}` : cleanParentPhone;

      const res = await fetch('/api/parent-report/whatsapp-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          parentPhone: formattedPhone,
          examTitle: attempt.examTitle,
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          passed: attempt.passed,
          feedbackNotes: attempt.passed ? 'مستوى ممتاز ومستمر في التقدم العلمي.' : 'يحتاج لمزيد من التركيز وإعادة مراجعة الدروس والمسائل ذات الصلة.'
        })
      });

      const data = await res.json();
      setIsSendingWhatsApp(false);

      if (data.success && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      } else {
        const fallbackMsg = `تقرير أداء الطالب: ${studentName}\nالاختبار: ${attempt.examTitle}\nالدرجة: ${attempt.score} من ${attempt.maxScore} (${attempt.percentage}%)\nالحالة: ${attempt.passed ? 'ناجح ومتميز' : 'يحتاج لمراجعة'}`;
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(fallbackMsg)}`;
        window.open(url, '_blank');
      }
    } catch {
      setIsSendingWhatsApp(false);
      alert('تم تجهيز التقرير، يرجى مشاركته عبر واتساب.');
    }
  };

  if (!attempt || !exam) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-[#0D1B3E]">
        <h2 className="text-xl font-bold">لم يتم العثور على تفاصيل النتيجة</h2>
        <button
          onClick={() => onNavigate('my-results')}
          className="mt-4 rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E]"
        >
          عرض سجل النتائج
        </button>
      </div>
    );
  }

  // Count correct and wrong answers
  let correctCount = 0;
  let wrongCount = 0;
  exam.questions.forEach((q) => {
    if (attempt.answers[q.id] === q.correctOptionIndex) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const minutesTaken = Math.floor(attempt.timeTakenSeconds / 60);
  const secondsTaken = attempt.timeTakenSeconds % 60;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className={`rounded-3xl border p-6 sm:p-10 text-center space-y-6 shadow-sm relative overflow-hidden bg-white ${
        attempt.passed 
          ? 'border-emerald-200'
          : 'border-rose-200'
      }`}>
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold border border-blue-200 bg-blue-50 text-[#1E4FD8]">
            <Sparkles className="h-3.5 w-3.5 text-[#1E4FD8]" />
            <span>نتيجة الاختبار النهائي</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E]">{attempt.examTitle}</h1>
          <p className="text-xs text-[#6B7280]">الطالب: {attempt.studentName}</p>
        </div>

        {/* Big Score Display */}
        <div className="flex flex-col items-center justify-center">
          <div className={`flex h-36 w-36 items-center justify-center rounded-full border-4 shadow-sm ${
            attempt.passed 
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
              : 'border-rose-500 bg-rose-50 text-rose-700'
          }`}>
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-black">{attempt.percentage}%</span>
              <p className="text-xs font-bold text-[#6B7280] mt-1">{attempt.score} / {attempt.maxScore} درجات</p>
            </div>
          </div>

          <div className="mt-4">
            <span className={`rounded-full px-5 py-1.5 text-sm font-black inline-flex items-center gap-2 shadow-xs ${
              attempt.passed 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {attempt.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <XCircle className="h-4 w-4 text-rose-700" />}
              <span>{attempt.passed ? 'تهانينا! لقد اجتزت الاختبار بنجاح' : 'لم تحقق درجة النجاح المطلوبة'}</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 text-center">
            <span className="text-[11px] text-[#6B7280] font-bold">الأسئلة الصحيحة</span>
            <p className="text-xl font-black text-emerald-600 mt-1">{correctCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 text-center">
            <span className="text-[11px] text-[#6B7280] font-bold">الأسئلة الخاطئة</span>
            <p className="text-xl font-black text-rose-600 mt-1">{wrongCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 text-center">
            <span className="text-[11px] text-[#6B7280] font-bold">الوقت المستغرق</span>
            <p className="text-xl font-black text-amber-600 mt-1">{minutesTaken}د {secondsTaken}ث</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 text-center">
            <span className="text-[11px] text-[#6B7280] font-bold">درجة النجاح</span>
            <p className="text-xl font-black text-[#0D1B3E] mt-1">{exam.passingPercentage}%</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {attempt.courseId && (
            <button
              onClick={() => onNavigate('course-details', { courseId: attempt.courseId })}
              className="rounded-xl bg-[#F5B301] px-6 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-all shadow-xs"
            >
              العودة لمنهج الكورس
            </button>
          )}

          <button
            onClick={() => onNavigate('weakness-profile')}
            className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-5 py-2.5 text-xs font-black text-purple-700 hover:bg-purple-100 transition-all shadow-xs"
          >
            <Brain className="h-4 w-4 text-purple-600" />
            <span>تحليل نقاط الضعف الذكي وخطة العلاج</span>
          </button>

          <button
            onClick={handleSendParentWhatsApp}
            disabled={isSendingWhatsApp}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <span>{isSendingWhatsApp ? 'جارٍ تجهيز التقرير...' : 'إرسال تقرير واتساب لولي الأمر'}</span>
          </button>

          {attempt.courseId && (
            <button
              onClick={() => onNavigate('course-details', { courseId: attempt.courseId })}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-xs font-bold text-[#1E4FD8] hover:bg-blue-100 transition-colors shadow-xs"
            >
              <BookOpen className="h-4 w-4 text-[#1E4FD8]" />
              <span>العودة لصفحة الكورس</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('my-results')}
            className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-5 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200 shadow-xs"
          >
            سجل النتائج الكامل
          </button>
        </div>

      </div>

      {/* Detailed Question Review & Explanation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0D1B3E]">مراجعة الإجابات ونموذج الإجابة النموذجي</h3>
            <p className="text-xs text-[#6B7280]">راجع كل سؤال مع الشرح التفصيلي لتعزيز الفهم والتركيز</p>
          </div>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1E4FD8] hover:underline"
          >
            <span>{showExplanations ? 'إخفاء الشرح' : 'عرض الشرح'}</span>
            {showExplanations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="space-y-4">
          {exam.questions.map((q, qIdx) => {
            const studentAnswer = attempt.answers[q.id];
            const isCorrect = studentAnswer === q.correctOptionIndex;
            const isUnanswered = studentAnswer === undefined;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-all bg-white shadow-xs ${
                  isCorrect
                    ? 'border-emerald-200'
                    : 'border-rose-200'
                }`}
              >
                {/* Question Head */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                      isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#0D1B3E] flex items-center gap-1.5">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>إجابة صحيحة</span>
                        </>
                      ) : isUnanswered ? (
                        <>
                          <HelpCircle className="h-4 w-4 text-amber-600" />
                          <span>لم تجب عن السؤال</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>إجابة غير صحيحة</span>
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#6B7280]">
                    {isCorrect ? `${q.points || 1}/${q.points || 1} درجات` : `0/${q.points || 1} درجات`}
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-bold text-[#0D1B3E] leading-relaxed">
                  {q.text}
                </p>

                {/* Options Breakdown */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isStudentChosen = studentAnswer === optIdx;
                    const isRightOption = q.correctOptionIndex === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                          isRightOption
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                            : isStudentChosen
                              ? 'border-rose-300 bg-rose-50 text-rose-900 font-bold'
                              : 'border-slate-200 bg-[#F5F7FA] text-[#6B7280]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold opacity-75">{String.fromCharCode(65 + optIdx)})</span>
                          <span>{opt}</span>
                        </div>

                        <div>
                          {isRightOption && (
                            <span className="rounded bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>الإجابة النموذجية</span>
                            </span>
                          )}
                          {isStudentChosen && !isRightOption && (
                            <span className="rounded bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              <span>إجابتك</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {showExplanations && q.explanation && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-1">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>الشرح والتوضيح الفيزيائي:</span>
                    </span>
                    <p className="text-xs text-amber-900 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
