import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  X, 
  Edit3, 
  Type, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertCircle,
  Award,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Download,
  Lightbulb,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Plus,
  Eye,
  Camera,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Assignment, AssignmentSubmission, Student } from '../types';
import { StorageService } from '../services/storage';
import { resolvePdfUrl, getEmbedPdfSource, downloadPdfFile } from '../utils/pdfHelper';
import { MediaStore } from '../services/mediaStore';

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawStroke {
  type: 'pen' | 'eraser';
  color: string;
  size: number;
  points: DrawPoint[];
}

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface PageAnnotationData {
  strokes: DrawStroke[];
  texts: TextAnnotation[];
}

interface AssignmentSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  student?: Student | null;
  submission?: AssignmentSubmission | null;
  mode?: 'solve' | 'grade' | 'view'; // solve = student, grade = admin, view = read only
  onSuccess?: () => void;
}

export const AssignmentSolverModal: React.FC<AssignmentSolverModalProps> = ({
  isOpen,
  onClose,
  assignment,
  student,
  submission,
  mode = 'solve',
  onSuccess
}) => {
  const [currentMode, setCurrentMode] = useState<'solve' | 'grade' | 'view'>(mode);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Navigation Tabs inside the Modal
  // Default to 'upload' for solve mode (as requested by user) or 'preview'
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'draw'>(
    mode === 'grade' 
      ? (submission?.solutionFiles && submission.solutionFiles.length > 0 ? 'upload' : 'preview') 
      : 'upload'
  );

  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);

  // Upload Solution State (Images & PDFs)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(submission?.solutionFiles || []);
  const [studentNotesInput, setStudentNotesInput] = useState<string>(submission?.studentNotes || '');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Drawing Canvas State
  const [activeTool, setActiveTool] = useState<'pen' | 'text' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>(mode === 'grade' ? '#EF4444' : '#1E4FD8');
  const [penSize, setPenSize] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, PageAnnotationData>>({
    1: { strokes: [], texts: [] }
  });

  // Admin Grading State
  const [gradeInput, setGradeInput] = useState<string>(submission?.grade !== undefined ? String(submission.grade) : '');
  const [teacherNotes, setTeacherNotes] = useState<string>(submission?.teacherNotes || '');
  const [feedbackStatus, setFeedbackStatus] = useState<'approved' | 'needs_revision' | 'excellent'>(
    submission?.feedbackStatus || 'approved'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Text Annotation Modal
  const [textModalOpen, setTextModalOpen] = useState<boolean>(false);
  const [pendingTextPos, setPendingTextPos] = useState<{ x: number; y: number } | null>(null);
  const [inputText, setInputText] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawing = useRef<boolean>(false);
  const currentStroke = useRef<DrawStroke | null>(null);

  // Load PDF URL
  useEffect(() => {
    if (isOpen && assignment?.pdfUrl) {
      setIsLoadingPdf(true);
      resolvePdfUrl(assignment.pdfUrl)
        .then(url => {
          setResolvedPdfUrl(url);
          setIsLoadingPdf(false);
        })
        .catch(() => {
          setIsLoadingPdf(false);
        });
    }
  }, [isOpen, assignment?.pdfUrl]);

  // Load existing submission data
  useEffect(() => {
    if (submission) {
      if (submission.solutionFiles && submission.solutionFiles.length > 0) {
        setUploadedFiles(submission.solutionFiles);
      }
      if (submission.studentNotes) {
        setStudentNotesInput(submission.studentNotes);
      }
      if (submission.grade !== undefined) {
        setGradeInput(String(submission.grade));
      }
      if (submission.teacherNotes) {
        setTeacherNotes(submission.teacherNotes);
      }
      if (submission.feedbackStatus) {
        setFeedbackStatus(submission.feedbackStatus);
      }

      const dataToLoad = mode === 'grade' 
        ? (submission.teacherAnnotatedData || submission.annotatedPdfData)
        : submission.annotatedPdfData;

      if (dataToLoad) {
        try {
          const parsed = JSON.parse(dataToLoad);
          if (typeof parsed === 'object' && parsed !== null) {
            setPageAnnotations(parsed);
          }
        } catch (e) {
          console.warn('Could not parse assignment annotations:', e);
        }
      }
    }
  }, [submission, mode]);

  // Handle File Uploads (Multiple Images / Solved PDF)
  const handleSolutionFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    const newFileUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // If image or small PDF, convert to base64 DataURL or store in MediaStore
      if (file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newFileUrls.push(base64);
      } else {
        // PDF or other documents -> Save to MediaStore
        try {
          const mediaId = 'solution_' + Date.now() + '_' + i;
          const url = await MediaStore.saveMedia(mediaId, file, file.name);
          newFileUrls.push(url);
        } catch (err) {
          console.error('Error saving solution file:', err);
        }
      }
    }

    setUploadedFiles(prev => [...prev, ...newFileUrls]);
    setIsUploadingFile(false);
    if (e.target) e.target.value = '';
  };

  const handleRemoveUploadedFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Canvas Drawing & Annotation Logic
  useEffect(() => {
    if (activeTab === 'draw') {
      redrawCanvas();
    }
  }, [currentPage, pageAnnotations, activeTab]);

  const getActivePageData = (): PageAnnotationData => {
    return pageAnnotations[currentPage] || { strokes: [], texts: [] };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pageData = getActivePageData();

    // Draw strokes
    pageData.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      
      if (stroke.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.size * 6;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });

    // Draw text annotations
    pageData.texts.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.font = `bold ${item.fontSize || 16}px Cairo, sans-serif`;
      
      const px = item.x * canvas.width;
      const py = item.y * canvas.height;

      ctx.save();
      const textMetrics = ctx.measureText(item.text);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(px - 4, py - 18, textMetrics.width + 8, 24);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 4, py - 18, textMetrics.width + 8, 24);
      ctx.restore();

      ctx.fillStyle = item.color;
      ctx.fillText(item.text, px, py);
    });
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode === 'view') return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'text') {
      setPendingTextPos(coords);
      setInputText('');
      setTextModalOpen(true);
      return;
    }

    isDrawing.current = true;
    currentStroke.current = {
      type: activeTool === 'eraser' ? 'eraser' : 'pen',
      color: penColor,
      size: penSize,
      points: [coords]
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current || mode === 'view') return;
    const coords = getCanvasCoords(e);
    currentStroke.current.points.push(coords);

    redrawCanvas();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stroke = currentStroke.current;
    const pts = stroke.points;
    if (pts.length < 2) return;

    ctx.beginPath();
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];
    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);

    if (stroke.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.size * 6;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const stopDrawing = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;

    const finishedStroke = currentStroke.current;
    currentStroke.current = null;

    if (finishedStroke.points.length >= 2) {
      setPageAnnotations(prev => {
        const pageData = prev[currentPage] || { strokes: [], texts: [] };
        return {
          ...prev,
          [currentPage]: {
            ...pageData,
            strokes: [...pageData.strokes, finishedStroke]
          }
        };
      });
    }
  };

  const handleAddText = () => {
    if (!pendingTextPos || !inputText.trim()) {
      setTextModalOpen(false);
      return;
    }

    const newText: TextAnnotation = {
      id: 'txt_' + Date.now(),
      x: pendingTextPos.x,
      y: pendingTextPos.y,
      text: inputText.trim(),
      color: penColor,
      fontSize: 16
    };

    setPageAnnotations(prev => {
      const pageData = prev[currentPage] || { strokes: [], texts: [] };
      return {
        ...prev,
        [currentPage]: {
          ...pageData,
          texts: [...pageData.texts, newText]
        }
      };
    });

    setInputText('');
    setPendingTextPos(null);
    setTextModalOpen(false);
  };

  const handleUndo = () => {
    setPageAnnotations(prev => {
      const pageData = prev[currentPage] || { strokes: [], texts: [] };
      if (pageData.strokes.length === 0 && pageData.texts.length === 0) return prev;

      if (pageData.strokes.length > 0) {
        return {
          ...prev,
          [currentPage]: {
            ...pageData,
            strokes: pageData.strokes.slice(0, -1)
          }
        };
      } else {
        return {
          ...prev,
          [currentPage]: {
            ...pageData,
            texts: pageData.texts.slice(0, -1)
          }
        };
      }
    });
  };

  const handleClearPage = () => {
    setPageAnnotations(prev => ({
      ...prev,
      [currentPage]: { strokes: [], texts: [] }
    }));
  };

  // Student Submission Submit Action
  const handleSubmitAssignment = () => {
    if (!student && mode === 'solve') {
      alert('عفوًا، يجب تسجيل الدخول للتمكن من تسليم الواجب.');
      return;
    }

    if (uploadedFiles.length === 0 && !hasDrawnAnnotations()) {
      alert('برجاء رفع صور أو ملف الحل الخاص بك أو كتابة الإجابات قبل التسليم.');
      return;
    }

    setIsSubmitting(true);

    const submissionData: AssignmentSubmission = {
      id: submission?.id || 'sub_' + Date.now(),
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      courseId: assignment.courseId,
      studentId: student?.id || submission?.studentId || 'std_guest',
      studentName: student?.name || submission?.studentName || 'طالب',
      studentPhone: student?.phone || submission?.studentPhone || '',
      studentGrade: student?.grade || submission?.studentGrade || assignment.gradeLevel,
      submittedAt: new Date().toISOString(),
      submissionType: uploadedFiles.length > 0 ? (hasDrawnAnnotations() ? 'both' : 'upload') : 'draw',
      solutionFiles: uploadedFiles,
      studentNotes: studentNotesInput.trim(),
      annotatedPdfData: JSON.stringify(pageAnnotations),
      status: submission?.status || 'pending',
      grade: submission?.grade,
      maxGrade: assignment.maxGrade || 20,
      teacherNotes: submission?.teacherNotes,
      feedbackStatus: submission?.feedbackStatus
    };

    StorageService.saveAssignmentSubmission(submissionData);
    setIsSubmitting(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const hasDrawnAnnotations = () => {
    return Object.values(pageAnnotations).some((p: PageAnnotationData) => (p?.strokes?.length || 0) > 0 || (p?.texts?.length || 0) > 0);
  };

  // Admin Grading Save Action
  const handleSaveGrading = () => {
    if (!submission) return;
    const gradeNum = parseFloat(gradeInput);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > (assignment.maxGrade || 20)) {
      return;
    }

    setIsSubmitting(true);
    StorageService.gradeAssignmentSubmission(
      submission.id,
      gradeNum,
      teacherNotes,
      JSON.stringify(pageAnnotations),
      feedbackStatus
    );
    setIsSubmitting(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const embedSource = getEmbedPdfSource(resolvedPdfUrl, true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 lg:p-6"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col w-full h-[95vh] max-w-6xl bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] rounded-3xl shadow-2xl overflow-hidden transition-all"
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] px-4 sm:px-6 py-3.5 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1E4FD8]/10 text-[#1E4FD8] dark:bg-[#4C7CFF]/20 dark:text-[#4C7CFF]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[#0D1B3E] dark:text-white text-base sm:text-lg truncate">
                  {assignment.title || 'واجب دراسي'}
                </h3>
                {submission && (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    submission.status === 'graded'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  }`}>
                    {submission.status === 'graded' 
                      ? `تم التصحيح (${submission.grade}/${submission.maxGrade || 20})` 
                      : 'قيد المراجعة والتصحيح'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                <span>
                  الدرجة الكلية: <strong className="text-[#0D1B3E] dark:text-amber-400 font-bold">{assignment.maxGrade || 20} درجة</strong>
                </span>
                {assignment.deadline && (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    • آخر موعد: {new Date(assignment.deadline).toLocaleDateString('ar-EG')}
                  </span>
                )}
                {mode === 'grade' && submission && (
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    • الطالب: {submission.studentName} ({submission.studentPhone || 'بدون هاتف'})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download Action Button */}
            <button
              onClick={() => downloadPdfFile(assignment.pdfUrl || resolvedPdfUrl, `${assignment.title || 'الواجب'}.pdf`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5B301] hover:bg-[#e0a401] text-[#0D1B3E] font-black text-xs shadow-xs transition-all cursor-pointer"
              title="تنزيل ملف الواجب PDF على جهازك"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تحميل ورقة الواجب (PDF)</span>
            </button>

            {resolvedPdfUrl && (
              <button
                onClick={() => window.open(resolvedPdfUrl, '_blank')}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24336A] bg-white dark:bg-[#16224D] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="فتح ملف الـ PDF في صفحة مستقلة"
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                <span>تبويب خارجي</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-[#24336A] bg-white dark:bg-[#16224D] p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Tabs Bar (The Hybrid & Multi-Page Solution) */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24336A] bg-slate-100/90 dark:bg-[#111C3D] px-4 sm:px-6 py-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {/* Tab 1: Upload Solution (Recommended & Easy Flow) */}
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#1E4FD8] text-white shadow-md'
                  : 'bg-white dark:bg-[#16224D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#24336A] hover:bg-slate-50'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>
                {mode === 'grade' ? 'حلول الطالب المرفوعة' : 'رفع صور أو ملف الحل'}
              </span>
              {uploadedFiles.length > 0 && (
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'صفحة' : 'صفحات'}
                </span>
              )}
            </button>

            {/* Tab 2: Full PDF Interactive Scroll Viewer */}
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[#1E4FD8] text-white shadow-md'
                  : 'bg-white dark:bg-[#16224D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#24336A] hover:bg-slate-50'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>تصفح ورقة الواجب (PDF)</span>
            </button>

            {/* Tab 3: Interactive Pen Drawing */}
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-[#1E4FD8] text-white shadow-md'
                  : 'bg-white dark:bg-[#16224D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#24336A] hover:bg-slate-50'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>الحل بالقلم الرقمي</span>
              {hasDrawnAnnotations() && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-[#6B7280] dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>يمكنك تنزيل الواجب وحله خارجياً ثم تصوير الإجابة ورفعها</span>
          </div>
        </div>

        {/* Content Area Based on Active Tab */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-100 dark:bg-[#0A1229]">
          
          {/* ========================================================================= */}
          {/* TAB 1: UPLOAD & REVIEW SOLUTION FILES (The Requested Workflow)            */}
          {/* ========================================================================= */}
          {activeTab === 'upload' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* How it works Banner for Student */}
              {mode === 'solve' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Step 1 */}
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1E4FD8] text-white font-black text-xs">
                        1
                      </span>
                      <Download className="h-4 w-4 text-[#1E4FD8]" />
                    </div>
                    <h4 className="font-bold text-sm text-[#0D1B3E] dark:text-white">نزّل ورقة الواجب (PDF)</h4>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                      حمّل ملف الواجب على هاتفك أو كمبيوترك واقرأ الأسئلة بوضوح.
                    </p>
                    <button
                      type="button"
                      onClick={() => downloadPdfFile(assignment.pdfUrl || resolvedPdfUrl, `${assignment.title}.pdf`)}
                      className="w-full py-2 rounded-xl bg-white dark:bg-[#16224D] border border-blue-200 dark:border-[#24336A] text-xs font-bold text-[#1E4FD8] dark:text-[#4C7CFF] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>تنزيل الملف الآن</span>
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F5B301] text-slate-950 font-black text-xs">
                        2
                      </span>
                      <Edit3 className="h-4 w-4 text-[#F5B301]" />
                    </div>
                    <h4 className="font-bold text-sm text-[#0D1B3E] dark:text-white">حل الأسئلة وصوّر الحل</h4>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                      حل المسائل في كشكولك أو ورقة خارجية بخط واضح، والتقط صوراً لصفحات الإجابة بالكاميرا.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <Camera className="h-3.5 w-3.5" />
                      <span>صور واضحة لكل صفحة</span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
                        3
                      </span>
                      <Upload className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-sm text-[#0D1B3E] dark:text-white">ارفع الصور وسلّم الواجب</h4>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                      اضغط زر الرفع أدناه لاختيار صور الحل، ثم اضغط "تسليم الواجب" ليصل للأستاذ فوراً لتصحيحه.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>تصحيح ورصد درجات</span>
                    </div>
                  </div>

                </div>
              )}

              {/* Upload Dropzone / Action Area (Enabled for solve or when editing) */}
              {mode !== 'view' && mode !== 'grade' && (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#16224D] p-6 text-center space-y-4 shadow-xs">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-blue-50 dark:bg-[#1E4FD8]/20 text-[#1E4FD8] dark:text-[#4C7CFF]">
                    <Upload className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#0D1B3E] dark:text-white">
                      رفع صور أو ملفات حل الواجب
                    </h4>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 max-w-md mx-auto">
                      يمكنك اختيار صورة أو عدة صور لصفحات الحل من المعرض أو التقاطها مباشرة بالكاميرا أو رفع ملف PDF محلول.
                    </p>
                  </div>

                  {/* Hidden Input Elements */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleSolutionFilesSelected}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleSolutionFilesSelected}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1E4FD8] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>اختيار ملفات / صور من الجهاز</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploadingFile}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] hover:bg-slate-100 text-[#0D1B3E] dark:text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Camera className="h-4 w-4 text-blue-500" />
                      <span>التقاط صورة بكاميرا الهاتف</span>
                    </button>
                  </div>

                  {isUploadingFile && (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1E4FD8] pt-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>جاري معالجة ورفع الملفات...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded Solution Pages Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#0D1B3E] dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#1E4FD8]" />
                    <span>صفحات الحل المرفوعة ({uploadedFiles.length})</span>
                  </h4>
                  {uploadedFiles.length > 0 && mode !== 'view' && mode !== 'grade' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#1E4FD8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>إضافة صفحة أخرى</span>
                    </button>
                  )}
                </div>

                {uploadedFiles.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16224D] p-8 text-center text-slate-400 space-y-2">
                    <ImageIcon className="h-10 w-10 mx-auto opacity-30" />
                    <p className="text-xs font-bold text-[#0D1B3E] dark:text-white">لم يتم رفع أي صور أو ملفات حل بعد</p>
                    <p className="text-[11px] text-slate-400">
                      {mode === 'grade' ? 'الطالب لم يرفق ملفات خارجية للحل' : 'قم بتحميل الواجب وحله ثم ارفع صور الحل هنا'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((fileUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl border border-slate-200 dark:border-[#24336A] bg-white dark:bg-[#16224D] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Page Number Badge */}
                        <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          صفحة {idx + 1}
                        </div>

                        {/* Image Preview / PDF Icon */}
                        <div 
                          onClick={() => setPreviewImageModal(fileUrl)}
                          className="aspect-[3/4] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center relative"
                        >
                          {fileUrl.startsWith('data:image/') || fileUrl.includes('image') || (!fileUrl.includes('.pdf') && !fileUrl.startsWith('local-media:assignment_pdf')) ? (
                            <img
                              src={fileUrl}
                              alt={`صفحة الحل ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                              <FileText className="h-10 w-10 text-rose-500 mb-1" />
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">ملف مرفوع</span>
                            </div>
                          )}

                          {/* Hover Zoom Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="p-2 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1 shadow-lg">
                              <ZoomIn className="h-3.5 w-3.5" />
                              معاينة
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-2 border-t border-slate-100 dark:border-[#24336A] flex items-center justify-between bg-slate-50 dark:bg-[#0D1B3E]">
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(fileUrl)}
                            className="text-[11px] font-bold text-[#1E4FD8] dark:text-[#4C7CFF] hover:underline flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>تكبير</span>
                          </button>

                          {mode !== 'view' && mode !== 'grade' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedFile(idx)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="حذف هذه الصفحة"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Notes / Explanations Input */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#24336A] bg-white dark:bg-[#16224D] p-4 space-y-2">
                <label className="font-bold text-xs text-[#0D1B3E] dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span>ملاحظات الطالب وتوضيحات الحل (اختياري):</span>
                </label>
                
                {mode === 'solve' ? (
                  <textarea
                    rows={3}
                    value={studentNotesInput}
                    onChange={e => setStudentNotesInput(e.target.value)}
                    placeholder="يمكنك كتابة أي ملاحظة أو استفسار للأستاذ بخصوص خطوات الحل هنا..."
                    className="w-full rounded-xl border border-slate-200 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-xs text-[#0D1B3E] dark:text-white focus:outline-none focus:border-[#1E4FD8]"
                  />
                ) : (
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0D1B3E] p-3 rounded-xl">
                    {submission?.studentNotes || 'لا توجد ملاحظات مرفقة من الطالب.'}
                  </p>
                )}
              </div>

              {/* If Submission is Graded: Teacher Feedback Box */}
              {submission?.status === 'graded' && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-6 w-6 text-emerald-600" />
                      <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-300">
                        نتيجة وتصحيح المعلم
                      </h4>
                    </div>
                    <span className="text-sm font-black bg-emerald-600 text-white px-3.5 py-1 rounded-xl">
                      {submission.grade} / {submission.maxGrade || 20} درجة
                    </span>
                  </div>

                  {submission.teacherNotes && (
                    <div className="text-xs text-emerald-950 dark:text-emerald-200 bg-white/80 dark:bg-[#16224D] p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 leading-relaxed">
                      <strong className="block text-emerald-800 dark:text-emerald-300 mb-1">ملاحظات وتوجيهات المعلم:</strong>
                      {submission.teacherNotes}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INTERACTIVE MULTI-PAGE PDF SCROLL VIEWER                           */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-200 dark:bg-slate-900 flex flex-col">
              {isLoadingPdf ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                  <div className="h-10 w-10 border-4 border-[#1E4FD8] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-bold">جاري تحميل ملف الواجب الـ PDF...</p>
                </div>
              ) : resolvedPdfUrl ? (
                <iframe
                  src={embedSource}
                  className="w-full h-full border-none bg-white"
                  title="استعراض الواجب الدراسي"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <FileText className="h-12 w-12 mb-2 opacity-30" />
                  <p className="text-xs font-bold text-[#0D1B3E] dark:text-white">لم يتم العثور على رابط ملف الواجب</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DIGITAL PEN DRAWING OVERLAY                                        */}
          {/* ========================================================================= */}
          {activeTab === 'draw' && (
            <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
              
              {/* Drawing Toolbar */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-[#24336A] bg-white dark:bg-[#111C3D] px-4 py-2 gap-2 text-xs shrink-0 z-20">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setActiveTool('pen')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTool === 'pen'
                        ? 'bg-[#1E4FD8] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#16224D] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    قلم
                  </button>

                  <button
                    onClick={() => setActiveTool('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTool === 'text'
                        ? 'bg-[#1E4FD8] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#16224D] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Type className="h-3.5 w-3.5" />
                    نص
                  </button>

                  <button
                    onClick={() => setActiveTool('eraser')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTool === 'eraser'
                        ? 'bg-[#1E4FD8] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#16224D] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    ممحاة
                  </button>

                  <div className="h-5 w-px bg-slate-300 dark:bg-[#24336A] mx-1" />

                  {/* Colors */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#16224D] p-1 rounded-xl">
                    {['#1E4FD8', '#EF4444', '#10B981', '#F5B301', '#000000'].map(c => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className={`h-5 w-5 rounded-full border-2 transition-transform cursor-pointer ${
                          penColor === c ? 'scale-125 border-white shadow-xs' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#16224D] text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    تراجع
                  </button>

                  <button
                    onClick={handleClearPage}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    مسح
                  </button>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#16224D] px-2 py-1 rounded-xl text-[#0D1B3E] dark:text-white font-bold">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="disabled:opacity-30 p-0.5 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] px-1">صفحة {currentPage}</span>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-0.5 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Container */}
              <div ref={containerRef} className="relative flex-1 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                <iframe
                  src={embedSource}
                  className="w-full h-full border-none select-none bg-white"
                  title="ملف الواجب"
                />

                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`absolute inset-0 w-full h-full z-20 ${
                    currentMode === 'view' ? 'pointer-events-none' : 'cursor-crosshair'
                  }`}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 bg-slate-50 dark:bg-[#0D1B3E] border-t border-slate-200 dark:border-[#24336A] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {currentMode === 'grade' ? (
            /* ================================================================= */
            /* ADMIN / TEACHER GRADING CONTROLS                                  */
            /* ================================================================= */
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Score Input */}
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#F5B301]" />
                  <span className="text-xs font-black text-[#0D1B3E] dark:text-white">الدرجة:</span>
                  <input
                    type="number"
                    min="0"
                    max={assignment.maxGrade || 20}
                    value={gradeInput}
                    onChange={e => setGradeInput(e.target.value)}
                    placeholder={`من ${assignment.maxGrade || 20}`}
                    className="w-24 rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] px-3 py-2 text-xs font-black text-[#0D1B3E] dark:text-white text-center focus:border-[#1E4FD8] focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">/ {assignment.maxGrade || 20}</span>
                </div>

                {/* Quick Rating Presets */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGradeInput(String(assignment.maxGrade || 20))}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-200 cursor-pointer"
                  >
                    درجة كاملة
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeInput(String(Math.round((assignment.maxGrade || 20) * 0.85)))}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-200 cursor-pointer"
                  >
                    جيد جداً
                  </button>
                </div>

                {/* Status Selector */}
                <select
                  value={feedbackStatus}
                  onChange={e => setFeedbackStatus(e.target.value as any)}
                  className="rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] px-3 py-2 text-xs font-bold text-[#0D1B3E] dark:text-white focus:outline-none"
                >
                  <option value="approved">معتمد ومقبول</option>
                  <option value="excellent">ممتاز ومثالي</option>
                  <option value="needs_revision">يحتاج إعادة مراجعة</option>
                </select>

                {/* Teacher Feedback Notes */}
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="ملاحظات وتوجيهات المعلم للطالب..."
                    className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] px-3 py-2 text-xs text-[#0D1B3E] dark:text-white focus:border-[#1E4FD8] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveGrading}
                disabled={isSubmitting}
                className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#F5B301] hover:bg-[#e0a401] px-6 py-2.5 text-xs font-black text-[#0D1B3E] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                حفظ التصحيح وإرسال النتيجة
              </button>
            </div>
          ) : mode === 'solve' ? (
            /* ================================================================= */
            /* STUDENT SUBMIT CONTROLS                                           */
            /* ================================================================= */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-slate-400">
                <Lightbulb className="h-4 w-4 text-[#F5B301] shrink-0" />
                <span>
                  {uploadedFiles.length > 0 
                    ? `تم تجهيز ${uploadedFiles.length} صفحة حل للتسليم`
                    : 'يمكنك رفع صور الحل أو تنزيل ملف الواجب لإكماله'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitting || (uploadedFiles.length === 0 && !hasDrawnAnnotations())}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-[#1E4FD8] hover:bg-blue-700 dark:bg-[#4C7CFF] dark:hover:bg-blue-600 text-white px-7 py-3 text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>تسليم الواجب الآن للأستاذ</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* STUDENT READ-ONLY VIEW                                            */
            /* ================================================================= */
            <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0D1B3E] dark:text-white">حالة الواجب:</span>
                {submission?.status === 'graded' ? (
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    تم التصحيح (الدرجة: {submission.grade} من {submission.maxGrade || 20})
                  </span>
                ) : (
                  <span className="font-bold text-amber-500">تم التسليم - بانتظار تصحيح المعلم</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentMode('solve');
                    setActiveTab('upload');
                  }}
                  className="rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] px-4 py-2 text-xs font-bold text-[#1E4FD8] dark:text-[#4C7CFF] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>تعديل أو إعادة رفع الحل</span>
                </button>

                <button
                  onClick={onClose}
                  className="rounded-xl bg-slate-200 dark:bg-slate-700 px-5 py-2 text-xs font-bold text-[#0D1B3E] dark:text-white hover:bg-slate-300 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>

      </motion.div>

      {/* ===================================================================== */}
      {/* Lightbox Modal to View High-Resolution Uploaded Image                */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {previewImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setPreviewImageModal(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between text-white pb-3">
                <span className="text-xs font-bold">معاينة صفحة الحل بدقة عالية</span>
                <button
                  onClick={() => setPreviewImageModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[80vh]">
                <img
                  src={previewImageModal}
                  alt="معاينة الحل"
                  className="max-w-full max-h-[80vh] object-contain select-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Annotation Input Modal */}
      {textModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#16224D] rounded-2xl p-5 border border-slate-200 dark:border-[#24336A] max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-[#0D1B3E] dark:text-white">إضافة ملاحظة نصية</h4>
            <input
              type="text"
              autoFocus
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="اكتب إجابتك أو ملاحظتك هنا..."
              className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#111C3D] p-3 text-xs text-[#0D1B3E] dark:text-white focus:border-[#1E4FD8] focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAddText()}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTextModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddText}
                className="px-5 py-2 text-xs font-bold bg-[#1E4FD8] text-white rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};
