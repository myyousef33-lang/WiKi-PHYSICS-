import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, Key, Calendar, CheckCircle2, ChevronLeft, Search, Filter } from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student, Course, Lesson } from '../types';
import { CourseRatingBadge } from './CourseRatingBadge';

interface MyCoursesViewProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
}

export const MyCoursesView: React.FC<MyCoursesViewProps> = ({
  onNavigate,
  onOpenActivationModal
}) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const update = () => {
      const current = StorageService.getCurrentStudent();
      setStudent(current);
      if (current) {
        const allCourses = StorageService.getCourses();
        const enrolled = allCourses.filter(c => current.enrolledCourseIds?.includes(c.id));
        setCourses(enrolled);
      }
    };
    update();
    return subscribeToStorage(update);
  }, []);

  if (!student) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <BookOpen className="mx-auto h-12 w-12 text-amber-400 opacity-80" />
          <h2 className="mt-4 text-xl font-bold text-white">يرجى تسجيل الدخول أولاً</h2>
          <p className="mt-2 text-xs text-slate-400">سجل الدخول لعرض قائمة الكورسات التي تشترك بها ومتابعة دراستك</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter(course => {
    const { percentage } = StorageService.calculateCourseProgress(student.id, course.id);
    if (filter === 'in_progress' && percentage >= 100) return false;
    if (filter === 'completed' && percentage < 100) return false;
    if (searchQuery.trim() && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">كورساتي المشترك بها</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">تابع إنجازك في كل كورس واستكمل دروسك ومراجعاتك من حيث توقفت</p>
        </div>

        <button
          onClick={onOpenActivationModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:scale-105 transition-transform self-start sm:self-auto"
        >
          <Key className="h-4 w-4" />
          <span>تفعيل كود جديد</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({courses.length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'in_progress' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            قيد التعلم
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'completed' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            المكتملة
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في كورساتي..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pr-10 pl-4 text-xs text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
          <BookOpen className="mx-auto h-16 w-16 text-slate-400 opacity-40" />
          <h3 className="text-lg font-bold text-white">لا توجد كورسات مفعلة لديك حالياً</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            يمكنك تفعيل كود الاشتراك المرسل لك، أو تصفح قائمة الكورسات المتاحة على المنصة.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onOpenActivationModal}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950"
            >
              تفعيل كود الكورس
            </button>
            <button
              onClick={() => onNavigate('courses-catalog')}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
            >
              استعراض الكورسات
            </button>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center text-xs text-slate-400">
          لا توجد نتائج تطابق بحثك أو الفلتر المحدد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const { totalLessons, completedLessons, percentage } = StorageService.calculateCourseProgress(student.id, course.id);
            const expiry = student.courseExpiryDates?.[course.id];

            // Resolve last viewed or resume lesson
            let resumeLessonId = course.units?.[0]?.lessons?.[0]?.id;
            let resumeLessonTitle = course.units?.[0]?.lessons?.[0]?.title;
            const studentProg = StorageService.getStudentProgressList(student.id);
            const completedIds = new Set(studentProg.filter(p => p.isCompleted).map(p => p.lessonId));
            
            course.units?.forEach(u => {
              u.lessons?.forEach(l => {
                if (!completedIds.has(l.id) && resumeLessonId === course.units?.[0]?.lessons?.[0]?.id) {
                  resumeLessonId = l.id;
                  resumeLessonTitle = l.title;
                }
              });
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
                    <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20 z-10">
                      {course.grade.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}
                    </div>

                    {percentage >= 100 && (
                      <div className="absolute top-2.5 left-2.5 rounded-lg bg-emerald-500/90 text-slate-950 px-2 py-0.5 text-[10px] font-black flex items-center gap-1 z-10 shadow-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>مكتمل 100%</span>
                      </div>
                    )}

                    {/* Edge Rating Badge on Corner/Side of Screen Image */}
                    <CourseRatingBadge 
                      rating={course.rating} 
                      ratingCount={course.ratingCount} 
                      size="sm" 
                      position="bottom-left" 
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>المحاضر: {course.instructorName}</span>
                      <span>{totalLessons} درس</span>
                    </div>

                    {/* Expiration Date if present */}
                    {expiry && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>صلاحية الكورس حتى: {new Date(expiry).toLocaleDateString('ar-EG')}</span>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">الدروس المكتملة: {completedLessons}/{totalLessons}</span>
                        <span className="text-amber-400">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {resumeLessonTitle && (
                      <p className="text-[11px] text-slate-400 truncate pt-1">
                        الدرس القادم: <span className="text-slate-300 font-medium">{resumeLessonTitle}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('course-details', { courseId: course.id })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                  >
                    عرض المنهج
                  </button>
                  <button
                    onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: resumeLessonId })}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors"
                  >
                    استكمال التعلم
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
