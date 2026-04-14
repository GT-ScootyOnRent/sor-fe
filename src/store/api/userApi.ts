import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { API_CONFIG } from '../../config/api.config';

export interface UserDto {
  id: number;
  userNumber: string;
  cityId?: number;
  name?: string;
  email?: string;
}

export const userApi = createApi({
  reducerPath: 'userApi',
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
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<UserDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 10 }) => `/Users?page=${page}&size=${size}`,
      providesTags: ['User'],
    }),
    getUserById: builder.query<UserDto, number>({
      query: (id) => `/Users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<UserDto, Omit<UserDto, 'id'>>({
      query: (user) => ({
        url: '/Users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<void, { id: number; user: UserDto }>({
      query: ({ id, user }) => ({
        url: `/Users/${id}`,
        method: 'PUT',
        body: user,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/Users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),

  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} = userApi;
