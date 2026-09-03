import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  X, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { resolvePdfUrl, downloadPdfFile, getEmbedPdfSource } from '../utils/pdfHelper';

interface PdfViewerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  category?: string;
  grade?: string;
  pageCount?: number;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen = true,
  onClose,
  title,
  pdfUrl,
  category = 'مذكرة فيزياء',
  grade,
  pageCount = 35
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    let active = true;
    if (!isOpen || !pdfUrl) {
      setResolvedUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    resolvePdfUrl(pdfUrl)
      .then((url) => {
        if (active) {
          setResolvedUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to resolve PDF:', err);
        if (active) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, pdfUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadPdfFile(pdfUrl || resolvedUrl, `${title}.pdf`);
  };

  const handleOpenNewTab = () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const embedSource = getEmbedPdfSource(resolvedUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 lg:p-6"
      dir="rtl"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`relative flex flex-col w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? 'h-full max-h-screen rounded-none border-none' 
            : 'h-[92vh] max-w-6xl'
        }`}
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#080d1a] px-4 sm:px-6 py-3 shrink-0">
          
          {/* Title & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate leading-snug">
                {title || 'مذكرة فيزياء'}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                <span className="text-amber-400 font-semibold">{category}</span>
                {grade && <span>• {grade}</span>}
                {pageCount > 0 && <span>• {pageCount} صفحة</span>}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="تصغير"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-300 font-bold px-1">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="تكبير"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 transition-all"
              title="تحميل ملف الـ PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">تحميل</span>
            </button>

            {/* Open in New Tab Button */}
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              title="فتح الملف في نافذة منفصلة"
            >
              <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">تبويب جديد</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
              title="إغلاق العارض"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* Main PDF Content Stage */}
        <div className="flex-1 bg-[#050811] relative overflow-hidden flex flex-col items-center justify-center p-1 sm:p-2">
          
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050811] gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
              <p className="text-xs font-bold text-slate-300">جارٍ تهيئة وقراءة ملف الـ PDF...</p>
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-white">تعذر عرض ملف الـ PDF مباشرة داخل المتصفح</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                قد يكون الملف كبيراً أو يتطلب فتحاً مباشراً من الجهاز أو عبر تبويب منفصل.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>تحميل الملف الآن</span>
                </button>
                <button
                  onClick={handleOpenNewTab}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>فتح في تبويب مستقل</span>
                </button>
              </div>
            </div>
          )}

          {/* Renderable PDF Frame */}
          {!hasError && resolvedUrl && (
            <div 
              className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-2xl transition-transform duration-200 relative"
              style={{
                transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: 'top center'
              }}
            >
              <iframe
                src={embedSource}
                title={title}
                className="w-full h-full border-0 bg-white"
                allow="fullscreen"
                onError={() => setHasError(true)}
              />
            </div>
          )}

        </div>

        {/* Footer Status Bar */}
        <div className="border-t border-slate-800/80 bg-[#080d1a] px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">
              قارئ المذكرات الرقمية • منصة ويكيفزياء
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNewTab}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>إذا لم يظهر الملف اضغط هنا لفتحه</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

      </motion.div>

    </motion.div>
  );
};
