import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('GroupChatPanel', () => {
    it('creates a chat from name + members and selects it', async () => {
        const { groupChatService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./GroupChatPanel')).default;
        render(<Panel />);

        fireEvent.change(screen.getByPlaceholderText('groupChat.namePlaceholder'), {
            target: { value: 'Demo' },
        });
        fireEvent.change(screen.getByPlaceholderText('groupChat.membersPlaceholder'), {
            target: { value: 'alice, bob' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'groupChat.create.submit' }));

        await waitFor(() => expect(groupChatService.createChat).toHaveBeenCalledTimes(1));
        expect(groupChatService.createChat).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Demo', members: ['alice', 'bob'] }),
        );
        expect((await screen.findAllByText('Demo')).length).toBeGreaterThan(0);
    });

    it('runs next turn and appends history', async () => {
        const Panel = (await import('./GroupChatPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('groupChat.namePlaceholder'), {
            target: { value: 'Demo' },
        });
        fireEvent.change(screen.getByPlaceholderText('groupChat.membersPlaceholder'), {
            target: { value: 'alice, bob' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'groupChat.create.submit' }));
        fireEvent.click(await screen.findByRole('button', { name: 'groupChat.nextTurn' }));
        await waitFor(() => {
            const items = screen.getAllByRole('listitem');
            expect(items.some((li) => li.textContent?.includes('fake turn'))).toBe(true);
        });
    });

    it('shows validation when members are fewer than two', async () => {
        const Panel = (await import('./GroupChatPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getAllByPlaceholderText('groupChat.namePlaceholder')[0]!, {
            target: { value: 'Solo' },
        });
        fireEvent.change(screen.getAllByPlaceholderText('groupChat.membersPlaceholder')[0]!, {
            target: { value: 'alice' },
        });
        const buttons = screen.getAllByRole('button', { name: 'groupChat.create.submit' });
        fireEvent.click(buttons[0]!);
        expect(await screen.findByText('groupChat.validation.members')).toBeDefined();
    });
});
