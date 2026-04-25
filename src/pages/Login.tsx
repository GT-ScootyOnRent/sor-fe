import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { useSendOtpMutation, useVerifyOtpMutation } from '../store/api/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [sendOtp, { isLoading: isSending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const response = await sendOtp({ phoneNumber: cleanPhone }).unwrap();
      if (response.success) {
        setStep('otp');
        setCountdown(60);
        toast.success('OTP sent successfully!', {
          description: response.otp ? `OTP: ${response.otp}` : 'Check your phone',
          duration: 10000,
        });
      } else {
        toast.error('Failed to send OTP', { description: response.message });
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP', {
        description: error?.data?.message || 'Please try again',
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await verifyOtp({
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        otp: otp,
      }).unwrap();

      if (response.success && response.token && response.user) {
        // ── 1. Store credentials in Redux
        dispatch(
          setCredentials({
            user: {
              id: response.user.id,
              name: response.user.userNumber,
              phone: response.user.userNumber,
              userType: 'user',
              cityId: response.user.cityId,
            },
            token: response.token,
          })
        );

        // ── 2. Store in localStorage for Header/other components
        localStorage.setItem('token', response.token);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userId', response.user.id.toString());
        localStorage.setItem('userPhone', response.user.userNumber);
        localStorage.setItem('isLoggedIn', 'true');

        toast.success(response.message || 'Login successful!', {
          description: response.isNewUser ? 'Welcome to scootyonrent!' : 'Welcome back!',
        });

        // ── 3. Redirect Priority Chain ──

        // Priority 1: ?redirect= query param (set by BookNow when unauthenticated)
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
        if (redirectUrl) {
          setTimeout(() => navigate(redirectUrl, { replace: true }), 300);
          return;
        }

        // Priority 2: sessionStorage bookingIntent (set by BookNow handleBooking)
        const intentRaw = sessionStorage.getItem('bookingIntent');
        if (intentRaw) {
          try {
            const intent = JSON.parse(intentRaw);
            sessionStorage.removeItem('bookingIntent'); // consume once
            if (intent.vehicleId) {
              const params = new URLSearchParams();
              if (intent.startDate) params.set('startDate', intent.startDate);
              if (intent.startTime) params.set('startTime', intent.startTime);
              if (intent.endDate) params.set('endDate', intent.endDate);
              if (intent.endTime) params.set('endTime', intent.endTime);
              setTimeout(
                () =>
                  navigate(`/book/${intent.vehicleId}?${params.toString()}`, {
                    replace: true,
                  }),
                300
              );
              return;
            }
          } catch {
            sessionStorage.removeItem('bookingIntent');
          }
        }

        // Priority 3: react-router location.state.from (standard protected route redirect)
        const from = (location.state as any)?.from;

if (from?.pathname && from.pathname !== '/login' && from.pathname !== '/auth') {
  navigate(
    `${from.pathname}${from.search || ''}${from.hash || ''}`,
    { replace: true }
  );
  return;
}

        // Default: go to dashboard
        setTimeout(() => navigate('/profile', { replace: true }), 300);
      } else {
        toast.error('Verification failed', { description: response.message });
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error('Verification failed', {
        description: error?.data?.message || 'Invalid OTP. Please try again.',
      });
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <Header />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 p-8 shadow-lg">

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">
                {step === 'phone' ? 'Welcome Back' : 'Enter OTP'}
              </h1>
              <p className="text-gray-600">
                {step === 'phone'
                  ? 'Login to continue your booking'
                  : `OTP sent to +91 ${phoneNumber}`}
              </p>
            </div>
            {/* Phone Step */}
            {step === 'phone' && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="phone" className="mb-2 block">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      className="pl-10"
                      maxLength={10}
                      disabled={isSending}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    We'll send you an OTP to verify your number
                  </p>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={isSending || phoneNumber.length !== 10}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-6"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                    }}
                    className="text-sm text-primary-500 hover:text-primary-600 mb-2 block w-full"
                  >
                    ← Change number
                  </button>
                </div>

                <div>
                  <Label htmlFor="otp" className="mb-2 block">
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="text-center text-2xl tracking-widest font-semibold"
                    maxLength={6}
                    disabled={isVerifying}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  />
                  <p className="text-sm text-gray-500 mt-2">OTP expires in 10 minutes</p>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-6"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isSending}
                    className={`text-sm ${countdown > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-primary-500 hover:text-primary-600'
                      }`}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
