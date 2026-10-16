import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import type { GroupChat } from '../../kernel/contracts/rivals';

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

const store = new Map<string, GroupChat>();

vi.mock('../../kernel/instances/services-extras', () => ({
    groupChatService: {
        listChats: vi.fn(async () => [...store.values()]),
        createChat: vi.fn(async (input: { name: string; members: string[] }) => {
            const chat: GroupChat = {
                id: 'chat-1',
                name: input.name,
                members: input.members,
                selection: 'auto',
                maxRounds: 6,
                stopPhrases: ['TERMINATE'],
                turns: [],
                status: 'running',
                createdAt: 1,
                updatedAt: 1,
            };
            store.set(chat.id, chat);
            return chat;
        }),
        get: vi.fn(async (id: string) => store.get(id) ?? null),
        nextTurn: vi.fn(async (chatId: string, speaker?: string) => {
            const chat = store.get(chatId);
            if (!chat) throw new Error('no chat');
            const turn = { speaker: speaker ?? chat.members[0]!, text: 'fake turn', round: 1, createdAt: 2 };
            chat.turns.push(turn);
            return turn;
        }),
        postTurn: vi.fn(async (chatId: string, speaker: string, text: string) => {
            const chat = store.get(chatId);
            if (!chat) throw new Error('no chat');
            chat.turns.push({ speaker, text, round: 1, createdAt: 3 });
            return chat;
        }),
        summarize: vi.fn(async () => 'fake summary'),
        nestChat: vi.fn(async (chatId: string, topic: string) => {
            const chat = store.get(chatId);
            if (!chat) throw new Error('no chat');
            chat.turns.push({ speaker: 'system', text: `nested: ${topic}`, round: 1, createdAt: 4 });
            return chat;
        }),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

async function openCreateForm() {
    const Panel = (await import('./GroupChatPanel')).default;
    render(<Panel />);
    await waitFor(() => expect(screen.getByText('+ New')).toBeDefined());
    fireEvent.click(screen.getByText('+ New'));
    fireEvent.change(screen.getByPlaceholderText('groupChat.namePlaceholder'), {
        target: { value: 'Demo' },
    });
    const custom = screen.getByPlaceholderText('Custom member + Enter');
    fireEvent.change(custom, { target: { value: 'alice' } });
    fireEvent.keyDown(custom, { key: 'Enter' });
    fireEvent.change(custom, { target: { value: 'bob' } });
    fireEvent.keyDown(custom, { key: 'Enter' });
}

describe('GroupChatPanel', () => {
    beforeEach(() => {
        store.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('creates a chat from name + members and selects it', async () => {
        const { groupChatService } = await import('../../kernel/instances/services-extras');
        await openCreateForm();
        fireEvent.click(screen.getByRole('button', { name: 'groupChat.create.submit' }));

        await waitFor(() => expect(groupChatService.createChat).toHaveBeenCalledTimes(1));
        expect(groupChatService.createChat).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Demo', members: ['alice', 'bob'] }),
        );
        expect((await screen.findAllByText('Demo')).length).toBeGreaterThan(0);
    });

    it('runs next turn and appends history', async () => {
        await openCreateForm();
        fireEvent.click(screen.getByRole('button', { name: 'groupChat.create.submit' }));
        fireEvent.click(await screen.findByRole('button', { name: 'groupChat.nextTurn' }));
        await waitFor(() => {
            expect(screen.getByText('fake turn')).toBeDefined();
        });
    });

    it('keeps Create disabled with fewer than two members', async () => {
        const Panel = (await import('./GroupChatPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(screen.getByText('+ New')).toBeDefined());
        fireEvent.click(screen.getByText('+ New'));
        fireEvent.change(screen.getByPlaceholderText('groupChat.namePlaceholder'), {
            target: { value: 'Solo' },
        });
        const custom = screen.getByPlaceholderText('Custom member + Enter');
        fireEvent.change(custom, { target: { value: 'alice' } });
        fireEvent.keyDown(custom, { key: 'Enter' });
        // The guard lives on the button: single-member chats cannot be submitted.
        expect(screen.getByRole('button', { name: 'groupChat.create.submit' })).toBeDisabled();
    });

    it('renders legacy chats without members or turns', async () => {
        const { groupChatService } = await import('../../kernel/instances/services-extras');
        vi.mocked(groupChatService.listChats).mockResolvedValue([
            { id: 'legacy', name: 'Legacy', status: 'running', maxRounds: 6 },
        ] as never);
        const Panel = (await import('./GroupChatPanel')).default;
        render(<Panel />);
        // Sidebar row and (after select) the main header share the name.
        const rows = await screen.findAllByText('Legacy');
        expect(rows.length).toBeGreaterThanOrEqual(1);
        fireEvent.click(rows[0]!);
        // The empty-history line is split across text nodes (key + hint).
        const empties = await screen.findAllByText(/groupChat\.history\.empty/);
        expect(empties.length).toBeGreaterThanOrEqual(1);
    });
});
