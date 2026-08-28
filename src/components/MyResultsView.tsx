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
import { Student, ExamAttempt } from '../types';

interface MyResultsViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const MyResultsView: React.FC<MyResultsViewProps> = ({ onNavigate }) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

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
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-white">
        <h2 className="text-xl font-bold">يرجى تسجيل الدخول لعرض نتائجك</h2>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">سجل نتائجي وامتحاناتي</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">تابع تطور مستواك الأكاديمي في مادة الفيزياء وراجع إجاباتك السابقة</p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 self-start sm:self-auto"
        >
          العودة للوحة الطالب
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">الاختبارات المنفذة</span>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white">{totalExams}</p>
          <p className="text-[10px] text-slate-400 mt-1">اختبار وكويز</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">متوسط الدرجات</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-400">{averagePercentage}%</p>
          <p className="text-[10px] text-slate-400 mt-1">المعدل التراكمي</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">أعلى نتيجة حققتها</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">{highestPercentage}%</p>
          <p className="text-[10px] text-slate-400 mt-1">أفضل أداء فيزيائي</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">الاختبارات الناجحة</span>
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white">{passedCount} / {totalExams}</p>
          <p className="text-[10px] text-slate-400 mt-1">نسبة النجاح: {totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0}%</p>
        </div>

      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع المحاولات ({attempts.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'passed' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            الناجحة
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              filter === 'failed' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            تحتاج لإعادة
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في أسماء الامتحانات..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pr-10 pl-4 text-xs text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Attempts Table */}
      {attempts.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <Award className="mx-auto h-12 w-12 text-slate-400 opacity-40" />
          <h3 className="text-base font-bold text-white">لم تقم بخوض أي اختبار حتى الآن</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">ادخل إلى الكورسات الخاصة بك، وتجاوز الكويزات الدورية والامتحانات الشاملة لتظهر نتائجك هنا.</p>
          <button
            onClick={() => onNavigate('my-courses')}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 mt-2"
          >
            الانتقال لكورساتي
          </button>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
          لا توجد نتائج تطابق بحثك.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">اسم الامتحان / الكويز</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ الأداء</th>
                  <th className="py-3.5 px-4 font-bold">الدرجة</th>
                  <th className="py-3.5 px-4 font-bold">النسبة المئوية</th>
                  <th className="py-3.5 px-4 font-bold">الحالة</th>
                  <th className="py-3.5 px-4 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="truncate max-w-xs">{attempt.examTitle}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(attempt.submittedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-200">
                      {attempt.score} / {attempt.maxScore}
                    </td>
                    <td className="py-4 px-4 font-black">
                      <span className={attempt.passed ? 'text-emerald-400' : 'text-rose-400'}>
                        {attempt.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        attempt.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {attempt.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{attempt.passed ? 'ناجح' : 'راسب'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onNavigate('exam-result', { attemptId: attempt.id })}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all"
                      >
                        <span>مراجعة النتيجة</span>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
