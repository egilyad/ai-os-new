/**
 * UI composition-root registration for the debate store adapters.
 *
 * The kernel must not import `src/stores/`. Instead the app entry (main.tsx)
 * calls `registerDebateStoreAdapters(container)` BEFORE `runtime.start()`, so
 * service-registration phases resolve the real zustand-backed adapters via the
 * container tokens defined in `kernel/contracts/debate-store`.
 */
import type { IContainer } from '../kernel/container';
import {
    DEBATE_SESSION_STORE_ADAPTER,
    DEBATE_LIVE_STORE_ADAPTER,
    DEBATE_SESSION_STORE_SUBSCRIBER,
    type SessionStoreSubscriber,
} from '../kernel/contracts/debate-store';
import { createDebateSessionStoreAdapter, useActiveDebateStore } from './activeDebateStore';
import { createDebateLiveStoreAdapter } from './debateLiveStore';

export function registerDebateStoreAdapters(container: IContainer): void {
    container.register(DEBATE_SESSION_STORE_ADAPTER, createDebateSessionStoreAdapter());
    container.register(DEBATE_LIVE_STORE_ADAPTER, createDebateLiveStoreAdapter());
    const subscriber: SessionStoreSubscriber = (listener) =>
        useActiveDebateStore.subscribe(listener);
    container.register(DEBATE_SESSION_STORE_SUBSCRIBER, subscriber);
}
