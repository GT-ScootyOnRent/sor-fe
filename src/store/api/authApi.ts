import { createApi } from '@reduxjs/toolkit/query/react';
import { API_ENDPOINTS } from '../../config/api.config';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface LoginRequest {
  type: 'user' | 'admin' | 'superadmin';
  identifier: string;
  password?: string;
  otpCode?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userType?: string;
  message?: string;
  userData?: {
    id: number;
    username?: string;
    email?: string;
    userNumber?: string;
    cityId?: number;
    role?: number;
  };
}

export interface SendOtpRequest {
  phoneNumber: string;
  captchaToken?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  otp?: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  name?: string;
  email?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    userNumber: string;
    cityId?: number;
    name?: string;
    email?: string;
  };
  isNewUser: boolean;
}

export interface SendEmailOtpRequest {
  email: string;
}

export interface SendEmailOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailOtpResponse {
  success: boolean;
  message: string;
}

export interface UpdateProfileRequest {
  userId: number;
  name: string;
  email: string;
  token: string; // passed explicitly — user not yet in Redux store
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: API_ENDPOINTS.LOGIN,
        method: 'POST',
        body: credentials,
      }),
    }),
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (data) => ({
        url: 'Auth/send-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (data) => ({
        url: 'Auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),
    sendEmailOtp: builder.mutation<SendEmailOtpResponse, SendEmailOtpRequest>({
      query: (data) => ({
        url: 'Auth/send-email-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyEmailOtp: builder.mutation<VerifyEmailOtpResponse, VerifyEmailOtpRequest>({
      query: (data) => ({
        url: 'Auth/verify-email-otp',
        method: 'POST',
        body: data,
      }),
    }),
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileRequest>({
      query: ({ token, ...body }) => ({
        url: 'Auth/update-profile',
        method: 'POST',
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: 'Auth/logout',
        method: 'POST',
      }),
    }),
    refreshToken: builder.mutation<LoginResponse, void>({
      query: () => ({
        url: 'Auth/refresh',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSendEmailOtpMutation,
  useVerifyEmailOtpMutation,
  useUpdateProfileMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi;