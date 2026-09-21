import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Key, Sparkles, Filter, PlayCircle, ShieldCheck, Wallet, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Course, Student, GradeLevel } from '../types';
import { CourseRatingBadge } from './CourseRatingBadge';
import { ScrollReveal } from './ScrollReveal';
import { doGradesMatch, normalizeGrade, getGradeDisplayLabel } from '../utils/gradeHelper';

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
  const [msg, setMsg] = useState<string | null>(null);

  const isAdmin = StorageService.isAdminLoggedIn();
  const studentGrade = student?.grade ? normalizeGrade(student.grade) : null;
  const isStudentLocked = Boolean(student && !isAdmin);

  const handleQuickWalletPurchase = (course: Course) => {
    if (!student) {
      onOpenAuthModal();
      return;
    }
    const res = StorageService.purchaseCourseWithWalletBalance(student.id, course.id);
    if (res.success) {
      setMsg(res.message);
      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (_) {}
      setTimeout(() => setMsg(null), 5000);
    } else {
      alert(res.message);
    }
  };

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
    { id: GradeLevel.GRADE_12, label: '3 ثانوي (ثانوية عامة)' },
    { id: GradeLevel.GRADE_11, label: '2 ثانوي' },
    { id: GradeLevel.GRADE_10, label: '1 ثانوي' }
  ];

  const filteredCourses = courses.filter(c => {
    if (c.isPublished === false) return false;

    // If logged in as student (non-admin), lock strictly to student's registered grade
    if (isStudentLocked) {
      if (!studentGrade) return false;
      return doGradesMatch(c.grade, studentGrade);
    }

    // Visitors or Admin can use the grade selector
    if (selectedGrade !== 'all') {
      return doGradesMatch(c.grade, selectedGrade);
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        {msg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs sm:text-sm animate-in fade-in">
            {msg}
          </div>
        )}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#1E4FD8]">
          <Sparkles className="h-3.5 w-3.5 text-[#F5B301]" />
          <span>منهج الفيزياء للعام الدراسي 2024 / 2025</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0D1B3E] leading-tight">
          {isStudentLocked && studentGrade
            ? `كورسات ${getGradeDisplayLabel(studentGrade)} - أستاذ أحمد صلاح`
            : 'كورسات مادة الفيزياء للثانوية العامة مع أستاذ أحمد صلاح'}
        </h1>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          {isStudentLocked && studentGrade
            ? 'شرح تفصيلي مع أقوى بنك أسئلة وتطبيقات ومراجعات دورية مخصصة لصفك الدراسي المسجل.'
            : 'شرح تفصيلي مع أقوى بنك أسئلة وتطبيقات ومراجعات دورية. اختر كورس مرحلتك وابدأ المذاكرة فوراً عبر كود التفعيل.'}
        </p>
      </div>

      {/* Grade Filters / Student Grade Lock Indicator */}
      {isStudentLocked ? (
        <div className="flex flex-col items-center justify-center gap-2">
          {studentGrade ? (
            <div className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-50 border border-blue-200 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#1E4FD8] shadow-xs">
              <GraduationCap className="h-4 w-4 text-[#1E4FD8]" />
              <span>المرحلة الدراسية المسجلة بحسابك: {getGradeDisplayLabel(studentGrade)}</span>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center max-w-md mx-auto space-y-1.5">
              <p className="text-xs font-bold text-amber-800">
                لم يتم تحديد صفك الدراسي في بيانات الحساب
              </p>
              <p className="text-[11px] text-amber-700">
                يرجى تحديث بيانات حسابك لتحديد المرحلة الدراسية لعرض الكورسات المخصصة لك.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {isAdmin && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3.5 py-1 text-xs font-bold text-purple-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>وضع الإدارة: عرض جميع المراحل والكورسات متاح بدون تقييد</span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  selectedGrade === g.id
                    ? 'bg-[#1E4FD8] text-white shadow-md shadow-blue-500/20 scale-105'
                    : 'border border-slate-200 bg-white text-[#0D1B3E] hover:border-blue-300 hover:text-[#1E4FD8]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Courses Cards */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#1E4FD8]">
            {isStudentLocked && !studentGrade ? (
              <GraduationCap className="h-8 w-8" />
            ) : (
              <BookOpen className="h-8 w-8" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#0D1B3E]">
              {isStudentLocked && !studentGrade
                ? 'يرجى تحديد صفك الدراسي في الحساب'
                : isStudentLocked && studentGrade
                  ? `لا توجد كورسات متاحة حالياً لـ ${getGradeDisplayLabel(studentGrade)}`
                  : 'لا توجد كورسات مضافة حالياً'}
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {isStudentLocked && !studentGrade
                ? 'لتتمكن من استعراض الكورسات المناسبة لصفك، يرجى تحديث بيانات صفك الدراسي في ملفك الشخصي.'
                : isStudentLocked && studentGrade
                  ? 'يقوم المعلم حالياً بإعداد وتجهيز محاضرات المنهج لصفك الدراسي. ترقبوا رفع المحتوى قريباً!'
                  : 'يقوم المعلم حالياً بإعداد وتجهيز محاضرات المنهج. ترقبوا رفع المحتوى الجديد قريباً!'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, idx) => {
            const isEnrolled = student?.enrolledCourseIds?.includes(course.id);
            let totalLessons = 0;
            course.units?.forEach(u => {
              totalLessons += u.lessons?.length || 0;
            });

            return (
              <ScrollReveal key={course.id} index={idx} className="h-full">
                <div
                  className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Thumbnail */}
                    <div 
                      className="relative aspect-video w-full overflow-hidden bg-slate-100"
                      style={{ aspectRatio: '16 / 9' }}
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={360}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-2.5 right-2.5 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#1E4FD8] border border-blue-200 shadow-xs z-10">
                        {course.grade}
                      </div>

                      {/* Edge Rating Badge on Corner/Side of Screen Image */}
                      <CourseRatingBadge 
                        rating={course.rating} 
                        ratingCount={course.ratingCount} 
                        position="top-left" 
                      />

                      {isEnrolled && (
                        <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-black flex items-center gap-1 shadow-sm z-10">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>مشترك بالفعل</span>
                        </div>
                      )}

                      <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-[#0D1B3E]/85 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white z-10">
                        {course.units?.length || 0} فصول • {totalLessons} درس
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-[#0D1B3E] text-base leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-slate-100">
                        <span>المحاضر: {course.instructorName}</span>
                        <span className="text-[#1E4FD8] font-black text-sm">{course.price} ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-5 pt-0 space-y-2">
                    {isEnrolled ? (
                      <button
                        onClick={() => onNavigate('course-details', { courseId: course.id })}
                        className="w-full rounded-2xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>دخول الكورس (مشترك)</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <button
                          onClick={() => handleQuickWalletPurchase(course)}
                          className="flex-1 w-full rounded-xl bg-[#F5B301] py-2.5 px-3 text-xs font-black text-[#0D1B3E] shadow-sm hover:bg-[#e0a401] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="خصم فوري وتفعيل تلقائي من المحفظة"
                        >
                          <Wallet className="h-4 w-4 shrink-0" />
                          <span>شراء بالمحفظة ({course.price} ج.م)</span>
                        </button>

                        <button
                          onClick={student ? onOpenActivationModal : onOpenAuthModal}
                          className="flex-1 w-full rounded-xl border-2 border-[#1E4FD8] bg-white py-2.5 px-3 text-xs font-bold text-[#1E4FD8] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Key className="h-3.5 w-3.5 shrink-0" />
                          <span>كود الاشتراك</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => onNavigate('course-details', { courseId: course.id })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] py-2 text-[11px] font-bold text-[#6B7280] hover:text-[#1E4FD8] hover:border-blue-200 transition-colors"
                    >
                      استعراض المنهج والتفاصيل الكاملة
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

    </div>
  );
};
