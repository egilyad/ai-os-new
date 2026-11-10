import '../../tests/setup-runtime';
import { describe, it, expect, vi } from 'vitest';
import { runtime } from '../runtime';
import type { IToolRunnerService } from '../contracts/parity';
import type { ISkillMarketService } from '../contracts/ops';

function runner(): IToolRunnerService {
    return runtime.getService<IToolRunnerService>('toolRunnerService');
}

function market(): ISkillMarketService {
    return runtime.getService<ISkillMarketService>('skillMarketService');
}

describe('Phase51/52 warehouse seeds (Y+Z)', () => {
    it('seeds a healthy tool catalog and skill market (phase51)', async () => {
        await vi.waitFor(
            () => {
                const names = runner().listTools().map((t) => t.name);
                expect(names.length).toBeGreaterThan(0);
                expect(names).toContain('workspace.list');
            },
            { timeout: 10000 },
        );
        await vi.waitFor(
            async () => {
                expect((await market().list()).length).toBeGreaterThan(0);
            },
            { timeout: 10000 },
        );
    });

    it('keeps the runner tool catalog stable (phase52)', async () => {
        await vi.waitFor(
            () => {
                const names = runner().listTools().map((t) => t.name);
                expect(names.length).toBeGreaterThan(10);
            },
            { timeout: 10000 },
        );
    });
});
