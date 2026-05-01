import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

// ── Types ──────────────────────────────────────────────────────────────────

export type InvestmentAmount = 'below_5_lakh' | 'above_5_lakh';

export type PartnerInquiryStatus =
  | 'new'
  | 'contacted'
  | 'in_progress'
  | 'closed'
  | 'rejected';

export interface CreatePartnerInquiry {
  name: string;
  phoneNumber: string;
  email?: string;
  city: string;
  state: string;
  investmentAmount: InvestmentAmount;
  ownsVehicles: boolean;
  vehicleCount: number | null;
}

export interface PartnerInquiry {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  city: string;
  state: string;
  investmentAmount: InvestmentAmount;
  ownsVehicles: boolean;
  vehicleCount: number | null;
  status: PartnerInquiryStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerInquiryResponse {
  message: string;
  data: { id: number };
}

export interface ListInquiriesArgs {
  page?: number;
  size?: number;
  status?: PartnerInquiryStatus;
  city?: string;
  state?: string;
  startDate?: string; // YYYY-MM-DD (inclusive)
  endDate?: string;   // YYYY-MM-DD (inclusive)
}

export interface UpdateStatusArgs {
  id: number;
  status: PartnerInquiryStatus;
  notes: string | null;
}

// ── API ────────────────────────────────────────────────────────────────────

export const partnerInquiryApi = createApi({
  reducerPath: 'partnerInquiryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PartnerInquiry'],
  endpoints: (builder) => ({
    // Public — submit
    createPartnerInquiry: builder.mutation<CreatePartnerInquiryResponse, CreatePartnerInquiry>({
      query: (form) => ({
        url: 'partner-inquiries',
        method: 'POST',
        body: {
          ...form,
          vehicleCount: form.ownsVehicles ? form.vehicleCount : null,
        },
      }),
      invalidatesTags: ['PartnerInquiry'],
    }),

    // Admin — list
    getPartnerInquiries: builder.query<PartnerInquiry[], ListInquiriesArgs | void>({
      query: (args) => {
        const qs = new URLSearchParams();
        if (args?.page) qs.set('page', String(args.page));
        if (args?.size) qs.set('size', String(args.size));
        if (args?.status) qs.set('status', args.status);
        if (args?.city) qs.set('city', args.city);
        if (args?.state) qs.set('state', args.state);
        if (args?.startDate) qs.set('startDate', args.startDate);
        if (args?.endDate) qs.set('endDate', args.endDate);
        const query = qs.toString();
        return `admin/partner-inquiries${query ? `?${query}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'PartnerInquiry' as const, id: r.id })),
              { type: 'PartnerInquiry' as const, id: 'LIST' },
            ]
          : [{ type: 'PartnerInquiry' as const, id: 'LIST' }],
    }),

    // Admin — detail
    getPartnerInquiryById: builder.query<PartnerInquiry, number>({
      query: (id) => `admin/partner-inquiries/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'PartnerInquiry', id }],
    }),

    // Admin — update status
    updatePartnerInquiryStatus: builder.mutation<PartnerInquiry, UpdateStatusArgs>({
      query: ({ id, status, notes }) => ({
        url: `admin/partner-inquiries/${id}/status`,
        method: 'PUT',
        body: { status, notes },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'PartnerInquiry', id },
        { type: 'PartnerInquiry', id: 'LIST' },
      ],
    }),

    // Admin — delete
    deletePartnerInquiry: builder.mutation<void, number>({
      query: (id) => ({
        url: `admin/partner-inquiries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'PartnerInquiry', id },
        { type: 'PartnerInquiry', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreatePartnerInquiryMutation,
  useGetPartnerInquiriesQuery,
  useGetPartnerInquiryByIdQuery,
  useUpdatePartnerInquiryStatusMutation,
  useDeletePartnerInquiryMutation,
} = partnerInquiryApi;
