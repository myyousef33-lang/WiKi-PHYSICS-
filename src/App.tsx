import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeLandingView } from './components/HomeLandingView';
import { StudentDashboard } from './components/StudentDashboard';
import { MyCoursesView } from './components/MyCoursesView';
import { CourseCatalogView } from './components/CourseCatalogView';
import { CourseDetailsView } from './components/CourseDetailsView';
import { LessonRoomView } from './components/LessonRoomView';
import { QuizExamView } from './components/QuizExamView';
import { ExamResultView } from './components/ExamResultView';
import { MyResultsView } from './components/MyResultsView';
import { PdfLibraryView } from './components/PdfLibraryView';
import { LeaderboardView } from './components/LeaderboardView';
import { WeaknessAnalysisView } from './components/WeaknessAnalysisView';
import { AIPhysicsAssistant } from './components/AIPhysicsAssistant';
import { ActivationCodeModal } from './components/ActivationCodeModal';
import { AuthModal } from './components/AuthModal';
import { AdminSecretModal } from './components/AdminSecretModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { EditProfileModal } from './components/EditProfileModal';
import { PhysicsSimulationsLab } from './components/PhysicsSimulationsLab';
import { FlashcardsView } from './components/FlashcardsView';
import { CertificateModal } from './components/CertificateModal';
import { GlobalAntiScreenshotShield } from './components/GlobalAntiScreenshotShield';
import { StudentWalletModal } from './components/StudentWalletModal';
import { FloatingSupportButton } from './components/FloatingSupportButton';
import { StorageService, subscribeToStorage } from './services/storage';
import { PresenceService } from './services/presence';
import { EarnedCertificate, Student } from './types';

