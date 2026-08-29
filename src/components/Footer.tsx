import React from 'react';
import { Send, Phone, ShieldCheck, Zap, Sparkles, Code2, Heart } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const settings = StorageService.getSettings();

  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/90 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* Brand & Teacher Card */}
          <div className="space-y-4 md:col-span-2">
            <Logo size="md" />

            <p className="text-sm leading-relaxed text-slate-400">
              المنصة المتخصصة الأولى في شرح وتبسيط مادة الفيزياء لطلاب المرحلة الثانوية العامة واللغات. 
              نقدم تجربة تعليمية رائدة تجمع بين الفهم العميق، بنك الأسئلة المطور، والامتحانات الدورية مع المتابعة المستمرة.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                حماية أجهزة ومتابعة دورية
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
                <Zap className="h-4 w-4 text-amber-400" />
                تصحيح امتحانات فوري
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">محتوى المنهج</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">فيزياء الصف الثالث الثانوي (3ث)</span></li>
              <li><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">فيزياء الصف الثاني الثانوي (2ث)</span></li>
              <li><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">فيزياء الصف الأول الثانوي (1ث)</span></li>
              <li><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">مذكرات الشرح وبنوك الأسئلة</span></li>
              <li><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">الامتحانات الشاملة والتجريبية</span></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">الدعم والتواصل</h4>
            <p className="text-xs text-slate-400">لشراء أكواد التفعيل والمذكرات أو الاستفسارات المباشرة:</p>
            
            <div className="space-y-2">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>واتساب الدعم: {settings.whatsappNumber}</span>
              </a>

              <a
                href={settings.telegramChannel}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3.5 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Send className="h-4 w-4 text-blue-400" />
                <span>قناة التليجرام الرسمية</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar with English Developer Signature */}
        <div className="mt-10 border-t border-slate-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} منصة ويكيفزياء التعليمية — جميع الحقوق محفوظة</p>

          {/* Designed & Developed by YOUSEF EMAD */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-slate-900/90 px-4 py-2 shadow-lg shadow-amber-500/5 hover:border-amber-400/60 transition-all duration-300 group cursor-default" dir="ltr">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Code2 className="h-4 w-4 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xs text-slate-300 font-sans tracking-wide">
              Designed & Engineered by <span className="font-bold text-amber-400 group-hover:text-amber-300 transition-colors tracking-wider">Yousef Emad</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>نحو الدرجة النهائية في الفيزياء 🎯</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

