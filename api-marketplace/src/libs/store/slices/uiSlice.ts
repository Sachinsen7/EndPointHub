import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
    actions?: Array<{
        label: string;
        action: string;
        primary?: boolean;
    }>;
    timestamp: number;
}

interface UIState {
    theme: 'light' | 'dark' | 'system';
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    loading: Record<string, boolean>;
    modals: Record<string, boolean>;
    notifications: Notification[];
    notificationSettings: {
        enabled: boolean;
        sound: boolean;
    };
    preferences: {
        language: string;
        timezone: string;
        dateFormat: string;
    };
}
const initialState: UIState = {
    theme: 'system',
    sidebarOpen: false,
    sidebarCollapsed: false,
    loading: {},
    modals: {},
    notifications: [],
    notificationSettings: {
        enabled: true,
        sound: false,
    },
    preferences: {
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MMM d, yyyy',
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setTheme: (
            state,
            action: PayloadAction<'light' | 'dark' | 'system'>
        ) => {
            state.theme = action.payload;
        },

        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },

        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },

        toggleSidebarCollapsed: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },

        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.sidebarCollapsed = action.payload;
        },

        setLoading: (
            state,
            action: PayloadAction<{ key: string; loading: boolean }>
        ) => {
            const { key, loading } = action.payload;
            if (loading) {
                state.loading[key] = true;
            } else {
                delete state.loading[key];
            }
        },

        clearAllLoading: (state) => {
            state.loading = {};
        },

        openModal: (state, action: PayloadAction<string>) => {
            state.modals[action.payload] = true;
        },

        closeModal: (state, action: PayloadAction<string>) => {
            delete state.modals[action.payload];
        },

        closeAllModals: (state) => {
            state.modals = {};
        },

        addNotification: (
            state,
            action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>
        ) => {
            const notification: Notification = {
                ...action.payload,
                id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            };

            state.notifications.unshift(notification);

            // Keep only last 10 notifications
            if (state.notifications.length > 10) {
                state.notifications = state.notifications.slice(0, 10);
            }
        },

        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== action.payload
            );
        },

        clearAllNotifications: (state) => {
            state.notifications = [];
        },

        updateNotificationSettings: (
            state,
            action: PayloadAction<Partial<UIState['notificationSettings']>>
        ) => {
            state.notificationSettings = {
                ...state.notificationSettings,
                ...action.payload,
            };
        },

        updatePreferences: (
            state,
            action: PayloadAction<Partial<UIState['preferences']>>
        ) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },
    },
});

export const {
    setTheme,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    setLoading,
    clearAllLoading,
    openModal,
    closeModal,
    closeAllModals,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotificationSettings,
    updatePreferences,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarOpen = (state: { ui: UIState }) =>
    state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UIState }) =>
    state.ui.sidebarCollapsed;
export const selectLoading = (key: string) => (state: { ui: UIState }) =>
    state.ui.loading[key] || false;
export const selectModal = (key: string) => (state: { ui: UIState }) =>
    state.ui.modals[key] || false;
export const selectNotifications = (state: { ui: UIState }) =>
    state.ui.notifications;
export const selectNotificationSettings = (state: { ui: UIState }) =>
    state.ui.notificationSettings;
export const selectPreferences = (state: { ui: UIState }) =>
    state.ui.preferences;

// Advanced selectors
export const selectUnreadNotifications = (state: { ui: UIState }) =>
    state.ui.notifications.filter((n) => n.persistent !== false);

export const selectNotificationCount = (state: { ui: UIState }) =>
    state.ui.notifications.length;

export const selectHasModalsOpen = (state: { ui: UIState }) =>
    Object.keys(state.ui.modals).length > 0;

export const selectIsLoading = (state: { ui: UIState }) =>
    Object.keys(state.ui.loading).length > 0;
