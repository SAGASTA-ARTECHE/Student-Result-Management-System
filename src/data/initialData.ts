import {
  User,
  Student,
  Lecturer,
  Module,
  StudentModuleRegistration,
  AssessmentMark,
  FinalResult,
  AuditLog,
  AcademicRule,
  ExclusionRuleConfig,
  CourseRating,
  DatabaseTrigger,
  TriggerExecutionLog,
  StoredProcedureDefinition
} from '../types';

// Canonical 3 System Users: Student, Lecturer, Administrator
export const INITIAL_USERS: User[] = [
  {
    user_id: 'USR-TLHOMPO',
    username: 'tlhompo',
    email: 'tlhompo@kut.ac.za',
    password_hash: 'Student@123',
    role: 'STUDENT',
    status: 'ACTIVE',
    reference_id: 'STU-TLHOMPO',
    created_at: '2024-01-15T08:00:00.000Z',
  },
  {
    user_id: 'USR-DRMAY',
    username: 'dr.may',
    email: 'dr.may@kut.ac.za',
    password_hash: 'Lecturer@123',
    role: 'LECTURER',
    status: 'ACTIVE',
    reference_id: 'LEC-MAY',
    created_at: '2024-01-15T08:00:00.000Z',
  },
  {
    user_id: 'USR-MAJE',
    username: 'maje',
    email: 'maje@kut.ac.za',
    password_hash: 'Admin@123',
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
    created_at: '2024-01-15T08:00:00.000Z',
  }
];

export const INITIAL_LECTURERS: Lecturer[] = [
  {
    lecturer_id: 'LEC-MAY',
    lecturer_name: 'Dr. May',
    email: 'dr.may@kut.ac.za',
    department: 'Computer Science',
    office_number: 'Science Building 302',
    created_at: '2024-01-15T08:00:00.000Z',
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    student_id: 'STU-TLHOMPO',
    name: 'Tlhompo',
    email: 'tlhompo@kut.ac.za',
    course: 'BSc Computer Science',
    year_of_study: 1,
    academic_year: '2024/2025',
    status: 'ACTIVE',
    created_at: '2024-01-15T08:00:00.000Z',
  }
];

// Academic course catalog available for registration and teaching
export const INITIAL_MODULES: Module[] = [
  {
    module_id: 'MOD-CS101',
    module_code: 'CS101',
    module_name: 'Introduction to Programming & Algorithms',
    description: 'Foundations of algorithmic problem solving, control structures, recursion, and object-oriented concepts.',
    credits: 15,
    semester: 'Semester 1',
    academic_year: '2024/2025',
    lecturer_id: 'LEC-MAY',
  },
  {
    module_id: 'MOD-CS102',
    module_code: 'CS102',
    module_name: 'Relational Databases & SQL Design',
    description: 'Relational data modeling, entity-relationship diagrams, normalization 1NF-3NF, and advanced SQL querying.',
    credits: 15,
    semester: 'Semester 1',
    academic_year: '2024/2025',
    lecturer_id: 'LEC-MAY',
  },
  {
    module_id: 'MOD-CS201',
    module_code: 'CS201',
    module_name: 'Object-Oriented Software Engineering',
    description: 'Three-tier architecture, design patterns, testing strategies, and enterprise software engineering.',
    credits: 20,
    semester: 'Semester 2',
    academic_year: '2024/2025',
    lecturer_id: 'LEC-MAY',
  },
  {
    module_id: 'MOD-MT105',
    module_code: 'MT105',
    module_name: 'Discrete Mathematics for Computing',
    description: 'Set theory, propositional logic, graph theory, combinatorics, and mathematical proofs.',
    credits: 15,
    semester: 'Semester 1',
    academic_year: '2024/2025',
  },
  {
    module_id: 'MOD-CS301',
    module_code: 'CS301',
    module_name: 'Cloud Computing & Distributed Systems',
    description: 'Cloud architectures, microservices, containerization, and distributed transactions.',
    credits: 20,
    semester: 'Semester 1',
    academic_year: '2024/2025',
  },
  {
    module_id: 'MOD-IS202',
    module_code: 'IS202',
    module_name: 'Information Systems Security & Governance',
    description: 'Cybersecurity principles, network defense, threat modeling, and data governance.',
    credits: 15,
    semester: 'Semester 2',
    academic_year: '2024/2025',
  }
];

