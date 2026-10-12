import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Code,
  Copy,
  FileText
} from 'lucide-react';
import { db } from '../../data/db';
import { AuthSession } from '../../types';

interface BackupRecoveryViewProps {
  session: AuthSession;
}

export const BackupRecoveryView: React.FC<BackupRecoveryViewProps> = ({ session }) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);

  const handleCreateJSONBackup = () => {
    try {
      const dataStr = db.exportDatabaseJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `srms_database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };
      db.createSnapshot(operator);
      setSuccessMessage('Full JSON database backup downloaded and local snapshot recorded.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export backup.');
    }
  };

  const handleRestoreFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const operator = {
          user_id: session.user.user_id,
          username: session.user.username,
          user_role: session.user.role,
        };
        db.importDatabaseJSON(content, operator);
        setSuccessMessage('Database restored successfully from file. Reloading data...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setErrorMessage(err.message || 'Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToFactorySeed = () => {
    if (
      !window.confirm(
        'Are you sure you want to reset the entire database to original factory seed records? All unsaved test data will be replaced.'
      )
    ) {
      return;
    }

    try {
      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };
      db.resetToFactorySeed(operator);
      setSuccessMessage('Database restored to factory seed data.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Generate real MySQL SQL DDL script for relational institution deployment
  const mysqlSchemaScript = `-- ====================================================================
-- STUDENT RESULTS MANAGEMENT SYSTEM FOR HIGHER EDUCATION INSTITUTIONS
-- RELATIONAL DATABASE DEFINITION (MySQL 8.0+ / MariaDB)
-- ARCHITECTURAL SPECIFICATION: NORMALIZED THREE-TIER RELATIONAL SCHEMA
-- ====================================================================

CREATE DATABASE IF NOT EXISTS srms_institution_db
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE srms_institution_db;

-- 1. USERS & ROLES TABLE (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMINISTRATOR', 'LECTURER', 'STUDENT') NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  reference_id VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_role (role),
  INDEX idx_user_ref (reference_id)
) ENGINE=InnoDB;

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  course VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(30) NULL,
  year_of_study INT NOT NULL CHECK (year_of_study BETWEEN 1 AND 6),
  academic_year VARCHAR(20) NOT NULL,
  status ENUM('ACTIVE', 'EXCLUDED', 'SUSPENDED', 'GRADUATED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_student_status (status),
  INDEX idx_student_course (course)
) ENGINE=InnoDB;

-- 3. LECTURERS TABLE
CREATE TABLE IF NOT EXISTS lecturers (
  lecturer_id VARCHAR(20) PRIMARY KEY,
  lecturer_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  office_number VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. MODULES TABLE
CREATE TABLE IF NOT EXISTS modules (
  module_id VARCHAR(36) PRIMARY KEY,
  module_code VARCHAR(20) NOT NULL UNIQUE,
  module_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  credits INT NOT NULL DEFAULT 15 CHECK (credits > 0),
  semester ENUM('Semester 1', 'Semester 2', 'Summer') NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  lecturer_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_module_lecturer FOREIGN KEY (lecturer_id) 
    REFERENCES lecturers(lecturer_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_module_code (module_code)
) ENGINE=InnoDB;

-- 5. STUDENT MODULE REGISTRATIONS (JUNCTION TABLE - MANY TO MANY)
CREATE TABLE IF NOT EXISTS student_modules (
  registration_id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  module_id VARCHAR(36) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(30) NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reg_student FOREIGN KEY (student_id) 
    REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reg_module FOREIGN KEY (module_id) 
    REFERENCES modules(module_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT uq_student_module_term UNIQUE (student_id, module_id, academic_year),
  INDEX idx_reg_student (student_id),
  INDEX idx_reg_module (module_id)
) ENGINE=InnoDB;

-- 6. MARKS TABLE (Continuous Assessment Component Scores)
CREATE TABLE IF NOT EXISTS marks (
  mark_id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  module_id VARCHAR(36) NOT NULL,
  assessment_name VARCHAR(100) NOT NULL,
  mark DECIMAL(5,2) NOT NULL CHECK (mark >= 0 AND mark <= 100),
  assessment_weight DECIMAL(5,2) NOT NULL DEFAULT 100,
  date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by VARCHAR(50) NOT NULL,
  CONSTRAINT fk_mark_student FOREIGN KEY (student_id) 
    REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_mark_module FOREIGN KEY (module_id) 
    REFERENCES modules(module_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT uq_student_module_assessment UNIQUE (student_id, module_id, assessment_name),
  INDEX idx_mark_lookup (student_id, module_id)
) ENGINE=InnoDB;

-- 7. RESULTS TABLE (Automated Final Grades & Standings)
CREATE TABLE IF NOT EXISTS results (
  result_id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  module_id VARCHAR(36) NOT NULL,
  final_mark DECIMAL(5,2) NOT NULL CHECK (final_mark >= 0 AND final_mark <= 100),
  grade VARCHAR(5) NOT NULL,
  status ENUM('DISTINCTION', 'PASS', 'FAIL', 'EXCLUSION') NOT NULL,
  calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by VARCHAR(50) NOT NULL,
  CONSTRAINT fk_result_student FOREIGN KEY (student_id) 
    REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_result_module FOREIGN KEY (module_id) 
    REFERENCES modules(module_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT uq_result_student_module UNIQUE (student_id, module_id),
  INDEX idx_result_status (status)
) ENGINE=InnoDB;

-- 8. AUDIT LOGS TABLE (Institutional Security & Accountability)
CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  username VARCHAR(50) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'CALCULATE', 'LOGIN', 'BACKUP') NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_operator (username)
) ENGINE=InnoDB;

-- 9. CONFIGURABLE ACADEMIC RULES TABLE
CREATE TABLE IF NOT EXISTS academic_rules (
  rule_id VARCHAR(36) PRIMARY KEY,
  distinction_threshold DECIMAL(5,2) NOT NULL DEFAULT 75.00,
  pass_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  fail_threshold DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  exclusion_threshold DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  max_failed_modules_for_exclusion INT NOT NULL DEFAULT 2,
  coursework_default_weight DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  midterm_default_weight DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  final_exam_default_weight DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(50) NOT NULL
) ENGINE=InnoDB;
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(mysqlSchemaScript);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Database Backup, Disaster Recovery & SQL Deployment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise database snapshot management, JSON export/restore, and relational MySQL DDL schema generation.
          </p>
        </div>
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

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Export System Snapshot</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Creates an encrypted, comprehensive JSON archive containing all students, modules, registrations, marks, results, and audit trails.
            </p>
          </div>

          <button
            id="download-backup-btn"
            onClick={handleCreateJSONBackup}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download JSON Backup
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Restore From Backup</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload a previously exported database archive. Validates relational schema constraints and replaces the current database state safely.
            </p>
          </div>

          <label className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
            <Upload className="w-4 h-4" />
            Select JSON File to Restore
            <input
              id="restore-file-input"
              type="file"
              accept=".json"
              onChange={handleRestoreFromJSON}
              className="hidden"
            />
          </label>
        </div>

        {/* Factory Reset Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Factory Seed Reset</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Replaces the current database with the initial clean demonstration dataset, containing accredited modules, sample students, and initial marks.
            </p>
          </div>

          <button
            id="factory-reset-btn"
            onClick={handleResetToFactorySeed}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Factory Data
          </button>
        </div>
      </div>

      {/* MySQL Relational Database DDL Schema Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">
                MySQL Relational Database DDL & Schema Script
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Production MySQL 8.0+ SQL scripts implementing third normal form (3NF) relational constraints, foreign keys, and audit indexes.
            </p>
          </div>

          <button
            id="copy-sql-btn"
            onClick={handleCopySQL}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            {copiedSQL ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy MySQL DDL Script
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
          {mysqlSchemaScript}
        </pre>
      </div>
    </div>
  );
};
