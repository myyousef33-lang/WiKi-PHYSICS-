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
  ChevronDown,
  Gift
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student } from '../types';
import { Logo } from './Logo';
import { getPresetAvatar } from '../utils/avatars';
import { ThemeToggle } from './ThemeToggle';

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
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

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
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    StorageService.setCurrentStudent(null);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
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
    <header className="sticky top-0 z-40 w-full border-b border-blue-100 dark:border-[#1E295B] bg-white/98 dark:bg-[#0D1B3E]/98 backdrop-blur-xl shadow-xs transition-all">
      {/* Top Royal Blue Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#1E4FD8] via-[#3B82F6] to-[#1E4FD8]" />

      <div className="mx-auto flex h-20 lg:h-24 max-w-7xl 2xl:max-w-screen-2xl items-center justify-between px-3 sm:px-6 lg:px-10 xl:px-12 gap-2">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('home')} 
          className="cursor-pointer transition-transform hover:scale-[1.03] shrink-0"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 xl:gap-2 md:flex">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 xl:px-4 py-2 xl:py-2.5 text-xs xl:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1E4FD8] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800/60 shadow-xs'
                    : 'text-[#0D1B3E] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA]'
                }`}
              >
                <Icon className={`h-4 w-4 xl:h-5 xl:w-5 ${isActive ? 'text-[#1E4FD8] dark:text-[#60A5FA]' : 'text-[#6B7280] dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Smart Tools Dropdown for Desktop */}
          <div className="relative" ref={toolsDropdownRef}>
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className={`flex items-center gap-1.5 rounded-xl px-3 xl:px-4 py-2 xl:py-2.5 text-xs xl:text-sm font-bold transition-all ${
                isToolActive || toolsDropdownOpen
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1E4FD8] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800/60 shadow-xs'
                  : 'text-[#0D1B3E] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA]'
              }`}
            >
              <Sparkles className="h-4 w-4 xl:h-5 xl:w-5 text-[#F5B301]" />
              <span>أدوات المنصة الذكية</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180 text-[#1E4FD8] dark:text-[#60A5FA]' : 'text-[#6B7280] dark:text-slate-400'}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {toolsDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 lg:w-96 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16224D] p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-between">
                  <span className="text-xs font-black text-[#0D1B3E] dark:text-white">الأدوات التفاعلية والذكية</span>
                  <span className="text-[10px] bg-[#F5B301]/20 text-[#0D1B3E] dark:text-[#F5B301] px-2 py-0.5 rounded-full font-bold">أدوات ويكي فيزياء</span>
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
                            ? 'bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${tool.bg} ${tool.color} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className={`text-xs lg:text-sm font-bold truncate ${isCurrent ? 'text-[#1E4FD8] dark:text-[#60A5FA]' : 'text-[#0D1B3E] dark:text-slate-100'}`}>
                            {tool.label}
                          </p>
                          <p className="text-[11px] text-[#6B7280] dark:text-slate-400 line-clamp-1 leading-normal">
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

        {/* Clean Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Lucky Wheel Fast Trigger */}
          {student && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-2 text-xs font-black text-[#0D1B3E] shadow-sm shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95 shrink-0"
              title="عجلة الحظ لربح إكسسوارات الشخصية"
            >
              <Gift className="h-4 w-4 text-[#0D1B3E]" />
              <span className="hidden lg:inline">عجلة الحظ</span>
              <span className="inline-flex h-4 px-1.5 items-center justify-center rounded-full bg-[#0D1B3E] text-amber-300 text-[10px] font-black">
                {student.wheelSpins || 0}
              </span>
            </button>
          )}

          {/* Activation Key Button */}
          <button
            onClick={onOpenActivationModal}
            className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-[#0D1B3E] text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 hover:bg-slate-800 shrink-0"
            title="تفعيل كود مسبق الدفع"
          >
            <Key className="h-4 w-4 text-[#F5B301]" />
            <span>تفعيل كود</span>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Notifications Button */}
          <button
            onClick={onOpenNotificationModal}
            className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16224D] p-2 sm:p-2.5 text-[#0D1B3E] dark:text-slate-100 transition-all hover:border-[#1E4FD8] dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/60 shadow-xs shrink-0"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin Quick Entry (ONLY if Admin is logged in) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/80 px-3 py-2 text-xs font-bold text-[#1E4FD8] dark:text-[#60A5FA] hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-xs shrink-0"
              title="لوحة الإدارة"
            >
              <Shield className="h-4 w-4 text-[#1E4FD8] dark:text-[#60A5FA]" />
              <span>لوحة الإدارة</span>
            </button>
          )}

          {/* Student Profile Dropdown OR Login Button */}
          {student ? (
            <div className="relative shrink-0" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-right transition-all shadow-xs ${
                  userDropdownOpen 
                    ? 'border-[#1E4FD8] bg-blue-50 dark:bg-blue-950/80' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16224D] hover:border-[#1E4FD8]'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-xs font-black text-[#1E4FD8] dark:text-[#60A5FA] overflow-hidden border border-blue-200 dark:border-blue-800 shrink-0">
                  {student.avatarUrl && !student.avatarUrl.startsWith('preset:') ? (
                    <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
                  ) : presetAvatar ? (
                    <span>{presetAvatar.name.charAt(0)}</span>
                  ) : (
                    <span>{student.name.charAt(0)}</span>
                  )}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-[#0D1B3E] dark:text-white truncate max-w-[100px]">{student.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-[#1E4FD8] dark:text-[#60A5FA] font-semibold">حسابي</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#6B7280] dark:text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-[#1E4FD8]' : ''}`} />
              </button>

              {/* User Menu Popup Card */}
              {userDropdownOpen && (
                <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-3 w-72 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16224D] p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Card Header */}
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/60 rounded-2xl border border-blue-100 dark:border-blue-900/40 mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E4FD8] text-white text-base font-black shrink-0 shadow-xs">
                      {student.avatarUrl && !student.avatarUrl.startsWith('preset:') ? (
                        <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        student.name.charAt(0)
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-sm font-black text-[#0D1B3E] dark:text-white truncate">{student.name}</p>
                      <p className="text-xs text-[#1E4FD8] dark:text-[#60A5FA] font-bold">{student.grade}</p>
                      {student.phone && <p className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono">{student.phone}</p>}
                    </div>
                  </div>

                  {/* Wallet Balance Pill inside Menu */}
                  {onOpenWalletModal && (
                    <button
                      onClick={() => {
                        onOpenWalletModal();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full mb-3 flex items-center justify-between p-2.5 rounded-2xl bg-[#F5B301]/15 border border-[#F5B301]/40 hover:bg-[#F5B301]/25 transition-all text-right"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="h-4 w-4 text-[#F5B301]" />
                        <span className="text-xs font-bold text-[#0D1B3E] dark:text-[#F5B301]">رصيد محفظتي</span>
                      </div>
                      <span className="font-mono font-black text-xs bg-[#F5B301]/30 text-[#0D1B3E] dark:text-[#F5B301] px-2.5 py-1 rounded-xl">
                        {student.walletBalance || 0} ج.م
                      </span>
                    </button>
                  )}

                  {/* User Links */}
                  <div className="space-y-1 border-t border-b border-slate-100 dark:border-slate-800/80 py-2 my-1">
                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-[#0D1B3E] dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-[#1E4FD8] transition-all text-right"
                    >
                      <GraduationCap className="h-4 w-4 text-[#1E4FD8] dark:text-[#60A5FA]" />
                      <span>لوحة دراستي ومتابعة الدروس</span>
                    </button>

                    {onOpenEditProfileModal && (
                      <button
                        onClick={() => {
                          onOpenEditProfileModal();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-[#0D1B3E] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-right"
                      >
                        <Edit3 className="h-4 w-4 text-[#6B7280] dark:text-slate-400" />
                        <span>تعديل بيانات الملف الشخصي</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-[#1E4FD8] dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 transition-all text-right"
                      >
                        <Shield className="h-4 w-4 text-[#1E4FD8] dark:text-[#60A5FA]" />
                        <span>الدخول للوحة الإدارة</span>
                      </button>
                    )}
                  </div>

                  {/* Prominent Red Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full mt-2 flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all shadow-xs"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج من الحساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border-2 border-[#1E4FD8] dark:border-[#3B82F6] bg-white dark:bg-[#16224D] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#1E4FD8] dark:text-[#60A5FA] transition-all hover:bg-blue-50 dark:hover:bg-blue-950/60 shadow-xs shrink-0"
            >
              <User className="h-4 w-4 shrink-0 text-[#1E4FD8] dark:text-[#60A5FA]" />
              <span className="hidden sm:inline">تسجيل الدخول / حساب جديد</span>
              <span className="sm:hidden">دخول</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16224D] p-2 text-[#0D1B3E] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shadow-xs shrink-0"
            title="القائمة الكاملة"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B3E] px-4 pt-3 pb-6 md:hidden shadow-xl animate-in slide-in-from-top-2">
          {/* If Student is Logged In - Header info in Drawer */}
          {student && (
            <div className="p-3 bg-blue-50 dark:bg-[#16224D] rounded-2xl border border-blue-200 dark:border-blue-900/50 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E4FD8] text-white text-sm font-black shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-[#0D1B3E] dark:text-white">{student.name}</p>
                  <p className="text-[10px] text-[#1E4FD8] dark:text-[#60A5FA] font-bold">{student.grade}</p>
                </div>
              </div>

              {onOpenEditProfileModal && (
                <button
                  onClick={() => {
                    onOpenEditProfileModal();
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl bg-white dark:bg-slate-800 p-2 text-xs font-bold text-[#1E4FD8] shadow-xs"
                  title="تعديل الملف"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

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
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-[#1E4FD8] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800'
                      : 'text-[#0D1B3E] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#1E4FD8] dark:text-[#60A5FA]' : 'text-[#6B7280] dark:text-slate-400'}`} />
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
                className="flex w-full items-center justify-between rounded-2xl bg-[#F5B301]/15 border border-[#F5B301]/40 px-4 py-2.5 text-xs font-bold text-[#0D1B3E] dark:text-[#F5B301] hover:bg-[#F5B301]/25"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="h-4.5 w-4.5 text-[#F5B301]" />
                  <span>محفظة الطالب والشحن</span>
                </div>
                <span className="font-mono bg-[#F5B301]/25 px-2.5 py-0.5 rounded-full text-xs font-black">
                  {student.walletBalance || 0} ج.م
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenActivationModal();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-2xl bg-[#F5B301] px-4 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs"
            >
              <Key className="h-4.5 w-4.5 text-[#0D1B3E]" />
              <span>تفعيل كود كورس أو مذكرة</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-2.5 text-xs font-bold text-[#1E4FD8] dark:text-[#60A5FA]"
              >
                <Shield className="h-4.5 w-4.5 text-[#1E4FD8] dark:text-[#60A5FA]" />
                <span>لوحة تحكم الإدارة</span>
              </button>
            )}

            {student && (
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-4 py-3 text-xs font-black text-rose-600 dark:text-rose-400 mt-3 shadow-xs"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

