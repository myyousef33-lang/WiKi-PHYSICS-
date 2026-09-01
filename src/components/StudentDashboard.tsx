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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
          <BookOpen className="mx-auto h-16 w-16 text-[#1E4FD8] opacity-80" />
          <h2 className="mt-4 text-2xl font-black text-[#0D1B3E]">يرجى تسجيل الدخول لعرض لوحة الطالب</h2>
          <p className="mt-2 text-sm text-[#6B7280]">تابع تقدمك في مادة الفيزياء، شاهد الدروس، وحل الامتحانات التفاعلية</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F5B301] px-6 py-3 text-sm font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-all"
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
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E4FD8]">
              <Sparkles className="h-3.5 w-3.5 text-[#F5B301]" />
              <span>{student.grade}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E]">
              مرحبًا بك يا {student.name}
            </h1>
            <p className="text-sm text-[#6B7280] max-w-2xl leading-relaxed">
              استمر في رحلة التفوق الفيزيائي! لقد أكملت <span className="text-[#1E4FD8] font-bold">{completedLessonsCount} درسًا</span> بنجاح. راجع آخر المستجدات واختبر نفسك بانتظام.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenActivationModal}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-bold text-[#0D1B3E] shadow-sm hover:bg-[#e0a401] transition-all"
            >
              <Key className="h-4 w-4" />
              <span>تفعيل كود جديد</span>
            </button>
            <button
              onClick={() => onNavigate('my-results')}
              className="flex items-center gap-2 rounded-xl border-2 border-[#1E4FD8] bg-white px-4 py-2.5 text-xs font-bold text-[#1E4FD8] hover:bg-blue-50 transition-colors"
            >
              <Award className="h-4 w-4 text-[#1E4FD8]" />
              <span>سجل نتائجي</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Physics Formula */}
        <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none select-none text-[160px] font-black text-[#1E4FD8] font-mono">
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
            className="rounded-2xl border border-slate-200 bg-white p-3.5 text-right flex items-center gap-3 hover:border-blue-300 transition-all shadow-xs group col-span-2 sm:col-span-1"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-[#F5B301] group-hover:scale-110 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-[#0D1B3E]">المحفظة</h4>
                <span className="text-[10px] font-bold text-[#1E4FD8] font-mono">
                  {student.walletBalance || 0} ج.م
                </span>
              </div>
              <p className="text-[10px] text-[#6B7280]">شحن الرصيد والاشتراكات</p>
            </div>
          </button>
        )}

        {onOpenEditProfileModal && (
          <button
            onClick={onOpenEditProfileModal}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 text-right flex items-center gap-3 hover:border-blue-300 transition-all shadow-xs group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#1E4FD8] group-hover:scale-110 transition-transform">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0D1B3E]">الملف الشخصي</h4>
              <p className="text-[10px] text-[#6B7280]">الصورة وكلمة المرور</p>
            </div>
          </button>
        )}

        <button
          onClick={() => onNavigate('physics-lab')}
          className="rounded-2xl border border-slate-200 bg-white p-3.5 text-right flex items-center gap-3 hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#1E4FD8] group-hover:scale-110 transition-transform">
            <Sparkles className="h-5 w-5 text-[#F5B301]" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#0D1B3E]">المعمل التفاعلي</h4>
            <p className="text-[10px] text-[#6B7280]">محاكاة التجارب</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('flashcards')}
          className="rounded-2xl border border-slate-200 bg-white p-3.5 text-right flex items-center gap-3 hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#1E4FD8] group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#0D1B3E]">بطاقات المراجعة</h4>
            <p className="text-[10px] text-[#6B7280]">مراجعة سريعة</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('my-results')}
          className="rounded-2xl border border-slate-200 bg-white p-3.5 text-right flex items-center gap-3 hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 group-hover:scale-110 transition-transform">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#0D1B3E]">الشهادات والنتائج</h4>
            <p className="text-[10px] text-[#6B7280]">شهادات التفوّق</p>
          </div>
        </button>
      </div>

      {/* Smart Study Path Section */}
      {recommendations.length > 0 && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#1E4FD8]">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0D1B3E] flex items-center gap-2">
                  مسار المذاكرة الذكي المقترح
                  <span className="text-[10px] font-bold text-[#1E4FD8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    مخصص لك
                  </span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">خطوات مدروسة لعلاج نقاط الضعف ورفع درجاتك استناداً لنتائجك الأخيرة</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('weakness-profile')}
              className="text-xs font-bold text-[#1E4FD8] hover:underline flex items-center gap-1"
            >
              <span>تقرير التشخيص الكامل</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3 flex flex-col justify-between hover:border-blue-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.priority === 'high'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rec.priority === 'high' ? 'أولوية قصوى' : 'موصى به'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-[#0D1B3E] line-clamp-1">{rec.title}</h4>
                  <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">{rec.reason}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  {rec.recommendedLessonId ? (
                    <button
                      onClick={() => onNavigate('courses-catalog')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5B301] py-2 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-all"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>مشاهدة الدرس العلاجي</span>
                    </button>
                  ) : rec.recommendedPdfId ? (
                    <button
                      onClick={() => onNavigate('pdf-library')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1E4FD8] bg-white py-2 text-xs font-bold text-[#1E4FD8] hover:bg-blue-50 transition-all"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>فتح المذكرة الموصى بها</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('weakness-profile')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-2 text-xs font-bold text-[#6B7280] hover:text-[#1E4FD8] transition-colors"
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
          className="rounded-3xl border border-slate-200 bg-white p-5 text-right space-y-3 hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1E4FD8] border border-blue-200 group-hover:scale-110 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1E4FD8]">
              Gemini AI
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0D1B3E] group-hover:text-[#1E4FD8] transition-colors">
              المساعد الفيزيائي الذكي
            </h3>
            <p className="text-[11px] text-[#6B7280] mt-1">
              اسأل عن أي مسألة أو ارفع صورتها للحصول على حل نموذجي خطوة بخطوة.
            </p>
          </div>
        </button>

        {/* Weakness Diagnosis & Treatment */}
        <button
          onClick={() => onNavigate('weakness-profile')}
          className="rounded-3xl border border-slate-200 bg-white p-5 text-right space-y-3 hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-[#F5B301] border border-amber-200 group-hover:scale-110 transition-transform">
              <Brain className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              تشخيص فوري
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0D1B3E] group-hover:text-[#1E4FD8] transition-colors">
              تحليل نقاط الضعف وخطة العلاج
            </h3>
            <p className="text-[11px] text-[#6B7280] mt-1">
              تحديد المسائل والقوانين المتكرر خطؤك فيها مع روابط مباشرة للدروس لعلاجها.
            </p>
          </div>
        </button>

        {/* Honor Leaderboard & Weekly Challenge */}
        <button
          onClick={() => onNavigate('leaderboard')}
          className="rounded-3xl border border-slate-200 bg-white p-5 text-right space-y-3 hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-[#F5B301] border border-amber-200 group-hover:scale-110 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              تحدي أسبوعي
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0D1B3E] group-hover:text-[#1E4FD8] transition-colors">
              لوحة الشرف وتحديات الفيزياء
            </h3>
            <p className="text-[11px] text-[#6B7280] mt-1">
              ترتيب الطلاب المتفوقين، الأوسمة المحققة، وتحدي الأسبوع لحصد النقاط.
            </p>
          </div>
        </button>

      </div>

      {/* Real Performance Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Enrolled Courses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">الكورسات المفتوحة</span>
            <div className="rounded-xl bg-blue-50 p-2 text-[#1E4FD8]">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[#0D1B3E]">{courses.length}</p>
          <p className="mt-1 text-[11px] text-[#6B7280]">كورس مفعل بحسابك</p>
        </div>

        {/* Total Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">نسبة التقدم الكلية</span>
            <div className="rounded-xl bg-amber-50 p-2 text-[#F5B301]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[#1E4FD8]">{overallProgressPercent}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div 
              className="h-full bg-[#1E4FD8] rounded-full transition-all duration-500" 
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">الدروس المكتملة</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-emerald-600">{completedLessonsCount}</p>
          <p className="mt-1 text-[11px] text-[#6B7280]">من إجمالي {totalAvailableLessons} درس</p>
        </div>

        {/* Exams Taken */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">الاختبارات المجتازة</span>
            <div className="rounded-xl bg-blue-50 p-2 text-[#1E4FD8]">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[#0D1B3E]">{attempts.length}</p>
          <p className="mt-1 text-[11px] text-[#6B7280]">محاولة مسجلة</p>
        </div>

        {/* Average Score */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">متوسط الدرجات</span>
            <div className="rounded-xl bg-amber-50 p-2 text-[#F5B301]">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[#0D1B3E]">{averageScore}%</p>
          <p className="mt-1 text-[11px] text-[#6B7280]">{averageScore >= 85 ? 'ممتاز، واصل التألق' : averageScore >= 65 ? 'جيد جداً، ركز على المراجعة' : 'تحتاج للمزيد من التدريب'}</p>
        </div>

      </div>

      {/* Continue Learning Section (استكمال التعلم) */}
      {lastViewed && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#1E4FD8] uppercase tracking-wider mb-4">
            <PlayCircle className="h-4 w-4 text-[#1E4FD8]" />
            <span>استكمال التعلم والمشاهدة</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={lastViewed.course?.thumbnail || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=300&q=80'}
                alt={lastViewed.course?.title}
                className="h-20 w-32 object-cover rounded-xl border border-slate-200 shadow-xs"
              />
              <div className="space-y-1.5">
                <span className="text-xs text-[#6B7280]">{lastViewed.course?.title}</span>
                <h3 className="text-lg sm:text-xl font-bold text-[#0D1B3E] leading-snug">
                  {lastViewed.lesson?.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span>المحاضر: {lastViewed.course?.instructorName}</span>
                  <span>•</span>
                  <span>المدة: {lastViewed.lesson?.durationMinutes || 45} دقيقة</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('lesson-player', { courseId: lastViewed.course?.id, lessonId: lastViewed.lesson?.id })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#F5B301] px-7 py-3.5 text-sm font-bold text-[#0D1B3E] shadow-sm hover:bg-[#e0a401] transition-all"
            >
              <PlayCircle className="h-5 w-5 fill-[#0D1B3E]" />
              <span>استكمال الدرس الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#1E4FD8]" />
            <h2 className="text-xl font-black text-[#0D1B3E]">كورساتي الحالية</h2>
          </div>
          <button
            onClick={() => onNavigate('my-courses')}
            className="flex items-center gap-1 text-xs font-bold text-[#1E4FD8] hover:underline"
          >
            <span>عرض الكل ({courses.length})</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-400 opacity-60" />
            <h4 className="mt-2 text-base font-bold text-[#0D1B3E]">لم تقم بتفعيل أي كورسات بعد</h4>
            <p className="mt-1 text-xs text-[#6B7280]">أدخل كود التفعيل الخاص بك أو تصفح الكورسات المتاحة لبدء المذاكرة</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={onOpenActivationModal}
                className="rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-bold text-[#0D1B3E]"
              >
                تفعيل كود الكورس
              </button>
              <button
                onClick={() => onNavigate('courses-catalog')}
                className="rounded-xl border-2 border-[#1E4FD8] bg-white px-4 py-2 text-xs font-bold text-[#1E4FD8]"
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
                  className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Course Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-2.5 right-2.5 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#1E4FD8] border border-blue-200 shadow-xs">
                        {course.grade.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-[#0D1B3E]/85 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-white">
                        {completedLessons} / {totalLessons} درس
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-[#0D1B3E] text-base leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Instructor & Expiry */}
                      <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
                        <span>المحاضر: {course.instructorName}</span>
                        {expiry && (
                          <span className="flex items-center gap-1 text-[10px] text-[#1E4FD8] font-bold">
                            <Calendar className="h-3 w-3" />
                            متاح حتى {new Date(expiry).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#6B7280]">نسبة الإنجاز</span>
                          <span className="text-[#1E4FD8]">{percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className="h-full bg-[#1E4FD8] rounded-full"
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
                      className="flex-1 rounded-xl border border-slate-200 bg-[#F5F7FA] py-2.5 text-xs font-bold text-[#0D1B3E] hover:border-blue-300 hover:text-[#1E4FD8] transition-colors"
                    >
                      تفاصيل المنهج
                    </button>
                    <button
                      onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: resumeLessonId })}
                      className="flex-1 rounded-xl bg-[#1E4FD8] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#163cb5] transition-colors"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#1E4FD8]" />
              <h3 className="font-bold text-[#0D1B3E] text-base">أحدث نتائج الاختبارات</h3>
            </div>
            <button
              onClick={() => onNavigate('my-results')}
              className="text-xs font-bold text-[#1E4FD8] hover:underline"
            >
              عرض السجل الكامل
            </button>
          </div>

          {attempts.length === 0 ? (
            <p className="text-center py-6 text-xs text-[#6B7280]">لم تقم بأداء أي اختبارات حتى الآن.</p>
          ) : (
            <div className="space-y-2.5">
              {attempts.slice(0, 3).map((att) => (
                <div 
                  key={att.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-[#F5F7FA]"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#0D1B3E] line-clamp-1">{att.examTitle}</p>
                    <p className="text-[10px] text-[#6B7280]">{new Date(att.submittedAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-black ${att.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {att.score} / {att.maxScore}
                      </span>
                      <p className="text-[10px] text-[#6B7280]">{att.percentage}%</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${
                      att.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#F5B301]" />
              <h3 className="font-bold text-[#0D1B3E] text-base">الإعلانات والتنبيهات الهامة</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div 
                key={n.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F7FA] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1E4FD8]">{n.title}</h4>
                  <span className="text-[10px] text-[#6B7280]">{new Date(n.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
