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
      <div className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-black text-purple-300">
              <Brain className="h-4 w-4 text-purple-400" />
              <span>نظام تشخيص نقاط الضعف والعلاج الذكي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              تقرير الكفاءة وتشخيص الأخطاء في مادة الفيزياء
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              يقوم هذا النظام الذكي بتحليل جميع إجاباتك في الامتحانات والواجبات، ويكتشف المفاهيم والقوانين التي تكرر فيها خطؤك، ليوجهك مباشرة إلى الدرس المحدد وخطة التدريب لعلاجها قبل الامتحان النهائي.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center">
              <span className="text-[11px] font-bold text-slate-400">النقاط التي تحتاج تركيز</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{activeWeaknesses.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center">
              <span className="text-[11px] font-bold text-slate-400">النقاط المعالجة والمتقنة</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{resolvedWeaknesses.length}</p>
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
              <Target className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-black text-white">المفاهيم الفيزيائية المطلوب مراجعتها</h2>
            </div>
            <span className="text-xs text-slate-400 font-bold">مرتبة حسب الأولوية</span>
          </div>

          {activeWeaknesses.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-white">أداء فيزيائي فائق التميز! 🎉</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                لا توجد نقاط ضعف مسجلة حاليًا. استمر في حل الامتحانات والتحديات الأسبوعية للحفاظ على مستواك العالي!
              </p>
              <button
                onClick={() => onNavigate('courses')}
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                تصفح الكورسات والامتحانات
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeWeaknesses.map((wp) => (
                <div
                  key={wp.id}
                  className="rounded-3xl border border-rose-500/20 bg-slate-900/80 p-5 sm:p-6 space-y-4 shadow-xl hover:border-rose-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-[10px] font-black text-rose-300">
                          {wp.chapterOrUnit}
                        </span>
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] text-slate-400 font-bold">
                          تكرار الخطأ: {wp.frequency} مرة
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white pt-1">{wp.conceptName}</h3>
                    </div>

                    <button
                      onClick={() => handleMarkResolved(wp.id)}
                      className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      تمت المراجعة والفهم ✓
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>سبب الخطأ المسجل:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono">{wp.errorReason}</p>
                  </div>

                  {/* Suggested Action Plan */}
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>خطة العلاج المقترحة:</span>
                    </div>
                    <p className="text-xs text-purple-200/90 leading-relaxed">{wp.suggestedAction}</p>

                    {wp.suggestedLessonTitle && (
                      <div className="pt-2 flex items-center justify-between border-t border-purple-500/20">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <BookOpen className="h-4 w-4 text-amber-400" />
                          <span>الدرس ذو الصلة: <b className="text-white">{wp.suggestedLessonTitle}</b></span>
                        </div>
                        <button
                          onClick={() => onNavigate('courses')}
                          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                        >
                          <span>مشاهدة الشرح</span>
                          <Play className="h-3 w-3 fill-slate-950" />
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
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>المفاهيم التي تم إتقانها ومعالجتها بنجاح ({resolvedWeaknesses.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resolvedWeaknesses.map((rw) => (
                  <div key={rw.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-white">{rw.conceptName}</h4>
                      <span className="text-[10px] text-emerald-300">{rw.chapterOrUnit}</span>
                    </div>
                    <button
                      onClick={() => handleMarkResolved(rw.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-400"
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
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">استشر المساعد الذكي</h3>
                <p className="text-[11px] text-slate-400">اشرح لي المسألة بالقوانين</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              إذا واجهتك صعوبة في فهم أي مفهوم أعلاه، يمكنك التحدث مباشرة مع المساعد الفيزيائي وسيقوم بتبسيط القانون وحل أمثلة عليه.
            </p>
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
            >
              فتح المساعد الفيزيائي الذكي
            </button>
          </div>

          {/* Golden Rules for Physics Exam */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>نصائح ذهبية لمعالجة أخطاء الفيزياء</span>
            </h3>
            <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><b>الرسم البياني:</b> دائمًا احسب الميل الرياضي والميل الفيزيائي قبل البدء في حل السؤال.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><b>الوحدات والتحويلات:</b> تأكد من تحويل السنتيمتر (cm) والميكرو (μ) إلى الوحدات الدولية.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><b>قاعدة اليد اليمنى:</b> حدد اتجاه التيار والمجال والقوة بدقة متناهية دون استعجال.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
