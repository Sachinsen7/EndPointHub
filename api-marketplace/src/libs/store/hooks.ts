import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useEffect, useCallback } from 'react';
import type { RootState, AppDispatch } from './index';
import { baseApi } from './api/baseApi';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useApiState = () => {
    const apiState = useAppSelector((state) => state.baseApi);
    const dispatch = useAppDispatch();

    const resetApi = useCallback(() => {
        dispatch(baseApi.util.resetApiState());
    }, [dispatch]);

    const invalidateAll = useCallback(() => {
        dispatch(
            baseApi.util.invalidateTags([
                'User',
                'Api',
                'ApiKey',
                'Subscription',
                'Analytics',
            ])
        );
    }, [dispatch]);

    const prefetchQuery = useCallback(
        (endpoint: string, params?: any) => {
            // @ts-ignore - Dynamic endpoint access
            if (baseApi.endpoints[endpoint]) {
                // @ts-ignore
                dispatch(baseApi.endpoints[endpoint].initiate(params));
            }
        },
        [dispatch]
    );

    return {
        queries: apiState.queries,
        mutations: apiState.mutations,
        resetApi,
        invalidateAll,
        prefetchQuery,
    };
};

// Connection status hook
export const useConnectionStatus = () => {
    const queries = useAppSelector((state) => state.baseApi.queries);

    const pendingQueries = Object.values(queries).filter(
        (query: any) => query?.status === 'pending'
    ).length;

    const failedQueries = Object.values(queries).filter(
        (query: any) => query?.status === 'rejected'
    ).length;

    return {
        isOnline: navigator.onLine,
        pendingRequests: pendingQueries,
        failedRequests: failedQueries,
        hasNetworkError: failedQueries > 0,
    };
};

// Cache management hook
export const useCacheManager = () => {
    const dispatch = useAppDispatch();

    const clearCache = useCallback(
        (tags?: string[]) => {
            if (tags) {
                dispatch(baseApi.util.invalidateTags(tags));
            } else {
                dispatch(baseApi.util.resetApiState());
            }
        },
        [dispatch]
    );

    const prefetchData = useCallback(
        async (endpoints: Array<{ endpoint: string; params?: any }>) => {
            const promises = endpoints.map(({ endpoint, params }) => {
                // @ts-ignore
                return dispatch(baseApi.endpoints[endpoint]?.initiate(params));
            });

            try {
                await Promise.all(promises);
            } catch (error) {
                console.error('Prefetch failed:', error);
            }
        },
        [dispatch]
    );

    const getCacheSize = useCallback(() => {
        const state = store.getState();
        return JSON.stringify(state.baseApi).length;
    }, []);

    return {
        clearCache,
        prefetchData,
        getCacheSize,
    };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
    const queries = useAppSelector((state) => state.baseApi.queries);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const slowQueries = Object.entries(queries).filter(
                ([, query]: [string, any]) => {
                    if (query?.fulfilledTimeStamp && query?.startedTimeStamp) {
                        return (
                            query.fulfilledTimeStamp - query.startedTimeStamp >
                            2000
                        ); // 2 seconds
                    }
                    return false;
                }
            );

            if (slowQueries.length > 0) {
                console.warn(
                    'Slow queries detected:',
                    slowQueries.map(([key]) => key)
                );
            }
        }
    }, [queries]);

    const getQueryStats = useCallback(() => {
        const queryList = Object.values(queries);
        return {
            total: queryList.length,
            pending: queryList.filter((q: any) => q?.status === 'pending')
                .length,
            fulfilled: queryList.filter((q: any) => q?.status === 'fulfilled')
                .length,
            rejected: queryList.filter((q: any) => q?.status === 'rejected')
                .length,
        };
    }, [queries]);

    return {
        getQueryStats,
    };
};
