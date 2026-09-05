import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  Eye, 
  Sparkles, 
  BookOpen, 
  Key,
  X,
  ExternalLink,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { PdfMaterial, Student } from '../types';
import { PdfViewerModal } from './PdfViewerModal';
import { downloadPdfFile } from '../utils/pdfHelper';
import { ScrollReveal } from './ScrollReveal';

interface PdfLibraryViewProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenAuthModal: () => void;
}

export const PdfLibraryView: React.FC<PdfLibraryViewProps> = ({
  onNavigate,
  onOpenActivationModal,
  onOpenAuthModal
}) => {
  const [materials, setMaterials] = useState<PdfMaterial[]>([]);
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewPdf, setPreviewPdf] = useState<PdfMaterial | null>(null);
  const [selectedOptionsPdf, setSelectedOptionsPdf] = useState<PdfMaterial | null>(null);
  const [walletMsg, setWalletMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const update = () => {
      setMaterials(StorageService.getPdfs());
      setStudent(StorageService.getCurrentStudent());
    };
    update();
    return subscribeToStorage(update);
  }, []);

  const [accessFilter, setAccessFilter] = useState<string>('all'); // 'all', 'free', 'paid'

  const categories = [
    { id: 'all', label: 'جميع المذكرات' },
    { id: 'مذكرات الشرح', label: 'مذكرات الشرح والتبسيط' },
    { id: 'بنك الأسئلة والتمارين', label: 'بنوك الأسئلة والتدريبات' },
    { id: 'المراجعات النهائية', label: 'المراجعات النهائية والتوقعات' },
    { id: 'ملخص القوانين والخرائط الذهنية', label: 'ملخصات القوانين والخرائط' }
  ];

  const grades = [
    { id: 'all', label: 'كل المراحل' },
    { id: 'الصف الثالث الثانوي (ثانوية عامة)', label: '3 ثانوي' },
    { id: 'الصف الثاني الثانوي', label: '2 ثانوي' },
    { id: 'الصف الأول الثانوي', label: '1 ثانوي' }
  ];

  const courses = StorageService.getCourses();

  const filteredMaterials = materials.filter(m => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (selectedGrade !== 'all' && m.grade !== selectedGrade) return false;
    
    const isFree = m.isFree || !m.isLocked || m.price === 0;
    if (accessFilter === 'free' && !isFree) return false;
    if (accessFilter === 'paid' && isFree) return false;

    if (searchQuery.trim() && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handlePayViaWallet = (pdf: PdfMaterial) => {
    if (!student) {
      onOpenAuthModal();
      return;
    }
    const currentStudent = StorageService.getCurrentStudent();
    if (!currentStudent) return;
    const price = pdf.price || 50;
    const studentWallet = currentStudent.walletBalance || 0;

    if (studentWallet < price) {
      setWalletMsg({
        type: 'error',
        text: `رصيد محفظتك غير كافٍ (${studentWallet} ج.م). يحتاج الملف إلى ${price} ج.م. يرجى شحن رصيد المحفظة أو التفعيل بكود.`
      });
      return;
    }

    const updatedUnlocked = [...(currentStudent.unlockedPdfIds || []), pdf.id];
    const newBalance = studentWallet - price;
    StorageService.updateStudent(currentStudent.id, {
      walletBalance: newBalance,
      unlockedPdfIds: updatedUnlocked
    });

    const updatedCurrent = StorageService.getStudentById(currentStudent.id);
    if (updatedCurrent) {
      StorageService.setCurrentStudent(updatedCurrent);
    }

    setWalletMsg({
      type: 'success',
      text: `تم الشراء بنجاح! تم خصم ${price} ج.م وتفعيل المذكرة على حسابك.`
    });
    setStudent(StorageService.getCurrentStudent());
    setTimeout(() => {
      setWalletMsg(null);
      setSelectedOptionsPdf(null);
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2E86FF]/30 bg-[#2E86FF]/10 px-3.5 py-1 text-xs font-bold text-[#2E86FF]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>المكتبة الرقمية والملازم الفيزيائية</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          مذكرات وملازم الفيزياء
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          جميع مذكرات الشرح، بنوك الأسئلة المحلولة، ملخصات القوانين، والامتحانات التجريبية بصيغة PDF عالية الجودة.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Access Type Filter Pills (Free / Paid / All) */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setAccessFilter('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              accessFilter === 'all'
                ? 'bg-[#2E86FF] text-white shadow-md'
                : 'border border-[#1E375E] bg-[#122442] text-slate-300 hover:text-white'
            }`}
          >
            جميع المذكرات
          </button>
          <button
            onClick={() => setAccessFilter('free')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              accessFilter === 'free'
                ? 'bg-emerald-500 text-[#0C1B33] shadow-md'
                : 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            <span>مذكرات مجانية</span>
          </button>
          <button
            onClick={() => setAccessFilter('paid')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              accessFilter === 'paid'
                ? 'bg-[#FFB020] text-[#0C1B33] shadow-md'
                : 'border border-[#FFB020]/30 bg-[#FFB020]/10 text-[#FFB020] hover:bg-[#FFB020]/20'
            }`}
          >
            <span>مذكرات مدفوعة</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? 'bg-[#122442] text-[#2E86FF] border border-[#2E86FF]/40'
                  : 'border border-[#1E375E] bg-[#0C1B33] text-slate-300 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grade Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#1E375E] bg-[#122442] p-1 w-full sm:w-auto overflow-x-auto">
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedGrade === g.id ? 'bg-[#0C1B33] text-[#2E86FF] font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المذكرة أو الفصل..."
              className="w-full rounded-xl border border-[#1E375E] bg-[#122442] py-2 pr-10 pl-4 text-xs text-white placeholder:text-slate-500 focus:border-[#2E86FF] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="rounded-3xl border border-[#1E375E] bg-[#122442]/60 p-12 text-center text-slate-400 space-y-3">
          <FileText className="mx-auto h-12 w-12 opacity-40 text-[#2E86FF]" />
          <h3 className="text-base font-bold text-white">لا توجد مذكرات تطابق الفلتر المحدد</h3>
          <p className="text-xs">جرب اختيار مرحلة دراسية أخرى أو مسح نص البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((pdf, idx) => {
            const isFreePdf = pdf.isFree || !pdf.isLocked || pdf.price === 0;
            const isEnrolledInCourse = pdf.associatedCourseId && student?.enrolledCourseIds?.includes(pdf.associatedCourseId);
            const isUnlockedByCode = student && student.unlockedPdfIds?.includes(pdf.id);
            const isUnlocked = isFreePdf || isEnrolledInCourse || isUnlockedByCode;

            const linkedCourse = courses.find(c => c.id === pdf.associatedCourseId);

            return (
              <ScrollReveal key={pdf.id} index={idx} className="h-full">
                <div
                  className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4 h-full"
                >
                  <div className="space-y-3">
                    {/* Top Badge Row */}
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="rounded-md bg-[#2E86FF]/15 border border-[#2E86FF]/30 px-2 py-0.5 text-[10px] font-bold text-[#2E86FF]">
                        {pdf.category}
                      </span>
                      
                      {isFreePdf ? (
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          مجانية
                        </span>
                      ) : (
                        <span className="rounded-md bg-[#FFB020]/15 border border-[#FFB020]/30 px-2 py-0.5 text-[10px] font-bold text-[#FFB020]">
                          {pdf.price || 50} ج.م
                        </span>
                      )}
                    </div>

                    {/* Title & Icon */}
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-[#2E86FF]/15 p-3 text-[#2E86FF] shrink-0 border border-[#2E86FF]/30">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                          {pdf.title}
                        </h3>
                        {pdf.description && (
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {pdf.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Linked Course info if present */}
                    {linkedCourse && (
                      <div className="rounded-xl bg-[#0C1B33] border border-[#2E86FF]/20 p-2 text-xs flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">الكورس التابع:</span>
                        <span className="font-bold text-[#2E86FF] text-[11px]">{linkedCourse.title}</span>
                      </div>
                    )}

                    {/* Metadata Row */}
                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-[#1E375E]">
                      <span>{pdf.pageCount || 40} صفحة</span>
                      <span>{pdf.fileSize || '8.5 MB'}</span>
                      <span>{pdf.downloadCount || 150} تنزيل</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#1E375E]">
                    {isUnlocked ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewPdf(pdf)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1E375E] bg-[#122442] py-2.5 text-xs font-bold text-white hover:bg-[#1B355E] transition-colors"
                        >
                          <Eye className="h-4 w-4 text-[#2E86FF]" />
                          <span>معاينة وقراءة</span>
                        </button>
                        <button
                          onClick={() => downloadPdfFile(pdf.url, `${pdf.title}.pdf`)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FFB020] py-2.5 text-xs font-bold text-[#0C1B33] shadow-md shadow-[#FFB020]/20 hover:bg-[#e59e1c] transition-all"
                        >
                          <Download className="h-4 w-4" />
                          <span>تحميل الملف</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedOptionsPdf(pdf)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E86FF] py-2.5 text-xs font-bold text-white shadow-md shadow-[#2E86FF]/20 hover:bg-[#2072e5] transition-all"
                        >
                          <Lock className="h-4 w-4" />
                          <span>عرض خيارات التفعيل والوصول</span>
                        </button>
                        {linkedCourse && (
                          <p className="text-[10px] text-center text-[#FFB020] font-medium">
                            متاحة مجاناً لجميع المشتركين في كورس "{linkedCourse.title}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* PDF Access Choice Modal */}
      {selectedOptionsPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071120]/85 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="relative w-full max-w-md rounded-3xl border border-[#1E375E] bg-[#0C1B33] p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => { setSelectedOptionsPdf(null); setWalletMsg(null); }}
              className="absolute top-5 left-5 rounded-xl border border-[#1E375E] bg-[#122442] p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 text-[#2E86FF]">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-white">{selectedOptionsPdf.title}</h3>
              <p className="text-xs text-slate-300">
                اختر الطريقة المناسبة لك للحصول على هذه المذكرة
              </p>
            </div>

            {walletMsg && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                walletMsg.type === 'success' 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}>
                {walletMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{walletMsg.text}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {/* Option 1: Redeem Code */}
              <button
                onClick={() => {
                  setSelectedOptionsPdf(null);
                  if (student) {
                    onOpenActivationModal();
                  } else {
                    onOpenAuthModal();
                  }
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#1E375E] bg-[#122442] hover:border-[#2E86FF] transition-all text-right group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#FFB020]/15 text-[#FFB020] flex items-center justify-center shrink-0">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-[#2E86FF] transition-colors">تفعيل باستخدام كود شحن</div>
                    <div className="text-[11px] text-slate-300">أدخل رمز التفعيل المشتري من الموزع</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#FFB020]">كود</span>
              </button>

              {/* Option 2: Pay via Wallet */}
              <button
                onClick={() => handlePayViaWallet(selectedOptionsPdf)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#1E375E] bg-[#122442] hover:border-[#2E86FF] transition-all text-right group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#2E86FF]/15 text-[#2E86FF] flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-[#2E86FF] transition-colors">خصم مباشر من المحفظة</div>
                    <div className="text-[11px] text-slate-300">رصيدك الحالي: {student?.walletBalance || 0} ج.م</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2E86FF]">{selectedOptionsPdf.price || 50} ج.م</span>
              </button>

              {/* Option 3: Course Subscription Link */}
              {selectedOptionsPdf.associatedCourseId && (
                <button
                  onClick={() => {
                    setSelectedOptionsPdf(null);
                    onNavigate('course-details', { courseId: selectedOptionsPdf.associatedCourseId });
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#1E375E] bg-[#122442] hover:border-[#2E86FF] transition-all text-right group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-[#2E86FF] transition-colors">الاشتراك في الكورس المرتبط</div>
                      <div className="text-[11px] text-slate-300">تُتاح المذكرة مجاناً ضمن الكورس</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">شامل</span>
                </button>
              )}

              {/* Option 4: Free Preview */}
              <button
                onClick={() => {
                  const pdfToPreview = selectedOptionsPdf;
                  setSelectedOptionsPdf(null);
                  setPreviewPdf(pdfToPreview);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-[#1E375E] bg-[#0C1B33] hover:border-slate-500 transition-all text-right"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-300 font-bold">معاينة وتصفح بعض الصفحات</span>
                </div>
                <span className="text-[10px] text-slate-400">مجاني</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Reader / Preview Modal */}
      {previewPdf && (
        <PdfViewerModal
          isOpen={!!previewPdf}
          onClose={() => setPreviewPdf(null)}
          title={previewPdf.title}
          pdfUrl={previewPdf.url}
          category={previewPdf.category}
          grade={previewPdf.grade}
          pageCount={previewPdf.pageCount}
        />
      )}

    </div>
  );
};
