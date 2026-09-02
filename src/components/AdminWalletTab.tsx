import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Check, 
  X, 
  Smartphone, 
  ExternalLink,
  Eye,
  DollarSign,
  Filter
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { PaymentMethod, WalletTransaction, Student } from '../types';

export const AdminWalletTab: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subTab, setSubTab] = useState<'requests' | 'transactions' | 'methods' | 'manual'>('requests');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  // Selected receipt preview
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Method Modal / Form
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [methodForm, setMethodForm] = useState({
    name: '',
    type: 'vodafone_cash' as any,
    accountNumber: '',
    accountName: '',
    instructions: '',
    isActive: true
  });

  // Manual Credit Modal
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualAmount, setManualAmount] = useState('100');
  const [manualNotes, setManualNotes] = useState('شحن يدوي مباشر من الإدارة');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refresh = () => {
    setMethods(StorageService.getPaymentMethods());
    setTransactions(StorageService.getWalletTransactions());
    setStudents(StorageService.getStudents());
  };

  useEffect(() => {
    refresh();
    return subscribeToStorage(refresh);
  }, []);

  const handleApprove = (txId: string) => {
    const res = StorageService.approveDepositRequest(txId, 'تم التحقق من التحويل والموافقة بنجاح.');
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      refresh();
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleReject = (txId: string) => {
    const reason = prompt('يرجى كتابة سبب رفض طلب الشحن للتوضيح للطالب:', 'تعذر التحقق من الإيصال أو لم يصل التحويل');
    if (reason === null) return;
    const res = StorageService.rejectDepositRequest(txId, reason);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      refresh();
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name || !methodForm.accountNumber) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    const newMethod: PaymentMethod = {
      id: editingMethod ? editingMethod.id : 'pm-' + Date.now(),
      name: methodForm.name,
      type: methodForm.type,
      accountNumber: methodForm.accountNumber,
      accountName: methodForm.accountName,
      instructions: methodForm.instructions,
      isActive: methodForm.isActive,
      order: editingMethod?.order || methods.length + 1
    };

    StorageService.savePaymentMethod(newMethod);
    setIsMethodModalOpen(false);
    setEditingMethod(null);
    refresh();
  };

  const handleDeleteMethod = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف بوابة الدفع هذه؟')) {
      StorageService.deletePaymentMethod(id);
      refresh();
    }
  };

  const handleManualCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === manualStudentId);
    if (!st) {
      setFeedback({ type: 'error', text: 'يرجى اختيار الطالب.' });
      return;
    }
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', text: 'المبلغ غير صالح.' });
      return;
    }

    st.walletBalance = (st.walletBalance || 0) + amt;
    StorageService.saveStudent(st);

    // Record as approved deposit
    const tx = StorageService.createDepositRequest({
      studentId: st.id,
      studentName: st.name,
      studentPhone: st.phone,
      amount: amt,
      methodName: 'شحن مباشر من الإدارة',
      transactionRefNumber: 'ADMIN-MANUAL'
    });
    StorageService.approveDepositRequest(tx.id, manualNotes);

    setFeedback({ type: 'success', text: `تم شحن ${amt} ج.م بنجاح لحساب الطالب ${st.name}.` });
    setManualAmount('100');
    refresh();
    setTimeout(() => setFeedback(null), 4000);
  };

  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentPhone.includes(searchTerm) ||
      (t.transactionRefNumber && t.transactionRefNumber.includes(searchTerm));
    
    if (subTab === 'requests') {
      if (filterStatus === 'all') return matchesSearch && t.type === 'deposit';
      return matchesSearch && t.type === 'deposit' && t.status === filterStatus;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-[#0D1B3E] flex items-center gap-2">
            <Wallet className="h-6 w-6 text-[#1E4FD8]" />
            <span>إدارة المحفظة الإلكترونية وبوابات الدفع</span>
            {pendingDeposits.length > 0 && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700 border border-rose-300 animate-pulse">
                {pendingDeposits.length} طلبات شحن جديدة
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة طلبات شحن الطلاب، إعداد محافظ فودافون كاش وإنستاباي وفوري، ومتابعة سجل العمليات المالية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('requests')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              subTab === 'requests'
                ? 'bg-[#1E4FD8] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-[#0D1B3E] hover:border-[#1E4FD8]'
            }`}
          >
            طلبات الشحن ({pendingDeposits.length})
          </button>
          <button
            onClick={() => setSubTab('transactions')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              subTab === 'transactions'
                ? 'bg-[#1E4FD8] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-[#0D1B3E] hover:border-[#1E4FD8]'
            }`}
          >
            سجل كافة المعاملات
          </button>
          <button
            onClick={() => setSubTab('methods')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              subTab === 'methods'
                ? 'bg-[#1E4FD8] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-[#0D1B3E] hover:border-[#1E4FD8]'
            }`}
          >
            طرق وبوابات الدفع ({methods.length})
          </button>
          <button
            onClick={() => setSubTab('manual')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              subTab === 'manual'
                ? 'bg-[#F5B301] text-[#0D1B3E] shadow-sm'
                : 'bg-white border border-slate-200 text-[#0D1B3E] hover:border-[#1E4FD8]'
            }`}
          >
            + شحن يدوي مباشر
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Subtab: Requests or Transactions */}
      {(subTab === 'requests' || subTab === 'transactions') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم الطالب، الهاتف، أو كود العملية..."
                className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 py-2 text-xs text-[#0D1B3E] placeholder-slate-400 focus:border-[#1E4FD8] focus:outline-none"
              />
            </div>

            {subTab === 'requests' && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Filter className="h-4 w-4 text-slate-400" />
                {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      filterStatus === st
                        ? 'bg-[#1E4FD8] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0D1B3E]'
                    }`}
                  >
                    {st === 'pending' ? 'المعلقة' : st === 'approved' ? 'المقبولة' : st === 'rejected' ? 'المرفوضة' : 'الكل'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-xs">
              لا توجد معاملات مطابقة للبحث حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTransactions.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                const isPending = tx.status === 'pending';
                const isApproved = tx.status === 'approved';
                const isRejected = tx.status === 'rejected';

                return (
                  <div
                    key={tx.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-[#1E4FD8]/40 transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          isDeposit
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-blue-50 border-blue-200 text-[#1E4FD8]'
                        }`}
                      >
                        {isDeposit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-[#0D1B3E]">{tx.studentName}</h4>
                          <span className="text-xs text-slate-500 font-mono">({tx.studentPhone})</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isApproved ? 'مكتمل' : isPending ? 'قيد المراجعة' : 'مرفوض'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {isDeposit ? `شحن عبر: ${tx.methodName}` : `شراء: ${tx.courseTitle || tx.pdfTitle || 'محتوى'}`}
                          {tx.transactionRefNumber && (
                            <span className="text-[#1E4FD8] font-mono mr-2 font-bold">#{tx.transactionRefNumber}</span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <div className="text-right lg:text-left">
                        <span
                          className={`text-base font-black font-mono block ${
                            isDeposit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isDeposit ? `+${tx.amount}` : `-${tx.amount}`} ج.م
                        </span>
                      </div>

                      {tx.receiptImageUrl && (
                        <button
                          onClick={() => setPreviewReceiptUrl(tx.receiptImageUrl!)}
                          className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-bold text-[#1E4FD8] hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="h-4 w-4 text-[#1E4FD8]" />
                          <span>معاينة الإيصال</span>
                        </button>
                      )}

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(tx.id)}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-black shadow-xs transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            <span>موافقة وإضافة الرصيد</span>
                          </button>
                          <button
                            onClick={() => handleReject(tx.id)}
                            className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-3 py-2 text-xs font-bold transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span>رفض</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab: Payment Methods */}
      {subTab === 'methods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0D1B3E]">البوابات والمحافظ المتاحة للطلاب:</h3>
            <button
              onClick={() => {
                setEditingMethod(null);
                setMethodForm({
                  name: '',
                  type: 'vodafone_cash',
                  accountNumber: '',
                  accountName: '',
                  instructions: '',
                  isActive: true
                });
                setIsMethodModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة طريقة دفع جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {methods.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs hover:border-[#1E4FD8]/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#1E4FD8]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {m.isActive ? 'مفعلة وتظهر للطلاب' : 'معطلة'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-[#0D1B3E]">{m.name}</h4>
                    <p className="text-xs text-[#1E4FD8] font-mono font-bold mt-0.5 select-all">{m.accountNumber}</p>
                    {m.accountName && (
                      <p className="text-[11px] text-slate-500 mt-0.5">الاسم: {m.accountName}</p>
                    )}
                  </div>

                  {m.instructions && (
                    <p className="text-[11px] text-slate-600 bg-[#F5F7FA] p-2.5 rounded-xl border border-slate-200 line-clamp-3">
                      {m.instructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setEditingMethod(m);
                      setMethodForm({
                        name: m.name,
                        type: m.type,
                        accountNumber: m.accountNumber,
                        accountName: m.accountName || '',
                        instructions: m.instructions || '',
                        isActive: m.isActive
                      });
                      setIsMethodModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#1E4FD8] hover:bg-blue-100 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteMethod(m.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab: Manual Credit */}
      {subTab === 'manual' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 max-w-xl mx-auto space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-black text-[#0D1B3E] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#1E4FD8]" />
              <span>شحن رصيد يدوي مباشر لطالب</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              استخدم هذه الخاصية لشحن رصيد الطالب فوراً عند الدفع النقدي في السنتر أو الحالات الخاصة.
            </p>
          </div>

          <form onSubmit={handleManualCredit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#0D1B3E] block mb-1.5">اختر الطالب *</label>
              <select
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2.5 text-xs font-bold text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
              >
                <option value="">-- اختر طالباً من القائمة --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone}) - الرصيد الحالي: {s.walletBalance || 0} ج.م
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#0D1B3E] block mb-1.5">المبلغ المراد إضافته (ج.م) *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2.5 text-sm font-bold text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#0D1B3E] block mb-1.5">ملاحظات العملية (اختياري)</label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="مثال: دفع نقدي في السنتر"
                className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2.5 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#F5B301] hover:bg-[#e0a401] py-3 text-xs font-black text-[#0D1B3E] transition-all shadow-xs"
            >
              تأكيد الشحن الفوري
            </button>
          </form>
        </div>
      )}

      {/* Edit/Create Method Modal */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-[#0D1B3E]">
                {editingMethod ? 'تعديل بوابة الدفع' : 'إضافة طريقة دفع جديدة'}
              </h3>
              <button
                onClick={() => setIsMethodModalOpen(false)}
                className="text-slate-400 hover:text-[#0D1B3E] rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0D1B3E] block mb-1">اسم الطريقة *</label>
                <input
                  type="text"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                  placeholder="مثال: فودافون كاش - الحساب الرسمي"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0D1B3E] block mb-1">النوع</label>
                <select
                  value={methodForm.type}
                  onChange={(e) => setMethodForm({ ...methodForm, type: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                >
                  <option value="vodafone_cash">فودافون كاش / أورانج / اتصالات / وي كاش</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="fawry">فوري باي (Fawry Pay)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0D1B3E] block mb-1">رقم المحفظة / الحساب *</label>
                  <input
                    type="text"
                    value={methodForm.accountNumber}
                    onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                    placeholder="01012345678"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0D1B3E] block mb-1">اسم صاحب الحساب</label>
                  <input
                    type="text"
                    value={methodForm.accountName}
                    onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })}
                    placeholder="مستر فيزياء"
                    className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0D1B3E] block mb-1">تعليمات التحويل للطلاب</label>
                <textarea
                  value={methodForm.instructions}
                  onChange={(e) => setMethodForm({ ...methodForm, instructions: e.target.value })}
                  rows={3}
                  placeholder="اكتب الخطوات التي يجب على الطالب اتباعها عند التحويل..."
                  className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2 text-xs text-[#0D1B3E] focus:bg-white focus:border-[#1E4FD8] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={methodForm.isActive}
                  onChange={(e) => setMethodForm({ ...methodForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-[#1E4FD8]"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-[#0D1B3E] font-bold cursor-pointer">
                  تفعيل الطريقة وإظهارها للطلاب في تطبيق المحفظة
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#0D1B3E]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#F5B301] hover:bg-[#e0a401] px-5 py-2 text-xs font-black text-[#0D1B3E]"
                >
                  حفظ بوابة الدفع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-2xl w-full rounded-3xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#0D1B3E]">إيصال التحويل المرفق من الطالب</h4>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:text-[#0D1B3E]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl border border-slate-200 bg-[#F5F7FA] flex items-center justify-center p-2">
              <img
                src={previewReceiptUrl}
                alt="Receipt Full Preview"
                className="max-h-[70vh] object-contain rounded-xl shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
