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
  Sparkles,
  Eye,
  Check,
  X,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft
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
  const [exam, setExam] = useState<QuizExam | undefined>(() => StorageService.getExamById(examId));
  const [student, setStudent] = useState<Student | null>(() => StorageService.getCurrentStudent());
  const [isAdmin] = useState<boolean>(() => StorageService.isAdminLoggedIn());
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAnswerKeyInPreview, setShowAnswerKeyInPreview] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isPreviewMode = isAdmin || !student;

  useEffect(() => {
    const foundExam = StorageService.getExamById(examId);
    setExam(foundExam);
    setStudent(StorageService.getCurrentStudent());

    if (foundExam) {
      setTimeLeftSeconds((foundExam.durationMinutes || 30) * 60);
    }
  }, [examId]);

  const studentAttempts = student ? StorageService.getStudentAttempts(student.id) : [];
  const existingAttempt = !isPreviewMode && student ? studentAttempts.find(a => a.examId === examId) : null;

  // Countdown timer & auto-submit (Only in live student mode)
  useEffect(() => {
    if (!exam || timeLeftSeconds <= 0 || existingAttempt || isPreviewMode) return;

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
  }, [exam, existingAttempt, isPreviewMode]);

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
    if (!exam || isSubmitting) return;

    // In preview mode, just notify and allow exit
    if (isPreviewMode) {
      alert('أنت في وضع المعاينة للأدمن. تم اختبار تقديم الإجابات بنجاح دون تسجيل محاولة حقيقية.');
      onNavigate('admin');
      return;
    }

    if (!student) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    
    // Calculate Score
    let totalScore = 0;
    let maxScore = 0;

    (exam.questions || []).forEach((q) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;
      if (answers[q.id] === q.correctOptionIndex) {
        totalScore += qPoints;
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= (exam.passingPercentage || 60);

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

    // If passed and high percentage (85%+), award certificate
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

  // Exam not found state
  if (!exam) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-[#0D1B3E]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <HelpCircle className="h-12 w-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-[#0D1B3E]">الاختبار المطلوب غير موجود أو تم حذفه</h2>
          <p className="text-xs text-[#6B7280]">يرجى التحقق من الرابط أو التوجه لقائمة الكورسات والاختبارات المتاحة.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate(isAdmin ? 'admin' : 'home')}
              className="rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401]"
            >
              {isAdmin ? 'العودة للوحة الإدارة' : 'الرئيسية'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Strict 1 Attempt Display for regular students
  if (existingAttempt && !isPreviewMode) {
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

  const questions = exam.questions || [];
  const totalQuestions = questions.length;
  const currentQ: Question | undefined = questions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const isTimeCritical = timeLeftSeconds < 180; // less than 3 minutes

  // Empty questions state
  if (totalQuestions === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center animate-in fade-in">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-5">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-black text-[#0D1B3E]">{exam.title}</h2>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            لا توجد أسئلة مضافة في هذا الامتحان حتى الآن. يمكنك إضافة الأسئلة وإدارتها من لوحة تحكم الأدمن.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate(isAdmin ? 'admin' : 'home')}
              className="rounded-xl bg-[#1E4FD8] text-white px-5 py-2.5 text-xs font-bold hover:bg-blue-700"
            >
              {isAdmin ? 'العودة للوحة الإدارة لإضافة أسئلة' : 'العودة للرئيسية'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Admin Preview Mode Top Banner */}
      {isPreviewMode && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-amber-950">وضع معاينة وتجربة الاختبار (لوحة الإدارة)</span>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">أدمن</span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                يمكنك تجربة حل الأسئلة، فحص نموذج الإجابة، والتنقل بين الأسئلة بدون خصم محاولات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAnswerKeyInPreview(!showAnswerKeyInPreview)}
              className={`rounded-xl px-3 py-2 text-xs font-bold border transition-colors ${
                showAnswerKeyInPreview 
                  ? 'bg-emerald-600 text-white border-emerald-700' 
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              {showAnswerKeyInPreview ? 'إخفاء الإجابة النموذجية' : 'كشف الإجابة النموذجية والتفسير'}
            </button>
            <button
              onClick={() => onNavigate('admin')}
              className="rounded-xl bg-[#0D1B3E] text-white hover:bg-slate-800 px-4 py-2 text-xs font-bold shadow-xs"
            >
              إنهاء المعاينة
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar: Exam Info + Live Timer + Quick Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-md sticky top-20 z-30">
        
        <div className="space-y-1 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span className="rounded bg-blue-50 text-[#1E4FD8] px-2 py-0.5 text-[10px] font-bold border border-blue-200">
              {exam.type === 'quiz' ? 'كويز تقييمي' : 'امتحان شامل'}
            </span>
            <span className="text-xs text-[#6B7280]">سؤال {currentQuestionIdx + 1} من {totalQuestions}</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              نسبة النجاح: {exam.passingPercentage || 60}%
            </span>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              الصف: {exam.grade || 'جميع الصفوف'}
            </span>
          </div>
          <h2 className="font-bold text-base sm:text-lg text-[#0D1B3E] truncate max-w-md">{exam.title}</h2>
        </div>

        {/* Live Timer Countdown & Submit / Exit */}
        <div className="flex items-center gap-3">
          {!isPreviewMode ? (
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
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-600 font-bold">
              <Clock className="h-3.5 w-3.5 text-[#1E4FD8]" />
              <span>المدة المحددة: {exam.durationMinutes || 30} دقيقة</span>
            </div>
          )}

          <button
            onClick={() => handleSubmitExam(false)}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
          >
            {isPreviewMode ? 'إنهاء المعاينة' : 'تسليم الإجابات'}
          </button>
        </div>

      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          
          {/* Question Header & Quick Jump Controls */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-[#1E4FD8] border border-blue-200">
                {currentQuestionIdx + 1}
              </div>
              <span className="text-xs font-bold text-[#6B7280]">الدرجة: {currentQ.points || 1} درجات</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  flaggedQuestions[currentQ.id]
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'text-[#6B7280] hover:text-[#0D1B3E] bg-[#F5F7FA] border border-slate-200'
                }`}
              >
                <Flag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQ.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{flaggedQuestions[currentQ.id] ? 'محدد للمراجعة' : 'تحديد للمراجعة'}</span>
              </button>
            </div>
          </div>

          {/* Question Text & Optional Image */}
          <div className="space-y-4">
            <p className="text-base sm:text-lg font-bold text-[#0D1B3E] leading-relaxed">
              {currentQ.text}
            </p>

            {currentQ.image && (
              <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 bg-[#F5F7FA] p-2">
                <img src={currentQ.image} alt="رسم توضيحي للسؤال" className="w-full object-contain max-h-64 mx-auto" />
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((optionText, optIdx) => {
              const isSelected = answers[currentQ.id] === optIdx;
              const isCorrectInPreview = isPreviewMode && showAnswerKeyInPreview && optIdx === currentQ.correctOptionIndex;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    isCorrectInPreview
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : isSelected
                        ? 'border-[#1E4FD8] bg-blue-50/70 text-[#0D1B3E] font-bold shadow-xs'
                        : 'border-slate-200 bg-[#F5F7FA] text-[#0D1B3E] hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border transition-all ${
                      isCorrectInPreview
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : isSelected
                          ? 'border-[#1E4FD8] bg-[#1E4FD8] text-white'
                          : 'border-slate-300 bg-white text-[#6B7280]'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm">{optionText}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCorrectInPreview && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Check className="h-3.5 w-3.5" />
                        <span>الإجابة النموذجية</span>
                      </span>
                    )}
                    {isSelected && !isCorrectInPreview && (
                      <CheckCircle2 className="h-5 w-5 text-[#1E4FD8]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation in Preview Mode */}
          {isPreviewMode && showAnswerKeyInPreview && currentQ.explanation && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-[#0D1B3E] space-y-1">
              <span className="font-bold text-[#1E4FD8] block">شرح خطوات الحل والقانون المستخدم:</span>
              <p className="leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Question Navigator Controls (Easy Next & Previous) */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                currentQuestionIdx === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F5F7FA] text-[#0D1B3E] hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              <span>السؤال السابق</span>
            </button>

            <span className="text-xs text-[#6B7280] hidden sm:inline font-bold">
              تمت الإجابة على {answeredCount} من {totalQuestions} سؤال
            </span>

            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-colors cursor-pointer"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmitExam(false)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{isPreviewMode ? 'إنهاء المعاينة' : 'إنهاء وتسليم'}</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Questions Interactive Pagination Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-[#6B7280] flex-wrap gap-2">
          <span>خريطة الأسئلة والانتقال السريع</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#1E4FD8] inline-block"></span> تمت الإجابة</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block"></span> متبقي</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span> محدد للمراجعة</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isFlagged = flaggedQuestions[q.id];
            const isCurrent = idx === currentQuestionIdx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`h-9 w-9 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-[#1E4FD8] bg-[#1E4FD8] text-white font-black scale-110 shadow-sm'
                    : isFlagged
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isAnswered
                        ? 'bg-blue-50 text-[#1E4FD8] border border-blue-200'
                        : 'bg-[#F5F7FA] text-[#6B7280] hover:bg-slate-200 border border-slate-200'
                }`}
                title={`الانتقال إلى السؤال رقم ${idx + 1}`}
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
