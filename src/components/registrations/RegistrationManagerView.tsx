import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  BookOpen,
  GraduationCap,
  Layers,
  Check,
  Calendar,
  Building
} from 'lucide-react';
import { db } from '../../data/db';
import { StudentModuleRegistration, AuthSession } from '../../types';

interface RegistrationManagerViewProps {
  session: AuthSession;
}

export const RegistrationManagerView: React.FC<RegistrationManagerViewProps> = ({
  session,
}) => {
  const isStudent = session.user.role === 'STUDENT';
  const isAdmin = session.user.role === 'ADMINISTRATOR';

  const [registrations, setRegistrations] = useState<StudentModuleRegistration[]>(() => db.getRegistrations());
  const students = db.getStudents();
  const modules = db.getModules();
  const lecturers = db.getLecturers();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.student_id || '');
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.module_id || '');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [semester, setSemester] = useState('Semester 1');

  // Feedback Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student Identity Resolution
  const currentStudent =
    session.student_profile ||
    (session.user.reference_id ? db.getStudentById(session.user.reference_id) : undefined) ||
    students.find(
      s => s.email.toLowerCase() === session.user.email.toLowerCase() ||
           s.student_id.toLowerCase() === session.user.username.toLowerCase() ||
           (session.user.reference_id && s.student_id.toLowerCase() === session.user.reference_id.toLowerCase())
    );

  const currentStudentId = currentStudent?.student_id || session.user.reference_id || '';

  const refreshList = () => {
    setRegistrations(db.getRegistrations());
  };

  // Operator Context
  const operator = {
    user_id: session.user.user_id,
    username: session.user.username,
    user_role: session.user.role,
  };

  // Student Self-Registration Handler
  const handleStudentRegister = (moduleId: string, moduleSemester: string) => {
    setErrorMessage(null);
    if (!currentStudentId) {
      setErrorMessage('Could not resolve your student record. Please contact administration.');
      return;
    }

    try {
      db.registerStudentForModule(
        currentStudentId,
        moduleId,
        '2024/2025',
        moduleSemester || 'Semester 1',
        operator
      );

      const mod = modules.find(m => m.module_id === moduleId);
      setSuccessMessage(`Successfully registered for ${mod?.module_code} - ${mod?.module_name}!`);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register for module.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Student Self-Drop Handler
  const handleStudentDrop = (registrationId: string, moduleCode: string) => {
    setErrorMessage(null);
    try {
      db.removeRegistration(registrationId, operator);
      setSuccessMessage(`Deregistered from module ${moduleCode}. You may register again anytime.`);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to drop module.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Admin Enrollment Handler
  const handleAdminRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      db.registerStudentForModule(
        selectedStudentId,
        selectedModuleId,
        academicYear,
        semester,
        operator
      );

      const st = students.find(s => s.student_id === selectedStudentId);
      const md = modules.find(m => m.module_id === selectedModuleId);

      setSuccessMessage(`Enrolled ${st?.name || selectedStudentId} into ${md?.module_code || selectedModuleId} successfully.`);
      setIsModalOpen(false);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register student for module.');
    }
  };

  // Admin Remove Handler
  const handleAdminRemove = (registrationId: string, studentName: string, moduleCode: string) => {
    try {
      db.removeRegistration(registrationId, operator);
      setSuccessMessage(`Enrollment removed for ${studentName} (${moduleCode}).`);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Distinct departments from lecturers
  const departments = Array.from(new Set(lecturers.map(l => l.department))).filter(Boolean);

  // Helper to find lecturer
  const getLecturer = (lecturerId?: string) => lecturerId ? lecturers.find(l => l.lecturer_id === lecturerId) : undefined;

  // Student's currently registered modules
  const myRegistrations = registrations.filter(
    r => r.student_id.toLowerCase() === currentStudentId.toLowerCase()
  );
  const myRegisteredModuleIds = new Set(myRegistrations.map(r => r.module_id));
  const myRegisteredModules = myRegistrations
    .map(r => ({
      reg: r,
      module: modules.find(m => m.module_id === r.module_id),
    }))
    .filter(item => item.module !== undefined);

  const totalRegisteredCredits = myRegisteredModules.reduce(
    (sum, item) => sum + (item.module?.credits || 0),
    0
  );

  // Filtered modules for student catalog
  const filteredModulesForStudent = modules.filter(mod => {
    const lec = getLecturer(mod.lecturer_id);
    const modDept = lec?.department || '';

    const matchesSearch =
      mod.module_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.module_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      modDept.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSemester = semesterFilter === 'ALL' || mod.semester === semesterFilter;
    const matchesDept = deptFilter === 'ALL' || modDept === deptFilter;

    return matchesSearch && matchesSemester && matchesDept;
  });

  // Admin filtered registrations
  const filteredRegistrations = registrations.filter(reg => {
    const student = students.find(s => s.student_id === reg.student_id);
    const mod = modules.find(m => m.module_id === reg.module_id);

    const matchesSearch =
      (student && (student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.student_id.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (mod && (mod.module_code.toLowerCase().includes(searchQuery.toLowerCase()) || mod.module_name.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesModule = moduleFilter === 'ALL' || reg.module_id === moduleFilter;

    return matchesSearch && matchesModule;
  });

  // ==========================================
  // STUDENT SELF-REGISTRATION VIEW
  // ==========================================
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Module Registration & Course Enrollment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select and register for the curriculum modules you want to take this semester at Kimberley University of Technology.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Registration Window Open
            </span>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in shadow-2xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3 animate-fade-in shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Student Profile & Registration Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {currentStudent?.name || session.user.username}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student ID</span>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {currentStudentId || '202353353'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Programme / Cohort</span>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">
                {currentStudent?.course || 'BSc Computer Science'} (Year {currentStudent?.year_of_study || 1})
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Credits</span>
              <div className="font-extrabold text-emerald-700 text-sm mt-0.5">
                {totalRegisteredCredits} Credits ({myRegisteredModules.length} Modules)
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: My Registered Modules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                My Registered Modules ({myRegisteredModules.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Academic Year: 2024/2025
            </span>
          </div>

          {myRegisteredModules.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Module Title</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-center">Semester</th>
                      <th className="px-4 py-3 text-center">Credits</th>
                      <th className="px-4 py-3 text-center">Date Enrolled</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {myRegisteredModules.map(({ reg, module }) => {
                      if (!module) return null;
                      return (
                        <tr key={reg.registration_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {module.module_code}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {module.module_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {getLecturer(module.lecturer_id)?.department || 'Computer Science & Technology'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                              {reg.semester}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900">
                            {module.credits}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-400">
                            {new Date(reg.registration_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              id={`drop-module-${module.module_code}`}
                              onClick={() => handleStudentDrop(reg.registration_id, module.module_code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              title="Drop this module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Drop Module
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">You have not registered for any modules yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Browse the curriculum modules available below and click &quot;Register for Module&quot; to build your study schedule.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Available Modules Catalog */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Available Modules for Registration
            </h3>
            <p className="text-xs text-slate-500">
              Click &quot;Register for Module&quot; to enroll in any course for the upcoming academic period.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="student-catalog-search"
                type="text"
                placeholder="Search modules by code, title, or department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                id="student-semester-filter"
                value={semesterFilter}
                onChange={e => setSemesterFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Semesters</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>

              <select
                id="student-dept-filter"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModulesForStudent.map(mod => {
              const isEnrolled = myRegisteredModuleIds.has(mod.module_id);
              const lecturer = lecturers.find(l => l.lecturer_id === mod.lecturer_id);
              const enrolledReg = myRegistrations.find(r => r.module_id === mod.module_id);

              return (
                <div
                  key={mod.module_id}
                  className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                    isEnrolled
                      ? 'border-emerald-300 ring-1 ring-emerald-200/50 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
                        {mod.module_code}
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        {mod.credits} Credits
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm tracking-tight mb-1">
                      {mod.module_name}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                      {mod.description || 'Comprehensive university curriculum module adhering to institutional assessment standards.'}
                    </p>

                    <div className="space-y-1 text-[11px] text-slate-600 mb-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lecturer?.department || 'Academic Department'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{mod.semester} (2024/2025)</span>
                      </div>
                      {lecturer && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lecturer: {lecturer.lecturer_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isEnrolled ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                          Enrolled
                        </span>
                        {enrolledReg && (
                          <button
                            onClick={() => handleStudentDrop(enrolledReg.registration_id, mod.module_code)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                          >
                            Drop
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        id={`register-btn-${mod.module_code}`}
                        onClick={() => handleStudentRegister(mod.module_id, mod.semester)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Register for Module
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredModulesForStudent.length === 0 && (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No modules match your filter criteria. Try clearing search or selecting &quot;All Departments&quot;.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMINISTRATOR / LECTURER VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Student-Module Registrations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Normalized many-to-many junction table enrolling students into academic courses.
          </p>
        </div>

        {isAdmin && (
          <button
            id="enroll-student-btn"
            onClick={() => {
              if (students.length > 0) setSelectedStudentId(students[0].student_id);
              if (modules.length > 0) setSelectedModuleId(modules[0].module_id);
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Enroll Student in Module
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="registration-search-input"
            type="text"
            placeholder="Search by Student Name, ID, or Course Code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          id="registration-module-filter"
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Modules</option>
          {modules.map(m => (
            <option key={m.module_id} value={m.module_id}>
              {m.module_code} - {m.module_name}
            </option>
          ))}
        </select>
      </div>

      {/* Registrations Junction Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Reg ID</th>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Module Enrolled</th>
                <th className="px-4 py-3 text-center">Semester / Year</th>
                <th className="px-4 py-3 text-center">Registration Date</th>
                {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map(reg => {
                  const student = students.find(s => s.student_id === reg.student_id);
                  const mod = modules.find(m => m.module_id === reg.module_id);

                  return (
                    <tr key={reg.registration_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        {reg.registration_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{student?.name || reg.student_id}</div>
                        <div className="text-[11px] font-mono text-slate-400">{reg.student_id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 font-mono">{mod?.module_code}</div>
                        <div className="text-[11px] text-slate-500">{mod?.module_name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-600">
                        <span className="font-medium">{reg.semester}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{reg.academic_year}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-500">
                        {new Date(reg.registration_date).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right">
                          <button
                            id={`deregister-btn-${reg.registration_id}`}
                            onClick={() => handleAdminRemove(reg.registration_id, student?.name || reg.student_id, mod?.module_code || reg.module_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Deregister Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No active student registrations found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Enroll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Enroll Student in Module
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminRegister} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Student <span className="text-rose-500">*</span>
                </label>
                <select
                  id="enroll-modal-student-select"
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} ({s.student_id}) - {s.course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Module <span className="text-rose-500">*</span>
                </label>
                <select
                  id="enroll-modal-module-select"
                  value={selectedModuleId}
                  onChange={e => setSelectedModuleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {modules.map(m => (
                    <option key={m.module_id} value={m.module_id}>
                      {m.module_code} - {m.module_name} ({m.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Semester
                  </label>
                  <select
                    id="enroll-modal-semester"
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Academic Year
                  </label>
                  <input
                    id="enroll-modal-year"
                    type="text"
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                Enforcing relational uniqueness: Students cannot be registered twice for the same module within the same academic cohort.
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-enroll-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
