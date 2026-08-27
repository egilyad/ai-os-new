import type { SessionStore } from '../../kernel/contracts/storage/session-store';
import { runtime } from './service-deps';
import type { ChatSession } from './types';

let _sessionStore: SessionStore | null = null;

export function resolveSessionStore(): SessionStore | null {
    if (_sessionStore) return _sessionStore;
    _sessionStore =
        runtime.getService<{ sessions: SessionStore }>('storageLayer')?.sessions ?? null;
    return _sessionStore;
}

export function updateSessionInList(
    sessions: ChatSession[],
    id: string,
    patch: Partial<ChatSession>,
): ChatSession[] {
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx === -1) return sessions;
    const next = [...sessions];
    next[idx] = { ...next[idx]!, ...patch, updatedAt: Date.now() } as ChatSession;
    return next;
}
