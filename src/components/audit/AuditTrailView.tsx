import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  User,
  Activity,
  Layers
} from 'lucide-react';
import { db } from '../../data/db';
import { AuditLog } from '../../types';

export const AuditTrailView: React.FC = () => {
  const [logs] = useState<AuditLog[]>(() => db.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'ALL' || log.entity_type === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Security & Audit Trail Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all grade entries, record modifications, student registrations, and administrative operations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="audit-search-input"
            type="text"
            placeholder="Search by Username, Description, or Entity ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="CALCULATE">CALCULATE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="BACKUP">BACKUP</option>
          </select>

          <select
            id="audit-entity-filter"
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Entities</option>
            <option value="STUDENT">STUDENT</option>
            <option value="MARK">MARK</option>
            <option value="RESULT">RESULT</option>
            <option value="MODULE">MODULE</option>
            <option value="REGISTRATION">REGISTRATION</option>
            <option value="ACADEMIC_RULES">ACADEMIC_RULES</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Operator</th>
                <th className="px-4 py-3 text-center">Action</th>
                <th className="px-4 py-3 text-left">Target Entity</th>
                <th className="px-4 py-3 text-left">Event Description</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.audit_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">{log.username}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{log.user_role}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : log.action === 'DELETE'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : log.action === 'CALCULATE'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800">{log.entity_type}</span>
                      <span className="text-slate-400 block text-[10px] font-mono">{log.entity_id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 max-w-md">
                      {log.description}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        id={`audit-view-diff-btn-${log.audit_id}`}
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        title="View Change Diff Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No audit records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Audit Record [{selectedLog.audit_id}]
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Action Performed</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLog.action} on {selectedLog.entity_type}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Operator / Role</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLog.username} ({selectedLog.user_role})</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Timestamp</span>
                  <div className="font-mono text-slate-700 mt-0.5">{new Date(selectedLog.timestamp).toISOString()}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Target Entity ID</span>
                  <div className="font-mono text-slate-700 mt-0.5">{selectedLog.entity_id}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">Description</span>
                <p className="text-xs text-slate-800 mt-0.5">{selectedLog.description}</p>
              </div>

              {/* Data payload diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Previous Value (Before Operation)
                  </h4>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                    {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : 'null (New Record Creation)'}
                  </pre>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                    New Value (After Operation)
                  </h4>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                    {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : 'null (Deleted)'}
                  </pre>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
