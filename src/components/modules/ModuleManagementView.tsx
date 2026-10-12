import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { db } from '../../data/db';
import { Module, AuthSession, Lecturer } from '../../types';

interface ModuleManagementViewProps {
  session: AuthSession;
  onNavigateToMarks?: (moduleId: string) => void;
}

export const ModuleManagementView: React.FC<ModuleManagementViewProps> = ({
  session,
  onNavigateToMarks,
}) => {
  const [modules, setModules] = useState<Module[]>(() => db.getModules());
  const [lecturers] = useState<Lecturer[]>(() => db.getLecturers());
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    module_code: '',
    module_name: '',
    description: '',
    credits: 15,
    semester: 'Semester 1' as Module['semester'],
    academic_year: '2024/2025',
    lecturer_id: lecturers[0]?.lecturer_id || 'LEC-101',
  });

  const isAdmin = session.user.role === 'ADMINISTRATOR';
  const isLecturer = session.user.role === 'LECTURER';
  const isStudent = session.user.role === 'STUDENT';

  const refreshList = () => {
    setModules(db.getModules());
  };

  const handleOpenAddModal = () => {
    setFormData({
      module_code: '',
      module_name: '',
      description: '',
      credits: 15,
      semester: 'Semester 1',
      academic_year: '2024/2025',
      lecturer_id: lecturers[0]?.lecturer_id || 'LEC-101',
    });
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (mod: Module) => {
    setEditingModule(mod);
    setFormData({
      module_code: mod.module_code,
      module_name: mod.module_name,
      description: mod.description,
      credits: mod.credits,
      semester: mod.semester,
      academic_year: mod.academic_year,
      lecturer_id: mod.lecturer_id || lecturers[0]?.lecturer_id || '',
    });
    setErrorMessage(null);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.module_code.trim()) {
      setErrorMessage('Module code is required (e.g. CS103).');
      return;
    }
    if (!formData.module_name.trim()) {
      setErrorMessage('Module name is required.');
      return;
    }

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      if (editingModule) {
        db.updateModule(
          editingModule.module_id,
          {
            module_name: formData.module_name.trim(),
            description: formData.description.trim(),
            credits: Number(formData.credits),
            semester: formData.semester,
            academic_year: formData.academic_year,
            lecturer_id: formData.lecturer_id,
          },
          operator
        );
        setSuccessMessage(`Module "${formData.module_code}" successfully updated.`);
        setEditingModule(null);
      } else {
        db.addModule(
          {
            module_code: formData.module_code.trim().toUpperCase(),
            module_name: formData.module_name.trim(),
            description: formData.description.trim(),
            credits: Number(formData.credits),
            semester: formData.semester,
            academic_year: formData.academic_year,
            lecturer_id: formData.lecturer_id,
          },
          operator
        );
        setSuccessMessage(`Module "${formData.module_code}" successfully added.`);
        setIsAddModalOpen(false);
      }

      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the module.');
    }
  };

  const handleDeleteModule = (moduleId: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete module "${code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };
      db.deleteModule(moduleId, operator);
      setSuccessMessage(`Module "${code}" was deleted.`);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Scope filter:
  // If student: only show modules registered for
  // If lecturer: show all or highlight assigned
  let displayedModules = modules;
  if (isStudent && session.student_profile) {
    const studentRegs = db.getRegistrationsByStudent(session.student_profile.student_id);
    const registeredIds = new Set(studentRegs.map(r => r.module_id));
    displayedModules = modules.filter(m => registeredIds.has(m.module_id));
  } else if (isLecturer && session.lecturer_profile) {
    // Lecturers can see their assigned modules first
    const lecturerId = session.lecturer_profile.lecturer_id;
    displayedModules = modules.filter(m => m.lecturer_id === lecturerId);
  }

  const filteredModules = displayedModules.filter(m => {
    const matchesSearch =
      m.module_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.module_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSemester = semesterFilter === 'ALL' || m.semester === semesterFilter;

    return matchesSearch && matchesSemester;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isStudent ? 'My Registered Modules' : isLecturer ? 'My Assigned Modules' : 'Curriculum Module Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Course syllabus, credit allocations, and designated academic staff.
          </p>
        </div>

        {isAdmin && (
          <button
            id="add-module-btn"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Module
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="module-search-input"
            type="text"
            placeholder="Search by Code (e.g. CS101), Module Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          id="module-semester-filter"
          value={semesterFilter}
          onChange={e => setSemesterFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Semesters</option>
          <option value="Semester 1">Semester 1</option>
          <option value="Semester 2">Semester 2</option>
          <option value="Summer">Summer</option>
        </select>
      </div>

      {/* Modules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Module Title & Syllabus</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-center">Semester</th>
                <th className="px-4 py-3 text-left">Assigned Lecturer</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredModules.length > 0 ? (
                filteredModules.map(mod => {
                  const lecturer = lecturers.find(l => l.lecturer_id === mod.lecturer_id);
                  const enrolledCount = db.getRegistrationsByModule(mod.module_id).length;

                  return (
                    <tr key={mod.module_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {mod.module_code}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900">{mod.module_name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {mod.description}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {mod.credits}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {mod.semester}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">
                        <div className="font-medium">{lecturer ? lecturer.lecturer_name : 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400">{lecturer?.department}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {isLecturer && onNavigateToMarks && (
                          <button
                            onClick={() => onNavigateToMarks(mod.module_id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Capture Marks
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              id={`edit-module-btn-${mod.module_code}`}
                              onClick={() => handleOpenEditModal(mod)}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Edit Module"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-module-btn-${mod.module_code}`}
                              onClick={() => handleDeleteModule(mod.module_id, mod.module_code)}
                              className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Module (Safe check)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No modules found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Module Modal */}
      {(isAddModalOpen || editingModule) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingModule ? `Edit Module (${editingModule.module_code})` : 'Create Academic Module'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingModule(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Module Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="modal-module-code"
                    type="text"
                    required
                    disabled={!!editingModule}
                    value={formData.module_code}
                    onChange={e => setFormData({ ...formData, module_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    placeholder="e.g. CS103"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Credits (CAT)
                  </label>
                  <input
                    id="modal-module-credits"
                    type="number"
                    min={5}
                    max={60}
                    required
                    value={formData.credits}
                    onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Module Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-module-name"
                  type="text"
                  required
                  value={formData.module_name}
                  onChange={e => setFormData({ ...formData, module_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Systems Programming & Architecture"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  id="modal-module-description"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="Course learning outcomes and syllabus scope..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Semester
                  </label>
                  <select
                    id="modal-module-semester"
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value as Module['semester'] })}
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
                    id="modal-module-year"
                    type="text"
                    value={formData.academic_year}
                    onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Designated Lecturer <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-module-lecturer"
                  value={formData.lecturer_id}
                  onChange={e => setFormData({ ...formData, lecturer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {lecturers.map(l => (
                    <option key={l.lecturer_id} value={l.lecturer_id}>
                      {l.lecturer_name} ({l.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action buttons with prominent green save button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingModule(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-module-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingModule ? 'Save Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
