import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  Award, 
  Key, 
  FileText, 
  Bell, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ShieldAlert, 
  LogOut, 
  Smartphone, 
  Download, 
  TrendingUp,
  Sparkles,
  BarChart3,
  Layers,
  HelpCircle,
  Clock,
  Send,
  Upload,
  Video,
  Image as ImageIcon,
  Copy,
  Check,
  FileCheck,
  Link,
  Film,
  Cloud,
  RefreshCw,
  Youtube,
  Play,
  Info,
  ExternalLink,
  Eye,
  Trophy,
  Stethoscope,
  MessageCircle,
  Calendar,
  Zap,
  Bot,
  Brain,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Sliders,
  GripVertical,
  Wallet,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { MediaStore } from '../services/mediaStore';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { PdfViewerModal } from './PdfViewerModal';
import { AdminWalletTab } from './AdminWalletTab';
import { AdminAuditLogTab } from './AdminAuditLogTab';
import { AdminCommentsTab } from './AdminCommentsTab';
import { AdminReportsExportTab } from './AdminReportsExportTab';
import { AdminAssignmentsTab } from './AdminAssignmentsTab';
import { downloadPdfFile, resolvePdfUrl } from '../utils/pdfHelper';
import { 
  Student, 
  Course, 
  QuizExam, 
  ActivationCode, 
  PdfMaterial, 
  NotificationItem, 
  ExamAttempt, 
  PlatformSettings, 
  GradeLevel,
  Question,
  Unit,
  Lesson,
  WeeklyChallenge,
  StudentWeaknessProfile
} from '../types';

interface AdminDashboardProps {
  onNavigate: (view: string, params?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'courses'
    | 'exams'
    | 'students'
    | 'codes'
    | 'pdfs'
    | 'results'
    | 'challenges'
    | 'leaderboard-admin'
    | 'weakness-admin'
    | 'ai-admin'
    | 'notifs'
    | 'settings'
    | 'wallet-admin'
    | 'audit-admin'
    | 'comments-admin'
    | 'reports-export'
    | 'assignments-admin'
  >('overview');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<QuizExam[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [pdfs, setPdfs] = useState<PdfMaterial[]>([]);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>(StorageService.getWeeklyChallenges());
  const [settings, setSettings] = useState<PlatformSettings>(StorageService.getSettings());

  // Modals / Sub-forms
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExam, setEditingExam] = useState<QuizExam | null>(null);
  const [editingPdf, setEditingPdf] = useState<PdfMaterial | null>(null);
  const [showAddCode, setShowAddCode] = useState(false);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [selectedWeaknessStudent, setSelectedWeaknessStudent] = useState<Student | null>(null);
  const [selectedAnalyticsStudent, setSelectedAnalyticsStudent] = useState<Student | null>(null);
  const [quickRechargeAmount, setQuickRechargeAmount] = useState<string>('100');
  const [quickCourseSelect, setQuickCourseSelect] = useState<string>('');
  const [quickPrivateNotifMsg, setQuickPrivateNotifMsg] = useState<string>('');
  const [dateUpdateFeedback, setDateUpdateFeedback] = useState<string | null>(null);
  const [photoUpdateFeedback, setPhotoUpdateFeedback] = useState<string | null>(null);
  
  // Leaderboard Bonus Points Modal State
  const [bonusStudentId, setBonusStudentId] = useState<string>('');
  const [bonusPointsVal, setBonusPointsVal] = useState<number>(50);
  const [bonusReasonTitle, setBonusReasonTitle] = useState<string>('مكافأة التفوق الفيزيائي الإضافية');
  const [showBonusModal, setShowBonusModal] = useState(false);

  // AI Assistant Admin State
  const [aiSystemInstruction, setAiSystemInstruction] = useState<string>(
    'أنت معلم وخبير مادة الفيزياء للثانوية العامة المصري. أجب بدقة علمية وتبسيط مميز، ووضح الخطوات والقوانين والقواعد الرياضية المعنية.'
  );
  const [testAiPrompt, setTestAiPrompt] = useState<string>('');
  const [testAiResult, setTestAiResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Challenge Form State
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    grade: 'الصف الثالث الثانوي (ثانوية عامة)',
    bonusPoints: 50,
    validityDays: 7,
    qText: '',
    opt1: '',
    opt2: '',
    opt3: '',
    opt4: '',
    correctIdx: 0,
    explanation: ''
  });
  const [showAddPdf, setShowAddPdf] = useState(false);
  const [showAddNotif, setShowAddNotif] = useState(false);
  const [selectedCourseForUnits, setSelectedCourseForUnits] = useState<Course | null>(null);

  // Student Search
  const [studentSearch, setStudentSearch] = useState('');

  // Mobile Drawer & Chart Controls
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'month' | 'week' | 'all'>('month');
  const [activeChartPointIdx, setActiveChartPointIdx] = useState<number | null>(null);

  // Admin PDF Preview Modal State
  const [adminPreviewPdf, setAdminPreviewPdf] = useState<PdfMaterial | null>(null);

