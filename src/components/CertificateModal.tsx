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

    // Background Gradient (Dark Luxury Black / Gold / Dark Slate)
    const bg = ctx.createLinearGradient(0, 0, 1200, 850);
    bg.addColorStop(0, '#090d16');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 850);

    // Ornate Golden Border Lines
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 790);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 45, 1110, 760);

    // Corner Ornaments
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(45, 45);
    drawCorner(1155, 45);
    drawCorner(45, 805);
    drawCorner(1155, 805);

    // Top Header / Badge Logo
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚛️ منصة ويكيفزياء التعليمية - WikiFizya LMS ⚛️', 600, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText('تحت إشراف ونخبة من خبراء مادة الفيزياء للثانوية العامة', 600, 155);

    // Main Certificate Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 52px serif';
    ctx.fillText('شهـادة تفـوق وإنـجـاز دراسي 🏆', 600, 250);

    // Awarded To
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px sans-serif';
    ctx.fillText('تمنح هذه الشهادة بكل فخر للطالب / الطالبة المتميز:', 600, 330);

    // Student Name (Big Highlighted)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 48px sans-serif';
    ctx.fillText(student.name || 'طالب متميز', 600, 410);

    // Gold Divider line under name
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(350, 435);
    ctx.lineTo(850, 435);
    ctx.stroke();

    // Achievement Description
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '24px sans-serif';
    ctx.fillText(`تقديراً لاجتيازه بنجاح وتفوق باهر: "${certificate.examOrUnitName}"`, 600, 500);

    // Score Badge Box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(450, 540, 300, 70);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(450, 540, 300, 70);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`الدرجة: ${certificate.score} / ${certificate.maxScore} (${certificate.percentage}%)`, 600, 585);

    // Date & Signature Footer
    const certDate = new Date(certificate.date || Date.now()).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`تاريخ الإصدار: ${certDate}`, 1050, 740);

    ctx.textAlign = 'left';
    ctx.fillText('اعتماد مستر فيزياء ✍️', 150, 740);
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
    const text = `🎉 حصلت على شهادة تفوق في الفيزياء من منصة ويكيفزياء WikiFizya! بنسبة ${certificate.percentage}% في ${certificate.examOrUnitName}! 🔥⚛️`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl border border-orange-500/30 bg-slate-900 p-6 shadow-2xl text-right font-sans overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">شهادة التميز والتفوق 🏆</h3>
              <p className="text-xs text-slate-400">احصل على شهادتك الرسمية وشاركها مع أصدقائك وعائلتك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Certificate Canvas Preview */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-2 shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-[500px] rounded-xl object-contain shadow-2xl"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-800 mt-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
            <CheckCircle className="h-4 w-4" />
            <span>شهادة رسمية موثقة برقم الحساب</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span>مشاركة على واتساب / انستغرام</span>
            </button>

            <button
              onClick={handleDownload}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>تحميل الشهادة كصورة PNG 💾</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
