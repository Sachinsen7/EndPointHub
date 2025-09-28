import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Base API slice (contains all injected endpoints)
import { baseApi } from './api/baseApi';

// Import all API slices to inject endpoints (don't use in reducers)
import './api/authApi';
import './api/endPointsApi';
import './api/analyticsApi';

// Feature slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';

// Persist configuration
const persistConfig = {
    key: 'endpointhub-root',
    storage,
    whitelist: ['auth', 'ui'], // Only persist auth and UI state
    blacklist: ['baseApi'], // Don't persist API cache
    version: 1,
    migrate: (state: any) => {
        // Handle version migrations if needed
        return Promise.resolve(state);
    },
};

// Root reducer
const rootReducer = combineReducers({
    // Single API slice that contains all injected endpoints
    [baseApi.reducerPath]: baseApi.reducer,

    // Feature slices
    auth: authSlice,
    ui: uiSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Custom middleware for enhanced error handling and logging
const errorHandlingMiddleware =
    (store: any) => (next: any) => (action: any) => {
        // Handle API errors globally
        if (action.type?.endsWith('/rejected')) {
            const { payload, meta } = action;

            // Auto logout on 401
            if (payload?.status === 401) {
                console.log('401 detected, logging out user');
                store.dispatch({ type: 'auth/logout' });
            }

            // Log API errors in development
            if (process.env.NODE_ENV === 'development') {
                console.error('API Error:', {
                    endpoint: meta?.arg?.originalArgs || meta?.arg,
                    error: payload,
                    timestamp: new Date().toISOString(),
                });
            }

            // Show user-friendly error notifications
            if (payload?.status >= 500) {
                store.dispatch({
                    type: 'ui/addNotification',
                    payload: {
                        type: 'error',
                        title: 'Server Error',
                        message:
                            'Something went wrong on our end. Please try again.',
                        duration: 5000,
                    },
                });
            } else if (payload?.status === 429) {
                store.dispatch({
                    type: 'ui/addNotification',
                    payload: {
                        type: 'warning',
                        title: 'Rate Limit Exceeded',
                        message:
                            'Too many requests. Please wait a moment before trying again.',
                        duration: 3000,
                    },
                });
            }
        }

        // Handle successful operations
        if (
            action.type?.endsWith('/fulfilled') &&
            action.meta?.arg?.type === 'mutation'
        ) {
            const successMessages = {
                'authApi/login': 'Welcome back!',
                'authApi/register': 'Account created successfully!',
                'endpointsApi/createApi': 'API created successfully!',
                'endpointsApi/updateApi': 'API updated successfully!',
                'endpointsApi/deleteApi': 'API deleted successfully!',
                'endpointsApi/createApiKey': 'API key created successfully!',
                'endpointsApi/subscribeToApi':
                    'Successfully subscribed to API!',
            };

            const message =
                successMessages[action.type.replace('/fulfilled', '')];
            if (message) {
                store.dispatch({
                    type: 'ui/addNotification',
                    payload: {
                        type: 'success',
                        title: 'Success',
                        message,
                        duration: 3000,
                    },
                });
            }
        }

        return next(action);
    };

// Performance monitoring middleware
const performanceMiddleware = (store: any) => (next: any) => (action: any) => {
    if (
        process.env.NODE_ENV === 'development' &&
        action.type?.includes('api/')
    ) {
        const start = performance.now();
        const result = next(action);
        const end = performance.now();

        if (end - start > 100) {
            console.warn(
                `Slow action detected: ${action.type} took ${(end - start).toFixed(2)}ms`
            );
        }

        return result;
    }

    return next(action);
};

// Configure store with enhanced middleware
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/REGISTER',
                    'persist/PURGE',
                    'persist/FLUSH',
                    'persist/PAUSE',
                ],
                // Ignore these paths in state
                ignoredPaths: ['baseApi.queries', 'baseApi.mutations'],
            },
            immutableCheck: {
                warnAfter: 50,
                ignoredPaths: ['baseApi.queries', 'baseApi.mutations'],
            },
        }).concat([
            baseApi.middleware,
            errorHandlingMiddleware,
            performanceMiddleware,
        ]),
    devTools: process.env.NODE_ENV === 'development' && {
        name: 'EndpointHub Store',
        trace: true,
        traceLimit: 25,
        actionSanitizer: (action: any) => ({
            ...action,
            // Sanitize sensitive data in development tools
            payload: action.type?.includes('auth')
                ? { ...action.payload, password: '***HIDDEN***' }
                : action.payload,
        }),
        stateSanitizer: (state: any) => ({
            ...state,
            // Hide sensitive auth data
            auth: state.auth
                ? {
                      ...state.auth,
                      accessToken: state.auth.accessToken
                          ? '***TOKEN***'
                          : null,
                      refreshToken: state.auth.refreshToken
                          ? '***TOKEN***'
                          : null,
                  }
                : state.auth,
        }),
    },
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export const persistor = persistStore(store, {
    writeFailHandler: (error) => {
        console.error('Redux persist write failed:', error);
    },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Utility functions
export const resetStore = () => {
    store.dispatch(baseApi.util.resetApiState());
    persistor.purge();
};

export const prefetchData = async () => {
    // Prefetch critical data
    const promises = [
        store.dispatch(baseApi.endpoints.getMe.initiate()),
        store.dispatch(baseApi.endpoints.getPopularApis.initiate({ limit: 6 })),
        store.dispatch(
            baseApi.endpoints.getFeaturedApis.initiate({ limit: 4 })
        ),
    ];

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error('Failed to prefetch data:', error);
    }
};
