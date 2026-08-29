import React, { useState } from 'react';
import { Key, CheckCircle2, AlertCircle, X, Sparkles, Phone, User, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storage';
import { GradeLevel, Student } from '../types';

interface ActivationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect?: (targetType: string, targetId?: string) => void;
}

export const ActivationCodeModal: React.FC<ActivationCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect
}) => {
  const [code, setCode] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const student = StorageService.getCurrentStudent();
  const settings = StorageService.getSettings();

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('يرجى كتابة كود التفعيل أولاً');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    let activeStudent = student;

    // If not logged in, auto-register or restore account using phone/name or defaults
    if (!activeStudent) {
      const cleanPhone = (guestPhone.trim() || '010' + Math.floor(10000000 + Math.random() * 90000000)).replace(/[^0-9]/g, '');
      const cleanName = guestName.trim() || 'طالب فيزياء جديد';

      // Check if student exists with this phone
      const existing = StorageService.getStudents().find(s => s.phone === cleanPhone);
      if (existing) {
        activeStudent = existing;
        StorageService.setCurrentStudent(existing);
      } else {
        const regRes = StorageService.registerStudent({
          name: cleanName,
          phone: cleanPhone,
          parentPhone: '01000000000',
          password: '123',
          grade: GradeLevel.GRADE_12,
          governorate: 'القاهرة'
        });
        if (regRes.success && regRes.student) {
          activeStudent = regRes.student;
        } else {
          // Fallback to existing student or direct storage save
          const newStd: Student = {
            id: 'std-' + Date.now(),
            name: cleanName,
            phone: cleanPhone,
            parentPhone: '01000000000',
            password: '123',
            grade: GradeLevel.GRADE_12,
            governorate: 'القاهرة',
            registeredAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isBlocked: false,
            registeredDevices: ['dev-' + Date.now()],
            maxDevicesAllowed: 2,
            enrolledCourseIds: [],
            unlockedPdfIds: [],
            courseExpiryDates: {}
          };
          StorageService.saveStudent(newStd);
          StorageService.setCurrentStudent(newStd);
          activeStudent = newStd;
        }
      }
    }

    try {
      const res = await StorageService.redeemCodeAsync(code.trim(), activeStudent ? activeStudent.id : '');
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) {}

        setTimeout(() => {
          onClose();
          if (onSuccessRedirect && res.targetType) {
            onSuccessRedirect(res.targetType, res.targetId);
          }
        }, 1800);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError('حدث خطأ أثناء الاتصال بقاعدة البيانات للتحقق من الكود، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25">
            <Key className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-black text-white">تفعيل كود الاشتراك</h3>
          <p className="text-xs text-slate-400">
            أدخل كود الكورس أو المذكرة لتفعيله فوراً على حسابك
          </p>

          {/* Student Status Indicator */}
          {student ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400 mt-1">
              <User className="h-3 w-3" />
              <span>الحساب الحالي: {student.name} ({student.phone})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-400 mt-1">
              <Sparkles className="h-3 w-3" />
              <span>تفعيل فوري وسريع لجميع الطلاب</span>
            </div>
          )}
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-black text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRedeem} className="space-y-4">
          
          {/* If student is not logged in, ask for quick name & phone for linking */}
          {!student && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">اسمك ثلاثي</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="مثال: يوسف أحمد"
                  className="w-full text-xs font-medium rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">رقم الهاتف (واتساب)</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full text-xs font-mono font-medium rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">رمز التفعيل (Activation Code)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="مثال: PHY3-XXXX-YYYY"
              className="w-full text-center tracking-widest uppercase font-mono text-base font-black rounded-xl border border-slate-700 bg-slate-950 py-3 px-4 text-amber-400 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {isLoading ? 'جاري التحقق من الكود وتفعيله...' : 'تفعيل الكود الآن'}
          </button>
        </form>

        {/* Sample Codes for quick testing */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5 text-[11px] text-slate-400">
          <span className="font-bold text-amber-400">⚡ أكواد جاهزة للتجربة السريعة:</span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button 
              type="button"
              onClick={() => setCode('PHY3-FULL-2025')}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-200 font-mono text-[10px]"
            >
              PHY3-FULL-2025 (كورس 3 ثانوي)
            </button>
            <button 
              type="button"
              onClick={() => setCode('PHY2-TERM1-GO')}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-200 font-mono text-[10px]"
            >
              PHY2-TERM1-GO (كورس 2 ثانوي)
            </button>
            <button 
              type="button"
              onClick={() => setCode('PDF-VIP-ELITE')}
              className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-200 font-mono text-[10px]"
            >
              PDF-VIP-ELITE (مذكرة أسئلة)
            </button>
          </div>
        </div>

        {/* WhatsApp Support link to purchase codes */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <a
            href={`https://wa.me/${settings.whatsappNumber}?text=أرغب%20في%20شراء%20كود%20تفعيل%20كورس%20الفيزياء`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            <span>للحصول على كود جديد، تواصل عبر الواتساب</span>
          </a>
        </div>

      </div>
    </div>
  );
};
