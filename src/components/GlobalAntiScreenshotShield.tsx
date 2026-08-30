import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, EyeOff } from 'lucide-react';

interface GlobalAntiScreenshotShieldProps {
  children: React.ReactNode;
}

export const GlobalAntiScreenshotShield: React.FC<GlobalAntiScreenshotShieldProps> = ({ children }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<'screenshot' | 'blur'>('screenshot');

  useEffect(() => {
    let unblockTimer: NodeJS.Timeout;

    const triggerBlock = (reason: 'screenshot' | 'blur') => {
      setBlockReason(reason);
      setIsBlocked(true);

      // Wipe clipboard if possible
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('🔒 محتوى منصة ويكيفزياء محمي ضد الالتقاط والتصوير').catch(() => {});
      }

      if (reason === 'screenshot') {
        clearTimeout(unblockTimer);
        unblockTimer = setTimeout(() => {
          setIsBlocked(false);
        }, 3000);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrtScn = e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen';
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Detect Windows Snipping Tool (Win+Shift+S) or Mac Screenshot (Cmd+Shift+3/4/5/S)
      // or Ctrl+P, Ctrl+S, F12, Ctrl+Shift+I/C/J
      const isScreenshotShortcut =
        isPrtScn ||
        (e.key === 'S' && e.shiftKey && (e.metaKey || e.ctrlKey)) ||
        (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) ||
        (isCmdOrCtrl && ['p', 'P', 's', 'S', 'u', 'U'].includes(e.key)) ||
        (isCmdOrCtrl && e.shiftKey && ['i', 'I', 's', 'S', 'c', 'C', 'j', 'J'].includes(e.key)) ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        e.key === 'F12';

      if (isScreenshotShortcut) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlock('screenshot');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerBlock('screenshot');
      }
    };

    // When OS Screenshot tool or any background app takes focus away from the browser
    const handleWindowBlur = () => {
      triggerBlock('blur');
    };

    const handleWindowFocus = () => {
      // Unblock 500ms after focus returns so screenshot tool doesn't capture content
      setTimeout(() => {
        setIsBlocked(false);
      }, 500);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerBlock('blur');
      } else {
        setTimeout(() => {
          setIsBlocked(false);
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(unblockTimer);
    };
  }, []);

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-screen w-full select-none protected-page"
      style={{
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Black Shield Screen Overlay */}
      {isBlocked && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black p-6 text-center animate-fadeIn font-sans">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/20 border-2 border-rose-500/50 text-rose-500 mb-6 animate-pulse">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-wide mb-3">
            🛑 عذراً! غير مسموح بأخذ سكرين شوت
          </h2>

          <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-6 font-medium">
            محتوى منصة <strong className="text-amber-400">ويكيفزياء WikiFizya</strong> محمي بالكامل ضد تصوير وتسجيل الشاشة لحفظ حقوق النشر والتأليف.
          </p>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-5 py-3 text-xs text-amber-300 font-bold">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>نظام الحماية الرقمية DRM مفعّل لحماية الكورسات</span>
          </div>
        </div>
      )}

      {/* Render Application Content */}
      <div className={isBlocked ? 'filter blur-3xl opacity-0 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};
