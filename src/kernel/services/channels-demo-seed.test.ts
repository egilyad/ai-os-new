import { ChannelService } from './channel-service';
import { seedChannelsDemo, DEMO_CHANNEL_NAME } from './channels-demo-seed';

describe('channels-demo-seed', () => {
    it('seeds a channel with three members and messages', async () => {
        const service = new ChannelService();
        const { channel, messages } = await seedChannelsDemo(service);
        expect(channel.name).toBe(DEMO_CHANNEL_NAME);
        expect(channel.members).toHaveLength(3);
        expect(messages).toHaveLength(3);
        const authors = new Set(messages.map((m) => m.authorId));
        expect(authors.size).toBe(3);
    });

    it('is idempotent: repeated calls reuse the channel', async () => {
        const service = new ChannelService();
        const first = await seedChannelsDemo(service);
        const second = await seedChannelsDemo(service);
        expect(second.channel.id).toBe(first.channel.id);
        // Second call returns the full history (incl. the createChannel
        // system message); the three posted messages must be identical.
        expect(second.messages.map((m) => m.id).slice(-3)).toEqual(
            first.messages.map((m) => m.id),
        );
    });
});