  // Overview Layout Reorder & Placement Customization State (Saved to localStorage)
  const defaultSectionOrder = ['stats_cards', 'chart_activity', 'bento_actions', 'countdown_control'];
  const [overviewSectionOrder, setOverviewSectionOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_overview_order_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return defaultSectionOrder;
  });
  const [isCustomizeLayoutMode, setIsCustomizeLayoutMode] = useState<boolean>(false);

  const moveSection = (key: string, direction: 'up' | 'down') => {
    const idx = overviewSectionOrder.indexOf(key);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= overviewSectionOrder.length) return;
    const next = [...overviewSectionOrder];
    const [removed] = next.splice(idx, 1);
    next.splice(targetIdx, 0, removed);
    setOverviewSectionOrder(next);
    localStorage.setItem('admin_overview_order_v1', JSON.stringify(next));
  };

  const resetSectionOrder = () => {
    setOverviewSectionOrder(defaultSectionOrder);
    localStorage.setItem('admin_overview_order_v1', JSON.stringify(defaultSectionOrder));
  };

  // Course Form
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    grade: GradeLevel.GRADE_12,
    instructorName: settings.instructorTitle,
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
    price: 250
  });

  // Unit / Lesson Form
  const [unitTitle, setUnitTitle] = useState('');
  const [lessonForm, setLessonForm] = useState({
    unitId: '',
    title: '',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoType: 'youtube' as const,
    durationMinutes: 45,
    description: '',
    pdfUrl: '',
    pdfTitle: '',
    isFreePreview: false
  });

  // Exam Form
  const [examForm, setExamForm] = useState({
    title: '',
    courseId: '',
    grade: GradeLevel.GRADE_12,
    durationMinutes: 30,
    passingPercentage: 60,
    type: 'quiz' as const,
    questions: [
      {
        id: 'q-1',
        text: 'ما هي وحدة قياس شدة التيار الكهربي في النظام الدولي؟',
        options: ['الفولت (V)', 'الأمبير (A)', 'الأوم (Ω)', 'الجول (J)'],
        correctOptionIndex: 1,
        explanation: 'يقاس التيار بوحدة الأمبير وهي تكافئ كولوم/ثانية.',
        points: 1
      }
    ]
  });

  // Code Generator Form
  const [codeGenForm, setCodeGenForm] = useState({
    targetType: 'course' as const,
    targetId: '',
    count: 5,
    expiresInDays: 365
  });

  // PDF Form
  const [pdfForm, setPdfForm] = useState({
    title: '',
    description: '',
    grade: GradeLevel.GRADE_12,
    category: 'مذكرات الشرح',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pageCount: 35,
    fileSize: '6.4 MB',
    isFree: false,
    isLocked: true,
    price: 50,
    associatedCourseId: ''
  });

  // Notification Form
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    targetType: 'all' as 'all' | 'grade' | 'student',
    targetGrade: 'all',
    targetStudentId: ''
  });

  // Manual Question Creator State
  const [newQuestionForm, setNewQuestionForm] = useState({
    text: '',
    image: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctOptionIndex: 0,
    explanation: '',
    points: 1
  });

  // Add Question to Exam Form
  const handleAddQuestionToExam = () => {
    if (!newQuestionForm.text.trim() || !newQuestionForm.option0.trim() || !newQuestionForm.option1.trim()) {
      alert('يرجى كتابة نص السؤال وخيارين على الأقل');
      return;
    }

    const options = [
      newQuestionForm.option0.trim(),
      newQuestionForm.option1.trim(),
      newQuestionForm.option2.trim() || 'خيار إضافي',
      newQuestionForm.option3.trim() || 'خيار إضافي'
    ];

    const newQ: Question = {
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      text: newQuestionForm.text.trim(),
      options,
      correctOptionIndex: Number(newQuestionForm.correctOptionIndex) || 0,
      explanation: newQuestionForm.explanation.trim() || undefined,
      image: newQuestionForm.image.trim() || undefined,
      points: Number(newQuestionForm.points) || 1
    };

    setExamForm({
      ...examForm,
      questions: [...examForm.questions, newQ]
    });

    // Reset question builder form
    setNewQuestionForm({
      text: '',
      image: '',
      option0: '',
      option1: '',
      option2: '',
      option3: '',
      correctOptionIndex: 0,
      explanation: '',
      points: 1
    });
  };

  const handleRemoveQuestionFromExam = (questionIndex: number) => {
    const updated = examForm.questions.filter((_, idx) => idx !== questionIndex);
    setExamForm({ ...examForm, questions: updated });
  };

  // Generated Codes Modal & Copy States
  const [recentlyGeneratedCodes, setRecentlyGeneratedCodes] = useState<ActivationCode[]>([]);
  const [showGeneratedSuccessModal, setShowGeneratedSuccessModal] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // File upload state / previews / guide modal
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [showVideoGuideModal, setShowVideoGuideModal] = useState(false);

  // Helper for reading files as base64
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to normalize and convert cloud drive / external image links to direct viewable URLs
  const normalizeImageUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    let url = rawUrl.trim();
    
    // Handle Google Drive links (convert to direct content URL)
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
      }
    }

    // Handle Dropbox links
    if (url.includes('dropbox.com')) {
      return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    return url;
  };

  // Helper for compressing images on client to Base64 (to ensure universal cloud persistence for all users worldwide)
  const compressImageFile = (file: File, maxDimension = 800, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          const isPng = file.type === 'image/png';
          ctx.drawImage(img, 0, 0, width, height);
          const mime = isPng ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Robust File Uploader with API backend & graceful cloud / IndexedDB fallbacks
  const handleFileUpload = async (
    file: File, 
    type: 'image' | 'video' | 'pdf', 
    onSuccess: (url: string, fileName?: string, fileSizeFormatted?: string) => void
  ) => {
    setIsUploadingFile(true);
    const typeLabel = type === 'video' ? 'الفيديو' : type === 'pdf' ? 'ملف الـ PDF' : 'الصورة';
    const mbSize = (file.size / (1024 * 1024)).toFixed(1);
    setUploadProgressText(`جارٍ معالجة ${typeLabel} (${mbSize} MB)...`);

    // 1. Try uploading to server API first so it gets a clean static URL
    try {
      const formData = new FormData();
      formData.append('file', file);

      const adminToken = StorageService.getAdminToken();
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.url) {
          setIsUploadingFile(false);
          setUploadProgressText('');
          onSuccess(resData.url, resData.originalName || file.name, resData.sizeFormatted);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Server upload not reachable, continuing to fallback...', err);
    }

    // 2. Fallback for images: client-side compression to lightweight base64
    if (type === 'image') {
      try {
        const compressedDataUrl = await compressImageFile(file, 900, 0.85);
        setIsUploadingFile(false);
        setUploadProgressText('');
        const sizeFormatted = `${Math.round(compressedDataUrl.length / 1024)} KB`;
        onSuccess(compressedDataUrl, file.name, sizeFormatted);
        return;
      } catch (imgErr) {
        console.warn('Image compression fallback error:', imgErr);
      }
    }

    // 3. Fallback for videos/PDFs: MediaStore (IndexedDB)
    try {
      const mediaId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mediaKey = await MediaStore.saveMedia(mediaId, file, file.name);
      setIsUploadingFile(false);
      setUploadProgressText('');
      const sizeFormatted = `${mbSize} MB`;
      onSuccess(mediaKey, file.name, sizeFormatted);
      return;
    } catch (dbErr) {
      console.warn('IndexedDB save failed, trying dataUrl fallback...', dbErr);
    }

    // 4. Raw DataURL fallback for small files
    if (file.size <= 5 * 1024 * 1024) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setIsUploadingFile(false);
        setUploadProgressText('');
        const sizeFormatted = `${mbSize} MB`;
        onSuccess(dataUrl, file.name, sizeFormatted);
        return;
      } catch (e) {
        // fallback failed
      }
    }

    setIsUploadingFile(false);
    setUploadProgressText('');

    if (type === 'video') {
      setShowVideoGuideModal(true);
    } else {
      alert(`الملف كبير (${mbSize} MB). يرجى استخدام رابط سحابي مباشر أو تقليل حجم الملف.`);
    }
  };

  // Copy single code
  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Copy all generated codes
  const handleCopyAllGeneratedCodes = () => {
    const allText = recentlyGeneratedCodes.map(c => `${c.code} (${c.targetName})`).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedCodeId('ALL');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Dynamic Real Statistics Engine for Overview Charts & Analytics (100% Real Live Data)
  const dynamicStats = (() => {
    const now = new Date();
    interface DataPoint {
      label: string;
      fullLabel: string;
      rawCount: number;
      displayValue: number;
      avgScore: number;
      examCount: number;
      studentCount: number;
    }
    const points: DataPoint[] = [];

    // Real metric totals across collections
    const totalStudentsCount = students.length;
    const totalAttemptsCount = attempts.length;
    const totalCoursesCount = courses.length;
    const totalExamsCount = exams.length;
    const totalPdfsCount = pdfs.length;
    const totalCodesCount = codes.length;
    const usedCodesCount = codes.filter(c => c.isUsed).length;

    // Real average score across all attempts
    const overallAvgScore = attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0) || 0), 0) / attempts.length)
      : 0;

    // Real pass rate (>50%)
    const passedAttempts = attempts.filter(a => {
      const pct = a.percentage || (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0);
      return pct >= 50;
    });
    const passRate = attempts.length > 0 ? Math.round((passedAttempts.length / attempts.length) * 100) : 0;

    // Total questions solved in real attempts
    const totalQuestionsAnswered = attempts.reduce((acc, a) => acc + (a.answers?.length || 0), 0);

    if (chartPeriod === 'week') {
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        const dayName = dayNames[d.getDay()];
        
        const dayAttempts = attempts.filter(a => a.submittedAt && a.submittedAt.slice(0, 10) === dateStr);
        const dayStudents = students.filter(s => s.registeredAt && s.registeredAt.slice(0, 10) === dateStr);
        const dayCodes = codes.filter(c => c.usedAt && c.usedAt.slice(0, 10) === dateStr);

        const realCount = dayAttempts.length + dayStudents.length + dayCodes.length;
        const avgScore = dayAttempts.length > 0
          ? Math.round(dayAttempts.reduce((acc, a) => acc + (a.percentage || (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0) || 0), 0) / dayAttempts.length)
          : 0;

        points.push({
          label: dayName,
          fullLabel: `${dayName} (${d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })})`,
          rawCount: realCount,
          displayValue: realCount,
          avgScore,
          examCount: dayAttempts.length,
          studentCount: dayStudents.length
        });
      }
    } else if (chartPeriod === 'month') {
      // 6 intervals across 30 days
      for (let i = 5; i >= 0; i--) {
        const daysAgo = i * 5;
        const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const label = `${d.getDate()} ${d.toLocaleDateString('ar-EG', { month: 'short' })}`;
        const startDay = new Date(d.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const endDay = d.toISOString().slice(0, 10);

        const intervalAttempts = attempts.filter(a => a.submittedAt && a.submittedAt.slice(0, 10) >= startDay && a.submittedAt.slice(0, 10) <= endDay);
        const intervalStudents = students.filter(s => s.registeredAt && s.registeredAt.slice(0, 10) >= startDay && s.registeredAt.slice(0, 10) <= endDay);
        const intervalCodes = codes.filter(c => c.usedAt && c.usedAt.slice(0, 10) >= startDay && c.usedAt.slice(0, 10) <= endDay);
        const realCount = intervalAttempts.length + intervalStudents.length + intervalCodes.length;

        const avgScore = intervalAttempts.length > 0
          ? Math.round(intervalAttempts.reduce((acc, a) => acc + (a.percentage || (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0) || 0), 0) / intervalAttempts.length)
          : 0;

        points.push({
          label,
          fullLabel: `الفترة حتى ${label}`,
          rawCount: realCount,
          displayValue: realCount,
          avgScore,
          examCount: intervalAttempts.length,
          studentCount: intervalStudents.length
        });
      }
    } else {
      // All time (6 Months)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('ar-EG', { month: 'short' });

        const monthAttempts = attempts.filter(a => a.submittedAt && a.submittedAt.startsWith(yearMonth));
        const monthStudents = students.filter(s => s.registeredAt && s.registeredAt.startsWith(yearMonth));
        const monthCodes = codes.filter(c => c.usedAt && c.usedAt.startsWith(yearMonth));
        const realCount = monthAttempts.length + monthStudents.length + monthCodes.length;

        const avgScore = monthAttempts.length > 0
          ? Math.round(monthAttempts.reduce((acc, a) => acc + (a.percentage || (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0) || 0), 0) / monthAttempts.length)
          : 0;

        points.push({
          label,
          fullLabel: `${label} ${d.getFullYear()}`,
          rawCount: realCount,
          displayValue: realCount,
          avgScore,
          examCount: monthAttempts.length,
          studentCount: monthStudents.length
        });
      }
    }

    // Dynamic SVG Coordinates calculation
    const rawMax = Math.max(...points.map(p => p.displayValue), 0);
    const maxVal = rawMax === 0 ? 10 : Math.ceil(rawMax * 1.25);
    const minVal = 0;
    const yRange = 110; // from Y=35 to Y=145
    const minY = 35;
    const maxY = 145;

    const svgPoints = points.map((p, idx) => {
      const x = 60 + idx * ((470 - 60) / (points.length - 1));
      const normalized = (p.displayValue - minVal) / (maxVal - minVal || 1);
      const y = maxY - normalized * yRange;
      return { ...p, x, y };
    });

    // Create Smooth Bezier Path
    let pathD = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const curr = svgPoints[i];
      const next = svgPoints[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${svgPoints[svgPoints.length - 1].x} 160 L ${svgPoints[0].x} 160 Z`;
    const totalInteractions = points.reduce((acc, p) => acc + p.displayValue, 0);
    const totalRealAttempts = attempts.length;
    const totalRealStudents = students.length;

    // Real growth calculation comparing recent half vs previous half of points
    const mid = Math.floor(points.length / 2);
    const prevHalf = points.slice(0, mid).reduce((acc, p) => acc + p.displayValue, 0);
    const recentHalf = points.slice(mid).reduce((acc, p) => acc + p.displayValue, 0);
    const realGrowthPercent = prevHalf > 0 
      ? Math.round(((recentHalf - prevHalf) / prevHalf) * 100)
      : (recentHalf > 0 ? 100 : 0);

    return {
      points: svgPoints,
      pathD,
      areaD,
      maxVal,
      totalInteractions,
      totalRealAttempts,
      totalRealStudents,
      overallAvgScore,
      passRate,
      totalQuestionsAnswered,
      totalCoursesCount,
      totalExamsCount,
      totalPdfsCount,
      totalCodesCount,
      usedCodesCount,
      growthPercent: realGrowthPercent
    };
  })();

  useEffect(() => {
    const update = () => {
      setStudents(StorageService.getStudents());
      setCourses(StorageService.getCourses());
      setExams(StorageService.getExams());
      setCodes(StorageService.getCodes());
      setPdfs(StorageService.getPdfs());
      setNotifs(StorageService.getNotifications());
      setAttempts(StorageService.getAttempts());
      setSettings(StorageService.getSettings());
    };
    update();
    return subscribeToStorage(update);
  }, []);

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleForceSyncCloud = async () => {
    setIsSyncingCloud(true);
    const success = await StorageService.forceSyncAllToFirestore();
    setIsSyncingCloud(false);
    if (success) {
      setSyncFeedback('تمت مزامنة جميع الكورسات والبيانات سحابياً مع Firestore بنجاح');
    } else {
      setSyncFeedback('حدث خطأ أثناء المزامنة السحابية. يرجى المحاولة لاحقاً');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleLogout = () => {
    StorageService.logoutAdmin();
    onNavigate('home');
  };

  // Add Course Handler
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title) return;
    StorageService.createCourse({
      title: courseForm.title,
      description: courseForm.description,
      grade: courseForm.grade,
      instructorName: courseForm.instructorName || settings.instructorTitle,
      thumbnail: courseForm.thumbnail,
      price: Number(courseForm.price) || 200,
      units: []
    });
    setShowAddCourse(false);
    setCourseForm({
      title: '',
      description: '',
      grade: GradeLevel.GRADE_12,
      instructorName: settings.instructorTitle,
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
      price: 250
    });
  };

  // Add Unit
  const handleAddUnit = (courseId: string) => {
    if (!unitTitle.trim()) return;
    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) return;

    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      courseId,
      title: unitTitle.trim(),
      order: (targetCourse.units?.length || 0) + 1,
      lessons: []
    };

    const updatedUnits = [...(targetCourse.units || []), newUnit];
    StorageService.updateCourse(courseId, { units: updatedUnits });
    setUnitTitle('');
  };

  // Add Lesson to Unit
  const handleAddLesson = (courseId: string, unitId: string) => {
    if (!lessonForm.title) return;
    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) return;

    const targetUnit = targetCourse.units?.find(u => u.id === unitId);
    if (!targetUnit) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      courseId,
      unitId,
      title: lessonForm.title,
      description: lessonForm.description,
      videoUrl: lessonForm.videoUrl,
      videoType: lessonForm.videoType,
      durationMinutes: Number(lessonForm.durationMinutes) || 45,
      order: (targetUnit.lessons?.length || 0) + 1,
      isFreePreview: lessonForm.isFreePreview,
      pdfUrl: lessonForm.pdfUrl || undefined,
      pdfTitle: lessonForm.pdfTitle || undefined
    };

    const updatedUnits = targetCourse.units.map(u => {
      if (u.id === unitId) {
        return { ...u, lessons: [...(u.lessons || []), newLesson] };
      }
      return u;
    });

    StorageService.updateCourse(courseId, { units: updatedUnits });
    setLessonForm({
      unitId: '',
      title: '',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoType: 'youtube',
      durationMinutes: 45,
      description: '',
      pdfUrl: '',
      pdfTitle: '',
      isFreePreview: false
    });
  };

  // Delete Course
  const handleDeleteCourse = (courseId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الكورس؟')) {
      StorageService.deleteCourse(courseId);
      if (selectedCourseForUnits?.id === courseId) setSelectedCourseForUnits(null);
    }
  };

  // Create Exam
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title) return;

    StorageService.createExam({
      title: examForm.title,
      courseId: examForm.courseId || undefined,
      grade: examForm.grade,
      durationMinutes: Number(examForm.durationMinutes) || 30,
      passingPercentage: Number(examForm.passingPercentage) || 60,
      type: examForm.type,
      questions: examForm.questions
    });

    setShowAddExam(false);
    setExamForm({
      title: '',
      courseId: '',
      grade: GradeLevel.GRADE_12,
      durationMinutes: 30,
      passingPercentage: 60,
      type: 'quiz',
      questions: [
        {
          id: 'q-1',
          text: 'ما هي وحدة قياس شدة التيار الكهربي في النظام الدولي؟',
          options: ['الفولت (V)', 'الأمبير (A)', 'الأوم (Ω)', 'الجول (J)'],
          correctOptionIndex: 1,
          explanation: 'يقاس التيار بوحدة الأمبير وهي تكافئ كولوم/ثانية.',
          points: 1
        }
      ]
    });
  };

  // Update & Link Exam to Course
  const handleUpdateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExam.title) return;

    StorageService.saveExam(editingExam);
    setEditingExam(null);
  };

  // Generate Codes in Bulk
  const handleGenerateCodes = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(codeGenForm.count) || 1;
    let targetId = codeGenForm.targetId;
    if (!targetId) {
      targetId = codeGenForm.targetType === 'course' ? 'ALL' : (pdfs[0]?.id || 'ALL_PDFS');
    }

    let targetName = 'كورس الفيزياء';
    if (codeGenForm.targetType === 'course') {
      if (targetId === 'ALL') {
        targetName = 'جميع كورسات المنصة (اشتراك شامل)';
      } else {
        const found = courses.find(c => c.id === targetId);
        targetName = found ? `${found.title} (${found.grade})` : 'كورس فيزياء';
      }
    } else {
      targetName = pdfs.find(p => p.id === targetId)?.title || 'مذكرة فيزياء';
    }

    const newCodes: ActivationCode[] = [];
    const prefix = codeGenForm.targetType === 'course' ? 'PHY' : 'PDF';

    for (let i = 0; i < count; i++) {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      newCodes.push({
        id: `code-${Date.now()}-${i}`,
        code: `${prefix}-${randomStr}-${randomNum}`,
        targetType: codeGenForm.targetType,
        targetId,
        targetName,
        isUsed: false,
        createdAt: new Date().toISOString()
      });
    }

    StorageService.createActivationCodes(newCodes);
    setRecentlyGeneratedCodes(newCodes);
    setShowAddCode(false);
    setShowGeneratedSuccessModal(true);
  };

  // Create PDF
  const handleCreatePdf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfForm.title) return;

    const isFree = pdfForm.isFree;
    StorageService.createPdf({
      title: pdfForm.title,
      description: pdfForm.description,
      grade: pdfForm.grade,
      category: pdfForm.category,
      url: pdfForm.url,
      fileUrl: pdfForm.url,
      pageCount: Number(pdfForm.pageCount) || 30,
      fileSize: pdfForm.fileSize || '5 MB',
      isFree: isFree,
      isLocked: isFree ? false : pdfForm.isLocked,
      price: isFree ? 0 : (Number(pdfForm.price) || 0),
      associatedCourseId: pdfForm.associatedCourseId || undefined
    });

    setShowAddPdf(false);
    setPdfForm({
      title: '',
      description: '',
      grade: GradeLevel.GRADE_12,
      category: 'مذكرات الشرح',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pageCount: 35,
      fileSize: '6.4 MB',
      isFree: false,
      isLocked: true,
      price: 50,
      associatedCourseId: ''
    });
  };

  // Update PDF
  const handleUpdatePdf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPdf || !editingPdf.title) return;

    const isFree = editingPdf.isFree ?? (!editingPdf.isLocked || editingPdf.price === 0);
    const updatedPdf: PdfMaterial = {
      ...editingPdf,
      isFree: isFree,
      isLocked: isFree ? false : editingPdf.isLocked,
      price: isFree ? 0 : (Number(editingPdf.price) || 0),
      fileUrl: editingPdf.url || editingPdf.fileUrl
    };

    StorageService.savePdfFile(updatedPdf);
    setEditingPdf(null);
  };

  // Send Notification Broadcast
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return;

    if (notifForm.targetType === 'student' && !notifForm.targetStudentId) {
      alert('يرجى اختيار الطالب المستهدف للإشعار الخاص.');
      return;
    }

    StorageService.sendNotification({
      title: notifForm.title,
      message: notifForm.message,
      target: notifForm.targetType === 'student' ? 'student' : (notifForm.targetType === 'grade' ? 'grade' : 'all'),
      targetGrade: notifForm.targetType === 'grade' && notifForm.targetGrade !== 'all' ? notifForm.targetGrade : undefined,
      targetStudentId: notifForm.targetType === 'student' ? notifForm.targetStudentId : undefined,
      readBy: []
    });

    setShowAddNotif(false);
    setNotifForm({ title: '', message: '', targetType: 'all', targetGrade: 'all', targetStudentId: '' });
    alert('تم إرسال الإشعار بنجاح!');
  };

  // Toggle Student Block
  const handleToggleBlockStudent = (student: Student) => {
    StorageService.updateStudent(student.id, { isBlocked: !student.isBlocked });
  };

  // Reset Student Devices
  const handleResetDevices = (student: Student) => {
    StorageService.updateStudent(student.id, { registeredDevices: [] });
    alert(`تم تفريغ الأجهزة المسجلة للطالب ${student.name} بنجاح.`);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    alert('تم حفظ إعدادات المنصة بنجاح.');
  };

  const formatForDatetimeInput = (dateStr?: string) => {
    if (!dateStr) return '2027-06-14T09:00';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '2027-06-14T09:00';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '2027-06-14T09:00';
    }
  };

  const handleExamDateUpdate = (val: string) => {
    if (!val) return;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const isoStr = d.toISOString();
        const updated = { ...settings, ministryExamDate: isoStr };
        setSettings(updated);
        StorageService.saveSettings(updated);
        setDateUpdateFeedback('تم حفظ وتطبيق موعد امتحان الفيزياء الجديد والعد التنازلي بنجاح!');
        setTimeout(() => setDateUpdateFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Invalid date string', e);
    }
  };

  const pendingDepositsCount = StorageService.getWalletTransactions().filter(t => t.type === 'deposit' && t.status === 'pending').length;
  const commentsCount = StorageService.getLessonComments().length;

  const tabCategories = [
    {
      title: 'لوحة القيادة والمتابعة',
      items: [
        { id: 'overview', label: 'الرئيسية والإحصائيات', icon: BarChart3, badge: null },
        { id: 'wallet-admin', label: 'المحفظة وبوابات الدفع', icon: Wallet, badge: pendingDepositsCount > 0 ? pendingDepositsCount : null },
        { id: 'reports-export', label: 'تصدير التقارير (Excel)', icon: FileSpreadsheet, badge: null },
        { id: 'results', label: 'نتائج وتقارير الطلاب', icon: Award, badge: attempts.length > 0 ? attempts.length : null },
        { id: 'audit-admin', label: 'سجل نشاط الإدارة', icon: ShieldCheck, badge: null },
        { id: 'notifs', label: 'مركز الإشعارات', icon: Bell, badge: notifs.length > 0 ? notifs.length : null },
        { id: 'settings', label: 'إعدادات المنصة', icon: Settings, badge: null }
      ]
    },
    {
      title: 'المحتوى والملازم والتعليقات',
      items: [
        { id: 'courses', label: 'الكورسات والدروس', icon: BookOpen, badge: courses.length },
        { id: 'assignments-admin', label: 'واجبات الـ PDF والتصحيح', icon: Edit3, badge: StorageService.getAssignmentSubmissions().filter(s => s.status === 'pending').length || null },
        { id: 'comments-admin', label: 'استفسارات الطلاب', icon: MessageSquare, badge: commentsCount > 0 ? commentsCount : null },
        { id: 'exams', label: 'بنك الأسئلة والامتحانات', icon: HelpCircle, badge: exams.length },
        { id: 'pdfs', label: 'المذكرات والملازم PDF', icon: FileText, badge: pdfs.length }
      ]
    },
    {
      title: 'شؤون الطلاب والاشتراكات',
      items: [
        { id: 'students', label: 'سجل الطلاب والأجهزة', icon: Users, badge: students.length },
        { id: 'codes', label: 'أكواد التفعيل والشحن', icon: Key, badge: codes.filter(c => !c.isUsed).length }
      ]
    },
    {
      title: 'المسابقات والذكاء الاصطناعي',
      items: [
        { id: 'challenges', label: 'تحديات الأسبوع والمسابقات', icon: Trophy, badge: challenges.length },
        { id: 'leaderboard-admin', label: 'لوحة الشرف وتكريم الأوائل', icon: Award, badge: StorageService.getLeaderboard().length },
        { id: 'weakness-admin', label: 'تشخيص نقاط الضعف', icon: Brain, badge: null },
        { id: 'ai-admin', label: 'المساعد الذكي AI', icon: Bot, badge: 'نشط' }
      ]
    }
  ];

  const sendParentWhatsappReport = (student: Student) => {
    const studentAttempts = attempts.filter(a => a.studentId === student.id);
    const totalAttempts = studentAttempts.length;
    const avgPercentage = totalAttempts > 0 
      ? Math.round(studentAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempts)
      : 0;
    const weaknessProfile = StorageService.getStudentWeaknessProfile(student.id);
    const weakConceptsText = weaknessProfile.weakPoints.length > 0
      ? weaknessProfile.weakPoints.slice(0, 4).map(w => `• ${w.conceptName} (${w.chapterOrUnit})`).join('\n')
      : '• لا توجد نقاط ضعف مسجلة حالياً (أداء ممتاز بجدارة)';

    const message = `السلام عليكم ورحمة الله وبركاته
تقرير ولي الأمر المعتمد للطالب/ة: *${student.name}*
منصة: *${settings.platformName}*
المعلم: *${settings.instructorTitle}*

**ملخص الأداء والمشاركات:**
• الكورسات المفعلة: ${student.enrolledCourseIds?.length || 0} كورس
• عدد الاختبارات المكتملة: ${totalAttempts} اختبار
• متوسط التقدير العام: *${avgPercentage}%*

**النقاط والمفاهيم الجاري تركيز المراجعة عليها:**
${weakConceptsText}

**توجيهات المعلم:**
نحث الطالب على استكمال مراجعة الفيديوهات الموصى بها وحل تحديات الأسبوع الفيزيائية لرفع مستواه وتحقيق 60/60.

لأي استفسار التواصل مع الإدارة: ${settings.whatsappNumber}`;

    const encoded = encodeURIComponent(message);
    const phoneDigits = student.phone.replace(/[^0-9]/g, '');
    const fullPhone = phoneDigits.startsWith('0') ? '2' + phoneDigits : phoneDigits;
    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.phone.includes(studentSearch)
  );

  const currentTabInfo = tabCategories.flatMap(c => c.items).find(i => i.id === activeTab);

  const handleOpenSupportWhatsapp = () => {
    const whatsappNum = settings.whatsappNumber || '01000000000';
    const cleanNum = whatsappNum.replace(/[^0-9]/g, '');
    const phone = cleanNum.startsWith('0') ? '2' + cleanNum : cleanNum;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent('السلام عليكم، استفسار بخصوص الدعم الفني للوحة إدارة منصة ويكيفزياء')}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0D1B3E] pb-20 lg:pb-12 animate-in fade-in duration-300 selection:bg-[#1E4FD8] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* 1. TOP EXECUTIVE HEADER BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            
            {/* Right in RTL: Mobile Hamburger + Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-[#F5F7FA] text-[#0D1B3E] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E4FD8]"
                aria-label="فتح القائمة الرئيسية"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Brand Logo & Platform Title */}
              <div 
                className="flex items-center gap-3 cursor-pointer select-none group transition-transform hover:scale-[1.01]"
                onClick={() => setActiveTab('overview')}
                title="العودة إلى النظرة العامة للوحة التحكم"
              >
                <Logo size="md" showSubtitle={true} />
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-blue-50 text-[#1E4FD8] border border-blue-200 px-2.5 py-1 rounded-xl shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1E4FD8]" />
                  لوحة الإدارة التنفيذية
                </span>
              </div>
            </div>

            {/* Admin Session Badge on Desktop */}
            <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E4FD8] text-white font-black text-xs shadow-xs">
                ADMIN
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0D1B3E]">المسؤول العام (Super Admin)</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-0.5">منصة {settings.platformName || 'ويكيفزياء'} للفيزياء الحديثة</p>
              </div>
            </div>

            {/* Left in RTL: Action Buttons (Firestore Sync, Theme Toggle, Student View, Logout) */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <ThemeToggle />

              <button
                onClick={handleForceSyncCloud}
                disabled={isSyncingCloud}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs disabled:opacity-50"
                title="مزامنة فورية لكل البيانات مع قاعدة بيانات Firebase Firestore"
              >
                <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingCloud ? 'جارٍ المزامنة...' : 'مزامنة السحابة'}</span>
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-50 transition-colors shadow-xs"
                title="معاينة الواجهة كما يراها الطالب"
              >
                <Eye className="h-3.5 w-3.5 text-[#1E4FD8] shrink-0" />
                <span className="hidden sm:inline">معاينة كطالب</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs"
                title="تسجيل الخروج من لوحة التحكم"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. MOBILE SLIDE-OVER DRAWER (RTL Slide-In) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-white border-r border-slate-200 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 z-10">
            
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Logo size="sm" showSubtitle={false} />
                  <span className="text-[10px] font-bold bg-blue-50 text-[#1E4FD8] border border-blue-200 px-2 py-0.5 rounded-full">
                    لوحة الإدارة
                  </span>
                </div>

                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#0D1B3E] hover:bg-slate-100 transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categorized Navigation List */}
              <nav className="space-y-4 pt-1">
                {tabCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider px-2 block mb-1">
                      {cat.title}
                    </span>
                    <div className="space-y-1">
                      {cat.items.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id as any);
                              setIsMobileDrawerOpen(false);
                            }}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-right ${
                              isActive
                                ? 'bg-[#1E4FD8] text-white shadow-sm'
                                : 'text-[#0D1B3E] hover:bg-[#F5F7FA]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 truncate">
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#1E4FD8]'}`} />
                              <span className="truncate">{tab.label}</span>
                            </div>
                            {tab.badge !== null && tab.badge !== undefined && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-[#0D1B3E] border border-slate-200'
                              }`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Bottom Support Widget in Drawer */}
            <div className="pt-4 border-t border-slate-200 mt-6">
              <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 space-y-2 text-center">
                <p className="font-bold text-[#0D1B3E] text-xs">تواصل سريع</p>
                <p className="text-[11px] text-[#6B7280]">تحتاج مساعدة؟ تواصل معنا لأي استفسار أو دعم فني</p>
                <button
                  onClick={handleOpenSupportWhatsapp}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1E4FD8] hover:bg-[#163cb5] text-white py-2 text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>راسل الدعم</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE WRAPPER */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Cloud Sync & Upload Feedback Alerts */}
        {syncFeedback && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{syncFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">Firebase Firestore Active</span>
          </div>
        )}

        {isUploadingFile && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-800 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-[#1E4FD8] shrink-0" />
              <div>
                <p className="font-bold text-[#0D1B3E] text-xs sm:text-sm">{uploadProgressText || 'جارٍ معالجة ورفع الملف...'}</p>
                <p className="text-[10px] sm:text-[11px] text-[#6B7280]">يتم حفظ الملف ليعمل بسرعة فائقة لدى جميع الطلاب</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-[#1E4FD8] shrink-0">جاري الحفظ...</span>
          </div>
        )}

        {/* 2-Column Responsive Layout: Content on Left / Sidebar on Right (RTL standard) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* DESKTOP PERMANENT SIDEBAR (Hidden on Mobile) */}
          <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-24 space-y-4">
            
            {/* Sidebar Branding / Header Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E4FD8] text-white font-black text-xl shadow-xs">
                  Ψ
                </div>
                <div>
                  <h3 className="font-black text-[#0D1B3E] text-base leading-tight">{settings.platformName || 'ويكيـفيزياء'}</h3>
                  <p className="text-xs text-[#6B7280] font-medium">لوحة القيادة</p>
                </div>
              </div>

              {/* Categorized Nav Groups */}
              <nav className="space-y-4 pt-2 border-t border-slate-200">
                {tabCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider px-2 block mb-1">
                      {cat.title}
                    </span>
                    <div className="space-y-0.5">
                      {cat.items.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all text-right ${
                              isActive
                                ? 'bg-[#1E4FD8] text-white shadow-xs'
                                : 'text-[#0D1B3E] hover:bg-[#F5F7FA]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#1E4FD8]'}`} />
                              <span className="truncate">{tab.label}</span>
                            </div>
                            {tab.badge !== null && tab.badge !== undefined && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-[#0D1B3E] border border-slate-200'
                              }`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Support Quick Contact Box */}
              <div className="mt-5 pt-3 border-t border-slate-200">
                <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3 space-y-2 text-center">
                  <p className="font-bold text-[#0D1B3E] text-xs">تواصل سريع</p>
                  <p className="text-[10px] text-[#6B7280] leading-tight">تحتاج مساعدة؟ تواصل معنا لأي استفسار أو دعم فني</p>
                  <button
                    onClick={handleOpenSupportWhatsapp}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white py-1.5 text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>راسل الدعم</span>
                  </button>
                </div>
              </div>

            </div>

          </aside>

          {/* MAIN STAGE CONTENT */}
          <main className="flex-1 w-full min-w-0 space-y-5">

            {/* Top Breadcrumb & Active View Indicator (When not on overview) */}
            {activeTab !== 'overview' && (
              <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {currentTabInfo && (
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#1E4FD8]">
                      <currentTabInfo.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E4FD8]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] truncate">
                      <span className="cursor-pointer hover:text-[#0D1B3E]" onClick={() => setActiveTab('overview')}>الرئيسية</span>
                      <span>/</span>
                      <span className="text-[#1E4FD8] font-bold truncate">{currentTabInfo?.label || 'القسم'}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-[#0D1B3E] truncate">{currentTabInfo?.label}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F5F7FA] px-3 py-1.5 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-[#1E4FD8]" />
                    <span className="hidden sm:inline">الرئيسية</span>
                  </button>

                  {activeTab === 'courses' && (
                    <button
                      onClick={() => setShowAddCourse(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#F5B301] px-3 py-1.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#0D1B3E]" />
                      <span>إضافة كورس</span>
                    </button>
                  )}
                  {activeTab === 'exams' && (
                    <button
                      onClick={() => setShowAddExam(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#F5B301] px-3 py-1.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#0D1B3E]" />
                      <span>إنشاء امتحان</span>
                    </button>
                  )}
                  {activeTab === 'pdfs' && (
                    <button
                      onClick={() => setShowAddPdf(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#F5B301] px-3 py-1.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#0D1B3E]" />
                      <span>رفع ملزمة PDF</span>
                    </button>
                  )}
                  {activeTab === 'codes' && (
                    <button
                      onClick={() => setShowAddCode(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#F5B301] px-3 py-1.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#0D1B3E]" />
                      <span>توليد أكواد</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: OVERVIEW (DYNAMIC STATS + REORDERABLE LAYOUT) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* Section Header: Title & Layout Customization Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-[#0D1B3E] tracking-tight">نظرة عامة والتحليلات التنفيذية</h2>
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        بيانات حية
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">إحصائيات المنصة الحية، تقدم الطلاب، وتحليل التفاعل اللحظي</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCustomizeLayoutMode(!isCustomizeLayoutMode)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCustomizeLayoutMode 
                          ? 'bg-[#F5B301] text-[#0D1B3E] shadow-xs font-black' 
                          : 'bg-[#F5F7FA] hover:bg-slate-200 text-[#0D1B3E] border border-slate-200'
                      }`}
                      title="ترتيب أقسام الواجهة حسب رغبتك"
                    >
                      <Layers className="h-3.5 w-3.5 text-[#1E4FD8]" />
                      <span>{isCustomizeLayoutMode ? 'حفظ ترتيب الأقسام' : 'تخصيص ترتيب الأقسام'}</span>
                    </button>

                    {isCustomizeLayoutMode && (
                      <button
                        onClick={resetSectionOrder}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#F5F7FA] hover:bg-slate-200 text-[#0D1B3E] border border-slate-200 cursor-pointer"
                        title="إعادة الترتيب الافتراضي"
                      >
                        افتراضي
                      </button>
                    )}
                  </div>
                </div>

                {/* Reordering Helper Banner */}
                {isCustomizeLayoutMode && (
                  <div className="rounded-2xl border border-[#F5B301]/40 bg-[#F5B301]/10 p-3.5 flex items-center justify-between text-xs text-[#0D1B3E] animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-[#1E4FD8]" />
                      <span>وضع التخصيص مفعّل: استخدم أزرار السهمين (⬆ / ⬇) لنقل أي قسم لأعلى أو لأسفل، وسيتم حفظ الترتيب تلقائياً.</span>
                    </div>
                    <button 
                      onClick={() => setIsCustomizeLayoutMode(false)}
                      className="px-2.5 py-1 bg-[#F5B301] text-[#0D1B3E] font-black rounded-lg hover:bg-[#e0a401] text-[11px] cursor-pointer"
                    >
                      تم
                    </button>
                  </div>
                )}

                {/* DYNAMICALLY ORDERED OVERVIEW SECTIONS */}
                {overviewSectionOrder.map((sectionKey, index) => {
                  const isFirst = index === 0;
                  const isLast = index === overviewSectionOrder.length - 1;

                  const sectionLabels: Record<string, string> = {
                    stats_cards: '1. بطاقات الإحصائيات الأربعة الأساسية',
                    chart_activity: '2. الرسم البياني التفاعلي + آخر الأنشطة',
                    bento_actions: '3. شبكة الوصول السريع لإدارة المنصة',
                    countdown_control: '4. التحكم في موعد امتحان الفيزياء الوزاري'
                  };

                  return (
                    <div key={sectionKey} className="relative group/section space-y-3">
                      {/* Section Reorder Control Header (shown when customize mode is active) */}
                      {isCustomizeLayoutMode && (
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#0D1B3E] shadow-xs">
                          <span className="font-bold">{sectionLabels[sectionKey] || sectionKey}</span>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={isFirst}
                              onClick={() => moveSection(sectionKey, 'up')}
                              className="p-1 rounded bg-[#F5F7FA] hover:bg-[#1E4FD8] hover:text-white disabled:opacity-30 disabled:hover:bg-[#F5F7FA] disabled:hover:text-[#6B7280] transition-colors cursor-pointer"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => moveSection(sectionKey, 'down')}
                              className="p-1 rounded bg-[#F5F7FA] hover:bg-[#1E4FD8] hover:text-white disabled:opacity-30 disabled:hover:bg-[#F5F7FA] disabled:hover:text-[#6B7280] transition-colors cursor-pointer"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SECTION: STATS CARDS */}
                      {sectionKey === 'stats_cards' && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          
                          {/* Card 1: إجمالي الطلاب */}
                          <div 
                            onClick={() => setActiveTab('students')}
                            className="group cursor-pointer rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-[#1E4FD8]/40 hover:shadow-md transition-all shadow-xs"
                          >
                            <span className="text-[11px] font-bold text-[#6B7280] block">إجمالي الطلاب</span>
                            <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight font-mono">
                              {students.length > 0 ? students.length.toLocaleString('ar-EG') : '٠'}
                            </p>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">
                              {students.length > 0 ? `${students.length} طالب مسجل` : 'لا يوجد طلاب مسجلين'}
                            </p>
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-colors">
                                <Users className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#1E4FD8]">
                                {students.length > 0 ? `↑ ${Math.max(5, Math.min(30, students.length * 2))}% تفاعل` : 'جاهز للتسجيل'}
                              </span>
                            </div>
                          </div>

                          {/* Card 2: إجمالي الكورسات */}
                          <div 
                            onClick={() => setActiveTab('courses')}
                            className="group cursor-pointer rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-[#1E4FD8]/40 hover:shadow-md transition-all shadow-xs"
                          >
                            <span className="text-[11px] font-bold text-[#6B7280] block">إجمالي الكورسات</span>
                            <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight font-mono">
                              {courses.length.toLocaleString('ar-EG')}
                            </p>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">
                              {courses.reduce((acc, c) => acc + (c.units?.reduce((uacc, u) => uacc + (u.lessons?.length || 0), 0) || 0), 0)} درس متاح
                            </p>
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-colors">
                                <BookOpen className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#1E4FD8]">
                                {courses.length} كورس مفعل
                              </span>
                            </div>
                          </div>

                          {/* Card 3: إجمالي الامتحانات */}
                          <div 
                            onClick={() => setActiveTab('exams')}
                            className="group cursor-pointer rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-[#1E4FD8]/40 hover:shadow-md transition-all shadow-xs"
                          >
                            <span className="text-[11px] font-bold text-[#6B7280] block">إجمالي الامتحانات</span>
                            <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight font-mono">
                              {exams.length.toLocaleString('ar-EG')}
                            </p>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">
                              {attempts.length > 0 ? `${attempts.length} محاولة حل مسجلة` : 'امتحان متاح'}
                            </p>
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-colors">
                                <FileText className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
                                {attempts.length > 0 ? `${attempts.length} إجابة مصححة` : 'جاهز للاختبار'}
                              </span>
                            </div>
                          </div>

                          {/* Card 4: المسابقات النشطة والأكواد */}
                          <div 
                            onClick={() => setActiveTab('challenges')}
                            className="group cursor-pointer rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-[#1E4FD8]/40 hover:shadow-md transition-all shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[11px] font-bold text-[#6B7280] block">المسابقات والأكواد</span>
                              <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight font-mono">
                                {challenges.length.toLocaleString('ar-EG')}
                              </p>
                              <p className="text-[10px] text-[#6B7280] mt-0.5">
                                {codes.length > 0 ? `${codes.length} كود تفعيل متاح` : 'مسابقة جارية'}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                              <span className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-3 py-1 text-[10px] font-bold text-[#0D1B3E] group-hover:bg-[#1E4FD8] group-hover:border-[#1E4FD8] group-hover:text-white transition-colors">
                                إدارة الكل
                              </span>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* SECTION: CHART & LIVE ACTIVITIES */}
                      {sectionKey === 'chart_activity' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          
                          {/* Left Box in RTL: إحصائيات سريعة (Dynamic Interactive Area Chart) */}
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-black text-[#0D1B3E] text-sm sm:text-base">إحصائيات سريعة</h3>
                                  <p className="text-[11px] text-[#6B7280]">تحليل محاولات الامتحانات وتفاعل الطلاب الفعلي</p>
                                </div>
                                <div className="relative">
                                  <select 
                                    value={chartPeriod}
                                    onChange={(e) => setChartPeriod(e.target.value as any)}
                                    className="bg-[#F5F7FA] border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#0D1B3E] focus:outline-none focus:border-[#1E4FD8]"
                                  >
                                    <option value="month">هذا الشهر</option>
                                    <option value="week">هذا الأسبوع</option>
                                    <option value="all">كل الأوقات</option>
                                  </select>
                                </div>
                              </div>

                              {/* SVG Line / Area Wave Chart */}
                              <div className="w-full pt-2">
                                <svg viewBox="0 0 500 180" className="w-full h-36 sm:h-44 overflow-visible">
                                  <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#1E4FD8" stopOpacity="0.2" />
                                      <stop offset="100%" stopColor="#1E4FD8" stopOpacity="0.0" />
                                    </linearGradient>
                                  </defs>

                                  {/* Dynamic Grid Lines */}
                                  <line x1="40" y1="20" x2="490" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                                  <line x1="40" y1="55" x2="490" y2="55" stroke="#E2E8F0" strokeDasharray="3 3" />
                                  <line x1="40" y1="90" x2="490" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" />
                                  <line x1="40" y1="125" x2="490" y2="125" stroke="#E2E8F0" strokeDasharray="3 3" />
                                  <line x1="40" y1="160" x2="490" y2="160" stroke="#CBD5E1" />

                                  {/* Y-Axis Labels */}
                                  <text x="30" y="24" fill="#64748b" fontSize="10" textAnchor="end">{dynamicStats.maxVal}</text>
                                  <text x="30" y="59" fill="#64748b" fontSize="10" textAnchor="end">{Math.round(dynamicStats.maxVal * 0.75)}</text>
                                  <text x="30" y="94" fill="#64748b" fontSize="10" textAnchor="end">{Math.round(dynamicStats.maxVal * 0.5)}</text>
                                  <text x="30" y="129" fill="#64748b" fontSize="10" textAnchor="end">{Math.round(dynamicStats.maxVal * 0.25)}</text>
                                  <text x="30" y="163" fill="#64748b" fontSize="10" textAnchor="end">0</text>

                                  {/* Dynamic Area Fill */}
                                  <path
                                    d={dynamicStats.areaD}
                                    fill="url(#chartGradient)"
                                  />

                                  {/* Dynamic Smooth Main Line */}
                                  <path
                                    d={dynamicStats.pathD}
                                    fill="none"
                                    stroke="#1E4FD8"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                  />

                                  {/* Dynamic Data Points & Ticks */}
                                  {dynamicStats.points.map((pt, idx) => {
                                    const isSelected = activeChartPointIdx === idx;
                                    return (
                                      <g key={idx}>
                                        {/* Point Circle */}
                                        <circle 
                                          cx={pt.x} 
                                          cy={pt.y} 
                                          r={isSelected ? 6 : 4} 
                                          fill={isSelected ? '#F5B301' : '#1E4FD8'} 
                                          stroke="#ffffff" 
                                          strokeWidth={isSelected ? 2.5 : 1}
                                          className="cursor-pointer hover:scale-125 transition-transform"
                                          onMouseEnter={() => setActiveChartPointIdx(idx)}
                                          onClick={() => setActiveChartPointIdx(idx)}
                                        />

                                        {/* X-Axis Tick Label */}
                                        <text 
                                          x={pt.x} 
                                          y="175" 
                                          fill={isSelected ? '#1E4FD8' : '#64748b'} 
                                          fontSize="10" 
                                          fontWeight={isSelected ? 'bold' : 'normal'}
                                          textAnchor="middle"
                                        >
                                          {pt.label}
                                        </text>
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>

                              {/* Interactive Tooltip Callout */}
                              {activeChartPointIdx !== null && dynamicStats.points[activeChartPointIdx] && (
                                <div className="mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs animate-in fade-in">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#0D1B3E]">{dynamicStats.points[activeChartPointIdx].label}:</span>
                                    <span className="text-[#1E4FD8] font-mono font-bold">{dynamicStats.points[activeChartPointIdx].displayValue} تفاعل/محاولة</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                                    <span>الامتحانات: <strong className="text-[#0D1B3E]">{dynamicStats.points[activeChartPointIdx].examCount}</strong></span>
                                    <span>متوسط الدرجات: <strong className="text-emerald-700">{dynamicStats.points[activeChartPointIdx].avgScore}%</strong></span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-xl bg-[#F5F7FA] border border-slate-200">
                                  <span className="text-[10px] text-[#6B7280] block">متوسط الدرجات</span>
                                  <span className="text-xs sm:text-sm font-black text-[#1E4FD8] font-mono">
                                    {dynamicStats.overallAvgScore}%
                                  </span>
                                </div>
                                <div className="p-2 rounded-xl bg-[#F5F7FA] border border-slate-200">
                                  <span className="text-[10px] text-[#6B7280] block">نسبة النجاح</span>
                                  <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono">
                                    {dynamicStats.passRate}%
                                  </span>
                                </div>
                                <div className="p-2 rounded-xl bg-[#F5F7FA] border border-slate-200">
                                  <span className="text-[10px] text-[#6B7280] block">حلول مصححة</span>
                                  <span className="text-xs sm:text-sm font-black text-[#0D1B3E] font-mono">
                                    {dynamicStats.totalRealAttempts.toLocaleString('ar-EG')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <div>
                                  <span className="text-[10px] text-[#6B7280] block">إجمالي التفاعلات والمحاولات</span>
                                  <span className="text-sm sm:text-base font-black text-[#0D1B3E] font-mono">
                                    {dynamicStats.totalInteractions.toLocaleString('ar-EG')}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-emerald-700">
                                  {dynamicStats.growthPercent >= 0 ? `↑ ${dynamicStats.growthPercent}% نمو` : `${dynamicStats.growthPercent}%`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Box in RTL: آخر الأنشطة (Live Platform Activities) */}
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-black text-[#0D1B3E] text-sm sm:text-base">آخر الأنشطة الحية</h3>
                                <span className="text-[10px] font-bold text-[#1E4FD8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                  تحديث فوري
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                
                                {/* Activity 1: Student Registration */}
                                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] shrink-0">
                                      <Users className="h-4 w-4" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold text-[#0D1B3E] text-xs truncate">
                                        {students.length > 0 ? `تم تسجيل الطالب (${students[students.length - 1]?.name})` : 'تسجيل طالب جديد على المنصة'}
                                      </p>
                                      <p className="text-[10px] text-[#6B7280]">
                                        {students.length > 0 ? `${students[students.length - 1]?.phone || 'نشط'}` : 'جاهز لاستقبال الطلاب'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Activity 2: Exam Activity */}
                                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] shrink-0">
                                      <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold text-[#0D1B3E] text-xs truncate">
                                        {attempts.length > 0 
                                          ? `تم حل امتحان: ${attempts[0]?.examTitle} (${attempts[0]?.score}/${attempts[0]?.maxScore})` 
                                          : (exams.length > 0 ? `امتحان متاح: ${exams[0]?.title}` : 'بنك الأسئلة والامتحانات جاهز')}
                                      </p>
                                      <p className="text-[10px] text-[#6B7280]">
                                        {attempts.length > 0 ? `بواسطة ${attempts[0]?.studentName}` : 'متاح لجميع المراحل'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Activity 3: PDF / Content Activity */}
                                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                                    <div className="h-8 w-8 rounded-xl bg-[#F5B301]/20 flex items-center justify-center text-[#0D1B3E] shrink-0">
                                      <FileText className="h-4 w-4 text-[#0D1B3E]" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold text-[#0D1B3E] text-xs truncate">
                                        {pdfs.length > 0 ? `مذكرة منشورة: ${pdfs[0]?.title}` : 'المكتبة الإلكترونية ومذكرات الشرح'}
                                      </p>
                                      <p className="text-[10px] text-[#6B7280]">
                                        {pdfs.length > 0 ? `${pdfs[0]?.pageCount || 1} صفحة • ${pdfs[0]?.category}` : 'متاحة للتحميل والمعاينة'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Activity 4: Activation Codes Activity */}
                                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] shrink-0">
                                      <Key className="h-4 w-4" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold text-[#0D1B3E] text-xs truncate">
                                        {codes.length > 0 ? `نظام الأكواد: متاح ${codes.length} كود تفعيل` : 'نظام كروت الشحن والأكواد الرقمية'}
                                      </p>
                                      <p className="text-[10px] text-[#6B7280]">شحن فوري للكورسات والاشتراكات</p>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>

                            <button
                              onClick={() => setActiveTab('results')}
                              className="w-full mt-3 rounded-xl border border-slate-200 bg-[#F5F7FA] hover:bg-slate-200 py-2 text-xs font-bold text-[#1E4FD8] transition-colors cursor-pointer"
                            >
                              عرض كل النتائج والتقارير
                            </button>
                          </div>

                        </div>
                      )}

                      {/* SECTION: BENTO ACTION TILES (10 QUICK ACCESS MODULES) */}
                      {sectionKey === 'bento_actions' && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-base sm:text-lg font-black text-[#0D1B3E] tracking-tight">إدارة المنصة والخدمات</h3>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            
                            {/* 1. الطلاب والأجهزة */}
                            <button
                              onClick={() => setActiveTab('students')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">الطلاب والأجهزة</span>
                            </button>

                            {/* 2. الكورسات والدروس */}
                            <button
                              onClick={() => setActiveTab('courses')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">الكورسات والدروس</span>
                            </button>

                            {/* 3. بنك الأسئلة والامتحانات */}
                            <button
                              onClick={() => setActiveTab('exams')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">بنك الأسئلة والامتحانات</span>
                            </button>

                            {/* 4. المذكرات PDF */}
                            <button
                              onClick={() => setActiveTab('pdfs')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">المذكرات PDF</span>
                            </button>

                            {/* 5. إعدادات المنصة */}
                            <button
                              onClick={() => setActiveTab('settings')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">إعدادات المنصة</span>
                            </button>

                            {/* 6. أكواد التفعيل والشحن */}
                            <button
                              onClick={() => setActiveTab('codes')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Key className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">أكواد التفعيل والشحن</span>
                            </button>

                            {/* 7. تحديات الأسبوع والمسابقات */}
                            <button
                              onClick={() => setActiveTab('challenges')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">تحديات الأسبوع والمسابقات</span>
                            </button>

                            {/* 8. لوحة الشرف وتكريم الأوائل */}
                            <button
                              onClick={() => setActiveTab('leaderboard-admin')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">لوحة الشرف وتكريم الأوائل</span>
                            </button>

                            {/* 9. تشخيص نقاط الضعف */}
                            <button
                              onClick={() => setActiveTab('weakness-admin')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">تشخيص نقاط الضعف</span>
                            </button>

                            {/* 10. المساعد الذكي AI */}
                            <button
                              onClick={() => setActiveTab('ai-admin')}
                              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#1E4FD8]/50 hover:bg-[#F5F7FA] transition-all text-center shadow-xs cursor-pointer"
                            >
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-all">
                                <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <span className="font-bold text-[#0D1B3E] text-xs sm:text-sm">المساعد الذكي AI</span>
                            </button>

                          </div>
                        </div>
                      )}

                      {/* SECTION: MINISTRY EXAM COUNTDOWN CONTROLLER */}
                      {sectionKey === 'countdown_control' && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-2xl bg-[#F5B301]/20 flex items-center justify-center text-[#0D1B3E]">
                                <Clock className="h-5 w-5 text-[#1E4FD8]" />
                              </div>
                              <div>
                                <h3 className="font-black text-[#0D1B3E] text-sm sm:text-base">التحكم في موعد امتحان الفيزياء الوزاري والعد التنازلي</h3>
                                <p className="text-[11px] text-[#6B7280]">تعديل الموعد المعروض للطلاب في الواجهة الرئيسية فورياً</p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#1E4FD8] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                              ثانوية عامة 2027
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <input
                              type="datetime-local"
                              value={settings.examDate ? settings.examDate.substring(0, 16) : '2027-06-14T09:00'}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                const updated = { ...settings, examDate: newDate };
                                setSettings(updated);
                                StorageService.updateSettings(updated);
                              }}
                              className="w-full sm:w-auto flex-1 rounded-xl border border-slate-200 bg-[#F5F7FA] px-3 py-2 text-xs font-mono text-[#0D1B3E] focus:outline-none focus:border-[#1E4FD8] focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...settings, examDate: '2027-06-14T09:00' };
                                setSettings(updated);
                                StorageService.updateSettings(updated);
                              }}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#F5F7FA] border border-slate-200 hover:bg-slate-200 text-xs font-bold text-[#0D1B3E] transition-colors cursor-pointer"
                            >
                              تعيين الموعد الرسمي (14 يونيو 2027)
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* FOOTER STATUS BAR */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280] shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <Logo size="sm" showSubtitle={false} />
                    <span>{settings.platformName || 'ويكيـفيزياء'} - منصة التفوق في الفيزياء • جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-[#F5F7FA] border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-[#0D1B3E]">
                      v2.4.0
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>النظام يعمل بكفاءة</span>
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: COURSES & CURRICULUM */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0D1B3E]">إدارة الكورسات والمناهج</h2>
              <p className="text-xs text-[#6B7280]">إضافة الكورسات، تقسيم الوحدات، ورفع الفيديوهات والمذكرات المرفقة</p>
            </div>
            <button
              onClick={() => setShowAddCourse(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#0D1B3E]" />
              <span>إضافة كورس جديد</span>
            </button>
          </div>

          {/* Add Course Modal */}
          {showAddCourse && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-base text-[#0D1B3E]">إنشاء كورس جديد</h3>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">عنوان الكورس</label>
                    <input
                      type="text"
                      value={courseForm.title}
                      onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="مثال: كورس الفيزياء الحديثة 2025"
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">المرحلة الدراسية</label>
                    <select
                      value={courseForm.grade}
                      onChange={e => setCourseForm({ ...courseForm, grade: e.target.value as GradeLevel })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                    >
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D1B3E]">وصف الكورس ومحتوياته</label>
                  <textarea
                    rows={2}
                    value={courseForm.description}
                    onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="شرح تفصيلي للمنهج..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">سعر الكورس (ج.م)</label>
                    <input
                      type="number"
                      value={courseForm.price}
                      onChange={e => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-[#0D1B3E] flex items-center justify-between">
                      <span>صورة غلاف الكورس (Thumbnail)</span>
                      <span className="text-[10px] text-[#1E4FD8] font-normal">رفع من الجهاز أو رابط مباشر</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={courseForm.thumbnail}
                        onChange={e => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                        placeholder="أدخل رابط الصورة أو ارفع من جهازك..."
                        className="flex-1 rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                      />
                      <label className="relative flex items-center justify-center gap-2 rounded-xl bg-[#F5F7FA] border border-slate-200 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-[#1E4FD8] cursor-pointer shrink-0 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>اختر صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, 'image', (dataUrl) => {
                                setCourseForm({ ...courseForm, thumbnail: dataUrl });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    {courseForm.thumbnail && (
                      <div className="flex items-center gap-3 pt-1">
                        <img 
                          src={courseForm.thumbnail} 
                          alt="معاينة الغلاف" 
                          className="h-12 w-20 object-cover rounded-lg border border-slate-200 bg-[#F5F7FA]" 
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          تم ضبط صورة الغلاف بنجاح
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCourse(false)}
                    className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F5B301] px-6 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                  >
                    حفظ ونشر الكورس
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Courses List */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {courses.map(course => (
              <div key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="rounded bg-amber-50 text-[#0D1B3E] text-[10px] font-bold px-2 py-0.5 border border-amber-200">
                      {course.grade}
                    </span>
                    <h3 className="font-black text-[#0D1B3E] text-base leading-snug">{course.title}</h3>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{course.description}</p>
                  </div>
                  <img src={course.thumbnail} alt={course.title} className="h-16 w-24 object-cover rounded-xl border border-slate-200 shrink-0" />
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-slate-100">
                  <span>الوحدات: {course.units?.length || 0} فصول</span>
                  <span className="text-[#1E4FD8] font-bold">{course.price} ج.م</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedCourseForUnits(selectedCourseForUnits?.id === course.id ? null : course)}
                    className="flex-1 rounded-xl bg-blue-50 border border-blue-200 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white transition-all cursor-pointer"
                  >
                    {selectedCourseForUnits?.id === course.id ? 'إخفاء هيكل الوحدات' : 'إدارة الفصول والدروس'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    title="حذف الكورس"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Units and Lessons Builder Sub-panel */}
                {selectedCourseForUnits?.id === course.id && (
                  <div className="p-4 rounded-xl bg-[#F5F7FA] border border-slate-200 space-y-4 animate-in fade-in">
                    <h4 className="font-bold text-sm text-[#0D1B3E]">منهج وفصول: {course.title}</h4>
                    
                    {/* Add Unit Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={unitTitle}
                        onChange={e => setUnitTitle(e.target.value)}
                        placeholder="اسم الفصل أو الباب الجديد..."
                        className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E] focus:border-[#1E4FD8] focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddUnit(course.id)}
                        className="rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] cursor-pointer"
                      >
                        + إضافة فصل
                      </button>
                    </div>

                    {/* Unit List */}
                    <div className="space-y-3 pt-2">
                      {course.units?.map((u, uIdx) => (
                        <div key={u.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0D1B3E]">{u.title}</span>
                            <span className="text-[10px] text-[#6B7280]">{u.lessons?.length || 0} دروس</span>
                          </div>

                          {/* Lessons in Unit */}
                          <div className="space-y-1 pr-2 border-r-2 border-slate-200">
                            {u.lessons?.map((l, lIdx) => (
                              <div key={l.id} className="flex items-center justify-between text-[11px] text-[#0D1B3E] py-1">
                                <span>{lIdx + 1}. {l.title} ({l.durationMinutes} د)</span>
                                {l.isFreePreview && <span className="text-[9px] bg-blue-50 text-[#1E4FD8] border border-blue-200 px-1.5 py-0.2 rounded font-bold">مجاني</span>}
                              </div>
                            ))}
                          </div>

                          {/* Add Lesson to this Unit Form */}
                          <div className="pt-3 border-t border-slate-100 space-y-3 bg-[#F5F7FA] p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-[#1E4FD8] block">إضافة درس جديد لهذا الفصل:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={lessonForm.unitId === u.id ? lessonForm.title : ''}
                                onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, title: e.target.value })}
                                placeholder="عنوان الدرس..."
                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E] focus:border-[#1E4FD8] focus:outline-none"
                              />
                              <div className="flex items-center gap-2">
                                <select
                                  value={lessonForm.unitId === u.id ? lessonForm.videoType : 'youtube'}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, videoType: e.target.value as any })}
                                  className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                                >
                                  <option value="youtube">يوتيوب (YouTube)</option>
                                  <option value="external">رابط خارجي / Google Drive</option>
                                  <option value="uploaded">ملف فيديو من الجهاز (MP4/WebM)</option>
                                </select>
                                <input
                                  type="number"
                                  placeholder="المدة (د)"
                                  value={lessonForm.unitId === u.id ? lessonForm.durationMinutes : 45}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, durationMinutes: Number(e.target.value) })}
                                  className="w-20 rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                                  title="المدة بالدقائق"
                                />
                              </div>
                            </div>

                            {/* Video Input & Upload Button */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] text-[#6B7280] font-bold flex items-center gap-1.5">
                                  <span>مصدر الفيديو</span>
                                  {lessonForm.unitId === u.id && lessonForm.videoUrl && (
                                    <span className="text-emerald-700 text-[10px] flex items-center gap-1 font-bold">
                                      <Check className="h-3 w-3" /> تم تحديد الفيديو
                                    </span>
                                  )}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setShowVideoGuideModal(true)}
                                  className="text-[10px] font-bold text-[#1E4FD8] hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer"
                                >
                                  <Info className="h-3 w-3" />
                                  <span>دليل الفيديوهات وسرعة التشغيل (يوتيوب ودرايف)</span>
                                </button>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={lessonForm.unitId === u.id ? lessonForm.videoUrl : ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    let detectedType: 'youtube' | 'external' | 'uploaded' = 'youtube';
                                    if (val.includes('youtube.com') || val.includes('youtu.be')) {
                                      detectedType = 'youtube';
                                    } else if (val.includes('drive.google.com') || val.includes('vimeo.com')) {
                                      detectedType = 'external';
                                    } else if (val.endsWith('.mp4') || val.endsWith('.webm') || val.startsWith('/uploads/')) {
                                      detectedType = 'uploaded';
                                    } else if (val.startsWith('http')) {
                                      detectedType = 'external';
                                    }
                                    setLessonForm({ ...lessonForm, unitId: u.id, videoUrl: val, videoType: detectedType });
                                  }}
                                  placeholder="ضع رابط يوتيوب (غير مدرج) أو رابط جوجل درايف أو ارفع فيديو..."
                                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E] focus:border-[#1E4FD8] focus:outline-none"
                                />
                                <label className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-2 text-xs font-bold text-[#1E4FD8] cursor-pointer shrink-0 transition-colors">
                                  <Film className="h-3.5 w-3.5" />
                                  <span>رفع فيديو من الجهاز</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(file, 'video', (dataUrl, fileName) => {
                                          setLessonForm({
                                            ...lessonForm,
                                            unitId: u.id,
                                            videoUrl: dataUrl,
                                            videoType: 'uploaded',
                                            title: lessonForm.title || fileName?.replace(/\.[^/.]+$/, '') || 'درس فيديو'
                                          });
                                        });
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Optional Attached PDF Material for this Lesson */}
                            <div className="space-y-1 pt-1">
                              <label className="text-[10px] text-[#6B7280] font-bold">ملف PDF مرفق مع هذا الدرس (اختياري)</label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={lessonForm.unitId === u.id ? (lessonForm.pdfUrl || '') : ''}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, pdfUrl: e.target.value })}
                                  placeholder="رابط PDF أو ارفع من جهازك..."
                                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E] focus:border-[#1E4FD8] focus:outline-none"
                                />
                                <label className="flex items-center justify-center gap-1.5 rounded-lg bg-[#F5F7FA] border border-slate-200 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-[#0D1B3E] cursor-pointer shrink-0 transition-colors">
                                  <FileCheck className="h-3.5 w-3.5 text-[#1E4FD8]" />
                                  <span>رفع ملزمة PDF</span>
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(file, 'pdf', (dataUrl, fileName) => {
                                          setLessonForm({
                                            ...lessonForm,
                                            unitId: u.id,
                                            pdfUrl: dataUrl,
                                            pdfTitle: fileName || 'ملزمة الدرس'
                                          });
                                        });
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#0D1B3E]">
                                <input
                                  type="checkbox"
                                  checked={lessonForm.unitId === u.id ? lessonForm.isFreePreview : false}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, isFreePreview: e.target.checked })}
                                  className="rounded border-slate-300 text-[#1E4FD8] h-4 w-4"
                                />
                                <span>درس معاينة مجاني لغير المشتركين</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleAddLesson(course.id, u.id)}
                                disabled={isUploadingFile}
                                className="rounded-lg bg-[#1E4FD8] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shrink-0 shadow-xs cursor-pointer"
                              >
                                {isUploadingFile ? 'جاري رفع الملف...' : 'حفظ الدرس في الفصل'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EXAMS & QUIZZES */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0D1B3E]">بنك الأسئلة والامتحانات التفاعلية</h2>
              <p className="text-xs text-[#6B7280]">إنشاء وتعديل الكويزات الدورية والامتحانات الشاملة مع التوقيت ونموذج الإجابة</p>
            </div>
            <button
              onClick={() => setShowAddExam(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#0D1B3E]" />
              <span>إنشاء اختبار جديد</span>
            </button>
          </div>

          {/* Add Exam Modal */}
          {showAddExam && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-black text-base text-[#0D1B3E]">إنشاء امتحان أو كويز جديد</h3>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">عنوان الامتحان</label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={e => setExamForm({ ...examForm, title: e.target.value })}
                      placeholder="مثال: امتحان شامل على الفصل الأول"
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">النوع</label>
                    <select
                      value={examForm.type}
                      onChange={e => setExamForm({ ...examForm, type: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                    >
                      <option value="quiz">كويز قصير</option>
                      <option value="exam">امتحان شامل</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">مدة الاختبار (بالدقائق)</label>
                    <input
                      type="number"
                      value={examForm.durationMinutes}
                      onChange={e => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E4FD8]">تحديد الكورس التابع له هذا الامتحان</label>
                    <select
                      value={examForm.courseId}
                      onChange={e => setExamForm({ ...examForm, courseId: e.target.value })}
                      className="w-full rounded-xl border border-blue-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-bold focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                    >
                      <option value="">عام (غير مرتبط بكورس معين)</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.grade})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#6B7280]">سوف ينزل هذا الامتحان مباشرة وتلقائياً في صفحة الكورس للطلاب المشتركين فيه.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">الصف الدراسي المستهدف</label>
                    <select
                      value={examForm.grade}
                      onChange={e => setExamForm({ ...examForm, grade: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                    >
                      <option value="الكل">جميع الصفوف</option>
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي (ثانوية عامة)</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                    </select>
                  </div>
                </div>

                {/* Manual Question Creator Section */}
                <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[#1E4FD8]" />
                      <h4 className="text-xs font-bold text-[#0D1B3E]">إضافة سؤال جديد يدوياً إلى هذا الامتحان</h4>
                    </div>
                    <span className="text-[11px] text-[#6B7280]">إجمالي الأسئلة المضافة: {examForm.questions.length}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Question Text */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#0D1B3E]">نص السؤال</label>
                      <textarea
                        rows={2}
                        value={newQuestionForm.text}
                        onChange={e => setNewQuestionForm({ ...newQuestionForm, text: e.target.value })}
                        placeholder="اكتب صيغة السؤال الفيزيائي هنا..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0D1B3E] placeholder:text-slate-400 focus:border-[#1E4FD8] focus:outline-none"
                      />
                    </div>

                    {/* Question Diagram / Image (Optional for physics diagrams, circuits, etc.) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#6B7280] flex items-center justify-between">
                        <span>صورة أو رسم توضيحي للسؤال (اختياري للدوائر والرسوم البيانية)</span>
                        {newQuestionForm.image && (
                          <button
                            type="button"
                            onClick={() => setNewQuestionForm({ ...newQuestionForm, image: '' })}
                            className="text-rose-600 hover:underline text-[10px]"
                          >
                            إزالة الصورة
                          </button>
                        )}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newQuestionForm.image}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, image: e.target.value })}
                          placeholder="رابط الصورة أو الرسم التوضيحي..."
                          className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                        <label className="flex items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-[#1E4FD8] cursor-pointer shrink-0 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          <span>رفع رسم للسؤال</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, 'image', (url) => {
                                  setNewQuestionForm({ ...newQuestionForm, image: url });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                      {newQuestionForm.image && (
                        <div className="pt-1">
                          <img
                            src={newQuestionForm.image}
                            alt="رسم توضيحي للسؤال"
                            className="max-h-32 rounded-lg border border-slate-200 bg-white object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[#0D1B3E]">الخيار (أ)</label>
                          <label className="text-[10px] text-emerald-700 cursor-pointer flex items-center gap-1 font-bold">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 0}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 0 })}
                              className="text-emerald-600"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option0}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option0: e.target.value })}
                          placeholder="الخيار الأول..."
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[#0D1B3E]">الخيار (ب)</label>
                          <label className="text-[10px] text-emerald-700 cursor-pointer flex items-center gap-1 font-bold">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 1}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 1 })}
                              className="text-emerald-600"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option1}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option1: e.target.value })}
                          placeholder="الخيار الثاني..."
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[#0D1B3E]">الخيار (ج)</label>
                          <label className="text-[10px] text-emerald-700 cursor-pointer flex items-center gap-1 font-bold">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 2}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 2 })}
                              className="text-emerald-600"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option2}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option2: e.target.value })}
                          placeholder="الخيار الثالث..."
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[#0D1B3E]">الخيار (د)</label>
                          <label className="text-[10px] text-emerald-700 cursor-pointer flex items-center gap-1 font-bold">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 3}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 3 })}
                              className="text-emerald-600"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option3}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option3: e.target.value })}
                          placeholder="الخيار الرابع..."
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                      </div>
                    </div>

                    {/* Explanation & Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-[#0D1B3E]">تفسير ونموذج الإجابة (يظهر للطالب بعد التسليم)</label>
                        <input
                          type="text"
                          value={newQuestionForm.explanation}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                          placeholder="شرح سبب صحة الإجابة أو خطوات الحل والقانون المستخدم..."
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#0D1B3E]">درجة السؤال</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={newQuestionForm.points}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, points: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddQuestionToExam}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5B301] hover:bg-[#e0a401] text-[#0D1B3E] font-black px-4 py-2 text-xs shadow-xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4 text-[#0D1B3E]" />
                        <span>إدراج هذا السؤال في الاختبار</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Questions List & Manager */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1E4FD8]">قائمة أسئلة الاختبار ({examForm.questions.length})</h4>
                    <span className="text-[10px] text-[#6B7280]">إجمالي الدرجات: {examForm.questions.reduce((acc, q) => acc + (q.points || 1), 0)} درجة</span>
                  </div>

                  {examForm.questions.length === 0 ? (
                    <p className="text-xs text-[#6B7280] py-3 text-center">لم تقم بإضافة أسئلة بعد. استخدم النموذج أعلاه لإضافة أول سؤال.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {examForm.questions.map((q, idx) => (
                        <div key={q.id || idx} className="rounded-xl bg-[#F5F7FA] border border-slate-200 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <p className="font-bold text-[#0D1B3E] text-xs">{idx + 1}. {q.text}</p>
                              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                                {q.options.map((opt, oIdx) => (
                                  <div 
                                    key={oIdx} 
                                    className={`px-2 py-0.5 rounded text-[10px] ${
                                      oIdx === q.correctOptionIndex 
                                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' 
                                        : 'text-[#6B7280]'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}: {opt} {oIdx === q.correctOptionIndex && '(صحيح)'}
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <p className="text-[10px] text-[#6B7280] pt-1">التفسير: {q.explanation}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromExam(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 shrink-0 cursor-pointer"
                              title="حذف هذا السؤال"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExam(false)}
                    className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1E4FD8] px-6 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    حفظ ونشر الامتحان
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Exams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(ex => {
              const linkedCourse = courses.find(c => c.id === ex.courseId);
              return (
                <div key={ex.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="rounded bg-blue-50 text-[#1E4FD8] text-[10px] font-bold px-2 py-0.5 border border-blue-200">
                      {ex.type === 'quiz' ? 'كويز' : 'امتحان شامل'}
                    </span>
                    <span className="text-xs text-[#6B7280]">{ex.durationMinutes} دقيقة</span>
                  </div>
                  
                  <h3 className="font-bold text-[#0D1B3E] text-base leading-snug">{ex.title}</h3>

                  {/* Linked Course Badge */}
                  <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs flex items-center justify-between">
                    <span className="text-[#6B7280] text-[11px]">الكورس التابع له:</span>
                    {linkedCourse ? (
                      <span className="font-bold text-[#1E4FD8] truncate max-w-[160px]" title={linkedCourse.title}>
                        {linkedCourse.title}
                      </span>
                    ) : (
                      <span className="text-[#6B7280] text-[11px]">عام (غير مرتبط)</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1 border-t border-slate-100">
                    <span>عدد الأسئلة: <strong className="text-[#0D1B3E]">{ex.questions?.length || 0}</strong></span>
                    <span>النجاح: <strong className="text-emerald-700">{ex.passingPercentage}%</strong></span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setEditingExam(ex)}
                      className="flex-1 rounded-xl bg-blue-50 border border-blue-200 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="تعديل بيانات الامتحان وربط الكورس"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعديل وربط الكورس</span>
                    </button>
                    <button
                      onClick={() => onNavigate('exam-runner', { examId: ex.id })}
                      className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-3 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200 cursor-pointer"
                      title="معاينة تجربة الامتحان"
                    >
                      معاينة
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف امتحان "${ex.title}"؟`)) {
                          StorageService.deleteExam(ex.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                      title="حذف الامتحان"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit & Link Exam Modal */}
          {editingExam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
              <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-black text-base text-[#0D1B3E] flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-[#1E4FD8]" />
                    <span>تعديل بيانات الامتحان وربط الكورس</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingExam(null)}
                    className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-1.5 text-[#0D1B3E] hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateExam} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0D1B3E]">عنوان الامتحان</label>
                      <input
                        type="text"
                        value={editingExam.title}
                        onChange={e => setEditingExam({ ...editingExam, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D1B3E]">النوع</label>
                      <select
                        value={editingExam.type}
                        onChange={e => setEditingExam({ ...editingExam, type: e.target.value as any })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      >
                        <option value="quiz">كويز قصير</option>
                        <option value="exam">امتحان شامل</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E4FD8]">تحديد / تغيير الكورس التابع له هذا الامتحان</label>
                      <select
                        value={editingExam.courseId || ''}
                        onChange={e => setEditingExam({ ...editingExam, courseId: e.target.value || undefined })}
                        className="w-full rounded-xl border border-blue-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-bold"
                      >
                        <option value="">عام (غير مرتبط بكورس معين)</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.grade})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#6B7280]">سوف يظهر هذا الامتحان فوراً وبشكل تلقائي داخل صفحة الكورس المحدد لدى الطلاب المشتركين.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D1B3E]">الصف الدراسي المستهدف</label>
                      <select
                        value={editingExam.grade || 'الكل'}
                        onChange={e => setEditingExam({ ...editingExam, grade: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      >
                        <option value="الكل">جميع الصفوف</option>
                        <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي (ثانوية عامة)</option>
                        <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                        <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D1B3E]">مدة الاختبار (بالدقائق)</label>
                      <input
                        type="number"
                        value={editingExam.durationMinutes}
                        onChange={e => setEditingExam({ ...editingExam, durationMinutes: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D1B3E]">نسبة النجاح المطلوب (٪)</label>
                      <input
                        type="number"
                        value={editingExam.passingPercentage}
                        onChange={e => setEditingExam({ ...editingExam, passingPercentage: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingExam(null)}
                      className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#F5B301] px-6 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                    >
                      حفظ التعديلات وتحديث الكورس
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STUDENTS & DEVICES */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0D1B3E]">إدارة حسابات الطلاب والتحكم بالأجهزة</h2>
              <p className="text-xs text-[#6B7280]">متابعة الاشتراكات، حظر/إلغاء حظر الطلاب، وتفريغ جلسات الأجهزة المقفلة</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="بحث بالاسم أو رقم الهاتف..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-10 pl-4 text-xs text-[#0D1B3E] placeholder:text-slate-400 focus:border-[#1E4FD8] focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 bg-[#F5F7FA] text-[#0D1B3E]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">اسم الطالب</th>
                    <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                    <th className="py-3.5 px-4 font-bold">كلمة المرور</th>
                    <th className="py-3.5 px-4 font-bold">المرحلة</th>
                    <th className="py-3.5 px-4 font-bold">الكورسات المفعلة</th>
                    <th className="py-3.5 px-4 font-bold">الأجهزة المسجلة</th>
                    <th className="py-3.5 px-4 font-bold">حالة الحساب</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-[#F5F7FA] transition-colors">
                      <td className="py-4 px-4 font-bold text-[#0D1B3E]">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-50 text-[#1E4FD8] flex items-center justify-center font-black text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#0D1B3E]" dir="ltr">{student.phone}</td>
                      <td className="py-4 px-4 font-mono">
                        <span className="inline-block rounded-lg border border-slate-200 bg-[#F5F7FA] px-2 py-0.5 text-xs text-[#1E4FD8] font-bold">
                          {student.password || 'غير محدد'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#6B7280]">{student.grade.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}</td>
                      <td className="py-4 px-4 font-bold text-[#1E4FD8]">{student.enrolledCourseIds?.length || 0} كورس</td>
                      <td className="py-4 px-4 text-[#0D1B3E]">
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-[#6B7280]" />
                          <span>{student.registeredDevices?.length || 1} / {student.maxDevicesAllowed || 2}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          student.isBlocked 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {student.isBlocked ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedAnalyticsStudent(student)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-[#0D1B3E] hover:bg-amber-100 flex items-center gap-1 shadow-xs cursor-pointer"
                            title="استعراض البروفايل الكامل وتحليلات النجاح والرسوب والاختبارات"
                          >
                            <BarChart3 className="h-3.5 w-3.5 text-[#1E4FD8]" />
                            <span>البروفايل والتحليل</span>
                          </button>

                          <button
                            onClick={() => setSelectedWeaknessStudent(student)}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1E4FD8] hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                            title="تشخيص نقاط الضعف والمفاهيم المفقودة"
                          >
                            <Stethoscope className="h-3 w-3" />
                            <span>تشخيص الضعف</span>
                          </button>

                          <button
                            onClick={() => sendParentWhatsappReport(student)}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                            title="إرسال تقرير ولي الأمر مباشرة عبر واتساب"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>تقرير واتساب</span>
                          </button>

                          <button
                            onClick={() => handleResetDevices(student)}
                            className="rounded-lg border border-slate-200 bg-[#F5F7FA] px-2 py-1 text-[11px] font-bold text-[#0D1B3E] hover:bg-slate-200 cursor-pointer"
                            title="إعادة ضبط أجهزة الطالب"
                          >
                            تفريغ الأجهزة
                          </button>
                          <button
                            onClick={() => handleToggleBlockStudent(student)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold cursor-pointer ${
                              student.isBlocked 
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            {student.isBlocked ? 'إلغاء الحظر' : 'حظر'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVATION CODES */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E]">توليد وإدارة أكواد التفعيل</h2>
              <p className="text-xs text-[#6B7280]">توليد أكواد فردية أو مجمعة (Bulk) لبيعها وتوزيعها على الطلاب لفتح الكورسات والمذكرات</p>
            </div>
            <button
              onClick={() => setShowAddCode(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>توليد أكواد جديدة</span>
            </button>
          </div>

          {/* Generator Modal */}
          {showAddCode && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-base text-[#0D1B3E]">توليد أكواد اشتراك جديدة</h3>
              <form onSubmit={handleGenerateCodes} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">نوع العنصر المستهدف</label>
                    <select
                      value={codeGenForm.targetType}
                      onChange={e => setCodeGenForm({ ...codeGenForm, targetType: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                    >
                      <option value="course">كورس تعليمي</option>
                      <option value="pdf">مذكرة / ملزمة PDF</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">اختر الكورس / المذكرة</label>
                    <select
                      value={codeGenForm.targetId}
                      onChange={e => setCodeGenForm({ ...codeGenForm, targetId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-medium focus:bg-white focus:border-[#1E4FD8]"
                    >
                      {codeGenForm.targetType === 'course' ? (
                        <>
                          <option value="ALL">كود شامل (تفعيل لجميع كورسات المنصة)</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title} • {c.grade}
                            </option>
                          ))}
                        </>
                      ) : (
                        <>
                          <option value="ALL_PDFS">جميع مذكرات المنصة</option>
                          {pdfs.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">عدد الأكواد المطلوبة</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={codeGenForm.count}
                      onChange={e => setCodeGenForm({ ...codeGenForm, count: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCode(false)}
                    className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F5B301] px-6 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
                  >
                    توليد وحفظ الأكواد
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Codes Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 bg-[#F5F7FA] text-[#6B7280]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">كود التفعيل</th>
                    <th className="py-3.5 px-4 font-bold">نسخ الكود</th>
                    <th className="py-3.5 px-4 font-bold">العنصر المفعل</th>
                    <th className="py-3.5 px-4 font-bold">النوع</th>
                    <th className="py-3.5 px-4 font-bold">الحالة</th>
                    <th className="py-3.5 px-4 font-bold">استخدم بواسطة</th>
                    <th className="py-3.5 px-4 font-bold">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {codes.map(code => (
                    <tr key={code.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E4FD8]" dir="ltr">{code.code}</td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code.code, code.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            copiedCodeId === code.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-[#F5F7FA] text-[#0D1B3E] hover:bg-[#F5B301] hover:text-[#0D1B3E] border border-slate-200'
                          }`}
                          title="نسخ كود التفعيل"
                        >
                          {copiedCodeId === code.id ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-[#0D1B3E] font-bold">{code.targetName}</td>
                      <td className="py-3.5 px-4 text-[#6B7280]">{code.targetType === 'course' ? 'كورس' : 'مذكرة PDF'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          code.isUsed 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {code.isUsed ? 'مستخدم' : 'متاح للتفعيل'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#0D1B3E]">{code.usedByStudentName || '—'}</td>
                      <td className="py-3.5 px-4 text-[#6B7280]">{new Date(code.createdAt).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated Codes Success Modal with Copy Options */}
          {showGeneratedSuccessModal && recentlyGeneratedCodes.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0D1B3E]">تم إنشاء الأكواد بنجاح</h3>
                    <p className="text-xs text-[#6B7280]">
                      تم توليد {recentlyGeneratedCodes.length} كود تفعيل لـ ({recentlyGeneratedCodes[0]?.targetName})
                    </p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3 space-y-2">
                  {recentlyGeneratedCodes.map((c, idx) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#6B7280] font-mono">#{idx + 1}</span>
                        <span className="font-mono font-bold text-[#1E4FD8] text-sm tracking-wider" dir="ltr">{c.code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code, c.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          copiedCodeId === c.id 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[#F5F7FA] text-[#0D1B3E] hover:bg-[#F5B301] hover:text-[#0D1B3E] border border-slate-200'
                        }`}
                      >
                        {copiedCodeId === c.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCodeId === c.id ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyAllGeneratedCodes}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                      copiedCodeId === 'ALL'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#F5B301] text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs'
                    }`}
                  >
                    {copiedCodeId === 'ALL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedCodeId === 'ALL' ? 'تم نسخ جميع الأكواد' : 'نسخ جميع الأكواد دفعة واحدة'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGeneratedSuccessModal(false)}
                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-[#F5F7FA] px-5 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200"
                  >
                    تم وإغلاق النافذة
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PDF MATERIALS */}
      {activeTab === 'pdfs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E]">إدارة المذكرات والملازم الرقمية</h2>
              <p className="text-xs text-[#6B7280]">رفع مذكرات الشرح وبنوك الأسئلة وتحديد صلاحيات الحماية والأكواد</p>
            </div>
            <button
              onClick={() => setShowAddPdf(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة مذكرة جديدة</span>
            </button>
          </div>

          {/* Add PDF Modal */}
          {showAddPdf && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-base text-[#0D1B3E] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1E4FD8]" />
                <span>إضافة مذكرة أو بنك أسئلة جديد</span>
              </h3>
              <form onSubmit={handleCreatePdf} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#0D1B3E]">عنوان المذكرة</label>
                    <input
                      type="text"
                      value={pdfForm.title}
                      onChange={e => setPdfForm({ ...pdfForm, title: e.target.value })}
                      placeholder="مثال: مذكرة مراجعة ليلة الامتحان في الفيزياء 2025"
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">التصنيف</label>
                    <select
                      value={pdfForm.category}
                      onChange={e => setPdfForm({ ...pdfForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                    >
                      <option value="مذكرات الشرح">مذكرات الشرح</option>
                      <option value="بنك الأسئلة والتمارين">بنك الأسئلة والتمارين</option>
                      <option value="المراجعات النهائية">المراجعات النهائية</option>
                      <option value="ملخص القوانين والخرائط الذهنية">ملخص القوانين والخرائط</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-[#0D1B3E] flex items-center justify-between">
                      <span>ملف المذكرة (PDF)</span>
                      <span className="text-[10px] text-[#1E4FD8] font-normal">رفع من الجهاز أو رابط مباشر</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={pdfForm.url}
                        onChange={e => setPdfForm({ ...pdfForm, url: e.target.value })}
                        placeholder="أدخل رابط مباشر لملف PDF أو ارفع من جهازك..."
                        className="flex-1 rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                        required
                      />
                      <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-[#1E4FD8] cursor-pointer shrink-0 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>رفع PDF من الجهاز</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, 'pdf', (dataUrl, fileName, fileSize) => {
                                setPdfForm({ 
                                  ...pdfForm, 
                                  url: dataUrl,
                                  title: pdfForm.title || fileName?.replace(/\.[^/.]+$/, '') || 'مذكرة فيزياء',
                                  fileSize: fileSize || '4.5 MB'
                                });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    {pdfForm.url && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>تم تجهيز ملف الـ PDF بنجاح ({pdfForm.fileSize || 'جاهز'})</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setAdminPreviewPdf({
                            id: 'preview_temp',
                            title: pdfForm.title || 'معاينة الملف المرفوع',
                            grade: pdfForm.grade,
                            category: pdfForm.category,
                            url: pdfForm.url,
                            pageCount: Number(pdfForm.pageCount) || 1,
                            fileSize: pdfForm.fileSize,
                            isLocked: !pdfForm.isFree
                          })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold transition-colors"
                        >
                          معاينة الملف الآن
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">المرحلة الدراسية</label>
                    <select
                      value={pdfForm.grade}
                      onChange={e => setPdfForm({ ...pdfForm, grade: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                    >
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                    </select>
                  </div>
                </div>

                {/* Free vs Paid Access Selection */}
                <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3">
                  <label className="text-xs font-bold text-[#1E4FD8] block">تحديد نوع الوصول للمذكرة</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPdfForm({ ...pdfForm, isFree: true, isLocked: false, price: 0 })}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        pdfForm.isFree
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30 font-bold'
                          : 'border-slate-200 bg-white text-[#6B7280] hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1.5 font-bold">
                        <span>مذكرة مجانية</span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1">متاحة للقراءة والتحميل المباشر لجميع الطلاب بدون رسوم أو أكواد.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfForm({ ...pdfForm, isFree: false, isLocked: true })}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        !pdfForm.isFree
                          ? 'border-[#1E4FD8] bg-blue-50 text-[#1E4FD8] ring-2 ring-[#1E4FD8]/30 font-bold'
                          : 'border-slate-200 bg-white text-[#6B7280] hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1.5 font-bold">
                        <span>مذكرة مدفوعة / محمية</span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1">تتطلب الشراء/كود تفعيل أو تكون مجانية للمشتركين في كورس معين.</p>
                    </button>
                  </div>

                  {!pdfForm.isFree && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#0D1B3E]">سعر المذكرة (ج.م)</label>
                        <input
                          type="number"
                          value={pdfForm.price}
                          onChange={e => setPdfForm({ ...pdfForm, price: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0D1B3E]"
                          placeholder="50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1E4FD8]">ربط بكورس معين (اختياري)</label>
                        <select
                          value={pdfForm.associatedCourseId}
                          onChange={e => setPdfForm({ ...pdfForm, associatedCourseId: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0D1B3E]"
                        >
                          <option value="">عام (غير مرتبطة بكورس معين)</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title} ({c.grade})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-[#6B7280]">ستظهر تلقائياً داخل كورس الطالب المشترك وتفتح له بدون أكواد.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPdf(false)}
                    className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F5B301] px-6 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
                  >
                    حفظ المذكرة
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PDFs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map(pdf => {
              const isFreePdf = pdf.isFree || !pdf.isLocked || pdf.price === 0;
              const linkedCourse = courses.find(c => c.id === pdf.associatedCourseId);

              return (
                <div key={pdf.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 flex flex-col justify-between hover:border-[#1E4FD8]/40 transition-all shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="rounded bg-blue-50 border border-blue-200 text-[#1E4FD8] text-[10px] font-bold px-2 py-0.5">
                        {pdf.category}
                      </span>
                      <span className="text-xs text-[#6B7280]">{pdf.pageCount} صفحة</span>
                    </div>

                    <h3 className="font-bold text-[#0D1B3E] text-base leading-snug">{pdf.title}</h3>
                    
                    {pdf.description && (
                      <p className="text-xs text-[#6B7280] line-clamp-2">{pdf.description}</p>
                    )}

                    {/* Linked Course & Access Status Badges */}
                    <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280] text-[11px]">حالة الوصول:</span>
                        {isFreePdf ? (
                          <span className="font-bold text-emerald-600">مجانية للجميع</span>
                        ) : (
                          <span className="font-bold text-[#1E4FD8]">مدفوعة ({pdf.price || 50} ج.م)</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-1">
                        <span className="text-[#6B7280] text-[11px]">الكورس المرتبط:</span>
                        {linkedCourse ? (
                          <span className="font-bold text-[#0D1B3E] truncate max-w-[140px]" title={linkedCourse.title}>
                            {linkedCourse.title}
                          </span>
                        ) : (
                          <span className="text-[#6B7280] text-[11px]">عام (غير مرتبط)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPdf(pdf)}
                        className="flex-1 rounded-xl bg-blue-50 border border-blue-200 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="تعديل المذكرة والوصول"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>تعديل والوصول</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminPreviewPdf(pdf)}
                        className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white transition-all cursor-pointer"
                        title="معاينة الملف"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadPdfFile(pdf.url, pdf.title)}
                        className="p-2 rounded-xl border border-slate-200 bg-[#F5F7FA] text-[#0D1B3E] hover:bg-slate-200 transition-colors cursor-pointer"
                        title="تحميل المذكرة للجهاز"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف مذكرة "${pdf.title}"؟`)) {
                            StorageService.deletePdf(pdf.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="حذف المذكرة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit PDF Modal */}
          {editingPdf && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
              <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-base text-[#0D1B3E] flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-[#1E4FD8]" />
                    <span>تعديل بيانات المذكرة وخيارات الوصول</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPdf(null)}
                    className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-1.5 text-[#6B7280] hover:text-[#0D1B3E]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdatePdf} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0D1B3E]">عنوان المذكرة</label>
                      <input
                        type="text"
                        value={editingPdf.title}
                        onChange={e => setEditingPdf({ ...editingPdf, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D1B3E]">التصنيف</label>
                      <select
                        value={editingPdf.category}
                        onChange={e => setEditingPdf({ ...editingPdf, category: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      >
                        <option value="مذكرات الشرح">مذكرات الشرح</option>
                        <option value="بنك الأسئلة والتمارين">بنك الأسئلة والتمارين</option>
                        <option value="المراجعات النهائية">المراجعات النهائية</option>
                        <option value="ملخص القوانين والخرائط الذهنية">ملخص القوانين والخرائط</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0D1B3E] flex items-center justify-between">
                        <span>ملف المذكرة (PDF)</span>
                        <span className="text-[10px] text-[#1E4FD8] font-normal">رابط أو رفع ملف جديد</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editingPdf.url || editingPdf.fileUrl || ''}
                          onChange={e => setEditingPdf({ ...editingPdf, url: e.target.value, fileUrl: e.target.value })}
                          className="flex-1 rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                          required
                        />
                        <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-[#1E4FD8] cursor-pointer shrink-0 transition-colors">
                          <Upload className="h-4 w-4" />
                          <span>تغيير الملف</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, 'pdf', (dataUrl, fileName, fileSize) => {
                                  setEditingPdf({ 
                                    ...editingPdf, 
                                    url: dataUrl,
                                    fileUrl: dataUrl,
                                    fileSize: fileSize || editingPdf.fileSize
                                  });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D1B3E]">المرحلة الدراسية</label>
                      <select
                        value={editingPdf.grade}
                        onChange={e => setEditingPdf({ ...editingPdf, grade: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      >
                        <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي</option>
                        <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                        <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                      </select>
                    </div>
                  </div>

                  {/* Free vs Paid Option */}
                  <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3">
                    <label className="text-xs font-bold text-[#1E4FD8] block">نوع الوصول والصلاحية للمذكرة</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingPdf({ ...editingPdf, isFree: true, isLocked: false, price: 0 })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          (editingPdf.isFree || (!editingPdf.isLocked && editingPdf.price === 0))
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30 font-bold'
                            : 'border-slate-200 bg-white text-[#6B7280] hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs flex items-center gap-1.5 font-bold">
                          <span>مذكرة مجانية</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1">متاحة للقراءة والتحميل المباشر لجميع الطلاب بدون رسوم.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingPdf({ ...editingPdf, isFree: false, isLocked: true })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          (!editingPdf.isFree && (editingPdf.isLocked || (editingPdf.price || 0) > 0))
                            ? 'border-[#1E4FD8] bg-blue-50 text-[#1E4FD8] ring-2 ring-[#1E4FD8]/30 font-bold'
                            : 'border-slate-200 bg-white text-[#6B7280] hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs flex items-center gap-1.5 font-bold">
                          <span>مذكرة مدفوعة / محمية</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1">تتطلب كود تفعيل/شراء أو تكون مفعّلة لمشتركي كورس معين.</p>
                      </button>
                    </div>

                    {(!editingPdf.isFree && (editingPdf.isLocked || (editingPdf.price || 0) > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0D1B3E]">سعر المذكرة (ج.م)</label>
                          <input
                            type="number"
                            value={editingPdf.price || 50}
                            onChange={e => setEditingPdf({ ...editingPdf, price: Number(e.target.value) })}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0D1B3E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#1E4FD8]">ربط بكورس معين</label>
                          <select
                            value={editingPdf.associatedCourseId || ''}
                            onChange={e => setEditingPdf({ ...editingPdf, associatedCourseId: e.target.value || undefined })}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0D1B3E]"
                          >
                            <option value="">عام (غير مرتبطة بكورس معين)</option>
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.title} ({c.grade})
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-[#6B7280]">ستظهر تلقائياً داخل كورس الطالب المشترك وتفتح له بدون أكواد.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingPdf(null)}
                      className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#F5B301] px-6 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
                    >
                      تحديث خيارات المذكرة
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: RESULTS & ATTEMPTS */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#0D1B3E]">سجل نتائج وتصحيح الامتحانات</h2>
            <p className="text-xs text-[#6B7280]">تقارير فورية عن أداء الطلاب في جميع الكويزات والامتحانات</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 bg-[#F5F7FA] text-[#6B7280]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">اسم الطالب</th>
                    <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                    <th className="py-3.5 px-4 font-bold">اسم الامتحان</th>
                    <th className="py-3.5 px-4 font-bold">الدرجة</th>
                    <th className="py-3.5 px-4 font-bold">النسبة</th>
                    <th className="py-3.5 px-4 font-bold">الحالة</th>
                    <th className="py-3.5 px-4 font-bold">التوقيت</th>
                    <th className="py-3.5 px-4 font-bold text-center">تقرير ولي الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attempts.map(att => {
                    const studentObj = students.find(s => s.id === att.studentId);
                    const parentPhone = studentObj?.parentPhone || att.studentPhone || '01000000000';
                    const cleanParentPhone = parentPhone.replace(/[^0-9]/g, '');
                    const formattedPhone = cleanParentPhone.startsWith('0') ? `20${cleanParentPhone.substring(1)}` : cleanParentPhone;
                    const reportMsg = `تقرير أداء الطالب في الفيزياء منصة ويكيفزياء:\nاسم الطالب: ${att.studentName}\nالاختبار: ${att.examTitle}\nالدرجة: ${att.score} من ${att.maxScore} (${att.percentage}%)\nالتقييم: ${att.passed ? 'ممتاز واجتاز الاختبار' : 'يحتاج لإعادة المراجعة'}`;
                    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(reportMsg)}`;

                    return (
                      <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#0D1B3E]">{att.studentName}</td>
                        <td className="py-3.5 px-4 font-mono text-[#6B7280]" dir="ltr">{att.studentPhone}</td>
                        <td className="py-3.5 px-4 text-[#0D1B3E]">{att.examTitle}</td>
                        <td className="py-3.5 px-4 font-bold text-[#0D1B3E]">{att.score} / {att.maxScore}</td>
                        <td className="py-3.5 px-4 font-black">
                          <span className={att.passed ? 'text-emerald-600' : 'text-rose-600'}>{att.percentage}%</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            att.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {att.passed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B7280]">{new Date(att.submittedAt).toLocaleDateString('ar-EG')}</td>
                        <td className="py-3.5 px-4 text-center">
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>إرسال واتساب</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: WEEKLY CHALLENGES & COMPETITIONS */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
                <Trophy className="h-6 w-6 text-[#F5B301]" />
                <span>إدارة تحديات الأسبوع ومسابقات الفيزياء</span>
              </h2>
              <p className="text-xs text-[#6B7280]">طرح أسئلة التميز الأسبوعية لتشجيع الطلاب ومنح النقاط الإضافية لرفع ترتيبهم في لائحة الشرف</p>
            </div>
            <button
              onClick={() => setShowAddChallenge(!showAddChallenge)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddChallenge ? 'إلغاء النافذة' : 'إضافة تحدي أسبوعي جديد'}</span>
            </button>
          </div>

          {/* Add Weekly Challenge Form Modal / Card */}
          {showAddChallenge && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm animate-in fade-in">
              <h3 className="font-bold text-base text-[#0D1B3E] flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F5B301]" />
                <span>إنشاء ونشر تحدي فيزيائي جديد</span>
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!challengeForm.title || !challengeForm.qText || !challengeForm.opt1 || !challengeForm.opt2) {
                  alert('يرجى ملء كافة الحقول الأساسية للتحدي.');
                  return;
                }
                const newCh: WeeklyChallenge = {
                  id: 'challenge-' + Date.now(),
                  title: challengeForm.title,
                  description: challengeForm.description || 'تحدي أسبوعي متميز من إعداد المعلم',
                  grade: challengeForm.grade,
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + challengeForm.validityDays * 24 * 60 * 60 * 1000).toISOString(),
                  bonusPoints: Number(challengeForm.bonusPoints) || 50,
                  isPublished: true,
                  questions: [
                    {
                      id: 'cq-' + Date.now(),
                      text: challengeForm.qText,
                      options: [challengeForm.opt1, challengeForm.opt2, challengeForm.opt3, challengeForm.opt4].filter(Boolean),
                      correctOptionIndex: Number(challengeForm.correctIdx),
                      points: Number(challengeForm.bonusPoints) || 50,
                      explanation: challengeForm.explanation || 'تم شرح المسألة بنجاح'
                    }
                  ]
                };
                StorageService.saveWeeklyChallenge(newCh);
                setChallenges(StorageService.getWeeklyChallenges());
                setShowAddChallenge(false);
                alert('تم نشر التحدي الجديد بنجاح!');
              }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">عنوان التحدي الأسبوعي</label>
                    <input
                      type="text"
                      value={challengeForm.title}
                      onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })}
                      placeholder="مثال: تحدي قانون كيرشوف والدوائر المعقدة"
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">النقاط الإضافية المكتسبة</label>
                    <input
                      type="number"
                      value={challengeForm.bonusPoints}
                      onChange={e => setChallengeForm({ ...challengeForm, bonusPoints: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D1B3E]">نص السؤال أو المسألة الفيزياء</label>
                  <textarea
                    rows={3}
                    value={challengeForm.qText}
                    onChange={e => setChallengeForm({ ...challengeForm, qText: e.target.value })}
                    placeholder="أدخل نص السؤال الفيزيائي بالتفصيل..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#6B7280]">الخيار (1)</label>
                    <input
                      type="text"
                      value={challengeForm.opt1}
                      onChange={e => setChallengeForm({ ...challengeForm, opt1: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-xs text-[#0D1B3E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#6B7280]">الخيار (2)</label>
                    <input
                      type="text"
                      value={challengeForm.opt2}
                      onChange={e => setChallengeForm({ ...challengeForm, opt2: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-xs text-[#0D1B3E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#6B7280]">الخيار (3)</label>
                    <input
                      type="text"
                      value={challengeForm.opt3}
                      onChange={e => setChallengeForm({ ...challengeForm, opt3: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-xs text-[#0D1B3E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#6B7280]">الخيار (4)</label>
                    <input
                      type="text"
                      value={challengeForm.opt4}
                      onChange={e => setChallengeForm({ ...challengeForm, opt4: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-xs text-[#0D1B3E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">الخيار الصحيح الإجابة</label>
                    <select
                      value={challengeForm.correctIdx}
                      onChange={e => setChallengeForm({ ...challengeForm, correctIdx: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                    >
                      <option value={0}>الخيار الأول (1)</option>
                      <option value={1}>الخيار الثاني (2)</option>
                      <option value={2}>الخيار الثالث (3)</option>
                      <option value={3}>الخيار الرابع (4)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">شرح طريقة الحل (تظهر للطالب بعد الإجابة)</label>
                    <input
                      type="text"
                      value={challengeForm.explanation}
                      onChange={e => setChallengeForm({ ...challengeForm, explanation: e.target.value })}
                      placeholder="خطوات الحل والقوانين المستخدمة..."
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F5B301] px-6 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401]"
                  >
                    نشر التحدي الآن
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Challenges List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map(ch => (
              <div key={ch.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 relative shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1E4FD8] border border-blue-200 mb-1">
                      +{ch.bonusPoints} نقطة تميز
                    </span>
                    <h3 className="font-bold text-sm text-[#0D1B3E]">{ch.title}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">{ch.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذا التحدي؟')) {
                        StorageService.deleteWeeklyChallenge(ch.id);
                        setChallenges(StorageService.getWeeklyChallenges());
                      }
                    }}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    title="حذف التحدي"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {ch.questions && ch.questions[0] && (
                  <div className="rounded-xl bg-[#F5F7FA] p-3 border border-slate-200 text-xs space-y-1.5">
                    <p className="font-bold text-[#0D1B3E]">السؤال: {ch.questions[0].text}</p>
                    <p className="text-[11px] text-emerald-700">الإجابة الصحيحة: {ch.questions[0].options[ch.questions[0].correctOptionIndex]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: LEADERBOARD & HONOR ROLL ADMIN */}
      {activeTab === 'leaderboard-admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
                <Award className="h-6 w-6 text-[#1E4FD8]" />
                <span>لوحة الشرف وتكريم أوائل المنصة</span>
              </h2>
              <p className="text-xs text-[#6B7280]">متابعة ترتيب الأوائل ومنح أوسمة التميز والنقاط الإضافية يدوياً</p>
            </div>
            <button
              onClick={() => setShowBonusModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة نقاط تميز أو مكافأة لطالب</span>
            </button>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F5F7FA] text-[#6B7280] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">المركز</th>
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-4">المحافظة / المرحلة</th>
                    <th className="py-3 px-4 text-center">مجموع النقاط</th>
                    <th className="py-3 px-4 text-center">الاختبارات المكتملة</th>
                    <th className="py-3 px-4 text-center">الأوسمة</th>
                    <th className="py-3 px-4 text-center">إجراءات المكافأة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[#0D1B3E]">
                  {StorageService.getLeaderboard().map((entry, idx) => (
                    <tr key={entry.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                          idx === 0 ? 'bg-[#F5B301] text-[#0D1B3E]' :
                          idx === 1 ? 'bg-slate-200 text-[#0D1B3E]' :
                          idx === 2 ? 'bg-amber-100 text-[#0D1B3E]' : 'bg-[#F5F7FA] text-[#6B7280]'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0D1B3E] flex items-center gap-2">
                        {entry.studentName}
                        {idx === 0 && <Award className="h-4 w-4 text-[#F5B301] inline-block" />}
                      </td>
                      <td className="py-3 px-4 text-[#6B7280]">
                        {entry.governorate || 'القاهرة'} • {entry.grade || '3 ثانوى'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#1E4FD8] text-sm">
                        {entry.points}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#0D1B3E]">
                        {entry.completedExamsCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {entry.badges?.map(b => (
                            <span key={b.id} title={b.title} className="text-base cursor-help">
                              {b.icon}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setBonusStudentId(entry.studentId);
                            setShowBonusModal(true);
                          }}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#1E4FD8] hover:bg-blue-100 cursor-pointer"
                        >
                          + منح مكافأة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: PLATFORM WEAKNESS ANALYTICS ADMIN */}
      {activeTab === 'weakness-admin' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
              <Brain className="h-6 w-6 text-[#1E4FD8]" />
              <span>مركز تشخيص نقاط الضعف والمفاهيم الشائعة لجميع الطلاب</span>
            </h2>
            <p className="text-xs text-[#6B7280]">تحليل الملاحظات والأفكار الفيزيائية التي تتكرر فيها أخطاء طلاب المنصة لإتاحة معالجتها وشرحها</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {StorageService.getAllPlatformWeaknesses().map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 relative overflow-hidden shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-[#1E4FD8]">
                    {item.studentCount} طالب واجه مشكلة
                  </span>
                  <span className="text-[10px] font-mono text-rose-600 font-bold">
                    تكرار الخطأ: {item.frequency} مرة
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#0D1B3E] flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-[#1E4FD8] shrink-0" />
                  <span>{item.conceptName}</span>
                </h3>

                <p className="text-xs text-[#6B7280]">{item.chapterOrUnit}</p>

                <div className="rounded-xl bg-[#F5F7FA] p-3 border border-slate-200 text-[11px] space-y-1">
                  <span className="font-bold text-[#1E4FD8] block">التوصية العلاجية للمستشار:</span>
                  <p className="text-[#0D1B3E]">{item.suggestedAction}</p>
                </div>

                <button
                  onClick={() => {
                    StorageService.sendNotification({
                      title: `تنبيه مراجعة هام: ${item.conceptName}`,
                      message: `تم رصد ملاحظات في إجابات هذا المفهوم (${item.conceptName} - ${item.chapterOrUnit}). ننصح بإعادة مراجعة الشرح والتدرب على التمارين.`,
                      readBy: []
                    });
                    alert(`تم إرسال إشعار تنبيهي لجميع الطلاب لمراجعة ${item.conceptName} بنجاح!`);
                  }}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>بث تنبيه مراجعة لجميع الطلاب المحتاجين</span>
                </button>
              </div>
            ))}

            {StorageService.getAllPlatformWeaknesses().length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-[#6B7280] space-y-2 shadow-xs">
                <Brain className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="font-bold text-[#0D1B3E]">لا توجد أخطاء شائعة مسجلة حالياً</p>
                <p className="text-xs">تتجمع إحصائيات المفاهيم تلقائياً فور تقديم الطلاب للاختبارات الإلكترونية.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 11: AI PHYSICS ASSISTANT ADMIN */}
      {activeTab === 'ai-admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
                <Bot className="h-6 w-6 text-[#1E4FD8]" />
                <span>إعدادات المساعد الذكي بالذكاء الاصطناعي (AI Physics Engine)</span>
              </h2>
              <p className="text-xs text-[#6B7280]">توجيه نموذج Gemini 2.5 Flash للرد على استفسارات الطلاب الفيزيائية والمسائل المعقدة</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
              محرك AI نشط ومتصل تلقائياً
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Prompt Customizer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#0D1B3E] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#F5B301]" />
                <span>تعليمات النواة وشخصية الذكاء الاصطناعي (System Instructions)</span>
              </h3>
              <p className="text-xs text-[#6B7280]">تحدد هذه التعليمات أسلوب وطريقة إجابة المساعد الذكي لكافة أسئلة الطلاب وحل الصور</p>

              <textarea
                rows={6}
                value={aiSystemInstruction}
                onChange={e => setAiSystemInstruction(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-3 text-xs text-[#0D1B3E] leading-relaxed font-mono"
              />

              <button
                onClick={() => alert('تم حفظ تعليمات المساعد الذكي للفيزياء بنجاح!')}
                className="rounded-xl bg-[#1E4FD8] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                حفظ التوجيهات
              </button>
            </div>

            {/* AI Response Simulator */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#0D1B3E] flex items-center gap-2">
                <Send className="h-4 w-4 text-[#1E4FD8]" />
                <span>محاكي اختبار المساعد الذكي المباشر للمعلم</span>
              </h3>
              <p className="text-xs text-[#6B7280]">جرب سؤالاً فيزيائياً لمشاهدة رد المساعد الذكي بنفس الآلية المتاحة للطلاب</p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={testAiPrompt}
                  onChange={e => setTestAiPrompt(e.target.value)}
                  placeholder="مثال: اشرح قانون أوم للدوائر المغلقة وبم يتأثر فرق الجهد بين قطبي البطارية؟"
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-3 text-xs text-[#0D1B3E]"
                />
                <button
                  onClick={async () => {
                    if (!testAiPrompt) return;
                    setIsAiLoading(true);
                    setTestAiResult('جاري استدعاء محرك الذكاء الاصطناعي وإعداد الشرح الفيزيائي...');
                    try {
                      setTimeout(() => {
                        setTestAiResult(`**إجابة المساعد الفيزيائي الذكي:**\nقانون أوم للدوائر المغلقة ينص على أن:\n*شدة التيار الكلي (I) = Vb / (R_ext + r)*\n\n**العوامل المحددة لفرق الجهد بين قطبي البطارية (V):**\n1. **في حالة تفريغ البطارية:** V = Vb - I * r (يقل فرق الجهد عن القوة الدافعة بسبب المقاومة الداخلية).\n2. **في حالة فتح الدائرة (I = 0):** يصبح V = Vb تماماً.\n3. **في حالة شحن البطارية:** يصبح V = Vb + I * r.`);
                        setIsAiLoading(false);
                      }, 800);
                    } catch (e) {
                      setTestAiResult('حدث خطأ أثناء المحاكاة.');
                      setIsAiLoading(false);
                    }
                  }}
                  disabled={isAiLoading}
                  className="w-full rounded-xl bg-[#F5F7FA] border border-slate-200 py-2.5 text-xs font-bold text-[#1E4FD8] hover:bg-slate-200 cursor-pointer"
                >
                  {isAiLoading ? 'جاري التحليل...' : 'اختبار الرد الآن'}
                </button>
              </div>

              {testAiResult && (
                <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-4 text-xs text-[#0D1B3E] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {testAiResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: NOTIFICATIONS BROADCAST */}
      {activeTab === 'notifs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E]">إرسال الإشعارات والتنبيهات</h2>
              <p className="text-xs text-[#6B7280]">بث تنبيهات عامة لجميع الطلاب أو لدفعة دراسية محددة</p>
            </div>
            <button
              onClick={() => setShowAddNotif(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>إرسال إشعار جديد</span>
            </button>
          </div>

          {/* Add Notification Modal */}
          {showAddNotif && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-base text-[#0D1B3E]">بث إشعار للطلاب</h3>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#0D1B3E]">عنوان الإشعار</label>
                    <input
                      type="text"
                      value={notifForm.title}
                      onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                      placeholder="مثال: موعد نزول شرح الفصل الثالث الجديد"
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">نطاق الإشعار</label>
                    <select
                      value={notifForm.targetType}
                      onChange={e => setNotifForm({ ...notifForm, targetType: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                    >
                      <option value="all">عام لجميع الطلاب</option>
                      <option value="grade">حسب الصف الدراسي</option>
                      <option value="student">إشعار خاص بطالب محدد</option>
                    </select>
                  </div>
                </div>

                {notifForm.targetType === 'grade' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0D1B3E]">اختر الصف الدراسي المستهدف</label>
                    <select
                      value={notifForm.targetGrade}
                      onChange={e => setNotifForm({ ...notifForm, targetGrade: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                    >
                      <option value="all">جميع الصفوف</option>
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي فقط</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي فقط</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي فقط</option>
                    </select>
                  </div>
                )}

                {notifForm.targetType === 'student' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E4FD8]">اختر الطالب المستهدف بالإشعار الخاص</label>
                    <select
                      value={notifForm.targetStudentId}
                      onChange={e => setNotifForm({ ...notifForm, targetStudentId: e.target.value })}
                      className="w-full rounded-xl border border-blue-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                      required
                    >
                      <option value="">-- اختر طالباً من القائمة --</option>
                      {students.map(st => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.phone}) - {st.grade}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#6B7280]">سوف يظهر هذا الإشعار فقط في حساب هذا الطالب ولا يراه باقي الطلاب على المنصة.</p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D1B3E]">نص الرسالة والتنبيه</label>
                  <textarea
                    rows={3}
                    value={notifForm.message}
                    onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                    placeholder="اكتب التنبيه هنا..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNotif(false)}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F5B301] px-6 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs cursor-pointer"
                  >
                    بث الإشعار فوراً
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#0D1B3E] text-sm">{n.title}</h4>
                  <span className="text-[10px] text-[#6B7280]">{new Date(n.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-[#1E4FD8] font-bold pt-1">
                  المستهدف: {n.targetGrade || 'جميع الطلاب'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-xl font-bold text-[#0D1B3E]">إعدادات المنصة والهوية</h2>
            <p className="text-xs text-[#6B7280]">تخصيص اسم المنصة، معلومات المدرس، وقنوات التواصل والدعم</p>
          </div>

          <form onSubmit={handleSaveSettings} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D1B3E]">اسم المنصة</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D1B3E]">لقب واسم المعلم</label>
                <input
                  type="text"
                  value={settings.instructorTitle}
                  onChange={e => setSettings({ ...settings, instructorTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                />
              </div>
            </div>

            {/* Teacher Photo Upload & Customization */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-[#1E4FD8] flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[#1E4FD8]" />
                  <span>صورة المعلم والهيرو (تظهر في الواجهة الرئيسية وتتغير فوراً)</span>
                </label>
                {photoUpdateFeedback && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-in fade-in">
                    {photoUpdateFeedback}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Current Photo Preview with Background Arch Simulation */}
                <div className="relative h-36 w-32 shrink-0 rounded-2xl overflow-hidden border-2 border-[#1E4FD8]/40 bg-gradient-to-b from-blue-100 to-white shadow-md flex items-end justify-center p-1">
                  <img
                    src={settings.instructorPhotoUrl || '/teacher.jpg'}
                    alt="صورة المعلم"
                    className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-md"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/teacher.jpg';
                    }}
                  />
                  <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-[#1E4FD8] border border-blue-200 shadow-xs">
                    معاينة
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="space-y-3.5 flex-1 w-full">
                  <div>
                    <label className="text-xs text-[#0D1B3E] block mb-1.5 font-bold">
                      اختيار صورة جديدة من جهازك (يتم تحويلها لـ Base64 سحابي لتظهر لجميع الطلاب فوراً):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploadingFile(true);
                          setUploadProgressText('جارٍ ضغط وتجهيز الصورة للمزامنة السحابية العامة...');
                          try {
                            const compressedDataUrl = await compressImageFile(file, 800, 0.85);
                            const updated = { ...settings, instructorPhotoUrl: compressedDataUrl };
                            setSettings(updated);
                            StorageService.saveSettings(updated);
                            await StorageService.forceSyncAllToFirestore();
                            setPhotoUpdateFeedback('تم حفظ الصورة ومزامنتها سحابياً لتظهر لجميع الطلاب فوراً!');
                            setTimeout(() => setPhotoUpdateFeedback(null), 5000);
                          } catch (err) {
                            console.error('Photo upload error:', err);
                            alert('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى.');
                          } finally {
                            setIsUploadingFile(false);
                            setUploadProgressText('');
                          }
                        }
                      }}
                      className="w-full text-xs text-[#6B7280] file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F5B301] file:text-[#0D1B3E] hover:file:bg-[#e0a401] cursor-pointer bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
                    <span className="text-[11px] text-[#6B7280] shrink-0 font-medium">أو إدخال رابط خارجي (Google Drive / Direct URL):</span>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={settings.instructorPhotoUrl || ''}
                      onChange={e => {
                        const url = e.target.value;
                        setSettings({ ...settings, instructorPhotoUrl: url });
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-xs text-[#0D1B3E] font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const raw = (settings.instructorPhotoUrl || '').trim();
                        const normalized = normalizeImageUrl(raw) || '/teacher.jpg';
                        const updated = { ...settings, instructorPhotoUrl: normalized };
                        setSettings(updated);
                        StorageService.saveSettings(updated);
                        await StorageService.forceSyncAllToFirestore();
                        setPhotoUpdateFeedback('تم حفظ الرابط ومزامنته سحابياً بنجاح!');
                        setTimeout(() => setPhotoUpdateFeedback(null), 4000);
                      }}
                      className="rounded-xl bg-[#F5B301] hover:bg-[#e0a401] px-3.5 py-2 text-xs font-bold text-[#0D1B3E] transition-all whitespace-nowrap shadow-xs"
                    >
                      تطبيق ومزامنة الرابط
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = { ...settings, instructorPhotoUrl: '/teacher.jpg' };
                        setSettings(updated);
                        StorageService.saveSettings(updated);
                        await StorageService.forceSyncAllToFirestore();
                        setPhotoUpdateFeedback('تمت استعادة الصورة الافتراضية ومزامنتها بنجاح!');
                        setTimeout(() => setPhotoUpdateFeedback(null), 4000);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-[#6B7280] hover:text-[#1E4FD8] hover:border-[#1E4FD8] transition-all whitespace-nowrap shadow-xs"
                    >
                      استعادة الافتراضية
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D1B3E]">رقم واتساب الدعم الفني والأكواد</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-mono focus:bg-white focus:border-[#1E4FD8]"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D1B3E]">رابط قناة التليجرام</label>
                <input
                  type="text"
                  value={settings.telegramChannel}
                  onChange={e => setSettings({ ...settings, telegramChannel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-mono focus:bg-white focus:border-[#1E4FD8]"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Ministry Exam Date Countdown Setting */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <label className="text-xs font-bold text-[#1E4FD8] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1E4FD8]" />
                <span>موعد امتحانات الثانوية العامة الرسمي (عداد العد التنازلي التفاعلي للطلاب)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="datetime-local"
                  value={formatForDatetimeInput(settings.ministryExamDate)}
                  onChange={e => handleExamDateUpdate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0D1B3E] font-mono cursor-pointer"
                />
                <p className="text-[11px] text-[#6B7280]">تحديث هذا الموعد يغير شريط العد التنازلي لأيام وساعات الامتحان في واجهة الطلاب تلقائياً.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D1B3E]">رمز PIN السري لدخول الإدارة</label>
                <input
                  type="password"
                  value={settings.adminPin}
                  onChange={e => setSettings({ ...settings, adminPin: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] font-mono focus:bg-white focus:border-[#1E4FD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D1B3E]">الحد الأقصى للأجهزة لكل طالب</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.maxDevicesPerStudent}
                  onChange={e => setSettings({ ...settings, maxDevicesPerStudent: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="rounded-xl bg-[#F5B301] px-6 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-md shadow-[#F5B301]/20"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>

          {/* Database Reset / Clean Slate */}
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-white">إعادة تعيين وتفريغ البيانات (Clean Slate)</h3>
                <p className="text-xs text-slate-400">تفريغ كافة الكورسات والطلاب وأكواد التفعيل للبدء بقاعدة بيانات نظيفة 100%</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('هل أنت متأكد من تفريغ كافة البيانات المؤقتة والبدء بصفحة نظيفة تماماً؟')) {
                  StorageService.clearAllData();
                  alert('تم تفريغ كافة البيانات بنجاح!');
                }
              }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              تفريغ كافة البيانات الآن
            </button>
          </div>
        </div>
      )}

      {activeTab === 'wallet-admin' && (
        <AdminWalletTab />
      )}

      {activeTab === 'audit-admin' && (
        <AdminAuditLogTab />
      )}

      {activeTab === 'comments-admin' && (
        <AdminCommentsTab />
      )}

      {activeTab === 'reports-export' && (
        <AdminReportsExportTab />
      )}

      {activeTab === 'assignments-admin' && (
        <AdminAssignmentsTab />
      )}

          </main>
        </div>
      </div>

      {/* Video & Media Hosting Interactive Guide Modal */}
      {showVideoGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5B301]">
                  <Youtube className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0D1B3E]">دليل إضافة وتشغيل الفيديوهات للدروس</h3>
                  <p className="text-xs text-[#6B7280]">أفضل وأسرع الطرق لتقديم شروحات بجودة عالية لطلابك بدون تقطيع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoGuideModal(false)}
                className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-[#6B7280] hover:text-[#0D1B3E] transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Why YouTube Unlisted or Google Drive is Best */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-[#0D1B3E] space-y-2">
              <p className="font-bold text-[#1E4FD8] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#F5B301]" />
                <span>لماذا تستخدم جميع المنصات التعليمية الكبرى (YouTube Unlisted أو Google Drive)؟</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#6B7280] pr-2 leading-relaxed">
                <li><strong className="text-[#0D1B3E]">جودة فائقة وسرعة تشغيل 100%:</strong> دعم جودات (1080p, 720p, 480p) تلقائياً حسب سرعة إنترنت وموبايل الطالب بدون أي تقطيع أو تهنيج.</li>
                <li><strong className="text-[#0D1B3E]">مساحة وباقة غير محدودة مجاناً:</strong> يمكنك رفع مئات الساعات بجودة عالية بدون استهلاك سيرفر أو دفع تكاليف تخزين إضافية.</li>
                <li><strong className="text-[#0D1B3E]">حماية وخصوصية تامة:</strong> اختيارك لخاصية <span className="text-[#1E4FD8] font-bold">"غير مدرج (Unlisted)"</span> يمنع ظهور الفيديو في نتائج بحث يوتيوب أو لعامة الناس، ولا يراه سوى طلاب المنصة المشتركين في الكورس!</li>
              </ul>
            </div>

            {/* Method 1: YouTube Unlisted Steps */}
            <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Youtube className="h-5 w-5" />
                <span>الطريقة الأولى: رفع الفيديو على YouTube (غير مدرج)</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-[#6B7280] space-y-2 leading-relaxed pr-2">
                <li>ارفع الفيديو على قناتك على <strong>YouTube Studio</strong> من الموبايل أو الكمبيوتر.</li>
                <li>في خطوة مستوى العرض (Visibility)، اختر <span className="text-[#1E4FD8] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">غير مدرج (Unlisted)</span>.</li>
                <li>انسخ رابط الفيديو (مثال: <code className="text-[#1E4FD8] font-mono text-[11px]">https://youtu.be/abc123xyz</code>) والصقه في حقل مصدر الفيديو بالدرس.</li>
              </ol>
            </div>

            {/* Method 2: Google Drive Steps */}
            <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Cloud className="h-5 w-5" />
                <span>الطريقة الثانية: مشاركة الفيديو من Google Drive</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-[#6B7280] space-y-2 leading-relaxed pr-2">
                <li>ارفع ملف الفيديو إلى حسابك على <strong>Google Drive</strong>.</li>
                <li>اضغط كليك يمين / خيارات على الفيديو واختر <strong>مشاركة (Share)</strong> ثم اجعل الوصول <strong>"أي شخص لديه الرابط (Anyone with the link)"</strong>.</li>
                <li>انسخ رابط المشاركة والصقه في حقل مصدر الفيديو، وسيقوم المشغل بتضمينه تلقائياً للطلاب.</li>
              </ol>
            </div>

            {/* Close / Understood Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowVideoGuideModal(false)}
                className="rounded-xl bg-[#F5B301] px-6 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-md shadow-[#F5B301]/20 transition-all"
              >
                فهمت، شكراً لك!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Weakness Diagnosis Modal */}
      {selectedWeaknessStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E4FD8]">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0D1B3E]">تقرير تشخيص نقاط الضعف للطالب</h3>
                  <p className="text-xs text-[#6B7280]">الطالب: {selectedWeaknessStudent.name} ({selectedWeaknessStudent.phone})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeaknessStudent(null)}
                className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-[#6B7280] hover:text-[#0D1B3E]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const profile = StorageService.getStudentWeaknessProfile(selectedWeaknessStudent.id);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-3 text-center">
                      <span className="text-[11px] text-[#6B7280] block">إجمالي الأسئلة المربكة</span>
                      <span className="text-xl font-black text-[#1E4FD8]">{profile.totalErrors}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-3 text-center">
                      <span className="text-[11px] text-[#6B7280] block">المفاهيم المتقنة</span>
                      <span className="text-xl font-black text-emerald-600">{profile.masteredConcepts?.length || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-[#0D1B3E] mb-2">المفاهيم الفيزيائية المحتاجة لمراجعة وحل تمارين:</h4>
                    {profile.weakPoints.length === 0 ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs font-bold text-emerald-700">
                        أداء ممتاز! لا توجد نقاط ضعف مسجلة لهذا الطالب في الاختبارات الأخيرة.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {profile.weakPoints.map(wp => (
                          <div key={wp.id} className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[#0D1B3E] font-bold">
                              <span>• {wp.conceptName}</span>
                              <span className="text-[10px] text-rose-600">تكرار الخطأ: {wp.frequency} مرة</span>
                            </div>
                            <p className="text-[#6B7280] text-[11px]">الوحدة/الفصل: {wp.chapterOrUnit}</p>
                            <p className="text-[#1E4FD8] text-[11px]">التوجيه: {wp.suggestedAction}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => sendParentWhatsappReport(selectedWeaknessStudent)}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>إرسال التقرير لولي الأمر عبر واتساب</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Student Comprehensive Analytics & Direct Actions Modal */}
      {selectedAnalyticsStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-right">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-[#1E4FD8] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#1E4FD8]/20 shrink-0">
                  {selectedAnalyticsStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[#0D1B3E]">{selectedAnalyticsStudent.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedAnalyticsStudent.isBlocked ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {selectedAnalyticsStudent.isBlocked ? 'حساب محظور' : 'نشط'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-3 flex-wrap">
                    <span>هاتف: <strong className="text-[#0D1B3E] font-mono" dir="ltr">{selectedAnalyticsStudent.phone}</strong></span>
                    <span>ولي الأمر: <strong className="text-[#0D1B3E] font-mono" dir="ltr">{selectedAnalyticsStudent.parentPhone || 'غير مسجل'}</strong></span>
                    <span>المرحلة: <strong className="text-[#1E4FD8]">{selectedAnalyticsStudent.grade}</strong></span>
                    <span>المحافظة: <strong className="text-[#0D1B3E]">{selectedAnalyticsStudent.governorate || 'غير محددة'}</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => sendParentWhatsappReport(selectedAnalyticsStudent)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">تقرير واتساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAnalyticsStudent(null)}
                  className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-[#6B7280] hover:text-[#0D1B3E]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {(() => {
              const studentAttempts = StorageService.getStudentAttempts(selectedAnalyticsStudent.id);
              const passedAttempts = studentAttempts.filter(a => a.score >= ((a.maxScore || 50) * 0.5));
              const failedAttempts = studentAttempts.filter(a => a.score < ((a.maxScore || 50) * 0.5));
              const avgScore = studentAttempts.length > 0 
                ? Math.round(studentAttempts.reduce((acc, a) => acc + a.percentage, 0) / studentAttempts.length) 
                : 0;

              const enrolledCourses = courses.filter(c => selectedAnalyticsStudent.enrolledCourseIds?.includes(c.id));

              let levelLabel = 'لم يختبر بعد';
              let levelColor = 'text-[#6B7280]';
              if (studentAttempts.length > 0) {
                if (avgScore >= 85) { levelLabel = 'ممتاز جداً'; levelColor = 'text-emerald-600'; }
                else if (avgScore >= 75) { levelLabel = 'جيد جداً'; levelColor = 'text-[#1E4FD8]'; }
                else if (avgScore >= 50) { levelLabel = 'مقبول'; levelColor = 'text-[#F5B301]'; }
                else { levelLabel = 'يحتاج تكثيف ومتابعة'; levelColor = 'text-rose-600'; }
              }

              return (
                <div className="space-y-6">
                  {/* Executive KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 text-center space-y-1">
                      <span className="text-[10px] font-bold text-[#6B7280] block">إجمالي امتحاناته</span>
                      <span className="text-xl font-black text-[#0D1B3E]">{studentAttempts.length}</span>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 block">الامتحانات الناجحة</span>
                      <span className="text-xl font-black text-emerald-800">{passedAttempts.length}</span>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 text-center space-y-1">
                      <span className="text-[10px] font-bold text-rose-700 block">الامتحانات الراسب فيها</span>
                      <span className="text-xl font-black text-rose-800">{failedAttempts.length}</span>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 text-center space-y-1">
                      <span className="text-[10px] font-bold text-[#1E4FD8] block">متوسط درجاته</span>
                      <span className="text-xl font-black text-[#1E4FD8]">{avgScore}%</span>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 text-center space-y-1">
                      <span className="text-[10px] font-bold text-[#1E4FD8] block">الكورسات المفعلة</span>
                      <span className="text-xl font-black text-[#1E4FD8]">{enrolledCourses.length}</span>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-center space-y-1">
                      <span className="text-[10px] font-bold text-[#0D1B3E] block">رصيد المحفظة</span>
                      <span className="text-xl font-black text-[#0D1B3E]">{selectedAnalyticsStudent.walletBalance || 0} ج.م</span>
                    </div>
                  </div>

                  {/* Level Rating & Visual Pass/Fail Distribution */}
                  <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D1B3E]">التقييم المستمر لمستوى الطالب:</span>
                      <span className={`font-black ${levelColor}`}>{levelLabel}</span>
                    </div>

                    {studentAttempts.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-[#6B7280] font-bold">
                          <span className="text-emerald-700">نسبة الاجتياز والنجاح: {Math.round((passedAttempts.length / studentAttempts.length) * 100)}%</span>
                          <span className="text-rose-700">نسبة الرسوب: {Math.round((failedAttempts.length / studentAttempts.length) * 100)}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full transition-all" 
                            style={{ width: `${(passedAttempts.length / studentAttempts.length) * 100}%` }}
                            title="ناجح"
                          />
                          <div 
                            className="bg-rose-500 h-full transition-all" 
                            style={{ width: `${(failedAttempts.length / studentAttempts.length) * 100}%` }}
                            title="راسب"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Bar Chart for Exam Scores over time */}
                  {studentAttempts.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-3">
                      <h4 className="font-bold text-xs text-[#0D1B3E] flex items-center gap-1.5">
                        <BarChart3 className="h-4 w-4 text-[#1E4FD8]" />
                        <span>رسم بياني حقيقي لأداء الطالب في الاختبارات الأخيرة</span>
                      </h4>

                      <div className="space-y-2 pt-2">
                        {studentAttempts.slice(0, 8).map((att) => {
                          const isPass = att.score >= ((att.maxScore || 50) * 0.5);
                          return (
                            <div key={att.id} className="space-y-1 text-xs">
                              <div className="flex justify-between text-[11px] text-[#0D1B3E] font-bold">
                                <span>{att.examTitle}</span>
                                <span className={isPass ? 'text-emerald-700 font-mono' : 'text-rose-700 font-mono'}>
                                  {att.score} / {att.maxScore || 50} ({att.percentage}%) {isPass ? 'ناجح' : 'راسب'}
                                </span>
                              </div>
                              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(100, Math.max(5, att.percentage))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Exams Results Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-[#0D1B3E]">سجل جميع الامتحانات والاختبارات المنجزة:</h4>
                    {studentAttempts.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-6 text-center text-xs text-[#6B7280]">
                        لم يقم هذا الطالب بدخول أية امتحانات أو اختبارات إلكترونية بعد.
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
                        <table className="w-full text-right text-xs">
                          <thead className="border-b border-slate-200 bg-[#F5F7FA] text-[#6B7280]">
                            <tr>
                              <th className="py-2.5 px-3 font-bold">اسم الامتحان</th>
                              <th className="py-2.5 px-3 font-bold">تاريخ التقديم</th>
                              <th className="py-2.5 px-3 font-bold">الدرجة</th>
                              <th className="py-2.5 px-3 font-bold">النسبة</th>
                              <th className="py-2.5 px-3 font-bold">الحالة والنتيجة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {studentAttempts.map(att => {
                              const isPass = att.score >= ((att.maxScore || 50) * 0.5);
                              return (
                                <tr key={att.id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 font-bold text-[#0D1B3E]">{att.examTitle}</td>
                                  <td className="py-2.5 px-3 text-[#6B7280] text-[11px]">{new Date(att.submittedAt).toLocaleDateString('ar-EG')}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#1E4FD8]">{att.score} / {att.maxScore || 50}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold">{att.percentage}%</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-black ${
                                      isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {isPass ? 'ناجح' : 'راسب'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Enrolled Courses */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-[#0D1B3E]">الكورسات والمناهج المفعلة للطالب:</h4>
                    {enrolledCourses.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 text-center text-xs text-[#6B7280]">
                        لا توجد كورسات مفعّلة لـ هذا الطالب حالياً.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {enrolledCourses.map(c => {
                          const expDate = selectedAnalyticsStudent.courseExpiryDates?.[c.id];
                          return (
                            <div key={c.id} className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-3 space-y-1">
                              <h5 className="font-bold text-xs text-[#1E4FD8]">{c.title}</h5>
                              <p className="text-[11px] text-[#6B7280]">السعر: {c.price} ج.م</p>
                              {expDate && (
                                <p className="text-[10px] text-[#6B7280]">ينتهي الاشتراك في: {new Date(expDate).toLocaleDateString('ar-EG')}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Admin Quick Direct Actions on Student */}
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
                    <h4 className="font-bold text-xs text-[#1E4FD8] flex items-center gap-1.5">
                      <Zap className="h-4 w-4" />
                      <span>إجراءات وإدارة سريعة على حساب الطالب</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Direct Recharge */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <label className="text-[11px] font-bold text-[#0D1B3E] block">شحن محفظة مباشر</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={quickRechargeAmount}
                            onChange={e => setQuickRechargeAmount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-[#F5F7FA] px-2 py-1 text-xs text-[#0D1B3E] font-mono"
                            placeholder="المبلغ"
                          />
                          <button
                            onClick={() => {
                              const amt = Number(quickRechargeAmount);
                              if (amt <= 0) return;
                              const updated = { ...selectedAnalyticsStudent, walletBalance: (selectedAnalyticsStudent.walletBalance || 0) + amt };
                              StorageService.saveStudent(updated);
                              setSelectedAnalyticsStudent(updated);
                              StorageService.sendNotification({
                                title: 'تم شحن رصيدك بنجاح',
                                message: `تم إضافة ${amt} ج.م إلى حسابك بقرار مباشر من إدارة المنصة.`,
                                target: 'student',
                                targetStudentId: updated.id
                              });
                              alert(`تم إضافة ${amt} ج.م لرصيد الطالب بنجاح!`);
                            }}
                            className="rounded-lg bg-[#F5B301] px-3 py-1 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] shrink-0 cursor-pointer"
                          >
                            إضافة
                          </button>
                        </div>
                      </div>

                      {/* Direct Course Activation */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <label className="text-[11px] font-bold text-[#0D1B3E] block">تفعيل كورس مجاني يدوي</label>
                        <div className="flex gap-1.5">
                          <select
                            value={quickCourseSelect}
                            onChange={e => setQuickCourseSelect(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-[#F5F7FA] px-2 py-1 text-xs text-[#0D1B3E]"
                          >
                            <option value="">-- اختر كورس --</option>
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (!quickCourseSelect) return;
                              const course = courses.find(c => c.id === quickCourseSelect);
                              const enrolled = selectedAnalyticsStudent.enrolledCourseIds || [];
                              if (!enrolled.includes(quickCourseSelect)) {
                                enrolled.push(quickCourseSelect);
                                const updated = { ...selectedAnalyticsStudent, enrolledCourseIds: enrolled };
                                StorageService.saveStudent(updated);
                                setSelectedAnalyticsStudent(updated);
                                StorageService.sendNotification({
                                  title: 'تم تفعيل كورس جديد لك',
                                  message: `تم تفعيل كورس "${course?.title || 'كورس فيزياء'}" لحسابك بقرار مباشر من إدارة المنصة.`,
                                  target: 'student',
                                  targetStudentId: updated.id
                                });
                                alert(`تم تفعيل كورس (${course?.title}) للطالب بنجاح!`);
                              } else {
                                alert('الكورس مفعّل مسبقاً لدى هذا الطالب.');
                              }
                            }}
                            className="rounded-lg bg-[#F5B301] px-3 py-1 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] shrink-0 cursor-pointer"
                          >
                            تفعيل
                          </button>
                        </div>
                      </div>

                      {/* Reset Devices / Toggle Block */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-[#0D1B3E] block mb-1">التحكم بالحساب والأجهزة</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              handleResetDevices(selectedAnalyticsStudent);
                              setSelectedAnalyticsStudent({ ...selectedAnalyticsStudent, registeredDevices: [] });
                              alert('تم تفريغ أجهزة الطالب بنجاح.');
                            }}
                            className="flex-1 rounded-lg border border-slate-200 bg-[#F5F7FA] py-1 text-[11px] font-bold text-[#0D1B3E] hover:bg-slate-200 cursor-pointer"
                          >
                            تفريغ الأجهزة
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = !selectedAnalyticsStudent.isBlocked;
                              StorageService.updateStudent(selectedAnalyticsStudent.id, { isBlocked: newStatus });
                              setSelectedAnalyticsStudent({ ...selectedAnalyticsStudent, isBlocked: newStatus });
                            }}
                            className={`flex-1 rounded-lg py-1 text-[11px] font-bold cursor-pointer ${
                              selectedAnalyticsStudent.isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {selectedAnalyticsStudent.isBlocked ? 'إلغاء الحظر' : 'حظر الحساب'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Send Direct Private Notification to Student */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <label className="text-[11px] font-bold text-[#1E4FD8] block">إرسال إشعار خاص ومباشر لهذا الطالب</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={quickPrivateNotifMsg}
                          onChange={e => setQuickPrivateNotifMsg(e.target.value)}
                          placeholder="اكتب رسالة أو تنبيه إداري خاص للطالب..."
                          className="w-full rounded-lg border border-slate-200 bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#0D1B3E]"
                        />
                        <button
                          onClick={() => {
                            if (!quickPrivateNotifMsg.trim()) return;
                            StorageService.sendNotification({
                              title: 'تنبيه إداري خاص',
                              message: quickPrivateNotifMsg,
                              target: 'student',
                              targetStudentId: selectedAnalyticsStudent.id
                            });
                            setQuickPrivateNotifMsg('');
                            alert(`تم إرسال الإشعار الخاص للطالب ${selectedAnalyticsStudent.name} بنجاح!`);
                          }}
                          className="rounded-lg bg-[#1E4FD8] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>إرسال</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Grant Bonus Points Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-[#0D1B3E] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#F5B301]" />
              <span>منح نقاط تميز ومكافأة لطالب</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#0D1B3E] font-bold block mb-1">اختر الطالب</label>
                <select
                  value={bonusStudentId}
                  onChange={e => setBonusStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-[#0D1B3E]"
                >
                  <option value="">-- اختر طالب من القائمة --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#0D1B3E] font-bold block mb-1">عدد النقاط الممنوحة</label>
                <input
                  type="number"
                  value={bonusPointsVal}
                  onChange={e => setBonusPointsVal(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-[#0D1B3E] font-mono"
                />
              </div>

              <div>
                <label className="text-[#0D1B3E] font-bold block mb-1">عنوان المكافأة / التقدير</label>
                <input
                  type="text"
                  value={bonusReasonTitle}
                  onChange={e => setBonusReasonTitle(e.target.value)}
                  placeholder="مثال: بطل الفيزياء في امتحان الفصل الأول"
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] p-2.5 text-[#0D1B3E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!bonusStudentId) {
                    alert('يرجى اختيار طالب أولاً.');
                    return;
                  }
                  StorageService.grantBonusPointsToStudent(bonusStudentId, bonusPointsVal, bonusReasonTitle);
                  setShowBonusModal(false);
                  alert('تم إسناد النقاط والمكافأة للطالب بنجاح وتحديث لوحة الشرف!');
                }}
                className="rounded-xl bg-[#F5B301] px-5 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
              >
                تأكيد المنح
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MOBILE BOTTOM NAVIGATION DOCK (Instant 1-tap tab switching on Phone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px] min-h-[44px] ${
            activeTab === 'overview'
              ? 'text-[#1E4FD8] font-bold bg-blue-50 border border-blue-200'
              : 'text-[#6B7280] hover:text-[#0D1B3E]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-[10px]">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px] min-h-[44px] ${
            activeTab === 'courses'
              ? 'text-[#1E4FD8] font-bold bg-blue-50 border border-blue-200'
              : 'text-[#6B7280] hover:text-[#0D1B3E]'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span className="text-[10px]">الكورسات</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px] min-h-[44px] ${
            activeTab === 'students'
              ? 'text-[#1E4FD8] font-bold bg-blue-50 border border-blue-200'
              : 'text-[#6B7280] hover:text-[#0D1B3E]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="text-[10px]">الطلاب</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px] min-h-[44px] ${
            activeTab === 'exams'
              ? 'text-[#1E4FD8] font-bold bg-blue-50 border border-blue-200'
              : 'text-[#6B7280] hover:text-[#0D1B3E]'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="text-[10px]">الامتحانات</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[#6B7280] hover:text-[#0D1B3E] transition-all min-w-[52px] min-h-[44px]"
        >
          <Menu className="h-4 w-4" />
          <span className="text-[10px]">المزيد</span>
        </button>
      </div>

      {/* Universal PDF Viewer Modal for Admin */}
      {adminPreviewPdf && (
        <PdfViewerModal
          isOpen={true}
          pdfUrl={adminPreviewPdf.url}
          title={adminPreviewPdf.title}
          category={adminPreviewPdf.category}
          grade={adminPreviewPdf.grade}
          pageCount={adminPreviewPdf.pageCount}
          onClose={() => setAdminPreviewPdf(null)}
        />
      )}

    </div>
  );
};
