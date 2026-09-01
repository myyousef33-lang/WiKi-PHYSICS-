export interface AvatarOption {
  id: string;
  name: string;
  iconName: string;
  bgGradient: string;
  borderColor: string;
}

export const PRESET_AVATARS: AvatarOption[] = [
  {
    id: 'preset:atom',
    name: 'الذرة والنواة',
    iconName: 'Atom',
    bgGradient: 'from-blue-500/20 to-indigo-600/30',
    borderColor: 'border-[#1E4FD8]'
  },
  {
    id: 'preset:bolt',
    name: 'الشرارة الكهربية',
    iconName: 'Zap',
    bgGradient: 'from-amber-500/20 to-yellow-600/30',
    borderColor: 'border-amber-400'
  },
  {
    id: 'preset:quantum',
    name: 'كوانتم وليزرات',
    iconName: 'Sparkles',
    bgGradient: 'from-blue-500/20 to-cyan-600/30',
    borderColor: 'border-blue-400'
  },
  {
    id: 'preset:circuit',
    name: 'مقاومات ومكثفات',
    iconName: 'Cpu',
    bgGradient: 'from-emerald-500/20 to-teal-600/30',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'preset:light',
    name: 'المصباح الفوتوني',
    iconName: 'Lightbulb',
    bgGradient: 'from-amber-400/20 to-orange-500/30',
    borderColor: 'border-amber-400'
  },
  {
    id: 'preset:einstein',
    name: 'عالم الفيزياء',
    iconName: 'Award',
    bgGradient: 'from-purple-500/20 to-indigo-600/30',
    borderColor: 'border-purple-400'
  }
];

export const getPresetAvatar = (avatarUrl?: string): AvatarOption | null => {
  if (!avatarUrl || !avatarUrl.startsWith('preset:')) return null;
  return PRESET_AVATARS.find(a => a.id === avatarUrl) || PRESET_AVATARS[0];
};
