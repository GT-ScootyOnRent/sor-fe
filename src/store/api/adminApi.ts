import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

// ── Auth DTOs ──────────────────────────────────────────────────────────────

export interface AdminLoginRequest {
  type: 'admin' | 'superadmin';
  identifier: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userType?: string;
  message?: string;
  userData?: {
    id: number;
    username: string;
    email: string;
    cityId?: number;
    cityIds: number[];
    role: number;
    number: string;
  };
}

export interface AdminForgotPasswordRequest {
  email: string;
}

export interface AdminForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface AdminVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AdminVerifyOtpResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface AdminResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface AdminChangePasswordRequest {
  adminId: number;
  currentPassword: string;
  newPassword: string;
}

export interface AdminChangePasswordResponse {
  success: boolean;
  message: string;
}

// ── Admin CRUD DTOs ────────────────────────────────────────────────────────

export interface AdminDto {
  id: number;
  username: string;
  email: string;
  cityId?: number;
  cityIds: number[];
  role: number;           // 1 = Admin, 2 = SuperAdmin
  number: string;
  isActive: boolean;
  hasChangedPassword: boolean;
}

export interface AdminProfileDto {
  id: number;
  username: string;
  email: string;
  cityId?: number | null;
  cityName?: string | null;
  cityIds: number[];
  cityNames: string[];
  role: number;
  roleName: string;
  number: string;
  isActive: boolean;
  profilePicUrl: string | null;
  createdAt: string;
}

// ── Staff DTOs ─────────────────────────────────────────────────────────────

export interface StaffDto {
  id: number;
  username: string;
  email: string;
  number: string;
  cityId: number;
  cityName?: string;
  isActive: boolean;
  canOfflineBook: boolean;
  hasChangedPassword: boolean;
  profilePicUrl?: string;
  createdAt: string;
  createdByAdminId: number;
}

export interface CreateStaffDto {
  username: string;
  email: string;
  number: string;
  cityId: number;
  canOfflineBook?: boolean;
}

export interface UpdateStaffDto {
  username?: string;
  email?: string;
  number?: string;
  cityId?: number;
  isActive?: boolean;
  canOfflineBook?: boolean;
}

// ── API ────────────────────────────────────────────────────────────────────

export const adminApi = createApi({
  reducerPath: 'adminAuthApi', // keep same reducerPath so store key doesn't change
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Admin', 'AdminProfile', 'Staff'],
  endpoints: (builder) => ({
    // ── Login ──────────────────────────────────────────────────────────
    adminLogin: builder.mutation<AdminLoginResponse, AdminLoginRequest>({
      query: (credentials) => ({
        url: 'Auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // ── Forgot Password (Step 1 — send OTP to email) ───────────────────
    adminForgotPassword: builder.mutation<AdminForgotPasswordResponse, AdminForgotPasswordRequest>({
      query: (data) => ({
        url: '/admins/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Verify OTP (Step 2 — verify code, get reset token) ────────────
    adminVerifyOtp: builder.mutation<AdminVerifyOtpResponse, AdminVerifyOtpRequest>({
      query: (data) => ({
        url: '/admins/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Reset Password (Step 3 — set new password) ────────────────────
    adminResetPassword: builder.mutation<AdminResetPasswordResponse, AdminResetPasswordRequest>({
      query: (data) => ({
        url: '/admins/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Change Password (forced first-login change) ───────────────────
    adminChangePassword: builder.mutation({
      query: (data) => ({
        url: `/admins/${data.adminId}/change-password`,
        method: 'POST',
        body: {
          newPassword: data.newPassword,
          confirmPassword: data.newPassword
        }
      }),
    }),

    // ── Admin CRUD (SuperAdmin only) ───────────────────────────────────
    getAdmins: builder.query<AdminDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 } = {}) => `/Admins?page=${page}&size=${size}`,
      providesTags: ['Admin'],
    }),
    getAdminById: builder.query<AdminDto, number>({
      query: (id) => `/Admins/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Admin', id }],
    }),
    createAdmin: builder.mutation<AdminDto, Omit<AdminDto, 'id'>>({
      query: (admin) => ({
        url: '/Admins',
        method: 'POST',
        body: admin,
      }),
      invalidatesTags: ['Admin'],
    }),
    updateAdmin: builder.mutation<void, { id: number; admin: AdminDto }>({
      query: ({ id, admin }) => ({
        url: `/Admins/${id}`,
        method: 'PUT',
        body: admin,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Admin', id }, 'Admin'],
    }),
    deleteAdmin: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Admins/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Admin'],
    }),

    // ── Staff CRUD (Admin + SuperAdmin) ────────────────────────────────
    getStaff: builder.query<StaffDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 } = {}) => `/Staff?page=${page}&size=${size}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Staff' as const, id })), 'Staff']
          : ['Staff'],
    }),
    getStaffById: builder.query<StaffDto, number>({
      query: (id) => `/Staff/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Staff', id }],
    }),
    createStaff: builder.mutation<StaffDto, CreateStaffDto>({
      query: (staff) => ({
        url: '/Staff',
        method: 'POST',
        body: staff,
      }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation<void, { id: number; staff: UpdateStaffDto }>({
      query: ({ id, staff }) => ({
        url: `/Staff/${id}`,
        method: 'PUT',
        body: staff,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Staff', id }, 'Staff'],
    }),
    deleteStaff: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),

    adminLogout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: 'Auth/logout',
        method: 'POST',
      }),
    }),

    // ── Profile Endpoints ──────────────────────────────────────────────────
    getAdminProfile: builder.query<AdminProfileDto, void>({
      query: () => '/Admins/me',
      providesTags: ['AdminProfile'],
    }),
    updateAdminProfile: builder.mutation<AdminProfileDto, { username: string; number: string }>({
      query: (body) => ({
        url: '/Admins/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdminProfile'],
    }),
    changeMyPassword: builder.mutation<{ success: boolean; message?: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: '/Admins/me/change-password',
        method: 'POST',
        body,
      }),
    }),
    uploadProfilePic: builder.mutation<{ success: boolean; profilePicUrl?: string; error?: string }, FormData>({
      query: (formData) => ({
        url: '/Admins/me/profile-pic',
        method: 'POST',
        body: formData,
        // Don't set Content-Type, browser will set it with boundary for FormData
        formData: true,
      }),
      invalidatesTags: ['AdminProfile'],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useAdminForgotPasswordMutation,
  useAdminVerifyOtpMutation,
  useAdminResetPasswordMutation,
  useAdminChangePasswordMutation,
  useGetAdminsQuery,
  useGetAdminByIdQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useAdminLogoutMutation,
  // Staff hooks
  useGetStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  // Profile hooks
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
  useChangeMyPasswordMutation,
  useUploadProfilePicMutation,
} = adminApi;

// Backward-compat alias so existing imports of adminAuthApi still work
export const adminAuthApi = adminApi;