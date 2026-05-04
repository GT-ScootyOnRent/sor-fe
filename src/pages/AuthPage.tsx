import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, ArrowRight, AlertCircle, Loader2, User, Mail, CheckCircle } from 'lucide-react';
import { useSendOtpMutation, useVerifyOtpMutation, useSendEmailOtpMutation, useVerifyEmailOtpMutation, useUpdateProfileMutation } from '../store/api/authApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';
import Header from '../components/Header';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { executeRecaptcha } from '../utils/recaptcha';

type Step = 'phone' | 'otp' | 'details' | 'emailOtp';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

  // Holds the full verifyOtp response for new users while they complete profile
  const [pendingAuthResponse, setPendingAuthResponse] = useState<any>(null);

  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();
  const [sendEmailOtp] = useSendEmailOtpMutation();
  const [verifyEmailOtp] = useVerifyEmailOtpMutation();
  const [updateProfile] = useUpdateProfileMutation();

  if (isAuthenticated && user) {
    // Admins visiting main site → redirect to homepage
    if (user.userType === 'admin' || user.userType === 'superadmin') return <Navigate to="/" replace />;
    if (user.userType === 'user') return <Navigate to="/profile" replace />;
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) return;
    setIsSendingOtp(true);
    try {
      let captchaToken: string;
      try {
        captchaToken = await executeRecaptcha('send_otp');
      } catch (captchaErr) {
        console.error('reCAPTCHA error:', captchaErr);
        toast.error('Captcha failed, please try again');
        return;
      }

      const response = await sendOtp({ phoneNumber, captchaToken }).unwrap();
      if (response.success) {
        setStep('otp');
        toast.success('OTP sent to your mobile number');
      } else {
        toast.error('Failed to send OTP', { description: response.message });
      }
    } catch (err: any) {
      if (err?.status === 400) {
        toast.error('Captcha failed, please try again', {
          description: err?.data?.message,
        });
        return;
      }
      toast.error('Failed to send OTP', { description: err?.data?.message ?? 'Please try again' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsVerifyingOtp(true);
    try {
      const response = await verifyOtp({ phoneNumber, otp }).unwrap();
      if (response.success && response.token && response.user) {
        if (response.isNewUser) {
          // Store the auth response — we'll use it after email verification
          setPendingAuthResponse(response);
          setStep('details');
          setIsVerifyingOtp(false);
          return;
        }
        // Existing user — log in directly
        completeLogin(response);
      } else {
        toast.error('Invalid OTP', { description: response.message });
      }
    } catch (err: any) {
      toast.error('Verification failed', { description: err?.data?.message ?? 'Please try again' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setIsSendingEmailOtp(true);
    try {
      const response = await sendEmailOtp({ email: email.trim() }).unwrap();
      if (response.success) {
        setStep('emailOtp');
        toast.success('OTP sent to your email address');
      } else {
        setEmailError(response.message || 'Failed to send email OTP');
      }
    } catch (err: any) {
      setEmailError(err?.data?.message ?? 'Failed to send email OTP. Please try again.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtpAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError('');
    if (emailOtp.length !== 6) {
      setEmailOtpError('Please enter the 6-digit OTP');
      return;
    }
    setIsVerifyingEmailOtp(true);
    try {
      // Step 1: verify email OTP
      const verifyRes = await verifyEmailOtp({ email: email.trim(), otp: emailOtp }).unwrap();
      if (!verifyRes.success) {
        setEmailOtpError(verifyRes.message || 'Invalid OTP. Please try again.');
        setIsVerifyingEmailOtp(false);
        return;
      }

      // Step 2: update the already-created user's name + email using the token we already have
      const userId = pendingAuthResponse?.user?.id;
      const token = pendingAuthResponse?.token;
      if (!userId || !token) {
        toast.error('Session expired. Please start again.');
        setStep('phone');
        setIsVerifyingEmailOtp(false);
        return;
      }

      const updateRes = await updateProfile({
        userId,
        name: name.trim(),
        email: email.trim(),
        token,
      }).unwrap();

      if (!updateRes.success) {
        toast.error('Failed to save profile', { description: updateRes.message });
        setIsVerifyingEmailOtp(false);
        return;
      }

      // Merge updated name/email into the pending response and complete login
      const finalResponse = {
        ...pendingAuthResponse,
        user: {
          ...pendingAuthResponse.user,
          name: name.trim(),
          email: email.trim(),
        },
        isNewUser: true,
      };
      completeLogin(finalResponse);
    } catch (err: any) {
      setEmailOtpError(err?.data?.message ?? 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    setEmailOtp('');
    setEmailOtpError('');
    setIsSendingEmailOtp(true);
    try {
      const response = await sendEmailOtp({ email: email.trim() }).unwrap();
      if (response.success) {
        toast.success('OTP resent to your email address');
      } else {
        toast.error('Failed to resend OTP', { description: response.message });
      }
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const completeLogin = (response: any) => {
  dispatch(
    setCredentials({
      user: {
        id: response.user.id,
        name: response.user.name ?? response.user.userNumber,
        phone: response.user.userNumber,
        email: response.user.email ?? undefined,
        userType: 'user',
        cityId: response.user.cityId ?? undefined,
      },
      token: response.token,
    })
  );

  localStorage.setItem('token', response.token);
  localStorage.setItem('userId', response.user.id.toString());
  localStorage.setItem('userPhone', response.user.userNumber);
  localStorage.setItem(
    'userName',
    response.user.name ?? response.user.userNumber
  );

  if (response.user.email) {
    localStorage.setItem('userEmail', response.user.email);
  }

  toast.success(
    response.isNewUser
      ? 'Welcome to ScootyOnRent!'
      : 'Welcome back!',
    {
      description: 'You are now logged in.',
    }
  );

  // Priority 1: bookingIntent
  const intentRaw = sessionStorage.getItem('bookingIntent');

  if (intentRaw) {
    try {
      const intent = JSON.parse(intentRaw);
      sessionStorage.removeItem('bookingIntent');

      if (intent.vehicleId) {
        const params = new URLSearchParams();

        if (intent.startDate) params.set('startDate', intent.startDate);
        if (intent.startTime) params.set('startTime', intent.startTime);
        if (intent.endDate) params.set('endDate', intent.endDate);
        if (intent.endTime) params.set('endTime', intent.endTime);

        navigate(
          `/book/${intent.vehicleId}?${params.toString()}`,
          { replace: true }
        );
        return;
      }
    } catch {
      sessionStorage.removeItem('bookingIntent');
    }
  }

  // Priority 2: ProtectedRoute redirect
  const from = (location.state as any)?.from;

  if (
    from?.pathname &&
    from.pathname !== '/auth' &&
    from.pathname !== '/login'
  ) {
    navigate(
      `${from.pathname}${from.search || ''}${from.hash || ''}`,
      { replace: true }
    );
    return;
  }

  // Default
  navigate('/profile', { replace: true });
};

  const handleResendOtp = async () => {
    setOtp('');
    await handleSendOtp({ preventDefault: () => { } } as any);
  };

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 p-8 shadow-lg">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">
                  {step === 'phone' ? 'Welcome Back' : step === 'otp' ? 'Enter OTP' : step === 'details' ? 'Complete Profile' : 'Verify Email'}
                </h1>
                <p className="text-gray-600">
                  {step === 'phone' && 'Login to continue your booking'}
                  {step === 'otp' && `OTP sent to +91-${phoneNumber}`}
                  {step === 'details' && 'Just a few more details'}
                  {step === 'emailOtp' && `OTP sent to ${email}`}
                </p>
              </div>

              {/* ── STEP: PHONE ── */}
              {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 ml-3" />
                      </div>
                      <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
                        <span className="text-gray-500">+91</span>
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full pl-24 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        maxLength={10}
                        required
                      />
                    </div>
                    {phoneNumber.length > 0 && phoneNumber.length !== 10 && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Phone number must be 10 digits
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingOtp || phoneNumber.length !== 10}
                    className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {isSendingOtp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                    {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    {!isSendingOtp && <ArrowRight className="w-5 h-5 ml-2" />}
                  </button>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    This site is protected by reCAPTCHA and the Google{' '}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-700"
                    >
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://policies.google.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-700"
                    >
                      Terms of Service
                    </a>{' '}
                    apply.
                  </p>
                </form>
              )}

              {/* ── STEP: OTP ── */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); }}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center mb-4"
                  >
                    ← Change Phone Number
                  </button>
                  <div>
                    <label htmlFor="otp" className="mb-2 block text-sm font-medium text-gray-700">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">OTP expires in 10 minutes</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {isVerifyingOtp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                    {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                    {!isVerifyingOtp && <ArrowRight className="w-5 h-5 ml-2" />}
                  </button>
                  <button type="button" onClick={handleResendOtp} disabled={isSendingOtp} className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Resend OTP
                  </button>
                </form>
              )}

              {/* ── STEP: DETAILS (name + email) ── */}
              {step === 'details' && (
                <form onSubmit={handleSendEmailOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                        placeholder="john@example.com"
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                        required
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {emailError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send booking confirmations to this email. An OTP will be sent for verification.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingEmailOtp || !name.trim() || name.trim().length < 2 || !email.trim()}
                    className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {isSendingEmailOtp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                    {isSendingEmailOtp ? 'Sending OTP...' : 'Verify Email & Continue'}
                    {!isSendingEmailOtp && <ArrowRight className="w-5 h-5 ml-2" />}
                  </button>
                </form>
              )}

              {/* ── STEP: EMAIL OTP ── */}
              {step === 'emailOtp' && (
                <form onSubmit={handleVerifyEmailOtpAndComplete} className="space-y-6">
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start">
                    <Mail className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary-800">OTP sent to your email</p>
                      <p className="text-sm text-primary-700 mt-0.5">{email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Enter Email OTP</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={emailOtp}
                        onChange={(e) => { setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setEmailOtpError(''); }}
                        placeholder="123456"
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest ${emailOtpError ? 'border-red-500' : 'border-gray-300'}`}
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    {emailOtpError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {emailOtpError}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">OTP expires in 10 minutes</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingEmailOtp || emailOtp.length !== 6}
                    className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {isVerifyingEmailOtp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                    {isVerifyingEmailOtp ? 'Verifying...' : 'Complete Registration'}
                    {!isVerifyingEmailOtp && <CheckCircle className="w-5 h-5 ml-2" />}
                  </button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setStep('details'); setEmailOtp(''); setEmailOtpError(''); }} className="text-gray-500 hover:text-gray-700">
                      ← Change Email
                    </button>
                    <button type="button" onClick={handleResendEmailOtp} disabled={isSendingEmailOtp} className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50">
                      {isSendingEmailOtp ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}

              <p className="text-center text-sm text-gray-600 mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;