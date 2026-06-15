import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

// Unified checkout coupon validation — resolves promo OR agent codes in one call.
export interface ValidateCouponDto {
  code: string;
  userId?: number;
  orderAmount: number;
  cityId: number;
}

export interface CouponValidationResultDto {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  finalAmount: number;
  code: string;
  isAgent: boolean;
  promoCodeId?: number | null;
  agentId?: number | null;
}

export const couponApi = createApi({
  reducerPath: 'couponApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    validateCoupon: builder.mutation<CouponValidationResultDto, ValidateCouponDto>({
      query: (dto) => ({
        url: '/Coupons/validate',
        method: 'POST',
        body: dto,
      }),
    }),
  }),
});

export const { useValidateCouponMutation } = couponApi;
