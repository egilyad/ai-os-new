import type { ILifecycle } from './lifecycle';

export type InboxType = 'success' | 'error' | 'info' | 'warning';

export interface InboxItem {
    id: string;
    message: string;
    type: InboxType;
    source?: string;
    createdAt: number;
    read: boolean;
}

/** EventBus-backed inbox. Read side for panels; never emits back into the bus. */
export interface INotificationInboxService extends ILifecycle {
    push(input: { message: string; type?: InboxType; source?: string }): InboxItem;
    list(unreadOnly?: boolean): InboxItem[];
    markRead(id: string): boolean;
    markAllRead(): void;
    clear(): void;
}
