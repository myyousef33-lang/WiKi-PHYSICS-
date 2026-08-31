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
  MessageSquare,
  Wallet,
  Compass,
  ArrowRight,
  FileText
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student, Course, Lesson, ExamAttempt, NotificationItem, SmartStudyRecommendation } from '../types';
import { ExamCountdownBanner } from './ExamCountdownBanner';
import { StreakBanner } from './StreakBanner';
import { Edit3, Layers, User } from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenEditProfileModal?: () => void;
  onOpenWalletModal?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenActivationModal,
  onOpenEditProfileModal,
  onOpenWalletModal
}) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recommendations, setRecommendations] = useState<SmartStudyRecommendation[]>([]);
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

      const allNotifs = StorageService.getNotificationsForStudent(currentStudent.id, currentStudent.grade);
      setNotifications(allNotifs.slice(0, 3));

      // Fetch dynamic Smart Recommendations
      const smartRecs = StorageService.getStudentRecommendations(currentStudent.id);
      setRecommendations(smartRecs);

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
        <div className="rounded-3xl border border-[#1E375E] bg-[#122442]/60 p-8 sm:p-12">
          <BookOpen className="mx-auto h-16 w-16 text-[#FFB020] opacity-80" />
          <h2 className="mt-4 text-2xl font-black text-white">يرجى تسجيل الدخول لعرض لوحة الطالب</h2>
          <p className="mt-2 text-sm text-slate-300">تابع تقدمك في مادة الفيزياء، شاهد الدروس، وحل الامتحانات التفاعلية</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FFB020] px-6 py-3 text-sm font-bold text-[#0C1B33] hover:bg-[#e59e1c]"
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
      <div className="relative overflow-hidden rounded-3xl border border-[#1E375E] bg-gradient-to-r from-[#0C1B33] via-[#122442] to-[#1E375E]/40 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2E86FF]/30 bg-[#2E86FF]/10 px-3 py-1 text-xs font-bold text-[#2E86FF]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{student.grade}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              مرحبًا بك يا {student.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              استمر في رحلة التفوق الفيزيائي! لقد أكملت <span className="text-[#FFB020] font-bold">{completedLessonsCount} درسًا</span> بنجاح. راجع آخر المستجدات واختبر نفسك بانتظام.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenActivationModal}
              className="flex items-center gap-2 rounded-xl bg-[#FFB020] px-4 py-2.5 text-xs font-bold text-[#0C1B33] shadow-md shadow-[#FFB020]/20 hover:bg-[#e59e1c] transition-all"
            >
              <Key className="h-4 w-4" />
              <span>تفعيل كود جديد</span>
            </button>
            <button
              onClick={() => onNavigate('my-results')}
              className="flex items-center gap-2 rounded-xl border border-[#1E375E] bg-[#122442] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1B355E] transition-colors"
            >
              <Award className="h-4 w-4 text-[#2E86FF]" />
              <span>سجل نتائجي</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Physics Formula */}
        <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none select-none text-[160px] font-black text-white font-mono">
          E=mc²
        </div>
      </div>

      {/* Daily Streak Banner */}
      <StreakBanner student={student} />

      {/* Interactive Physics & Profile Features Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {onOpenWalletModal && (
          <button
            onClick={onOpenWalletModal}
            className="rounded-2xl border border-[#FFB020]/40 bg-[#122442] p-3.5 text-right flex items-center gap-3 hover:border-[#FFB020] transition-all shadow-md group col-span-2 sm:col-span-1"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFB020]/15 border border-[#FFB020]/40 text-[#FFB020] group-hover:scale-110 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white">المحفظة</h4>
                <span className="text-[10px] font-bold text-[#FFB020] font-mono">
                  {student.walletBalance || 0} ج.م
                </span>
              </div>
              <p className="text-[10px] text-slate-300">شحن الرصيد والاشتراكات</p>
            </div>
          </button>
        )}

        {onOpenEditProfileModal && (
          <button
            onClick={onOpenEditProfileModal}
            className="rounded-2xl border border-[#1E375E] bg-[#122442] p-3.5 text-right flex items-center gap-3 hover:border-[#2E86FF] transition-all shadow-md group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 text-[#2E86FF] group-hover:scale-110 transition-transform">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">الملف الشخصي</h4>
              <p className="text-[10px] text-slate-300">الصورة وكلمة المرور</p>
            </div>
          </button>
        )}

        <button
          onClick={() => onNavigate('physics-lab')}
          className="rounded-2xl border border-[#1E375E] bg-[#122442] p-3.5 text-right flex items-center gap-3 hover:border-[#2E86FF] transition-all shadow-md group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 text-[#2E86FF] group-hover:scale-110 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">المعمل التفاعلي</h4>
            <p className="text-[10px] text-slate-300">محاكاة التجارب</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('flashcards')}
          className="rounded-2xl border border-[#1E375E] bg-[#122442] p-3.5 text-right flex items-center gap-3 hover:border-[#2E86FF] transition-all shadow-md group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 text-[#2E86FF] group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">بطاقات المراجعة</h4>
            <p className="text-[10px] text-slate-300">مراجعة سريعة</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('my-results')}
          className="rounded-2xl border border-[#1E375E] bg-[#122442] p-3.5 text-right flex items-center gap-3 hover:border-[#2E86FF] transition-all shadow-md group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">الشهادات والنتائج</h4>
            <p className="text-[10px] text-slate-300">شهادات التفوّق</p>
          </div>
        </button>
      </div>

      {/* Smart Study Path Section */}
      {recommendations.length > 0 && (
        <div className="rounded-3xl border border-[#FFB020]/30 bg-gradient-to-br from-[#0C1B33] via-[#122442] to-[#FFB020]/10 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFB020]/20 border border-[#FFB020]/40 text-[#FFB020]">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  مسار المذاكرة الذكي المقترح
                  <span className="text-[10px] font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded-full border border-[#FFB020]/20">
                    مخصص لك
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">خطوات مدروسة لعلاج نقاط الضعف ورفع درجاتك استناداً لنتائجك الأخيرة</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('weakness-profile')}
              className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1"
            >
              <span>تقرير التشخيص الكامل</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-[#1E375E] bg-[#0C1B33] p-4 space-y-3 flex flex-col justify-between hover:border-[#2E86FF] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/30'
                    }`}>
                      {rec.priority === 'high' ? 'أولوية قصوى' : 'موصى به'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white line-clamp-1">{rec.title}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{rec.reason}</p>
                </div>

                <div className="pt-2 border-t border-[#1E375E] flex items-center justify-between">
                  {rec.recommendedLessonId ? (
                    <button
                      onClick={() => onNavigate('courses-catalog')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFB020]/15 border border-[#FFB020]/30 py-2 text-xs font-bold text-[#FFB020] hover:bg-[#FFB020] hover:text-[#0C1B33] transition-all"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>مشاهدة الدرس العلاجي</span>
                    </button>
                  ) : rec.recommendedPdfId ? (
                    <button
                      onClick={() => onNavigate('pdf-library')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 py-2 text-xs font-bold text-[#2E86FF] hover:bg-[#2E86FF] hover:text-white transition-all"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>فتح المذكرة الموصى بها</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('weakness-profile')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#122442] py-2 text-xs font-bold text-slate-300 hover:bg-[#1B355E] transition-colors"
                    >
                      <span>عرض خطة العلاج</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ministry Exam Countdown Banner */}
      <ExamCountdownBanner onNavigate={onNavigate} />

      {/* Smart Learning Features Grid (AI, Weakness, Leaderboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* AI Physics Assistant */}
        <button
          onClick={() => onNavigate('ai-assistant')}
          className="rounded-3xl border border-[#2E86FF]/30 bg-[#122442] p-5 text-right space-y-3 hover:border-[#2E86FF] transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2E86FF]/15 text-[#2E86FF] border border-[#2E86FF]/30 group-hover:scale-110 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#2E86FF]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#2E86FF]">
              Gemini AI
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-[#2E86FF] transition-colors">
              المساعد الفيزيائي الذكي
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              اسأل عن أي مسألة أو ارفع صورتها للحصول على حل نموذجي خطوة بخطوة.
            </p>
          </div>
        </button>

        {/* Weakness Diagnosis & Treatment */}
        <button
          onClick={() => onNavigate('weakness-profile')}
          className="rounded-3xl border border-[#1E375E] bg-[#122442] p-5 text-right space-y-3 hover:border-[#2E86FF] transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30 group-hover:scale-110 transition-transform">
              <Brain className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#FFB020]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FFB020]">
              تشخيص فوري
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-[#2E86FF] transition-colors">
              تحليل نقاط الضعف وخطة العلاج
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              تحديد المسائل والقوانين المتكرر خطؤك فيها مع روابط مباشرة للدروس لعلاجها.
            </p>
          </div>
        </button>

        {/* Honor Leaderboard & Weekly Challenge */}
        <button
          onClick={() => onNavigate('leaderboard')}
          className="rounded-3xl border border-[#FFB020]/30 bg-[#122442] p-5 text-right space-y-3 hover:border-[#FFB020] transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30 group-hover:scale-110 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#FFB020]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FFB020]">
              تحدي أسبوعي
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-[#FFB020] transition-colors">
              لوحة الشرف وتحديات الفيزياء
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              ترتيب الطلاب المتفوقين، الأوسمة المحققة، وتحدي الأسبوع لحصد النقاط.
            </p>
          </div>
        </button>

      </div>

      {/* Real Performance Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Enrolled Courses */}
        <div className="rounded-2xl border border-[#1E375E] bg-[#122442] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الكورسات المفتوحة</span>
            <div className="rounded-xl bg-[#2E86FF]/15 p-2 text-[#2E86FF]">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{courses.length}</p>
          <p className="mt-1 text-[11px] text-slate-300">كورس مفعل بحسابك</p>
        </div>

        {/* Total Progress */}
        <div className="rounded-2xl border border-[#1E375E] bg-[#122442] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة التقدم الكلية</span>
            <div className="rounded-xl bg-[#FFB020]/15 p-2 text-[#FFB020]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[#FFB020]">{overallProgressPercent}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#0C1B33]">
            <div 
              className="h-full bg-[#FFB020] rounded-full transition-all duration-500" 
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="rounded-2xl border border-[#1E375E] bg-[#122442] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الدروس المكتملة</span>
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-emerald-400">{completedLessonsCount}</p>
          <p className="mt-1 text-[11px] text-slate-300">من إجمالي {totalAvailableLessons} درس</p>
        </div>

        {/* Exams Taken */}
        <div className="rounded-2xl border border-[#1E375E] bg-[#122442] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الاختبارات المجتازة</span>
            <div className="rounded-xl bg-[#2E86FF]/15 p-2 text-[#2E86FF]">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{attempts.length}</p>
          <p className="mt-1 text-[11px] text-slate-300">محاولة مسجلة</p>
        </div>

        {/* Average Score */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#1E375E] bg-[#122442] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">متوسط الدرجات</span>
            <div className="rounded-xl bg-[#FFB020]/15 p-2 text-[#FFB020]">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{averageScore}%</p>
          <p className="mt-1 text-[11px] text-slate-300">{averageScore >= 85 ? 'ممتاز، واصل التألق' : averageScore >= 65 ? 'جيد جداً، ركز على المراجعة' : 'تحتاج للمزيد من التدريب'}</p>
        </div>

      </div>

      {/* Continue Learning Section (استكمال التعلم) */}
      {lastViewed && (
        <div className="rounded-3xl border border-[#FFB020]/30 bg-[#122442] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#FFB020] uppercase tracking-wider mb-4">
            <PlayCircle className="h-4 w-4 text-[#FFB020]" />
            <span>استكمال التعلم والمشاهدة</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={lastViewed.course?.thumbnail || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=300&q=80'}
                alt={lastViewed.course?.title}
                className="h-20 w-32 object-cover rounded-xl border border-[#1E375E] shadow-md"
              />
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400">{lastViewed.course?.title}</span>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {lastViewed.lesson?.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span>المحاضر: {lastViewed.course?.instructorName}</span>
                  <span>•</span>
                  <span>المدة: {lastViewed.lesson?.durationMinutes || 45} دقيقة</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('lesson-player', { courseId: lastViewed.course?.id, lessonId: lastViewed.lesson?.id })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#FFB020] px-7 py-3.5 text-sm font-bold text-[#0C1B33] shadow-lg shadow-[#FFB020]/20 hover:bg-[#e59e1c] transition-all"
            >
              <PlayCircle className="h-5 w-5 fill-[#0C1B33]" />
              <span>استكمال الدرس الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#2E86FF]" />
            <h2 className="text-xl font-black text-white">كورساتي الحالية</h2>
          </div>
          <button
            onClick={() => onNavigate('my-courses')}
            className="flex items-center gap-1 text-xs font-bold text-[#2E86FF] hover:underline"
          >
            <span>عرض الكل ({courses.length})</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-[#1E375E] bg-[#122442]/60 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-400 opacity-60" />
            <h4 className="mt-2 text-base font-bold text-white">لم تقم بتفعيل أي كورسات بعد</h4>
            <p className="mt-1 text-xs text-slate-400">أدخل كود التفعيل الخاص بك أو تصفح الكورسات المتاحة لبدء المذاكرة</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={onOpenActivationModal}
                className="rounded-xl bg-[#FFB020] px-4 py-2 text-xs font-bold text-[#0C1B33]"
              >
                تفعيل كود الكورس
              </button>
              <button
                onClick={() => onNavigate('courses-catalog')}
                className="rounded-xl border border-[#1E375E] bg-[#122442] px-4 py-2 text-xs font-bold text-white"
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
                    <div className="relative aspect-video w-full overflow-hidden bg-[#0C1B33]">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-2.5 right-2.5 rounded-lg bg-[#0C1B33]/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#FFB020] border border-[#FFB020]/20">
                        {course.grade.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-[#0C1B33]/90 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-slate-300">
                        {completedLessons} / {totalLessons} درس
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Instructor & Expiry */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>المحاضر: {course.instructorName}</span>
                        {expiry && (
                          <span className="flex items-center gap-1 text-[10px] text-[#FFB020]">
                            <Calendar className="h-3 w-3" />
                            متاح حتى {new Date(expiry).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">نسبة الإنجاز</span>
                          <span className="text-[#2E86FF]">{percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#0C1B33]">
                          <div 
                            className="h-full bg-[#2E86FF] rounded-full"
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
                      className="flex-1 rounded-xl border border-[#1E375E] bg-[#122442] py-2.5 text-xs font-bold text-white hover:bg-[#1B355E] transition-colors"
                    >
                      تفاصيل المنهج
                    </button>
                    <button
                      onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: resumeLessonId })}
                      className="flex-1 rounded-xl bg-[#2E86FF] py-2.5 text-xs font-bold text-white shadow-md shadow-[#2E86FF]/20 hover:bg-[#2072e5] transition-colors"
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
        <div className="rounded-3xl border border-[#1E375E] bg-[#122442]/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#2E86FF]" />
              <h3 className="font-bold text-white text-base">أحدث نتائج الاختبارات</h3>
            </div>
            <button
              onClick={() => onNavigate('my-results')}
              className="text-xs font-bold text-[#2E86FF] hover:underline"
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
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#1E375E] bg-[#0C1B33]"
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
        <div className="rounded-3xl border border-[#1E375E] bg-[#122442]/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#FFB020]" />
              <h3 className="font-bold text-white text-base">الإعلانات والتنبيهات الهامة</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div 
                key={n.id}
                className="p-3.5 rounded-xl border border-[#1E375E] bg-[#0C1B33] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FFB020]">{n.title}</h4>
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
