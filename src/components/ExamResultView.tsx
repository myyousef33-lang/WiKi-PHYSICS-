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
  ChevronUp
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

  useEffect(() => {
    const att = StorageService.getAttemptById(attemptId);
    setAttempt(att);
    if (att) {
      const ex = StorageService.getExamById(att.examId);
      setExam(ex);

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

  if (!attempt || !exam) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-white">
        <h2 className="text-xl font-bold">لم يتم العثور على تفاصيل النتيجة</h2>
        <button
          onClick={() => onNavigate('my-results')}
          className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950"
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
      <div className={`rounded-3xl border p-6 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden ${
        attempt.passed 
          ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950'
          : 'border-rose-500/30 bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950'
      }`}>
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold border border-slate-700 bg-slate-800/80 text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>نتيجة الاختبار النهائي</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{attempt.examTitle}</h1>
          <p className="text-xs text-slate-400">الطالب: {attempt.studentName}</p>
        </div>

        {/* Big Score Display */}
        <div className="flex flex-col items-center justify-center">
          <div className={`flex h-36 w-36 items-center justify-center rounded-full border-4 shadow-2xl ${
            attempt.passed 
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
              : 'border-rose-500 bg-rose-500/10 text-rose-400'
          }`}>
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-black">{attempt.percentage}%</span>
              <p className="text-xs font-bold text-slate-300 mt-1">{attempt.score} / {attempt.maxScore} درجات</p>
            </div>
          </div>

          <div className="mt-4">
            <span className={`rounded-full px-5 py-1.5 text-sm font-black inline-block shadow-md ${
              attempt.passed 
                ? 'bg-emerald-500 text-slate-950' 
                : 'bg-rose-500 text-white'
            }`}>
              {attempt.passed ? '🎉 تهانينا! لقد اجتزت الاختبار بنجاح' : '❌ لم تحقق درجة النجاح المطلوبة'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-bold">الأسئلة الصحيحة</span>
            <p className="text-xl font-black text-emerald-400 mt-1">✓ {correctCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-bold">الأسئلة الخاطئة</span>
            <p className="text-xl font-black text-rose-400 mt-1">✕ {wrongCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-bold">الوقت المستغرق</span>
            <p className="text-xl font-black text-amber-400 mt-1">{minutesTaken}د {secondsTaken}ث</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-bold">درجة النجاح</span>
            <p className="text-xl font-black text-slate-300 mt-1">{exam.passingPercentage}%</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {attempt.courseId && (
            <button
              onClick={() => onNavigate('course-details', { courseId: attempt.courseId })}
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
            >
              العودة لمنهج الكورس
            </button>
          )}

          <button
            onClick={() => onNavigate('exam-runner', { examId: exam.id, courseId: attempt.courseId })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span>إعادة المحاولة</span>
          </button>

          <button
            onClick={() => onNavigate('my-results')}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white"
          >
            سجل النتائج الكامل
          </button>
        </div>

      </div>

      {/* Detailed Question Review & Explanation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">مراجعة الإجابات ونموذج الإجابة النموذجي</h3>
            <p className="text-xs text-slate-400">راجع كل سؤال مع الشرح التفصيلي لتعزيز الفهم والتركيز</p>
          </div>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
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
                className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-all ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                {/* Question Head */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                      isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {isCorrect ? '✓ إجابة صحيحة' : isUnanswered ? '✕ لم تجب عن السؤال' : '✕ إجابة غير صحيحة'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    {isCorrect ? `${q.points || 1}/${q.points || 1} درجات` : `0/${q.points || 1} درجات`}
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
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
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                            : isStudentChosen
                              ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold'
                              : 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold opacity-75">{String.fromCharCode(65 + optIdx)})</span>
                          <span>{opt}</span>
                        </div>

                        <div>
                          {isRightOption && (
                            <span className="rounded bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              الإجابة النموذجية ✓
                            </span>
                          )}
                          {isStudentChosen && !isRightOption && (
                            <span className="rounded bg-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                              إجابتك ✕
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {showExplanations && q.explanation && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1">
                    <span className="text-xs font-bold text-amber-400">💡 الشرح والتوضيح الفيزيائي:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{q.explanation}</p>
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
