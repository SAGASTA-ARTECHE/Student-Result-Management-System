import React from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Clock,
  UserCheck,
  FileText
} from 'lucide-react';
import { db } from '../../data/db';
import { NavigationTab } from '../common/Sidebar';
import { AuthSession } from '../../types';

interface AdminDashboardProps {
  session: AuthSession;
  onNavigate: (tab: NavigationTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session, onNavigate }) => {
  const students = db.getStudents();
  const lecturers = db.getLecturers();
  const modules = db.getModules();
  const users = db.getUsers();
  const results = db.getResults();
  const auditLogs = db.getAuditLogs();

  const totalResults = results.length;
  const passedResults = results.filter(r => r.status === 'PASS' || r.status === 'DISTINCTION').length;
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;

  const isNewAccount = Boolean(
    session.is_new_account ||
    session.user.is_new ||
    (session.user.login_count !== undefined && session.user.login_count <= 1)
  );
  const adminName = session.user.username === 'admin' ? 'Administrator' : session.user.username;
  const greeting = isNewAccount ? `Welcome, ${adminName}!` : `Welcome back, ${adminName}!`;

  return (
    <div className="space-y-6">
      {/* Page Greeting Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}
          </h2>
          {isNewAccount && (
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              New Account
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          System overview and key metrics
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Students</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{students.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Enrolled students</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Lecturers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Lecturers</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{lecturers.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active faculty members</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Courses</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{modules.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Available programs</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Users</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Registered accounts</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Recent Activity (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <button
              onClick={() => onNavigate('audit-trail')}
              className="text-xs font-semibold text-[#1d4ed8] hover:text-[#1e40af] cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.audit_id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#1d4ed8] mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{log.action}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{log.description}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">By {log.username}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('e2e-tests')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>🧪 Run E2E Test Suite</span>
              </button>

              <button
                onClick={() => onNavigate('database')}
                className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>⚡ Database & Triggers Console</span>
              </button>

              <button
                onClick={() => onNavigate('ratings')}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>⭐ Course QA & Ratings</span>
              </button>

              <button
                onClick={() => onNavigate('students')}
                className="w-full py-2.5 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Manage Students</span>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View Reports & Transcripts</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex justify-between items-center">
              <span>Overall Pass Rate</span>
              <span className="font-bold text-emerald-600">{passRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
