import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Award,
  FileText,
  ShieldCheck,
  Sliders,
  Database,
  UserCheck,
  Edit3,
  LogOut,
  Settings,
  BarChart3,
  Star,
  FileCheck2,
  Zap,
  Code
} from 'lucide-react';
import { UserRole, AuthSession } from '../../types';

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'lecturers'
  | 'modules'
  | 'registrations'
  | 'capture-marks'
  | 'results'
  | 'reports'
  | 'ratings'
  | 'database'
  | 'e2e-tests'
  | 'system-functions'
  | 'users'
  | 'audit-trail'
  | 'academic-rules'
  | 'backup'
  | 'my-profile';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userRole: UserRole;
  session?: AuthSession | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  session,
  onLogout,
}) => {
  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }

  let navItems: NavItem[] = [];

  if (userRole === 'ADMINISTRATOR') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'students', label: 'Student Management', icon: <GraduationCap className="w-4 h-4" /> },
      { id: 'lecturers', label: 'Faculty Management', icon: <UserCheck className="w-4 h-4" /> },
      { id: 'modules', label: 'Modules & Courses', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'registrations', label: 'Registrations', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'results', label: 'Results Master', icon: <Award className="w-4 h-4" /> },
      { id: 'reports', label: 'Results Report', icon: <FileText className="w-4 h-4" /> },
      { id: 'ratings', label: 'Course QA & Ratings', icon: <Star className="w-4 h-4 text-amber-300" /> },
      { id: 'database', label: 'Database & Triggers', icon: <Database className="w-4 h-4 text-sky-300" /> },
      { id: 'e2e-tests', label: 'E2E Test Suite', icon: <FileCheck2 className="w-4 h-4 text-emerald-300" /> },
      { id: 'system-functions', label: 'Functions & Defense', icon: <Code className="w-4 h-4 text-purple-300" /> },
      { id: 'academic-rules', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
      { id: 'audit-trail', label: 'Audit Trail', icon: <ShieldCheck className="w-4 h-4" /> },
      { id: 'backup', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (userRole === 'LECTURER') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'capture-marks', label: 'Capture Marks', icon: <Edit3 className="w-4 h-4" /> },
      { id: 'reports', label: 'Results Report', icon: <FileText className="w-4 h-4" /> },
      { id: 'ratings', label: 'Teaching Ratings', icon: <Star className="w-4 h-4 text-amber-300" /> },
      { id: 'e2e-tests', label: 'E2E Test Suite', icon: <FileCheck2 className="w-4 h-4 text-emerald-300" /> },
      { id: 'system-functions', label: 'Functions & Defense', icon: <Code className="w-4 h-4 text-purple-300" /> },
      { id: 'students', label: 'View Students', icon: <Users className="w-4 h-4" /> },
      { id: 'modules', label: 'My Courses', icon: <BookOpen className="w-4 h-4" /> },
    ];
  } else if (userRole === 'STUDENT') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'registrations', label: 'Module Registration', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'results', label: 'My Results', icon: <Award className="w-4 h-4" /> },
      { id: 'reports', label: 'Results Report', icon: <FileText className="w-4 h-4" /> },
      { id: 'ratings', label: 'Rate My Courses', icon: <Star className="w-4 h-4 text-amber-300" /> },
      { id: 'system-functions', label: 'Functions & Defense', icon: <Code className="w-4 h-4 text-purple-300" /> },
      { id: 'my-profile', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];
  }

  const getUserDisplayName = () => {
    if (!session) return 'User';
    if (session.student_profile) return session.student_profile.name;
    if (session.lecturer_profile) return session.lecturer_profile.lecturer_name;
    return session.user.username;
  };

  const getRoleSubtitle = () => {
    if (!session) return 'portal';
    return session.user.role.toLowerCase();
  };

  return (
    <aside
      id="main-sidebar"
      className="w-full md:w-60 bg-[#1e3bb3] text-white flex-shrink-0 flex flex-col justify-between min-h-screen shadow-lg"
    >
      <div>
        {/* SRMS Brand Header */}
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-white/20 flex items-center justify-center text-white shadow-inner">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">SRMS</h1>
            <p className="text-[11px] text-blue-200 font-medium mt-0.5 truncate" title="Kimberley University of Technology">
              Kimberley Univ. of Tech
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-2">
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-white' : 'text-blue-200/90'}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile & Logout at Bottom */}
      <div className="p-4 border-t border-blue-800/60 bg-[#1a349e]">
        <div className="mb-2">
          <div className="text-xs font-bold text-white truncate">
            {getUserDisplayName()}
          </div>
          <div className="text-[11px] text-blue-200/80 capitalize font-medium">
            {getRoleSubtitle()}
          </div>
        </div>

        {onLogout && (
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center space-x-2 text-xs font-semibold text-blue-200 hover:text-white pt-2 border-t border-blue-700/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};

