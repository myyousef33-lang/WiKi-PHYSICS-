import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Gift, 
  Sparkle,
  Zap,
  Award,
  Crown,
  Flame,
  Star,
  TrendingUp,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { StorageService } from '../services/storage';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onStudentUpdated: (updated: Student) => void;
  onOpenWardrobe?: () => void; // kept for backwards compatibility
  onOpenLeaderboard?: () => void;
}

export interface WheelPointPrize {
  id: string;
  points: number;
  label: string;
  sublabel: string;
  badge: string;
  bg: string;
  text: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// 8 Physics Points Sectors on the Wheel
const WHEEL_POINT_SECTORS: WheelPointPrize[] = [
  { 
    id: 'pts-500', 
    points: 500, 
    label: '+500 نقطة', 
    sublabel: 'الجائزة الكبرى لصدارة الجمهورية', 
    badge: '500', 
    bg: '#0F172A', 
    text: '#F5B301',
    rarity: 'legendary' 
  },
  { 
    id: 'pts-50', 
    points: 50, 
    label: '+50 نقطة', 
    sublabel: 'دفعة صعود الترتيب', 
    badge: '50', 
    bg: '#1E4FD8', 
    text: '#FFFFFF',
    rarity: 'common' 
  },
  { 
    id: 'pts-200', 
    points: 200, 
    label: '+200 نقطة', 
    sublabel: 'قفزة أوائل الجمهورية', 
    badge: '200', 
    bg: '#047857', 
    text: '#FFFFFF',
    rarity: 'epic' 
  },
  { 
    id: 'pts-75', 
    points: 75, 
    label: '+75 نقطة', 
    sublabel: 'طاقة فيزيائية إضافية', 
    badge: '75', 
    bg: '#7C3AED', 
    text: '#FFFFFF',
    rarity: 'rare' 
  },
  { 
    id: 'pts-300', 
    points: 300, 
    label: '+300 نقطة', 
    sublabel: 'وسام التفوق والامتياز', 
    badge: '300', 
    bg: '#B45309', 
    text: '#FEF3C7',
    rarity: 'epic' 
  },
  { 
    id: 'pts-100', 
    points: 100, 
    label: '+100 نقطة', 
    sublabel: 'ترقية فورية للرتبة', 
    badge: '100', 
    bg: '#0284C7', 
    text: '#FFFFFF',
    rarity: 'rare' 
  },
  { 
    id: 'pts-400', 
    points: 400, 
    label: '+400 نقطة', 
    sublabel: 'درع العباقرة الذهبي', 
    badge: '400', 
    bg: '#1E293B', 
    text: '#FDE047',
    rarity: 'legendary' 
  },
  { 
    id: 'pts-25', 
    points: 25, 
    label: '+25 نقطة', 
    sublabel: 'مكافأة استمرار واجتهاد', 
    badge: '25', 
    bg: '#DC2626', 
    text: '#FFFFFF',
    rarity: 'common' 
  }
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
  onOpenLeaderboard
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPointPrize | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [pointerBounce, setPointerBounce] = useState(false);
  const currentRotationRef = useRef(0);

  const availableSpins = student.wheelSpins || 0;
  const numSectors = WHEEL_POINT_SECTORS.length;
  const arcSize = 360 / numSectors;

  useEffect(() => {
    if (isOpen) {
      setShowCelebrationModal(false);
      setWonPrize(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || availableSpins <= 0) return;

    setIsSpinning(true);
    setShowCelebrationModal(false);
    setWonPrize(null);

    // Weighted random selection:
    // higher chances for 50, 75, 100, good chances for 200, 300, rare for 400, 500
    const rand = Math.random();
    let targetSectorIndex = 1; // default 50 pts

    if (rand < 0.08) {
      targetSectorIndex = 0; // 500 pts (8%)
    } else if (rand < 0.18) {
      targetSectorIndex = 6; // 400 pts (10%)
    } else if (rand < 0.32) {
      targetSectorIndex = 4; // 300 pts (14%)
    } else if (rand < 0.48) {
      targetSectorIndex = 2; // 200 pts (16%)
    } else if (rand < 0.65) {
      targetSectorIndex = 5; // 100 pts (17%)
    } else if (rand < 0.80) {
      targetSectorIndex = 3; // 75 pts (15%)
    } else if (rand < 0.92) {
      targetSectorIndex = 1; // 50 pts (12%)
    } else {
      targetSectorIndex = 7; // 25 pts (8%)
    }

    const prize = WHEEL_POINT_SECTORS[targetSectorIndex];

    // Pointer is fixed at top (0 deg)
    const fullSpins = 7 * 360;
    const sectorCenterOffset = targetSectorIndex * arcSize + arcSize / 2;
    const jitter = (Math.random() - 0.5) * (arcSize * 0.4);
    const targetDeg = currentRotationRef.current + fullSpins + (360 - (currentRotationRef.current % 360)) + (360 - sectorCenterOffset) + jitter;
    
    currentRotationRef.current = targetDeg;
    setRotationDegrees(targetDeg);

    // Pointer vibration interval
    const interval = setInterval(() => {
      setPointerBounce(prev => !prev);
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
      setWonPrize(prize);
      setShowCelebrationModal(true);

      // Confetti blast
      try {
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#F5B301', '#1E4FD8', '#0EA5E9', '#FFFFFF', '#10B981']
        });
      } catch (_) {}

      // Update student points in Leaderboard and Student model
      const newSpins = Math.max(0, availableSpins - 1);
      
      // Update leaderboard entry points directly
      const currentLeaderboard = StorageService.getLeaderboard();
      const existingEntryIndex = currentLeaderboard.findIndex(e => e.studentId === student.id);
      
      if (existingEntryIndex !== -1) {
        currentLeaderboard[existingEntryIndex].points = (currentLeaderboard[existingEntryIndex].points || 0) + prize.points;
        currentLeaderboard[existingEntryIndex].weeklyScore = (currentLeaderboard[existingEntryIndex].weeklyScore || 0) + prize.points;
        currentLeaderboard[existingEntryIndex].lastActive = new Date().toISOString();
      } else {
        currentLeaderboard.push({
          studentId: student.id,
          studentName: student.name,
          grade: student.grade || 'الصف الثالث الثانوي',
          governorate: student.governorate || 'القاهرة',
          points: 50 + prize.points,
          weeklyScore: 20 + prize.points,
          completedExamsCount: 1,
          badges: [],
          lastActive: new Date().toISOString()
        });
      }
      StorageService.saveLeaderboard(currentLeaderboard);

      const updatedStudent: Student = {
        ...student,
        wheelSpins: newSpins
      };

      StorageService.saveStudent(updatedStudent);
      StorageService.setCurrentStudent(updatedStudent);
      onStudentUpdated(updatedStudent);
    }, 4500);
  };

  // Generate 24 perimeter bulbs for the luxury casino rim
  const bulbs = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * (360 / 24)) * (Math.PI / 180);
    const radius = 142; // on 300x300 viewBox
    const cx = 150 + radius * Math.cos(angle);
    const cy = 150 + radius * Math.sin(angle);
    const isEven = i % 2 === 0;
    return { cx, cy, isEven };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-lg overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      
      {/* Outer Modal Container with Golden Glow */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#0D1B3E] via-[#091228] to-[#040814] border-2 border-amber-500/40 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,179,1,0.25)] overflow-hidden my-auto text-white">
        
        {/* Ambient background rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 text-[#0D1B3E] shadow-lg shadow-amber-500/30">
              <Flame className="h-6 w-6 fill-amber-900 stroke-none" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                عجلة نقاط الصدارة
                <Sparkle className="h-4 w-4 text-amber-400 animate-spin" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                اربح مئات نقاط التميز وارتقِ إلى المركز الأول على المنصة!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSpinning}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Spins Counter Bar */}
        <div className="relative z-10 my-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border border-amber-500/30 shadow-inner">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-amber-200">اللفات المتاحة لك:</span>
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-[#0D1B3E] font-black text-sm shadow-md font-mono">
              {availableSpins} {availableSpins === 1 ? 'لفة مجانية' : 'لفات متاحة'}
            </span>
          </div>

          {onOpenLeaderboard && (
            <button
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              disabled={isSpinning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>لوحة الشرف والأوائل</span>
            </button>
          )}
        </div>

        {/* Wheel Interactive Area */}
        <div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-4">
          
          {/* Wheel Frame & Realistic Styling */}
          <div className="relative w-72 h-72 sm:w-92 sm:h-92 md:w-[380px] md:h-[380px] flex items-center justify-center">
            
            {/* Top Pointer Needle (Fixed at top pointing down) */}
            <div 
              className={`absolute -top-3 z-40 flex flex-col items-center pointer-events-none transition-transform duration-75 ${
                pointerBounce ? '-translate-y-1 scale-110' : 'translate-y-0'
              }`}
            >
              <div className="w-7 h-10 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 rounded-b-full shadow-[0_4px_12px_rgba(0,0,0,0.8)] border border-amber-100 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 shadow-inner" />
              </div>
              <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-amber-500 -mt-1 drop-shadow-md" />
            </div>

            {/* Rotating SVG Wheel */}
            <div
              className="w-full h-full rounded-full shadow-[0_0_40px_rgba(0,0,0,0.9)]"
              style={{
                transform: `rotate(${rotationDegrees}deg)`,
                transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.90, 0.20, 1)' : 'none'
              }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full select-none">
                <defs>
                  {/* Gold metallic ring gradient */}
                  <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="30%" stopColor="#F5B301" />
                    <stop offset="70%" stopColor="#B45309" />
                    <stop offset="100%" stopColor="#FDE047" />
                  </linearGradient>

                  {/* Dark Center Metallic Gradient */}
                  <linearGradient id="centerHubGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>

                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Outer Rim Ring */}
                <circle cx="150" cy="150" r="148" fill="#0D1B3E" stroke="url(#goldBorder)" strokeWidth="8" />
                <circle cx="150" cy="150" r="142" fill="#040814" stroke="#F5B301" strokeWidth="2" />

                {/* 8 Distinct Pie Sectors with Points */}
                {WHEEL_POINT_SECTORS.map((sector, index) => {
                  const startAngle = index * arcSize;
                  const endAngle = (index + 1) * arcSize;
                  
                  // Convert angles to radians
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  
                  const r = 138;
                  const x1 = 150 + r * Math.cos(startRad);
                  const y1 = 150 + r * Math.sin(startRad);
                  const x2 = 150 + r * Math.cos(endRad);
                  const y2 = 150 + r * Math.sin(endRad);

                  const pathData = `M 150 150 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

                  // Item center position on arc
                  const midAngle = startAngle + arcSize / 2;
                  const midRad = (midAngle * Math.PI) / 180;
                  const itemRadius = 90;
                  const ix = 150 + itemRadius * Math.cos(midRad);
                  const iy = 150 + itemRadius * Math.sin(midRad);

                  return (
                    <g key={sector.id}>
                      {/* Sector Slice */}
                      <path
                        d={pathData}
                        fill={sector.bg}
                        stroke="#F5B301"
                        strokeWidth="2.5"
                      />

                      {/* Item Showcase Group rotated facing center */}
                      <g transform={`translate(${ix}, ${iy}) rotate(${midAngle + 90})`}>
                        {/* Circular Points Emblem */}
                        <circle cx="0" cy="-6" r="20" fill="#0D1B3E" stroke="#F5B301" strokeWidth="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))" />
                        
                        {/* Points number in center */}
                        <text
                          x="0"
                          y="-5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#F5B301"
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {sector.points}
                        </text>

                        {/* Points Text */}
                        <text
                          x="0"
                          y="22"
                          textAnchor="middle"
                          fill={sector.text}
                          fontSize="9"
                          fontWeight="900"
                          fontFamily="monospace"
                          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
                        >
                          {sector.label}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Perimeter Bulbs */}
                {bulbs.map((b, idx) => (
                  <circle
                    key={idx}
                    cx={b.cx}
                    cy={b.cy}
                    r="4"
                    fill={b.isEven ? '#FEF08A' : '#FFFFFF'}
                    stroke="#B45309"
                    strokeWidth="1"
                    filter="drop-shadow(0 0 3px rgba(254,240,138,0.8))"
                  />
                ))}

                {/* Center Hub Metal Base */}
                <circle cx="150" cy="150" r="32" fill="#0D1B3E" stroke="#F5B301" strokeWidth="4" />
                <circle cx="150" cy="150" r="24" fill="url(#centerHubGold)" />
                <circle cx="150" cy="150" r="12" fill="#0D1B3E" />
              </svg>
            </div>

            {/* Central Big Spin Button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || availableSpins <= 0}
              className={`absolute z-30 flex flex-col items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-white shadow-2xl transition-all ${
                isSpinning
                  ? 'bg-slate-800 text-slate-400 scale-95'
                  : availableSpins > 0
                  ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-[#0D1B3E] hover:scale-110 active:scale-95 cursor-pointer shadow-amber-500/60 ring-4 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
              }`}
            >
              <Zap className={`h-6 w-6 sm:h-7 sm:w-7 ${availableSpins > 0 ? 'fill-current animate-bounce' : ''}`} />
              <span className="text-xs sm:text-sm font-black tracking-wider mt-0.5">
                {isSpinning ? 'تدور...' : availableSpins > 0 ? 'اضغط للف!' : 'لا لفات'}
              </span>
            </button>
          </div>

        </div>

        {/* Ways to Earn More Spins Section */}
        <div className="relative z-10 mt-3 pt-3 border-t border-amber-500/20 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Sparkles className="h-4 w-4" />
            <span>كيف تحصل على لفات إضافية وتصعد للمركز الأول؟</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500 text-[#0D1B3E] font-black text-[10px]">
                3+
              </span>
              <div>
                <strong className="text-white block">اشتراك جديد:</strong>
                <span>3 لفات عند تفعيل أي كورس جديد.</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500 text-white font-black text-[10px]">
                1+
              </span>
              <div>
                <strong className="text-white block">اجتياز امتحان:</strong>
                <span>لفة فورية عند النجاح بأكثر من 50%.</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white font-black text-[10px]">
                1+
              </span>
              <div>
                <strong className="text-white block">دخول يومي:</strong>
                <span>لفة مجانية كل يوم عند أول تسجيل دخول.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Celebration Popup when Points are won */}
      {showCelebrationModal && wonPrize && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0D1B3E] to-slate-900 border-2 border-amber-400 p-6 text-center text-white shadow-2xl shadow-amber-500/30">
            
            {/* Ambient gold glow */}
            <div className="absolute inset-0 m-auto h-48 w-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black mb-3">
              <Crown className="h-3.5 w-3.5" />
              <span>مبروك! قفزة في الترتيب ونقاط الصدارة!</span>
            </div>

            {/* Points Visual Badge */}
            <div className="relative mx-auto my-3 h-32 w-32 sm:h-36 sm:w-36 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-300 p-2 border-4 border-white shadow-2xl overflow-hidden flex flex-col items-center justify-center text-slate-950">
              <Trophy className="h-10 w-10 text-slate-950 fill-slate-950" />
              <span className="text-2xl sm:text-3xl font-black font-mono mt-1">
                +{wonPrize.points}
              </span>
              <span className="text-[11px] font-black tracking-wider uppercase">نقطة تميز</span>
            </div>

            <div className="mb-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {wonPrize.label}
              </h3>
              <p className="text-xs text-amber-300 mt-1 font-bold">
                {wonPrize.sublabel}
              </p>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                تمت إضافة النقاط بنجاح إلى رصيدك وترتيبك في لوحة الشرف لتكون الأول على المنصة!
              </p>
            </div>

            <div className="space-y-2 pt-3">
              {onOpenLeaderboard && (
                <button
                  onClick={() => {
                    setShowCelebrationModal(false);
                    onClose();
                    onOpenLeaderboard();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-[#0D1B3E] font-black text-sm hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Trophy className="h-4 w-4 text-[#0D1B3E]" />
                  <span>عرض ترتيبي في لوحة الشرف الآن</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => setShowCelebrationModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                متابعة اللف
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
