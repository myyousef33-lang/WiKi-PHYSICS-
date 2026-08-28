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
  PlayCircle
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { Student } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAdminAuthModal?: () => void;
  onOpenNotificationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenActivationModal,
  onOpenAuthModal,
  onOpenNotificationModal
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

      const notifs = StorageService.getNotifications();
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
    { id: 'courses-catalog', label: 'المناهج والكورسات', icon: BookOpen },
    { id: 'pdf-library', label: 'المذكرات والملازم', icon: FileText },
    { id: 'my-results', label: 'نتائجي وتقييماتي', icon: Award, authRequired: true }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
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
                    ? 'bg-amber-500/15 text-amber-400 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions (Code Activation, Notifications, Auth, Admin if logged in) */}
        <div className="flex items-center gap-2.5">
          
          {/* Activation Key Button */}
          <button
            onClick={onOpenActivationModal}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95 sm:flex"
          >
            <Key className="h-4 w-4" />
            <span>تفعيل كود</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotificationModal}
            className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
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
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/25 transition-colors"
            >
              <Shield className="h-4 w-4 text-blue-400" />
              <span>لوحة الإدارة</span>
            </button>
          )}

          {/* Student Profile / Login */}
          {student ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-right transition-colors hover:border-amber-500/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-xs font-black text-amber-400">
                  {student.name.charAt(0)}
                </div>
                <div className="hidden text-right lg:block">
                  <p className="text-xs font-bold text-white truncate max-w-[110px]">{student.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-amber-400">{student.grade.includes('الثالث') ? '3 ثانوي' : student.grade.includes('الثاني') ? '2 ثانوي' : '1 ثانوي'}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-amber-600/10 px-3 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 shadow-sm"
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
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 pt-3 pb-6 md:hidden">
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
                    isActive ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 text-amber-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                onOpenActivationModal();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/20"
            >
              <Key className="h-5 w-5 text-amber-400" />
              <span>تفعيل كود كورس أو مذكرة</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-400 hover:bg-blue-500/20"
              >
                <Shield className="h-5 w-5 text-blue-400" />
                <span>لوحة تحكم الإدارة</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

