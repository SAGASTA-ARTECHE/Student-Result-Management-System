import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Mail,
  Building,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { db } from '../../data/db';
import { Lecturer, AuthSession } from '../../types';

interface LecturerManagementViewProps {
  session: AuthSession;
}

export const LecturerManagementView: React.FC<LecturerManagementViewProps> = ({ session }) => {
  const [lecturers, setLecturers] = useState<Lecturer[]>(() => db.getLecturers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lecturer_id: `LEC-${100 + lecturers.length + 1}`,
    lecturer_name: '',
    email: '',
    department: 'Computer Science & Engineering',
    office_number: 'Bldg A-301',
  });

  const refreshList = () => {
    setLecturers(db.getLecturers());
  };

  const handleAddLecturer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.lecturer_name.trim()) {
      setErrorMessage('Lecturer name is required.');
      return;
    }

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      db.addLecturer(
        {
          lecturer_id: formData.lecturer_id.trim(),
          lecturer_name: formData.lecturer_name.trim(),
          email: formData.email.trim() || `${formData.lecturer_id.toLowerCase()}@university.edu`,
          department: formData.department.trim(),
          office_number: formData.office_number.trim(),
        },
        operator
      );

      setSuccessMessage(`Faculty member "${formData.lecturer_name}" added successfully.`);
      setIsAddModalOpen(false);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add lecturer.');
    }
  };

  const filteredLecturers = lecturers.filter(l =>
    l.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.lecturer_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Faculty & Academic Staff
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Teaching staff responsible for module delivery and mark assessments.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              lecturer_id: `LEC-${100 + lecturers.length + 1}`,
              lecturer_name: '',
              email: '',
              department: 'Computer Science & Engineering',
              office_number: 'Bldg A-301',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by lecturer name, department, or staff ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Lecturer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Staff ID</th>
                <th className="px-4 py-3 text-left">Lecturer Name</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Office</th>
                <th className="px-4 py-3 text-center">Assigned Modules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLecturers.map(lecturer => {
                const assignedModules = db.getModulesByLecturer(lecturer.lecturer_id);
                return (
                  <tr key={lecturer.lecturer_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-xs">
                      {lecturer.lecturer_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{lecturer.lecturer_name}</div>
                      <div className="text-[11px] text-slate-500">{lecturer.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-800 font-medium">
                      {lecturer.department}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                      {lecturer.office_number || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                        <BookOpen className="w-3.5 h-3.5" />
                        {assignedModules.length} Modules
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Add Faculty Member
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLecturer} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Staff ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lecturer_id}
                  onChange={e => setFormData({ ...formData, lecturer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name (with Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lecturer_name}
                  onChange={e => setFormData({ ...formData, lecturer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  placeholder="e.g. Dr. Catherine Bennett"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="staff@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Office Room
                  </label>
                  <input
                    type="text"
                    value={formData.office_number}
                    onChange={e => setFormData({ ...formData, office_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Lecturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
