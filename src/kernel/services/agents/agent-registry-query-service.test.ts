import { describe, it, expect } from 'vitest';
import { AgentRegistryQueryService } from './agent-registry-query-service';

const agents = [
    {
        id: 'a1',
        name: 'Analyst',
        role: 'researcher',
        expertise: ['analysis', 'web'],
        enabled: true,
    },
    { id: 'a2', name: 'Coder', role: 'coder', expertise: ['code'], enabled: false },
];

describe('AgentRegistryQueryService', () => {
    it('queries by predicate', () => {
        const svc = new AgentRegistryQueryService();
        agents.forEach((a) => svc.register(a));
        expect(svc.query((a) => a.enabled).map((a) => a.id)).toEqual(['a1']);
        expect(svc.query((a) => a.expertise.includes('code')).map((a) => a.id)).toEqual(['a2']);
    });

    it('exports a json snapshot for a subset', () => {
        const svc = new AgentRegistryQueryService();
        agents.forEach((a) => svc.register(a));
        const snap = JSON.parse(svc.snapshot(['a2'])) as {
            version: number;
            agents: RegisteredAgentShape[];
        };
        expect(snap.version).toBe(1);
        expect(snap.agents).toHaveLength(1);
        expect(snap.agents[0]!.id).toBe('a2');
    });
});

type RegisteredAgentShape = { id: string };
