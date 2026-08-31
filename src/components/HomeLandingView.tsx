import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  Award, 
  Key, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  Star,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Atom,
  Clock,
  Phone,
  Play
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { PresenceService } from '../services/presence';
import { Course, PdfMaterial, Student } from '../types';
import { ExamCountdownBanner } from './ExamCountdownBanner';
import { AtomicHeroVisual } from './AtomicHeroVisual';
import teacherPhoto from '../assets/images/teacher.jpg';

interface HomeLandingViewProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenAuthModal: () => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onNavigate,
  onOpenActivationModal,
  onOpenAuthModal
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pdfs, setPdfs] = useState<PdfMaterial[]>([]);
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [activeCount, setActiveCount] = useState<number>(PresenceService.getActiveCount());
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const settings = StorageService.getSettings();

  useEffect(() => {
    const update = () => {
      setCourses(StorageService.getCourses());
      setPdfs(StorageService.getPdfs());
      setStudent(StorageService.getCurrentStudent());
    };
    update();

    // Subscribe to presence active users count
    const unsubscribePresence = PresenceService.subscribeActiveCount(setActiveCount);

    const unsubscribeStorage = subscribeToStorage(update);
    return () => {
      unsubscribeStorage();
      unsubscribePresence();
    };
  }, []);

  const scrollCourses = (direction: 'left' | 'right') => {
    if (coursesScrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      coursesScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getEmbedVideoUrl = (rawUrl?: string): string | null => {
    if (!rawUrl || !rawUrl.trim()) return null;
    const url = rawUrl.trim();
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else {
        const match = url.match(/v=([a-zA-Z0-9_-]+)/);
        if (match) videoId = match[1];
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const renderIntroVideo = () => {
    const videoUrl = settings.homeIntroVideoUrl;
    const embedUrl = getEmbedVideoUrl(videoUrl);
    if (!embedUrl) return null;

    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#2E86FF]/30 bg-[#122442] p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E375E] pb-3">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-[#FFB020]" />
              <h3 className="font-bold text-white text-sm sm:text-base">الفيديو التعريفي بالمنصة وشرح طريقة الاستخدام</h3>
            </div>
            <span className="text-[10px] font-bold text-[#2E86FF] bg-[#2E86FF]/10 px-2.5 py-1 rounded-full border border-[#2E86FF]/20">
              فيديو حصري
            </span>
          </div>
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#1E375E] shadow-inner">
            <iframe
              src={embedUrl}
              title="الفيديو التعريفي"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-20 animate-in fade-in duration-300 overflow-x-hidden max-w-full">
      
      {/* INTRO VIDEO IF PLACEMENT IS TOP */}
      {settings.homeVideoPlacement === 'top' && renderIntroVideo()}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-4 pb-16 lg:py-20">
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2E86FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Right Column (Hero Text & CTA) in RTL */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              
              {/* Animated Atomic Orbit Drawing replacing empty space above heading */}
              <div className="flex justify-center lg:justify-start">
                <AtomicHeroVisual />
              </div>

              {/* Badges Row: Active Presence Counter Badge & Platform Banner Badge */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                
                {/* Real-time Active Presence Counter Badge */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2E86FF]/40 bg-[#122442] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>
                    {activeCount >= 3 ? (
                      <>
                        <strong className="text-[#FFB020] text-sm font-black mx-1 font-mono">{activeCount.toLocaleString('ar-EG')}</strong>{' '}
                        طالب بيذاكر دلوقتي
                      </>
                    ) : (
                      'انضم للطلاب اللي بيذاكروا فيزياء دلوقتي'
                    )}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#2E86FF]/40 bg-[#2E86FF]/10 px-4 py-1.5 text-xs font-bold text-[#2E86FF] shadow-inner">
                  <Atom className="h-4 w-4 animate-spin" />
                  <span>المنصة الرائدة في فيزياء الثانوية العامة</span>
                </div>

              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                طريقك إلى <span className="text-[#FFB020] physics-glow">الدرجة النهائية</span> في الفيزياء
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                تجربة تعليمية متكاملة تجمع بين الشرح التفصيلي المبسط، حل آلاف الأسئلة والأفكار العالية، ومتابعة دورية وامتحانات إلكترونية مصححة فورياً.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                {student ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-[#FFB020] px-7 py-3.5 text-sm font-black text-[#0C1B33] shadow-xl shadow-[#FFB020]/25 hover:scale-105 active:scale-95 hover:bg-[#e59e1c] transition-all"
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span>الدخول إلى لوحة دراستي</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuthModal}
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-[#FFB020] px-7 py-3.5 text-sm font-black text-[#0C1B33] shadow-xl shadow-[#FFB020]/25 hover:scale-105 active:scale-95 hover:bg-[#e59e1c] transition-all"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>ابدأ التعلم الآن مجاناً</span>
                  </button>
                )}

                <button
                  onClick={onOpenActivationModal}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#2E86FF]/40 bg-[#122442] px-6 py-3.5 text-sm font-bold text-white hover:border-[#2E86FF] hover:bg-[#1B355E] transition-all"
                >
                  <Key className="h-4 w-4 text-[#2E86FF]" />
                  <span>تفعيل كود الاشتراك</span>
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1E375E] max-w-lg mx-auto lg:mx-0 text-center">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">+10,000</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">طالب مستفيد</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#2E86FF]">100%</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">تغطية أفكار الامتحانات</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400">24/7</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">دعم ومتابعة مستمرة</p>
                </div>
              </div>

            </div>

            {/* Left Column: Teacher Card with teacher-original.jpg */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                
                {/* Visual Frame */}
                <div className="relative rounded-3xl border-2 border-[#2E86FF]/30 bg-[#122442] p-4 shadow-2xl overflow-hidden group">
                  
                  {/* Teacher Photo */}
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#0C1B33] border border-[#1E375E]">
                    <img
                      src={settings.instructorPhotoUrl || '/teacher.jpg'}
                      alt={settings.instructorTitle}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true';
                          target.src = '/teacher.jpg';
                        }
                      }}
                      className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C1B33] via-[#0C1B33]/30 to-transparent" />
                    
                    {/* Overlay Text */}
                    <div className="absolute bottom-4 right-4 left-4 text-right space-y-1">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFB020] text-[#0C1B33] px-2.5 py-0.5 text-xs font-black">
                        <Award className="h-3.5 w-3.5" />
                        <span>كبير معلمي الفيزياء</span>
                      </div>
                      <h3 className="text-xl font-black text-white">{settings.instructorTitle}</h3>
                      <p className="text-xs text-slate-300">خبرة أكثر من 15 عاماً في إعداد أوائل الجمهورية</p>
                    </div>
                  </div>

                  {/* Floating Highlight Card */}
                  <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-[#0C1B33] border border-[#1E375E]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">منصة آمنة ومحمية</p>
                        <p className="text-[10px] text-slate-300">تحكم كامل بالجلسات وسرعة تشغيل فائقة</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* INTRO VIDEO IF PLACEMENT IS BELOW HERO */}
      {(settings.homeVideoPlacement === 'below_hero' || !settings.homeVideoPlacement) && renderIntroVideo()}

      {/* EXAM COUNTDOWN BANNER */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ExamCountdownBanner onNavigate={onNavigate} />
      </div>

      {/* PLATFORM ADVANTAGES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white">لماذا منصة Wiki-X فيزياء؟</h2>
          <p className="text-xs sm:text-sm text-slate-300">صُممت المنصة خصيصاً لتلبية متطلبات نظام الثانوية العامة الحديث</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-[#2E86FF]/15 p-3 w-fit text-[#2E86FF]">
              <PlayCircle className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">شرح وافي ومبسط</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              فيديوهات بجودة عالية وتطبيقات عملية ورسوم متحركة لتجسيد الظواهر الفيزيائية المعقدة.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-[#2E86FF]/15 p-3 w-fit text-[#2E86FF]">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">امتحانات إلكترونية وتصحيح فوري</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              بنك أسئلة متدرج الصعوبة مع مؤقت زمني ونموذج إجابة مفصل لكل سؤال لتشخيص نقاط الضعف.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-emerald-500/15 p-3 w-fit text-emerald-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">مذكرات وملازم PDF متميزة</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ملازم مطبوعة ورقمية عالية الجودة، تشمل ملخصات القوانين، الخرائط الذهنية، وأسئلة امتحانات سابقة.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-[#FFB020]/15 p-3 w-fit text-[#FFB020]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">تفعيل فوري بالأكواد</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              اشترك بسهولة عبر كود التفعيل السري دون تعقيدات، مع حماية أجهزتك ومتابعة مستواك بصفة دائمة.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED COURSES TEASER (YOUTUBE DESKTOP HORIZONTAL CAROUSEL) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E375E] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFB020] animate-pulse"></span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">الكورسات والمناهج المتاحة</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">تصفح الكورسات المحاضرة تلو الأخرى أفقياً بنفس نظام يوتيوب للكمبيوتر</p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {courses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#122442] p-1.5 rounded-2xl border border-[#1E375E]">
                <button
                  onClick={() => scrollCourses('right')}
                  className="p-2 rounded-xl bg-[#0C1B33] text-slate-300 hover:text-white hover:bg-[#2E86FF] transition-all"
                  title="التمرير لليمين"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollCourses('left')}
                  className="p-2 rounded-xl bg-[#0C1B33] text-slate-300 hover:text-white hover:bg-[#2E86FF] transition-all"
                  title="التمرير لليسار"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => onNavigate('courses-catalog')}
              className="flex items-center gap-1 text-xs font-bold text-[#2E86FF] hover:underline bg-[#2E86FF]/10 px-3.5 py-2 rounded-xl border border-[#2E86FF]/30"
            >
              <span>عرض جميع الكورسات</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-[#1E375E] bg-[#122442] p-10 text-center max-w-lg mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 text-[#2E86FF]">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">الكورسات والمناهج قيد التجهيز</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                يقوم أ / إبراهيم خليل حالياً برفع المحاضرات وحصص الشرح الجديدة. تابع قناة التليجرام لمعرفة مواعيد النشر.
              </p>
            </div>
          </div>
        ) : (
          /* YouTube Desktop Horizontal Scroll Row */
          <div 
            ref={coursesScrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-4 pt-1 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {courses.map(course => {
              const totalLessons = course.units?.reduce((acc, u) => acc + (u.lessons?.length || 0), 0) || 0;
              return (
                <div
                  key={course.id}
                  className="w-[280px] sm:w-[320px] lg:w-[350px] shrink-0 snap-start glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between group border border-[#1E375E] hover:border-[#2E86FF]/50 transition-all shadow-xl"
                >
                  <div>
                    {/* Video/Course Thumbnail Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-[#0C1B33]">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1B33] via-transparent to-black/30" />

                      {/* Hover Play Button Overlay (YouTube Style) */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                        <div className="h-12 w-12 rounded-full bg-[#FFB020] text-[#0C1B33] flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 fill-[#0C1B33] mr-0.5" />
                        </div>
                      </div>

                      {/* Grade Badge */}
                      <div className="absolute top-2.5 right-2.5 rounded-lg bg-[#0C1B33]/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#2E86FF] border border-[#2E86FF]/30 shadow-md">
                        {course.grade}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-2.5 left-2.5 rounded-lg bg-[#FFB020] px-2.5 py-1 text-[11px] font-black text-[#0C1B33] shadow-md">
                        {course.price > 0 ? `${course.price} ج.م` : 'مجاني'}
                      </div>

                      {/* Bottom Badge: Lesson Count */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-md bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-200 border border-white/10">
                        <PlayCircle className="h-3 w-3 text-[#FFB020]" />
                        <span>{totalLessons} درس • {course.units?.length || 0} فصول</span>
                      </div>
                    </div>

                    {/* Course Title & Description */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#2E86FF]/20 flex items-center justify-center text-[#2E86FF] text-[10px] font-black border border-[#2E86FF]/30 shrink-0">
                          أكـ
                        </div>
                        <span className="text-[11px] font-bold text-slate-300 truncate">
                          {course.instructorName || settings.instructorName}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#2E86FF] transition-colors">
                        {course.title}
                      </h3>
                      
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="w-full rounded-xl bg-[#2E86FF] hover:bg-[#2573e0] py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-[#2E86FF]/20 flex items-center justify-center gap-2"
                    >
                      <span>استعراض المنهج والدروس</span>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* INTRO VIDEO IF PLACEMENT IS BELOW COURSES */}
      {settings.homeVideoPlacement === 'below_courses' && renderIntroVideo()}

      {/* PDF MATERIALS TEASER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl border border-[#1E375E] bg-[#122442] p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-right">
            <span className="rounded-full bg-[#2E86FF]/15 border border-[#2E86FF]/30 px-3.5 py-1 text-xs font-bold text-[#2E86FF]">
              المكتبة والملازم
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              أقوى مذكرات الشرح وبنوك الأسئلة PDF
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              تصفح مذكرات الشرح والمسائل المحلولة وخرائط القوانين الذهنية المجهزة خصيصاً للطباعة أو القراءة المباشرة من التابلت والهاتف.
            </p>
          </div>

          <button
            onClick={() => onNavigate('pdf-library')}
            className="rounded-2xl bg-[#FFB020] px-8 py-3.5 text-xs sm:text-sm font-black text-[#0C1B33] shadow-xl shadow-[#FFB020]/20 hover:scale-105 hover:bg-[#e59e1c] transition-all shrink-0"
          >
            تصفح مكتبة الـ PDF
          </button>
        </div>
      </section>

      {/* TESTIMONIALS / SUCCESS STORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">آراء وتجارب طلابنا المتفوقين</h2>
          <p className="text-xs sm:text-sm text-slate-300">فخورون برحلة نجاح طلابنا في مختلف محافظات مصر</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-1 text-[#FFB020]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#FFB020]" />)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "الفيزياء كانت أصعب مادة عندي، لكن بفضل أسلوب الشرح المنظم وبنك الأسئلة قدرت أقفل الامتحان التجريبي بدرجة 59 من 60!"
            </p>
            <div className="pt-2 border-t border-[#1E375E] text-xs font-bold text-white">
              أحمد محمد — أوائل الدقهلية
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-1 text-[#FFB020]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#FFB020]" />)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "ميزة تصحيح الامتحانات الفورية ومعرفة سبب الخطأ بالشرح الفيزيائي وفرت عليا وقت كبير جداً وخلتني أثق في نفسي."
            </p>
            <div className="pt-2 border-t border-[#1E375E] text-xs font-bold text-white">
              مريم خالد — الجيزة
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-1 text-[#FFB020]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#FFB020]" />)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "المذكرات والـ PDF منظمة جداً وكل قانون معاه رسم توضيحي وأمثلة الوزارة السابقة. منصة متكاملة بمعنى الكلمة."
            </p>
            <div className="pt-2 border-t border-[#1E375E] text-xs font-bold text-white">
              يوسف طارق — الإسكندرية
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
