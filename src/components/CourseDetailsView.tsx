import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
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
import { Course, Student, Unit, Lesson, QuizExam } from '../types';

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
        <h2 className="text-xl font-bold text-white">لم يتم العثور على الكورس</h2>
        <button
          onClick={() => onNavigate('courses-catalog')}
          className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
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

  const toggleUnit = (unitId: string) => {
    setOpenUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={() => onNavigate('home')} className="hover:text-amber-400">الرئيسية</button>
        <span>/</span>
        <button onClick={() => onNavigate('courses-catalog')} className="hover:text-amber-400">الكورسات</button>
        <span>/</span>
        <span className="text-white font-bold truncate max-w-xs">{course.title}</span>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 shadow-xl overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
                {course.grade}
              </span>
              {isEnrolled ? (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  أنت مشترك في هذا الكورس
                </span>
              ) : (
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
                  {course.price} ج.م • متاح بالتفعيل
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="font-bold text-white">المحاضر: {course.instructorName}</span>
              <span>•</span>
              <span>عدد الوحدات: {course.units?.length || 0} فصول</span>
              <span>•</span>
              <span>إجمالي الدروس: {totalLessons} درس</span>
            </div>

            {/* Progress Bar for Enrolled Students */}
            {isEnrolled && (
              <div className="space-y-2 pt-2 max-w-lg">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">نسبة إنجازك في الكورس: {completedLessons} من {totalLessons} مكتمل</span>
                  <span className="text-amber-400">{percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail & Quick Action */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950">
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-105 transition-all cursor-pointer"
              >
                <PlayCircle className="h-5 w-5 fill-slate-950" />
                <span>بدء / استكمال المشاهدة</span>
              </button>
            ) : (
              <div className="space-y-3">
                {purchaseMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      purchaseMsg.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {purchaseMsg.text}
                  </div>
                )}

                {/* Wallet Direct Purchase Button */}
                <button
                  onClick={handleWalletPurchase}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-102 transition-all cursor-pointer"
                >
                  <Wallet className="h-5 w-5 shrink-0" />
                  <span>
                    الشراء والتفعيل المباشر خصماً من المحفظة ({course.price} ج.م)
                  </span>
                </button>

                {student && (
                  <div className="flex items-center justify-between px-2 text-[11px] text-slate-300 font-bold bg-slate-950/60 py-1.5 rounded-xl border border-slate-800">
                    <span>رصيد محفظتك الحالي:</span>
                    <span className="text-amber-400 font-mono">{student.walletBalance || 0} ج.م</span>
                  </div>
                )}

                {/* Activation Code Button */}
                <button
                  onClick={student ? onOpenActivationModal : onOpenAuthModal}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800/90 border border-slate-700 px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Key className="h-4 w-4 shrink-0" />
                  <span>تفعيل بكود الاشتراك (كود مسبق الدفع)</span>
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  تتوفر بعض الدروس للمعاينة المجانية بالأسفل
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Course Curriculum Tree */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">المنهج الدراسي والدروس</h2>
              <p className="text-xs text-slate-400">مقسم إلى وحدات وفصول مرتبة تدريجيًا</p>
            </div>
          </div>
        </div>

        {course.units?.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400 text-sm">
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
                  className="rounded-2xl border border-slate-800/90 bg-slate-900/70 overflow-hidden backdrop-blur-sm"
                >
                  {/* Unit Header */}
                  <div 
                    onClick={() => toggleUnit(unit.id)}
                    className="flex items-center justify-between p-4 sm:p-5 bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer transition-colors border-b border-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-sm font-black text-amber-400">
                        {uIdx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">{unit.title}</h3>
                        {unit.description && <p className="text-xs text-slate-400 mt-0.5">{unit.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 hidden sm:inline">{unit.lessons?.length || 0} دروس</span>
                      {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Lessons List in Unit */}
                  {isOpen && (
                    <div className="p-3 sm:p-4 space-y-2">
                      {unit.lessons?.map((lesson, lIdx) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const isAvailable = isEnrolled || lesson.isFreePreview;
                        const lessonQuiz = exams.find(e => e.id === lesson.quizId || (e.lessonId === lesson.id && e.type === 'quiz'));

                        return (
                          <div
                            key={lesson.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                              isCompleted 
                                ? 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40'
                                : isAvailable
                                  ? 'border-slate-800 bg-slate-950/60 hover:border-amber-500/30'
                                  : 'border-slate-850 bg-slate-950/40 opacity-75'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              {/* Status Icon */}
                              {isCompleted ? (
                                <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-400 mt-0.5 sm:mt-0">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              ) : isAvailable ? (
                                <div className="rounded-full bg-amber-500/20 p-1.5 text-amber-400 mt-0.5 sm:mt-0">
                                  <PlayCircle className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="rounded-full bg-slate-800 p-1.5 text-slate-400 mt-0.5 sm:mt-0">
                                  <Lock className="h-4 w-4" />
                                </div>
                              )}

                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white">{lesson.title}</span>
                                  {lesson.isFreePreview && (
                                    <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold text-blue-400">
                                      معاينة مجانية
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                                      مكتمل ✓
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                  <span>⏱ {lesson.durationMinutes || 45} دقيقة</span>
                                  {lesson.pdfUrl && <span className="text-amber-400/90 font-medium">📄 مذكرة مرفقة</span>}
                                  {lessonQuiz && <span className="text-purple-400 font-medium">📝 كويز تقييمي</span>}
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {isAvailable ? (
                                <button
                                  onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: lesson.id })}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  <span>{isCompleted ? 'إعادة المشاهدة' : 'مشاهدة الدرس'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={student ? onOpenActivationModal : onOpenAuthModal}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
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
                        <div className="mt-3 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white">{unitExam.title}</h4>
                                <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold">
                                  امتحان شامل
                                </span>
                              </div>
                              <p className="text-xs text-purple-300/80 mt-0.5">
                                المدة: {unitExam.durationMinutes} دقيقة • درجة النجاح: {unitExam.passingPercentage}% • عدد الأسئلة: {unitExam.questions?.length || 0}
                              </p>
                            </div>
                          </div>

                          {isEnrolled ? (
                            <button
                              onClick={() => onNavigate('exam-runner', { examId: unitExam.id, courseId: course.id })}
                              className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-500 transition-all self-end sm:self-auto"
                            >
                              بدء الامتحان
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
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
