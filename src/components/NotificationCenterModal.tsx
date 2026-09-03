import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, CheckCircle2, AlertCircle, X, Info, Sparkles, Trash2 } from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { NotificationItem, Student } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());

  useEffect(() => {
    const update = () => {
      const st = StorageService.getCurrentStudent();
      setStudent(st);
      setNotifications(StorageService.getNotificationsForStudent(st?.id, st?.grade));
    };
    update();
    return subscribeToStorage(update);
  }, []);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    if (!student) return;
    notifications.forEach(n => {
      StorageService.markNotificationRead(n.id, student.id);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">مركز الإشعارات والتنبيهات</h3>
              <p className="text-xs text-slate-400">تحديثات الدروس، الامتحانات، والإعلانات الإدارية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="mx-auto h-8 w-8 opacity-40" />
              <p className="text-xs">لا توجد إشعارات جديدة حالياً.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isRead = student && n.readBy?.includes(student.id);

              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 space-y-2 transition-all ${
                    isRead 
                      ? 'border-slate-800/60 bg-slate-950/40 opacity-75' 
                      : 'border-amber-500/30 bg-slate-950/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${isRead ? 'bg-slate-600' : 'bg-amber-400 animate-pulse'}`} />
                      <h4 className="font-bold text-sm text-white">{n.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pr-4">{n.message}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 pr-4">
                    <span>المرسل: إدارة المنصة</span>
                    {n.targetGrade && <span className="text-amber-400">{n.targetGrade}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 flex items-center justify-between text-xs">
          {student && (
            <button
              onClick={markAllAsRead}
              className="text-amber-400 hover:underline font-bold"
            >
              تحديد الكل كمقروء
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 mr-auto"
          >
            إغلاق
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
