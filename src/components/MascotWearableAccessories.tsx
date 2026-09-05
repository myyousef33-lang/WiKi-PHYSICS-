import React from 'react';

// ==========================================
// 1. WEARABLE GLASSES (نظارات أنيقة متقاطعة على العينين وجسر الأنف)
// ==========================================
export const WearableGlasses: React.FC<{
  type: string;
  isFemale: boolean;
}> = ({ type, isFemale }) => {
  const isGold = type.includes('gold') || type.includes('quantum');
  const isVisor = type.includes('visor') || type.includes('cyber');

  if (isVisor) {
    return (
      <svg viewBox="0 0 240 85" className="w-full h-auto filter drop-shadow-[0_6px_14px_rgba(147,51,234,0.6)]">
        <defs>
          <linearGradient id="cyberVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="visorGlint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Temples wrapping around ears */}
        <path d="M 12,38 Q 0,30 2,48" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 228,38 Q 240,30 238,48" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Visor shield curved over eyes */}
        <path
          d="M 10,28 Q 120,8 230,28 L 220,68 Q 120,82 20,68 Z"
          fill="url(#cyberVisorGrad)"
          stroke="#C084FC"
          strokeWidth="3.5"
        />
        {/* Glass reflection streak */}
        <path
          d="M 24,32 Q 120,15 216,32 L 210,42 Q 120,24 30,42 Z"
          fill="url(#visorGlint)"
        />
        {/* High-tech HUD lines */}
        <line x1="45" y1="36" x2="45" y2="60" stroke="#00FFFF" strokeWidth="2" strokeOpacity="0.8" />
        <line x1="55" y1="42" x2="55" y2="56" stroke="#00FFFF" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="195" y1="36" x2="195" y2="60" stroke="#00FFFF" strokeWidth="2" strokeOpacity="0.8" />
        <circle cx="120" cy="46" r="3.5" fill="#FDE047" className="animate-ping" />
      </svg>
    );
  }

  const primaryStroke = isGold ? '#F5B301' : '#0284C7';
  const highlightStroke = isGold ? '#FEF08A' : '#7DD3FC';
  const rimDark = isGold ? '#92400E' : '#075985';
  const lensFill = isGold ? 'rgba(254, 240, 138, 0.28)' : 'rgba(6, 182, 212, 0.28)';

  return (
    <svg viewBox="0 0 250 90" className="w-full h-auto filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]">
      <defs>
        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={highlightStroke} />
          <stop offset="45%" stopColor={primaryStroke} />
          <stop offset="100%" stopColor={rimDark} />
        </linearGradient>
        <linearGradient id="lensShineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Left Temple Arm behind ear */}
      <path d="M 22,40 Q 5,30 2,46" stroke="url(#frameGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      
      {/* Right Temple Arm behind ear */}
      <path d="M 228,40 Q 245,30 248,46" stroke="url(#frameGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* Left Rim & Lens */}
      <rect
        x="18"
        y="14"
        width="96"
        height="64"
        rx="28"
        fill={lensFill}
        stroke="url(#frameGrad)"
        strokeWidth="6"
      />
      {/* Left Lens Glare */}
      <path
        d="M 32,22 Q 78,22 98,42 L 88,50 Q 68,32 32,32 Z"
        fill="url(#lensShineGrad)"
      />
      <circle cx="102" cy="62" r="3" fill={highlightStroke} />

      {/* Center Bridge over Nose */}
      <path
        d="M 114,35 Q 125,24 136,35"
        stroke="url(#frameGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Secondary Top Brow Bar */}
      <path
        d="M 30,16 L 105,16"
        stroke={highlightStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 145,16 L 220,16"
        stroke={highlightStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Right Rim & Lens */}
      <rect
        x="136"
        y="14"
        width="96"
        height="64"
        rx="28"
        fill={lensFill}
        stroke="url(#frameGrad)"
        strokeWidth="6"
      />
      {/* Right Lens Glare */}
      <path
        d="M 150,22 Q 196,22 216,42 L 206,50 Q 186,32 150,32 Z"
        fill="url(#lensShineGrad)"
      />
      <circle cx="220" cy="62" r="3" fill={highlightStroke} />
    </svg>
  );
};


