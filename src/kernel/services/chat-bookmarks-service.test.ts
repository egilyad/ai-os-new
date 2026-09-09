import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatBookmarksService } from './chat-bookmarks-service';
import type { ChatBookmarksServiceDeps, ChatBookmark } from './chat-bookmarks-service';
import type { ChatMessage } from '../types/llm-types';

function createMockStorage() {
    const store = new Map<string, ChatBookmark>();
    return {
        list: vi.fn().mockResolvedValue([] as ChatBookmark[]),
        save: vi.fn().mockImplementation(async (b: ChatBookmark) => {
            store.set(b.id, b);
        }),
        delete: vi.fn().mockImplementation(async (id: string) => {
            store.delete(id);
        }),
        clear: vi.fn().mockImplementation(async () => {
            store.clear();
        }),
        _store: store,
    };
}

function makeMessage(overrides?: Record<string, unknown>): ChatMessage & { id: string } {
    return { role: 'user', content: 'Hello', id: 'msg-1', ...overrides } as ChatMessage & {
        id: string;
    };
}

function createDeps(): ChatBookmarksServiceDeps {
    return {
        eventBus: {
            on: vi.fn().mockReturnValue(() => {}),
            emit: vi.fn(),
        },
        database: {} as never,
        storage: createMockStorage(),
    };
}

