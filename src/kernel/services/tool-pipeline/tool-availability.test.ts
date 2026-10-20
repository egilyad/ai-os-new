import { describe, expect, it, vi } from 'vitest';
import { ToolAvailabilityRegistry } from './tool-availability';

describe('ToolAvailabilityRegistry', () => {
    it('caches a probe result for the TTL', async () => {
        const registry = new ToolAvailabilityRegistry();
        const check = vi.fn(async () => true);
        registry.register('t-mcp', check);
        expect(await registry.isAvailable('t-mcp')).toBe(true);
        expect(await registry.isAvailable('t-mcp')).toBe(true);
        expect(check).toHaveBeenCalledTimes(1);
    });

    it('keeps the last good answer inside the grace window', async () => {
        const registry = new ToolAvailabilityRegistry();
        let failing = false;
        registry.register(
            't-mcp',
            async () => {
                if (failing) throw new Error('server down');
                return true;
            },
            { ttlMs: 0, graceMs: 60_000 },
        );
        expect(await registry.isAvailable('t-mcp')).toBe(true);
        failing = true;
        expect(await registry.isAvailable('t-mcp')).toBe(true);
    });

    it('marks a tool unavailable once the grace window expired', async () => {
        const registry = new ToolAvailabilityRegistry();
        registry.register(
            't-mcp',
            async () => {
                throw new Error('server down');
            },
            { ttlMs: 0, graceMs: 0 },
        );
        expect(await registry.isAvailable('t-mcp')).toBe(false);
    });

    it('treats unregistered tools as available', async () => {
        const registry = new ToolAvailabilityRegistry();
        expect(await registry.isAvailable('t-unknown')).toBe(true);
    });

    it('filters a list of tools by availability', async () => {
        const registry = new ToolAvailabilityRegistry();
        registry.register('t-mcp', async () => false, { ttlMs: 0, graceMs: 0 });
        const available = await registry.filterAvailable(['t-code', 't-mcp']);
        expect(available).toEqual(['t-code']);
    });

    it('unregisters a probe', async () => {
        const registry = new ToolAvailabilityRegistry();
        registry.register('t-mcp', async () => false);
        registry.unregister('t-mcp');
        expect(registry.list()).toEqual([]);
        expect(await registry.isAvailable('t-mcp')).toBe(true);
    });
});
