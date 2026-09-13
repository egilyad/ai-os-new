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
    it('seeds cargo.check tool + Pi Toolkit skill (phase51)', async () => {
        await vi.waitFor(
            () => {
                expect(runner().listTools().map((t) => t.name)).toContain('cargo.check');
            },
            { timeout: 10000 },
        );
        await vi.waitFor(
            async () => {
                expect((await market().list()).map((s) => s.name)).toContain('Pi Toolkit');
            },
            { timeout: 10000 },
        );
    });

    it('seeds openai.codex tool + Codex Patch skill (phase52)', async () => {
        await vi.waitFor(
            () => {
                expect(runner().listTools().map((t) => t.name)).toContain('openai.codex');
            },
            { timeout: 10000 },
        );
        await vi.waitFor(
            async () => {
                expect((await market().list()).map((s) => s.name)).toContain('Codex Patch');
            },
            { timeout: 10000 },
        );
    });
});
