import { describe, it, expect } from 'vitest';
import { MissionLedgerService } from './mission-ledger-service';

describe('MissionLedgerService', () => {
    it('starts a mission and tracks facts', () => {
        const svc = new MissionLedgerService();
        const id = svc.start('Build X');
        svc.addFact(id, 'fact 1', 't1');
        const snap = svc.get(id);
        expect(snap?.facts).toHaveLength(1);
        expect(snap?.facts[0]!.sourceNodeId).toBe('t1');
    });

    it('advises replan after repeated stalls', () => {
        const svc = new MissionLedgerService();
        const id = svc.start('Goal');
        expect(svc.recordStep(id, 'unknown', false)).toBe(false);
        expect(svc.recordStep(id, 'unknown', false)).toBe(false);
        expect(svc.recordStep(id, 'unknown', false)).toBe(true);
        expect(svc.get(id)?.stalls).toBe(3);
    });

    it('resets stalls when a real task completes', () => {
        const svc = new MissionLedgerService();
        const id = svc.start('Goal');
        svc.setTasks(id, [{ id: 't1', description: 'one', status: 'pending', dependsOn: [] }]);
        svc.recordStep(id, 'unknown', false);
        svc.recordStep(id, 'unknown', false);
        expect(svc.recordStep(id, 't1', true)).toBe(false);
        expect(svc.get(id)?.stalls).toBe(0);
        expect(svc.get(id)?.tasks[0]!.status).toBe('done');
        expect(svc.get(id)?.progress).toBe(1);
    });

    it('finish removes the ledger', async () => {
        const svc = new MissionLedgerService();
        const id = svc.start('Goal');
        svc.finish(id);
        expect(svc.get(id)).toBeUndefined();
        await svc.destroy();
    });
});
