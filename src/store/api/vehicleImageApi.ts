import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../config/api.config';
import type { RootState } from '../store';

export interface VehicleImageDto {
  id: number;
  vehicleId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export const vehicleImageApi = createApi({
  reducerPath: 'vehicleImageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['VehicleImage'],
  endpoints: (builder) => ({
    getVehicleImages: builder.query<VehicleImageDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 }) => `/VehicleImages?page=${page}&size=${size}`,
      providesTags: ['VehicleImage'],
    }),
    getVehicleImagesByVehicleId: builder.query<VehicleImageDto[], number>({
      query: (vehicleId) => `/VehicleImages/vehicle/${vehicleId}`,
    }),
    createVehicleImage: builder.mutation<VehicleImageDto, Omit<VehicleImageDto, 'id'>>({
      query: (image) => ({
        url: '/VehicleImages',
        method: 'POST',
        body: image,
      }),
      invalidatesTags: ['VehicleImage'],
    }),
    updateVehicleImage: builder.mutation<void, { id: number; image: VehicleImageDto }>({
      query: ({ id, image }) => ({
        url: `/VehicleImages/${id}`,
        method: 'PUT',
        body: image,
      }),
      invalidatesTags: ['VehicleImage'],
    }),
    deleteVehicleImage: builder.mutation<void, number>({
      query: (id) => ({
        url: `/VehicleImages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VehicleImage'],
    }),
  }),
});

export const {
  useGetVehicleImagesQuery,
  useGetVehicleImagesByVehicleIdQuery,
  useCreateVehicleImageMutation,
  useUpdateVehicleImageMutation,
  useDeleteVehicleImageMutation,
} = vehicleImageApi;
