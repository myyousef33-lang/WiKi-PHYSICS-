import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  HelpCircle, 
  Sparkles, 
  ArrowRight,
  Clock,
  BookOpen,
  Check,
  ListOrdered
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Course, Lesson, Student, QuizExam } from '../types';

interface LessonRoomViewProps {
  courseId: string;
  lessonId: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenPdfModal?: (pdfUrl: string, title: string) => void;
}

export const LessonRoomView: React.FC<LessonRoomViewProps> = ({
  courseId,
  lessonId,
  onNavigate,
  onOpenPdfModal
}) => {
  const [course, setCourse] = useState<Course | undefined>(StorageService.getCourseById(courseId));
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [currentLesson, setCurrentLesson] = useState<Lesson | undefined>();
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [exams, setExams] = useState<QuizExam[]>(StorageService.getExams());

  useEffect(() => {
    const update = () => {
      const c = StorageService.getCourseById(courseId);
      const s = StorageService.getCurrentStudent();
      setCourse(c);
      setStudent(s);
      setExams(StorageService.getExams());

      if (c) {
        const flatLessons: Lesson[] = [];
        c.units?.forEach(u => u.lessons?.forEach(l => flatLessons.push(l)));
        setAllLessons(flatLessons);

        const targetLesson = flatLessons.find(l => l.id === lessonId) || flatLessons[0];
        setCurrentLesson(targetLesson);

        if (s && targetLesson) {
          const prog = StorageService.getLessonProgress(s.id, targetLesson.id);
          setIsCompleted(!!prog?.isCompleted);
          StorageService.setLastViewedLesson(s.id, c.id, targetLesson.id);
        }
      }
    };
    update();
    return subscribeToStorage(update);
  }, [courseId, lessonId]);

  if (!course || !currentLesson) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-white">
        <h2 className="text-xl font-bold">لم يتم العثور على الدرس</h2>
        <button
          onClick={() => onNavigate('my-courses')}
          className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
        >
          العودة لكورساتي
        </button>
      </div>
    );
  }

  // Find previous and next lessons
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Toggle completion
  const handleToggleComplete = () => {
    if (!student) return;
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    StorageService.markLessonComplete(student.id, course.id, currentLesson.id, newStatus);
  };

  // Associated Lesson Quiz
  const lessonQuiz = exams.find(e => e.id === currentLesson.quizId || (e.lessonId === currentLesson.id && e.type === 'quiz'));

  // Video embed helper
  const getEmbedUrl = (url: string, type: string) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    }
    return url;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400 truncate">
          <button 
            onClick={() => onNavigate('course-details', { courseId: course.id })}
            className="flex items-center gap-1 hover:text-amber-400 font-bold"
          >
            <ArrowRight className="h-4 w-4" />
            <span>{course.title}</span>
          </button>
          <span>/</span>
          <span className="text-white font-bold truncate">{currentLesson.title}</span>
        </div>

        <button
          onClick={() => onNavigate('course-details', { courseId: course.id })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 hover:text-white shrink-0"
        >
          فهرس المنهج
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Main Content: Video Player & Lesson Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Responsive Video Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            {currentLesson.videoType === 'uploaded' || currentLesson.videoUrl.endsWith('.mp4') ? (
              <video
                src={currentLesson.videoUrl}
                controls
                className="h-full w-full object-contain"
                poster={course.thumbnail}
              >
                متصفحك لا يدعم تشغيل الفيديو المباشر.
              </video>
            ) : (
              <iframe
                src={getEmbedUrl(currentLesson.videoUrl, currentLesson.videoType)}
                title={currentLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}
          </div>

          {/* Action Bar (Complete Lesson & Previous / Next Buttons) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Mark as Complete Toggle */}
            <button
              onClick={handleToggleComplete}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-xs font-bold transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-amber-500 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${isCompleted ? 'fill-slate-950 text-emerald-500' : 'text-amber-400'}`} />
              <span>{isCompleted ? '✓ تم إكمال الدرس بنجاح' : 'تحديد الدرس كـ (مكتمل)'}</span>
            </button>

            {/* Next / Previous Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={!prevLesson}
                onClick={() => prevLesson && onNavigate('lesson-player', { courseId: course.id, lessonId: prevLesson.id })}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold transition-colors ${
                  prevLesson ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900/40 text-slate-400 border-slate-850 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
                <span>الدرس السابق</span>
              </button>

              <button
                disabled={!nextLesson}
                onClick={() => nextLesson && onNavigate('lesson-player', { courseId: course.id, lessonId: nextLesson.id })}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors ${
                  nextLesson 
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-slate-950' 
                    : 'border-slate-850 bg-slate-900/40 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>الدرس التالي</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Lesson Info & Description */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-amber-400 font-bold">{course.instructorName} • {course.grade}</span>
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentLesson.title}</h1>
            </div>

            {currentLesson.description && (
              <p className="text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                {currentLesson.description}
              </p>
            )}

            {currentLesson.homeworkNotes && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
                <span className="text-xs font-bold text-amber-400">📌 تنبيهات وملاحظات الواجب:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{currentLesson.homeworkNotes}</p>
              </div>
            )}
          </div>

          {/* Attachments & PDF Materials */}
          {currentLesson.pdfUrl && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{currentLesson.pdfTitle || 'مذكرة شرح وتمارين الدرس.pdf'}</h4>
                  <p className="text-xs text-slate-400">ملف PDF مرفق متضمن الملاحظات والمسائل المحلولة</p>
                </div>
              </div>

              <a
                href={currentLesson.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors self-end sm:self-auto"
              >
                <Download className="h-4 w-4 text-amber-400" />
                <span>فتح المذكرة</span>
              </a>
            </div>
          )}

          {/* Lesson Quiz Card if present */}
          {lessonQuiz && (
            <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-slate-900 to-purple-950/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-purple-500/20 p-3 text-purple-400">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">كويز تقييم الفهم</span>
                  <h3 className="font-bold text-base text-white">{lessonQuiz.title}</h3>
                  <p className="text-xs text-slate-300">
                    المدة: {lessonQuiz.durationMinutes} دقيقة • {lessonQuiz.questions?.length || 0} أسئلة اختيار من متعدد
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('exam-runner', { examId: lessonQuiz.id, courseId: course.id, lessonId: currentLesson.id })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-500 transition-colors"
              >
                <PlayCircle className="h-4 w-4" />
                <span>بدء الكويز الآن</span>
              </button>
            </div>
          )}

        </div>

        {/* Sidebar: Course Curriculum Playlist */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">دروس الكورس</h3>
              </div>
              <span className="text-xs text-slate-400 font-bold">{allLessons.length} درس</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {course.units?.map((unit, uIdx) => (
                <div key={unit.id} className="space-y-1.5">
                  <p className="text-[11px] font-bold text-amber-400/90 px-2 py-1 bg-slate-950/60 rounded-lg">
                    {unit.title}
                  </p>
                  
                  <div className="space-y-1">
                    {unit.lessons?.map((l) => {
                      const isCurrent = l.id === currentLesson.id;
                      const completed = student ? StorageService.getLessonProgress(student.id, l.id)?.isCompleted : false;

                      return (
                        <button
                          key={l.id}
                          onClick={() => onNavigate('lesson-player', { courseId: course.id, lessonId: l.id })}
                          className={`w-full text-right flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-all ${
                            isCurrent
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-4 w-4 text-amber-400 animate-pulse" />
                            ) : (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
                                {l.order}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="line-clamp-2 leading-snug">{l.title}</p>
                            <span className="text-[10px] text-slate-400">{l.durationMinutes || 45} دقيقة</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
