import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/auth';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    lastActivity: number | null;
    sessionExpiry: number | null;
}

const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastActivity: null,
    sessionExpiry: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{
                user: User;
                accessToken: string;
                refreshToken: string;
            }>
        ) => {
            const { user, accessToken, refreshToken } = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            if (refreshToken) {
                state.refreshToken = refreshToken;
            }
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
            state.lastActivity = Date.now();
            state.sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hour
        },

        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        updateActivity: (state) => {
            state.lastActivity = Date.now();
        },

        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
            state.lastActivity = null;
            state.sessionExpiry = null;
        },

        clearError: (state) => {
            state.error = null;
        },

        sessionTimeout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = 'Session expired. Please login again.';
        },
    },
});

export const {
    setCredentials,
    setUser,
    setLoading,
    setError,
    updateActivity,
    logout,
    clearError,
    sessionTimeout,
} = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) =>
    state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
    state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) =>
    state.auth.accessToken;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthLoading = (state: { auth: AuthState }) =>
    state.auth.isLoading;
export const selectSessionExpiry = (state: { auth: AuthState }) =>
    state.auth.sessionExpiry;
export const selectLastActivity = (state: { auth: AuthState }) =>
    state.auth.lastActivity;
