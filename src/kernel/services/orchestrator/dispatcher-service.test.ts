import { describe, it, expect } from 'vitest';
import { DispatcherService } from './dispatcher-service';

const agents = [
    { id: 'a1', role: 'researcher', specializations: ['analysis', 'search'] },
    { id: 'a2', role: 'coder', specializations: ['implementation'] },
    { id: 'a3', role: 'verifier', specializations: ['testing'] },
];

describe('DispatcherService', () => {
    it('assigns nodes by role with a stable mapping', () => {
        const svc = new DispatcherService(agents);
        const result = svc.assign([
            { id: 'n1', assignee: { role: 'coder' } },
            { id: 'n2', assignee: { role: 'researcher' } },
        ]);
        expect(result[0]!.agent.id).toBe('a2');
        expect(result[1]!.agent.id).toBe('a1');
    });

    it('matches by expertise', () => {
        const svc = new DispatcherService(agents);
        const result = svc.assign([{ id: 'n1', assignee: { expertise: ['testing'] } }]);
        expect(result[0]!.agent.id).toBe('a3');
    });

    it('uses a generic executor when no agent matches', () => {
        const svc = new DispatcherService(agents);
        const result = svc.assign([{ id: 'n1', assignee: { role: 'unknown-role' } }]);
        expect(result[0]!.agent.id).toBe('generic-executor');
    });

    it('prefers unused agents for parallel nodes with the same role', () => {
        const svc = new DispatcherService([
            ...agents,
            { id: 'a4', role: 'coder', specializations: ['implementation'] },
        ]);
        const result = svc.assign([
            { id: 'n1', assignee: { role: 'coder' } },
            { id: 'n2', assignee: { role: 'coder' } },
        ]);
        expect(result[0]!.agent.id).not.toBe(result[1]!.agent.id);
    });
});
