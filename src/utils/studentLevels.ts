import { Student, LeaderboardEntry } from '../types';

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export interface StudentRankLevel {
  level: number;
  tier: RankTier;
  title: string;
  badge: string; // Text badge code e.g. BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER
  iconName: 'Shield' | 'Award' | 'Medal' | 'Trophy' | 'Sparkles' | 'Crown';
  minPoints: number;
  maxPoints: number;
  color: string;
  bgGradient: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  description: string;
}

export const STUDENT_LEVELS: StudentRankLevel[] = [
  {
    level: 1,
    tier: 'bronze',
    title: 'برونزي (Bronze)',
    badge: 'برونزي',
    iconName: 'Shield',
    minPoints: 0,
    maxPoints: 249,
    color: '#CD7F32',
    bgGradient: 'from-amber-700 via-amber-800 to-amber-950',
    borderClass: 'border-amber-600/50 dark:border-amber-700/60',
    textClass: 'text-amber-800 dark:text-amber-300',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    description: 'رتبة الانطلاق في استيعاب ومراجعة أساسيات وقوانين الفيزياء'
  },
  {
    level: 2,
    tier: 'silver',
    title: 'فضي (Silver)',
    badge: 'فضي',
    iconName: 'Award',
    minPoints: 250,
    maxPoints: 499,
    color: '#94A3B8',
    bgGradient: 'from-slate-400 via-slate-500 to-slate-700',
    borderClass: 'border-slate-300 dark:border-slate-600',
    textClass: 'text-slate-700 dark:text-slate-200',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    description: 'إتقان حل مسائل الدوائر الكهربية، كيرشوف، وتطبيقات المقاومات'
  },
  {
    level: 3,
    tier: 'gold',
    title: 'ذهبي (Gold)',
    badge: 'ذهبي',
    iconName: 'Medal',
    minPoints: 500,
    maxPoints: 999,
    color: '#F59E0B',
    bgGradient: 'from-amber-400 via-amber-500 to-yellow-600',
    borderClass: 'border-amber-400 dark:border-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-600',
    description: 'تفوق ملحوظ في الحث الكهرومغناطيسي، التيارات المترددة، والدينامو'
  },
  {
    level: 4,
    tier: 'platinum',
    title: 'بلاتينيوم (Platinum)',
    badge: 'بلاتينيوم',
    iconName: 'Trophy',
    minPoints: 1000,
    maxPoints: 1999,
    color: '#0891B2',
    bgGradient: 'from-cyan-500 via-teal-600 to-cyan-800',
    borderClass: 'border-cyan-400 dark:border-cyan-500',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-600',
    description: 'مستوى احترافي عالي في الفيزياء الحديثة، الكوانتم، وأجهزة القياس'
  },
  {
    level: 5,
    tier: 'diamond',
    title: 'ماسي (Diamond)',
    badge: 'ماسي',
    iconName: 'Sparkles',
    minPoints: 2000,
    maxPoints: 3499,
    color: '#6366F1',
    bgGradient: 'from-indigo-500 via-purple-600 to-indigo-800',
    borderClass: 'border-indigo-400 dark:border-indigo-500',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-600',
    description: 'نخبة متميزة تتجاوز أصعب أفكار امتحانات الثانوية العامة بدقة متناهية'
  },
  {
    level: 6,
    tier: 'master',
    title: 'ماستر أوائل الجمهورية (Master)',
    badge: 'ماستر',
    iconName: 'Crown',
    minPoints: 3500,
    maxPoints: 999999,
    color: '#E11D48',
    bgGradient: 'from-rose-600 via-amber-500 to-purple-800',
    borderClass: 'border-rose-400 dark:border-rose-500',
    textClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-gradient-to-r from-amber-200 to-yellow-300 text-slate-950 border-amber-400 font-black',
    description: 'المرشح الأبرز للمركز الأول على مستوى الجمهورية والدرجة النهائية 60 من 60'
  }
];

