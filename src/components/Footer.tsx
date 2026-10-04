import React from 'react';
import { Send, Phone, ShieldCheck, Zap, Sparkles, Code2, Heart } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate?: (view: string, params?: any) => void;
  onOpenActivationModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenActivationModal }) => {
  const settings = StorageService.getSettings();

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B132B] text-[#6B7280] dark:text-slate-400 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* Brand & Teacher Card */}
          <div className="space-y-4 md:col-span-2">
            <Logo size="md" />

            <p className="text-sm leading-relaxed text-[#6B7280] dark:text-slate-300">
              المنصة المتخصصة الأولى في شرح وتبسيط مادة الفيزياء لطلاب المرحلة الثانوية العامة واللغات. 
              نقدم تجربة تعليمية رائدة تجمع بين الفهم العميق، بنك الأسئلة المطور، والامتحانات الدورية مع المتابعة المستمرة.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-[#121E3E] px-3 py-1.5 text-xs text-[#0D1B3E] dark:text-slate-200 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                حماية أجهزة ومتابعة دورية
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-[#121E3E] px-3 py-1.5 text-xs text-[#0D1B3E] dark:text-slate-200 font-medium">
                <Zap className="h-4 w-4 text-[#F5B301]" />
                تصحيح امتحانات فوري
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0D1B3E] dark:text-white uppercase tracking-wider">محتوى المنهج</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('courses-catalog')}
                  className="text-[#6B7280] dark:text-slate-400 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer text-right"
                >
                  فيزياء الصف الثالث الثانوي (3ث)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('courses-catalog')}
                  className="text-[#6B7280] dark:text-slate-400 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer text-right"
                >
                  فيزياء الصف الثاني الثانوي (2ث)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('courses-catalog')}
                  className="text-[#6B7280] dark:text-slate-400 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer text-right"
                >
                  فيزياء الصف الأول الثانوي (1ث)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('pdf-library')}
                  className="text-[#6B7280] dark:text-slate-400 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer text-right"
                >
                  مذكرات الشرح وبنوك الأسئلة
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('courses-catalog')}
                  className="text-[#6B7280] dark:text-slate-400 hover:text-[#1E4FD8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer text-right"
                >
                  الامتحانات الشاملة والتجريبية
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0D1B3E] dark:text-white uppercase tracking-wider">الدعم والتواصل</h4>
            <p className="text-xs text-[#6B7280] dark:text-slate-400">لشراء أكواد التفعيل والمذكرات أو الاستفسارات المباشرة:</p>
            
            <div className="space-y-2">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>واتساب الدعم: {settings.whatsappNumber}</span>
              </a>

              <a
                href={settings.telegramChannel}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2.5 text-xs font-bold text-[#1E4FD8] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Send className="h-4 w-4 text-[#1E4FD8] dark:text-blue-400" />
                <span>قناة التليجرام الرسمية</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar with English Developer Signature */}
        <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] dark:text-slate-400">
          <p>© {new Date().getFullYear()} منصة ويكي فيزياء التعليمية — جميع الحقوق محفوظة</p>

          {/* Developer Signature */}
          <div
            className="group relative inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-[#101A34]/90 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1E4FD8]/40 hover:shadow-[0_12px_34px_rgba(30,79,216,0.12)]"
            dir="ltr"
            aria-label="Designed and developed by Yousef Emad"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#0D1B3E] via-[#1E4FD8] to-[#38BDF8] shadow-[0_5px_18px_rgba(30,79,216,0.28)]">
              <span className="text-[11px] font-black tracking-tight text-white">YE</span>
              <span className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white/15 blur-md" />
            </div>

            <div className="flex flex-col leading-none">
              <span className="mb-1 text-[8px] font-bold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Designed & Developed by
              </span>
              <span className="text-sm font-black tracking-[0.08em] text-[#0D1B3E] dark:text-white transition-colors group-hover:text-[#1E4FD8] dark:group-hover:text-sky-300">
                YOUSEF EMAD
              </span>
              <span className="mt-1 text-[8px] font-medium tracking-[0.18em] text-slate-400 dark:text-slate-500">
                WEB DEVELOPER • WiKi-PHYSICS
              </span>
            </div>

            <Code2 className="ml-1 h-4 w-4 text-[#1E4FD8]/70 transition-transform duration-300 group-hover:rotate-12 group-hover:text-[#1E4FD8] dark:text-sky-300/70" />
          </div>

          <div className="flex items-center gap-2 text-[#0D1B3E] dark:text-slate-200 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-[#F5B301]" />
            <span>نحو الدرجة النهائية في الفيزياء</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

