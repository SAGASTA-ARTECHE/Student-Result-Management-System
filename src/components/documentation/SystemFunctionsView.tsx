import React, { useState } from 'react';
import {
  Code,
  BookOpen,
  Calculator,
  Play,
  Layers,
  Database,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Zap,
  Star
} from 'lucide-react';
import { CalculationService } from '../../services/calculationService';

export const SystemFunctionsView: React.FC = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>('calculateResult');

  // Playground state for calculateResult
  const [testMarks, setTestMarks] = useState([
    { name: 'Coursework / Assignment', mark: 80, weight: 30 },
    { name: 'Midterm Test', mark: 75, weight: 20 },
    { name: 'Final Examination', mark: 85, weight: 50 },
  ]);
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);

  // Playground state for GPA
  const [testGpaModules, setTestGpaModules] = useState([
    { code: 'CS101', credits: 15, mark: 82 },
    { code: 'CS102', credits: 15, mark: 76 },
    { code: 'CS201', credits: 20, mark: 68 },
  ]);
  const [gpaResult, setGpaResult] = useState<any>(null);

  const handleRunCalculationPlayground = () => {
    try {
      const outcome = CalculationService.calculateResult(
        'STU-DEMO',
        'MOD-DEMO',
        testMarks.map(m => ({ assessment_name: m.name, mark: m.mark, assessment_weight: m.weight }))
      );
      setPlaygroundResult(outcome);
    } catch (err: any) {
      setPlaygroundResult({ error: err.message });
    }
  };

  const handleRunGpaPlayground = () => {
    const resultsMock: any[] = testGpaModules.map((m, idx) => ({
      result_id: `RES-${idx}`,
      student_id: 'STU-DEMO',
      module_id: `MOD-${m.code}`,
      final_mark: m.mark,
      grade: m.mark >= 75 ? 'A' : m.mark >= 65 ? 'B' : 'C',
      status: m.mark >= 50 ? 'PASS' : 'FAIL',
      academic_year: '2024/2025',
      semester: 'Semester 1',
      calculated_at: new Date().toISOString(),
    }));

    const modulesMock = testGpaModules.map(m => ({
      module_id: `MOD-${m.code}`,
      credits: m.credits,
    }));

    const gpaOutcome = CalculationService.calculateGPA(resultsMock, modulesMock);
    setGpaResult(gpaOutcome);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              System Functions & Implementation Defense Manual
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lecturer Assessment Requirement 4: Mathematical formulas, execution logic, database interactions, and defense justifications.
          </p>
        </div>
      </div>

      {/* Function Selector */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'calculateResult', name: 'CalculationService.calculateResult()' },
          { id: 'calculateGPA', name: 'CalculationService.calculateGPA()' },
          { id: 'saveAssessmentMarks', name: 'db.saveAssessmentMarks()' },
          { id: 'submitCourseRating', name: 'db.submitCourseRating()' },
          { id: 'concurrencyOCC', name: 'ConcurrencyService.executeOCC()' },
        ].map(fn => (
          <button
            key={fn.id}
            onClick={() => setSelectedFunction(fn.id)}
            className={`pb-3 px-3.5 border-b-2 font-mono transition-colors cursor-pointer ${
              selectedFunction === fn.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {fn.name}
          </button>
        ))}
      </div>

      {/* FUNCTION 1: calculateResult */}
      {selectedFunction === 'calculateResult' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  CORE CALCULATION ENGINE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2 font-mono">
                  CalculationService.calculateResult(studentId, moduleId, marks)
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Time Complexity: O(n) | Space: O(1)
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <h4 className="font-bold text-slate-900">1. Purpose & Architectural Role:</h4>
              <p>
                Calculates the student's accredited final module mark, grade letter, and Senate academic status. It acts as the mathematical authority for student grading, ensuring absolute precision and consistency.
              </p>

              <h4 className="font-bold text-slate-900 pt-2">2. Mathematical Formulation:</h4>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-2">
                <p className="text-emerald-400 font-bold">
                  // Standard Weighted Formula (Weights sum to 100%):
                </p>
                <p>M_final = Σ (Mark_i × Weight_i) / 100</p>
                <p className="text-amber-400 font-bold pt-2">
                  // Weight Normalization Formula (Partial assessment entries, e.g. weights sum to 50%):
                </p>
                <p>M_final = [ Σ (Mark_i × Weight_i) ] / [ Σ Weight_i ]</p>
              </div>

              <h4 className="font-bold text-slate-900 pt-2">3. Grading Thresholds & Decision Logic:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>≥ 85.00%:</strong> Grade <code>A+</code>, Status <code>DISTINCTION</code> (High Distinction)</li>
                <li><strong>75.00% - 84.99%:</strong> Grade <code>A</code>, Status <code>DISTINCTION</code></li>
                <li><strong>65.00% - 74.99%:</strong> Grade <code>B</code>, Status <code>PASS</code> (Merit)</li>
                <li><strong>50.00% - 64.99%:</strong> Grade <code>C</code>, Status <code>PASS</code> (Standard Pass)</li>
                <li><strong>35.00% - 49.99%:</strong> Grade <code>F</code>, Status <code>FAIL</code> (Eligible for Supplementary)</li>
                <li><strong>&lt; 35.00%:</strong> Grade <code>F</code>, Status <code>EXCLUSION</code> (Triggers Institutional Exclusion Review)</li>
              </ul>

              <h4 className="font-bold text-slate-900 pt-2">4. Database Interactions:</h4>
              <p>
                Reads configured academic thresholds from <code>DB_KEYS.ACADEMIC_RULES</code> and checks exclusion standing from <code>DB_KEYS.EXCLUSION_CONFIG</code>.
              </p>
            </div>
          </div>

          {/* Interactive Playground */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Interactive Function Playground: Test Formula Live
                </h4>
                <p className="text-[11px] text-slate-500">
                  Modify marks and weights to observe instant calculation and threshold classification.
                </p>
              </div>
              <button
                onClick={handleRunCalculationPlayground}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Execute Function Live
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {testMarks.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 truncate block">
                    {item.name}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Mark (%)</label>
                      <input
                        type="number"
                        value={item.mark}
                        onChange={e => {
                          const copy = [...testMarks];
                          copy[idx].mark = Number(e.target.value);
                          setTestMarks(copy);
                        }}
                        className="w-full font-bold px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Weight (%)</label>
                      <input
                        type="number"
                        value={item.weight}
                        onChange={e => {
                          const copy = [...testMarks];
                          copy[idx].weight = Number(e.target.value);
                          setTestMarks(copy);
                        }}
                        className="w-full font-bold px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {playgroundResult && (
              <div className="p-4 bg-white rounded-xl border border-blue-200 flex items-center justify-between text-xs animate-fade-in">
                <div>
                  <span className="text-[11px] font-bold text-slate-500">Output Result:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    Final Mark: <strong className="text-blue-700">{playgroundResult.finalMark}%</strong> • Grade: <strong>{playgroundResult.grade}</strong> • Status: <strong>{playgroundResult.status}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rule Applied: {playgroundResult.ruleName} ({playgroundResult.breakdownSummary})
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* FUNCTION 2: calculateGPA */}
      {selectedFunction === 'calculateGPA' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                  CUMULATIVE ACADEMIC STANDING
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2 font-mono">
                  CalculationService.calculateGPA(results, modules)
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Time Complexity: O(m)
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <h4 className="font-bold text-slate-900">1. Purpose:</h4>
              <p>
                Computes Credit-Weighted Grade Point Average (GPA) across all completed modules on the standard 4.0 international scale.
              </p>

              <h4 className="font-bold text-slate-900 pt-2">2. Mathematical Formulation:</h4>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-2">
                <p className="text-emerald-400 font-bold">// Credit-Weighted GPA Formula:</p>
                <p>GPA = [ Σ (GradePoints_i × Credits_i) ] / [ Σ Credits_i ]</p>
                <p className="text-slate-400 text-[11px] pt-1">
                  Where GradePoints: 85%+=4.0, 75%+=3.67, 65%+=3.0, 50%+=2.0, 40%+=1.0, &lt;40%=0.0
                </p>
              </div>
            </div>
          </div>

          {/* GPA Playground */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-600" />
                Live GPA Calculation Test
              </h4>
              <button
                onClick={handleRunGpaPlayground}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Calculate GPA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {testGpaModules.map((m, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">Course: {m.code}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Credits</label>
                      <input
                        type="number"
                        value={m.credits}
                        onChange={e => {
                          const copy = [...testGpaModules];
                          copy[idx].credits = Number(e.target.value);
                          setTestGpaModules(copy);
                        }}
                        className="w-full font-bold px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Final Mark (%)</label>
                      <input
                        type="number"
                        value={m.mark}
                        onChange={e => {
                          const copy = [...testGpaModules];
                          copy[idx].mark = Number(e.target.value);
                          setTestGpaModules(copy);
                        }}
                        className="w-full font-bold px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {gpaResult && (
              <div className="p-4 bg-white rounded-xl border border-purple-200 flex items-center justify-between text-xs animate-fade-in">
                <div>
                  <span className="text-[11px] font-bold text-slate-500">Calculated GPA:</span>
                  <div className="font-black text-purple-700 text-lg">
                    {gpaResult.gpa.toFixed(2)} / 4.00
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Credits Earned: {gpaResult.totalCreditsEarned} / {gpaResult.totalCreditsAttempted} attempted
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* FUNCTION 3: saveAssessmentMarks */}
      {selectedFunction === 'saveAssessmentMarks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            TRANSACTIONAL REPOSITORY & TRIGGERS
          </span>
          <h3 className="text-base font-bold text-slate-900 font-mono">
            db.saveAssessmentMarks(studentId, moduleId, marksList, operator)
          </h3>
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900">Execution Pipeline:</h4>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li><strong>BEFORE TRIGGER:</strong> Fires <code>trg_before_mark_validation</code> to enforce <code>[0.00, 100.00]</code> check constraints.</li>
              <li><strong>Persistence:</strong> Atomically updates <code>DB_KEYS.MARKS</code>.</li>
              <li><strong>OCC Versioning:</strong> Increments entity version to prevent Lost Updates.</li>
              <li><strong>Instant Cascade Calculation:</strong> Calls <code>autoCalculateAndSaveResult</code> so results never stay "Pending".</li>
              <li><strong>AFTER TRIGGER:</strong> Fires <code>trg_after_mark_insert_or_update</code>, logging execution latency to telemetry.</li>
              <li><strong>Audit Trail:</strong> Records operator username, timestamp, old value, and new value to <code>DB_KEYS.AUDIT_LOGS</code>.</li>
            </ol>
          </div>
        </div>
      )}

      {/* FUNCTION 4: submitCourseRating */}
      {selectedFunction === 'submitCourseRating' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            QUALITY ASSURANCE
          </span>
          <h3 className="text-base font-bold text-slate-900 font-mono">
            db.submitCourseRating(evaluation, operator)
          </h3>
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900">Security & Integrity Barriers:</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Enrollment Verification:</strong> Checks foreign key in <code>student_modules</code>. Only registered students may evaluate.</li>
              <li><strong>Duplicate Prevention:</strong> Strictly checks <code>hasStudentRatedModule</code>. Re-submissions are rejected with an explicit error.</li>
              <li><strong>Weighted Score:</strong> <code>Teaching (30%) + Fairness (30%) + Materials (20%) + Timeliness (20%)</code>.</li>
              <li><strong>Trigger Recalculation:</strong> Fires <code>trg_after_rating_insert</code> to update faculty rating averages.</li>
            </ul>
          </div>
        </div>
      )}

      {/* FUNCTION 5: concurrencyOCC */}
      {selectedFunction === 'concurrencyOCC' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            CONCURRENCY & TRANSACTION ISOLATION
          </span>
          <h3 className="text-base font-bold text-slate-900 font-mono">
            Optimistic Concurrency Control (OCC) Architecture
          </h3>
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900">How Lost Updates Are Prevented:</h4>
            <p>
              Traditional naive databases suffer from Lost Updates when two examiners open the same student mark at 10:00. Examiner A saves 80 at 10:01; Examiner B saves 75 at 10:02, overwriting A's work without knowing.
            </p>
            <p>
              In our system, every record carries a <code>version</code> number:
            </p>
            <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl space-y-1">
              <p>UPDATE marks SET mark = :newMark, version = version + 1</p>
              <p>WHERE student_id = :sId AND module_id = :mId AND version = :expectedVersion;</p>
            </div>
            <p>
              If 0 rows are affected (version mismatch), the system intercepts the collision, aborts the write, and raises a 409 Conflict.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
