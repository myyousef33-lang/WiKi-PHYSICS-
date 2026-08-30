import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Flag, 
  Send,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { QuizExam, Student, Question } from '../types';

interface QuizExamViewProps {
  examId: string;
  courseId?: string;
  lessonId?: string;
  onNavigate: (view: string, params?: any) => void;
}

export const QuizExamView: React.FC<QuizExamViewProps> = ({
  examId,
  courseId,
  lessonId,
  onNavigate
}) => {
  const [exam, setExam] = useState<QuizExam | undefined>(StorageService.getExamById(examId));
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const foundExam = StorageService.getExamById(examId);
    setExam(foundExam);
    setStudent(StorageService.getCurrentStudent());

    if (foundExam) {
      setTimeLeftSeconds(foundExam.durationMinutes * 60);
    }
  }, [examId]);

  const studentAttempts = student ? StorageService.getStudentAttempts(student.id) : [];
  const existingAttempt = studentAttempts.find(a => a.examId === examId);

  // Countdown timer & auto-submit
  useEffect(() => {
    if (!exam || timeLeftSeconds <= 0 || existingAttempt) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam, existingAttempt]);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAutoSubmit = () => {
    handleSubmitExam(true);
  };

  const handleSubmitExam = (isAuto = false) => {
    if (!exam || !student || isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    
    // Calculate Score
    let totalScore = 0;
    let maxScore = 0;

    exam.questions.forEach((q) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;
      if (answers[q.id] === q.correctOptionIndex) {
        totalScore += qPoints;
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= exam.passingPercentage;

    const attempt = StorageService.saveAttempt({
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      examId: exam.id,
      examTitle: exam.title,
      courseId: exam.courseId || courseId,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      answers,
      timeTakenSeconds
    });

    // If passed and high percentage (85%+), award certificate & trigger celebration
    if (passed) {
      if (percentage >= 85) {
        StorageService.addEarnedCertificate(student.id, {
          id: `cert-${attempt.id}`,
          examOrUnitName: exam.title,
          score: totalScore,
          maxScore: maxScore,
          percentage: percentage,
          date: new Date().toISOString()
        });
      }

      // Mark lesson complete if applicable
      if (exam.lessonId && (exam.courseId || courseId)) {
        StorageService.markLessonComplete(student.id, exam.courseId || courseId, exam.lessonId, true);
      }
    }

    onNavigate('exam-result', { attemptId: attempt.id });
  };

  if (!exam || !student) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-white">
        <h2 className="text-xl font-bold">يرجى تسجيل الدخول لبدء الامتحان</h2>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Strict 1 Attempt Display
  if (existingAttempt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center animate-in fade-in duration-300">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">لقد قمت بأداء هذا الاختبار مسبقاً</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              نظام منصة ويكيفزياء يتيح محاولة واحدة فقط لكل طالب لضمان المصداقية وتكافؤ الفرص في التقييم.
            </p>
          </div>

          {/* Previous Score Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>النتيجة المسجلة:</span>
              <span className="font-bold text-white">
                {existingAttempt.score} / {existingAttempt.maxScore} درجة ({existingAttempt.percentage}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>الحالة:</span>
              <span className={`font-bold ${existingAttempt.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {existingAttempt.passed ? 'ناجح ومجتاز ✓' : 'لم يحالفك الحظ'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>تاريخ التسليم:</span>
              <span className="font-mono text-slate-300">
                {new Date(existingAttempt.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('exam-result', { attemptId: existingAttempt.id })}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
            >
              عرض نموذج الإجابات والتقرير بالتفصيل
            </button>
            <button
              onClick={() => onNavigate('my-courses')}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              العودة لكورساتي
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ: Question | undefined = exam.questions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions.length;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const isTimeCritical = timeLeftSeconds < 180; // less than 3 minutes

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar: Exam Info + Live Timer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md sticky top-24 z-30">
        
        <div className="space-y-1 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="rounded bg-purple-500/20 text-purple-400 px-2 py-0.5 text-[10px] font-bold">
              {exam.type === 'quiz' ? 'كويز تقييمي' : 'امتحان شامل'}
            </span>
            <span className="text-xs text-slate-400">سؤال {currentQuestionIdx + 1} من {totalQuestions}</span>
          </div>
          <h2 className="font-bold text-base sm:text-lg text-white truncate max-w-md">{exam.title}</h2>
        </div>

        {/* Live Timer Countdown */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black border transition-all ${
            isTimeCritical 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
              : 'bg-slate-950 border-slate-700 text-amber-400'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono text-base tracking-wider">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => handleSubmitExam(false)}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
          >
            تسليم الإجابات
          </button>
        </div>

      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Question Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-black text-amber-400">
                {currentQuestionIdx + 1}
              </div>
              <span className="text-xs font-bold text-slate-400">الدرجة: {currentQ.points || 1} درجات</span>
            </div>

            <button
              onClick={() => toggleFlag(currentQ.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                flaggedQuestions[currentQ.id]
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              <Flag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQ.id] ? 'fill-amber-400' : ''}`} />
              <span>{flaggedQuestions[currentQ.id] ? 'محدد للمراجعة' : 'تحديد للمراجعة'}</span>
            </button>
          </div>

          {/* Question Text & Optional Image */}
          <div className="space-y-4">
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.text}
            </p>

            {currentQ.image && (
              <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                <img src={currentQ.image} alt="رسم توضيحي للسؤال" className="w-full object-contain max-h-64" />
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((optionText, optIdx) => {
              const isSelected = answers[currentQ.id] === optIdx;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 text-white font-bold shadow-md shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm">{optionText}</span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Question Navigator Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-colors ${
                currentQuestionIdx === 0
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              <span>السؤال السابق</span>
            </button>

            <span className="text-xs text-slate-400 hidden sm:inline">
              تمت الإجابة على {answeredCount} من {totalQuestions} سؤال
            </span>

            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmitExam(false)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <Send className="h-4 w-4" />
                <span>إنهاء وتسليم</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Questions Palette / Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>خريطة الأسئلة</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span> تمت الإجابة</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-700 inline-block"></span> متبقي</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block"></span> محدد للمراجعة</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {exam.questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isFlagged = flaggedQuestions[q.id];
            const isCurrent = idx === currentQuestionIdx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`h-9 w-9 rounded-xl text-xs font-bold transition-all relative ${
                  isCurrent
                    ? 'ring-2 ring-amber-400 bg-amber-500 text-slate-950 font-black scale-110 shadow-lg'
                    : isFlagged
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : isAnswered
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
