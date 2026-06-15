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

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Booking'],
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
} = bookingApi;