describe('ChatBookmarksService', () => {
    let deps: ChatBookmarksServiceDeps;
    let storage: ReturnType<typeof createMockStorage>;
    let svc: ChatBookmarksService;

    beforeEach(() => {
        storage = createMockStorage();
        deps = createDeps();
        deps.storage = storage;
        svc = new ChatBookmarksService(deps);
    });

    describe('init', () => {
        it('should load bookmarks from storage', async () => {
            const existing: ChatBookmark = {
                id: 'bm-1',
                sessionId: 's1',
                messageId: 'm1',
                role: 'user',
                content: 'hi',
                tags: [],
                createdAt: 100,
            };
            storage.list.mockResolvedValue([existing]);
            await svc.init();
            expect(svc.count()).toBe(1);
            expect(svc.listAll()[0].id).toBe('bm-1');
        });

        it('should handle storage error gracefully', async () => {
            storage.list.mockRejectedValue(new Error('storage fail'));
            await expect(svc.init()).resolves.not.toThrow();
            expect(svc.count()).toBe(0);
        });

        it('should subscribe to CHAT_REWOUND event', async () => {
            await svc.init();
            expect(deps.eventBus.on).toHaveBeenCalled();
        });

        it('should be idempotent', async () => {
            await svc.init();
            await svc.init();
            expect(storage.list).toHaveBeenCalledTimes(1);
        });
    });

    describe('destroy', () => {
        it('should unsubscribe event listeners', async () => {
            const unsub = vi.fn();
            deps.eventBus.on = vi.fn().mockReturnValue(unsub);
            svc = new ChatBookmarksService(deps);
            await svc.init();
            svc.destroy();
            expect(unsub).toHaveBeenCalled();
        });
    });

    describe('addBookmark', () => {
        it('should add a bookmark', async () => {
            const bm = await svc.addBookmark({ sessionId: 's1', message: makeMessage() });
            expect(bm.id).toContain('bm');
            expect(bm.sessionId).toBe('s1');
            expect(bm.content).toBe('Hello');
            expect(svc.count()).toBe(1);
        });

        it('should dedup by sessionId + messageId', async () => {
            const msg = makeMessage({ id: 'msg-1' });
            const bm1 = await svc.addBookmark({ sessionId: 's1', message: msg });
            const bm2 = await svc.addBookmark({ sessionId: 's1', message: msg });
            expect(bm2.id).toBe(bm1.id);
            expect(svc.count()).toBe(1);
        });

        it('should support optional note and tags', async () => {
            const bm = await svc.addBookmark({
                sessionId: 's1',
                message: makeMessage(),
                note: 'my note',
                tags: ['important', 'todo'],
            });
            expect(bm.note).toBe('my note');
            expect(bm.tags).toEqual(['important', 'todo']);
        });

        it('should emit CHAT_BOOKMARK_ADDED event', async () => {
            await svc.addBookmark({ sessionId: 's1', message: makeMessage() });
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('chat:bookmark:added'),
                expect.objectContaining({ sessionId: 's1' }),
            );
        });

        it('should persist via storage', async () => {
            await svc.addBookmark({ sessionId: 's1', message: makeMessage() });
            expect(storage.save).toHaveBeenCalled();
        });

        it('should enforce 500 bookmark cache limit', async () => {
            for (let i = 0; i < 510; i++) {
                await svc.addBookmark({
                    sessionId: `s${i}`,
                    message: makeMessage({ id: `msg-${i}`, content: `msg-${i}` }),
                });
            }
            expect(svc.count()).toBe(500);
        });
    });

    describe('removeBookmark', () => {
        it('should remove a bookmark', async () => {
            const bm = await svc.addBookmark({ sessionId: 's1', message: makeMessage() });
            await svc.removeBookmark(bm.id);
            expect(svc.count()).toBe(0);
        });

        it('should emit CHAT_BOOKMARK_REMOVED event', async () => {
            const bm = await svc.addBookmark({ sessionId: 's1', message: makeMessage() });
            await svc.removeBookmark(bm.id);
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('chat:bookmark:removed'),
                expect.objectContaining({ id: bm.id }),
            );
        });

        it('should not throw when removing non-existent', async () => {
            await expect(svc.removeBookmark('nonexistent')).resolves.not.toThrow();
        });
    });

    describe('clearAll', () => {
        it('should clear all bookmarks', async () => {
            await svc.addBookmark({ sessionId: 's1', message: makeMessage() });
            await svc.addBookmark({ sessionId: 's2', message: makeMessage({ id: 'msg-2' }) });
            await svc.clearAll();
            expect(svc.count()).toBe(0);
        });

        it('should emit CHAT_BOOKMARK_CLEARED event', async () => {
            await svc.clearAll();
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                expect.stringContaining('chat:bookmark:cleared'),
                undefined,
            );
        });
    });

    describe('queries', () => {
        beforeEach(async () => {
            await svc.addBookmark({
                sessionId: 's1',
                message: makeMessage({ id: 'm1', content: 'First message', role: 'user' }),
                tags: ['work'],
                note: 'alpha',
            });
            await svc.addBookmark({
                sessionId: 's1',
                message: makeMessage({ id: 'm2', content: 'Second message', role: 'assistant' }),
                tags: ['work', 'urgent'],
                note: 'beta',
            });
            await svc.addBookmark({
                sessionId: 's2',
                message: makeMessage({ id: 'm3', content: 'Third message', role: 'user' }),
                tags: ['personal'],
            });
        });

        it('listAll should return all sorted by createdAt desc', () => {
            const all = svc.listAll();
            expect(all.length).toBe(3);
            for (let i = 1; i < all.length; i++) {
                expect(all[i - 1].createdAt).toBeGreaterThanOrEqual(all[i].createdAt);
            }
        });

        it('listBySession should filter by session', () => {
            expect(svc.listBySession('s1').length).toBe(2);
            expect(svc.listBySession('s2').length).toBe(1);
            expect(svc.listBySession('s3').length).toBe(0);
        });

        it('listByTag should filter by tag', () => {
            expect(svc.listByTag('work').length).toBe(2);
            expect(svc.listByTag('urgent').length).toBe(1);
            expect(svc.listByTag('nonexistent').length).toBe(0);
        });

        it('listByTag should be case-insensitive', () => {
            expect(svc.listByTag('WORK').length).toBe(2);
        });

        it('search should match content', () => {
            expect(svc.search('First').length).toBe(1);
            expect(svc.search('message').length).toBe(3);
        });

        it('search should match note', () => {
            expect(svc.search('alpha').length).toBe(1);
            expect(svc.search('beta').length).toBe(1);
        });

        it('search should match tags', () => {
            expect(svc.search('urgent').length).toBe(1);
        });

        it('search with empty query returns all', () => {
            expect(svc.search('').length).toBe(3);
            expect(svc.search('   ').length).toBe(3);
        });

        it('isBookmarked should check by sessionId and messageId', () => {
            expect(svc.isBookmarked('s1', 'm1')).toBe(true);
            expect(svc.isBookmarked('s1', 'missing')).toBe(false);
        });

        it('countBySession should count per session', () => {
            expect(svc.countBySession('s1')).toBe(2);
            expect(svc.countBySession('s2')).toBe(1);
            expect(svc.countBySession('s3')).toBe(0);
        });

        it('getAllTags should return unique tags sorted', () => {
            expect(svc.getAllTags()).toEqual(['personal', 'urgent', 'work']);
        });
    });
});
