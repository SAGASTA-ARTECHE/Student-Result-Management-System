import React from 'react';
import { LogOut, User as UserIcon, GraduationCap, Shield, BookOpen, FileCheck2, Zap, Star } from 'lucide-react';
import { AuthSession } from '../../types';
import { StatusBadge } from './StatusBadge';
import { NavigationTab } from './Sidebar';

interface HeaderProps {
  session: AuthSession;
  onLogout: () => void;
  onQuickSwitchRole: (role: 'ADMINISTRATOR' | 'LECTURER' | 'STUDENT') => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onLogout,
  onQuickSwitchRole,
  onNavigate,
}) => {
  const getRoleIcon = () => {
    switch (session.user.role) {
      case 'ADMINISTRATOR':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'LECTURER':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'STUDENT':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getDisplayName = () => {
    if (session.student_profile) {
      return `${session.student_profile.name} (${session.student_profile.student_id})`;
    }
    if (session.lecturer_profile) {
      return `${session.lecturer_profile.lecturer_name}`;
    }
    return session.user.username;
  };

  return (
    <header
      id="main-header"
      className="bg-white border-b border-slate-200/80 px-6 py-3 sticky top-0 z-20 flex items-center justify-between"
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-500">Active Session:</span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          {getRoleIcon()}
          <span>{getDisplayName()}</span>
        </div>
        <div className="hidden sm:inline-block ml-1">
          <StatusBadge status={session.user.role} size="sm" />
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        {onNavigate && (
          <div className="hidden lg:flex items-center space-x-1.5 mr-2">
            <button
              onClick={() => onNavigate('e2e-tests')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
              title="Run Automated End-to-End Tests"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>E2E Tests</span>
            </button>
            <button
              onClick={() => onNavigate('database')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg cursor-pointer transition-colors"
              title="Database Triggers & Cloud Console"
            >
              <Zap className="w-3.5 h-3.5 text-sky-600" />
              <span>DB Triggers</span>
            </button>
            <button
              onClick={() => onNavigate('ratings')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition-colors"
              title="Course Quality & Ratings"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Ratings</span>
            </button>
          </div>
        )}

        {/* Demo Switcher for fast testing */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 px-2 font-medium hidden sm:inline">Role:</span>
          <button
            id="header-switch-admin-btn"
            onClick={() => onQuickSwitchRole('ADMINISTRATOR')}
            className={`px-2.5 py-1 rounded font-medium text-xs transition-colors cursor-pointer ${
              session.user.role === 'ADMINISTRATOR'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            title="Switch to Administrator view"
          >
            Admin
          </button>
          <button
            id="header-switch-lecturer-btn"
            onClick={() => onQuickSwitchRole('LECTURER')}
            className={`px-2.5 py-1 rounded font-medium text-xs transition-colors cursor-pointer ${
              session.user.role === 'LECTURER'
                ? 'bg-[#1d4ed8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            title="Switch to Lecturer view"
          >
            Lecturer
          </button>
          <button
            id="header-switch-student-btn"
            onClick={() => onQuickSwitchRole('STUDENT')}
            className={`px-2.5 py-1 rounded font-medium text-xs transition-colors cursor-pointer ${
              session.user.role === 'STUDENT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            title="Switch to Student view"
          >
            Student
          </button>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
