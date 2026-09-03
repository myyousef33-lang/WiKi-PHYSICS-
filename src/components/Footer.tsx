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

          {/* Designed & Developed by YOUSEF EMAD */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-[#121E3E] px-4 py-2 shadow-sm hover:border-[#1E4FD8] transition-all duration-300 group cursor-default" dir="ltr">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E4FD8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E4FD8]"></span>
            </span>
            <Code2 className="h-4 w-4 text-[#1E4FD8] group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xs text-[#6B7280] dark:text-slate-400 font-sans tracking-wide">
              Designed & Engineered by <span className="font-bold text-[#1E4FD8] dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors tracking-wider">Yousef Emad</span>
            </span>
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

