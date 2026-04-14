import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';
import type { RootState } from '../store';

export interface LocationDto {
  id: number;
  name: string;
  cityId: number;
  latitude?: number;
  longitude?: number;
}

export const locationApi = createApi({
  reducerPath: 'locationApi',
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
  tagTypes: ['Location'],
  endpoints: (builder) => ({
    getLocations: builder.query<LocationDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 }) => `${API_ENDPOINTS.LOCATIONS}?page=${page}&size=${size}`,
      providesTags: ['Location'],
    }),
    getLocationsByCityId: builder.query<LocationDto[], number>({
      query: (cityId) => API_ENDPOINTS.LOCATIONS_BY_CITY(cityId),
      providesTags: ['Location'],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationsByCityIdQuery,
} = locationApi;