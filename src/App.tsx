import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import { ExamProvider } from './context/ExamContext';
import { HomeroomProvider } from './context/HomeroomContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { CalendarProvider } from './context/CalendarContext';
import { MediaAjarProvider } from './context/MediaAjarContext';
import { QuizProvider } from './context/QuizContext';
import { UserRole } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './views/LandingPage';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardShell } from './views/DashboardShell';
import { CourseCatalogView } from './views/CourseCatalogView';
import { CourseDetailView } from './views/CourseDetailView';
import { SafeExamRoomView } from './views/SafeExamRoomView';
import { TeacherReviewView } from './views/TeacherReviewView';
import { StudentResultView } from './views/StudentResultView';
import { WaliKelasRaporView } from './views/WaliKelasRaporView';
import { StudentHistoryView } from './views/StudentHistoryView';
import { BackupDriveView } from './views/BackupDriveView';
import { CalendarView } from './views/CalendarView';
import { GoogleWorkspaceView } from './views/GoogleWorkspaceView';
import { AdminUsersView } from './views/AdminUsersView';
import { DirectQuizView } from './views/DirectQuizView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { ShieldAlert, LogOut } from 'lucide-react';

function MainRouter() {
  const { currentUser, sessionTerminationNotice, clearSessionTerminationNotice } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    return currentUser ? 'dashboard' : 'landing';
  });
  const [loginRole, setLoginRole] = useState<UserRole>('siswa');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('crs-mat-12');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('asg-mat-01');

  const handleNavigate = (view: string, param?: string | UserRole) => {
    if (view === 'login' && param) {
      setLoginRole(param as UserRole);
    } else if (view === 'course-detail' && param) {
      setSelectedCourseId(param as string);
    } else if (view === 'exam' && param) {
      setSelectedAssignmentId(param as string);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Single Active Session Termination Notification Modal */}
      {sessionTerminationNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border-2 border-rose-500 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider font-mono">
                Single Active Session Policy
              </span>
              <h3 className="font-extrabold text-base text-slate-900 mt-2">
                Sesi Telah Dihentikan
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {sessionTerminationNotice}
            </p>
            <p className="text-[11px] text-slate-500">
              Demi keamanan akun dan integritas evaluasi, satu akun hanya diizinkan aktif pada 1 perangkat. Sesi pada perangkat ini telah dinonaktifkan.
            </p>
            <button
              onClick={() => {
                clearSessionTerminationNotice();
                handleNavigate('login');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Masuk Kembali ke Akun Anda</span>
            </button>
          </div>
        </div>
      )}

      {/* Hide Navbar during active exam session to prevent distractions */}
      {currentView !== 'exam' && (
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
      )}
      
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}
        {currentView === 'login' && (
          <LoginView initialRole={loginRole} onNavigate={handleNavigate} />
        )}
        {currentView === 'register' && (
          <RegisterView onNavigate={handleNavigate} />
        )}
        {currentView === 'dashboard' && (
          <DashboardShell onNavigate={handleNavigate} />
        )}
        {currentView === 'catalog' && (
          <CourseCatalogView onNavigate={handleNavigate} />
        )}
        {currentView === 'course-detail' && (
          <CourseDetailView courseId={selectedCourseId} onNavigate={handleNavigate} />
        )}
        {currentView === 'exam' && (
          <SafeExamRoomView assignmentId={selectedAssignmentId} onNavigate={handleNavigate} />
        )}
        {currentView === 'teacher-review' && (
          <TeacherReviewView onNavigate={handleNavigate} />
        )}
        {currentView === 'student-results' && (
          <StudentResultView onNavigate={handleNavigate} />
        )}
        {currentView === 'rapor' && (
          <WaliKelasRaporView onNavigate={handleNavigate} />
        )}
        {currentView === 'student-history' && (
          <StudentHistoryView onNavigate={handleNavigate} />
        )}
        {currentView === 'backup-drive' && (
          <BackupDriveView onNavigate={handleNavigate} />
        )}
        {currentView === 'calendar' && (
          <CalendarView onNavigate={handleNavigate} />
        )}
        {currentView === 'google-workspace' && (
          <GoogleWorkspaceView onNavigate={handleNavigate} />
        )}
        {currentView === 'admin-users' && (
          <AdminUsersView onNavigate={handleNavigate} />
        )}
        {currentView === 'direct-quiz' && (
          <DirectQuizView onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global AI Assistant & Scaffolding Drawer (For Students, except during active SEB exam lock) */}
      {currentView !== 'exam' && (
        <AiAssistantDrawer currentCourseId={selectedCourseId} />
      )}

      {currentView === 'landing' && <Footer />}
    </div>
  );
}

import { GoogleWorkspaceProvider } from './context/GoogleWorkspaceContext';

export default function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <GoogleWorkspaceProvider>
            <CourseProvider>
              <ExamProvider>
                <HomeroomProvider>
                  <CalendarProvider>
                    <MediaAjarProvider>
                      <QuizProvider>
                        <MainRouter />
                      </QuizProvider>
                    </MediaAjarProvider>
                  </CalendarProvider>
                </HomeroomProvider>
              </ExamProvider>
            </CourseProvider>
          </GoogleWorkspaceProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

