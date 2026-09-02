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
  ShieldCheck,
  ShieldAlert,
  Lock,
  Bot,
  Brain
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { MediaStore } from '../services/mediaStore';
import { Course, Lesson, Student, QuizExam, Assignment, AssignmentSubmission } from '../types';
import { AIPhysicsAssistant } from './AIPhysicsAssistant';
import { PdfViewerModal } from './PdfViewerModal';
import { AssignmentSolverModal } from './AssignmentSolverModal';

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
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // Assignment Modal States
  const [assignments, setAssignments] = useState<Assignment[]>(StorageService.getAssignmentsByCourse(courseId));
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(
    student ? StorageService.getStudentAssignmentSubmissions(student.id) : []
  );
  const [selectedAssignmentModal, setSelectedAssignmentModal] = useState<Assignment | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState<boolean>(false);
  
  // Security Anti-Screenshot & Anti-Recording DRM States
  const [isCaptureBlocked, setIsCaptureBlocked] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard Shortcuts Interceptor & Anti-Screenshot Detection
  useEffect(() => {
    const triggerCaptureBlock = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("محتوى منصة ويكيفزياء محمي ضد الالتقاط والتسجيل").catch(() => {});
      }
      setIsCaptureBlocked(true);
      setTimeout(() => {
        setIsCaptureBlocked(false);
      }, 3500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.keyCode === 44;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      const isScreenshotOrSave =
        isPrintScreen ||
        (isCmdOrCtrl && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'P' || e.key === 'S' || e.key === 'U')) ||
        (isCmdOrCtrl && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C')) ||
        (e.metaKey && e.shiftKey && ['3', '4', '5', 's', 'S'].includes(e.key));

      if (isScreenshotOrSave) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureBlock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        triggerCaptureBlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, []);

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
      setAssignments(StorageService.getAssignmentsByCourse(courseId));
      if (s) {
        setSubmissions(StorageService.getStudentAssignmentSubmissions(s.id));
      }

      if (c) {
        const flatLessons: Lesson[] = [];
        c.units?.forEach(u => u.lessons?.forEach(l => flatLessons.push(l)));
        setAllLessons(flatLessons);

        const targetLesson = flatLessons.find(l => l.id === lessonId) || flatLessons[0];
        setCurrentLesson(targetLesson);

        if (s && targetLesson) {
          const prog = StorageService.getLessonProgress(s.id, targetLesson.id);
          setIsCompleted(!!prog?.isCompleted);
        }
      }
    };
    update();
    return subscribeToStorage(update);
  }, [courseId, lessonId]);

  useEffect(() => {
    if (student && course && currentLesson) {
      StorageService.setLastViewedLesson(student.id, course.id, currentLesson.id);
    }
  }, [student?.id, course?.id, currentLesson?.id]);

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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-[#0D1B3E]">
        <h2 className="text-xl font-bold">لم يتم العثور على الدرس</h2>
        <button
          onClick={() => onNavigate('my-courses')}
          className="mt-4 rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401]"
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
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className={`mx-auto ${isTheaterMode ? 'max-w-full px-2 sm:px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'} py-6 space-y-6 animate-in fade-in duration-300 transition-all protected-page select-none`}
    >
      
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 text-xs">
        <div className="flex items-center gap-2 text-[#6B7280] truncate">
          <button 
            onClick={() => onNavigate('course-details', { courseId: course.id })}
            className="flex items-center gap-1 hover:text-[#1E4FD8] font-bold transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span>{course.title}</span>
          </button>
          <span>/</span>
          <span className="text-[#0D1B3E] font-bold truncate">{currentLesson.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
              isTheaterMode ? 'bg-blue-50 text-[#1E4FD8] border-blue-200' : 'border-slate-200 bg-white text-[#4B5563] hover:text-[#0D1B3E]'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>{isTheaterMode ? 'الوضع العادي' : 'وضع المسرح (شاشة عريضة)'}</span>
          </button>

          <button
            onClick={() => onNavigate('course-details', { courseId: course.id })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[#4B5563] hover:text-[#0D1B3E] shrink-0 font-bold"
          >
            فهرس المنهج
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isTheaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8 items-start`}>
        
        {/* Main Content: Video Player & Lesson Details */}
        <div className={`${isTheaterMode ? 'w-full' : 'lg:col-span-2'} space-y-4`}>
          
          {/* Responsive Video Container with Fullscreen & DRM Anti-Screen Recording Protection */}
          <div 
            ref={videoContainerRef}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-md group flex items-center justify-center select-none ${
              isCaptureBlocked ? 'filter blur-2xl transition-all duration-300' : ''
            }`}
            style={{
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
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
            <div className="absolute top-3 left-3 pointer-events-none rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 px-2.5 py-1 text-[11px] font-black text-[#F5B301] flex items-center gap-1.5 shadow-lg z-10">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full HD 1080p</span>
            </div>

            {/* Quick Fullscreen Floating Button (top right) */}
            <button
              onClick={handleToggleFullscreen}
              className="absolute top-3 right-3 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 p-2 text-slate-200 hover:text-amber-400 hover:bg-slate-900 transition-all opacity-80 hover:opacity-100 shadow-lg z-10"
              title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Screen Capture Attempt Blocked Overlay */}
            {isCaptureBlocked && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center animate-fadeIn font-sans">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 mb-4 animate-bounce">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-white">تصوير الشاشة غير مسموح به!</h3>
                <p className="text-xs text-slate-300 max-w-md mt-2 leading-relaxed">
                  محتوى المنصة محمي ضد الالتقاط والتصوير لحفظ حقوق النشر والتأليف.
                </p>
              </div>
            )}
          </div>

          {/* Video Playback & Quality Controls Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            
            {/* Speed & Seek Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#4B5563] font-bold flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-[#1E4FD8]" />
                <span>السرعة:</span>
              </span>
              {[1, 1.25, 1.5, 1.75, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`rounded-lg px-2.5 py-1 font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-[#1E4FD8] text-white shadow-xs'
                      : 'bg-slate-100 text-[#4B5563] hover:bg-slate-200 hover:text-[#0D1B3E]'
                  }`}
                >
                  {spd}x
                </button>
              ))}

              {isDirectVideo(currentLesson.videoUrl, currentLesson.videoType) && (
                <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
                  <button
                    onClick={() => handleSkipTime(-10)}
                    className="rounded-lg bg-slate-100 p-1.5 text-[#4B5563] hover:text-[#0D1B3E] hover:bg-slate-200"
                    title="إرجاع 10 ثواني"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleSkipTime(10)}
                    className="rounded-lg bg-slate-100 p-1.5 text-[#4B5563] hover:text-[#0D1B3E] hover:bg-slate-200"
                    title="تقديم 10 ثواني"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quality and Fullscreen Button */}
            <div className="flex items-center gap-2">
              <span className="text-[#4B5563] font-bold">الجودة:</span>
              {(['1080p', '720p', '480p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setVideoQuality(q)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                    videoQuality === q
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-slate-100 text-[#4B5563] hover:bg-slate-200'
                  }`}
                >
                  {q}
                </button>
              ))}

              {/* Dedicated Fullscreen Toggle Button */}
              <button
                onClick={handleToggleFullscreen}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5B301] hover:bg-[#e0a401] text-[#0D1B3E] px-3 py-1 font-black transition-all shadow-xs"
                title="تكبير الشاشة بالكامل"
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span>{isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}</span>
              </button>
            </div>

          </div>

          {/* Action Bar (Complete Lesson, AI Assistant & Previous / Next Buttons) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Mark as Complete Toggle */}
              <button
                onClick={handleToggleComplete}
                className={`inline-flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : 'border border-slate-200 bg-[#F5F7FA] text-[#0D1B3E] hover:border-[#1E4FD8]'
                }`}
              >
                <CheckCircle2 className={`h-4 w-4 ${isCompleted ? 'text-emerald-600' : 'text-[#1E4FD8]'}`} />
                <span>{isCompleted ? 'تم إكمال الدرس' : 'تحديد الدرس كـ (مكتمل)'}</span>
              </button>

              {/* Ask AI Assistant About This Lesson */}
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                  showAIAssistant
                    ? 'border-[#1E4FD8] bg-[#1E4FD8] text-white shadow-xs'
                    : 'border-blue-200 bg-blue-50 text-[#1E4FD8] hover:bg-blue-100'
                }`}
              >
                <Bot className="h-4 w-4" />
                <span>المساعد الذكي للدرس</span>
              </button>
            </div>

            {/* Next / Previous Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={!prevLesson}
                onClick={() => prevLesson && onNavigate('lesson-player', { courseId: course.id, lessonId: prevLesson.id })}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold transition-colors ${
                  prevLesson ? 'bg-white text-[#0D1B3E] hover:bg-slate-50' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
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
                    ? 'border-blue-200 bg-blue-50 text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white' 
                    : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <span>الدرس التالي</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Lesson Info & Description */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <span className="text-xs text-[#1E4FD8] font-bold">{course.instructorName} • {course.grade}</span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">{currentLesson.title}</h1>
            </div>

            {currentLesson.description && (
              <p className="text-sm text-[#4B5563] leading-relaxed pt-2 border-t border-slate-100">
                {currentLesson.description}
              </p>
            )}

            {currentLesson.homeworkNotes && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
                <span className="text-xs font-bold text-[#0D1B3E] flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#F5B301]" />
                  تنبيهات وملاحظات الواجب:
                </span>
                <p className="text-xs text-[#4B5563] leading-relaxed">{currentLesson.homeworkNotes}</p>
              </div>
            )}
          </div>

          {/* Attachments & PDF Materials */}
          {currentLesson.pdfUrl && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-[#F5B301]">
                  <FileText className="h-6 w-6 text-[#0D1B3E]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0D1B3E]">{currentLesson.pdfTitle || 'مذكرة شرح وتمارين الدرس.pdf'}</h4>
                  <p className="text-xs text-[#6B7280]">ملف PDF مرفق متضمن الملاحظات والمسائل المحلولة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs transition-all self-end sm:self-auto"
              >
                <FileText className="h-4 w-4" />
                <span>معاينة وقراءة المذكرة</span>
              </button>
            </div>
          )}

          {/* Assignments associated with this course / lesson */}
          {assignments.length > 0 && (
            <div className="space-y-3">
              {assignments.map(asgn => {
                const sub = submissions.find(s => s.assignmentId === asgn.id);
                return (
                  <div key={asgn.id} className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-[#16224D] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-xl bg-[#F5B301]/20 p-3 text-[#0D1B3E] dark:text-white shrink-0">
                        <FileText className="h-6 w-6 text-[#1E4FD8] dark:text-[#4C7CFF]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase bg-[#1E4FD8] text-white px-2 py-0.5 rounded-md">
                            واجب تطبيقات الـ PDF
                          </span>
                          {sub && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              sub.status === 'graded' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {sub.status === 'graded' ? `تم التصحيح: ${sub.grade}/${sub.maxGrade || 20}` : 'تم التسليم - قيد المراجعة'}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[#0D1B3E] dark:text-white">{asgn.title}</h4>
                        <p className="text-xs text-[#6B7280] dark:text-slate-400">
                          الدرجة الكلية: {asgn.maxGrade || 20} درجة
                          {asgn.deadline && ` • آخر موعد: ${new Date(asgn.deadline).toLocaleDateString('ar-EG')}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssignmentModal(asgn);
                        setAssignmentModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1E4FD8] dark:bg-[#4C7CFF] px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-xs transition-all self-end sm:self-auto"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{sub ? 'عرض ورقة الحل والتصحيح' : 'فتح وتأدية الواجب الآن'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lesson Quiz Card if present */}
          {lessonQuiz && (
            <div className="rounded-3xl border border-blue-200 bg-blue-50/50 dark:bg-[#16224D] dark:border-blue-900/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-blue-100 dark:bg-blue-950/80 p-3 text-[#1E4FD8] dark:text-[#60A5FA]">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#1E4FD8] dark:text-[#60A5FA] uppercase tracking-wider">كويز تقييم الفهم</span>
                    {(() => {
                      const quizAtt = student ? StorageService.getStudentAttempts(student.id).find(a => a.examId === lessonQuiz.id) : undefined;
                      if (!quizAtt) return null;
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          quizAtt.passed 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          تم الأداء ({quizAtt.score}/{quizAtt.maxScore})
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="font-bold text-base text-[#0D1B3E] dark:text-white">{lessonQuiz.title}</h3>
                  <p className="text-xs text-[#4B5563] dark:text-slate-400">
                    المدة: {lessonQuiz.durationMinutes} دقيقة • {lessonQuiz.questions?.length || 0} أسئلة اختيار من متعدد
                  </p>
                </div>
              </div>

              {(() => {
                const quizAtt = student ? StorageService.getStudentAttempts(student.id).find(a => a.examId === lessonQuiz.id) : undefined;
                if (quizAtt) {
                  return (
                    <button
                      onClick={() => onNavigate('exam-result', { attemptId: quizAtt.id })}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-6 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>عرض نتيجة الكويز والتقرير</span>
                    </button>
                  );
                }

                return (
                  <button
                    onClick={() => onNavigate('exam-runner', { examId: lessonQuiz.id, courseId: course.id, lessonId: currentLesson.id })}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E4FD8] dark:bg-[#3B82F6] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>بدء الكويز الآن</span>
                  </button>
                );
              })()}
            </div>
          )}

        </div>

        {/* Sidebar: Course Curriculum Playlist */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 sticky top-24 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-[#1E4FD8]" />
                <h3 className="font-bold text-[#0D1B3E] text-sm">دروس الكورس</h3>
              </div>
              <span className="text-xs text-[#6B7280] font-bold">{allLessons.length} درس</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {course.units?.map((unit, uIdx) => (
                <div key={unit.id} className="space-y-1.5">
                  <p className="text-[11px] font-bold text-[#1E4FD8] px-2 py-1 bg-blue-50 rounded-lg">
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
                              ? 'bg-blue-50 border border-blue-200 text-[#1E4FD8] font-bold'
                              : 'text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#0D1B3E]'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-4 w-4 text-[#1E4FD8] animate-pulse" />
                            ) : (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] text-[#6B7280]">
                                {l.order}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="line-clamp-2 leading-snug">{l.title}</p>
                            <span className="text-[10px] text-[#6B7280]">{l.durationMinutes || 45} دقيقة</span>
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

      {/* Floating AI Physics Assistant Modal / Widget */}
      {showAIAssistant && (
        <AIPhysicsAssistant
          isFloating={true}
          currentLessonId={currentLesson.id}
          currentCourseId={course.id}
          lessonTitle={currentLesson.title}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Lesson PDF Viewer Modal */}
      {showPdfModal && currentLesson.pdfUrl && (
        <PdfViewerModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          title={currentLesson.pdfTitle || currentLesson.title || 'مذكرة الدرس'}
          pdfUrl={currentLesson.pdfUrl}
          category="مذكرة الدرس"
          grade={course.grade}
        />
      )}

      {/* Assignment Solver / Viewer Modal */}
      {assignmentModalOpen && selectedAssignmentModal && (
        <AssignmentSolverModal
          isOpen={assignmentModalOpen}
          onClose={() => setAssignmentModalOpen(false)}
          assignment={selectedAssignmentModal}
          student={student}
          submission={submissions.find(s => s.assignmentId === selectedAssignmentModal.id)}
          mode={submissions.find(s => s.assignmentId === selectedAssignmentModal.id) ? 'view' : 'solve'}
          onSuccess={() => {
            if (student) {
              setSubmissions(StorageService.getStudentAssignmentSubmissions(student.id));
            }
          }}
        />
      )}

    </div>
  );
};