// ==========================================
// 2. WEARABLE NECKLACE & MEDAL (قلادة تلتف حول العنق وتتدلى على الصدر)
// ==========================================
export const WearableNecklaceMedal: React.FC<{
  type: string;
}> = ({ type }) => {
  const isStar = type.includes('mark') || type.includes('star');
  const isAtom = type.includes('atomic');

  return (
    <svg viewBox="0 0 200 240" className="w-full h-auto filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
      <defs>
        {/* Ribbon Left Stripe */}
        <linearGradient id="ribbonLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="35%" stopColor="#1E4FD8" />
          <stop offset="50%" stopColor="#F5B301" />
          <stop offset="65%" stopColor="#1E4FD8" />
          <stop offset="100%" stopColor="#0B132B" />
        </linearGradient>
        {/* Ribbon Right Stripe */}
        <linearGradient id="ribbonRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="35%" stopColor="#1E4FD8" />
          <stop offset="50%" stopColor="#F5B301" />
          <stop offset="65%" stopColor="#1E4FD8" />
          <stop offset="100%" stopColor="#0B132B" />
        </linearGradient>
        {/* Real Gold Luster Radial Gradient */}
        <radialGradient id="pureGoldLuster" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#EAB308" />
          <stop offset="88%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
        <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#F5B301" />
          <stop offset="100%" stopColor="#713F12" />
        </linearGradient>
      </defs>

      {/* 1. Left Neck Ribbon (Hanging from neck) */}
      <path
        d="M 30,0 L 92,140 L 100,140 L 48,0 Z"
        fill="url(#ribbonLeft)"
        stroke="#F5B301"
        strokeWidth="1.5"
      />

      {/* 2. Right Neck Ribbon (Hanging from neck) */}
      <path
        d="M 170,0 L 108,140 L 100,140 L 152,0 Z"
        fill="url(#ribbonRight)"
        stroke="#F5B301"
        strokeWidth="1.5"
      />

      {/* 3. Gold Loop Ring Connector */}
      <rect
        x="93"
        y="132"
        width="14"
        height="12"
        rx="4"
        fill="url(#goldBezel)"
        stroke="#FEF08A"
        strokeWidth="2"
      />
      <circle cx="100" cy="142" r="3.5" fill="#0B132B" />

      {/* 4. Large Solid Heavy Gold Physics Medal */}
      <circle
        cx="100"
        cy="182"
        r="44"
        fill="url(#pureGoldLuster)"
        stroke="url(#goldBezel)"
        strokeWidth="5.5"
      />

      {/* Textured Inner Ring */}
      <circle
        cx="100"
        cy="182"
        r="36"
        fill="none"
        stroke="#A16207"
        strokeWidth="2"
        strokeDasharray="4 2.5"
      />

      {/* Embossed Physics Emblem */}
      {isStar ? (
        <path
          d="M 100,154 L 107,172 L 126,172 L 111,184 L 116,202 L 100,190 L 84,202 L 89,184 L 74,172 L 93,172 Z"
          fill="#FEF08A"
          stroke="#78350F"
          strokeWidth="2"
        />
      ) : isAtom ? (
        <g transform="translate(100, 182)">
          <ellipse rx="26" ry="9" fill="none" stroke="#FEF08A" strokeWidth="2.5" transform="rotate(30)" />
          <ellipse rx="26" ry="9" fill="none" stroke="#FEF08A" strokeWidth="2.5" transform="rotate(-30)" />
          <ellipse rx="26" ry="9" fill="none" stroke="#FEF08A" strokeWidth="2.5" transform="rotate(90)" />
          <circle cx="0" cy="0" r="6" fill="#78350F" />
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
        </g>
      ) : (
        <g>
          <text
            x="100"
            y="178"
            textAnchor="middle"
            fill="#713F12"
            fontWeight="900"
            fontSize="18"
            fontFamily="monospace"
          >
            60/60
          </text>
          <text
            x="100"
            y="195"
            textAnchor="middle"
            fill="#854D0E"
            fontWeight="800"
            fontSize="10"
            letterSpacing="1.5"
          >
            PHYSICS
          </text>
        </g>
      )}

      {/* Top Arc Light Glint */}
      <path
        d="M 66,164 A 38 38 0 0 1 134,164"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
};


// ==========================================
// 3. WEARABLE ROYAL GOLD CROWN (تاج ملكي ثلاثي الأبعاد فوق الرأس)
// ==========================================
export const WearableCrown: React.FC<{
  type: string;
}> = ({ type }) => {
  const isPurple = type.includes('quantum');

  return (
    <svg viewBox="0 0 240 150" className="w-full h-auto filter drop-shadow-[0_10px_22px_rgba(0,0,0,0.65)]">
      <defs>
        <linearGradient id="crownGoldSolid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="65%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="crownVelvet" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isPurple ? '#581C87' : '#7F1D1D'} />
          <stop offset="50%" stopColor={isPurple ? '#A855F7' : '#DC2626'} />
          <stop offset="100%" stopColor={isPurple ? '#581C87' : '#7F1D1D'} />
        </linearGradient>
      </defs>

      {/* Velvet Interior Dome Cushion */}
      <path
        d="M 30,115 Q 120,20 210,115 Q 120,135 30,115 Z"
        fill="url(#crownVelvet)"
      />

      {/* Velvet Back Arch Structure */}
      <path
        d="M 120,24 Q 120,75 120,120"
        stroke="#CA8A04"
        strokeWidth="8"
      />

      {/* Crown Golden Peaks and Spikes */}
      <path
        d="M 24,120 
           L 36,65 L 68,92 
           L 96,44 L 120,16 L 144,44 
           L 172,92 L 204,65 
           L 216,120 
           Q 120,140 24,120 Z"
        fill="url(#crownGoldSolid)"
        stroke="#78350F"
        strokeWidth="3"
      />

      {/* Headband Base Band with Gold Trim */}
      <path
        d="M 22,118 Q 120,142 218,118 L 216,132 Q 120,154 24,132 Z"
        fill="#B45309"
        stroke="#FEF08A"
        strokeWidth="2"
      />

      {/* Center Royal Ruby / Amethyst */}
      <ellipse cx="120" cy="112" rx="11" ry="15" fill={isPurple ? '#A855F7' : '#EF4444'} stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="117" cy="107" r="3.5" fill="#FFFFFF" opacity="0.9" />

      {/* Flanking Emerald & Sapphire Jewels */}
      <ellipse cx="72" cy="116" rx="8" ry="10" fill="#10B981" stroke="#FEF08A" strokeWidth="1.5" />
      <ellipse cx="168" cy="116" rx="8" ry="10" fill="#06B6D4" stroke="#FEF08A" strokeWidth="1.5" />

      {/* Pearl Spheres on Tops of Spikes */}
      <circle cx="120" cy="16" r="8.5" fill="#FFFFFF" stroke="#FDE047" strokeWidth="2" />
      <circle cx="36" cy="65" r="6" fill="#EF4444" stroke="#FDE047" strokeWidth="2" />
      <circle cx="96" cy="44" r="6" fill="#10B981" stroke="#FDE047" strokeWidth="2" />
      <circle cx="144" cy="44" r="6" fill="#06B6D4" stroke="#FDE047" strokeWidth="2" />
      <circle cx="204" cy="65" r="6" fill="#EF4444" stroke="#FDE047" strokeWidth="2" />

      {/* Sparkle Shine Flash */}
      <path
        d="M 120,4 L 122,12 L 130,14 L 122,16 L 120,24 L 118,16 L 110,14 L 118,12 Z"
        fill="#FFFFFF"
        className="animate-pulse"
      />
    </svg>
  );
};


