import React, { useState } from 'react';
import { X, User, Phone, Lock, Camera, Check, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { StorageService, verifyPassword, hashPassword } from '../services/storage';
import { PRESET_AVATARS, getPresetAvatar } from '../utils/avatars';

interface EditProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedStudent: Student) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const [name, setName] = useState(student.name || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
  const [avatarUrl, setAvatarUrl] = useState(student.avatarUrl || '');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  if (!isOpen) return null;

  // Validate Egyptian phone number format
  const validatePhone = (p: string) => {
    const clean = p.trim().replace(/\s+/g, '');
    return /^01[0125][0-9]{8}$/.test(clean);
  };

  // Image Resize & Crop using HTML5 Canvas
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 15 * 1024 * 1024) {
        reject('حجم الصورة يجب ألا يتجاوز 15 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const SIZE = 350;
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('فشل في معالجة الصورة');
            return;
          }

          // Center crop calculation
          let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
          if (img.width > img.height) {
            srcW = img.height;
            srcX = (img.width - img.height) / 2;
          } else {
            srcH = img.width;
            srcY = (img.height - img.width) / 2;
          }

          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, SIZE, SIZE);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
          resolve(dataUrl);
        };
        img.onerror = () => reject('الصورة غير صالحة');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('فشل في قراءة الملف');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploadProgress(true);
      
      // Process client-side resize first
      const resizedBase64 = await processImageFile(file);
      setAvatarUrl(resizedBase64);

      // Try uploading to server endpoint for safe persistence if online
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/student/upload-avatar', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          setAvatarUrl(data.url);
        }
      } catch (uploadErr) {
        console.warn('Fallback to resized base64 dataUrl:', uploadErr);
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'فشل رفع الصورة');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Security Check: Only logged in student can edit their own profile
    const currentStudent = StorageService.getCurrentStudent();
    if (!currentStudent || currentStudent.id !== student.id) {
      setError('غير مسموح لك بتعديل بيانات حساب آخر');
      return;
    }

    // Input Validation
    if (!name.trim()) {
      setError('يرجى إدخال الاسم كاملاً');
      return;
    }

    if (!validatePhone(phone)) {
      setError('رقم الهاتف غير صحيح. يجب أن يتكون من 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015');
      return;
    }

    if (!validatePhone(parentPhone)) {
      setError('رقم هاتف ولي الأمر غير صحيح. يجب أن يتكون من 11 رقم');
      return;
    }

    if (phone.trim() === parentPhone.trim()) {
      setError('رقم الطالب ورقم ولي الأمر يجب أن يكونا مختلفين');
      return;
    }

    // Handle Password Change if requested
    let updatedPasswordHash = student.password;
    if (isChangingPassword) {
      if (!currentPassword) {
        setError('يرجى إدخال كلمة المرور الحالية أولاً للتحقق من هويتك');
        return;
      }

      const isValidOld = await verifyPassword(currentPassword, student.password);
      if (!isValidOld) {
        setError('كلمة المرور الحالية غير صحيحة، لا يمكن تغيير الباسورد');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        setError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف/أرقام');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
        return;
      }

      updatedPasswordHash = await hashPassword(newPassword);
    }

    try {
      setLoading(true);

      const updates: Partial<Student> = {
        name: name.trim(),
        phone: phone.trim(),
        parentPhone: parentPhone.trim(),
        avatarUrl,
        password: updatedPasswordHash,
        lastActiveAt: new Date().toISOString()
      };

      // Optimistic & Durable Firestore Update
      StorageService.updateStudent(student.id, updates);

      const updatedObj: Student = {
        ...student,
        ...updates
      };

      StorageService.setCurrentStudent(updatedObj);
      setSuccessMsg('تم حفظ وتحديث بياناتك الشخصية بنجاح! ✨');

      if (onProfileUpdated) {
        onProfileUpdated(updatedObj);
      }

      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const activePreset = getPresetAvatar(avatarUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-orange-500/30 bg-slate-900 p-6 shadow-2xl shadow-orange-500/10 text-right font-sans overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">تعديل الملف الشخصي</h3>
              <p className="text-xs text-slate-400">حدث بياناتك وصورتك الشخصية بكل سهولة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-400 font-bold">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 font-bold">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">

          {/* Avatar Section */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <label className="text-xs font-bold text-slate-300 block">الصورة الشخصية أو الأفاتار:</label>
            <div className="flex items-center gap-4">
              
              {/* Current Avatar Display */}
              <div className="relative group shrink-0">
                <div className={`h-20 w-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-slate-800 ${activePreset ? activePreset.borderColor : 'border-orange-500/50'}`}>
                  {avatarUrl && !avatarUrl.startsWith('preset:') ? (
                    <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : activePreset ? (
                    <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${activePreset.bgGradient} text-orange-400 font-black text-2xl`}>
                      {activePreset.name.split(' ')[1] || '⚛️'}
                    </div>
                  ) : (
                    <User className="h-10 w-10 text-orange-400" />
                  )}
                </div>

                {/* Upload overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload & Preset Options */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-xl bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500 hover:text-white transition-all inline-flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    <span>{uploadProgress ? 'جاري المعالجة...' : 'رفع صورة شخصية'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[11px] font-bold text-slate-400 hover:text-red-400"
                    >
                      إزالة
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400">
                  حد أقصى 15 ميجابايت (يتم الضغط والقص الذكي تلقائياً). أو اختر أفاتار جاهز:
                </p>

                {/* Preset Avatars Bar */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.id)}
                      className={`h-8 w-8 rounded-xl border flex items-center justify-center text-sm transition-all ${
                        avatarUrl === preset.id
                          ? 'border-orange-500 bg-orange-500/20 scale-110 shadow-md shadow-orange-500/20'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                      title={preset.name}
                    >
                      {preset.name.split(' ')[1] || '⚛️'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">الاسم بالكامل:</label>
            <div className="relative">
              <User className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك كاملاً"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Phones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">رقم هاتف الطالب:</label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none text-right font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">رقم هاتف ولي الأمر:</label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none text-right font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-orange-400" />
                تغيير كلمة المرور
              </span>
              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="text-xs font-bold text-orange-400 hover:underline"
              >
                {isChangingPassword ? 'إلغاء التغيير' : 'تغيير الباسورد؟'}
              </button>
            </div>

            {isChangingPassword && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">كلمة المرور الحالية (مطلوبة للتحقق):</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block">كلمة المرور الجديدة:</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 أحرف/أرقام على الأقل"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block">تأكيد كلمة المرور:</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال الباسورد"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✨'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
