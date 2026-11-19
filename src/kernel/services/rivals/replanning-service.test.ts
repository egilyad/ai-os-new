import { describe, it, expect, vi } from 'vitest';
import { ReplanningService } from './replanning-service';
import type { ILLMClientService } from '../../contracts/provider-adapter';

const steps = [
    { id: '0', description: 'read config', status: 'done' as const, result: 'ok' },
    { id: '1', description: 'run scan', status: 'failed' as const, result: 'ERROR: timeout' },
    { id: '2', description: 'write report', status: 'pending' as const },
];

const client = (content: string): ILLMClientService =>
    ({
        chat: vi.fn().mockResolvedValue({ content, error: undefined }),
    }) as unknown as ILLMClientService;

describe('ReplanningService fallback', () => {
    it('rewords failed steps and keeps pending ones', async () => {
        const svc = new ReplanningService();
        const res = await svc.replan({ goal: 'probe the app', steps });
        expect(res.changed).toBe(true);
        expect(res.revisedSteps.map((s) => s.description)).toEqual([
            '[revised] run scan',
            'write report',
        ]);
        expect(res.rationale).toContain('deterministic');
    });

    it('returns empty revised plan when nothing is open', async () => {
        const svc = new ReplanningService();
        const res = await svc.replan({
            goal: 'x',
            steps: [
                { id: '0', description: 'a', status: 'done' },
                { id: '1', description: 'b', status: 'done' },
            ],
        });
        expect(res.changed).toBe(false);
        expect(res.revisedSteps).toEqual([]);
    });

    it('respects maxSteps', async () => {
        const svc = new ReplanningService();
        const res = await svc.replan({ goal: 'x', steps, maxSteps: 1 });
        expect(res.revisedSteps).toHaveLength(1);
    });
});

describe('ReplanningService LLM path', () => {
    it('uses the LLM revision when provided', async () => {
        const llm = client(
            '[{"id":"0","description":"read config"},{"id":"1","description":"retry scan with longer timeout"}]',
        );
        const svc = new ReplanningService(llm);
        const res = await svc.replan({ goal: 'probe the app', steps });
        expect(res.revisedSteps.map((s) => s.description)).toEqual([
            'read config',
            'retry scan with longer timeout',
        ]);
        expect(res.rationale).toBe('LLM revision');
        expect(res.changed).toBe(true);
    });

    it('falls back when the LLM returns garbage', async () => {
        const llm = client('sorry, no plan');
        const svc = new ReplanningService(llm);
        const res = await svc.replan({ goal: 'x', steps });
        expect(res.rationale).toContain('deterministic');
        expect(res.revisedSteps.some((s) => s.description.startsWith('[revised]'))).toBe(true);
    });

    it('falls back when the LLM throws', async () => {
        const llm = { chat: vi.fn().mockRejectedValue(new Error('boom')) } as never;
        const svc = new ReplanningService(llm);
        const res = await svc.replan({ goal: 'x', steps });
        expect(res.rationale).toContain('deterministic');
    });
});
