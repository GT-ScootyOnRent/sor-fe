import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContactDto {
  id: number;
  cityId: number | null;
  name: string;
  phoneNumber: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactPayload {
  cityId: number | null;
  name: string;
  phoneNumber: string;
  isDefault: boolean;
}

export type UpdateContactPayload = CreateContactPayload;

// ── API ────────────────────────────────────────────────────────────────────

export const contactApi = createApi({
  reducerPath: 'contactApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Contact', 'PublicContact'],
  endpoints: (builder) => ({
    // Public — fetch contact for a city (falls back to default server-side)
    getPublicContact: builder.query<ContactDto, { cityId?: number | null }>({
      query: ({ cityId }) => ({
        url: 'contacts',
        params: cityId ? { cityId } : undefined,
      }),
      providesTags: (_result, _err, arg) => [
        { type: 'PublicContact', id: arg.cityId ?? 'DEFAULT' },
      ],
    }),

    // Admin — list all
    getAdminContacts: builder.query<ContactDto[], void>({
      query: () => 'admin/contacts',
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Contact' as const, id: c.id })),
              { type: 'Contact' as const, id: 'LIST' },
            ]
          : [{ type: 'Contact' as const, id: 'LIST' }],
    }),

    // Admin — single
    getAdminContactById: builder.query<ContactDto, number>({
      query: (id) => `admin/contacts/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Contact', id }],
    }),

    // Admin — create
    createContact: builder.mutation<ContactDto, CreateContactPayload>({
      query: (body) => ({
        url: 'admin/contacts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Contact', id: 'LIST' },
        { type: 'PublicContact', id: 'DEFAULT' },
      ],
    }),

    // Admin — update
    updateContact: builder.mutation<ContactDto, { id: number; body: UpdateContactPayload }>({
      query: ({ id, body }) => ({
        url: `admin/contacts/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
        { type: 'PublicContact', id: 'DEFAULT' },
      ],
    }),

    // Admin — delete
    deleteContact: builder.mutation<void, number>({
      query: (id) => ({
        url: `admin/contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
        { type: 'PublicContact', id: 'DEFAULT' },
      ],
    }),
  }),
});

export const {
  useGetPublicContactQuery,
  useGetAdminContactsQuery,
  useGetAdminContactByIdQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = contactApi;
