import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  XCircle,
  Lock, 
  FileText, 
  Award, 
  Clock, 
  Key, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  HelpCircle,
  Wallet,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Course, Student, Unit, Lesson, QuizExam, PdfMaterial } from '../types';
import { downloadPdfFile } from '../utils/pdfHelper';

interface CourseDetailsViewProps {
  courseId: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenAuthModal: () => void;
}

export const CourseDetailsView: React.FC<CourseDetailsViewProps> = ({
  courseId,
  onNavigate,
  onOpenActivationModal,
  onOpenAuthModal
}) => {
  const [course, setCourse] = useState<Course | undefined>(StorageService.getCourseById(courseId));
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [exams, setExams] = useState<QuizExam[]>(StorageService.getExams());
  const [purchaseMsg, setPurchaseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleWalletPurchase = () => {
    if (!student) {
      onOpenAuthModal();
      return;
    }

    if (!course) return;

    const res = StorageService.purchaseCourseWithWalletBalance(student.id, course.id);
    if (res.success) {
      setPurchaseMsg({ type: 'success', text: res.message });
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (_) {}
    } else {
      setPurchaseMsg({ type: 'error', text: res.message });
    }
  };

  useEffect(() => {
    const update = () => {
      const c = StorageService.getCourseById(courseId);
      setCourse(c);
      setStudent(StorageService.getCurrentStudent());
      setExams(StorageService.getExams());

      // Open all units by default if not set
      if (c?.units && Object.keys(openUnits).length === 0) {
        const initialOpen: Record<string, boolean> = {};
        c.units.forEach(u => { initialOpen[u.id] = true; });
        setOpenUnits(initialOpen);
      }
    };
    update();
    return subscribeToStorage(update);
  }, [courseId]);

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-[#0D1B3E]">لم يتم العثور على الكورس</h2>
        <button
          onClick={() => onNavigate('courses-catalog')}
          className="mt-4 rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401]"
        >
          العودة للكورسات
        </button>
      </div>
    );
  }

  const isEnrolled = student?.enrolledCourseIds?.includes(course.id);
  const { totalLessons, completedLessons, percentage } = student 
    ? StorageService.calculateCourseProgress(student.id, course.id)
    : { totalLessons: 0, completedLessons: 0, percentage: 0 };

  const studentProg = student ? StorageService.getStudentProgressList(student.id) : [];
  const completedLessonIds = new Set(studentProg.filter(p => p.isCompleted && p.courseId === course.id).map(p => p.lessonId));

  const courseExams = exams.filter(e => 
    e.courseId === course.id || 
    course.units?.some(u => u.unitExamId === e.id || u.id === e.unitId || u.lessons?.some(l => l.quizId === e.id || l.id === e.lessonId))
  );

  const toggleUnit = (unitId: string) => {
    setOpenUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#1E4FD8] transition-colors">الرئيسية</button>
        <span>/</span>
        <button onClick={() => onNavigate('courses-catalog')} className="hover:text-[#1E4FD8] transition-colors">الكورسات</button>
        <span>/</span>
        <span className="text-[#0D1B3E] font-bold truncate max-w-xs">{course.title}</span>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1E4FD8]">
                {course.grade}
              </span>
              {isEnrolled ? (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  أنت مشترك في هذا الكورس
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-[#0D1B3E]">
                  {course.price} ج.م • متاح بالتفعيل
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0D1B3E] leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-[#4B5563] leading-relaxed max-w-3xl">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] pt-2 border-t border-slate-100">
              <span className="font-bold text-[#0D1B3E]">المحاضر: {course.instructorName}</span>
              <span>•</span>
              <span>عدد الوحدات: {course.units?.length || 0} فصول</span>
              <span>•</span>
              <span>إجمالي الدروس: {totalLessons} درس</span>
            </div>

            {/* Progress Bar for Enrolled Students */}
            {isEnrolled && (
              <div className="space-y-2 pt-2 max-w-lg">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#4B5563]">نسبة إنجازك في الكورس: {completedLessons} من {totalLessons} مكتمل</span>
                  <span className="text-[#1E4FD8]">{percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className="h-full bg-gradient-to-r from-[#1E4FD8] to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail & Quick Action */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-[#F5F7FA]">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>

            {isEnrolled ? (
              <button
                onClick={() => {
                  const firstLesson = course.units?.[0]?.lessons?.[0];
                  if (firstLesson) onNavigate('lesson-player', { courseId: course.id, lessonId: firstLesson.id });
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F5B301] px-6 py-3.5 text-sm font-black text-[#0D1B3E] shadow-sm hover:bg-[#e0a401] transition-all cursor-pointer"
              >
                <PlayCircle className="h-5 w-5" />
                <span>بدء / استكمال المشاهدة</span>
              </button>
            ) : (
              <div className="space-y-3">
                {purchaseMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      purchaseMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    {purchaseMsg.text}
                  </div>
                )}

                {/* Wallet Direct Purchase Button */}
                <button
                  onClick={handleWalletPurchase}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-sm transition-all cursor-pointer"
                >
                  <Wallet className="h-5 w-5 shrink-0" />
                  <span>
                    الشراء والتفعيل المباشر خصماً من المحفظة ({course.price} ج.م)
                  </span>
                </button>

                {student && (
                  <div className="flex items-center justify-between px-3 text-[11px] text-[#4B5563] font-bold bg-[#F5F7FA] py-2 rounded-xl border border-slate-200">
                    <span>رصيد محفظتك الحالي:</span>
                    <span className="text-[#1E4FD8] font-mono text-xs">{student.walletBalance || 0} ج.م</span>
                  </div>
                )}

                {/* Activation Code Button */}
                <button
                  onClick={student ? onOpenActivationModal : onOpenAuthModal}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F5F7FA] border border-slate-200 px-5 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                >
                  <Key className="h-4 w-4 shrink-0 text-[#1E4FD8]" />
                  <span>تفعيل بكود الاشتراك (كود مسبق الدفع)</span>
                </button>

                <p className="text-[11px] text-center text-[#6B7280]">
                  تتوفر بعض الدروس للمعاينة المجانية بالأسفل
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Course Exams & Quizzes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-2 text-[#1E4FD8]">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">امتحانات واختبارات هذا الكورس</h2>
              <p className="text-xs text-[#6B7280]">كويزات الفصول والامتحانات الشاملة التابعة لهذا الكورس (تحدث تلقائياً)</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1E4FD8]">
            {courseExams.length} اختبارات
          </span>
        </div>

        {courseExams.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-[#6B7280] text-xs">
            لا توجد امتحانات مخصصة مباشرة لهذا الكورس حالياً. سيتم إظهار أي امتحان يضيفه المحاضر فوراً هنا.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseExams.map(ex => {
              const studentAttempts = student ? StorageService.getStudentAttempts(student.id) : [];
              const attempt = studentAttempts.find(a => a.examId === ex.id);

              return (
                <div 
                  key={ex.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 relative overflow-hidden shadow-xs hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 border border-blue-100 text-[#1E4FD8] text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#1E4FD8]" />
                      {ex.type === 'quiz' ? 'كويز تقييمي' : 'امتحان شامل'}
                    </span>
                    <span className="text-xs text-[#6B7280] flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-[#1E4FD8]" />
                      {ex.durationMinutes} دقيقة
                    </span>
                  </div>

                  <h3 className="font-bold text-[#0D1B3E] text-base leading-snug">{ex.title}</h3>

                  <div className="flex flex-wrap items-center justify-between text-xs text-[#4B5563] pt-2 border-t border-slate-100">
                    <span>عدد الأسئلة: <strong className="text-[#0D1B3E]">{ex.questions?.length || 0}</strong> سؤال</span>
                    <span>درجة النجاح: <strong className="text-emerald-700">{ex.passingPercentage}%</strong></span>
                  </div>

                  {attempt ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-[#6B7280]">نتيجة المحاولة: </span>
                        <span className={`font-bold font-mono ${attempt.passed ? 'text-emerald-700' : 'text-red-600'}`}>
                          {attempt.score} / {attempt.maxScore || 50} ({attempt.percentage}%) {attempt.passed ? '(ناجح)' : '(راسب)'}
                        </span>
                      </div>
                      {isEnrolled && (
                        <button
                          onClick={() => onNavigate('exam-runner', { examId: ex.id, courseId: course.id })}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1E4FD8] hover:bg-blue-100 transition-all"
                        >
                          إعادة الامتحان
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-[#6B7280]">لم يتم خوض الامتحان بعد</span>
                      {isEnrolled ? (
                        <button
                          onClick={() => onNavigate('exam-runner', { examId: ex.id, courseId: course.id })}
                          className="rounded-xl bg-[#1E4FD8] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all flex items-center gap-1.5"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span>بدء الامتحان الآن</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#6B7280] flex items-center gap-1 bg-[#F5F7FA] px-2.5 py-1 rounded-lg border border-slate-200">
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                          متاح بعد الاشتراك
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course PDFs Section */}
      {(() => {
        const coursePdfs = StorageService.getPdfs().filter(p => p.associatedCourseId === course.id);
        if (coursePdfs.length === 0) return null;

        return (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-[#F5B301]">
                  <FileText className="h-6 w-6 text-[#0D1B3E]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">مذكرات وملازم الكورس (PDF)</h2>
                  <p className="text-xs text-[#6B7280]">ملازم الشرح وبنوك الأسئلة التابعة لهذا الكورس (تفتح تلقائياً للمشتركين)</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-[#0D1B3E]">
                {coursePdfs.length} ملازم
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coursePdfs.map(pdf => {
                const isFreePdf = pdf.isFree || !pdf.isLocked || pdf.price === 0;
                const isUnlocked = isEnrolled || isFreePdf || (student && student.unlockedPdfIds?.includes(pdf.id));

                return (
                  <div key={pdf.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-blue-50 text-[#1E4FD8] text-[10px] font-bold px-2 py-0.5 border border-blue-100">
                          {pdf.category}
                        </span>
                        <span className="text-xs text-[#6B7280]">{pdf.pageCount || 30} صفحة</span>
                      </div>
                      <h3 className="font-bold text-[#0D1B3E] text-base leading-snug">{pdf.title}</h3>
                      {pdf.description && <p className="text-xs text-[#6B7280] line-clamp-2">{pdf.description}</p>}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {isUnlocked ? (
                        <button
                          onClick={() => downloadPdfFile(pdf.url, `${pdf.title}.pdf`)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#F5B301] text-[#0D1B3E] py-2.5 text-xs font-bold hover:bg-[#e0a401] transition-colors shadow-xs"
                        >
                          <FileText className="h-4 w-4" />
                          <span>تحميل / قراءة المذكرة</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full text-xs">
                          <span className="text-[#6B7280] flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5 text-amber-500" />
                            متاحة مجاناً للمشتركين
                          </span>
                          <button
                            onClick={student ? onOpenActivationModal : onOpenAuthModal}
                            className="rounded-xl bg-[#1E4FD8] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            تفعيل الكورس
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Course Curriculum Tree */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-2 text-[#1E4FD8]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">المنهج الدراسي والدروس</h2>
              <p className="text-xs text-[#6B7280]">مقسم إلى وحدات وفصول مرتبة تدريجيًا</p>
            </div>
          </div>
        </div>

        {course.units?.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-[#6B7280] text-sm">
            جاري إعداد وتحضير وحدات ودروس هذا الكورس.
          </div>
        ) : (
          <div className="space-y-4">
            {course.units.map((unit, uIdx) => {
              const isOpen = openUnits[unit.id] ?? true;
              const unitExam = exams.find(e => e.id === unit.unitExamId || (e.unitId === unit.id && e.type === 'exam'));

              return (
                <div 
                  key={unit.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                >
                  {/* Unit Header */}
                  <div 
                    onClick={() => toggleUnit(unit.id)}
                    className="flex items-center justify-between p-4 sm:p-5 bg-white hover:bg-[#F5F7FA] cursor-pointer transition-colors border-b border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-sm font-black text-[#1E4FD8]">
                        {uIdx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0D1B3E] text-base leading-tight">{unit.title}</h3>
                        {unit.description && <p className="text-xs text-[#6B7280] mt-0.5">{unit.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#6B7280] hidden sm:inline">{unit.lessons?.length || 0} دروس</span>
                      {isOpen ? <ChevronUp className="h-5 w-5 text-[#6B7280]" /> : <ChevronDown className="h-5 w-5 text-[#6B7280]" />}
                    </div>
                  </div>

                  {/* Lessons List in Unit */}
                  {isOpen && (
                    <div className="p-3 sm:p-4 space-y-2 bg-[#F5F7FA]">
                      {unit.lessons?.map((lesson, lIdx) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const isAvailable = isEnrolled || lesson.isFreePreview;
                        const lessonQuiz = exams.find(e => e.id === lesson.quizId || (e.lessonId === lesson.id && e.type === 'quiz'));

                        return (
                          <div
                            key={lesson.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                              isCompleted 
                                ? 'border-emerald-200 bg-white hover:border-emerald-400'
                                : isAvailable
                                  ? 'border-slate-200 bg-white hover:border-blue-300'
                                  : 'border-slate-200 bg-white/70 opacity-75'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              {/* Status Icon */}
                              {isCompleted ? (
                                <div className="rounded-full bg-emerald-50 p-1.5 text-emerald-600 mt-0.5 sm:mt-0">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              ) : isAvailable ? (
                                <div className="rounded-full bg-blue-50 p-1.5 text-[#1E4FD8] mt-0.5 sm:mt-0">
                                  <PlayCircle className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="rounded-full bg-slate-100 p-1.5 text-slate-400 mt-0.5 sm:mt-0">
                                  <Lock className="h-4 w-4" />
                                </div>
                              )}

                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#0D1B3E]">{lesson.title}</span>
                                  {lesson.isFreePreview && (
                                    <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold text-[#1E4FD8]">
                                      معاينة مجانية
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                                      مكتمل
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    {lesson.durationMinutes || 45} دقيقة
                                  </span>
                                  {lesson.pdfUrl && (
                                    <span className="text-[#1E4FD8] font-medium flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      مذكرة مرفقة
                                    </span>
                                  )}
                                  {lessonQuiz && (
                                    <span className="text-purple-600 font-medium flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      كويز تقييمي
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {isAvailable ? (
                                <button
                                  onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: lesson.id })}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white transition-all shadow-xs"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  <span>{isCompleted ? 'إعادة المشاهدة' : 'مشاهدة الدرس'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={student ? onOpenActivationModal : onOpenAuthModal}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#0D1B3E]"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                  <span>مغلق</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Unit Exam Card if present */}
                      {unitExam && (
                        <div className="mt-3 p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-100 p-2 text-[#1E4FD8]">
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-[#0D1B3E]">{unitExam.title}</h4>
                                <span className="rounded bg-blue-100 text-[#1E4FD8] px-2 py-0.5 text-[10px] font-bold">
                                  امتحان شامل
                                </span>
                              </div>
                              <p className="text-xs text-[#6B7280] mt-0.5">
                                المدة: {unitExam.durationMinutes} دقيقة • درجة النجاح: {unitExam.passingPercentage}% • عدد الأسئلة: {unitExam.questions?.length || 0}
                              </p>
                            </div>
                          </div>

                          {isEnrolled ? (
                            <button
                              onClick={() => onNavigate('exam-runner', { examId: unitExam.id, courseId: course.id })}
                              className="rounded-xl bg-[#1E4FD8] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all self-end sm:self-auto"
                            >
                              بدء الامتحان
                            </button>
                          ) : (
                            <span className="text-xs text-[#6B7280] flex items-center gap-1">
                              <Lock className="h-3.5 w-3.5" />
                              متاح للمشتركين فقط
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
