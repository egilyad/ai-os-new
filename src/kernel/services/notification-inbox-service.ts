import type {
    INotificationInboxService,
    InboxItem,
    InboxType,
} from '../../contracts/notification-inbox';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('NotificationInbox');
const STORAGE_KEY = 'notification-inbox';
const MAX_ITEMS = 100;

interface NotificationInboxDeps {
    eventBus: {
        on(event: string, cb: (data?: unknown) => void): () => void;
    };
    database?: {
        getKv<T>(id: string): Promise<T | null>;
        setKv<T>(id: string, value: T): Promise<void>;
    };
    now?: () => number;
}

export class NotificationInboxService implements INotificationInboxService {
    private items: InboxItem[] = [];
    private seq = 0;
    private unsubscribe: (() => void) | null = null;
    private now: () => number;

    constructor(private deps: NotificationInboxDeps) {
        this.now = deps.now ?? (() => Date.now());
    }

    async init(): Promise<void> {
        if (this.unsubscribe) return;
        if (this.deps.database) {
            try {
                const stored = await this.deps.database.getKv<InboxItem[]>(STORAGE_KEY);
                if (Array.isArray(stored)) this.items = stored.slice(-MAX_ITEMS);
            } catch (e) {
                LOGGER.warn('NotificationInbox', 'load failed', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        this.unsubscribe = this.deps.eventBus.on(EVENTS.NOTIFICATION, (data) => {
            const payload = data as
                { message?: unknown; type?: unknown; source?: unknown } | undefined;
            if (!payload || typeof payload.message !== 'string') return;
            const type: InboxType =
                payload.type === 'success' ||
                payload.type === 'error' ||
                payload.type === 'warning' ||
                payload.type === 'info'
                    ? payload.type
                    : 'info';
            this.push({
                message: payload.message,
                type,
                ...(typeof payload.source === 'string' ? { source: payload.source } : {}),
            });
        });
    }

    async destroy(): Promise<void> {
        this.unsubscribe?.();
        this.unsubscribe = null;
    }

    push(input: { message: string; type?: InboxType; source?: string }): InboxItem {
        const createdAt = this.now();
        const item: InboxItem = {
            id: `inbox-${createdAt}-${++this.seq}`,
            message: input.message,
            type: input.type ?? 'info',
            ...(input.source ? { source: input.source } : {}),
            createdAt,
            read: false,
        };
        this.items = [...this.items, item].slice(-MAX_ITEMS);
        this.persist();
        this.showDesktopNotification(item);
        return item;
    }

    list(unreadOnly = false): InboxItem[] {
        return this.items.filter((i) => !unreadOnly || !i.read).map((i) => ({ ...i }));
    }

    markRead(id: string): boolean {
        const idx = this.items.findIndex((i) => i.id === id);
        if (idx < 0) return false;
        this.items[idx] = { ...this.items[idx]!, read: true };
        this.persist();
        return true;
    }

    markAllRead(): void {
        this.items = this.items.map((i) => ({ ...i, read: true }));
        this.persist();
    }

    clear(): void {
        this.items = [];
        this.persist();
    }

    private persist(): void {
        if (!this.deps.database) return;
        void this.deps.database.setKv(STORAGE_KEY, this.items).catch((e: unknown) => {
            LOGGER.warn('NotificationInbox', 'persist failed', {
                error: e instanceof Error ? e.message : String(e),
            });
        });
    }

    private showDesktopNotification(item: InboxItem): void {
        try {
            if (
                typeof document === 'undefined' ||
                !document.hidden ||
                typeof Notification === 'undefined' ||
                Notification.permission !== 'granted'
            )
                return;
            new Notification(item.message);
        } catch {
            /* notifications are optional — inbox still records the event */
        }
    }
}
