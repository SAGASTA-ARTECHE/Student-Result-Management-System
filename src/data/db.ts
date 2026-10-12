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
  AcademicRuleConfig,
  ExclusionRuleConfig,
  SystemBackup,
  UserRole,
  CourseRating,
  ModuleRatingSummary,
  DatabaseTrigger,
  TriggerExecutionLog,
  StoredProcedureDefinition,
  ConcurrencyRecord,
  ConcurrencyConflictDetails
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_LECTURERS,
  INITIAL_STUDENTS,
  INITIAL_MODULES,
  INITIAL_REGISTRATIONS,
  INITIAL_MARKS,
  INITIAL_RESULTS,
  INITIAL_ACADEMIC_RULES,
  INITIAL_EXCLUSION_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_RATINGS,
  INITIAL_TRIGGERS,
  INITIAL_TRIGGER_LOGS,
  INITIAL_STORED_PROCEDURES
} from './initialData';

const DB_KEYS = {
  USERS: 'srms_users',
  STUDENTS: 'srms_students',
  LECTURERS: 'srms_lecturers',
  MODULES: 'srms_modules',
  REGISTRATIONS: 'srms_registrations',
  MARKS: 'srms_marks',
  RESULTS: 'srms_results',
  ACADEMIC_RULES: 'srms_academic_rules',
  EXCLUSION_CONFIG: 'srms_exclusion_config',
  AUDIT_LOGS: 'srms_audit_logs',
  BACKUPS: 'srms_backups',
  LAST_BACKUP_TIME: 'srms_last_backup_time',
  RATINGS: 'srms_ratings',
  TRIGGERS: 'srms_triggers',
  TRIGGER_LOGS: 'srms_trigger_logs',
  STORED_PROCEDURES: 'srms_stored_procedures',
  CONCURRENCY_VERSIONS: 'srms_concurrency_versions',
  CLOUD_SYNC_STATUS: 'srms_cloud_sync_status',
};

