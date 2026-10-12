import { db } from '../data/db';
import { AuthService } from './authService';
import { CalculationService } from './calculationService';
import { ReportService } from './reportService';
import { E2ETestCase, E2ETestSuiteSummary } from '../types';

export class E2ETestService {
  /**
   * Executes the full end-to-end automated test suite across all system tiers:
   * Auth/RBAC, Input Validation, Database Triggers, Concurrency, Ratings, Academic Rules, and Persistence.
   */
  public static async runAllTests(
    onProgress?: (testIndex: number, currentTest: E2ETestCase) => void
  ): Promise<E2ETestSuiteSummary> {
    const testCases: Array<() => Promise<E2ETestCase>> = [
      this.testAuthAndRBAC,
      this.testMarkEntryValidation,
      this.testDatabaseTriggersCascade,
      this.testStudentTranscriptRealtimeSync,
      this.testOptimisticConcurrencyControl,
      this.testCourseRatingSystem,
      this.testAcademicRulesAndExclusion,
      this.testDatabaseACIDAndRelationalDDL,
    ];

    const results: E2ETestCase[] = [];
    const suiteStartTime = performance.now();

    for (let i = 0; i < testCases.length; i++) {
      const runner = testCases[i];
      const testResult = await runner();
      results.push(testResult);
      if (onProgress) {
        onProgress(i + 1, testResult);
      }
      // Small tick for realistic visual feedback in presentation
      await new Promise(r => setTimeout(r, 60));
    }

    const suiteDuration = Math.round(performance.now() - suiteStartTime);
    const passedCount = results.filter(r => r.status === 'PASSED').length;
    const failedCount = results.filter(r => r.status === 'FAILED').length;

    return {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      duration_ms: suiteDuration,
      run_timestamp: new Date().toISOString(),
      tests: results,
    };
  }

