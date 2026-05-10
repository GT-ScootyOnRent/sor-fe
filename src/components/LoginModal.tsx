import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, Loader2, AlertCircle, User, Mail, CheckCircle } from 'lucide-react';
import { useSendOtpMutation, useVerifyOtpMutation, useUpdateProfileMutation } from '../store/api/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';
import OtpInput from './OtpInput';
import { executeRecaptcha } from '../utils/recaptcha';

type Step = 'phone' | 'otp' | 'details';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const dispatch = useAppDispatch();

    const [step, setStep] = useState<Step>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Holds the full verifyOtp response for new users while they complete profile
    const [pendingAuthResponse, setPendingAuthResponse] = useState<any>(null);

    const [sendOtp] = useSendOtpMutation();
    const [verifyOtp] = useVerifyOtpMutation();
    const [updateProfile] = useUpdateProfileMutation();

    const phoneInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus phone input when modal opens
    useEffect(() => {
        if (isOpen && step === 'phone') {
            setTimeout(() => phoneInputRef.current?.focus(), 100);
        }
    }, [isOpen, step]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep('phone');
            setPhoneNumber('');
            setOtp('');
            setName('');
            setEmail('');
            setEmailError('');
            setPendingAuthResponse(null);
        }
    }, [isOpen]);

    const handleSendOtp = async (e: FormEvent) => {
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

    const handleVerifyOtp = async (e: FormEvent) => {
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

    const handleCompleteProfile = async (e: FormEvent) => {
        e.preventDefault();
        setEmailError('');
        if (!name.trim() || name.trim().length < 2) {
            toast.error('Please enter your full name (at least 2 characters)');
            return;
        }
        if (email.trim() && !validateEmail(email.trim())) {
            setEmailError('Please enter a valid email address');
            return;
        }
        setIsSavingProfile(true);
        try {
            const userId = pendingAuthResponse?.user?.id;
            const token = pendingAuthResponse?.token;
            if (!userId || !token) {
                toast.error('Session expired. Please start again.');
                setStep('phone');
                setIsSavingProfile(false);
                return;
            }

            const updateRes = await updateProfile({
                userId,
                name: name.trim(),
                email: email.trim() || undefined,
                token,
            }).unwrap();

            if (!updateRes.success) {
                toast.error('Failed to save profile', { description: updateRes.message });
                setIsSavingProfile(false);
                return;
            }

            // Merge updated name/email into the pending response and complete login
            const finalResponse = {
                ...pendingAuthResponse,
                user: {
                    ...pendingAuthResponse.user,
                    name: name.trim(),
                    email: email.trim() || undefined,
                },
                isNewUser: true,
            };
            completeLogin(finalResponse);
        } catch (err: any) {
            toast.error('Failed to save profile', { description: err?.data?.message ?? 'Please try again.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleResendOtp = async () => {
        setOtp('');
        setIsSendingOtp(true);
        try {
            const captchaToken = await executeRecaptcha('send_otp');
            const response = await sendOtp({ phoneNumber, captchaToken }).unwrap();
            if (response.success) {
                toast.success('OTP resent to your mobile number');
            } else {
                toast.error('Failed to resend OTP', { description: response.message });
            }
        } catch {
            toast.error('Failed to resend OTP');
        } finally {
            setIsSendingOtp(false);
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

        onSuccess();
    };

    if (!isOpen) return null;

    const getStepTitle = () => {
        switch (step) {
            case 'phone':
                return 'Login to continue';
            case 'otp':
                return 'Verify your number';
            case 'details':
                return 'Complete your profile';
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 'phone':
                return 'Enter your mobile number to continue booking';
            case 'otp':
                return `We sent a 6-digit OTP to +91 ${phoneNumber}`;
            case 'details':
                return 'Please provide your details to complete signup';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{getStepTitle()}</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">{getStepDescription()}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {/* Phone Step */}
                                {step === 'phone' && (
                                    <form onSubmit={handleSendOtp}>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500">
                                                <Phone className="w-4 h-4" />
                                                <span className="text-sm font-medium">+91</span>
                                            </div>
                                            <input
                                                ref={phoneInputRef}
                                                type="tel"
                                                placeholder="Enter 10-digit mobile number"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                                                autoComplete="tel"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={phoneNumber.length !== 10 || isSendingOtp}
                                            className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {isSendingOtp ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                <>
                                                    Continue
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* OTP Step */}
                                {step === 'otp' && (
                                    <form onSubmit={handleVerifyOtp}>
                                        <OtpInput
                                            value={otp}
                                            onChange={setOtp}
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            disabled={otp.length !== 6 || isVerifyingOtp}
                                            className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {isVerifyingOtp ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    Verify OTP
                                                    <CheckCircle className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                        <div className="mt-4 text-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={isSendingOtp}
                                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                {isSendingOtp ? 'Sending...' : "Didn't receive OTP? Resend"}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep('phone');
                                                setOtp('');
                                            }}
                                            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            ← Change phone number
                                        </button>
                                    </form>
                                )}

                                {/* Details Step (New Users) */}
                                {step === 'details' && (
                                    <form onSubmit={handleCompleteProfile}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter your full name"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-gray-400 text-xs">(Optional)</span></label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        placeholder="Enter your email"
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value);
                                                            setEmailError('');
                                                        }}
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${emailError ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                    />
                                                </div>
                                                {emailError && (
                                                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {emailError}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!name.trim() || isSavingProfile}
                                            className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {isSavingProfile ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    Complete Profile
                                                    <CheckCircle className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
