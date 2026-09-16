/**
 * ProjectDebateIntegration tests — decision → debate → verdict → task.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectDebateIntegration } from './project-debate-integration';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

describe('ProjectDebateIntegration', () => {
    let svc: ProjectDebateIntegration;

    beforeEach(() => {
        svc = new ProjectDebateIntegration();
    });

    it('starts a debate', () => {
        const d = svc.startDebate('p1', 'Use React or Vue?');
        expect(d.projectId).toBe('p1');
        expect(d.decision).toBe('Use React or Vue?');
        expect(d.status).toBe('debating');
        expect(d.trigger).toBe('manual');
    });

    it('gets a debate by id', () => {
        const d = svc.startDebate('p1', 'Test');
        expect(svc.getDebate(d.id)).toBe(d);
    });

    it('lists debates for a project', () => {
        svc.startDebate('p1', 'd1');
        svc.startDebate('p1', 'd2');
        svc.startDebate('p2', 'd3');
        expect(svc.getDebatesForProject('p1')).toHaveLength(2);
    });

    it('submits a verdict', () => {
        const d = svc.startDebate('p1', 'Question');
        svc.submitVerdict(d.id, {
            debateId: d.id,
            summary: 'Use React',
            recommendation: 'Use React for better ecosystem',
            confidence: 0.85,
            dissentingViews: ['Vue is easier'],
            consensusReached: true,
        });
        const result = svc.getDebate(d.id)!;
        expect(result.status).toBe('verdict');
        expect(result.verdictConfidence).toBe(0.85);
    });

    it('creates task from verdict', () => {
        const d = svc.startDebate('p1', 'Question');
        svc.submitVerdict(d.id, { debateId: d.id, summary: '', recommendation: 'Do X', confidence: 0.9, dissentingViews: [], consensusReached: true });
        svc.createTaskFromVerdict(d.id, 'task-123');
        expect(svc.getDebate(d.id)!.createdTaskId).toBe('task-123');
        expect(svc.getDebate(d.id)!.status).toBe('task-created');
    });

    it('fails a debate', () => {
        const d = svc.startDebate('p1', 'Question');
        svc.failDebate(d.id, 'Timeout');
        expect(svc.getDebate(d.id)!.status).toBe('failed');
    });
});
