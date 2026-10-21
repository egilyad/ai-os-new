import { describe, it, expect, vi } from 'vitest';
import { AssistantExamService } from './assistant-exam-service';
import { AssistantActionRegistry } from './assistant-action-registry';
import { CapabilityTrustService } from '../capability-trust/capability-trust-service';
import type { AssistantAction } from '../../contracts/assistant';

function action(overrides: Partial<AssistantAction> = {}): AssistantAction {
    return {
        id: 'system.find',
        group: 'research',
        description: 'find',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => ({ ok: true, detail: 'found', evidence: 'panel memory' }),
        ...overrides,
    };
}

function makeExam(actions: AssistantAction[]) {
    const trust = new CapabilityTrustService();
    const registry = new AssistantActionRegistry();
    registry.setTrustService(trust);
    registry.registerAll(actions);
    return { exam: new AssistantExamService({ trust, actions: registry }), trust, registry };
}

describe('AssistantExamService', () => {
    it('examines a read-only capability by running it', async () => {
        const { exam, trust } = makeExam([action()]);

        const verdict = await exam.examine('system.find');

        expect(verdict.passed).toBe(true);
        expect(verdict.level).toBe('verified');
        expect(verdict.evidence).toContain('panel memory');
        expect(trust.get('action:system.find')?.trust).toBe('verified');
    });

    it('accepts the action:id form', async () => {
        const { exam } = makeExam([action()]);
        const verdict = await exam.examine('action:system.find');
        expect(verdict.passed).toBe(true);
    });

    it('does not run a write capability — it needs the human', async () => {
        const run = vi.fn(async () => ({ ok: true, detail: 'spawned' }));
        const { exam } = makeExam([action({ id: 'agents.spawn', action: 'tool:write', run })]);

        const verdict = await exam.examine('agents.spawn');

        expect(run).not.toHaveBeenCalled();
        expect(verdict.passed).toBe(false);
        expect(verdict.level).toBe('discovered');
        expect(verdict.nextStep).toContain('agents.spawn');
    });

    it('reports a failed probe as a failed exam', async () => {
        const run = vi.fn(async () => ({ ok: false, detail: 'no active topology' }));
        const { exam } = makeExam([action({ id: 'agents.list', run })]);

        const verdict = await exam.examine('agents.list');

        expect(verdict.passed).toBe(false);
        expect(verdict.reason).toContain('no active topology');
        expect(verdict.evidence.join(' ')).toContain('probe failed');
    });

    it('refuses to claim a capability that is only documented', async () => {
        const { exam, trust } = makeExam([action({ id: 'tools.list' })]);
        trust.declare('panel:ghost', 'panel', 'ghost');

        const verdict = await exam.examine('panel:ghost');

        expect(verdict.passed).toBe(false);
        expect(verdict.level).toBe('declared');
        expect(verdict.reason).toContain('documentation');
    });

    it('refuses a stale capability even when it was verified before', async () => {
        const { exam, trust } = makeExam([action({ id: 'agents.spawn', action: 'tool:write' })]);
        trust.verify('action:agents.spawn', 'action', 'agents.spawn', ['agentId: a1']);
        trust.markStale('action:agents.spawn', 'topology gone');

        const verdict = await exam.examine('agents.spawn');

        expect(verdict.passed).toBe(false);
        expect(verdict.reason).toContain('stale');
    });

    it('reports an unknown capability', async () => {
        const { exam } = makeExam([action()]);
        const verdict = await exam.examine('does:not:exist');
        expect(verdict.passed).toBe(false);
        expect(verdict.reason).toContain('Unknown capability');
    });

    it('exposes the rule for the prompt', () => {
        const { exam } = makeExam([action()]);
        expect(exam.rule()).toContain('system.exam');
    });
});
