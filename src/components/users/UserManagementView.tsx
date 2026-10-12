import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  BookOpen,
  GraduationCap,
  Lock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { db } from '../../data/db';
import { User, AuthSession, UserRole } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface UserManagementViewProps {
  session: AuthSession;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ session }) => {
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'STUDENT' as UserRole,
    password: '',
    reference_id: '',
  });

  const refreshList = () => {
    setUsers(db.getUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.username.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      db.addUser(
        {
          username: formData.username.trim(),
          email: formData.email.trim() || `${formData.username.toLowerCase()}@university.edu`,
          role: formData.role,
          password_hash: formData.password, // Stored securely
          status: 'ACTIVE',
          reference_id: formData.reference_id.trim() || undefined,
        },
        operator
      );

      setSuccessMessage(`User account "${formData.username}" with role [${formData.role}] created successfully.`);
      setIsAddModalOpen(false);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user account.');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.reference_id && u.reference_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            User Accounts & Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based authentication identities (Administrator, Lecturer, Student).
          </p>
        </div>

        <button
          id="add-user-btn"
          onClick={() => {
            setFormData({
              username: '',
              email: '',
              role: 'STUDENT',
              password: 'User@123',
              reference_id: '',
            });
            setErrorMessage(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="user-search-input"
            type="text"
            placeholder="Search by username, email, or reference ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          id="user-role-filter"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMINISTRATOR">Administrator</option>
          <option value="LECTURER">Lecturer</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Email Address</th>
                <th className="px-4 py-3 text-left">Assigned Role</th>
                <th className="px-4 py-3 text-left">Profile Reference ID</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.map(user => (
                <tr key={user.user_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">
                    {user.username}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={user.role} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                    {user.reference_id || '— (Direct Admin)'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge status={user.status} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-slate-400 font-mono">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Provision User Account
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. emily.turner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="emily.turner@university.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assigned Security Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="STUDENT">STUDENT (Access own transcripts only)</option>
                  <option value="LECTURER">LECTURER (Enter assessment marks for assigned modules)</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR (Full system control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference ID (Student ID or Lecturer ID)
                </label>
                <input
                  type="text"
                  value={formData.reference_id}
                  onChange={e => setFormData({ ...formData, reference_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. STU-2024-001 or LEC-101"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
