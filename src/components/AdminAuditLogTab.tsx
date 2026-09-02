import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { AdminAuditLogEntry } from '../types';

export const AdminAuditLogTab: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const refresh = () => {
    setLogs(StorageService.getAuditLogs());
  };

  useEffect(() => {
    refresh();
    return subscribeToStorage(refresh);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.adminIdentifier && log.adminIdentifier.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'auth':
        return <span className="bg-blue-50 text-[#1E4FD8] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">الأمان والدخول</span>;
      case 'courses':
        return <span className="bg-blue-50 text-[#1E4FD8] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">الكورسات</span>;
      case 'exams':
        return <span className="bg-amber-50 text-[#F5B301] border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">الامتحانات</span>;
      case 'students':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">الطلاب</span>;
      case 'wallet':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">المحفظة والمالية</span>;
      case 'codes':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">الأكواد</span>;
      case 'settings':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">الإعدادات</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{category}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-[#0D1B3E] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#1E4FD8]" />
            <span>سجل نشاط وعمليات الإدارة (Audit Logs)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل أمني شامل لجميع عمليات إضافة وحذف وتعديل المحتوى، وتأكيد طلبات الشحن وتوليد الأكواد
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">إجمالي السجلات:</span>
          <span className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-mono font-bold text-[#1E4FD8]">
            {logs.length} عملية
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في تفاصيل الإجراء أو اسم المستهدف..."
            className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 py-2 text-xs text-[#0D1B3E] placeholder-slate-400 focus:border-[#1E4FD8] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          {[
            { id: 'all', label: 'الكل' },
            { id: 'wallet', label: 'المحفظة' },
            { id: 'students', label: 'الطلاب' },
            { id: 'courses', label: 'الكورسات' },
            { id: 'exams', label: 'الامتحانات' },
            { id: 'codes', label: 'الأكواد' },
            { id: 'auth', label: 'الأمان' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-[#1E4FD8] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0D1B3E]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-xs">
          لا توجد سجلات تطابق البحث أو الفلتر المحدد.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-xs">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F5F7FA] transition-colors">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-[#0D1B3E]">{log.action}</span>
                  {getCategoryBadge(log.category)}
                  {log.adminIdentifier && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      بواسطة: {log.adminIdentifier}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{log.description}</p>
                {log.targetName && (
                  <p className="text-[11px] text-[#1E4FD8] font-medium">
                    الطرف المتأثر: <strong>{log.targetName}</strong>
                  </p>
                )}
              </div>

              <div className="text-left shrink-0">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(log.timestamp).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
