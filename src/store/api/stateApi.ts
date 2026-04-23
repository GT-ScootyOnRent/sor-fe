import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';
import type { RootState } from '../store';

export interface StateDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateStateDto {
  name: string;
  isActive: boolean;
}

export const stateApi = createApi({
  reducerPath: 'stateApi',
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
  tagTypes: ['State'],
  endpoints: (builder) => ({
    getStates: builder.query<StateDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 100 }) => `${API_ENDPOINTS.STATES}?page=${page}&size=${size}`,
      providesTags: ['State'],
    }),
    getStateById: builder.query<StateDto, number>({
      query: (id) => API_ENDPOINTS.STATE_BY_ID(id),
      providesTags: (_result, _error, id) => [{ type: 'State', id }],
    }),
    createState: builder.mutation<StateDto, CreateStateDto>({
      query: (body) => ({
        url: API_ENDPOINTS.STATES,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['State'],
    }),
    updateState: builder.mutation<void, { id: number; state: StateDto }>({
      query: ({ id, state }) => ({
        url: API_ENDPOINTS.STATE_BY_ID(id),
        method: 'PUT',
        body: state,
      }),
      invalidatesTags: ['State'],
    }),
    deleteState: builder.mutation<void, number>({
      query: (id) => ({
        url: API_ENDPOINTS.STATE_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['State'],
    }),
  }),
});

export const {
  useGetStatesQuery,
  useGetStateByIdQuery,
  useCreateStateMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} = stateApi;
