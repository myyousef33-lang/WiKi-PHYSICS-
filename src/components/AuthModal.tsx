import React, { useState } from 'react';
import { User, Phone, Sparkles, X, UserPlus, LogIn, GraduationCap, MapPin } from 'lucide-react';
import { StorageService } from '../services/storage';
import { GradeLevel, Student } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login Form
  const [phone, setPhone] = useState('');
  
  // Register Form
  const [name, setName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.GRADE_12);
  const [governorate, setGovernorate] = useState('القاهرة');

  // Error & Status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف المسجل');
      return;
    }

    const found = StorageService.loginStudentByPhone(phone.trim());
    if (found) {
      setSuccess(`أهلاً بك يا ${found.name}! تم تسجيل الدخول بنجاح`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setError('رقم الهاتف غير مسجل لدينا. يمكنك الضغط على "إنشاء حساب جديد" بالأسفل والتسجيل فوراً.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regPhone.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة (الاسم ورقم الهاتف)');
      return;
    }

    const res = StorageService.registerStudent({
      name: name.trim(),
      phone: regPhone.trim(),
      parentPhone: parentPhone.trim() || '01000000000',
      grade,
      governorate
    });

    if (res.success && res.student) {
      setSuccess(`تم إنشاء حسابك بنجاح يا ${res.student.name}! مرحباً بك في منصة ويكيفزياء`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 800);
    } else {
      setError(res.error || 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة برقم هاتف آخر');
    }
  };

  const handleQuickDemoSwitch = (studentId: string) => {
    const s = StorageService.getStudentById(studentId);
    if (s) {
      StorageService.setCurrentStudent(s);
      setSuccess(`تم الدخول بحساب: ${s.name}`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    }
  };

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'المنوفية', 'القليوبية', 
    'البحيرة', 'الغربية', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'الإسماعيلية', 'السويس', 'بورسعيد', 'دمياط'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-1 pt-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2 shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">بوابة طلاب ويكيفزياء</h2>
          <p className="text-xs text-slate-400">سجل دخولك لمتابعة دروسك وامتحاناتك التفاعلية</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === 'login' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === 'register' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>إنشاء حساب جديد</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300 leading-relaxed">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 leading-relaxed">
            {success}
          </div>
        )}

        {/* Mode: Student Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">رقم الهاتف المحمول</label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-3 pr-4 pl-10 text-white placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500">أدخل رقم الهاتف الذي سجلت به في المنصة</p>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              دخول إلى حسابي
            </button>

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
              <span className="text-[11px] text-slate-400 font-medium">⚡ حسابات تجريبية للاختبار السريع:</span>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSwitch('student-demo')}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-amber-400 hover:border-amber-500/40 hover:bg-slate-900 transition-all"
                >
                  أحمد محمود (3 ثانوي)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Mode: Student Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">اسم الطالب ثلاثي / رباعي <span className="text-amber-400">*</span></label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمد مصطفى"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">هاتف الطالب <span className="text-amber-400">*</span></label>
                <input
                  type="tel"
                  dir="ltr"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">هاتف ولي الأمر</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="011XXXXXXXX"
                  className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">الصف الدراسي <span className="text-amber-400">*</span></label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value={GradeLevel.GRADE_12}>الصف الثالث الثانوي (3 ث)</option>
                  <option value={GradeLevel.GRADE_11}>الصف الثاني الثانوي (2 ث)</option>
                  <option value={GradeLevel.GRADE_10}>الصف الأول الثانوي (1 ث)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">المحافظة <span className="text-amber-400">*</span></label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {governorates.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] mt-2"
            >
              إنشاء الحساب وبدء التعلم
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

