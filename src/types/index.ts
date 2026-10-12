export type UserRole = 'ADMINISTRATOR' | 'LECTURER' | 'STUDENT';


export interface User {
  user_id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  // Associated profile reference
  reference_id?: string; // student_id for student, lecturer_id for lecturer
  is_demo?: boolean;
  is_new?: boolean;
  login_count?: number;
}

export interface Student {
  student_id: string; // e.g. "STU-2024-001"
  name: string;
  course: string; // Programme e.g. "BSc Computer Science"
  email: string;
  phone_number?: string;
  year_of_study: number; // 1, 2, 3, 4
  academic_year: string; // e.g. "2024/2025"
  status: 'ACTIVE' | 'SUSPENDED' | 'EXCLUDED' | 'GRADUATED';
  created_at: string;
  is_demo?: boolean;
}

export interface Lecturer {
  lecturer_id: string; // e.g. "LEC-101"
  lecturer_name: string;
  email: string;
  department: string;
  office_number?: string;
  created_at: string;
  is_demo?: boolean;
}

export interface MarkEntryInput {
  assessment_name: string;
  mark: number;
  assessment_weight: number;
}

export interface AcademicRuleConfig {
  rule_id: string;
  distinction_threshold: number;
  pass_threshold: number;
  fail_threshold: number;
  exclusion_threshold: number;
  max_failed_modules_for_exclusion: number;
  coursework_default_weight: number;
  midterm_default_weight: number;
  final_exam_default_weight: number;
  updated_at: string;
  updated_by: string;
}

export interface Module {
  module_id: string; // e.g. "MOD-CS101"
  module_code: string; // e.g. "CS101"
  module_name: string;
  description: string;
  credits: number; // e.g. 15 or 20
  semester: 'Semester 1' | 'Semester 2' | 'Summer';
  academic_year: string;
  lecturer_id?: string; // FK to Lecturer (optional until assigned)
}

export interface StudentModuleRegistration {
  registration_id: string;
  student_id: string; // FK to Student
  module_id: string; // FK to Module
  academic_year: string;
  semester: string;
  registration_date: string;
}

export interface AssessmentMark {
  mark_id: string;
  student_id: string;
  module_id: string;
  assessment_name: string; // e.g. "Coursework", "Midterm Test", "Final Exam"
  mark: number; // 0 - 100
  assessment_weight: number; // percentage, e.g. 20%, 30%, 50%
  date_captured: string;
  captured_by: string; // user_id or lecturer_id
}

export type ResultStatus = 'DISTINCTION' | 'PASS' | 'FAIL' | 'EXCLUSION';

export interface FinalResult {
  result_id: string;
  student_id: string;
  module_id: string;
  final_mark: number; // 0 - 100
  grade: string; // A+, A, B, C, D, F
  status: ResultStatus;
  academic_year: string;
  semester: string;
  calculated_at: string;
}

export interface AuditLog {
  audit_id: string;
  user_id: string;
  username: string;
  user_role: UserRole;
  action: string; // e.g. "STUDENT_CREATED", "MARK_ENTERED", "MARK_UPDATED", "RESULT_CALCULATED"
  entity_type: 'STUDENT' | 'MARK' | 'RESULT' | 'MODULE' | 'REGISTRATION' | 'USER' | 'ACADEMIC_RULE';
  entity_id: string;
  old_value?: string | null;
  new_value?: string | null;
  timestamp: string;
  description: string;
}

export interface AcademicRule {
  rule_id: string;
  rule_name: string;
  minimum_mark: number;
  maximum_mark: number;
  status: ResultStatus;
  grade_letter: string;
  description: string;
}

export interface ExclusionRuleConfig {
  minimum_passing_average: number; // e.g. below 40% triggers exclusion warning or review
  maximum_failed_modules_per_year: number; // e.g. 3 or more failed modules triggers exclusion
  enabled: boolean;
  description: string;
}