export const INITIAL_REGISTRATIONS: StudentModuleRegistration[] = [
  {
    registration_id: 'REG-001',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS101',
    academic_year: '2024/2025',
    semester: 'Semester 1',
    registration_date: '2024-01-20T09:00:00.000Z',
  },
  {
    registration_id: 'REG-002',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS102',
    academic_year: '2024/2025',
    semester: 'Semester 1',
    registration_date: '2024-01-20T09:00:00.000Z',
  },
  {
    registration_id: 'REG-003',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-MT105',
    academic_year: '2024/2025',
    semester: 'Semester 1',
    registration_date: '2024-01-20T09:00:00.000Z',
  }
];

export const INITIAL_MARKS: AssessmentMark[] = [
  {
    mark_id: 'MRK-001',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS101',
    assessment_name: 'Test 1',
    mark: 82,
    assessment_weight: 20,
    captured_by: 'dr.may',
    date_captured: '2024-03-15T14:30:00.000Z',
  },
  {
    mark_id: 'MRK-002',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS101',
    assessment_name: 'Assignment 1',
    mark: 88,
    assessment_weight: 20,
    captured_by: 'dr.may',
    date_captured: '2024-04-10T11:00:00.000Z',
  },
  {
    mark_id: 'MRK-003',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS101',
    assessment_name: 'Final Exam',
    mark: 78,
    assessment_weight: 60,
    captured_by: 'dr.may',
    date_captured: '2024-06-05T16:00:00.000Z',
  },
  {
    mark_id: 'MRK-004',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS102',
    assessment_name: 'Test 1',
    mark: 75,
    assessment_weight: 25,
    captured_by: 'dr.may',
    date_captured: '2024-03-20T10:00:00.000Z',
  },
  {
    mark_id: 'MRK-005',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS102',
    assessment_name: 'Database Project',
    mark: 85,
    assessment_weight: 25,
    captured_by: 'dr.may',
    date_captured: '2024-05-15T15:00:00.000Z',
  },
  {
    mark_id: 'MRK-006',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS102',
    assessment_name: 'Final Exam',
    mark: 80,
    assessment_weight: 50,
    captured_by: 'dr.may',
    date_captured: '2024-06-08T14:00:00.000Z',
  }
];

export const INITIAL_RESULTS: FinalResult[] = [
  {
    result_id: 'RES-001',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS101',
    academic_year: '2024/2025',
    semester: 'Semester 1',
    final_mark: 80.8,
    grade: 'A',
    status: 'DISTINCTION',
    calculated_at: '2024-06-20T10:00:00.000Z',
  },
  {
    result_id: 'RES-002',
    student_id: 'STU-TLHOMPO',
    module_id: 'MOD-CS102',
    academic_year: '2024/2025',
    semester: 'Semester 1',
    final_mark: 80,
    grade: 'A',
    status: 'DISTINCTION',
    calculated_at: '2024-06-20T10:00:00.000Z',
  }
];

