import React, { useState } from 'react';
import {
  Star,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Shield,
  TrendingUp,
  Filter,
  UserCheck,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '../../data/db';
import { AuthSession, CourseRating, UserRole } from '../../types';

interface CourseEvaluationsViewProps {
  session: AuthSession;
}

export const CourseEvaluationsView: React.FC<CourseEvaluationsViewProps> = ({ session }) => {
  const role: UserRole = session.user.role;
  const user = session.user;

  // Resolve Student profile
  const currentStudent = session.student_profile ||
    (user.reference_id ? db.getStudentById(user.reference_id) : undefined) ||
    db.getStudents().find(s => s.student_id.toLowerCase() === user.username.toLowerCase() || s.email.toLowerCase() === user.email.toLowerCase());

  // Resolve Lecturer profile
  const currentLecturer = session.lecturer_profile ||
    (user.reference_id ? db.getLecturerById(user.reference_id) : undefined) ||
    db.getLecturers().find(l => l.lecturer_id.toLowerCase() === user.reference_id?.toLowerCase() || l.email.toLowerCase() === user.email.toLowerCase());

  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student Evaluation Form State
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [teachingScore, setTeachingScore] = useState<number>(5);
  const [fairnessScore, setFairnessScore] = useState<number>(5);
  const [materialsScore, setMaterialsScore] = useState<number>(5);
  const [timelinessScore, setTimelinessScore] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Filter for Admin
  const [adminFilterModule, setAdminFilterModule] = useState<string>('ALL');

  const allModules = db.getModules();
  const allLecturers = db.getLecturers();
  const allRatings = db.getCourseRatings();

  // Student: Enrolled modules & unrated modules
  const studentId = currentStudent?.student_id || user.reference_id || 'STU-TLHOMPO';
  const enrolledRegistrations = db.getRegistrationsByStudent(studentId);
  const enrolledModules = enrolledRegistrations
    .map(r => allModules.find(m => m.module_id === r.module_id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const unratedModules = enrolledModules.filter(
    m => !db.hasStudentRatedModule(studentId, m.module_id)
  );
  const studentEvaluations = db.getRatingsByStudent(studentId);

  // Set default module to evaluate if unrated modules exist
  React.useEffect(() => {
    if (unratedModules.length > 0 && (!selectedModuleId || !unratedModules.some(m => m.module_id === selectedModuleId))) {
      setSelectedModuleId(unratedModules[0].module_id);
    }
  }, [unratedModules.length, refreshKey]);

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedModuleId) {
      setErrorMessage('Please select a course to evaluate.');
      return;
    }

    const targetModule = allModules.find(m => m.module_id === selectedModuleId);
    if (!targetModule) {
      setErrorMessage('Selected module not found.');
      return;
    }

    const operator = {
      user_id: user.user_id,
      username: user.username,
      user_role: user.role,
    };

    try {
      const created = db.submitCourseRating(
        {
          student_id: studentId,
          student_name: currentStudent?.name || user.username,
          module_id: targetModule.module_id,
          lecturer_id: targetModule.lecturer_id || 'LEC-MAY',
          teaching_score: teachingScore,
          fairness_score: fairnessScore,
          materials_score: materialsScore,
          timeliness_score: timelinessScore,
          comment: comment.trim() || undefined,
          is_anonymous: isAnonymous,
          academic_year: targetModule.academic_year || '2024/2025',
          semester: targetModule.semester || 'Semester 1',
        },
        operator
      );

      setSuccessMessage(
        `Thank you! Your course evaluation for ${targetModule.module_code} has been recorded (Overall: ${created.overall_score}/5.0). Database trigger trg_after_rating_insert recomputed faculty metrics.`
      );
      setComment('');
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit evaluation.');
    }
  };

  const renderStarSelector = (
    label: string,
    description: string,
    value: number,
    onChange: (val: number) => void
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <span className="text-xs font-bold text-slate-800">{label}</span>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              type="button"
              key={star}
              onClick={() => onChange(star)}
              className={`p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                star <= value ? 'text-amber-500' : 'text-slate-300'
              }`}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          ))}
          <span className="ml-2 text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md min-w-[28px] text-center">
            {value}.0
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Course Quality & Teaching Evaluation System
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional Quality Assurance: Enforces enrollment validation, duplicate prevention, multi-dimension metrics, and automated trigger aggregations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {role === 'STUDENT' ? 'Student Evaluation Portal' : role === 'LECTURER' ? 'Faculty Teaching Scorecard' : 'Institutional QA Board'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. STUDENT VIEW: RATE REGISTERED COURSES                            */}
      {/* =================================================================== */}
      {role === 'STUDENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submit Evaluation Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Submit New Course & Lecturer Evaluation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluations are strictly permitted once per student per registered course to ensure data integrity.
              </p>
            </div>

            {unratedModules.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">All Registered Modules Evaluated!</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  You have completed course quality evaluations for all your registered modules this semester. Your feedback is displayed in your submission history below.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                {/* Course Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Enrolled Course to Evaluate *
                  </label>
                  <select
                    id="eval-module-select"
                    value={selectedModuleId}
                    onChange={e => setSelectedModuleId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {unratedModules.map(m => {
                      const lec = allLecturers.find(l => l.lecturer_id === m.lecturer_id);
                      return (
                        <option key={m.module_id} value={m.module_id}>
                          {m.module_code}: {m.module_name} (Lecturer: {lec?.lecturer_name || 'Faculty'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Rating Dimensions */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-bold text-slate-700">
                    Evaluation Dimensions (1 = Poor, 5 = Excellent):
                  </span>
                  {renderStarSelector(
                    '1. Teaching Clarity & Delivery (Weight 30%)',
                    'Clarity of lectures, responsiveness to student questions, mastery of topic.',
                    teachingScore,
                    setTeachingScore
                  )}
                  {renderStarSelector(
                    '2. Assessment Fairness & Criteria (Weight 30%)',
                    'Fairness of tests, alignment with curriculum, and transparency of mark scoring.',
                    fairnessScore,
                    setFairnessScore
                  )}
                  {renderStarSelector(
                    '3. Course Materials & Practical Labs (Weight 20%)',
                    'Relevance of textbooks, slide decks, coding exercises, and reading material.',
                    materialsScore,
                    setMaterialsScore
                  )}
                  {renderStarSelector(
                    '4. Lecturer Availability & Timely Feedback (Weight 20%)',
                    'Speed of returning continuous assessment marks and office hour support.',
                    timelinessScore,
                    setTimelinessScore
                  )}
                </div>

                {/* Calculated Composite Preview */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900">
                    Calculated Overall Composite Score:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-sm font-black text-amber-700">
                      {(
                        teachingScore * 0.3 +
                        fairnessScore * 0.3 +
                        materialsScore * 0.2 +
                        timelinessScore * 0.2
                      ).toFixed(1)}{' '}
                      / 5.0
                    </span>
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Constructive Feedback & Suggestions (Optional)
                  </label>
                  <textarea
                    id="eval-comment-input"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Describe specific strengths of the course and suggestions for pedagogical improvement..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    {isAnonymous ? (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-blue-600" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        {isAnonymous ? 'Anonymous Submission' : 'Submit as Tlhompo'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {isAnonymous
                          ? 'Your name will be concealed from the lecturer to protect academic freedom.'
                          : 'Your name will be verified on the official department audit record.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="anonymous-toggle"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="submit-eval-btn"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Submit Course Evaluation
                </button>
              </form>
            )}
          </div>

          {/* Student Evaluation History */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                My Submitted Course Evaluations ({studentEvaluations.length})
              </h3>
              <p className="text-xs text-slate-500">
                Verified records recorded in the institutional database.
              </p>

              {studentEvaluations.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  No evaluations submitted yet. Complete the form to rate your registered courses.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentEvaluations.map(rating => {
                    const mod = allModules.find(m => m.module_id === rating.module_id);
                    const lec = allLecturers.find(l => l.lecturer_id === rating.lecturer_id);
                    return (
                      <div
                        key={rating.rating_id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {mod?.module_code}: {mod?.module_name}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Lecturer: {lec?.lecturer_name || 'Faculty'} •{' '}
                              {new Date(rating.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-black">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {rating.overall_score.toFixed(1)}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                          <div>Teach: {rating.teaching_score}★</div>
                          <div>Fair: {rating.fairness_score}★</div>
                          <div>Mat: {rating.materials_score}★</div>
                          <div>Time: {rating.timeliness_score}★</div>
                        </div>

                        {rating.comment && (
                          <p className="text-[11px] text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200">
                            "{rating.comment}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assessment Integrity Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 space-y-1.5">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Anti-Duplicate Policy & Security
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                The rating engine enforces a unique composite key on <code>(student_id, module_id, academic_year)</code>. If a student attempts to submit multiple evaluations, the system blocks the transaction to prevent rating manipulation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. LECTURER VIEW: TEACHING EFFECTIVENESS SCORECARD                  */}
      {/* =================================================================== */}
      {role === 'LECTURER' && (
        <div className="space-y-6">
          {/* Top Lecturer Summary Card */}
          {(() => {
            const lecId = currentLecturer?.lecturer_id || 'LEC-MAY';
            const summary = db.calculateLecturerRatingSummary(lecId);

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Overall Teaching Score</span>
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {summary.average_rating > 0 ? summary.average_rating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 5.0</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                    Based on {summary.total_ratings} student evaluations
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Student Satisfaction Rate</span>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {summary.satisfaction_rate}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                    Percentage of 4★ and 5★ ratings
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Assessment Fairness</span>
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {summary.breakdown.fairness > 0 ? summary.breakdown.fairness.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 5.0</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                    Transparent grading & marks
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Feedback Timeliness</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {summary.breakdown.timeliness > 0 ? summary.breakdown.timeliness.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 5.0</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                    Prompt continuous assessment
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Module Breakdown & Feedback Quotes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Teaching Evaluation by Assigned Module
              </h3>

              <div className="space-y-3">
                {allModules
                  .filter(m => m.lecturer_id === (currentLecturer?.lecturer_id || 'LEC-MAY'))
                  .map(mod => {
                    const modSummary = db.calculateModuleRatingSummary(mod.module_id);
                    return (
                      <div
                        key={mod.module_id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {mod.module_code}: {mod.module_name}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Credits: {mod.credits} • {modSummary.total_ratings} student responses
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-black">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            {modSummary.average_overall > 0 ? modSummary.average_overall.toFixed(1) : 'No Ratings'}
                          </div>
                        </div>

                        {modSummary.total_ratings > 0 && (
                          <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                            <div>Teaching: <strong className="text-slate-900">{modSummary.average_teaching}★</strong></div>
                            <div>Fairness: <strong className="text-slate-900">{modSummary.average_fairness}★</strong></div>
                            <div>Materials: <strong className="text-slate-900">{modSummary.average_materials}★</strong></div>
                            <div>Speed: <strong className="text-slate-900">{modSummary.average_timeliness}★</strong></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Student Comments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Student Qualitative Feedback & Comments
              </h3>
              <p className="text-xs text-slate-500">
                Constructive feedback from enrolled students (anonymized where requested).
              </p>

              {allRatings.filter(r => r.lecturer_id === (currentLecturer?.lecturer_id || 'LEC-MAY')).length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  No comments recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {allRatings
                    .filter(r => r.lecturer_id === (currentLecturer?.lecturer_id || 'LEC-MAY'))
                    .map(rating => (
                      <div
                        key={rating.rating_id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {rating.is_anonymous ? 'Anonymous Student' : rating.student_name || 'Enrolled Student'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                          "{rating.comment || 'High quality course delivery and supportive learning environment.'}"
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. ADMINISTRATOR VIEW: INSTITUTIONAL QA LEADERBOARD & METRICS        */}
      {/* =================================================================== */}
      {role === 'ADMINISTRATOR' && (
        <div className="space-y-6">
          {/* Institutional KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">University-Wide Rating Average</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {(
                    allRatings.reduce((sum, r) => sum + r.overall_score, 0) /
                    Math.max(1, allRatings.length)
                  ).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ 5.0</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                Across {allRatings.length} total student submissions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Evaluated Courses Ratio</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {Math.round(
                    (allModules.filter(m => db.getRatingsByModule(m.module_id).length > 0).length /
                      Math.max(1, allModules.length)) *
                      100
                  )}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                Coverage of accredited curriculum modules
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Trigger Auto-Recomputations</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {db.getTriggers().find(t => t.trigger_name === 'trg_after_rating_insert')?.fire_count || allRatings.length}
                </span>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">
                Executions of trg_after_rating_insert
              </span>
            </div>
          </div>

          {/* Module Quality Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Curriculum Module Quality Assurance & Faculty Scorecard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated rating aggregation with continuous assessment correlation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={adminFilterModule}
                  onChange={e => setAdminFilterModule(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ALL">All Modules</option>
                  {allModules.map(m => (
                    <option key={m.module_id} value={m.module_id}>
                      {m.module_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Module Code</th>
                    <th className="py-3 px-4">Module Name</th>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4 text-center">Submissions</th>
                    <th className="py-3 px-4 text-center">Satisfaction</th>
                    <th className="py-3 px-4 text-right">Overall Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {allModules
                    .filter(m => adminFilterModule === 'ALL' || m.module_id === adminFilterModule)
                    .map(module => {
                      const summary = db.calculateModuleRatingSummary(module.module_id);
                      return (
                        <tr key={module.module_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-black text-blue-700">
                            {module.module_code}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {module.module_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {summary.lecturer_name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            {summary.total_ratings}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {summary.total_ratings > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {summary.satisfaction_rate}%
                              </span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black">
                            {summary.total_ratings > 0 ? (
                              <div className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {summary.average_overall.toFixed(1)}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
