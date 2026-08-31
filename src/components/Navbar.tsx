import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  User, 
  Key, 
  Bell, 
  Shield, 
  Menu, 
  X, 
  LogOut, 
  Award, 
  FileText, 
  GraduationCap,
  PlayCircle,
  Trophy,
  Bot,
  Brain,
  Sparkles,
  Layers,
  Edit3,
  Wallet
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student } from '../types';
import { Logo } from './Logo';
import { getPresetAvatar } from '../utils/avatars';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAdminAuthModal?: () => void;
  onOpenNotificationModal: () => void;
  onOpenEditProfileModal?: () => void;
  onOpenWalletModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenActivationModal,
  onOpenAuthModal,
  onOpenNotificationModal,
  onOpenEditProfileModal,
  onOpenWalletModal
}) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [isAdmin, setIsAdmin] = useState<boolean>(StorageService.isAdminLoggedIn());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const currentStudent = StorageService.getCurrentStudent();
      setStudent(currentStudent);
      setIsAdmin(StorageService.isAdminLoggedIn());

      const notifs = StorageService.getNotificationsForStudent(currentStudent?.id, currentStudent?.grade);
      if (currentStudent) {
        const unread = notifs.filter(n => !n.readBy?.includes(currentStudent.id)).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(notifs.length);
      }
    };
    update();
    return subscribeToStorage(update);
  }, []);

  const handleLogout = () => {
    StorageService.setCurrentStudent(null);
    onNavigate('home');
  };

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: BookOpen },
    { id: 'dashboard', label: 'لوحة دراستي', icon: GraduationCap, authRequired: true },
    { id: 'my-courses', label: 'كورساتي', icon: PlayCircle, authRequired: true },
    { id: 'physics-lab', label: 'المعمل التفاعلي', icon: Sparkles },
    { id: 'flashcards', label: 'بطاقات المراجعة', icon: Layers },
    { id: 'courses-catalog', label: 'المناهج والكورسات', icon: BookOpen },
    { id: 'leaderboard', label: 'لوحة الشرف', icon: Trophy },
    { id: 'ai-assistant', label: 'المساعد الذكي', icon: Bot },
    { id: 'weakness-profile', label: 'تشخيص ضعفي', icon: Brain, authRequired: true },
    { id: 'pdf-library', label: 'المذكرات', icon: FileText },
    { id: 'my-results', label: 'نتائجي', icon: Award, authRequired: true }
  ];

  const presetAvatar = getPresetAvatar(student?.avatarUrl);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E375E] bg-[#0C1B33]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('home')} 
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            if (item.authRequired && !student) return null;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2E86FF]/15 text-[#2E86FF] font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#132747] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#2E86FF]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions (Code Activation, Notifications, Auth, Admin if logged in) */}
        <div className="flex items-center gap-2.5">
          
          {/* Student Wallet Button (If Logged In) */}
          {student && onOpenWalletModal && (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 rounded-xl border border-[#FFB020]/40 bg-[#FFB020]/10 px-3 py-2 text-xs font-bold text-[#FFB020] hover:bg-[#FFB020]/20 hover:border-[#FFB020]/60 transition-all shadow-sm"
              title="رصيد المحفظة وشحن الحساب"
            >
              <Wallet className="h-4 w-4 shrink-0 text-[#FFB020]" />
              <span className="font-mono font-black">{student.walletBalance || 0}</span>
              <span className="text-[10px]">ج.م</span>
            </button>
          )}

          {/* Activation Key Button */}
          <button
            onClick={onOpenActivationModal}
            className="hidden items-center gap-2 rounded-xl bg-[#FFB020] px-3.5 py-2 text-xs font-bold text-[#0C1B33] shadow-md shadow-[#FFB020]/20 transition-transform hover:scale-105 active:scale-95 hover:bg-[#e59e1c] sm:flex"
          >
            <Key className="h-4 w-4" />
            <span>تفعيل كود</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotificationModal}
            className="relative rounded-xl border border-[#1E375E] bg-[#122442] p-2.5 text-slate-300 transition-colors hover:border-[#2E86FF]/40 hover:text-white"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin Panel Button (ONLY shown if admin is ALREADY logged in) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 rounded-xl border border-[#2E86FF]/40 bg-[#2E86FF]/15 px-3 py-2 text-xs font-bold text-[#2E86FF] hover:bg-[#2E86FF]/25 transition-colors"
            >
              <Shield className="h-4 w-4 text-[#2E86FF]" />
              <span>لوحة الإدارة</span>
            </button>
          )}

          {/* Student Profile / Login */}
          {student ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 rounded-xl border border-[#1E375E] bg-[#122442] px-3 py-1.5 text-right transition-colors hover:border-[#2E86FF]/40"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E86FF]/20 text-xs font-black text-[#2E86FF] overflow-hidden border border-[#2E86FF]/30">
                  {student.avatarUrl && !student.avatarUrl.startsWith('preset:') ? (
                    <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
                  ) : presetAvatar ? (
                    <span>{presetAvatar.name.charAt(0)}</span>
                  ) : (
                    <span>{student.name.charAt(0)}</span>
                  )}
                </div>
                <div className="hidden text-right lg:block">
                  <p className="text-xs font-bold text-white truncate max-w-[110px]">{student.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-[#2E86FF]">{student.grade.includes('الثالث') ? '3 ثانوي' : student.grade.includes('الثاني') ? '2 ثانوي' : '1 ثانوي'}</p>
                </div>
              </button>

              {onOpenEditProfileModal && (
                <button
                  onClick={onOpenEditProfileModal}
                  className="rounded-xl border border-[#1E375E] bg-[#122442] p-2 text-slate-300 hover:bg-[#2E86FF]/20 hover:text-[#2E86FF] hover:border-[#2E86FF]/40 transition-colors"
                  title="تعديل الملف الشخصي"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="rounded-xl border border-[#1E375E] bg-[#122442] p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#2E86FF]/40 bg-[#2E86FF]/15 px-3.5 py-2 text-xs font-bold text-[#2E86FF] transition-all hover:bg-[#2E86FF] hover:text-white shadow-sm"
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">تسجيل الدخول / حساب جديد</span>
                <span className="sm:hidden">دخول</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-[#1E375E] bg-[#122442] p-2.5 text-slate-400 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#1E375E] bg-[#0C1B33] px-4 pt-3 pb-6 md:hidden">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              if (item.authRequired && !student) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    isActive ? 'bg-[#2E86FF]/20 text-[#2E86FF] font-bold' : 'text-slate-300 hover:bg-[#122442]'
                  }`}
                >
                  <Icon className="h-5 w-5 text-[#2E86FF]" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {student && onOpenWalletModal && (
              <button
                onClick={() => {
                  onOpenWalletModal();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg bg-[#FFB020]/10 px-4 py-3 text-sm font-bold text-[#FFB020] hover:bg-[#FFB020]/20"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-[#FFB020]" />
                  <span>محفظة الطالب والشحن</span>
                </div>
                <span className="font-mono bg-[#FFB020]/20 px-2.5 py-0.5 rounded-full text-xs">
                  {student.walletBalance || 0} ج.م
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenActivationModal();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg bg-[#FFB020] px-4 py-3 text-sm font-bold text-[#0C1B33] hover:bg-[#e59e1c]"
            >
              <Key className="h-5 w-5 text-[#0C1B33]" />
              <span>تفعيل كود كورس أو مذكرة</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg bg-[#2E86FF]/15 px-4 py-3 text-sm font-bold text-[#2E86FF] hover:bg-[#2E86FF]/25"
              >
                <Shield className="h-5 w-5 text-[#2E86FF]" />
                <span>لوحة تحكم الإدارة</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

