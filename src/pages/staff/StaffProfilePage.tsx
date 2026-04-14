import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Lock, X, Eye, EyeOff, Loader2, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch } from '../../store/hooks';
import { updateStaffProfile, markStaffPasswordChanged } from '../../store/slices/staffAuthSlice';
import {
    useGetStaffProfileQuery,
    useUpdateStaffProfileMutation,
    useChangeStaffPasswordMutation,
    useUploadStaffProfilePicMutation,
} from '../../store/api/staffApi';

const StaffProfilePage: React.FC = () => {
    const dispatch = useAppDispatch();

    // RTK Query hooks
    const { data: profile, isLoading, refetch } = useGetStaffProfileQuery();
    const [updateProfile, { isLoading: isSaving }] = useUpdateStaffProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangeStaffPasswordMutation();
    const [uploadProfilePic, { isLoading: isUploadingPic }] = useUploadStaffProfilePicMutation();

    // Editable fields
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Profile picture ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form fields when profile loads
    useEffect(() => {
        if (profile) {
            setUsername(profile.username);
            setPhone(profile.number || '');
        }
    }, [profile]);

    // Track form changes
    useEffect(() => {
        if (profile) {
            setHasChanges(username !== profile.username || phone !== profile.number);
        }
    }, [username, phone, profile]);

    const handleSaveProfile = async () => {
        if (!username.trim()) {
            toast.error('Username is required');
            return;
        }

        try {
            const result = await updateProfile({ username: username.trim(), number: phone.trim() }).unwrap();
            dispatch(updateStaffProfile({ username: result.username, number: result.number }));
            toast.success('Profile updated successfully');
            refetch();
        } catch (error: unknown) {
            const err = error as { data?: { error?: string } };
            toast.error(err.data?.error || 'Failed to update profile');
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (!currentPassword) {
            setPasswordError('Current password is required');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            const result = await changePassword({ currentPassword, newPassword }).unwrap();
            if (result.success) {
                dispatch(markStaffPasswordChanged());
                toast.success('Password changed successfully');
                setShowPasswordModal(false);
                resetPasswordForm();
                refetch();
            } else {
                setPasswordError(result.message || 'Failed to change password');
            }
        } catch (error: unknown) {
            const err = error as { data?: { error?: string } };
            setPasswordError(err.data?.error || 'Error changing password');
        }
    };

    const resetPasswordForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
    };

    const handleProfilePicClick = () => {
        fileInputRef.current?.click();
    };

    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB limit.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadProfilePic(formData).unwrap();
            if (result.success && result.profilePicUrl) {
                dispatch(updateStaffProfile({ profilePicUrl: result.profilePicUrl }));
                toast.success('Profile picture updated!');
                refetch();
            } else {
                toast.error('Failed to upload profile picture');
            }
        } catch (error: unknown) {
            const err = error as { data?: { error?: string } };
            toast.error(err.data?.error || 'Error uploading profile picture');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString.startsWith('0001')) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Failed to load profile</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with avatar and role badge */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-8">
                    <div className="flex items-center gap-4">
                        {/* Profile Picture with Upload */}
                        <div className="relative group">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleProfilePicChange}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                            />
                            <button
                                onClick={handleProfilePicClick}
                                disabled={isUploadingPic}
                                className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center relative cursor-pointer hover:ring-4 hover:ring-white/30 transition"
                            >
                                {isUploadingPic ? (
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                ) : profile.profilePicUrl ? (
                                    <img
                                        src={profile.profilePicUrl}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-10 h-10 text-white" />
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </button>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                            <div className="flex gap-2 mt-2">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white font-medium">
                                    Staff
                                </span>
                                {profile.cityName && (
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white font-medium">
                                        {profile.cityName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="p-6 space-y-6">
                    {/* Editable: Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            placeholder="Enter username"
                        />
                    </div>

                    {/* Read-only: Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Editable: Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            placeholder="Enter phone number"
                        />
                    </div>

                    {/* Read-only: City and Offline Booking */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                City
                            </label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                    {profile.cityName || `City #${profile.cityId}`}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offline Booking
                            </label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                                {profile.canOfflineBook ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Enabled
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 inline-flex items-center gap-1">
                                        <XCircle className="w-4 h-4" />
                                        Disabled
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Member Since */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Member Since
                        </label>
                        <p className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600">
                            {formatDate(profile.createdAt)}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSaveProfile}
                            disabled={!hasChanges || isSaving}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition ${hasChanges && !isSaving
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Save Changes
                        </button>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Lock className="w-5 h-5" />
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    resetPasswordForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    {passwordError}
                                </div>
                            )}

                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                        placeholder="Enter new password (min 8 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    resetPasswordForm();
                                }}
                                className="flex-1 px-6 py-3 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {isChangingPassword ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Lock className="w-5 h-5" />
                                )}
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffProfilePage;