// ==========================================
// 4. WEARABLE GRADUATION CAP (قبعة تخرج حقيقية ثلاثية الأبعاد)
// ==========================================
export const WearableGraduationCap: React.FC<{
  type: string;
}> = ({ type }) => {
  const isEmerald = type.includes('emerald');
  const capMainColor = isEmerald ? '#064E3B' : '#0F172A';
  const capTopGrad = isEmerald ? '#047857' : '#1E293B';
  const tasselColor = '#F5B301';

  return (
    <svg viewBox="0 0 260 160" className="w-full h-auto filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)]">
      <defs>
        <linearGradient id="capBoardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={capTopGrad} />
          <stop offset="50%" stopColor={capMainColor} />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>

      {/* Under-skull Cap that sits on head */}
      <path
        d="M 75,70 Q 130,50 185,70 L 180,105 Q 130,125 80,105 Z"
        fill={capMainColor}
        stroke="#334155"
        strokeWidth="2"
      />

      {/* Diamond Board Top */}
      <polygon
        points="130,12 250,52 130,90 10,52"
        fill="url(#capBoardGrad)"
        stroke="#F5B301"
        strokeWidth="2.5"
      />
      {/* 3D Board Edges */}
      <polygon
        points="10,52 130,90 130,98 10,60"
        fill="#020617"
        opacity="0.9"
      />
      <polygon
        points="250,52 130,90 130,98 250,60"
        fill="#0F172A"
      />

      {/* Center Golden Button Pin */}
      <circle cx="130" cy="52" r="6.5" fill={tasselColor} stroke="#78350F" strokeWidth="2" />

      {/* Hanging Golden Tassel Cord */}
      <path
        d="M 130,52 Q 70,62 50,96"
        fill="none"
        stroke={tasselColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Tassel Hanging Fringe */}
      <path
        d="M 50,96 L 44,142 L 58,142 L 52,96 Z"
        fill={tasselColor}
        stroke="#78350F"
        strokeWidth="1.5"
      />
      <circle cx="51" cy="99" r="5" fill="#FEF08A" />
    </svg>
  );
};
