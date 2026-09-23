/**
 * ChannelPanel tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockSendMessage = vi.fn().mockResolvedValue({ id: 'm1' });
const mockJoinChannel = vi.fn().mockResolvedValue(undefined);
const mockCreateChannel = vi.fn().mockResolvedValue({ id: 'ch1', name: 'test', members: [] });

vi.mock('../../kernel/instances/services-extras', () => ({
    channelService: () => ({
        listChannels: vi.fn().mockResolvedValue([]),
        getChannel: vi.fn().mockResolvedValue(undefined),
        getMessages: vi.fn().mockResolvedValue([]),
        getMembers: vi.fn().mockResolvedValue([]),
        getEvents: vi.fn().mockResolvedValue([]),
        sendMessage: mockSendMessage,
        joinChannel: mockJoinChannel,
        createChannel: mockCreateChannel,
    }),
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
});
