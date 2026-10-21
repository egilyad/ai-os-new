import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AssistantNavigationService } from './assistant-navigation-service';

function makeEvents() {
    return { emit: vi.fn(), on: vi.fn(), off: vi.fn(), emitOnce: vi.fn() };
}

describe('AssistantNavigationService', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('resolves true when the interface confirms the navigation', async () => {
        const events = makeEvents();
        const nav = new AssistantNavigationService({ eventBus: events as never });

        const pending = nav.open('/memory', 'показать память');
        const [request] = nav.listPending();
        expect(request?.route).toBe('/memory');
        expect(request?.reason).toBe('показать память');

        expect(nav.confirm(request!.id)).toBe(true);
        await expect(pending).resolves.toBe(true);
        expect(events.emit).toHaveBeenCalledWith('assistant:navigation:resolved', {
            id: request!.id,
            route: '/memory',
            confirmed: true,
        });
    });

    it('resolves false on timeout — an unconfirmed navigation is a failure', async () => {
        const events = makeEvents();
        const nav = new AssistantNavigationService({ eventBus: events as never });

        const pending = nav.open('/memory', 'test', undefined, 1000);
        await vi.advanceTimersByTimeAsync(1001);
        await expect(pending).resolves.toBe(false);
        expect(nav.listPending()).toHaveLength(0);
    });

    it('ignores confirmations for unknown ids', () => {
        const nav = new AssistantNavigationService({ eventBus: makeEvents() as never });
        expect(nav.confirm('missing')).toBe(false);
    });

    it('fails all pending navigations on destroy', async () => {
        const nav = new AssistantNavigationService({ eventBus: makeEvents() as never });
        const pending = nav.open('/agents', 'test');
        nav.destroy();
        await expect(pending).resolves.toBe(false);
    });
});
