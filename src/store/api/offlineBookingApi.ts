import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../config/api.config';

const getOfflineBookingToken = () => (
  localStorage.getItem('staff_token')
  || localStorage.getItem('token')
  || localStorage.getItem('adminToken')
);

export interface OfflineBookingDocumentDto {
  documentType: string;
  fileUrl: string;
  fileType: string;
  label?: string;
}

export interface UploadOfflineBookingDocumentResponseDto {
  fileUrl: string;
  fileType: string;
  fileName: string;
}

export interface CreateOfflineBookingDto {
  guestPhone: string;
  guestName?: string;
  guestAddress?: string;
  hotelName?: string;
  hotelAddress?: string;
  pickupLocationId: number;
  bookingStartDate: string;   // DateOnly as "YYYY-MM-DD"
  bookingEndDate: string;     // DateOnly as "YYYY-MM-DD"
  startTime: string;          // TimeOnly as "HH:mm:ss"
  endTime: string;            // TimeOnly as "HH:mm:ss"
  totalAmount: number;
  rate: number;
  primaryVehicleId: number;
  vehicleNumbers: string[];
  numberOfVehicles: number;
  numberOfDays: number;
  openingKm?: number;
  closingKm?: number;
  openingKms?: Array<number | null>;
  closingKms?: Array<number | null>;
  securityAmount?: number;
  drivingLicenseNo?: string;
  idType?: string;
  idNumber?: string;
  documents: OfflineBookingDocumentDto[];
}

export interface CreateOfflineBookingResponseDto {
  success: boolean;
  message: string;
  bookingId?: number;
  userId?: number;
  paymentId?: number;
}

export const offlineBookingApi = createApi({
  reducerPath: 'offlineBookingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = getOfflineBookingToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadOfflineBookingDocument: builder.mutation<UploadOfflineBookingDocumentResponseDto, FormData>({
      query: (formData) => ({
        url: 'OfflineBookings/upload-document',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),
    createOfflineBooking: builder.mutation<CreateOfflineBookingResponseDto, CreateOfflineBookingDto>({
      query: (dto) => ({
        url: 'OfflineBookings',
        method: 'POST',
        body: dto,
      }),
    }),
  }),
});

export const {
  useCreateOfflineBookingMutation,
  useUploadOfflineBookingDocumentMutation,
} = offlineBookingApi;