import React, { useState, useEffect } from 'react';
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
  Send
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
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
  Lesson
} from '../types';

interface AdminDashboardProps {
  onNavigate: (view: string, params?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'exams' | 'students' | 'codes' | 'pdfs' | 'results' | 'notifs' | 'settings'>('overview');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<QuizExam[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [pdfs, setPdfs] = useState<PdfMaterial[]>([]);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(StorageService.getSettings());

  // Modals / Sub-forms
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddCode, setShowAddCode] = useState(false);
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
  };

  // Generate Codes in Bulk
  const handleGenerateCodes = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(codeGenForm.count) || 1;
    const targetId = codeGenForm.targetId || (codeGenForm.targetType === 'course' ? courses[0]?.id : pdfs[0]?.id);
    let targetName = 'كورس الفيزياء';
    if (codeGenForm.targetType === 'course') {
      targetName = courses.find(c => c.id === targetId)?.title || 'كورس فيزياء';
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
    setShowAddCode(false);
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

  const navTabs = [
    { id: 'overview', label: 'الإحصائيات العامة', icon: BarChart3 },
    { id: 'courses', label: 'إدارة الكورسات والدروس', icon: BookOpen },
    { id: 'exams', label: 'بنك الأسئلة والامتحانات', icon: HelpCircle },
    { id: 'students', label: 'إدارة الطلاب والأجهزة', icon: Users },
    { id: 'codes', label: 'توليد أكواد التفعيل', icon: Key },
    { id: 'pdfs', label: 'المذكرات والملازم PDF', icon: FileText },
    { id: 'results', label: 'نتائج وتقارير الطلاب', icon: Award },
    { id: 'notifs', label: 'إرسال الإشعارات', icon: Bell },
    { id: 'settings', label: 'إعدادات المنصة', icon: Settings }
  ];

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.phone.includes(studentSearch)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            Ψ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">لوحة تحكم إدارة المنصة</h1>
              <span className="rounded bg-blue-500/20 text-blue-400 px-2 py-0.5 text-xs font-bold">Admin Panel</span>
            </div>
            <p className="text-xs text-slate-400">إدارة شاملة للكورسات، الطلاب، الامتحانات، وأكواد التفعيل</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('dashboard')}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
          >
            معاينة حساب الطالب
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل خروج الإدارة</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none">
        {navTabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs font-bold text-slate-400">إجمالي الطلاب</span>
              <p className="mt-2 text-2xl font-black text-white">{students.length}</p>
              <p className="text-[10px] text-blue-400 mt-1">طالب مسجل</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs font-bold text-slate-400">الكورسات المتاحة</span>
              <p className="mt-2 text-2xl font-black text-amber-400">{courses.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">كورس ومنهج</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs font-bold text-slate-400">الامتحانات والكويزات</span>
              <p className="mt-2 text-2xl font-black text-purple-400">{exams.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">اختبار متاح</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs font-bold text-slate-400">الأكواد المنشأة</span>
              <p className="mt-2 text-2xl font-black text-emerald-400">{codes.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">المستخدم منها: {codes.filter(c => c.isUsed).length}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs font-bold text-slate-400">المذكرات والملازم</span>
              <p className="mt-2 text-2xl font-black text-rose-400">{pdfs.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">ملف PDF</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs font-bold text-slate-400">محاولات الامتحانات</span>
              <p className="mt-2 text-2xl font-black text-white">{attempts.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">تسليم مصحح</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">إجراءات الإدارة السريعة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                onClick={() => { setActiveTab('courses'); setShowAddCourse(true); }}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-xs font-bold text-white hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة كورس جديد</span>
              </button>
              <button
                onClick={() => { setActiveTab('codes'); setShowAddCode(true); }}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 p-3 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Key className="h-4 w-4" />
                <span>توليد أكواد تفعيل</span>
              </button>
              <button
                onClick={() => { setActiveTab('exams'); setShowAddExam(true); }}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 p-3 text-xs font-bold text-white hover:bg-purple-500"
              >
                <HelpCircle className="h-4 w-4" />
                <span>إنشاء امتحان جديد</span>
              </button>
              <button
                onClick={() => { setActiveTab('notifs'); setShowAddNotif(true); }}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Bell className="h-4 w-4" />
                <span>إرسال إشعار للطلاب</span>
              </button>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">أحدث نتائج الطلاب المسلمة</h3>
            <div className="divide-y divide-slate-800">
              {attempts.slice(0, 5).map(att => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{att.studentName}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-300">{att.examTitle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-black ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {att.score}/{att.maxScore} ({att.percentage}%)
                    </span>
                    <span className="text-slate-400">{new Date(att.submittedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
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
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">رابط صورة الكورس (Thumbnail URL)</label>
                    <input
                      type="text"
                      value={courseForm.thumbnail}
                      onChange={e => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
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
                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            <input
                              type="text"
                              value={lessonForm.unitId === u.id ? lessonForm.title : ''}
                              onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, title: e.target.value })}
                              placeholder="عنوان الدرس الجديد..."
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={lessonForm.unitId === u.id ? lessonForm.videoUrl : ''}
                                onChange={e => setLessonForm({ ...lessonForm, unitId: u.id, videoUrl: e.target.value })}
                                placeholder="رابط فيديو اليوتيوب أو MP4..."
                                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                              />
                              <button
                                onClick={() => handleAddLesson(course.id, u.id)}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shrink-0"
                              >
                                حفظ الدرس
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

                {/* Questions Preview & Simple Add */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400">الأسئلة المدرجة ({examForm.questions.length})</h4>
                  {examForm.questions.map((q, idx) => (
                    <div key={idx} className="text-xs text-slate-300 space-y-1 pb-2 border-b border-slate-800/60">
                      <p className="font-bold text-white">{idx + 1}. {q.text}</p>
                      <p className="text-[11px] text-emerald-400">الإجابة الصحيحة: {q.options[q.correctOptionIndex]}</p>
                    </div>
                  ))}
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
                <button
                  onClick={() => onNavigate('exam-runner', { examId: ex.id })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-white hover:bg-slate-700"
                >
                  معاينة تجربة الامتحان
                </button>
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleResetDevices(student)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
                            title="إعادة ضبط أجهزة الطالب"
                          >
                            تفريغ الأجهزة
                          </button>
                          <button
                            onClick={() => handleToggleBlockStudent(student)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      {codeGenForm.targetType === 'course' ? (
                        courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                      ) : (
                        pdfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
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
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">رابط ملف الـ PDF (Direct URL)</label>
                    <input
                      type="text"
                      value={pdfForm.url}
                      onChange={e => setPdfForm({ ...pdfForm, url: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                      required
                    />
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
              <div key={pdf.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5">
                    {pdf.category}
                  </span>
                  <span className="text-xs text-slate-400">{pdf.pageCount} صفحة</span>
                </div>
                <h3 className="font-bold text-white text-base leading-snug">{pdf.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>{pdf.isLocked ? '🔒 يتطلب كود' : '🔓 متاح مجاناً'}</span>
                  <span>{pdf.downloadCount || 0} تنزيل</span>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attempts.map(att => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: NOTIFICATIONS BROADCAST */}
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

    </div>
  );
};
