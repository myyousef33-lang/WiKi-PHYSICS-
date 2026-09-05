export type MascotAccessoryCategory = 'hat' | 'hoodie' | 'glasses' | 'badge' | 'shoes';
export type AccessoryRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface MascotAccessory {
  id: string;
  name: string;
  category: MascotAccessoryCategory;
  description: string;
  rarity: AccessoryRarity;
  primaryColor: string;
  accentColor: string;
  iconName: 'GraduationCap' | 'Shirt' | 'Glasses' | 'Award' | 'Sparkles' | 'Zap' | 'Crown' | 'Flame' | 'Shield' | 'Star';
  imageUrl?: string;
}

export const MASCOT_ACCESSORIES: MascotAccessory[] = [
  // --- القبعات والتيجان (Hats & Crowns) ---
  {
    id: 'hat-golden-royal',
    name: 'تاج التفوق الملكي الذهبي',
    category: 'hat',
    description: 'تاج ملكي فاخر مرصع بالأحجار الكريمة لقمة أوائل الجمهورية',
    rarity: 'legendary',
    primaryColor: '#F5B301',
    accentColor: '#FFEAA7',
    iconName: 'Crown',
    imageUrl: '/images/accessories/real_gold_crown.png'
  },
  {
    id: 'hat-classic-blue',
    name: 'قبعة التخرج الأكاديمية الحقيقية',
    category: 'hat',
    description: 'قبعة تخرج حقيقية فاخرة بشرابة حريرية ذهبية وميدالية التفوق',
    rarity: 'rare',
    primaryColor: '#1E4FD8',
    accentColor: '#60A5FA',
    iconName: 'GraduationCap',
    imageUrl: '/images/accessories/real_grad_cap.png'
  },
  {
    id: 'hat-emerald-master',
    name: 'قبعة التخرج الملكية المطرزة',
    category: 'hat',
    description: 'قبعة تخرج مخملية تمنح لأصحاب الدرجات النهائية والحلول الاستثنائية',
    rarity: 'epic',
    primaryColor: '#059669',
    accentColor: '#34D399',
    iconName: 'GraduationCap',
    imageUrl: '/images/accessories/real_grad_cap.png'
  },
  {
    id: 'hat-quantum-crown',
    name: 'تاج كوانتم الفيزياء المشع',
    category: 'hat',
    description: 'تاج ذهبي راقٍ مشع بالطاقة الكهرومغناطيسية لرواد الفيزياء الحديثة',
    rarity: 'legendary',
    primaryColor: '#7C3AED',
    accentColor: '#C084FC',
    iconName: 'Sparkles',
    imageUrl: '/images/accessories/real_gold_crown.png'
  },

  // --- الهودي والملابس (Hoodies / Outfits) ---
  {
    id: 'hoodie-gold-radiance',
    name: 'هودي فيزياء النخبة الملكي',
    category: 'hoodie',
    description: 'هودي قطني فاخر بتطريز ذهبي لمعادلات وقوانين الفيزياء',
    rarity: 'legendary',
    primaryColor: '#F5B301',
    accentColor: '#FBBF24',
    iconName: 'Shirt',
    imageUrl: '/images/accessories/real_physics_hoodie.png'
  },
  {
    id: 'hoodie-cyber-neon',
    name: 'سويت شيرت أمواج دي برولي',
    category: 'hoodie',
    description: 'تصميم واقعي مريح مستوحى من الطبيعة الموجية للجسيمات',
    rarity: 'rare',
    primaryColor: '#0284C7',
    accentColor: '#38BDF8',
    iconName: 'Zap',
    imageUrl: '/images/accessories/real_physics_hoodie.png'
  },
  {
    id: 'hoodie-tesla-crimson',
    name: 'هودي شرارة تسلا الكهرومغناطيسي',
    category: 'hoodie',
    description: 'طاقة حركية متدفقة بخامة قطنية فاخرة وشعار البرق الفيزيائي',
    rarity: 'epic',
    primaryColor: '#DC2626',
    accentColor: '#F87171',
    iconName: 'Flame',
    imageUrl: '/images/accessories/real_physics_hoodie.png'
  },
  {
    id: 'hoodie-einstein-black',
    name: 'هودي أينشتاين الملكي الفاخر',
    category: 'hoodie',
    description: 'هودي أسود كلاسيكي بأطراف ذهبية ومعادلة النسبية الشهيرة',
    rarity: 'epic',
    primaryColor: '#1E293B',
    accentColor: '#F5B301',
    iconName: 'Shield',
    imageUrl: '/images/accessories/real_physics_hoodie.png'
  },

  // --- النظارات والبصريات (Glasses / Eyewear) ---
  {
    id: 'glasses-laser-optics',
    name: 'نظارة المصمم البصرية الذكية',
    category: 'glasses',
    description: 'نظارة بصرية حقيقية بإطار أنيق وعدسات مضادة للانعكاس بالليزر',
    rarity: 'rare',
    primaryColor: '#06B6D4',
    accentColor: '#67E8F9',
    iconName: 'Glasses',
    imageUrl: '/images/accessories/real_smart_glasses.png'
  },
  {
    id: 'glasses-quantum-gold',
    name: 'نظارة الكوانتم الفاخرة',
    category: 'glasses',
    description: 'إطار معدني ذهبي راقٍ مصمم خصيصاً للرؤية والتركيز الشديد',
    rarity: 'legendary',
    primaryColor: '#F5B301',
    accentColor: '#FDE68A',
    iconName: 'Glasses',
    imageUrl: '/images/accessories/real_smart_glasses.png'
  },
  {
    id: 'glasses-cyber-visor',
    name: 'نظارة البصريات الحديثة',
    category: 'glasses',
    description: 'نظارة متطورة بعدسات بلورية لتصفية الضوء الأزرق وحل المسائل',
    rarity: 'epic',
    primaryColor: '#8B5CF6',
    accentColor: '#DDD6FE',
    iconName: 'Zap',
    imageUrl: '/images/accessories/real_smart_glasses.png'
  },

  // --- الشارات والأوسمة (Badges & Medals) ---
  {
    id: 'badge-einstein-gold',
    name: 'ميدالية التفوق الذهبية الخالصة 60/60',
    category: 'badge',
    description: 'ميدالية فيزياء ذهبية ثقيلة بشريط حريري أزرق محفورة برمز الذرة',
    rarity: 'legendary',
    primaryColor: '#F5B301',
    accentColor: '#FEF08A',
    iconName: 'Award',
    imageUrl: '/images/accessories/real_physics_medal.png'
  },
  {
    id: 'badge-full-mark',
    name: 'وسام الشرف الفيزيائي النهائي',
    category: 'badge',
    description: 'وسام التميز الأكاديمي للطلاب الحاصلين على أعلى الدرجات',
    rarity: 'epic',
    primaryColor: '#1E4FD8',
    accentColor: '#93C5FD',
    iconName: 'Star',
    imageUrl: '/images/accessories/real_physics_medal.png'
  },
  {
    id: 'badge-atomic-core',
    name: 'قلادة المفاعل النووي الذهبية',
    category: 'badge',
    description: 'قلادة تكريمية ذهبية لامعة تمنح لرواد الفيزياء الذرية',
    rarity: 'legendary',
    primaryColor: '#0EA5E9',
    accentColor: '#BAE6FD',
    iconName: 'Sparkles',
    imageUrl: '/images/accessories/real_physics_medal.png'
  },

  // --- الأحذية (Shoes / Sneakers) ---
  {
    id: 'shoes-lightning-gold',
    name: 'كوتشي البرق الذهبي الرياضي',
    category: 'shoes',
    description: 'حذاء رياضي متطور بنعل مريح وتفاصيل ذهبية أنيقة',
    rarity: 'epic',
    primaryColor: '#F5B301',
    accentColor: '#FEF08A',
    iconName: 'Zap'
  },
  {
    id: 'shoes-velocity-blue',
    name: 'كوتشي السرعة الكوانتية',
    category: 'shoes',
    description: 'حذاء رياضي أزرق مخصص للحركة السريعة والنشاط اليومي',
    rarity: 'rare',
    primaryColor: '#1E4FD8',
    accentColor: '#60A5FA',
    iconName: 'Zap'
  }
];

export const RARITY_LABELS: Record<AccessoryRarity, { label: string; color: string; bg: string; border: string }> = {
  common: {
    label: 'عادي',
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#E5E7EB'
  },
  rare: {
    label: 'نادر',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE'
  },
  epic: {
    label: 'ملحمي',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE'
  },
  legendary: {
    label: 'أسطوري',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FDE68A'
  }
};

export const CATEGORY_LABELS: Record<MascotAccessoryCategory, string> = {
  hat: 'قبعات وتيجان',
  hoodie: 'ملابس وهودي',
  glasses: 'نظارات وبصريات',
  badge: 'شارات وأوسمة',
  shoes: 'أحذية رياضية'
};
