/**
 * ContextBuilderService tests — AGEMS port Phase 11.4.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ContextBuilderService } from './context-builder-service';

describe('ContextBuilderService', () => {
    let svc: ContextBuilderService;

    beforeEach(() => {
        svc = new ContextBuilderService();
    });

    it('records messages', () => {
        svc.recordMessage('ch-1', { sender: 'alice', content: 'Hello' });
        svc.recordMessage('ch-1', { sender: 'bob', content: 'World' });
        expect(svc.getChannelMessages('ch-1')).toHaveLength(2);
    });

    it('builds context from other channels', () => {
        svc.recordMessage('ch-1', { sender: 'a', content: 'msg1' });
        svc.recordMessage('ch-2', { sender: 'b', content: 'msg2' });
        svc.recordMessage('ch-3', { sender: 'c', content: 'msg3' });

        const windows = svc.buildContext('ch-1');
        expect(windows.length).toBe(2);
        expect(windows[0].channelId).toBe('ch-2');
        expect(windows[1].channelId).toBe('ch-3');
    });

    it('excludes the specified channel', () => {
        svc.recordMessage('ch-1', { sender: 'a', content: 'msg1' });
        const windows = svc.buildContext('ch-1');
        expect(windows.length).toBe(0);
    });

    it('formats context as string', () => {
        svc.recordMessage('ch-1', { sender: 'a', content: 'hello' });
        // Excluding ch-2, so ch-1 is included
        const windows = svc.buildContext('ch-2');
        const formatted = svc.formatContext(windows);
        expect(formatted).toContain('[Cross-channel context]');
        expect(formatted).toContain('a: hello');
    });

    it('formats non-empty context', () => {
        svc.recordMessage('ch-2', { sender: 'alice', content: 'Hi there' });
        const windows = svc.buildContext('ch-1');
        const formatted = svc.formatContext(windows);
        expect(formatted).toContain('[Cross-channel context]');
        expect(formatted).toContain('alice: Hi there');
    });

    it('clears a channel', () => {
        svc.recordMessage('ch-1', { sender: 'a', content: 'x' });
        svc.clearChannel('ch-1');
        expect(svc.getChannelMessages('ch-1')).toHaveLength(0);
    });

    it('clears all channels', () => {
        svc.recordMessage('ch-1', { sender: 'a', content: 'x' });
        svc.recordMessage('ch-2', { sender: 'b', content: 'y' });
        svc.clearAll();
        expect(svc.getChannelMessages('ch-1')).toHaveLength(0);
        expect(svc.getChannelMessages('ch-2')).toHaveLength(0);
    });

    it('returns empty for unknown channel', () => {
        expect(svc.getChannelMessages('unknown')).toHaveLength(0);
    });

    it('limits messages per channel', () => {
        for (let i = 0; i < 30; i++) {
            svc.recordMessage('ch-1', { sender: 'a', content: `msg${i}` });
        }
        expect(svc.getChannelMessages('ch-1')).toHaveLength(20);
    });
});