export const INITIAL_ACADEMIC_RULES: AcademicRule[] = [
  {
    rule_id: 'RULE-01',
    rule_name: 'High Distinction',
    minimum_mark: 85,
    maximum_mark: 100,
    status: 'DISTINCTION',
    grade_letter: 'A+',
    description: 'Outstanding mastery of theoretical and practical curriculum objectives.',
  },
  {
    rule_id: 'RULE-02',
    rule_name: 'Distinction',
    minimum_mark: 75,
    maximum_mark: 84.99,
    status: 'DISTINCTION',
    grade_letter: 'A',
    description: 'Excellent performance and high analytical competence.',
  },
  {
    rule_id: 'RULE-03',
    rule_name: 'Merit / Upper Credit',
    minimum_mark: 65,
    maximum_mark: 74.99,
    status: 'PASS',
    grade_letter: 'B',
    description: 'Commendable performance achieving higher level outcomes.',
  },
  {
    rule_id: 'RULE-04',
    rule_name: 'Standard Pass',
    minimum_mark: 50,
    maximum_mark: 64.99,
    status: 'PASS',
    grade_letter: 'C',
    description: 'Satisfactory demonstration of essential competencies.',
  },
  {
    rule_id: 'RULE-05',
    rule_name: 'Academic Fail',
    minimum_mark: 35,
    maximum_mark: 49.99,
    status: 'FAIL',
    grade_letter: 'F',
    description: 'Unsatisfactory performance; student eligible for supplementary assessment or module retake.',
  },
  {
    rule_id: 'RULE-06',
    rule_name: 'Critical Fail / Exclusion Threshold',
    minimum_mark: 0,
    maximum_mark: 34.99,
    status: 'EXCLUSION',
    grade_letter: 'F',
    description: 'Severe underperformance triggering institutional academic review or exclusion under Faculty Standing Orders.',
  }
];

