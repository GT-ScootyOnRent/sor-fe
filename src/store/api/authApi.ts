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
    dateOfBirth?: string;
    anniversaryDate?: string;
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
  refreshToken?: string;
  user?: {
    id: number;
    userNumber: string;
    cityId?: number;
    name?: string;
    email?: string;
    dateOfBirth?: string;
    anniversaryDate?: string;
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
  dateOfBirth?: string | null;
  anniversaryDate?: string | null;
  token: string; // passed explicitly — user not yet in Redux store
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

// Phone Change OTP interfaces
export interface SendPhoneChangeOtpRequest {
  userId: number;
  newPhoneNumber: string;
  captchaToken?: string;
}

export interface SendPhoneChangeOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyPhoneChangeOtpRequest {
  userId: number;
  newPhoneNumber: string;
  otp: string;
}

export interface VerifyPhoneChangeOtpResponse {
  success: boolean;
  message: string;
  newPhoneNumber?: string;
}

export interface UserDocumentDto {
  id: number;
  documentType: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface UploadUserDocumentResponse {
  success: boolean;
  document: UserDocumentDto;
}

export interface DeleteUserDocumentResponse {
  success: boolean;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['UserDocument'],
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
    sendPhoneChangeOtp: builder.mutation<SendPhoneChangeOtpResponse, SendPhoneChangeOtpRequest>({
      query: (data) => ({
        url: 'Auth/send-phone-change-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyPhoneChangeOtp: builder.mutation<VerifyPhoneChangeOtpResponse, VerifyPhoneChangeOtpRequest>({
      query: (data) => ({
        url: 'Auth/verify-phone-change-otp',
        method: 'POST',
        body: data,
      }),
    }),
    getMyDocuments: builder.query<UserDocumentDto[], void>({
      query: () => ({
        url: 'profile/me/documents',
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'UserDocument' as const, id })), 'UserDocument']
          : ['UserDocument'],
    }),
    uploadMyDocument: builder.mutation<UploadUserDocumentResponse, FormData>({
      query: (formData) => ({
        url: 'profile/me/documents',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['UserDocument'],
    }),
    deleteMyDocument: builder.mutation<DeleteUserDocumentResponse, string>({
      query: (documentType) => ({
        url: `profile/me/documents/${documentType}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserDocument'],
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
  useSendPhoneChangeOtpMutation,
  useVerifyPhoneChangeOtpMutation,
  useGetMyDocumentsQuery,
  useUploadMyDocumentMutation,
  useDeleteMyDocumentMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi;