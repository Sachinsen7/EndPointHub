import { baseApi } from './baseApi';
import type {
    User,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
} from '@/types/auth';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Authentication
        register: builder.mutation<
            { message: string; user: User },
            RegisterRequest
        >({
            query: (credentials) => ({
                url: '/auth/register',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),

        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),

        logout: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: [
                'User',
                'Api',
                'ApiKey',
                'Subscription',
                'Analytics',
            ],
        }),

        refreshToken: builder.mutation<LoginResponse, void>({
            query: () => ({
                url: '/auth/refresh',
                method: 'POST',
            }),
        }),

        // User profile
        getMe: builder.query<{ user: User }, void>({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),

        updateProfile: builder.mutation<{ user: User }, Partial<User>>({
            query: (data) => ({
                url: '/auth/me',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),

        changePassword: builder.mutation<
            { message: string },
            { currentPassword: string; newPassword: string }
        >({
            query: (passwords) => ({
                url: '/auth/change-password',
                method: 'POST',
                body: passwords,
            }),
        }),

        // Email verification
        verifyEmail: builder.mutation<{ message: string }, { token: string }>({
            query: ({ token }) => ({
                url: `/auth/verify-email/${token}`,
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),

        resendVerification: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/resend-verification',
                method: 'POST',
            }),
        }),

        forgotPassword: builder.mutation<
            { message: string },
            { email: string }
        >({
            query: ({ email }) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: { email },
            }),
        }),

        resetPassword: builder.mutation<
            { message: string },
            { token: string; password: string }
        >({
            query: ({ token, password }) => ({
                url: `/auth/reset-password/${token}`,
                method: 'POST',
                body: { password },
            }),
        }),
    }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
    useGetMeQuery,
    useLazyGetMeQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useVerifyEmailMutation,
    useResendVerificationMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = authApi;
