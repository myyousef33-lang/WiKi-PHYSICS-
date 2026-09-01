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
  Play,
  LayoutGrid,
  SlidersHorizontal
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
  const [courseDisplayMode, setCourseDisplayMode] = useState<'carousel' | 'grid'>('carousel');
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
      const scrollAmount = direction === 'left' ? -420 : 420;
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
      <section className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="rounded-3xl border border-[#2E86FF]/35 bg-[#122442] p-5 sm:p-8 lg:p-10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E375E] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#FFB020]/15 text-[#FFB020]">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-base sm:text-xl lg:text-2xl">الفيديو التعريفي بالمنصة وشرح طريقة الاستخدام</h3>
                <p className="text-xs sm:text-sm text-slate-300">شاهد جولة سريعة داخل المنصة لمعرفة كيفية تفعيل الاشتراكات ومشاهدة الدروس</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs font-bold text-[#2E86FF] bg-[#2E86FF]/10 px-4 py-1.5 rounded-full border border-[#2E86FF]/30">
              فيديو توضيحي رسمي
            </span>
          </div>
          <div className="relative aspect-video w-full rounded-2xl lg:rounded-3xl overflow-hidden bg-black border border-[#1E375E] shadow-2xl">
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
    <div className="space-y-20 lg:space-y-28 xl:space-y-32 animate-in fade-in duration-300 overflow-x-hidden max-w-full pb-16">
      
      {/* INTRO VIDEO IF PLACEMENT IS TOP */}
      {settings.homeVideoPlacement === 'top' && renderIntroVideo()}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 pb-16 lg:pt-10 lg:pb-24 xl:pt-14 xl:pb-28">
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2E86FF]/12 rounded-full blur-[140px] pointer-events-none" />

        <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
            
            {/* Right Column (Hero Text & CTA) in RTL */}
            <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-center lg:text-right">
              
              {/* Animated Atomic Orbit Drawing */}
              <div className="flex justify-center lg:justify-start">
                <AtomicHeroVisual />
              </div>

              {/* Badges Row: Active Presence Counter Badge & Platform Banner Badge */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                
                {/* Real-time Active Presence Counter Badge */}
                <div className="inline-flex items-center gap-3 rounded-full border border-[#2E86FF]/40 bg-[#122442] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-xl">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span>
                    {activeCount >= 3 ? (
                      <>
                        <strong className="text-[#FFB020] text-sm sm:text-base font-black mx-1 font-mono">{activeCount.toLocaleString('ar-EG')}</strong>{' '}
                        طالب بيذاكر دلوقتي
                      </>
                    ) : (
                      'انضم لآلاف الطلاب الذين يذاكرون فيزياء الآن'
                    )}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#2E86FF]/40 bg-[#2E86FF]/10 px-4 py-2 text-xs sm:text-sm font-bold text-[#2E86FF] shadow-inner">
                  <Atom className="h-4 w-4 animate-spin" />
                  <span>المنصة الرائدة في فيزياء الثانوية العامة</span>
                </div>

              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.15] tracking-tight">
                طريقك إلى <span className="text-[#FFB020] physics-glow">الدرجة النهائية</span> في الفيزياء
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto lg:mx-0 font-normal">
                تجربة تعليمية متكاملة تجمع بين الشرح التفصيلي المبسط، حل آلاف الأسئلة والأفكار العالية، ومتابعة دورية وامتحانات إلكترونية مصححة فورياً لتضمن الدرجة النهائية بأعلى كفاءة.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {student ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center gap-3 rounded-2xl bg-[#FFB020] px-8 py-4 lg:px-9 lg:py-4.5 text-sm sm:text-base lg:text-lg font-black text-[#0C1B33] shadow-2xl shadow-[#FFB020]/30 hover:scale-105 active:scale-95 hover:bg-[#e59e1c] transition-all"
                  >
                    <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span>الدخول إلى لوحة دراستي</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuthModal}
                    className="inline-flex items-center gap-3 rounded-2xl bg-[#FFB020] px-8 py-4 lg:px-9 lg:py-4.5 text-sm sm:text-base lg:text-lg font-black text-[#0C1B33] shadow-2xl shadow-[#FFB020]/30 hover:scale-105 active:scale-95 hover:bg-[#e59e1c] transition-all"
                  >
                    <Sparkles className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span>ابدأ التعلم الآن مجاناً</span>
                  </button>
                )}

                <button
                  onClick={onOpenActivationModal}
                  className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-[#2E86FF]/40 bg-[#122442] px-7 py-4 lg:px-8 lg:py-4.5 text-sm sm:text-base lg:text-lg font-bold text-white hover:border-[#2E86FF] hover:bg-[#1B355E] transition-all shadow-lg"
                >
                  <Key className="h-5 w-5 text-[#2E86FF]" />
                  <span>تفعيل كود الاشتراك</span>
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-3 gap-4 lg:gap-8 pt-8 border-t border-[#1E375E] max-w-2xl mx-auto lg:mx-0 text-center">
                <div className="p-2">
                  <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white">+10,000</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-bold">طالب مستفيد</p>
                </div>
                <div className="p-2">
                  <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-[#2E86FF]">100%</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-bold">تغطية أفكار الامتحانات</p>
                </div>
                <div className="p-2">
                  <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-emerald-400">24/7</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-bold">دعم ومتابعة مستمرة</p>
                </div>
              </div>

            </div>

            {/* Left Column: Teacher Card with Large Framing for Desktop */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                
                {/* Visual Frame */}
                <div className="relative rounded-3xl lg:rounded-4xl border-2 border-[#2E86FF]/35 bg-[#122442] p-4 lg:p-6 shadow-2xl overflow-hidden group">
                  
                  {/* Teacher Photo */}
                  <div className="relative aspect-[3/4] w-full rounded-2xl lg:rounded-3xl overflow-hidden bg-[#0C1B33] border border-[#1E375E] shadow-inner">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C1B33] via-[#0C1B33]/35 to-transparent" />
                    
                    {/* Overlay Text */}
                    <div className="absolute bottom-5 right-5 left-5 text-right space-y-1.5">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-[#FFB020] text-[#0C1B33] px-3 py-1 text-xs lg:text-sm font-black shadow-md">
                        <Award className="h-4 w-4" />
                        <span>كبير معلمي الفيزياء</span>
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-black text-white">{settings.instructorTitle}</h3>
                      <p className="text-xs sm:text-sm text-slate-200">خبرة أكثر من 15 عاماً في إعداد وتخريج أوائل الجمهورية</p>
                    </div>
                  </div>

                  {/* Floating Highlight Card */}
                  <div className="mt-4 flex items-center justify-between p-3.5 lg:p-4 rounded-2xl bg-[#0C1B33] border border-[#1E375E]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm font-bold text-white">منصة آمنة وسريعة بالكامل</p>
                        <p className="text-[11px] lg:text-xs text-slate-300">سيرفرات فائقة السرعة ومشاهدة غير محدودة</p>
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
      <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12">
        <ExamCountdownBanner onNavigate={onNavigate} />
      </div>

      {/* PLATFORM ADVANTAGES */}
      <section className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">لماذا منصة Wiki-X فيزياء؟</h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-300">صُممت المنصة خصيصاً لتلبية متطلبات وتحديات نظام الثانوية العامة الحديث</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl hover:border-[#2E86FF]/50 transition-all">
            <div className="rounded-2xl bg-[#2E86FF]/15 p-4 w-fit text-[#2E86FF]">
              <PlayCircle className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-white text-lg lg:text-xl">شرح وافي ومبسط</h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
              فيديوهات بجودة عالية وتطبيقات عملية ورسوم متحركة لتجسيد الظواهر الفيزيائية المعقدة خطوة بخطوة.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl hover:border-[#2E86FF]/50 transition-all">
            <div className="rounded-2xl bg-[#2E86FF]/15 p-4 w-fit text-[#2E86FF]">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-white text-lg lg:text-xl">امتحانات وتصحيح فوري</h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
              بنك أسئلة متدرج الصعوبة مع مؤقت زمني ونموذج إجابة مفصل لكل سؤال لتشخيص نقاط الضعف وعلاجها فوراً.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl hover:border-emerald-500/50 transition-all">
            <div className="rounded-2xl bg-emerald-500/15 p-4 w-fit text-emerald-400">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-white text-lg lg:text-xl">مذكرات وملازم PDF</h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
              ملازم مطبوعة ورقمية عالية الجودة، تشمل ملخصات القوانين، الخرائط الذهنية، وأسئلة امتحانات سابقة.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl hover:border-[#FFB020]/50 transition-all">
            <div className="rounded-2xl bg-[#FFB020]/15 p-4 w-fit text-[#FFB020]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-white text-lg lg:text-xl">تفعيل فوري بالأكواد</h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
              اشترك بسهولة عبر كود التفعيل السري دون تعقيدات، مع حماية أجهزتك ومتابعة مستواك بصفة دورية.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED COURSES TEASER (YOUTUBE DESKTOP HORIZONTAL CAROUSEL & GRID TOGGLE) */}
      <section className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E375E] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[#FFB020] animate-pulse"></span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">الكورسات والمناهج المتاحة</h2>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 mt-1">تصفح المحاضرات والمناهج الدراسية المصممة لجميع المراحل</p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* View Mode Toggle (Desktop) */}
            {courses.length > 0 && (
              <div className="hidden md:flex items-center gap-1 bg-[#122442] p-1 rounded-2xl border border-[#1E375E]">
                <button
                  onClick={() => setCourseDisplayMode('carousel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    courseDisplayMode === 'carousel'
                      ? 'bg-[#2E86FF] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="عرض كاروسيل أفقي"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>كاروسيل</span>
                </button>
                <button
                  onClick={() => setCourseDisplayMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    courseDisplayMode === 'grid'
                      ? 'bg-[#2E86FF] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="عرض شبكة كاملة"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>شبكة كاملة</span>
                </button>
              </div>
            )}

            {courses.length > 0 && courseDisplayMode === 'carousel' && (
              <div className="flex items-center gap-1.5 bg-[#122442] p-1.5 rounded-2xl border border-[#1E375E]">
                <button
                  onClick={() => scrollCourses('right')}
                  className="p-2.5 rounded-xl bg-[#0C1B33] text-slate-300 hover:text-white hover:bg-[#2E86FF] transition-all"
                  title="التمرير لليمين"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollCourses('left')}
                  className="p-2.5 rounded-xl bg-[#0C1B33] text-slate-300 hover:text-white hover:bg-[#2E86FF] transition-all"
                  title="التمرير لليسار"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => onNavigate('courses-catalog')}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#2E86FF] hover:underline bg-[#2E86FF]/10 px-4 py-2.5 rounded-2xl border border-[#2E86FF]/30"
            >
              <span>عرض جميع الكورسات</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-[#1E375E] bg-[#122442] p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 text-[#2E86FF]">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">الكورسات والمناهج قيد التجهيز</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                يقوم أ / إبراهيم خليل حالياً برفع المحاضرات وحصص الشرح الجديدة. تابع قناة التليجرام لمعرفة مواعيد النشر.
              </p>
            </div>
          </div>
        ) : courseDisplayMode === 'carousel' ? (
          /* YouTube Desktop Horizontal Scroll Row */
          <div 
            ref={coursesScrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-6 pt-1 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {courses.map(course => {
              const totalLessons = course.units?.reduce((acc, u) => acc + (u.lessons?.length || 0), 0) || 0;
              return (
                <div
                  key={course.id}
                  className="w-[290px] sm:w-[340px] lg:w-[390px] xl:w-[430px] 2xl:w-[460px] shrink-0 snap-start glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col justify-between group border border-[#1E375E] hover:border-[#2E86FF]/60 transition-all shadow-2xl"
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
                        <div className="h-14 w-14 rounded-full bg-[#FFB020] text-[#0C1B33] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 fill-[#0C1B33] mr-0.5" />
                        </div>
                      </div>

                      {/* Grade Badge */}
                      <div className="absolute top-3 right-3 rounded-xl bg-[#0C1B33]/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#2E86FF] border border-[#2E86FF]/30 shadow-md">
                        {course.grade}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-3 left-3 rounded-xl bg-[#FFB020] px-3 py-1 text-xs font-black text-[#0C1B33] shadow-md">
                        {course.price > 0 ? `${course.price} ج.م` : 'مجاني'}
                      </div>

                      {/* Bottom Badge: Lesson Count */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-200 border border-white/10">
                        <PlayCircle className="h-3.5 w-3.5 text-[#FFB020]" />
                        <span>{totalLessons} درس • {course.units?.length || 0} فصول</span>
                      </div>
                    </div>

                    {/* Course Title & Description */}
                    <div className="p-5 lg:p-6 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#2E86FF]/20 flex items-center justify-center text-[#2E86FF] text-xs font-black border border-[#2E86FF]/30 shrink-0">
                          أكـ
                        </div>
                        <span className="text-xs lg:text-sm font-bold text-slate-300 truncate">
                          {course.instructorName || settings.instructorName}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base lg:text-lg leading-snug line-clamp-2 min-h-[3rem] group-hover:text-[#2E86FF] transition-colors">
                        {course.title}
                      </h3>
                      
                      <p className="text-xs lg:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 lg:p-6 pt-0">
                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="w-full rounded-2xl bg-[#2E86FF] hover:bg-[#2573e0] py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-[#2E86FF]/20 flex items-center justify-center gap-2"
                    >
                      <span>استعراض المنهج والدروس</span>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Full Grid Mode for Desktop */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
            {courses.map(course => {
              const totalLessons = course.units?.reduce((acc, u) => acc + (u.lessons?.length || 0), 0) || 0;
              return (
                <div
                  key={course.id}
                  className="glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col justify-between group border border-[#1E375E] hover:border-[#2E86FF]/60 transition-all shadow-2xl"
                >
                  <div>
                    {/* Video/Course Thumbnail Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-[#0C1B33]">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1B33] via-transparent to-black/30" />

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                        <div className="h-14 w-14 rounded-full bg-[#FFB020] text-[#0C1B33] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 fill-[#0C1B33] mr-0.5" />
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 rounded-xl bg-[#0C1B33]/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#2E86FF] border border-[#2E86FF]/30 shadow-md">
                        {course.grade}
                      </div>

                      <div className="absolute top-3 left-3 rounded-xl bg-[#FFB020] px-3 py-1 text-xs font-black text-[#0C1B33] shadow-md">
                        {course.price > 0 ? `${course.price} ج.م` : 'مجاني'}
                      </div>

                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-200 border border-white/10">
                        <PlayCircle className="h-3.5 w-3.5 text-[#FFB020]" />
                        <span>{totalLessons} درس • {course.units?.length || 0} فصول</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#2E86FF]/20 flex items-center justify-center text-[#2E86FF] text-xs font-black border border-[#2E86FF]/30 shrink-0">
                          أكـ
                        </div>
                        <span className="text-xs lg:text-sm font-bold text-slate-300 truncate">
                          {course.instructorName || settings.instructorName}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base lg:text-lg leading-snug line-clamp-2 min-h-[3rem] group-hover:text-[#2E86FF] transition-colors">
                        {course.title}
                      </h3>
                      
                      <p className="text-xs lg:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="w-full rounded-2xl bg-[#2E86FF] hover:bg-[#2573e0] py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-[#2E86FF]/20 flex items-center justify-center gap-2"
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
      <section className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
        <div className="rounded-3xl border border-[#1E375E] bg-[#122442] p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-4 text-center lg:text-right">
            <span className="rounded-full bg-[#2E86FF]/15 border border-[#2E86FF]/30 px-4 py-1.5 text-xs lg:text-sm font-bold text-[#2E86FF]">
              المكتبة والملازم
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">
              أقوى مذكرات الشرح وبنوك الأسئلة PDF
            </h2>
            <p className="text-xs sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed">
              تصفح مذكرات الشرح والمسائل المحلولة وخرائط القوانين الذهنية المجهزة خصيصاً للطباعة أو القراءة المباشرة من التابلت والكمبيوتر.
            </p>
          </div>

          <button
            onClick={() => onNavigate('pdf-library')}
            className="rounded-2xl bg-[#FFB020] px-9 py-4 text-sm sm:text-base lg:text-lg font-black text-[#0C1B33] shadow-2xl shadow-[#FFB020]/25 hover:scale-105 hover:bg-[#e59e1c] transition-all shrink-0"
          >
            تصفح مكتبة الـ PDF
          </button>
        </div>
      </section>

      {/* TESTIMONIALS / SUCCESS STORIES */}
      <section className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-10 xl:px-12 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">آراء وتجارب طلابنا المتفوقين</h2>
          <p className="text-xs sm:text-base lg:text-lg text-slate-300">فخورون برحلة نجاح طلابنا في مختلف محافظات مصر</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl">
            <div className="flex items-center gap-1 text-[#FFB020]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-[#FFB020]" />)}
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed">
              "الفيزياء كانت أصعب مادة عندي، لكن بفضل أسلوب الشرح المنظم وبنك الأسئلة قدرت أقفل الامتحان التجريبي بدرجة 59 من 60!"
            </p>
            <div className="pt-3 border-t border-[#1E375E] text-xs sm:text-sm font-bold text-white">
              أحمد محمد — أوائل الدقهلية
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl">
            <div className="flex items-center gap-1 text-[#FFB020]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-[#FFB020]" />)}
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed">
              "ميزة تصحيح الامتحانات الفورية ومعرفة سبب الخطأ بالشرح الفيزيائي وفرت عليا وقت كبير جداً وخلتني أثق في نفسي."
            </p>
            <div className="pt-3 border-t border-[#1E375E] text-xs sm:text-sm font-bold text-white">
              مريم خالد — الجيزة
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 space-y-4 shadow-xl">
            <div className="flex items-center gap-1 text-[#FFB020]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-[#FFB020]" />)}
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed">
              "المذكرات والـ PDF منظمة جداً وكل قانون معاه رسم توضيحي وأمثلة الوزارة السابقة. منصة متكاملة بمعنى الكلمة."
            </p>
            <div className="pt-3 border-t border-[#1E375E] text-xs sm:text-sm font-bold text-white">
              يوسف طارق — الإسكندرية
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
