import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Trophy, 
  Gift, 
  Key, 
  FileCheck, 
  Sparkles, 
  Award, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2, 
  Zap,
  Info,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { PointTransaction, PointSourceType, Student } from '../types';
import { StorageService, subscribeToStorage } from '../services/storage';
import { calculateStudentRankStats, getStudentLevel } from '../utils/studentLevels';
import { RankTierIcon } from './RankTierIcon';

interface PointHistoryViewProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenActivationModal?: () => void;
  onOpenLuckyWheelModal?: () => void;
}

export const PointHistoryView: React.FC<PointHistoryViewProps> = ({
  onNavigate,
  onOpenActivationModal,
  onOpenLuckyWheelModal
}) => {
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | PointSourceType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');

  useEffect(() => {
    const updateData = () => {
      const current = StorageService.getCurrentStudent();
      setStudent(current);
      if (current) {
        const txList = StorageService.getPointTransactions(current.id);
        setTransactions(txList);
      } else {
        setTransactions([]);
      }
    };

    updateData();
    return subscribeToStorage(updateData);
  }, []);

  const leaderboard = useMemo(() => StorageService.getLeaderboard(), []);
  const rankStats = useMemo(() => calculateStudentRankStats(student, leaderboard), [student, leaderboard]);
  const currentLevel = useMemo(() => getStudentLevel(rankStats.points), [rankStats.points]);

  // Source Stats Breakdown
  const statsBreakdown = useMemo(() => {
    let examsTotal = 0;
    let wheelTotal = 0;
    let activationTotal = 0;
    let bonusTotal = 0;

    transactions.forEach(tx => {
      if (tx.type === 'quiz_exam') examsTotal += tx.amount;
      else if (tx.type === 'lucky_wheel') wheelTotal += tx.amount;
      else if (tx.type === 'activation_code') activationTotal += tx.amount;
      else bonusTotal += tx.amount;
    });

    return {
      examsTotal,
      wheelTotal,
      activationTotal,
      bonusTotal,
      overallTotal: rankStats.points
    };
  }, [transactions, rankStats.points]);

  // Filter & Search & Sort
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (selectedFilter !== 'all' && tx.type !== selectedFilter) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const matchTitle = (tx.title || '').toLowerCase().includes(query);
          const matchDesc = (tx.description || '').toLowerCase().includes(query);
          if (!matchTitle && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'highest') {
          return b.amount - a.amount;
        }
        return 0;
      });
  }, [transactions, selectedFilter, searchQuery, sortBy]);

  // Format Date to localized Arabic format
  const formatArabicDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return { dateStr: 'تاريخ سابق', timeStr: '' };

      const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];

      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'مساءً' : 'صباحاً';
      hours = hours % 12 || 12;

      return {
        dateStr: `${day} ${month} ${year}`,
        timeStr: `${hours}:${minutes} ${period}`
      };
    } catch {
      return { dateStr: 'تاريخ سابق', timeStr: '' };
    }
  };

  const getSourceBadgeInfo = (type: PointSourceType) => {
    switch (type) {
      case 'quiz_exam':
        return {
          label: 'حل اختبار',
          icon: FileCheck,
          textColor: 'text-blue-700 dark:text-blue-300',
          bgColor: 'bg-blue-50 dark:bg-blue-950/60',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'lucky_wheel':
        return {
          label: 'عجلة الحظ',
          icon: Gift,
          textColor: 'text-amber-800 dark:text-amber-300',
          bgColor: 'bg-amber-50 dark:bg-amber-950/60',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      case 'activation_code':
        return {
          label: 'كود تفعيل',
          icon: Key,
          textColor: 'text-emerald-800 dark:text-emerald-300',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      case 'weekly_challenge':
        return {
          label: 'تحدي الأسبوع',
          icon: Trophy,
          textColor: 'text-purple-800 dark:text-purple-300',
          bgColor: 'bg-purple-50 dark:bg-purple-950/60',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      case 'teacher_bonus':
        return {
          label: 'مكافأة المعلم',
          icon: Award,
          textColor: 'text-rose-800 dark:text-rose-300',
          bgColor: 'bg-rose-50 dark:bg-rose-950/60',
          borderColor: 'border-rose-200 dark:border-rose-800'
        };
      case 'streak_reward':
        return {
          label: 'استمرارية يومية',
          icon: Zap,
          textColor: 'text-orange-800 dark:text-orange-300',
          bgColor: 'bg-orange-50 dark:bg-orange-950/60',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      default:
        return {
          label: 'مكافأة تميز',
          icon: Sparkles,
          textColor: 'text-slate-800 dark:text-slate-300',
          bgColor: 'bg-slate-50 dark:bg-slate-800',
          borderColor: 'border-slate-200 dark:border-slate-700'
        };
    }
  };

  if (!student) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center" dir="rtl">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 sm:p-12 shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1E4FD8] border border-blue-200">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">سجل تاريخ النقاط مخصص للطلاب المشتركين</h2>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            سجل الدخول بحسابك لمتابعة تفاصيل رصيدك ومصدر كل نقطة حصلت عليها مع أستاذ أحمد صلاح.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="rounded-xl bg-[#1E4FD8] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#163cb5] transition-all cursor-pointer"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300 pb-20" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. Header with Breadcrumbs & Title                                       */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <button 
                onClick={() => onNavigate('dashboard')} 
                className="hover:text-[#1E4FD8] transition-colors flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>لوحة التحكم</span>
              </button>
              <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold text-[#0D1B3E]">سجل تاريخ النقاط</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1E4FD8] to-blue-600 text-white shadow-xs">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">سجل تاريخ النقاط (Point History)</h1>
                <p className="text-xs text-[#6B7280] font-medium">
                  عرض شفاف وموثق لمصدر وتاريخ كل نقطة في حسابك لدى منصة أستاذ أحمد صلاح
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Student Identity Badge */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            
            {/* Rank Status Pill */}
            <button
              onClick={() => onNavigate('leaderboard')}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-600" />
              <span>المركز #{rankStats.rank} على المنصة</span>
            </button>

            {/* Current Level Pill */}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black shadow-2xs ${currentLevel.badgeClass}`}>
              <RankTierIcon tier={currentLevel.tier} className="h-3.5 w-3.5 shrink-0" />
              <span>رتبة {currentLevel.badge}</span>
            </span>

            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
              <span>لوحة دراستي</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Bento Stats Summary: Transparency Breakdown Cards                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Real Points */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E4FD8]">إجمالي الرصيد الفعلي</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1E4FD8]">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#0D1B3E] font-mono">
              {statsBreakdown.overallTotal.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold text-[#6B7280] mr-1">نقطة تميز</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            الرصيد المعتمد في لوحة الشرف
          </p>
        </div>

        {/* Card 2: Exams & Quizzes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0D1B3E]">نقاط حل الاختبارات</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E4FD8]">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#1E4FD8] font-mono">
              {statsBreakdown.examsTotal.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold text-[#6B7280] mr-1">نقطة</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            مستحقة من الامتحانات والواجبات
          </p>
        </div>

        {/* Card 3: Lucky Wheel Points */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/20 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">عجلة الحظ اليومية</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
              {statsBreakdown.wheelTotal.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold text-[#6B7280] mr-1">نقطة</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            جوائز ومكافآت الحظ المكتسبة
          </p>
        </div>

        {/* Card 4: Activation & Rewards */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/20 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">أكواد التفعيل والمكافآت</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {(statsBreakdown.activationTotal + statsBreakdown.bonusTotal).toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold text-[#6B7280] mr-1">نقطة</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            تفعيل الكورسات وتشجيع المعلم
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. Filter Bar & Search Controls                                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الاختبار، النشاط، أو كود التفعيل..."
              className="w-full rounded-xl border border-slate-200 bg-[#F5F7FA] pr-10 pl-4 py-2.5 text-xs text-[#0D1B3E] placeholder-[#6B7280] focus:border-[#1E4FD8] focus:bg-white focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#0D1B3E]"
              >
                مسح
              </button>
            )}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280]">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#1E4FD8]" />
              <span className="hidden sm:inline">الترتيب:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-3 py-2 text-xs font-bold text-[#0D1B3E] focus:border-[#1E4FD8] focus:bg-white focus:outline-hidden transition-all cursor-pointer"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="highest">الأعلى نقاطاً</option>
            </select>
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#6B7280] shrink-0 pl-1">
            <Filter className="h-3 w-3" />
            <span>المصدر:</span>
          </span>

          <button
            onClick={() => setSelectedFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 font-bold transition-all shrink-0 cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#1E4FD8] text-white shadow-xs'
                : 'bg-slate-100 text-[#6B7280] hover:bg-slate-200/80 hover:text-[#0D1B3E]'
            }`}
          >
            الكل ({transactions.length})
          </button>

          <button
            onClick={() => setSelectedFilter('quiz_exam')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition-all shrink-0 cursor-pointer ${
              selectedFilter === 'quiz_exam'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-[#6B7280] hover:bg-slate-200/80 hover:text-[#0D1B3E]'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>حل اختبارات</span>
          </button>

          <button
            onClick={() => setSelectedFilter('lucky_wheel')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition-all shrink-0 cursor-pointer ${
              selectedFilter === 'lucky_wheel'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-[#6B7280] hover:bg-slate-200/80 hover:text-[#0D1B3E]'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            <span>عجلة الحظ</span>
          </button>

          <button
            onClick={() => setSelectedFilter('activation_code')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition-all shrink-0 cursor-pointer ${
              selectedFilter === 'activation_code'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-[#6B7280] hover:bg-slate-200/80 hover:text-[#0D1B3E]'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>أكواد التفعيل</span>
          </button>

          <button
            onClick={() => setSelectedFilter('teacher_bonus')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition-all shrink-0 cursor-pointer ${
              selectedFilter === 'teacher_bonus'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-[#6B7280] hover:bg-slate-200/80 hover:text-[#0D1B3E]'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>مكافآت المعلم</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. Transactions Timeline & List                                           */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-[#0D1B3E]">
            سجل العمليات ({filteredTransactions.length})
          </h2>
          <span className="text-[11px] text-[#6B7280]">
            مرتبة زمنياً بدقة
          </span>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const badge = getSourceBadgeInfo(tx.type);
              const Icon = badge.icon;
              const { dateStr, timeStr } = formatArabicDateTime(tx.createdAt);

              return (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  
                  {/* Right side: Icon + Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    
                    {/* Source Icon */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${badge.bgColor} ${badge.borderColor} ${badge.textColor} shadow-2xs group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Information */}
                    <div className="space-y-1 min-w-0 flex-1">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Source Tag Badge */}
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}>
                          <Icon className="h-3 w-3" />
                          <span>{badge.label}</span>
                        </span>

                        {/* Title */}
                        <h3 className="text-sm font-black text-[#0D1B3E] truncate">
                          {tx.title}
                        </h3>
                      </div>

                      {/* Description if present */}
                      {tx.description && (
                        <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                          {tx.description}
                        </p>
                      )}

                      {/* Date & Time display */}
                      <div className="flex items-center gap-3 text-[11px] text-[#6B7280] pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{dateStr}</span>
                        </span>
                        {timeStr && (
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{timeStr}</span>
                          </span>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* Left side: Points Amount Pill */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="sm:hidden text-xs font-medium text-[#6B7280]">النقاط المضافة:</span>

                    <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-emerald-800 shadow-2xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-sm sm:text-base font-black font-mono">
                        +{tx.amount}
                      </span>
                      <span className="text-xs font-bold">نقطة</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 sm:p-14 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#6B7280]">
              <History className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[#0D1B3E]">لا توجد نقاط مسجلة مطابقة للبحث أو الفلتر</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                ابدأ بحل الاختبارات الدورية، تدوير عجلة الحظ، أو تفعيل أكواد الكورسات والمذكرات لربح نقاط ترفع ترتيبك على مستوى الجمهورية!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => onNavigate('my-courses')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4FD8] px-4 py-2 text-xs font-bold text-white hover:bg-[#163cb5] transition-all cursor-pointer shadow-xs"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>حل اختبارات الكورسات</span>
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              >
                <Gift className="h-3.5 w-3.5 text-amber-700" />
                <span>عجلة الحظ اليومية</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 5. Policy & Point System Transparency Note                                */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-amber-50/30 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E4FD8] text-white shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-black text-[#0D1B3E]">شفافية نظام النقاط لدى منصة أستاذ أحمد صلاح</h4>
            <p className="text-[#6B7280] leading-relaxed">
              تحتسب كل نقطة وفق معايير دقيقة وعادلة: نقاط كاملة مساوية لدرجتك في كل اختبار وواجب فيزيائي، مكافآت مباشرة عند تفعيل الأكواد والملازم، ومكافآت التميز والتشجيع لتصدر قائمة أوائل الجمهورية في مادة الفيزياء للثانوية العامة.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
