import { describe, expect, it, vi } from 'vitest';
import { OrchestratorService } from './orchestrator-service';
import { MissionLedgerService } from './mission-ledger-service';
import { ExecutionReplayService } from './execution-replay-service';
import type { MissionExecutor, NodePolicy } from '../../contracts/orchestrator';
import type { ReplayStep } from '../../contracts/execution-replay';

const GOAL = 'Prepare a two-agent research brief';
const RUN_ID = 'run-two-agents-integration';

interface StoredStep extends ReplayStep {
    runId: string;
    agentId: string;
    status: 'done' | 'failed';
}

function harness(policies: Record<string, NodePolicy> = {}) {
    const events: Array<{ event: string; data: Record<string, unknown> }> = [];
    const eventBus = {
        emit: vi.fn((event: string, data?: unknown) => {
            events.push({ event, data: (data ?? {}) as Record<string, unknown> });
        }),
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
    } as never;
    const llm = {
        chat: vi.fn(async () => ({
            content: JSON.stringify([
                {
                    id: 'research',
                    description: 'Research the topic',
                    dependsOn: [],
                    role: 'researcher',
                },
                {
                    id: 'draft',
                    description: 'Draft the brief',
                    dependsOn: ['research'],
                    role: 'writer',
                },
            ]),
        })),
    };
    const ledger = new MissionLedgerService();
    return {
        svc: new OrchestratorService(eventBus, llm, undefined, ledger, policies),
        ledger,
        addFact: vi.spyOn(ledger, 'addFact'),
        recordStep: vi.spyOn(ledger, 'recordStep'),
        events,
        llm,
    };
}

function executorFor(options: {
    history: StoredStep[];
    calls: { count: number };
    attempts: Record<string, number>;
    sideEffects: Set<string>;
    failFirstFor?: string;
    failAlwaysFor?: string;
    onFirstCall?: () => void;
}): MissionExecutor {
    return async (node, ctx) => {
        options.calls.count++;
        options.attempts[node.id] = (options.attempts[node.id] ?? 0) + 1;
        options.onFirstCall?.();
        const agentId = node.assignee?.role === 'writer' ? 'agent-writer' : 'agent-researcher';
        options.sideEffects.add(`${RUN_ID}:${node.id}`);
        const output = { [node.id]: `${agentId}:${ctx.goal}` };
        const failed =
            options.failAlwaysFor === node.id ||
            (options.failFirstFor === node.id && options.attempts[node.id] === 1);
        options.history.push({
            runId: RUN_ID,
            nodeId: node.id,
            input: { ...ctx.dependencyOutputs },
            output,
            timestamp: Date.now(),
            agentId,
            status: failed ? 'failed' : 'done',
        });
        if (failed) throw new Error(`provider failed for ${node.id}`);
        return {
            nodeId: node.id,
            type: 'report',
            content: output[node.id]!,
            meta: {
                agentId,
                producer: agentId,
                ...(node.id === 'draft' ? { basedOn: ctx.dependencyOutputs['research'] } : {}),
            },
            createdAt: Date.now(),
        };
    };
}

function probe() {
    return {
        history: [] as StoredStep[],
        calls: { count: 0 },
        attempts: {} as Record<string, number>,
        sideEffects: new Set<string>(),
    };
}

describe('Сквозной запуск: задача → два агента → артефакт с историей по runId', () => {
    it('связывает шаги, решения и артефакт по одному runId; replay не ломает цепочку', async () => {
        const h = harness();
        const p = probe();
        const result = await h.svc.run(
            GOAL,
            executorFor({
                ...p,
                onFirstCall: () => expect(h.svc.getCancellation()).toBeNull(),
            }),
        );

        expect(result.status).toBe('completed');
        expect(result.failedNodeIds).toEqual([]);
        expect(result.artifacts).toHaveLength(2);
        expect(result.artifacts.map((a) => a.meta?.['agentId'])).toEqual([
            'agent-researcher',
            'agent-writer',
        ]);
        expect(result.artifacts[1]!.meta?.['basedOn']).toBe(result.artifacts[0]!.content);
        expect(p.calls.count).toBe(2);
        expect(p.history.every((s) => s.runId === RUN_ID)).toBe(true);
        expect(p.history.map((s) => s.nodeId)).toEqual(['research', 'draft']);
        expect(h.addFact).toHaveBeenCalledTimes(2);
        expect(h.recordStep).toHaveBeenCalledTimes(2);
        expect(h.events).toContainEqual({
            event: 'orchestrator:mission-finished',
            data: expect.objectContaining({ missionId: result.missionId, status: 'completed' }),
        });

        const report = new ExecutionReplayService().replay(p.history);
        expect(report.brokenLinks).toEqual([]);
        expect(report.steps).toHaveLength(2);
        expect(report.durationMs).toBeGreaterThanOrEqual(0);

        const restored = JSON.parse(JSON.stringify(p.history)) as StoredStep[];
        const afterReload = new ExecutionReplayService().replay(restored);
        expect(afterReload.brokenLinks).toEqual([]);
        expect(p.calls.count).toBe(2);
    });

    it('отмена с причиной останавливает новые вызовы провайдера', async () => {
        const h = harness();
        const p = probe();
        const result = await h.svc.run(
            GOAL,
            executorFor({ ...p, onFirstCall: () => h.svc.cancel('budget exhausted') }),
        );

        expect(p.calls.count).toBe(1);
        expect(result.status).toBe('failed');
        expect(result.outputs['research']).toBeDefined();
        expect(result.outputs['draft']).toBeUndefined();
        expect(h.svc.getCancellation()?.reason).toBe('budget exhausted');
        expect(p.history).toHaveLength(1);
        expect(h.events).toContainEqual({
            event: 'orchestrator:mission-finished',
            data: expect.objectContaining({ status: 'failed' }),
        });
    });

    it('повтор после сбоя не дублирует побочный эффект', async () => {
        const h = harness({ research: { maxAttempts: 2, retryDelayMs: 0 } });
        const p = probe();
        const result = await h.svc.run(GOAL, executorFor({ ...p, failFirstFor: 'research' }));

        expect(result.status).toBe('completed');
        expect(p.attempts['research']).toBe(2);
        expect(p.sideEffects.size).toBe(2);
        expect(p.history).toHaveLength(3);
        expect(
            p.history.filter((s) => s.nodeId === 'research' && s.status === 'done'),
        ).toHaveLength(1);
        expect(h.recordStep).toHaveBeenCalledTimes(2);
        expect(h.recordStep).not.toHaveBeenCalledWith(expect.any(String), 'research', false);
    });

    it('сбой провайдера фиксирует причину и не создаёт артефакт', async () => {
        const h = harness();
        const p = probe();
        const result = await h.svc.run(GOAL, executorFor({ ...p, failAlwaysFor: 'research' }));

        expect(result.status).toBe('failed');
        expect(result.failedNodeIds).toEqual(['research']);
        expect(result.outputs['research']).toBeUndefined();
        expect(result.outputs['draft']).toBeUndefined();
        expect(p.history[0]!.status).toBe('failed');
        expect(h.recordStep).toHaveBeenCalledWith(expect.any(String), 'research', false);
    });
});
