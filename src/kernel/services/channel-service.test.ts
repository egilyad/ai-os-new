/**
 * ChannelService tests — full Buzz-like agent channels.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelService } from './channel-service';

function mockEventBus() {
    return {
        emit: () => {},
        on: () => () => {},
        onSafe: () => () => {},
        once: () => () => {},
        off: () => {},
        offAll: () => {},
        emitOnce: () => {},
        getDeadLetterQueue: () => [],
        drainDeadLetterQueue: () => [],
        getSubscriptionStats: () => ({ total: 0, active: 0, failed: 0 }),
        clearAllSubscriptions: () => {},
    };
}

let svc: ChannelService;

beforeEach(() => {
    svc = new ChannelService(mockEventBus() as any);
});

describe('ChannelService', () => {
    // ── Channel CRUD ──

    it('creates a channel with type and visibility', async () => {
        const ch = await svc.createChannel({
            name: 'dev',
            type: 'forum',
            visibility: 'private',
            initialMembers: [{ agentId: 'claude', displayName: 'Claude', systemPrompt: 'You are helpful', respondTo: 'owner-only' }],
        });
        expect(ch.type).toBe('forum');
        expect(ch.visibility).toBe('private');
        expect(ch.members[0].respondTo).toBe('owner-only');
        expect(ch.members[0].systemPrompt).toBe('You are helpful');
    });

    it('filters channels by type', async () => {
        await svc.createChannel({ name: 'chat', type: 'stream' });
        await svc.createChannel({ name: 'thread', type: 'forum' });
        expect((await svc.listChannels('stream')).length).toBe(1);
        expect((await svc.listChannels('forum')).length).toBe(1);
    });

    it('updates channel topic', async () => {
        const ch = await svc.createChannel({ name: 'dev' });
        await svc.updateTopic(ch.id, 'Discuss code here');
        const updated = await svc.getChannel(ch.id);
        expect(updated?.topic).toBe('Discuss code here');
    });

    // ── Members & permissions ──

    it('enforces owner-only respondTo on mentions', async () => {
        const ch = await svc.createChannel({
            name: 'restricted',
            initialMembers: [
                { agentId: 'bot', displayName: 'Bot', respondTo: 'owner-only' },
                { agentId: 'owner', displayName: 'Owner', role: 'owner' },
            ],
        });
        const handlerCalls: string[] = [];
        svc.registerMentionHandler('bot', async (_, msg) => { handlerCalls.push(msg.authorId); });

        // Owner mentions → should work
        await svc.sendMessage({ channelId: ch.id, authorId: 'owner', content: '@bot help', mentions: ['bot'] });
        expect(handlerCalls).toHaveLength(1);

        // Non-owner mentions → blocked
        await svc.sendMessage({ channelId: ch.id, authorId: 'outsider', content: '@bot help', mentions: ['bot'] });
        expect(handlerCalls).toHaveLength(1); // still 1
    });

    it('enforces allowlist respondTo', async () => {
        const ch = await svc.createChannel({
            name: 'allowlisted',
            initialMembers: [
                { agentId: 'bot', displayName: 'Bot', respondTo: 'allowlist', respondToAllowlist: ['trusted'] },
            ],
        });
        const handlerCalls: string[] = [];
        svc.registerMentionHandler('bot', async (_, msg) => { handlerCalls.push(msg.authorId); });

        await svc.sendMessage({ channelId: ch.id, authorId: 'trusted', content: '@bot go', mentions: ['bot'] });
        expect(handlerCalls).toHaveLength(1);

        await svc.sendMessage({ channelId: ch.id, authorId: 'untrusted', content: '@bot go', mentions: ['bot'] });
        expect(handlerCalls).toHaveLength(1);
    });

    it('updates member permissions', async () => {
        const ch = await svc.createChannel({
            name: 'perms',
            initialMembers: [{ agentId: 'bot', displayName: 'Bot', respondTo: 'owner-only' }],
        });
        await svc.updateMemberPermissions(ch.id, 'bot', { respondTo: 'all', systemPrompt: 'New prompt' });
        const members = await svc.getMembers(ch.id);
        expect(members[0].respondTo).toBe('all');
        expect(members[0].systemPrompt).toBe('New prompt');
    });

    // ── Threading ──

    it('threads replies and counts', async () => {
        const ch = await svc.createChannel({ name: 'threaded' });
        const root = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'Root message' });
        await svc.sendMessage({ channelId: ch.id, authorId: 'a1', content: 'Reply 1', replyTo: root.id });
        await svc.sendMessage({ channelId: ch.id, authorId: 'a2', content: 'Reply 2', replyTo: root.id });

        const thread = await svc.getThread(root.id);
        expect(thread).toHaveLength(3); // root + 2 replies
        expect(await svc.getReplyCount(root.id)).toBe(2);
    });

    it('nests thread replies under root', async () => {
        const ch = await svc.createChannel({ name: 'nested' });
        const root = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'Root' });
        const reply1 = await svc.sendMessage({ channelId: ch.id, authorId: 'a1', content: 'Reply', replyTo: root.id });
        await svc.sendMessage({ channelId: ch.id, authorId: 'a2', content: 'Reply to reply', replyTo: reply1.id });

        const thread = await svc.getThread(root.id);
        expect(thread).toHaveLength(3);
    });

    // ── Reactions ──

    it('adds and removes reactions', async () => {
        const ch = await svc.createChannel({ name: 'react' });
        const msg = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'React test' });

        await svc.addReaction(msg.id, 'a1', '👍');
        await svc.addReaction(msg.id, 'a2', '👍');
        await svc.addReaction(msg.id, 'a1', '❤️');

        let updated = await svc.getMessage(msg.id);
        expect(updated?.reactions).toHaveLength(3);

        await svc.removeReaction(msg.id, 'a1', '👍');
        updated = await svc.getMessage(msg.id);
        expect(updated?.reactions).toHaveLength(2);
    });

    it('deduplicates same reaction', async () => {
        const ch = await svc.createChannel({ name: 'dedup' });
        const msg = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'test' });
        await svc.addReaction(msg.id, 'a1', '👍');
        await svc.addReaction(msg.id, 'a1', '👍');
        const updated = await svc.getMessage(msg.id);
        expect(updated?.reactions).toHaveLength(1);
    });

    // ── Edit / Delete ──

    it('edits a message', async () => {
        const ch = await svc.createChannel({ name: 'edit' });
        const msg = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'Original' });
        const edited = await svc.editMessage(msg.id, 'Corrected', 'h');
        expect(edited.editedContent).toBe('Corrected');
    });

    it('rejects edit by non-author', async () => {
        const ch = await svc.createChannel({ name: 'noedit' });
        const msg = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'No edit' });
        await expect(svc.editMessage(msg.id, 'Hacked', 'other')).rejects.toThrow();
    });

    it('soft-deletes a message', async () => {
        const ch = await svc.createChannel({ name: 'del' });
        const msg = await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'Delete me' });
        await svc.deleteMessage(msg.id, 'h');
        const msgs = await svc.getMessages(ch.id);
        expect(msgs.find((m) => m.id === msg.id)).toBeUndefined();
    });

    // ── Presence & typing ──

    it('tracks agent presence', async () => {
        const ch = await svc.createChannel({
            name: 'presence',
            initialMembers: [{ agentId: 'bot', displayName: 'Bot' }],
        });
        await svc.setPresence('bot', 'online');
        const presence = await svc.getPresence(ch.id);
        expect(presence).toHaveLength(1);
        expect(presence[0].status).toBe('online');
    });

    it('tracks typing indicators', async () => {
        const ch = await svc.createChannel({ name: 'typing' });
        await svc.setTyping(ch.id, 'a1');
        const typing = await svc.getTyping(ch.id);
        expect(typing).toHaveLength(1);
        expect(typing[0].agentId).toBe('a1');
    });

    // ── Search ──

    it('searches messages across channels', async () => {
        const ch1 = await svc.createChannel({ name: 'c1' });
        const ch2 = await svc.createChannel({ name: 'c2' });
        await svc.sendMessage({ channelId: ch1.id, authorId: 'h', content: 'Find the bug' });
        await svc.sendMessage({ channelId: ch2.id, authorId: 'h', content: 'Bug fixed!' });
        await svc.sendMessage({ channelId: ch1.id, authorId: 'h', content: 'All good' });

        const results = await svc.searchMessages('bug');
        expect(results).toHaveLength(2);
    });

    it('searches within a channel', async () => {
        const ch = await svc.createChannel({ name: 'searchable' });
        await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'Alpha release' });
        await svc.sendMessage({ channelId: ch.id, authorId: 'h', content: 'Beta release' });

        const results = await svc.searchMessages('alpha', ch.id);
        expect(results).toHaveLength(1);
    });

    // ── Canvas ──

    it('updates and reads canvas', async () => {
        const ch = await svc.createChannel({ name: 'canvas' });
        await svc.updateCanvas(ch.id, '# Architecture\n\n- Module A\n- Module B');
        const content = await svc.getCanvas(ch.id);
        expect(content).toContain('Architecture');
    });
});
