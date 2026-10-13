/**
 * ApprovalExecutionBridge tests (Phase 73) — inject approvedRequestId
 * для computer.use, остальные tools без изменений; auto-резолвы игнорятся.
 */
import { describe, it, expect, vi } from 'vitest';
import { ApprovalExecutionBridge } from './approval-execution-bridge-service';

function compReq(over: Record<string, unknown> = {}) {
    return {
        id: 5,
        agentId: 'a1',
        toolName: 'computer.use',
        toolInput: { task: 'click it' },
        category: 'computer',
        riskLevel: 'high',
        status: 'PENDING',
        createdAt: Date.now(),
        ...over,
    };
}

describe('ApprovalExecutionBridge (phase73)', () => {
    it('injects approvedRequestId for computer.use', async () => {
        const calls: Array<{ agentId: string; tool: string; args: Record<string, unknown> }> = [];
        const bridge = new ApprovalExecutionBridge({
            approval: { delegates: {} } as never,
            toolRunner: {
                callTool: vi.fn(async (agentId: string, tool: string, args: Record<string, unknown>) => {
                    calls.push({ agentId, tool, args });
                    return 'ok';
                }),
            } as never,
        });
        bridge.start();
        const approval = (bridge as unknown as { deps: { approval: { delegates: Record<string, unknown> } } }).deps
            .approval;
        const onResolved = approval.delegates.onResolved as (
            req: unknown,
            status: 'APPROVED' | 'REJECTED',
        ) => void;
        onResolved(compReq(), 'APPROVED');
        await new Promise((r) => setTimeout(r, 20));
        expect(calls).toHaveLength(1);
        expect(calls[0]).toMatchObject({
            agentId: 'a1',
            tool: 'computer.use',
            args: { task: 'click it', approvedRequestId: 5 },
        });
        bridge.destroy();
    });

    it('leaves other tools untouched; ignores REJECTED and auto-resolves', async () => {
        const calls: unknown[] = [];
        const bridge = new ApprovalExecutionBridge({
            approval: { delegates: {} } as never,
            toolRunner: {
                callTool: vi.fn(async (...a: unknown[]) => {
                    calls.push(a);
                    return 'ok';
                }),
            } as never,
        });
        bridge.start();
        const approval = (bridge as unknown as { deps: { approval: { delegates: Record<string, unknown> } } }).deps
            .approval;
        const onResolved = approval.delegates.onResolved as (
            req: unknown,
            status: 'APPROVED' | 'REJECTED',
        ) => void;
        onResolved({ ...compReq(), toolName: 'memory.append', toolInput: { text: 'hi' } }, 'APPROVED');
        onResolved(compReq({ id: 6 }), 'REJECTED');
        onResolved(compReq({ id: 7 }), 'APPROVED');
        // auto-резолв — игнор (conservative, как было).
        (approval.delegates as { onResolved: (req: unknown, s: string) => void }).onResolved(
            compReq({ id: 8, resolvedBy: 'auto:rule' }),
            'APPROVED',
        );
        await new Promise((r) => setTimeout(r, 20));
        // memory.append без инъекции + computer.use id 7 с инъекцией; 6 и 8 — тишина.
        expect(calls).toHaveLength(2);
        const [, , memArgs] = calls[0] as [unknown, unknown, Record<string, unknown>];
        expect(memArgs).toEqual({ text: 'hi' });
        const [, , compArgs] = calls[1] as [unknown, unknown, Record<string, unknown>];
        expect(compArgs).toMatchObject({ approvedRequestId: 7 });
        bridge.destroy();
    });
});
