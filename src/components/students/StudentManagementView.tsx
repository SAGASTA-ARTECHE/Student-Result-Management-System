import React, {  useEffect ,useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Edit2,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Phone,
  Mail,
  BookOpen,
  Award,
  Edit3,
  Users,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { db } from '../../data/db';
import { supabaseDataService } from '../../services/supabaseDataService';
import { Student, AuthSession, Lecturer } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ReportService } from '../../services/reportService';

interface StudentManagementViewProps {
  session: AuthSession;
  onViewTranscript?: (studentId: string) => void;
  onNavigateToMarks?: (moduleId: string) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  session,
  onViewTranscript,
  onNavigateToMarks,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isAdmin = session.user.role === 'ADMINISTRATOR';
  const isLecturer = session.user.role === 'LECTURER';

  // Lecturer Context Resolution
  const allLecturers = db.getLecturers();
  const currentLecturer: Lecturer | undefined =
    session.lecturer_profile ||
    (session.user.reference_id ? db.getLecturerById(session.user.reference_id) : undefined) ||
    allLecturers.find(
      l => l.email.toLowerCase() === session.user.email.toLowerCase() ||
           (session.user.reference_id && l.lecturer_id.toLowerCase() === session.user.reference_id.toLowerCase())
    );

  const myAssignedModules = isLecturer && currentLecturer
    ? db.getModulesByLecturer(currentLecturer.lecturer_id)
    : [];
  const myModuleIds = myAssignedModules.map(m => m.module_id);

  // Scope: For lecturer, default to 'MY_COURSES' if they teach courses, otherwise 'ALL'
  const [courseScopeFilter, setCourseScopeFilter] = useState<string>(
    isLecturer && myAssignedModules.length > 0 ? 'MY_COURSES' : 'ALL'
  );
  const [specificModuleFilter, setSpecificModuleFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
  const loadStudents = async () => {
    try {
      const data = await supabaseDataService.listStudents();
      setStudents(data as Student[]);
    } catch (error) {
      console.error('Failed to load students from Supabase:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not load students from Supabase.'
      );
    }
  };

  loadStudents();
}, []);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    course: '',
    email: '',
    phone_number: '',
    year_of_study: 1,
    academic_year: '2024/2025',
    status: 'ACTIVE' as Student['status'],
  });

  const allRegistrations = db.getRegistrations();
  const allResults = db.getResults();

  const refreshList = async () => {
  const data = await supabaseDataService.listStudents();
  setStudents(data as Student[]);
};

  const handleOpenAddModal = () => {
    setFormData({
      student_id: `STU-2024-00${students.length + 1}`,
      name: '',
      course: 'BSc Computer Science',
      email: '',
      phone_number: '',
      year_of_study: 1,
      academic_year: '2024/2025',
      status: 'ACTIVE',
    });
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      course: student.course,
      email: student.email,
      phone_number: student.phone_number || '',
      year_of_study: student.year_of_study,
      academic_year: student.academic_year,
      status: student.status,
    });
    setErrorMessage(null);
  };

 
