import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

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
  baseQuery: baseQueryWithReauth,
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
