import type { IChannelService } from '../contracts/channel';
import type { Channel, ChannelMessage } from '../types/channel-types';

/**
 * Demo seed for Channels: one stream channel with three members and three
 * messages (in-memory service — lives for the session, like SOPs).
 *
 * Idempotent within a session: channels named DEMO_CHANNEL_NAME are reused.
 */
export const DEMO_CHANNEL_NAME = 'Демо: курилка ☕';

export async function seedChannelsDemo(
    service: IChannelService,
): Promise<{ channel: Channel; messages: ChannelMessage[] }> {
    const existing = (await service.listChannels()).find((c) => c.name === DEMO_CHANNEL_NAME);
    if (existing) {
        return { channel: existing, messages: await service.getMessages(existing.id) };
    }
    const channel = await service.createChannel({
        name: DEMO_CHANNEL_NAME,
        type: 'stream',
        visibility: 'public',
        initialMembers: [
            { agentId: 'agent-architect', displayName: 'Marcus Hale' },
            { agentId: 'agent-risk', displayName: 'Rafael Stone' },
            { agentId: 'agent-ethics', displayName: 'Elena Marchetti' },
        ],
    });
    const m1 = await service.sendMessage({
        channelId: channel.id,
        authorId: 'agent-architect',
        content: 'Коллеги, каркас бота готов. Кто смотрит риски?',
    });
    const m2 = await service.sendMessage({
        channelId: channel.id,
        authorId: 'agent-risk',
        content: 'Смотрю. Главный риск — спам: предлагаю лимит три напоминания в день.',
    });
    const m3 = await service.sendMessage({
        channelId: channel.id,
        authorId: 'agent-ethics',
        content: 'Плюс тихие часы с 23 до 7 — иначе нас всех отключат.',
    });
    return { channel, messages: [m1, m2, m3] };
}
