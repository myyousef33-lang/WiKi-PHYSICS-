import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Play, 
  RotateCcw,
  Zap,
  TrendingDown,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { StudentWeaknessProfile, WeaknessPoint, Course } from '../types';

interface WeaknessAnalysisViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const WeaknessAnalysisView: React.FC<WeaknessAnalysisViewProps> = ({ onNavigate }) => {
  const student = StorageService.getCurrentStudent();
  const studentId = student?.id || '';
  const [profile, setProfile] = useState<StudentWeaknessProfile>(StorageService.getStudentWeaknessProfile(studentId));
  const [courses, setCourses] = useState<Course[]>(StorageService.getCourses());

  useEffect(() => {
    if (studentId) {
      setProfile(StorageService.getStudentWeaknessProfile(studentId));
      setCourses(StorageService.getCourses());
    }
  }, [studentId]);

  const handleMarkResolved = (wpId: string) => {
    const updatedPoints = profile.weakPoints.map(wp => {
      if (wp.id === wpId) {
        return { ...wp, isResolved: !wp.isResolved };
      }
      return wp;
    });
    const updated = { ...profile, weakPoints: updatedPoints, updatedAt: new Date().toISOString() };
    setProfile(updated);
    StorageService.saveStudentWeaknessProfile(updated);
  };

  const activeWeaknesses = profile.weakPoints.filter(wp => !wp.isResolved);
  const resolvedWeaknesses = profile.weakPoints.filter(wp => wp.isResolved);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-black text-purple-700">
              <Brain className="h-4 w-4 text-purple-600" />
              <span>نظام تشخيص نقاط الضعف والعلاج الذكي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E]">
              تقرير الكفاءة وتشخيص الأخطاء في مادة الفيزياء
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl leading-relaxed">
              يقوم هذا النظام الذكي بتحليل جميع إجاباتك في الامتحانات والواجبات، ويكتشف المفاهيم والقوانين التي تكرر فيها خطؤك، ليوجهك مباشرة إلى الدرس المحدد وخطة التدريب لعلاجها قبل الامتحان النهائي.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
              <span className="text-[11px] font-bold text-rose-800">النقاط التي تحتاج تركيز</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{activeWeaknesses.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <span className="text-[11px] font-bold text-emerald-800">النقاط المعالجة والمتقنة</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedWeaknesses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Weak Points & Action Plans (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-black text-[#0D1B3E]">المفاهيم الفيزيائية المطلوب مراجعتها</h2>
            </div>
            <span className="text-xs text-[#6B7280] font-bold">مرتبة حسب الأولوية</span>
          </div>

          {activeWeaknesses.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-[#0D1B3E]">أداء فيزيائي فائق التميز!</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                لا توجد نقاط ضعف مسجلة حاليًا. استمر في حل الامتحانات والتحديات الأسبوعية للحفاظ على مستواك العالي!
              </p>
              <button
                onClick={() => onNavigate('courses-catalog')}
                className="rounded-xl bg-[#F5B301] px-6 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-colors shadow-xs"
              >
                تصفح الكورسات والامتحانات
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeWeaknesses.map((wp) => (
                <div
                  key={wp.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs hover:border-rose-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-0.5 text-[10px] font-black text-rose-700">
                          {wp.chapterOrUnit}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-[#6B7280] font-bold">
                          تكرار الخطأ: {wp.frequency} مرة
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[#0D1B3E] pt-1">{wp.conceptName}</h3>
                    </div>

                    <button
                      onClick={() => handleMarkResolved(wp.id)}
                      className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                      تمت المراجعة والفهم
                    </button>
                  </div>

                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-[#0D1B3E] space-y-2">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>سبب الخطأ المسجل:</span>
                    </div>
                    <p className="text-[#0D1B3E] leading-relaxed font-mono">{wp.errorReason}</p>
                  </div>

                  {/* Suggested Action Plan */}
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span>خطة العلاج المقترحة:</span>
                    </div>
                    <p className="text-xs text-purple-900 leading-relaxed">{wp.suggestedAction}</p>

                    {wp.suggestedLessonTitle && (
                      <div className="pt-2 flex items-center justify-between border-t border-purple-200">
                        <div className="flex items-center gap-2 text-xs text-[#0D1B3E]">
                          <BookOpen className="h-4 w-4 text-amber-500" />
                          <span>الدرس ذو الصلة: <b className="text-[#0D1B3E]">{wp.suggestedLessonTitle}</b></span>
                        </div>
                        <button
                          onClick={() => onNavigate('courses-catalog')}
                          className="flex items-center gap-1 rounded-lg bg-[#F5B301] px-3 py-1 text-[11px] font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-colors"
                        >
                          <span>مشاهدة الشرح</span>
                          <Play className="h-3 w-3 fill-[#0D1B3E]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolved Section */}
          {resolvedWeaknesses.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>المفاهيم التي تم إتقانها ومعالجتها بنجاح ({resolvedWeaknesses.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resolvedWeaknesses.map((rw) => (
                  <div key={rw.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-[#0D1B3E]">{rw.conceptName}</h4>
                      <span className="text-[10px] text-emerald-700">{rw.chapterOrUnit}</span>
                    </div>
                    <button
                      onClick={() => handleMarkResolved(rw.id)}
                      className="text-[11px] text-[#6B7280] hover:text-rose-600 font-bold"
                    >
                      إعادة لغير متقن
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Tutor & Exam Strategy Tips (1 col) */}
        <div className="space-y-6">
          {/* Ask AI Physics Card */}
          <div className="rounded-3xl border border-purple-100 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0D1B3E]">استشر المساعد الذكي</h3>
                <p className="text-[11px] text-[#6B7280]">اشرح لي المسألة بالقوانين</p>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              إذا واجهتك صعوبة في فهم أي مفهوم أعلاه، يمكنك التحدث مباشرة مع المساعد الفيزيائي وسيقوم بتبسيط القانون وحل أمثلة عليه.
            </p>
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-xs"
            >
              فتح المساعد الفيزيائي الذكي
            </button>
          </div>

          {/* Golden Rules for Physics Exam */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-[#0D1B3E] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#1E4FD8]" />
              <span>نصائح ذهبية لمعالجة أخطاء الفيزياء</span>
            </h3>
            <ul className="text-xs text-[#6B7280] space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#1E4FD8] font-bold">•</span>
                <span><b className="text-[#0D1B3E]">الرسم البياني:</b> دائمًا احسب الميل الرياضي والميل الفيزيائي قبل البدء في حل السؤال.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1E4FD8] font-bold">•</span>
                <span><b className="text-[#0D1B3E]">الوحدات والتحويلات:</b> تأكد من تحويل السنتيمتر (cm) والميكرو (μ) إلى الوحدات الدولية.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1E4FD8] font-bold">•</span>
                <span><b className="text-[#0D1B3E]">قاعدة اليد اليمنى:</b> حدد اتجاه التيار والمجال والقوة بدقة متناهية دون استعجال.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
