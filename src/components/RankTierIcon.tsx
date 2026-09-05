import React from 'react';
import { Shield, Award, Medal, Trophy, Sparkles, Crown } from 'lucide-react';
import { RankTier } from '../utils/studentLevels';

interface RankTierIconProps {
  tier: RankTier;
  className?: string;
}

export const RankTierIcon: React.FC<RankTierIconProps> = ({ tier, className = 'h-4 w-4' }) => {
  switch (tier) {
    case 'bronze':
      return <Shield className={className} />;
    case 'silver':
      return <Award className={className} />;
    case 'gold':
      return <Medal className={className} />;
    case 'platinum':
      return <Trophy className={className} />;
    case 'diamond':
      return <Sparkles className={className} />;
    case 'master':
      return <Crown className={className} />;
    default:
      return <Shield className={className} />;
  }
};
