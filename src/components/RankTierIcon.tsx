import React from 'react';
import { Shield, Award, Medal, Trophy, Sparkles, Crown } from 'lucide-react';
import { RankTier } from '../utils/studentLevels';

interface RankTierIconProps {
  tier: RankTier;
  className?: string;
  useMetallicColor?: boolean;
}

export const RankTierIcon: React.FC<RankTierIconProps> = ({ 
  tier, 
  className = 'h-4 w-4',
  useMetallicColor = true 
}) => {
  const hasCustomTextColor = className.includes('text-');

  switch (tier) {
    case 'bronze': {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-[#C2410C] dark:text-[#FB923C] fill-[#C2410C]/25' 
        : '';
      return <Shield className={`${className} ${colorCls}`} />;
    }
    case 'silver': {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-slate-600 dark:text-slate-300 fill-slate-400/20' 
        : '';
      return <Award className={`${className} ${colorCls}`} />;
    }
    case 'gold': {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-amber-500 dark:text-amber-400 fill-amber-400/25' 
        : '';
      return <Medal className={`${className} ${colorCls}`} />;
    }
    case 'platinum': {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-cyan-600 dark:text-cyan-400 fill-cyan-400/25' 
        : '';
      return <Trophy className={`${className} ${colorCls}`} />;
    }
    case 'diamond': {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-400/25' 
        : '';
      return <Sparkles className={`${className} ${colorCls}`} />;
    }
    case 'master': {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-amber-500 dark:text-yellow-400 fill-amber-400/35' 
        : '';
      return <Crown className={`${className} ${colorCls}`} />;
    }
    default: {
      const colorCls = useMetallicColor && !hasCustomTextColor 
        ? 'text-[#C2410C] dark:text-[#FB923C] fill-[#C2410C]/25' 
        : '';
      return <Shield className={`${className} ${colorCls}`} />;
    }
  }
};

