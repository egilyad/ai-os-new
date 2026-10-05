import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import type { Topic, ForumThread } from '../../kernel/types/forum-types';

// ForumPanel's transitive graph (debate-session-store et al. via the real
// kernel `instances` entrypoint) costs ~25s of Vite transform in a worker,
// and the lazy eventBus proxy has nothing registered here — so the suite
// stubs `eventBus`/`EVENTS` via a partial mock (importOriginal spread)
// instead of importing the world. The timeout guards transform contention,
// not test logic (tests run in seconds once imported).
const TEST_TIMEOUT = 120000;

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

afterEach(cleanup);

const topic: Topic = {
    id: 't1',
    title: 'Test Topic',
    category: 'general',
    author: { kind: 'human', id: 'local-user', displayName: 'Вы' },
    tags: [],
    pinned: false,
    status: 'open',
    score: 0,
    postCount: 0,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
};

const listTopics = vi.fn(() => Promise.resolve({ items: [] as Topic[] }));
const createTopic = vi.fn(async () => 't1');
const getThread = vi.fn(async (): Promise<ForumThread> => ({ topic, posts: [] }));
const getConsensus = vi.fn(async () => null);
const postMessage = vi.fn(async () => undefined);
const moderatePost = vi.fn(async () => undefined);
const votePost = vi.fn(async () => undefined);
const pinTopic = vi.fn(async () => undefined);

vi.mock('../../kernel/instances', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        eventBus: {
            on: () => () => undefined,
            onSafe: () => () => undefined,
            emit: () => {},
            emitOnce: () => true,
        },
        EVENTS: {
            FORUM_TOPIC_CREATED: 'forum:topic-created',
            FORUM_POST_ADDED: 'forum:post-added',
        },
    };
});

vi.mock('../../kernel/instances/services-extras', () => ({
    forumService: {
        listTopics,
        createTopic,
        getThread,
        getConsensus,
        postMessage,
        moderatePost,
        votePost,
        pinTopic,
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ForumPanel (FT-02)', () => {
    it(
        'renders the title, loads topics and shows the empty state',
        async () => {
            const ForumPanel = (await import('./ForumPanel')).default;
            render(<ForumPanel />);
            expect(await screen.findByText('forum.title')).toBeDefined();
            await waitFor(() => expect(listTopics).toHaveBeenCalled());
            expect(screen.getByText('forum.no_topics')).toBeDefined();
        },
        TEST_TIMEOUT,
    );

    it(
        'creates a topic when title + category are submitted',
        async () => {
            const ForumPanel = (await import('./ForumPanel')).default;
            render(<ForumPanel />);
            await screen.findByText('forum.title');
            fireEvent.change(screen.getByPlaceholderText('forum.topic_title_placeholder'), {
                target: { value: 'My New Topic' },
            });
            fireEvent.click(screen.getByText('+'));
            await waitFor(() =>
                expect(createTopic).toHaveBeenCalledWith(
                    expect.objectContaining({ title: 'My New Topic', category: 'general' }),
                ),
            );
        },
        TEST_TIMEOUT,
    );

    it(
        'opens a thread and posts a message when composed',
        async () => {
            listTopics.mockImplementationOnce(() => Promise.resolve({ items: [topic] }));
            const ForumPanel = (await import('./ForumPanel')).default;
            render(<ForumPanel />);
            await screen.findByText('Test Topic');
            fireEvent.click(screen.getByText('Test Topic'));
            await waitFor(() => expect(getThread).toHaveBeenCalledWith('t1'));
            fireEvent.change(screen.getByPlaceholderText('forum.composer_placeholder'), {
                target: { value: 'hello world' },
            });
            fireEvent.click(screen.getByText('forum.post'));
            await waitFor(() =>
                expect(postMessage).toHaveBeenCalledWith(
                    't1',
                    expect.anything(),
                    'hello world',
                    undefined,
                ),
            );
        },
        TEST_TIMEOUT,
    );
});
