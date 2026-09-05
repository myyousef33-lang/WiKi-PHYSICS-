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
  Edit3, 
  Layers, 
  User,
  Zap,
  LayoutGrid,
  BarChart3,
  Target,
  Lock,
  Gift,
  Crown
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student, Course, Lesson, ExamAttempt, NotificationItem, SmartStudyRecommendation, LeaderboardEntry } from '../types';
import { CourseRatingBadge } from './CourseRatingBadge';
import { ExamCountdownBanner } from './ExamCountdownBanner';
import { StreakBanner } from './StreakBanner';
import { MascotWithRank } from './MascotWithRank';
import { StudentLevelRankCard } from './StudentLevelRankCard';
import { calculateStudentRankStats } from '../utils/studentLevels';
import { LuckyWheelModal } from './LuckyWheelModal';
import { RankTierIcon } from './RankTierIcon';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recommendations, setRecommendations] = useState<SmartStudyRecommendation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(StorageService.getLeaderboard());
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [nextStepInfo, setNextStepInfo] = useState<{
    course: Course;
    lesson: Lesson;
    courseProgress: number;
    totalLessonsInCourse: number;
    completedLessonsInCourse: number;
  } | null>(null);

  useEffect(() => {
    // Check and award daily spin upon dashboard access
    const cur = StorageService.getCurrentStudent();
    if (cur) {
      StorageService.checkAndAwardDailySpin(cur.id);
    }

    const refreshData = () => {
      const currentStudent = StorageService.getCurrentStudent();
      setStudent(currentStudent);

      const allCourses = StorageService.getCourses();
      setAllCoursesList(allCourses);

      // Resolve student courses (STRICT: only courses the student is ACTUALLY enrolled in)
      const studentCourses = currentStudent 
        ? allCourses.filter(c => StorageService.isStudentEnrolled(currentStudent.id, c.id))
        : [];
      setCourses(studentCourses);

      const studentId = currentStudent?.id || 'demo-student';
      const studentGrade = currentStudent?.grade || 'الصف الثالث الثانوي';

      const studentAttempts = StorageService.getStudentAttempts(studentId);
      setAttempts(studentAttempts);

      const allNotifs = StorageService.getNotificationsForStudent(studentId, studentGrade);
      setNotifications(allNotifs.slice(0, 3));

      // Dynamic Smart Recommendations
      const smartRecs = StorageService.getStudentRecommendations(studentId);
      setRecommendations(smartRecs);

      // Refresh Leaderboard
      setLeaderboard(StorageService.getLeaderboard());

      // Resolve Next Step (الخطوة القادمة) - Strictly from enrolled courses
      const coursesToSearch = studentCourses;
      if (coursesToSearch.length > 0) {
        let selectedCourse: Course | null = null;
        let selectedLesson: Lesson | null = null;

        // 1. Check last viewed lesson from storage
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

        // 2. If no last viewed, find first uncompleted lesson across enrolled courses
        if (!selectedCourse || !selectedLesson) {
          const studentProg = StorageService.getStudentProgressList(studentId);
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
    };

    refreshData();
    return subscribeToStorage(refreshData);
  }, []);

  // Graceful fallback display student to guarantee the dashboard always loads cleanly
  const activeStudent: Student = student || {
    id: 'demo-student',
    name: 'يوسف عماد',
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

  // Metrics calculation
  const progressList = StorageService.getStudentProgressList(activeStudent.id);
  const completedLessonsCount = progressList.filter(p => p.isCompleted).length;

  // Student Level and Leaderboard Rank Stats
  const rankStats = calculateStudentRankStats(activeStudent, leaderboard);

  // Strict enrolled courses (do NOT bypass or fallback to all courses)
  const relevantCourses = courses;
  let totalAvailableLessons = 0;
  relevantCourses.forEach(c => {
    c.units?.forEach(u => {
      totalAvailableLessons += u.lessons?.length || 0;
    });
  });

  const overallProgressPercent = totalAvailableLessons > 0 
    ? Math.min(100, Math.round((completedLessonsCount / totalAvailableLessons) * 100))
    : 0;

  const passedExamsCount = attempts.filter(a => a.passed).length;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length)
    : 0;

  // Quick Access 8 Tools (Exact requested list)
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
      icon: Layers,
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

  const handleQuickSetGender = (g: 'male' | 'female') => {
    if (student) {
      StorageService.updateStudent(student.id, { gender: g });
      const updated = { ...student, gender: g };
      StorageService.setCurrentStudent(updated);
      setStudent(updated);
    }
  };

  const isFemale = activeStudent.gender === 'female';
  const mascotSrc = isFemale ? '/images/student-mascot-female-half.png' : '/images/student-mascot-male-half.png';

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5 sm:space-y-6 animate-in fade-in duration-300 pb-24 md:pb-12" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. Welcome Section (قسم الترحيب مع الشخصية الكرتونية 3D Mascot)             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-l from-white via-white to-blue-50/70 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden min-h-[240px] sm:min-h-[280px] md:min-h-[310px] lg:min-h-[330px] flex items-center">
        {/* Decorative physics ambient glow behind mascot */}
        <div className="absolute -left-12 -bottom-12 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />
        <div className="absolute left-8 bottom-0 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full flex flex-row items-center justify-between gap-3 sm:gap-6">
          
          {/* Right Side: Text & Actions */}
          <div className="flex-1 space-y-2.5 sm:space-y-3.5 min-w-0 py-1 pl-2 sm:pl-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-[#1E4FD8]">
                <Sparkles className="h-3.5 w-3.5 text-[#F5B301]" />
                <span>{activeStudent.grade || 'الصف الثالث الثانوي'}</span>
              </span>

              {/* Student Level & Rank Status Badge */}
              <button
                onClick={() => onNavigate('leaderboard')}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-xs ${
                  rankStats.isFirstOnPlatform
                    ? 'border-amber-400 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-300/80'
                    : rankStats.isTopThree
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-blue-200 bg-blue-50 text-[#1E4FD8] hover:bg-blue-100'
                }`}
                title="عرض ترتيبك على مستوى الجمهورية في لوحة الشرف"
              >
                {rankStats.isFirstOnPlatform ? (
                  <Crown className="h-3.5 w-3.5 text-slate-950 fill-slate-950" />
                ) : (
                  <Trophy className="h-3.5 w-3.5 text-[#F5B301]" />
                )}
                <span>
                  {rankStats.isFirstOnPlatform 
                    ? 'المركز الأول على المنصة' 
                    : `المركز #${rankStats.rank} (${rankStats.points.toLocaleString('ar-EG')} نقطة)`}
                </span>
              </button>

              {/* Level Badge */}
              <button
                onClick={() => onNavigate('leaderboard')}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="رتبتك الحالية في منصة نيوتن"
              >
                <RankTierIcon tier={rankStats.level.tier} className="h-3.5 w-3.5 text-indigo-700" />
                <span>رتبة {rankStats.level.badge} (مستوى {rankStats.level.level})</span>
              </button>

              {activeStudent.walletBalance !== undefined && (
                <button 
                  onClick={onOpenWalletModal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Wallet className="h-3.5 w-3.5 text-[#F5B301]" />
                  <span>المحفظة: {activeStudent.walletBalance} ج.م</span>
                </button>
              )}

              {/* Lucky Wheel Spins Badge */}
              <button
                onClick={() => setIsLuckyWheelOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 to-amber-200/90 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black text-amber-950 hover:from-amber-200 hover:to-amber-300 transition-all cursor-pointer shadow-xs group"
                title="عجلة الحظ لربح نقاط إضافية وتصدر المركز الأول"
              >
                <Gift className="h-3.5 w-3.5 text-amber-700 group-hover:rotate-12 transition-transform" />
                <span>عجلة الحظ: {activeStudent.wheelSpins || 0} لفات</span>
              </button>

              {/* Gender selector badge for older accounts if not set */}
              {!activeStudent.gender && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-indigo-700 shadow-2xs">
                  <span>اختر شخصيتك:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSetGender('male')}
                    className="hover:scale-105 transition-transform cursor-pointer px-1 text-xs font-black text-blue-700"
                    title="طالب (ذكر)"
                  >
                    طالب (ذكر)
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSetGender('female')}
                    className="hover:scale-105 transition-transform cursor-pointer px-1 text-xs font-black text-pink-700"
                    title="طالبة (أنثى)"
                  >
                    طالبة (أنثى)
                  </button>
                </div>
              )}
            </div>

            {/* Greeting Title */}
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#0D1B3E] tracking-tight leading-tight">
              مرحبًا بك يا {activeStudent.name || 'طالبنا المتميز'}
            </h1>

            {/* Subtitle description */}
            <p className="text-xs sm:text-sm md:text-base text-[#4B5563] font-medium leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
              {rankStats.isFirstOnPlatform
                ? 'ما شاء الله! أنت متصدر المركز الأول على مستوى الجمهورية! واصل التفوق للحفاظ على الصدارة.'
                : rankStats.pointsToNextLevel > 0
                ? `لديك ${rankStats.points.toLocaleString('ar-EG')} نقطة وأنت في رتبة ${rankStats.level.title}. تبقّى لك ${rankStats.pointsToNextLevel} نقطة للوصول إلى الرتبة التالية!`
                : completedLessonsCount > 0 
                ? `أكملت بنجاح ${completedLessonsCount} درسًا بنسبة إنجاز ${overallProgressPercent}%. استمر في تثبيت المفاهيم والمتابعة اليومية!`
                : 'جاهز لرحلة التفوق في الفيزياء؟ ابدأ بالدرس التالي لتحقيق الـ 60 من 60!'}
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              {/* Leaderboard & Rank Button */}
              <button
                onClick={() => onNavigate('leaderboard')}
                className="flex h-9 sm:h-11 items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 px-3.5 sm:px-5 text-xs sm:text-sm font-black text-[#0D1B3E] hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/60 hover:scale-105 transition-all cursor-pointer"
                title="عرض لوحة الشرف وترتيب المتفوقين"
              >
                <Trophy className="h-4 w-4" />
                <span>
                  {rankStats.isFirstOnPlatform ? 'المتصدر الأول' : `ترتيبي (#${rankStats.rank})`}
                </span>
              </button>

              {/* Lucky Wheel Button */}
              <button
                onClick={() => setIsLuckyWheelOpen(true)}
                className="flex h-9 sm:h-11 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl border border-amber-200 bg-amber-50 text-xs sm:text-sm font-bold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
                title="لف عجلة الحظ واكسب نقاط تصدر لوحة الشرف"
              >
                <Gift className="h-4 w-4 text-amber-600" />
                <span>عجلة الحظ ({activeStudent.wheelSpins || 0})</span>
              </button>

              {onOpenEditProfileModal && (
                <button
                  onClick={onOpenEditProfileModal}
                  title="تعديل الملف الشخصي"
                  className="flex h-9 sm:h-11 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-[#0D1B3E] hover:border-blue-300 hover:bg-blue-50 hover:text-[#1E4FD8] transition-all cursor-pointer shadow-xs"
                >
                  <User className="h-4 w-4" />
                  <span>الملف الشخصي</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('weakness-profile')}
                title="تشخيص مستواي"
                className="flex h-9 sm:h-11 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-[#0D1B3E] hover:border-blue-300 hover:bg-blue-50 hover:text-[#1E4FD8] transition-all cursor-pointer shadow-xs"
              >
                <Brain className="h-4 w-4 text-[#1E4FD8]" />
                <span className="hidden xs:inline">تشخيص مستواي</span>
              </button>

              <button
                onClick={onOpenActivationModal}
                className="flex h-9 sm:h-11 items-center gap-1.5 sm:gap-2 rounded-xl bg-[#0D1B3E] px-3.5 sm:px-5 text-xs sm:text-sm font-black text-white hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
              >
                <Key className="h-4 w-4 text-[#F5B301]" />
                <span>تفعيل كود</span>
              </button>
            </div>
          </div>

          {/* Spacer on right in flex row so text doesn't overlap mascot */}
          <div className="shrink-0 w-32 xs:w-44 sm:w-56 md:w-68 lg:w-84 xl:w-96" aria-hidden="true" />

        </div>

        {/* Left Side: 3D Mascot Character with Platform Rank & Level Badges */}
        <div 
          className="absolute bottom-0 left-0 sm:left-2 md:left-4 lg:left-6 xl:left-8 w-40 xs:w-48 sm:w-64 md:w-76 lg:w-92 xl:w-[390px] select-none flex items-end justify-center z-10 cursor-pointer"
          onClick={() => onNavigate('leaderboard')}
          title="انقر لعرض تفاصيل الترتيب ولوحة الشرف"
        >
          <MascotWithRank
            gender={activeStudent.gender}
            stats={rankStats}
            isHalfBody={true}
            className="w-full"
            showLevelBadge={true}
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Next Step (خطوتك القادمة - Primary CTA)                                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl sm:rounded-3xl border-2 border-[#1E4FD8]/25 bg-gradient-to-r from-blue-50/70 via-white to-amber-50/40 p-4 sm:p-6 shadow-sm relative overflow-hidden">
        {nextStepInfo ? (
          <div className="space-y-4">
            
            {/* Header Tag */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E4FD8] text-white shadow-xs">
                  <PlayCircle className="h-4 w-4 fill-current" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#0D1B3E]">خطوتك القادمة</h2>
                  <span className="text-[10px] text-[#6B7280] font-medium">النشاط الأهم لمواصلة تقدمك الآن</span>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                جاهز للمشاهدة
              </span>
            </div>

            {/* Main Content Info & Action */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-white/90 rounded-2xl border border-blue-100/80 p-3.5 sm:p-5">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                {/* Course Thumbnail */}
                <div className="relative h-20 w-32 sm:h-24 sm:w-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={nextStepInfo.course.thumbnail || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=300&q=80'}
                    alt={nextStepInfo.course.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 rounded-md bg-[#0D1B3E]/85 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    الفيزياء
                  </div>
                </div>

                {/* Lesson & Course Details */}
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

                  <h3 className="text-base sm:text-xl font-black text-[#0D1B3E] leading-snug line-clamp-1">
                    {nextStepInfo.lesson.title}
                  </h3>

                  {/* Course Progress Bar */}
                  <div className="space-y-1 max-w-md pt-0.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#6B7280]">نسبة إنجاز الكورس</span>
                      <span className="text-[#1E4FD8] font-mono">{nextStepInfo.courseProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
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

              {/* Primary CTA Button */}
              <button
                onClick={() => onNavigate('lesson-player', { 
                  courseId: nextStepInfo.course.id, 
                  lessonId: nextStepInfo.lesson.id 
                })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl sm:rounded-2xl bg-[#F5B301] px-7 py-3.5 sm:py-4 text-sm sm:text-base font-black text-[#0D1B3E] shadow-md shadow-amber-500/20 hover:bg-[#e0a401] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
              >
                <PlayCircle className="h-5 w-5 fill-[#0D1B3E]" />
                <span>استكمال الدرس</span>
                <ChevronLeft className="h-4 w-4" />
              </button>

            </div>

          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E4FD8] border border-blue-200 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0D1B3E]">ابدأ رحلتك الدراسية الأولى اليوم</h3>
                <p className="text-xs text-[#6B7280]">استعرض الكورسات المتاحة وابدأ في حل الدروس والامتحانات</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('courses-catalog')}
              className="w-full sm:w-auto rounded-xl bg-[#1E4FD8] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#163cb5] transition-all shrink-0 cursor-pointer"
            >
              استعراض الكورسات
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. Exam Countdown (العد التنازلي للامتحان)                                */}
      {/* ========================================================================= */}
      <section>
        <ExamCountdownBanner onNavigate={onNavigate} />
      </section>

      {/* ========================================================================= */}
      {/* 4. Daily Streak (الاستمرارية اليومية بدون إيموجي)                         */}
      {/* ========================================================================= */}
      <section>
        <StreakBanner student={activeStudent} />
      </section>

      {/* ========================================================================= */}
      {/* 5. Quick Access Grid (الوصول السريع - 8 أدوات مدمجة ومنظمة)               */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#1E4FD8]" />
            <h2 className="text-sm sm:text-base font-black text-[#0D1B3E]">الوصول السريع</h2>
          </div>
          <span className="text-[11px] text-[#6B7280] font-medium">أهم الأدوات التعليمية</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickAccessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={tool.action}
                className="rounded-xl border border-slate-200/90 bg-white p-2 sm:p-2.5 text-right flex items-center gap-2.5 hover:border-blue-300 hover:bg-blue-50/20 hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tool.bg} ${tool.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black text-[#0D1B3E] group-hover:text-[#1E4FD8] transition-colors truncate">
                    {tool.name}
                  </h3>
                  <p className="text-[10px] text-[#6B7280] truncate mt-0.5">
                    {tool.desc}
                  </p>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#1E4FD8] transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. AI Physics Assistant (المساعد الفيزيائي الذكي)                           */}
      {/* ========================================================================= */}
      <section className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/40 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1E4FD8] text-white shadow-xs">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#0D1B3E]">المساعد الفيزيائي الذكي</h3>
                <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[9px] font-bold text-[#1E4FD8]">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-xl">
                اسأل عن أي مسألة أو ارفع صورتها للحصول على حل نموذجي خطوة بخطوة وإرشادات فهم القوانين.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-assistant')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E4FD8] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#163cb5] shadow-xs transition-all shrink-0 cursor-pointer self-stretch sm:self-auto"
          >
            <Bot className="h-4 w-4" />
            <span>ابدأ المحادثة</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. Weakness Diagnosis + Honor Leaderboard (تحليل نقاط الضعف + لوحة الشرف)  */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        
        {/* Card 1: Weakness Diagnosis */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Brain className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                تشخيص ذكي
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-[#0D1B3E]">تحليل نقاط الضعف وخطة العلاج</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              تحديد القوانين التي تكثر أخطاؤك فيها مع توجيه مباشر لدروس وملاحظات المعالجة وتوصيات المذاكرة.
            </p>

            {recommendations.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 text-[11px] text-[#0D1B3E] font-medium flex items-center gap-2">
                <Compass className="h-3.5 w-3.5 text-[#1E4FD8] shrink-0" />
                <span className="line-clamp-1">توصية: {recommendations[0].title}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('weakness-profile')}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
          >
            <span>عرض تقرير التشخيص</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 2: Student Level & Platform Rank Card */}
        <StudentLevelRankCard
          stats={rankStats}
          onOpenLeaderboard={() => onNavigate('leaderboard')}
        />

      </section>

      {/* ========================================================================= */}
      {/* 8. Statistics (الإحصائيات المدمجة)                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#1E4FD8]" />
            <h2 className="text-xs sm:text-sm font-black text-[#0D1B3E]">الإحصائيات الأكاديمية</h2>
          </div>
          <button
            onClick={() => onNavigate('my-results')}
            className="text-[11px] font-bold text-[#1E4FD8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>سجل النتائج</span>
            <ChevronLeft className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          
          {/* Enrolled Courses */}
          <div className="rounded-xl border border-slate-100 bg-[#F5F7FA] p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#F5B301] border border-amber-200">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-[#0D1B3E] block">{relevantCourses.length}</span>
              <p className="text-[10px] font-bold text-[#6B7280]">الكورسات المفتوحة</p>
            </div>
          </div>

          {/* Completed Lessons */}
          <div className="rounded-xl border border-slate-100 bg-[#F5F7FA] p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-[#0D1B3E] block">{completedLessonsCount} / {totalAvailableLessons}</span>
              <p className="text-[10px] font-bold text-[#6B7280]">الدروس المكتملة</p>
            </div>
          </div>

          {/* Passed Exams */}
          <div className="rounded-xl border border-slate-100 bg-[#F5F7FA] p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-[#0D1B3E] block">{passedExamsCount}</span>
              <p className="text-[10px] font-bold text-[#6B7280]">اختبارات مجتازة</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="rounded-xl border border-slate-100 bg-[#F5F7FA] p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1E4FD8] border border-blue-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-[#1E4FD8] block font-mono">{overallProgressPercent}%</span>
              <p className="text-[10px] font-bold text-[#6B7280]">التقدم الكلي</p>
            </div>
          </div>

          {/* Average Score */}
          <div className="rounded-xl border border-slate-100 bg-[#F5F7FA] p-3 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-[#0D1B3E] block font-mono">{averageScore}%</span>
              <p className="text-[10px] font-bold text-[#6B7280]">متوسط الدرجات</p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. Current Courses (كورساتي الحالية - تصميم مدمج وأنيق)                   */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E4FD8]" />
            <h2 className="text-base sm:text-lg font-black text-[#0D1B3E]">كورساتي الحالية ({relevantCourses.length})</h2>
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
          <div className="space-y-4">
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

            {allCoursesList.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#F5B301]" />
                    <h3 className="text-sm font-black text-[#0D1B3E]">الكورسات المتاحة للتسجيل</h3>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">اختر كورس لعرض التفاصيل والاشتراك</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allCoursesList.slice(0, 3).map((course) => (
                    <div 
                      key={course.id}
                      className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-1.5 right-1.5 rounded-md bg-[#F5B301] text-[#0D1B3E] px-2 py-0.5 text-[10px] font-black shadow-xs z-10">
                            {course.price} ج.م
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 rounded-md bg-[#0D1B3E]/85 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-slate-200 z-10 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5 text-amber-400" />
                            <span>غير مشترك</span>
                          </div>
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h4 className="font-bold text-[#0D1B3E] text-xs sm:text-sm line-clamp-1">
                            {course.title}
                          </h4>
                          <p className="text-[10px] text-[#6B7280] line-clamp-1">
                            {course.description}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 pt-0">
                        <button
                          onClick={() => onNavigate('course-details', { courseId: course.id })}
                          className="w-full rounded-xl bg-blue-50 border border-blue-200 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white transition-all cursor-pointer text-center"
                        >
                          عرض تفاصيل الكورس والاشتراك
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    {/* Compact Thumbnail */}
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-1.5 right-1.5 rounded-md bg-white/95 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-[#1E4FD8] border border-blue-200 shadow-xs z-10">
                        {course.grade?.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}
                      </div>
                      <CourseRatingBadge 
                        rating={course.rating} 
                        ratingCount={course.ratingCount} 
                        size="sm" 
                        position="top-left" 
                        className="!top-1.5 !left-1.5 !px-1.5 !py-0.5 !text-[9px]"
                      />
                      <div className="absolute bottom-1.5 right-1.5 rounded-md bg-[#0D1B3E]/85 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white z-10">
                        {completedLessons} / {totalLessons} درس
                      </div>
                    </div>

                    {/* Compact Body */}
                    <div className="p-3 space-y-2">
                      <div>
                        <h3 className="font-bold text-[#0D1B3E] text-xs sm:text-sm leading-snug line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
                          {course.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                        <span className="truncate max-w-[140px]">المحاضر: {course.instructorName || 'أ / إبراهيم خليل'}</span>
                        {expiry && (
                          <span className="flex items-center gap-1 text-[9px] text-[#1E4FD8] font-bold shrink-0">
                            <Calendar className="h-3 w-3" />
                            متاح حتى {new Date(expiry).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>

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

                  {/* Actions */}
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
      {/* 10. Bottom Navigation (شريط التنقل السفلي للهواتف الذكية)                  */}
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
          <span className="text-[10px] font-bold">الرئيسية</span>
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

        {/* Lucky Wheel Tab */}
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

      {/* Lucky Wheel Modal (Focused on Points & Rank Acceleration) */}
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

    </div>
  );
};
