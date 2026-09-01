import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  Search, 
  ChevronLeft, 
  RotateCcw,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student, ExamAttempt, EarnedCertificate } from '../types';
import { CertificateModal } from './CertificateModal';

interface MyResultsViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const MyResultsView: React.FC<MyResultsViewProps> = ({ onNavigate }) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [selectedCert, setSelectedCert] = useState<EarnedCertificate | null>(null);

  useEffect(() => {
    const update = () => {
      const current = StorageService.getCurrentStudent();
      setStudent(current);
      if (current) {
        setAttempts(StorageService.getStudentAttempts(current.id));
      }
    };
    update();
    return subscribeToStorage(update);
  }, []);

  if (!student) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-[#0D1B3E]">
        <h2 className="text-xl font-bold">يرجى تسجيل الدخول لعرض نتائجك</h2>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E]"
        >
          تسجيل الدخول
        </button>
      </div>
    );
  }

  // Analytics calculation
  const totalExams = attempts.length;
  const passedCount = attempts.filter(a => a.passed).length;
  const highestPercentage = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0;
  const averagePercentage = attempts.length > 0 
    ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length)
    : 0;

  const filteredAttempts = attempts.filter(a => {
    if (filter === 'passed' && !a.passed) return false;
    if (filter === 'failed' && a.passed) return false;
    if (searchQuery.trim() && !a.examTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E]">سجل نتائجي وامتحاناتي</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">تابع تطور مستواك الأكاديمي في مادة الفيزياء وراجع إجاباتك السابقة</p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-50 self-start sm:self-auto shadow-xs"
        >
          العودة للوحة الطالب
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold">الاختبارات المنفذة</span>
            <BarChart3 className="h-4 w-4 text-[#1E4FD8]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-[#0D1B3E]">{totalExams}</p>
          <p className="text-[10px] text-[#6B7280] mt-1">اختبار وكويز</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold">متوسط الدرجات</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-600">{averagePercentage}%</p>
          <p className="text-[10px] text-[#6B7280] mt-1">المعدل التراكمي</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold">أعلى نتيجة حققتها</span>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">{highestPercentage}%</p>
          <p className="text-[10px] text-[#6B7280] mt-1">أفضل أداء فيزيائي</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold">الاختبارات الناجحة</span>
            <CheckCircle2 className="h-4 w-4 text-[#1E4FD8]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-[#0D1B3E]">{passedCount} / {totalExams}</p>
          <p className="text-[10px] text-[#6B7280] mt-1">نسبة النجاح: {totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0}%</p>
        </div>

      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 w-full sm:w-auto shadow-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-[#F5B301] text-[#0D1B3E]' : 'text-[#6B7280] hover:text-[#0D1B3E]'
            }`}
          >
            جميع المحاولات ({attempts.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'passed' ? 'bg-emerald-500 text-white' : 'text-[#6B7280] hover:text-[#0D1B3E]'
            }`}
          >
            الناجحة
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'failed' ? 'bg-rose-500 text-white' : 'text-[#6B7280] hover:text-[#0D1B3E]'
            }`}
          >
            تحتاج لإعادة
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في أسماء الامتحانات..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-10 pl-4 text-xs text-[#0D1B3E] placeholder:text-[#9CA3AF] focus:border-[#1E4FD8] focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Attempts Table */}
      {attempts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Award className="mx-auto h-12 w-12 text-[#9CA3AF]" />
          <h3 className="text-base font-bold text-[#0D1B3E]">لم تقم بخوض أي اختبار حتى الآن</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">ادخل إلى الكورسات الخاصة بك، وتجاوز الكويزات الدورية والامتحانات الشاملة لتظهر نتائجك هنا.</p>
          <button
            onClick={() => onNavigate('my-courses')}
            className="rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-bold text-[#0D1B3E] mt-2 shadow-xs"
          >
            الانتقال لكورساتي
          </button>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-[#6B7280] shadow-xs">
          لا توجد نتائج تطابق بحثك.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[#6B7280]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">اسم الامتحان / الكويز</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ الأداء</th>
                  <th className="py-3.5 px-4 font-bold">الدرجة</th>
                  <th className="py-3.5 px-4 font-bold">النسبة المئوية</th>
                  <th className="py-3.5 px-4 font-bold">الحالة</th>
                  <th className="py-3.5 px-4 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#0D1B3E]">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="truncate max-w-xs">{attempt.examTitle}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(attempt.submittedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-[#0D1B3E]">
                      {attempt.score} / {attempt.maxScore}
                    </td>
                    <td className="py-4 px-4 font-black">
                      <span className={attempt.passed ? 'text-emerald-600' : 'text-rose-600'}>
                        {attempt.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        attempt.passed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {attempt.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{attempt.passed ? 'ناجح' : 'راسب'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {attempt.percentage >= 85 && (
                          <button
                            onClick={() => setSelectedCert({
                              id: `cert-${attempt.id}`,
                              examOrUnitName: attempt.examTitle,
                              score: attempt.score,
                              maxScore: attempt.maxScore,
                              percentage: attempt.percentage,
                              date: attempt.submittedAt
                            })}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#F5B301] border border-amber-400 px-2.5 py-1.5 text-xs font-bold text-[#0D1B3E] shadow hover:bg-[#e0a401] transition-all"
                            title="تحميل شهادة التميز والتفوق"
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>الشهادة</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('exam-result', { attemptId: attempt.id })}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#1E4FD8] hover:bg-[#1E4FD8] hover:text-white transition-all"
                        >
                          <span>مراجعة النتيجة</span>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {student && selectedCert && (
        <CertificateModal
          student={student}
          certificate={selectedCert}
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

    </div>
  );
};