export interface StudentRankStats {
  points: number;
  rank: number; // 1, 2, 3...
  totalStudents: number;
  isFirstOnPlatform: boolean;
  isTopThree: boolean;
  isTopTen: boolean;
  level: StudentRankLevel;
  nextLevel: StudentRankLevel | null;
  progressToNextLevel: number; // 0 to 100
  pointsToNextLevel: number;
  weeklyPoints: number;
  completedExamsCount: number;
  rankTitleArabic: string;
}

export function calculateStudentRankStats(
  student: Student | null,
  leaderboard: LeaderboardEntry[] = []
): StudentRankStats {
  if (!student) {
    const defaultLevel = STUDENT_LEVELS[0];
    return {
      points: 0,
      rank: leaderboard.length + 1,
      totalStudents: Math.max(1, leaderboard.length),
      isFirstOnPlatform: false,
      isTopThree: false,
      isTopTen: false,
      level: defaultLevel,
      nextLevel: STUDENT_LEVELS[1],
      progressToNextLevel: 0,
      pointsToNextLevel: 250,
      weeklyPoints: 0,
      completedExamsCount: 0,
      rankTitleArabic: 'طالب فيزيائي'
    };
  }

  // Find in leaderboard
  const studentEntry = leaderboard.find(e => e.studentId === student.id);
  const points = studentEntry?.points ?? 50;
  const weeklyPoints = studentEntry?.weeklyScore ?? 20;
  const completedExamsCount = studentEntry?.completedExamsCount ?? 0;

  // Rank position (1-based)
  const sorted = [...leaderboard].sort((a, b) => b.points - a.points);
  let rankIndex = sorted.findIndex(e => e.studentId === student.id);
  const rank = rankIndex !== -1 ? rankIndex + 1 : Math.max(1, sorted.length);
  const totalStudents = Math.max(1, sorted.length);

  const isFirstOnPlatform = rank === 1;
  const isTopThree = rank <= 3;
  const isTopTen = rank <= 10;

  // Determine Level based on points
  let level = STUDENT_LEVELS[0];
  let nextLevel: StudentRankLevel | null = STUDENT_LEVELS[1];

  for (let i = 0; i < STUDENT_LEVELS.length; i++) {
    const lvl = STUDENT_LEVELS[i];
    if (points >= lvl.minPoints && points <= lvl.maxPoints) {
      level = lvl;
      nextLevel = i < STUDENT_LEVELS.length - 1 ? STUDENT_LEVELS[i + 1] : null;
      break;
    }
  }

  // If points exceed all levels, top level
  if (points >= STUDENT_LEVELS[STUDENT_LEVELS.length - 1].minPoints) {
    level = STUDENT_LEVELS[STUDENT_LEVELS.length - 1];
    nextLevel = null;
  }

  // Progress to next level
  let progressToNextLevel = 100;
  let pointsToNextLevel = 0;

  if (nextLevel) {
    const levelRange = nextLevel.minPoints - level.minPoints;
    const currentProgress = points - level.minPoints;
    progressToNextLevel = Math.min(100, Math.max(0, Math.round((currentProgress / levelRange) * 100)));
    pointsToNextLevel = Math.max(0, nextLevel.minPoints - points);
  }

  // Rank Title (strictly without emojis)
  let rankTitleArabic = `الترتيب #${rank} على المنصة`;
  if (isFirstOnPlatform) {
    rankTitleArabic = 'المركز الأول على مستوى المنصة والجمهورية';
  } else if (rank === 2) {
    rankTitleArabic = 'المركز الثاني على المنصة';
  } else if (rank === 3) {
    rankTitleArabic = 'المركز الثالث على المنصة';
  } else if (isTopTen) {
    rankTitleArabic = `من أوائل الجمهورية (المركز #${rank})`;
  }

  return {
    points,
    rank,
    totalStudents,
    isFirstOnPlatform,
    isTopThree,
    isTopTen,
    level,
    nextLevel,
    progressToNextLevel,
    pointsToNextLevel,
    weeklyPoints,
    completedExamsCount,
    rankTitleArabic
  };
}

