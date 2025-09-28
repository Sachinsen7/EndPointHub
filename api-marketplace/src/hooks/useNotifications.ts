import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/libs/store/hooks';
import {
    addNotification,
    removeNotification,
    clearAllNotifications,
    selectNotifications,
    selectNotificationSettings,
    type Notification,
} from '@/libs/store/slices/uiSlice';

interface UseNotificationsReturn {
    notifications: Notification[];
    count: number;
    hasUnread: boolean;

    notify: {
        success: (
            title: string,
            message?: string,
            options?: Partial<Notification>
        ) => string;
        error: (
            title: string,
            message?: string,
            options?: Partial<Notification>
        ) => string;
        warning: (
            title: string,
            message?: string,
            options?: Partial<Notification>
        ) => string;
        info: (
            title: string,
            message?: string,
            options?: Partial<Notification>
        ) => string;
    };
    remove: (id: string) => void;
    clear: () => void;

    enabled: boolean;
    soundEnabled: boolean;
}

export const useNotifications = (): UseNotificationsReturn => {
    const dispatch = useAppDispatch();
    const notifications = useAppSelector(selectNotifications);
    const settings = useAppSelector(selectNotificationSettings);

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        notifications.forEach((notification) => {
            if (
                notification.duration &&
                notification.duration > 0 &&
                !notification.persistent
            ) {
                const timer = setTimeout(() => {
                    dispatch(removeNotification(notification.id));
                }, notification.duration);
                timers.push(timer);
            }
        });

        return () => {
            timers.forEach((timer) => clearTimeout(timer));
        };
    }, [notifications, dispatch]);

    const playNotificationSound = useCallback(
        (type: string) => {
            if (!settings.sound) return;

            try {
                const audioContext = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                const frequencies: Record<string, number> = {
                    success: 800,
                    error: 400,
                    warning: 600,
                    info: 500,
                };

                oscillator.frequency.setValueAtTime(
                    frequencies[type] || 500,
                    audioContext.currentTime
                );
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    audioContext.currentTime + 0.3
                );

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }
        },
        [settings.sound]
    );

    const notify = useCallback(
        {
            success: (
                title: string,
                message?: string,
                options: Partial<Notification> = {}
            ) => {
                if (!settings.enabled) return '';

                const notification: Omit<Notification, 'id' | 'timestamp'> = {
                    type: 'success',
                    title,
                    message,
                    duration: 5000,
                    ...options,
                };

                dispatch(addNotification(notification));
                playNotificationSound('success');

                return notification.id || '';
            },

            error: (
                title: string,
                message?: string,
                options: Partial<Notification> = {}
            ) => {
                const notification: Omit<Notification, 'id' | 'timestamp'> = {
                    type: 'error',
                    title,
                    message,
                    duration: 8000,
                    persistent: true,
                    ...options,
                };

                dispatch(addNotification(notification));
                playNotificationSound('error');

                return notification.id || '';
            },

            warning: (
                title: string,
                message?: string,
                options: Partial<Notification> = {}
            ) => {
                const notification: Omit<Notification, 'id' | 'timestamp'> = {
                    type: 'warning',
                    title,
                    message,
                    duration: 6000,
                    ...options,
                };

                dispatch(addNotification(notification));
                playNotificationSound('warning');

                return notification.id || '';
            },

            info: (
                title: string,
                message?: string,
                options: Partial<Notification> = {}
            ) => {
                if (!settings.enabled) return '';

                const notification: Omit<Notification, 'id' | 'timestamp'> = {
                    type: 'info',
                    title,
                    message,
                    duration: 4000,
                    ...options,
                };

                dispatch(addNotification(notification));
                playNotificationSound('info');

                return notification.id || '';
            },
        },
        [dispatch, settings, playNotificationSound]
    );

    const remove = useCallback(
        (id: string) => {
            dispatch(removeNotification(id));
        },
        [dispatch]
    );

    const clear = useCallback(() => {
        dispatch(clearAllNotifications());
    }, [dispatch]);

    return {
        notifications,
        count: notifications.length,
        hasUnread: notifications.some((n) => n.persistent !== false),

        notify,
        remove,
        clear,

        enabled: settings.enabled,
        soundEnabled: settings.sound,
    };
};
