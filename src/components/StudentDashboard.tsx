import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Bell, 
  Key, 
  ChevronLeft,
  Calendar,
  AlertCircle,
  Brain,
  Trophy,
  Bot,
  MessageSquare
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student, Course, Lesson, ExamAttempt, NotificationItem } from '../types';
import { ExamCountdownBanner } from './ExamCountdownBanner';

interface StudentDashboardProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenActivationModal
}) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastViewed, setLastViewed] = useState<{ course?: Course; lesson?: Lesson } | null>(null);

  useEffect(() => {
    const refreshData = () => {
      const currentStudent = StorageService.getCurrentStudent();
      setStudent(currentStudent);

      if (!currentStudent) return;

      const allCourses = StorageService.getCourses();
      const studentCourses = allCourses.filter(c => currentStudent.enrolledCourseIds?.includes(c.id));
      setCourses(studentCourses);

      const studentAttempts = StorageService.getStudentAttempts(currentStudent.id);
      setAttempts(studentAttempts);

      const allNotifs = StorageService.getNotifications();
      setNotifications(allNotifs.slice(0, 3));

      // Resolve Last Viewed Lesson
      const lastViewedInfo = StorageService.getLastViewedLesson(currentStudent.id);
      if (lastViewedInfo) {
        const foundCourse = allCourses.find(c => c.id === lastViewedInfo.courseId);
        let foundLesson: Lesson | undefined;
        foundCourse?.units?.forEach(u => {
          const l = u.lessons?.find(les => les.id === lastViewedInfo.lessonId);
          if (l) foundLesson = l;
        });
        if (foundCourse && foundLesson) {
          setLastViewed({ course: foundCourse, lesson: foundLesson });
        } else if (studentCourses.length > 0) {
          // fallback to first course's first lesson
          const firstCourse = studentCourses[0];
          const firstLesson = firstCourse.units?.[0]?.lessons?.[0];
          if (firstLesson) {
            setLastViewed({ course: firstCourse, lesson: firstLesson });
          }
        }
      } else if (studentCourses.length > 0) {
        const firstCourse = studentCourses[0];
        const firstLesson = firstCourse.units?.[0]?.lessons?.[0];
        if (firstLesson) {
          setLastViewed({ course: firstCourse, lesson: firstLesson });
        }
      }
    };

    refreshData();
    return subscribeToStorage(refreshData);
  }, []);

  if (!student) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12">
          <BookOpen className="mx-auto h-16 w-16 text-amber-400 opacity-80" />
          <h2 className="mt-4 text-2xl font-black text-white">يرجى تسجيل الدخول لعرض لوحة الطالب</h2>
          <p className="mt-2 text-sm text-slate-400">تابع تقدمك في مادة الفيزياء، شاهد الدروس، وحل الامتحانات التفاعلية</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            الانتقال للرئيسية وتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // Calculate Overall Progress Metrics
  const progressList = StorageService.getStudentProgressList(student.id);
  const completedLessonsCount = progressList.filter(p => p.isCompleted).length;

  let totalAvailableLessons = 0;
  courses.forEach(c => {
    c.units?.forEach(u => {
      totalAvailableLessons += u.lessons?.length || 0;
    });
  });

  const overallProgressPercent = totalAvailableLessons > 0 
    ? Math.min(100, Math.round((completedLessonsCount / totalAvailableLessons) * 100))
    : 0;

  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{student.grade}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              مرحبًا بك يا {student.name} 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              استمر في رحلة التفوق الفيزيائي! لقد أكملت <span className="text-amber-400 font-bold">{completedLessonsCount} درسًا</span> بنجاح. راجع آخر المستجدات واختبر نفسك بانتظام.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenActivationModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Key className="h-4 w-4" />
              <span>تفعيل كود جديد</span>
            </button>
            <button
              onClick={() => onNavigate('my-results')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              <Award className="h-4 w-4 text-amber-400" />
              <span>سجل نتائجي</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Physics Formula */}
        <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none select-none text-[160px] font-black text-white font-mono">
          E=mc²
        </div>
      </div>

      {/* Ministry Exam Countdown Banner */}
      <ExamCountdownBanner onNavigate={onNavigate} />

      {/* Smart Learning Features Grid (AI, Weakness, Leaderboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* AI Physics Assistant */}
        <button
          onClick={() => onNavigate('ai-assistant')}
          className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 p-5 text-right space-y-3 hover:border-purple-500/60 transition-all shadow-lg shadow-purple-950/20 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 group-hover:scale-110 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
              Gemini AI
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
              المساعد الفيزيائي الذكي ⚛️
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              اسأل عن أي مسألة أو ارفع صورتها للحصول على حل نموذجي خطوة بخطوة.
            </p>
          </div>
        </button>

        {/* Weakness Diagnosis & Treatment */}
        <button
          onClick={() => onNavigate('weakness-profile')}
          className="rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 p-5 text-right space-y-3 hover:border-rose-500/60 transition-all shadow-lg shadow-rose-950/20 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 group-hover:scale-110 transition-transform">
              <Brain className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
              تشخيص فوري
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">
              تحليل نقاط الضعف وخطة العلاج 🎯
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              تحديد المسائل والقوانين المتكرر خطؤك فيها مع روابط مباشرة للدروس لعلاجها.
            </p>
          </div>
        </button>

        {/* Honor Leaderboard & Weekly Challenge */}
        <button
          onClick={() => onNavigate('leaderboard')}
          className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 p-5 text-right space-y-3 hover:border-amber-500/60 transition-all shadow-lg shadow-amber-950/20 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 group-hover:scale-110 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
              تحدي أسبوعي
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
              لوحة الشرف وتحديات الفيزياء 🌟
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              ترتيب الطلاب المتفوقين، الأوسمة المحققة، وتحدي الأسبوع لحصد النقاط.
            </p>
          </div>
        </button>

      </div>

      {/* Real Performance Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Enrolled Courses */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الكورسات المفتوحة</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{courses.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">كورس مفعل بحسابك</p>
        </div>

        {/* Total Progress */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة التقدم الكلية</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-amber-400">{overallProgressPercent}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" 
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الدروس المكتملة</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-emerald-400">{completedLessonsCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">من إجمالي {totalAvailableLessons} درس</p>
        </div>

        {/* Exams Taken */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الاختبارات المجتازة</span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{attempts.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">محاولة مسجلة</p>
        </div>

        {/* Average Score */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">متوسط الدرجات</span>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{averageScore}%</p>
          <p className="mt-1 text-[11px] text-slate-400">{averageScore >= 85 ? 'ممتاز، واصل التألق 🌟' : averageScore >= 65 ? 'جيد جداً، ركز على المراجعة' : 'تحتاج للمزيد من التدريب'}</p>
        </div>

      </div>

      {/* Continue Learning Section (استكمال التعلم) */}
      {lastViewed && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">
            <PlayCircle className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>استكمال التعلم والمشاهدة</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={lastViewed.course?.thumbnail || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=300&q=80'}
                alt={lastViewed.course?.title}
                className="h-20 w-32 object-cover rounded-xl border border-slate-700 shadow-md"
              />
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400">{lastViewed.course?.title}</span>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {lastViewed.lesson?.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>المحاضر: {lastViewed.course?.instructorName}</span>
                  <span>•</span>
                  <span>المدة: {lastViewed.lesson?.durationMinutes || 45} دقيقة</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('lesson-player', { courseId: lastViewed.course?.id, lessonId: lastViewed.lesson?.id })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <PlayCircle className="h-5 w-5 fill-slate-950" />
              <span>استكمال الدرس الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">كورساتي الحالية</h2>
          </div>
          <button
            onClick={() => onNavigate('my-courses')}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline"
          >
            <span>عرض الكل ({courses.length})</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-400 opacity-60" />
            <h4 className="mt-2 text-base font-bold text-white">لم تقم بتفعيل أي كورسات بعد</h4>
            <p className="mt-1 text-xs text-slate-400">أدخل كود التفعيل الخاص بك أو تصفح الكورسات المتاحة لبدء المذاكرة</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={onOpenActivationModal}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
              >
                تفعيل كود الكورس
              </button>
              <button
                onClick={() => onNavigate('courses-catalog')}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white"
              >
                استعراض الكورسات
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const { totalLessons, completedLessons, percentage } = StorageService.calculateCourseProgress(student.id, course.id);
              const expiry = student.courseExpiryDates?.[course.id];

              // Find first uncompleted lesson or first lesson
              let resumeLessonId = course.units?.[0]?.lessons?.[0]?.id;
              const studentProg = StorageService.getStudentProgressList(student.id);
              const completedIds = new Set(studentProg.filter(p => p.isCompleted).map(p => p.lessonId));
              
              course.units?.forEach(u => {
                u.lessons?.forEach(l => {
                  if (!completedIds.has(l.id) && resumeLessonId === course.units?.[0]?.lessons?.[0]?.id) {
                    resumeLessonId = l.id;
                  }
                });
              });

              return (
                <div 
                  key={course.id}
                  className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Course Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                        {course.grade.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-slate-300">
                        {completedLessons} / {totalLessons} درس
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Instructor & Expiry */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>المحاضر: {course.instructorName}</span>
                        {expiry && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400/80">
                            <Calendar className="h-3 w-3" />
                            متاح حتى {new Date(expiry).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">نسبة الإنجاز</span>
                          <span className="text-amber-400">{percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                    >
                      تفاصيل المنهج
                    </button>
                    <button
                      onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: resumeLessonId })}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors"
                    >
                      استكمال التعلم
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Row: Recent Results & Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Recent Results */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">أحدث نتائج الاختبارات</h3>
            </div>
            <button
              onClick={() => onNavigate('my-results')}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              عرض السجل الكامل
            </button>
          </div>

          {attempts.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">لم تقم بأداء أي اختبارات حتى الآن.</p>
          ) : (
            <div className="space-y-2.5">
              {attempts.slice(0, 3).map((att) => (
                <div 
                  key={att.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white line-clamp-1">{att.examTitle}</p>
                    <p className="text-[10px] text-slate-400">{new Date(att.submittedAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-black ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {att.score} / {att.maxScore}
                      </span>
                      <p className="text-[10px] text-slate-400">{att.percentage}%</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${
                      att.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {att.passed ? 'ناجح' : 'لم يجتز'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">الإعلانات والتنبيهات الهامة</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div 
                key={n.id}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
