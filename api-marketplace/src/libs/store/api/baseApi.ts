// lib/store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/libs/store';
import * as Sentry from '@sentry/nextjs';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    prepareHeaders: (headers, { getState, endpoint, type }) => {
        const state = getState() as RootState;
        const token = state.auth.accessToken;

        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }

        headers.set('x-api-version', '1.0');
        headers.set(
            'x-request-id',
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        );

        if (typeof window !== 'undefined') {
            headers.set('x-user-agent', navigator.userAgent);
        }

        if (type === 'mutation' && !headers.get('content-type')) {
            headers.set('content-type', 'application/json');
        }

        return headers;
    },
    credentials: 'include',
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        console.log('Token expired, attempting refresh...');
        const refreshResult = await baseQuery(
            {
                url: '/auth/refresh',
                method: 'POST',
                body: {
                    refreshToken: (api.getState() as RootState).auth
                        .refreshToken,
                },
            },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            console.log('Token refreshed successfully');
            api.dispatch({
                type: 'auth/setCredentials',
                payload: refreshResult.data,
            });
            result = await baseQuery(args, api, extraOptions);
        } else {
            console.log('Token refresh failed, logging out user');
            api.dispatch({ type: 'auth/logout' });
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }

    if (result.error && result.error.status === 429) {
        const retryAfter = result.meta?.response?.headers?.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        console.log(`Rate limited, retrying after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        result = await baseQuery(args, api, extraOptions);
    }

    if (result.error && result.error.status >= 500) {
        console.log('Server error, retrying...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = await baseQuery(args, api, extraOptions);
    }

    if (result.error) {
        Sentry.captureException(new Error('API Error'), {
            extra: {
                endpoint: args.url || args,
                error: result.error,
                timestamp: new Date().toISOString(),
            },
        });
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'User',
        'Api',
        'ApiKey',
        'Subscription',
        'Usage',
        'Analytics',
        'Review',
        'Health',
        'Link',
        'Category',
        'Plan',
        'Billing',
        'Audit',
    ],
    keepUnusedDataFor: 60,
    refetchOnMountOrArgChange: 30,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    endpoints: () => ({}),
});

export const {
    util: { resetApiState, invalidateTags, prefetch, getRunningQueriesThunk },
    internalActions,
} = baseApi;
