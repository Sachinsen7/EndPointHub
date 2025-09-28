import { baseApi } from './baseApi';
import type {
    Api,
    ApiSearchParams,
    ApiSearchResponse,
    CreateApiRequest,
    UpdateApiRequest,
} from '@/types/api';

export const apisApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getApis: builder.query<ApiSearchResponse, ApiSearchParams>({
            query: (params) => ({
                url: '/apis',
                params: {
                    ...params,
                    ...(params.categories && {
                        categories: params.categories.join(','),
                    }),
                    ...(params.tags && { tags: params.tags.join(',') }),
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

        // Get single API with full details
        getApi: builder.query<{ api: Api }, string>({
            query: (id) => `/apis/${id}`,
            providesTags: (result, error, id) => [{ type: 'Api', id }],
        }),

        // Get API by slug
        getApiBySlug: builder.query<{ api: Api }, string>({
            query: (slug) => `/apis/slug/${slug}`,
            providesTags: (result) =>
                result ? [{ type: 'Api', id: result.api.id }] : [],
        }),

        // Create new API
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
        }),

        // Update API
        updateApi: builder.mutation<
            { message: string; api: Api },
            { id: string; data: UpdateApiRequest }
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
        }),

        // Delete API (soft delete)
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

        // Get API documentation
        getApiDocs: builder.query<{ docs: any }, string>({
            query: (id) => `/apis/${id}/docs`,
            keepUnusedDataFor: 600, // Keep docs cache for 10 minutes
        }),

        // Subscribe to API
        subscribeToApi: builder.mutation<
            { message: string; subscription: any },
            { apiId: string; planType: string; billingPeriod?: string }
        >({
            query: ({ apiId, ...body }) => ({
                url: `/apis/${apiId}/subscribe`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Subscription'],
        }),

        // Unsubscribe from API
        unsubscribeFromApi: builder.mutation<{ message: string }, string>({
            query: (apiId) => ({
                url: `/apis/${apiId}/unsubscribe`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Subscription'],
        }),

        // Get popular APIs
        getPopularApis: builder.query<{ apis: Api[] }, { limit?: number }>({
            query: ({ limit = 10 }) => `/apis/popular?limit=${limit}`,
            providesTags: [{ type: 'Api', id: 'POPULAR' }],
            keepUnusedDataFor: 600,
        }),

        // Get APIs by category
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

        // Search APIs with advanced filters
        searchApis: builder.query<
            ApiSearchResponse,
            {
                query: string;
                filters?: Record<string, any>;
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

        // Get user's APIs
        getUserApis: builder.query<{ apis: Api[] }, { userId?: string }>({
            query: ({ userId }) =>
                userId ? `/users/${userId}/apis` : '/user/apis',
            providesTags: [{ type: 'Api', id: 'USER_APIS' }],
        }),

        rateApi: builder.mutation<
            { message: string },
            { apiId: string; rating: number; comment?: string }
        >({
            query: ({ apiId, ...body }) => ({
                url: `/apis/${apiId}/rate`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { apiId }) => [
                { type: 'Api', id: apiId },
                { type: 'Review', id: 'LIST' },
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
    useGetPopularApisQuery,
    useGetApisByCategoryQuery,
    useSearchApisQuery,
    useLazySearchApisQuery,
    useGetUserApisQuery,
    useRateApiMutation,
    useGetApiReviewsQuery,
} = apisApi;
