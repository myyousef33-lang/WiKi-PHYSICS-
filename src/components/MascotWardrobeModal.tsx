import React, { useState } from 'react';
import { 
  X, 
  Shirt, 
  Sparkles, 
  Crown, 
  GraduationCap, 
  Glasses, 
  Award, 
  Zap, 
  Flame, 
  Shield, 
  Star, 
  Check, 
  Lock, 
  Gift, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Student } from '../types';
import { 
  MASCOT_ACCESSORIES, 
  MascotAccessory, 
  MascotAccessoryCategory, 
  RARITY_LABELS, 
  CATEGORY_LABELS 
} from '../data/mascotAccessories';
import { MascotWithAccessories } from './MascotWithAccessories';
import { StorageService } from '../services/storage';

interface MascotWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onStudentUpdated: (updated: Student) => void;
  onOpenLuckyWheel?: () => void;
}

const renderSvgIcon = (iconName: string, className = 'h-5 w-5') => {
  switch (iconName) {
    case 'Crown':
      return <Crown className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Shirt':
      return <Shirt className={className} />;
    case 'Glasses':
      return <Glasses className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Star':
      return <Star className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const MascotWardrobeModal: React.FC<MascotWardrobeModalProps> = ({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
  onOpenLuckyWheel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MascotAccessoryCategory | 'all'>('all');
  const [equipped, setEquipped] = useState<{
    hat?: string;
    hoodie?: string;
    glasses?: string;
    badge?: string;
    shoes?: string;
  }>(student.equippedAccessories || {});

  if (!isOpen) return null;

  const unlockedIds = student.unlockedAccessories || [];
  const availableSpins = student.wheelSpins || 0;

  const filteredAccessories = selectedCategory === 'all'
    ? MASCOT_ACCESSORIES
    : MASCOT_ACCESSORIES.filter(a => a.category === selectedCategory);

  const handleToggleEquip = (accessory: MascotAccessory) => {
    const isCurrentlyEquipped = equipped[accessory.category] === accessory.id;
    const nextEquipped = { ...equipped };

    if (isCurrentlyEquipped) {
      delete nextEquipped[accessory.category];
    } else {
      nextEquipped[accessory.category] = accessory.id;
    }

    setEquipped(nextEquipped);

    // Save immediately
    const updated: Student = {
      ...student,
      equippedAccessories: nextEquipped
    };
    StorageService.saveStudent(updated);
    StorageService.setCurrentStudent(updated);
    onStudentUpdated(updated);
  };

  const handleResetAll = () => {
    const nextEquipped = {};
    setEquipped(nextEquipped);
    const updated: Student = {
      ...student,
      equippedAccessories: nextEquipped
    };
    StorageService.saveStudent(updated);
    StorageService.setCurrentStudent(updated);
    onStudentUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-l from-blue-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E4FD8] text-white shadow-md shadow-blue-500/20">
              <Shirt className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
                خزانة ملابس الشخصية
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                اختر ونسّق الإكسسوارات المفتوحة لشخصيتك الكرتونية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLuckyWheel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLuckyWheel();
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-black hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
              >
                <Gift className="h-4 w-4 text-[#F5B301]" />
                <span className="hidden xs:inline">عجلة الحظ</span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-400 text-[#0D1B3E] text-[10px] font-black">
                  {availableSpins}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#0D1B3E] transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body: 2 Columns (Preview & Wardrobe Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1">
          
          {/* Left / Top Column: Live Mascot Preview */}
          <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/70 via-slate-50 to-white p-5 sm:p-6 border-b lg:border-b-0 lg:border-l border-slate-200 flex flex-col items-center justify-between">
            
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0D1B3E] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#F5B301]" />
                <span>المعاينة المباشرة للشخصية</span>
              </span>

              {Object.keys(equipped).length > 0 && (
                <button
                  onClick={handleResetAll}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>نزع الكل</span>
                </button>
              )}
            </div>

            {/* Live Character Layer View */}
            <div className="relative w-52 sm:w-60 lg:w-64 my-auto py-2 flex items-center justify-center">
              {/* Decorative Backdrop Glow */}
              <div className="absolute inset-0 m-auto h-44 w-44 rounded-full bg-blue-300/30 blur-2xl pointer-events-none" />
              
              <MascotWithAccessories
                gender={student.gender}
                equippedAccessories={equipped}
                isHalfBody={true}
                className="w-full"
              />
            </div>

            {/* Currently Equipped Summary Pills */}
            <div className="w-full pt-3 border-t border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                الإكسسوارات المفعلة ({Object.keys(equipped).length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(equipped).length === 0 ? (
                  <span className="text-xs text-slate-400 italic">الشخصية بالمظهر الأساسي</span>
                ) : (
                  Object.entries(equipped).map(([cat, id]) => {
                    const item = MASCOT_ACCESSORIES.find(a => a.id === id);
                    if (!item) return null;
                    return (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#1E4FD8] text-xs font-bold"
                      >
                        {renderSvgIcon(item.iconName, 'h-3.5 w-3.5')}
                        <span>{item.name}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Categories & Accessories Grid */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col overflow-y-auto space-y-4">
            
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#0D1B3E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({MASCOT_ACCESSORIES.length})
              </button>

              {(['hat', 'hoodie', 'glasses', 'badge', 'shoes'] as MascotAccessoryCategory[]).map(cat => {
                const count = MASCOT_ACCESSORIES.filter(a => a.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#1E4FD8] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Accessories Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-0.5">
              {filteredAccessories.map(accessory => {
                const isUnlocked = unlockedIds.includes(accessory.id);
                const isCurrentlyEquipped = equipped[accessory.category] === accessory.id;
                const rarityMeta = RARITY_LABELS[accessory.rarity];

                return (
                  <div
                    key={accessory.id}
                    className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isCurrentlyEquipped
                        ? 'border-[#1E4FD8] bg-blue-50/60 shadow-xs'
                        : isUnlocked
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-200/60 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden p-1"
                      >
                        {accessory.imageUrl ? (
                          <img
                            src={accessory.imageUrl}
                            alt={accessory.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <div 
                            className="w-full h-full rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: isUnlocked ? accessory.primaryColor : '#94A3B8',
                              color: '#FFFFFF'
                            }}
                          >
                            {renderSvgIcon(accessory.iconName, 'h-6 w-6')}
                          </div>
                        )}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                            <Lock className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-black"
                            style={{
                              backgroundColor: rarityMeta.bg,
                              color: rarityMeta.color,
                              border: `1px solid ${rarityMeta.border}`
                            }}
                          >
                            {rarityMeta.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {CATEGORY_LABELS[accessory.category]}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-[#0D1B3E] truncate">
                          {accessory.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {accessory.description}
                        </p>
                      </div>
                    </div>

                    {/* Action button inside card */}
                    <div className="pt-1">
                      {isUnlocked ? (
                        <button
                          onClick={() => handleToggleEquip(accessory)}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isCurrentlyEquipped
                              ? 'bg-[#1E4FD8] text-white hover:bg-blue-700 shadow-xs'
                              : 'bg-slate-100 hover:bg-blue-50 text-[#0D1B3E] hover:text-[#1E4FD8] border border-slate-200'
                          }`}
                        >
                          {isCurrentlyEquipped ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>مُرتدى الآن (انقر للنزع)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                              <span>ارتداء على الشخصية</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 text-slate-500 text-[11px] font-bold">
                          <span className="flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                            <span>مغلق</span>
                          </span>
                          <span className="text-[10px] text-amber-700">من عجلة الحظ</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            تم فتح <strong className="text-[#0D1B3E]">{unlockedIds.length}</strong> من إجمالي <strong className="text-[#0D1B3E]">{MASCOT_ACCESSORIES.length}</strong> إكسسوار متاح.
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0D1B3E] text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-all cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>

      </div>

    </div>
  );
};
