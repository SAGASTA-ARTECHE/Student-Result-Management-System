import { db } from '../data/db';
import { Student, Module, FinalResult, AssessmentMark } from '../types';
import { CalculationService } from './calculationService';

export interface StudentTranscriptItem {
  module: Module;
  marks: AssessmentMark[];
  result?: FinalResult;
}

export interface StudentTranscriptReport {
  student: Student;
  institutionName: string;
  generatedDate: string;
  items: StudentTranscriptItem[];
  totalCreditsEnrolled: number;
  totalCreditsEarned: number;
  overallAverage: number;
  gpa: number;
  totalDistinctions: number;
  totalPasses: number;
  totalFails: number;
  totalExclusions: number;
  academicStanding: string;
}

export interface ModulePerformanceReport {
  module: Module;
  lecturerName: string;
  lecturer: string;
  academicYear: string;
  semester: string;
  totalStudents: number;
  resultsProcessed: number;
  averageMark: number;
  highestMark: number;
  lowestMark: number;
  passCount: number;
  failCount: number;
  distinctionCount: number;
  exclusionCount: number;
  passPercentage: number;
  passRate: number;
  studentResults: Array<{
    student: Student;
    result: FinalResult;
    marks: AssessmentMark[];
  }>;
  students: Array<{
    student: Student;
    result: FinalResult;
    marks: AssessmentMark[];
  }>;
}

export class ReportService {
  public static getStudentTranscript(studentId: string): StudentTranscriptReport {
    let student = db.getStudentById(studentId);
    if (!student) {
      const allStudents = db.getStudents();
      student = allStudents.find(
        s => s.student_id.toLowerCase() === studentId.toLowerCase() ||
             s.email.toLowerCase() === studentId.toLowerCase()
      );
    }
    if (!student) {
      student = {
        student_id: studentId || 'N/A',
        name: studentId || 'Student',
        email: '',
        course: 'General Studies',
        year_of_study: 1,
        academic_year: '2024/2025',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      };
    }

    const resolvedStudentId = student.student_id;
    const registrations = db.getRegistrationsByStudent(resolvedStudentId);
    const results = db.getResultsByStudent(resolvedStudentId);
    const allModules = db.getModules();

    const items: StudentTranscriptItem[] = [];
    let totalCreditsEnrolled = 0;
    let totalCreditsEarned = 0;
    let weightedMarksSum = 0;
    let totalMarksWeight = 0;
    let totalGradePoints = 0;
    let totalDistinctions = 0;
    let totalPasses = 0;
    let totalFails = 0;
    let totalExclusions = 0;

    for (const reg of registrations) {
      const module = allModules.find(m => m.module_id === reg.module_id);
      if (!module) continue;

      const marks = db.getMarksByStudentAndModule(resolvedStudentId, module.module_id);
      let res = results.find(r => r.module_id === module.module_id);

      // If marks exist but result record has not yet been persisted, calculate it immediately
      if (!res && marks.length > 0) {
        res = db.recalculateResultForStudent(resolvedStudentId, module.module_id, {
          user_id: 'SYSTEM',
          username: 'System Automated Engine',
          user_role: 'ADMINISTRATOR',
        }) || undefined;
      }

      items.push({
        module,
        marks,
        result: res,
      });

      totalCreditsEnrolled += module.credits;

      if (res) {
        weightedMarksSum += res.final_mark * module.credits;
        totalMarksWeight += module.credits;
        totalGradePoints += CalculationService.getGradePoints(res.final_mark) * module.credits;

        if (res.status === 'DISTINCTION') {
          totalDistinctions++;
          totalCreditsEarned += module.credits;
        } else if (res.status === 'PASS') {
          totalPasses++;
          totalCreditsEarned += module.credits;
        } else if (res.status === 'FAIL') {
          totalFails++;
        } else if (res.status === 'EXCLUSION') {
          totalExclusions++;
        }
      }
    }

    const overallAverage = totalMarksWeight > 0 ? Math.round((weightedMarksSum / totalMarksWeight) * 100) / 100 : 0;
    const gpa = totalMarksWeight > 0 ? Math.round((totalGradePoints / totalMarksWeight) * 100) / 100 : 0;

    let academicStanding = registrations.length === 0 ? 'Registered Student' : 'Good Standing';
    if (registrations.length > 0) {
      if (student.status === 'EXCLUDED' || totalExclusions > 0) {
        academicStanding = 'Academic Exclusion / Review Required';
      } else if (totalFails > 1) {
        academicStanding = 'Academic Warning / Probation';
      } else if (results.length > 0 && overallAverage >= 80) {
        academicStanding = 'First Class Honours / Dean’s List';
      } else if (results.length > 0 && overallAverage >= 70) {
        academicStanding = 'Upper Second Class Honours';
      }
    }

    return {
      student,
      institutionName: 'KIMBERLEY UNIVERSITY OF TECHNOLOGY',
      generatedDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      items,
      totalCreditsEnrolled,
      totalCreditsEarned,
      overallAverage,
      gpa,
      totalDistinctions,
      totalPasses,
      totalFails,
      totalExclusions,
      academicStanding,
    };
  }

