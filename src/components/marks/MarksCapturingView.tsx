import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  BookOpen,
  User,
  Calculator,
  RefreshCw,
  Info,
  ShieldAlert
} from 'lucide-react';
import { db } from '../../data/db';
import { CalculationService } from '../../services/calculationService';
import { AuthSession, Module, Student, MarkEntryInput } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface MarksCapturingViewProps {
  session: AuthSession;
  initialModuleId?: string;
  onViewResults?: () => void;
}

interface StudentMarkRow {
  student: Student;
  coursework: string; // Coursework (30%)
  midterm: string;    // Midterm (20%)
  finalExam: string;  // Final Exam (50%)
  validationError?: string;
  previewFinalMark?: number;
  previewGrade?: string;
  previewStatus?: string;
}

export const MarksCapturingView: React.FC<MarksCapturingViewProps> = ({
  session,
  initialModuleId,
  onViewResults,
}) => {
  const isLecturer = session.user.role === 'LECTURER';
  const allLecturers = db.getLecturers();
  const currentLecturer =
    session.lecturer_profile ||
    (session.user.reference_id ? db.getLecturerById(session.user.reference_id) : undefined) ||
    allLecturers.find(
      l => l.email.toLowerCase() === session.user.email.toLowerCase() ||
           (session.user.reference_id && l.lecturer_id.toLowerCase() === session.user.reference_id.toLowerCase())
    );
  const lecturerId = currentLecturer?.lecturer_id || session.user.reference_id;

  // Available modules: If lecturer, only assigned modules (or all if none assigned yet or admin)
  const allModules = db.getModules();
  const myAssignedModules = isLecturer && lecturerId
    ? allModules.filter(m => m.lecturer_id === lecturerId)
    : [];
  const availableModules = isLecturer
    ? (myAssignedModules.length > 0 ? myAssignedModules : allModules)
    : allModules;

  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    if (initialModuleId && availableModules.some(m => m.module_id === initialModuleId)) {
      return initialModuleId;
    }
    return availableModules[0]?.module_id || '';
  });

  const [rows, setRows] = useState<StudentMarkRow[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedModule = db.getModuleById(selectedModuleId);

  const handleClaimModule = () => {
    if (!selectedModule || !lecturerId) return;
    try {
      db.updateModule(
        selectedModule.module_id,
        { lecturer_id: lecturerId },
        { user_id: session.user.user_id, username: session.user.username, user_role: session.user.role }
      );
      setSuccessMessage(`Module "${selectedModule.module_code} - ${selectedModule.module_name}" is now assigned to you!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to assign module.');
    }
  };

  // Load registered students and their existing marks whenever module changes
  useEffect(() => {
    if (!selectedModuleId) {
      setRows([]);
      return;
    }

    const registrations = db.getRegistrationsByModule(selectedModuleId);
    const existingMarks = db.getMarksByModule(selectedModuleId);

    const loadedRows: StudentMarkRow[] = registrations.map(reg => {
      const student = db.getStudentById(reg.student_id);
      if (!student) {
        return {
          student: {
            student_id: reg.student_id,
            name: 'Unknown Student',
            course: 'N/A',
            email: '',
            year_of_study: 1,
            academic_year: '2024/2025',
            status: 'ACTIVE',
            created_at: '',
          },
          coursework: '',
          midterm: '',
          finalExam: '',
        };
      }

      // Find existing marks for this student with robust name matching
      const studentMarks = existingMarks.filter(m => m.student_id === student.student_id);

      const cw = studentMarks.find(m => {
        const n = m.assessment_name.toLowerCase();
        return n.includes('coursework') || n.includes('test 1') || n.includes('ca') || n.includes('assignment 1');
      }) || (studentMarks.length > 0 && !studentMarks[0].assessment_name.toLowerCase().includes('exam') ? studentMarks[0] : undefined);

      const mt = studentMarks.find(m => {
        const n = m.assessment_name.toLowerCase();
        return n.includes('midterm') || n.includes('test 2') || n.includes('project') || n.includes('assignment 2');
      }) || (studentMarks.length > 1 && !studentMarks[1].assessment_name.toLowerCase().includes('exam') ? studentMarks[1] : undefined);

      const fe = studentMarks.find(m => {
        const n = m.assessment_name.toLowerCase();
        return n.includes('final exam') || n.includes('exam') || n.includes('final');
      }) || (studentMarks.length > 2 ? studentMarks[2] : undefined);

      const cwVal = cw ? cw.mark.toString() : '';
      const mtVal = mt ? mt.mark.toString() : '';
      const feVal = fe ? fe.mark.toString() : '';

      // Check if existing FinalResult is already persisted in the database
      const existingRes = db.getResultByStudentAndModule(student.student_id, selectedModuleId);

      let previewFinal: number | undefined = existingRes?.final_mark;
      let previewG: string | undefined = existingRes?.grade;
      let previewS: string | undefined = existingRes?.status;

      // If not yet persisted or if marks are present, calculate preview dynamically
      if (previewFinal === undefined && (cwVal !== '' || mtVal !== '' || feVal !== '')) {
        const assessed: Array<{ assessment_name: string; mark: number; assessment_weight: number }> = [];
        if (cwVal !== '') assessed.push({ assessment_name: 'Coursework', mark: Number(cwVal), assessment_weight: 30 });
        if (mtVal !== '') assessed.push({ assessment_name: 'Midterm Exam', mark: Number(mtVal), assessment_weight: 20 });
        if (feVal !== '') assessed.push({ assessment_name: 'Final Exam', mark: Number(feVal), assessment_weight: 50 });

        if (assessed.length > 0) {
          try {
            const calculated = CalculationService.calculateFinalGrade(assessed);
            previewFinal = calculated.finalMark;
            previewG = calculated.grade;
            previewS = calculated.status;
          } catch (e) {
            // Ignore preview calculation edge cases
          }
        }
      }

      return {
        student,
        coursework: cwVal,
        midterm: mtVal,
        finalExam: feVal,
        previewFinalMark: previewFinal,
        previewGrade: previewG,
        previewStatus: previewS,
      };
    });

    setRows(loadedRows);
    setSuccessMessage(null);
    setGlobalError(null);
  }, [selectedModuleId]);

  const updateStudentMark = (
    index: number,
    field: 'coursework' | 'midterm' | 'finalExam',
    value: string
  ) => {
    const newRows = [...rows];
    const row = { ...newRows[index] };
    row[field] = value;

    // Validate the input value
    if (value.trim() !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        row.validationError = 'Must be a valid number.';
      } else if (num < 0) {
        row.validationError = 'Negative marks are strictly invalid (< 0).';
      } else if (num > 100) {
        row.validationError = 'Mark exceeds maximum permissible score (> 100).';
      } else {
        row.validationError = undefined;
      }
    } else {
      row.validationError = undefined;
    }

    // Dynamic real-time calculation preview for any valid marks provided
    const assessments: Array<{ assessment_name: string; mark: number; assessment_weight: number }> = [];
    if (row.coursework.trim() !== '') {
      const n = Number(row.coursework);
      if (!isNaN(n) && n >= 0 && n <= 100) {
        assessments.push({ assessment_name: 'Coursework', mark: n, assessment_weight: 30 });
      }
    }
    if (row.midterm.trim() !== '') {
      const n = Number(row.midterm);
      if (!isNaN(n) && n >= 0 && n <= 100) {
        assessments.push({ assessment_name: 'Midterm Exam', mark: n, assessment_weight: 20 });
      }
    }
    if (row.finalExam.trim() !== '') {
      const n = Number(row.finalExam);
      if (!isNaN(n) && n >= 0 && n <= 100) {
        assessments.push({ assessment_name: 'Final Exam', mark: n, assessment_weight: 50 });
      }
    }

    if (assessments.length > 0 && !row.validationError) {
      try {
        const calculated = CalculationService.calculateFinalGrade(assessments);
        row.previewFinalMark = calculated.finalMark;
        row.previewGrade = calculated.grade;
        row.previewStatus = calculated.status;
      } catch {
        row.previewFinalMark = undefined;
        row.previewGrade = undefined;
        row.previewStatus = undefined;
      }
    } else if (assessments.length === 0) {
      row.previewFinalMark = undefined;
      row.previewGrade = undefined;
      row.previewStatus = undefined;
    }

    newRows[index] = row;
    setRows(newRows);
  };

  const handleSaveAllMarks = () => {
    setGlobalError(null);
    setSuccessMessage(null);

    if (!selectedModuleId) {
      setGlobalError('Please select a valid module.');
      return;
    }

    // Check for validation errors
    const hasErrors = rows.some(r => !!r.validationError);
    if (hasErrors) {
      setGlobalError('Please fix mark validation errors (values must be numerical between 0 and 100) before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      let savedCount = 0;
      const updatedRows = [...rows];

      rows.forEach((row, idx) => {
        // Only save rows where at least one mark is provided
        const assessments: MarkEntryInput[] = [];

        if (row.coursework.trim() !== '') {
          assessments.push({
            assessment_name: 'Coursework',
            mark: Number(row.coursework),
            assessment_weight: 30,
          });
        }

        if (row.midterm.trim() !== '') {
          assessments.push({
            assessment_name: 'Midterm Exam',
            mark: Number(row.midterm),
            assessment_weight: 20,
          });
        }

        if (row.finalExam.trim() !== '') {
          assessments.push({
            assessment_name: 'Final Exam',
            mark: Number(row.finalExam),
            assessment_weight: 50,
          });
        }

        if (assessments.length > 0) {
          db.saveStudentMarks(
            row.student.student_id,
            selectedModuleId,
            assessments,
            operator
          );
          savedCount++;

          // Immediately reflect newly calculated & persisted result
          const savedRes = db.getResultByStudentAndModule(row.student.student_id, selectedModuleId);
          if (savedRes) {
            updatedRows[idx] = {
              ...updatedRows[idx],
              previewFinalMark: savedRes.final_mark,
              previewGrade: savedRes.grade,
              previewStatus: savedRes.status,
            };
          }
        }
      });

      setRows(updatedRows);
      setSuccessMessage(
        `Marks captured and final results successfully calculated & published for ${savedCount} student(s) in ${selectedModule?.module_code}. Students can now see their updated grades, GPA, and transcripts.`
      );
    } catch (err: any) {
      setGlobalError(err.message || 'An unexpected error occurred while saving marks.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Capture Student Marks
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enter coursework and examination marks for your modules
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onViewResults && (
            <button
              onClick={onViewResults}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              View Results
            </button>
          )}

          <button
            id="prominent-blue-save-marks-btn"
            type="button"
            onClick={handleSaveAllMarks}
            disabled={isSaving || rows.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] active:bg-[#1b3a9a] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save & Calculate Results'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          id="marks-save-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 shadow-xs animate-fade-in"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Marks & Automated Calculations Saved!</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {globalError && (
        <div
          id="marks-save-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-3 shadow-xs animate-shake"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Action Blocked:</span>
            <p className="text-[11px] text-rose-800 mt-0.5">{globalError}</p>
          </div>
        </div>
      )}

      {/* Module Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label
            htmlFor="marks-module-select"
            className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap"
          >
            Select Module:
          </label>
          <select
            id="marks-module-select"
            value={selectedModuleId}
            onChange={e => setSelectedModuleId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-full sm:w-80"
          >
            {availableModules.map(m => (
              <option key={m.module_id} value={m.module_id}>
                {m.module_code} - {m.module_name} ({m.credits} credits)
              </option>
            ))}
          </select>
        </div>

        {selectedModule && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium w-full sm:w-auto justify-end">
            {isLecturer && selectedModule.lecturer_id !== lecturerId && (
              <button
                type="button"
                onClick={handleClaimModule}
                className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-100 cursor-pointer transition-colors"
                title="Assign this module to your lecturer profile"
              >
                + Assign Course to Me
              </button>
            )}
            <span>Enrolled Students: <strong className="text-slate-900 font-bold">{rows.length}</strong></span>
            <span>&bull;</span>
            <span>Weights: <strong className="text-emerald-700 font-bold">CW 30% | Midterm 20% | Exam 50%</strong></span>
          </div>
        )}
      </div>

      {/* Mark Capturing Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assessment Mark Matrix & Instant Grade Determination
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Strict numerical validation enforced: [0 - 100]
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100/70 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Student Details</th>
                <th className="px-3 py-3 text-center w-36">
                  Coursework
                  <div className="text-[10px] text-slate-500 font-normal">Weight: 30%</div>
                </th>
                <th className="px-3 py-3 text-center w-36">
                  Midterm Exam
                  <div className="text-[10px] text-slate-500 font-normal">Weight: 20%</div>
                </th>
                <th className="px-3 py-3 text-center w-36">
                  Final Exam
                  <div className="text-[10px] text-slate-500 font-normal">Weight: 50%</div>
                </th>
                <th className="px-4 py-3 text-center w-28 bg-slate-50">
                  Final Mark
                  <div className="text-[10px] text-blue-700 font-normal">Calculated</div>
                </th>
                <th className="px-4 py-3 text-center w-24 bg-slate-50">
                  Grade
                  <div className="text-[10px] text-blue-700 font-normal">Scale</div>
                </th>
                <th className="px-4 py-3 text-right w-36 bg-slate-50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr
                    key={row.student.student_id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      row.validationError ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {row.student.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {row.student.student_id} &bull; {row.student.course}
                      </div>
                      {row.validationError && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                          <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                          <span>{row.validationError}</span>
                        </div>
                      )}
                    </td>

                    {/* Coursework Input */}
                    <td className="px-3 py-3 text-center">
                      <div className="relative inline-block w-24">
                        <input
                          id={`mark-cw-${row.student.student_id}`}
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="0 - 100"
                          value={row.coursework}
                          onChange={e => updateStudentMark(index, 'coursework', e.target.value)}
                          className={`w-full text-center px-2 py-1.5 border rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#1d4ed8] ${
                            Number(row.coursework) < 0 || Number(row.coursework) > 100
                              ? 'border-rose-400 bg-rose-50 text-rose-900'
                              : 'border-slate-200 text-slate-900 bg-white'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Midterm Input */}
                    <td className="px-3 py-3 text-center">
                      <div className="relative inline-block w-24">
                        <input
                          id={`mark-midterm-${row.student.student_id}`}
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="0 - 100"
                          value={row.midterm}
                          onChange={e => updateStudentMark(index, 'midterm', e.target.value)}
                          className={`w-full text-center px-2 py-1.5 border rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#1d4ed8] ${
                            Number(row.midterm) < 0 || Number(row.midterm) > 100
                              ? 'border-rose-400 bg-rose-50 text-rose-900'
                              : 'border-slate-200 text-slate-900 bg-white'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Final Exam Input */}
                    <td className="px-3 py-3 text-center">
                      <div className="relative inline-block w-24">
                        <input
                          id={`mark-final-${row.student.student_id}`}
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="0 - 100"
                          value={row.finalExam}
                          onChange={e => updateStudentMark(index, 'finalExam', e.target.value)}
                          className={`w-full text-center px-2 py-1.5 border rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#1d4ed8] ${
                            Number(row.finalExam) < 0 || Number(row.finalExam) > 100
                              ? 'border-rose-400 bg-rose-50 text-rose-900'
                              : 'border-slate-200 text-slate-900 bg-white'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Instant Calculated Final Mark */}
                    <td className="px-4 py-3 text-center font-extrabold text-sm text-slate-900">
                      {row.previewFinalMark !== undefined ? (
                        <span>{row.previewFinalMark}%</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Instant Grade */}
                    <td className="px-4 py-3 text-center">
                      {row.previewGrade ? (
                        <StatusBadge status={row.previewGrade} size="sm" />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-right">
                      {row.previewStatus ? (
                        <StatusBadge status={row.previewStatus} size="sm" />
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Pending Entry</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No students currently registered for this module. Use the Registrations tab to enroll students first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Bottom Bar with Prominent Save Button */}
        {rows.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Calculation Rule: <strong className="text-slate-800">Final = (CW &times; 0.3) + (Midterm &times; 0.2) + (Exam &times; 0.5)</strong>
            </div>

            <button
              id="bottom-prominent-save-btn"
              type="button"
              onClick={handleSaveAllMarks}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-extrabold shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Processing & Saving...' : 'SAVE ALL MARKS'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