export const INITIAL_EXCLUSION_CONFIG: ExclusionRuleConfig = {
  minimum_passing_average: 35,
  maximum_failed_modules_per_year: 3,
  enabled: true,
  description: 'Under institutional academic regulations, a student scoring below 35% in core prerequisite modules or failing 3 or more registered modules is recommended for Academic Exclusion.',
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

// Initial Student Module Evaluations (Rating System)
export const INITIAL_RATINGS: CourseRating[] = [
  {
    rating_id: 'RAT-001',
    student_id: 'STU-TLHOMPO',
    student_name: 'Tlhompo',
    is_anonymous: false,
    module_id: 'MOD-CS101',
    lecturer_id: 'LEC-MAY',
    teaching_score: 5,
    fairness_score: 5,
    materials_score: 4,
    timeliness_score: 5,
    overall_score: 4.8,
    comment: 'Dr. May explains programming paradigms with great clarity. Lab assignments provided deep hands-on learning.',
    academic_year: '2024/2025',
    semester: 'Semester 1',
    created_at: '2024-06-25T14:20:00.000Z',
  }
];

// Database Triggers Engine Definitions with SQL DDL & Event Rules
export const INITIAL_TRIGGERS: DatabaseTrigger[] = [
  {
    trigger_id: 'TRG-01',
    trigger_name: 'trg_after_mark_insert_or_update',
    table_name: 'marks',
    event: 'INSERT_OR_UPDATE',
    timing: 'AFTER',
    enabled: true,
    description: 'Fires automatically whenever an assessment mark is entered or updated. Re-computes weighted final grade, updates academic standing, updates cumulative GPA, and records security audit log.',
    sql_definition: `CREATE TRIGGER trg_after_mark_insert_or_update
AFTER INSERT ON marks
FOR EACH ROW
BEGIN
  -- 1. Calculate aggregated weighted mark for student in this module
  DECLARE total_weighted_mark DECIMAL(5,2);
  DECLARE current_credits INT;
  
  SELECT SUM(mark * (assessment_weight / 100.0))
  INTO total_weighted_mark
  FROM marks
  WHERE student_id = NEW.student_id AND module_id = NEW.module_id;

  -- 2. Upsert calculated grade into results table
  INSERT INTO results (result_id, student_id, module_id, final_mark, grade, status, calculation_date, calculated_by)
  VALUES (
    UUID(),
    NEW.student_id,
    NEW.module_id,
    total_weighted_mark,
    CASE 
      WHEN total_weighted_mark >= 85 THEN 'A+'
      WHEN total_weighted_mark >= 75 THEN 'A'
      WHEN total_weighted_mark >= 65 THEN 'B'
      WHEN total_weighted_mark >= 50 THEN 'C'
      ELSE 'F'
    END,
    CASE 
      WHEN total_weighted_mark >= 75 THEN 'DISTINCTION'
      WHEN total_weighted_mark >= 50 THEN 'PASS'
      ELSE 'FAIL'
    END,
    NOW(),
    NEW.recorded_by
  )
  ON DUPLICATE KEY UPDATE
    final_mark = VALUES(final_mark),
    grade = VALUES(grade),
    status = VALUES(status),
    calculation_date = NOW();

  -- 3. Automatic Security Audit Logging
  INSERT INTO audit_logs (audit_id, user_id, username, user_role, action, entity_type, entity_id, description, timestamp)
  VALUES (UUID(), NEW.recorded_by, 'TRIGGER_SYSTEM', 'SYSTEM', 'CALCULATE', 'RESULT', NEW.student_id, CONCAT('Trigger auto-recalculated module ', NEW.module_id, ' mark to ', total_weighted_mark), NOW());
END;`,
    fire_count: 14,
    last_fired_at: '2024-06-20T10:00:00.000Z',
  },
  {
    trigger_id: 'TRG-02',
    trigger_name: 'trg_before_mark_validation',
    table_name: 'marks',
    event: 'INSERT_OR_UPDATE',
    timing: 'BEFORE',
    enabled: true,
    description: 'Enforces ACID check constraints: ensures mark is between 0.00 and 100.00 and assessment weight is between 1 and 100 before saving to database.',
    sql_definition: `CREATE TRIGGER trg_before_mark_validation
BEFORE INSERT ON marks
FOR EACH ROW
BEGIN
  IF NEW.mark < 0.00 OR NEW.mark > 100.00 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Integrity Constraint Violation: Assessment mark must be between 0.00 and 100.00';
  END IF;

  IF NEW.assessment_weight <= 0.00 OR NEW.assessment_weight > 100.00 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Integrity Constraint Violation: Assessment weight must be between 1.00 and 100.00';
  END IF;
END;`,
    fire_count: 28,
    last_fired_at: '2024-06-20T10:00:00.000Z',
  },
  {
    trigger_id: 'TRG-03',
    trigger_name: 'trg_after_rating_insert',
    table_name: 'module_evaluations',
    event: 'INSERT',
    timing: 'AFTER',
    enabled: true,
    description: 'Fires automatically when a student submits a course evaluation. Recalculates aggregate module satisfaction index and lecturer teaching effectiveness score.',
    sql_definition: `CREATE TRIGGER trg_after_rating_insert
AFTER INSERT ON module_evaluations
FOR EACH ROW
BEGIN
  -- Recompute average rating for lecturer across all evaluated modules
  UPDATE lecturers
  SET average_rating = (
    SELECT AVG(overall_score)
    FROM module_evaluations
    WHERE lecturer_id = NEW.lecturer_id
  ),
  evaluation_count = (
    SELECT COUNT(*)
    FROM module_evaluations
    WHERE lecturer_id = NEW.lecturer_id
  )
  WHERE lecturer_id = NEW.lecturer_id;
END;`,
    fire_count: 3,
    last_fired_at: '2024-06-25T14:20:00.000Z',
  },
  {
    trigger_id: 'TRG-04',
    trigger_name: 'trg_academic_exclusion_check',
    table_name: 'results',
    event: 'INSERT_OR_UPDATE',
    timing: 'AFTER',
    enabled: true,
    description: 'Monitors academic standing. Automatically flags students who fail 3+ modules or maintain an average below 35% for institutional Academic Exclusion review.',
    sql_definition: `CREATE TRIGGER trg_academic_exclusion_check
AFTER INSERT ON results
FOR EACH ROW
BEGIN
  DECLARE failed_modules_count INT;
  DECLARE cumulative_avg DECIMAL(5,2);

  SELECT COUNT(*) INTO failed_modules_count
  FROM results
  WHERE student_id = NEW.student_id AND status = 'FAIL';

  SELECT AVG(final_mark) INTO cumulative_avg
  FROM results
  WHERE student_id = NEW.student_id;

  IF failed_modules_count >= 3 OR (cumulative_avg < 35.00 AND cumulative_avg > 0) THEN
    UPDATE students
    SET status = 'EXCLUDED'
    WHERE student_id = NEW.student_id;
    
    INSERT INTO audit_logs (audit_id, user_id, username, user_role, action, entity_type, entity_id, description, timestamp)
    VALUES (UUID(), 'SYSTEM', 'EXCLUSION_RULE_TRIGGER', 'ADMINISTRATOR', 'UPDATE', 'STUDENT', NEW.student_id, CONCAT('Student flagged for EXCLUSION due to ', failed_modules_count, ' failed modules.'), NOW());
  END IF;
END;`,
    fire_count: 5,
    last_fired_at: '2024-06-20T10:00:00.000Z',
  },
  {
    trigger_id: 'TRG-05',
    trigger_name: 'trg_after_mark_delete',
    table_name: 'marks',
    event: 'DELETE',
    timing: 'AFTER',
    enabled: true,
    description: 'Fires when any assessment mark is removed. Re-evaluates remaining assessment items or removes obsolete final result if all marks are deleted.',
    sql_definition: `CREATE TRIGGER trg_after_mark_delete
AFTER DELETE ON marks
FOR EACH ROW
BEGIN
  DECLARE remaining_marks_count INT;
  
  SELECT COUNT(*) INTO remaining_marks_count
  FROM marks
  WHERE student_id = OLD.student_id AND module_id = OLD.module_id;

  IF remaining_marks_count = 0 THEN
    DELETE FROM results
    WHERE student_id = OLD.student_id AND module_id = OLD.module_id;
  END IF;
END;`,
    fire_count: 1,
    last_fired_at: '2024-05-10T09:00:00.000Z',
  }
];

// Initial Trigger Execution Logs for Demonstration and Defense
export const INITIAL_TRIGGER_LOGS: TriggerExecutionLog[] = [
  {
    log_id: 'TLOG-101',
    trigger_name: 'trg_before_mark_validation',
    event: 'BEFORE INSERT',
    table_name: 'marks',
    entity_id: 'MRK-001:STU-TLHOMPO',
    timestamp: '2024-06-20T09:59:58.210Z',
    execution_time_ms: 1.2,
    details: 'Validated mark 82% within boundary [0, 100], weight 20% within boundary [1, 100]. PASS.',
    status: 'SUCCESS',
  },
  {
    log_id: 'TLOG-102',
    trigger_name: 'trg_after_mark_insert_or_update',
    event: 'AFTER INSERT',
    table_name: 'marks',
    entity_id: 'MRK-003:STU-TLHOMPO',
    timestamp: '2024-06-20T10:00:00.045Z',
    execution_time_ms: 4.8,
    details: 'Recalculated final mark for MOD-CS101 (80.8%), Grade: A, Status: DISTINCTION. GPA updated to 4.00.',
    status: 'SUCCESS',
  },
  {
    log_id: 'TLOG-103',
    trigger_name: 'trg_academic_exclusion_check',
    event: 'AFTER INSERT',
    table_name: 'results',
    entity_id: 'RES-001:STU-TLHOMPO',
    timestamp: '2024-06-20T10:00:00.092Z',
    execution_time_ms: 2.1,
    details: 'Evaluated academic exclusion standing: Failed modules = 0, Cumulative Average = 80.8%. Standing: GOOD STANDING.',
    status: 'SUCCESS',
  },
  {
    log_id: 'TLOG-104',
    trigger_name: 'trg_after_rating_insert',
    event: 'AFTER INSERT',
    table_name: 'module_evaluations',
    entity_id: 'RAT-001:LEC-MAY',
    timestamp: '2024-06-25T14:20:01.100Z',
    execution_time_ms: 3.4,
    details: 'Recomputed aggregate rating for LEC-MAY (Dr. May) to 4.8/5.0 across 1 evaluated module.',
    status: 'SUCCESS',
  }
];

// Stored Procedures vs Clean Application Logic Analysis & Comparison
export const INITIAL_STORED_PROCEDURES: StoredProcedureDefinition[] = [
  {
    proc_id: 'SP-01',
    proc_name: 'sp_CalculateStudentModuleResult',
    parameters: [
      { name: 'p_student_id', type: 'VARCHAR(20)', description: 'Unique student identifier' },
      { name: 'p_module_id', type: 'VARCHAR(36)', description: 'Target module identifier' },
      { name: 'p_operator_id', type: 'VARCHAR(36)', description: 'Executing lecturer or administrator ID' }
    ],
    returns: 'TABLE (final_mark DECIMAL, grade VARCHAR, status VARCHAR)',
    description: 'Calculates the weighted average continuous assessment mark, normalizes weights, applies grading thresholds, and persists final result record.',
    sql_definition: `CREATE PROCEDURE sp_CalculateStudentModuleResult(
  IN p_student_id VARCHAR(20),
  IN p_module_id VARCHAR(36),
  IN p_operator_id VARCHAR(36)
)
BEGIN
  DECLARE v_total_mark DECIMAL(5,2);
  DECLARE v_total_weight DECIMAL(5,2);
  DECLARE v_grade VARCHAR(5);
  DECLARE v_status VARCHAR(20);

  -- Atomic transaction isolation
  START TRANSACTION;

  SELECT SUM(mark * (assessment_weight / 100.0)), SUM(assessment_weight)
  INTO v_total_mark, v_total_weight
  FROM marks
  WHERE student_id = p_student_id AND module_id = p_module_id;

  -- Weight normalization if partial
  IF v_total_weight > 0 AND v_total_weight < 100.0 THEN
    SET v_total_mark = (v_total_mark / v_total_weight) * 100.0;
  END IF;

  IF v_total_mark >= 75.0 THEN
    SET v_status = 'DISTINCTION';
    SET v_grade = 'A';
  ELSEIF v_total_mark >= 50.0 THEN
    SET v_status = 'PASS';
    SET v_grade = 'C';
  ELSE
    SET v_status = 'FAIL';
    SET v_grade = 'F';
  END IF;

  INSERT INTO results (result_id, student_id, module_id, final_mark, grade, status, calculation_date, calculated_by)
  VALUES (UUID(), p_student_id, p_module_id, v_total_mark, v_grade, v_status, NOW(), p_operator_id)
  ON DUPLICATE KEY UPDATE
    final_mark = v_total_mark, grade = v_grade, status = v_status, calculation_date = NOW();

  COMMIT;
END;`,
    typescript_equivalent: `// CalculationService.ts
export class CalculationService {
  public static calculateResult(studentId: string, moduleId: string, marks: AssessmentMark[]): FinalResult {
    const totalWeight = marks.reduce((sum, m) => sum + m.assessment_weight, 0);
    const rawMark = totalWeight > 0 ? marks.reduce((sum, m) => sum + (m.mark * m.assessment_weight), 0) / totalWeight : 0;
    const finalMark = Math.round(rawMark * 100) / 100;
    const { grade, status } = this.determineGradeAndStatus(finalMark);
    return { result_id: generateId(), student_id: studentId, module_id: moduleId, final_mark: finalMark, grade, status, ... };
  }
}`,
    architectural_tradeoffs: {
      pros_of_sp: [
        'Executes directly inside database server, reducing network roundtrips.',
        'Strict ACID atomicity within single server transaction.',
        'Can restrict direct table UPDATE permissions to stored procedures only.'
      ],
      cons_of_sp: [
        'Tightly couples system to specific RDBMS vendor (MySQL vs PostgreSQL syntax differences).',
        'Difficult to unit-test and mock in automated CI/CD pipelines.',
        'Version control is clunky compared to code-first migrations.',
        'Shifts CPU load from scalable app servers to database server.'
      ],
      why_app_logic_chosen: 'The lecturer noted: "An effective database can work without stored procedures if SQL queries and application logic are implemented correctly." Our system adopts the modern Enterprise Repository/Service pattern: business calculations reside in TypeScript where they are strictly type-checked, unit-tested, and database-agnostic, while ACID integrity and cascade logic are reinforced through database triggers and optimistic concurrency control.'
    }
  },
  {
    proc_id: 'SP-02',
    proc_name: 'sp_SubmitCourseEvaluation',
    parameters: [
      { name: 'p_student_id', type: 'VARCHAR(20)', description: 'Student submitting rating' },
      { name: 'p_module_id', type: 'VARCHAR(36)', description: 'Target module' },
      { name: 'p_teaching_score', type: 'INT', description: '1-5 score' },
      { name: 'p_fairness_score', type: 'INT', description: '1-5 score' },
      { name: 'p_materials_score', type: 'INT', description: '1-5 score' },
      { name: 'p_timeliness_score', type: 'INT', description: '1-5 score' }
    ],
    returns: 'BOOLEAN',
    description: 'Enforces registration eligibility, prevents duplicate ratings, computes weighted composite score, and updates lecturer scorecard.',
    sql_definition: `CREATE PROCEDURE sp_SubmitCourseEvaluation(
  IN p_student_id VARCHAR(20),
  IN p_module_id VARCHAR(36),
  IN p_teaching_score INT,
  IN p_fairness_score INT,
  IN p_materials_score INT,
  IN p_timeliness_score INT,
  IN p_comment TEXT
)
BEGIN
  -- 1. Check student registration
  IF NOT EXISTS (SELECT 1 FROM student_modules WHERE student_id = p_student_id AND module_id = p_module_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is not enrolled in this module.';
  END IF;

  -- 2. Prevent duplicate rating
  IF EXISTS (SELECT 1 FROM module_evaluations WHERE student_id = p_student_id AND module_id = p_module_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate rating: student has already submitted evaluation.';
  END IF;

  -- 3. Insert rating with computed overall score
  INSERT INTO module_evaluations (rating_id, student_id, module_id, teaching_score, fairness_score, materials_score, timeliness_score, overall_score, comment, created_at)
  VALUES (UUID(), p_student_id, p_module_id, p_teaching_score, p_fairness_score, p_materials_score, p_timeliness_score, 
    (p_teaching_score * 0.3 + p_fairness_score * 0.3 + p_materials_score * 0.2 + p_timeliness_score * 0.2), p_comment, NOW());
END;`,
    typescript_equivalent: `// db.ts
public submitCourseRating(evaluation: CourseRatingInput, operator: Operator): CourseRating {
  if (!this.isStudentEnrolledInModule(evaluation.student_id, evaluation.module_id)) {
    throw new Error('Only enrolled students can evaluate this module.');
  }
  if (this.hasStudentRatedModule(evaluation.student_id, evaluation.module_id)) {
    throw new Error('You have already submitted an evaluation for this course.');
  }
  // calculate score & trigger cascade
  ...
}`,
    architectural_tradeoffs: {
      pros_of_sp: [
        'Atomic guarantee that duplicate check and insert occur in one lock cycle.'
      ],
      cons_of_sp: [
        'Hard to integrate with client-side optimistic UI feedback and rich validation error messaging.'
      ],
      why_app_logic_chosen: 'Application-level validation delivers immediate user-friendly feedback, maintains clean domain models, and works seamlessly with reactive frontends.'
    }
  }
];

