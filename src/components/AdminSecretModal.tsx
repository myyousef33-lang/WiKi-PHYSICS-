import React, { useState } from 'react';
import { motion } from 'motion/react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور السرية للإدارة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await StorageService.loginAdmin(password.trim());
      setLoading(false);

      if (res.success) {
        onClose();
        setPassword('');
        onSuccessRedirect();
      } else {
        setError(res.error || 'كلمة المرور غير صحيحة. تم تسجيل محاولة الدخول لأسباب أمنية.');
      }
    } catch {
      setLoading(false);
      setError('حدث خطأ أثناء محاولة تسجيل الدخول.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 rounded-xl border border-slate-200 bg-[#F5F7FA] p-2 text-[#6B7280] hover:text-[#0D1B3E] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Security Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#1E4FD8] mb-1 shadow-xs">
            <Shield className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-[11px] font-bold text-[#1E4FD8]">
              SECRET ADMIN GATEWAY
            </span>
            <h2 className="text-xl font-black text-[#0D1B3E] pt-1">بوابة الإدارة والأمان المشفرة</h2>
            <p className="text-xs text-[#6B7280]">هذه البوابة مخصصة لمعلم المادة والمشرفين فقط</p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0D1B3E]">كلمة المرور الرئيسية (Master Password)</label>
              <span className="text-[10px] text-[#1E4FD8] font-mono font-bold">256-Bit Encrypted</span>
            </div>
            
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-left font-mono rounded-xl border border-slate-200 bg-[#F5F7FA] py-3 pr-10 pl-11 text-[#0D1B3E] placeholder:text-slate-400 focus:border-[#1E4FD8] focus:bg-white focus:outline-none transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0D1B3E] p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F5B301] py-3 text-sm font-black text-[#0D1B3E] shadow-sm hover:bg-[#e0a401] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Lock className="h-4 w-4 text-[#0D1B3E]" />
            <span>{loading ? 'جاري التحقق...' : 'فتح لوحة التحكم'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-3 text-[11px] text-[#6B7280] text-center leading-relaxed">
          اختصار لوحة المفاتيح لفتح هذه النافذة من أي مكان: <kbd className="px-1.5 py-0.5 rounded bg-white text-[#0D1B3E] font-mono text-[10px] border border-slate-200">Ctrl + Shift + A</kbd>
        </div>

      </motion.div>
    </motion.div>
  );
};
