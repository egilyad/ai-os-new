import { describe, expect, it } from 'vitest';
import { AgentPermissionService } from '../permissions/permission-service';
import { ToolPipeline } from './tool-pipeline';
import {
    createPermissionApprovalResolver,
    createPermissionMiddleware,
} from './permission-middleware';

function createPermissionService() {
    const kv = new Map<string, unknown>();
    return new AgentPermissionService({
        eventBus: { emit: () => {}, emitOnce: () => false },
        database: {
            getKv: async <T>(id: string) => (kv.get(id) as T) ?? null,
            setKv: async <T>(id: string, value: T) => {
                kv.set(id, value);
            },
        },
    });
}

describe('permission middleware', () => {
    it('allows a read for an agent in guarded mode', async () => {
        const permissions = createPermissionService();
        await permissions.init();
        const pipeline = new ToolPipeline([createPermissionMiddleware(permissions)]);
        const result = await pipeline.runPre({
            toolId: 't-read-file',
            input: null,
            agentId: 'agent-x',
        });
        expect(result.decision).toBe('allow');
    });

    it('denies a side effect in read-only mode', async () => {
        const permissions = createPermissionService();
        await permissions.init();
        await permissions.setMode('agent-x', 'read-only');
        const pipeline = new ToolPipeline([createPermissionMiddleware(permissions)]);
        const result = await pipeline.runPre({
            toolId: 't-code',
            input: null,
            agentId: 'agent-x',
        });
        expect(result.decision).toBe('deny');
        expect(result.blockedBy).toBe('permission');
    });

    it('asks for a side effect in guarded mode', async () => {
        const permissions = createPermissionService();
        await permissions.init();
        const pipeline = new ToolPipeline([createPermissionMiddleware(permissions)]);
        const result = await pipeline.runPre({
            toolId: 't-code',
            input: null,
            agentId: 'agent-x',
        });
        expect(result.decision).toBe('deny');
        expect(result.reason).toContain('no approval channel');
    });

    it('allows calls without an agent (system-level tools)', async () => {
        const permissions = createPermissionService();
        await permissions.init();
        await permissions.setMode('agent-x', 'read-only');
        const pipeline = new ToolPipeline([createPermissionMiddleware(permissions)]);
        const result = await pipeline.runPre({ toolId: 't-code', input: null });
        expect(result.decision).toBe('allow');
    });

    it('records a denial when the approval channel rejects', async () => {
        const permissions = createPermissionService();
        await permissions.init();
        const pipeline = new ToolPipeline(
            [createPermissionMiddleware(permissions)],
            createPermissionApprovalResolver(permissions, async () => 'deny'),
        );
        const result = await pipeline.runPre({
            toolId: 't-code',
            input: null,
            agentId: 'agent-x',
        });
        expect(result.decision).toBe('deny');
        expect(permissions.getState('agent-x').consecutiveDenials).toBe(1);
    });

    it('clears the denial counter when the approval channel allows', async () => {
        const permissions = createPermissionService();
        await permissions.init();
        await permissions.recordDenial('agent-x');
        const pipeline = new ToolPipeline(
            [createPermissionMiddleware(permissions)],
            createPermissionApprovalResolver(permissions, async () => 'allow'),
        );
        await pipeline.runPre({ toolId: 't-code', input: null, agentId: 'agent-x' });
        expect(permissions.getState('agent-x').consecutiveDenials).toBe(0);
    });
});
