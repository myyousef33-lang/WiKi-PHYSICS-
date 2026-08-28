import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  Atom,
  Clock,
  Phone
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Course, PdfMaterial, Student } from '../types';
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
  const settings = StorageService.getSettings();

  useEffect(() => {
    const update = () => {
      setCourses(StorageService.getCourses());
      setPdfs(StorageService.getPdfs());
      setStudent(StorageService.getCurrentStudent());
    };
    update();
    return subscribeToStorage(update);
  }, []);

  return (
    <div className="space-y-20 animate-in fade-in duration-300">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-24">
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Right Column (Hero Text & CTA) in RTL */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 shadow-inner">
                <Atom className="h-4 w-4 animate-spin" />
                <span>المنصة الرائدة في فيزياء الثانوية العامة</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                طريقك إلى <span className="text-amber-400 physics-glow">الدرجة النهائية</span> في الفيزياء
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                تجربة تعليمية متكاملة تجمع بين الشرح التفصيلي المبسط، حل آلاف الأسئلة والأفكار العالية، ومتابعة دورية وامتحانات إلكترونية مصححة فورياً.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                {student ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span>الدخول إلى لوحة دراستي</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuthModal}
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>ابدأ التعلم الآن مجاناً</span>
                  </button>
                )}

                <button
                  onClick={onOpenActivationModal}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-bold text-white hover:border-amber-500/50 hover:bg-slate-800 transition-all"
                >
                  <Key className="h-4 w-4 text-amber-400" />
                  <span>تفعيل كود الاشتراك</span>
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-center">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">+10,000</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">طالب مستفيد</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">100%</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">تغطية أفكار الامتحانات</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400">24/7</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">دعم ومتابعة مستمرة</p>
                </div>
              </div>

            </div>

            {/* Left Column: Teacher Card with teacher-original.jpg */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                
                {/* Visual Frame */}
                <div className="relative rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 p-4 shadow-2xl overflow-hidden group">
                  
                  {/* Teacher Photo */}
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Overlay Text */}
                    <div className="absolute bottom-4 right-4 left-4 text-right space-y-1">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/90 text-slate-950 px-2.5 py-0.5 text-xs font-black">
                        <Award className="h-3.5 w-3.5" />
                        <span>كبير معلمي الفيزياء</span>
                      </div>
                      <h3 className="text-xl font-black text-white">{settings.instructorTitle}</h3>
                      <p className="text-xs text-slate-300">خبرة أكثر من 15 عاماً في إعداد أوائل الجمهورية</p>
                    </div>
                  </div>

                  {/* Floating Highlight Card */}
                  <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">منصة آمنة ومحمية</p>
                        <p className="text-[10px] text-slate-400">تحكم كامل بالجلسات وسرعة تشغيل فائقة</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PLATFORM ADVANTAGES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white">لماذا منصة Wiki-X فيزياء؟</h2>
          <p className="text-xs sm:text-sm text-slate-400">صُممت المنصة خصيصاً لتلبية متطلبات نظام الثانوية العامة الحديث</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-amber-500/15 p-3 w-fit text-amber-400">
              <PlayCircle className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">شرح وافي ومبسط</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              فيديوهات بجودة عالية وتطبيقات عملية ورسوم متحركة لتجسيد الظواهر الفيزيائية المعقدة.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-blue-500/15 p-3 w-fit text-blue-400">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">امتحانات إلكترونية وتصحيح فوري</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              بنك أسئلة متدرج الصعوبة مع مؤقت زمني ونموذج إجابة مفصل لكل سؤال لتشخيص نقاط الضعف.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-emerald-500/15 p-3 w-fit text-emerald-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">مذكرات وملازم PDF متميزة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ملازم مطبوعة ورقمية عالية الجودة، تشمل ملخصات القوانين، الخرائط الذهنية، وأسئلة امتحانات سابقة.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="rounded-xl bg-purple-500/15 p-3 w-fit text-purple-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">تفعيل فوري بالأكواد</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اشترك بسهولة عبر كود التفعيل السري دون تعقيدات، مع حماية أجهزتك ومتابعة مستواك بصفة دائمة.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED COURSES TEASER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">الكورسات الدراسية المتاحة</h2>
            <p className="text-xs sm:text-sm text-slate-400">اختر صفك الدراسي وابدأ فوراً</p>
          </div>
          <button
            onClick={() => onNavigate('courses-catalog')}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline"
          >
            <span>عرض جميع الكورسات</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center max-w-lg mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">الكورسات والمناهج قيد التجهيز</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يقوم أ / إبراهيم خليل حالياً برفع المحاضرات وحصص الشرح الجديدة. تابع قناة التليجرام لمعرفة مواعيد النشر.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map(course => (
              <div
                key={course.id}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                      {course.grade}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('course-details', { courseId: course.id })}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all"
                  >
                    استعراض المنهج
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PDF MATERIALS TEASER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-right">
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-400">
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
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all shrink-0"
          >
            تصفح مكتبة الـ PDF
          </button>
        </div>
      </section>

      {/* TESTIMONIALS / SUCCESS STORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">آراء وتجارب طلابنا المتفوقين</h2>
          <p className="text-xs sm:text-sm text-slate-400">فخورون برحلة نجاح طلابنا في مختلف محافظات مصر</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "الفيزياء كانت أصعب مادة عندي، لكن بفضل أسلوب الشرح المنظم وبنك الأسئلة قدرت أقفل الامتحان التجريبي بدرجة 59 من 60!"
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs font-bold text-white">
              أحمد محمد — أوائل الدقهلية
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "ميزة تصحيح الامتحانات الفورية ومعرفة سبب الخطأ بالشرح الفيزيائي وفرت عليا وقت كبير جداً وخلتني أثق في نفسي."
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs font-bold text-white">
              مريم خالد — الجيزة
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "المذكرات والـ PDF منظمة جداً وكل قانون معاه رسم توضيحي وأمثلة الوزارة السابقة. منصة متكاملة بمعنى الكلمة."
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs font-bold text-white">
              يوسف طارق — الإسكندرية
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
