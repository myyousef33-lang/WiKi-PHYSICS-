import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Lightbulb
} from 'lucide-react';
import { Assignment, AssignmentSubmission, Student } from '../types';
import { StorageService } from '../services/storage';
import { resolvePdfUrl, getEmbedPdfSource, downloadPdfFile } from '../utils/pdfHelper';

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
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'pen' | 'text' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>(mode === 'grade' ? '#EF4444' : '#1E4FD8'); // Default red for teacher, blue for student
  const [penSize, setPenSize] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Page annotations state: Map<pageNumber, PageAnnotationData>
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, PageAnnotationData>>({
    1: { strokes: [], texts: [] }
  });

  // Admin Grading state
  const [gradeInput, setGradeInput] = useState<string>(submission?.grade !== undefined ? String(submission.grade) : '');
  const [teacherNotes, setTeacherNotes] = useState<string>(submission?.teacherNotes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [textModalOpen, setTextModalOpen] = useState<boolean>(false);
  const [pendingTextPos, setPendingTextPos] = useState<{ x: number; y: number } | null>(null);
  const [inputText, setInputText] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef<boolean>(false);
  const currentStroke = useRef<DrawStroke | null>(null);

  // Load PDF URL
  useEffect(() => {
    if (isOpen) {
      setIsLoadingPdf(true);
      resolvePdfUrl(assignment?.pdfUrl)
        .then(url => {
          setResolvedPdfUrl(url);
          setIsLoadingPdf(false);
        })
        .catch(() => {
          setIsLoadingPdf(false);
        });
    }
  }, [isOpen, assignment?.pdfUrl]);

  // Load existing submission data if viewing or grading
  useEffect(() => {
    if (submission) {
      const dataToLoad = mode === 'grade' 
        ? (submission.teacherAnnotatedData || submission.annotatedPdfData)
        : (submission.annotatedPdfData);

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
      if (submission.grade !== undefined) setGradeInput(String(submission.grade));
      if (submission.teacherNotes) setTeacherNotes(submission.teacherNotes);
    }
  }, [submission, mode]);

  // Handle Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      redrawCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage, pageAnnotations]);

  // Redraw Canvas whenever currentPage or pageAnnotations change
  useEffect(() => {
    redrawCanvas();
  }, [currentPage, pageAnnotations, mode, resolvedPdfUrl]);

  const getActivePageData = (): PageAnnotationData => {
    return pageAnnotations[currentPage] || { strokes: [], texts: [] };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match displayed container
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

      // Subtle background box for text legibility
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

  // Touch and Mouse drawing events
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

    // Live stroke preview
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

  // Student Submission submit
  const handleSubmitAssignment = () => {
    if (!student && mode === 'solve') {
      alert('عفوًا، يجب تسجيل الدخول للتمكن من تسليم الواجب.');
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
      annotatedPdfData: JSON.stringify(pageAnnotations),
      status: submission?.status || 'pending',
      grade: submission?.grade,
      maxGrade: assignment.maxGrade || 20,
      teacherNotes: submission?.teacherNotes
    };

    StorageService.saveAssignmentSubmission(submissionData);
    setIsSubmitting(false);
    alert('تم تسليم الواجب بنجاح! يمكن متابعة حالة التسليم والدرجة من صفحة الكورس.');
    if (onSuccess) onSuccess();
    onClose();
  };

  // Admin Grade save
  const handleSaveGrading = () => {
    if (!submission) return;
    const gradeNum = parseFloat(gradeInput);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > (assignment.maxGrade || 20)) {
      alert(`برجاء إدخال درجة صحيحة بين 0 و ${assignment.maxGrade || 20}`);
      return;
    }

    setIsSubmitting(true);
    StorageService.gradeAssignmentSubmission(
      submission.id,
      gradeNum,
      teacherNotes,
      JSON.stringify(pageAnnotations)
    );
    setIsSubmitting(false);
    alert('تم حفظ التصحيح والدرجة بنجاح وإرسال إشعار للطالب!');
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
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col w-full h-[94vh] max-w-6xl bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] rounded-3xl shadow-2xl overflow-hidden transition-all"
      >
        
        {/* Header Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] px-4 sm:px-6 py-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4FD8]/10 text-[#1E4FD8] dark:bg-[#4C7CFF]/20 dark:text-[#4C7CFF]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0D1B3E] dark:text-white text-sm sm:text-base truncate">
                {assignment.title || 'واجب دراسي'}
              </h3>
              <p className="text-[11px] text-[#6B7280] dark:text-slate-400">
                الدرجة الكلية: <span className="font-bold text-[#F5B301]">{assignment.maxGrade || 20} درجة</span>
                {assignment.deadline && (
                  <span className="mr-3 text-rose-500 font-semibold">
                    • آخر موعد: {new Date(assignment.deadline).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download / External Links */}
            {resolvedPdfUrl && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => window.open(resolvedPdfUrl, '_blank')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  title="فتح ملف الـ PDF في تبويب جديد"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                  <span>تبويب جديد</span>
                </button>
                <button
                  onClick={() => downloadPdfFile(assignment.pdfUrl || resolvedPdfUrl, `${assignment.title}.pdf`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950"
                  title="تحميل الواجب"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>تحميل</span>
                </button>
              </div>
            )}

            {/* Submission Status Badge if exists */}
            {submission && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold">
                {submission.status === 'graded' ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 px-3 py-1 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" />
                    تم التصحيح: {submission.grade} / {submission.maxGrade || 20}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 px-3 py-1 rounded-xl">
                    <Clock className="h-4 w-4" />
                    قيد المراجعة
                  </span>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-[#24336A] bg-white dark:bg-[#16224D] p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Editing Toolbar Controls (Interactive Drawing Controls) */}
        {mode !== 'view' && (
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-[#24336A] bg-slate-100 dark:bg-[#111C3D] px-4 py-2 gap-2 text-xs shrink-0">
            
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {/* Pen Tool */}
              <button
                onClick={() => setActiveTool('pen')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTool === 'pen'
                    ? 'bg-[#1E4FD8] dark:bg-[#4C7CFF] text-white shadow-xs'
                    : 'bg-white dark:bg-[#16224D] text-[#0D1B3E] dark:text-slate-200 border border-slate-200 dark:border-[#24336A]'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                قلم الإجابة
              </button>

              {/* Text Tool */}
              <button
                onClick={() => setActiveTool('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTool === 'text'
                    ? 'bg-[#1E4FD8] dark:bg-[#4C7CFF] text-white shadow-xs'
                    : 'bg-white dark:bg-[#16224D] text-[#0D1B3E] dark:text-slate-200 border border-slate-200 dark:border-[#24336A]'
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                نص
              </button>

              {/* Eraser */}
              <button
                onClick={() => setActiveTool('eraser')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTool === 'eraser'
                    ? 'bg-[#1E4FD8] dark:bg-[#4C7CFF] text-white shadow-xs'
                    : 'bg-white dark:bg-[#16224D] text-[#0D1B3E] dark:text-slate-200 border border-slate-200 dark:border-[#24336A]'
                }`}
              >
                <Eraser className="h-3.5 w-3.5" />
                ممحاة
              </button>

              <div className="h-5 w-px bg-slate-300 dark:bg-[#24336A] mx-1" />

              {/* Color Picker */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#16224D] p-1 rounded-xl border border-slate-200 dark:border-[#24336A]">
                {['#1E4FD8', '#EF4444', '#10B981', '#F5B301', '#000000'].map(c => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                    className={`h-5 w-5 rounded-full border-2 transition-transform ${
                      penColor === c ? 'scale-125 border-white shadow-xs' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Thickness */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#16224D] px-2 py-1 rounded-xl border border-slate-200 dark:border-[#24336A]">
                {[2, 4, 7].map(s => (
                  <button
                    key={s}
                    onClick={() => setPenSize(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      penSize === s ? 'bg-slate-200 dark:bg-slate-700 text-[#0D1B3E] dark:text-white' : 'text-slate-400'
                    }`}
                  >
                    {s === 2 ? 'رفيع' : s === 4 ? 'متوسط' : 'سميك'}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Undo / Clear / Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                title="تراجع"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                تراجع
              </button>

              <button
                onClick={handleClearPage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="مسح الصفحة"
              >
                <Trash2 className="h-3.5 w-3.5" />
                مسح الصفحة
              </button>

              <div className="flex items-center gap-1 bg-white dark:bg-[#16224D] px-2 py-1 rounded-xl border border-slate-200 dark:border-[#24336A] text-[#0D1B3E] dark:text-white font-bold">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="disabled:opacity-30 p-0.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-[11px] px-1">ص {currentPage}</span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-0.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewing & Canvas Drawing Container */}
        <div ref={containerRef} className="relative flex-1 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
          
          {/* Background PDF iframe or SVG preview */}
          {isLoadingPdf ? (
            <div className="flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold">جاري تحميل ملف الواجب الـ PDF...</p>
            </div>
          ) : (
            <div className="w-full h-full relative overflow-hidden bg-white">
              <iframe
                src={embedSource}
                className="w-full h-full border-none select-none"
                title="ملف الواجب الدراسي"
              />
            </div>
          )}

          {/* Interactive Annotation Canvas Overlay */}
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
              mode === 'view' ? 'pointer-events-none' : 'cursor-crosshair'
            }`}
          />
        </div>

        {/* Footer: Admin Grading Controls or Student Submission Button */}
        <div className="p-4 bg-slate-50 dark:bg-[#0D1B3E] border-t border-slate-200 dark:border-[#24336A] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {mode === 'grade' ? (
            /* Admin Grading Interface */
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#F5B301]" />
                  <span className="text-xs font-bold text-[#0D1B3E] dark:text-white">الدرجة:</span>
                  <input
                    type="number"
                    min="0"
                    max={assignment.maxGrade || 20}
                    value={gradeInput}
                    onChange={e => setGradeInput(e.target.value)}
                    placeholder={`من ${assignment.maxGrade || 20}`}
                    className="w-24 rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] px-3 py-1.5 text-xs font-bold text-[#0D1B3E] dark:text-white text-center focus:border-[#1E4FD8] focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">/ {assignment.maxGrade || 20}</span>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="ملاحظات المعلم وتوجيهاته للطالب..."
                    className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-white dark:bg-[#16224D] px-3 py-1.5 text-xs text-[#0D1B3E] dark:text-white focus:border-[#1E4FD8] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveGrading}
                disabled={isSubmitting}
                className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#F5B301] hover:bg-[#e0a401] px-6 py-2.5 text-xs font-black text-[#0D1B3E] shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                حفظ التصحيح وإرسال النتيجة
              </button>
            </div>
          ) : mode === 'solve' ? (
            /* Student Submit Controls */
            <div className="w-full flex items-center justify-between">
              <p className="text-xs text-[#6B7280] dark:text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-[#F5B301] shrink-0" />
                <span>يمكنك الرسم والكتابة مباشرة فوق ملف الـ PDF لاختيار الإجابات وتدوين الحلول.</span>
              </p>
              
              <button
                onClick={handleSubmitAssignment}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#1E4FD8] hover:bg-blue-700 dark:bg-[#4C7CFF] dark:hover:bg-blue-600 text-white px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                تسليم الواجب الآن
              </button>
            </div>
          ) : (
            /* Read-Only Status Banner */
            <div className="w-full flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0D1B3E] dark:text-white">نتيجة التسليم:</span>
                {submission?.status === 'graded' ? (
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    الدرجة: {submission.grade} من {submission.maxGrade || 20}
                  </span>
                ) : (
                  <span className="font-bold text-amber-500">تم التسليم - قيد المراجعة</span>
                )}
                {submission?.teacherNotes && (
                  <span className="text-slate-600 dark:text-slate-300 italic">
                    "الملاحظات: {submission.teacherNotes}"
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-[#0D1B3E] dark:text-white hover:bg-slate-300"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>

      </motion.div>

      {/* Popup Modal to add text annotation */}
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddText}
                className="px-5 py-2 text-xs font-bold bg-[#1E4FD8] text-white rounded-xl hover:bg-blue-700"
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
