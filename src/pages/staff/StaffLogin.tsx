import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setStaffCredentials } from '../../store/slices/staffAuthSlice';
import { useStaffLoginMutation } from '../../store/api/staffApi';

const StaffLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { staff, isAuthenticated } = useAppSelector((state) => state.staffAuth);
    const [login, { isLoading }] = useStaffLoginMutation();

    // If already logged in → go to dashboard
    useEffect(() => {
        if (isAuthenticated && staff) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, staff, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Please enter email and password');
            return;
        }

        try {
            const response = await login({ email: email.trim(), password }).unwrap();
            if (response.success && response.userData) {
                // Store token in localStorage for API calls
                localStorage.setItem('staff_token', response.token);
                localStorage.setItem('staff_refresh_token', response.refreshToken);
                dispatch(setStaffCredentials({ staff: response.userData }));
                toast.success('Login successful');
                navigate('/dashboard', { replace: true });
            } else {
                toast.error(response.message || 'Login failed');
            }
        } catch (err: any) {
            toast.error(err?.data?.message || err?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                        scootyonrent
                    </h1>
                    <p className="text-gray-500 mt-2">Staff Portal</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Staff Login</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                placeholder="staff@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Contact your admin if you need help accessing your account.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
