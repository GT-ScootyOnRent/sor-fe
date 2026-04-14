import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';
import type { RootState } from '../store';

export interface CityDto {
  id: number;
  name: string;
  stateId: number;
  isActive: boolean;
  isComingSoon: boolean;
}

export interface CreateCityDto {
  name: string;
  stateId: number;
  isActive: boolean;
  isComingSoon: boolean;
}

export interface StateDto {
  id: number;
  name: string;
  isActive: boolean;
}

export const cityApi = createApi({
  reducerPath: 'cityApi',
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
  tagTypes: ['City', 'State'],
  endpoints: (builder) => ({
    getCities: builder.query<CityDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 }) => `${API_ENDPOINTS.CITIES}?page=${page}&size=${size}`,
      providesTags: ['City'],
    }),
    getCityById: builder.query<CityDto, number>({
      query: (id) => API_ENDPOINTS.CITY_BY_ID(id),
      providesTags: (_result, _error, id) => [{ type: 'City', id }],
    }),
    createCity: builder.mutation<CityDto, CreateCityDto>({
      query: (body) => ({
        url: API_ENDPOINTS.CITIES,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['City'],
    }),
    updateCity: builder.mutation<void, { id: number; city: CityDto }>({
      query: ({ id, city }) => ({
        url: API_ENDPOINTS.CITY_BY_ID(id),
        method: 'PUT',
        body: city,
      }),
      invalidatesTags: ['City'],
    }),
    deleteCity: builder.mutation<void, number>({
      query: (id) => ({
        url: API_ENDPOINTS.CITY_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['City'],
    }),
    getStates: builder.query<StateDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 }) => `${API_ENDPOINTS.STATES}?page=${page}&size=${size}`,
      providesTags: ['State'],
    }),
  }),
});

export const {
  useGetCitiesQuery,
  useGetCityByIdQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useGetStatesQuery,
} = cityApi;