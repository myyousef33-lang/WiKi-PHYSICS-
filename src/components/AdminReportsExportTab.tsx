import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  Award, 
  Wallet
} from 'lucide-react';
import { StorageService } from '../services/storage';

export const AdminReportsExportTab: React.FC = () => {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const downloadCSV = (filename: string, csvContent: string) => {
    // Add BOM for proper Arabic text rendering in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudents = () => {
    setDownloadingType('students');
    const students = StorageService.getStudents();
    const headers = ['معرف الطالب', 'اسم الطالب', 'رقم الهاتف', 'هاتف ولي الأمر', 'المحافظة', 'الصف الدراسي', 'رصيد المحفظة (ج.م)', 'عدد الكورسات المشترك بها', 'تاريخ التسجيل'];
    
    const rows = students.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.phone,
      s.parentPhone || '',
      `"${(s.governorate || '').replace(/"/g, '""')}"`,
      `"${(s.grade || '').replace(/"/g, '""')}"`,
      s.walletBalance || 0,
      s.enrolledCourseIds?.length || 0,
      s.registeredAt ? new Date(s.registeredAt).toLocaleDateString('ar-EG') : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`تقرير_الطلاب_منصة_ويكيفزياء_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setTimeout(() => setDownloadingType(null), 1000);
  };

  const exportExamsResults = () => {
    setDownloadingType('exams');
    const attempts = StorageService.getAttempts();
    const students = StorageService.getStudents();
    const studentMap = new Map(students.map(s => [s.id, s]));

    const headers = ['معرف المحاولة', 'اسم الطالب', 'هاتف الطالب', 'الصف', 'اسم الامتحان', 'الدرجة المحصلة', 'الدرجة العظمى', 'النسبة المئوية', 'حالة الاجتياز', 'تاريخ التسليم'];

    const rows = attempts.map(a => {
      const st = studentMap.get(a.studentId);
      return [
        a.id,
        `"${a.studentName.replace(/"/g, '""')}"`,
        st?.phone || '',
        `"${(st?.grade || '').replace(/"/g, '""')}"`,
        `"${a.examTitle.replace(/"/g, '""')}"`,
        a.score,
        a.maxScore,
        `${a.percentage}%`,
        a.passed ? 'ناجح' : 'راسب',
        new Date(a.submittedAt).toLocaleDateString('ar-EG')
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`تقرير_نتائج_الامتحانات_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setTimeout(() => setDownloadingType(null), 1000);
  };

  const exportWalletTransactions = () => {
    setDownloadingType('wallet');
    const txs = StorageService.getWalletTransactions();
    const headers = ['معرف المعاملة', 'اسم الطالب', 'رقم الهاتف', 'نوع المعاملة', 'المبلغ (ج.م)', 'الحالة', 'اسم البوابة / الكورس', 'رقم العملية المرجعي', 'تاريخ الإنشاء', 'تاريخ المعالجة'];

    const rows = txs.map(t => [
      t.id,
      `"${t.studentName.replace(/"/g, '""')}"`,
      t.studentPhone,
      t.type === 'deposit' ? 'شحن رصيد' : 'شراء كورس/مذكرة',
      t.amount,
      t.status === 'approved' ? 'مكتمل' : t.status === 'pending' ? 'معلق' : 'مرفوض',
      `"${(t.methodName || t.courseTitle || t.pdfTitle || '').replace(/"/g, '""')}"`,
      t.transactionRefNumber || '',
      new Date(t.createdAt).toLocaleDateString('ar-EG'),
      t.processedAt ? new Date(t.processedAt).toLocaleDateString('ar-EG') : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`تقرير_المعاملات_المالية_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setTimeout(() => setDownloadingType(null), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-black text-[#0D1B3E] flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-[#1E4FD8]" />
          <span>تصدير التقارير وسجلات المنصة (Excel / CSV)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          تصدير جداول البيانات متوافقة 100% مع برامج مايكروسوفت إكسيل وجوجل شيتس مع دعم كامل للغة العربية UTF-8
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Export Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 flex flex-col justify-between hover:border-[#1E4FD8]/40 shadow-xs transition-colors">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#1E4FD8]">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-[#0D1B3E]">سجل بيانات الطلاب الكامل</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              يشمل أسماء الطلاب، أرقام هواتفهم، هواتف أولياء الأمور، المحافظات، رصيد المحفظة، وعدد الكورسات المفعلة.
            </p>
          </div>

          <button
            onClick={exportStudents}
            disabled={downloadingType === 'students'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1E4FD8] hover:bg-blue-700 text-white py-3 text-xs font-black transition-all shadow-xs disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingType === 'students' ? 'جارٍ التصدير...' : 'تصدير شيت الطلاب (CSV)'}</span>
          </button>
        </div>

        {/* Export Exams Results */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 flex flex-col justify-between hover:border-[#1E4FD8]/40 shadow-xs transition-colors">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-[#F5B301]">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-[#0D1B3E]">تقرير نتائج الاختبارات</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              يشمل درجات كل امتحان، النسب المئوية، حالات الاجتياز، وتواريخ التسليم للتحليل الإحصائي والتكريم.
            </p>
          </div>

          <button
            onClick={exportExamsResults}
            disabled={downloadingType === 'exams'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F5B301] hover:bg-[#e0a401] text-[#0D1B3E] py-3 text-xs font-black transition-all shadow-xs disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingType === 'exams' ? 'جارٍ التصدير...' : 'تصدير شيت النتائج (CSV)'}</span>
          </button>
        </div>

        {/* Export Wallet Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 flex flex-col justify-between hover:border-[#1E4FD8]/40 shadow-xs transition-colors">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-[#0D1B3E]">سجل العمليات المالية والمحفظة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              يشمل جميع طلبات شحن المحفظة، عمليات شراء الكورسات والمذكرات، أرقام العمليات، والمبالغ المحصلة.
            </p>
          </div>

          <button
            onClick={exportWalletTransactions}
            disabled={downloadingType === 'wallet'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-black transition-all shadow-xs disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingType === 'wallet' ? 'جارٍ التصدير...' : 'تصدير شيت المالية (CSV)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
