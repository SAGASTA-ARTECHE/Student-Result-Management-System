import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Save,
  Info,
  Scale,
  Award,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../data/db';
import { CalculationService } from '../../services/calculationService';
import { AcademicRuleConfig, AuthSession } from '../../types';

interface AcademicRulesViewProps {
  session: AuthSession;
  onRulesUpdated?: () => void;
}

export const AcademicRulesView: React.FC<AcademicRulesViewProps> = ({
  session,
  onRulesUpdated,
}) => {
  const [rules, setRules] = useState<AcademicRuleConfig>(() => db.getAcademicRuleConfig());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      // Validate logical order: distinction > pass > failThreshold > exclusion
      if (rules.distinction_threshold <= rules.pass_threshold) {
        throw new Error('Distinction threshold must be strictly higher than Pass threshold.');
      }
      if (rules.pass_threshold <= rules.fail_threshold) {
        throw new Error('Pass threshold must be strictly higher than Fail threshold.');
      }
      if (rules.fail_threshold <= rules.exclusion_threshold) {
        throw new Error('Fail threshold must be strictly higher than Exclusion threshold.');
      }

      const operator = {
        user_id: session.user.user_id,
        username: session.user.username,
        user_role: session.user.role,
      };

      db.saveAcademicRuleConfig(rules, operator);

      // Recalculate results to reflect updated thresholds
      const recalculated = CalculationService.recalculateAllResults(operator);

      setSuccessMessage(
        `Configurable academic rules saved and applied. Recalculated ${recalculated.length} student results.`
      );
      if (onRulesUpdated) onRulesUpdated();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update academic rules.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaultRules: AcademicRuleConfig = {
      rule_id: 'RULE_DEFAULT_2024',
      distinction_threshold: 75,
      pass_threshold: 50,
      fail_threshold: 40,
      exclusion_threshold: 30,
      max_failed_modules_for_exclusion: 2,
      coursework_default_weight: 30,
      midterm_default_weight: 20,
      final_exam_default_weight: 50,
      updated_at: new Date().toISOString(),
      updated_by: session.user.username,
    };
    setRules(defaultRules);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Configurable Academic Rules & Grading Scale
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define institutional cutoffs, pass marks, distinction thresholds, and academic exclusion boundaries.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Institutional Defaults
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">System Configuration Notice:</span>
          <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
            As mandated by the design specifications, grading and academic standings are defined as configurable system rules rather than immutable constants. Updating these values dynamically re-evaluates all student results.
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

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            Grading Scale & Status Boundaries (%)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Marks falling between these percentage boundaries will be classified into corresponding academic standings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">
                Distinction Threshold (%)
              </label>
              <input
                id="rule-distinction"
                type="number"
                min={50}
                max={100}
                required
                value={rules.distinction_threshold}
                onChange={e => setRules({ ...rules, distinction_threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm font-bold text-emerald-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="block text-[11px] text-emerald-700 mt-1">Grade: A+, A (Honours list)</span>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                Pass Threshold (%)
              </label>
              <input
                id="rule-pass"
                type="number"
                min={40}
                max={80}
                required
                value={rules.pass_threshold}
                onChange={e => setRules({ ...rules, pass_threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm font-bold text-blue-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="block text-[11px] text-blue-700 mt-1">Grade: B, C (Credits awarded)</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                Fail Threshold (%)
              </label>
              <input
                id="rule-fail"
                type="number"
                min={20}
                max={60}
                required
                value={rules.fail_threshold}
                onChange={e => setRules({ ...rules, fail_threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-bold text-amber-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-amber-700 mt-1">Grade: D, F (Retake required)</span>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
              <label className="block text-xs font-bold text-rose-900 uppercase mb-1">
                Exclusion Threshold (%)
              </label>
              <input
                id="rule-exclusion"
                type="number"
                min={10}
                max={50}
                required
                value={rules.exclusion_threshold}
                onChange={e => setRules({ ...rules, exclusion_threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm font-bold text-rose-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <span className="block text-[11px] text-rose-700 mt-1">Standing: Academic Exclusion</span>
            </div>
          </div>
        </div>

        {/* Academic Exclusion Standing Rules */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Institutional Standing Orders: Exclusion Criteria
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Specify how many failed modules automatically trigger student academic exclusion under faculty standing orders.
          </p>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Max Failed Modules Permitted
            </label>
            <input
              id="rule-max-fails"
              type="number"
              min={1}
              max={10}
              required
              value={rules.max_failed_modules_for_exclusion}
              onChange={e => setRules({ ...rules, max_failed_modules_for_exclusion: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <span className="block text-[11px] text-slate-400 mt-1">
              Students failing &ge; {rules.max_failed_modules_for_exclusion} modules will receive Exclusion standing.
            </span>
          </div>
        </div>

        {/* Assessment Weight Distribution Defaults */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Default Assessment Component Weights (%)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Component distribution for continuous coursework, midterm examinations, and final exams (must sum to 100%).
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Coursework Weight (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.coursework_default_weight}
                onChange={e => setRules({ ...rules, coursework_default_weight: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Midterm Exam (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.midterm_default_weight}
                onChange={e => setRules({ ...rules, midterm_default_weight: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Final Exam (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.final_exam_default_weight}
                onChange={e => setRules({ ...rules, final_exam_default_weight: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Prominent Save Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            id="save-academic-rules-btn"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Recalculating & Saving...' : 'SAVE & APPLY ACADEMIC RULES'}
          </button>
        </div>
      </form>
    </div>
  );
};