export interface SystemBackup {
  backup_id: string;
  backup_name: string;
  timestamp: string;
  version: string;
  records_count: {
    users: number;
    students: number;
    lecturers: number;
    modules: number;
    registrations: number;
    marks: number;
    results: number;
    audit_logs: number;
  };
  data_payload: string; // JSON string of the full relational database snapshot
}

export interface AuthSession {
  user: User;
  token: string;
  expires_at: number;
  student_profile?: Student;
  lecturer_profile?: Lecturer;
  is_new_account?: boolean;
}

// --- COURSE & LECTURER RATING SYSTEM ---
export interface CourseRating {
  rating_id: string;
  student_id: string; // Foreign key to Student (must be enrolled)
  student_name?: string;
  is_anonymous: boolean;
  module_id: string; // Foreign key to Module
  lecturer_id: string; // Foreign key to Lecturer
  teaching_score: number; // 1 - 5 stars
  fairness_score: number; // 1 - 5 stars (assessment fairness)
  materials_score: number; // 1 - 5 stars (content & materials)
  timeliness_score: number; // 1 - 5 stars (feedback speed)
  overall_score: number; // Computed weighted average: 1.0 - 5.0
  comment?: string;
  academic_year: string;
  semester: string;
  created_at: string;
}

export interface ModuleRatingSummary {
  module_id: string;
  module_code: string;
  module_name: string;
  lecturer_id: string;
  lecturer_name: string;
  total_ratings: number;
  average_overall: number;
  average_teaching: number;
  average_fairness: number;
  average_materials: number;
  average_timeliness: number;
  distribution: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
  satisfaction_rate: number; // Percentage of 4 & 5 star ratings
}

// --- DATABASE TRIGGERS & STORED PROCEDURES ---
export type TriggerEvent = 'INSERT' | 'UPDATE' | 'DELETE' | 'INSERT_OR_UPDATE';
export type TriggerTiming = 'BEFORE' | 'AFTER';

export interface DatabaseTrigger {
  trigger_id: string;
  trigger_name: string;
  table_name: string;
  event: TriggerEvent;
  timing: TriggerTiming;
  enabled: boolean;
  description: string;
  sql_definition: string;
  fire_count: number;
  last_fired_at?: string;
}

export interface TriggerExecutionLog {
  log_id: string;
  trigger_name: string;
  event: string;
  table_name: string;
  entity_id: string;
  timestamp: string;
  execution_time_ms: number;
  details: string;
  status: 'SUCCESS' | 'ERROR';
}

export interface StoredProcedureDefinition {
  proc_id: string;
  proc_name: string;
  parameters: { name: string; type: string; description: string }[];
  returns: string;
  description: string;
  sql_definition: string;
  typescript_equivalent: string;
  architectural_tradeoffs: {
    pros_of_sp: string[];
    cons_of_sp: string[];
    why_app_logic_chosen: string;
  };
}

// --- CONCURRENCY CONTROL (OCC) ---
export interface ConcurrencyRecord<T = any> {
  entity_id: string;
  entity_type: string;
  data: T;
  version: number;
  updated_at: string;
  last_modified_by: string;
}

export interface ConcurrencyConflictDetails {
  entity_id: string;
  table_name: string;
  current_version: number;
  attempted_version: number;
  current_data: any;
  conflicting_data: any;
  last_modified_by: string;
  last_updated_at: string;
}

// --- END-TO-END (E2E) TESTING SUITE ---
export interface E2ETestAssertion {
  description: string;
  passed: boolean;
  expected?: any;
  actual?: any;
}

export interface E2ETestCase {
  id: string;
  name: string;
  category: 'AUTH_RBAC' | 'MARKS_VALIDATION' | 'TRIGGERS' | 'STUDENT_SYNC' | 'CONCURRENCY' | 'RATINGS' | 'EXCLUSION' | 'DATABASE_ACID';
  description: string;
  workflow_steps: string[];
  assertions: E2ETestAssertion[];
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'RUNNING' | 'IDLE';
  duration_ms: number;
  error?: string;
}

export interface E2ETestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  duration_ms: number;
  run_timestamp: string;
  tests: E2ETestCase[];
}

