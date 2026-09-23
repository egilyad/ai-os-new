/**
 * ChannelStore — Zustand observer for agent channels.
 *
 * Mirrors ChannelService state. Pure consumer, never writes to channels.
 */
import { create } from 'zustand';
import type { Channel, ChannelMessage } from '../kernel/types/channel-types';
import { channelService } from '../kernel/instances/services-extras';
import { eventBus as coreEventBus } from '../kernel/events/event-bus';

interface ChannelView {
    id: string;
    name: string;
    description?: string;
    type: string;
    visibility: string;
    memberCount: number;
    lastMessage?: string;
    updatedAt: number;
}

interface StoreState {
    channels: Map<string, ChannelView>;
    order: string[];
    selectedId: string | null;
    messages: ChannelMessage[];
    events: Array<{ type: string; agentId: string; data?: Record<string, unknown>; timestamp: number }>;
    loading: boolean;
    error: string | null;

    loadChannels: () => Promise<void>;
    selectChannel: (id: string | null) => void;
    loadMessages: (channelId: string) => Promise<void>;
    loadEvents: (channelId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

let _subscribed = false;
const _unsubs: Array<() => void> = [];

function toView(ch: Channel): ChannelView {
    return {
        id: ch.id,
        name: ch.name,
        description: ch.description,
        type: ch.type,
        visibility: ch.visibility,
        memberCount: ch.members.length,
        updatedAt: ch.updatedAt,
    };
}

async function reload(set: (partial: Partial<StoreState>) => void) {
    try {
        const svc = channelService;
        const channels = await svc.listChannels();
        const map = new Map<string, ChannelView>();
        const order: string[] = [];
        for (const ch of channels) {
            map.set(ch.id, toView(ch));
            order.push(ch.id);
        }
        set({ channels: map, order });
    } catch (e) {
        set({ error: String(e) });
    }
}

export const useChannelStore = create<StoreState>((set, get) => ({
    channels: new Map(),
    order: [],
    selectedId: null,
    messages: [],
    events: [],
    loading: false,
    error: null,

    loadChannels: async () => {
        set({ loading: true, error: null });
        await reload(set);
        set({ loading: false });
    },

    selectChannel: (id) => {
        set({ selectedId: id, messages: [], events: [] });
        if (id) {
            get().loadMessages(id);
            get().loadEvents(id);
        }
    },

    loadMessages: async (channelId) => {
        try {
            const svc = channelService;
            const messages = await svc.getMessages(channelId, 100);
            set({ messages });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    loadEvents: async (channelId) => {
        try {
            const svc = channelService;
            const events = await svc.getEvents(channelId);
            set({ events });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    refresh: async () => {
        await reload(set);
        const { selectedId } = get();
        if (selectedId) {
            await get().loadMessages(selectedId);
            await get().loadEvents(selectedId);
        }
    },
}));

export function ensureSubscribed() {
    if (_subscribed) return;
    _subscribed = true;

    const reloadFn = () => {
        const { loadChannels } = useChannelStore.getState();
        loadChannels();
    };

    _unsubs.push(coreEventBus.onSafe('channel:created', reloadFn));
    _unsubs.push(coreEventBus.onSafe('channel:archived', reloadFn));
    _unsubs.push(coreEventBus.onSafe('channel:message', () => {
        const { selectedId, loadMessages } = useChannelStore.getState();
        if (selectedId) loadMessages(selectedId);
    }));
    _unsubs.push(coreEventBus.onSafe('channel:agent:joined', reloadFn));
    _unsubs.push(coreEventBus.onSafe('channel:agent:left', reloadFn));
}

export function destroy() {
    for (const unsub of _unsubs) unsub();
    _unsubs.length = 0;
    _subscribed = false;
    useChannelStore.setState({
        channels: new Map(),
        order: [],
        selectedId: null,
        messages: [],
        events: [],
        loading: false,
        error: null,
    });
}