const handleSaveStudent = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);
  setSuccessMessage(null);

  if (!formData.student_id.trim()) {
    setErrorMessage('Student ID is required.');
    return;
  }

  if (!formData.name.trim()) {
    setErrorMessage('Student full name is required.');
    return;
  }

  if (!formData.course.trim()) {
    setErrorMessage('Course/programme is required.');
    return;
  }

  const nameParts = formData.name.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.pop()! : nameParts[0];
  const firstName = nameParts.join(' ') || lastName;

  try {
    if (editingStudent) {
      if (!editingStudent.supabase_id) {
        throw new Error(
          'This student has no Supabase ID. Reload the list and try again.'
        );
      }

      await supabaseDataService.updateStudent(editingStudent.supabase_id, {
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim() || null,
        programme: formData.course.trim(),
        year_of_study: Number(formData.year_of_study),
        phone_number: formData.phone_number.trim() || null,
        academic_year: formData.academic_year,
        status: formData.status,
      });

      setSuccessMessage(
        `Student profile for "${formData.name}" successfully updated.`
      );
      setEditingStudent(null);
    } else {
      await supabaseDataService.createStudent({
        student_number: formData.student_id.trim(),
        first_name: firstName,
        last_name: lastName,
        email:
          formData.email.trim() ||
          `${formData.student_id.trim().toLowerCase()}@student.edu`,
        programme: formData.course.trim(),
        year_of_study: Number(formData.year_of_study),
        phone_number: formData.phone_number.trim() || null,
        academic_year: formData.academic_year,
        status: formData.status,
      });

      setSuccessMessage(
        `Student "${formData.name}" [${formData.student_id}] successfully registered.`
      );
      setIsAddModalOpen(false);
    }

    await refreshList();
    setTimeout(() => setSuccessMessage(null), 5000);
  } catch (error) {
    console.error('Failed to save student:', error);
    setErrorMessage(
      error instanceof Error
        ? error.message
        : 'An error occurred while saving the student.'
    );
  }
};


  // Filter & search logic
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    // Course scope filter for lecturers
    if (isLecturer && courseScopeFilter === 'MY_COURSES') {
      const studentRegs = allRegistrations.filter(r => r.student_id === s.student_id);
      const isEnrolledInMyModules = studentRegs.some(r => myModuleIds.includes(r.module_id));
      if (!isEnrolledInMyModules) return false;

      if (specificModuleFilter !== 'ALL') {
        const inSpecific = studentRegs.some(r => r.module_id === specificModuleFilter);
        if (!inSpecific) return false;
      }
    } else if (specificModuleFilter !== 'ALL') {
      const studentRegs = allRegistrations.filter(r => r.student_id === s.student_id);
      if (!studentRegs.some(r => r.module_id === specificModuleFilter)) return false;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isLecturer ? 'Registered Students & Class Lists' : 'Student Academic Records'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLecturer
              ? 'View all students registered in your assigned courses and capture marks.'
              : 'Manage student registrations, academic cohorts, and profiles.'}
          </p>
        </div>

        {isAdmin && (
          <button
            id="add-student-btn"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          id="student-success-alert"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Lecturer Scope Tabs if user is Lecturer */}
      {isLecturer && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCourseScopeFilter('MY_COURSES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                courseScopeFilter === 'MY_COURSES'
                  ? 'bg-[#1d4ed8] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Enrolled in My Courses ({myAssignedModules.length > 0 ? myAssignedModules.map(m => m.module_code).join(', ') : 'None'})
            </button>
            <button
              onClick={() => setCourseScopeFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                courseScopeFilter === 'ALL'
                  ? 'bg-[#1d4ed8] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Registered Students ({students.length})
            </button>
          </div>

          {myAssignedModules.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Filter Course:</span>
              <select
                value={specificModuleFilter}
                onChange={e => setSpecificModuleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All My Courses</option>
                {myAssignedModules.map(m => (
                  <option key={m.module_id} value={m.module_id}>
                    {m.module_code} - {m.module_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="student-search-input"
            type="text"
            placeholder="Search by Student ID, Name, or Programme..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="student-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXCLUDED">Academic Exclusion</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Student ID</th>
                <th className="px-4 py-3 text-left">Full Name</th>
                <th className="px-4 py-3 text-left">Programme</th>
                {isLecturer && (
                  <th className="px-4 py-3 text-left">Enrolled Module(s)</th>
                )}
                <th className="px-4 py-3 text-center">Year</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const studentRegs = allRegistrations.filter(r => r.student_id === student.student_id);
                  const enrolledInMyCourses = studentRegs.filter(r => myModuleIds.includes(r.module_id));
                  const primaryModuleId = enrolledInMyCourses[0]?.module_id || studentRegs[0]?.module_id;

                  return (
                    <tr key={student.student_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500">{student.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-800 text-xs font-medium">
                        {student.course}
                      </td>
                      {isLecturer && (
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {enrolledInMyCourses.length > 0 ? (
                              enrolledInMyCourses.map(reg => {
                                const mod = db.getModuleById(reg.module_id);
                                const hasResult = allResults.some(res => res.student_id === student.student_id && res.module_id === reg.module_id);
                                return (
                                  <span
                                    key={reg.module_id}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                      hasResult ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                    }`}
                                    title={hasResult ? 'Marks Captured' : 'Marks Pending'}
                                  >
                                    <span>{mod ? mod.module_code : reg.module_id}</span>
                                    {hasResult ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-amber-600" />
                                    )}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-400 text-xs italic">Other courses</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-700">
                        Year {student.year_of_study}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={student.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isLecturer && primaryModuleId && onNavigateToMarks && (
                          <button
                            onClick={() => onNavigateToMarks(primaryModuleId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            title="Capture Marks for this student"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Capture Marks</span>
                          </button>
                        )}

                        <button
                          id={`view-student-profile-btn-${student.student_id}`}
                          onClick={() => setSelectedProfileStudent(student)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer inline-block"
                          title="View Academic Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <button
                            id={`edit-student-btn-${student.student_id}`}
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer inline-block"
                            title="Edit Student Information"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isLecturer ? 7 : 6} className="px-4 py-12 text-center text-slate-400 text-xs">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {isLecturer && courseScopeFilter === 'MY_COURSES'
                        ? 'No students currently registered in your assigned courses.'
                        : 'No student records found matching the current search or filters.'}
                    </p>
                    {isLecturer && courseScopeFilter === 'MY_COURSES' && (
                      <p className="text-slate-400 mt-1 max-w-md mx-auto">
                        When a student registers for your course ({myAssignedModules.map(m => m.module_code).join(', ') || 'assigned courses'}), they will appear here automatically for you to view and capture marks.
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingStudent ? `Edit Student Profile (${editingStudent.student_id})` : 'Register New Student'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="modal-student-id"
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.student_id}
                    onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    placeholder="e.g. STU-2024-006"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="modal-student-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Alexander Cole"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course / Programme <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-student-course"
                  type="text"
                  required
                  value={formData.course}
                  onChange={e => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. BSc Computer Science"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    id="modal-student-email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="alexander@student.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    id="modal-student-phone"
                    type="text"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="+44 7911 000111"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Year of Study
                  </label>
                  <select
                    id="modal-student-year"
                    value={formData.year_of_study}
                    onChange={e => setFormData({ ...formData, year_of_study: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Academic Year
                  </label>
                  <input
                    id="modal-student-acad-year"
                    type="text"
                    value={formData.academic_year}
                    onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    id="modal-student-status"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as Student['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="EXCLUDED">Academic Exclusion</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="GRADUATED">Graduated</option>
                  </select>
                </div>
              </div>

              {/* Action buttons: Prominent Green Save Button as required! */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-student-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Academic Profile Detail View */}
      {selectedProfileStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedProfileStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedProfileStudent.student_id} &bull; {selectedProfileStudent.course}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfileStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Year</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">Year {selectedProfileStudent.year_of_study}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Cohort</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedProfileStudent.academic_year}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Status</div>
                  <div className="mt-1"><StatusBadge status={selectedProfileStudent.status} size="sm" /></div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Registered</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">
                    {new Date(selectedProfileStudent.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Module Registrations & Results for this student */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                  Academic Performance Records
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Module</th>
                        <th className="px-3 py-2 text-center">Credits</th>
                        <th className="px-3 py-2 text-center">Final Mark</th>
                        <th className="px-3 py-2 text-center">Grade</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {db.getRegistrationsByStudent(selectedProfileStudent.student_id).map(reg => {
                        const mod = db.getModuleById(reg.module_id);
                        const res = db.getResultByStudentAndModule(selectedProfileStudent.student_id, reg.module_id);
                        return (
                          <tr key={reg.registration_id}>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {mod ? `${mod.module_code} - ${mod.module_name}` : reg.module_id}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">{mod?.credits || '—'}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-900">
                              {res ? `${res.final_mark}%` : 'In Progress'}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-slate-800">
                              {res ? res.grade : '—'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {res ? <StatusBadge status={res.status} size="sm" /> : <span className="text-slate-400">Pending</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                {onViewTranscript && (
                  <button
                    onClick={() => {
                      const id = selectedProfileStudent.student_id;
                      setSelectedProfileStudent(null);
                      onViewTranscript(id);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    Open Full Transcript
                  </button>
                )}
                <button
                  onClick={() => setSelectedProfileStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
