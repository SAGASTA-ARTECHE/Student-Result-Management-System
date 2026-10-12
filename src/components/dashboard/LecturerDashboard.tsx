import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  AlertCircle,
  Edit3,
  FileText,
  CheckCircle2,
  Users,
  Clock,
  PlusCircle,
  UserCheck
} from 'lucide-react';
import { db } from '../../data/db';
import { AuthSession, Lecturer } from '../../types';
import { NavigationTab } from '../common/Sidebar';

interface LecturerDashboardProps {
  session: AuthSession;
  onNavigate: (tab: NavigationTab, moduleId?: string) => void;
  onSelectModuleForMarks: (moduleId: string) => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  session,
  onNavigate,
  onSelectModuleForMarks,
}) => {
  const [, setRefresh] = useState(0);
  const allLecturers = db.getLecturers();
  
  // Resolve current lecturer profile cleanly
  const currentLecturer: Lecturer | undefined =
    session.lecturer_profile ||
    (session.user.reference_id ? db.getLecturerById(session.user.reference_id) : undefined) ||
    allLecturers.find(
      l => l.email.toLowerCase() === session.user.email.toLowerCase() ||
           (session.user.reference_id && l.lecturer_id.toLowerCase() === session.user.reference_id.toLowerCase())
    );

  const lecturerId = currentLecturer?.lecturer_id || session.user.reference_id || 'LEC-NEW';
  const lecturer = currentLecturer || {
    lecturer_id: lecturerId,
    lecturer_name: session.user.username,
    email: session.user.email,
    department: 'Department of Computer Science',
    created_at: new Date().toISOString(),
  };

  const assignedModules = db.getModulesByLecturer(lecturer.lecturer_id);
  const allRegistrations = db.getRegistrations();
  const allResults = db.getResults();
  const allModules = db.getModules();

  const [selectedCourseToClaim, setSelectedCourseToClaim] = useState<string>('');
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const handleClaimCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseToClaim) return;

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      // Ensure lecturer exists in db if not yet present
      if (!db.getLecturerById(lecturer.lecturer_id)) {
        db.addLecturer({
          lecturer_id: lecturer.lecturer_id,
          lecturer_name: lecturer.lecturer_name,
          email: lecturer.email,
          department: lecturer.department,
        }, operator);
      }

      db.updateModule(selectedCourseToClaim, { lecturer_id: lecturer.lecturer_id }, operator);
      setClaimMessage(`Successfully assigned course ${selectedCourseToClaim} to your profile.`);
      setSelectedCourseToClaim('');
      setRefresh(r => r + 1);
      setTimeout(() => setClaimMessage(null), 4000);
    } catch (err: any) {
      setClaimMessage(err.message || 'Failed to assign course.');
    }
  };

  let totalStudentsCount = 0;
  let totalPendingMarksCount = 0;
  let totalSubmittedCount = 0;

  const moduleStats = assignedModules.map(mod => {
    const regs = allRegistrations.filter(r => r.module_id === mod.module_id);
    const modResults = allResults.filter(r => r.module_id === mod.module_id);
    const submitted = modResults.length;
    const pending = Math.max(0, regs.length - submitted);

    totalStudentsCount += regs.length;
    totalPendingMarksCount += pending;
    totalSubmittedCount += submitted;

    return {
      module: mod,
      enrolledCount: regs.length,
      submittedCount: submitted,
      pendingCount: pending,
    };
  });

  const isNewAccount = Boolean(
    session.is_new_account ||
    session.user.is_new ||
    (session.user.login_count !== undefined && session.user.login_count <= 1)
  );
  const lecturerTitle = lecturer.lecturer_name || session.user.username || 'Prof.';
  const greeting = isNewAccount ? `Welcome, ${lecturerTitle}!` : `Welcome back, ${lecturerTitle}!`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
          Manage your courses and student marks
        </p>
      </div>

      {claimMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{claimMessage}</span>
        </div>
      )}

      {/* 4 Stat Cards with Accurate Real Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Assigned Courses</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{assignedModules.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active semester</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Students</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalStudentsCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all classes</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Marks Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Marks Submitted</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalSubmittedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Assessed batches</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pending Submissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Pending Submissions</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalPendingMarksCount}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
              {totalPendingMarksCount > 0 ? 'Action required' : 'Up to date'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Course Assignment Box if no courses or quick assign */}
      {assignedModules.length === 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#1d4ed8]" />
                Assign Courses to Teach
              </h4>
              <p className="text-xs text-blue-700 mt-1 max-w-xl">
                You do not have any courses assigned to your profile yet. Select a course from the curriculum below to assign it to yourself so you can view enrolled students and capture their marks.
              </p>
            </div>
            <form onSubmit={handleClaimCourse} className="flex items-center gap-2 flex-shrink-0">
              <select
                value={selectedCourseToClaim}
                onChange={e => setSelectedCourseToClaim(e.target.value)}
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Course to Teach --</option>
                {allModules.map(m => (
                  <option key={m.module_id} value={m.module_id}>
                    {m.module_code} - {m.module_name} ({m.credits} credits)
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedCourseToClaim}
                className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Assign to Me
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Assigned Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Assigned Courses</h3>
            <p className="text-xs text-slate-400 mt-0.5">Course overview and grading status for this semester</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('students')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View Registered Students</span>
            </button>
            <button
              onClick={() => onNavigate('capture-marks')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Capture Marks</span>
            </button>
          </div>
        </div>

        {assignedModules.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No courses assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the assignment box above to select courses you teach, or an administrator can assign modules to you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-5">Course Code</th>
                  <th className="py-3 px-5">Course Name</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-center">Submitted</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moduleStats.map(stat => (
                  <tr key={stat.module.module_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                      {stat.module.module_code}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {stat.module.module_name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {stat.module.credits}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-900">
                      {stat.enrolledCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-900">
                      {stat.submittedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {stat.pendingCount === 0 && stat.enrolledCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          {stat.pendingCount} Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('students')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="View registered students for this course"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Class List ({stat.enrolledCount})</span>
                        </button>
                        <button
                          onClick={() => onSelectModuleForMarks(stat.module.module_id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Capture Marks</span>
                        </button>
                        <button
                          onClick={() => onNavigate('reports', stat.module.module_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Teaching Effectiveness & Student Evaluations Summary Card */}
      {(() => {
        const ratingSummary = db.calculateLecturerRatingSummary(lecturer.lecturer_id);
        return (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Student Teaching Evaluation
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {ratingSummary.total_ratings} student responses recorded
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Overall Faculty Teaching Score:{' '}
                <span className="text-amber-600">
                  {ratingSummary.average_rating > 0 ? `${ratingSummary.average_rating.toFixed(1)} / 5.0` : '5.0 / 5.0'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Continuous assessment fairness, lecture delivery, and feedback timeliness evaluated by enrolled students.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="lecturer-view-ratings-btn"
                onClick={() => onNavigate('ratings')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                View Teaching Feedback & Scorecard &rarr;
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
