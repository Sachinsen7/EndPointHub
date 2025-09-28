import { baseApi } from './baseApi';

export interface UsageAnalytics {
    summary: {
        totalRequests: number;
        errorCount: number;
        errorRate: number;
        avgResponseTime: number;
    };
    chartData: Array<{
        timestamp: string;
        apiId: string;
        apiName: string;
        requests: number;
        errors?: number;
        avgResponseTime: number;
    }>;
    period: string;
    dateRange: {
        start: string;
        end: string;
    };
}

export interface AnalyticsQuery {
    period: '24h' | '7d' | '30d' | '90d';
    apiId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    metrics?: string[];
}

export interface RealtimeAnalytics {
    hourlyStats: Array<{
        minute: number;
        apiId: string;
        apiName: string;
        requests: number;
        errors: number;
        avgResponseTime: number;
    }>;
    recentRequests: Array<{
        id: string;
        method: string;
        path: string;
        statusCode: number;
        responseTime: number;
        timestamp: string;
    }>;
    activeApis: Array<{
        id: string;
        name: string;
        category: string;
        requests: number;
        errors: number;
        errorRate: number;
        avgResponseTime: number;
    }>;
    timestamp: string;
}

export interface TopApisResponse {
    apis: Array<{
        id: string;
        name: string;
        category: string;
        requests: number;
        growth: number;
        rating: number;
    }>;
}

export const analyticsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Usage Analytics
        getUsageAnalytics: builder.query<UsageAnalytics, AnalyticsQuery>({
            query: (params) => ({
                url: '/analytics/usage',
                params: {
                    ...params,
                    metrics: params.metrics?.join(','),
                },
            }),
            providesTags: ['Analytics'],
            keepUnusedDataFor: 120,
        }),

        // Real-time Analytics
        getRealtimeAnalytics: builder.query<RealtimeAnalytics, void>({
            query: () => '/analytics/realtime',
            providesTags: ['Analytics'],
            keepUnusedDataFor: 10,
        }),

        // Time Series Data
        getTimeSeriesData: builder.query<
            any,
            { apiId?: string; period: string; groupBy?: string }
        >({
            query: ({ apiId, ...params }) => ({
                url: apiId
                    ? `/analytics/timeseries/${apiId}`
                    : '/analytics/timeseries',
                params,
            }),
            providesTags: (result, error, { apiId }) => [
                { type: 'Analytics', id: apiId || 'GLOBAL' },
            ],
            keepUnusedDataFor: 180,
        }),

        // Top APIs
        getTopApis: builder.query<
            TopApisResponse,
            { period?: string; limit?: number; category?: string }
        >({
            query: (params) => ({
                url: '/analytics/top-apis',
                params,
            }),
            providesTags: ['Analytics'],
            keepUnusedDataFor: 300,
        }),

        // API Performance Metrics
        getApiPerformance: builder.query<
            any,
            { apiId: string; period?: string; metrics?: string[] }
        >({
            query: ({ apiId, ...params }) => ({
                url: `/analytics/apis/${apiId}/performance`,
                params: {
                    ...params,
                    metrics: params.metrics?.join(','),
                },
            }),
            providesTags: (result, error, { apiId }) => [
                { type: 'Analytics', id: `PERFORMANCE_${apiId}` },
            ],
            keepUnusedDataFor: 300,
        }),

        // User Analytics
        getUserAnalytics: builder.query<
            any,
            { userId?: string; period?: string }
        >({
            query: (params) => ({
                url: '/analytics/users',
                params,
            }),
            providesTags: ['Analytics'],
            keepUnusedDataFor: 300,
        }),

        // Geographic Analytics
        getGeographicAnalytics: builder.query<
            any,
            { apiId?: string; period?: string }
        >({
            query: (params) => ({
                url: '/analytics/geographic',
                params,
            }),
            providesTags: ['Analytics'],
            keepUnusedDataFor: 600,
        }),

        // Error Analytics
        getErrorAnalytics: builder.query<
            any,
            { apiId?: string; period?: string; statusCode?: number }
        >({
            query: (params) => ({
                url: '/analytics/errors',
                params,
            }),
            providesTags: ['Analytics'],
            keepUnusedDataFor: 300,
        }),

        getDashboardSummary: builder.query<
            {
                totalApis: number;
                totalRequests: number;
                totalUsers: number;
                avgResponseTime: number;
                errorRate: number;
                topCategories: Array<{ category: string; count: number }>;
            },
            { period?: string }
        >({
            query: (params) => ({
                url: '/analytics/dashboard',
                params,
            }),
            providesTags: ['Analytics'],
            keepUnusedDataFor: 300,
        }),
    }),
});

export const {
    useGetUsageAnalyticsQuery,
    useLazyGetUsageAnalyticsQuery,
    useGetRealtimeAnalyticsQuery,
    useGetTimeSeriesDataQuery,
    useGetTopApisQuery,
    useGetApiPerformanceQuery,
    useGetUserAnalyticsQuery,
    useGetGeographicAnalyticsQuery,
    useGetErrorAnalyticsQuery,
    useGetDashboardSummaryQuery,
} = analyticsApi;
