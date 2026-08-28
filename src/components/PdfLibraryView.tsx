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
  ExternalLink
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { PdfMaterial, Student } from '../types';

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

  useEffect(() => {
    const update = () => {
      setMaterials(StorageService.getPdfs());
      setStudent(StorageService.getCurrentStudent());
    };
    update();
    return subscribeToStorage(update);
  }, []);

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

  const filteredMaterials = materials.filter(m => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (selectedGrade !== 'all' && m.grade !== selectedGrade) return false;
    if (searchQuery.trim() && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>المكتبة الرقمية والملازم الفيزيائية</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          مذكرات وملازم الفيزياء
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          جميع مذكرات الشرح، بنوك الأسئلة المحلولة، ملخصات القوانين، والامتحانات التجريبية بصيغة PDF عالية الجودة.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                  : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grade Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 w-full sm:w-auto overflow-x-auto">
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedGrade === g.id ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
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
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pr-10 pl-4 text-xs text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-3">
          <FileText className="mx-auto h-12 w-12 opacity-40" />
          <h3 className="text-base font-bold text-white">لا توجد مذكرات تطابق الفلتر المحدد</h3>
          <p className="text-xs">جرب اختيار مرحلة دراسية أخرى أو مسح نص البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((pdf) => {
            const isUnlocked = !pdf.isLocked || (student && student.unlockedPdfIds?.includes(pdf.id));

            return (
              <div
                key={pdf.id}
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      {pdf.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {pdf.grade.includes('الثالث') ? '3 ثانوي' : pdf.grade.includes('الثاني') ? '2 ثانوي' : '1 ثانوي'}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-500/15 p-3 text-amber-400 shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                        {pdf.title}
                      </h3>
                      {pdf.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {pdf.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>📄 {pdf.pageCount || 40} صفحة</span>
                    <span>💾 {pdf.fileSize || '8.5 MB'}</span>
                    <span>📥 {pdf.downloadCount || 150} تنزيل</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80">
                  {isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewPdf(pdf)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 text-amber-400" />
                        <span>معاينة وقراءة</span>
                      </button>
                      <a
                        href={pdf.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>تحميل الملف</span>
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={student ? onOpenActivationModal : onOpenAuthModal}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-500 transition-all"
                      >
                        <Key className="h-4 w-4" />
                        <span>تفعيل المذكرة بالكود</span>
                      </button>
                      <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>مذكرة محمية تتطلب كود الاشتراك</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Reader / Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative flex flex-col h-full max-h-[92vh] w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:px-6 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base truncate max-w-md">{previewPdf.title}</h3>
                  <span className="text-[11px] text-slate-400">{previewPdf.category} • {previewPdf.pageCount || 40} صفحة</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewPdf.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                  <span>فتح في تبويب جديد</span>
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="rounded-xl border border-slate-800 bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe / viewer */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
              <iframe
                src={`${previewPdf.url}#toolbar=1&navpanes=0`}
                title={previewPdf.title}
                className="h-full w-full rounded-xl border border-slate-800 bg-white"
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 bg-slate-950 p-3 sm:px-6 flex items-center justify-between text-xs text-slate-400">
              <span>جميع الحقوق محفوظة للمنصة التعليمية Wiki-X فيزياء</span>
              <a
                href={previewPdf.url}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تحميل نسخة PDF</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
