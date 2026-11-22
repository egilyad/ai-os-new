import { describe, it, expect } from 'vitest';
import { MiddlewareService } from './middleware-service';

describe('MiddlewareService', () => {
    it('runs only middleware subscribed to the hook, in registration order', async () => {
        const svc = new MiddlewareService();
        const order: string[] = [];
        svc.use({
            id: 'one',
            hooks: ['beforeModel'],
            apply: () => {
                order.push('one');
            },
        });
        svc.use({
            id: 'two',
            hooks: ['beforeModel'],
            apply: () => {
                order.push('two');
            },
        });
        svc.use({
            id: 'other',
            hooks: ['afterReply'],
            apply: () => {
                order.push('other');
            },
        });
        await svc.emit('beforeModel', { payload: {}, state: {} });
        expect(order).toEqual(['one', 'two']);
    });

    it('shares mutable state between hooks and middleware', async () => {
        const svc = new MiddlewareService();
        svc.use({
            id: 'hint',
            hooks: ['beforeModel'],
            apply: (ctx) => {
                ctx.state['hint'] = 'be concise';
            },
        });
        const ctx = await svc.emit('beforeModel', { payload: {}, state: {} });
        expect(ctx.state['hint']).toBe('be concise');
    });

    it('isolates a failing middleware and records the error', async () => {
        const svc = new MiddlewareService();
        svc.use({
            id: 'bad',
            hooks: ['beforeCall'],
            apply: () => {
                throw new Error('boom');
            },
        });
        svc.use({
            id: 'good',
            hooks: ['beforeCall'],
            apply: (ctx) => {
                ctx.state['ok'] = true;
            },
        });
        const ctx = await svc.emit('beforeCall', { payload: {}, state: {} });
        expect(ctx.state['ok']).toBe(true);
        expect((ctx.state['middlewareErrors'] as string[])[0]).toContain('bad: boom');
    });

    it('replace, remove and clear keep registration stable', async () => {
        const svc = new MiddlewareService();
        const calls: string[] = [];
        svc.use({
            id: 'x',
            hooks: ['afterTool'],
            apply: () => {
                calls.push('old');
            },
        });
        svc.use({
            id: 'x',
            hooks: ['afterTool'],
            apply: () => {
                calls.push('new');
            },
        });
        await svc.emit('afterTool', { payload: {}, state: {} });
        expect(calls).toEqual(['new']);
        svc.remove('x');
        expect(svc.list()).toEqual([]);
        svc.use({ id: 'y', hooks: ['onError'], apply: () => {} });
        svc.clear();
        expect(svc.list()).toEqual([]);
    });
});
