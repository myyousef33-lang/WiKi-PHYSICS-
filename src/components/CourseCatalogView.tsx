import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Key, Sparkles, Filter, PlayCircle, ShieldCheck } from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Course, Student, GradeLevel } from '../types';

interface CourseCatalogViewProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenAuthModal: () => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({
  onNavigate,
  onOpenActivationModal,
  onOpenAuthModal
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  useEffect(() => {
    const update = () => {
      setCourses(StorageService.getCourses());
      setStudent(StorageService.getCurrentStudent());
    };
    update();
    return subscribeToStorage(update);
  }, []);

  const grades = [
    { id: 'all', label: 'جميع المراحل' },
    { id: 'الصف الثالث الثانوي (ثانوية عامة)', label: '3 ثانوي (ثانوية عامة)' },
    { id: 'الصف الثاني الثانوي', label: '2 ثانوي' },
    { id: 'الصف الأول الثانوي', label: '1 ثانوي' }
  ];

  const filteredCourses = courses.filter(c => {
    if (selectedGrade !== 'all' && c.grade !== selectedGrade) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>منهج الفيزياء للعام الدراسي 2024 / 2025</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          كورسات مادة الفيزياء للثانوية العامة
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          شرح تفصيلي مع أقوى بنك أسئلة وتطبيقات ومراجعات دورية. اختر كورس مرحلتك وابدأ المذاكرة فوراً عبر كود التفعيل.
        </p>
      </div>

      {/* Grade Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {grades.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGrade(g.id)}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              selectedGrade === g.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Courses Cards */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">لا توجد كورسات مضافة حالياً</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يقوم المعلم حالياً بإعداد وتجهيز محاضرات المنهج. ترقبوا رفع المحتوى الجديد قريباً!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map(course => {
            const isEnrolled = student?.enrolledCourseIds?.includes(course.id);
            let totalLessons = 0;
            course.units?.forEach(u => {
              totalLessons += u.lessons?.length || 0;
            });

            return (
              <div
                key={course.id}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                      {course.grade}
                    </div>
                    {isEnrolled && (
                      <div className="absolute top-2.5 left-2.5 rounded-lg bg-emerald-500 text-slate-950 px-2.5 py-1 text-[10px] font-black flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>مشترك بالفعل</span>
                      </div>
                    )}
                    <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-slate-300">
                      {course.units?.length || 0} فصول • {totalLessons} درس
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>المحاضر: {course.instructorName}</span>
                      <span className="text-amber-400 font-bold">{course.price} ج.م</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('course-details', { courseId: course.id })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                  >
                    استعراض المنهج
                  </button>
                  {isEnrolled ? (
                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                    >
                      دخول الكورس
                    </button>
                  ) : (
                    <button
                      onClick={student ? onOpenActivationModal : onOpenAuthModal}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors"
                    >
                      تفعيل بالكود
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
