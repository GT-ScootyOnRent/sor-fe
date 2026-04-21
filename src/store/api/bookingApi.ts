import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';
import type { RootState } from '../store';

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
  status: 0 | 1 | 2 | 3;
  friendFamilyContactNumber?: string | null;
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
}

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Booking'],
  endpoints: (builder) => ({
    getBookings: builder.query<BookingDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 10 }) => `${API_ENDPOINTS.BOOKINGS}?page=${page}&size=${size}`,
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
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useGetBookingsByUserIdQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} = bookingApi;