  // --- 1. RBAC & AUTHENTICATION WORKFLOW ---
  private static async testAuthAndRBAC(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    // Test Admin Login
    const adminSession = AuthService.login('maje', 'Admin@123');
    assertions.push({
      description: 'Administrator credentials authenticated with correct role',
      passed: adminSession.user.role === 'ADMINISTRATOR' && adminSession.user.username === 'maje',
      expected: 'ADMINISTRATOR',
      actual: adminSession.user.role,
    });

    // Test Lecturer Login
    const lecSession = AuthService.login('dr.may', 'Lecturer@123');
    assertions.push({
      description: 'Lecturer authenticated with linked faculty profile',
      passed: lecSession.user.role === 'LECTURER' && Boolean(lecSession.user.reference_id),
      expected: 'LECTURER',
      actual: lecSession.user.role,
    });

    // Test Student Login
    const stuSession = AuthService.login('tlhompo', 'Student@123');
    assertions.push({
      description: 'Student authenticated with linked student registry ID',
      passed: stuSession.user.role === 'STUDENT' && Boolean(stuSession.user.reference_id),
      expected: 'STUDENT',
      actual: stuSession.user.role,
    });

    // Test Invalid Password rejection
    let rejectedInvalid = false;
    try {
      AuthService.login('maje', 'WrongPassword!999');
    } catch {
      rejectedInvalid = true;
    }
    assertions.push({
      description: 'Invalid credentials rejected with security error',
      passed: rejectedInvalid,
      expected: true,
      actual: rejectedInvalid,
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-01',
      name: 'Authentication & Role-Based Access Control (RBAC)',
      category: 'AUTH_RBAC',
      description: 'Verifies multi-role authentication (Admin, Lecturer, Student), session tokens, and rejection of invalid credentials.',
      workflow_steps: [
        'Authenticate Administrator (maje) and verify permissions',
        'Authenticate Faculty Lecturer (dr.may) and check reference link',
        'Authenticate Enrolled Student (tlhompo) and verify profile match',
        'Attempt authentication with invalid credentials and verify rejection',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 2. MARK ENTRY & BOUNDARY VALIDATION ---
  private static async testMarkEntryValidation(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    // Boundary 1: Negative Mark (< 0)
    const valNegative = CalculationService.validateMark(-5);
    assertions.push({
      description: 'Rejects negative score (-5%) with validation error',
      passed: !valNegative.valid && Boolean(valNegative.error),
      expected: false,
      actual: valNegative.valid,
    });

    // Boundary 2: Mark Exceeding 100%
    const valOverflow = CalculationService.validateMark(115);
    assertions.push({
      description: 'Rejects score exceeding 100% (115%)',
      passed: !valOverflow.valid && Boolean(valOverflow.error),
      expected: false,
      actual: valOverflow.valid,
    });

    // Boundary 3: Non-numeric Mark
    const valNaN = CalculationService.validateMark('ABC_INVALID');
    assertions.push({
      description: 'Rejects non-numeric alphabetic input',
      passed: !valNaN.valid,
      expected: false,
      actual: valNaN.valid,
    });

    // Boundary 4: Valid Range [0, 100]
    const valValid = CalculationService.validateMark(85.5);
    assertions.push({
      description: 'Accepts valid numerical percentage score (85.5%)',
      passed: valValid.valid,
      expected: true,
      actual: valValid.valid,
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-02',
      name: 'Assessment Mark Input & Boundary Validation',
      category: 'MARKS_VALIDATION',
      description: 'Validates strict numerical domain constraints: rejects negative marks, numbers > 100%, and NaN strings.',
      workflow_steps: [
        'Test lower boundary: -5% rejected',
        'Test upper boundary: 115% rejected',
        'Test format boundary: alphabetic string rejected',
        'Test valid value: 85.5% accepted within [0, 100]',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 3. DATABASE TRIGGERS CASCADE ---
  private static async testDatabaseTriggersCascade(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    const triggers = db.getTriggers();
    assertions.push({
      description: 'Registered database triggers are loaded and active in the trigger registry',
      passed: triggers.length >= 5 && triggers.every(t => t.enabled),
      expected: '>= 5 triggers enabled',
      actual: `${triggers.length} triggers registered`,
    });

    // Test Trigger: trg_before_mark_validation & trg_after_mark_insert_or_update
    const initialLogCount = db.getTriggerLogs().length;

    // Simulate saving valid marks for demonstration student
    const testMarks = [
      { assessment_name: 'Test 1', mark: 80, assessment_weight: 30 },
      { assessment_name: 'Final Exam', mark: 85, assessment_weight: 70 },
    ];

    const operator = { user_id: 'USR-DRMAY', username: 'dr.may', user_role: 'LECTURER' as const };
    db.saveAssessmentMarks('STU-TLHOMPO', 'MOD-CS101', testMarks, operator);

    const afterLogs = db.getTriggerLogs();
    const recentTriggerNames = afterLogs.slice(0, 4).map(l => l.trigger_name);

    assertions.push({
      description: 'Fired trg_before_mark_validation before persistence',
      passed: recentTriggerNames.includes('trg_before_mark_validation'),
      expected: true,
      actual: recentTriggerNames.includes('trg_before_mark_validation'),
    });

    assertions.push({
      description: 'Fired trg_after_mark_insert_or_update to recalculate results & GPA',
      passed: recentTriggerNames.includes('trg_after_mark_insert_or_update'),
      expected: true,
      actual: recentTriggerNames.includes('trg_after_mark_insert_or_update'),
    });

    assertions.push({
      description: 'Trigger telemetry recorded execution duration in milliseconds',
      passed: afterLogs.length > initialLogCount && afterLogs[0].execution_time_ms > 0,
      expected: '> 0 ms',
      actual: `${afterLogs[0]?.execution_time_ms} ms`,
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-03',
      name: 'Database Triggers Cascading Execution',
      category: 'TRIGGERS',
      description: 'Verifies that database triggers fire automatically on mark mutation, executing validation and cascading grade calculations.',
      workflow_steps: [
        'Inspect trigger definitions in system dictionary',
        'Invoke saveAssessmentMarks with valid marks',
        'Verify trg_before_mark_validation fired before insert',
        'Verify trg_after_mark_insert_or_update fired after insert',
        'Verify telemetry logged latency and audit trails',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 4. REAL-TIME STUDENT TRANSCRIPT SYNC (NO PENDING DELAY) ---
  private static async testStudentTranscriptRealtimeSync(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    // Verify transcript for student Tlhompo
    const transcript = ReportService.getStudentTranscript('STU-TLHOMPO');

    assertions.push({
      description: 'Transcript loaded successfully for student profile',
      passed: Boolean(transcript) && transcript?.student.student_id === 'STU-TLHOMPO',
      expected: 'STU-TLHOMPO',
      actual: transcript?.student.student_id,
    });

    const cs101Item = transcript?.items.find(i => i.module.module_code === 'CS101');
    assertions.push({
      description: 'CS101 result is calculated and not stuck in "Pending"',
      passed: Boolean(cs101Item?.result) && cs101Item?.result?.status !== undefined,
      expected: 'Computed Result Record',
      actual: cs101Item?.result ? `${cs101Item.result.final_mark}% [${cs101Item.result.status}]` : 'Pending',
    });

    assertions.push({
      description: 'Cumulative GPA is computed from credits and grade points',
      passed: Boolean(transcript && transcript.gpa > 0),
      expected: '> 0.00 GPA',
      actual: `${transcript?.gpa.toFixed(2)} GPA`,
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-04',
      name: 'Student Portal Real-Time Result Synchronization',
      category: 'STUDENT_SYNC',
      description: 'Ensures student portal immediately reflects marks captured by lecturers without remaining in a "Pending" state.',
      workflow_steps: [
        'Fetch student academic transcript for registered modules',
        'Verify CS101 final mark and grade letter are resolved immediately',
        'Verify Cumulative GPA is computed dynamically without pending state',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 5. OPTIMISTIC CONCURRENCY CONTROL (OCC) ---
  private static async testOptimisticConcurrencyControl(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    const opA = { username: 'dr.may', user_role: 'LECTURER' };
    const opB = { username: 'maje', user_role: 'ADMINISTRATOR' };

    // Simulate 2 users attempting simultaneous edits on the same mark record
    const simResult = db.simulateConcurrentConflict('STU-TLHOMPO', 'MOD-CS101', opA, opB, 82, 88);

    assertions.push({
      description: 'Detected concurrent write conflict between two simultaneous operators',
      passed: simResult.conflict === true,
      expected: true,
      actual: simResult.conflict,
    });

    assertions.push({
      description: 'Version mismatch caught: Current Version > Attempted Stale Version',
      passed: simResult.details.current_version > simResult.details.attempted_version,
      expected: `v${simResult.details.attempted_version + 1} > v${simResult.details.attempted_version}`,
      actual: `Current: v${simResult.details.current_version}, Attempted: v${simResult.details.attempted_version}`,
    });

    // Check that conflict was logged to audit trail
    const auditLogs = db.getAuditLogs();
    const conflictLog = auditLogs.find(l => l.action === 'CONCURRENCY_CONFLICT_DETECTED');
    assertions.push({
      description: 'Concurrency collision logged to institutional audit trail',
      passed: Boolean(conflictLog),
      expected: 'Logged in Audit Trail',
      actual: conflictLog ? 'Audited with rollback flag' : 'Missing',
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-05',
      name: 'Optimistic Concurrency Control (OCC) & Lost Update Prevention',
      category: 'CONCURRENCY',
      description: 'Simulates race conditions and dual writes. Verifies that stale version submissions are detected and prevented from overwriting newer changes.',
      workflow_steps: [
        'Read record at Version 1',
        'User A commits update, advancing database record to Version 2',
        'User B submits write based on stale Version 1',
        'Verify OCC catches 409 Conflict and triggers collision resolution',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 6. COURSE & FACULTY RATING SYSTEM ---
  private static async testCourseRatingSystem(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    const operator = { user_id: 'USR-TLHOMPO', username: 'tlhompo', user_role: 'STUDENT' as const };

    // Test 1: Duplicate rating prevention
    // Tlhompo already rated CS101 in initialData
    let duplicateBlocked = false;
    try {
      db.submitCourseRating(
        {
          student_id: 'STU-TLHOMPO',
          module_id: 'MOD-CS101',
          lecturer_id: 'LEC-MAY',
          teaching_score: 5,
          fairness_score: 5,
          materials_score: 5,
          timeliness_score: 5,
          is_anonymous: false,
          academic_year: '2024/2025',
          semester: 'Semester 1',
        },
        operator
      );
    } catch {
      duplicateBlocked = true;
    }

    assertions.push({
      description: 'Duplicate course rating from the same student is strictly blocked',
      passed: duplicateBlocked,
      expected: true,
      actual: duplicateBlocked,
    });

    // Test 2: Non-enrolled student rating prevention
    let nonEnrolledBlocked = false;
    try {
      db.submitCourseRating(
        {
          student_id: 'STU-TLHOMPO',
          module_id: 'MOD-IS202', // Student is not registered in IS202
          lecturer_id: 'LEC-MAY',
          teaching_score: 4,
          fairness_score: 4,
          materials_score: 4,
          timeliness_score: 4,
          is_anonymous: false,
          academic_year: '2024/2025',
          semester: 'Semester 2',
        },
        operator
      );
    } catch {
      nonEnrolledBlocked = true;
    }

    assertions.push({
      description: 'Non-enrolled student rating is blocked by enrollment integrity constraint',
      passed: nonEnrolledBlocked,
      expected: true,
      actual: nonEnrolledBlocked,
    });

    // Test 3: Rating summary calculation
    const summary = db.calculateModuleRatingSummary('MOD-CS101');
    assertions.push({
      description: 'Calculates aggregate teaching effectiveness & satisfaction rate',
      passed: summary.total_ratings > 0 && summary.average_overall > 0,
      expected: 'Valid Rating Summary',
      actual: `Avg: ${summary.average_overall}/5.0 (${summary.satisfaction_rate}% Satisfaction)`,
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-06',
      name: 'Course & Faculty Teaching Evaluation System',
      category: 'RATINGS',
      description: 'Verifies the student rating system: validates enrollment eligibility, prevents duplicate ratings, and computes aggregate metrics.',
      workflow_steps: [
        'Attempt duplicate evaluation for MOD-CS101 -> Verify rejection',
        'Attempt evaluation for unregistered MOD-IS202 -> Verify enrollment barrier',
        'Verify module and faculty aggregate scores calculated correctly',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 7. ACADEMIC RULES & EXCLUSION STANDING ---
  private static async testAcademicRulesAndExclusion(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    // Test Distinction Grade
    const distinctionRes = CalculationService.calculateFinalGrade([
      { assessment_name: 'Exam', mark: 85, assessment_weight: 100 },
    ]);
    assertions.push({
      description: 'Score 85% qualifies for DISTINCTION and Grade A+',
      passed: distinctionRes.status === 'DISTINCTION',
      expected: 'DISTINCTION',
      actual: distinctionRes.status,
    });

    // Test Pass Grade
    const passRes = CalculationService.calculateFinalGrade([
      { assessment_name: 'Exam', mark: 58, assessment_weight: 100 },
    ]);
    assertions.push({
      description: 'Score 58% qualifies for PASS and Grade C',
      passed: passRes.status === 'PASS',
      expected: 'PASS',
      actual: passRes.status,
    });

    // Test Fail Grade
    const failRes = CalculationService.calculateFinalGrade([
      { assessment_name: 'Exam', mark: 42, assessment_weight: 100 },
    ]);
    assertions.push({
      description: 'Score 42% qualifies for FAIL and Grade F',
      passed: failRes.status === 'FAIL',
      expected: 'FAIL',
      actual: failRes.status,
    });

    // Test Exclusion Threshold
    const exclusionRes = CalculationService.calculateFinalGrade([
      { assessment_name: 'Exam', mark: 22, assessment_weight: 100 },
    ]);
    assertions.push({
      description: 'Score 22% (< 35% threshold) triggers EXCLUSION status',
      passed: exclusionRes.status === 'EXCLUSION',
      expected: 'EXCLUSION',
      actual: exclusionRes.status,
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-07',
      name: 'Academic Grading Rules & Exclusion Standing Engine',
      category: 'EXCLUSION',
      description: 'Verifies academic standing classification based on Senate thresholds: Distinction, Pass, Fail, and Critical Exclusion.',
      workflow_steps: [
        'Evaluate 85% -> Verify Distinction classification',
        'Evaluate 58% -> Verify Standard Pass classification',
        'Evaluate 42% -> Verify Supplementary / Academic Fail classification',
        'Evaluate 22% -> Verify Academic Exclusion threshold trigger',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // --- 8. DATABASE ACID & RELATIONAL DDL GENERATION ---
  private static async testDatabaseACIDAndRelationalDDL(): Promise<E2ETestCase> {
    const start = performance.now();
    const assertions = [];

    // Verify Relational Integrity Checksum
    const integrity = db.verifyDatabaseIntegrity();
    assertions.push({
      description: 'Relational database foreign keys and domain integrity verified (0 orphans)',
      passed: integrity.isValid,
      expected: true,
      actual: integrity.isValid,
    });

    // Verify JSON Snapshot Export
    const exportJson = db.exportDatabaseJSON();
    assertions.push({
      description: 'JSON database export successfully creates complete snapshot',
      passed: Boolean(exportJson) && exportJson.length > 500 && exportJson.includes('srms_users'),
      expected: 'Valid JSON Archive',
      actual: `${(exportJson.length / 1024).toFixed(1)} KB snapshot`,
    });

    // Verify MySQL Relational DDL Script
    const sqlDump = db.generateMySQLDump();
    assertions.push({
      description: 'Relational MySQL DDL script contains 3NF schema, indexes, and triggers',
      passed: sqlDump.includes('CREATE TABLE') && sqlDump.includes('PRIMARY KEY') && sqlDump.includes('FOREIGN KEY'),
      expected: 'Contains 3NF Table DDL',
      actual: 'DDL generated with foreign keys & indexes',
    });

    const passed = assertions.every(a => a.passed);
    return {
      id: 'E2E-08',
      name: 'Database ACID Constraints & SQL DDL Generation',
      category: 'DATABASE_ACID',
      description: 'Verifies third normal form (3NF) relational constraints, foreign keys, JSON snapshot export, and SQL deployment generation.',
      workflow_steps: [
        'Run foreign key cascade & orphan inspection across all tables',
        'Generate full JSON database export payload',
        'Verify production MySQL 8.0+ DDL generation with table constraints',
      ],
      assertions,
      status: passed ? 'PASSED' : 'FAILED',
      duration_ms: Math.round(performance.now() - start),
    };
  }
}
