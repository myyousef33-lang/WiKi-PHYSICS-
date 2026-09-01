import React, { useState, useEffect, useRef } from 'react';
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
  Wallet,
  ChevronDown
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
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    StorageService.setCurrentStudent(null);
    onNavigate('home');
  };

  // Primary top-level desktop navigation items
  const primaryNavItems = [
    { id: 'home', label: 'الرئيسية', icon: BookOpen },
    ...(student ? [{ id: 'dashboard', label: 'لوحة دراستي', icon: GraduationCap }] : []),
    { id: student ? 'my-courses' : 'courses-catalog', label: student ? 'كورساتي' : 'المناهج والكورسات', icon: PlayCircle },
    { id: 'pdf-library', label: 'المذكرات والملازم', icon: FileText }
  ];

  // Secondary interactive & smart tools in dropdown on desktop
  const smartToolsItems = [
    { id: 'physics-lab', label: 'المعمل التفاعلي للفيزياء', desc: 'تجارب بصرية ومحاكاة قوانين تفاعلية', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { id: 'flashcards', label: 'بطاقات المراجعة الذكية', desc: 'مراجعة وحفظ المفاهيم والقوانين بسرعة', icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { id: 'ai-assistant', label: 'المساعد الذكي (فيزيكس AI)', desc: 'إجابة فورية وحل استفسارات الفيزياء بالذكاء الاصطناعي', icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { id: 'leaderboard', label: 'لوحة الشرف والأوائل', desc: 'ترتيب الطلاب المتفوقين ونقاط التميز', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    ...(student ? [
      { id: 'weakness-profile', label: 'تشخيص نقاط الضعف', desc: 'تحليل أخطائك في الامتحانات والتوصيات المخصصة', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/15' },
      { id: 'my-results', label: 'سجل نتائجي ودرجاتي', desc: 'عرض درجات الامتحانات والشهادات المكتسبة', icon: Award, color: 'text-blue-400', bg: 'bg-blue-500/15' }
    ] : [])
  ];

  const allMobileNavItems = [
    { id: 'home', label: 'الرئيسية', icon: BookOpen },
    { id: 'dashboard', label: 'لوحة دراستي', icon: GraduationCap, authRequired: true },
    { id: 'my-courses', label: 'كورساتي', icon: PlayCircle, authRequired: true },
    { id: 'courses-catalog', label: 'المناهج والكورسات', icon: BookOpen },
    { id: 'pdf-library', label: 'المذكرات والملازم', icon: FileText },
    { id: 'physics-lab', label: 'المعمل التفاعلي', icon: Sparkles },
    { id: 'flashcards', label: 'بطاقات المراجعة', icon: Layers },
    { id: 'ai-assistant', label: 'المساعد الذكي', icon: Bot },
    { id: 'leaderboard', label: 'لوحة الشرف', icon: Trophy },
    { id: 'weakness-profile', label: 'تشخيص ضعفي', icon: Brain, authRequired: true },
    { id: 'my-results', label: 'نتائجي والشهادات', icon: Award, authRequired: true }
  ];

  const presetAvatar = getPresetAvatar(student?.avatarUrl);
  const isToolActive = smartToolsItems.some(item => item.id === currentView);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E375E] bg-[#0C1B33]/95 backdrop-blur-xl shadow-lg transition-all">
      <div className="mx-auto flex h-20 lg:h-24 max-w-7xl 2xl:max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('home')} 
          className="cursor-pointer transition-transform hover:scale-[1.03] shrink-0"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1.5 lg:gap-2 md:flex">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm lg:text-base font-bold transition-all ${
                  isActive
                    ? 'bg-[#2E86FF]/20 text-[#2E86FF] border border-[#2E86FF]/40 shadow-md shadow-[#2E86FF]/10'
                    : 'text-slate-200 hover:bg-[#132747] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isActive ? 'text-[#2E86FF]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Smart Tools Dropdown for Desktop */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm lg:text-base font-bold transition-all ${
                isToolActive || toolsDropdownOpen
                  ? 'bg-[#2E86FF]/20 text-[#2E86FF] border border-[#2E86FF]/40 shadow-md'
                  : 'text-slate-200 hover:bg-[#132747] hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-[#FFB020]" />
              <span>أدوات المنصة الذكية</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180 text-[#2E86FF]' : 'text-slate-400'}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {toolsDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 lg:w-96 rounded-3xl border border-[#1E375E] bg-[#0C1B33]/98 backdrop-blur-2xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-[#1E375E] mb-2 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-300">الأدوات التفاعلية والذكية</span>
                  <span className="text-[10px] bg-[#FFB020]/15 text-[#FFB020] px-2 py-0.5 rounded-full font-bold">Wiki-X Tools</span>
                </div>
                <div className="space-y-1">
                  {smartToolsItems.map((tool) => {
                    const Icon = tool.icon;
                    const isCurrent = currentView === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onNavigate(tool.id);
                          setToolsDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-2xl text-right transition-all group ${
                          isCurrent
                            ? 'bg-[#2E86FF]/15 border border-[#2E86FF]/30'
                            : 'hover:bg-[#122442] border border-transparent'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${tool.bg} ${tool.color} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className={`text-xs lg:text-sm font-bold truncate ${isCurrent ? 'text-[#2E86FF]' : 'text-white'}`}>
                            {tool.label}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                            {tool.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Actions (Code Activation, Notifications, Auth, Admin if logged in) */}
        <div className="flex items-center gap-2.5 lg:gap-3.5">
          
          {/* Student Wallet Button (If Logged In) */}
          {student && onOpenWalletModal && (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 rounded-2xl border border-[#FFB020]/40 bg-[#FFB020]/10 px-3.5 py-2.5 text-xs lg:text-sm font-bold text-[#FFB020] hover:bg-[#FFB020]/20 hover:border-[#FFB020]/60 transition-all shadow-md shadow-[#FFB020]/10"
              title="رصيد المحفظة وشحن الحساب"
            >
              <Wallet className="h-4 w-4 lg:h-5 lg:w-5 shrink-0 text-[#FFB020]" />
              <span className="font-mono font-black text-sm lg:text-base">{student.walletBalance || 0}</span>
              <span className="text-[11px]">ج.م</span>
            </button>
          )}

          {/* Activation Key Button */}
          <button
            onClick={onOpenActivationModal}
            className="hidden items-center gap-2 rounded-2xl bg-[#FFB020] px-4 py-2.5 text-xs lg:text-sm font-black text-[#0C1B33] shadow-lg shadow-[#FFB020]/20 transition-transform hover:scale-105 active:scale-95 hover:bg-[#e59e1c] sm:flex"
          >
            <Key className="h-4 w-4" />
            <span>تفعيل كود</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotificationModal}
            className="relative rounded-2xl border border-[#1E375E] bg-[#122442] p-2.5 lg:p-3 text-slate-300 transition-all hover:border-[#2E86FF]/50 hover:bg-[#1B355E] hover:text-white shadow-sm"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="h-5 w-5 lg:h-5 lg:w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 lg:h-5.5 lg:w-5.5 items-center justify-center rounded-full bg-rose-500 text-[10px] lg:text-xs font-black text-white shadow-md animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin Panel Button (ONLY shown if admin is ALREADY logged in) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-2 rounded-2xl border border-[#2E86FF]/40 bg-[#2E86FF]/15 px-3.5 py-2.5 text-xs lg:text-sm font-bold text-[#2E86FF] hover:bg-[#2E86FF]/25 transition-colors shadow-sm"
            >
              <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-[#2E86FF]" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
            </button>
          )}

          {/* Student Profile / Login */}
          {student ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2.5 rounded-2xl border border-[#1E375E] bg-[#122442] px-3.5 py-2 text-right transition-all hover:border-[#2E86FF]/50 hover:bg-[#1B355E]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E86FF]/20 text-xs font-black text-[#2E86FF] overflow-hidden border border-[#2E86FF]/30 shrink-0">
                  {student.avatarUrl && !student.avatarUrl.startsWith('preset:') ? (
                    <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
                  ) : presetAvatar ? (
                    <span>{presetAvatar.name.charAt(0)}</span>
                  ) : (
                    <span>{student.name.charAt(0)}</span>
                  )}
                </div>
                <div className="hidden text-right lg:block">
                  <p className="text-xs lg:text-sm font-bold text-white truncate max-w-[130px]">{student.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-[#2E86FF] font-semibold">{student.grade.includes('الثالث') ? '3 ثانوي' : student.grade.includes('الثاني') ? '2 ثانوي' : '1 ثانوي'}</p>
                </div>
              </button>

              {onOpenEditProfileModal && (
                <button
                  onClick={onOpenEditProfileModal}
                  className="rounded-2xl border border-[#1E375E] bg-[#122442] p-2.5 text-slate-300 hover:bg-[#2E86FF]/20 hover:text-[#2E86FF] hover:border-[#2E86FF]/40 transition-colors hidden sm:block"
                  title="تعديل الملف الشخصي"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-[#1E375E] bg-[#122442] p-2.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-[#2E86FF]/40 bg-[#2E86FF]/15 px-4 py-2.5 text-xs lg:text-sm font-bold text-[#2E86FF] transition-all hover:bg-[#2E86FF] hover:text-white shadow-md shadow-[#2E86FF]/15"
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
            className="rounded-2xl border border-[#1E375E] bg-[#122442] p-2.5 text-slate-400 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#1E375E] bg-[#0C1B33] px-4 pt-3 pb-6 md:hidden">
          <div className="space-y-1.5">
            {allMobileNavItems.map((item) => {
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
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#2E86FF]/15 text-[#2E86FF] border border-[#2E86FF]/30'
                      : 'text-slate-300 hover:bg-[#132747] hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#2E86FF]' : 'text-slate-400'}`} />
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
                className="flex w-full items-center justify-between rounded-2xl bg-[#FFB020]/10 border border-[#FFB020]/30 px-4 py-3 text-sm font-bold text-[#FFB020] hover:bg-[#FFB020]/20"
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
              className="flex w-full items-center gap-3 rounded-2xl bg-[#FFB020] px-4 py-3 text-sm font-bold text-[#0C1B33] hover:bg-[#e59e1c]"
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
                className="flex w-full items-center gap-3 rounded-2xl bg-[#2E86FF]/15 border border-[#2E86FF]/30 px-4 py-3 text-sm font-bold text-[#2E86FF] hover:bg-[#2E86FF]/25"
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

