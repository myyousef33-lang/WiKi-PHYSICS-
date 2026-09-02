import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Search, 
  Filter, 
  Upload, 
  Calendar, 
  Award,
  User,
  BookOpen,
  Send,
  Eye,
  AlertCircle,
  Link,
  ExternalLink,
  FileCheck,
  X,
  Info
} from 'lucide-react';
import { Assignment, AssignmentSubmission, Course, GradeLevel } from '../types';
import { StorageService, subscribeToStorage } from '../services/storage';
import { MediaStore } from '../services/mediaStore';
import { extractGoogleDriveId } from '../utils/pdfHelper';
import { AssignmentSolverModal } from './AssignmentSolverModal';

export const AdminAssignmentsTab: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(StorageService.getAssignments());
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(StorageService.getAssignmentSubmissions());
  const [courses, setCourses] = useState<Course[]>(StorageService.getCourses());

  const [activeSubTab, setActiveSubTab] = useState<'assignments' | 'submissions'>('submissions');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded'>('pending');

  // Modal State for Grading
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<Assignment | null>(null);
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<AssignmentSubmission | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState<boolean>(false);

  // New Assignment Form State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCourseId, setNewCourseId] = useState<string>('');
  const [newMaxGrade, setNewMaxGrade] = useState<number>(20);
  const [newDeadline, setNewDeadline] = useState<string>('');
  const [newPdfUrl, setNewPdfUrl] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [pdfUploadMode, setPdfUploadMode] = useState<'drive' | 'file'>('drive');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    const updateData = () => {
      setAssignments(StorageService.getAssignments());
      setSubmissions(StorageService.getAssignmentSubmissions());
      setCourses(StorageService.getCourses());
    };
    updateData();
    return subscribeToStorage(updateData);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('حجم ملف الـ PDF كبير جدًا. برجاء اختيار ملف أقل من 20 ميجابايت.');
      return;
    }

    setIsUploading(true);
    try {
      const mediaId = 'assignment_pdf_' + Date.now();
      const url = await MediaStore.saveMedia(mediaId, file, file.name);
      setNewPdfUrl(url);
    } catch (err) {
      alert('حدث خطأ أثناء رفع ملف الـ PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCourseId || !newPdfUrl) {
      alert('برجاء تعبئة العنوان واختيار الكورس ورفع ملف الـ PDF للواجب.');
      return;
    }

    const selectedCourse = courses.find(c => c.id === newCourseId);

    const assignment: Assignment = {
      id: 'asgn_' + Date.now(),
      courseId: newCourseId,
      courseTitle: selectedCourse?.title || '',
      title: newTitle.trim(),
      description: newDescription.trim(),
      pdfUrl: newPdfUrl,
      deadline: newDeadline ? new Date(newDeadline).toISOString() : undefined,
      maxGrade: Number(newMaxGrade) || 20,
      createdAt: new Date().toISOString()
    };

    StorageService.saveAssignment(assignment);
    setIsCreateOpen(false);
    setNewTitle('');
    setNewPdfUrl('');
    setNewDescription('');
    setNewDeadline('');
    alert('تم إضافة الواجب الدراسي بنجاح!');
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا الواجب؟ سيتم حذف جميع التسليمات الخاصة به.')) {
      StorageService.deleteAssignment(id);
    }
  };

  const handleOpenGradingModal = (sub: AssignmentSubmission) => {
    const asgn = assignments.find(a => a.id === sub.assignmentId) || {
      id: sub.assignmentId,
      courseId: sub.courseId,
      title: sub.assignmentTitle,
      pdfUrl: '',
      maxGrade: sub.maxGrade || 20,
      createdAt: sub.submittedAt
    };

    setSelectedAssignmentForGrading(asgn);
    setSelectedSubmissionForGrading(sub);
    setIsGradingModalOpen(true);
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sub.studentPhone && sub.studentPhone.includes(searchTerm));
    const matchesCourse = selectedCourseFilter === 'all' || sub.courseId === selectedCourseFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] p-6 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E4FD8]/10 text-[#1E4FD8] dark:bg-[#4C7CFF]/20 dark:text-[#4C7CFF]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0D1B3E] dark:text-white">إدارة وتصحيح الواجبات (PDF)</h2>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                متابعة وتسليم وتصحيح واجبات الـ PDF والتفاعل المباشر مع حلول الطلاب
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === 'submissions'
                ? 'bg-[#1E4FD8] text-white shadow-md'
                : 'bg-slate-100 dark:bg-[#0D1B3E] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>تسليمات الطلاب</span>
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {pendingCount} جديد
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === 'assignments'
                ? 'bg-[#1E4FD8] text-white shadow-md'
                : 'bg-slate-100 dark:bg-[#0D1B3E] text-slate-700 dark:text-slate-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>قائمة الواجبات ({assignments.length})</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F5B301] text-[#0D1B3E] font-black text-xs hover:bg-[#e0a401] shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            إضافة واجب جديد
          </button>
        </div>
      </div>

      {/* SubTab 1: Student Submissions Review Table */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ابحث باسم الطالب أو عنوان الواجب..."
                  className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] text-xs text-[#0D1B3E] dark:text-white focus:outline-none"
                />
              </div>

              {/* Course Filter */}
              <select
                value={selectedCourseFilter}
                onChange={e => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] text-xs font-bold text-[#0D1B3E] dark:text-white"
              >
                <option value="all">جميع الكورسات</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0D1B3E] p-1 rounded-xl border border-slate-200 dark:border-[#24336A]">
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  قيد المراجعة ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('graded')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'graded' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  تم التصحيح
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  الكل ({submissions.length})
                </button>
              </div>
            </div>
          </div>

          {/* Submissions List Table */}
          <div className="bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] rounded-3xl overflow-hidden shadow-xs">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm text-[#0D1B3E] dark:text-white">لا توجد تسليمات واجبات طابقة للفلاتر</p>
                <p className="text-xs text-slate-400 mt-1">تأكد من اختيار الكورس أو تغيير حالة التصفية</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] text-slate-500 dark:text-slate-400 text-xs font-bold">
                      <th className="p-4">الطالب</th>
                      <th className="p-4">الواجب الدراسي</th>
                      <th className="p-4">تاريخ التسليم</th>
                      <th className="p-4">الحالة والدرجة</th>
                      <th className="p-4 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#24336A] text-xs">
                    {filteredSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1A295C]/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1E4FD8] font-black text-sm">
                              {sub.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[#0D1B3E] dark:text-white text-sm">{sub.studentName}</p>
                              <p className="text-[11px] text-slate-400">{sub.studentPhone || 'بدون هاتف'} • {sub.studentGrade || 'المرجلة الثانوية'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-[#0D1B3E] dark:text-white">{sub.assignmentTitle}</p>
                        </td>

                        <td className="p-4 text-slate-500 dark:text-slate-400">
                          {new Date(sub.submittedAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        <td className="p-4">
                          {sub.status === 'graded' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              {sub.grade} / {sub.maxGrade || 20}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold animate-pulse">
                              <Clock className="h-4 w-4" />
                              بانتظار التصحيح
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenGradingModal(sub)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E4FD8] hover:bg-blue-700 text-white font-bold transition-all shadow-xs"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            {sub.status === 'graded' ? 'تعديل التصحيح' : 'فتح وتصحيح الواجب'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SubTab 2: Created Assignments List */}
      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] rounded-3xl text-center text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm text-[#0D1B3E] dark:text-white">لا توجد واجبات مضافة بعد</p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 px-5 py-2.5 bg-[#F5B301] text-[#0D1B3E] font-black text-xs rounded-xl shadow-xs"
              >
                + إضافة أول واجب دراسي
              </button>
            </div>
          ) : (
            assignments.map(asgn => (
              <div key={asgn.id} className="bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] rounded-3xl p-5 space-y-4 shadow-xs hover:border-[#1E4FD8] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#F5B301] dark:bg-amber-950/40">
                      <FileText className="h-5 w-5 text-[#0D1B3E] dark:text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0D1B3E] dark:text-white text-sm line-clamp-1">{asgn.title}</h3>
                      <p className="text-[11px] text-slate-400">{asgn.courseTitle || 'كورس عام'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAssignment(asgn.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {asgn.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{asgn.description}</p>
                )}

                {/* PDF Link Indicator & Actions */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#0D1B3E] border border-slate-100 dark:border-[#24336A] text-[11px]">
                  <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300 truncate">
                    {extractGoogleDriveId(asgn.pdfUrl) ? (
                      <>
                        <Link className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-blue-600 dark:text-blue-400">Google Drive PDF</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>ملف PDF مرفوع</span>
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => window.open(asgn.pdfUrl, '_blank')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#1E4FD8] shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>فتح المعاينة</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#24336A] text-xs">
                  <span className="font-bold text-[#F5B301]">الدرجة: {asgn.maxGrade || 20}</span>
                  {asgn.deadline ? (
                    <span className="text-rose-500 font-semibold">
                      موعد التسليم: {new Date(asgn.deadline).toLocaleDateString('ar-EG')}
                    </span>
                  ) : (
                    <span className="text-slate-400">بدون تاريخ استحقاق</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create New Assignment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir="rtl">
          <div className="bg-white dark:bg-[#16224D] border border-slate-200 dark:border-[#24336A] rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#24336A] pb-3">
              <h3 className="font-black text-base text-[#0D1B3E] dark:text-white">إضافة واجب دراسي جديد (PDF)</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0D1B3E] dark:text-white mb-1">عنوان الواجب *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="مثال: واجب الفصل الأول - قانون أوم وتوصيل المقاومات"
                  className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-[#0D1B3E] dark:text-white focus:outline-none focus:border-[#1E4FD8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0D1B3E] dark:text-white mb-1">الكورس المرتبط *</label>
                <select
                  required
                  value={newCourseId}
                  onChange={e => setNewCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-[#0D1B3E] dark:text-white font-bold focus:outline-none"
                >
                  <option value="">-- اختر الكورس --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0D1B3E] dark:text-white mb-1">الدرجة الكلية *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={newMaxGrade}
                    onChange={e => setNewMaxGrade(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-[#0D1B3E] dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0D1B3E] dark:text-white mb-1">تاريخ التسليم النهائي</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-[#0D1B3E] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* File Attachment Mode Switcher & Google Drive Link Input */}
              <div className="space-y-2">
                <label className="block font-bold text-[#0D1B3E] dark:text-white">
                  ملف الـ PDF الخاص بالواجب *
                </label>
                
                {/* Mode Selector Tabs */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-[#0D1B3E] p-1 border border-slate-200 dark:border-[#24336A]">
                  <button
                    type="button"
                    onClick={() => setPdfUploadMode('drive')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      pdfUploadMode === 'drive'
                        ? 'bg-[#1E4FD8] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Link className="h-3.5 w-3.5" />
                    <span>رابط Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfUploadMode('file')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      pdfUploadMode === 'file'
                        ? 'bg-[#1E4FD8] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>رفع ملف من الجهاز</span>
                  </button>
                </div>

                {pdfUploadMode === 'drive' ? (
                  /* Google Drive URL Input Mode */
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={newPdfUrl}
                      onChange={e => setNewPdfUrl(e.target.value)}
                      placeholder="ضع رابط ملف Google Drive هنا (مثال: https://drive.google.com/file/d/.../view)"
                      className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-xs text-[#0D1B3E] dark:text-white focus:outline-none focus:border-[#1E4FD8] ltr text-left font-mono"
                    />

                    {/* Google Drive Status indicator */}
                    {newPdfUrl.trim() ? (
                      extractGoogleDriveId(newPdfUrl) ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>تم التعرف على رابط Google Drive بنجاح (ID: {extractGoogleDriveId(newPdfUrl)})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => window.open(newPdfUrl, '_blank')}
                            className="text-emerald-800 dark:text-emerald-200 underline hover:opacity-80 flex items-center gap-1 text-[10px]"
                          >
                            <span>فتح للتأكد</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>تم تسجيل الرابط المباشر للملف</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => window.open(newPdfUrl, '_blank')}
                            className="text-blue-800 dark:text-blue-200 underline hover:opacity-80 flex items-center gap-1 text-[10px]"
                          >
                            <span>فتح الرابط</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>خطوات الحصول على رابط Google Drive:</span>
                        </p>
                        <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-amber-900 dark:text-amber-200 leading-relaxed">
                          <li>افتح ملف الواجب الـ PDF في Google Drive.</li>
                          <li>اضغط زر <b>مشاركة (Share)</b> ثم حدد الإذن: <b>أي شخص لديه الرابط (Anyone with the link)</b>.</li>
                          <li>اضغط <b>نسخ الرابط (Copy link)</b> والصقه في الخانة أعلاه.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Direct Local File Upload Mode */
                  <div className="space-y-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-[#24336A] rounded-xl p-3 bg-slate-50 dark:bg-[#0D1B3E] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Upload className="h-4 w-4 text-[#1E4FD8]" />
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {isUploading ? 'جاري الرفع...' : newPdfUrl && !newPdfUrl.startsWith('http') ? 'تم رفع الملف بنجاح' : 'اختر ملف PDF من جهازك'}
                      </span>
                      <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {newPdfUrl && !newPdfUrl.startsWith('http') && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>تم رفع الملف وتجهيزه للواجب والتصحيح</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#0D1B3E] dark:text-white mb-1">وصف أو تعليمات إضافية</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="ملاحظات توجيهية للطلاب أثناء حل الـ PDF..."
                  className="w-full rounded-xl border border-slate-300 dark:border-[#24336A] bg-slate-50 dark:bg-[#0D1B3E] p-3 text-[#0D1B3E] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#24336A]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !newPdfUrl}
                  className="px-6 py-2.5 bg-[#1E4FD8] text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  حفظ ونشر الواجب
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Admin Interactive PDF Grading Modal */}
      {isGradingModalOpen && selectedAssignmentForGrading && selectedSubmissionForGrading && (
        <AssignmentSolverModal
          isOpen={isGradingModalOpen}
          onClose={() => setIsGradingModalOpen(false)}
          assignment={selectedAssignmentForGrading}
          submission={selectedSubmissionForGrading}
          mode="grade"
          onSuccess={() => {
            setSubmissions(StorageService.getAssignmentSubmissions());
          }}
        />
      )}

    </div>
  );
};
