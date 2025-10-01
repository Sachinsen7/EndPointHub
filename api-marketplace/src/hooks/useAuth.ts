import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/libs/store/hooks';
import {
    useGetMeQuery,
    useRefreshTokenMutation,
    useLogoutMutation,
} from '@/libs/store/api/authApi';
import {
    setCredentials,
    logout,
    updateActivity,
    sessionTimeout,
    selectCurrentUser,
    selectIsAuthenticated,
    selectSessionExpiry,
    selectLastActivity,
} from '@/libs/store/slices/authSlice';
import { addNotification } from '@/libs/store/slices/uiSlice';
import type { User } from '@/types/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => Promise<void>;
    requireAuth: (redirectTo?: string) => boolean;
    requireRole: (roles: string[], redirectTo?: string) => boolean;
}

export const useAuth = (): AuthState => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const sessionCheckRef = useRef<NodeJS.Timeout>();

    const user = useAppSelector(selectCurrentUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const sessionExpiry = useAppSelector(selectSessionExpiry);
    const lastActivity = useAppSelector(selectLastActivity);

    const { data, error, isLoading } = useGetMeQuery(undefined, {
        skip: !isAuthenticated,
        refetchOnMountOrArgChange: true,
    });

    const [refreshTokenMutation] = useRefreshTokenMutation();
    const [logoutMutation] = useLogoutMutation();

    const SESSION_TIMEOUT = 30 * 60 * 1000;
    const SESSION_WARNING = 5 * 60 * 1000;

    useEffect(() => {
        if (data?.user && isAuthenticated) {
            dispatch(
                setCredentials({
                    user: data.user,
                    accessToken: localStorage.getItem('accessToken') || '',
                    refreshToken: localStorage.getItem('refreshToken') || '',
                })
            );
        }
    }, [data, dispatch, isAuthenticated]);

    useEffect(() => {
        if (error && isAuthenticated) {
            dispatch(logout());
            dispatch(
                addNotification({
                    type: 'error',
                    title: 'Session Expired',
                    message: 'Please log in again to continue.',
                })
            );
            router.push('/login');
        }
    }, [error, dispatch, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated || !localStorage.getItem('refreshToken')) return;

        const attemptRefresh = async () => {
            try {
                const refreshToken = localStorage.getItem('refreshToken')!;
                const response = await refreshTokenMutation({
                    refreshToken,
                }).unwrap();
                dispatch(
                    setCredentials({
                        user: response.user,
                        accessToken: response.accessToken,
                        refreshToken: response.refreshToken || refreshToken,
                    })
                );
                localStorage.setItem('accessToken', response.accessToken);
                localStorage.setItem(
                    'refreshToken',
                    response.refreshToken || refreshToken
                );
            } catch (err) {
                dispatch(logout());
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                router.push('/login');
            }
        };

        if (!localStorage.getItem('accessToken')) {
            attemptRefresh();
        }
    }, [isAuthenticated, dispatch, refreshTokenMutation, router]);

    useEffect(() => {
        if (!isAuthenticated || !lastActivity) return;

        const checkSession = () => {
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;

            if (timeSinceActivity > SESSION_TIMEOUT) {
                dispatch(sessionTimeout());
                dispatch(
                    addNotification({
                        type: 'warning',
                        title: 'Session Expired',
                        message: 'You have been logged out due to inactivity.',
                    })
                );
                router.push('/login');
                return;
            }

            if (timeSinceActivity > SESSION_TIMEOUT - SESSION_WARNING) {
                const remainingMinutes = Math.ceil(
                    (SESSION_TIMEOUT - timeSinceActivity) / 60000
                );
                dispatch(
                    addNotification({
                        type: 'warning',
                        title: 'Session Expiring Soon',
                        message: `Your session will expire in ${remainingMinutes} minutes.`,
                        duration: 10000,
                        actions: [
                            {
                                label: 'Extend Session',
                                action: 'extend-session',
                                primary: true,
                            },
                        ],
                    })
                );
            }
        };

        sessionCheckRef.current = setInterval(checkSession, 60000);

        return () => {
            if (sessionCheckRef.current) {
                clearInterval(sessionCheckRef.current);
            }
        };
    }, [isAuthenticated, lastActivity, dispatch, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const updateLastActivity = () => {
            dispatch(updateActivity());
        };

        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
        ];
        events.forEach((event) => {
            document.addEventListener(event, updateLastActivity, {
                passive: true,
            });
        });

        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, updateLastActivity);
            });
        };
    }, [isAuthenticated, dispatch]);

    const login = useCallback(
        (user: User, accessToken: string, refreshToken: string) => {
            dispatch(setCredentials({ user, accessToken, refreshToken }));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            dispatch(
                addNotification({
                    type: 'success',
                    title: 'Welcome back!',
                    message: `Hello ${user.firstName}, you're now logged in.`,
                })
            );
        },
        [dispatch]
    );

    const logout = useCallback(async () => {
        try {
            await logoutMutation().unwrap();
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            dispatch(logout());
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            dispatch(
                addNotification({
                    type: 'info',
                    title: 'Logged Out',
                    message: 'You have been successfully logged out.',
                })
            );
            router.push('/login');
        }
    }, [dispatch, logoutMutation, router]);

    const requireAuth = useCallback(
        (redirectTo = '/login') => {
            if (!isAuthenticated) {
                dispatch(
                    addNotification({
                        type: 'warning',
                        title: 'Authentication Required',
                        message: 'Please log in to access this page.',
                    })
                );
                router.push(redirectTo);
                return false;
            }
            return true;
        },
        [isAuthenticated, dispatch, router]
    );

    const requireRole = useCallback(
        (roles: string[], redirectTo = '/unauthorized') => {
            if (!isAuthenticated || !user) {
                return requireAuth();
            }

            if (!roles.includes(user.role)) {
                dispatch(
                    addNotification({
                        type: 'error',
                        title: 'Access Denied',
                        message:
                            'You do not have permission to access this resource.',
                    })
                );
                router.push(redirectTo);
                return false;
            }
            return true;
        },
        [isAuthenticated, user, dispatch, router, requireAuth]
    );

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        requireAuth,
        requireRole,
    };
};
