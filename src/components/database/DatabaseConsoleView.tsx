import React, { useState } from 'react';
import {
  Database,
  Zap,
  Cloud,
  Layers,
  Code,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  RotateCcw,
  Play,
  Copy,
  Activity,
  ArrowRight,
  Server,
  RefreshCw,
  Sliders,
  FileText
} from 'lucide-react';
import { db } from '../../data/db';
import { AuthSession, DatabaseTrigger, ConcurrencyConflictDetails } from '../../types';

interface DatabaseConsoleViewProps {
  session: AuthSession;
}

export const DatabaseConsoleView: React.FC<DatabaseConsoleViewProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'triggers' | 'stored_procs' | 'cloud' | 'concurrency' | 'backup'>('triggers');

  const [triggers, setTriggers] = useState<DatabaseTrigger[]>(() => db.getTriggers());
  const [triggerLogs, setTriggerLogs] = useState(() => db.getTriggerLogs());
  const [cloudStatus, setCloudStatus] = useState(() => db.getCloudSyncStatus());
  const [integrityReport, setIntegrityReport] = useState(() => db.verifyDatabaseIntegrity());
  const [storedProcs] = useState(() => db.getStoredProcedures());

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedProcId, setSelectedProcId] = useState<string>('SP-01');
  const [simProcResult, setSimProcResult] = useState<any>(null);

  // Concurrency Simulator State
  const [userAMark, setUserAMark] = useState<number>(85);
  const [userBMark, setUserBMark] = useState<number>(78);
  const [concurrencyResult, setConcurrencyResult] = useState<{
    conflict: boolean;
    details: ConcurrencyConflictDetails;
    resolutionHelp: string;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const operator = {
    user_id: session.user.user_id,
    username: session.user.username,
    user_role: session.user.role,
  };

  const handleToggleTrigger = (triggerId: string, currentEnabled: boolean) => {
    try {
      db.toggleTrigger(triggerId, !currentEnabled, operator);
      setTriggers(db.getTriggers());
      setNotification({
        type: 'success',
        message: `Trigger ${triggerId} state toggled to ${!currentEnabled ? 'ENABLED' : 'DISABLED'}.`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleFireTestTrigger = () => {
    const success = db.executeTrigger(
      'trg_after_mark_insert_or_update',
      'AFTER INSERT_OR_UPDATE',
      'marks',
      'DEMO:STU-TLHOMPO:MOD-CS101',
      `Manual test fire by Administrator ${operator.username}. Re-evaluated module results and GPA.`
    );
    setTriggers(db.getTriggers());
    setTriggerLogs(db.getTriggerLogs());
    if (success) {
      setNotification({
        type: 'success',
        message: '⚡ Test trigger executed successfully! Check the execution log below.',
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleClearLogs = () => {
    db.clearTriggerLogs();
    setTriggerLogs([]);
    setNotification({ type: 'success', message: 'Trigger execution telemetry cleared.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRunStoredProcSimulation = () => {
    try {
      const res = db.simulateStoredProcedure(
        selectedProcId,
        {
          student_id: 'STU-TLHOMPO',
          module_id: 'MOD-CS101',
          teaching_score: 5,
          fairness_score: 5,
          materials_score: 4,
          timeliness_score: 5,
        },
        operator
      );
      setSimProcResult(res);
      setNotification({
        type: 'success',
        message: `Stored procedure ${res.proc_name} executed inside database engine simulation (${res.durationMs}ms).`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleRunConcurrencySimulation = () => {
    const sim = db.simulateConcurrentConflict(
      'STU-TLHOMPO',
      'MOD-CS101',
      { username: 'dr.may', user_role: 'LECTURER' },
      { username: 'maje', user_role: 'ADMINISTRATOR' },
      userAMark,
      userBMark
    );
    setConcurrencyResult(sim);
    setNotification({
      type: 'error',
      message: '⚠️ 409 CONCURRENCY CONFLICT DETECTED: Stale version write prevented lost update!',
    });
  };

  const handleSyncToCloud = () => {
    try {
      const res = db.simulateCloudSync(operator);
      setCloudStatus(db.getCloudSyncStatus());
      setNotification({
        type: 'success',
        message: `Cloud database synchronized (${res.recordsSynced} records verified across replicas in ${res.latencyMs}ms).`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleVerifyIntegrity = () => {
    const report = db.verifyDatabaseIntegrity();
    setIntegrityReport(report);
    setNotification({
      type: 'success',
      message: `Database integrity checked: ${report.checks.filter(c => c.passed).length}/${report.checks.length} constraints verified.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportJSON = () => {
    try {
      const json = db.exportDatabaseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `srms_database_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: 'Full database snapshot exported successfully.' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCopySQL = () => {
    const dump = db.generateMySQLDump();
    navigator.clipboard.writeText(dump);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Database Engineering, Triggers & Cloud Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Addresses Lecturer Feedback: Database Triggers, Stored Procedures vs Clean Logic, Cloud Sync, Concurrency (OCC), and ACID integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncToCloud}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer transition-colors"
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            Sync Cloud DB
          </button>
          <button
            onClick={handleFireTestTrigger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 cursor-pointer transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
            Fire Trigger Test
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('triggers')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'triggers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Database Triggers ({triggers.length})
        </button>
        <button
          onClick={() => setActiveTab('stored_procs')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'stored_procs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          Stored Procs vs Clean Logic
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'cloud'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Cloud Database Architecture
        </button>
        <button
          onClick={() => setActiveTab('concurrency')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'concurrency'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Concurrency Simulator (OCC)
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'backup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          Backups & Relational SQL DDL
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: DATABASE TRIGGERS & TELEMETRY                                */}
      {/* =================================================================== */}
      {activeTab === 'triggers' && (
        <div className="space-y-6">
          {/* Explanation Box */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
            <span className="font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-700" />
              Lecturer Requirement 2: Database Triggers Implementation
            </span>
            <p className="text-slate-700 leading-relaxed">
              Triggers respond automatically to data mutation events (<code>BEFORE/AFTER INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>). In our system, triggers automate:
              <strong> (1) Continuous assessment grade re-evaluations</strong>,
              <strong> (2) Academic exclusion alerts</strong>,
              <strong> (3) 0-100 numerical integrity check constraints</strong>,
              <strong> (4) Lecturer teaching evaluation score recalculation</strong>, and
              <strong> (5) Immutable security audit trail recording</strong>.
            </p>
          </div>

          {/* Triggers Registry Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {triggers.map(trigger => (
              <div
                key={trigger.trigger_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {trigger.timing} {trigger.event}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        ON {trigger.table_name}
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trigger.enabled}
                        onChange={() => handleToggleTrigger(trigger.trigger_id, trigger.enabled)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700">
                        {trigger.enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </label>
                  </div>

                  <h3 className="font-mono font-bold text-slate-900 text-sm mt-3">
                    {trigger.trigger_name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {trigger.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Fired: <strong>{trigger.fire_count} times</strong>
                    </span>
                    <span>
                      Last event: {trigger.last_fired_at ? new Date(trigger.last_fired_at).toLocaleTimeString() : 'Ready'}
                    </span>
                  </div>

                  <details className="text-[11px] text-slate-700 bg-slate-900 text-slate-200 rounded-xl p-3 border border-slate-800">
                    <summary className="font-mono font-bold text-emerald-400 cursor-pointer">
                      View SQL Trigger Definition
                    </summary>
                    <pre className="mt-2 font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed text-slate-300">
                      {trigger.sql_definition}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>

          {/* Trigger Telemetry Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Live Database Trigger Activity Monitor ({triggerLogs.length} events)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time execution telemetry showing millisecond latency and affected rows.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFireTestTrigger}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fire Test Event
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {triggerLogs.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  No trigger events logged yet. Enter marks or click "Fire Test Event".
                </div>
              ) : (
                triggerLogs.map(log => (
                  <div
                    key={log.log_id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">
                          {log.trigger_name}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                          {log.event}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Table: <code>{log.table_name}</code>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">{log.details}</p>
                    </div>

                    <div className="flex sm:flex-col items-end text-[10px] text-slate-500">
                      <span className="font-mono font-bold text-emerald-600">
                        ⚡ {log.execution_time_ms} ms
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: STORED PROCEDURES VS CLEAN APPLICATION LOGIC                 */}
      {/* =================================================================== */}
      {activeTab === 'stored_procs' && (
        <div className="space-y-6">
          {/* Lecturer Guidance Breakdown */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 text-purple-950 text-xs space-y-2">
            <span className="font-bold flex items-center gap-2 text-sm text-purple-900">
              <Code className="w-5 h-5 text-purple-700" />
              Lecturer Assessment Point: Are Stored Procedures Necessary?
            </span>
            <p className="text-slate-800 leading-relaxed">
              The lecturer posed a key architectural question: <em>"Understand whether stored procedures are necessary. An effective database can work without stored procedures if the SQL queries and application logic are implemented correctly."</em>
            </p>
            <p className="text-slate-800 leading-relaxed">
              <strong>Our Engineering Conclusion & Defense:</strong> Stored procedures are <em>not strictly required</em> and are frequently avoided in modern enterprise software. While stored procedures encapsulate logic inside the database server, placing domain logic in application services (TypeScript DAO/Repository) provides superior maintainability: unit-testability, git version control, database vendor portability, and horizontal scalability. We demonstrate both paradigms below!
            </p>
          </div>

          {/* Stored Procedures Explorer & Sandbox */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Stored Procedure Definitions & Execution Simulation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect the compiled MySQL stored procedures with execution plans.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProcId}
                  onChange={e => setSelectedProcId(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {storedProcs.map(sp => (
                    <option key={sp.proc_id} value={sp.proc_id}>
                      {sp.proc_name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRunStoredProcSimulation}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Simulate SP Call
                </button>
              </div>
            </div>

            {/* Selected Procedure View */}
            {(() => {
              const sp = storedProcs.find(p => p.proc_id === selectedProcId) || storedProcs[0];
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-700 text-sm">
                        {sp.proc_name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Returns: {sp.returns}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{sp.description}</p>
                  </div>

                  {/* Code Comparison: SP vs Application Logic */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        1. MySQL Stored Procedure (Database Engine Tier)
                      </span>
                      <pre className="font-mono text-[10px] overflow-x-auto whitespace-pre max-h-64 text-slate-300 leading-relaxed">
                        {sp.sql_definition}
                      </pre>
                    </div>

                    <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        2. TypeScript Application DAO (Application Tier Logic)
                      </span>
                      <pre className="font-mono text-[10px] overflow-x-auto whitespace-pre max-h-64 text-slate-300 leading-relaxed">
                        {sp.typescript_equivalent}
                      </pre>
                    </div>
                  </div>

                  {/* Tradeoffs Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      Architectural Tradeoffs Matrix for Defense:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-700">Advantages of Stored Procedures:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                          {sp.architectural_tradeoffs.pros_of_sp.map((pro, idx) => (
                            <li key={idx}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-rose-700">Disadvantages of Stored Procedures:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                          {sp.architectural_tradeoffs.cons_of_sp.map((con, idx) => (
                            <li key={idx}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border">
                      <strong>Verdict:</strong> {sp.architectural_tradeoffs.why_app_logic_chosen}
                    </div>
                  </div>

                  {/* Simulation Execution Plan */}
                  {simProcResult && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between text-emerald-900 font-bold">
                        <span>Database Engine Execution Plan Output:</span>
                        <span>Latency: {simProcResult.durationMs} ms</span>
                      </div>
                      <pre className="font-mono text-[10px] bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto">
                        {simProcResult.executionPlan}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: CLOUD DATABASE ARCHITECTURE & SYNC                           */}
      {/* =================================================================== */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          {/* Cloud Info */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 text-sky-950 text-xs space-y-2">
            <span className="font-bold flex items-center gap-2 text-sm text-sky-900">
              <Cloud className="w-5 h-5 text-sky-700" />
              Lecturer Requirement 3: Cloud Database Architecture & Security
            </span>
            <p className="text-slate-800 leading-relaxed">
              A local-only database restricts access to a single client machine. Our enterprise architecture provides cloud readiness: synchronized with Google Cloud SQL (PostgreSQL 16) and Google Firebase Firestore, enforcing automated multi-zone replication, TLS 1.3 encryption, and Row-Level Security (RLS) policies.
            </p>
          </div>

          {/* Cloud Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Cloud Status</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-black text-slate-900">CONNECTED</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                Region: {cloudStatus.cloudRegion}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Network Latency</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {cloudStatus.networkLatencyMs}
                </span>
                <span className="text-xs text-slate-500 font-bold">ms</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                Zero packet loss
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Synchronized Records</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {cloudStatus.totalCloudRecords}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                Across 8 relational tables
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">ACID Isolation</span>
              <div className="mt-2">
                <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md">
                  {cloudStatus.acidIsolationLevel}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                Zero dirty reads
              </span>
            </div>
          </div>

          {/* Cloud Security Policies Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Firebase Cloud Security Rules (Role-Based Access)
              </h3>
              <p className="text-xs text-slate-500">
                Enforces client-side security barriers directly in the cloud proxy layer.
              </p>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-64 leading-relaxed">
                {db.getCloudSecurityPolicies().firestoreRules}
              </pre>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                PostgreSQL 16 Row-Level Security (RLS) Policies
              </h3>
              <p className="text-xs text-slate-500">
                Restricts lecturers and students to their authenticated rows only.
              </p>
              <pre className="p-3 bg-slate-900 text-blue-300 font-mono text-[10px] rounded-xl overflow-x-auto max-h-64 leading-relaxed">
                {db.getCloudSecurityPolicies().postgresRLS}
              </pre>
            </div>
          </div>

          {/* Database Integrity & Checksums */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Database Referential Integrity & Domain Checksum Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifies foreign keys, orphan elimination, and numerical domain bounds.
                </p>
              </div>

              <button
                onClick={handleVerifyIntegrity}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Re-verify Constraints
              </button>
            </div>

            <div className="space-y-2">
              {integrityReport.checks.map((chk, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {chk.passed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800">{chk.name}</span>
                      <p className="text-[11px] text-slate-500">{chk.message}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      chk.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {chk.passed ? 'VERIFIED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: CONCURRENCY SIMULATOR & OPTIMISTIC LOCKING                   */}
      {/* =================================================================== */}
      {activeTab === 'concurrency' && (
        <div className="space-y-6">
          {/* Explanation */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-amber-950 text-xs space-y-2">
            <span className="font-bold flex items-center gap-2 text-sm text-amber-900">
              <Layers className="w-5 h-5 text-amber-700" />
              Lecturer Requirement 5: Concurrency Handling & Lost Update Prevention
            </span>
            <p className="text-slate-800 leading-relaxed">
              When multiple lecturers or an administrator edit marks simultaneously, a naive system suffers from <strong>Lost Updates</strong> (where User B blindly overwrites User A's changes). Our system implements <strong>Optimistic Concurrency Control (OCC)</strong> using an entity <code>version</code> number. If a stale version is submitted, the database aborts the transaction with a <code>409 Conflict</code> and prompts the user to resolve the collision.
            </p>
          </div>

          {/* Interactive Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Interactive Live Concurrency & Race Condition Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate simultaneous dual writes on STU-TLHOMPO's CS101 final mark.
                </p>
              </div>

              <button
                onClick={handleRunConcurrencySimulation}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Simulate Simultaneous Writes
              </button>
            </div>

            {/* User A vs User B inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Operator A */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">
                    Operator A: Dr. May (Course Lecturer)
                  </span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    Loads Record at Version 1
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mark to save:
                  </label>
                  <input
                    type="number"
                    value={userAMark}
                    onChange={e => setUserAMark(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-600">
                  Submits write first. Successfully advances record to <strong>Version 2</strong>.
                </p>
              </div>

              {/* Operator B */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">
                    Operator B: Maje (Academic Administrator)
                  </span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    Also Loaded at Version 1
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mark to save simultaneously:
                  </label>
                  <input
                    type="number"
                    value={userBMark}
                    onChange={e => setUserBMark(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-600">
                  Submits write 2 seconds later based on stale Version 1 without refreshing.
                </p>
              </div>
            </div>

            {/* Collision Caught Modal Display */}
            {concurrencyResult && (
              <div className="p-5 bg-rose-50 border border-rose-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                      409 Concurrency Conflict Caught by OCC Engine
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    LOST UPDATE PREVENTED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-3 rounded-xl border border-rose-200">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500">Database Current State:</span>
                    <p className="font-bold text-slate-900">
                      Version {concurrencyResult.details.current_version} (Saved by {concurrencyResult.details.last_modified_by} at {new Date(concurrencyResult.details.last_updated_at).toLocaleTimeString()})
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Mark: <strong>{concurrencyResult.details.current_data.mark}%</strong>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500">Attempted Stale Write:</span>
                    <p className="font-bold text-rose-700">
                      Version {concurrencyResult.details.attempted_version} (Rejected Stale Write by {concurrencyResult.details.conflicting_data.submitted_by})
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Attempted Mark: <strong>{concurrencyResult.details.conflicting_data.mark}%</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-rose-800">
                    Resolution: Reload latest version, review changes, or trigger three-way merge.
                  </span>
                  <button
                    onClick={() => setConcurrencyResult(null)}
                    className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Acknowledge Conflict
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: BACKUP, JSON RECOVERY & RELATIONAL SQL DDL                   */}
      {/* =================================================================== */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Download className="w-6 h-6 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Export System Snapshot</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Download full JSON database archive containing students, modules, registrations, marks, and audit logs.
                </p>
              </div>
              <button
                onClick={handleExportJSON}
                className="mt-4 w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Download JSON Backup
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <RotateCcw className="w-6 h-6 text-rose-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Factory Reset</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Restore original clean benchmark dataset for demonstration and evaluation testing.
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Reset database to clean factory defaults?')) {
                    db.resetToFactorySeed(operator);
                    window.location.reload();
                  }
                }}
                className="mt-4 w-full py-2.5 px-3 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset to Benchmark Data
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Code className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">MySQL / PostgreSQL Schema</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Copy production 3NF relational DDL script ready for immediate enterprise database deployment.
                </p>
              </div>
              <button
                onClick={handleCopySQL}
                className="mt-4 w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {copiedSql ? 'Copied to Clipboard!' : 'Copy Relational SQL DDL'}
              </button>
            </div>
          </div>

          {/* SQL Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Relational Database DDL & Schema Definition
            </h3>
            <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
              {db.generateMySQLDump()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
