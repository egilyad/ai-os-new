/**
 * ProjectObservabilityService tests — activity, tool calls, errors, file changes.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectObservabilityService } from './project-observability-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function mockEventBus() {
    return {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        emitOnce: vi.fn(),
        once: vi.fn(),
        onSafe: vi.fn().mockReturnValue(vi.fn()),
        subscribeAll: vi.fn().mockReturnValue(vi.fn()),
        getSubscriptionStats: vi.fn(),
    } as any;
}

describe('ProjectObservabilityService', () => {
    let svc: ProjectObservabilityService;
    let bus: ReturnType<typeof mockEventBus>;

    beforeEach(() => {
        bus = mockEventBus();
        svc = new ProjectObservabilityService(bus);
    });

    describe('logActivity', () => {
        it('logs activity events', () => {
            svc.logActivity('p1', 'project.created', 'alice', { name: 'Test' });
            const events = svc.getActivity('p1');
            expect(events).toHaveLength(1);
            expect(events[0].type).toBe('project.created');
            expect(events[0].agentId).toBe('alice');
            expect(events[0].details.name).toBe('Test');
        });

        it('respects limit', () => {
            for (let i = 0; i < 10; i++) svc.logActivity('p1', 'task.created');
            expect(svc.getActivity('p1', 3)).toHaveLength(3);
        });
    });

    describe('logToolCall', () => {
        it('logs tool calls', () => {
            svc.logToolCall({
                projectId: 'p1',
                agentId: 'bob',
                toolName: 'read_file',
                input: { path: '/main.py' },
                output: { content: 'print("hi")' },
                durationMs: 15,
                success: true,
            });
            const calls = svc.getToolCalls('p1');
            expect(calls).toHaveLength(1);
            expect(calls[0].toolName).toBe('read_file');
            expect(calls[0].success).toBe(true);
        });
    });

    describe('logError', () => {
        it('logs errors and returns id', () => {
            const id = svc.logError('p1', 'runtime', 'Syntax error', 'error');
            expect(id).toBeTruthy();
            const errors = svc.getErrors('p1');
            expect(errors).toHaveLength(1);
            expect(errors[0].severity).toBe('error');
            expect(errors[0].resolved).toBe(false);
        });

        it('resolves errors', () => {
            const id = svc.logError('p1', 'sandbox', 'Timeout', 'warning');
            svc.resolveError('p1', id);
            const errors = svc.getErrors('p1');
            expect(errors[0].resolved).toBe(true);
        });

        it('filters by resolved status', () => {
            svc.logError('p1', 'agent', 'err1');
            const id2 = svc.logError('p1', 'agent', 'err2');
            svc.resolveError('p1', id2);
            expect(svc.getErrors('p1', false)).toHaveLength(1);
            expect(svc.getErrors('p1', true)).toHaveLength(1);
        });
    });

    describe('logFileChange', () => {
        it('logs file changes', () => {
            svc.logFileChange('p1', '/main.py', 'created', 1024, 'dev-agent');
            const changes = svc.getFileChanges('p1');
            expect(changes).toHaveLength(1);
            expect(changes[0].filePath).toBe('/main.py');
            expect(changes[0].changeType).toBe('created');
        });
    });

    describe('getObservability', () => {
        it('returns full observability summary', () => {
            svc.logActivity('p1', 'project.created');
            svc.logActivity('p1', 'task.started');
            svc.logToolCall({
                projectId: 'p1', agentId: 'a', toolName: 't',
                input: {}, output: {}, durationMs: 10, success: true,
            });
            svc.logError('p1', 'runtime', 'fail');
            svc.logError('p1', 'runtime', 'fail2');
            svc.logFileChange('p1', '/f.py', 'created', 100);
            const obs = svc.getObservability('p1');
            expect(obs.summary.totalActivity).toBe(2);
            expect(obs.summary.totalToolCalls).toBe(1);
            expect(obs.summary.totalErrors).toBe(2);
            expect(obs.summary.unresolvedErrors).toBe(2);
            expect(obs.summary.totalFileChanges).toBe(1);
            expect(obs.summary.lastActivityAt).toBeDefined();
        });
    });
});
