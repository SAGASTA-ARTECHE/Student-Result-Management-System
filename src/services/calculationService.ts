import { AssessmentMark, FinalResult, ResultStatus, AcademicRule } from '../types';
import { db } from '../data/db';

export interface CalculationOutcome {
  finalMark: number;
  grade: string;
  status: ResultStatus;
  ruleName: string;
  breakdownSummary: string;
}

export class CalculationService {
  /**
   * Validates a single mark value according to institutional policies.
   */
  public static validateMark(value: number | string | undefined | null): { valid: boolean; error?: string } {
    if (value === undefined || value === null || value === '') {
      return { valid: false, error: 'Mark is required.' };
    }
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Mark must be a valid numerical value.' };
    }
    if (num < 0) {
      return { valid: false, error: 'Negative marks are not permitted (minimum 0).' };
    }
    if (num > 100) {
      return { valid: false, error: 'Mark cannot exceed 100%.' };
    }
    return { valid: true };
  }

  /**
   * Calculates the weighted final mark, grade, and academic status based on current academic rules.
   */
  public static calculateResult(
    studentId: string,
    moduleId: string,
    marks: Array<{ assessment_name: string; mark: number; assessment_weight: number }>
  ): CalculationOutcome {
    if (!marks || marks.length === 0) {
      throw new Error('Cannot calculate final result: No assessment marks provided.');
    }

    // Validate every mark
    for (const item of marks) {
      const validation = this.validateMark(item.mark);
      if (!validation.valid) {
        throw new Error(`Validation failed for "${item.assessment_name}": ${validation.error}`);
      }
      if (item.assessment_weight <= 0) {
        throw new Error(`Assessment weight for "${item.assessment_name}" must be greater than 0%.`);
      }
    }

    // Weighted calculation
    const totalWeight = marks.reduce((sum, item) => sum + item.assessment_weight, 0);
    let rawFinalMark = 0;

    if (Math.abs(totalWeight - 100) < 0.01) {
      // Direct 100% sum
      rawFinalMark = marks.reduce((sum, item) => sum + (item.mark * item.assessment_weight) / 100, 0);
    } else {
      // Normalize to 100%
      rawFinalMark = marks.reduce((sum, item) => sum + item.mark * item.assessment_weight, 0) / totalWeight;
    }

    const finalMark = Math.round(rawFinalMark * 100) / 100;

    // Check student status in DB (e.g. if already flagged for exclusion)
    const student = db.getStudentById(studentId);
    const exclusionConfig = db.getExclusionConfig();

    // Check academic rules
    const rules: AcademicRule[] = db.getAcademicRules();
    
    // Sort rules from highest minimum to lowest
    const sortedRules = [...rules].sort((a, b) => b.minimum_mark - a.minimum_mark);

    let matchedRule: AcademicRule | undefined = sortedRules.find(
      r => finalMark >= r.minimum_mark && finalMark <= r.maximum_mark
    );

    // Fallback if boundary rounding edge case
    if (!matchedRule) {
      if (finalMark >= 85) matchedRule = sortedRules[0];
      else matchedRule = sortedRules[sortedRules.length - 1];
    }

    let status: ResultStatus = matchedRule.status;
    let grade: string = matchedRule.grade_letter;
    let ruleName: string = matchedRule.rule_name;

    // Evaluate institutional exclusion rule:
    // If student is manually flagged EXCLUDED, or exclusionConfig is enabled and mark is critical
    if (student?.status === 'EXCLUDED') {
      status = 'EXCLUSION';
      grade = 'F';
      ruleName = 'Excluded by Academic Board Standing Orders';
    } else if (exclusionConfig.enabled && finalMark < exclusionConfig.minimum_passing_average) {
      status = 'EXCLUSION';
      grade = 'F';
      ruleName = `Academic Exclusion Threshold (< ${exclusionConfig.minimum_passing_average}%)`;
    }

    const breakdownSummary = marks
      .map(m => `${m.assessment_name}: ${m.mark}% (${m.assessment_weight}%)`)
      .join(' + ');

    return {
      finalMark,
      grade,
      status,
      ruleName,
      breakdownSummary,
    };
  }

  /**
   * Preview helper to calculate final mark, letter grade, and status without saving.
   */
  public static calculateFinalGrade(
    marks: Array<{ assessment_name: string; mark: number; assessment_weight: number }>
  ): { finalMark: number; grade: string; status: ResultStatus } {
    if (!marks || marks.length === 0) {
      return { finalMark: 0, grade: 'F', status: 'FAIL' };
    }
    const outcome = this.calculateResult('PREVIEW', 'MOD-PREVIEW', marks);
    return {
      finalMark: outcome.finalMark,
      grade: outcome.grade,
      status: outcome.status,
    };
  }

  /**
   * Recalculates and updates the final result for a specific student and module.
   */
  public static recalculateStudentResult(
    studentId: string,
    moduleId: string,
    operator: { user_id: string; username: string; user_role: any }
  ): FinalResult | null {
    return db.recalculateResultForStudent(studentId, moduleId, operator);
  }

  /**
   * Recalculates and updates final results for all registered students with marks.
   */
  public static recalculateAllResults(
    operator: { user_id: string; username: string; user_role: any }
  ): FinalResult[] {
    const registrations = db.getRegistrations();
    const allModules = db.getModules();
    const recalculated: FinalResult[] = [];

    for (const reg of registrations) {
      const marks = db.getMarksByStudentAndModule(reg.student_id, reg.module_id);
      if (marks.length === 0) continue;

      const mod = allModules.find(m => m.module_id === reg.module_id);
      try {
        const outcome = this.calculateResult(reg.student_id, reg.module_id, marks);
        const saved = db.saveResult(
          {
            student_id: reg.student_id,
            module_id: reg.module_id,
            final_mark: outcome.finalMark,
            grade: outcome.grade,
            status: outcome.status,
            academic_year: reg.academic_year,
            semester: mod?.semester || reg.semester,
          },
          operator
        );
        recalculated.push(saved);
      } catch (err) {
        console.warn(`Could not recalculate for student ${reg.student_id}:`, err);
      }
    }

    return recalculated;
  }

  /**
   * Helper to convert letter grade or percentage to Grade Points (4.0 scale)
   */
  public static getGradePoints(mark: number): number {
    if (mark >= 85) return 4.0;
    if (mark >= 75) return 3.67;
    if (mark >= 65) return 3.0;
    if (mark >= 50) return 2.0;
    if (mark >= 40) return 1.0;
    return 0.0;
  }

  /**
   * Calculates Credit-Weighted Cumulative Grade Point Average (GPA) on 4.0 scale:
   * GPA = Sum(GradePoints_i * Credits_i) / Sum(Credits_i)
   */
  public static calculateGPA(
    results: FinalResult[],
    modules: { module_id: string; credits: number }[]
  ): { gpa: number; totalCreditsEarned: number; totalCreditsAttempted: number } {
    let totalQualityPoints = 0;
    let totalCreditsAttempted = 0;
    let totalCreditsEarned = 0;

    for (const res of results) {
      const mod = modules.find(m => m.module_id === res.module_id);
      const credits = mod?.credits || 15;
      const gp = this.getGradePoints(res.final_mark);

      totalCreditsAttempted += credits;
      totalQualityPoints += gp * credits;

      if (res.status === 'PASS' || res.status === 'DISTINCTION') {
        totalCreditsEarned += credits;
      }
    }

    const gpa = totalCreditsAttempted > 0
      ? Math.round((totalQualityPoints / totalCreditsAttempted) * 100) / 100
      : 0;

    return {
      gpa,
      totalCreditsEarned,
      totalCreditsAttempted,
    };
  }
}