// Code Splitting: Lazy load only the AdminDashboard component
const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  const [student, setStudent] = useState<Student | null>(StorageService.getCurrentStudent());
  
  // Modals
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminSecretOpen, setIsAdminSecretOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<EarnedCertificate | null>(null);

  useEffect(() => {
    // Initialize presence heartbeat and listener
    PresenceService.initPresence();

    const updateStudent = () => {
      setStudent(StorageService.getCurrentStudent());
    };
    updateStudent();
    return subscribeToStorage(updateStudent);
  }, []);

  // Global Keyboard Shortcut for Secret Admin Access & Route-based Hash Check
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
        e.preventDefault();
        setIsAdminSecretOpen(true);
      }
    };

    const checkHashRoute = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'admin' || hash === 'admin-portal' || hash === 'portal' || hash === 'control') {
        if (StorageService.isAdminLoggedIn()) {
          setCurrentView('admin');
        } else {
          setIsAdminSecretOpen(true);
        }
      }
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', checkHashRoute);
    };
  }, []);

  const handleNavigate = (view: string, params: Record<string, any> = {}) => {
    let targetView = view === 'courses' ? 'courses-catalog' : view;

    // If navigating to admin but not logged in as admin, trigger secret modal instead
    if (targetView === 'admin') {
      if (!StorageService.isAdminLoggedIn()) {
        setIsAdminSecretOpen(true);
        return;
      }
      window.location.hash = 'admin';
    } else if (currentView === 'admin') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    setCurrentView(targetView);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    handleNavigate('dashboard');
  };

  const handleActivationSuccess = (targetType: string, targetId?: string) => {
    if (targetType === 'course' && targetId) {
      handleNavigate('course-details', { courseId: targetId });
    } else if (targetType === 'pdf') {
      handleNavigate('pdf-library');
    } else {
      handleNavigate('my-courses');
    }
  };

  return (
    <GlobalAntiScreenshotShield>
      <div className="min-h-screen bg-[#F5F7FA] text-[#0D1B3E] flex flex-col font-sans selection:bg-[#1E4FD8] selection:text-white overflow-x-hidden max-w-full w-full relative">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenActivationModal={() => setIsActivationModalOpen(true)}
        onOpenAuthModal={() => handleOpenAuth('login')}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
      />

      {/* Main Content Area with Smooth Page/View Transitions */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView + (viewParams.courseId || '') + (viewParams.lessonId || '') + (viewParams.attemptId || '') + (viewParams.examId || '')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-h-[calc(100vh-80px)] flex flex-col"
          >
            {currentView === 'home' && (
              <HomeLandingView
                onNavigate={handleNavigate}
                onOpenActivationModal={() => setIsActivationModalOpen(true)}
                onOpenAuthModal={() => handleOpenAuth('register')}
              />
            )}

            {currentView === 'dashboard' && (
              <StudentDashboard
                onNavigate={handleNavigate}
                onOpenActivationModal={() => setIsActivationModalOpen(true)}
                onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
                onOpenWalletModal={() => setIsWalletModalOpen(true)}
              />
            )}

            {currentView === 'physics-lab' && (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <PhysicsSimulationsLab />
              </div>
            )}

            {currentView === 'flashcards' && (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {student ? (
                  <FlashcardsView student={student} />
                ) : (
                  <div className="rounded-3xl border border-[#1E375E] bg-[#122442]/60 p-12 text-center space-y-4">
                    <h3 className="text-xl font-black text-white">يرجى تسجيل الدخول لاستخدام بطاقات المراجعة</h3>
                    <button
                      onClick={() => handleOpenAuth('login')}
                      className="rounded-xl bg-[#FFB020] px-6 py-2.5 text-xs font-bold text-[#0C1B33] hover:bg-[#e59e1c] transition-all"
                    >
                      تسجيل الدخول
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentView === 'my-courses' && (
              <MyCoursesView
                onNavigate={handleNavigate}
                onOpenActivationModal={() => setIsActivationModalOpen(true)}
              />
            )}

            {currentView === 'courses-catalog' && (
              <CourseCatalogView
                onNavigate={handleNavigate}
                onOpenActivationModal={() => setIsActivationModalOpen(true)}
                onOpenAuthModal={() => handleOpenAuth('register')}
              />
            )}

            {currentView === 'course-details' && (
              <CourseDetailsView
                courseId={viewParams.courseId || 'course-physics-3sec-full'}
                onNavigate={handleNavigate}
                onOpenActivationModal={() => setIsActivationModalOpen(true)}
                onOpenAuthModal={() => handleOpenAuth('login')}
              />
            )}

            {currentView === 'lesson-player' && (
              <LessonRoomView
                courseId={viewParams.courseId || 'course-physics-3sec-full'}
                lessonId={viewParams.lessonId || 'les-1'}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'exam-runner' && (
              <QuizExamView
                examId={viewParams.examId || 'exam-unit-1-comprehensive'}
                courseId={viewParams.courseId}
                lessonId={viewParams.lessonId}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'exam-result' && (
              <ExamResultView
                attemptId={viewParams.attemptId}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'my-results' && (
              <MyResultsView
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'pdf-library' && (
              <PdfLibraryView
                onNavigate={handleNavigate}
                onOpenActivationModal={() => setIsActivationModalOpen(true)}
                onOpenAuthModal={() => handleOpenAuth('login')}
              />
            )}

            {currentView === 'leaderboard' && (
              <LeaderboardView
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'weakness-profile' && (
              <WeaknessAnalysisView
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'ai-assistant' && (
              <div className="mx-auto max-w-4xl px-4 py-8">
                <AIPhysicsAssistant />
              </div>
            )}

            {currentView === 'admin' && (
              <React.Suspense fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6" dir="rtl">
                  <div className="h-12 w-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
                  <p className="font-bold text-lg text-slate-200">جاري تحميل لوحة الإدارة...</p>
                </div>
              }>
                <AdminDashboard
                  onNavigate={handleNavigate}
                />
              </React.Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer 
        onNavigate={handleNavigate}
        onOpenActivationModal={() => setIsActivationModalOpen(true)}
      />

      {/* Global Modals with Animated Transitions */}
      <AnimatePresence>
        {isActivationModalOpen && (
          <ActivationCodeModal
            key="modal-activation"
            isOpen={isActivationModalOpen}
            onClose={() => setIsActivationModalOpen(false)}
            onSuccessRedirect={handleActivationSuccess}
          />
        )}

        {isAuthModalOpen && (
          <AuthModal
            key="modal-auth"
            isOpen={isAuthModalOpen}
            initialMode={authModalInitialMode}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {isAdminSecretOpen && (
          <AdminSecretModal
            key="modal-admin-secret"
            isOpen={isAdminSecretOpen}
            onClose={() => setIsAdminSecretOpen(false)}
            onSuccessRedirect={() => handleNavigate('admin')}
          />
        )}

        {isNotificationModalOpen && (
          <NotificationCenterModal
            key="modal-notifications"
            isOpen={isNotificationModalOpen}
            onClose={() => setIsNotificationModalOpen(false)}
          />
        )}

        {isWalletModalOpen && (
          <StudentWalletModal
            key="modal-wallet"
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
            onSuccess={() => {
              setStudent(StorageService.getCurrentStudent());
            }}
          />
        )}

        {student && isEditProfileModalOpen && (
          <EditProfileModal
            key="modal-edit-profile"
            student={student}
            isOpen={isEditProfileModalOpen}
            onClose={() => setIsEditProfileModalOpen(false)}
            onUpdateSuccess={() => {
              setStudent(StorageService.getCurrentStudent());
            }}
          />
        )}

        {student && selectedCertificate && (
          <CertificateModal
            key="modal-certificate"
            student={student}
            certificate={selectedCertificate}
            isOpen={!!selectedCertificate}
            onClose={() => setSelectedCertificate(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating Customer Support Action Button (WhatsApp) */}
      <FloatingSupportButton currentView={currentView} />

      </div>
    </GlobalAntiScreenshotShield>
  );
}

