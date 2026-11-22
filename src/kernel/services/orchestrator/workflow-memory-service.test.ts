import { describe, it, expect } from 'vitest';
import { WorkflowMemoryService } from './workflow-memory-service';

describe('WorkflowMemoryService', () => {
    it('recalls a plan for a similar goal and increments uses', () => {
        const svc = new WorkflowMemoryService();
        svc.remember('research a topic and write a structured report', [
            'gather sources',
            'extract facts',
            'write report',
        ]);
        const found = svc.recall('research a topic and write a structured report today');
        expect(found).not.toBeNull();
        expect(found!.steps).toHaveLength(3);
        expect(found!.uses).toBe(1);
    });

    it('does not recall for an unrelated goal', () => {
        const svc = new WorkflowMemoryService();
        svc.remember('research a topic and write a report', ['gather', 'write']);
        expect(svc.recall('deploy the docker container to production')).toBeNull();
    });

    it('returns null when no templates exist', () => {
        expect(new WorkflowMemoryService().recall('anything')).toBeNull();
    });
});
