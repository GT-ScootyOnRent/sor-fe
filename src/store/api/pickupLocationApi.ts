import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import APICONFIG from '../../config/api.config';

export interface PickupLocationDto {
  id: number;
  name: string;
  cityId: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  displayOrder: number;
}

export const pickupLocationApi = createApi({
  reducerPath: 'pickupLocationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: APICONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['PickupLocation'],
  endpoints: (builder) => ({
    // User-facing
    getPickupLocationsByCity: builder.query<PickupLocationDto[], number>({
      query: (cityId) => `PickupLocations/city/${cityId}`,
      providesTags: ['PickupLocation'],
    }),
    getActivePickupLocationsByCity: builder.query<PickupLocationDto[], number>({
      query: (cityId) => `PickupLocations/city/${cityId}/active`,
      providesTags: ['PickupLocation'],
    }),
    // Admin-facing
    getAllPickupLocations: builder.query<PickupLocationDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 } = {}) =>
        `PickupLocations?page=${page}&size=${size}`,
      providesTags: ['PickupLocation'],
    }),
    getPickupLocationById: builder.query<PickupLocationDto, number>({
      query: (id) => `PickupLocations/${id}`,
      providesTags: ['PickupLocation'],
    }),
    createPickupLocation: builder.mutation<PickupLocationDto, Partial<PickupLocationDto>>({
      query: (body) => ({ url: 'PickupLocations', method: 'POST', body }),
      invalidatesTags: ['PickupLocation'],
    }),
    updatePickupLocation: builder.mutation<void, { id: number; body: Partial<PickupLocationDto> }>({
      query: ({ id, body }) => ({ url: `PickupLocations/${id}`, method: 'PUT', body }),
      invalidatesTags: ['PickupLocation'],
    }),
    deletePickupLocation: builder.mutation<void, number>({
      query: (id) => ({ url: `PickupLocations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PickupLocation'],
    }),
  }),
});

export const {
  useGetPickupLocationsByCityQuery,
  useGetActivePickupLocationsByCityQuery,
  useGetAllPickupLocationsQuery,
  useGetPickupLocationByIdQuery,
  useCreatePickupLocationMutation,
  useUpdatePickupLocationMutation,
  useDeletePickupLocationMutation,
} = pickupLocationApi;