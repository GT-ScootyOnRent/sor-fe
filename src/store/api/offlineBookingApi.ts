import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_CONFIG } from '../../config/api.config';
import { setStaffCredentials, staffLogout, type StaffUser } from '../slices/staffAuthSlice';
import { staffRefreshMutex } from './staffApi';

const getOfflineBookingToken = () => (
  localStorage.getItem('staff_token')
  || localStorage.getItem('token')
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
  // Wait for any in-flight refresh (shared with staffApi) before firing the request.
  await staffRefreshMutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  // Only attempt recovery for staff sessions.
  if (result.error && result.error.status === 401 && localStorage.getItem('staff_token')) {
    if (!staffRefreshMutex.isLocked()) {
      // We win the lock: perform a single refresh, then retry the original request.
      const release = await staffRefreshMutex.acquire();
      try {
        const refreshResult = await rawBaseQuery(
          { url: '/staff/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );

        const data = refreshResult.data as
          | { success?: boolean; token?: string; userData?: StaffUser }
          | undefined;

        if (data?.success && data.token && data.userData) {
          localStorage.setItem('staff_token', data.token);
          api.dispatch(setStaffCredentials({ staff: data.userData }));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          forceStaffLogout(api);
        }
      } finally {
        release();
      }
    } else {
      // A refresh is already in progress elsewhere: wait for it, then retry once.
      await staffRefreshMutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

function forceStaffLogout(api: BaseQueryApi) {
  api.dispatch(staffLogout());
  localStorage.removeItem('staff_token');
  localStorage.removeItem('staff_refresh_token');
  localStorage.removeItem('staff');
  localStorage.removeItem('staffId');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

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