import { createApi } from '@reduxjs/toolkit/query/react';
import { API_ENDPOINTS } from '../../config/api.config';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface BookingDto {
  id?: number;
  vehicleId: number;
  userId: number;
  pickupLocationId?: number;
  paymentId?: number;
  bookingStartDate: string;
  bookingEndDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  includeSecondHelmet?: boolean;
  securityDepositMode?: 'online' | 'pickup'; // 'online' = paid with booking, 'pickup' = cash at pickup
  status: 0 | 1 | 2 | 3;
  friendFamilyContactNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Vehicle details (enriched from backend)
  vehicleName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleRegistrationNumber?: string;
  vehiclePrimaryImageUrl?: string;
  // Location details
  pickupLocationName?: string;
  // Payment details
  transactionId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | null;
}

export interface CreateBookingRequest {
  vehicleId: number;
  userId: number;
  pickupLocationId?: number;
  bookingStartDate: string;
  bookingEndDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  includeSecondHelmet?: boolean;
  securityDepositMode?: 'online' | 'pickup';
  appliedAgentCode?: string | null; // agent referral code applied at checkout (commission recorded on payment success)
  agentOrderAmount?: number | null; // pre-discount subtotal the agent earns commission on
}

export interface BookingRestoreRequestDto {
  id: number;
  bookingId: number;
  requestedByStaffId?: number | null;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  restoredStatus?: number | null;
  resolvedByAdminId?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface BookingUploadPermissionRequestDto {
  id: number;
  bookingId: number;
  requestedByStaffId?: number | null;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  resolvedByAdminId?: number | null;
  resolvedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Booking', 'RestoreRequest', 'UploadPermission'],
  endpoints: (builder) => ({
    getBookings: builder.query<BookingDto[], { page?: number; size?: number; cityId?: number }>({
      query: ({ page = 1, size = 10, cityId }) => {
        let url = `${API_ENDPOINTS.BOOKINGS}?page=${page}&size=${size}`;
        if (cityId) {
          url += `&cityId=${cityId}`;
        }
        return url;
      },
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query<BookingDto, number>({
      query: (id) => API_ENDPOINTS.BOOKING_BY_ID(id),

    }),
    getBookingsByUserId: builder.query<BookingDto[], number>({
      query: (userId) => API_ENDPOINTS.BOOKINGS_BY_USER(userId),
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation<BookingDto, CreateBookingRequest>({
      query: (booking) => ({
        url: API_ENDPOINTS.BOOKINGS,
        method: 'POST',
        body: booking,
      }),
      invalidatesTags: ['Booking'],
    }),
    updateBooking: builder.mutation<void, { id: number; booking: BookingDto }>({
      query: ({ id, booking }) => ({
        url: API_ENDPOINTS.BOOKING_BY_ID(id),
        method: 'PUT',
        body: booking,
      }),

    }),
    deleteBooking: builder.mutation<void, number>({
      query: (id) => ({
        url: API_ENDPOINTS.BOOKING_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Booking'],
    }),
    superAdminCancelBooking: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/${id}/admin-cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Booking'],
    }),
    superAdminRestoreBooking: builder.mutation<{ message: string }, { id: number; status: 0 | 1 }>({
      query: ({ id, status }) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/${id}/admin-restore`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['Booking'],
    }),
    getRestoreRequests: builder.query<BookingRestoreRequestDto[], { status?: string } | void>({
      query: (arg) => {
        const status = arg && 'status' in arg ? arg.status : undefined;
        return `${API_ENDPOINTS.BOOKINGS}/restore-requests${status ? `?status=${status}` : ''}`;
      },
      providesTags: ['RestoreRequest'],
    }),
    approveRestoreRequest: builder.mutation<{ message: string }, { requestId: number; status: 0 | 1 }>({
      query: ({ requestId, status }) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/restore-requests/${requestId}/approve`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['Booking', 'RestoreRequest'],
    }),
    rejectRestoreRequest: builder.mutation<{ message: string }, number>({
      query: (requestId) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/restore-requests/${requestId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['RestoreRequest'],
    }),
    getUploadPermissionRequests: builder.query<BookingUploadPermissionRequestDto[], { status?: string } | void>({
      query: (arg) => {
        const status = arg && 'status' in arg ? arg.status : undefined;
        return `${API_ENDPOINTS.BOOKINGS}/upload-permission-requests${status ? `?status=${status}` : ''}`;
      },
      providesTags: ['UploadPermission'],
    }),
    approveUploadPermissionRequest: builder.mutation<{ message: string }, number>({
      query: (requestId) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/upload-permission-requests/${requestId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['UploadPermission'],
    }),
    rejectUploadPermissionRequest: builder.mutation<{ message: string }, number>({
      query: (requestId) => ({
        url: `${API_ENDPOINTS.BOOKINGS}/upload-permission-requests/${requestId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['UploadPermission'],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useGetBookingsByUserIdQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useCancelBookingMutation,
  useSuperAdminCancelBookingMutation,
  useSuperAdminRestoreBookingMutation,
  useGetRestoreRequestsQuery,
  useApproveRestoreRequestMutation,
  useRejectRestoreRequestMutation,
  useGetUploadPermissionRequestsQuery,
  useApproveUploadPermissionRequestMutation,
  useRejectUploadPermissionRequestMutation,
} = bookingApi;