import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface Agent {
  id: number;
  name: string;
  email?: string | null;
  phoneNumber: string;
  description?: string | null;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  validFrom: string;
  validUntil?: string | null;
  commissionType: 'percentage' | 'flat';
  commissionValue: number;
  isActive: boolean;
  cityIds: number[]; // empty = global (all cities)
  cityNames: string[];
  // Usage & commission summary
  usageCount: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentDto {
  name: string;
  email?: string | null;
  phoneNumber: string;
  description?: string | null;
  code?: string; // optional manual override; backend auto-generates when empty
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  validFrom: string;
  validUntil?: string | null;
  commissionType: 'percentage' | 'flat';
  commissionValue: number;
  isActive: boolean;
  cityIds: number[];
}

export interface UpdateAgentDto extends Omit<CreateAgentDto, 'code'> {
  code: string;
}

export interface AgentUsage {
  id: number;
  agentId: number;
  bookingId?: number | null;
  userId?: number | null;
  orderAmount: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  usedAt: string;
}

export interface ValidateAgentCodeDto {
  code: string;
  userId?: number;
  orderAmount: number;
  cityId: number;
}

export interface AgentCodeValidationResultDto {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  finalAmount: number;
  agentId?: number;
  code?: string;
}

export interface RecordAgentUsageDto {
  code: string;
  userId?: number;
  bookingId?: number;
  orderAmount: number;
}

// ── API ─────────────────────────────────────────────────────────────────

export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Agent', 'AgentUsage'],
  endpoints: (builder) => ({
    getAgents: builder.query<Agent[], void>({
      query: () => '/Agents',
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: 'Agent' as const, id: a.id })),
              { type: 'Agent' as const, id: 'LIST' },
            ]
          : [{ type: 'Agent' as const, id: 'LIST' }],
    }),
    getAgentById: builder.query<Agent, number>({
      query: (id) => `/Agents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Agent', id }],
    }),
    generateAgentCode: builder.query<{ code: string }, { name: string; discountValue: number }>({
      query: ({ name, discountValue }) =>
        `/Agents/generate-code?name=${encodeURIComponent(name)}&discountValue=${discountValue}`,
    }),
    // Live uniqueness check for the form: returns { available, suggestion }.
    checkAgentCode: builder.query<{ available: boolean; suggestion: string }, { code: string; excludeId?: number }>({
      query: ({ code, excludeId }) =>
        `/Agents/check-code?code=${encodeURIComponent(code)}${excludeId != null ? `&excludeId=${excludeId}` : ''}`,
    }),
    createAgent: builder.mutation<Agent, CreateAgentDto>({
      query: (body) => ({
        url: '/Agents',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }],
    }),
    updateAgent: builder.mutation<Agent, { id: number; body: UpdateAgentDto }>({
      query: ({ id, body }) => ({
        url: `/Agents/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Agent', id },
        { type: 'Agent', id: 'LIST' },
      ],
    }),
    deleteAgent: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Agents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }],
    }),

    // ── SuperAdmin commission settlement ──
    getAgentUsages: builder.query<AgentUsage[], number>({
      query: (agentId) => `/Agents/${agentId}/usages`,
      providesTags: (_r, _e, agentId) => [{ type: 'AgentUsage', id: agentId }],
    }),
    updateAgentUsageStatus: builder.mutation<void, { usageId: number; agentId: number; status: 'pending' | 'paid' }>({
      query: ({ usageId, status }) => ({
        url: `/Agents/usages/${usageId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { agentId }) => [
        { type: 'AgentUsage', id: agentId },
        { type: 'Agent', id: agentId },
        { type: 'Agent', id: 'LIST' },
      ],
    }),

    // ── Public: agent coupons available for a city (global + city-targeted) ──
    getAvailableAgentsForCity: builder.query<Agent[], number>({
      query: (cityId) => `/Agents/available/${cityId}`,
    }),

    // ── Public checkout ──
    validateAgentCode: builder.mutation<AgentCodeValidationResultDto, ValidateAgentCodeDto>({
      query: (dto) => ({
        url: '/Agents/validate',
        method: 'POST',
        body: dto,
      }),
    }),
    recordAgentUsage: builder.mutation<void, RecordAgentUsageDto>({
      query: (dto) => ({
        url: '/Agents/record-usage',
        method: 'POST',
        body: dto,
      }),
    }),
  }),
});

export const {
  useGetAgentsQuery,
  useGetAgentByIdQuery,
  useLazyGenerateAgentCodeQuery,
  useLazyCheckAgentCodeQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  useGetAgentUsagesQuery,
  useUpdateAgentUsageStatusMutation,
  useGetAvailableAgentsForCityQuery,
  useValidateAgentCodeMutation,
  useRecordAgentUsageMutation,
} = agentApi;
