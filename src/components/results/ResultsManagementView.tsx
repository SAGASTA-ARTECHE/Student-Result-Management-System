import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../data/db';
import { CalculationService } from '../../services/calculationService';
import { ResultStatus, AuthSession } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface ResultsManagementViewProps {
  session: AuthSession;
  onNavigateToReports?: (studentId?: string) => void;
}

export const ResultsManagementView: React.FC<ResultsManagementViewProps> = ({
  session,
  onNavigateToReports,
}) => {
  const [results, setResults] = useState(() => db.getResults());
  const students = db.getStudents();
  const modules = db.getModules();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const isAdmin = session.user.role === 'ADMINISTRATOR';
  const isLecturer = session.user.role === 'LECTURER';
  const isStudent = session.user.role === 'STUDENT';

  // Role scoping
  let baseResults = results;
  if (isStudent) {
    const currentStudentId =
      session.student_profile?.student_id ||
      session.user.reference_id ||
      students.find(
        s => s.email.toLowerCase() === session.user.email.toLowerCase() ||
             s.student_id.toLowerCase() === session.user.username.toLowerCase()
      )?.student_id;

    baseResults = currentStudentId ? results.filter(r => r.student_id === currentStudentId) : [];
  } else if (isLecturer && session.lecturer_profile) {
    const assignedModuleIds = new Set(
      db.getModulesByLecturer(session.lecturer_profile.lecturer_id).map(m => m.module_id)
    );
    baseResults = results.filter(r => assignedModuleIds.has(r.module_id));
  }

  const handleRecalculateAll = () => {
    setIsRecalculating(true);
    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      const updated = CalculationService.recalculateAllResults(operator);
      setResults(updated);
      setNotification(`Recalculated ${updated.length} academic results against current institutional rules.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  const filteredResults = baseResults.filter(r => {
    const student = students.find(s => s.student_id === r.student_id);
    const mod = modules.find(m => m.module_id === r.module_id);

    const matchesSearch =
      (student && (student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.student_id.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (mod && (mod.module_code.toLowerCase().includes(searchQuery.toLowerCase()) || mod.module_name.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesModule = moduleFilter === 'ALL' || r.module_id === moduleFilter;

    return matchesSearch && matchesStatus && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isStudent ? 'My Academic Results' : 'Institutional Results & Academic Standings'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated final marks, letter grades, and academic standing determinations.
          </p>
        </div>

        {isAdmin && (
          <button
            id="recalculate-results-btn"
            onClick={handleRecalculateAll}
            disabled={isRecalculating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate All Results'}
          </button>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="results-search-input"
            type="text"
            placeholder="Search by Student Name, ID, or Module Code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="results-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Standings</option>
            <option value="DISTINCTION">Distinction (&ge; 75%)</option>
            <option value="PASS">Pass (50 - 74%)</option>
            <option value="FAIL">Fail (40 - 49%)</option>
            <option value="EXCLUSION">Exclusion (&lt; 40%)</option>
          </select>

          <select
            id="results-module-filter"
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Modules</option>
            {modules.map(m => (
              <option key={m.module_id} value={m.module_id}>
                {m.module_code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Module</th>
                <th className="px-4 py-3 text-center">Final Mark</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Standing / Status</th>
                <th className="px-4 py-3 text-center">Published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredResults.length > 0 ? (
                filteredResults.map(res => {
                  const student = students.find(s => s.student_id === res.student_id);
                  const mod = modules.find(m => m.module_id === res.module_id);

                  return (
                    <tr key={res.result_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-xs">{student?.name || res.student_id}</div>
                        <div className="text-[11px] font-mono text-slate-400">{res.student_id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold font-mono text-slate-900 text-xs">{mod?.module_code}</div>
                        <div className="text-[11px] text-slate-500">{mod?.module_name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-slate-900 text-base">
                        {res.final_mark}%
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-slate-800">
                        {res.grade}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={res.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-400">
                        {new Date(res.calculated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {onNavigateToReports && (
                          <button
                            onClick={() => onNavigateToReports(res.student_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Transcript
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                    {isStudent ? (
                      <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <Award className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-700 text-sm">No Published Examination Results</p>
                        <p className="text-slate-400 max-w-sm">
                          Results and final module grades will appear here once captured and finalized by your faculty lecturers.
                        </p>
                      </div>
                    ) : (
                      'No results match the current filter criteria.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
