import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  useAdminForgotPasswordMutation,
  useAdminVerifyOtpMutation,
  useAdminResetPasswordMutation,
} from '../store/api/adminApi';
import { toast } from 'sonner';

type Step = 'email' | 'otp' | 'newPassword';

const STEP_INDEX: Record<Step, number> = { email: 0, otp: 1, newPassword: 2 };
const STEPS: Step[] = ['email', 'otp', 'newPassword'];

const AdminForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [forgotPassword, { isLoading: isSendingOtp }] = useAdminForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useAdminVerifyOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useAdminResetPasswordMutation();

  const isLoading = isSendingOtp || isVerifying || isResetting;

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await forgotPassword({ email }).unwrap();
      // Accept success=true OR any truthy response without explicit success:false
      if (result.success !== false) {
        toast.success('OTP sent to your email');
        setStep('otp');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(
        err?.data?.message || err?.data?.error || 'Failed to send OTP. Please try again.'
      );
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await verifyOtp({ email, otp }).unwrap();

      // Robustly extract the reset token from multiple possible field names
      const token =
        result.resetToken ||
        (result as any).token ||
        (result as any).reset_token ||
        (result as any).data?.resetToken ||
        null;

      if (result.success !== false) {
        if (!token) {
          // Backend verified OTP but didn't return a token — still proceed
          // The reset endpoint will validate internally
          console.warn('OTP verified but no resetToken in response. Proceeding without token.');
        }
        toast.success('OTP verified successfully');
        setResetToken(token ?? '');
        setStep('newPassword');
      } else {
        setError(result.message || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setError(
        err?.data?.message || err?.data?.error || 'OTP verification failed. Please try again.'
      );
    }
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const result = await resetPassword({
        email,
        resetToken,
        newPassword,
      }).unwrap();

      if (result.success !== false) {
        toast.success('Password reset successfully! Please sign in with your new password.');
        navigate('/login');
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(
        err?.data?.message || err?.data?.error || 'Password reset failed. Please try again.'
      );
    }
  };

  const stepConfig = {
    email: {
      title: 'Forgot Password',
      subtitle: "Enter your admin email and we'll send an OTP",
      icon: Mail,
    },
    otp: {
      title: 'Verify OTP',
      subtitle: `Enter the 6-digit OTP sent to ${email}`,
      icon: KeyRound,
    },
    newPassword: {
      title: 'Set New Password',
      subtitle: 'Enter and confirm your new password',
      icon: Lock,
    },
  };

  const { title, subtitle, icon: StepIcon } = stepConfig[step];
  const currentStepIndex = STEP_INDEX[step];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <StepIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStepIndex > i
                    ? 'bg-primary-200 text-primary-700'
                    : currentStepIndex === i
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {currentStepIndex > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 transition-all ${currentStepIndex > i ? 'bg-primary-400' : 'bg-gray-200'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourdomain.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    placeholder="6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition tracking-widest text-center text-lg font-bold"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Sent to <span className="font-medium text-gray-600">{email}</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length < 4}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError(null);
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition py-1"
              >
                ← Change email
              </button>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              <button
                type="submit"
                disabled={isLoading || (!!newPassword && !!confirmPassword && newPassword !== confirmPassword)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to Login */}
        <button
          onClick={() => navigate('/login')}
          className="mt-6 w-full flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition py-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default AdminForgotPassword;