import { describe, it, expect, beforeEach } from 'vitest';
import { createDexieStorage, resetDexieStorage } from './dexie-storage';
import { getDexieDb } from '../database-service';
import type { ChatSession } from '../../contracts/storage/session-store';

function sess(overrides: Partial<ChatSession> = {}): ChatSession {
    return {
        id: 's1',
        title: 't',
        history: [],
        createdAt: 1000,
        updatedAt: 1000,
        ...overrides,
    } as ChatSession;
}

describe('DexieSessionStore version guard (persist defect)', () => {
    beforeEach(async () => {
        resetDexieStorage();
        await getDexieDb().sessions.clear();
    });

    it('fresh content wins over a newer-but-stale row', async () => {
        const store = createDexieStorage().sessions;
        await store.put(sess({ history: [] })); // stored v1
        await store.put(sess({ history: [] })); // stored v2, still empty
        // A snapshot carrying version 1 but FRESHER content must land.
        await store.put(
            sess({
                version: 1,
                updatedAt: 2000,
                history: [{ id: 'e1' } as never],
            }),
        );
        const got = await store.getSession('s1');
        expect(got?.history).toHaveLength(1);
    });

    it('drops genuinely stale snapshots (older version AND older clock)', async () => {
        const store = createDexieStorage().sessions;
        await store.put(sess({ history: [{ id: 'e1' } as never], updatedAt: 2000 }));
        await store.put(sess({ history: [{ id: 'e1' } as never], updatedAt: 2000 }));
        // Stale snapshot: lower version AND older timestamp.
        await store.put(sess({ version: 1, updatedAt: 1000, history: [] }));
        const got = await store.getSession('s1');
        expect(got?.history).toHaveLength(1);
    });
});