  public static getModulePerformance(moduleId: string): ModulePerformanceReport {
    let module = db.getModuleById(moduleId);
    if (!module) {
      const allModules = db.getModules();
      if (allModules.length > 0) {
        module = allModules[0];
      } else {
        throw new Error(`Module with ID "${moduleId}" not found.`);
      }
    }

    const lecturer = module.lecturer_id ? db.getLecturerById(module.lecturer_id) : undefined;
    const registrations = db.getRegistrationsByModule(module.module_id);
    const allStudents = db.getStudents();
    const results = db.getResultsByModule(module.module_id);

    const studentResults: ModulePerformanceReport['studentResults'] = [];
    let passCount = 0;
    let failCount = 0;
    let distinctionCount = 0;
    let exclusionCount = 0;
    let totalMarksSum = 0;
    let highestMark = 0;
    let lowestMark = 100;

    for (const reg of registrations) {
      const student = allStudents.find(s => s.student_id === reg.student_id);
      if (!student) continue;

      let res = results.find(r => r.student_id === student.student_id);
      const marks = db.getMarksByStudentAndModule(student.student_id, moduleId);

      if (!res && marks.length > 0) {
        res = db.recalculateResultForStudent(student.student_id, moduleId, {
          user_id: 'SYSTEM',
          username: 'System Automated Engine',
          user_role: 'ADMINISTRATOR',
        }) || undefined;
      }

      if (res) {
        studentResults.push({ student, result: res, marks });
        totalMarksSum += res.final_mark;

        if (res.final_mark > highestMark) highestMark = res.final_mark;
        if (res.final_mark < lowestMark) lowestMark = res.final_mark;

        if (res.status === 'DISTINCTION') distinctionCount++;
        else if (res.status === 'PASS') passCount++;
        else if (res.status === 'FAIL') failCount++;
        else if (res.status === 'EXCLUSION') exclusionCount++;
      }
    }

    const resultsProcessed = studentResults.length;
    const averageMark = resultsProcessed > 0 ? Math.round((totalMarksSum / resultsProcessed) * 100) / 100 : 0;
    const passPercentage =
      resultsProcessed > 0 ? Math.round(((distinctionCount + passCount) / resultsProcessed) * 1000) / 10 : 0;

    if (resultsProcessed === 0) {
      lowestMark = 0;
    }

    return {
      module,
      lecturerName: lecturer?.lecturer_name || 'Unassigned',
      lecturer: lecturer?.lecturer_name || 'Unassigned',
      academicYear: module.academic_year,
      semester: module.semester,
      totalStudents: registrations.length,
      resultsProcessed,
      averageMark,
      highestMark,
      lowestMark,
      passCount,
      failCount,
      distinctionCount,
      exclusionCount,
      passPercentage,
      passRate: passPercentage,
      studentResults,
      students: studentResults,
    };
  }

  public static getModulePerformanceReport(moduleId: string) {
    return this.getModulePerformance(moduleId);
  }

  public static getInstitutionalSummary(): {
    overallPassRate: number;
    totalResultsProcessed: number;
    statusDistribution: {
      DISTINCTION: number;
      PASS: number;
      FAIL: number;
      EXCLUSION: number;
    };
  } {
    const results = db.getResults();
    const totalResultsProcessed = results.length;

    let distinction = 0;
    let pass = 0;
    let fail = 0;
    let exclusion = 0;

    for (const r of results) {
      if (r.status === 'DISTINCTION') distinction++;
      else if (r.status === 'PASS') pass++;
      else if (r.status === 'FAIL') fail++;
      else if (r.status === 'EXCLUSION') exclusion++;
    }

    const overallPassRate =
      totalResultsProcessed > 0
        ? Math.round(((distinction + pass) / totalResultsProcessed) * 1000) / 10
        : 0;

    return {
      overallPassRate,
      totalResultsProcessed,
      statusDistribution: {
        DISTINCTION: distinction,
        PASS: pass,
        FAIL: fail,
        EXCLUSION: exclusion,
      },
    };
  }
}
