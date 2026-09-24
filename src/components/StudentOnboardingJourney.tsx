import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Award, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  PlayCircle, 
  Brain, 
  ShieldCheck, 
  X,
  Compass
} from 'lucide-react';
import { Student } from '../types';
import { StorageService } from '../services/storage';

interface StudentOnboardingJourneyProps {
  student: Student;
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

export const StudentOnboardingJourney: React.FC<StudentOnboardingJourneyProps> = ({
  student,
  isOpen,
  onComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const settings = StorageService.getSettings();
  const teacherPhoto = settings.instructorPhotoUrl || '/teacher-cutout.webp';

  const steps = [
    // Step 1: الترحيب
    {
      id: 'welcome',
      tag: 'بداية الرحلة',
      title: `مرحبًا بك يا ${student.name || 'طالبنا المتميز'}`,
      subtitle: 'أنت الآن بدأت رحلتك التعليمية مع منصة WiKi-PHYSICS.',
      description: 'مكانك المتكامل لتعلم وفهم الفيزياء بأحدث الأساليب التفاعلية والشروحات المنهجية المنظمة.',
      icon: Sparkles,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 border-amber-200'
    },
    // Step 2: أنت طالب في ماذا؟
    {
      id: 'grade',
      tag: 'الصف الدراسي',
      title: `أنت طالب في ${student.grade || 'الصف الثالث الثانوي'}`,
      subtitle: 'ومن هنا ستجد كل ما تحتاجه لدراسة المنهج وتنظيم مذاكرتك خطوة بخطوة.',
      description: 'جميع المحاضرات والواجبات والامتحانات مخصصة بدقة لمنهجك الدراسي لتغطية كافة أفكار الامتحانات الوزارية ونواتج التعلم.',
      icon: GraduationCap,
      iconColor: 'text-[#1E4FD8]',
      iconBg: 'bg-blue-50 border-blue-200'
    },
    // Step 3: ماذا تقدم المنصة؟
    {
      id: 'offerings',
      tag: 'محتويات المنصة',
      title: 'ماذا تقدم لك منصة WiKi-PHYSICS؟',
      subtitle: 'منظومة تعليمية متكاملة مصممة خصيصًا لطلاب الثانوية العامة:',
      description: 'كل الأدوات التي تحتاجها تحت سقف واحد وبأعلى جودة تصوير وشرح.',
      icon: Layers,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200'
    },
    // Step 4: مدرسك
    {
      id: 'teacher',
      tag: 'معلم المادة',
      title: 'رحلتك التعليمية مع أستاذ أحمد صلاح',
      subtitle: 'مدرس مادة الفيزياء للثانوية العامة',
      description: 'خبرة طويلة في تبسيط المفاهيم الفيزيائية وتدريب الطلاب على أحدث أنماط الأسئلة الاستنتاجية والمسائل العليا للتفوق في الامتحان.',
      icon: Award,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200'
    },
    // Step 5: طريقة التعلم
    {
      id: 'roadmap',
      tag: 'خطة النجاح',
      title: 'طريقة التعلم خطوة بخطوة',
      subtitle: 'مسار دراسي واضح ومدروس للوصول إلى الدرجة النهائية (60/60):',
      description: 'التزامك بهذا التسلسل يضمن لك استيعاب كل مفهوم قبل الانتقال إلى التطبيق والتقييم.',
      icon: Compass,
      iconColor: 'text-[#1E4FD8]',
      iconBg: 'bg-blue-50 border-blue-200'
    },
    // Step 6: المتابعة
    {
      id: 'monitoring',
      tag: 'المتابعة الذكية',
      title: 'رحلتك التعليمية مش لوحدك',
      subtitle: 'نظام متابعة دقيق يساعدك على قياس تقدمك المستمر ومعرفة مستواك الحقيقي.',
      description: 'تحليلات تفاعلية توضح لك نقاط القوة والموضوعات التي تحتاج إلى مراجعة إضافية لتحسين أدائك.',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-200'
    },
    // Step 7: البداية
    {
      id: 'start',
      tag: 'جاهز للانطلاق',
      title: 'جاهز نبدأ؟',
      subtitle: 'رحلتك نحو القمة في الفيزياء تبدأ من هنا.',
      description: 'انتقل الآن إلى لوحة أدائك الشخصية لمتابعة كورساتك والبدء في أول درس.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200'
    }
  ];

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    StorageService.completeOnboarding(student.id);
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === 'ArrowRight') {
        handlePrev();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, isLastStep]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#0D1B3E]/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="رحلة الطالب التعريفية"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -16 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative"
      >
        {/* Top Header Bar with Step Badge & Skip Button */}
        <div className="flex items-center justify-between px-5 sm:px-8 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1E4FD8] border border-blue-200">
              <Compass className="h-3.5 w-3.5" />
              <span>{steps[currentStep].tag}</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {currentStep + 1} من {totalSteps}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="تخطي الرحلة والانتقال مباشرة إلى لوحة التحكم"
          >
            تخطي
          </button>
        </div>

        {/* Dynamic Step Progress Line */}
        <div className="w-full h-1 bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#1E4FD8] to-[#F5B301]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Step Body */}
        <div className="p-5 sm:p-8 min-h-[360px] sm:min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Scene 1: الترحيب */}
              {currentStep === 0 && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm text-amber-500">
                    <Sparkles className="h-8 w-8 text-[#F5B301]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight">
                      {steps[0].title}
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-[#1E4FD8]">
                      {steps[0].subtitle}
                    </p>
                    <p className="text-sm text-[#6B7280] max-w-lg mx-auto leading-relaxed pt-1">
                      {steps[0].description}
                    </p>
                  </div>
                </div>
              )}

              {/* Scene 2: أنت طالب في ماذا؟ */}
              {currentStep === 1 && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border-2 border-blue-200 shadow-sm text-[#1E4FD8]">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight">
                      {steps[1].title}
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-[#1E4FD8]">
                      {steps[1].subtitle}
                    </p>
                    <p className="text-sm text-[#6B7280] max-w-lg mx-auto leading-relaxed pt-1">
                      {steps[1].description}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F5F7FA] border border-slate-200 px-4 py-2 text-xs font-bold text-[#0D1B3E]">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>تم تخصيص الحساب والمحتوى الدراسي وفق مرحلتك التعليمية</span>
                  </div>
                </div>
              )}

              {/* Scene 3: ماذا تقدم المنصة؟ */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">
                      {steps[2].title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B7280]">
                      {steps[2].subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1E4FD8]">
                        <PlayCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B3E]">الدروس والشروحات</h4>
                        <p className="text-[11px] text-[#6B7280]">فيديوهات مصورة بجودة عالية وتطبيقات مباشرة</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B3E]">الكورسات المنهجية</h4>
                        <p className="text-[11px] text-[#6B7280]">مناهج مقسمة لوحدات وفصول دراسية منظمة</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B3E]">بنك الأسئلة والتدريبات</h4>
                        <p className="text-[11px] text-[#6B7280]">تمارين متدرجة تغطي كل فكرة فيزيائية</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B3E]">الامتحانات الدورية</h4>
                        <p className="text-[11px] text-[#6B7280]">اختبارات بوقت محدد وتقييم فوري وتصحيح نموذجي</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B3E]">المذكرات والملازم</h4>
                        <p className="text-[11px] text-[#6B7280]">ملخصات وقوانين PDF جاهزة للمذاكرة والتحميل</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B3E]">متابعة الأداء والتقدم</h4>
                        <p className="text-[11px] text-[#6B7280]">رسوم بيانية وإحصائيات دقيقة لمستواك في الفيزياء</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 4: مدرسك */}
              {currentStep === 3 && (
                <div className="space-y-4 py-2">
                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-l from-blue-50/70 via-white to-amber-50/40 p-5 rounded-3xl border border-blue-100">
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#1E4FD8]/20 shrink-0 shadow-sm">
                      <img
                        src={teacherPhoto}
                        alt="أستاذ أحمد صلاح"
                        className="h-full w-full object-cover object-top"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-[#0D1B3E]/85 backdrop-blur-xs py-0.5 text-center text-[9px] font-bold text-white">
                        مدرس المادة
                      </div>
                    </div>

                    <div className="space-y-2 text-center sm:text-right">
                      <span className="inline-block text-xs font-bold text-[#1E4FD8] bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                        رحلتك التعليمية مع:
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">
                        أستاذ أحمد صلاح
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-[#4B5563]">
                        مدرس مادة الفيزياء للثانوية العامة
                      </p>
                      <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                        شروحات مبسطة قائمة على الفهم العميق للظواهر الفيزيائية، وتدريب مستمر على حل الأسئلة الصعبة والتطبيقات العملية لضمان تفوقك الكامل في امتحان الثانوية العامة.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 5: طريقة التعلم */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">
                      {steps[4].title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B7280]">
                      {steps[4].subtitle}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {[
                      { step: 1, title: 'شاهد الدرس', desc: 'استمع لشرح المفاهيم الفيزيائية وتطبيقاتها بهدوء وتركيز' },
                      { step: 2, title: 'حل الأسئلة والتدريبات', desc: 'طبق فورًا بعد الدرس لتثبيت القوانين والأفكار' },
                      { step: 3, title: 'اختبر نفسك', desc: 'ادخل الامتحانات الدورية المقررة لقياس مدى استيعابك' },
                      { step: 4, title: 'اعرف نتيجتك ونموذج الإجابة', desc: 'افهم أخطاءك وتعلم الطريقة النموذجية للحل' },
                      { step: 5, title: 'تابع تطور مستواك في لوحة أدائي', desc: 'شاهد تحسن درجاتك ورسومك البيانية أولاً بأول' }
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F5F7FA] border border-slate-100">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1E4FD8] text-white text-xs font-mono font-bold">
                          {item.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-[#0D1B3E] block">{item.title}</span>
                          <span className="text-[11px] text-[#6B7280] truncate block">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene 6: المتابعة */}
              {currentStep === 5 && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 border-2 border-purple-200 shadow-sm text-purple-600">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight">
                      {steps[5].title}
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-[#1E4FD8]">
                      {steps[5].subtitle}
                    </p>
                    <p className="text-sm text-[#6B7280] max-w-lg mx-auto leading-relaxed pt-1">
                      {steps[5].description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 max-w-md mx-auto">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800 block">نقاط القوة</span>
                      <span className="text-[11px] text-emerald-600">الوحدات التي أتقنتها بتفوق</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-xs font-bold text-amber-800 block">يحتاج إلى مراجعة</span>
                      <span className="text-[11px] text-amber-600">ملاحظات وتوجيهات للتحسين</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 7: البداية */}
              {currentStep === 6 && (
                <div className="space-y-5 text-center py-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 border-2 border-emerald-200 shadow-md text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-4xl font-black text-[#0D1B3E] tracking-tight">
                      {steps[6].title}
                    </h2>
                    <p className="text-base sm:text-xl font-bold text-[#1E4FD8]">
                      {steps[6].subtitle}
                    </p>
                    <p className="text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed pt-1">
                      {steps[6].description}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-5 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs'
            }`}
          >
            <ArrowRight className="h-4 w-4" />
            <span>السابق</span>
          </button>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-[#1E4FD8]'
                    : idx < currentStep
                    ? 'w-2 bg-[#1E4FD8]/40'
                    : 'w-2 bg-slate-300'
                }`}
                title={`انتقل إلى الخطوة ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next or Finish Button */}
          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white transition-all cursor-pointer shadow-sm ${
              isLastStep
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 ring-2 ring-emerald-400/40'
                : 'bg-[#1E4FD8] hover:bg-[#163cb5]'
            }`}
          >
            <span>{isLastStep ? 'ابدأ رحلتي' : 'التالي'}</span>
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
