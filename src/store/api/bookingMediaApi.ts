import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface BookingMediaDto {
  id: number;
  bookingId: number;
  mediaType: string; // 'video_before', 'video_after', 'photo_before', 'photo_after'
  fileUrl: string;
  fileName?: string;
  fileSizeBytes?: number;
  uploadedByAdminId?: number;
  uploadedByStaffId?: number;
  uploadedByUserId?: number;
  uploadedByName?: string;
  uploaderType?: 'admin' | 'staff' | 'user';
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface UploadMediaResponse {
  success: boolean;
  media: BookingMediaDto;
}

export const bookingMediaApi = createApi({
  reducerPath: 'bookingMediaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['BookingMedia'],
  endpoints: (builder) => ({
    // Get all media for a booking
    getBookingMedia: builder.query<BookingMediaDto[], number>({
      query: (bookingId) => `/Bookings/${bookingId}/media`,
      providesTags: (_result, _error, bookingId) => [{ type: 'BookingMedia', id: bookingId }],
    }),

    // Upload video for a booking (user)
    uploadBookingVideo: builder.mutation<UploadMediaResponse, { bookingId: number; file: File; mediaType: 'video_before' | 'video_after' }>({
      query: ({ bookingId, file, mediaType }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mediaType', mediaType);
        return {
          url: `/Bookings/${bookingId}/media`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { bookingId }) => [{ type: 'BookingMedia', id: bookingId }],
    }),

    // Soft delete media (user can only delete their own)
    deleteBookingMedia: builder.mutation<{ success: boolean; message: string }, { bookingId: number; mediaId: number }>({
      query: ({ bookingId, mediaId }) => ({
        url: `/Bookings/${bookingId}/media/${mediaId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { bookingId }) => [{ type: 'BookingMedia', id: bookingId }],
    }),
  }),
});

export const {
  useGetBookingMediaQuery,
  useUploadBookingVideoMutation,
  useDeleteBookingMediaMutation,
} = bookingMediaApi;
