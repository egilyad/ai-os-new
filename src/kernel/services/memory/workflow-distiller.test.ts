import { describe, it, expect, vi } from 'vitest';
import { WorkflowDistiller, MIN_WORKFLOW_STEPS } from './workflow-distiller';
import type { ISessionMemoryService, SessionMemoryRecord } from '../../contracts/session-memory';
import type { ILtMemoryService } from '../../contracts/persona';
import type { ISopService } from '../../contracts/rivals';
import type { ILLMClientService } from '../../contracts/provider-adapter';

function record(over: Partial<SessionMemoryRecord> = {}): SessionMemoryRecord {
    return {
        sessionId: 's1',
        objective: 'fix the parser',
        items: [
            { kind: 'decision', text: 'use streaming', at: 3 },
            { kind: 'command', text: 'npm test', at: 2 },
            { kind: 'command', text: 'npm run build', at: 1 },
            { kind: 'file', text: 'src/parser.ts', at: 1 },
        ],
        createdAt: 1,
        updatedAt: 3,
        ...over,
    };
}

function build(over: { rec?: SessionMemoryRecord | undefined; llm?: ILLMClientService } = {}) {
    const session = {
        get: vi.fn(() => ('rec' in over ? over.rec : record())),
    } as unknown as ISessionMemoryService;
    const lt = {
        remember: vi.fn(async () => ({ id: 'mem1' })),
    } as unknown as ILtMemoryService;
    const sop = {
        defineSop: vi.fn(async (name: string) => ({ id: 'sop1', name, phases: [] })),
    } as unknown as ISopService;
    const distiller = new WorkflowDistiller({
        sessionMemory: session,
        ltMemory: lt,
        sop,
        ...(over.llm ? { llm: over.llm } : {}),
    });
    return { distiller, lt, sop };
}

describe('WorkflowDistiller', () => {
    it('returns null without a session record', async () => {
        const { distiller } = build({ rec: undefined });
        expect(await distiller.distill('s1')).toBeNull();
    });

    it('returns null when there is not enough actionable activity', async () => {
        const rec = record({
            items: [{ kind: 'command', text: 'npm test', at: 1 }],
        });
        expect(await build({ rec }).distiller.distill('s1')).toBeNull();
    });

    it('builds heuristic steps chronologically and persists + registers an SOP', async () => {
        const { distiller, lt, sop } = build();
        const wf = await distiller.distill('s1');
        expect(wf).not.toBeNull();
        expect(wf!.source).toBe('heuristic');
        expect(wf!.name).toBe('Workflow: fix the parser');
        expect(wf!.steps).toEqual(['Run: npm run build', 'Run: npm test', 'Decide: use streaming']);
        expect(wf!.memoryId).toBe('mem1');
        expect(wf!.sopId).toBe('sop1');
        expect(lt.remember).toHaveBeenCalledWith(
            expect.objectContaining({ ownerId: 'agent', tier: 'core', tags: expect.arrayContaining(['workflow']) }),
        );
        expect(sop.defineSop).toHaveBeenCalledWith(
            'Workflow: fix the parser',
            expect.arrayContaining([expect.objectContaining({ role: 'Agent' })]),
        );
    });

    it('uses LLM steps when the model returns a valid numbered list', async () => {
        const llm = {
            chat: vi.fn(async () => ({
                content: '1. Install deps\n2. Run tests\n3. Ship it',
                latency: 1,
                tokens: 10,
            })),
        } as unknown as ILLMClientService;
        const wf = await build({ llm }).distiller.distill('s1');
        expect(wf!.source).toBe('llm');
        expect(wf!.steps).toEqual(['Install deps', 'Run tests', 'Ship it']);
    });

    it('falls back to heuristic when the LLM fails', async () => {
        const llm = {
            chat: vi.fn(async () => ({ error: 'boom', content: '', latency: 1, tokens: 0 })),
        } as unknown as ILLMClientService;
        const wf = await build({ llm }).distiller.distill('s1');
        expect(wf!.source).toBe('heuristic');
    });

    it('can skip persistence and SOP registration', async () => {
        const { distiller, lt, sop } = build();
        const wf = await distiller.distill('s1', { persist: false, registerSop: false });
        expect(wf!.memoryId).toBeUndefined();
        expect(wf!.sopId).toBeUndefined();
        expect(lt.remember).not.toHaveBeenCalled();
        expect(sop.defineSop).not.toHaveBeenCalled();
    });

    it('honours a custom name', async () => {
        const wf = await build().distiller.distill('s1', { name: 'Parser fix runbook' });
        expect(wf!.name).toBe('Parser fix runbook');
    });

    it('requires at least the minimum number of steps', () => {
        expect(MIN_WORKFLOW_STEPS).toBeGreaterThanOrEqual(2);
    });
});
