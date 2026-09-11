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
import { ErrorBoundary } from './components/ErrorBoundary';
import { StorageService, subscribeToStorage } from './services/storage';
import { PresenceService } from './services/presence';
import { EarnedCertificate, Student } from './types';
import { parsePathToRoute, getRoutePath, updatePageSEO, BASE_URL } from './utils/seo';

// Code Splitting: Lazy load only the AdminDashboard component
const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);

export default function App() {
  const initialRoute = parsePathToRoute(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [viewParams, setViewParams] = useState<Record<string, any>>(initialRoute.params);
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

  // Listen for browser Back/Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parsePathToRoute(window.location.pathname);
      setCurrentView(route.view);
      setViewParams(route.params);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamic SEO Synchronization
  useEffect(() => {
    if (currentView === 'home') {
      updatePageSEO({
        title: 'منصة ويكيفزياء - أستاذ أحمد صلاح | مدرس الفيزياء للثانوية العامة',
        description: 'منصة ويكيفزياء التعليمية مع الأستاذ أحمد صلاح، مدرس مادة الفيزياء للثانوية العامة. شروحات بسيطة، أسئلة بنكية متدرجة، امتحانات تفاعلية فورية ومذكرات شاملة للمتفوقين.',
        canonical: `${BASE_URL}/`
      });
    } else if (currentView === 'courses-catalog') {
      updatePageSEO({
        title: 'دليل المناهج والكورسات | منصة ويكيفزياء - أستاذ أحمد صلاح',
        description: 'استعرض كورسات ومناهج مادة الفيزياء لطلاب المرحلة الثانوية العامة مع أستاذ أحمد صلاح على منصة ويكيفزياء التعليمية.',
        canonical: `${BASE_URL}/courses`
      });
    } else if (currentView === 'course-details' && viewParams.courseId) {
      const course = StorageService.getCourseById(viewParams.courseId);
      if (course) {
        updatePageSEO({
          title: `${course.title} - فيزياء الثانوية العامة | أستاذ أحمد صلاح`,
          description: course.description || `كورس ${course.title} لمادة الفيزياء مع أستاذ أحمد صلاح على منصة ويكيفزياء التعليمية للثانوية العامة.`,
          canonical: `${BASE_URL}/courses/${course.id}`,
          schema: {
            '@context': 'https://schema.org',
            '@type': 'Course',
            '@id': `${BASE_URL}/courses/${course.id}#course`,
            'name': `${course.title} - أستاذ أحمد صلاح`,
            'description': course.description || `كورس ${course.title} في مادة الفيزياء للثانوية العامة مع أستاذ أحمد صلاح`,
            'provider': {
              '@type': 'EducationalOrganization',
              'name': 'ويكيفزياء - WiKi-PHYSICS',
              'url': `${BASE_URL}/`
            },
            'instructor': {
              '@type': 'Person',
              'name': 'أحمد صلاح',
              'honorificPrefix': 'أستاذ',
              'jobTitle': 'مدرس مادة الفيزياء للثانوية العامة'
            },
            'educationalLevel': course.grade || 'الثانوية العامة',
            'about': 'الفيزياء',
            'inLanguage': 'ar'
          }
        });
      } else {
        updatePageSEO({
          title: 'كورس فيزياء | منصة ويكيفزياء - أستاذ أحمد صلاح',
          canonical: `${BASE_URL}/courses`
        });
      }
    } else if (currentView === 'pdf-library') {
      updatePageSEO({
        title: 'المذكرات والملازم | منصة ويكيفزياء - أستاذ أحمد صلاح',
        description: 'مكتبة مذكرات وملازم وملخصات مادة الفيزياء للثانوية العامة مع أستاذ أحمد صلاح على منصة ويكيفزياء.',
        canonical: `${BASE_URL}/pdf-library`
      });
    } else if (currentView === 'physics-lab') {
      updatePageSEO({
        title: 'المعمل التفاعلي للفيزياء | منصة ويكيفزياء - أستاذ أحمد صلاح',
        description: 'معمل الفيزياء التفاعلي لتجارب الميكانيكا والكهربية ومحاكاة قوانين الفيزياء عملياً مع منصة ويكيفزياء.',
        canonical: `${BASE_URL}/physics-lab`
      });
    } else {
      // Private student / administrative views: apply noindex to protect student privacy
      updatePageSEO({
        noindex: true
      });
    }
  }, [currentView, viewParams]);

  const handleNavigate = (view: string, params: Record<string, any> = {}, replace = false) => {
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

    const newPath = getRoutePath(targetView, params);
    if (typeof window !== 'undefined' && targetView !== 'admin') {
      if (window.location.pathname !== newPath) {
        if (replace) {
          window.history.replaceState({ view: targetView, params }, '', newPath);
        } else {
          window.history.pushState({ view: targetView, params }, '', newPath);
        }
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
              <ErrorBoundary fallbackTitle="لوحة تحكم الطالب قيد المعالجة">
                <StudentDashboard
                  onNavigate={handleNavigate}
                  onOpenActivationModal={() => setIsActivationModalOpen(true)}
                  onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
                  onOpenWalletModal={() => setIsWalletModalOpen(true)}
                />
              </ErrorBoundary>
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
            onProfileUpdated={() => {
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

