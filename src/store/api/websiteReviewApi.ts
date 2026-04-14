import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../../src/config/api.config';
import type { RootState } from '../store';

export interface WebsiteReviewDto {
  id: number;
  customerName: string;
  rating: number;
  reviewText: string;
  isActive: boolean;
  displayOrder: number;
}

export const websiteReviewApi = createApi({
  reducerPath: 'websiteReviewApi',
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
  tagTypes: ['WebsiteReview'],
  endpoints: (builder) => ({
    getWebsiteReviews: builder.query<WebsiteReviewDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 } = {}) => `WebsiteReviews?page=${page}&size=${size}`,
      providesTags: ['WebsiteReview'],
    }),
    getActiveWebsiteReviews: builder.query<WebsiteReviewDto[], void>({
      query: () => 'WebsiteReviews/active',
      providesTags: ['WebsiteReview'],
    }),
    createWebsiteReview: builder.mutation<WebsiteReviewDto, Omit<WebsiteReviewDto, 'id'>>({
      query: (review) => ({ url: 'WebsiteReviews', method: 'POST', body: review }),
      invalidatesTags: ['WebsiteReview'],
    }),
    updateWebsiteReview: builder.mutation<void, { id: number; review: WebsiteReviewDto }>({
      query: ({ id, review }) => ({ url: `WebsiteReviews/${id}`, method: 'PUT', body: review }),
      invalidatesTags: ['WebsiteReview'],
    }),
    deleteWebsiteReview: builder.mutation<void, number>({
      query: (id) => ({ url: `WebsiteReviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsiteReview'],
    }),
  }),
});

export const {
  useGetWebsiteReviewsQuery,
  useGetActiveWebsiteReviewsQuery,
  useCreateWebsiteReviewMutation,
  useUpdateWebsiteReviewMutation,
  useDeleteWebsiteReviewMutation,
} = websiteReviewApi;