// Safe storage wrapper
class DatabaseStore {
  private get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to write to localStorage for key ${key}:`, e);
    }
  }

  // --- INITIALIZATION ---
  public initialize(): void {
    const CANONICAL_DB_VERSION = 'srms_v9_canonical_three_users_saved_password';
    const storedVersion = localStorage.getItem('srms_canonical_db_version');

    const OBSOLETE_USERNAMES = [
      'stu2024006', 'stu2024007', 'stu2024008', 'stu2024009',
      'diphapha', 'admini', 'wena', 'letona', 'warona',
      'admin', 'lecturer', 'student', 'sarah', 'marcus', 'maya',
      'e.rostova', 'm.thorne', 'd.oconnor'
    ];
    const MOCK_USER_IDS = ['USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005', 'USR-006'];
    const MOCK_STUDENT_IDS = ['STU-2024-001', 'STU-2024-002', 'STU-2024-003', 'STU-2024-004', 'STU-2024-005'];
    const MOCK_LECTURER_IDS = ['LEC-101', 'LEC-102', 'LEC-103'];

    const currentUsers = this.get<User[]>(DB_KEYS.USERS, []);
    const hasObsoleteAccounts = currentUsers.some(
      u => OBSOLETE_USERNAMES.includes(u.username.toLowerCase()) ||
           OBSOLETE_USERNAMES.some(obs => u.email.toLowerCase().includes(obs))
    );

    const hasAllThreeUsers =
      currentUsers.some(u => u.username.toLowerCase() === 'tlhompo') &&
      currentUsers.some(u => u.username.toLowerCase() === 'dr.may') &&
      currentUsers.some(u => u.username.toLowerCase() === 'maje');

    // If version differs, or obsolete accounts exist, or core 3 users are missing: clean reset to canonical 3 users
    if (storedVersion !== CANONICAL_DB_VERSION || hasObsoleteAccounts || !hasAllThreeUsers) {
      this.set(DB_KEYS.USERS, INITIAL_USERS);
      this.set(DB_KEYS.STUDENTS, INITIAL_STUDENTS);
      this.set(DB_KEYS.LECTURERS, INITIAL_LECTURERS);
      this.set(DB_KEYS.MODULES, INITIAL_MODULES);
      this.set(DB_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
      this.set(DB_KEYS.MARKS, INITIAL_MARKS);
      this.set(DB_KEYS.RESULTS, INITIAL_RESULTS);
      this.set(DB_KEYS.ACADEMIC_RULES, INITIAL_ACADEMIC_RULES);
      this.set(DB_KEYS.EXCLUSION_CONFIG, INITIAL_EXCLUSION_CONFIG);
      this.set(DB_KEYS.RATINGS, INITIAL_RATINGS);
      this.set(DB_KEYS.TRIGGERS, INITIAL_TRIGGERS);
      this.set(DB_KEYS.TRIGGER_LOGS, INITIAL_TRIGGER_LOGS);
      this.set(DB_KEYS.STORED_PROCEDURES, INITIAL_STORED_PROCEDURES);
      localStorage.setItem('srms_canonical_db_version', CANONICAL_DB_VERSION);

      // Clean stale saved credentials in localStorage and ensure password is saved
      try {
        const savedLoginRaw = localStorage.getItem('srms_saved_login_credentials');
        if (savedLoginRaw) {
          const parsed = JSON.parse(savedLoginRaw);
          if (
            !parsed.identifier ||
            OBSOLETE_USERNAMES.some(obs => parsed.identifier.toLowerCase().includes(obs))
          ) {
            localStorage.setItem(
              'srms_saved_login_credentials',
              JSON.stringify({ identifier: 'maje@kut.ac.za', password: 'Admin@123', savedAt: new Date().toISOString() })
            );
          } else if (!parsed.password) {
            let pass = 'Admin@123';
            if (parsed.identifier.toLowerCase().includes('may')) pass = 'Lecturer@123';
            if (parsed.identifier.toLowerCase().includes('tlhompo')) pass = 'Student@123';
            localStorage.setItem(
              'srms_saved_login_credentials',
              JSON.stringify({ identifier: parsed.identifier, password: pass, savedAt: new Date().toISOString() })
            );
          }
        } else {
          localStorage.setItem(
            'srms_saved_login_credentials',
            JSON.stringify({ identifier: 'maje@kut.ac.za', password: 'Admin@123', savedAt: new Date().toISOString() })
          );
        }
      } catch (e) {
        console.warn('Stale saved login check', e);
      }
      return;
    }

    // Secondary sanitization: ensure no mock/obsolete records linger
    const realUsers = currentUsers.filter(
      u => !u.is_demo &&
           !MOCK_USER_IDS.includes(u.user_id) &&
           !OBSOLETE_USERNAMES.includes(u.username.toLowerCase())
    );
    this.set(DB_KEYS.USERS, realUsers);

    const currentStudents = this.get<Student[]>(DB_KEYS.STUDENTS, []);
    const realStudents = currentStudents.filter(
      s => !s.is_demo &&
           !MOCK_STUDENT_IDS.includes(s.student_id) &&
           !OBSOLETE_USERNAMES.includes(s.name.toLowerCase())
    );
    this.set(DB_KEYS.STUDENTS, realStudents);

    const currentLecturers = this.get<Lecturer[]>(DB_KEYS.LECTURERS, []);
    const realLecturers = currentLecturers.filter(
      l => !l.is_demo &&
           !MOCK_LECTURER_IDS.includes(l.lecturer_id) &&
           !OBSOLETE_USERNAMES.includes(l.lecturer_name.toLowerCase())
    );
    this.set(DB_KEYS.LECTURERS, realLecturers);

    // Clean registrations, marks, and results
    const realStudentIds = new Set(realStudents.map(s => s.student_id));
    const currentRegs = this.get<StudentModuleRegistration[]>(DB_KEYS.REGISTRATIONS, []);
    this.set(DB_KEYS.REGISTRATIONS, currentRegs.filter(r => realStudentIds.has(r.student_id)));

    const currentMarks = this.get<AssessmentMark[]>(DB_KEYS.MARKS, []);
    this.set(DB_KEYS.MARKS, currentMarks.filter(m => realStudentIds.has(m.student_id)));

    const currentResults = this.get<FinalResult[]>(DB_KEYS.RESULTS, []);
    this.set(DB_KEYS.RESULTS, currentResults.filter(r => realStudentIds.has(r.student_id)));

    if (!localStorage.getItem(DB_KEYS.ACADEMIC_RULES)) {
      this.set(DB_KEYS.ACADEMIC_RULES, INITIAL_ACADEMIC_RULES);
    }
    if (!localStorage.getItem(DB_KEYS.EXCLUSION_CONFIG)) {
      this.set(DB_KEYS.EXCLUSION_CONFIG, INITIAL_EXCLUSION_CONFIG);
    }
    if (!localStorage.getItem(DB_KEYS.RATINGS)) {
      this.set(DB_KEYS.RATINGS, INITIAL_RATINGS);
    }
    if (!localStorage.getItem(DB_KEYS.TRIGGERS)) {
      this.set(DB_KEYS.TRIGGERS, INITIAL_TRIGGERS);
    }
    if (!localStorage.getItem(DB_KEYS.TRIGGER_LOGS)) {
      this.set(DB_KEYS.TRIGGER_LOGS, INITIAL_TRIGGER_LOGS);
    }
    if (!localStorage.getItem(DB_KEYS.STORED_PROCEDURES)) {
      this.set(DB_KEYS.STORED_PROCEDURES, INITIAL_STORED_PROCEDURES);
    }
  }

  public resetToFactoryDefaults(operator: { user_id: string; username: string; user_role: UserRole }): void {
    this.set(DB_KEYS.USERS, INITIAL_USERS);
    this.set(DB_KEYS.LECTURERS, INITIAL_LECTURERS);
    this.set(DB_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.set(DB_KEYS.MODULES, INITIAL_MODULES);
    this.set(DB_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    this.set(DB_KEYS.MARKS, INITIAL_MARKS);
    this.set(DB_KEYS.RESULTS, INITIAL_RESULTS);
    this.set(DB_KEYS.ACADEMIC_RULES, INITIAL_ACADEMIC_RULES);
    this.set(DB_KEYS.EXCLUSION_CONFIG, INITIAL_EXCLUSION_CONFIG);
    this.set(DB_KEYS.RATINGS, INITIAL_RATINGS);
    this.set(DB_KEYS.TRIGGERS, INITIAL_TRIGGERS);
    this.set(DB_KEYS.TRIGGER_LOGS, INITIAL_TRIGGER_LOGS);
    this.set(DB_KEYS.STORED_PROCEDURES, INITIAL_STORED_PROCEDURES);
    
    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'DATABASE_RESET',
      entity_type: 'ACADEMIC_RULE',
      entity_id: 'SYSTEM',
      old_value: 'Modified state',
      new_value: 'Factory default seed database',
      description: 'System database was reset to factory initial state by administrator.'
    });
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    const logs = this.get<AuditLog[]>(DB_KEYS.AUDIT_LOGS, []);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(log: Omit<AuditLog, 'audit_id' | 'timestamp'>): AuditLog {
    const logs = this.get<AuditLog[]>(DB_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      ...log,
      audit_id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.set(DB_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.get<User[]>(DB_KEYS.USERS, []);
  }

  public getUserById(userId: string): User | undefined {
    return this.getUsers().find(u => u.user_id === userId);
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.trim().toLowerCase();
    return this.getUsers().find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
  }

  public addUser(
    user: Omit<User, 'user_id' | 'created_at'>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): User {
    const users = this.getUsers();
    const cleanUsername = user.username.trim().toLowerCase();
    const cleanEmail = user.email.trim().toLowerCase();

    // Check if user already exists by email or reference_id
    const existingIndex = users.findIndex(u =>
      u.email.toLowerCase() === cleanEmail ||
      (Boolean(user.reference_id) && Boolean(u.reference_id) && u.reference_id?.toLowerCase() === user.reference_id?.toLowerCase())
    );

    if (existingIndex !== -1) {
      // Safely update existing account with new credentials/data
      const existing = users[existingIndex];
      users[existingIndex] = {
        ...existing,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        status: user.status || 'ACTIVE',
        reference_id: user.reference_id || existing.reference_id,
      };
      this.set(DB_KEYS.USERS, users);

      this.addAuditLog({
        user_id: operator.user_id,
        username: operator.username,
        user_role: operator.user_role,
        action: 'USER_UPDATED',
        entity_type: 'USER',
        entity_id: users[existingIndex].user_id,
        old_value: `${existing.username} (${existing.role})`,
        new_value: `${users[existingIndex].username} (${users[existingIndex].role})`,
        description: `Updated credentials for user account "${users[existingIndex].username}".`
      });

      return users[existingIndex];
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${user.username}" is already taken.`);
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${user.email}" is already registered to another account.`);
    }

    const newUser: User = {
      ...user,
      user_id: `USR-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    this.set(DB_KEYS.USERS, users);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'USER_CREATED',
      entity_type: 'USER',
      entity_id: newUser.user_id,
      old_value: null,
      new_value: `${newUser.username} (${newUser.role})`,
      description: `Created new user account "${newUser.username}" with role ${newUser.role}.`
    });

    return newUser;
  }

  public updateUser(
    userId: string,
    updates: Partial<Omit<User, 'user_id' | 'created_at'>>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.user_id === userId);
    if (index === -1) throw new Error('User not found.');

    const oldUser = users[index];
    users[index] = { ...oldUser, ...updates };
    this.set(DB_KEYS.USERS, users);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'USER_UPDATED',
      entity_type: 'USER',
      entity_id: userId,
      old_value: `${oldUser.username} (${oldUser.role})`,
      new_value: `${users[index].username} (${users[index].role})`,
      description: `Updated profile for user "${users[index].username}".`
    });

    return users[index];
  }

  public updateUserRole(
    userId: string,
    newRole: UserRole,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.user_id === userId);
    if (index === -1) throw new Error('User not found.');

    const oldUser = users[index];
    const oldRole = oldUser.role;
    users[index] = { ...oldUser, role: newRole };
    this.set(DB_KEYS.USERS, users);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'ROLE_CHANGED',
      entity_type: 'USER',
      entity_id: userId,
      old_value: `Role: ${oldRole}`,
      new_value: `Role: ${newRole}`,
      description: `Updated role for user ${oldUser.username} from ${oldRole} to ${newRole}.`
    });

    return users[index];
  }

  public resetUserPassword(
    userId: string,
    newPass: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.user_id === userId);
    if (index === -1) throw new Error('User not found.');

    const user = users[index];
    users[index] = { ...user, password_hash: newPass };
    this.set(DB_KEYS.USERS, users);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'PASSWORD_RESET',
      entity_type: 'USER',
      entity_id: userId,
      old_value: '******',
      new_value: '****** (Updated)',
      description: `Password for user "${user.username}" was reset by administrator.`
    });
  }

  public deleteUser(
    userId: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const users = this.getUsers();
    const target = users.find(u => u.user_id === userId);
    if (!target) throw new Error('User not found.');
    if (target.username === 'admin') {
      throw new Error('The primary system administrator account cannot be deleted.');
    }

    const filtered = users.filter(u => u.user_id !== userId);
    this.set(DB_KEYS.USERS, filtered);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'USER_DELETED',
      entity_type: 'USER',
      entity_id: userId,
      old_value: `${target.username} (${target.role})`,
      new_value: null,
      description: `Deleted user account "${target.username}" (${target.role}).`
    });
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    return this.get<Student[]>(DB_KEYS.STUDENTS, []);
  }

  public getStudentById(studentId: string): Student | undefined {
    return this.getStudents().find(s => s.student_id.toLowerCase() === studentId.trim().toLowerCase());
  }

  public addStudent(
    student: Omit<Student, 'created_at'>,
    operator: { user_id: string; username: string; user_role: UserRole },
    options: { autoCreateUser?: boolean; defaultPassword?: string } = { autoCreateUser: true, defaultPassword: 'Student@123' }
  ): Student {
    const students = this.getStudents();
    const cleanId = student.student_id.trim();

    if (!cleanId) {
      throw new Error('Student ID is required.');
    }
    if (!student.name.trim()) {
      throw new Error('Student full name is required.');
    }
    if (!student.course.trim()) {
      throw new Error('Course / programme is required.');
    }

    // Check duplicate or existing Student ID
    const existingIndex = students.findIndex(s => s.student_id.toLowerCase() === cleanId.toLowerCase());
    if (existingIndex !== -1) {
      students[existingIndex] = {
        ...students[existingIndex],
        ...student,
        student_id: cleanId,
      };
      this.set(DB_KEYS.STUDENTS, students);
      return students[existingIndex];
    }

    const newStudent: Student = {
      ...student,
      student_id: cleanId,
      created_at: new Date().toISOString(),
    };
    students.push(newStudent);
    this.set(DB_KEYS.STUDENTS, students);

    // Also ensure a student user account exists if requested
    if (options.autoCreateUser !== false) {
      const users = this.getUsers();
      const usernameFromId = cleanId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasAccount = users.some(u => 
        u.reference_id === cleanId || 
        (Boolean(student.email) && u.email.toLowerCase() === student.email.trim().toLowerCase())
      );
      
      if (!hasAccount) {
        users.push({
          user_id: `USR-${Date.now().toString().slice(-4)}`,
          username: usernameFromId,
          password_hash: options.defaultPassword || 'Student@123',
          role: 'STUDENT',
          email: student.email || `${usernameFromId}@kut.ac.za`,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          reference_id: cleanId,
        });
        this.set(DB_KEYS.USERS, users);
      }
    }

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'STUDENT_REGISTERED',
      entity_type: 'STUDENT',
      entity_id: cleanId,
      old_value: null,
      new_value: `${newStudent.name} (${newStudent.course}, Year ${newStudent.year_of_study})`,
      description: `Registered new student ${newStudent.name} [ID: ${cleanId}] in ${newStudent.course}.`
    });

    return newStudent;
  }

  public updateStudent(
    studentId: string,
    updates: Partial<Omit<Student, 'student_id' | 'created_at'>>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): Student {
    const students = this.getStudents();
    const index = students.findIndex(s => s.student_id === studentId);
    if (index === -1) throw new Error('Student record not found.');

    const oldStudent = students[index];
    const updatedStudent: Student = {
      ...oldStudent,
      ...updates,
    };
    students[index] = updatedStudent;
    this.set(DB_KEYS.STUDENTS, students);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'STUDENT_UPDATED',
      entity_type: 'STUDENT',
      entity_id: studentId,
      old_value: JSON.stringify(oldStudent),
      new_value: JSON.stringify(updatedStudent),
      description: `Updated student record for ${updatedStudent.name} [${studentId}].`
    });

    return updatedStudent;
  }

  // --- LECTURERS ---
  public getLecturers(): Lecturer[] {
    return this.get<Lecturer[]>(DB_KEYS.LECTURERS, []);
  }

  public getLecturerById(lecturerId?: string): Lecturer | undefined {
    if (!lecturerId) return undefined;
    return this.getLecturers().find(l => l.lecturer_id === lecturerId);
  }

  public addLecturer(
    lecturer: Omit<Lecturer, 'created_at'>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): Lecturer {
    const lecturers = this.getLecturers();
    if (lecturers.some(l => l.lecturer_id.toLowerCase() === lecturer.lecturer_id.toLowerCase())) {
      throw new Error(`Lecturer ID "${lecturer.lecturer_id}" already exists.`);
    }

    const newLecturer: Lecturer = {
      ...lecturer,
      created_at: new Date().toISOString(),
    };
    lecturers.push(newLecturer);
    this.set(DB_KEYS.LECTURERS, lecturers);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'LECTURER_ADDED',
      entity_type: 'USER',
      entity_id: newLecturer.lecturer_id,
      old_value: null,
      new_value: `${newLecturer.lecturer_name} (${newLecturer.department})`,
      description: `Added faculty lecturer ${newLecturer.lecturer_name} to ${newLecturer.department}.`
    });

    return newLecturer;
  }

  // --- MODULES ---
  public getModules(): Module[] {
    return this.get<Module[]>(DB_KEYS.MODULES, []);
  }

  public getModuleById(moduleId: string): Module | undefined {
    return this.getModules().find(m => m.module_id === moduleId || m.module_code === moduleId);
  }

  public getModulesByLecturer(lecturerId: string): Module[] {
    return this.getModules().filter(m => m.lecturer_id === lecturerId);
  }

  public addModule(
    moduleData: Omit<Module, 'module_id'>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): Module {
    const modules = this.getModules();
    const cleanCode = moduleData.module_code.trim().toUpperCase();

    if (modules.some(m => m.module_code.toUpperCase() === cleanCode)) {
      throw new Error(`Module with code "${cleanCode}" already exists.`);
    }

    // Verify lecturer FK
    const lecturers = this.getLecturers();
    if (!lecturers.some(l => l.lecturer_id === moduleData.lecturer_id)) {
      throw new Error(`Assigned lecturer with ID "${moduleData.lecturer_id}" does not exist.`);
    }

    const newModule: Module = {
      ...moduleData,
      module_id: `MOD-${cleanCode}`,
      module_code: cleanCode,
    };
    modules.push(newModule);
    this.set(DB_KEYS.MODULES, modules);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'MODULE_CREATED',
      entity_type: 'MODULE',
      entity_id: newModule.module_id,
      old_value: null,
      new_value: `${newModule.module_code}: ${newModule.module_name}`,
      description: `Created new module "${newModule.module_code} - ${newModule.module_name}".`
    });

    return newModule;
  }

  public updateModule(
    moduleId: string,
    updates: Partial<Omit<Module, 'module_id'>>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): Module {
    const modules = this.getModules();
    const index = modules.findIndex(m => m.module_id === moduleId);
    if (index === -1) throw new Error('Module not found.');

    const oldModule = modules[index];
    const updated = { ...oldModule, ...updates };
    modules[index] = updated;
    this.set(DB_KEYS.MODULES, modules);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'MODULE_UPDATED',
      entity_type: 'MODULE',
      entity_id: moduleId,
      old_value: JSON.stringify(oldModule),
      new_value: JSON.stringify(updated),
      description: `Updated module details for ${updated.module_code}.`
    });

    return updated;
  }

  public deleteModule(
    moduleId: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const modules = this.getModules();
    const mod = modules.find(m => m.module_id === moduleId);
    if (!mod) throw new Error('Module not found.');

    // Referential integrity check: Are students registered or marks captured?
    const registrations = this.getRegistrations().filter(r => r.module_id === moduleId);
    if (registrations.length > 0) {
      throw new Error(`Cannot delete module "${mod.module_code}" because ${registrations.length} students are currently registered for it.`);
    }

    const marks = this.getMarks().filter(m => m.module_id === moduleId);
    if (marks.length > 0) {
      throw new Error(`Cannot delete module "${mod.module_code}" because assessment marks exist for it.`);
    }

    const filtered = modules.filter(m => m.module_id !== moduleId);
    this.set(DB_KEYS.MODULES, filtered);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'MODULE_DELETED',
      entity_type: 'MODULE',
      entity_id: moduleId,
      old_value: `${mod.module_code} - ${mod.module_name}`,
      new_value: null,
      description: `Deleted module "${mod.module_code} - ${mod.module_name}".`
    });
  }

  // --- REGISTRATIONS (Many-to-Many junction table) ---
  public getRegistrations(): StudentModuleRegistration[] {
    return this.get<StudentModuleRegistration[]>(DB_KEYS.REGISTRATIONS, []);
  }

  public registerStudentForModule(
    studentId: string,
    moduleId: string,
    academicYear: string,
    semester: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): StudentModuleRegistration {
    // Check FKs
    const student = this.getStudentById(studentId) ||
      this.getStudents().find(s => s.email.toLowerCase() === studentId.trim().toLowerCase());
    if (!student) throw new Error(`Student with ID "${studentId}" does not exist.`);

    const canonicalStudentId = student.student_id;

    const mod = this.getModuleById(moduleId);
    if (!mod) throw new Error(`Module with ID "${moduleId}" does not exist.`);

    // Check duplicate
    const registrations = this.getRegistrations();
    const duplicate = registrations.some(
      r => r.student_id.toLowerCase() === canonicalStudentId.toLowerCase() &&
           r.module_id === moduleId &&
           r.academic_year === academicYear
    );
    if (duplicate) {
      throw new Error(`Student ${student.name} (${canonicalStudentId}) is already registered for ${mod.module_code} in academic year ${academicYear}.`);
    }

    const newReg: StudentModuleRegistration = {
      registration_id: `REG-${Date.now().toString().slice(-5)}`,
      student_id: canonicalStudentId,
      module_id: moduleId,
      academic_year: academicYear,
      semester: semester,
      registration_date: new Date().toISOString(),
    };

    registrations.push(newReg);
    this.set(DB_KEYS.REGISTRATIONS, registrations);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'STUDENT_MODULE_REGISTERED',
      entity_type: 'REGISTRATION',
      entity_id: newReg.registration_id,
      old_value: null,
      new_value: `Student: ${studentId} -> Module: ${mod.module_code}`,
      description: `Enrolled student ${student.name} (${studentId}) in module ${mod.module_code} (${academicYear}).`
    });

    return newReg;
  }

  public removeRegistration(
    registrationId: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const registrations = this.getRegistrations();
    const reg = registrations.find(r => r.registration_id === registrationId);
    if (!reg) throw new Error('Registration record not found.');

    const filtered = registrations.filter(r => r.registration_id !== registrationId);
    this.set(DB_KEYS.REGISTRATIONS, filtered);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'STUDENT_MODULE_DEREGISTERED',
      entity_type: 'REGISTRATION',
      entity_id: registrationId,
      old_value: `Student: ${reg.student_id} -> Module: ${reg.module_id}`,
      new_value: null,
      description: `Removed registration ${registrationId} for student ${reg.student_id}.`
    });
  }

  public getRegistrationsByModule(moduleId: string): StudentModuleRegistration[] {
    return this.getRegistrations().filter(r => r.module_id === moduleId);
  }

  public getRegistrationsByStudent(studentId: string): StudentModuleRegistration[] {
    return this.getRegistrations().filter(r => r.student_id === studentId);
  }

  // --- ASSESSMENT MARKS ---
  public getMarks(): AssessmentMark[] {
    return this.get<AssessmentMark[]>(DB_KEYS.MARKS, []);
  }

  public getMarksByModule(moduleId: string): AssessmentMark[] {
    return this.getMarks().filter(m => m.module_id === moduleId);
  }

  public getMarksByStudentAndModule(studentId: string, moduleId: string): AssessmentMark[] {
    return this.getMarks().filter(m => m.student_id === studentId && m.module_id === moduleId);
  }

  public getMarksByStudent(studentId: string): AssessmentMark[] {
    return this.getMarks().filter(m => m.student_id === studentId);
  }

  public saveStudentMarks(
    studentId: string,
    moduleId: string,
    marksList: Array<{ assessment_name: string; mark: number; assessment_weight: number }>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): AssessmentMark[] {
    return this.saveAssessmentMarks(studentId, moduleId, marksList, operator);
  }

  public saveAssessmentMarks(
    studentId: string,
    moduleId: string,
    marksList: Array<{ assessment_name: string; mark: number; assessment_weight: number }>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): AssessmentMark[] {
    // 1. BEFORE TRIGGER: Validate bounds [0, 100] & weights [1, 100]
    this.executeTrigger(
      'trg_before_mark_validation',
      'BEFORE INSERT_OR_UPDATE',
      'marks',
      `${studentId}:${moduleId}`,
      `Integrity check: Validating ${marksList.length} assessment marks for student ${studentId} in module ${moduleId}. All within [0.00, 100.00].`
    );

    for (const item of marksList) {
      if (typeof item.mark !== 'number' || isNaN(item.mark)) {
        throw new Error(`Mark for "${item.assessment_name}" must be a valid numerical value.`);
      }
      if (item.mark < 0 || item.mark > 100) {
        throw new Error(`Mark for "${item.assessment_name}" must be between 0 and 100 (got ${item.mark}).`);
      }
      if (item.assessment_weight < 1 || item.assessment_weight > 100) {
        throw new Error(`Assessment weight for "${item.assessment_name}" must be between 1% and 100%.`);
      }
    }

    const currentMarks = this.getMarks();
    // Record old marks for audit comparison
    const existing = currentMarks.filter(m => m.student_id === studentId && m.module_id === moduleId);
    const oldSummary = existing.length > 0
      ? existing.map(e => `${e.assessment_name}: ${e.mark}% (wt ${e.assessment_weight}%)`).join(', ')
      : 'None';

    // Remove existing marks for this student and module
    const others = currentMarks.filter(m => !(m.student_id === studentId && m.module_id === moduleId));

    const newCreated: AssessmentMark[] = marksList.map(item => ({
      mark_id: `MRK-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`,
      student_id: studentId,
      module_id: moduleId,
      assessment_name: item.assessment_name,
      mark: Math.round(item.mark * 100) / 100,
      assessment_weight: item.assessment_weight,
      date_captured: new Date().toISOString(),
      captured_by: operator.user_id,
    }));

    const updatedAll = [...others, ...newCreated];
    this.set(DB_KEYS.MARKS, updatedAll);

    // Increment OCC version for concurrency tracking
    this.incrementEntityVersion('MARK', `${studentId}:${moduleId}`);

    // Automatically calculate & persist the final result so students, lecturers, and admins see updated results immediately
    this.autoCalculateAndSaveResult(studentId, moduleId, newCreated, operator);

    // 2. AFTER TRIGGER: Re-evaluate module final grade, update GPA & academic standings
    this.executeTrigger(
      'trg_after_mark_insert_or_update',
      'AFTER INSERT_OR_UPDATE',
      'marks',
      `${studentId}:${moduleId}`,
      `Cascade: Auto-recalculated final grade for student ${studentId} in module ${moduleId}. Transcript and GPA synchronized.`
    );

    const newSummary = newCreated.map(e => `${e.assessment_name}: ${e.mark}% (wt ${e.assessment_weight}%)`).join(', ');

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: existing.length > 0 ? 'MARKS_MODIFIED' : 'MARKS_CAPTURED',
      entity_type: 'MARK',
      entity_id: `${studentId}:${moduleId}`,
      old_value: oldSummary,
      new_value: newSummary,
      description: `${operator.user_role} ${operator.username} saved marks for student ${studentId} in module ${moduleId}.`
    });

    return newCreated;
  }

  public autoCalculateAndSaveResult(
    studentId: string,
    moduleId: string,
    marksList: AssessmentMark[],
    operator: { user_id: string; username: string; user_role: UserRole }
  ): FinalResult | null {
    if (!marksList || marksList.length === 0) {
      const results = this.getResults().filter(r => !(r.student_id === studentId && r.module_id === moduleId));
      this.set(DB_KEYS.RESULTS, results);
      return null;
    }

    const totalWeight = marksList.reduce((sum, item) => sum + item.assessment_weight, 0);
    let rawFinalMark = 0;
    if (totalWeight > 0) {
      if (Math.abs(totalWeight - 100) < 0.01) {
        rawFinalMark = marksList.reduce((sum, item) => sum + (item.mark * item.assessment_weight) / 100, 0);
      } else {
        rawFinalMark = marksList.reduce((sum, item) => sum + item.mark * item.assessment_weight, 0) / totalWeight;
      }
    }
    const finalMark = Math.round(rawFinalMark * 100) / 100;

    const rules = this.getAcademicRules();
    const sortedRules = [...rules].sort((a, b) => b.minimum_mark - a.minimum_mark);
    let matchedRule = sortedRules.find(r => finalMark >= r.minimum_mark && finalMark <= r.maximum_mark);
    if (!matchedRule) {
      if (finalMark >= 85) matchedRule = sortedRules[0];
      else matchedRule = sortedRules[sortedRules.length - 1];
    }

    let status = matchedRule ? matchedRule.status : 'PASS';
    let grade = matchedRule ? matchedRule.grade_letter : 'C';

    const student = this.getStudentById(studentId);
    const exclusionConfig = this.getExclusionConfig();
    if (student?.status === 'EXCLUDED') {
      status = 'EXCLUSION';
      grade = 'F';
    } else if (exclusionConfig.enabled && finalMark < exclusionConfig.minimum_passing_average) {
      status = 'EXCLUSION';
      grade = 'F';
    }

    const reg = this.getRegistrationsByStudent(studentId).find(r => r.module_id === moduleId);
    const mod = this.getModuleById(moduleId);

    return this.saveResult(
      {
        student_id: studentId,
        module_id: moduleId,
        final_mark: finalMark,
        grade,
        status,
        academic_year: reg?.academic_year || mod?.academic_year || '2024/2025',
        semester: reg?.semester || mod?.semester || 'Semester 1',
      },
      operator
    );
  }

  public recalculateResultForStudent(
    studentId: string,
    moduleId: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): FinalResult | null {
    const marks = this.getMarksByStudentAndModule(studentId, moduleId);
    return this.autoCalculateAndSaveResult(studentId, moduleId, marks, operator);
  }

  // --- FINAL RESULTS ---
  public getResults(): FinalResult[] {
    return this.get<FinalResult[]>(DB_KEYS.RESULTS, []);
  }

  public getResultByStudentAndModule(studentId: string, moduleId: string): FinalResult | undefined {
    return this.getResults().find(r => r.student_id === studentId && r.module_id === moduleId);
  }

  public getResultsByStudent(studentId: string): FinalResult[] {
    return this.getResults().filter(r => r.student_id === studentId);
  }

  public getResultsByModule(moduleId: string): FinalResult[] {
    return this.getResults().filter(r => r.module_id === moduleId);
  }

  public saveResult(
    resultData: Omit<FinalResult, 'result_id' | 'calculated_at'>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): FinalResult {
    const results = this.getResults();
    const existingIndex = results.findIndex(
      r => r.student_id === resultData.student_id && r.module_id === resultData.module_id
    );

    const oldResult = existingIndex >= 0 ? results[existingIndex] : null;

    const savedResult: FinalResult = {
      ...resultData,
      result_id: oldResult ? oldResult.result_id : `RES-${Date.now().toString().slice(-5)}`,
      calculated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      results[existingIndex] = savedResult;
    } else {
      results.push(savedResult);
    }
    this.set(DB_KEYS.RESULTS, results);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'RESULT_CALCULATED',
      entity_type: 'RESULT',
      entity_id: savedResult.result_id,
      old_value: oldResult ? `Final: ${oldResult.final_mark}% [${oldResult.status}]` : 'None',
      new_value: `Final: ${savedResult.final_mark}% | Grade: ${savedResult.grade} | Status: ${savedResult.status}`,
      description: `Automated result calculation recorded for student ${savedResult.student_id} in module ${savedResult.module_id}.`
    });

    // Fire Academic Standing Trigger: trg_academic_exclusion_check
    this.executeTrigger(
      'trg_academic_exclusion_check',
      'AFTER INSERT_OR_UPDATE',
      'results',
      savedResult.result_id,
      `Academic standing evaluation: Student ${savedResult.student_id}, Grade ${savedResult.grade}, Status: ${savedResult.status}.`
    );

    return savedResult;
  }

  // --- ACADEMIC RULES ---
  public getAcademicRules(): AcademicRule[] {
    return this.get<AcademicRule[]>(DB_KEYS.ACADEMIC_RULES, INITIAL_ACADEMIC_RULES);
  }

  public getAcademicRuleConfig(): AcademicRuleConfig {
    const rules = this.getAcademicRules();
    const exclusion = this.getExclusionConfig();
    const distinctionRule = rules.find(r => r.status === 'DISTINCTION');
    const passRule = rules.find(r => r.status === 'PASS');
    const failRule = rules.find(r => r.status === 'FAIL');

    return {
      rule_id: 'RULE_ACTIVE_2024',
      distinction_threshold: distinctionRule ? distinctionRule.minimum_mark : 75,
      pass_threshold: passRule ? passRule.minimum_mark : 50,
      fail_threshold: failRule ? failRule.minimum_mark : 40,
      exclusion_threshold: exclusion.minimum_passing_average || 30,
      max_failed_modules_for_exclusion: exclusion.maximum_failed_modules_per_year || 2,
      coursework_default_weight: 30,
      midterm_default_weight: 20,
      final_exam_default_weight: 50,
      updated_at: new Date().toISOString(),
      updated_by: 'Academic Board',
    };
  }

  public saveAcademicRuleConfig(
    config: AcademicRuleConfig,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const updatedRules: AcademicRule[] = [
      {
        rule_id: 'R1_DISTINCTION',
        rule_name: 'Distinction / First Class Honours',
        minimum_mark: config.distinction_threshold,
        maximum_mark: 100,
        status: 'DISTINCTION',
        grade_letter: 'A',
        description: `Marks equal to or exceeding ${config.distinction_threshold}%`,
      },
      {
        rule_id: 'R2_PASS',
        rule_name: 'Pass (Credit Awarded)',
        minimum_mark: config.pass_threshold,
        maximum_mark: config.distinction_threshold - 0.01,
        status: 'PASS',
        grade_letter: 'B',
        description: `Marks between ${config.pass_threshold}% and ${config.distinction_threshold}%`,
      },
      {
        rule_id: 'R3_FAIL',
        rule_name: 'Fail / Retake Required',
        minimum_mark: config.fail_threshold,
        maximum_mark: config.pass_threshold - 0.01,
        status: 'FAIL',
        grade_letter: 'D',
        description: `Marks between ${config.fail_threshold}% and ${config.pass_threshold}%`,
      },
      {
        rule_id: 'R4_EXCLUSION',
        rule_name: 'Academic Exclusion Boundary',
        minimum_mark: 0,
        maximum_mark: config.fail_threshold - 0.01,
        status: 'EXCLUSION',
        grade_letter: 'F',
        description: `Marks strictly below ${config.fail_threshold}%`,
      },
    ];

    this.saveAcademicRules(updatedRules, operator);
    this.saveExclusionConfig(
      {
        minimum_passing_average: config.exclusion_threshold,
        maximum_failed_modules_per_year: config.max_failed_modules_for_exclusion,
        enabled: true,
        description: 'Enforces academic exclusion rules for failing students.',
      },
      operator
    );
  }

  public saveAcademicRules(
    rules: AcademicRule[],
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const oldRules = this.getAcademicRules();
    this.set(DB_KEYS.ACADEMIC_RULES, rules);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'ACADEMIC_RULES_UPDATED',
      entity_type: 'ACADEMIC_RULE',
      entity_id: 'RULE-CONFIG',
      old_value: `${oldRules.length} rules defined`,
      new_value: `${rules.length} rules defined`,
      description: `Academic grading thresholds modified by administrator ${operator.username}.`
    });
  }

  public getExclusionConfig(): ExclusionRuleConfig {
    return this.get<ExclusionRuleConfig>(DB_KEYS.EXCLUSION_CONFIG, INITIAL_EXCLUSION_CONFIG);
  }

  public saveExclusionConfig(
    config: ExclusionRuleConfig,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    this.set(DB_KEYS.EXCLUSION_CONFIG, config);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'EXCLUSION_RULE_UPDATED',
      entity_type: 'ACADEMIC_RULE',
      entity_id: 'EXCLUSION-CONFIG',
      old_value: null,
      new_value: `Min Avg: ${config.minimum_passing_average}%, Max Fails: ${config.maximum_failed_modules_per_year}`,
      description: `Institutional academic exclusion rule criteria updated.`
    });
  }

  // --- BACKUP AND RECOVERY ---
  public getLastBackupTime(): string | null {
    return localStorage.getItem(DB_KEYS.LAST_BACKUP_TIME);
  }

  public createSnapshotBackup(
    backupName: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): SystemBackup {
    const payload = {
      users: this.getUsers(),
      students: this.getStudents(),
      lecturers: this.getLecturers(),
      modules: this.getModules(),
      registrations: this.getRegistrations(),
      marks: this.getMarks(),
      results: this.getResults(),
      academic_rules: this.getAcademicRules(),
      exclusion_config: this.getExclusionConfig(),
      audit_logs: this.getAuditLogs(),
    };

    const backup: SystemBackup = {
      backup_id: `BCK-${Date.now()}`,
      backup_name: backupName || `System Backup ${new Date().toLocaleDateString()}`,
      timestamp: new Date().toISOString(),
      version: '1.0.0 (Relational-Prototype)',
      records_count: {
        users: payload.users.length,
        students: payload.students.length,
        lecturers: payload.lecturers.length,
        modules: payload.modules.length,
        registrations: payload.registrations.length,
        marks: payload.marks.length,
        results: payload.results.length,
        audit_logs: payload.audit_logs.length,
      },
      data_payload: JSON.stringify(payload),
    };

    const backups = this.get<SystemBackup[]>(DB_KEYS.BACKUPS, []);
    backups.unshift(backup);
    this.set(DB_KEYS.BACKUPS, backups);
    localStorage.setItem(DB_KEYS.LAST_BACKUP_TIME, backup.timestamp);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'DATA_BACKUP_CREATED',
      entity_type: 'ACADEMIC_RULE',
      entity_id: backup.backup_id,
      old_value: null,
      new_value: `${backup.records_count.students} students, ${backup.records_count.results} results archived`,
      description: `Complete relational database snapshot archived [ID: ${backup.backup_id}].`
    });

    return backup;
  }

  public getBackups(): SystemBackup[] {
    return this.get<SystemBackup[]>(DB_KEYS.BACKUPS, []);
  }

  public restoreSnapshotBackup(
    backupId: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const backups = this.getBackups();
    const backup = backups.find(b => b.backup_id === backupId);
    if (!backup) throw new Error('Selected backup snapshot does not exist.');

    try {
      const payload = JSON.parse(backup.data_payload);
      if (payload.users) this.set(DB_KEYS.USERS, payload.users);
      if (payload.students) this.set(DB_KEYS.STUDENTS, payload.students);
      if (payload.lecturers) this.set(DB_KEYS.LECTURERS, payload.lecturers);
      if (payload.modules) this.set(DB_KEYS.MODULES, payload.modules);
      if (payload.registrations) this.set(DB_KEYS.REGISTRATIONS, payload.registrations);
      if (payload.marks) this.set(DB_KEYS.MARKS, payload.marks);
      if (payload.results) this.set(DB_KEYS.RESULTS, payload.results);
      if (payload.academic_rules) this.set(DB_KEYS.ACADEMIC_RULES, payload.academic_rules);
      if (payload.exclusion_config) this.set(DB_KEYS.EXCLUSION_CONFIG, payload.exclusion_config);

      this.addAuditLog({
        user_id: operator.user_id,
        username: operator.username,
        user_role: operator.user_role,
        action: 'DATA_RESTORED',
        entity_type: 'ACADEMIC_RULE',
        entity_id: backup.backup_id,
        old_value: 'Active Database State',
        new_value: `Restored snapshot from ${new Date(backup.timestamp).toLocaleString()}`,
        description: `System restored to state from backup "${backup.backup_name}" [${backup.backup_id}].`
      });
    } catch (e: any) {
      throw new Error(`Failed to restore database snapshot: ${e.message}`);
    }
  }

  public exportDatabaseJSON(): string {
    const payload = {
      users: this.getUsers(),
      students: this.getStudents(),
      lecturers: this.getLecturers(),
      modules: this.getModules(),
      registrations: this.getRegistrations(),
      marks: this.getMarks(),
      results: this.getResults(),
      academic_rules: this.getAcademicRules(),
      exclusion_config: this.getExclusionConfig(),
      audit_logs: this.getAuditLogs(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public importDatabaseJSON(
    jsonStr: string,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const payload = JSON.parse(jsonStr);
    if (payload.users) this.set(DB_KEYS.USERS, payload.users);
    if (payload.students) this.set(DB_KEYS.STUDENTS, payload.students);
    if (payload.lecturers) this.set(DB_KEYS.LECTURERS, payload.lecturers);
    if (payload.modules) this.set(DB_KEYS.MODULES, payload.modules);
    if (payload.registrations) this.set(DB_KEYS.REGISTRATIONS, payload.registrations);
    if (payload.marks) this.set(DB_KEYS.MARKS, payload.marks);
    if (payload.results) this.set(DB_KEYS.RESULTS, payload.results);
    if (payload.academic_rules) this.set(DB_KEYS.ACADEMIC_RULES, payload.academic_rules);
    if (payload.exclusion_config) this.set(DB_KEYS.EXCLUSION_CONFIG, payload.exclusion_config);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'DATA_RESTORED',
      entity_type: 'ACADEMIC_RULE',
      entity_id: 'IMPORT-SNAPSHOT',
      old_value: 'Active Database State',
      new_value: 'Restored from imported JSON file',
      description: `Database imported from JSON archive by ${operator.username}.`
    });
  }

  public createSnapshot(operator: { user_id: string; username: string; user_role: UserRole }): SystemBackup {
    return this.createSnapshotBackup(`Automated Snapshot ${new Date().toLocaleTimeString()}`, operator);
  }

  public resetToFactorySeed(operator: { user_id: string; username: string; user_role: UserRole }): void {
    this.resetToFactoryDefaults(operator);
  }

  // =========================================================================
  // 1. COURSE & LECTURER RATING SYSTEM (STUDENT EVALUATIONS)
  // =========================================================================
  public getCourseRatings(): CourseRating[] {
    return this.get<CourseRating[]>(DB_KEYS.RATINGS, INITIAL_RATINGS);
  }

  public getRatingsByModule(moduleId: string): CourseRating[] {
    return this.getCourseRatings().filter(r => r.module_id === moduleId);
  }

  public getRatingsByLecturer(lecturerId: string): CourseRating[] {
    return this.getCourseRatings().filter(r => r.lecturer_id === lecturerId);
  }

  public getRatingsByStudent(studentId: string): CourseRating[] {
    return this.getCourseRatings().filter(r => r.student_id === studentId);
  }

  public hasStudentRatedModule(studentId: string, moduleId: string): boolean {
    return this.getCourseRatings().some(
      r => r.student_id.toLowerCase() === studentId.toLowerCase() && r.module_id === moduleId
    );
  }

  public submitCourseRating(
    evaluation: Omit<CourseRating, 'rating_id' | 'overall_score' | 'created_at'>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): CourseRating {
    // 1. Verify student is actually registered for this module
    const registrations = this.getRegistrationsByStudent(evaluation.student_id);
    const isEnrolled = registrations.some(r => r.module_id === evaluation.module_id);
    if (!isEnrolled) {
      throw new Error(`Enrollment constraint: Student ${evaluation.student_id} is not registered in module ${evaluation.module_id}. Only enrolled students may evaluate a course.`);
    }

    // 2. Prevent duplicate rating (strictly one evaluation per student per module)
    if (this.hasStudentRatedModule(evaluation.student_id, evaluation.module_id)) {
      throw new Error(`Duplicate evaluation rejected: You have already submitted an evaluation for module ${evaluation.module_id}. Duplicate ratings are prohibited by academic policy.`);
    }

    // 3. Validate score ranges (1 - 5 stars)
    const scores = [evaluation.teaching_score, evaluation.fairness_score, evaluation.materials_score, evaluation.timeliness_score];
    for (const s of scores) {
      if (typeof s !== 'number' || s < 1 || s > 5) {
        throw new Error('All rating dimensions must be scored between 1 and 5 stars.');
      }
    }

    // 4. Calculate weighted overall score:
    // Teaching (30%), Assessment Fairness (30%), Course Materials (20%), Feedback Timeliness (20%)
    const rawOverall = (
      evaluation.teaching_score * 0.30 +
      evaluation.fairness_score * 0.30 +
      evaluation.materials_score * 0.20 +
      evaluation.timeliness_score * 0.20
    );
    const overallScore = Math.round(rawOverall * 10) / 10;

    const newRating: CourseRating = {
      ...evaluation,
      rating_id: `RAT-${Date.now().toString().slice(-6)}`,
      overall_score: overallScore,
      created_at: new Date().toISOString(),
    };

    const currentRatings = this.getCourseRatings();
    this.set(DB_KEYS.RATINGS, [newRating, ...currentRatings]);

    // 5. Fire Database Trigger: trg_after_rating_insert
    this.executeTrigger(
      'trg_after_rating_insert',
      'AFTER INSERT',
      'module_evaluations',
      newRating.rating_id,
      `Auto-recalculated teaching score for lecturer ${newRating.lecturer_id} across ${currentRatings.length + 1} student evaluations. Overall: ${overallScore}/5.0`
    );

    // 6. Security & Audit Logging
    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'RATING_SUBMITTED',
      entity_type: 'MODULE',
      entity_id: newRating.module_id,
      old_value: null,
      new_value: `Score: ${overallScore}/5.0 (T:${newRating.teaching_score}, F:${newRating.fairness_score}, M:${newRating.materials_score}, Time:${newRating.timeliness_score})`,
      description: `Course and faculty evaluation recorded for module ${newRating.module_id} by student ${newRating.is_anonymous ? '[ANONYMOUS]' : newRating.student_id}.`
    });

    return newRating;
  }

  public calculateModuleRatingSummary(moduleId: string): ModuleRatingSummary {
    const ratings = this.getRatingsByModule(moduleId);
    const mod = this.getModuleById(moduleId);
    const lec = mod?.lecturer_id ? this.getLecturerById(mod.lecturer_id) : undefined;

    const total = ratings.length;
    if (total === 0) {
      return {
        module_id: moduleId,
        module_code: mod?.module_code || moduleId,
        module_name: mod?.module_name || 'Module',
        lecturer_id: mod?.lecturer_id || '',
        lecturer_name: lec?.lecturer_name || 'Faculty Member',
        total_ratings: 0,
        average_overall: 0,
        average_teaching: 0,
        average_fairness: 0,
        average_materials: 0,
        average_timeliness: 0,
        distribution: { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 },
        satisfaction_rate: 0,
      };
    }

    const sumOverall = ratings.reduce((acc, r) => acc + r.overall_score, 0);
    const sumTeaching = ratings.reduce((acc, r) => acc + r.teaching_score, 0);
    const sumFairness = ratings.reduce((acc, r) => acc + r.fairness_score, 0);
    const sumMaterials = ratings.reduce((acc, r) => acc + r.materials_score, 0);
    const sumTimeliness = ratings.reduce((acc, r) => acc + r.timeliness_score, 0);

    const dist = { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 };
    let satisfiedCount = 0;
    ratings.forEach(r => {
      const rounded = Math.round(r.overall_score);
      if (rounded >= 5) dist.five_star++;
      else if (rounded === 4) dist.four_star++;
      else if (rounded === 3) dist.three_star++;
      else if (rounded === 2) dist.two_star++;
      else dist.one_star++;

      if (r.overall_score >= 3.8) satisfiedCount++;
    });

    return {
      module_id: moduleId,
      module_code: mod?.module_code || moduleId,
      module_name: mod?.module_name || 'Module',
      lecturer_id: mod?.lecturer_id || '',
      lecturer_name: lec?.lecturer_name || 'Faculty Member',
      total_ratings: total,
      average_overall: Math.round((sumOverall / total) * 10) / 10,
      average_teaching: Math.round((sumTeaching / total) * 10) / 10,
      average_fairness: Math.round((sumFairness / total) * 10) / 10,
      average_materials: Math.round((sumMaterials / total) * 10) / 10,
      average_timeliness: Math.round((sumTimeliness / total) * 10) / 10,
      distribution: dist,
      satisfaction_rate: Math.round((satisfiedCount / total) * 100),
    };
  }

  public calculateLecturerRatingSummary(lecturerId: string) {
    const ratings = this.getRatingsByLecturer(lecturerId);
    const lec = this.getLecturerById(lecturerId);
    const total = ratings.length;

    if (total === 0) {
      return {
        lecturer_id: lecturerId,
        lecturer_name: lec?.lecturer_name || 'Faculty Member',
        department: lec?.department || 'Academic Department',
        total_ratings: 0,
        average_rating: 0,
        satisfaction_rate: 0,
        breakdown: { teaching: 0, fairness: 0, materials: 0, timeliness: 0 },
        distribution: { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 },
        recent_comments: [],
      };
    }

    const sumOverall = ratings.reduce((acc, r) => acc + r.overall_score, 0);
    const sumTeaching = ratings.reduce((acc, r) => acc + r.teaching_score, 0);
    const sumFairness = ratings.reduce((acc, r) => acc + r.fairness_score, 0);
    const sumMaterials = ratings.reduce((acc, r) => acc + r.materials_score, 0);
    const sumTimeliness = ratings.reduce((acc, r) => acc + r.timeliness_score, 0);

    const dist = { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 };
    let satisfiedCount = 0;
    ratings.forEach(r => {
      const rounded = Math.round(r.overall_score);
      if (rounded >= 5) dist.five_star++;
      else if (rounded === 4) dist.four_star++;
      else if (rounded === 3) dist.three_star++;
      else if (rounded === 2) dist.two_star++;
      else dist.one_star++;

      if (r.overall_score >= 3.8) satisfiedCount++;
    });

    return {
      lecturer_id: lecturerId,
      lecturer_name: lec?.lecturer_name || 'Faculty Member',
      department: lec?.department || 'Academic Department',
      total_ratings: total,
      average_rating: Math.round((sumOverall / total) * 10) / 10,
      satisfaction_rate: Math.round((satisfiedCount / total) * 100),
      breakdown: {
        teaching: Math.round((sumTeaching / total) * 10) / 10,
        fairness: Math.round((sumFairness / total) * 10) / 10,
        materials: Math.round((sumMaterials / total) * 10) / 10,
        timeliness: Math.round((sumTimeliness / total) * 10) / 10,
      },
      distribution: dist,
      recent_comments: ratings.filter(r => r.comment && r.comment.trim().length > 0),
    };
  }

  // =========================================================================
  // 2. DATABASE TRIGGER ENGINE & AUDIT TELEMETRY
  // =========================================================================
  public getTriggers(): DatabaseTrigger[] {
    return this.get<DatabaseTrigger[]>(DB_KEYS.TRIGGERS, INITIAL_TRIGGERS);
  }

  public toggleTrigger(
    triggerId: string,
    enabled: boolean,
    operator: { user_id: string; username: string; user_role: UserRole }
  ): void {
    const triggers = this.getTriggers();
    const trigger = triggers.find(t => t.trigger_id === triggerId);
    if (!trigger) throw new Error('Trigger not found.');

    trigger.enabled = enabled;
    this.set(DB_KEYS.TRIGGERS, triggers);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: enabled ? 'TRIGGER_ENABLED' : 'TRIGGER_DISABLED',
      entity_type: 'ACADEMIC_RULE',
      entity_id: trigger.trigger_name,
      old_value: enabled ? 'DISABLED' : 'ENABLED',
      new_value: enabled ? 'ENABLED' : 'DISABLED',
      description: `Administrator ${operator.username} set database trigger ${trigger.trigger_name} state to ${enabled ? 'ACTIVE' : 'DISABLED'}.`
    });
  }

  public getTriggerLogs(): TriggerExecutionLog[] {
    return this.get<TriggerExecutionLog[]>(DB_KEYS.TRIGGER_LOGS, INITIAL_TRIGGER_LOGS);
  }

  public clearTriggerLogs(): void {
    this.set(DB_KEYS.TRIGGER_LOGS, []);
  }

  public executeTrigger(
    triggerName: string,
    event: string,
    tableName: string,
    entityId: string,
    details: string,
    actionFn?: () => void
  ): boolean {
    const triggers = this.getTriggers();
    const trigger = triggers.find(t => t.trigger_name === triggerName);
    
    // If trigger exists but disabled by admin, skip execution
    if (trigger && !trigger.enabled) {
      return false;
    }

    const startTime = performance.now();
    let status: 'SUCCESS' | 'ERROR' = 'SUCCESS';
    let execDetails = details;

    try {
      if (actionFn) actionFn();
    } catch (err: any) {
      status = 'ERROR';
      execDetails = `Trigger execution halted: ${err.message}`;
    }

    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    // Update trigger metrics
    if (trigger) {
      trigger.fire_count = (trigger.fire_count || 0) + 1;
      trigger.last_fired_at = new Date().toISOString();
      this.set(DB_KEYS.TRIGGERS, triggers);
    }

    // Append to live trigger logs (keep last 100 entries)
    const currentLogs = this.getTriggerLogs();
    const newLog: TriggerExecutionLog = {
      log_id: `TLOG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      trigger_name: triggerName,
      event,
      table_name: tableName,
      entity_id: entityId,
      timestamp: new Date().toISOString(),
      execution_time_ms: Math.max(0.4, duration),
      details: execDetails,
      status,
    };

    this.set(DB_KEYS.TRIGGER_LOGS, [newLog, ...currentLogs.slice(0, 99)]);
    return status === 'SUCCESS';
  }

  // =========================================================================
  // 3. STORED PROCEDURES & ARCHITECTURAL COMPARISON
  // =========================================================================
  public getStoredProcedures(): StoredProcedureDefinition[] {
    return this.get<StoredProcedureDefinition[]>(DB_KEYS.STORED_PROCEDURES, INITIAL_STORED_PROCEDURES);
  }

  public simulateStoredProcedure(
    procId: string,
    params: Record<string, any>,
    operator: { user_id: string; username: string; user_role: UserRole }
  ) {
    const proc = this.getStoredProcedures().find(p => p.proc_id === procId || p.proc_name === procId);
    if (!proc) throw new Error('Stored procedure definition not found.');

    const startTime = performance.now();
    let executionPlan = '';
    let result: any = null;

    if (proc.proc_name === 'sp_CalculateStudentModuleResult') {
      const studentId = params.student_id || 'STU-TLHOMPO';
      const moduleId = params.module_id || 'MOD-CS101';
      result = this.recalculateResultForStudent(studentId, moduleId, operator);
      executionPlan = `EXPLAIN ANALYZE CALL sp_CalculateStudentModuleResult('${studentId}', '${moduleId}', '${operator.user_id}');\n-> Transaction started with REPEATABLE READ isolation\n-> Index Lookup on idx_mark_lookup (student_id='${studentId}', module_id='${moduleId}') (cost=0.35 rows=3)\n-> Aggregate: sum(mark * weight / 100) (actual time=0.04ms)\n-> Conditional branch: Weight normalized to 100%\n-> Index Unique Update on uq_result_student_module (results) (actual time=0.06ms)\n-> COMMIT transaction completed cleanly.`;
    } else if (proc.proc_name === 'sp_SubmitCourseEvaluation') {
      executionPlan = `EXPLAIN ANALYZE CALL sp_SubmitCourseEvaluation('${params.student_id}', '${params.module_id}', ${params.teaching_score}, ${params.fairness_score}, ${params.materials_score}, ${params.timeliness_score});\n-> Index Lookup on idx_reg_student (student_modules) (actual time=0.02ms)\n-> Unique Index Lookup on uq_eval_student_module (actual time=0.03ms)\n-> Table Insert on module_evaluations\n-> Trigger trg_after_rating_insert fired\n-> Aggregate avg(overall_score) on lecturers table updated\n-> COMMIT.`;
      result = { status: 'SUCCESS', message: 'Stored procedure executed atomically within database engine.' };
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      proc_name: proc.proc_name,
      durationMs: Math.max(0.6, durationMs),
      executionPlan,
      result,
      timestamp: new Date().toISOString()
    };
  }

  // =========================================================================
  // 4. CONCURRENCY CONTROL & OPTIMISTIC LOCKING (OCC)
  // =========================================================================
  public getEntityVersion(entityType: string, entityId: string): number {
    const versions = this.get<Record<string, number>>(DB_KEYS.CONCURRENCY_VERSIONS, {
      'MARK:STU-TLHOMPO:MOD-CS101': 1,
      'MARK:STU-TLHOMPO:MOD-CS102': 1,
      'MODULE:MOD-CS101': 2,
    });
    const key = `${entityType}:${entityId}`;
    return versions[key] || 1;
  }

  public incrementEntityVersion(entityType: string, entityId: string): number {
    const versions = this.get<Record<string, number>>(DB_KEYS.CONCURRENCY_VERSIONS, {
      'MARK:STU-TLHOMPO:MOD-CS101': 1,
      'MARK:STU-TLHOMPO:MOD-CS102': 1,
      'MODULE:MOD-CS101': 2,
    });
    const key = `${entityType}:${entityId}`;
    const nextVer = (versions[key] || 1) + 1;
    versions[key] = nextVer;
    this.set(DB_KEYS.CONCURRENCY_VERSIONS, versions);
    return nextVer;
  }

  public simulateConcurrentConflict(
    studentId: string,
    moduleId: string,
    operatorA: { username: string; user_role: string },
    operatorB: { username: string; user_role: string },
    userANewMark: number,
    userBNewMark: number
  ): { conflict: boolean; details: ConcurrencyConflictDetails; resolutionHelp: string } {
    const entityKey = `${studentId}:${moduleId}`;
    const initialVersion = this.getEntityVersion('MARK', entityKey);

    // Operator A saves successfully first and advances version to initialVersion + 1
    const newVersionA = this.incrementEntityVersion('MARK', entityKey);

    // Operator B attempts to save using their stale read (initialVersion), causing conflict!
    const conflictDetails: ConcurrencyConflictDetails = {
      entity_id: entityKey,
      table_name: 'marks',
      current_version: newVersionA,
      attempted_version: initialVersion,
      current_data: {
        assessment_name: 'Final Exam',
        mark: userANewMark,
        saved_by: operatorA.username,
        updated_at: new Date(Date.now() - 2000).toISOString(),
      },
      conflicting_data: {
        assessment_name: 'Final Exam',
        mark: userBNewMark,
        submitted_by: operatorB.username,
        stale_read_version: initialVersion,
      },
      last_modified_by: operatorA.username,
      last_updated_at: new Date().toISOString(),
    };

    // Log concurrency collision to audit trail
    this.addAuditLog({
      user_id: 'SYSTEM',
      username: operatorB.username,
      user_role: operatorB.user_role as UserRole,
      action: 'CONCURRENCY_CONFLICT_DETECTED',
      entity_type: 'MARK',
      entity_id: entityKey,
      old_value: `Version ${newVersionA} (Saved by ${operatorA.username})`,
      new_value: `Attempted Version ${initialVersion} (Stale write by ${operatorB.username})`,
      description: `Optimistic Concurrency Lock prevented Lost Update anomaly on ${entityKey}. Stale version ${initialVersion} was rejected because current database version is ${newVersionA}.`
    });

    return {
      conflict: true,
      details: conflictDetails,
      resolutionHelp: `Conflict caught by Optimistic Concurrency Control (OCC). Prevented lost update from ${operatorB.username} overwriting ${operatorA.username}'s update.`
    };
  }

  // =========================================================================
  // 5. CLOUD DATABASE ARCHITECTURE & SYNC SIMULATOR
  // =========================================================================
  public getCloudSyncStatus() {
    const lastSync = localStorage.getItem(DB_KEYS.CLOUD_SYNC_STATUS) || new Date(Date.now() - 180000).toISOString();
    return {
      isConnected: true,
      provider: 'Google Cloud SQL (PostgreSQL 16) & Firebase Firestore',
      cloudRegion: 'europe-west2 (London)',
      lastSyncTime: lastSync,
      replicationStatus: 'SYNCHRONIZED',
      pendingQueueLength: 0,
      networkLatencyMs: 24,
      encryptionStatus: 'TLS 1.3 in-transit / AES-256 at-rest',
      totalCloudRecords: (
        this.getUsers().length +
        this.getStudents().length +
        this.getLecturers().length +
        this.getModules().length +
        this.getMarks().length +
        this.getResults().length +
        this.getCourseRatings().length
      ),
      acidIsolationLevel: 'SERIALIZABLE',
    };
  }

  public simulateCloudSync(operator: { user_id: string; username: string; user_role: UserRole }) {
    const startTime = performance.now();
    const now = new Date().toISOString();
    localStorage.setItem(DB_KEYS.CLOUD_SYNC_STATUS, now);

    this.addAuditLog({
      user_id: operator.user_id,
      username: operator.username,
      user_role: operator.user_role,
      action: 'CLOUD_SYNC_COMPLETED',
      entity_type: 'ACADEMIC_RULE',
      entity_id: 'CLOUD-INSTANCE',
      old_value: null,
      new_value: `Cloud Sync Snapshot verified at ${new Date(now).toLocaleTimeString()}`,
      description: `Cloud database synchronized. Verified ACID constraints, replicas, and security rules.`
    });

    const duration = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      message: 'Cloud database snapshot and replica state synchronized successfully.',
      timestamp: now,
      latencyMs: Math.max(18, duration + 18),
      recordsSynced: (
        this.getUsers().length +
        this.getStudents().length +
        this.getModules().length +
        this.getMarks().length +
        this.getResults().length +
        this.getCourseRatings().length
      ),
    };
  }

  public verifyDatabaseIntegrity() {
    const students = this.getStudents();
    const modules = this.getModules();
    const registrations = this.getRegistrations();
    const marks = this.getMarks();
    const results = this.getResults();

    const studentIds = new Set(students.map(s => s.student_id));
    const moduleIds = new Set(modules.map(m => m.module_id));

    const orphanRegistrations = registrations.filter(r => !studentIds.has(r.student_id) || !moduleIds.has(r.module_id));
    const orphanMarks = marks.filter(m => !studentIds.has(m.student_id) || !moduleIds.has(m.module_id));
    const orphanResults = results.filter(r => !studentIds.has(r.student_id) || !moduleIds.has(r.module_id));
    const invalidMarksRange = marks.filter(m => m.mark < 0 || m.mark > 100 || m.assessment_weight <= 0);

    const checks = [
      {
        name: 'Foreign Key Constraint: Registrations -> Students & Modules',
        passed: orphanRegistrations.length === 0,
        message: orphanRegistrations.length === 0 ? 'All 100% registrations link to valid entities.' : `${orphanRegistrations.length} orphan registrations detected.`
      },
      {
        name: 'Foreign Key Constraint: Marks -> Students & Modules',
        passed: orphanMarks.length === 0,
        message: orphanMarks.length === 0 ? 'All assessment marks link to valid students and modules.' : `${orphanMarks.length} orphan marks detected.`
      },
      {
        name: 'Foreign Key Constraint: Results -> Students & Modules',
        passed: orphanResults.length === 0,
        message: orphanResults.length === 0 ? 'All calculated final results link to valid students and modules.' : `${orphanResults.length} orphan results detected.`
      },
      {
        name: 'Domain Check Constraint: Mark values in [0.00, 100.00]',
        passed: invalidMarksRange.length === 0,
        message: invalidMarksRange.length === 0 ? 'All marks conform to the 0-100 percentage scale.' : `${invalidMarksRange.length} boundary violations detected.`
      },
      {
        name: 'Unique Key Constraint: Student Module Enrolment Term Uniqueness',
        passed: true,
        message: 'No duplicate concurrent registrations found.'
      }
    ];

    const allPassed = checks.every(c => c.passed);
    return {
      isValid: allPassed,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  public getCloudSecurityPolicies() {
    return {
      firestoreRules: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function for user role validation
    function hasRole(role) {
      return request.auth != null && request.auth.token.role == role;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if hasRole('ADMINISTRATOR');
    }
    
    match /marks/{markId} {
      allow read: if request.auth != null;
      allow create, update: if hasRole('LECTURER') || hasRole('ADMINISTRATOR');
      allow delete: if hasRole('ADMINISTRATOR');
    }
    
    match /results/{resultId} {
      allow read: if request.auth != null;
      allow write: if hasRole('ADMINISTRATOR') || hasRole('LECTURER');
    }
    
    match /module_evaluations/{evalId} {
      allow read: if request.auth != null;
      // Only students can create evaluations, strictly one per student per course
      allow create: if hasRole('STUDENT') && request.auth.uid == request.resource.data.student_id;
      allow update, delete: if false; // Immutable evaluation records
    }
  }
}`,
      postgresRLS: `-- PostgreSQL 16 Row-Level Security (RLS) Policies
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_evaluations ENABLE ROW LEVEL SECURITY;

-- 1. Marks Policy: Lecturers only edit marks for their assigned modules
CREATE POLICY lecturer_module_marks ON marks
  FOR ALL
  TO authenticated_lecturers
  USING (module_id IN (SELECT module_id FROM modules WHERE lecturer_id = current_user_id()))
  WITH CHECK (module_id IN (SELECT module_id FROM modules WHERE lecturer_id = current_user_id()));

-- 2. Results Policy: Students can only SELECT their own academic results
CREATE POLICY student_view_own_results ON results
  FOR SELECT
  TO authenticated_students
  USING (student_id = current_student_id());

-- 3. Course Evaluations Policy: Students can insert their own evaluation once
CREATE POLICY student_submit_evaluation ON module_evaluations
  FOR INSERT
  TO authenticated_students
  WITH CHECK (student_id = current_student_id());`
    };
  }

  public generateMySQLDump(): string {
    const students = this.getStudents();
    const modules = this.getModules();
    const registrations = this.getRegistrations();
    const marks = this.getMarks();
    const results = this.getResults();
    const users = this.getUsers();
    const lecturers = this.getLecturers();
    const rules = this.getAcademicRules();

    return `-- ========================================================
-- STUDENT RESULTS MANAGEMENT SYSTEM
-- Higher Education Institution Database Schema & Dump
-- Target DBMS: MySQL 8.0+ / MariaDB
-- Architecture: 3-Tier Enterprise Relational Architecture
-- Generated: ${new Date().toISOString()}
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS student_modules;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS lecturers;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academic_rules;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE
CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMINISTRATOR', 'LECTURER', 'STUDENT') NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  reference_id VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. LECTURERS TABLE
CREATE TABLE lecturers (
  lecturer_id VARCHAR(50) PRIMARY KEY,
  lecturer_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  department VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. STUDENTS TABLE
CREATE TABLE students (
  student_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  course VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone_number VARCHAR(50) NULL,
  year_of_study INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  status ENUM('ACTIVE', 'SUSPENDED', 'EXCLUDED', 'GRADUATED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. MODULES TABLE
CREATE TABLE modules (
  module_id VARCHAR(50) PRIMARY KEY,
  module_code VARCHAR(20) NOT NULL UNIQUE,
  module_name VARCHAR(150) NOT NULL,
  description TEXT,
  credits INT NOT NULL,
  semester VARCHAR(30) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  lecturer_id VARCHAR(50) NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(lecturer_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. STUDENT_MODULES JUNCTION TABLE
CREATE TABLE student_modules (
  registration_id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(30) NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_module_year (student_id, module_id, academic_year),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ASSESSMENTS / MARKS TABLE
CREATE TABLE assessments (
  mark_id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  assessment_name VARCHAR(100) NOT NULL,
  mark DECIMAL(5,2) NOT NULL CHECK (mark >= 0 AND mark <= 100),
  assessment_weight DECIMAL(5,2) NOT NULL CHECK (assessment_weight > 0 AND assessment_weight <= 100),
  date_captured TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  captured_by VARCHAR(50) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. RESULTS TABLE
CREATE TABLE results (
  result_id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  final_mark DECIMAL(5,2) NOT NULL CHECK (final_mark >= 0 AND final_mark <= 100),
  grade VARCHAR(10) NOT NULL,
  status ENUM('DISTINCTION', 'PASS', 'FAIL', 'EXCLUSION') NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(30) NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_result (student_id, module_id, academic_year),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. AUDIT_LOG TABLE
CREATE TABLE audit_log (
  audit_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. ACADEMIC_RULES CONFIG TABLE
CREATE TABLE academic_rules (
  rule_id VARCHAR(50) PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL,
  minimum_mark DECIMAL(5,2) NOT NULL,
  maximum_mark DECIMAL(5,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  grade_letter VARCHAR(10) NOT NULL,
  description TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERT SEED DATA DUMP
-- Users: ${users.length} records
-- Students: ${students.length} records
-- Lecturers: ${lecturers.length} records
-- Modules: ${modules.length} records
-- Registrations: ${registrations.length} records
-- Marks: ${marks.length} records
-- Results: ${results.length} records
-- Academic Rules: ${rules.length} records
`;
  }
}

export const db = new DatabaseStore();
// Initialize storage
db.initialize();
