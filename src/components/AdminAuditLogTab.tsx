import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  Settings, 
  BookOpen, 
  Key, 
  Wallet, 
  Layers,
  Sparkles
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
        return <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">الأمان والدخول</span>;
      case 'courses':
        return <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">الكورسات</span>;
      case 'exams':
        return <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">الامتحانات</span>;
      case 'students':
        return <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">الطلاب</span>;
      case 'wallet':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">المحفظة والمالية</span>;
      case 'codes':
        return <span className="bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">الأكواد</span>;
      case 'settings':
        return <span className="bg-slate-700/50 text-slate-300 border border-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">الإعدادات</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{category}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <span>سجل نشاط وعمليات الإدارة (Audit Logs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل أمني شامل لجميع عمليات إضافة وحذف وتعديل المحتوى، وتأكيد طلبات الشحن وتوليد الأكواد
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">إجمالي السجلات:</span>
          <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-mono font-bold text-amber-400">
            {logs.length} عملية
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في تفاصيل الإجراء أو اسم المستهدف..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          <Filter className="h-4 w-4 text-slate-500" />
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
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
          لا توجد سجلات تطابق البحث أو الفلتر المحدد.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden divide-y divide-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-900/90 transition-colors">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-white">{log.action}</span>
                  {getCategoryBadge(log.category)}
                  {log.adminIdentifier && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      بواسطة: {log.adminIdentifier}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{log.description}</p>
                {log.targetName && (
                  <p className="text-[11px] text-amber-400/90">
                    الطرف المتأثر: <strong>{log.targetName}</strong>
                  </p>
                )}
              </div>

              <div className="text-left shrink-0">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
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
