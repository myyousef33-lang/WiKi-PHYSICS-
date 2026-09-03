import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X, CheckCircle2, MessageSquare, Send, Award } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Student, Course } from '../types';

interface CourseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  student: Student | null;
  onOpenAuthModal: () => void;
  onReviewSubmitted: () => void;
}

export const CourseReviewModal: React.FC<CourseReviewModalProps> = ({
  isOpen,
  onClose,
  course,
  student,
  onOpenAuthModal,
  onReviewSubmitted
}) => {
  const existingReview = course.reviews?.find(r => r.studentId === student?.id);

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const ratingDescriptions: Record<number, string> = {
    5: '⭐ ممتاز جداً (5/5) — شرح رائع ومتقن',
    4: '⭐ جيد جداً (4/5) — مفيد وواضح',
    3: '⭐ جيد (3/5) — مناسب ومفهوم',
    2: '⭐ مقبول (2/5) — يحتاج لمزيد من التوضيح',
    1: '⭐ ضعيف (1/5) — واجهت صعوبات'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) {
      onOpenAuthModal();
      return;
    }

    setIsSubmitting(true);
    const result = StorageService.addCourseReview(course.id, {
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatarUrl,
      rating: rating,
      comment: comment
    });

    setIsSubmitting(false);
    if (result.success) {
      setSuccessMsg(result.message);
      onReviewSubmitted();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#16224D] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F5B301] via-[#1E4FD8] to-[#F5B301]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-[#0D1B3E] dark:text-white truncate">
              تقييم كورس: {course.title}
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-slate-400">
              رأيك يهمنا ويساعد زملاءك الطلاب في اختيار الكورس الأنسب
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg ? (
          <div className="p-6 my-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">{successMsg}</p>
          </div>
        ) : !student ? (
          /* Not Logged In State */
          <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-center space-y-4 my-2">
            <MessageSquare className="h-10 w-10 text-[#1E4FD8] dark:text-[#60A5FA] mx-auto" />
            <p className="text-xs text-[#0D1B3E] dark:text-slate-200 font-bold">
              يرجى تسجيل الدخول بحسابك أولاً حتى تتمكن من تقييم الكورس ومشاركة رأيك
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="rounded-2xl bg-[#1E4FD8] hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              تسجيل الدخول الآن
            </button>
          </div>
        ) : (
          /* Interactive Rating Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Info Pill */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[#6B7280] dark:text-slate-400">التقييم باسم:</span>
              <span className="font-bold text-[#0D1B3E] dark:text-white">{student.name}</span>
            </div>

            {/* Star Selector */}
            <div className="space-y-2 text-center p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <span className="text-xs font-bold text-[#0D1B3E] dark:text-slate-200 block">
                اختر عدد النجوم:
              </span>
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      title={`${star} نجوم`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          isFilled
                            ? 'fill-[#F5B301] text-[#F5B301] drop-shadow-md'
                            : 'fill-transparent text-slate-300 dark:text-slate-600 hover:text-[#F5B301]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                {ratingDescriptions[hoverRating || rating]}
              </p>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0D1B3E] dark:text-slate-200 flex items-center justify-between">
                <span>رأيك أو تعليقك على الكورس (اختياري):</span>
                <span className="text-[10px] text-[#6B7280]">حتى 300 حرف</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="اكتب هنا رأيك في أسلوب الشرح، الأمثلة والمسائل الفيزيائية، تنظيم المحاضرات..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-3 text-xs text-[#0D1B3E] dark:text-white placeholder:text-slate-400 focus:border-[#1E4FD8] focus:outline-none resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-[#1E4FD8] hover:bg-blue-700 py-3 text-xs font-black text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'جارٍ الحفظ...' : existingReview ? 'تحديث التقييم' : 'إرسال التقييم'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-3 text-xs font-bold text-[#6B7280] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};
