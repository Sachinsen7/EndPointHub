import { baseApi } from './baseApi';

export interface Api {
    id: string;
    name: string;
    description: string;
    baseUrl: string;
    category: string;
    version: string;
    slug: string;
    isPublic: boolean;
    isActive: boolean;
    tags: string[];
    documentation?: string;
    pricing: {
        free: boolean;
        pricePerRequest: number;
        monthlyLimit: number;
    };
    rating: number;
    totalRequests: number;
    createdAt: string;
    updatedAt: string;
    owner: {
        id: string;
        firstName: string;
        lastName: string;
        company?: string;
    };
    subscriberCount?: number;
    reviewCount?: number;
}

export interface ApiSearchParams {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: 'name' | 'rating' | 'totalRequests' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    tags?: string[];
    isPublic?: boolean;
}

export interface ApiSearchResponse {
    apis: Api[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface CreateApiRequest {
    name: string;
    description: string;
    baseUrl: string;
    category: string;
    version?: string;
    isPublic?: boolean;
    pricing: {
        free: boolean;
        pricePerRequest: number;
        monthlyLimit: number;
    };
    documentation?: string;
    tags?: string[];
}

export interface ApiKey {
    id: string;
    name: string;
    description?: string;
    key: string;
    permissions: string[];
    isActive: boolean;
    lastUsedAt?: string;
    expiresAt?: string;
    rateLimit: number;
    createdAt: string;
    _count?: {
        usage: number;
    };
}

export interface CreateApiKeyRequest {
    name: string;
    description?: string;
    expiresAt?: string;
    permissions?: string[];
    rateLimit?: number;
}

export interface Subscription {
    id: string;
    planType: string;
    billingPeriod: string;
    monthlyLimit: number;
    currentUsage: number;
    isActive: boolean;
    startDate: string;
    expiresAt?: string;
    canceledAt?: string;
    createdAt: string;
    api: {
        id: string;
        name: string;
        category: string;
    };
}

export const endpointsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // APIs Management
        getApis: builder.query<ApiSearchResponse, ApiSearchParams>({
            query: (params) => ({
                url: '/apis',
                params: {
                    ...params,
                    tags: params.tags?.join(','),
                },
            }),
            providesTags: (result) =>
                result?.apis
                    ? [
                          ...result.apis.map(({ id }) => ({
                              type: 'Api' as const,
                              id,
                          })),
                          { type: 'Api', id: 'LIST' },
                      ]
                    : [{ type: 'Api', id: 'LIST' }],
            keepUnusedDataFor: 300,
        }),

        getApi: builder.query<{ api: Api }, string>({
            query: (id) => `/apis/${id}`,
            providesTags: (result, error, id) => [{ type: 'Api', id }],
        }),

        getApiBySlug: builder.query<{ api: Api }, string>({
            query: (slug) => `/apis/slug/${slug}`,
            providesTags: (result) =>
                result ? [{ type: 'Api', id: result.api.id }] : [],
        }),

        createApi: builder.mutation<
            { message: string; api: Api },
            CreateApiRequest
        >({
            query: (newApi) => ({
                url: '/apis',
                method: 'POST',
                body: newApi,
            }),
            invalidatesTags: [{ type: 'Api', id: 'LIST' }],
            async onQueryStarted(newApi, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        endpointsApi.util.updateQueryData(
                            'getApis',
                            {},
                            (draft) => {
                                draft.apis.unshift(data.api);
                            }
                        )
                    );
                } catch {}
            },
        }),

        updateApi: builder.mutation<
            { message: string; api: Api },
            { id: string; data: Partial<CreateApiRequest> }
        >({
            query: ({ id, data }) => ({
                url: `/apis/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Api', id },
                { type: 'Api', id: 'LIST' },
            ],
            // Optimistic update
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    endpointsApi.util.updateQueryData('getApi', id, (draft) => {
                        Object.assign(draft.api, data);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),

        deleteApi: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/apis/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Api', id },
                { type: 'Api', id: 'LIST' },
            ],
        }),

        // API Documentation
        getApiDocs: builder.query<{ docs: any }, string>({
            query: (id) => `/apis/${id}/docs`,
            keepUnusedDataFor: 600,
        }),

        // Subscriptions
        subscribeToApi: builder.mutation<
            { message: string; subscription: Subscription },
            { apiId: string; planType: string; billingPeriod?: string }
        >({
            query: ({ apiId, ...body }) => ({
                url: `/apis/${apiId}/subscribe`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Subscription'],
        }),

        unsubscribeFromApi: builder.mutation<{ message: string }, string>({
            query: (apiId) => ({
                url: `/apis/${apiId}/unsubscribe`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Subscription'],
        }),

        // Search
        searchApis: builder.query<
            ApiSearchResponse,
            {
                query: string;
                filters?: ApiSearchParams;
                limit?: number;
                offset?: number;
            }
        >({
            query: ({ query, filters, limit = 20, offset = 0 }) => ({
                url: '/apis/search',
                params: { q: query, limit, offset, ...filters },
            }),
            providesTags: [{ type: 'Api', id: 'SEARCH' }],
            keepUnusedDataFor: 60,
        }),

        // Popular and Featured APIs
        getPopularApis: builder.query<{ apis: Api[] }, { limit?: number }>({
            query: ({ limit = 10 }) => `/apis/popular?limit=${limit}`,
            providesTags: [{ type: 'Api', id: 'POPULAR' }],
            keepUnusedDataFor: 600,
        }),

        getFeaturedApis: builder.query<{ apis: Api[] }, { limit?: number }>({
            query: ({ limit = 6 }) => `/apis/featured?limit=${limit}`,
            providesTags: [{ type: 'Api', id: 'FEATURED' }],
            keepUnusedDataFor: 600,
        }),

        getApisByCategory: builder.query<
            { apis: Api[] },
            { category: string; limit?: number }
        >({
            query: ({ category, limit = 10 }) =>
                `/apis/category/${category}?limit=${limit}`,
            providesTags: (result, error, { category }) => [
                { type: 'Api', id: `CATEGORY_${category}` },
            ],
            keepUnusedDataFor: 300,
        }),

        // API Keys Management
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

        getApiReviews: builder.query<
            { reviews: any[]; pagination: any },
            { apiId: string; page?: number; limit?: number }
        >({
            query: ({ apiId, page = 1, limit = 10 }) =>
                `/apis/${apiId}/reviews?page=${page}&limit=${limit}`,
            providesTags: (result, error, { apiId }) => [
                { type: 'Review', id: `API_${apiId}` },
            ],
        }),

        createReview: builder.mutation<
            { message: string; review: any },
            { apiId: string; rating: number; comment?: string }
        >({
            query: ({ apiId, ...body }) => ({
                url: `/apis/${apiId}/reviews`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { apiId }) => [
                { type: 'Review', id: `API_${apiId}` },
                { type: 'Api', id: apiId },
            ],
        }),
    }),
});

export const {
    useGetApisQuery,
    useLazyGetApisQuery,
    useGetApiQuery,
    useGetApiBySlugQuery,
    useCreateApiMutation,
    useUpdateApiMutation,
    useDeleteApiMutation,
    useGetApiDocsQuery,
    useSubscribeToApiMutation,
    useUnsubscribeFromApiMutation,
    useSearchApisQuery,
    useLazySearchApisQuery,
    useGetPopularApisQuery,
    useGetFeaturedApisQuery,
    useGetApisByCategoryQuery,
    useGetApiKeysQuery,
    useCreateApiKeyMutation,
    useUpdateApiKeyMutation,
    useDeleteApiKeyMutation,
    useRegenerateApiKeyMutation,
    useGetSubscriptionsQuery,
    useUpdateSubscriptionMutation,
    useCancelSubscriptionMutation,
    useGetApiReviewsQuery,
    useCreateReviewMutation,
} = endpointsApi;
