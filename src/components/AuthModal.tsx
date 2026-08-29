import React, { useState } from 'react';
import { User, Phone, Sparkles, X, UserPlus, LogIn, GraduationCap, MapPin, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Form
  const [name, setName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.GRADE_12);
  const [governorate, setGovernorate] = useState('القاهرة');

  // Error & Status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف المحمول');
      return;
    }
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور (الباسورد)');
      return;
    }

    const res = StorageService.loginStudent(phone.trim(), password.trim());
    if (res.success && res.student) {
      setSuccess(`أهلاً بك مجدداً يا ${res.student.name}! 👋 تم تسجيل الدخول بنجاح`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setError(res.error || 'رقم الهاتف أو كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regPhone.trim()) {
      setError('يرجى كتابة اسم الطالب ورقم الهاتف المحمول');
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setError('يرجى كتابة كلمة مرور تتكون من 4 أرقام أو أحرف على الأقل لحماية حسابك');
      return;
    }

    const res = StorageService.registerStudent({
      name: name.trim(),
      phone: regPhone.trim(),
      parentPhone: parentPhone.trim() || '01000000000',
      password: regPassword.trim(),
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
    } else {
      // If demo student doesn't exist, create one
      const res = StorageService.registerStudent({
        name: 'أحمد محمود (طالب تجريبي)',
        phone: '01012345678',
        parentPhone: '01112345678',
        password: '123',
        grade: GradeLevel.GRADE_12,
        governorate: 'القاهرة'
      });
      if (res.student) {
        StorageService.setCurrentStudent(res.student);
        setSuccess(`تم الدخول بالحساب التجريبي بنجاح`);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 500);
      }
    }
  };

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'المنوفية', 'القليوبية', 
    'البحيرة', 'الغربية', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'الإسماعيلية', 'السويس', 'بورسعيد', 'دمياط'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-400 hover:text-white transition-colors"
          title="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-1 pt-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2 shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">بوابة طلاب ويكيفزياء</h2>
          <p className="text-xs text-slate-400">سجل الدخول برقم هاتفك وكلمة المرور لمتابعة دروسك</p>
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
            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>رقم الهاتف المحمول</span>
                <span className="text-[11px] text-amber-400/80 font-normal">المسجل بالمنصة</span>
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-3 pr-10 pl-4 text-white placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all text-sm"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>كلمة المرور (الباسورد)</span>
                <span className="text-[11px] text-slate-500 font-normal">لحماية حسابك</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-3 pr-10 pl-10 text-white placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
                  title={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] mt-2"
            >
              دخول إلى حسابي
            </button>

            {/* Quick Demo Switcher */}
            <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
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
            {/* Student Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">اسم الطالب ثلاثي / رباعي <span className="text-amber-400">*</span></label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
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

            {/* Student Phone & Parent Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">هاتف الطالب <span className="text-amber-400">*</span></label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-2.5 pr-8 pl-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
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

            {/* Password Creation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>كلمة المرور للحساب <span className="text-amber-400">*</span></span>
                <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 inline" /> أمان الحساب
                </span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="أنشئ كلمة مرور (4 خانات أو أكثر)"
                  className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-2.5 pr-10 pl-10 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
                  title={showRegPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Grade & Governorate in Grid */}
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


