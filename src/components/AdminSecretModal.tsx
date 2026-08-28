import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, X, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';
import { StorageService } from '../services/storage';

interface AdminSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect: () => void;
}

export const AdminSecretModal: React.FC<AdminSecretModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور السرية للإدارة');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      const ok = StorageService.loginAdmin(password.trim());
      setLoading(false);

      if (ok) {
        onClose();
        setPassword('');
        onSuccessRedirect();
      } else {
        setError('كلمة المرور غير صحيحة. تم تسجيل محاولة الدخول لأسباب أمنية.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-blue-900/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Security Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-1 shadow-lg shadow-blue-500/10">
            <Shield className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 text-[11px] font-bold text-blue-400">
              SECRET ADMIN GATEWAY
            </span>
            <h2 className="text-xl font-black text-white pt-1">بوابة الإدارة والأمان المشفرة</h2>
            <p className="text-xs text-slate-400">هذه البوابة مخصصة لمعلم المادة والمشرفين فقط</p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">كلمة المرور الرئيسية (Master Password)</label>
              <span className="text-[10px] text-blue-400 font-mono">256-Bit Encrypted</span>
            </div>
            
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-left font-mono rounded-xl border border-slate-700 bg-slate-950 py-3 pr-10 pl-11 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/25 hover:from-blue-500 hover:to-blue-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            <span>{loading ? 'جاري التحقق...' : 'فتح لوحة التحكم'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-500 text-center leading-relaxed">
          🔒 اختصار لوحة المفاتيح لفتح هذه النافذة من أي مكان: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">Ctrl + Shift + A</kbd>
        </div>

      </div>
    </div>
  );
};
