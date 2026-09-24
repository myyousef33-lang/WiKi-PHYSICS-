import React from 'react';
import { Sparkles, BookOpen, PlayCircle, Award, FileText, ChevronLeft, Calendar } from 'lucide-react';
import { Course, QuizExam, PdfFile } from '../../types';

interface LatestContentFeedProps {
  courses: Course[];
  exams: QuizExam[];
  pdfs: PdfFile[];
  onNavigate: (view: string, params?: any) => void;
}

export const LatestContentFeed: React.FC<LatestContentFeedProps> = ({
  courses,
  exams,
  pdfs,
  onNavigate
}) => {
  // Collect latest items from courses, lessons, exams, and pdfs
  const items: Array<{
    id: string;
    type: 'course' | 'lesson' | 'exam' | 'pdf';
    title: string;
    subtitle: string;
    date?: string;
    action: () => void;
  }> = [];

  // Recent courses
  courses.slice(0, 2).forEach((c) => {
    items.push({
      id: `course-${c.id}`,
      type: 'course',
      title: c.title,
      subtitle: `كورس منهجي • ${c.grade || 'الثانوية العامة'}`,
      action: () => onNavigate('course-details', { courseId: c.id })
    });

    // Also check for lessons inside courses
    (c.units || []).forEach((u) => {
      (u.lessons || []).slice(0, 1).forEach((l) => {
        if (items.filter(i => i.type === 'lesson').length < 2) {
          items.push({
            id: `lesson-${l.id}`,
            type: 'lesson',
            title: l.title,
            subtitle: `درس جديد في ${c.title}`,
            action: () => onNavigate('lesson-player', { courseId: c.id, lessonId: l.id })
          });
        }
      });
    });
  });

  // Recent exams
  exams.slice(0, 2).forEach((e) => {
    items.push({
      id: `exam-${e.id}`,
      type: 'exam',
      title: e.title,
      subtitle: `امتحان تدريبي • ${e.durationMinutes} دقيقة`,
      date: e.createdAt,
      action: () => onNavigate('exam-runner', { examId: e.id })
    });
  });

  // Recent PDFs
  pdfs.slice(0, 2).forEach((p) => {
    items.push({
      id: `pdf-${p.id}`,
      type: 'pdf',
      title: p.title,
      subtitle: `مذكرة وقوانين • ${p.category || 'ملزمة شرح'}`,
      date: p.createdAt,
      action: () => onNavigate('pdf-library')
    });
  });

  if (items.length === 0) {
    return null;
  }

  const getTypeMeta = (type: 'course' | 'lesson' | 'exam' | 'pdf') => {
    switch (type) {
      case 'course':
        return { icon: BookOpen, color: 'text-[#1E4FD8]', bg: 'bg-blue-50 border-blue-200', tag: 'كورس' };
      case 'lesson':
        return { icon: PlayCircle, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', tag: 'درس' };
      case 'exam':
        return { icon: Award, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', tag: 'امتحان' };
      case 'pdf':
        return { icon: FileText, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', tag: 'مذكرة' };
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-[#F5B301] border border-amber-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0D1B3E]">
              أحدث المحتوى المضاف
            </h3>
            <span className="text-[11px] text-[#6B7280]">
              جديد المناهج والشروحات والاختبارات في منصة ويكيفزياء
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.slice(0, 6).map((item) => {
          const meta = getTypeMeta(item.type);
          const Icon = meta.icon;

          return (
            <div
              key={item.id}
              onClick={item.action}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F7FA] border border-slate-200/60 hover:border-blue-300 hover:bg-white transition-all cursor-pointer group shadow-2xs"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.bg} ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${meta.bg} ${meta.color}`}>
                    {meta.tag}
                  </span>
                  {item.date && (
                    <span className="text-[9px] text-[#94A3B8] font-mono">
                      {new Date(item.date).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-[#0D1B3E] truncate group-hover:text-[#1E4FD8] transition-colors">
                  {item.title}
                </h4>
                <p className="text-[10px] text-[#6B7280] truncate">
                  {item.subtitle}
                </p>
              </div>

              <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#1E4FD8] shrink-0 self-center group-hover:-translate-x-0.5 transition-transform" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
