import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { markPasswordChanged } from '../store/slices/adminAuthSlice';
import { logout } from '../store/slices/authSlice';
import { toast } from 'sonner';
import { API_CONFIG } from '../config/api.config';

const AdminChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const adminUser = useAppSelector((state) => state.auth.user);
  const tokenFromRedux = useAppSelector((state) => state.auth.token);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resolve admin ID from Redux or localStorage fallback
  const getAdminId = (): number | null => {
    if (adminUser?.id) return adminUser.id;
    try {
      const stored = localStorage.getItem('user') || localStorage.getItem('adminUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.id ?? null;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Resolve token from Redux or localStorage fallback
  const getToken = (): string | null => {
    if (tokenFromRedux) return tokenFromRedux;
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken') ||
      null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from the current password');
      return;
    }

    const adminId = getAdminId();
    const token = getToken();

    if (!adminId) {
      setError('Session expired. Please sign in again.');
      return;
    }
    if (!token) {
      setError('Authentication token missing. Please sign in again.');
      return;
    }

    setIsLoading(true);

    try {
      // Use fetch directly so we can guarantee the Authorization header is sent
      // regardless of whether RTK Query's prepareHeaders has the token yet
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/Admins/${adminId}/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      // Handle non-JSON responses gracefully
      let result: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      }

      if (response.ok && result.success !== false) {
        // Mark password changed in Redux + localStorage
        dispatch(markPasswordChanged());
        toast.success('Password changed successfully!');
        navigate('/dashboard', { replace: true });
      } else if (response.status === 401) {
        setError('Current password is incorrect');
      } else if (response.status === 403) {
        setError('You are not authorized to perform this action');
      } else {
        setError(
          result.message || result.error || 'Failed to change password. Please try again.'
        );
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminHasChangedPassword');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-yellow-600" />
          </div>

          {/* Back button - left aligned */}
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-500 hover:text-primary-600 transition group mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to login</span>
          </button>

          {/* Title - left aligned */}
          <h1 className="text-3xl font-bold text-gray-900">Change Password Required</h1>
          <p className="text-gray-500 text-sm mt-2">
            For your security, please set a new password before continuing.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <p className="font-semibold">First-time login detected</p>
          <p className="mt-1">
            You must change your temporary password to access the admin panel.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current / Temporary Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Your current / temporary password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                (!!newPassword && !!confirmPassword && newPassword !== confirmPassword)
              }
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Set New Password & Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminChangePassword;