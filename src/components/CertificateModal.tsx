import React, { useRef, useEffect } from 'react';
import { X, Download, Share2, Award, CheckCircle, Sparkles } from 'lucide-react';
import { Student, EarnedCertificate } from '../types';
import { triggerAchievementConfetti } from '../utils/confetti';

interface CertificateModalProps {
  student: Student;
  certificate: EarnedCertificate;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  student,
  certificate,
  isOpen,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerAchievementConfetti();
      drawCertificate();
    }
  }, [isOpen, student, certificate]);

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas Size: HD 1200 x 850
    canvas.width = 1200;
    canvas.height = 850;

    // Background (Clean Premium Cream / Off-White)
    ctx.fillStyle = '#FAFBFC';
    ctx.fillRect(0, 0, 1200, 850);

    // Subtle Watermark / Pattern Box
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 1160, 810);

    // Deep Navy & Gold Certificate Borders
    ctx.strokeStyle = '#0D1B3E';
    ctx.lineWidth = 10;
    ctx.strokeRect(36, 36, 1128, 778);

    ctx.strokeStyle = '#F5B301';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, 1100, 750);

    // Corner Ornaments
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#F5B301';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(50, 50);
    drawCorner(1150, 50);
    drawCorner(50, 800);
    drawCorner(1150, 800);

    // Top Header / Badge Logo
    ctx.fillStyle = '#1E4FD8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('منصة ويكيفزياء التعليمية - WikiFizya LMS', 600, 125);

    ctx.fillStyle = '#6B7280';
    ctx.font = '18px sans-serif';
    ctx.fillText('تحت إشراف ونخبة من خبراء مادة الفيزياء للثانوية العامة', 600, 160);

    // Main Certificate Title
    ctx.fillStyle = '#0D1B3E';
    ctx.font = 'bold 48px serif';
    ctx.fillText('شهـادة تفـوق وإنـجـاز دراسي', 600, 250);

    // Awarded To
    ctx.fillStyle = '#4B5563';
    ctx.font = '22px sans-serif';
    ctx.fillText('تمنح هذه الشهادة بكل فخر واعتزاز للطالب / الطالبة:', 600, 330);

    // Student Name (Big Highlighted in Royal Navy / Blue)
    ctx.fillStyle = '#1E4FD8';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(student.name || 'طالب متميز', 600, 405);

    // Gold Divider line under name
    ctx.strokeStyle = '#F5B301';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(360, 430);
    ctx.lineTo(840, 430);
    ctx.stroke();

    // Achievement Description
    ctx.fillStyle = '#374151';
    ctx.font = '22px sans-serif';
    ctx.fillText(`تقديراً لاجتيازه بنجاح وتفوق باهر: "${certificate.examOrUnitName}"`, 600, 495);

    // Score Badge Box
    ctx.fillStyle = '#F0FDF4';
    ctx.fillRect(450, 540, 300, 65);
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 2;
    ctx.strokeRect(450, 540, 300, 65);

    ctx.fillStyle = '#15803D';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`الدرجة: ${certificate.score} / ${certificate.maxScore} (${certificate.percentage}%)`, 600, 582);

    // Date & Signature Footer
    const certDate = new Date(certificate.date || Date.now()).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    ctx.fillStyle = '#6B7280';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`تاريخ الإصدار: ${certDate}`, 1050, 735);

    ctx.textAlign = 'left';
    ctx.fillText('اعتماد مستر فيزياء', 150, 735);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `WikiFizya_Certificate_${student.name.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = () => {
    const text = `حصلت على شهادة تفوق في الفيزياء من منصة ويكيفزياء WikiFizya بنسبة ${certificate.percentage}% في ${certificate.examOrUnitName}!`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      navigator.share({
        title: 'شهادة تفوق ويكيفزياء',
        text: text,
        url: shareUrl
      }).catch(() => {});
    } else {
      // Direct WhatsApp share fallback
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + shareUrl)}`;
      window.open(waUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-right font-sans overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-[#F5B301]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0D1B3E]">شهادة التميز والتفوق</h3>
              <p className="text-xs text-[#6B7280]">احصل على شهادتك الرسمية وشاركها مع أصدقائك وعائلتك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#6B7280] hover:bg-slate-100 hover:text-[#0D1B3E] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Certificate Canvas Preview */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-[#F5F7FA] p-3 shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-[500px] rounded-xl object-contain shadow-md"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-100 mt-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>شهادة رسمية موثقة برقم الحساب</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="rounded-xl border border-slate-200 bg-[#F5F7FA] px-4 py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-slate-100 transition-all flex items-center gap-2 shadow-xs"
            >
              <Share2 className="h-4 w-4 text-[#1E4FD8]" />
              <span>مشاركة الرابط</span>
            </button>

            <button
              onClick={handleDownload}
              className="rounded-xl bg-[#F5B301] px-5 py-2.5 text-xs font-black text-[#0D1B3E] hover:bg-[#e0a401] shadow-xs transition-all flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>تحميل الشهادة كصورة PNG</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
