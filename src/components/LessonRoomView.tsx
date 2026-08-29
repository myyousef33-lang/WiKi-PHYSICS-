import React, { useState, useEffect, useRef } from 'react';
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
  ListOrdered,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Gauge,
  Tv,
  ShieldCheck
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { MediaStore } from '../services/mediaStore';
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
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [videoQuality, setVideoQuality] = useState<'1080p' | '720p' | '480p' | 'auto'>('1080p');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

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

  // Resolve local-media IndexedDB blob or remote URL
  useEffect(() => {
    let active = true;
    const resolveUrl = async () => {
      if (!currentLesson?.videoUrl) {
        setResolvedVideoUrl('');
        return;
      }

      if (currentLesson.videoUrl.startsWith('local-media:')) {
        const blobUrl = await MediaStore.getMediaUrl(currentLesson.videoUrl);
        if (active) {
          setResolvedVideoUrl(blobUrl || currentLesson.videoUrl);
        }
      } else {
        if (active) {
          setResolvedVideoUrl(currentLesson.videoUrl);
        }
      }
    };

    resolveUrl();
    return () => {
      active = false;
    };
  }, [currentLesson?.videoUrl]);

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

  // Video embed & direct playback helper
  const isDirectVideo = (url: string, type?: string) => {
    if (!url) return false;
    if (
      type === 'uploaded' || 
      url.startsWith('/uploads/') || 
      url.startsWith('blob:') || 
      url.startsWith('data:video') || 
      url.startsWith('local-media:')
    ) {
      return true;
    }
    return /\.(mp4|webm|ogg|mov|mkv|m4v)(\?.*)?$/i.test(url);
  };

  const getEmbedUrl = (url: string, _type?: string, quality = '1080p') => {
    if (!url) return '';
    
    // YouTube with HD 1080p parameters & high resolution flags
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      if (videoId) {
        const qualityParam = quality === '1080p' ? 'hd1080' : quality === '720p' ? 'hd720' : 'medium';
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1&vq=${qualityParam}&playsinline=1`;
      }
    }

    // Google Drive
    if (url.includes('drive.google.com')) {
      const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?quality=1080p`;
      }
    }

    return url;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSkipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleToggleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(err => console.warn(err));
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn(err));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  return (
    <div className={`mx-auto ${isTheaterMode ? 'max-w-full px-2 sm:px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'} py-6 space-y-6 animate-in fade-in duration-300 transition-all`}>
      
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              isTheaterMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>{isTheaterMode ? 'الوضع العادي' : 'وضع المسرح (شاشة عريضة)'}</span>
          </button>

          <button
            onClick={() => onNavigate('course-details', { courseId: course.id })}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 hover:text-white shrink-0"
          >
            فهرس المنهج
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isTheaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8 items-start`}>
        
        {/* Main Content: Video Player & Lesson Details */}
        <div className={`${isTheaterMode ? 'w-full' : 'lg:col-span-2'} space-y-4`}>
          
          {/* Responsive Video Container with Fullscreen support */}
          <div 
            ref={videoContainerRef}
            className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl group flex items-center justify-center"
          >
            {isDirectVideo(currentLesson.videoUrl, currentLesson.videoType) ? (
              <video
                ref={videoRef}
                src={resolvedVideoUrl || currentLesson.videoUrl}
                controls
                playsInline
                preload="auto"
                className="h-full w-full object-contain bg-black"
                poster={course.thumbnail}
              >
                متصفحك لا يدعم تشغيل الفيديو المباشر.
              </video>
            ) : (
              <iframe
                src={getEmbedUrl(currentLesson.videoUrl, currentLesson.videoType, videoQuality)}
                title={currentLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}

            {/* Quality Badge */}
            <div className="absolute top-3 left-3 pointer-events-none rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 px-2.5 py-1 text-[11px] font-black text-amber-400 flex items-center gap-1.5 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full HD 1080p</span>
            </div>

            {/* Quick Fullscreen Floating Button (top right) */}
            <button
              onClick={handleToggleFullscreen}
              className="absolute top-3 right-3 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 p-2 text-slate-200 hover:text-amber-400 hover:bg-slate-900 transition-all opacity-80 hover:opacity-100 shadow-lg"
              title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Video Playback & Quality Controls Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Speed & Seek Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-amber-400" />
                <span>السرعة:</span>
              </span>
              {[1, 1.25, 1.5, 1.75, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`rounded-lg px-2.5 py-1 font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}

              {isDirectVideo(currentLesson.videoUrl, currentLesson.videoType) && (
                <div className="flex items-center gap-1 mr-2 border-r border-slate-700 pr-2">
                  <button
                    onClick={() => handleSkipTime(-10)}
                    className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700"
                    title="إرجاع 10 ثواني"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleSkipTime(10)}
                    className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700"
                    title="تقديم 10 ثواني"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quality and Fullscreen Button */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">الجودة:</span>
              {(['1080p', '720p', '480p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setVideoQuality(q)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                    videoQuality === q
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}

              {/* Dedicated Fullscreen Toggle Button */}
              <button
                onClick={handleToggleFullscreen}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 font-black transition-all shadow-sm shadow-amber-500/20"
                title="تكبير الشاشة بالكامل"
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span>{isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}</span>
              </button>
            </div>

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
