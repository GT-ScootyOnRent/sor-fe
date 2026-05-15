import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface AnnouncementBanner {
  id: number;
  text: string;
  isActive: boolean;
  displayOrder: number;
  createdBy: number | null;
  cityIds: number[]; // empty = global (all cities)
  cityNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementBannerDto {
  text: string;
  displayOrder?: number;
  isActive?: boolean;
  cityIds?: number[];
}

export interface UpdateAnnouncementBannerDto {
  text: string;
  displayOrder?: number;
  isActive?: boolean;
  cityIds?: number[];
}

export const announcementBannerApi = createApi({
  reducerPath: 'announcementBannerApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AnnouncementBanner', 'PublicAnnouncementBanner'],
  endpoints: (builder) => ({
    // ── Public ─────────────────────────────────────────────────────────
    getAnnouncementBanners: builder.query<AnnouncementBanner[], number | void>({
      query: (cityId) => cityId ? `announcement-banners?cityId=${cityId}` : 'announcement-banners',
      providesTags: [{ type: 'PublicAnnouncementBanner', id: 'LIST' }],
    }),

    // ── Admin ──────────────────────────────────────────────────────────
    getAdminAnnouncementBanners: builder.query<AnnouncementBanner[], void>({
      query: () => 'admin/announcement-banners',
      providesTags: (result) =>
        result
          ? [
            ...result.map((b) => ({ type: 'AnnouncementBanner' as const, id: b.id })),
            { type: 'AnnouncementBanner' as const, id: 'LIST' },
          ]
          : [{ type: 'AnnouncementBanner' as const, id: 'LIST' }],
    }),

    getAdminAnnouncementBanner: builder.query<AnnouncementBanner, number>({
      query: (id) => `admin/announcement-banners/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AnnouncementBanner', id }],
    }),

    createAnnouncementBanner: builder.mutation<AnnouncementBanner, CreateAnnouncementBannerDto>({
      query: (body) => ({
        url: 'admin/announcement-banners',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AnnouncementBanner', id: 'LIST' },
        { type: 'PublicAnnouncementBanner', id: 'LIST' },
      ],
    }),

    updateAnnouncementBanner: builder.mutation<AnnouncementBanner, { id: number; body: UpdateAnnouncementBannerDto }>({
      query: ({ id, body }) => ({
        url: `admin/announcement-banners/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AnnouncementBanner', id },
        { type: 'AnnouncementBanner', id: 'LIST' },
        { type: 'PublicAnnouncementBanner', id: 'LIST' },
      ],
    }),

    reorderAnnouncementBanner: builder.mutation<AnnouncementBanner, { id: number; displayOrder: number }>({
      query: ({ id, displayOrder }) => ({
        url: `admin/announcement-banners/${id}/reorder`,
        method: 'PUT',
        body: { displayOrder },
      }),
      invalidatesTags: [
        { type: 'AnnouncementBanner', id: 'LIST' },
        { type: 'PublicAnnouncementBanner', id: 'LIST' },
      ],
    }),

    deleteAnnouncementBanner: builder.mutation<void, number>({
      query: (id) => ({
        url: `admin/announcement-banners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AnnouncementBanner', id: 'LIST' },
        { type: 'PublicAnnouncementBanner', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAnnouncementBannersQuery,
  useGetAdminAnnouncementBannersQuery,
  useGetAdminAnnouncementBannerQuery,
  useCreateAnnouncementBannerMutation,
  useUpdateAnnouncementBannerMutation,
  useReorderAnnouncementBannerMutation,
  useDeleteAnnouncementBannerMutation,
} = announcementBannerApi;
