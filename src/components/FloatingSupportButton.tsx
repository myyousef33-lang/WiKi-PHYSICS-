import React, { useState, useEffect } from 'react';
import { Headset } from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';

interface FloatingSupportButtonProps {
  currentView: string;
}

export const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({ currentView }) => {
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const settings = StorageService.getSettings();
      setWhatsappNumber(settings.whatsappNumber || '01012345678');
    };
    update();
    return subscribeToStorage(update);
  }, []);

  // Do not render on Admin Dashboard
  if (currentView === 'admin') {
    return null;
  }

  const handleSupportClick = () => {
    const raw = whatsappNumber || '01012345678';
    const cleanNum = raw.replace(/[^0-9]/g, '');
    const phone = cleanNum.startsWith('0') ? '2' + cleanNum : cleanNum;
    const defaultMsg = encodeURIComponent('مرحبًا، محتاج مساعدة بخصوص حسابي في ويكيفزياء');
    window.open(`https://wa.me/${phone}?text=${defaultMsg}`, '_blank');
  };

  return (
    <button
      onClick={handleSupportClick}
      className="fixed bottom-6 left-6 z-40 flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#F5B301] text-[#0D1B3E] shadow-xl shadow-[#F5B301]/30 border-2 border-white/80 transition-all hover:scale-110 active:scale-95 hover:bg-[#e0a401] hover:shadow-2xl group focus:outline-none focus:ring-4 focus:ring-[#F5B301]/40"
      title="الدعم الفني والفيزيائي - تواصل عبر واتساب"
      aria-label="تواصل مع خدمة العملاء والدعم الفني"
    >
      <Headset className="h-6 w-6 sm:h-7 sm:w-7 text-[#0D1B3E] transition-transform group-hover:rotate-12" />
      
      {/* Subtle Pulsing Aura Indicator */}
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
      </span>
    </button>
  );
};
