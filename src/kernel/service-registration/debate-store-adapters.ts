/**
 * Shared resolver for the UI-backed debate store adapters.
 *
 * service-registration phases must not import `src/stores/` directly (layer
 * rule: kernel must not import UI). The UI composition root registers the
 * zustand-backed adapters into the container under the tokens defined in
 * `contracts/debate-store`. This helper resolves them with a no-op fallback so
 * the kernel still works in headless contexts (tests, non-UI runs).
 */
import type { IContainer } from '../container';
import {
    DEBATE_SESSION_STORE_ADAPTER,
    DEBATE_LIVE_STORE_ADAPTER,
    DEBATE_SESSION_STORE_SUBSCRIBER,
    type IDebateSessionStore,
    type IDebateLiveStore,
    type SessionStoreSubscriber,
} from '../contracts/debate-store';
import {
    createFallbackDebateSessionStore,
    createFallbackDebateLiveStore,
    fallbackSessionStoreSubscriber,
} from '../services/debate-runtime/debate-store-fallback';

export interface DebateStoreAdapters {
    activeDebateStore: IDebateSessionStore;
    debateLiveStore: IDebateLiveStore;
    onSessionChange: SessionStoreSubscriber;
}

export function resolveDebateStoreAdapters(container: IContainer): DebateStoreAdapters {
    return {
        activeDebateStore:
            container.getOptional<IDebateSessionStore>(DEBATE_SESSION_STORE_ADAPTER) ??
            createFallbackDebateSessionStore(),
        debateLiveStore:
            container.getOptional<IDebateLiveStore>(DEBATE_LIVE_STORE_ADAPTER) ??
            createFallbackDebateLiveStore(),
        onSessionChange:
            container.getOptional<SessionStoreSubscriber>(DEBATE_SESSION_STORE_SUBSCRIBER) ??
            fallbackSessionStoreSubscriber,
    };
}
