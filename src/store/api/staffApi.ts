import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_CONFIG } from '../../config/api.config';
import { staffLogout, setStaffCredentials, type StaffUser } from '../slices/staffAuthSlice';

// ── Types ──────────────────────────────────────────────────────────────────

export interface StaffLoginRequest {
    email: string;
    password: string;
}

export interface StaffLoginResponse {
    success: boolean;
    token: string;
    refreshToken: string;
    userData: StaffUser;
    message?: string;
}

export interface StaffProfileDto {
    id: number;
    username: string;
    email: string;
    number: string;
    cityId: number;
    cityName?: string;
    canOfflineBook: boolean;
    hasChangedPassword: boolean;
    profilePicUrl?: string;
    createdAt: string;
}

export interface BookingDto {
    id: number;
    userId: number;
    vehicleId: number;
    vehicleName?: string;
    vehicleNumber?: string;
    startDate: string;
    endDate: string;
    pickupLocationId?: number;
    pickupLocationName?: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    userName?: string;
    userPhone?: string;
    isOfflineBooking: boolean;
}

export interface BookingDocumentDto {
    id: number;
    bookingId: number;
    documentType: string;
    documentUrl: string;
    uploadedAt: string;
    uploadedByStaffId?: number;
    uploadedByAdminId?: number;
}

export interface BookingMediaDto {
    id: number;
    bookingId: number;
    mediaType: string;
    mediaUrl: string;
    uploadedAt: string;
    uploadedByStaffId: number;
}

// ── Mutex for token refresh ────────────────────────────────────────────────

// const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include', // Send cookies
    prepareHeaders: (headers) => {
        headers.set('Content-Type', 'application/json');
        // Add Authorization token from localStorage
        const token = localStorage.getItem('staff_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    // // Wait if another refresh is in progress
    // await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // if (!mutex.isLocked()) {
        //     const release = await mutex.acquire();
        //     try {
        //         // Try to refresh token
        //         const refreshResult = await baseQuery(
        //             { url: '/staff/auth/refresh', method: 'POST' },
        //             api,
        //             extraOptions
        //         );

        //         if (refreshResult.data) {
        //             const data = refreshResult.data as { staff: StaffUser };
        //             api.dispatch(setStaffCredentials({ staff: data.staff }));
        //             // Retry original request
        //             result = await baseQuery(args, api, extraOptions);
        //         } else {
        //             api.dispatch(staffLogout());
        //             window.location.href = '/login';
        //         }
        //     } finally {
        //         release();
        //     }
        // } else {
        //     // Wait for other refresh to complete
        //     await mutex.waitForUnlock();
        //     result = await baseQuery(args, api, extraOptions);
        // }
             // Staff requirement: any 401 should force logout (no refresh/retry).
             api.dispatch(staffLogout());
             localStorage.removeItem('staff_token');
             localStorage.removeItem('staff_refresh_token');
             localStorage.removeItem('staff');
             localStorage.removeItem('staffId');
     
             if (window.location.pathname !== '/login') {
                 window.location.href = '/login';
    }
    }

    return result;
};

// ── API ────────────────────────────────────────────────────────────────────

export const staffApi = createApi({
    reducerPath: 'staffApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['StaffProfile', 'Booking', 'BookingDocument', 'BookingMedia'],
    endpoints: (builder) => ({
        // ── Auth ───────────────────────────────────────────────────────────
        staffLogin: builder.mutation<StaffLoginResponse, StaffLoginRequest>({
            query: (credentials) => ({
                url: '/staff/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        staffLogout: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: '/staff/auth/logout',
                method: 'POST',
            }),
        }),
        staffRefreshToken: builder.mutation<{ staff: StaffUser }, void>({
            query: () => ({
                url: '/staff/auth/refresh',
                method: 'POST',
            }),
        }),

        // ── Profile ────────────────────────────────────────────────────────
        getStaffProfile: builder.query<StaffProfileDto, void>({
            query: () => '/staff/profile/me',
            providesTags: ['StaffProfile'],
        }),
        updateStaffProfile: builder.mutation<StaffProfileDto, { username: string; number: string }>({
            query: (body) => ({
                url: '/staff/profile/me',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['StaffProfile'],
        }),
        changeStaffPassword: builder.mutation<
            { success: boolean; message?: string },
            { currentPassword: string; newPassword: string }
        >({
            query: (body) => ({
                url: '/staff/profile/me/change-password',
                method: 'POST',
                body,
            }),
        }),
        uploadStaffProfilePic: builder.mutation<
            { success: boolean; profilePicUrl?: string },
            FormData
        >({
            query: (formData) => ({
                url: '/staff/profile/me/profile-pic',
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: ['StaffProfile'],
        }),

        // ── Bookings ───────────────────────────────────────────────────────
        getStaffBookings: builder.query<BookingDto[], { page?: number; size?: number }>({
            query: ({ page = 1, size = 100 } = {}) => `/staff/bookings?page=${page}&size=${size}`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Booking' as const, id })), 'Booking']
                    : ['Booking'],
        }),
        getStaffBookingById: builder.query<BookingDto, number>({
            query: (id) => `/staff/bookings/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Booking', id }],
        }),

        // ── Documents ──────────────────────────────────────────────────────
        getBookingDocuments: builder.query<BookingDocumentDto[], number>({
            query: (bookingId) => `/staff/bookings/${bookingId}/documents`,
            providesTags: (_result, _error, bookingId) => [
                { type: 'BookingDocument', id: bookingId },
            ],
        }),
        uploadBookingDocument: builder.mutation<
            BookingDocumentDto,
            { bookingId: number; formData: FormData }
        >({
            query: ({ bookingId, formData }) => ({
                url: `/staff/bookings/${bookingId}/documents`,
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: (_result, _error, { bookingId }) => [
                { type: 'BookingDocument', id: bookingId },
            ],
        }),

        // ── Media (Before/After photos & videos) ───────────────────────────
        getBookingMedia: builder.query<BookingMediaDto[], number>({
            query: (bookingId) => `/staff/bookings/${bookingId}/media`,
            providesTags: (_result, _error, bookingId) => [
                { type: 'BookingMedia', id: bookingId },
            ],
        }),
        uploadBookingMedia: builder.mutation<
            BookingMediaDto,
            { bookingId: number; formData: FormData }
        >({
            query: ({ bookingId, formData }) => ({
                url: `/staff/bookings/${bookingId}/media`,
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: (_result, _error, { bookingId }) => [
                { type: 'BookingMedia', id: bookingId },
            ],
        }),
    }),
});

export const {
    // Auth
    useStaffLoginMutation,
    useStaffLogoutMutation,
    useStaffRefreshTokenMutation,
    // Profile
    useGetStaffProfileQuery,
    useUpdateStaffProfileMutation,
    useChangeStaffPasswordMutation,
    useUploadStaffProfilePicMutation,
    // Bookings
    useGetStaffBookingsQuery,
    useGetStaffBookingByIdQuery,
    // Documents
    useGetBookingDocumentsQuery,
    useUploadBookingDocumentMutation,
    // Media
    useGetBookingMediaQuery,
    useUploadBookingMediaMutation,
} = staffApi;
