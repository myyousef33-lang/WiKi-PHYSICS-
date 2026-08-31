import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Search, 
  Clock, 
  User, 
  BookOpen, 
  CornerDownLeft,
  Star
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { LessonComment, Course } from '../types';

export const AdminCommentsTab: React.FC = () => {
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = () => {
    setComments(StorageService.getLessonComments());
    setCourses(StorageService.getCourses());
  };

  useEffect(() => {
    refresh();
    return subscribeToStorage(refresh);
  }, []);

  const handleReplySubmit = (commentId: string) => {
    if (!replyText.trim()) return;
    StorageService.replyToLessonComment(commentId, replyText.trim());
    setReplyText('');
    setReplyingId(null);
    setFeedback('تم إرسال رد الأستاذ بنجاح! سيظهر للطالب داخل الدرس.');
    refresh();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      StorageService.deleteLessonComment(commentId);
      refresh();
    }
  };

  const filteredComments = comments.filter((c) =>
    c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-amber-400" />
            <span>إدارة استفسارات وتعليقات الطلاب على الدروس</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة أسئلة الطلاب، الرد الرسمي من الأستاذ، وإدارة النقاشات التفاعلية حول المحتوى
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">إجمالي التعليقات:</span>
          <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-mono font-bold text-amber-400">
            {comments.length}
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="بحث باسم الطالب أو محتوى السؤال..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950 pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
          لا توجد تعليقات أو استفسارات مسجلة حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((cmt) => (
            <div
              key={cmt.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-sm">
                    {cmt.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{cmt.studentName}</h4>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {cmt.studentGrade}
                      </span>
                      {cmt.rating && (
                        <div className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: cmt.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      {new Date(cmt.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(cmt.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="حذف التعليق"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Student Comment Content */}
              <p className="text-xs text-slate-200 bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 leading-relaxed">
                {cmt.content}
              </p>

              {/* Existing Admin Reply */}
              {cmt.adminReply ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1 mr-6">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CornerDownLeft className="h-3.5 w-3.5" />
                      رد الأستاذ المعتمد:
                    </span>
                    {cmt.adminRepliedAt && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(cmt.adminRepliedAt).toLocaleDateString('ar-EG')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{cmt.adminReply}</p>
                </div>
              ) : (
                <div>
                  {replyingId === cmt.id ? (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="اكتب ردك التوضيحي للطالب..."
                        rows={3}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyingId(null);
                            setReplyText('');
                          }}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleReplySubmit(cmt.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>إرسال الرد</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingId(cmt.id);
                        setReplyText('');
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-slate-700"
                    >
                      <CornerDownLeft className="h-3.5 w-3.5" />
                      <span>إضافة رد رسمي</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
