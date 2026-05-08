import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

// Response from GET /api/bookings/{id}/customer-details
export interface UserBookingDetailsResponse {
    bookingId: number;
    guestAddress?: string | null;
    hotelName?: string | null;
    hotelAddress?: string | null;
    drivingLicenseNo?: string | null;
    friendFamilyContactNumber?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

// Request body for POST /api/bookings/{id}/customer-details
export interface UserBookingDetailsRequest {
    address: string;
    hotelName?: string | null;
    hotelAddress?: string | null;
    drivingLicenseNo: string;
    friendFamilyContactNumber?: string | null;
}

export const bookingCustomerDetailsApi = createApi({
    reducerPath: 'bookingCustomerDetailsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['BookingCustomerDetails'],
    endpoints: (builder) => ({
        getBookingCustomerDetails: builder.query<UserBookingDetailsResponse, number>({
            query: (bookingId) => `/bookings/${bookingId}/customer-details`,
            providesTags: (_result, _error, bookingId) => [
                { type: 'BookingCustomerDetails', id: bookingId },
            ],
        }),
        upsertBookingCustomerDetails: builder.mutation<
            UserBookingDetailsResponse,
            { bookingId: number; data: UserBookingDetailsRequest }
        >({
            query: ({ bookingId, data }) => ({
                url: `/bookings/${bookingId}/customer-details`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (_result, _error, { bookingId }) => [
                { type: 'BookingCustomerDetails', id: bookingId },
            ],
        }),
    }),
});

export const {
    useGetBookingCustomerDetailsQuery,
    useUpsertBookingCustomerDetailsMutation,
} = bookingCustomerDetailsApi;
