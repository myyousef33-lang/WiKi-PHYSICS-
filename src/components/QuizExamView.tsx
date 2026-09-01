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
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-[#0D1B3E]">
        <h2 className="text-xl font-bold">يرجى تسجيل الدخول لبدء الامتحان</h2>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E]"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#0D1B3E]">لقد قمت بأداء هذا الاختبار مسبقاً</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              نظام منصة ويكيفزياء يتيح محاولة واحدة فقط لكل طالب لضمان المصداقية وتكافؤ الفرص في التقييم.
            </p>
          </div>

          {/* Previous Score Box */}
          <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>النتيجة المسجلة:</span>
              <span className="font-bold text-[#0D1B3E]">
                {existingAttempt.score} / {existingAttempt.maxScore} درجة ({existingAttempt.percentage}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>الحالة:</span>
              <span className={`font-bold ${existingAttempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {existingAttempt.passed ? 'ناجح ومجتاز' : 'لم يحالفك الحظ'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>تاريخ التسليم:</span>
              <span className="font-mono text-[#0D1B3E]">
                {new Date(existingAttempt.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('exam-result', { attemptId: existingAttempt.id })}
              className="flex-1 rounded-xl bg-[#F5B301] py-3 text-xs font-bold text-[#0D1B3E] shadow-sm hover:bg-[#e0a401] transition-all"
            >
              عرض نموذج الإجابات والتقرير بالتفصيل
            </button>
            <button
              onClick={() => onNavigate('my-courses')}
              className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-5 py-3 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200 transition-colors"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-md sticky top-24 z-30">
        
        <div className="space-y-1 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="rounded bg-blue-50 text-[#1E4FD8] px-2 py-0.5 text-[10px] font-bold border border-blue-200">
              {exam.type === 'quiz' ? 'كويز تقييمي' : 'امتحان شامل'}
            </span>
            <span className="text-xs text-[#6B7280]">سؤال {currentQuestionIdx + 1} من {totalQuestions}</span>
          </div>
          <h2 className="font-bold text-base sm:text-lg text-[#0D1B3E] truncate max-w-md">{exam.title}</h2>
        </div>

        {/* Live Timer Countdown */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black border transition-all ${
            isTimeCritical 
              ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse' 
              : 'bg-[#F5F7FA] border-slate-200 text-[#0D1B3E]'
          }`}>
            <Clock className="h-4 w-4 text-[#1E4FD8]" />
            <span className="font-mono text-base tracking-wider text-[#0D1B3E]">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => handleSubmitExam(false)}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
          >
            تسليم الإجابات
          </button>
        </div>

      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          
          {/* Question Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-[#1E4FD8] border border-blue-200">
                {currentQuestionIdx + 1}
              </div>
              <span className="text-xs font-bold text-[#6B7280]">الدرجة: {currentQ.points || 1} درجات</span>
            </div>

            <button
              onClick={() => toggleFlag(currentQ.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                flaggedQuestions[currentQ.id]
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'text-[#6B7280] hover:text-[#0D1B3E] bg-[#F5F7FA] border border-slate-200'
              }`}
            >
              <Flag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQ.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{flaggedQuestions[currentQ.id] ? 'محدد للمراجعة' : 'تحديد للمراجعة'}</span>
            </button>
          </div>

          {/* Question Text & Optional Image */}
          <div className="space-y-4">
            <p className="text-base sm:text-lg font-bold text-[#0D1B3E] leading-relaxed">
              {currentQ.text}
            </p>

            {currentQ.image && (
              <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 bg-[#F5F7FA] p-2">
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
                      ? 'border-[#1E4FD8] bg-blue-50/70 text-[#0D1B3E] font-bold shadow-xs'
                      : 'border-slate-200 bg-[#F5F7FA] text-[#0D1B3E] hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-[#1E4FD8] bg-[#1E4FD8] text-white'
                        : 'border-slate-300 bg-white text-[#6B7280]'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm">{optionText}</span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[#1E4FD8]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Question Navigator Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-colors ${
                currentQuestionIdx === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F5F7FA] text-[#0D1B3E] hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              <span>السؤال السابق</span>
            </button>

            <span className="text-xs text-[#6B7280] hidden sm:inline">
              تمت الإجابة على {answeredCount} من {totalQuestions} سؤال
            </span>

            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-colors"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmitExam(false)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
              >
                <Send className="h-4 w-4" />
                <span>إنهاء وتسليم</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Questions Palette / Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-[#6B7280]">
          <span>خريطة الأسئلة</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#1E4FD8] inline-block"></span> تمت الإجابة</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block"></span> متبقي</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span> محدد للمراجعة</span>
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
                    ? 'ring-2 ring-[#1E4FD8] bg-[#1E4FD8] text-white font-black scale-110 shadow-sm'
                    : isFlagged
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isAnswered
                        ? 'bg-blue-50 text-[#1E4FD8] border border-blue-200'
                        : 'bg-[#F5F7FA] text-[#6B7280] hover:bg-slate-200 border border-slate-200'
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
