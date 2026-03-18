import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import apiClient from "../../services/apiClient";

// ── Icons ──────────────────────────────────────────────────────────
const Building2 = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
  </svg>
);
const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const LockIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Reusable Input ─────────────────────────────────────────────────
const Input = ({ label, name, type = "text", placeholder, value, onChange, startIcon, endIcon, autoComplete }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative flex items-center">
      {startIcon && (
        <div className="absolute left-3 text-gray-400 pointer-events-none">{startIcon}</div>
      )}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
      />
      {endIcon && (
        <div className="absolute right-3 text-gray-400">{endIcon}</div>
      )}
    </div>
  </div>
);

// ── Reusable Button ────────────────────────────────────────────────
const Button = ({ children, type = "button", fullWidth, isLoading, onClick, className = "" }) => (
  <button
    type={type}
    disabled={isLoading}
    onClick={onClick}
    className={`${fullWidth ? "w-full" : ""} flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 ${className}`}
  >
    {isLoading ? (
      <>
        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </>
    ) : children}
  </button>
);

// ── Forgot Password Modal ──────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep]               = useState('email');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const clearError = () => setError('');

  // ✅ FIXED: capture response and auto-fill devOtp
  const handleSendOtp = async () => {
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); clearError();
    try {
      const res = await apiClient.post('/Auth/forgot-password', { email });

      // ⚠️ DEV ONLY — auto-fills OTP from response, remove when real email is configured
      if (res.data?.devOtp) {
        setOtp(res.data.devOtp);
      }

      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) { setError('Please enter the OTP.'); return; }
    setLoading(true); clearError();
    try {
      await apiClient.post('/Auth/verify-otp', { email, otp });
      setStep('newPassword');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async () => {
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); clearError();
    try {
      await apiClient.post('/Auth/reset-password', { email, otp, newPassword });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {step === 'email'       && 'Forgot Password'}
              {step === 'otp'         && 'Enter OTP'}
              {step === 'newPassword' && 'Reset Password'}
              {step === 'success'     && 'Password Reset!'}
            </h2>
            {step !== 'success' && (
              <div className="flex items-center gap-1.5 mt-1">
                {['email', 'otp', 'newPassword'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full transition-all ${
                      step === s
                        ? 'bg-blue-600 w-4'
                        : ['email', 'otp', 'newPassword'].indexOf(step) > i
                        ? 'bg-blue-300'
                        : 'bg-gray-200'
                    }`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <>
              <p className="text-sm text-gray-500">
                Enter your registered email address. We'll send you an OTP to reset your password.
              </p>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400 pointer-events-none">
                    <MailIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <Button fullWidth isLoading={loading} onClick={handleSendOtp}>
                Send OTP
              </Button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <>
              <p className="text-sm text-gray-500">
                We sent a 6-digit OTP to <span className="font-medium text-gray-700">{email}</span>. Check your inbox.
              </p>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">One-Time Password</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(digits);
                    clearError();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm text-center tracking-[0.5em] font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <Button fullWidth isLoading={loading} onClick={handleVerifyOtp}>
                Verify OTP
              </Button>
              <button
                onClick={() => { clearError(); handleSendOtp(); }}
                className="w-full text-sm text-blue-600 hover:underline text-center"
              >
                Didn't receive it? Resend OTP
              </button>
              <button
                onClick={() => { setStep('email'); clearError(); }}
                className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'newPassword' && (
            <>
              <p className="text-sm text-gray-500">
                Choose a strong new password for your account.
              </p>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400 pointer-events-none">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(p => !p)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNew ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400 pointer-events-none">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirm ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <Button fullWidth isLoading={loading} onClick={handleResetPassword}>
                Reset Password
              </Button>
            </>
          )}

          {/* ── Step 4: Success ── */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Password Reset Successful</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>
              <Button fullWidth onClick={onClose}>
                Back to Sign In
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ── Main Login Page ────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword]             = useState(false);
  const [isLoading, setIsLoading]                   = useState(false);
  const [formData, setFormData]                     = useState({ email: "", password: "" });
  const [error, setError]                           = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/Auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      login({
        name:       data.name,
        role:       data.role,
        employeeId: data.employeeId,
        email:      data.email,
      }, data.token);

      if (data.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}

      <div className="min-h-screen flex w-full">
        {/* Left Panel */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative z-10 text-center text-white p-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 inline-block shadow-2xl border border-white/10">
              <Building2 className="h-24 w-24 mx-auto mb-4 text-blue-200" />
            </div>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Enterprise Attendance</h2>
            <p className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed">
              Streamline your workforce management with our secure and efficient attendance tracking system.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4 lg:hidden">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-500">Please enter your details to sign in.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center">
                <span className="font-medium mr-1">Error:</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Username"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                startIcon={<UserIcon className="h-5 w-5" />}
                autoComplete="username"
              />
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                startIcon={<LockIcon className="h-5 w-5" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                }
                autoComplete="current-password"
              />

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading}>
                Sign in
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Contact Admin
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}