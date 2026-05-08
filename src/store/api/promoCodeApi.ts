import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface PromoCodeDto {
  id: number;
  code: string;
  description?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  isFirstRideOnly: boolean;
  isActive: boolean;
  showOnHomepage: boolean;
  validFrom: string;
  validUntil?: string | null; // null = no expiry; backend's expected "empty" value
  cityId?: number | null; // null = global (superadmin), number = city-specific
  createdAt: string;
  updatedAt: string;
}

export interface ValidatePromoCodeDto {
  code: string;
  userId: number;
  orderAmount: number;
  cityId: number;
}

export interface PromoValidationResultDto {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  finalAmount: number;
  promoCodeId?: number;
}

export interface RecordPromoUsageDto {
  userId: number;
  promoCodeId: number;
  bookingId?: number;
}

export const promoCodeApi = createApi({
  reducerPath: 'promoCodeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PromoCode'],
  endpoints: (builder) => ({
    getPromoCodes: builder.query<PromoCodeDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 50 } = {}) =>
        `/PromoCodes?page=${page}&size=${size}`,
      providesTags: ['PromoCode'],
    }),
    getPromoCodeById: builder.query<PromoCodeDto, number>({
      query: (id) => `/PromoCodes/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'PromoCode', id }],
    }),
    createPromoCode: builder.mutation<PromoCodeDto, Omit<PromoCodeDto, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>>({
      query: (dto) => ({
        url: '/PromoCodes',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['PromoCode'],
    }),
    updatePromoCode: builder.mutation<void, { id: number; dto: PromoCodeDto }>({
      query: ({ id, dto }) => ({
        url: `/PromoCodes/${id}`,
        method: 'PUT',
        body: dto,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'PromoCode', id }, 'PromoCode'],
    }),
    deletePromoCode: builder.mutation<void, number>({
      query: (id) => ({
        url: `/PromoCodes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PromoCode'],
    }),
    validatePromoCode: builder.mutation<PromoValidationResultDto, ValidatePromoCodeDto>({
      query: (dto) => ({
        url: '/PromoCodes/validate',
        method: 'POST',
        body: dto,
      }),
    }),
    recordPromoUsage: builder.mutation<void, RecordPromoUsageDto>({
      query: (dto) => ({
        url: 'PromoCodes/record-usage',
        method: 'POST',
        body: dto,
      }),
    }),
    getHomepagePromoCode: builder.query<PromoCodeDto | null, void>({
      query: () => '/PromoCodes/homepage',
      // Handle 204 No Content response
      transformResponse: (response: PromoCodeDto | '') => {
        if (response === '' || response === null || response === undefined) {
          return null;
        }
        return response;
      },
    }),
    getAvailablePromoCodesForCity: builder.query<PromoCodeDto[], number>({
      query: (cityId) => `/PromoCodes/available/${cityId}`,
    }),
  }),
});

export const {
  useGetPromoCodesQuery,
  useGetPromoCodeByIdQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
  useValidatePromoCodeMutation,
  useRecordPromoUsageMutation,
  useGetHomepagePromoCodeQuery,
  useGetAvailablePromoCodesForCityQuery,
} = promoCodeApi;