import React, { useState, useEffect } from 'react';
import { AuthService } from './services/authService';
import { AuthSession, UserRole } from './types';
import { Header } from './components/common/Header';
import { Sidebar, NavigationTab } from './components/common/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { LecturerDashboard } from './components/dashboard/LecturerDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { StudentManagementView } from './components/students/StudentManagementView';
import { LecturerManagementView } from './components/lecturers/LecturerManagementView';
import { ModuleManagementView } from './components/modules/ModuleManagementView';
import { RegistrationManagerView } from './components/registrations/RegistrationManagerView';
import { MarksCapturingView } from './components/marks/MarksCapturingView';
import { ResultsManagementView } from './components/results/ResultsManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { AcademicRulesView } from './components/rules/AcademicRulesView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { BackupRecoveryView } from './components/backup/BackupRecoveryView';
import { UserManagementView } from './components/users/UserManagementView';
import { CourseEvaluationsView } from './components/ratings/CourseEvaluationsView';
import { DatabaseConsoleView } from './components/database/DatabaseConsoleView';
import { E2ETestingView } from './components/testing/E2ETestingView';
import { SystemFunctionsView } from './components/documentation/SystemFunctionsView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => AuthService.getSession());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Deep linking state for sub-screens
  const [selectedModuleForMarks, setSelectedModuleForMarks] = useState<string | undefined>(undefined);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | undefined>(undefined);
  const [selectedModuleForReport, setSelectedModuleForReport] = useState<string | undefined>(undefined);

  // If session changes or logs out, default to dashboard
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [session?.user.user_id]);

  const handleLogout = () => {
    AuthService.logout();
    setSession(null);
  };

  const handleQuickSwitchRole = (role: UserRole) => {
    const demoCredentials: Record<UserRole, { u: string; p: string }> = {
      ADMINISTRATOR: { u: 'maje', p: 'Admin@123' },
      LECTURER: { u: 'dr.may', p: 'Lecturer@123' },
      STUDENT: { u: 'tlhompo', p: 'Student@123' },
    };

    try {
      const cred = demoCredentials[role];
      const newSession = AuthService.login(cred.u, cred.p);
      setSession(newSession);
      setCurrentTab('dashboard');
    } catch (e) {
      console.error('Failed to quick-switch demo role', e);
    }
  };

  const handleNavigateToMarks = (moduleId?: string) => {
    setSelectedModuleForMarks(moduleId);
    setCurrentTab('capture-marks');
  };

  const handleNavigateToReports = (studentId?: string, moduleId?: string) => {
    if (studentId) setSelectedStudentForReport(studentId);
    if (moduleId) setSelectedModuleForReport(moduleId);
    setCurrentTab('reports');
  };

  if (!session) {
    return <LoginView onLoginSuccess={setSession} />;
  }

  const role = session.user.role;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Royal Blue Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={role}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Right Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar with active role & demo switcher */}
        <Header
          session={session}
          onLogout={handleLogout}
          onQuickSwitchRole={handleQuickSwitchRole}
          onNavigate={setCurrentTab}
        />

        {/* Main Workspace Display */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ErrorBoundary>
            {/* DASHBOARD TAB */}
            {currentTab === 'dashboard' && (
              <>
                {role === 'ADMINISTRATOR' && (
                  <AdminDashboard session={session} onNavigate={setCurrentTab} />
                )}
                {role === 'LECTURER' && (
                  <LecturerDashboard
                    session={session}
                    onNavigate={(tab, modId) => {
                      if (modId) setSelectedModuleForReport(modId);
                      setCurrentTab(tab);
                    }}
                    onSelectModuleForMarks={handleNavigateToMarks}
                  />
                )}
                {role === 'STUDENT' && (
                  <StudentDashboard session={session} onNavigate={setCurrentTab} />
                )}
              </>
            )}

            {/* STUDENT MANAGEMENT VIEW */}
            {currentTab === 'students' && (
              <StudentManagementView
                session={session}
                onViewTranscript={id => handleNavigateToReports(id)}
                onNavigateToMarks={handleNavigateToMarks}
              />
            )}

            {/* MY PROFILE (STUDENT ONLY) */}
            {currentTab === 'my-profile' && (
              <StudentDashboard session={session} onNavigate={setCurrentTab} />
            )}

            {/* FACULTY / LECTURERS VIEW */}
            {currentTab === 'lecturers' && (
              <LecturerManagementView session={session} />
            )}

            {/* CURRICULUM MODULES VIEW */}
            {currentTab === 'modules' && (
              <ModuleManagementView
                session={session}
                onNavigateToMarks={handleNavigateToMarks}
              />
            )}

            {/* REGISTRATIONS JUNCTION VIEW */}
            {currentTab === 'registrations' && (
              <RegistrationManagerView session={session} />
            )}

            {/* MARK CAPTURING & FORMULA EVALUATION */}
            {currentTab === 'capture-marks' && (
              <MarksCapturingView
                session={session}
                initialModuleId={selectedModuleForMarks}
                onViewResults={() => setCurrentTab('results')}
              />
            )}

            {/* RESULTS MANAGEMENT VIEW */}
            {currentTab === 'results' && (
              <ResultsManagementView
                session={session}
                onNavigateToReports={id => handleNavigateToReports(id)}
              />
            )}

            {/* TRANSCRIPTS & ACADEMIC REPORTING */}
            {currentTab === 'reports' && (
              <ReportsView
                session={session}
                initialStudentId={selectedStudentForReport}
                initialModuleId={selectedModuleForReport}
              />
            )}

            {/* USER ACCOUNTS & RBAC */}
            {currentTab === 'users' && (
              <UserManagementView session={session} />
            )}

            {/* AUDIT TRAIL LOGS */}
            {currentTab === 'audit-trail' && (
              <AuditTrailView />
            )}

            {/* CONFIGURABLE ACADEMIC RULES */}
            {currentTab === 'academic-rules' && (
              <AcademicRulesView session={session} />
            )}

            {/* COURSE & LECTURER QUALITY RATINGS */}
            {currentTab === 'ratings' && (
              <CourseEvaluationsView session={session} />
            )}

            {/* DATABASE ENGINEERING, TRIGGERS, CLOUD SYNC & OCC */}
            {(currentTab === 'database' || currentTab === 'backup') && (
              <DatabaseConsoleView session={session} />
            )}

            {/* AUTOMATED END-TO-END VERIFICATION SUITE */}
            {currentTab === 'e2e-tests' && (
              <E2ETestingView />
            )}

            {/* SYSTEM FUNCTIONS & TECHNICAL DEFENSE MANUAL */}
            {currentTab === 'system-functions' && (
              <SystemFunctionsView />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
