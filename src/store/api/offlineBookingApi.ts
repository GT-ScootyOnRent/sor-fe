import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_CONFIG } from '../../config/api.config';
import { staffLogout } from '../slices/staffAuthSlice';

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
  friendFamilyContactNumber: string;
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

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = getOfflineBookingToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithStaff401Logout: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // If this call is being made under a staff session and backend returns 401,
  // force staff logout to match staff portal behavior.
  if (result.error && result.error.status === 401 && localStorage.getItem('staff_token')) {
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

export const offlineBookingApi = createApi({
  reducerPath: 'offlineBookingApi',
  baseQuery: baseQueryWithStaff401Logout,
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