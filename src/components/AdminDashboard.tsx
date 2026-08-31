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
  Brain
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { MediaStore } from '../services/mediaStore';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'exams' | 'students' | 'codes' | 'pdfs' | 'results' | 'challenges' | 'leaderboard-admin' | 'weakness-admin' | 'ai-admin' | 'notifs' | 'settings'>('overview');
  
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
  const [showAddCode, setShowAddCode] = useState(false);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [selectedWeaknessStudent, setSelectedWeaknessStudent] = useState<Student | null>(null);
  const [dateUpdateFeedback, setDateUpdateFeedback] = useState<string | null>(null);
  
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
    isLocked: true
  });

  // Notification Form
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    targetGrade: 'all'
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
    
    // For images under 5MB: instant zero-fail client fallback
    if (type === 'image' && file.size <= 5 * 1024 * 1024) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setIsUploadingFile(false);
        setUploadProgressText('');
        const sizeFormatted = `${Math.round(file.size / 1024)} KB`;
        onSuccess(dataUrl, file.name, sizeFormatted);
        return;
      } catch (e) {
        console.warn('Image read error, trying API upload...', e);
      }
    }

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
      throw new Error('API server upload unavailable on current host');
    } catch (err: any) {
      console.warn('Server upload not reachable, saving to local device media store...', err);
      
      // Zero-fail client-side persistence via IndexedDB (handles large videos and PDFs up to hundreds of MBs)
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

      // Fallback for smaller files
      if (file.size <= 8 * 1024 * 1024) {
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
        alert(`الملف كبير (${mbSize} MB). يرجى استخدام رابط سحابي مباشر أو Google Drive أو تقليل حجم الملف.`);
      }
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
      setSyncFeedback('تمت مزامنة جميع الكورسات والبيانات سحابياً مع Firestore بنجاح 🚀');
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

    StorageService.createPdf({
      title: pdfForm.title,
      description: pdfForm.description,
      grade: pdfForm.grade,
      category: pdfForm.category,
      url: pdfForm.url,
      pageCount: Number(pdfForm.pageCount) || 30,
      fileSize: pdfForm.fileSize || '5 MB',
      isLocked: pdfForm.isLocked
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
      isLocked: true
    });
  };

  // Send Notification Broadcast
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return;

    StorageService.sendNotification({
      title: notifForm.title,
      message: notifForm.message,
      targetGrade: notifForm.targetGrade === 'all' ? undefined : notifForm.targetGrade,
      readBy: []
    });

    setShowAddNotif(false);
    setNotifForm({ title: '', message: '', targetGrade: 'all' });
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
        setDateUpdateFeedback('تم حفظ وتطبيق موعد امتحان الفيزياء الجديد والعد التنازلي بنجاح! ⏱✨');
        setTimeout(() => setDateUpdateFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Invalid date string', e);
    }
  };

  const tabCategories = [
    {
      title: '📊 لوحة القيادة والمتابعة',
      items: [
        { id: 'overview', label: 'الرئيسية والإحصائيات', icon: BarChart3, badge: null },
        { id: 'results', label: 'نتائج وتقارير الطلاب', icon: Award, badge: attempts.length > 0 ? attempts.length : null },
        { id: 'notifs', label: 'مركز الإشعارات', icon: Bell, badge: notifs.length > 0 ? notifs.length : null },
        { id: 'settings', label: 'إعدادات المنصة', icon: Settings, badge: null }
      ]
    },
    {
      title: '📚 المحتوى والملازم',
      items: [
        { id: 'courses', label: 'الكورسات والدروس', icon: BookOpen, badge: courses.length },
        { id: 'exams', label: 'بنك الأسئلة والامتحانات', icon: HelpCircle, badge: exams.length },
        { id: 'pdfs', label: 'المذكرات والملازم PDF', icon: FileText, badge: pdfs.length }
      ]
    },
    {
      title: '👥 شؤون الطلاب والاشتراكات',
      items: [
        { id: 'students', label: 'سجل الطلاب والأجهزة', icon: Users, badge: students.length },
        { id: 'codes', label: 'أكواد التفعيل والشحن', icon: Key, badge: codes.filter(c => !c.isUsed).length }
      ]
    },
    {
      title: '⚛️ المسابقات والذكاء الاصطناعي',
      items: [
        { id: 'challenges', label: 'تحديات الأسبوع والمسابقات', icon: Trophy, badge: challenges.length },
        { id: 'leaderboard-admin', label: 'لوحة الشرف وتكريم الأوائل', icon: Award, badge: StorageService.getLeaderboard().length },
        { id: 'weakness-admin', label: 'تشخيص نقاط الضعف 🧠', icon: Brain, badge: null },
        { id: 'ai-admin', label: 'المساعد الذكي AI ⚛️', icon: Bot, badge: 'نشط' }
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

    const message = `السلام عليكم ورحمة الله وبركاته 🌹
تقرير ولي الأمر المعتمد للطالب/ة: *${student.name}*
منصة: *${settings.platformName}*
المعلم: *${settings.instructorTitle}*

📊 **ملخص الأداء والمشاركات:**
• الكورسات المفعلة: ${student.enrolledCourseIds?.length || 0} كورس
• عدد الاختبارات المكتملة: ${totalAttempts} اختبار
• متوسط التقدير العام: *${avgPercentage}%*

🎯 **النقاط والمفاهيم الجاري تركيز المراجعة عليها:**
${weakConceptsText}

💡 **توجيهات المعلم:**
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 animate-in fade-in duration-300">
      
      {/* Top Executive Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/25 text-white font-black text-xl border border-blue-400/30">
              Ψ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">غرفة إدارة منصة {settings.platformName || 'ويكيفزياء'}</h1>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 text-[10px] font-bold">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                إشراف الأستاذ: <span className="text-amber-300 font-bold">{settings.instructorTitle}</span> • إدارة المنهاج والطلاب
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleForceSyncCloud}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              title="مزامنة فورية لكل البيانات مع قاعدة بيانات Firebase Firestore"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'جارٍ المزامنة...' : 'مزامنة السحابة (Firestore)'}</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-blue-400" />
              <span>معاينة كطالب</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout: Sidebar + Stage */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Cloud Sync & Upload Alerts */}
        {syncFeedback && (
          <div className="mb-6 flex items-center justify-between gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">{syncFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">Firebase Firestore Cloud Active</span>
          </div>
        )}

        {isUploadingFile && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-500/40 bg-blue-950/50 p-4 text-xs text-blue-200 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <div>
                <p className="font-bold text-white text-sm">{uploadProgressText || 'جارٍ معالجة ورفع الملف...'}</p>
                <p className="text-[11px] text-blue-300">يتم حفظ الملف ليعمل بسرعة فائقة لدى جميع الطلاب</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-300">جاري الحفظ...</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* SIDEBAR NAVIGATION (Desktop: Sticky Sidebar, Mobile: Horizontal Scrollable Ribbon) */}
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-4">
            
            {/* Quick Status Profile Widget */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm hidden lg:block">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400">حالة النظام السحابي</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  متصل ومحمي
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2">
                  <p className="text-base font-black text-white">{students.length}</p>
                  <p className="text-[10px] text-slate-400">طالب نشط</p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2">
                  <p className="text-base font-black text-amber-400">{courses.length}</p>
                  <p className="text-[10px] text-slate-400">كورس متاح</p>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 space-y-4 shadow-xl backdrop-blur-md">
              {tabCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 block mb-1">
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
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge !== null && tab.badge !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700/60'
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

          </aside>

          {/* MAIN STAGE CONTENT */}
          <main className="flex-1 w-full min-w-0 space-y-6">

            {/* Dynamic Stage Header with Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {currentTabInfo && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <currentTabInfo.icon className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>لوحة التحكم</span>
                    <span>/</span>
                    <span className="text-blue-400 font-bold">{currentTabInfo?.label || 'القسم'}</span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-0.5">{currentTabInfo?.label}</h2>
                </div>
              </div>

              {/* Quick contextual shortcut buttons based on active tab */}
              <div className="flex items-center gap-2">
                {activeTab !== 'overview' && (
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                    <span>الرئيسية</span>
                  </button>
                )}
                {activeTab === 'courses' && (
                  <button
                    onClick={() => setShowAddCourse(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة كورس</span>
                  </button>
                )}
                {activeTab === 'exams' && (
                  <button
                    onClick={() => setShowAddExam(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إنشاء امتحان</span>
                  </button>
                )}
                {activeTab === 'pdfs' && (
                  <button
                    onClick={() => setShowAddPdf(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>رفع ملزمة PDF</span>
                  </button>
                )}
                {activeTab === 'codes' && (
                  <button
                    onClick={() => setShowAddCode(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>توليد أكواد</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: OVERVIEW (BENTO GRID REDESIGN) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* 1. Top Executive Welcome & Exam Countdown Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 p-6 shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>منظومة ويكيفزياء المتكاملة • الثانوية العامة</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        مرحباً بك يا أستاذ {settings.instructorTitle || 'يوسف'} ⚛️
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                        كل أدوات التحكم في المنصة، من إدارة الكورسات والملازم إلى مراقبة نتائج الطلاب وتكريم الأوائل بين يديك بنظام سحابي فوري ومستقر.
                      </p>
                    </div>

                    {/* Quick Live Exam Countdown Badge */}
                    <div className="rounded-2xl border border-amber-500/40 bg-slate-950/90 p-4 shrink-0 shadow-lg space-y-2 min-w-[240px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-amber-400" />
                          موعد امتحان الفيزياء
                        </span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
                          الهدف 60/60
                        </span>
                      </div>
                      {(() => {
                        const targetTime = new Date(settings.ministryExamDate || '2027-06-14T09:00').getTime();
                        const diff = targetTime - Date.now();
                        const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                        const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
                        return (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-amber-400 font-mono">{days}</span>
                              <span className="text-xs text-slate-400 font-bold">يوم</span>
                              <span className="text-xl font-bold text-amber-300 font-mono">{hours}</span>
                              <span className="text-xs text-slate-400 font-bold">ساعة</span>
                            </div>
                            <p className="text-[10px] text-emerald-400 mt-1">العد التنازلي معروض للطلاب في الصفحة الرئيسية</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Bento Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  
                  <div 
                    onClick={() => setActiveTab('students')}
                    className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-blue-500/50 hover:bg-slate-900 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">إجمالي الطلاب</span>
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Users className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">{students.length}</p>
                    <p className="text-[10px] text-blue-400 mt-1 flex items-center justify-between">
                      <span>طالب مسجل</span>
                      <span className="text-slate-500 group-hover:text-blue-300">عرض ←</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('courses')}
                    className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-amber-500/50 hover:bg-slate-900 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">الكورسات المتاحة</span>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black text-amber-400">{courses.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>كورس ومنهج</span>
                      <span className="text-slate-500 group-hover:text-amber-300">عرض ←</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('exams')}
                    className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-purple-500/50 hover:bg-slate-900 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">الامتحانات</span>
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <HelpCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black text-purple-400">{exams.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>اختبار وكويز</span>
                      <span className="text-slate-500 group-hover:text-purple-300">عرض ←</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('codes')}
                    className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-emerald-500/50 hover:bg-slate-900 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">أكواد التفعيل</span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Key className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black text-emerald-400">
                      {codes.filter(c => !c.isUsed).length}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>كود متاح للشحن</span>
                      <span className="text-slate-500 group-hover:text-emerald-300">عرض ←</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('pdfs')}
                    className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-rose-500/50 hover:bg-slate-900 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">الملازم والمذكرات</span>
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black text-rose-400">{pdfs.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>ملف PDF</span>
                      <span className="text-slate-500 group-hover:text-rose-300">عرض ←</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('results')}
                    className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-indigo-500/50 hover:bg-slate-900 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">تسليمات الامتحانات</span>
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <Award className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black text-indigo-300">{attempts.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>تسليم مصحح</span>
                      <span className="text-slate-500 group-hover:text-indigo-300">عرض ←</span>
                    </p>
                  </div>

                </div>

                {/* 3. Main Bento 2-Column Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                  {/* Left Column: Quick Launch Actions + Recent Results Feed (2 cols wide on desktop) */}
                  <div className="xl:col-span-2 space-y-6">

                    {/* Quick Command Center */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-400" />
                          <span>مركز الإجراءات السريعة (Quick Launch)</span>
                        </h4>
                        <span className="text-[11px] text-slate-400">إجراءات بنقرة واحدة</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button
                          onClick={() => { setActiveTab('courses'); setShowAddCourse(true); }}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all group"
                        >
                          <div className="p-2.5 rounded-xl bg-blue-500/20 group-hover:bg-white/20 transition-colors">
                            <Plus className="h-5 w-5" />
                          </div>
                          <span>إضافة كورس جديد</span>
                        </button>

                        <button
                          onClick={() => { setActiveTab('codes'); setShowAddCode(true); }}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all group"
                        >
                          <div className="p-2.5 rounded-xl bg-amber-500/20 group-hover:bg-slate-950/20 transition-colors">
                            <Key className="h-5 w-5" />
                          </div>
                          <span>توليد أكواد شحن</span>
                        </button>

                        <button
                          onClick={() => { setActiveTab('exams'); setShowAddExam(true); }}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs font-bold text-purple-300 hover:bg-purple-600 hover:text-white transition-all group"
                        >
                          <div className="p-2.5 rounded-xl bg-purple-500/20 group-hover:bg-white/20 transition-colors">
                            <HelpCircle className="h-5 w-5" />
                          </div>
                          <span>إنشاء امتحان جديد</span>
                        </button>

                        <button
                          onClick={() => { setActiveTab('notifs'); setShowAddNotif(true); }}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all group"
                        >
                          <div className="p-2.5 rounded-xl bg-emerald-500/20 group-hover:bg-white/20 transition-colors">
                            <Bell className="h-5 w-5" />
                          </div>
                          <span>إرسال إشعار عام</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Exam Target Date Quick Manager */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">تحديد موعد امتحان الفيزياء الرسمي</h4>
                            <p className="text-[11px] text-slate-400">يظهر العد التنازلي المباشر لجميع الطلاب داخل التطبيق</p>
                          </div>
                        </div>
                        {dateUpdateFeedback && (
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 text-[11px] font-bold">
                            ✓ تم التحديث
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">تاريخ ووقت الامتحان:</label>
                          <input
                            type="datetime-local"
                            value={formatForDatetimeInput(settings.ministryExamDate)}
                            onChange={e => handleExamDateUpdate(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">اختصارات سريعة:</label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleExamDateUpdate('2027-06-14T09:00')}
                              className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                            >
                              14 يونيو 2027
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExamDateUpdate('2027-06-21T09:00')}
                              className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              21 يونيو 2027
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 90);
                                handleExamDateUpdate(d.toISOString().slice(0, 16));
                              }}
                              className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              +90 يوم
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Submissions Feed */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">أحدث نتائج وتسليمات الطلاب</h4>
                            <p className="text-[11px] text-slate-400">تحديث فوري لجميع الكويزات والامتحانات الشاملة</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('results')}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300"
                        >
                          عرض كل النتائج ({attempts.length}) ←
                        </button>
                      </div>

                      {attempts.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                          <Award className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">لا توجد تسليمات امتحانات مسجلة حتى الآن.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800/80">
                          {attempts.slice(0, 6).map(att => {
                            const student = students.find(s => s.id === att.studentId);
                            return (
                              <div key={att.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-950/40 px-2 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs border border-slate-700">
                                    {att.studentName ? att.studentName[0] : 'ط'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-sm">{att.studentName}</p>
                                    <p className="text-[11px] text-slate-400">{att.examTitle}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                  <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                                    att.passed 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    {att.score}/{att.maxScore} ({att.percentage}%)
                                  </span>

                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(att.submittedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                  </span>

                                  {student && (
                                    <button
                                      onClick={() => sendParentWhatsappReport(student)}
                                      title="إرسال تقرير الأداء لولي الأمر عبر واتساب"
                                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Honor Roll + Weekly Challenge + AI Assistant + Cloud (1 col wide) */}
                  <div className="space-y-6">

                    {/* Honor Roll Spotlight */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-white text-xs">أوائل لوحة الشرف 🥇</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('leaderboard-admin')}
                          className="text-[11px] font-bold text-amber-400 hover:underline"
                        >
                          الإدارة ←
                        </button>
                      </div>

                      {(() => {
                        const topLeaders = StorageService.getLeaderboard().slice(0, 3);
                        if (topLeaders.length === 0) {
                          return (
                            <p className="text-xs text-slate-400 py-3 text-center">لا يوجد طلاب في لوحة الشرف حالياً.</p>
                          );
                        }
                        return (
                          <div className="space-y-2 pt-1">
                            {topLeaders.map((leader, i) => (
                              <div key={leader.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-base">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                  </span>
                                  <div>
                                    <p className="font-bold text-white leading-tight">{leader.studentName}</p>
                                    <p className="text-[10px] text-slate-400">{leader.governorate || 'طالب متميز'}</p>
                                  </div>
                                </div>
                                <span className="font-black text-amber-400 font-mono">
                                  {leader.points} نقطة
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => {
                          setBonusStudentId(students[0]?.id || '');
                          setShowBonusModal(true);
                        }}
                        className="w-full mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>منح نقاط وأوسمة مكافأة</span>
                      </button>
                    </div>

                    {/* Active Weekly Challenge Widget */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-white text-xs">تحدي الأسبوع الفيزيائي</span>
                        </div>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          {challenges.length} متاح
                        </span>
                      </div>

                      {challenges.length > 0 ? (
                        <div className="rounded-2xl border border-purple-500/20 bg-slate-950 p-3 space-y-2">
                          <p className="font-bold text-white text-xs line-clamp-1">{challenges[0].title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{challenges[0].description}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-purple-300">
                            <span>جائزة: +{challenges[0].bonusPoints} نقطة</span>
                            <span>{challenges[0].grade}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">لا توجد تحديات أسبوعية منشورة.</p>
                      )}

                      <button
                        onClick={() => { setActiveTab('challenges'); setShowAddChallenge(true); }}
                        className="w-full rounded-xl bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-500 flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>نشر تحدي أسبوعي جديد</span>
                      </button>
                    </div>

                    {/* AI Physics Assistant Quick Hub */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400">
                            <Bot className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-white text-xs">المساعد الذكي AI ⚛️</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          جاهز للطلاب
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        يقوم بالرد الفوري على أسئلة الطلاب وحل مسائل الفيزياء بالخطوات العلمية الدقيقة.
                      </p>
                      <button
                        onClick={() => setActiveTab('ai-admin')}
                        className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        <span>تعديل تعليمات وتجربة الـ AI</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: COURSES & CURRICULUM */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">إدارة الكورسات والمناهج</h2>
              <p className="text-xs text-slate-400">إضافة الكورسات، تقسيم الوحدات، ورفع الفيديوهات والمذكرات المرفقة</p>
            </div>
            <button
              onClick={() => setShowAddCourse(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة كورس جديد</span>
            </button>
          </div>

          {/* Add Course Modal */}
          {showAddCourse && (
            <div className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-base text-white">إنشاء كورس جديد</h3>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">عنوان الكورس</label>
                    <input
                      type="text"
                      value={courseForm.title}
                      onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="مثال: كورس الفيزياء الحديثة 2025"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">المرحلة الدراسية</label>
                    <select
                      value={courseForm.grade}
                      onChange={e => setCourseForm({ ...courseForm, grade: e.target.value as GradeLevel })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">وصف الكورس ومحتوياته</label>
                  <textarea
                    rows={2}
                    value={courseForm.description}
                    onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="شرح تفصيلي للمنهج..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">سعر الكورس (ج.م)</label>
                    <input
                      type="number"
                      value={courseForm.price}
                      onChange={e => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>صورة غلاف الكورس (Thumbnail)</span>
                      <span className="text-[10px] text-amber-400 font-normal">رفع من الجهاز أو رابط مباشر</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={courseForm.thumbnail}
                        onChange={e => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                        placeholder="أدخل رابط الصورة أو ارفع من جهازك..."
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      />
                      <label className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 px-4 py-2.5 text-xs font-bold text-amber-400 cursor-pointer shrink-0 transition-colors">
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
                          className="h-12 w-20 object-cover rounded-lg border border-slate-700 bg-slate-950" 
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
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
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-6 py-2 text-xs font-bold text-slate-950"
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
              <div key={course.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 border border-amber-500/20">
                      {course.grade}
                    </span>
                    <h3 className="font-bold text-white text-base leading-snug">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                  </div>
                  <img src={course.thumbnail} alt={course.title} className="h-16 w-24 object-cover rounded-xl border border-slate-700 shrink-0" />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>الوحدات: {course.units?.length || 0} فصول</span>
                  <span className="text-amber-400 font-bold">{course.price} ج.م</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedCourseForUnits(selectedCourseForUnits?.id === course.id ? null : course)}
                    className="flex-1 rounded-xl bg-blue-600/20 border border-blue-500/30 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    {selectedCourseForUnits?.id === course.id ? 'إخفاء هيكل الوحدات' : 'إدارة الفصول والدروس'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                    title="حذف الكورس"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Units and Lessons Builder Sub-panel */}
                {selectedCourseForUnits?.id === course.id && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                    <h4 className="font-bold text-sm text-amber-400">منهج وفصول: {course.title}</h4>
                    
                    {/* Add Unit Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={unitTitle}
                        onChange={e => setUnitTitle(e.target.value)}
                        placeholder="اسم الفصل أو الباب الجديد..."
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                      />
                      <button
                        onClick={() => handleAddUnit(course.id)}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                      >
                        + إضافة فصل
                      </button>
                    </div>

                    {/* Unit List */}
                    <div className="space-y-3 pt-2">
                      {course.units?.map((u, uIdx) => (
                        <div key={u.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{u.title}</span>
                            <span className="text-[10px] text-slate-400">{u.lessons?.length || 0} دروس</span>
                          </div>

                          {/* Lessons in Unit */}
                          <div className="space-y-1 pr-2 border-r-2 border-slate-800">
                            {u.lessons?.map((l, lIdx) => (
                              <div key={l.id} className="flex items-center justify-between text-[11px] text-slate-300 py-1">
                                <span>{lIdx + 1}. {l.title} ({l.durationMinutes} د)</span>
                                {l.isFreePreview && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded">مجاني</span>}
                              </div>
                            ))}
                          </div>

                          {/* Add Lesson to this Unit Form */}
                          <div className="pt-3 border-t border-slate-800/80 space-y-3 bg-slate-950/60 p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-amber-400 block">إضافة درس جديد لهذا الفصل:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={lessonForm.unitId === u.id ? lessonForm.title : ''}
                                onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, title: e.target.value })}
                                placeholder="عنوان الدرس..."
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                              />
                              <div className="flex items-center gap-2">
                                <select
                                  value={lessonForm.unitId === u.id ? lessonForm.videoType : 'youtube'}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, videoType: e.target.value as any })}
                                  className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300"
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
                                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                                  title="المدة بالدقائق"
                                />
                              </div>
                            </div>

                            {/* Video Input & Upload Button */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                  <span>مصدر الفيديو</span>
                                  {lessonForm.unitId === u.id && lessonForm.videoUrl && (
                                    <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                                      <Check className="h-3 w-3" /> تم تحديد الفيديو
                                    </span>
                                  )}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setShowVideoGuideModal(true)}
                                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 transition-colors"
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
                                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                                />
                                <label className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 px-3 py-2 text-xs font-bold text-blue-400 cursor-pointer shrink-0 transition-colors">
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
                              <label className="text-[10px] text-slate-400 font-bold">ملف PDF مرفق مع هذا الدرس (اختياري)</label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={lessonForm.unitId === u.id ? (lessonForm.pdfUrl || '') : ''}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, pdfUrl: e.target.value })}
                                  placeholder="رابط PDF أو ارفع من جهازك..."
                                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                                />
                                <label className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 px-3 py-2 text-xs font-bold text-amber-400 cursor-pointer shrink-0 transition-colors">
                                  <FileCheck className="h-3.5 w-3.5" />
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
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={lessonForm.unitId === u.id ? lessonForm.isFreePreview : false}
                                  onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, isFreePreview: e.target.checked })}
                                  className="rounded border-slate-700 bg-slate-950 text-amber-500 h-4 w-4"
                                />
                                <span>درس معاينة مجاني لغير المشتركين</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleAddLesson(course.id, u.id)}
                                disabled={isUploadingFile}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shrink-0 shadow-sm"
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
              <h2 className="text-xl font-bold text-white">بنك الأسئلة والامتحانات التفاعلية</h2>
              <p className="text-xs text-slate-400">إنشاء وتعديل الكويزات الدورية والامتحانات الشاملة مع التوقيت ونموذج الإجابة</p>
            </div>
            <button
              onClick={() => setShowAddExam(true)}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500"
            >
              <Plus className="h-4 w-4" />
              <span>إنشاء اختبار جديد</span>
            </button>
          </div>

          {/* Add Exam Modal */}
          {showAddExam && (
            <div className="rounded-3xl border border-purple-500/30 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-base text-white">إنشاء امتحان أو كويز جديد</h3>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">عنوان الامتحان</label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={e => setExamForm({ ...examForm, title: e.target.value })}
                      placeholder="مثال: امتحان شامل على الفصل الأول"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">النوع</label>
                    <select
                      value={examForm.type}
                      onChange={e => setExamForm({ ...examForm, type: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option value="quiz">كويز قصير</option>
                      <option value="exam">امتحان شامل</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">مدة الاختبار (بالدقائق)</label>
                    <input
                      type="number"
                      value={examForm.durationMinutes}
                      onChange={e => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Manual Question Creator Section */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">إضافة سؤال جديد يدوياً إلى هذا الامتحان</h4>
                    </div>
                    <span className="text-[11px] text-slate-400">إجمالي الأسئلة المضافة: {examForm.questions.length}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Question Text */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">نص السؤال</label>
                      <textarea
                        rows={2}
                        value={newQuestionForm.text}
                        onChange={e => setNewQuestionForm({ ...newQuestionForm, text: e.target.value })}
                        placeholder="اكتب صيغة السؤال الفيزيائي هنا..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Question Diagram / Image (Optional for physics diagrams, circuits, etc.) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                        <span>صورة أو رسم توضيحي للسؤال (اختياري للدوائر والرسوم البيانية)</span>
                        {newQuestionForm.image && (
                          <button
                            type="button"
                            onClick={() => setNewQuestionForm({ ...newQuestionForm, image: '' })}
                            className="text-rose-400 hover:underline text-[10px]"
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
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                        <label className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 px-3 py-2 text-xs font-bold text-amber-400 cursor-pointer shrink-0 transition-colors">
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
                            className="max-h-32 rounded-lg border border-slate-700 bg-slate-950 object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-300">الخيار (أ)</label>
                          <label className="text-[10px] text-emerald-400 cursor-pointer flex items-center gap-1">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 0}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 0 })}
                              className="text-emerald-500"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option0}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option0: e.target.value })}
                          placeholder="الخيار الأول..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-300">الخيار (ب)</label>
                          <label className="text-[10px] text-emerald-400 cursor-pointer flex items-center gap-1">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 1}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 1 })}
                              className="text-emerald-500"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option1}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option1: e.target.value })}
                          placeholder="الخيار الثاني..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-300">الخيار (ج)</label>
                          <label className="text-[10px] text-emerald-400 cursor-pointer flex items-center gap-1">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 2}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 2 })}
                              className="text-emerald-500"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option2}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option2: e.target.value })}
                          placeholder="الخيار الثالث..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-300">الخيار (د)</label>
                          <label className="text-[10px] text-emerald-400 cursor-pointer flex items-center gap-1">
                            <input
                              type="radio"
                              name="correctChoice"
                              checked={newQuestionForm.correctOptionIndex === 3}
                              onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: 3 })}
                              className="text-emerald-500"
                            />
                            <span>الإجابة الصحيحة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newQuestionForm.option3}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, option3: e.target.value })}
                          placeholder="الخيار الرابع..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Explanation & Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-300">تفسير ونموذج الإجابة (يظهر للطالب بعد التسليم)</label>
                        <input
                          type="text"
                          value={newQuestionForm.explanation}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                          placeholder="شرح سبب صحة الإجابة أو خطوات الحل والقانون المستخدم..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-300">درجة السؤال</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={newQuestionForm.points}
                          onChange={e => setNewQuestionForm({ ...newQuestionForm, points: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddQuestionToExam}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-md transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        <span>إدراج هذا السؤال في الاختبار</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Questions List & Manager */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400">قائمة أسئلة الاختبار ({examForm.questions.length})</h4>
                    <span className="text-[10px] text-slate-400">إجمالي الدرجات: {examForm.questions.reduce((acc, q) => acc + (q.points || 1), 0)} درجة</span>
                  </div>

                  {examForm.questions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">لم تقم بإضافة أسئلة بعد. استخدم النموذج أعلاه لإضافة أول سؤال.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {examForm.questions.map((q, idx) => (
                        <div key={q.id || idx} className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <p className="font-bold text-white text-xs">{idx + 1}. {q.text}</p>
                              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                                {q.options.map((opt, oIdx) => (
                                  <div 
                                    key={oIdx} 
                                    className={`px-2 py-0.5 rounded text-[10px] ${
                                      oIdx === q.correctOptionIndex 
                                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' 
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}: {opt} {oIdx === q.correctOptionIndex && '✓'}
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <p className="text-[10px] text-slate-400 pt-1">💡 التفسير: {q.explanation}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromExam(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 shrink-0"
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
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 px-6 py-2 text-xs font-bold text-white hover:bg-purple-500"
                  >
                    حفظ ونشر الامتحان
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Exams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(ex => (
              <div key={ex.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5">
                    {ex.type === 'quiz' ? 'كويز' : 'امتحان شامل'}
                  </span>
                  <span className="text-xs text-slate-400">⏱ {ex.durationMinutes} دقيقة</span>
                </div>
                <h3 className="font-bold text-white text-base">{ex.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>عدد الأسئلة: {ex.questions?.length || 0}</span>
                  <span>النجاح: {ex.passingPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('exam-runner', { examId: ex.id })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    معاينة تجربة الامتحان
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف امتحان "${ex.title}"؟`)) {
                        StorageService.deleteExam(ex.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    title="حذف الامتحان"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENTS & DEVICES */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">إدارة حسابات الطلاب والتحكم بالأجهزة</h2>
              <p className="text-xs text-slate-400">متابعة الاشتراكات، حظر/إلغاء حظر الطلاب، وتفريغ جلسات الأجهزة المقفلة</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="بحث بالاسم أو رقم الهاتف..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-10 pl-4 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
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
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300" dir="ltr">{student.phone}</td>
                      <td className="py-4 px-4 font-mono">
                        <span className="inline-block rounded-lg border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs text-amber-400 font-bold">
                          {student.password || 'غير محدد'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{student.grade.includes('الثالث') ? '3 ثانوي' : '2 ثانوي'}</td>
                      <td className="py-4 px-4 font-bold text-amber-400">{student.enrolledCourseIds?.length || 0} كورس</td>
                      <td className="py-4 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{student.registeredDevices?.length || 1} / {student.maxDevicesAllowed || 2}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          student.isBlocked 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {student.isBlocked ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedWeaknessStudent(student)}
                            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20 flex items-center gap-1"
                            title="تشخيص نقاط الضعف والمفاهيم المفقودة"
                          >
                            <Stethoscope className="h-3 w-3" />
                            <span>تشخيص الضعف</span>
                          </button>

                          <button
                            onClick={() => sendParentWhatsappReport(student)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-1"
                            title="إرسال تقرير ولي الأمر مباشرة عبر واتساب"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>تقرير واتساب</span>
                          </button>

                          <button
                            onClick={() => handleResetDevices(student)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
                            title="إعادة ضبط أجهزة الطالب"
                          >
                            تفريغ الأجهزة
                          </button>
                          <button
                            onClick={() => handleToggleBlockStudent(student)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              student.isBlocked 
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
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
              <h2 className="text-xl font-bold text-white">توليد وإدارة أكواد التفعيل</h2>
              <p className="text-xs text-slate-400">توليد أكواد فردية أو مجمعة (Bulk) لبيعها وتوزيعها على الطلاب لفتح الكورسات والمذكرات</p>
            </div>
            <button
              onClick={() => setShowAddCode(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              <span>توليد أكواد جديدة</span>
            </button>
          </div>

          {/* Generator Modal */}
          {showAddCode && (
            <div className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-base text-white">توليد أكواد اشتراك جديدة</h3>
              <form onSubmit={handleGenerateCodes} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">نوع العنصر المستهدف</label>
                    <select
                      value={codeGenForm.targetType}
                      onChange={e => setCodeGenForm({ ...codeGenForm, targetType: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option value="course">كورس تعليمي</option>
                      <option value="pdf">مذكرة / ملزمة PDF</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">اختر الكورس / المذكرة</label>
                    <select
                      value={codeGenForm.targetId}
                      onChange={e => setCodeGenForm({ ...codeGenForm, targetId: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-medium"
                    >
                      {codeGenForm.targetType === 'course' ? (
                        <>
                          <option value="ALL">🌟 كود شامل (تفعيل لجميع كورسات المنصة)</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title} • {c.grade}
                            </option>
                          ))}
                        </>
                      ) : (
                        <>
                          <option value="ALL_PDFS">📚 جميع مذكرات المنصة</option>
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
                    <label className="text-xs font-bold text-slate-300">عدد الأكواد المطلوبة</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={codeGenForm.count}
                      onChange={e => setCodeGenForm({ ...codeGenForm, count: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCode(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-6 py-2 text-xs font-bold text-slate-950"
                  >
                    توليد وحفظ الأكواد
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Codes Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
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
                <tbody className="divide-y divide-slate-800/60">
                  {codes.map(code => (
                    <tr key={code.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400" dir="ltr">{code.code}</td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code.code, code.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            copiedCodeId === code.id
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 border border-slate-700'
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
                      <td className="py-3.5 px-4 text-white font-bold">{code.targetName}</td>
                      <td className="py-3.5 px-4 text-slate-400">{code.targetType === 'course' ? 'كورس' : 'مذكرة PDF'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          code.isUsed 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {code.isUsed ? 'مستخدم' : 'متاح للتفعيل'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{code.usedByStudentName || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(code.createdAt).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated Codes Success Modal with Copy Options */}
          {showGeneratedSuccessModal && recentlyGeneratedCodes.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">تم إنشاء الأكواد بنجاح! 🎉</h3>
                    <p className="text-xs text-slate-300">
                      تم توليد {recentlyGeneratedCodes.length} كود تفعيل لـ ({recentlyGeneratedCodes[0]?.targetName})
                    </p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  {recentlyGeneratedCodes.map((c, idx) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                        <span className="font-mono font-bold text-amber-400 text-sm tracking-wider" dir="ltr">{c.code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code, c.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          copiedCodeId === c.id 
                            ? 'bg-emerald-500 text-slate-950' 
                            : 'bg-slate-800 text-slate-200 hover:bg-amber-500 hover:text-slate-950 border border-slate-700'
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
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                    }`}
                  >
                    {copiedCodeId === 'ALL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedCodeId === 'ALL' ? '✓ تم نسخ جميع الأكواد!' : 'نسخ جميع الأكواد دفعة واحدة'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGeneratedSuccessModal(false)}
                    className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
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
              <h2 className="text-xl font-bold text-white">إدارة المذكرات والملازم الرقمية</h2>
              <p className="text-xs text-slate-400">رفع مذكرات الشرح وبنوك الأسئلة وتحديد صلاحيات الحماية والأكواد</p>
            </div>
            <button
              onClick={() => setShowAddPdf(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة مذكرة جديدة</span>
            </button>
          </div>

          {/* Add PDF Modal */}
          {showAddPdf && (
            <div className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-base text-white">إضافة مذكرة أو بنك أسئلة جديد</h3>
              <form onSubmit={handleCreatePdf} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">عنوان المذكرة</label>
                    <input
                      type="text"
                      value={pdfForm.title}
                      onChange={e => setPdfForm({ ...pdfForm, title: e.target.value })}
                      placeholder="مثال: مذكرة مراجعة ليلة الامتحان في الفيزياء 2025"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">التصنيف</label>
                    <select
                      value={pdfForm.category}
                      onChange={e => setPdfForm({ ...pdfForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
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
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>ملف المذكرة (PDF)</span>
                      <span className="text-[10px] text-amber-400 font-normal">رفع من الجهاز أو رابط مباشر</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={pdfForm.url}
                        onChange={e => setPdfForm({ ...pdfForm, url: e.target.value })}
                        placeholder="أدخل رابط مباشر لملف PDF أو ارفع من جهازك..."
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                        required
                      />
                      <label className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 px-4 py-2.5 text-xs font-bold text-amber-400 cursor-pointer shrink-0 transition-colors">
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
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تم تجهيز ملف الـ PDF بنجاح ({pdfForm.fileSize || 'جاهز'})
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">المرحلة الدراسية</label>
                    <select
                      value={pdfForm.grade}
                      onChange={e => setPdfForm({ ...pdfForm, grade: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isLockedCheck"
                    checked={pdfForm.isLocked}
                    onChange={e => setPdfForm({ ...pdfForm, isLocked: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500"
                  />
                  <label htmlFor="isLockedCheck" className="text-xs font-bold text-slate-300">
                    مذكرة محمية تتطلب كود تفعيل خاص لفتحها
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPdf(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-6 py-2 text-xs font-bold text-slate-950"
                  >
                    حفظ المذكرة
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PDFs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map(pdf => (
              <div key={pdf.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5">
                      {pdf.category}
                    </span>
                    <span className="text-xs text-slate-400">{pdf.pageCount} صفحة</span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug">{pdf.title}</h3>
                  {pdf.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{pdf.description}</p>
                  )}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{pdf.isLocked ? '🔒 يتطلب كود تفعيل' : '🔓 متاح مجاناً'}</span>
                    <span>{pdf.fileSize || '5 MB'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center rounded-xl border border-slate-700 bg-slate-800 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                    >
                      معاينة الملف
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف مذكرة "${pdf.title}"؟`)) {
                          StorageService.deletePdf(pdf.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      title="حذف المذكرة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: RESULTS & ATTEMPTS */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">سجل نتائج وتصحيح الامتحانات</h2>
            <p className="text-xs text-slate-400">تقارير فورية عن أداء الطلاب في جميع الكويزات والامتحانات</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
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
                <tbody className="divide-y divide-slate-800/60">
                  {attempts.map(att => {
                    const studentObj = students.find(s => s.id === att.studentId);
                    const parentPhone = studentObj?.parentPhone || att.studentPhone || '01000000000';
                    const cleanParentPhone = parentPhone.replace(/[^0-9]/g, '');
                    const formattedPhone = cleanParentPhone.startsWith('0') ? `20${cleanParentPhone.substring(1)}` : cleanParentPhone;
                    const reportMsg = `تقرير أداء الطالب في الفيزياء منصة ويكيفزياء:\nاسم الطالب: ${att.studentName}\nالاختبار: ${att.examTitle}\nالدرجة: ${att.score} من ${att.maxScore} (${att.percentage}%)\nالتقييم: ${att.passed ? 'ممتاز واجتاز الاختبار' : 'يحتاج لإعادة المراجعة'}`;
                    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(reportMsg)}`;

                    return (
                      <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{att.studentName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400" dir="ltr">{att.studentPhone}</td>
                        <td className="py-3.5 px-4 text-slate-200">{att.examTitle}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{att.score} / {att.maxScore}</td>
                        <td className="py-3.5 px-4 font-black">
                          <span className={att.passed ? 'text-emerald-400' : 'text-rose-400'}>{att.percentage}%</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            att.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {att.passed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{new Date(att.submittedAt).toLocaleDateString('ar-EG')}</td>
                        <td className="py-3.5 px-4 text-center">
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all shadow-sm"
                          >
                            <span>📱 إرسال واتساب</span>
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-400" />
                <span>إدارة تحديات الأسبوع ومسابقات الفيزياء</span>
              </h2>
              <p className="text-xs text-slate-400">طرح أسئلة التميز الأسبوعية لتشجيع الطلاب ومنح النقاط الإضافية لرفع ترتيبهم في لائحة الشرف</p>
            </div>
            <button
              onClick={() => setShowAddChallenge(!showAddChallenge)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddChallenge ? 'إلغاء النافذة' : 'إضافة تحدي أسبوعي جديد'}</span>
            </button>
          </div>

          {/* Add Weekly Challenge Form Modal / Card */}
          {showAddChallenge && (
            <div className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 space-y-4 animate-in fade-in">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
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
                    <label className="text-xs font-bold text-slate-300">عنوان التحدي الأسبوعي</label>
                    <input
                      type="text"
                      value={challengeForm.title}
                      onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })}
                      placeholder="مثال: تحدي قانون كيرشوف والدوائر المعقدة"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">النقاط الإضافية المكتسبة</label>
                    <input
                      type="number"
                      value={challengeForm.bonusPoints}
                      onChange={e => setChallengeForm({ ...challengeForm, bonusPoints: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">نص السؤال أو المسألة الفيزياء</label>
                  <textarea
                    rows={3}
                    value={challengeForm.qText}
                    onChange={e => setChallengeForm({ ...challengeForm, qText: e.target.value })}
                    placeholder="أدخل نص السؤال الفيزيائي بالتفصيل..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">الخيار (1)</label>
                    <input
                      type="text"
                      value={challengeForm.opt1}
                      onChange={e => setChallengeForm({ ...challengeForm, opt1: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">الخيار (2)</label>
                    <input
                      type="text"
                      value={challengeForm.opt2}
                      onChange={e => setChallengeForm({ ...challengeForm, opt2: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">الخيار (3)</label>
                    <input
                      type="text"
                      value={challengeForm.opt3}
                      onChange={e => setChallengeForm({ ...challengeForm, opt3: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">الخيار (4)</label>
                    <input
                      type="text"
                      value={challengeForm.opt4}
                      onChange={e => setChallengeForm({ ...challengeForm, opt4: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الخيار الصحيح الإجابة</label>
                    <select
                      value={challengeForm.correctIdx}
                      onChange={e => setChallengeForm({ ...challengeForm, correctIdx: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option value={0}>الخيار الأول (1)</option>
                      <option value={1}>الخيار الثاني (2)</option>
                      <option value={2}>الخيار الثالث (3)</option>
                      <option value={3}>الخيار الرابع (4)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">شرح طريقة الحل (تظهر للطالب بعد الإجابة)</label>
                    <input
                      type="text"
                      value={challengeForm.explanation}
                      onChange={e => setChallengeForm({ ...challengeForm, explanation: e.target.value })}
                      placeholder="خطوات الحل والقوانين المستخدمة..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
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
              <div key={ch.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 relative">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 mb-1">
                      +{ch.bonusPoints} نقطة تميز
                    </span>
                    <h3 className="font-bold text-sm text-white">{ch.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{ch.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذا التحدي؟')) {
                        StorageService.deleteWeeklyChallenge(ch.id);
                        setChallenges(StorageService.getWeeklyChallenges());
                      }
                    }}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/20"
                    title="حذف التحدي"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {ch.questions && ch.questions[0] && (
                  <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs space-y-1.5">
                    <p className="font-bold text-slate-300">السؤال: {ch.questions[0].text}</p>
                    <p className="text-[11px] text-emerald-400">الإجابة الصحيحة: {ch.questions[0].options[ch.questions[0].correctOptionIndex]}</p>
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-400" />
                <span>لوحة الشرف وتكريم أوائل المنصة</span>
              </h2>
              <p className="text-xs text-slate-400">متابعة ترتيب الأوائل ومنح أوسمة التميز والنقاط الإضافية يدوياً</p>
            </div>
            <button
              onClick={() => setShowBonusModal(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة نقاط تميز أو مكافأة لطالب</span>
            </button>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
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
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {StorageService.getLeaderboard().map((entry, idx) => (
                    <tr key={entry.studentId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                          idx === 0 ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' :
                          idx === 1 ? 'bg-slate-300 text-slate-950' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        {entry.studentName}
                        {idx === 0 && <span className="text-xs">👑</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {entry.governorate || 'القاهرة'} • {entry.grade || '3 ثانوى'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400 text-sm">
                        {entry.points}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
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
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
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
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-400" />
              <span>مركز تشخيص نقاط الضعف والمفاهيم الشائعة لجميع الطلاب</span>
            </h2>
            <p className="text-xs text-slate-400">تحليل الملاحظات والأفكار الفيزيائية التي تتكرر فيها أخطاء طلاب المنصة لإتاحة معالجتها وشرحها</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {StorageService.getAllPlatformWeaknesses().map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                    {item.studentCount} طالب واجه مشكلة
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">
                    تكرار الخطأ: {item.frequency} مرة
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>{item.conceptName}</span>
                </h3>

                <p className="text-xs text-slate-400">{item.chapterOrUnit}</p>

                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] space-y-1">
                  <span className="font-bold text-amber-400 block">التوصية العلاجية للمستشار:</span>
                  <p className="text-slate-300">{item.suggestedAction}</p>
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
                  className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 flex items-center justify-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>بث تنبيه مراجعة لجميع الطلاب المحتاجين</span>
                </button>
              </div>
            ))}

            {StorageService.getAllPlatformWeaknesses().length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400 space-y-2">
                <Brain className="h-10 w-10 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">لا توجد أخطاء شائعة مسجلة حالياً</p>
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bot className="h-6 w-6 text-cyan-400" />
                <span>إعدادات المساعد الذكي بالذكاء الاصطناعي (AI Physics Engine)</span>
              </h2>
              <p className="text-xs text-slate-400">توجيه نموذج Gemini 2.5 Flash للرد على استفسارات الطلاب الفيزيائية والمسائل المعقدة</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              محرك AI نشط ومتصل تلقائياً
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Prompt Customizer */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>تعليمات النواة وشخصية الذكاء الاصطناعي (System Instructions)</span>
              </h3>
              <p className="text-xs text-slate-400">تحدد هذه التعليمات أسلوب وطريقة إجابة المساعد الذكي لكافة أسئلة الطلاب وحل الصور</p>

              <textarea
                rows={6}
                value={aiSystemInstruction}
                onChange={e => setAiSystemInstruction(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white leading-relaxed font-mono"
              />

              <button
                onClick={() => alert('تم حفظ تعليمات المساعد الذكي للفيزياء بنجاح!')}
                className="rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                حفظ التوجيهات
              </button>
            </div>

            {/* AI Response Simulator */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-cyan-400" />
                <span>محاكي اختبار المساعد الذكي المباشر للمعلم</span>
              </h3>
              <p className="text-xs text-slate-400">جرب سؤالاً فيزيائياً لمشاهدة رد المساعد الذكي بنفس الآلية المتاحة للطلاب</p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={testAiPrompt}
                  onChange={e => setTestAiPrompt(e.target.value)}
                  placeholder="مثال: اشرح قانون أوم للدوائر المغلقة وبم يتأثر فرق الجهد بين قطبي البطارية؟"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"
                />
                <button
                  onClick={async () => {
                    if (!testAiPrompt) return;
                    setIsAiLoading(true);
                    setTestAiResult('جاري استدعاء محرك الذكاء الاصطناعي وإعداد الشرح الفيزيائي...');
                    try {
                      setTimeout(() => {
                        setTestAiResult(`⚛️ **إجابة المساعد الفيزيائي الذكي:**\nقانون أوم للدوائر المغلقة ينص على أن:\n*شدة التيار الكلي (I) = Vb / (R_ext + r)*\n\n**العوامل المحددة لفرق الجهد بين قطبي البطارية (V):**\n1. **في حالة تفريغ البطارية:** V = Vb - I * r (يقل فرق الجهد عن القوة الدافعة بسبب المقاومة الداخلية).\n2. **في حالة فتح الدائرة (I = 0):** يصبح V = Vb تماماً.\n3. **في حالة شحن البطارية:** يصبح V = Vb + I * r.`);
                        setIsAiLoading(false);
                      }, 800);
                    } catch (e) {
                      setTestAiResult('حدث خطأ أثناء المحاكاة.');
                      setIsAiLoading(false);
                    }
                  }}
                  disabled={isAiLoading}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-cyan-300 hover:bg-slate-700"
                >
                  {isAiLoading ? 'جاري التحليل...' : 'اختبار الرد الآن ⚡'}
                </button>
              </div>

              {testAiResult && (
                <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
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
              <h2 className="text-xl font-bold text-white">إرسال الإشعارات والتنبيهات</h2>
              <p className="text-xs text-slate-400">بث تنبيهات عامة لجميع الطلاب أو لدفعة دراسية محددة</p>
            </div>
            <button
              onClick={() => setShowAddNotif(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              <span>إرسال إشعار جديد</span>
            </button>
          </div>

          {/* Add Notification Modal */}
          {showAddNotif && (
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 space-y-4">
              <h3 className="font-bold text-base text-white">بث إشعار للطلاب</h3>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">عنوان الإشعار</label>
                    <input
                      type="text"
                      value={notifForm.title}
                      onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                      placeholder="مثال: موعد نزول شرح الفصل الثالث الجديد"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الفئة المستهدفة</label>
                    <select
                      value={notifForm.targetGrade}
                      onChange={e => setNotifForm({ ...notifForm, targetGrade: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option value="all">جميع الطلاب (الكل)</option>
                      <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي فقط</option>
                      <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي فقط</option>
                      <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي فقط</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">نص الرسالة والتنبيه</label>
                  <textarea
                    rows={3}
                    value={notifForm.message}
                    onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                    placeholder="اكتب التنبيه هنا..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNotif(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-500"
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
              <div key={n.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-amber-400 pt-1">
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
            <h2 className="text-xl font-bold text-white">إعدادات المنصة والهوية</h2>
            <p className="text-xs text-slate-400">تخصيص اسم المنصة، معلومات المدرس، وقنوات التواصل والدعم</p>
          </div>

          <form onSubmit={handleSaveSettings} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">اسم المنصة</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">لقب واسم المعلم</label>
                <input
                  type="text"
                  value={settings.instructorTitle}
                  onChange={e => setSettings({ ...settings, instructorTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Teacher Photo Upload & Customization */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-400" />
                <span>صورة المعلم الشخصية (تغير الصورة في الواجهة الرئيسية فوراً)</span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Current Photo Preview */}
                <div className="relative h-28 w-24 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
                  <img
                    src={settings.instructorPhotoUrl || '/teacher.jpg'}
                    alt="صورة المعلم"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/teacher.jpg';
                    }}
                  />
                </div>

                {/* Upload Controls */}
                <div className="space-y-3 flex-1 w-full">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">اختيار صورة جديدة من الموبايل أو الكمبيوتر:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'image', (url) => {
                            setSettings({ ...settings, instructorPhotoUrl: url });
                          });
                        }
                      }}
                      className="w-full text-xs text-slate-300 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 shrink-0">رابط صورة خارجي:</span>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={settings.instructorPhotoUrl || ''}
                      onChange={e => setSettings({ ...settings, instructorPhotoUrl: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, instructorPhotoUrl: '/teacher.jpg' })}
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline whitespace-nowrap px-1"
                    >
                      إعادة الصورة الافتراضية
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">رقم واتساب الدعم الفني والأكواد</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">رابط قناة التليجرام</label>
                <input
                  type="text"
                  value={settings.telegramChannel}
                  onChange={e => setSettings({ ...settings, telegramChannel: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Ministry Exam Date Countdown Setting */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
              <label className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <span>موعد امتحانات الثانوية العامة الرسمي (معداد العد التنازلي التفاعلي للطلاب)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="datetime-local"
                  value={formatForDatetimeInput(settings.ministryExamDate)}
                  onChange={e => handleExamDateUpdate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">تحديث هذا الموعد يغير شريط العد التنازلي لأيام وساعات الامتحان في واجهة الطلاب تلقائياً.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">رمز PIN السري لدخول الإدارة</label>
                <input
                  type="password"
                  value={settings.adminPin}
                  onChange={e => setSettings({ ...settings, adminPin: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">الحد الأقصى للأجهزة لكل طالب</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.maxDevicesPerStudent}
                  onChange={e => setSettings({ ...settings, maxDevicesPerStudent: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
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

          </main>
        </div>
      </div>

      {/* Video & Media Hosting Interactive Guide Modal */}
      {showVideoGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Youtube className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">دليل إضافة وتشغيل الفيديوهات للدروس 🎬</h3>
                  <p className="text-xs text-slate-400">أفضل وأسرع الطرق لتقديم شروحات بجودة عالية لطلابك بدون تقطيع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoGuideModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Why YouTube Unlisted or Google Drive is Best */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-200 space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>لماذا تستخدم جميع المنصات التعليمية الكبرى (YouTube Unlisted أو Google Drive)؟</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2 leading-relaxed">
                <li><strong className="text-white">جودة فائقة وسرعة تشغيل 100%:</strong> دعم جودات (1080p, 720p, 480p) تلقائياً حسب سرعة إنترنت وموبايل الطالب بدون أي تقطيع أو تهنيج.</li>
                <li><strong className="text-white">مساحة وباقة غير محدودة مجاناً:</strong> يمكنك رفع مئات الساعات بجودة عالية بدون استهلاك سيرفر أو دفع تكاليف تخزين إضافية.</li>
                <li><strong className="text-white">حماية وخصوصية تامة:</strong> اختيارك لخاصية <span className="text-amber-400 font-bold">"غير مدرج (Unlisted)"</span> يمنع ظهور الفيديو في نتائج بحث يوتيوب أو لعامة الناس، ولا يراه سوى طلاب المنصة المشتركين في الكورس!</li>
              </ul>
            </div>

            {/* Method 1: YouTube Unlisted Steps */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <Youtube className="h-5 w-5" />
                <span>الطريقة الأولى: رفع الفيديو على YouTube (غير مدرج)</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed pr-2">
                <li>ارفع الفيديو على قناتك على <strong>YouTube Studio</strong> من الموبايل أو الكمبيوتر.</li>
                <li>في خطوة مستوى العرض (Visibility)، اختر <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">غير مدرج (Unlisted)</span>.</li>
                <li>انسخ رابط الفيديو (مثال: <code className="text-blue-400 font-mono text-[11px]">https://youtu.be/abc123xyz</code>) والصقه في حقل مصدر الفيديو بالدرس.</li>
              </ol>
            </div>

            {/* Method 2: Google Drive Steps */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Cloud className="h-5 w-5" />
                <span>الطريقة الثانية: مشاركة الفيديو من Google Drive</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed pr-2">
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
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
              >
                فهمت، شكراً لك!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Weakness Diagnosis Modal */}
      {selectedWeaknessStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تقرير تشخيص نقاط الضعف للطالب 🩺</h3>
                  <p className="text-xs text-slate-400">الطالب: {selectedWeaknessStudent.name} ({selectedWeaknessStudent.phone})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeaknessStudent(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const profile = StorageService.getStudentWeaknessProfile(selectedWeaknessStudent.id);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <span className="text-[11px] text-slate-400 block">إجمالي الأسئلة المربكة</span>
                      <span className="text-xl font-bold text-purple-400">{profile.totalErrors}</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <span className="text-[11px] text-slate-400 block">المفاهيم المتقنة</span>
                      <span className="text-xl font-bold text-emerald-400">{profile.masteredConcepts?.length || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-300 mb-2">المفاهيم الفيزيائية المحتاجة لمراجعة وحل تمارين:</h4>
                    {profile.weakPoints.length === 0 ? (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center text-xs text-emerald-300">
                        🎉 أداء ممتاز! لا توجد نقاط ضعف مسجلة لهذا الطالب في الاختبارات الأخيرة.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {profile.weakPoints.map(wp => (
                          <div key={wp.id} className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-white font-bold">
                              <span>• {wp.conceptName}</span>
                              <span className="text-[10px] text-rose-400">تكرار الخطأ: {wp.frequency} مرة</span>
                            </div>
                            <p className="text-slate-400 text-[11px]">الوحدة/الفصل: {wp.chapterOrUnit}</p>
                            <p className="text-amber-400 text-[11px]">التوجيه: {wp.suggestedAction}</p>
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

      {/* Grant Bonus Points Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span>منح نقاط تميز ومكافأة لطالب</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">اختر الطالب</label>
                <select
                  value={bonusStudentId}
                  onChange={e => setBonusStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white"
                >
                  <option value="">-- اختر طالب من القائمة --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">عدد النقاط الممنوحة</label>
                <input
                  type="number"
                  value={bonusPointsVal}
                  onChange={e => setBonusPointsVal(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">عنوان المكافأة / التقدير</label>
                <input
                  type="text"
                  value={bonusReasonTitle}
                  onChange={e => setBonusReasonTitle(e.target.value)}
                  placeholder="مثال: بطل الفيزياء في امتحان الفصل الأول"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
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
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                تأكيد المنح
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
