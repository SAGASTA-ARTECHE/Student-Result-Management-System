import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  AlertCircle,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  BookmarkCheck,
  Eye,
  EyeOff,
  UserCheck,
  X,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { AuthSession, UserRole, User as DbUser, Student, Lecturer } from '../../types';
import { db } from '../../data/db';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [saveLoginCheckbox, setSaveLoginCheckbox] = useState(true);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  // Save Credentials Prompt Modal State
  const [showSavePromptModal, setShowSavePromptModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('STUDENT');
  const [regStudentId, setRegStudentId] = useState('');
  const [regYear, setRegYear] = useState('1');
  const [regDepartment, setRegDepartment] = useState('Computer Science');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState<{
    user: DbUser;
    student?: Student;
    lecturer?: Lecturer;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetStorageModal, setShowResetStorageModal] = useState(false);

  // On mount, check if user has saved credentials
  useEffect(() => {
    const saved = AuthService.getSavedLogin();
    if (saved && saved.identifier) {
      setIdentifier(saved.identifier);
      if (saved.password) {
        setPassword(saved.password);
      }
      setHasSavedCredentials(true);
      setSaveLoginCheckbox(true);
    }
  }, []);

  // Handle Sign In submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const session = AuthService.login(identifier, password);
      // Check if user already has identical saved credentials (both identifier AND password)
      const saved = AuthService.getSavedLogin();
      const isAlreadySaved =
        saved?.identifier?.toLowerCase() === identifier.trim().toLowerCase() &&
        saved?.password === password;

      // If user checked the save checkbox, store both identifier & password immediately
      if (saveLoginCheckbox) {
        AuthService.saveLogin(identifier, password);
        setHasSavedCredentials(true);
      }

      // If not already saved and user did not explicitly check the box, prompt whether to save
      if (!isAlreadySaved && !saveLoginCheckbox) {
        setPendingSession(session);
        setShowSavePromptModal(true);
      } else {
        // Already saved or checked, proceed directly
        onLoginSuccess(session);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // User selects "Save Details" from the prompt
  const handlePromptSaveChoice = (shouldSave: boolean) => {
    if (!pendingSession) return;
    if (shouldSave) {
      AuthService.saveLogin(identifier, password);
      setHasSavedCredentials(true);
      setSaveLoginCheckbox(true);
    } else {
      AuthService.clearSavedLogin();
      setHasSavedCredentials(false);
      setSaveLoginCheckbox(false);
    }
    const sess = pendingSession;
    setShowSavePromptModal(false);
    setPendingSession(null);
    onLoginSuccess(sess);
  };

  // Clear saved credentials from device
  const handleClearSavedLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    AuthService.clearSavedLogin();
    setHasSavedCredentials(false);
    setSaveLoginCheckbox(false);
    setIdentifier('');
    setPassword('');
    setSuccess('Saved login details and password removed from this device.');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle Registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);

    try {
      const usernameGenerated = regEmail.split('@')[0] || regFullName.toLowerCase().replace(/\s+/g, '');
      const session = AuthService.register({
        username: usernameGenerated,
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        fullName: regFullName.trim(),
        studentId: regRole === 'STUDENT' && regStudentId.trim() ? regStudentId.trim() : undefined,
        course: regRole === 'STUDENT' ? `BSc ${regDepartment}` : undefined,
        yearOfStudy: regRole === 'STUDENT' ? parseInt(regYear, 10) : undefined,
        department: regDepartment,
      });

      setSuccess('Account registered successfully! Prompting login preferences...');
      setIdentifier(regEmail.trim());
      setPassword(regPassword);
      setTimeout(() => {
        setPendingSession(session);
        setShowSavePromptModal(true);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Verification
  const handleVerifyAccountForReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email address or username/student ID.');
      return;
    }

    const found = AuthService.findAccount(forgotIdentifier);
    if (!found) {
      setError(`No registered account found matching "${forgotIdentifier}". Please verify your email or register.`);
      setVerifiedAccount(null);
      return;
    }

    setVerifiedAccount(found);
    setSuccess(`Account verified for ${found.user.username} (${found.user.role.toLowerCase()}). Please set your new password.`);
  };

  // Handle Password Reset Submission
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotIdentifier.trim()) {
      setError('Please provide your account email or username/ID.');
      return;
    }

    if (forgotNewPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('New passwords do not match. Please re-enter them carefully.');
      return;
    }

    setLoading(true);

    try {
      const result = AuthService.resetPassword(forgotIdentifier, forgotNewPassword);
      setSuccess(result.message);
      setIdentifier(result.user.email || result.user.username);
      setPassword(forgotNewPassword);
      // After brief confirmation, direct back to sign in
      setTimeout(() => {
        setMode('signin');
        setForgotIdentifier('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setVerifiedAccount(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const registeredUsers = db.getUsers().sort((a, b) => {
    const rolePriority: Record<string, number> = { STUDENT: 1, LECTURER: 2, ADMINISTRATOR: 3 };
    return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
  });

  const handleFillAccount = (accountIdentifier: string) => {
    setMode('signin');
    setIdentifier(accountIdentifier);

    // Auto-fill the corresponding password so user can log in with one click
    const lower = accountIdentifier.toLowerCase();
    let accountPassword = '';
    if (lower.includes('maje')) {
      accountPassword = 'Admin@123';
    } else if (lower.includes('may')) {
      accountPassword = 'Lecturer@123';
    } else if (lower.includes('tlhompo')) {
      accountPassword = 'Student@123';
    }

    // If there is already a saved password stored for this account, use it
    const saved = AuthService.getSavedLogin();
    if (
      saved &&
      saved.password &&
      saved.identifier.toLowerCase() === accountIdentifier.toLowerCase()
    ) {
      accountPassword = saved.password;
    }

    setPassword(accountPassword);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-9 px-8 sm:px-10 rounded-2xl border border-slate-200/90 shadow-sm relative">
          
          {/* Circular Blue Icon Badge */}
          <div className="w-16 h-16 rounded-full bg-[#1e40af] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            {mode === 'forgot_password' ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <GraduationCap className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Heading and Subtitle */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {mode === 'signin' && 'Kimberley University of Technology'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot_password' && 'Reset Account Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signin' && 'Student Results Management System'}
              {mode === 'signup' && 'Kimberley University of Technology'}
              {mode === 'forgot_password' && 'Enter your credentials to securely reset your password'}
            </p>
          </div>

          {error && (
            <div
              id="login-error-alert"
              className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div
              id="login-success-alert"
              className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold">{success}</p>
              </div>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'signin' && (
            <form id="login-form" className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Email or Username
                  </label>
                  {hasSavedCredentials && (
                    <button
                      type="button"
                      onClick={handleClearSavedLogin}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition-colors"
                      title="Clear saved credentials from this device"
                    >
                      Clear saved details
                    </button>
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="student@university.edu or username"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                      setSuccess(null);
                      setForgotIdentifier(identifier);
                    }}
                    className="text-xs text-[#1d4ed8] hover:text-[#1e40af] font-semibold cursor-pointer hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Save Login Details Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    id="save-login-checkbox"
                    checked={saveLoginCheckbox}
                    onChange={e => setSaveLoginCheckbox(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  />
                  <span>Save login details for future use</span>
                </label>
                {hasSavedCredentials && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Password Saved
                  </span>
                )}
              </div>

              <div className="pt-2">
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg font-semibold text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[#1d4ed8] hover:text-[#1e40af] font-semibold cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              {!verifiedAccount ? (
                /* Step 1: Verify Account */
                <form onSubmit={handleVerifyAccountForReset} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-id-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Registered Email or Username/ID
                    </label>
                    <input
                      id="forgot-id-input"
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={e => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. student@university.edu or STU-2024-001"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter the email or student/staff ID you registered with to find your account.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg font-semibold text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Verify Account
                  </button>
                </form>
              ) : (
                /* Step 2: Set New Password */
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {/* Verified badge */}
                  <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">
                          {verifiedAccount.student?.name || verifiedAccount.lecturer?.lecturer_name || verifiedAccount.user.username}
                        </p>
                        <p className="text-[11px] text-blue-700">
                          {verifiedAccount.user.email} &bull; {verifiedAccount.user.role}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVerifiedAccount(null)}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-medium underline"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-new-password"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      New Password
                    </label>
                    <input
                      id="forgot-new-password"
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 4 characters)"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-confirm-password"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="forgot-confirm-password"
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg font-semibold text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Save & Reset Password'}
                  </button>
                </form>
              )}

              {/* Return to Sign In */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccess(null);
                    setVerifiedAccount(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: CREATE ACCOUNT / REGISTRATION */}
          {mode === 'signup' && (
            <form id="register-form" className="space-y-3.5" onSubmit={handleRegisterSubmit}>
              <div>
                <label
                  htmlFor="reg-fullname"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-role"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="reg-role"
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                >
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="reg-student-id"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  {regRole === 'STUDENT' ? 'Student ID' : 'Staff ID'}
                </label>
                <input
                  id="reg-student-id"
                  type="text"
                  value={regStudentId}
                  onChange={e => setRegStudentId(e.target.value)}
                  placeholder="e.g. 202353353"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>

              {regRole === 'STUDENT' && (
                <div>
                  <label
                    htmlFor="reg-year"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Year of Study
                  </label>
                  <select
                    id="reg-year"
                    value={regYear}
                    onChange={e => setRegYear(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="reg-department"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Department
                </label>
                <input
                  id="reg-department"
                  type="text"
                  required
                  value={regDepartment}
                  onChange={e => setRegDepartment(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Create a password (min. 4 characters)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>

              <div className="pt-2">
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg font-semibold text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[#1d4ed8] hover:text-[#1e40af] font-semibold cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Dynamic Registered Accounts or Fresh System Notice */}
        {registeredUsers.length > 0 ? (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 font-medium mb-2.5">
              Select a Registered Account to Sign In:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {registeredUsers.map(u => (
                <button
                  key={u.user_id}
                  type="button"
                  onClick={() => handleFillAccount(u.email || u.username)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#1d4ed8] rounded-lg text-xs font-medium text-slate-700 shadow-xs cursor-pointer hover:text-[#1d4ed8] transition-colors"
                >
                  {u.role === 'ADMINISTRATOR' ? '🛡️' : u.role === 'LECTURER' ? '👨‍🏫' : '🎓'}{' '}
                  {u.username} <span className="text-[10px] text-slate-400 font-normal">({u.role.toLowerCase()})</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <p className="text-xs font-semibold text-slate-700">
              Clean Academic System &bull; Zero Mock Data
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No accounts registered yet. Use the registration form to create an Administrator, Lecturer, or Student profile.
            </p>
          </div>
        )}

        {/* Reset Local Browser Storage / Cache Button */}
        <div className="mt-8 text-center">
          <button
            type="button"
            id="reset-browser-storage-btn"
            onClick={() => setShowResetStorageModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Browser Storage & Cache</span>
          </button>
        </div>
      </div>

      {/* PROMPT MODAL: Save or Not Save Login Details for Future Use */}
      {showSavePromptModal && pendingSession && (
        <div
          id="save-credentials-prompt-modal"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 transform transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1d4ed8] flex items-center justify-center flex-shrink-0">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Save login details for future use?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Would you like this browser to securely save your username (<span className="font-semibold text-slate-800">{identifier}</span>) and password so you can sign in automatically next time without having to re-enter your password?
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row-reverse gap-2.5">
              <button
                type="button"
                id="prompt-save-btn"
                onClick={() => handlePromptSaveChoice(true)}
                className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition-colors text-center"
              >
                Save Password & Details
              </button>
              <button
                type="button"
                id="prompt-dont-save-btn"
                onClick={() => handlePromptSaveChoice(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors text-center"
              >
                Do Not Save
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3.5">
              You can change this choice or clear saved password & details anytime from the sign-in screen.
            </p>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Reset Local Browser Storage */}
      {showResetStorageModal && (
        <div
          id="reset-storage-modal"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 transform transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Reset Local Browser Storage?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  This will clear all <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">localStorage</code> data stored in this browser (including any stale cached accounts, login sessions, and saved passwords) and reload the app with the clean 3 registered users (<strong>tlhompo</strong>, <strong>dr.may</strong>, <strong>maje</strong>).
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row-reverse gap-2.5">
              <button
                type="button"
                id="confirm-reset-storage-btn"
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch (e) {
                    console.error(e);
                  }
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition-colors text-center"
              >
                Yes, Clear Storage & Reload
              </button>
              <button
                type="button"
                id="cancel-reset-storage-btn"
                onClick={() => setShowResetStorageModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
