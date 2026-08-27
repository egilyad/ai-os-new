import { create } from 'zustand';

type BadgeMap = Record<string, number>;

interface NotificationState {
    badges: BadgeMap;
    increment: (routeId: string) => void;
    clear: (routeId: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    badges: {},
    increment: (routeId) =>
        set((s) => ({
            badges: {
                ...s.badges,
                [routeId]: (s.badges[routeId] || 0) + 1,
            },
        })),
    clear: (routeId) =>
        set((s) => {
            if (!s.badges[routeId]) return s;
            const next = { ...s.badges };
            delete next[routeId];
            return { badges: next };
        }),
    clearAll: () => set({ badges: {} }),
}));
