import { describe, it, expect } from 'vitest';
import { PersonaMixer } from './persona-mixer';

describe('PersonaMixer', () => {
    it('mix returns string', () => {
        const m = new PersonaMixer();
        const res = m.getMix({ agentId: 'a', agentName: 'Alice', basePersona: 'scientist philosopher', agentRole: 'pro', round: 1, otherParticipants: [], usedPersonaKeys: [] });
        expect(typeof res.personaText).toBe('string');
    });
    it('does not throw on empty', () => {
        const m = new PersonaMixer();
        expect(() => m.getMix({ agentId: 'a', agentName: 'Alice', basePersona: '', agentRole: 'pro', round: 1, otherParticipants: [], usedPersonaKeys: [] })).not.toThrow();
    });
    it('instantiable', () => {
        expect(new PersonaMixer()).toBeDefined();
    });
});
