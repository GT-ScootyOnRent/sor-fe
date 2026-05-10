import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface HeroBanner {
  id: number;
  imageUrl: string;
  displayOrder: number;
  durationMs: number;

  title: string | null;
  subtitle: string | null;

  isActive: boolean;
  cityIds: number[]; // empty = global (all cities)
  cityNames: string[];

  objectPosition?: {
    x: number;
    y: number;
  };

  createdAt: string;
  updatedAt: string;
}

// Normalize response to handle both old (cityId) and new (cityIds) API formats
const normalizeHeroBanner = (b: any): HeroBanner => ({
  ...b,
  cityIds: b.cityIds ?? (b.cityId != null ? [b.cityId] : []),
  cityNames: b.cityNames ?? (b.cityName ? [b.cityName] : []),
});

export const heroBannerApi = createApi({
  reducerPath: 'heroBannerApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['HeroBanner', 'PublicHeroBanner'],
  endpoints: (builder) => ({
    // ── Public ─────────────────────────────────────────────────────────
    getHeroBanners: builder.query<HeroBanner[], number | void>({
      query: (cityId) => cityId ? `hero-banners?cityId=${cityId}` : 'hero-banners',
      transformResponse: (response: any[]) => response.map(normalizeHeroBanner),
      providesTags: [{ type: 'PublicHeroBanner', id: 'LIST' }],
    }),

    // ── Admin ──────────────────────────────────────────────────────────
    getAdminHeroBanners: builder.query<HeroBanner[], void>({
      query: () => 'admin/hero-banners',
      transformResponse: (response: any[]) => response.map(normalizeHeroBanner),
      providesTags: (result) =>
        result
          ? [
            ...result.map((b) => ({ type: 'HeroBanner' as const, id: b.id })),
            { type: 'HeroBanner' as const, id: 'LIST' },
          ]
          : [{ type: 'HeroBanner' as const, id: 'LIST' }],
    }),

    getAdminHeroBanner: builder.query<HeroBanner, number>({
      query: (id) => `admin/hero-banners/${id}`,
      transformResponse: normalizeHeroBanner,
      providesTags: (_r, _e, id) => [{ type: 'HeroBanner', id }],
    }),

    createHeroBanner: builder.mutation<HeroBanner, FormData>({
      query: (formData) => ({
        url: 'admin/hero-banners',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      transformResponse: normalizeHeroBanner,
      invalidatesTags: [
        { type: 'HeroBanner', id: 'LIST' },
        { type: 'PublicHeroBanner', id: 'LIST' },
      ],
    }),

    updateHeroBanner: builder.mutation<HeroBanner, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `admin/hero-banners/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      transformResponse: normalizeHeroBanner,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'HeroBanner', id },
        { type: 'HeroBanner', id: 'LIST' },
        { type: 'PublicHeroBanner', id: 'LIST' },
      ],
    }),

    reorderHeroBanner: builder.mutation<HeroBanner, { id: number; displayOrder: number }>({
      query: ({ id, displayOrder }) => ({
        url: `admin/hero-banners/${id}/reorder`,
        method: 'PUT',
        body: { displayOrder },
      }),
      invalidatesTags: [
        { type: 'HeroBanner', id: 'LIST' },
        { type: 'PublicHeroBanner', id: 'LIST' },
      ],
    }),

    deleteHeroBanner: builder.mutation<void, number>({
      query: (id) => ({
        url: `admin/hero-banners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'HeroBanner', id },
        { type: 'HeroBanner', id: 'LIST' },
        { type: 'PublicHeroBanner', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHeroBannersQuery,
  useGetAdminHeroBannersQuery,
  useGetAdminHeroBannerQuery,
  useCreateHeroBannerMutation,
  useUpdateHeroBannerMutation,
  useReorderHeroBannerMutation,
  useDeleteHeroBannerMutation,
} = heroBannerApi;