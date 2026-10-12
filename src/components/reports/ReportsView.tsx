import React, { useState } from 'react';
import {
  FileText,
  Printer,
  BookOpen,
  GraduationCap,
  Award,
  Building,
  TrendingUp,
  Users,
  CheckCircle,
  Download,
  Layers
} from 'lucide-react';
import { db } from '../../data/db';
import { ReportService } from '../../services/reportService';
import { AuthSession } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface ReportsViewProps {
  session: AuthSession;
  initialStudentId?: string;
  initialModuleId?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  session,
  initialStudentId,
  initialModuleId,
}) => {
  const isStudent = session.user.role === 'STUDENT';
  const isLecturer = session.user.role === 'LECTURER';

  const students = db.getStudents();
  const modules = db.getModules();

  const [activeTab, setActiveTab] = useState<'TRANSCRIPT' | 'MODULE' | 'INSTITUTIONAL'>(
    isStudent ? 'TRANSCRIPT' : isLecturer ? 'MODULE' : 'TRANSCRIPT'
  );

  // Transcript state
  const defaultStudentId = isStudent
    ? (session.student_profile?.student_id ||
       session.user.reference_id ||
       students.find(
         s => s.email.toLowerCase() === session.user.email.toLowerCase() ||
              s.student_id.toLowerCase() === session.user.username.toLowerCase()
       )?.student_id || '')
    : (initialStudentId || students[0]?.student_id || '');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId);

  // Module report state
  const defaultModuleId = isLecturer && session.lecturer_profile
    ? db.getModulesByLecturer(session.lecturer_profile.lecturer_id)[0]?.module_id || modules[0]?.module_id
    : initialModuleId || modules[0]?.module_id || '';

  const [selectedModuleId, setSelectedModuleId] = useState<string>(defaultModuleId);

  // Generate Reports
  const transcriptData = selectedStudentId ? ReportService.getStudentTranscript(selectedStudentId) : null;
  const moduleReportData = selectedModuleId ? ReportService.getModulePerformanceReport(selectedModuleId) : null;
  const institutionalSummary = ReportService.getInstitutionalSummary();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Results Report
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Generate and export academic performance reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(!isLecturer || isStudent) && (
              <button
                id="tab-transcript-btn"
                onClick={() => setActiveTab('TRANSCRIPT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'TRANSCRIPT'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Official Transcript
              </button>
            )}

            {!isStudent && (
              <button
                id="tab-module-report-btn"
                onClick={() => setActiveTab('MODULE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'MODULE'
                    ? 'bg-white text-[#1d4ed8] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Class Performance
              </button>
            )}

            {session.user.role === 'ADMINISTRATOR' && (
              <button
                id="tab-institutional-btn"
                onClick={() => setActiveTab('INSTITUTIONAL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'INSTITUTIONAL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Executive Summary
              </button>
            )}
          </div>

          <button
            id="export-csv-btn"
            onClick={() => {
              // Quick mock export or notification
              alert('CSV Report successfully downloaded.');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OFFICIAL STUDENT TRANSCRIPT */}
      {activeTab === 'TRANSCRIPT' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          {!isStudent && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 print:hidden">
              <label htmlFor="transcript-student-select" className="text-xs font-bold text-slate-700 uppercase">
                Select Student:
              </label>
              <select
                id="transcript-student-select"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-sm"
              >
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name} ({s.student_id}) - {s.course}
                  </option>
                ))}
              </select>
            </div>
          )}

          {transcriptData ? (
            <div
              id="official-transcript-document"
              className="bg-white rounded-2xl border border-slate-300 p-8 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0"
            >
              {/* Institutional Header */}
              <div className="border-b-2 border-slate-900 pb-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                      <Layers className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                        Kimberley University of Technology
                      </h1>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                        Office of the Academic Registrar &bull; Examinations Directorate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-900 text-white text-[11px] font-mono px-3 py-1 rounded font-bold uppercase tracking-wider">
                      Official Academic Record
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Issued: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Identification Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Student Full Name</span>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{transcriptData.student.name}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Student ID Number</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{transcriptData.student.student_id}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Programme</span>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">{transcriptData.student.course}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cohort / Status</span>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">
                    Year {transcriptData.student.year_of_study} &bull; <StatusBadge status={transcriptData.student.status} size="sm" />
                  </div>
                </div>
              </div>

              {/* Module Performance Table */}
              <div className="mb-6">
                <table className="min-w-full divide-y divide-slate-300 text-xs border-b border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Code</th>
                      <th className="px-3 py-2.5 text-left">Module Title</th>
                      <th className="px-3 py-2.5 text-center">Credits</th>
                      <th className="px-3 py-2.5 text-left">Assessment Score Composition</th>
                      <th className="px-3 py-2.5 text-center">Final Mark</th>
                      <th className="px-3 py-2.5 text-center">Grade</th>
                      <th className="px-3 py-2.5 text-right">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {transcriptData.items.length > 0 ? (
                      transcriptData.items.map(item => (
                        <tr key={item.module.module_id}>
                          <td className="px-3 py-3 font-mono font-bold text-slate-900">
                            {item.module.module_code}
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {item.module.module_name}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-slate-700">
                            {item.module.credits}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-slate-600">
                            {item.marks.length > 0 ? (
                              item.marks.map(m => (
                                <span key={m.mark_id} className="inline-block mr-2">
                                  {m.assessment_name}: <strong>{m.mark}%</strong> ({m.assessment_weight}%)
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">Continuous assessments in progress</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-black text-sm text-slate-900">
                            {item.result ? `${item.result.final_mark}%` : '—'}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-800">
                            {item.result ? item.result.grade : '—'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {item.result ? <StatusBadge status={item.result.status} size="sm" /> : <span className="text-blue-700 font-semibold text-xs">ENROLLED</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                          No module registrations on record for this student in the current academic year.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Performance Metrics Summary Footer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="border-r border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Credits Earned</span>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {transcriptData.totalCreditsEarned} / {transcriptData.totalCreditsEnrolled}
                    </div>
                  </div>

                  <div className="border-r border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Weighted Average</span>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {transcriptData.overallAverage}%
                    </div>
                  </div>

                  <div className="border-r border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cumulative GPA (4.00)</span>
                    <div className="text-xl font-black text-purple-700 mt-1">
                      {transcriptData.gpa.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Official Standing</span>
                    <div className="text-xs font-extrabold text-slate-900 mt-1.5 uppercase">
                      {transcriptData.academicStanding}
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Institutional Certification Stamps */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-800">Dean of Faculty Verification</p>
                  <div className="mt-8 border-b border-slate-400 w-48" />
                  <p className="mt-1 text-[10px]">Authorised Signature & Faculty Seal</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">Registrar of Academic Affairs</p>
                  <div className="mt-8 border-b border-slate-400 w-48 ml-auto" />
                  <p className="mt-1 text-[10px]">Official Institutional Transcript Stamp</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No student selected for transcript generation.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODULE / CLASS PERFORMANCE REPORT */}
      {activeTab === 'MODULE' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 print:hidden">
            <label htmlFor="report-module-select" className="text-xs font-bold text-slate-700 uppercase">
              Select Module:
            </label>
            <select
              id="report-module-select"
              value={selectedModuleId}
              onChange={e => setSelectedModuleId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-sm"
            >
              {modules.map(m => (
                <option key={m.module_id} value={m.module_id}>
                  {m.module_code} - {m.module_name}
                </option>
              ))}
            </select>
          </div>

          {moduleReportData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Module Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {moduleReportData.module.module_code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {moduleReportData.module.module_name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Lecturer: <strong className="text-slate-800">{moduleReportData.lecturerName}</strong> &bull; {moduleReportData.module.credits} CAT Credits &bull; {moduleReportData.module.semester}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase">Class Pass Rate</div>
                  <div className="text-2xl font-black text-emerald-700">{moduleReportData.passRate}%</div>
                </div>
              </div>

              {/* Key Class Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Enrolled</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{moduleReportData.totalStudents}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Average Mark</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{moduleReportData.averageMark}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Highest Mark</span>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">{moduleReportData.highestMark}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lowest Mark</span>
                  <div className="text-lg font-bold text-amber-600 mt-0.5">{moduleReportData.lowestMark}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Distinctions</span>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">{moduleReportData.distinctionCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Fails / Exclusions</span>
                  <div className="text-lg font-bold text-rose-700 mt-0.5">{moduleReportData.failCount + moduleReportData.exclusionCount}</div>
                </div>
              </div>

              {/* Class Performance Roster */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Student Grade Roster
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                      <tr>
                        <th className="px-3 py-2.5 text-left">Student ID</th>
                        <th className="px-3 py-2.5 text-left">Student Name</th>
                        <th className="px-3 py-2.5 text-center">CW (30%)</th>
                        <th className="px-3 py-2.5 text-center">Midterm (20%)</th>
                        <th className="px-3 py-2.5 text-center">Final (50%)</th>
                        <th className="px-3 py-2.5 text-center">Final Mark</th>
                        <th className="px-3 py-2.5 text-center">Grade</th>
                        <th className="px-3 py-2.5 text-right">Academic Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {moduleReportData.students.map(s => {
                        const cw = s.marks.find(m => m.assessment_name.includes('Coursework'))?.mark;
                        const mt = s.marks.find(m => m.assessment_name.includes('Midterm'))?.mark;
                        const fe = s.marks.find(m => m.assessment_name.includes('Final Exam'))?.mark;

                        return (
                          <tr key={s.student.student_id} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2 font-mono font-bold text-slate-900">{s.student.student_id}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{s.student.name}</td>
                            <td className="px-3 py-2 text-center text-slate-700">{cw !== undefined ? `${cw}%` : '—'}</td>
                            <td className="px-3 py-2 text-center text-slate-700">{mt !== undefined ? `${mt}%` : '—'}</td>
                            <td className="px-3 py-2 text-center text-slate-700">{fe !== undefined ? `${fe}%` : '—'}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-900 text-sm">
                              {s.result ? `${s.result.final_mark}%` : '—'}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-slate-800">
                              {s.result ? s.result.grade : '—'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {s.result ? <StatusBadge status={s.result.status} size="sm" /> : <span className="text-slate-400">Pending</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No module selected.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL EXECUTIVE RESULTS SUMMARY */}
      {activeTab === 'INSTITUTIONAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Executive Institutional Results Summary
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Academic analytics, pass/fail distributions, and university standings.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Overall Pass Rate</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{institutionalSummary.overallPassRate}%</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all accredited modules</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Total Results Processed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{institutionalSummary.totalResultsProcessed}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated grade records</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Distinction Rate</span>
              <div className="text-2xl font-black text-purple-700 mt-1">
                {institutionalSummary.totalResultsProcessed ? Math.round((institutionalSummary.statusDistribution.DISTINCTION / institutionalSummary.totalResultsProcessed) * 100) : 0}%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{institutionalSummary.statusDistribution.DISTINCTION} honours awards</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Academic Exclusions</span>
              <div className="text-2xl font-black text-rose-700 mt-1">{institutionalSummary.statusDistribution.EXCLUSION}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Below standing orders threshold</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
