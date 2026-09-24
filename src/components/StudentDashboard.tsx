import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
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
  Wallet,
  Compass,
  FileText,
  User,
  Zap,
  LayoutGrid,
  BarChart3,
  Target,
  Lock,
  Gift,
  Crown,
  History,
  RotateCcw
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { 
  Student, 
  Course, 
  Lesson, 
  ExamAttempt, 
  NotificationItem, 
  SmartStudyRecommendation, 
  LeaderboardEntry,
  QuizExam,
  PdfFile 
} from '../types';
import { CourseRatingBadge } from './CourseRatingBadge';
import { StreakBanner } from './StreakBanner';
import { MascotWithRank } from './MascotWithRank';
import { calculateStudentRankStats } from '../utils/studentLevels';
import { LuckyWheelModal } from './LuckyWheelModal';
import { RankTierIcon } from './RankTierIcon';
import { PerformanceLineChart } from './dashboard/PerformanceLineChart';
import { UnitMasteryBarChart } from './dashboard/UnitMasteryBarChart';
import { CircularProgress } from './dashboard/CircularProgress';
import { RecentExamsTable } from './dashboard/RecentExamsTable';
import { StrengthsAndWeaknesses } from './dashboard/StrengthsAndWeaknesses';
import { LatestContentFeed } from './dashboard/LatestContentFeed';
import { StudentOnboardingJourney } from './StudentOnboardingJourney';

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
  const [allCoursesList, setAllCoursesList] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [allExams, setAllExams] = useState<QuizExam[]>([]);
  const [allPdfs, setAllPdfs] = useState<PdfFile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recommendations, setRecommendations] = useState<SmartStudyRecommendation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(StorageService.getLeaderboard());
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Next step (Continue learning)
  const [nextStepInfo, setNextStepInfo] = useState<{
    course: Course;
    lesson: Lesson;
    courseProgress: number;
    totalLessonsInCourse: number;
    completedLessonsInCourse: number;
  } | null>(null);

  useEffect(() => {
    // Check and award daily spin
    const cur = StorageService.getCurrentStudent();
    if (cur) {
      StorageService.checkAndAwardDailySpin(cur.id);

      // Check if student has not completed onboarding
      if (!cur.hasCompletedOnboarding) {
        setIsOnboardingOpen(true);
      }
    }

    const refreshData = () => {
      try {
        const currentStudent = StorageService.getCurrentStudent();
        setStudent(currentStudent);

        const allCourses = StorageService.getCourses() || [];
        setAllCoursesList(allCourses);

        const allExamsList = StorageService.getExams() || [];
        setAllExams(allExamsList);

        const allPdfsList = StorageService.getPdfFiles() || [];
        setAllPdfs(allPdfsList);

        // Strict: only courses student is enrolled in
        const studentCourses = currentStudent 
          ? allCourses.filter(c => StorageService.isStudentEnrolled(currentStudent.id, c.id))
          : [];
        setCourses(studentCourses);

        const studentId = currentStudent?.id || 'demo-student';
        const studentGrade = currentStudent?.grade || 'الصف الثالث الثانوي';

        const studentAttempts = StorageService.getStudentAttempts(studentId) || [];
        setAttempts(studentAttempts);

        const allNotifs = StorageService.getNotificationsForStudent(studentId, studentGrade) || [];
        setNotifications(allNotifs.slice(0, 3));

        const smartRecs = StorageService.getStudentRecommendations(studentId) || [];
        setRecommendations(smartRecs);

        setLeaderboard(StorageService.getLeaderboard() || []);

        // Resolve "Continue learning" / Next Step
        const coursesToSearch = studentCourses;
        if (coursesToSearch.length > 0) {
          let selectedCourse: Course | null = null;
          let selectedLesson: Lesson | null = null;

          // 1. Last viewed lesson from storage
          const lastViewed = StorageService.getLastViewedLesson(studentId);
          if (lastViewed) {
            const foundCourse = coursesToSearch.find(c => c.id === lastViewed.courseId);
            if (foundCourse) {
              foundCourse.units?.forEach(u => {
                const l = u.lessons?.find(les => les.id === lastViewed.lessonId);
                if (l && !selectedLesson) {
                  selectedCourse = foundCourse;
                  selectedLesson = l;
                }
              });
            }
          }

          // 2. First uncompleted lesson across enrolled courses
          if (!selectedCourse || !selectedLesson) {
            const studentProg = StorageService.getStudentProgressList(studentId) || [];
            const completedIds = new Set(studentProg.filter(p => p.isCompleted).map(p => p.lessonId));

            for (const course of coursesToSearch) {
              for (const unit of (course.units || [])) {
                for (const lesson of (unit.lessons || [])) {
                  if (!completedIds.has(lesson.id)) {
                    selectedCourse = course;
                    selectedLesson = lesson;
                    break;
                  }
                }
                if (selectedCourse) break;
              }
              if (selectedCourse) break;
            }
          }

          // 3. Fallback to very first lesson of first enrolled course
          if (!selectedCourse || !selectedLesson) {
            selectedCourse = coursesToSearch[0];
            selectedLesson = selectedCourse.units?.[0]?.lessons?.[0] || null;
          }

          if (selectedCourse && selectedLesson) {
            const { totalLessons, completedLessons, percentage } = StorageService.calculateCourseProgress(studentId, selectedCourse.id);
            setNextStepInfo({
              course: selectedCourse,
              lesson: selectedLesson,
              courseProgress: percentage,
              totalLessonsInCourse: totalLessons,
              completedLessonsInCourse: completedLessons
            });
          } else {
            setNextStepInfo(null);
          }
        } else {
          setNextStepInfo(null);
        }
      } catch (err) {
        console.error('Error in dashboard refreshData:', err);
      }
    };

    refreshData();
    return subscribeToStorage(refreshData);
  }, []);

  const activeStudent: Student = student || {
    id: 'demo-student',
    name: 'طالب متفوق',
    phone: '01012345678',
    parentPhone: '01087654321',
    grade: 'الصف الثالث الثانوي',
    governorate: 'القاهرة',
    walletBalance: 150,
    streakDays: 14,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    enrolledCourseIds: [],
    unlockedPdfIds: []
  };

  // Metrics
  const progressList = StorageService.getStudentProgressList(activeStudent.id) || [];
  const completedLessonsCount = (progressList || []).filter(p => p?.isCompleted).length;
  const rankStats = calculateStudentRankStats(activeStudent, leaderboard || []);

  const relevantCourses = courses || [];
  let totalAvailableLessons = 0;
  relevantCourses.forEach(c => {
    (c?.units || []).forEach(u => {
      totalAvailableLessons += (u?.lessons || []).length;
    });
  });

  const overallProgressPercent = totalAvailableLessons > 0 
    ? Math.min(100, Math.round((completedLessonsCount / totalAvailableLessons) * 100))
    : 0;

  const passedExamsCount = (attempts || []).filter(a => a?.passed).length;
  const averageScore = (attempts || []).length > 0
    ? Math.round((attempts || []).reduce((acc, a) => acc + (a?.percentage || 0), 0) / attempts.length)
    : 0;

  // 8 Quick Access Tools
  const quickAccessTools = [
    {
      id: 'my-courses',
      name: 'كورساتي',
      desc: 'متابعة المناهج والدروس',
      icon: BookOpen,
      color: 'text-[#1E4FD8]',
      bg: 'bg-blue-50 border-blue-200',
      action: () => onNavigate(student ? 'my-courses' : 'courses-catalog')
    },
    {
      id: 'quick-quiz',
      name: 'اختبار سريع',
      desc: 'امتحانات وتقييم فوري',
      icon: Zap,
      color: 'text-[#F5B301]',
      bg: 'bg-amber-50 border-amber-200',
      action: () => onNavigate('my-results')
    },
    {
      id: 'ai-assistant',
      name: 'المساعد الفيزيائي',
      desc: 'شرح وحل بالذكاء الاصطناعي',
      icon: Bot,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      action: () => onNavigate('ai-assistant')
    },
    {
      id: 'physics-lab',
      name: 'المعمل التفاعلي',
      desc: 'محاكاة التجارب والقوانين',
      icon: Sparkles,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
      action: () => onNavigate('physics-lab')
    },
    {
      id: 'weakness-profile',
      name: 'تحليل مستواي',
      desc: 'تشخيص الضعف وخطة العلاج',
      icon: Brain,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200',
      action: () => onNavigate('weakness-profile')
    },
    {
      id: 'flashcards',
      name: 'بطاقات المراجعة',
      desc: 'مفاهيم وقوانين سريعة',
      icon: FileText,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200',
      action: () => onNavigate('flashcards')
    },
    {
      id: 'leaderboard',
      name: 'لوحة الشرف',
      desc: 'ترتيب المتفوقين والأوسمة',
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      action: () => onNavigate('leaderboard')
    },
    {
      id: 'profile',
      name: 'الملف الشخصي',
      desc: 'البيانات وكلمة المرور',
      icon: User,
      color: 'text-slate-700',
      bg: 'bg-slate-50 border-slate-200',
      action: () => onOpenEditProfileModal ? onOpenEditProfileModal() : onNavigate('dashboard')
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 animate-in fade-in duration-300 pb-24 md:pb-12" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. Header / Greeting Banner ("لوحة أدائي")                                  */}
      {/* ========================================================================= */}
      <section className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-l from-white via-white to-blue-50/70 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden min-h-[220px] sm:min-h-[260px] md:min-h-[280px] flex items-center">
        {/* Decorative physics ambient glow */}
        <div className="absolute -left-12 -bottom-12 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute left-8 bottom-0 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full flex flex-row items-center justify-between gap-3 sm:gap-6">
          
          {/* Right Side: Text & Badges */}
          <div className="flex-1 space-y-2.5 sm:space-y-3.5 min-w-0 py-1 pl-2 sm:pl-4">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-[#1E4FD8]">
                <Compass className="h-3.5 w-3.5" />
                <span>لوحة أدائي</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-[#0D1B3E]">
                <span>{activeStudent.grade || 'الصف الثالث الثانوي'}</span>
              </span>

              {/* Leaderboard Rank status */}
              <button
                onClick={() => onNavigate('leaderboard')}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-2xs ${
                  rankStats.isFirstOnPlatform
                    ? 'border-amber-400 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
                title="عرض ترتيبك في لوحة الشرف"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                <span>المركز #{rankStats.rank} ({rankStats.points.toLocaleString('ar-EG')} نقطة)</span>
              </button>

              {/* Wallet Balance */}
              {activeStudent.walletBalance !== undefined && (
                <button 
                  onClick={onOpenWalletModal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-[#0D1B3E] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Wallet className="h-3.5 w-3.5 text-[#F5B301]" />
                  <span>المحفظة: {activeStudent.walletBalance} ج.م</span>
                </button>
              )}

              {/* Re-play Onboarding Journey button */}
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="مشاهدة الرحلة التعريفية بالمنصة وطريقة التعلم"
              >
                <RotateCcw className="h-3 w-3" />
                <span>الرحلة التعريفية</span>
              </button>
            </div>

            {/* Greeting Title */}
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-[#0D1B3E] tracking-tight leading-tight">
              أهلاً بك يا {activeStudent.name || 'طالبنا المتميز'}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#4B5563] font-medium leading-relaxed max-w-xl">
              {completedLessonsCount > 0 
                ? `لديك ${completedLessonsCount} درس مكتمل ومتوسط درجات ${averageScore}%. تابع تقدمك واستكمل المذاكرة من حيث توقفت!`
                : 'مرحبًا بك في لوحة أدائك الشخصية. يمكنك هنا متابعة مستوى استيعابك للمفاهيم الفيزيائية ودرجاتك في الامتحانات.'}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <button
                onClick={onOpenActivationModal}
                className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-[#1E4FD8] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#163cb5] transition-all cursor-pointer shadow-xs"
              >
                <Key className="h-4 w-4" />
                <span>تفعيل كود</span>
              </button>

              <button
                onClick={() => onNavigate('my-results')}
                className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#1E4FD8] hover:bg-blue-50 transition-all cursor-pointer shadow-2xs"
              >
                <Award className="h-4 w-4" />
                <span>نتائجي والشهادات</span>
              </button>
            </div>
          </div>

          {/* Spacer */}
          <div className="shrink-0 w-28 xs:w-36 sm:w-48 md:w-56" aria-hidden="true" />
        </div>

        {/* Mascot */}
        <div 
          className="absolute bottom-0 left-0 sm:left-2 md:left-4 w-36 xs:w-44 sm:w-56 md:w-64 select-none flex items-end justify-center z-10 cursor-pointer"
          onClick={() => onNavigate('leaderboard')}
          title="انقر لعرض تفاصيل لوحة الشرف"
        >
          <MascotWithRank
            gender={activeStudent.gender}
            stats={rankStats}
            isHalfBody={true}
            className="w-full"
            showLevelBadge={false}
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Statistical Summary Cards (ملخص إحصائي شامل)                            */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Average Score */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E4FD8] border border-blue-200">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#0D1B3E] block leading-none">
              {averageScore}%
            </span>
            <p className="text-[11px] font-bold text-[#6B7280] mt-1 truncate">
              متوسط الدرجات
            </p>
          </div>
        </div>

        {/* Completed Exams */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <Award className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#0D1B3E] block leading-none">
              {attempts.length}
            </span>
            <p className="text-[11px] font-bold text-[#6B7280] mt-1 truncate">
              امتحانات مكتملة ({passedExamsCount} ناجح)
            </p>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#0D1B3E] block leading-none">
              {completedLessonsCount}
            </span>
            <p className="text-[11px] font-bold text-[#6B7280] mt-1 truncate">
              دروس مكتملة
            </p>
          </div>
        </div>

        {/* Overall Completion Percentage */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#F5B301] border border-amber-200">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#1E4FD8] block leading-none">
              {overallProgressPercent}%
            </span>
            <p className="text-[11px] font-bold text-[#6B7280] mt-1 truncate">
              نسبة الإنجاز الكلي
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Continue Learning ("أكمل من حيث توقفت")                                  */}
      {/* ========================================================================= */}
      {nextStepInfo && (
        <section className="rounded-2xl sm:rounded-3xl border-2 border-[#1E4FD8]/25 bg-gradient-to-r from-blue-50/70 via-white to-amber-50/40 p-4 sm:p-6 shadow-xs relative overflow-hidden space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E4FD8] text-white">
                <PlayCircle className="h-4 w-4 fill-current" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#0D1B3E]">أكمل من حيث توقفت</h2>
                <span className="text-[11px] text-[#6B7280]">استكمل الدرس لمواصلة تقدمك التعليمي</span>
              </div>
            </div>

            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              جاهز للمتابعة
            </span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white/95 rounded-2xl border border-blue-100 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="relative h-20 w-32 sm:h-24 sm:w-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img
                  src={nextStepInfo.course.thumbnail}
                  alt={nextStepInfo.course.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-1 right-1 rounded bg-[#0D1B3E]/85 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  فيزياء
                </div>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#1E4FD8] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 truncate max-w-xs">
                    {nextStepInfo.course.title}
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{nextStepInfo.lesson.durationMinutes || 45} دقيقة</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-[#0D1B3E] leading-snug line-clamp-1">
                  {nextStepInfo.lesson.title}
                </h3>

                {/* Progress bar */}
                <div className="space-y-1 max-w-md pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#6B7280]">نسبة إنجاز الكورس</span>
                    <span className="text-[#1E4FD8] font-mono">{nextStepInfo.courseProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className="h-full bg-[#1E4FD8] rounded-full transition-all duration-500" 
                      style={{ width: `${nextStepInfo.courseProgress}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7280]">
                    {nextStepInfo.completedLessonsInCourse} من {nextStepInfo.totalLessonsInCourse} درس مكتمل
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('lesson-player', { 
                courseId: nextStepInfo.course.id, 
                lessonId: nextStepInfo.lesson.id 
              })}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E4FD8] px-6 py-3 text-xs sm:text-sm font-black text-white hover:bg-[#163cb5] transition-all cursor-pointer shadow-sm shrink-0"
            >
              <PlayCircle className="h-4 w-4 fill-current" />
              <span>متابعة التعلم الآن</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. Performance Charts Grid (Line Chart + Circular Progress)                */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line Chart: "تطور مستواك" (Takes 2 columns on lg) */}
        <div className="lg:col-span-2">
          <PerformanceLineChart
            attempts={attempts}
            onTakeExam={() => onNavigate('my-results')}
          />
        </div>

        {/* Circular Progress & Overall Completion Card (Takes 1 col on lg) */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full text-right border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-black text-[#0D1B3E]">إجمالي إنجاز المنهج</h3>
            <span className="text-[11px] text-[#6B7280]">نسبة المحاضرات والدروس المكتملة</span>
          </div>

          <CircularProgress
            percentage={overallProgressPercent}
            size={160}
            strokeWidth={14}
            title="التقدم العام"
            subtitle={`${completedLessonsCount} من ${totalAvailableLessons || completedLessonsCount} درس`}
            primaryColor="#1E4FD8"
          />

          <div className="w-full pt-2 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-[#F5F7FA] border border-slate-100">
              <span className="text-[10px] text-[#6B7280] block">الكورسات المشترك بها</span>
              <span className="font-mono font-bold text-[#0D1B3E] text-sm">{relevantCourses.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F5F7FA] border border-slate-100">
              <span className="text-[10px] text-[#6B7280] block">سلسلة المذاكرة</span>
              <span className="font-mono font-bold text-amber-600 text-sm">{activeStudent.streakDays || 1} أيام</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. Unit Mastery Bar Chart ("مستواك حسب الوحدات")                            */}
      {/* ========================================================================= */}
      <section>
        <UnitMasteryBarChart
          attempts={attempts}
          courses={relevantCourses}
        />
      </section>

      {/* ========================================================================= */}
      {/* 6. Strengths & Needs Review Analysis (نقاط القوة ويحتاج إلى مراجعة)       */}
      {/* ========================================================================= */}
      <section>
        <StrengthsAndWeaknesses
          attempts={attempts}
        />
      </section>

      {/* ========================================================================= */}
      {/* 7. Recent Exams Table (سجل الامتحانات)                                     */}
      {/* ========================================================================= */}
      <section>
        <RecentExamsTable
          attempts={attempts}
          onViewAll={() => onNavigate('my-results')}
          onReviewAttempt={(attemptId) => onNavigate('exam-result', { attemptId })}
          onTakeExam={() => onNavigate('my-results')}
        />
      </section>

      {/* ========================================================================= */}
      {/* 8. Course Progress Cards ("تقدمك في الكورس")                               */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E4FD8]" />
            <h2 className="text-base sm:text-lg font-black text-[#0D1B3E]">
              كورساتي ونسبة التقدم ({relevantCourses.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate(student ? 'my-courses' : 'courses-catalog')}
            className="flex items-center gap-1 text-xs font-bold text-[#1E4FD8] hover:underline cursor-pointer"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {relevantCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-400 opacity-60" />
            <h4 className="mt-2 text-sm font-bold text-[#0D1B3E]">لم تقم بالاشتراك في أي كورس بعد</h4>
            <p className="mt-1 text-xs text-[#6B7280]">أدخل كود التفعيل الخاص بك أو تصفح المناهج المتاحة للاشتراك وبدء المذاكرة</p>
            <div className="mt-3.5 flex justify-center gap-2.5">
              <button
                onClick={onOpenActivationModal}
                className="rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-colors cursor-pointer"
              >
                تفعيل كود الكورس
              </button>
              <button
                onClick={() => onNavigate('courses-catalog')}
                className="rounded-xl border border-[#1E4FD8] bg-white px-4 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                استعراض الكورسات المتاحة
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relevantCourses.map((course) => {
              const { totalLessons, completedLessons, percentage } = StorageService.calculateCourseProgress(activeStudent.id, course.id);
              const expiry = activeStudent.courseExpiryDates?.[course.id];

              let resumeLessonId = course.units?.[0]?.lessons?.[0]?.id;
              const studentProg = StorageService.getStudentProgressList(activeStudent.id);
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
                  className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-1.5 right-1.5 rounded-md bg-white/95 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-[#1E4FD8] border border-blue-200 shadow-xs z-10">
                        {course.grade?.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 rounded-md bg-[#0D1B3E]/85 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white z-10">
                        {completedLessons} / {totalLessons} درس
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div>
                        <h3 className="font-bold text-[#0D1B3E] text-xs sm:text-sm leading-snug line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
                          {course.description}
                        </p>
                      </div>

                      {expiry && (
                        <div className="flex items-center gap-1 text-[9px] text-[#1E4FD8] font-bold">
                          <Calendar className="h-3 w-3" />
                          <span>متاح حتى {new Date(expiry).toLocaleDateString('ar-EG')}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-[#6B7280]">نسبة الإنجاز</span>
                          <span className="text-[#1E4FD8] font-mono">{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className="h-full bg-[#1E4FD8] rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="flex-1 rounded-xl border border-slate-200 bg-[#F5F7FA] py-1.5 text-xs font-bold text-[#0D1B3E] hover:border-blue-300 hover:text-[#1E4FD8] transition-colors cursor-pointer text-center"
                    >
                      تفاصيل المنهج
                    </button>
                    <button
                      onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: resumeLessonId })}
                      className="flex-1 rounded-xl bg-[#1E4FD8] py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#163cb5] transition-colors cursor-pointer text-center"
                    >
                      استكمال التعلم
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 9. Latest Content Feed ("أحدث المحتوى")                                    */}
      {/* ========================================================================= */}
      <section>
        <LatestContentFeed
          courses={allCoursesList}
          exams={allExams}
          pdfs={allPdfs}
          onNavigate={onNavigate}
        />
      </section>

      {/* ========================================================================= */}
      {/* 10. Quick Access 8 Tools (أدوات الوصول السريع)                              */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E4FD8]" />
          <h2 className="text-base sm:text-lg font-black text-[#0D1B3E]">أدوات الوصول السريع</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {quickAccessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={tool.action}
                className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all text-right group cursor-pointer"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tool.bg} ${tool.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0D1B3E] group-hover:text-[#1E4FD8] transition-colors truncate">
                    {tool.name}
                  </h3>
                  <p className="text-[10px] text-[#6B7280] truncate mt-0.5">
                    {tool.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. Mobile Bottom Navigation                                              */}
      {/* ========================================================================= */}
      <nav 
        aria-label="التنقل السفلي للهاتف" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 shadow-lg flex justify-around items-center"
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-[#1E4FD8] cursor-pointer"
        >
          <div className="p-1 rounded-xl bg-blue-50 text-[#1E4FD8]">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">لوحة أدائي</span>
        </button>

        <button
          onClick={() => onNavigate(student ? 'my-courses' : 'courses-catalog')}
          className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#1E4FD8] transition-colors cursor-pointer"
        >
          <div className="p-1 rounded-xl text-[#6B7280]">
            <PlayCircle className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">كورساتي</span>
        </button>

        <button
          onClick={() => setIsLuckyWheelOpen(true)}
          className="flex flex-col items-center gap-1 text-amber-600 hover:text-amber-700 transition-colors cursor-pointer relative"
        >
          <div className="p-1 rounded-xl bg-amber-100 text-amber-800 relative">
            <Gift className="h-4 w-4" />
            {(activeStudent.wheelSpins || 0) > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-amber-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {activeStudent.wheelSpins}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black text-amber-900">عجلة الحظ</span>
        </button>

        <button
          onClick={() => onNavigate('ai-assistant')}
          className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#1E4FD8] transition-colors cursor-pointer"
        >
          <div className="p-1 rounded-xl text-[#6B7280]">
            <Bot className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">فيزيكس AI</span>
        </button>

        <button
          onClick={() => onNavigate('leaderboard')}
          className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#1E4FD8] transition-colors cursor-pointer"
        >
          <div className="p-1 rounded-xl text-[#6B7280]">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">لوحة الشرف</span>
        </button>

        <button
          onClick={() => onOpenEditProfileModal ? onOpenEditProfileModal() : onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#1E4FD8] transition-colors cursor-pointer"
        >
          <div className="p-1 rounded-xl text-[#6B7280]">
            <User className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">حسابي</span>
        </button>
      </nav>

      {/* Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={isLuckyWheelOpen}
        onClose={() => setIsLuckyWheelOpen(false)}
        student={activeStudent}
        onStudentUpdated={(updated) => {
          setStudent(updated);
          setLeaderboard(StorageService.getLeaderboard());
        }}
        onOpenLeaderboard={() => {
          setIsLuckyWheelOpen(false);
          onNavigate('leaderboard');
        }}
      />

      {/* Student Onboarding Journey Modal */}
      <StudentOnboardingJourney
        student={activeStudent}
        isOpen={isOnboardingOpen}
        onComplete={() => {
          setIsOnboardingOpen(false);
          const cur = StorageService.getCurrentStudent();
          if (cur) {
            setStudent({ ...cur, hasCompletedOnboarding: true });
          }
        }}
        onClose={() => setIsOnboardingOpen(false)}
      />

    </div>
  );
};
