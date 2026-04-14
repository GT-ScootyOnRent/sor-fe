import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../../src/config/api.config';
import type { RootState } from '../store';

export interface InitiatePaymentRequest {
  bookingId: number;
  userId: number;
  amount: number;
  userName: string;
  userEmail: string;
  userPhone: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  paymentUrl: string;
  accessKey: string;
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (data) => ({
        url: 'Payments/initiate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const { useInitiatePaymentMutation } = paymentApi;
