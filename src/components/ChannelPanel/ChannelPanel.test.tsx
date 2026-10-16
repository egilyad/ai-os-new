/**
 * ChannelPanel tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../kernel/instances/services-extras', () => ({
    // Instance-shaped (the panel calls methods directly, not a factory).
    channelService: {
        listChannels: vi.fn().mockResolvedValue([]),
        getChannel: vi.fn().mockResolvedValue(undefined),
        getMessages: vi.fn().mockResolvedValue([]),
        getMembers: vi.fn().mockResolvedValue([]),
        getPresence: vi.fn().mockResolvedValue([]),
        getTyping: vi.fn().mockResolvedValue([]),
        getThread: vi.fn().mockResolvedValue([]),
        getEvents: vi.fn().mockResolvedValue([]),
        sendMessage: vi.fn().mockResolvedValue({ id: 'm1' }),
        joinChannel: vi.fn().mockResolvedValue(undefined),
        createChannel: vi.fn().mockResolvedValue({ id: 'ch1', name: 'test', members: [] }),
        editMessage: vi.fn().mockResolvedValue(undefined),
        deleteMessage: vi.fn().mockResolvedValue(undefined),
        addReaction: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../stores/channel-store', () => {
    const store = {
        channels: new Map(),
        order: [] as string[],
        selectedId: null as string | null,
        messages: [] as unknown[],
        events: [] as unknown[],
        loading: false,
        error: null,
        loadChannels: vi.fn(),
        selectChannel: vi.fn(),
        loadMessages: vi.fn(),
        loadEvents: vi.fn(),
        refresh: vi.fn(),
    };
    return {
        useChannelStore: Object.assign(
            vi.fn((selector?: (s: typeof store) => unknown) => selector ? selector(store) : store),
            {
                getState: () => store,
                setState: (patch: Record<string, unknown>) => Object.assign(store, patch),
            },
        ),
        ensureSubscribed: vi.fn(),
        destroy: vi.fn(),
    };
});

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        lang: 'en',
    }),
}));

import ChannelPanel from './ChannelPanel';

describe('ChannelPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the channels sidebar', () => {
        render(<ChannelPanel />);
        expect(screen.getByText('channels.title')).toBeTruthy();
    });

    it('shows empty state when no channel selected', () => {
        render(<ChannelPanel />);
        expect(screen.getByText('channels.selectChannel')).toBeTruthy();
    });

    it('shows create button', () => {
        render(<ChannelPanel />);
        expect(screen.getByText('+')).toBeTruthy();
    });

    it('banners a send failure instead of pretending it sent', async () => {
        const { useChannelStore } = await import('../../stores/channel-store');
        const { channelService } = await import('../../kernel/instances/services-extras');
        const svc = channelService as unknown as {
            sendMessage: ReturnType<typeof vi.fn>;
        };
        svc.sendMessage.mockRejectedValueOnce(new Error('offline'));
        useChannelStore.setState({
            channels: new Map([['c1', { id: 'c1', name: 'general', type: 'stream', visibility: 'public' }]]) as never,
            order: ['c1'],
            selectedId: 'c1',
            messages: [],
        });
        try {
            render(<ChannelPanel />);
            fireEvent.change(screen.getByPlaceholderText('channels.inputPlaceholder'), {
                target: { value: 'hello' },
            });
            fireEvent.click(screen.getByText('channels.send'));
            expect(await screen.findByText('channels.error.generic')).toBeTruthy();
            expect(screen.getByPlaceholderText('channels.inputPlaceholder')).toBeTruthy();
        } finally {
            useChannelStore.setState({
                channels: new Map(),
                order: [],
                selectedId: null,
                messages: [],
            });
        }
    });

    it('renders legacy messages without content or reactions', async () => {
        const { useChannelStore } = await import('../../stores/channel-store');
        useChannelStore.setState({
            channels: new Map([['c1', { id: 'c1', name: 'general', type: 'stream', visibility: 'public' }]]) as never,
            order: ['c1'],
            selectedId: 'c1',
            messages: [{ id: 'm9', authorId: 'alice' }] as never,
        });
        try {
            render(<ChannelPanel />);
            expect(await screen.findByText('alice')).toBeTruthy();
            expect(screen.getByText('—')).toBeTruthy();
        } finally {
            useChannelStore.setState({
                channels: new Map(),
                order: [],
                selectedId: null,
                messages: [],
            });
        }
    });
});
