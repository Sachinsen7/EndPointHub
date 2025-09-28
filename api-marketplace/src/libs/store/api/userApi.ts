import { baseApi } from './baseApi';
import type { ApiKey, CreateApiKeyRequest, Subscription } from '@/types/api';

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getApiKeys: builder.query<{ apiKeys: ApiKey[] }, void>({
            query: () => '/user/api-keys',
            providesTags: (result) =>
                result?.apiKeys
                    ? [
                          ...result.apiKeys.map(({ id }) => ({
                              type: 'ApiKey' as const,
                              id,
                          })),
                          { type: 'ApiKey', id: 'LIST' },
                      ]
                    : [{ type: 'ApiKey', id: 'LIST' }],
        }),

        createApiKey: builder.mutation<
            { message: string; apiKey: ApiKey },
            CreateApiKeyRequest
        >({
            query: (newKey) => ({
                url: '/user/api-keys',
                method: 'POST',
                body: newKey,
            }),
            invalidatesTags: [{ type: 'ApiKey', id: 'LIST' }],
        }),

        updateApiKey: builder.mutation<
            { message: string; apiKey: ApiKey },
            { id: string; data: Partial<CreateApiKeyRequest> }
        >({
            query: ({ id, data }) => ({
                url: `/user/api-keys/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ApiKey', id },
                { type: 'ApiKey', id: 'LIST' },
            ],
        }),

        deleteApiKey: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/user/api-keys/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'ApiKey', id },
                { type: 'ApiKey', id: 'LIST' },
            ],
        }),

        regenerateApiKey: builder.mutation<
            { message: string; apiKey: ApiKey },
            string
        >({
            query: (id) => ({
                url: `/user/api-keys/${id}/regenerate`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'ApiKey', id },
                { type: 'ApiKey', id: 'LIST' },
            ],
        }),

        // Subscriptions Management
        getSubscriptions: builder.query<
            { subscriptions: Subscription[] },
            void
        >({
            query: () => '/user/subscriptions',
            providesTags: (result) =>
                result?.subscriptions
                    ? [
                          ...result.subscriptions.map(({ id }) => ({
                              type: 'Subscription' as const,
                              id,
                          })),
                          { type: 'Subscription', id: 'LIST' },
                      ]
                    : [{ type: 'Subscription', id: 'LIST' }],
        }),

        updateSubscription: builder.mutation<
            { message: string; subscription: Subscription },
            { id: string; planType: string; billingPeriod?: string }
        >({
            query: ({ id, ...body }) => ({
                url: `/user/subscriptions/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Subscription', id },
                { type: 'Subscription', id: 'LIST' },
            ],
        }),

        cancelSubscription: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/user/subscriptions/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Subscription', id },
                { type: 'Subscription', id: 'LIST' },
            ],
        }),

        // Usage and Billing
        getUsageStats: builder.query<any, { period?: string; apiId?: string }>({
            query: (params) => ({
                url: '/user/usage',
                params,
            }),
            providesTags: ['Usage'],
            keepUnusedDataFor: 60, // Short cache for usage stats
        }),

        getBillingHistory: builder.query<
            { invoices: any[]; pagination: any },
            { page?: number; limit?: number }
        >({
            query: ({ page = 1, limit = 10 }) =>
                `/user/billing?page=${page}&limit=${limit}`,
            providesTags: [{ type: 'Usage', id: 'BILLING' }],
        }),

        // Account settings
        updateAccountSettings: builder.mutation<
            { message: string },
            {
                notifications?: boolean;
                newsletter?: boolean;
                twoFactorEnabled?: boolean;
            }
        >({
            query: (settings) => ({
                url: '/user/settings',
                method: 'PUT',
                body: settings,
            }),
            invalidatesTags: ['User'],
        }),

        // Two-factor authentication
        enableTwoFactor: builder.mutation<
            { qrCode: string; backupCodes: string[] },
            void
        >({
            query: () => ({
                url: '/user/2fa/enable',
                method: 'POST',
            }),
        }),

        verifyTwoFactor: builder.mutation<
            { message: string },
            { token: string }
        >({
            query: ({ token }) => ({
                url: '/user/2fa/verify',
                method: 'POST',
                body: { token },
            }),
            invalidatesTags: ['User'],
        }),

        disableTwoFactor: builder.mutation<
            { message: string },
            { token: string }
        >({
            query: ({ token }) => ({
                url: '/user/2fa/disable',
                method: 'POST',
                body: { token },
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const {
    useGetApiKeysQuery,
    useCreateApiKeyMutation,
    useUpdateApiKeyMutation,
    useDeleteApiKeyMutation,
    useRegenerateApiKeyMutation,
    useGetSubscriptionsQuery,
    useUpdateSubscriptionMutation,
    useCancelSubscriptionMutation,
    useGetUsageStatsQuery,
    useLazyGetUsageStatsQuery,
    useGetBillingHistoryQuery,
    useUpdateAccountSettingsMutation,
    useEnableTwoFactorMutation,
    useVerifyTwoFactorMutation,
    useDisableTwoFactorMutation,
} = userApi;
