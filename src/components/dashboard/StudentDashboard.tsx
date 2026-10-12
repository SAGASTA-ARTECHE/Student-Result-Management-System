import React from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Printer,
  Plus
} from 'lucide-react';
import { AuthSession, Student } from '../../types';
import { db } from '../../data/db';
import { ReportService } from '../../services/reportService';
import { StatusBadge } from '../common/StatusBadge';
import { NavigationTab } from '../common/Sidebar';

interface StudentDashboardProps {
  session: AuthSession;
  onNavigate: (tab: NavigationTab) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  session,
  onNavigate,
}) => {
  // Resolve current logged-in student cleanly without falling back to demo students
  const currentStudent: Student | undefined =
    session.student_profile ||
    (session.user.reference_id ? db.getStudentById(session.user.reference_id) : undefined) ||
    db.getStudents().find(
      s => s.email.toLowerCase() === session.user.email.toLowerCase() ||
           s.student_id.toLowerCase() === session.user.username.toLowerCase() ||
           (session.user.reference_id && s.student_id.toLowerCase() === session.user.reference_id.toLowerCase())
    );

  const studentId = currentStudent?.student_id || session.user.reference_id || '';
  const transcript = studentId ? ReportService.getStudentTranscript(studentId) : null;
  const student = currentStudent || transcript?.student || {
    student_id: studentId || 'STU-NEW',
    name: session.user.username,
    course: 'BSc Computer Science',
    email: session.user.email,
    year_of_study: 1,
    academic_year: '2024/2025',
    status: 'ACTIVE' as const,
    created_at: new Date().toISOString(),
  };
  const lecturers = db.getLecturers();

  // Find lecturer name for each module
  const getLecturerForModule = (moduleId: string) => {
    const mod = db.getModules().find(m => m.module_id === moduleId);
    if (!mod || !mod.lecturer_id) return 'Faculty Member';
    const lec = lecturers.find(l => l.lecturer_id === mod.lecturer_id);
    return lec ? lec.lecturer_name : 'Faculty Member';
  };

  const studentFirstName = student.name ? student.name.split(' ')[0] : 'Student';
  const enrolledCount = transcript?.items.length ?? 0;
  const completedCount = transcript?.items.filter(i => i.result && (i.result.status === 'PASS' || i.result.status === 'DISTINCTION')).length ?? 0;
  const hasEarnedCredits = (transcript?.totalCreditsEarned ?? 0) > 0;
  const gpaDisplay = hasEarnedCredits && transcript && transcript.gpa > 0 ? transcript.gpa.toFixed(2) : 'N/A';

  const isNewAccount = Boolean(
    session.is_new_account ||
    session.user.is_new ||
    (session.user.login_count !== undefined && session.user.login_count <= 1)
  );
  const greeting = isNewAccount ? `Welcome, ${studentFirstName}!` : `Welcome back, ${studentFirstName}!`;

  return (
    <div className="space-y-6">
      {/* Top Greeting */}
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
          Here is your academic progress overview
        </p>
      </div>

      {/* Registration Status Banner */}
      {enrolledCount === 0 ? (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-amber-950">Module Registration Pending</span>
              <p className="text-amber-800 mt-0.5">
                You are not yet registered for any modules for the {student.academic_year || '2024/2025'} semester. Register now to select your curriculum.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('registrations')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register for Modules</span>
          </button>
        </div>
      ) : (
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-blue-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-[#1d4ed8] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-blue-950">Registration Complete</span>
              <span className="text-blue-800 ml-1.5 font-medium">
                — You are enrolled in {enrolledCount} module{enrolledCount === 1 ? '' : 's'} ({transcript?.totalCreditsEnrolled ?? 0} credits) for the {student.academic_year || '2024/2025'} academic semester.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('registrations')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manage Modules</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-semibold text-[#1d4ed8] shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Transcript</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Academic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current GPA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Current GPA</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {gpaDisplay}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {hasEarnedCredits ? 'Scale 4.00' : 'Pending results'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Enrolled Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Enrolled Courses</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {enrolledCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active modules</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Completed Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Completed Courses</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {completedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Credits awarded: {transcript?.totalCreditsEarned ?? 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Academic Standing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Academic Standing</div>
            <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
              {enrolledCount > 0 ? (transcript?.academicStanding || 'Good Standing') : 'Registered Student'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {enrolledCount > 0 ? 'Satisfactory' : 'Registration Open'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Courses & Results Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Courses & Results</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current semester module marks and published grades</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('registrations')}
              className="text-xs font-semibold text-[#1d4ed8] hover:text-[#1e40af] cursor-pointer"
            >
              + Register Modules
            </button>
            <button
              onClick={() => onNavigate('results')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              View all results &rarr;
            </button>
          </div>
        </div>

        {enrolledCount === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1d4ed8] flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Registered Modules Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              You are not registered for any modules yet. Click below to browse available curriculum modules and enroll.
            </p>
            <button
              onClick={() => onNavigate('registrations')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register for Modules</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-5">Course Code</th>
                  <th className="py-3 px-5">Course Name</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-5">Lecturer</th>
                  <th className="py-3 px-4 text-center">Final Mark</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transcript?.items.map(item => {
                  const grade = item.result?.grade || '—';
                  const status = item.result?.status || 'ENROLLED';
                  const lecturer = getLecturerForModule(item.module.module_id);

                  return (
                    <tr key={item.module.module_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                        {item.module.module_code}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {item.module.module_name}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {item.module.credits}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">
                        {lecturer}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {item.result ? (
                          <span className="font-extrabold text-slate-900">{item.result.final_mark}%</span>
                        ) : (
                          <span className="text-slate-400 font-normal text-[11px] italic">In Progress</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.result?.grade ? (
                          <StatusBadge status={grade} size="sm" />
                        ) : (
                          <span className="font-mono text-slate-400 font-semibold">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <StatusBadge status={status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Evaluation & Teaching Feedback Callout Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-amber-950">
              Institutional Quality Assurance
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Rate Your Courses & Lecturers
          </h3>
          <p className="text-xs text-blue-200 max-w-xl leading-relaxed">
            Submit anonymous or verified feedback on course delivery, assessment fairness, and learning materials. Helps faculty maintain high academic standards.
          </p>
        </div>

        <button
          id="student-evaluate-courses-btn"
          onClick={() => onNavigate('ratings')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-900 rounded-xl text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer transition-colors"
        >
          Evaluate Courses Now &rarr;
        </button>
      </div>
    </div>
  );
};
