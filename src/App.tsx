import React, { useState, useEffect } from 'react';
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
import { AdminDashboard } from './components/AdminDashboard';
import { ActivationCodeModal } from './components/ActivationCodeModal';
import { AuthModal } from './components/AuthModal';
import { AdminSecretModal } from './components/AdminSecretModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { StorageService, subscribeToStorage } from './services/storage';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  
  // Modals
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminSecretOpen, setIsAdminSecretOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

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
    // If navigating to admin but not logged in as admin, trigger secret modal instead
    if (view === 'admin') {
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
    setCurrentView(view);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenActivationModal={() => setIsActivationModalOpen(true)}
        onOpenAuthModal={() => handleOpenAuth('login')}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
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
          />
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

        {currentView === 'admin' && (
          <AdminDashboard
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <ActivationCodeModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        onSuccessRedirect={handleActivationSuccess}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Secret Admin Security Portal */}
      <AdminSecretModal
        isOpen={isAdminSecretOpen}
        onClose={() => setIsAdminSecretOpen(false)}
        onSuccessRedirect={() => handleNavigate('admin')}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

    </div>
  );
}

